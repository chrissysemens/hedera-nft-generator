import { createCanvas, loadImage } from 'canvas';
import path from 'path';

export type GenerateBadgeInput = {
  artist: string;
  track: string;
  date: string;
  backgroundBase64: string;
};

export async function generateBadge({
  artist,
  track,
  date,
  backgroundBase64,
}: GenerateBadgeInput) {
  const width = 1000;
  const height = 1000;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const bgImg = await loadImage(backgroundBase64);
  ctx.drawImage(bgImg, 0, 0, width, height);

  const gradientHeight = 200;
  const gradient = ctx.createLinearGradient(0, height - gradientHeight, 0, height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.7)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(`${artist} – ${track}`, 40, height - 80);

  ctx.font = '28px sans-serif';
  ctx.fillText(`Collected on ${date}`, 40, height - 40);

  const logoPath = path.resolve(process.cwd(), 'assets/logo.png');
  try {
    const logo = await loadImage(logoPath);
    const logoSize = 100;
    ctx.drawImage(logo, width - logoSize - 20, height - logoSize - 20, logoSize, logoSize);
  } catch (e) {
    console.warn('⚠️ Logo not found at assets/logo.png — skipping overlay.');
  }

  const buffer = canvas.toBuffer('image/png');
  const fileName = `badge-${Date.now()}.png`;

  return { buffer, fileName };
}
