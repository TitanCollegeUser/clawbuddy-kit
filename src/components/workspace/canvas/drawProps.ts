import {
  WATER_COOLER, COFFEE_MACHINE, WHITEBOARD,
  WALL_CLOCK, BOOKSHELVES, PLANTS, FLOOR_LAMPS,
  FILING_CABINETS,
} from './constants';
import type { DustParticle } from './types';

export function drawProps(
  ctx: CanvasRenderingContext2D,
  time: number,
  dustParticles: DustParticle[],
  steamParticles: { x: number; y: number; opacity: number; vy: number }[]
) {
  // Water cooler
  drawWaterCooler(ctx);

  // Coffee machine + steam
  drawCoffeeMachine(ctx, time, steamParticles);

  // Whiteboard
  drawWhiteboard(ctx, time);

  // Bookshelves
  BOOKSHELVES.forEach(pos => drawBookshelf(ctx, pos));

  // Wall clock
  drawWallClock(ctx, time);

  // Plants
  PLANTS.forEach(pos => drawPlant(ctx, pos));

  // Floor lamps
  FLOOR_LAMPS.forEach(pos => drawFloorLamp(ctx, pos));

  // Filing cabinets
  FILING_CABINETS.forEach(pos => drawFilingCabinet(ctx, pos));

  // Dust particles
  dustParticles.forEach(p => {
    ctx.globalAlpha = p.opacity * 0.4;
    ctx.fillStyle = '#c4b89a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawWaterCooler(ctx: CanvasRenderingContext2D) {
  const { x, y } = WATER_COOLER;
  // Body
  ctx.fillStyle = '#e0e8f0';
  ctx.fillRect(x - 12, y - 15, 24, 40);
  // Water jug
  ctx.fillStyle = '#93c5fd';
  ctx.beginPath();
  ctx.arc(x, y - 20, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.arc(x, y - 20, 7, 0, Math.PI * 2);
  ctx.fill();
  // Base
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x - 14, y + 20, 28, 8);
  // Tap
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x - 2, y + 5, 4, 6);
}

function drawCoffeeMachine(
  ctx: CanvasRenderingContext2D,
  time: number,
  steamParticles: { x: number; y: number; opacity: number; vy: number }[]
) {
  const { x, y } = COFFEE_MACHINE;
  // Body
  ctx.fillStyle = '#5c4033';
  ctx.fillRect(x - 15, y - 12, 30, 35);
  ctx.fillStyle = '#6b4c3b';
  ctx.fillRect(x - 13, y - 10, 26, 30);
  // Display
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x - 8, y - 6, 16, 6);
  // Cup area
  ctx.fillStyle = '#3d2b1f';
  ctx.fillRect(x - 10, y + 10, 20, 10);
  // Cup
  ctx.fillStyle = '#f5f5f4';
  ctx.fillRect(x - 5, y + 12, 10, 8);

  // Steam
  steamParticles.forEach(p => {
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = '#e5e5e5';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawWhiteboard(ctx: CanvasRenderingContext2D, time: number) {
  const wb = WHITEBOARD;
  // Board
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(wb.x, wb.y, 40, wb.h);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(wb.x, wb.y, 40, wb.h);

  // Animated scribbles
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  const scribbleOffset = Math.sin(time * 0.5) * 3;
  for (let i = 0; i < 5; i++) {
    const sy = wb.y + 15 + i * 24;
    const sw = 20 + Math.sin(time * 0.3 + i) * 8;
    ctx.beginPath();
    ctx.moveTo(wb.x + 8, sy + scribbleOffset * (i % 2 === 0 ? 1 : -1));
    ctx.lineTo(wb.x + 8 + sw, sy);
    ctx.stroke();
  }

  // Red marker line
  ctx.strokeStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(wb.x + 10, wb.y + wb.h - 20);
  ctx.lineTo(wb.x + 30, wb.y + wb.h - 25 + Math.sin(time * 0.8) * 3);
  ctx.stroke();
}

function drawBookshelf(ctx: CanvasRenderingContext2D, pos: { x: number; y: number }) {
  // Shelf frame
  ctx.fillStyle = '#5c4033';
  ctx.fillRect(pos.x, pos.y, 40, 60);
  ctx.fillStyle = '#6b4c3b';
  ctx.fillRect(pos.x + 2, pos.y + 2, 36, 56);

  // Books (3 rows)
  const bookColors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ec4899'];
  for (let row = 0; row < 3; row++) {
    const by = pos.y + 5 + row * 18;
    // Shelf board
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(pos.x + 3, by + 14, 34, 2);
    // Books
    for (let b = 0; b < 4; b++) {
      const bx = pos.x + 5 + b * 8;
      ctx.fillStyle = bookColors[(row * 4 + b) % bookColors.length];
      ctx.fillRect(bx, by, 6, 14);
    }
  }
}

function drawWallClock(ctx: CanvasRenderingContext2D, _time: number) {
  const { x, y } = WALL_CLOCK;
  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Clock face
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hour marks
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const inner = 15;
    const outer = 18;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    ctx.stroke();
  }

  // Hour hand
  const hourAngle = ((hours + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(hourAngle) * 10, y + Math.sin(hourAngle) * 10);
  ctx.stroke();

  // Minute hand
  const minuteAngle = ((minutes + seconds / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(minuteAngle) * 14, y + Math.sin(minuteAngle) * 14);
  ctx.stroke();

  // Second hand
  const secAngle = (seconds / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(secAngle) * 16, y + Math.sin(secAngle) * 16);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlant(ctx: CanvasRenderingContext2D, pos: { x: number; y: number }) {
  // Pot
  ctx.fillStyle = '#92400e';
  ctx.fillRect(pos.x - 8, pos.y - 5, 16, 15);
  ctx.fillStyle = '#a0522d';
  ctx.fillRect(pos.x - 10, pos.y - 7, 20, 5);
  // Leaves
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y - 15, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.arc(pos.x - 4, pos.y - 18, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(pos.x + 5, pos.y - 12, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawFloorLamp(ctx: CanvasRenderingContext2D, pos: { x: number; y: number }) {
  // Warm glow
  const glow = ctx.createRadialGradient(pos.x, pos.y - 10, 5, pos.x, pos.y - 10, 40);
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.12)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y - 10, 40, 0, Math.PI * 2);
  ctx.fill();

  // Pole
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y + 10);
  ctx.lineTo(pos.x, pos.y - 15);
  ctx.stroke();

  // Shade
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y - 18, 6, 0, Math.PI * 2);
  ctx.fill();

  // Base
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y + 12, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFilingCabinet(ctx: CanvasRenderingContext2D, pos: { x: number; y: number }) {
  ctx.fillStyle = '#64748b';
  ctx.fillRect(pos.x - 12, pos.y - 10, 24, 40);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(pos.x - 10, pos.y - 8, 20, 12);
  ctx.fillRect(pos.x - 10, pos.y + 6, 20, 12);
  ctx.fillRect(pos.x - 10, pos.y + 20, 20, 8);
  // Handles
  ctx.fillStyle = '#cbd5e1';
  for (const dy of [-2, 12, 24]) {
    ctx.fillRect(pos.x - 3, pos.y + dy, 6, 2);
  }
}
