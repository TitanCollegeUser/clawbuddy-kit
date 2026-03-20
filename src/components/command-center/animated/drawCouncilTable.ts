export function drawCouncilTable(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  time: number,
  isComplete: boolean
) {
  ctx.save();
  ctx.translate(centerX, centerY);

  const tableW = 65;
  const tableH = 28;

  // Table shadow (pool beneath)
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 10, tableW + 8, tableH + 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Table edge (3D depth — drawn first)
  ctx.fillStyle = '#15120e';
  ctx.beginPath();
  ctx.ellipse(0, 5, tableW, tableH, 0, 0, Math.PI);
  ctx.fill();

  // Table top surface
  const tableGrad = ctx.createLinearGradient(-tableW, -5, tableW, 5);
  tableGrad.addColorStop(0, '#1a1410');
  tableGrad.addColorStop(0.3, '#2d241a');
  tableGrad.addColorStop(0.5, '#352c20'); // highlight sheen
  tableGrad.addColorStop(0.7, '#2d241a');
  tableGrad.addColorStop(1, '#1a1410');
  ctx.fillStyle = tableGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, tableW, tableH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle wood grain lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 0.5;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(0, i * 3, tableW - 8 + i * 2, tableH - 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Polished wood sheen (lighter strip across top)
  const sheenGrad = ctx.createLinearGradient(0, -tableH * 0.6, 0, -tableH * 0.1);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
  sheenGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sheenGrad;
  ctx.beginPath();
  ctx.ellipse(0, -tableH * 0.3, tableW * 0.7, tableH * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Emerald glow ring
  ctx.strokeStyle = `rgba(16, 185, 129, ${0.3 + Math.sin(time * 2) * 0.12})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, tableW - 5, tableH - 3, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Inner glow
  const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
  innerGlow.addColorStop(0, 'rgba(16, 185, 129, 0.06)');
  innerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = innerGlow;
  ctx.beginPath();
  ctx.ellipse(0, 0, tableW - 10, tableH - 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gavel (pixel-art T-shape)
  ctx.fillStyle = '#5c3a1e';
  ctx.save();
  if (isComplete) {
    ctx.rotate(Math.sin(time * 4) * 0.1);
  }
  // Handle
  ctx.fillRect(-1, -2, 2, 8);
  // Head
  ctx.fillStyle = '#4a2e17';
  ctx.fillRect(-6, -4, 12, 4);
  ctx.restore();

  // Table front edge overlay (so it clips over bottom things slightly)
  ctx.fillStyle = '#2d241a';
  ctx.beginPath();
  ctx.ellipse(0, 0, tableW, tableH, 0, Math.PI * 0.05, Math.PI * 0.95);
  ctx.fill();

  ctx.restore();
}

export function drawFloor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  floorY: number
) {
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, height);
  floorGrad.addColorStop(0, '#0f1218');
  floorGrad.addColorStop(1, '#080a0f');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, width, height - floorY);

  // Grid lines (very subtle)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = floorY; y < height; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}
