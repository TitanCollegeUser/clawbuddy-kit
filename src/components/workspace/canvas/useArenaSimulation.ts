import { useRef, useEffect, useCallback } from 'react';
import type { SimulationState, AgentSprite, DustParticle } from './types';
import type { OfficeAgent } from '@/hooks/useOfficeAgents';
import {
  ARENA_DESK_A, ARENA_DESK_B, ARENA_BELL,
  ARENA_AGENT_SPEED, ARENA_W, ARENA_H,
} from './arenaConstants';
import { SPECIES_PALETTES } from './constants';
import { moveToward } from './pathfinding';

function createArenaSprite(
  agent: OfficeAgent,
  side: 'A' | 'B'
): AgentSprite {
  const desk = side === 'A' ? ARENA_DESK_A : ARENA_DESK_B;
  const deskFacing: 'left' | 'right' = side === 'A' ? 'right' : 'left';

  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    species: agent.species as AgentSprite['species'],
    isDirector: false,
    neonColor: agent.neon_color,
    furColor: agent.fur_color,
    furHighlight: agent.fur_highlight,
    suitColor: agent.suit_color,
    deskFacing,
    deskPosition: { ...desk },
    position: { ...desk },
    targetPosition: null,
    waypoints: [],
    waypointIndex: 0,
    facing: deskFacing,
    status: 'idle',
    thought: null,
    thoughtOpacity: 0,
    thoughtTimer: 0,
    walkCycle: 0,
    earTwitchTimer: Math.random() * 5 + 2,
    earTwitchAmount: 0,
    glowPulse: 0,
    showCheckmark: false,
    checkmarkTimer: 0,
  };
}

export function useArenaSimulation(
  agents: OfficeAgent[]
) {
  const stateRef = useRef<SimulationState>({
    agents: [],
    dustParticles: [],
    trailDots: [],
    time: 0,
    deltaTime: 0,
    speedMultiplier: 1,
    isPaused: false,
    whiteboardScribblePhase: 0,
    steamParticles: [],
    tvBarPhase: 0,
  });

  // Sync agents (exactly 2 for arena)
  useEffect(() => {
    const state = stateRef.current;
    const existingIds = new Set(state.agents.map(a => a.id));
    const newAgents: AgentSprite[] = [];

    agents.slice(0, 2).forEach((agent, i) => {
      const side = i === 0 ? 'A' : 'B';
      if (existingIds.has(agent.id)) {
        newAgents.push(state.agents.find(a => a.id === agent.id)!);
      } else {
        newAgents.push(createArenaSprite(agent, side as 'A' | 'B'));
      }
    });

    state.agents = newAgents;
  }, [agents]);

  // Tick loop
  useEffect(() => {
    let lastTick = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - lastTick) / 1000, 0.05) * stateRef.current.speedMultiplier;
      lastTick = now;
      if (stateRef.current.isPaused) return;

      const state = stateRef.current;

      state.agents.forEach(agent => {
        agent.glowPulse += dt * 3;

        // Ear twitch
        agent.earTwitchTimer -= dt;
        if (agent.earTwitchTimer <= 0) {
          agent.earTwitchAmount = (Math.random() - 0.5) * 3;
          agent.earTwitchTimer = Math.random() * 5 + 2;
          setTimeout(() => { agent.earTwitchAmount = 0; }, 200);
        }

        // Thought fade
        if (agent.thought) {
          agent.thoughtTimer -= dt;
          if (agent.thoughtTimer > 0) {
            agent.thoughtOpacity = Math.min(1, agent.thoughtOpacity + dt / 0.3);
          } else {
            agent.thoughtOpacity -= dt / 0.3;
            if (agent.thoughtOpacity <= 0) {
              agent.thought = null;
              agent.thoughtOpacity = 0;
            }
          }
        }

        // Checkmark
        if (agent.showCheckmark) {
          agent.checkmarkTimer -= dt;
          if (agent.checkmarkTimer <= 0) agent.showCheckmark = false;
        }

        // Movement
        if (agent.waypoints.length > 0 && agent.waypointIndex < agent.waypoints.length) {
          agent.status = 'walking';
          agent.walkCycle += dt;
          const target = agent.waypoints[agent.waypointIndex];
          const { reached, facing } = moveToward(agent.position, target, ARENA_AGENT_SPEED, dt);
          agent.facing = facing;

          if (reached) {
            agent.waypointIndex++;
            if (agent.waypointIndex >= agent.waypoints.length) {
              agent.waypoints = [];
              agent.waypointIndex = 0;
              agent.status = 'idle';
              agent.facing = agent.deskFacing;
            }
          }
        }
      });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, []);

  // Trigger bell ring: agent walks to bell, then back
  const triggerBellRing = useCallback((agentName: string) => {
    const state = stateRef.current;
    const sprite = state.agents.find(a => a.name === agentName);
    if (!sprite) return;

    // Walk to bell
    sprite.waypoints = [{ ...ARENA_BELL }];
    sprite.waypointIndex = 0;

    // After a delay, return to desk
    setTimeout(() => {
      sprite.waypoints = [{ ...sprite.deskPosition }];
      sprite.waypointIndex = 0;
    }, 3000);
  }, []);

  const setSpeed = useCallback((m: number) => { stateRef.current.speedMultiplier = m; }, []);
  const setPaused = useCallback((p: boolean) => { stateRef.current.isPaused = p; }, []);

  return { stateRef, setSpeed, setPaused, triggerBellRing };
}
