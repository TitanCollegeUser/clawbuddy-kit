export function drawStation(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  phase: { id: string; icon: string; stationDescription: string },
  state: 'completed' | 'current' | 'pending',
  time: number,
  scale: number = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const stationColors: Record<string, string> = {
    CTX: '#10b981',
    PLN: '#06b6d4',
    TSK: '#f59e0b',
    BLD: '#8b5cf6',
    VAL: '#10b981',
    HEL: '#ef4444',
    RPT: '#3b82f6',
    CLS: '#f59e0b',
  };

  const color = stationColors[phase.id] || '#10b981';

  // Station platform
  ctx.fillStyle = state === 'pending' ? '#1f2937' : '#111827';
  ctx.fillRect(-22, 0, 44, 8);
  ctx.fillStyle = state === 'pending' ? '#374151' : color + '30';
  ctx.fillRect(-20, 0, 40, 2);

  // Glow effects
  if (state === 'current') {
    const glow = ctx.createRadialGradient(0, 4, 0, 0, 4, 40);
    glow.addColorStop(0, color + '50');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(-40, -15, 80, 35);

    // Pulsing ring
    const pulseSize = 28 + Math.sin(time * 3) * 6;
    ctx.strokeStyle = color + '50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -18, pulseSize, 0, Math.PI * 2);
    ctx.stroke();

    // Progress ring (fills over 2 seconds)
    const ringProgress = (time % 4) / 2;
    if (ringProgress <= 1) {
      ctx.strokeStyle = color + 'a0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -18, 22, -Math.PI / 2, -Math.PI / 2 + ringProgress * Math.PI * 2);
      ctx.stroke();
    }
  }

  if (state === 'completed') {
    const glow = ctx.createRadialGradient(0, 4, 0, 0, 4, 28);
    glow.addColorStop(0, color + '25');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(-28, -8, 56, 28);
  }

  // === STATION FURNITURE (distinct silhouettes) ===
  const isPending = state === 'pending';
  const dimColor = '#374151';
  const dimDark = '#1f2937';
  const metalColor = isPending ? dimColor : '#94a3b8';

  if (phase.id === 'CTX') {
    // Tall bookshelf with open book
    ctx.fillStyle = isPending ? dimColor : '#5c3a1e';
    ctx.fillRect(-14, -32, 28, 32);
    ctx.fillStyle = isPending ? dimDark : '#3d2612';
    ctx.fillRect(-12, -30, 24, 2); // shelf
    ctx.fillRect(-12, -20, 24, 2); // shelf
    // Books on shelves
    if (!isPending) {
      ctx.fillStyle = '#ef4444'; ctx.fillRect(-10, -28, 4, 8);
      ctx.fillStyle = '#3b82f6'; ctx.fillRect(-5, -28, 4, 8);
      ctx.fillStyle = '#10b981'; ctx.fillRect(1, -28, 4, 8);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(6, -28, 4, 8);
      ctx.fillStyle = '#8b5cf6'; ctx.fillRect(-10, -18, 5, 8);
      ctx.fillStyle = '#06b6d4'; ctx.fillRect(-4, -18, 5, 8);
    }
    // Open book on top
    ctx.fillStyle = isPending ? dimDark : '#fef3c7';
    ctx.fillRect(-8, -38, 7, 5);
    ctx.fillRect(1, -38, 7, 5);
    // Magnifying glass
    if (!isPending) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(8, -40, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(11, -37);
      ctx.lineTo(14, -34);
      ctx.stroke();
    }
  } else if (phase.id === 'PLN') {
    // Wide whiteboard with sticky notes
    ctx.fillStyle = isPending ? dimDark : '#f1f5f9';
    ctx.fillRect(-16, -34, 32, 24);
    ctx.strokeStyle = isPending ? dimColor : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(-16, -34, 32, 24);
    // Legs
    ctx.fillStyle = isPending ? dimColor : '#4b5563';
    ctx.fillRect(-14, -10, 3, 10);
    ctx.fillRect(11, -10, 3, 10);
    // Sticky notes (3 small squares)
    if (!isPending) {
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(-12, -30, 8, 7);
      ctx.fillStyle = '#fb7185'; ctx.fillRect(-2, -30, 8, 7);
      ctx.fillStyle = '#34d399'; ctx.fillRect(8, -30, 8, 7);
      ctx.fillStyle = '#60a5fa'; ctx.fillRect(-12, -21, 8, 7);
      ctx.fillStyle = '#c084fc'; ctx.fillRect(-2, -21, 8, 7);
    }
  } else if (phase.id === 'TSK') {
    // Tall narrow kanban board with 3 horizontal colored bars
    ctx.fillStyle = isPending ? dimDark : '#1e293b';
    ctx.fillRect(-10, -36, 20, 28);
    ctx.strokeStyle = isPending ? dimColor : '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(-10, -36, 20, 28);
    // Legs
    ctx.fillStyle = isPending ? dimColor : '#4b5563';
    ctx.fillRect(-8, -8, 3, 8);
    ctx.fillRect(5, -8, 3, 8);
    // Column dividers
    if (!isPending) {
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-3, -34); ctx.lineTo(-3, -10);
      ctx.moveTo(4, -34); ctx.lineTo(4, -10);
      ctx.stroke();
    }
    // Cards (horizontal bars)
    if (!isPending) {
      ctx.fillStyle = '#34d399'; ctx.fillRect(-8, -32, 4, 3);
      ctx.fillStyle = '#60a5fa'; ctx.fillRect(-8, -28, 4, 3);
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(-1, -32, 4, 3);
      ctx.fillStyle = '#f87171'; ctx.fillRect(-1, -27, 4, 3);
      ctx.fillStyle = '#a78bfa'; ctx.fillRect(5, -30, 4, 3);
    }
  } else if (phase.id === 'BLD') {
    // L-shape desk + glowing monitor
    ctx.fillStyle = isPending ? dimColor : '#4b5563';
    ctx.fillRect(-16, -10, 32, 3);
    ctx.fillRect(-14, -7, 3, 7);
    ctx.fillRect(11, -7, 3, 7);
    // Monitor stand
    ctx.fillStyle = isPending ? dimColor : '#374151';
    ctx.fillRect(-2, -14, 4, 4);
    // Monitor
    ctx.fillStyle = isPending ? dimDark : '#0f172a';
    ctx.fillRect(-12, -30, 24, 16);
    ctx.strokeStyle = isPending ? dimColor : '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(-12, -30, 24, 16);
    // Glowing screen content
    if (!isPending) {
      ctx.fillStyle = color + '40';
      ctx.fillRect(-10, -28, 20, 12);
      // Scrolling code lines
      const scrollOffset = (time * 2) % 10;
      ctx.fillStyle = color + '90';
      for (let i = 0; i < 5; i++) {
        const ly = -27 + i * 3 + (scrollOffset % 3);
        if (ly > -28 && ly < -17) {
          const lw = 4 + ((i * 7 + 3) % 12);
          ctx.fillRect(-8, ly, lw, 1);
        }
      }
      // Screen glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = color + '40';
      ctx.lineWidth = 1;
      ctx.strokeRect(-12, -30, 24, 16);
      ctx.shadowBlur = 0;
    }
    // Keyboard
    ctx.fillStyle = isPending ? dimColor : '#374151';
    ctx.fillRect(-8, -12, 16, 3);
    if (!isPending) {
      ctx.fillStyle = '#4b5563';
      for (let k = 0; k < 6; k++) {
        ctx.fillRect(-6 + k * 2.5, -11, 1.5, 1);
      }
    }
  } else if (phase.id === 'VAL') {
    // Triangular flask/beaker shape
    // Flask body
    ctx.fillStyle = isPending ? dimColor : '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-3, -32);
    ctx.lineTo(-3, -20);
    ctx.lineTo(-14, -4);
    ctx.lineTo(14, -4);
    ctx.lineTo(3, -20);
    ctx.lineTo(3, -32);
    ctx.closePath();
    ctx.fill();
    if (!isPending) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Flask neck
    ctx.fillStyle = isPending ? dimColor : '#e2e8f0';
    ctx.fillRect(-3, -35, 6, 4);
    // Liquid
    if (!isPending) {
      ctx.fillStyle = '#34d39980';
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      const waveY = Math.sin(time * 3) * 1.5;
      ctx.quadraticCurveTo(0, -10 + waveY, 10, -8);
      ctx.lineTo(14, -4);
      ctx.lineTo(-14, -4);
      ctx.closePath();
      ctx.fill();
    }
    // Floating checkmarks for current/completed
    if (state !== 'pending') {
      for (let i = 0; i < 3; i++) {
        const checkY = -36 - (time * 15 + i * 40) % 30;
        const checkX = -6 + i * 6 + Math.sin(time * 2 + i) * 3;
        const alpha = Math.max(0, 1 - ((time * 15 + i * 40) % 30) / 30);
        ctx.fillStyle = `rgba(52, 211, 153, ${alpha * 0.8})`;
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', checkX, checkY);
      }
    }
  } else if (phase.id === 'HEL') {
    // Low wide workbench
    ctx.fillStyle = isPending ? dimColor : '#4b5563';
    ctx.fillRect(-18, -10, 36, 3);
    ctx.fillRect(-16, -7, 3, 7);
    ctx.fillRect(13, -7, 3, 7);
    // Wrench
    ctx.fillStyle = isPending ? dimColor : metalColor;
    ctx.save();
    ctx.translate(-6, -18);
    ctx.rotate(Math.sin(time * 2) * 0.15);
    ctx.fillRect(-1, -8, 2, 14);
    ctx.fillRect(-4, -8, 8, 3);
    ctx.restore();
    // Hammer
    ctx.fillStyle = isPending ? dimColor : '#78350f';
    ctx.save();
    ctx.translate(6, -16);
    ctx.rotate(state === 'current' ? Math.sin(time * 6) * 0.3 : 0.1);
    ctx.fillRect(-1, -4, 2, 12);
    ctx.fillStyle = isPending ? dimColor : '#6b7280';
    ctx.fillRect(-4, -6, 8, 4);
    ctx.restore();
    // Sparks for current
    if (state === 'current') {
      for (let i = 0; i < 5; i++) {
        const sx = Math.sin(time * 7 + i * 1.7) * 14;
        const sy = -20 + Math.cos(time * 5 + i * 2.3) * 8;
        const sparkAlpha = (Math.sin(time * 8 + i * 3) + 1) / 2;
        ctx.fillStyle = `rgba(251, 191, 36, ${sparkAlpha * 0.9})`;
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
      }
    }
  } else if (phase.id === 'RPT') {
    // Projector screen with stand
    ctx.fillStyle = isPending ? dimColor : '#4b5563';
    ctx.fillRect(-1, -8, 2, 8); // stand
    ctx.fillRect(-8, -8, 16, 2); // base
    // Screen
    ctx.fillStyle = isPending ? dimDark : '#0f172a';
    ctx.fillRect(-16, -34, 32, 24);
    ctx.strokeStyle = isPending ? dimColor : '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(-16, -34, 32, 24);
    // Bar chart with growing bars
    if (!isPending) {
      const barColors = [color, '#06b6d4', '#f59e0b', '#ef4444'];
      barColors.forEach((bc, i) => {
        const maxH = 6 + i * 3.5;
        const barH = state === 'current'
          ? maxH * Math.min(1, (time % 3) / 1.5)
          : maxH;
        ctx.fillStyle = bc;
        ctx.fillRect(-12 + i * 7, -12 - barH, 5, barH);
      });
      // Axis lines
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-13, -12);
      ctx.lineTo(18, -12);
      ctx.moveTo(-13, -30);
      ctx.lineTo(-13, -12);
      ctx.stroke();
    }
  } else if (phase.id === 'CLS') {
    // Flag pole + waving flag
    ctx.fillStyle = isPending ? dimColor : '#4b5563';
    ctx.fillRect(-1, -36, 2, 36);
    // Base
    ctx.fillStyle = isPending ? dimColor : '#374151';
    ctx.fillRect(-6, -2, 12, 4);
    // Waving flag
    ctx.fillStyle = isPending ? dimDark : color;
    ctx.beginPath();
    ctx.moveTo(1, -36);
    const wave1 = Math.sin(time * 3) * 2;
    const wave2 = Math.sin(time * 3 + 1) * 2;
    ctx.quadraticCurveTo(8 + wave1, -34, 16, -32 + wave2);
    ctx.quadraticCurveTo(8 + wave2, -28, 1, -24);
    ctx.closePath();
    ctx.fill();
    // Confetti for completed
    if (state === 'completed') {
      const confettiColors = ['#fbbf24', '#34d399', '#f87171', '#60a5fa', '#a78bfa', '#fb923c'];
      for (let i = 0; i < 8; i++) {
        const cx = Math.sin(time * 1.5 + i * 1.2) * 20;
        const cy = -38 - (time * 20 + i * 25) % 40;
        const alpha = Math.max(0, 1 - ((time * 20 + i * 25) % 40) / 40);
        ctx.fillStyle = confettiColors[i % confettiColors.length];
        ctx.globalAlpha = alpha;
        ctx.fillRect(cx - 1.5, cy - 1, 3, 2);
        ctx.globalAlpha = 1;
      }
    }
    // Trophy on base for completed
    if (state === 'completed') {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-3, -6, 6, 4);
      ctx.fillRect(-5, -8, 10, 3);
    }
  }

  // Completed checkmark (floating bob)
  if (state === 'completed') {
    const bobY = -40 + Math.sin(time * 2) * 2;
    ctx.fillStyle = color;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✅', 0, bobY);
  }

  // Phase label
  ctx.fillStyle = state === 'current' ? '#ffffff' : state === 'pending' ? '#4b5563' : color;
  ctx.font = `bold 10px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(phase.id, 0, 20);

  // Description for current
  if (state === 'current') {
    ctx.fillStyle = color + '90';
    ctx.font = `9px 'JetBrains Mono', monospace`;
    ctx.fillText(phase.stationDescription, 0, 30);
  }

  ctx.restore();
}
