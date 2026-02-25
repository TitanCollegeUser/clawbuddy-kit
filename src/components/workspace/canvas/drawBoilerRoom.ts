import {
  BOILER_W, BOILER_H, BOILER_DESKS,
  BOILER_WHITEBOARD, BOILER_COFFEE,
} from './arenaConstants';
import type { AgentSprite } from './types';

export function drawBoilerRoom(
  ctx: CanvasRenderingContext2D,
  time: number,
  agents: AgentSprite[]
) {
  // Dark floor
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, BOILER_W, BOILER_H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  const tile = 35;
  for (let x = 0; x < BOILER_W; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BOILER_H); ctx.stroke();
  }
  for (let y = 0; y < BOILER_H; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BOILER_W, y); ctx.stroke();
  }

  // Walls
  ctx.strokeStyle = '#0f3460';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, BOILER_W - 4, BOILER_H - 4);

  // Desks
  BOILER_DESKS.forEach((pos, i) => {
    const agent = agents[i];
    const color = agent?.neonColor || '#3b82f6';
    drawCompactDesk(ctx, pos, color, time);
  });

  // Whiteboard
  const wb = BOILER_WHITEBOARD;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(wb.x, wb.y, 35, wb.h);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(wb.x, wb.y, 35, wb.h);

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const sy = wb.y + 12 + i * 20;
    ctx.beginPath();
    ctx.moveTo(wb.x + 6, sy);
    ctx.lineTo(wb.x + 6 + 15 + Math.sin(time * 0.3 + i) * 5, sy);
    ctx.stroke();
  }

  // Coffee machine
  const cm = BOILER_COFFEE;
  ctx.fillStyle = '#5c4033';
  ctx.fillRect(cm.x - 12, cm.y - 10, 24, 30);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(cm.x - 6, cm.y - 5, 12, 5);
}

function drawCompactDesk(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  agentColor: string,
  time: number
) {
  const w = 55;
  const h = 32;

  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(pos.x - w / 2, pos.y - h / 2, w, h);
  ctx.fillStyle = '#6b5a4a';
  ctx.fillRect(pos.x - w / 2 + 2, pos.y - h / 2 + 2, w - 4, h - 4);

  // Monitor
  const monX = pos.x - w / 2 - 5;
  const monY = pos.y - 8;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(monX - 1, monY - 1, 5, 16);
  const pulse = Math.sin(time * 2.5) * 0.15 + 0.85;
  ctx.fillStyle = agentColor + Math.round(pulse * 160).toString(16).padStart(2, '0');
  ctx.fillRect(monX, monY, 4, 14);

  // Keyboard
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(pos.x - 8, pos.y - 4, 14, 6);
}
