import type { AgentSprite } from './types';
import { ARENA_SPRITE_SCALE } from './arenaConstants';

/**
 * Draw a large, detailed 3D-style agent sprite at 3x scale for arena view.
 * Enhanced with shading, lapels, breathing, pupils, and paws.
 */
export function drawLargeAgent(
  ctx: CanvasRenderingContext2D,
  agent: AgentSprite,
  time: number,
  opponentPosition?: { x: number; y: number }
) {
  const S = ARENA_SPRITE_SCALE;
  const { position, neonColor, furColor, furHighlight, suitColor, walkCycle, status, facing, species } = agent;
  const x = position.x;
  const isWalking = status === 'walking';
  const bodyBob = isWalking ? Math.sin(walkCycle * 8) * 3 : 0;
  const legBob = isWalking ? Math.sin(walkCycle * 8) * 5 : 0;

  // Breathing animation (idle)
  const breathScale = status === 'idle' || status === 'working'
    ? 1 + Math.sin(time * 2) * 0.015
    : 1;

  const y = position.y + bodyBob;

  const facingLeft = facing === 'left';
  const facingRight = facing === 'right';
  const facingSide = facingLeft || facingRight;
  const facingUp = facing === 'up';
  const sideDir = facingLeft ? -1 : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(breathScale, breathScale);
  ctx.translate(-x, -y);

  // Neon glow (larger)
  const glowIntensity = status === 'working' ? 0.35 + Math.sin(agent.glowPulse) * 0.15 : 0.12;
  const glowRadius = 50 * S / 2;
  const glow = ctx.createRadialGradient(x, y, 5, x, y, glowRadius);
  glow.addColorStop(0, neonColor + Math.round(glowIntensity * 255).toString(16).padStart(2, '0'));
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 18 * S / 2, 16 * S / 2, 6 * S / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#1e293b';
  const legW = 5 * S / 2;
  const legH = 12 * S / 2;
  if (facingSide) {
    ctx.fillRect(x - legW / 2 + sideDir * 3, y + 8 * S / 3 + legBob, legW, legH);
    ctx.fillRect(x - legW / 2 - sideDir * 3, y + 8 * S / 3 - legBob, legW, legH);
  } else {
    ctx.fillRect(x - 7 * S / 3, y + 8 * S / 3 + legBob, legW, legH);
    ctx.fillRect(x + 2 * S / 3, y + 8 * S / 3 - legBob, legW, legH);
  }

  // Shoes
  ctx.fillStyle = '#0f172a';
  if (facingSide) {
    ctx.beginPath();
    ctx.ellipse(x + sideDir * 3, y + 8 * S / 3 + legH + legBob, legW * 0.7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - sideDir * 3, y + 8 * S / 3 + legH - legBob, legW * 0.7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body / suit (3D shading)
  const bodyW = 12 * S / 2;
  const bodyH = 16 * S / 2;

  // Body outline
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, bodyW, bodyH, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Body fill with gradient
  const bodyGrad = ctx.createLinearGradient(x - bodyW, y - bodyH, x + bodyW, y + bodyH);
  bodyGrad.addColorStop(0, lightenColor(suitColor, 20));
  bodyGrad.addColorStop(0.4, suitColor);
  bodyGrad.addColorStop(1, darkenColor(suitColor, 30));
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(x, y, bodyW, bodyH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Suit lapels (V shape)
  if (!facingUp) {
    const lapelX = facingSide ? x + sideDir * 2 : x;
    ctx.strokeStyle = lightenColor(suitColor, 40);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lapelX - 4 * S / 3, y - 8 * S / 3);
    ctx.lineTo(lapelX, y - 2 * S / 3);
    ctx.lineTo(lapelX + 4 * S / 3, y - 8 * S / 3);
    ctx.stroke();

    // Buttons
    ctx.fillStyle = lightenColor(suitColor, 60);
    ctx.beginPath();
    ctx.arc(lapelX, y + 1 * S / 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lapelX, y + 5 * S / 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tie
  if (!facingUp) {
    const tieX = facingSide ? x + sideDir * 2 : x;
    ctx.fillStyle = neonColor;
    ctx.beginPath();
    ctx.moveTo(tieX, y - 7 * S / 3);
    ctx.lineTo(tieX - 3 * S / 3, y + 2 * S / 3);
    ctx.lineTo(tieX, y + 6 * S / 3);
    ctx.lineTo(tieX + 3 * S / 3, y + 2 * S / 3);
    ctx.closePath();
    ctx.fill();
  }

  // Paws / hands
  ctx.fillStyle = furColor;
  if (facingSide) {
    // One visible hand at side
    ctx.beginPath();
    ctx.arc(x + sideDir * bodyW * 0.7, y + bodyH * 0.3, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(x - bodyW * 0.8, y + bodyH * 0.3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + bodyW * 0.8, y + bodyH * 0.3, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  const headY = y - 20 * S / 2;
  const headR = (species === 'owl' ? 12 : species === 'bear' ? 11 : 10) * S / 2;

  // Head outline
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  ctx.stroke();

  // Head fill with gradient
  const headGrad = ctx.createRadialGradient(x - headR * 0.3, headY - headR * 0.3, 2, x, headY, headR);
  headGrad.addColorStop(0, furHighlight);
  headGrad.addColorStop(0.6, furColor);
  headGrad.addColorStop(1, darkenColor(furColor, 20));
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Fur texture strokes
  ctx.strokeStyle = furHighlight + '44';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI - Math.PI / 2;
    const fr = headR * 0.6;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * fr, headY + Math.sin(angle) * fr);
    ctx.lineTo(x + Math.cos(angle) * (fr + 4), headY + Math.sin(angle) * (fr + 4));
    ctx.stroke();
  }

  if (!facingUp) {
    // Ears
    drawLargeEars(ctx, x, headY, species, furColor, furHighlight, agent.earTwitchAmount, S);

    // Eyes with pupils tracking opponent
    const eyeY = headY - 1 * S / 3;
    drawLargeEyes(ctx, x, eyeY, species, facingSide, sideDir, S, opponentPosition, position);

    // Nose/muzzle
    drawLargeNose(ctx, x, headY, species, furColor, furHighlight, facingSide, sideDir, S);
  } else {
    drawLargeEars(ctx, x, headY, species, furColor, furHighlight, agent.earTwitchAmount, S);
  }

  // Checkmark
  if (agent.showCheckmark && agent.checkmarkTimer > 0) {
    ctx.globalAlpha = Math.min(1, agent.checkmarkTimer);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x + 15 * S / 3, headY - 12 * S / 3, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 11 * S / 3, headY - 12 * S / 3);
    ctx.lineTo(x + 14 * S / 3, headY - 9 * S / 3);
    ctx.lineTo(x + 19 * S / 3, headY - 16 * S / 3);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Thought bubble
  if (agent.thought && agent.thoughtOpacity > 0) {
    drawLargeThought(ctx, x, headY - 20 * S / 3, agent.thought, neonColor, agent.thoughtOpacity);
  }

  ctx.restore();
}

function drawLargeEars(
  ctx: CanvasRenderingContext2D,
  x: number, headY: number,
  species: string,
  furColor: string, furHighlight: string,
  twitch: number, S: number
) {
  const earH = species === 'rabbit' ? 18 * S / 2 : species === 'wolf' ? 15 * S / 2 : 12 * S / 2;
  const earW = 6 * S / 2;

  [-1, 1].forEach(side => {
    const ex = x + side * 8 * S / 2;
    const twitchOff = side === -1 ? -twitch : twitch;

    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.moveTo(ex + twitchOff, headY - earH);
    ctx.lineTo(ex - earW, headY - 2);
    ctx.lineTo(ex + earW, headY - 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = furHighlight;
    ctx.beginPath();
    ctx.moveTo(ex + twitchOff * 0.8, headY - earH + 4);
    ctx.lineTo(ex - earW + 3, headY - 3);
    ctx.lineTo(ex + earW - 3, headY - 3);
    ctx.closePath();
    ctx.fill();
  });
}

function drawLargeEyes(
  ctx: CanvasRenderingContext2D,
  x: number, eyeY: number,
  species: string,
  facingSide: boolean, sideDir: number,
  S: number,
  opponentPos?: { x: number; y: number },
  selfPos?: { x: number; y: number }
) {
  const eyeR = species === 'owl' ? 5 * S / 2 : 3 * S / 2;
  const pupilR = species === 'owl' ? 2.5 * S / 2 : 1.5 * S / 2;

  // Calculate pupil offset toward opponent
  let pupilOffX = 0;
  let pupilOffY = 0;
  if (opponentPos && selfPos) {
    const dx = opponentPos.x - selfPos.x;
    const dy = opponentPos.y - selfPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    pupilOffX = (dx / dist) * 1.5;
    pupilOffY = (dy / dist) * 1;
  }

  const positions = facingSide ? [sideDir * 3 * S / 3] : [-4 * S / 3, 4 * S / 3];

  positions.forEach(off => {
    // White
    ctx.fillStyle = species === 'owl' ? '#fef9c3' : '#f8fafc';
    ctx.beginPath();
    ctx.arc(x + off, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Iris
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(x + off + pupilOffX, eyeY + pupilOffY, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(x + off + pupilOffX - 1, eyeY + pupilOffY - 1, pupilR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawLargeNose(
  ctx: CanvasRenderingContext2D,
  x: number, headY: number,
  species: string,
  furColor: string, furHighlight: string,
  facingSide: boolean, sideDir: number,
  S: number
) {
  const noseX = facingSide ? x + sideDir * 4 * S / 3 : x;
  const noseY = headY + 4 * S / 3;

  switch (species) {
    case 'fox':
    case 'wolf': {
      ctx.fillStyle = furHighlight;
      ctx.beginPath();
      ctx.moveTo(noseX, noseY - 2);
      ctx.lineTo(noseX - 5 * S / 3, noseY + 6 * S / 3);
      ctx.lineTo(noseX + 5 * S / 3, noseY + 6 * S / 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(noseX, noseY + 4 * S / 3, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'owl': {
      ctx.fillStyle = '#D4A03C';
      ctx.beginPath();
      ctx.moveTo(noseX - 3 * S / 3, noseY);
      ctx.lineTo(noseX, noseY + 7 * S / 3);
      ctx.lineTo(noseX + 3 * S / 3, noseY);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'bear': {
      ctx.fillStyle = furHighlight;
      ctx.beginPath();
      ctx.ellipse(noseX, noseY + 2, 5 * S / 3, 4 * S / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(noseX, noseY + 1, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      // Cat
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(noseX, noseY);
      ctx.lineTo(noseX - 2.5 * S / 3, noseY + 3 * S / 3);
      ctx.lineTo(noseX + 2.5 * S / 3, noseY + 3 * S / 3);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}

function drawLargeThought(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  text: string, borderColor: string, opacity: number
) {
  ctx.globalAlpha = opacity;
  ctx.font = '12px monospace';
  const metrics = ctx.measureText(text);
  const textW = Math.min(metrics.width, 180);
  const padding = 10;
  const bubbleW = textW + padding * 2;
  const bubbleH = 28;
  const bx = x - bubbleW / 2;
  const by = y - bubbleH;

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x, y + 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 4, y - 2, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  const r = 8;
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.lineTo(bx + bubbleW - r, by);
  ctx.arcTo(bx + bubbleW, by, bx + bubbleW, by + r, r);
  ctx.lineTo(bx + bubbleW, by + bubbleH - r);
  ctx.arcTo(bx + bubbleW, by + bubbleH, bx + bubbleW - r, by + bubbleH, r);
  ctx.lineTo(bx + r, by + bubbleH);
  ctx.arcTo(bx, by + bubbleH, bx, by + bubbleH - r, r);
  ctx.lineTo(bx, by + r);
  ctx.arcTo(bx, by, bx + r, by, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let displayText = text;
  if (metrics.width > 180) {
    while (ctx.measureText(displayText + '…').width > 180 && displayText.length > 0) {
      displayText = displayText.slice(0, -1);
    }
    displayText += '…';
  }
  ctx.fillText(displayText, x, by + bubbleH / 2);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 1;
}

// Color helpers
function lightenColor(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r},${g},${b})`;
}
