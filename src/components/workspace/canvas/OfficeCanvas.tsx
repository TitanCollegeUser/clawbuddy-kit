import { useRef, useCallback } from 'react';
import { useOfficeRenderer } from './useOfficeRenderer';
import type { SimulationState } from './types';

interface OfficeCanvasProps {
  stateRef: React.MutableRefObject<SimulationState>;
  onAgentClick?: (agentId: string) => void;
}

export const OfficeCanvas = ({ stateRef, onAgentClick }: OfficeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { screenToVirtual } = useOfficeRenderer(canvasRef, stateRef);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
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
      onClick={handleCanvasClick}
      style={{ display: 'block' }}
    />
  );
};
