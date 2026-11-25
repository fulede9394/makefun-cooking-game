// player.js — the chef: walking the kitchen floor and carrying food.
// Movement is WASD or arrows at a steady kitchen pace, with simple
// push-out collision against the station rectangles so the chef walks
// around counters instead of through them.

import { STATIONS } from './kitchen.js';

const SPEED = 265; // pixels per second
const RADIUS = 20;
const FLOOR = { x: 316, y: 84, w: 948, h: 616 };

export function moveChef(state, keys, dt) {
  const chef = state.chef;
  let dx = 0;
  let dy = 0;
  if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
  if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
  if (dx === 0 && dy === 0) {
    chef.moving = false;
    return;
  }
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  chef.moving = true;
  chef.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');

  let nx = chef.x + dx * SPEED * dt;
  let ny = chef.y + dy * SPEED * dt;
  nx = Math.max(FLOOR.x + RADIUS, Math.min(FLOOR.x + FLOOR.w - RADIUS, nx));
  ny = Math.max(FLOOR.y + RADIUS, Math.min(FLOOR.y + FLOOR.h - RADIUS, ny));

  // Push out of station rectangles, axis by axis.
  for (const s of STATIONS) {
    if (nx + RADIUS > s.x && nx - RADIUS < s.x + s.w && chef.y + RADIUS > s.y && chef.y - RADIUS < s.y + s.h) {
      nx = dx > 0 ? s.x - RADIUS : s.x + s.w + RADIUS;
    }
    if (chef.x + RADIUS > s.x && chef.x - RADIUS < s.x + s.w && ny + RADIUS > s.y && ny - RADIUS < s.y + s.h) {
      ny = dy > 0 ? s.y - RADIUS : s.y + s.h + RADIUS;
    }
  }
  chef.x = nx;
  chef.y = ny;
}

// The chef's hand, as text for the HUD: what is being carried, top first.
export function handSummary(state) {
  return state.chef.hand.map((item) => {
    if (item.kind === 'plate') {
      return item.items.length === 0 ? 'Empty plate' : 'Plate: ' + item.items.map((i) => i.kind).join(' + ');
    }
    const label = item.state === 'chopped' ? 'Chopped ' + item.kind
      : item.state === 'grilled' ? 'Grilled ' + item.kind : item.kind;
    return label[0].toUpperCase() + label.slice(1);
  });
}
