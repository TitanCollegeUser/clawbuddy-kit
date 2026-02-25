import {
  CANVAS_W, CANVAS_H, FLOOR_COLOR, FLOOR_GRID_COLOR,
  WALL_COLOR, WALL_INNER_COLOR, DIRECTOR_OFFICE,
  DIRECTOR_ROOM_BG, DIRECTOR_ROOM_GLOW,
  DESK_COLOR, DESK_HIGHLIGHT,
  DESK_POSITIONS_ROW1, DESK_POSITIONS_ROW2,
  CONFERENCE_TABLE, CONFERENCE_RUG,
  TV_SCREEN,
} from './constants';
import type { AgentSprite } from './types';

export function drawOffice(
  ctx: CanvasRenderingContext2D,
  time: number,
  agents: AgentSprite[]
) {
  // Floor
  ctx.fillStyle = FLOOR_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Floor grid tiles
  ctx.strokeStyle = FLOOR_GRID_COLOR;
  ctx.lineWidth = 0.5;
  const tileSize = 40;
  for (let x = 0; x < CANVAS_W; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }

  // Walls
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, CANVAS_W - 6, CANVAS_H - 6);
  ctx.strokeStyle = WALL_INNER_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, CANVAS_W - 16, CANVAS_H - 16);

  // Director's office (glass-walled room)
  const d = DIRECTOR_OFFICE;
  ctx.fillStyle = DIRECTOR_ROOM_BG;
  ctx.fillRect(d.x, d.y, d.w, d.h);

  const glow = ctx.createRadialGradient(d.x + d.w / 2, d.y + d.h / 2, 20, d.x + d.w / 2, d.y + d.h / 2, d.w * 0.7);
  glow.addColorStop(0, DIRECTOR_ROOM_GLOW);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(d.x, d.y, d.w, d.h);

  // Glass walls (dashed)
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(100, 160, 220, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(d.x + d.w, d.y);
  ctx.lineTo(d.x + d.w, d.y + d.h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(d.x, d.y + d.h);
  ctx.lineTo(d.x + d.w, d.y + d.h);
  ctx.stroke();
  ctx.setLineDash([]);

  // Director's desk — monitor on right side
  const dirAgent = agents.find(a => a.isDirector);
  drawSideDesk(ctx, { x: 160, y: 110 }, true, dirAgent?.neonColor || '#3b82f6', 'right', time);

  // Sub-agent desks — monitor on left side
  const subAgents = agents.filter(a => !a.isDirector);
  const allDesks = [...DESK_POSITIONS_ROW1, ...DESK_POSITIONS_ROW2];
  for (let i = 0; i < allDesks.length; i++) {
    const agent = subAgents[i];
    if (agent) {
      drawSideDesk(ctx, allDesks[i], false, agent.neonColor, 'left', time);
    }
  }

  // Conference table area
  ctx.fillStyle = CONFERENCE_RUG;
  ctx.beginPath();
  ctx.ellipse(CONFERENCE_TABLE.x, CONFERENCE_TABLE.y, 140, 80, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5a4a3a';
  ctx.beginPath();
  ctx.ellipse(CONFERENCE_TABLE.x, CONFERENCE_TABLE.y, 100, 45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b5a4a';
  ctx.beginPath();
  ctx.ellipse(CONFERENCE_TABLE.x, CONFERENCE_TABLE.y - 2, 95, 42, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wall TV
  const tvPulse = Math.sin(time * 2) * 0.3 + 0.7;
  ctx.fillStyle = '#111';
  ctx.fillRect(TV_SCREEN.x - 2, TV_SCREEN.y - 2, TV_SCREEN.w + 4, TV_SCREEN.h + 4);
  const barCount = 12;
  const barWidth = TV_SCREEN.w / barCount;
  for (let i = 0; i < barCount; i++) {
    const barH = (Math.sin(time * 3 + i * 0.7) * 0.4 + 0.6) * TV_SCREEN.h;
    const hue = (i / barCount) * 360;
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${tvPulse})`;
    ctx.fillRect(
      TV_SCREEN.x + i * barWidth,
      TV_SCREEN.y + TV_SCREEN.h - barH,
      barWidth - 1,
      barH
    );
  }
}

/**
 * Draw a desk rotated 90° (side view) with monitor on the specified side.
 * The monitor screen faces inward so the glow is visible.
 */
function drawSideDesk(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  isDirector: boolean,
  agentColor: string,
  monitorSide: 'left' | 'right',
  time: number
) {
  const w = isDirector ? 60 : 50;
  const h = isDirector ? 35 : 30;
  const dir = monitorSide === 'left' ? -1 : 1;

  // Desk surface (landscape orientation)
  ctx.fillStyle = DESK_COLOR;
  ctx.fillRect(pos.x - w / 2, pos.y - h / 2, w, h);
  ctx.fillStyle = DESK_HIGHLIGHT;
  ctx.fillRect(pos.x - w / 2 + 2, pos.y - h / 2 + 2, w - 4, h - 4);

  // Monitor on the specified side
  const monW = 4;   // thin from the side
  const monH = 14;
  const monX = monitorSide === 'left'
    ? pos.x - w / 2 - monW - 1
    : pos.x + w / 2 + 1;
  const monY = pos.y - monH / 2;

  // Monitor frame
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(monX - 1, monY - 1, monW + 2, monH + 2);

  // Screen glow (the lit-up side facing the agent)
  const screenGlow = ctx.createRadialGradient(
    monX + monW / 2, monY + monH / 2, 2,
    monX + monW / 2, monY + monH / 2, 30
  );
  screenGlow.addColorStop(0, agentColor + '33');
  screenGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = screenGlow;
  ctx.beginPath();
  ctx.arc(monX + monW / 2, monY + monH / 2, 30, 0, Math.PI * 2);
  ctx.fill();

  // Screen pixels (the lit face)
  const screenPulse = Math.sin(time * 2.5) * 0.15 + 0.85;
  ctx.fillStyle = agentColor + Math.round(screenPulse * 180).toString(16).padStart(2, '0');
  ctx.fillRect(monX, monY, monW, monH);

  // Scanline effect
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let sy = 0; sy < monH; sy += 3) {
    ctx.fillRect(monX, monY + sy, monW, 1);
  }

  // Monitor stand
  ctx.fillStyle = '#333';
  const standX = monitorSide === 'left'
    ? monX + monW
    : monX - 3;
  ctx.fillRect(standX, pos.y - 1, 3, 2);

  // Keyboard on desk (small rectangle near center)
  ctx.fillStyle = '#2a2a3e';
  const kbX = pos.x + dir * -5;
  ctx.fillRect(kbX - 6, pos.y - 3, 12, 5);
  // Key dots
  ctx.fillStyle = '#4a4a5e';
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.fillRect(kbX - 4 + c * 3, pos.y - 2 + r * 2, 2, 1);
    }
  }
}
