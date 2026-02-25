import { useRef, useCallback } from 'react';
import { useBoilerRoomRenderer } from './useBoilerRoomRenderer';
import type { SimulationState } from './types';

interface BoilerRoomCanvasProps {
  stateRef: React.MutableRefObject<SimulationState>;
  onAgentClick?: (agentId: string) => void;
}

export const BoilerRoomCanvas = ({ stateRef, onAgentClick }: BoilerRoomCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { screenToVirtual } = useBoilerRoomRenderer(canvasRef, stateRef);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onAgentClick) return;
    const virt = screenToVirtual(e.clientX, e.clientY);
    const state = stateRef.current;
    for (const agent of state.agents) {
      const dx = agent.position.x - virt.x;
      const dy = agent.position.y - virt.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
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
