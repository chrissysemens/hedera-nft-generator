import { Mnemonic, AccountId } from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const mnemonic = await Mnemonic.fromString(process.env.HEDERA_MNEMONIC!);
  const privateKey = await mnemonic.toEcdsaPrivateKey();
  const publicKey = privateKey.publicKey;

  console.log("🌱 Derived public key:", publicKey.toString());

  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  console.log("🆔 Using account ID:", accountId.toString());
}

main();
