import { CatDefinition } from "../model/cats";

export type CatDirection = 'down' | 'up' | 'left' | 'right';

export function drawCatOnCanvas(
  ctx: CanvasRenderingContext2D,
  cat: CatDefinition,
  dir: CatDirection,
  frame: number,
) {
  const w = 32;
  const h = 32;

  ctx.clearRect(0, 0, w, h);

  const bobY = frame === 1 ? -1 : frame === 2 ? 1 : 0;

  ctx.fillStyle = cat.dark;
  ctx.beginPath();
  ctx.ellipse(16, 20 + bobY, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = cat.body;
  ctx.beginPath();
  ctx.ellipse(16, 18 + bobY, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const tailDir = dir === 'left' ? -1 : 1;

  ctx.strokeStyle = cat.body;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(16 - tailDir * 6, 24 + bobY);
  ctx.quadraticCurveTo(
    16 - tailDir * 14,
    22 + bobY + (frame === 1 ? -3 : frame === 2 ? 3 : 0),
    16 - tailDir * 12,
    14 + bobY,
  );
  ctx.stroke();

  const headY = 10 + bobY;

  ctx.fillStyle = cat.body;
  ctx.beginPath();
  ctx.arc(16, headY, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = cat.ear;

  ctx.beginPath();
  ctx.moveTo(9, headY - 4);
  ctx.lineTo(5, headY - 13);
  ctx.lineTo(13, headY - 6);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(23, headY - 4);
  ctx.lineTo(27, headY - 13);
  ctx.lineTo(19, headY - 6);
  ctx.fill();

  const innerEar = cat.body === '#2a2a36' ? '#3a2a3a' : '#e8a0a0';

  ctx.fillStyle = innerEar;

  ctx.beginPath();
  ctx.moveTo(9, headY - 4);
  ctx.lineTo(7, headY - 10);
  ctx.lineTo(12, headY - 5);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(23, headY - 4);
  ctx.lineTo(25, headY - 10);
  ctx.lineTo(20, headY - 5);
  ctx.fill();

  if (dir !== 'up') {
    const ex = dir === 'left' ? -1.5 : dir === 'right' ? 1.5 : 0;

    ctx.fillStyle = cat.eye;
    ctx.beginPath();
    ctx.arc(12 + ex, headY - 1, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(20 + ex, headY - 1, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cat.pupil;
    ctx.beginPath();
    ctx.arc(12 + ex + 0.5, headY - 1, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(20 + ex + 0.5, headY - 1, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(11.5 + ex, headY - 2, 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(19.5 + ex, headY - 2, 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = cat.dark;
    ctx.beginPath();
    ctx.ellipse(16 + ex * 0.5, headY + 4, 1.5, 1, 0, 0, Math.PI);
    ctx.fill();
  }

  if (dir === 'up') {
    ctx.fillStyle = cat.dark;

    const stripeY = headY - 3;

    for (let i = 0; i < 3; i++) {
      ctx.fillRect(14, stripeY + i * 3, 4, 1.5);
    }
  }
}