import { useRef, useCallback } from 'react';
import { useArenaRenderer } from './useArenaRenderer';
import type { SimulationState } from './types';
import type { ArenaScoreData } from './drawArena';

interface ArenaCanvasProps {
  stateRef: React.MutableRefObject<SimulationState>;
  scoreDataRef: React.MutableRefObject<ArenaScoreData | null>;
  bellRingRef: React.MutableRefObject<number>;
  onAgentClick?: (agentId: string) => void;
}

export const ArenaCanvas = ({ stateRef, scoreDataRef, bellRingRef, onAgentClick }: ArenaCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { screenToVirtual } = useArenaRenderer(canvasRef, stateRef, scoreDataRef, bellRingRef);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onAgentClick) return;
    const virt = screenToVirtual(e.clientX, e.clientY);
    const state = stateRef.current;
    for (const agent of state.agents) {
      const dx = agent.position.x - virt.x;
      const dy = agent.position.y - virt.y;
      if (Math.sqrt(dx * dx + dy * dy) < 50) {
        onAgentClick(agent.id);
        break;
      }
    }
  }, [onAgentClick, screenToVirtual, stateRef]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-pointer"
      onClick={handleClick}
      style={{ display: 'block' }}
    />
  );
};
