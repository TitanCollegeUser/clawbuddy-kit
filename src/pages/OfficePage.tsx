import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOffices } from '@/hooks/useOffices';
import { useOfficeAgents } from '@/hooks/useOfficeAgents';
import { useOfficeTasks } from '@/hooks/useOfficeTasks';
import { useOfficeActivityLog } from '@/hooks/useOfficeActivityLog';
import { OfficeCanvas } from '@/components/workspace/canvas/OfficeCanvas';
import { OfficePanel } from '@/components/workspace/OfficePanel';
import { AgentSkillCardModal } from '@/components/workspace/AgentSkillCardModal';
import { useSimulationEngine } from '@/components/workspace/canvas/useSimulationEngine';
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { createPath } from '@/components/workspace/canvas/pathfinding';
import type { OfficeAgent } from '@/hooks/useOfficeAgents';
import {
  DIRECTOR_DESK, DESK_POSITIONS_ROW1, DESK_POSITIONS_ROW2,
  WATER_COOLER, COFFEE_MACHINE, CONFERENCE_SEATS,
} from '@/components/workspace/canvas/constants';

const ALL_DESKS = [...DESK_POSITIONS_ROW1, ...DESK_POSITIONS_ROW2];

export const OfficePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  // Realtime subscriptions for API mode
  useEffect(() => {
    if (!id || !apiMode) return;

    // Subscribe to office_agents changes (new agents, status/thought updates)
    const agentsChannel = supabase
      .channel(`office-agents-rt-${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'office_agents',
        filter: `office_id=eq.${id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Refetch agents so new agent appears
          queryClient.invalidateQueries({ queryKey: ['office-agents', id] });
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Record<string, unknown>;
          const state = stateRef.current;
          const sprite = state.agents.find(a => a.id === updated.id);
          if (sprite) {
            // Update status
            if (updated.status && typeof updated.status === 'string') {
              const validStatuses = ['idle', 'working', 'walking', 'delegating', 'collecting', 'coffee', 'water', 'meeting'];
              if (validStatuses.includes(updated.status)) {
                sprite.status = updated.status as typeof sprite.status;
              }
            }
            // Update thought
            if (updated.current_thought !== undefined) {
              sprite.thought = updated.current_thought as string | null;
              if (sprite.thought) {
                sprite.thoughtOpacity = 0;
                sprite.thoughtTimer = 5;
              }
            }
          }
          // Also refetch for sidebar data
          queryClient.invalidateQueries({ queryKey: ['office-agents', id] });
        } else if (payload.eventType === 'DELETE') {
          queryClient.invalidateQueries({ queryKey: ['office-agents', id] });
        }
      })
      .subscribe();

    // Subscribe to office_events (drive animations)
    const eventsChannel = supabase
      .channel(`office-events-rt-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'office_events',
        filter: `office_id=eq.${id}`,
      }, (payload) => {
        const event = payload.new as Record<string, unknown>;
        const eventType = event.event_type as string;
        const agentName = event.agent_name as string;
        const eventPayload = (event.payload || {}) as Record<string, unknown>;
        const state = stateRef.current;
        const sprite = state.agents.find(a => a.name === agentName);
        if (!sprite) return;

        switch (eventType) {
          case 'delegation': {
            const targetName = eventPayload.target_agent as string || event.target_agent as string;
            const targetSprite = state.agents.find(a => a.name === targetName);
            if (targetSprite) {
              sprite.waypoints = createPath(sprite.position, targetSprite.deskPosition);
              sprite.waypointIndex = 0;
              sprite.status = 'delegating';
            }
            break;
          }
          case 'movement': {
            const target = eventPayload.target as string;
            let dest = sprite.deskPosition;
            if (target === 'water_cooler') dest = WATER_COOLER;
            else if (target === 'coffee_machine') dest = COFFEE_MACHINE;
            else if (target === 'conference') dest = CONFERENCE_SEATS[0];
            else if (target === 'desk') dest = sprite.deskPosition;
            else if (target === 'director') dest = DIRECTOR_DESK;
            else {
              // Target could be another agent name
              const targetAgent = state.agents.find(a => a.name === target);
              if (targetAgent) dest = targetAgent.deskPosition;
            }
            sprite.waypoints = createPath(sprite.position, dest);
            sprite.waypointIndex = 0;
            break;
          }
          case 'task_start': {
            sprite.waypoints = createPath(sprite.position, sprite.deskPosition);
            sprite.waypointIndex = 0;
            // Status will be set to working once arrived
            setTimeout(() => {
              sprite.status = 'working';
              sprite.facing = 'up';
            }, 2000);
            break;
          }
          case 'task_complete': {
            sprite.showCheckmark = true;
            sprite.checkmarkTimer = 3;
            sprite.status = 'idle';
            queryClient.invalidateQueries({ queryKey: ['office-tasks', id] });
            break;
          }
          case 'collection': {
            const collectTarget = eventPayload.target_agent as string;
            const collectSprite = state.agents.find(a => a.name === collectTarget);
            if (collectSprite) {
              sprite.waypoints = createPath(sprite.position, collectSprite.deskPosition);
              sprite.waypointIndex = 0;
              sprite.status = 'collecting';
              // After arriving, return to desk
              setTimeout(() => {
                sprite.waypoints = createPath(sprite.position, sprite.deskPosition);
                sprite.waypointIndex = 0;
              }, 4000);
            }
            break;
          }
          default:
            break;
        }

        // Refetch events
        queryClient.invalidateQueries({ queryKey: ['office-events', id] });
        queryClient.invalidateQueries({ queryKey: ['office-activity-log', id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(agentsChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [id, apiMode, queryClient, stateRef]);

  const handlePauseToggle = useCallback(() => {
    setIsPausedState(prev => {
      const next = !prev;
      setPaused(next);
      return next;
    });
  }, [setPaused]);

  const handleSpeedChange = useCallback((s: number) => {
    setSpeedState(s);
    setSpeed(s);
  }, [setSpeed]);

  const handleAgentClick = useCallback((agentId: string) => {
    const dbAgent = agents.find(a => a.id === agentId);
    if (dbAgent) {
      setSelectedAgent(dbAgent);
    }
  }, [agents]);

  if (!office) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading office...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-1px)] overflow-hidden">
      {/* Compact header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 bg-card/50 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/workspace')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
          style={{ backgroundColor: office.director_color + '33', border: `1.5px solid ${office.director_color}` }}
        >
          {office.director_species === 'fox' ? '🦊' : office.director_species === 'wolf' ? '🐺' : office.director_species === 'owl' ? '🦉' : '🐻'}
        </div>
        <h1 className="text-sm font-semibold text-foreground">{office.name}</h1>
        <span className="text-xs text-muted-foreground ml-auto">
          {agents.length} agent{agents.length !== 1 ? 's' : ''} • Director: {office.director_name}
        </span>
      </div>

      {/* Canvas + Side Panel */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 bg-[#06060e]">
          <OfficeCanvas
            stateRef={stateRef}
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
          apiMode={apiMode}
          onPauseToggle={handlePauseToggle}
          onSpeedChange={handleSpeedChange}
          onApiModeChange={setApiMode}
        />
      </div>

      {/* Agent ID Card Modal */}
      <AgentSkillCardModal
        agent={selectedAgent}
        open={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
};
