import { useRef, useEffect, useCallback } from 'react';
import type { SimulationState, AgentSprite, DustParticle } from './types';
import type { OfficeAgent } from '@/hooks/useOfficeAgents';
import type { Office } from '@/hooks/useOffices';
import {
  DIRECTOR_DESK, DESK_POSITIONS_ROW1, DESK_POSITIONS_ROW2,
  MAX_DUST_PARTICLES, CANVAS_W, CANVAS_H,
  WATER_COOLER, COFFEE_MACHINE, CONFERENCE_SEATS,
  AGENT_SPEED, SPECIES_PALETTES,
} from './constants';
import { createPath, moveToward } from './pathfinding';

function createAgentSprite(
  agent: OfficeAgent,
  index: number,
  isDirector: boolean,
  directorColor?: string
): AgentSprite {
  const allDesks = [...DESK_POSITIONS_ROW1, ...DESK_POSITIONS_ROW2];
  const deskPos = isDirector
    ? DIRECTOR_DESK
    : (agent.desk_position_x !== 0 && agent.desk_position_y !== 0)
      ? { x: agent.desk_position_x, y: agent.desk_position_y }
      : allDesks[index % allDesks.length];

  // Director faces right (office is on left), sub-agents face left
  const deskFacing: 'left' | 'right' = isDirector ? 'right' : 'left';

  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    species: agent.species as AgentSprite['species'],
    isDirector,
    neonColor: isDirector ? (directorColor || agent.neon_color) : agent.neon_color,
    furColor: agent.fur_color,
    furHighlight: agent.fur_highlight,
    suitColor: agent.suit_color,
    deskFacing,
    deskPosition: { ...deskPos },
    position: { ...deskPos },
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

function createDirectorFromOffice(office: Office): AgentSprite {
  const palette = SPECIES_PALETTES[office.director_species] || SPECIES_PALETTES.fox;
  return {
    id: 'director-' + office.id,
    name: office.director_name,
    role: 'Director',
    species: office.director_species as AgentSprite['species'],
    isDirector: true,
    neonColor: office.director_color,
    furColor: palette.furColor,
    furHighlight: palette.furHighlight,
    suitColor: '#1e293b',
    deskFacing: 'right',
    deskPosition: { ...DIRECTOR_DESK },
    position: { ...DIRECTOR_DESK },
    targetPosition: null,
    waypoints: [],
    waypointIndex: 0,
    facing: 'right',
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

function initDust(): DustParticle[] {
  const particles: DustParticle[] = [];
  for (let i = 0; i < MAX_DUST_PARTICLES; i++) {
    particles.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 5,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      life: Math.random() * 10 + 5,
    });
  }
  return particles;
}

export function useSimulationEngine(
  office: Office | null,
  agents: OfficeAgent[],
  apiMode: boolean
) {
  const stateRef = useRef<SimulationState>({
    agents: [],
    dustParticles: initDust(),
    trailDots: [],
    time: 0,
    deltaTime: 0,
    speedMultiplier: 1,
    isPaused: false,
    whiteboardScribblePhase: 0,
    steamParticles: [],
    tvBarPhase: 0,
  });

  const idleTimersRef = useRef<Map<string, number>>(new Map());

  // Sync agents from DB data
  useEffect(() => {
    if (!office) return;

    const state = stateRef.current;
    const existingIds = new Set(state.agents.map(a => a.id));

    // Build director sprite
    const directorAgent = agents.find(a => a.role === 'Director' || a.name === office.director_name);
    const newAgents: AgentSprite[] = [];

    if (directorAgent) {
      if (existingIds.has(directorAgent.id)) {
        newAgents.push(state.agents.find(a => a.id === directorAgent.id)!);
      } else {
        newAgents.push(createAgentSprite(directorAgent, 0, true, office.director_color));
      }
    } else {
      // Create director from office data
      const existDir = state.agents.find(a => a.id === 'director-' + office.id);
      newAgents.push(existDir || createDirectorFromOffice(office));
    }

    // Sub-agents
    let subIndex = 0;
    agents.forEach(a => {
      if (directorAgent && a.id === directorAgent.id) return;
      if (existingIds.has(a.id)) {
        newAgents.push(state.agents.find(s => s.id === a.id)!);
      } else {
        newAgents.push(createAgentSprite(a, subIndex, false));
      }
      subIndex++;
    });

    state.agents = newAgents;
  }, [office, agents]);

  // Main tick loop (runs separately from rendering)
  useEffect(() => {
    let lastTick = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - lastTick) / 1000, 0.05) * stateRef.current.speedMultiplier;
      lastTick = now;

      if (stateRef.current.isPaused) return;

      const state = stateRef.current;

      // Update dust particles
      state.dustParticles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0 || p.x < 0 || p.x > CANVAS_W || p.y < 0 || p.y > CANVAS_H) {
          p.x = Math.random() * CANVAS_W;
          p.y = Math.random() * CANVAS_H;
          p.vx = (Math.random() - 0.5) * 8;
          p.vy = (Math.random() - 0.5) * 5;
          p.life = Math.random() * 10 + 5;
          p.opacity = Math.random() * 0.5 + 0.2;
        }
      });

      // Update steam particles
      if (Math.random() < 0.3) {
        state.steamParticles.push({
          x: COFFEE_MACHINE.x + (Math.random() - 0.5) * 8,
          y: COFFEE_MACHINE.y - 15,
          opacity: 0.6,
          vy: -20 - Math.random() * 10,
        });
      }
      state.steamParticles.forEach(p => {
        p.y += p.vy * dt;
        p.opacity -= dt * 0.5;
      });
      state.steamParticles = state.steamParticles.filter(p => p.opacity > 0);

      // Update trail dots
      state.trailDots.forEach(d => { d.opacity -= dt * 2; });
      state.trailDots = state.trailDots.filter(d => d.opacity > 0);

      // Update agents
      state.agents.forEach(agent => {
        // Glow pulse
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

        // Checkmark fade
        if (agent.showCheckmark) {
          agent.checkmarkTimer -= dt;
          if (agent.checkmarkTimer <= 0) {
            agent.showCheckmark = false;
          }
        }

        // Movement
        if (agent.waypoints.length > 0 && agent.waypointIndex < agent.waypoints.length) {
          agent.status = 'walking';
          agent.walkCycle += dt;
          const target = agent.waypoints[agent.waypointIndex];
          const { reached, facing } = moveToward(agent.position, target, AGENT_SPEED, dt);
          agent.facing = facing;

          // Trail for director
          if (agent.isDirector && Math.random() < 0.3) {
            state.trailDots.push({ x: agent.position.x, y: agent.position.y, opacity: 0.7 });
          }

          if (reached) {
            agent.waypointIndex++;
            if (agent.waypointIndex >= agent.waypoints.length) {
              agent.waypoints = [];
              agent.waypointIndex = 0;
              agent.status = 'idle';
              agent.facing = agent.deskFacing; // face monitor
            }
          }
        }

        // Idle behavior (random walks) — only in simulation mode, not API mode
        if (!apiMode && agent.status === 'idle' && agent.waypoints.length === 0) {
          const timerId = agent.id;
          const currentTimer = idleTimersRef.current.get(timerId) ?? (Math.random() * 8 + 4);
          const newTimer = currentTimer - dt;
          idleTimersRef.current.set(timerId, newTimer);

          if (newTimer <= 0) {
            // Pick a random idle behavior
            const roll = Math.random();
            let target;
            if (roll < 0.25) {
              target = WATER_COOLER;
            } else if (roll < 0.5) {
              target = COFFEE_MACHINE;
            } else if (roll < 0.75) {
              target = CONFERENCE_SEATS[Math.floor(Math.random() * CONFERENCE_SEATS.length)];
            } else {
              // Stay at desk
              idleTimersRef.current.set(timerId, Math.random() * 10 + 5);
              return;
            }
            agent.waypoints = createPath(agent.position, target);
            agent.waypointIndex = 0;

            // After reaching target, schedule return to desk
            const returnDelay = 4 + Math.random() * 6;
            setTimeout(() => {
              if (agent.status !== 'working') {
                agent.waypoints = createPath(agent.position, agent.deskPosition);
                agent.waypointIndex = 0;
              }
            }, returnDelay * 1000);

            idleTimersRef.current.set(timerId, Math.random() * 15 + 8);
          }
        }
      });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [apiMode]);

  const setSpeed = useCallback((multiplier: number) => {
    stateRef.current.speedMultiplier = multiplier;
  }, []);

  const setPaused = useCallback((paused: boolean) => {
    stateRef.current.isPaused = paused;
  }, []);

  return { stateRef, setSpeed, setPaused };
}
