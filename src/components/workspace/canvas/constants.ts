import type { Vec2 } from './types';

// Virtual canvas resolution
export const CANVAS_W = 1400;
export const CANVAS_H = 800;

// Hallway Y for pathfinding
export const HALLWAY_Y = 410;

// Agent movement speed (pixels per second)
export const AGENT_SPEED = 120;

// Director office bounds
export const DIRECTOR_OFFICE = { x: 20, y: 20, w: 280, h: 180 };
export const DIRECTOR_DESK: Vec2 = { x: 160, y: 110 };

// Sub-agent desk positions (two rows of up to 4)
export const DESK_POSITIONS_ROW1: Vec2[] = [
  { x: 380, y: 160 },
  { x: 560, y: 160 },
  { x: 740, y: 160 },
  { x: 920, y: 160 },
];

export const DESK_POSITIONS_ROW2: Vec2[] = [
  { x: 380, y: 560 },
  { x: 560, y: 560 },
  { x: 740, y: 560 },
  { x: 920, y: 560 },
];

export const ALL_DESK_POSITIONS = [...DESK_POSITIONS_ROW1, ...DESK_POSITIONS_ROW2];

// Props positions
export const CONFERENCE_TABLE: Vec2 = { x: 650, y: 650 };
export const WATER_COOLER: Vec2 = { x: 1220, y: 300 };
export const COFFEE_MACHINE: Vec2 = { x: 1220, y: 500 };
export const WHITEBOARD = { x: 50, y: 380, w: 10, h: 140 };
export const WALL_CLOCK: Vec2 = { x: 1320, y: 60 };
export const TV_SCREEN = { x: 380, y: 15, w: 200, h: 12 };

// Bookshelf positions (along walls)
export const BOOKSHELVES: Vec2[] = [
  { x: 50, y: 260 },
  { x: 50, y: 560 },
  { x: 1100, y: 20 },
];

// Plants
export const PLANTS: Vec2[] = [
  { x: 30, y: 740 },
  { x: 1350, y: 740 },
  { x: 1350, y: 140 },
  { x: 320, y: 20 },
];

// Floor lamps
export const FLOOR_LAMPS: Vec2[] = [
  { x: 330, y: 300 },
  { x: 1060, y: 300 },
  { x: 330, y: 700 },
  { x: 1060, y: 700 },
];

// Filing cabinets
export const FILING_CABINETS: Vec2[] = [
  { x: 1100, y: 160 },
  { x: 1100, y: 560 },
];

// Conference table seats
export const CONFERENCE_SEATS: Vec2[] = [
  { x: 580, y: 630 },
  { x: 640, y: 610 },
  { x: 700, y: 610 },
  { x: 760, y: 630 },
  { x: 580, y: 680 },
  { x: 640, y: 700 },
  { x: 700, y: 700 },
  { x: 760, y: 680 },
];

// Colors
export const FLOOR_COLOR = '#e8e6e1';
export const FLOOR_GRID_COLOR = '#d4d0c8';
export const WALL_COLOR = '#2a2a3e';
export const WALL_INNER_COLOR = '#1a1a2e';
export const DESK_COLOR = '#8B7355';
export const DESK_HIGHLIGHT = '#A0896C';
export const DIRECTOR_ROOM_BG = '#fef3c7';
export const DIRECTOR_ROOM_GLOW = 'rgba(251, 191, 36, 0.15)';
export const CONFERENCE_RUG = 'rgba(139, 92, 246, 0.15)';

// Species color palettes for directors
export const SPECIES_PALETTES: Record<string, { furColor: string; furHighlight: string }> = {
  fox:     { furColor: '#C4813D', furHighlight: '#E8B96B' },
  wolf:    { furColor: '#7B8794', furHighlight: '#A8B5C2' },
  owl:     { furColor: '#8B6F4E', furHighlight: '#D4C5A9' },
  bear:    { furColor: '#5C3D2E', furHighlight: '#8B6B4F' },
  cat:     { furColor: '#E8A87C', furHighlight: '#F5D0B0' },
  rabbit:  { furColor: '#D4B896', furHighlight: '#F0E0CC' },
  hamster: { furColor: '#D4A76A', furHighlight: '#F0D8A8' },
  bird:    { furColor: '#4A90A4', furHighlight: '#7BBCD0' },
};

// Dust config
export const MAX_DUST_PARTICLES = 30;
