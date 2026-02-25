import type { Vec2 } from './types';
import { HALLWAY_Y } from './constants';

/**
 * Creates an L or Z-shaped path from start to end through the hallway.
 * If start and end are on the same side of the hallway, it's an L-shape.
 * If on opposite sides, it's a Z-shape.
 */
export function createPath(start: Vec2, end: Vec2): Vec2[] {
  const waypoints: Vec2[] = [];

  // If already very close, just go direct
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.sqrt(dx * dx + dy * dy) < 40) {
    waypoints.push({ ...end });
    return waypoints;
  }

  // Go to hallway Y at current X
  if (Math.abs(start.y - HALLWAY_Y) > 20) {
    waypoints.push({ x: start.x, y: HALLWAY_Y });
  }

  // Move along hallway to target X
  if (Math.abs(start.x - end.x) > 20) {
    waypoints.push({ x: end.x, y: HALLWAY_Y });
  }

  // Go to final position
  waypoints.push({ ...end });

  return waypoints;
}

/**
 * Move an agent toward the next waypoint. Returns true if the agent reached the waypoint.
 */
export function moveToward(
  pos: Vec2,
  target: Vec2,
  speed: number,
  dt: number
): { reached: boolean; facing: 'up' | 'down' | 'left' | 'right' } {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const step = speed * dt;

  // Determine facing based on major axis
  let facing: 'up' | 'down' | 'left' | 'right';
  if (Math.abs(dx) > Math.abs(dy)) {
    facing = dx > 0 ? 'right' : 'left';
  } else {
    facing = dy > 0 ? 'down' : 'up';
  }

  if (dist <= step) {
    pos.x = target.x;
    pos.y = target.y;
    return { reached: true, facing };
  }

  pos.x += (dx / dist) * step;
  pos.y += (dy / dist) * step;
  return { reached: false, facing };
}
