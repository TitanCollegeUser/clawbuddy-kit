import { useRef, useCallback, useEffect } from 'react';
import { BOILER_W, BOILER_H } from './arenaConstants';
import { drawBoilerRoom } from './drawBoilerRoom';
import { drawAgents } from './drawAgents';
import type { SimulationState } from './types';

export function useBoilerRoomRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  stateRef: React.MutableRefObject<SimulationState>
) {
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const render = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      animFrameRef.current = requestAnimationFrame(render);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
    const rawDt = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;
    const dt = Math.min(rawDt, 0.05) * stateRef.current.speedMultiplier;

    if (!stateRef.current.isPaused) {
      stateRef.current.time += dt;
      stateRef.current.deltaTime = dt;
    }

    const containerW = canvas.clientWidth;
    const containerH = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerW * dpr;
    canvas.height = containerH * dpr;

    const scaleX = containerW / BOILER_W;
    const scaleY = containerH / BOILER_H;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (containerW - BOILER_W * scale) / 2;
    const offsetY = (containerH - BOILER_H * scale) / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, containerW, containerH);
    ctx.fillStyle = '#06060e';
    ctx.fillRect(0, 0, containerW, containerH);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const state = stateRef.current;
    drawBoilerRoom(ctx, state.time, state.agents);
    drawAgents(ctx, state.agents, state.trailDots, state.time);

    ctx.restore();
    animFrameRef.current = requestAnimationFrame(render);
  }, [canvasRef, stateRef]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  const screenToVirtual = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    const containerW = canvas.clientWidth;
    const containerH = canvas.clientHeight;
    const scaleX = containerW / BOILER_W;
    const scaleY = containerH / BOILER_H;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (containerW - BOILER_W * scale) / 2;
    const offsetY = (containerH - BOILER_H * scale) / 2;
    return {
      x: (canvasX - offsetX) / scale,
      y: (canvasY - offsetY) / scale,
    };
  }, [canvasRef]);

  return { screenToVirtual };
}
