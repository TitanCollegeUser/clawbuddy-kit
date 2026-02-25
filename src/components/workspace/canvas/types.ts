export interface Vec2 {
  x: number;
  y: number;
}

export interface AgentSprite {
  id: string;
  name: string;
  role: string;
  species: 'fox' | 'wolf' | 'owl' | 'bear' | 'cat' | 'rabbit' | 'hamster' | 'bird';
  isDirector: boolean;
  neonColor: string;
  furColor: string;
  furHighlight: string;
  suitColor: string;
  deskFacing: 'left' | 'right';
  deskPosition: Vec2;
  position: Vec2;
  targetPosition: Vec2 | null;
  waypoints: Vec2[];
  waypointIndex: number;
  facing: 'up' | 'down' | 'left' | 'right';
  status: 'idle' | 'working' | 'walking' | 'delegating' | 'collecting' | 'coffee' | 'water' | 'meeting';
  thought: string | null;
  thoughtOpacity: number;
  thoughtTimer: number;
  walkCycle: number;
  earTwitchTimer: number;
  earTwitchAmount: number;
  glowPulse: number;
  showCheckmark: boolean;
  checkmarkTimer: number;
}

export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
}

export interface TrailDot {
  x: number;
  y: number;
  opacity: number;
}

export interface SimulationState {
  agents: AgentSprite[];
  dustParticles: DustParticle[];
  trailDots: TrailDot[];
  time: number;
  deltaTime: number;
  speedMultiplier: number;
  isPaused: boolean;
  whiteboardScribblePhase: number;
  steamParticles: { x: number; y: number; opacity: number; vy: number }[];
  tvBarPhase: number;
}

export interface OfficeData {
  id: string;
  name: string;
  directorName: string;
  directorSpecies: string;
  directorColor: string;
}
