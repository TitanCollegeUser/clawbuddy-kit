import { useRef, useEffect, useCallback } from 'react';
import { drawPipelineAgent } from './drawPipelineAgent';
import { drawStation } from './drawStation';
import { drawFloor } from './drawCouncilTable';
import { getAgentVisual, PIPELINE_PHASES } from './agentVisuals';
import { PipelineState } from './types';

interface PipelineCanvasProps {
  state: PipelineState;
  width: number;
  height: number;
}

export function PipelineCanvas({ state, width, height }: PipelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const agentXRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

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
    const stationCount = PIPELINE_PHASES.length;
    const stationSpacing = (width - 100) / (stationCount - 1);
    const stationStartX = 50;
    const stationY = height * 0.55;
    const floorY = height * 0.75;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#06080d');
    bg.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Ambient glow
    const ambient = ctx.createRadialGradient(width / 2, height * 0.3, 0, width / 2, height * 0.3, width * 0.6);
    ambient.addColorStop(0, 'rgba(16, 185, 129, 0.03)');
    ambient.addColorStop(1, 'transparent');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, width, height);

    // Floor
    drawFloor(ctx, width, height, floorY);

    // Connection lines between stations (dotted)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    for (let i = 0; i < stationCount - 1; i++) {
      const x1 = stationStartX + i * stationSpacing;
      const x2 = stationStartX + (i + 1) * stationSpacing;
      ctx.beginPath();
      ctx.moveTo(x1 + 22, stationY + 4);
      ctx.lineTo(x2 - 22, stationY + 4);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Completed progress line (emerald glow)
    if (state.currentPhaseIndex > 0) {
      const progressEndX = stationStartX + (state.currentPhaseIndex - (state.isActive ? 0.2 : 0)) * stationSpacing;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(stationStartX, stationY + 4);
      ctx.lineTo(Math.min(progressEndX, stationStartX + (stationCount - 1) * stationSpacing), stationY + 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw stations
    PIPELINE_PHASES.forEach((phase, i) => {
      const sx = stationStartX + i * stationSpacing;
      let stationState: 'completed' | 'current' | 'pending';
      if (i < state.currentPhaseIndex) stationState = 'completed';
      else if (i === state.currentPhaseIndex && state.isActive) stationState = 'current';
      else stationState = 'pending';

      drawStation(ctx, sx, stationY, phase, stationState, time, 1);
    });

    // Agent
    const agent = getAgentVisual(state.agentName);
    const targetX = stationStartX + state.currentPhaseIndex * stationSpacing;

    // Smooth lerp movement
    const diff = targetX - agentXRef.current;
    if (Math.abs(diff) > 1) {
      agentXRef.current += diff * 0.08;
    } else {
      agentXRef.current = targetX;
    }

    const isWalking = Math.abs(diff) > 2;
    const isWorking = !isWalking && state.isActive;
    const currentPhaseId = state.isActive ? PIPELINE_PHASES[state.currentPhaseIndex]?.id : undefined;

    drawPipelineAgent(ctx, agent, agentXRef.current, stationY - 15, time, isWalking, isWorking, 1.2, currentPhaseId);

    // Dispatcher if present
    if (state.dispatcherName) {
      const dispatcher = getAgentVisual(state.dispatcherName);
      drawPipelineAgent(ctx, dispatcher, stationStartX - 10, stationY - 10, time, false, false, 0.9);

      ctx.fillStyle = dispatcher.neonColor + '80';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DISPATCH', stationStartX - 10, stationY + 22);
    }

    // Idle overlay
    if (!state.isActive && state.status === 'idle') {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(107, 114, 128, 0.7)';
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for /autopilot', width / 2, height / 2 - 20);
    }

    // Status bar
    if (state.isActive) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Phase: ${PIPELINE_PHASES[state.currentPhaseIndex]?.stationDescription || '???'}`, 10, 18);
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(state.percentComplete)}%`, width - 10, 18);

      // Progress bar
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.fillRect(10, 24, width - 20, 4);
      const gradBar = ctx.createLinearGradient(10, 0, 10 + (width - 20) * (state.percentComplete / 100), 0);
      gradBar.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
      gradBar.addColorStop(1, 'rgba(6, 182, 212, 0.6)');
      ctx.fillStyle = gradBar;
      ctx.fillRect(10, 24, (width - 20) * (state.percentComplete / 100), 4);
    }

    // Vignette
    const vigGrad = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.65);
    vigGrad.addColorStop(0, 'transparent');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);

    animRef.current = requestAnimationFrame(draw);
  }, [state, width, height]);

  useEffect(() => {
    agentXRef.current = 50 + state.currentPhaseIndex * ((width - 100) / 7);
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
      }}
    />
  );
}
