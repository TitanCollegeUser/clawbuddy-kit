import { useEffect, useState, useRef } from 'react';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { OfficeTaskCard } from './OfficeTaskCard';
import { AgentRoster } from './AgentRoster';
import { OfficeActivityLog } from './OfficeActivityLog';
import { OfficeControls } from './OfficeControls';
import type { SimulationState } from './canvas/types';
import type { Office } from '@/hooks/useOffices';
import type { OfficeAgent } from '@/hooks/useOfficeAgents';
import type { OfficeTask } from '@/hooks/useOfficeTasks';
import type { OfficeActivityLogEntry } from '@/hooks/useOfficeActivityLog';

interface OfficePanelProps {
  office: Office;
  dbAgents: OfficeAgent[];
  tasks: OfficeTask[];
  activityLog: OfficeActivityLogEntry[];
  stateRef: React.RefObject<SimulationState>;
  isPaused: boolean;
  speed: number;
  apiMode: boolean;
  onPauseToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onApiModeChange: (enabled: boolean) => void;
}

export const OfficePanel = ({
  office,
  dbAgents,
  tasks,
  activityLog,
  stateRef,
  isPaused,
  speed,
  apiMode,
  onPauseToggle,
  onSpeedChange,
  onApiModeChange,
}: OfficePanelProps) => {
  const navigate = useNavigate();
  const [sprites, setSprites] = useState(stateRef.current?.agents || []);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Poll simulation state for sprite data
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (stateRef.current) {
        setSprites([...stateRef.current.agents]);
      }
    }, 200);
    return () => clearInterval(intervalRef.current);
  }, [stateRef]);

  const activeTask = tasks.find(t => t.status === 'in_progress') || null;

  return (
    <div className="w-72 lg:w-80 h-full bg-card/80 border-l border-border/30 flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/20">
        <h2 className="text-xs font-semibold text-foreground truncate">{office.name}</h2>
        <p className="text-[10px] text-muted-foreground">
          Director: {office.director_name} • {dbAgents.length} agents
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-custom px-3 py-2 space-y-3">
        {/* Active Task */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Current Task</p>
          <OfficeTaskCard task={activeTask} />
        </div>

        <Separator className="opacity-20" />

        {/* Agent Roster */}
        <AgentRoster sprites={sprites} dbAgents={dbAgents} />

        <Separator className="opacity-20" />

        {/* Activity Log */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Activity Log</p>
          <OfficeActivityLog entries={activityLog} />
        </div>

        <Separator className="opacity-20" />

        {/* Controls */}
        <OfficeControls
          isPaused={isPaused}
          speed={speed}
          apiMode={apiMode}
          onPauseToggle={onPauseToggle}
          onSpeedChange={onSpeedChange}
          onApiModeChange={onApiModeChange}
        />
      </div>

      {/* Footer nav */}
      <div className="px-3 py-2 border-t border-border/20">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-[10px]"
          onClick={() => navigate(`/workspace/office/${office.id}/work`)}
        >
          <Briefcase className="h-3 w-3 mr-1.5" />
          Office Work
        </Button>
      </div>
    </div>
  );
};
