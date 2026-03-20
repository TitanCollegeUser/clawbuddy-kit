import { useState, useEffect, useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { PipelineCanvas } from './PipelineCanvas';
import { PipelineState } from './types';
import type { ActiveAutopilotState } from '@/hooks/useActiveAutopilot';

interface AnimatedPipelineProps {
  autopilot: ActiveAutopilotState;
}

/**
 * Animated pipeline canvas that visualizes the autonomous assignment pipeline.
 * Receives live autopilot state from the parent and renders the 2D animated office.
 * Toggle between canvas animation and the default phase dots view.
 */
export function AnimatedPipeline({ autopilot }: AnimatedPipelineProps) {
  const [animated, setAnimated] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800);

  // Map ActiveAutopilotState → PipelineState for the canvas
  const pipelineState: PipelineState = useMemo(() => ({
    currentPhaseIndex: autopilot.currentPhaseIndex,
    isActive: autopilot.isActive,
    status: autopilot.status === 'running' ? 'active'
      : autopilot.status === 'idle' ? 'idle'
      : autopilot.status === 'completed' ? 'completed'
      : autopilot.status === 'failed' ? 'failed'
      : 'idle',
    percentComplete: autopilot.percentComplete ?? 0,
    agentName: 'Sherlock',
    dispatcherName: 'Ray',
  }), [autopilot.currentPhaseIndex, autopilot.isActive, autopilot.status, autopilot.percentComplete]);

  // Responsive width
  useEffect(() => {
    const handleResize = () => {
      const w = Math.min(800, window.innerWidth - 64);
      setContainerWidth(w);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="mt-2">
      {/* Toggle */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <span className="text-xs text-muted-foreground font-mono">🎮 Animate</span>
        <Switch checked={animated} onCheckedChange={setAnimated} />
      </div>

      {animated && (
        <PipelineCanvas state={pipelineState} width={containerWidth} height={250} />
      )}
    </div>
  );
}
