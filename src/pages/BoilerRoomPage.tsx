import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOffices } from '@/hooks/useOffices';
import { useOfficeAgents } from '@/hooks/useOfficeAgents';
import { useOfficeTasks } from '@/hooks/useOfficeTasks';
import { useOfficeActivityLog } from '@/hooks/useOfficeActivityLog';
import { OfficePanel } from '@/components/workspace/OfficePanel';
import { AgentSkillCardModal } from '@/components/workspace/AgentSkillCardModal';
import { useSimulationEngine } from '@/components/workspace/canvas/useSimulationEngine';
import { BoilerRoomCanvas } from '@/components/workspace/canvas/BoilerRoomCanvas';
import { useState, useCallback } from 'react';
import type { OfficeAgent } from '@/hooks/useOfficeAgents';

export const BoilerRoomPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: offices } = useOffices();
  const { data: agents = [] } = useOfficeAgents(id || '');
  const { data: tasks = [] } = useOfficeTasks(id || '');
  const { data: activityLog = [] } = useOfficeActivityLog(id || '');

  const [apiMode, setApiMode] = useState(false);
  const [isPaused, setIsPausedState] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<OfficeAgent | null>(null);

  const office = offices?.find(o => o.id === id) || null;
  const { stateRef, setSpeed, setPaused } = useSimulationEngine(office, agents, apiMode);

  const handlePauseToggle = useCallback(() => {
    setIsPausedState(prev => { const next = !prev; setPaused(next); return next; });
  }, [setPaused]);

  const handleSpeedChange = useCallback((s: number) => {
    setSpeedState(s); setSpeed(s);
  }, [setSpeed]);

  const handleAgentClick = useCallback((agentId: string) => {
    const dbAgent = agents.find(a => a.id === agentId);
    if (dbAgent) setSelectedAgent(dbAgent);
  }, [agents]);

  if (!office) {
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Loading boiler room...</p></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-1px)] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 bg-card/50 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/workspace')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Flame className="h-4 w-4 text-orange-400" />
        <h1 className="text-sm font-semibold text-foreground">{office.name}</h1>
        <span className="text-xs text-muted-foreground ml-auto">
          Boiler Room • {agents.length} agents
        </span>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 bg-[#06060e]">
          <BoilerRoomCanvas stateRef={stateRef} onAgentClick={handleAgentClick} />
        </div>
        <OfficePanel
          office={office}
          dbAgents={agents}
          tasks={tasks}
          activityLog={activityLog}
          stateRef={stateRef}
          isPaused={isPaused}
          speed={speed}
          apiMode={apiMode}
          onPauseToggle={handlePauseToggle}
          onSpeedChange={handleSpeedChange}
          onApiModeChange={setApiMode}
        />
      </div>

      <AgentSkillCardModal
        agent={selectedAgent}
        open={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
};
