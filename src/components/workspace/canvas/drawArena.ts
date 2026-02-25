import {
  ARENA_W, ARENA_H,
  ARENA_FLOOR_COLOR, ARENA_FLOOR_ACCENT, ARENA_WALL_COLOR,
  ARENA_BELL, ARENA_BELL_COLOR, ARENA_BELL_STAND_COLOR,
  ARENA_SCOREBOARD, ARENA_DESK_A, ARENA_DESK_B,
} from './arenaConstants';

export interface ArenaScoreData {
  agentAName: string;
  agentBName: string;
  agentAScore: number;
  agentBScore: number;
  primaryMetric: string;
  primaryUnit: string;
  categories: { name: string; agentAValue: number; agentBValue: number }[];
}

export function drawArena(
  ctx: CanvasRenderingContext2D,
  time: number,
  scoreData: ArenaScoreData | null,
  bellRingPhase: number
) {
  // Floor
  ctx.fillStyle = ARENA_FLOOR_COLOR;
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);

  // Floor pattern (diamond tiles)
  ctx.strokeStyle = ARENA_FLOOR_ACCENT;
  ctx.lineWidth = 0.5;
  const tile = 50;
  for (let x = 0; x < ARENA_W; x += tile) {
    for (let y = 0; y < ARENA_H; y += tile) {
      ctx.strokeRect(x, y, tile, tile);
    }
  }

  // Walls with glow
  ctx.strokeStyle = ARENA_WALL_COLOR;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, ARENA_W - 6, ARENA_H - 6);

  // Top wall accent
  const wallGlow = ctx.createLinearGradient(0, 0, ARENA_W, 0);
  wallGlow.addColorStop(0, '#ef444433');
  wallGlow.addColorStop(0.5, '#3b82f633');
  wallGlow.addColorStop(1, '#22c55e33');
  ctx.fillStyle = wallGlow;
  ctx.fillRect(3, 3, ARENA_W - 6, 10);

  // Center line
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(ARENA_W / 2, 150);
  ctx.lineTo(ARENA_W / 2, ARENA_H - 20);
  ctx.stroke();
  ctx.setLineDash([]);

  // Desks
  drawArenaDesk(ctx, ARENA_DESK_A, 'right', time);
  drawArenaDesk(ctx, ARENA_DESK_B, 'left', time);

  // Bell stand
  drawBell(ctx, time, bellRingPhase);

  // Scoreboard
  drawScoreboard(ctx, time, scoreData);
}

function drawArenaDesk(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  monitorSide: 'left' | 'right',
  time: number
) {
  const w = 70;
  const h = 40;
  const dir = monitorSide === 'left' ? -1 : 1;

  // Desk surface
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(pos.x - w / 2, pos.y - h / 2, w, h);
  ctx.fillStyle = '#6b5a4a';
  ctx.fillRect(pos.x - w / 2 + 2, pos.y - h / 2 + 2, w - 4, h - 4);

  // Monitor
  const monW = 5;
  const monH = 18;
  const monX = monitorSide === 'left' ? pos.x - w / 2 - monW - 2 : pos.x + w / 2 + 2;
  const monY = pos.y - monH / 2;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(monX - 1, monY - 1, monW + 2, monH + 2);

  const pulse = Math.sin(time * 2.5) * 0.15 + 0.85;
  ctx.fillStyle = `rgba(59, 130, 246, ${pulse * 0.7})`;
  ctx.fillRect(monX, monY, monW, monH);

  // Keyboard
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(pos.x + dir * -8 - 8, pos.y - 4, 16, 7);
}

function drawBell(ctx: CanvasRenderingContext2D, time: number, ringPhase: number) {
  const { x, y } = ARENA_BELL;

  // Stand
  ctx.fillStyle = ARENA_BELL_STAND_COLOR;
  ctx.fillRect(x - 3, y - 30, 6, 50);
  ctx.fillRect(x - 20, y + 18, 40, 4);

  // Bell swing
  const swing = ringPhase > 0 ? Math.sin(ringPhase * 15) * 0.3 * ringPhase : 0;

  ctx.save();
  ctx.translate(x, y - 25);
  ctx.rotate(swing);

  // Bell body
  ctx.fillStyle = ARENA_BELL_COLOR;
  ctx.beginPath();
  ctx.moveTo(-15, 0);
  ctx.quadraticCurveTo(-18, 15, -12, 25);
  ctx.lineTo(12, 25);
  ctx.quadraticCurveTo(18, 15, 15, 0);
  ctx.closePath();
  ctx.fill();

  // Bell shine
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(-5, 10, 4, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Clapper
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.arc(0, 23, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Ring effect (expanding circles)
  if (ringPhase > 0) {
    for (let i = 0; i < 3; i++) {
      const r = (1 - ringPhase) * 60 + i * 20;
      const alpha = ringPhase * 0.4 * (1 - i * 0.3);
      ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 10, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawScoreboard(
  ctx: CanvasRenderingContext2D,
  time: number,
  scoreData: ArenaScoreData | null
) {
  const sb = ARENA_SCOREBOARD;

  // Board background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(sb.x, sb.y, sb.w, sb.h);

  // Border glow
  const borderGlow = Math.sin(time) * 0.1 + 0.4;
  ctx.strokeStyle = `rgba(59, 130, 246, ${borderGlow})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(sb.x, sb.y, sb.w, sb.h);

  if (!scoreData) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('No scoreboard configured', sb.x + sb.w / 2, sb.y + sb.h / 2);
    ctx.textAlign = 'start';
    return;
  }

  const midX = sb.x + sb.w / 2;

  // VS divider
  ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VS', midX, sb.y + 28);

  // Agent names
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#60a5fa';
  ctx.textAlign = 'center';
  ctx.fillText(scoreData.agentAName, sb.x + sb.w * 0.25, sb.y + 28);

  ctx.fillStyle = '#f87171';
  ctx.fillText(scoreData.agentBName, sb.x + sb.w * 0.75, sb.y + 28);

  // Primary metric
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.fillText(scoreData.primaryMetric, midX, sb.y + 50);

  // Scores
  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = '#60a5fa';
  ctx.fillText(
    `${scoreData.primaryUnit}${scoreData.agentAScore}`,
    sb.x + sb.w * 0.25,
    sb.y + 82
  );

  ctx.fillStyle = '#f87171';
  ctx.fillText(
    `${scoreData.primaryUnit}${scoreData.agentBScore}`,
    sb.x + sb.w * 0.75,
    sb.y + 82
  );

  // Category rows
  const cats = scoreData.categories.slice(0, 3);
  ctx.font = '10px monospace';
  cats.forEach((cat, i) => {
    const cy = sb.y + 100 + i * 14;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.fillText(cat.name, midX, cy);

    ctx.fillStyle = 'rgba(96, 165, 250, 0.7)';
    ctx.fillText(String(cat.agentAValue), sb.x + sb.w * 0.25, cy);

    ctx.fillStyle = 'rgba(248, 113, 113, 0.7)';
    ctx.fillText(String(cat.agentBValue), sb.x + sb.w * 0.75, cy);
  });

  ctx.textAlign = 'start';
}
