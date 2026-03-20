export function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  neonColor: string,
  progress: number,
  maxWidth: number = 280,
  minWidth: number = 120
) {
  ctx.save();

  // Truncate to ~3 lines worth
  const maxChars = 150;
  let displayText = text;
  let truncated = false;
  if (text.length > maxChars) {
    displayText = text.substring(0, maxChars - 3) + '...';
    truncated = true;
  }

  const visibleText = displayText.substring(0, Math.floor(displayText.length * progress));

  // Measure text
  ctx.font = '13px "Space Grotesk", sans-serif';
  const words = visibleText.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const textMaxW = maxWidth - 24;

  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > textMaxW) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);
  if (lines.length === 0) lines.push('');

  // Clamp to 3 visible lines
  if (lines.length > 3) {
    lines.length = 3;
    lines[2] = lines[2].substring(0, lines[2].length - 3) + '...';
    truncated = true;
  }

  const lineHeight = 20;
  const padding = 12;
  const bubbleWidth = Math.max(minWidth, Math.min(maxWidth,
    Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2
  ));
  const bubbleHeight = lines.length * lineHeight + padding * 2 + (truncated ? 14 : 0);
  const bubbleX = x - bubbleWidth / 2;
  const bubbleY = y - bubbleHeight - 12;

  // Scale animation (appear: 0.3→1 over first 20% of progress)
  const scaleT = Math.min(1, progress * 5);
  const scale = 0.3 + 0.7 * easeOut(scaleT);
  const opacity = Math.min(1, progress * 6.67);

  ctx.globalAlpha = opacity;
  ctx.translate(x, y - 12);
  ctx.scale(scale, scale);
  ctx.translate(-x, -(y - 12));

  // Bubble background (glassmorphic)
  ctx.fillStyle = 'rgba(17, 24, 39, 0.88)';
  ctx.strokeStyle = neonColor + '60';
  ctx.lineWidth = 1.5;

  // Rounded rect
  const r = 10;
  roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, r);
  ctx.fill();
  ctx.stroke();

  // Tail
  ctx.fillStyle = 'rgba(17, 24, 39, 0.88)';
  ctx.beginPath();
  ctx.moveTo(x - 6, bubbleY + bubbleHeight);
  ctx.lineTo(x, bubbleY + bubbleHeight + 10);
  ctx.lineTo(x + 6, bubbleY + bubbleHeight);
  ctx.fill();

  ctx.strokeStyle = neonColor + '60';
  ctx.beginPath();
  ctx.moveTo(x - 6, bubbleY + bubbleHeight);
  ctx.lineTo(x, bubbleY + bubbleHeight + 10);
  ctx.lineTo(x + 6, bubbleY + bubbleHeight);
  ctx.stroke();

  // Outer glow
  ctx.shadowColor = neonColor;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = neonColor + '18';
  ctx.lineWidth = 3;
  roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, r);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Text
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '13px "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  lines.forEach((line, i) => {
    ctx.fillText(line, bubbleX + padding, bubbleY + padding + 14 + i * lineHeight);
  });

  // Cursor blink while typing
  if (progress < 1 && progress > 0) {
    const lastLine = lines[lines.length - 1] || '';
    const lastLineWidth = ctx.measureText(lastLine).width;
    const cursorX = bubbleX + padding + lastLineWidth + 2;
    const cursorY = bubbleY + padding + 4 + (lines.length - 1) * lineHeight;
    if (Math.sin(Date.now() / 300) > 0) {
      ctx.fillStyle = neonColor;
      ctx.fillRect(cursorX, cursorY, 2, 14);
    }
  }

  // "more" indicator
  if (truncated && progress >= 1) {
    ctx.fillStyle = neonColor + '80';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('⋯ more', bubbleX + bubbleWidth - padding, bubbleY + bubbleHeight - 6);
  }

  ctx.restore();
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
