import { useState } from "react";
import styles from "./App.module.scss";
import { TextInput } from "./components/TextInput/TextInput";
import { DateInput } from "./components/DatePicker/DatePicker";
import { FilePicker } from "./components/FilePicker.tsx/FilePicker";

function App() {
  const [artist, setArtist] = useState("");
  const [track, setTrack] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [background, setBackground] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = artist && track && date && background;

  const generateBadge = async (
    artist: string,
    track: string,
    date: string,
    backgroundBase64: string
  ) => {
    console.log("📤 Sending generate request...");
    try {
      const response = await fetch("http://localhost:4000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artist,
          track,
          date,
          backgroundBase64,
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Unknown error");
      console.log("✅ Badge created:", result.file);
      return result;
    } catch (err: unknown) {
      console.error("❌ Failed to generate badge:", err);
      throw err;
    }
  };

  const handleMint = async () => {
    if (!background || !artist || !track || !date) return;
    console.log("🚀 Minting NFT...");

    try {
      const response = await fetch("http://localhost:4000/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artist,
          track,
          date,
          backgroundBase64: background,
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Unknown mint error");

      console.log("✅ NFT Minted!", result);
      alert(`NFT minted with Token ID: ${result.tokenId}`);
    } catch (err: unknown) {
      console.error("❌ Minting failed:", err);
      alert("Failed to mint NFT");
    }
  };

  const handleGenerateAndMint = async () => {
    if (!isFormValid || !background) return;

    setIsLoading(true);
    console.log("🧾 Starting generation + mint process...");
    try {
      const result = await generateBadge(artist, track, date, background);
      console.log("🪪 Badge ready, proceeding to mint...", result);
      await handleMint();
    } catch (error: unknown) {
      console.error("❌ Error in process:", error);
      alert("❌ Generation or minting failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.app}>
      <div className={styles.form}>
        <h1>Hedera NFT creator</h1>

        <div className={styles.form}>
          <TextInput
            name="artist"
            label="Artist"
            value={artist}
            placeholder="65daysofstatic"
            onChange={(artist: string) => setArtist(artist)}
          />
          <TextInput
            name="track"
            label="Track title"
            value={track}
            placeholder="Radio protector"
            onChange={(title: string) => setTrack(title)}
          />
          <DateInput
            name="date"
            label="Date"
            value={date}
            onChange={(date: string) => setDate(date)}
          />
          <FilePicker
            name="background"
            label="Background Image"
            onChange={(file) => {
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  console.log("🖼️ Image loaded:", file.name);
                  setBackground(reader.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>

        <button
          onClick={handleGenerateAndMint}
          disabled={!isFormValid || isLoading}
          className={styles.generateButton}
        >
          {isLoading ? "Processing..." : "Generate + Mint NFT"}
        </button>
      </div>

      <div className={styles.preview}>
        <h2>Preview</h2>
        {background ? (
          <div className={styles.previewCard}>
            <img
              src={background}
              alt="Background"
              className={styles.previewBackground}
            />
            <div className={styles.previewOverlay}>
              <p className={styles.previewTrack}>
                {artist} – {track}
              </p>
              <p className={styles.previewDate}>Collected on {date}</p>
              <img src="/logo.png" className={styles.previewLogo} alt="Logo" />
            </div>
          </div>
        ) : (
          <p>No background image selected.</p>
        )}
      </div>
    </div>
  );
}

export default App;
