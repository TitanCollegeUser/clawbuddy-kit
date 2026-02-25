import type { AgentSprite, TrailDot } from './types';

export function drawAgents(
  ctx: CanvasRenderingContext2D,
  agents: AgentSprite[],
  trailDots: TrailDot[],
  time: number
) {
  // Trail dots (behind director)
  trailDots.forEach(dot => {
    ctx.globalAlpha = dot.opacity;
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const sorted = [...agents].sort((a, b) => a.position.y - b.position.y);
  sorted.forEach(agent => drawAgent(ctx, agent, time));
}

function drawAgent(
  ctx: CanvasRenderingContext2D,
  agent: AgentSprite,
  time: number
) {
  const { position, neonColor, furColor, furHighlight, suitColor, walkCycle, status, facing, species } = agent;
  const x = position.x;
  const isWalking = status === 'walking' || status === 'coffee' || status === 'water' || status === 'meeting';
  const bodyBob = isWalking ? Math.sin(walkCycle * 8) * 2 : 0;
  const legBob = isWalking ? Math.sin(walkCycle * 8) * 3 : 0;
  const y = position.y + bodyBob;

  const facingLeft = facing === 'left';
  const facingRight = facing === 'right';
  const facingSide = facingLeft || facingRight;
  const facingDown = facing === 'down';
  const facingUp = facing === 'up';
  const sideDir = facingLeft ? -1 : 1;

  // Neon glow
  const glowIntensity = status === 'working' ? 0.3 + Math.sin(agent.glowPulse) * 0.15 : 0.1;
  const glowRadius = status === 'working' ? 35 : 25;
  const glow = ctx.createRadialGradient(x, y, 5, x, y, glowRadius);
  glow.addColorStop(0, neonColor + Math.round(glowIntensity * 255).toString(16).padStart(2, '0'));
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(x, y + 18, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#1e293b';
  if (facingSide) {
    ctx.fillRect(x - 3 + sideDir * 2, y + 8 + legBob, 4, 10);
    ctx.fillRect(x - 3 - sideDir * 2, y + 8 - legBob, 4, 10);
  } else {
    ctx.fillRect(x - 5, y + 8 + legBob, 4, 10);
    ctx.fillRect(x + 1, y + 8 - legBob, 4, 10);
  }

  // Body / suit
  ctx.fillStyle = suitColor;
  ctx.beginPath();
  ctx.ellipse(x, y, 10, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tie — only when face is visible
  if (!facingUp) {
    const tieX = facingSide ? x + sideDir * 2 : x;
    ctx.fillStyle = neonColor;
    ctx.beginPath();
    ctx.moveTo(tieX, y - 6);
    ctx.lineTo(tieX - 2.5, y + 2);
    ctx.lineTo(tieX, y + 5);
    ctx.lineTo(tieX + 2.5, y + 2);
    ctx.closePath();
    ctx.fill();
  }

  // Head
  const headY = y - 16;
  const headR = species === 'owl' ? 10 : species === 'bear' ? 9.5 : agent.isDirector ? 9 : 8;

  ctx.fillStyle = furColor;
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Fur highlight
  const hlOffX = facingSide ? sideDir * -1 : -2;
  ctx.fillStyle = furHighlight;
  ctx.beginPath();
  ctx.arc(x + hlOffX, headY - 3, headR * 0.55, 0, Math.PI * 2);
  ctx.fill();

  if (facingUp) {
    // Back of head — draw ears only, no face
    drawSpeciesEars(ctx, x, headY, species, furColor, furHighlight, agent.earTwitchAmount, agent.isDirector);
    // Draw tail for cats when facing up
    if (species === 'cat' || (!agent.isDirector && !['fox','wolf','owl','bear'].includes(species))) {
      drawCatTail(ctx, x, y, furColor, time, agent.walkCycle, 1);
    }
  } else {
    // Ears
    drawSpeciesEars(ctx, x, headY, species, furColor, furHighlight, agent.earTwitchAmount, agent.isDirector);

    // Eyes
    const eyeY = headY - 1;
    const eyeOffX = facingSide ? sideDir * 2 : 0;

    if (species === 'owl') {
      // Owl: big round eyes
      drawOwlEyes(ctx, x + eyeOffX, eyeY);
    } else {
      // Standard eyes
      ctx.fillStyle = '#1e293b';
      if (facingSide) {
        // Profile: one eye visible
        ctx.beginPath();
        ctx.arc(x + sideDir * 2, eyeY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x - 3, eyeY, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 3, eyeY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Species-specific nose/muzzle
    drawSpeciesNose(ctx, x, headY, species, furColor, furHighlight, agent.isDirector, facingSide, sideDir);

    // Cat tail
    if (species === 'cat' || (!agent.isDirector && !['fox','wolf','owl','bear'].includes(species))) {
      const tailDir = facingLeft ? -1 : 1;
      drawCatTail(ctx, x, y, furColor, time, agent.walkCycle, tailDir);
    }
  }

  // Checkmark on completion
  if (agent.showCheckmark && agent.checkmarkTimer > 0) {
    ctx.globalAlpha = Math.min(1, agent.checkmarkTimer);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x + 12, headY - 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 9, headY - 10);
    ctx.lineTo(x + 11.5, headY - 7.5);
    ctx.lineTo(x + 15.5, headY - 13);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Thought bubble
  if (agent.thought && agent.thoughtOpacity > 0) {
    drawThoughtBubble(ctx, x, headY - 25, agent.thought, neonColor, agent.thoughtOpacity);
  }
}

// ─── Species Ears ──────────────────────────────────────────

function drawSpeciesEars(
  ctx: CanvasRenderingContext2D,
  x: number, headY: number,
  species: string,
  furColor: string, furHighlight: string,
  twitch: number, isDirector: boolean
) {
  switch (species) {
    case 'fox':
      drawTriangleEar(ctx, x - 7, headY - 8, 5, 10, furColor, furHighlight, twitch, true);
      drawTriangleEar(ctx, x + 7, headY - 8, 5, 10, furColor, furHighlight, twitch, false);
      break;
    case 'wolf':
      // Taller, wider ears
      drawTriangleEar(ctx, x - 8, headY - 9, 6, 12, furColor, furHighlight, twitch, true);
      drawTriangleEar(ctx, x + 8, headY - 9, 6, 12, furColor, furHighlight, twitch, false);
      break;
    case 'owl':
      // Small horn tufts
      drawOwlTufts(ctx, x, headY, furColor);
      break;
    case 'bear':
      // Round semicircle ears
      drawBearEars(ctx, x, headY, furColor, furHighlight);
      break;
    case 'rabbit':
      // Long floppy ears
      drawTriangleEar(ctx, x - 5, headY - 10, 4, 14, furColor, furHighlight, twitch, true);
      drawTriangleEar(ctx, x + 5, headY - 10, 4, 14, furColor, furHighlight, twitch, false);
      break;
    default:
      // Cat ears (default for sub-agents)
      drawTriangleEar(ctx, x - 6, headY - 7, 4, 8, furColor, furHighlight, twitch, true);
      drawTriangleEar(ctx, x + 6, headY - 7, 4, 8, furColor, furHighlight, twitch, false);
      break;
  }
}

// ─── Species Nose/Muzzle ───────────────────────────────────

function drawSpeciesNose(
  ctx: CanvasRenderingContext2D,
  x: number, headY: number,
  species: string,
  furColor: string, furHighlight: string,
  isDirector: boolean,
  facingSide: boolean, sideDir: number
) {
  const noseX = facingSide ? x + sideDir * 3 : x;

  switch (species) {
    case 'fox': {
      // Pointed fox muzzle
      ctx.fillStyle = furHighlight;
      ctx.beginPath();
      ctx.moveTo(noseX, headY + 2);
      ctx.lineTo(noseX - 3, headY + 5);
      ctx.lineTo(noseX + 3, headY + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(noseX, headY + 4, 1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'wolf': {
      // Elongated wolf muzzle
      ctx.fillStyle = furHighlight;
      ctx.beginPath();
      ctx.moveTo(noseX, headY + 1);
      ctx.lineTo(noseX - 4, headY + 6);
      ctx.lineTo(noseX + 4, headY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(noseX, headY + 5, 1.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'owl': {
      // Small beak
      ctx.fillStyle = '#D4A03C';
      ctx.beginPath();
      ctx.moveTo(noseX - 2, headY + 2);
      ctx.lineTo(noseX, headY + 6);
      ctx.lineTo(noseX + 2, headY + 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'bear': {
      // Round bear nose
      ctx.fillStyle = furHighlight;
      ctx.beginPath();
      ctx.ellipse(noseX, headY + 3, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(noseX, headY + 2.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      // Cat pink nose
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(noseX, headY + 2);
      ctx.lineTo(noseX - 1.5, headY + 3.5);
      ctx.lineTo(noseX + 1.5, headY + 3.5);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}

// ─── Owl-specific features ────────────────────────────────

function drawOwlEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // Large round owl eyes with pupils
  [-4, 4].forEach(off => {
    // White eye circle
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(cx + off, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    // Dark iris
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx + off, cy, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Bright pupil dot
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(cx + off - 0.5, cy - 0.5, 0.6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawOwlTufts(ctx: CanvasRenderingContext2D, x: number, headY: number, furColor: string) {
  // Small horn/feather tufts
  ctx.fillStyle = furColor;
  [-7, 7].forEach(off => {
    ctx.beginPath();
    ctx.moveTo(x + off, headY - 10);
    ctx.lineTo(x + off - 2, headY - 5);
    ctx.lineTo(x + off + 2, headY - 5);
    ctx.closePath();
    ctx.fill();
  });
}

// ─── Bear ears ─────────────────────────────────────────────

function drawBearEars(ctx: CanvasRenderingContext2D, x: number, headY: number, furColor: string, furHighlight: string) {
  [-7, 7].forEach(off => {
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.arc(x + off, headY - 7, 4, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = furHighlight;
    ctx.beginPath();
    ctx.arc(x + off, headY - 7, 2.5, Math.PI, 0);
    ctx.fill();
  });
}

// ─── Cat tail ──────────────────────────────────────────────

function drawCatTail(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  furColor: string,
  time: number, walkCycle: number,
  dir: number
) {
  const tailWag = Math.sin(time * 3 + walkCycle) * 8;
  ctx.strokeStyle = furColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 8 * dir, y + 5);
  ctx.quadraticCurveTo(x + (18 + tailWag) * dir, y - 5, x + (15 + tailWag * 0.5) * dir, y - 15);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

// ─── Triangle ear (fox, wolf, cat, rabbit) ─────────────────

function drawTriangleEar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  halfW: number, h: number,
  outerColor: string, innerColor: string,
  twitch: number,
  isLeft: boolean
) {
  const twitchOff = isLeft ? -twitch : twitch;
  ctx.fillStyle = outerColor;
  ctx.beginPath();
  ctx.moveTo(x + twitchOff, y - h);
  ctx.lineTo(x - halfW, y);
  ctx.lineTo(x + halfW, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.moveTo(x + twitchOff * 0.8, y - h + 3);
  ctx.lineTo(x - halfW + 2, y - 1);
  ctx.lineTo(x + halfW - 2, y - 1);
  ctx.closePath();
  ctx.fill();
}

// ─── Thought bubble ────────────────────────────────────────

function drawThoughtBubble(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  text: string,
  borderColor: string,
  opacity: number
) {
  ctx.globalAlpha = opacity;
  ctx.font = '10px monospace';
  const metrics = ctx.measureText(text);
  const textW = Math.min(metrics.width, 150);
  const padding = 8;
  const bubbleW = textW + padding * 2;
  const bubbleH = 24;
  const bx = x - bubbleW / 2;
  const by = y - bubbleH;

  // Bubble tail
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(x, y + 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 3, y - 2, 2, 0, Math.PI * 2);
  ctx.fill();

  // Bubble body
  ctx.fillStyle = 'white';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  const r = 6;
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

  // Text
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let displayText = text;
  if (metrics.width > 150) {
    while (ctx.measureText(displayText + '…').width > 150 && displayText.length > 0) {
      displayText = displayText.slice(0, -1);
    }
    displayText += '…';
  }
  ctx.fillText(displayText, x, by + bubbleH / 2);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha = 1;
}
