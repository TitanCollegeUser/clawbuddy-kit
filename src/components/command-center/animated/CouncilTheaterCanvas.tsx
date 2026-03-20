import { useRef, useEffect, useCallback } from 'react';
import { drawSeatedAgent } from './drawSeatedAgent';
import { drawCouncilTable, drawFloor } from './drawCouncilTable';
import { drawSpeechBubble } from './drawSpeechBubble';
import { getAgentVisual } from './agentVisuals';
import { CouncilSession } from './types';

interface CouncilTheaterCanvasProps {
  session: CouncilSession;
  currentMessageIndex: number;
  messageProgress: number;
  width: number;
  height: number;
}

interface SeatInfo {
  x: number;
  y: number;
  facing: 'left' | 'right' | 'forward';
  scale: number;
  position: 'top' | 'left' | 'right' | 'bottom';
}

export function CouncilTheaterCanvas({
  session,
  currentMessageIndex,
  messageProgress,
  width,
  height,
}: CouncilTheaterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; opacity: number; size: number }>>(
    Array.from({ length: 5 }, () => ({
      x: Math.random() * 700,
      y: Math.random() * 350,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.08 - Math.random() * 0.05,
      opacity: 0.08 + Math.random() * 0.12,
      size: 1 + Math.random() * 1.5,
    }))
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const time = (Date.now() - startTimeRef.current) / 1000;
    const centerX = width / 2;
    const tableY = height * 0.45;
    const isComplete = currentMessageIndex >= session.messages.length;
    const currentMsg = session.messages[currentMessageIndex];

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#06080d');
    bg.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Ambient emerald radial glow
    const ambient = ctx.createRadialGradient(centerX, tableY, 0, centerX, tableY, width * 0.5);
    ambient.addColorStop(0, 'rgba(16, 185, 129, 0.03)');
    ambient.addColorStop(1, 'transparent');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, width, height);

    // Floating ambient particles
    const particles = particlesRef.current;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5) { p.y = height + 5; p.x = Math.random() * width; }
      if (p.x < -5 || p.x > width + 5) p.x = Math.random() * width;
      ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Floor
    const floorY = height * 0.72;
    drawFloor(ctx, width, height, floorY);

    // Question header
    ctx.fillStyle = 'rgba(107, 114, 128, 0.6)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('❓ COUNCIL QUESTION', centerX, 22);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '13px "Space Grotesk", sans-serif';
    const questionText = session.question.length > 60
      ? session.question.substring(0, 57) + '...'
      : session.question;
    ctx.fillText(`"${questionText}"`, centerX, 42);

    // Seat positions with depth info
    const uniqueParticipants = session.participants;
    const seats = getSeatingPositions(uniqueParticipants.length, width, height);

    // Identify speaking agent
    const speakingName = currentMsg?.fromAgent;

    // === Z-ORDER RENDERING ===

    // 1. Draw TOP agents (behind table, scale ~0.70)
    seats.forEach((seat, i) => {
      if (seat.position !== 'top') return;
      const agent = getAgentVisual(uniqueParticipants[i].name);
      const isSpeaking = speakingName === uniqueParticipants[i].name;
      const dimFactor = speakingName && !isSpeaking ? 0.7 : 1.0;
      drawAgentWithEffects(ctx, agent, seat, time + i * 0.5, isSpeaking, dimFactor);
    });

    // 2. Draw table (middle layer)
    drawCouncilTable(ctx, centerX, tableY, time, isComplete);

    // 3. Draw SIDE agents
    seats.forEach((seat, i) => {
      if (seat.position !== 'left' && seat.position !== 'right') return;
      const agent = getAgentVisual(uniqueParticipants[i].name);
      const isSpeaking = speakingName === uniqueParticipants[i].name;
      const dimFactor = speakingName && !isSpeaking ? 0.7 : 1.0;
      drawAgentWithEffects(ctx, agent, seat, time + i * 0.5, isSpeaking, dimFactor);
    });

    // 4. Draw BOTTOM agents (in front)
    seats.forEach((seat, i) => {
      if (seat.position !== 'bottom') return;
      const agent = getAgentVisual(uniqueParticipants[i].name);
      const isSpeaking = speakingName === uniqueParticipants[i].name;
      const dimFactor = speakingName && !isSpeaking ? 0.7 : 1.0;
      drawAgentWithEffects(ctx, agent, seat, time + i * 0.5, isSpeaking, dimFactor);
    });

    // 5. Speech bubble (always on top)
    if (currentMsg && messageProgress > 0) {
      const speakerIndex = uniqueParticipants.findIndex(p => p.name === currentMsg.fromAgent);
      const speakerSeat = seats[speakerIndex] || seats[0];
      const agent = getAgentVisual(currentMsg.fromAgent);

      let bubbleX = speakerSeat.x;
      let bubbleY = speakerSeat.y - 45 * speakerSeat.scale;

      // Top agent: offset bubble to the side so it doesn't overlap table
      if (speakerSeat.position === 'top') {
        bubbleX += width * 0.12;
        bubbleY -= 10;
      }

      // Ensure bubble doesn't overlap table area
      const tableTopY = tableY - 25;
      if (bubbleY + 30 > tableTopY && speakerSeat.position !== 'top') {
        bubbleY = tableTopY - 35;
      }

      drawSpeechBubble(
        ctx,
        bubbleX,
        bubbleY,
        currentMsg.message,
        agent.neonColor,
        messageProgress,
        Math.min(width * 0.6, 340),
        width * 0.25
      );
    }

    // Completed state
    if (isComplete) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('✅ Council Complete', centerX, height * 0.85);

      ctx.fillStyle = 'rgba(107, 114, 128, 0.5)';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(
        `${session.messages.length} messages from ${uniqueParticipants.length} agents`,
        centerX,
        height * 0.85 + 18
      );

      // Particle burst
      for (let i = 0; i < 8; i++) {
        const angle = (time * 0.5 + i * (Math.PI * 2 / 8));
        const radius = 20 + Math.sin(time * 2 + i) * 10;
        const px = centerX + Math.cos(angle) * radius;
        const py = height * 0.85 - 10 + Math.sin(angle) * radius * 0.3;
        ctx.fillStyle = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6'][i % 4];
        ctx.fillRect(px - 1, py - 1, 3, 3);
      }
    }

    // Vignette (inner shadow)
    const vigGrad = ctx.createRadialGradient(centerX, height / 2, Math.min(width, height) * 0.35, centerX, height / 2, Math.max(width, height) * 0.7);
    vigGrad.addColorStop(0, 'transparent');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);

    animRef.current = requestAnimationFrame(draw);
  }, [session, currentMessageIndex, messageProgress, width, height]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)' }}
    />
  );
}

function drawAgentWithEffects(
  ctx: CanvasRenderingContext2D,
  agent: ReturnType<typeof getAgentVisual>,
  seat: SeatInfo,
  time: number,
  isSpeaking: boolean,
  dimFactor: number
) {
  ctx.save();

  // Spotlight for speaking agent
  if (isSpeaking) {
    const spotGrad = ctx.createRadialGradient(seat.x, seat.y - 10, 0, seat.x, seat.y - 10, 50 * seat.scale);
    spotGrad.addColorStop(0, agent.neonColor + '25');
    spotGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.arc(seat.x, seat.y - 10, 50 * seat.scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dim non-speaking agents
  if (dimFactor < 1) {
    ctx.globalAlpha = dimFactor;
  }

  drawSeatedAgent(
    ctx,
    agent,
    seat.x,
    seat.y,
    time,
    seat.facing,
    isSpeaking,
    seat.scale
  );

  ctx.restore();
}

function getSeatingPositions(
  count: number,
  canvasWidth: number,
  canvasHeight: number
): SeatInfo[] {
  switch (count) {
    case 2:
      return [
        { x: canvasWidth * 0.25, y: canvasHeight * 0.60, facing: 'right', scale: 0.90, position: 'left' },
        { x: canvasWidth * 0.75, y: canvasHeight * 0.60, facing: 'left', scale: 0.90, position: 'right' },
      ];
    case 3:
      return [
        { x: canvasWidth * 0.20, y: canvasHeight * 0.62, facing: 'right', scale: 0.85, position: 'left' },
        { x: canvasWidth * 0.80, y: canvasHeight * 0.62, facing: 'left', scale: 0.85, position: 'right' },
        { x: canvasWidth * 0.50, y: canvasHeight * 0.22, facing: 'forward', scale: 0.70, position: 'top' },
      ];
    case 4:
      return [
        { x: canvasWidth * 0.18, y: canvasHeight * 0.50, facing: 'right', scale: 0.80, position: 'left' },
        { x: canvasWidth * 0.82, y: canvasHeight * 0.50, facing: 'left', scale: 0.80, position: 'right' },
        { x: canvasWidth * 0.50, y: canvasHeight * 0.18, facing: 'forward', scale: 0.65, position: 'top' },
        { x: canvasWidth * 0.50, y: canvasHeight * 0.78, facing: 'forward', scale: 0.95, position: 'bottom' },
      ];
    default:
      return [
        { x: canvasWidth * 0.25, y: canvasHeight * 0.60, facing: 'right', scale: 0.90, position: 'left' },
        { x: canvasWidth * 0.75, y: canvasHeight * 0.60, facing: 'left', scale: 0.90, position: 'right' },
      ];
  }
}
