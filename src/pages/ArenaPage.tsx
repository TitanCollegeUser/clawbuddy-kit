import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOffices } from '@/hooks/useOffices';
import { useOfficeAgents } from '@/hooks/useOfficeAgents';
import { useOfficeActivityLog } from '@/hooks/useOfficeActivityLog';
import { useOfficeTasks } from '@/hooks/useOfficeTasks';
import { ArenaCanvas } from '@/components/workspace/canvas/ArenaCanvas';
import { OfficePanel } from '@/components/workspace/OfficePanel';
import { AgentSkillCardModal } from '@/components/workspace/AgentSkillCardModal';
import { useArenaSimulation } from '@/components/workspace/canvas/useArenaSimulation';
import { useArenaScoreboard, useArenaCategories, useArenaScores } from '@/hooks/useArenaScoreboard';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { OfficeAgent } from '@/hooks/useOfficeAgents';
import type { ArenaScoreData } from '@/components/workspace/canvas/drawArena';

export const ArenaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: offices } = useOffices();
  const { data: agents = [] } = useOfficeAgents(id || '');
  const { data: tasks = [] } = useOfficeTasks(id || '');
  const { data: activityLog = [] } = useOfficeActivityLog(id || '');
  const { data: scoreboard } = useArenaScoreboard(id || '');
  const { data: categories = [] } = useArenaCategories(scoreboard?.id);
  const categoryIds = useMemo(() => categories.map(c => c.id), [categories]);
  const { data: scores = [] } = useArenaScores(categoryIds);

  const [isPaused, setIsPausedState] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<OfficeAgent | null>(null);

  const office = offices?.find(o => o.id === id) || null;
  const { stateRef, setSpeed, setPaused, triggerBellRing } = useArenaSimulation(agents);

  const bellRingRef = useRef(0);

  // Build score data for canvas
  const scoreDataRef = useRef<ArenaScoreData | null>(null);
  useEffect(() => {
    if (!scoreboard || agents.length < 2) {
      scoreDataRef.current = null;
      return;
    }

    const primaryCat = categories.find(c => c.is_primary);
    const agentA = agents[0];
    const agentB = agents[1];

    const getTotal = (catId: string, agentName: string) =>
      scores.filter(s => s.category_id === catId && s.agent_name === agentName)
        .reduce((sum, s) => sum + Number(s.value), 0);

    scoreDataRef.current = {
      agentAName: agentA.name,
      agentBName: agentB.name,
      agentAScore: primaryCat ? getTotal(primaryCat.id, agentA.name) : 0,
      agentBScore: primaryCat ? getTotal(primaryCat.id, agentB.name) : 0,
      primaryMetric: scoreboard.primary_metric_name,
      primaryUnit: scoreboard.primary_metric_unit,
      categories: categories.filter(c => !c.is_primary).map(cat => ({
        name: cat.name,
        agentAValue: getTotal(cat.id, agentA.name),
        agentBValue: getTotal(cat.id, agentB.name),
      })),
    };
  }, [scoreboard, categories, scores, agents]);

  // Realtime for arena_scores
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`arena-scores-rt-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'arena_scores',
      }, (payload) => {
        const score = payload.new as Record<string, unknown>;
        const catId = score.category_id as string;
        const agentName = score.agent_name as string;

        // Check if primary category
        const primaryCat = categories.find(c => c.is_primary);
        if (primaryCat && catId === primaryCat.id) {
          bellRingRef.current = 1;
          triggerBellRing(agentName);
        }

        queryClient.invalidateQueries({ queryKey: ['arena-scores'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, categories, triggerBellRing, queryClient]);

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
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Loading arena...</p></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-1px)] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 bg-card/50 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/workspace')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Swords className="h-4 w-4 text-red-400" />
        <h1 className="text-sm font-semibold text-foreground">{office.name}</h1>
        <span className="text-xs text-muted-foreground ml-auto">
          Arena • {agents.length} agents
        </span>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 bg-[#06060e]">
          <ArenaCanvas
            stateRef={stateRef}
            scoreDataRef={scoreDataRef}
            bellRingRef={bellRingRef}
            onAgentClick={handleAgentClick}
          />
        </div>
        <OfficePanel
          office={office}
          dbAgents={agents}
          tasks={tasks}
          activityLog={activityLog}
          stateRef={stateRef}
          isPaused={isPaused}
          speed={speed}
          apiMode={true}
          onPauseToggle={handlePauseToggle}
          onSpeedChange={handleSpeedChange}
          onApiModeChange={() => {}}
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
