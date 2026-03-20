import { AgentVisual } from './types';

export function drawPipelineAgent(
  ctx: CanvasRenderingContext2D,
  agent: AgentVisual,
  x: number,
  y: number,
  time: number,
  isWalking: boolean,
  isWorking: boolean,
  scale: number = 1,
  currentPhaseId?: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const breathe = Math.sin(time * 2) * 1.5;
  const walkCycle = isWalking ? Math.sin(time * 8) : 0;
  const bodyBob = isWalking ? Math.abs(Math.sin(time * 8)) * 2 : 0;
  const workAnim = isWorking ? Math.sin(time * 4) : 0;

  // Shadow under agent
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 18, isWalking ? 14 : 12, isWalking ? 3 : 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neon glow under feet (subtle)
  if (!isWalking) {
    const gradient = ctx.createRadialGradient(0, 18, 0, 0, 18, 25);
    gradient.addColorStop(0, agent.neonColor + '30');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(-25, 8, 50, 20);
  }

  // Dust particles when walking
  if (isWalking) {
    for (let i = 0; i < 3; i++) {
      const dustAge = (time * 3 + i * 0.8) % 1.5;
      if (dustAge < 0.6) {
        const dustX = -8 - dustAge * 12 + Math.sin(i * 5) * 4;
        const dustY = 16 - dustAge * 6;
        const dustAlpha = (0.6 - dustAge) / 0.6 * 0.3;
        ctx.fillStyle = `rgba(120, 120, 120, ${dustAlpha})`;
        ctx.beginPath();
        ctx.arc(dustX, dustY, 1.5 - dustAge, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Legs
  ctx.fillStyle = agent.suitColor;
  ctx.save();
  ctx.translate(-5, 8);
  ctx.rotate(walkCycle * 0.3);
  ctx.fillRect(-2, 0, 4, 10);
  ctx.fillStyle = '#111';
  ctx.fillRect(-2, 8, 5, 3);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = agent.suitColor;
  ctx.translate(5, 8);
  ctx.rotate(-walkCycle * 0.3);
  ctx.fillRect(-2, 0, 4, 10);
  ctx.fillStyle = '#111';
  ctx.fillRect(-3, 8, 5, 3);
  ctx.restore();

  // Body (suit)
  ctx.fillStyle = agent.suitColor;
  ctx.fillRect(-10, -12 - bodyBob + breathe * 0.5, 20, 22);

  // Suit lapels
  ctx.strokeStyle = agent.neonColor + '60';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -12 - bodyBob + breathe * 0.5);
  ctx.lineTo(-4, -2 - bodyBob + breathe * 0.5);
  ctx.moveTo(0, -12 - bodyBob + breathe * 0.5);
  ctx.lineTo(4, -2 - bodyBob + breathe * 0.5);
  ctx.stroke();

  // Arms (working oscillation for shoulders)
  const shoulderWork = isWorking ? Math.sin(time * 6) * 0.8 : 0;

  ctx.fillStyle = agent.suitColor;
  ctx.save();
  ctx.translate(-10, -8 - bodyBob + breathe * 0.5);
  ctx.rotate((isWorking ? workAnim * 0.4 + shoulderWork * 0.1 : walkCycle * 0.2));
  ctx.fillRect(-4, 0, 4, 14);
  ctx.fillStyle = agent.furColor;
  ctx.fillRect(-4, 12, 4, 4);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = agent.suitColor;
  ctx.translate(10, -8 - bodyBob + breathe * 0.5);
  ctx.rotate(isWorking ? -workAnim * 0.4 - shoulderWork * 0.1 : -walkCycle * 0.2);
  ctx.fillRect(0, 0, 4, 14);
  ctx.fillStyle = agent.furColor;
  ctx.fillRect(0, 12, 4, 4);
  ctx.restore();

  // Head
  const headY = -22 - bodyBob + breathe * 0.5;
  ctx.fillStyle = agent.furColor;

  if (agent.species === 'cat') {
    ctx.beginPath();
    ctx.arc(0, headY, 10, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.fillStyle = '#374151';
    ctx.fillRect(-8, headY - 8, 16, 16);
    ctx.fillStyle = agent.neonColor;
    ctx.fillRect(-1, headY - 14, 2, 6);
    ctx.beginPath();
    ctx.arc(0, headY - 15, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  const blink = Math.sin(time * 0.5) > 0.95;
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

  // Work particles (above agent, based on current phase)
  if (isWorking && currentPhaseId) {
    drawWorkParticles(ctx, time, currentPhaseId, agent.neonColor);
  }

  // Subtle neon halo (only when working, not walking)
  if (isWorking) {
    ctx.shadowColor = agent.neonColor;
    ctx.shadowBlur = 6 + Math.sin(time * 3) * 3;
    ctx.strokeStyle = agent.neonColor + '20';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, headY, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Name label
  ctx.fillStyle = agent.neonColor;
  ctx.font = `bold 9px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(`${agent.emoji} ${agent.name}`, 0, 28);

  ctx.restore();
}

function drawWorkParticles(
  ctx: CanvasRenderingContext2D,
  time: number,
  phaseId: string,
  neonColor: string
) {
  const particleCount = 3;

  if (phaseId === 'BLD') {
    // Code bracket shapes floating up from work area
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const symbols = ['{ }', '</>', '( )', '[ ]', '=> '];
    for (let i = 0; i < particleCount; i++) {
      const age = (time * 1.5 + i * 1.2) % 2.5;
      if (age > 1.8) continue;
      const px = 14 + Math.sin(time + i * 2) * 6;
      const py = -10 - age * 18;
      const alpha = Math.max(0, (1.8 - age) / 1.8 * 0.7);
      ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
      ctx.fillText(symbols[i % symbols.length], px, py);
    }
  } else if (phaseId === 'VAL') {
    // Green checkmarks popping up
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < particleCount; i++) {
      const age = (time * 2 + i * 1.1) % 2;
      if (age > 1.2) continue;
      const px = 10 + Math.sin(time * 1.5 + i * 3) * 8;
      const py = -15 - age * 20;
      const alpha = Math.max(0, (1.2 - age) / 1.2 * 0.8);
      ctx.fillStyle = `rgba(52, 211, 153, ${alpha})`;
      ctx.fillText('✓', px, py);
    }
  } else if (phaseId === 'HEL') {
    // Orange spark particles
    for (let i = 0; i < 4; i++) {
      const age = (time * 3 + i * 0.8) % 1.5;
      if (age > 0.8) continue;
      const px = Math.sin(time * 5 + i * 2.3) * 14;
      const py = -18 - age * 12;
      const alpha = Math.max(0, (0.8 - age) / 0.8 * 0.9);
      ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.fillRect(px - 1, py - 1, 2, 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.5})`;
      ctx.fillRect(px + 1, py - 2, 1.5, 1.5);
    }
  } else if (phaseId === 'RPT') {
    // Small chart icons
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < 2; i++) {
      const age = (time * 1.2 + i * 1.5) % 2.5;
      if (age > 1.5) continue;
      const px = 12 + Math.sin(time + i * 4) * 6;
      const py = -12 - age * 16;
      const alpha = Math.max(0, (1.5 - age) / 1.5 * 0.6);
      ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
      ctx.fillText('📊', px, py);
    }
  } else if (phaseId === 'CLS') {
    // Confetti multi-color
    const colors = ['#fbbf24', '#34d399', '#f87171', '#60a5fa', '#a78bfa'];
    for (let i = 0; i < 5; i++) {
      const age = (time * 2 + i * 0.7) % 2;
      const px = Math.sin(time * 2 + i * 1.5) * 18;
      const py = -20 - age * 15;
      const alpha = Math.max(0, (2 - age) / 2 * 0.7);
      ctx.fillStyle = colors[i] + Math.round(alpha * 255).toString(16).padStart(2, '0');
      ctx.fillRect(px - 1.5, py - 1, 3, 2);
    }
  }
}
