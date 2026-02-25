import type { Vec2 } from './types';

// Arena canvas resolution (smaller than office)
export const ARENA_W = 800;
export const ARENA_H = 600;

// Sprite scale multiplier for arena (3x larger)
export const ARENA_SPRITE_SCALE = 3;

// Agent desk positions (facing each other)
export const ARENA_DESK_A: Vec2 = { x: 200, y: 420 };
export const ARENA_DESK_B: Vec2 = { x: 600, y: 420 };

// Bell position (center)
export const ARENA_BELL: Vec2 = { x: 400, y: 340 };

// Scoreboard area
export const ARENA_SCOREBOARD = { x: 100, y: 20, w: 600, h: 120 };

// Movement speed in arena
export const ARENA_AGENT_SPEED = 100;

// Colors
export const ARENA_FLOOR_COLOR = '#1a1a2e';
export const ARENA_FLOOR_ACCENT = '#16213e';
export const ARENA_WALL_COLOR = '#0f3460';
export const ARENA_BELL_COLOR = '#fbbf24';
export const ARENA_BELL_STAND_COLOR = '#64748b';

// Boiler room canvas
export const BOILER_W = 900;
export const BOILER_H = 600;

export const BOILER_DESKS: Vec2[] = [
  { x: 200, y: 200 },
  { x: 450, y: 200 },
  { x: 200, y: 430 },
  { x: 450, y: 430 },
];

export const BOILER_WHITEBOARD = { x: 20, y: 150, w: 10, h: 100 };
export const BOILER_COFFEE: Vec2 = { x: 750, y: 300 };
