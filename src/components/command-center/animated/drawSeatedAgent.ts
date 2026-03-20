import { AgentVisual } from './types';

export function drawSeatedAgent(
  ctx: CanvasRenderingContext2D,
  agent: AgentVisual,
  x: number,
  y: number,
  time: number,
  facing: 'left' | 'right' | 'forward',
  isSpeaking: boolean,
  scale: number = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (facing === 'left') ctx.scale(-1, 1);

  const breathe = Math.sin(time * 2) * 1;
  const lean = isSpeaking ? Math.sin(time * 3) * 2 - 3 : 0;
  const blink = Math.sin(time * 0.7) > 0.95;
  const nod = !isSpeaking && Math.sin(time * 1.3) > 0.9 ? 2 : 0;

  // Neon glow
  if (isSpeaking) {
    const glow = ctx.createRadialGradient(0, -15, 0, 0, -15, 40);
    glow.addColorStop(0, agent.neonColor + '30');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(-40, -55, 80, 60);
  }

  // Body (seated — no legs visible)
  ctx.fillStyle = agent.suitColor;
  ctx.fillRect(-10, -10 + lean + breathe * 0.3, 20, 16);

  // Suit lapels
  ctx.strokeStyle = agent.neonColor + '50';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -10 + lean + breathe * 0.3);
  ctx.lineTo(-4, 0 + lean + breathe * 0.3);
  ctx.moveTo(0, -10 + lean + breathe * 0.3);
  ctx.lineTo(4, 0 + lean + breathe * 0.3);
  ctx.stroke();

  // Arms
  ctx.fillStyle = agent.suitColor;
  // Left arm (on table)
  ctx.save();
  ctx.translate(-10, -4 + lean + breathe * 0.3);
  ctx.rotate(isSpeaking ? -0.4 + Math.sin(time * 4) * 0.2 : -0.2);
  ctx.fillRect(-4, 0, 4, 12);
  ctx.fillStyle = agent.furColor;
  ctx.fillRect(-4, 10, 4, 4);
  ctx.restore();

  // Right arm
  ctx.save();
  ctx.fillStyle = agent.suitColor;
  ctx.translate(10, -4 + lean + breathe * 0.3);
  ctx.rotate(isSpeaking ? 0.4 - Math.sin(time * 4) * 0.2 : 0.2);
  ctx.fillRect(0, 0, 4, 12);
  ctx.fillStyle = agent.furColor;
  ctx.fillRect(0, 10, 4, 4);
  ctx.restore();

  // Head
  const headY = -20 + lean + breathe * 0.3 + nod;
  ctx.fillStyle = agent.furColor;

  if (agent.species === 'cat') {
    ctx.beginPath();
    ctx.arc(0, headY, 10, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.beginPath();
    ctx.moveTo(-8, headY - 8); ctx.lineTo(-5, headY - 16); ctx.lineTo(-2, headY - 8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, headY - 8); ctx.lineTo(5, headY - 16); ctx.lineTo(2, headY - 8);
    ctx.fill();
    ctx.fillStyle = agent.furHighlight;
    ctx.beginPath();
    ctx.moveTo(-7, headY - 9); ctx.lineTo(-5, headY - 14); ctx.lineTo(-3, headY - 9);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, headY - 9); ctx.lineTo(5, headY - 14); ctx.lineTo(3, headY - 9);
    ctx.fill();
  } else if (agent.species === 'fox') {
    ctx.beginPath();
    ctx.arc(0, headY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-9, headY - 6); ctx.lineTo(-7, headY - 18); ctx.lineTo(-1, headY - 8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, headY - 6); ctx.lineTo(7, headY - 18); ctx.lineTo(1, headY - 8);
    ctx.fill();
    ctx.fillStyle = agent.furHighlight;
    ctx.beginPath();
    ctx.ellipse(0, headY + 3, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (agent.species === 'owl') {
    ctx.beginPath();
    ctx.arc(0, headY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-7, headY - 9); ctx.lineTo(-9, headY - 16); ctx.lineTo(-3, headY - 10);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, headY - 9); ctx.lineTo(9, headY - 16); ctx.lineTo(3, headY - 10);
    ctx.fill();
    ctx.fillStyle = agent.furHighlight;
    ctx.beginPath();
    ctx.ellipse(0, headY, 8, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(-10, headY - 10, 20, 20);
    ctx.fillStyle = agent.neonColor;
    ctx.fillRect(-1, headY - 14, 2, 6);
    ctx.beginPath();
    ctx.arc(0, headY - 15, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-4, headY - 1, blink ? 0.5 : 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4, headY - 1, blink ? 0.5 : 3, 0, Math.PI * 2);
  ctx.fill();
  if (!blink) {
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-3.5, headY - 0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4.5, headY - 0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Name label
  ctx.fillStyle = agent.neonColor;
  ctx.font = `bold 10px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  if (facing === 'left') ctx.scale(-1, 1);
  ctx.fillText(`${agent.emoji} ${agent.name}`, 0, 20);

  ctx.restore();
}
