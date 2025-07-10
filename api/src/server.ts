import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateBadge } from "./generateImage";
import fs from "fs-extra";
import path from "path";
import { Buffer } from "buffer";
import axios from "axios";
import FormData from "form-data";
import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenBurnTransaction,
  AccountId,
  PrivateKey,
} from "@hashgraph/sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/generate", async (req: Request, res: Response) => {
  try {
    const { artist, track, date, backgroundBase64 } = req.body;

    if (!artist || !track || !date || !backgroundBase64) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const { buffer, fileName } = await generateBadge({
      artist,
      track,
      date,
      backgroundBase64,
    });

    const outputDir = path.join(process.cwd(), "output");
    const outPath = path.join(outputDir, fileName);
    await fs.ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, buffer);

    res.status(200).json({ message: "Badge created", file: fileName });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate badge" });
  }
});

app.post("/mint", async (req: Request, res: Response) => {
  try {
    const { artist, track, date, backgroundBase64 } = req.body;

    if (!artist || !track || !date || !backgroundBase64) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    console.log(`Preparing image for NFT metadata: ${artist} - ${track}`);

    const base64Data = backgroundBase64.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");
    const mimeMatch = backgroundBase64.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
    const fileName = `${track.replace(/\s+/g, "_")}.png`;

    console.log("📦 Uploading image to Pinata...");
    const imageForm = new FormData();
    imageForm.append("file", buffer, {
      filename: fileName,
      contentType: mimeType,
    });

    const imageUploadRes = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      imageForm,
      {
        maxBodyLength: Infinity,
        headers: {
          ...imageForm.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY!,
          pinata_secret_api_key: process.env.PINATA_API_SECRET!,
        },
      }
    );

    const imageCid = imageUploadRes.data.IpfsHash;
    const imageURI = `ipfs://${imageCid}`;
    console.log(`🖼️ Image uploaded: ${imageURI}`);

    const metadata = {
      name: `${artist} - ${track}`,
      description: `A unique SongDrop badge for ${track} by ${artist} minted on ${date}.`,
      image: `https://ipfs.io/ipfs/${imageCid}`,
      type: mimeType,
      attributes: [
        { trait_type: "Artist", value: artist },
        { trait_type: "Track", value: track },
        { trait_type: "Date", value: date }
      ],
      properties: {
        creator: artist,
        license: "CC BY-NC-SA 4.0",
        external_url: "https://songdrop.xyz/"
      }
    };
    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));

    // Upload metadata to IPFS
    console.log("📄 Uploading metadata JSON...");
    const metadataForm = new FormData();
    metadataForm.append("file", metadataBuffer, {
      filename: `${track.replace(/\s+/g, "_")}_metadata.json`,
      contentType: "application/json; charset=utf-8",
    });

    const metadataUploadRes = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      metadataForm,
      {
        maxBodyLength: Infinity,
        headers: {
          ...metadataForm.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY!,
          pinata_secret_api_key: process.env.PINATA_API_SECRET!,
        },
      }
    );

    const metadataCid = metadataUploadRes.data.IpfsHash;
    const tokenURI = `ipfs://${metadataCid}`;
    console.log(`✅ Metadata uploaded: ${tokenURI}`);

    // Hedera minting
    const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!);
    const hClient = Client.forTestnet();
    hClient.setOperator(process.env.HEDERA_ACCOUNT_ID!, privateKey);

    const createTx = await new TokenCreateTransaction()
      .setTokenName(`${artist} - ${track}`)
      .setTokenSymbol("DROP")
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(process.env.HEDERA_ACCOUNT_ID!)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1)
      .setSupplyKey(privateKey)
      .setTokenMemo(`SongDrop badge for ${track}`)
      .freezeWith(hClient)
      .sign(privateKey);

    const createResponse = await createTx.execute(hClient);
    const receipt = await createResponse.getReceipt(hClient);
    const tokenId = receipt.tokenId!;

    // Log what is being stored as on-chain metadata for debugging
    console.log("Minting NFT with on-chain metadata:", tokenURI);

    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .addMetadata(Buffer.from(tokenURI))
      .freezeWith(hClient)
      .sign(privateKey);

    await mintTx.execute(hClient);

    console.log("✅ NFT Minted:", tokenId.toString());
    res.status(200).json({
      message: "NFT minted",
      tokenId: tokenId.toString(),
      tokenURI,
    });
  } catch (err) {
    console.error("❌ Error minting NFT:", err);
    res.status(500).json({ error: "Failed to mint NFT" });
  }
});

// Burn a single NFT by tokenId and serial number
app.post("/burn", (req: Request, res: Response) => {
  (async () => {
    try {
      const { tokenId, serialNumber } = req.body;
      if (!tokenId || !serialNumber) {
        res
          .status(400)
          .json({ error: "tokenId and serialNumber are required" });
        return;
      }
      const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!);
      const hClient = Client.forTestnet();
      hClient.setOperator(process.env.HEDERA_ACCOUNT_ID!, privateKey);

      const burnTx = await new TokenBurnTransaction()
        .setTokenId(tokenId)
        .setSerials([serialNumber])
        .freezeWith(hClient)
        .sign(privateKey);
      const burnRes = await burnTx.execute(hClient);
      const receipt = await burnRes.getReceipt(hClient);
      res.status(200).json({
        message: "NFT burned",
        tokenId,
        serialNumber,
        status: receipt.status.toString(),
      });
    } catch (err) {
      console.error("❌ Error burning NFT:", err);
      res.status(500).json({ error: "Failed to burn NFT" });
    }
  })();
});

// Burn all NFTs owned by the treasury account for a given tokenId
app.post("/burnAll", (req: Request, res: Response) => {
  (async () => {
    try {
      const { tokenId } = req.body;
      if (!tokenId) {
        res.status(400).json({ error: "tokenId is required" });
        return;
      }
      const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!);
      const hClient = Client.forTestnet();
      hClient.setOperator(process.env.HEDERA_ACCOUNT_ID!, privateKey);

      // Query mirror node for all serials owned by treasury
      const accountId = process.env.HEDERA_ACCOUNT_ID!;
      const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/nfts?token.id=${tokenId}`;
      const nftsRes = await axios.get(mirrorUrl);
      const nfts = nftsRes.data.nfts || [];
      if (nfts.length === 0) {
        return res
          .status(200)
          .json({ message: "No NFTs to burn for this tokenId" });
      }
      const serials = nfts.map((nft: any) => Number(nft.serial_number));
      // Burn in batches of 10 (Hedera limit)
      const batchSize = 10;
      let burned = [];
      for (let i = 0; i < serials.length; i += batchSize) {
        const batch = serials.slice(i, i + batchSize);
        const burnTx = await new TokenBurnTransaction()
          .setTokenId(tokenId)
          .setSerials(batch)
          .freezeWith(hClient)
          .sign(privateKey);
        const burnRes = await burnTx.execute(hClient);
        const receipt = await burnRes.getReceipt(hClient);
        burned.push({ batch, status: receipt.status.toString() });
      }
      res.status(200).json({ message: "All NFTs burned", burned });
    } catch (err) {
      console.error("❌ Error burning all NFTs:", err);
      res.status(500).json({ error: "Failed to burn all NFTs" });
    }
  })();
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
