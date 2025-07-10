
import React from 'react';
import styles from './PreviewCard.module.css';

type PreviewCardProps = {
  background: string | null;
  artist: string;
  track: string;
  date: string;
};

export const PreviewCard: React.FC<PreviewCardProps> = ({ background, artist, track, date }) => {
  if (!background) return null;

  return (
    <div className={styles.preview}>
      <h2>Preview</h2>
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
    </div>
  );
};
