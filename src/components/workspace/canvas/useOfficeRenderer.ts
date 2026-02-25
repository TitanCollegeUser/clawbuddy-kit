import { useRef, useCallback, useEffect } from 'react';
import { CANVAS_W, CANVAS_H } from './constants';
import { drawOffice } from './drawOffice';
import { drawProps } from './drawProps';
import { drawAgents } from './drawAgents';
import type { SimulationState } from './types';

export function useOfficeRenderer(
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

    // Calculate delta
    if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
    const rawDt = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;
    const dt = Math.min(rawDt, 0.05) * stateRef.current.speedMultiplier;

    if (!stateRef.current.isPaused) {
      stateRef.current.time += dt;
      stateRef.current.deltaTime = dt;
    }

    // Scale canvas to fit container while maintaining aspect ratio
    const containerW = canvas.clientWidth;
    const containerH = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerW * dpr;
    canvas.height = containerH * dpr;

    const scaleX = containerW / CANVAS_W;
    const scaleY = containerH / CANVAS_H;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (containerW - CANVAS_W * scale) / 2;
    const offsetY = (containerH - CANVAS_H * scale) / 2;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, containerW, containerH);

    // Background fill for letterboxing
    ctx.fillStyle = '#06060e';
    ctx.fillRect(0, 0, containerW, containerH);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw layers
    const state = stateRef.current;
    drawOffice(ctx, state.time, state.agents);
    drawProps(ctx, state.time, state.dustParticles, state.steamParticles);
    drawAgents(ctx, state.agents, state.trailDots, state.time);

    ctx.restore();

    animFrameRef.current = requestAnimationFrame(render);
  }, [canvasRef, stateRef]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  // Returns a function to convert screen coords to virtual coords
  const screenToVirtual = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    const containerW = canvas.clientWidth;
    const containerH = canvas.clientHeight;
    const scaleX = containerW / CANVAS_W;
    const scaleY = containerH / CANVAS_H;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (containerW - CANVAS_W * scale) / 2;
    const offsetY = (containerH - CANVAS_H * scale) / 2;

    return {
      x: (canvasX - offsetX) / scale,
      y: (canvasY - offsetY) / scale,
    };
  }, [canvasRef]);

  return { screenToVirtual };
}
