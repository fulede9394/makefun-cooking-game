// kitchen.js — the stations: where ingredients live and what E does there.
// The kitchen is a row of crates, a chopping board, a grill, an assembly
// counter, a plate stack, a serving window and a trash bin. The chef can only
// use a station when standing close to it, so every dish is a little walk.

import { INGREDIENTS, prepared } from './recipes.js';
import { MAX_HAND } from './state.js';

// Station rectangles on the 1280x720 floor (x, y, w, h).
export const STATIONS = [
  { id: 'crate-bun',     kind: 'crate', item: 'bun',     x: 340,  y: 96,  w: 112, h: 76, label: 'Buns' },
  { id: 'crate-lettuce', kind: 'crate', item: 'lettuce', x: 464,  y: 96,  w: 112, h: 76, label: 'Lettuce' },
  { id: 'crate-tomato',  kind: 'crate', item: 'tomato',  x: 588,  y: 96,  w: 112, h: 76, label: 'Tomatoes' },
  { id: 'crate-cheese',  kind: 'crate', item: 'cheese',  x: 712,  y: 96,  w: 112, h: 76, label: 'Cheese' },
  { id: 'crate-patty',   kind: 'crate', item: 'patty',   x: 836,  y: 96,  w: 112, h: 76, label: 'Patties' },
  { id: 'board',         kind: 'board',                 x: 992,  y: 96,  w: 148, h: 92, label: 'Chopping board' },
  { id: 'grill',         kind: 'grill',                 x: 340,  y: 268, w: 190, h: 112, label: 'Grill' },
  { id: 'assembly',      kind: 'assembly',              x: 566,  y: 268, w: 216, h: 92, label: 'Assembly counter' },
  { id: 'plates',        kind: 'plates',                x: 818,  y: 268, w: 112, h: 92, label: 'Plates' },
  { id: 'window',        kind: 'window',                x: 966,  y: 268, w: 174, h: 112, label: 'Serving window' },
  { id: 'trash',         kind: 'trash',                 x: 1150, y: 420, w: 92,  h: 76, label: 'Trash' },
];

const CHOP_SECONDS = 1.2;
const GRILL_SECONDS = 5;
const BURN_SECONDS = 9;

function distToStation(chef, s) {
  const cx = Math.max(s.x, Math.min(chef.x, s.x + s.w));
  const cy = Math.max(s.y, Math.min(chef.y, s.y + s.h));
  return Math.hypot(chef.x - cx, chef.y - cy);
}

// The station the chef can reach right now, or null.
export function nearestStation(state) {
  let best = null;
  let bestD = 78;
  for (const s of STATIONS) {
    const d = distToStation(state.chef, s);
    if (d < bestD) { best = s; bestD = d; }
  }
  return best;
}

function freeHand(state) {
  return state.chef.hand.length < MAX_HAND;
}

// A plate is carried as { kind: 'plate', items: [...] } in the hand.
export function plateInHand(state) {
  return state.chef.hand.find((i) => i.kind === 'plate') || null;
}

function takeFromHand(state, pred) {
  const i = state.chef.hand.findIndex(pred);
  if (i < 0) return null;
  return state.chef.hand.splice(i, 1)[0];
}

// One press of E (or one click) at a station. Returns a short event string
// the sound module can answer to: 'pickup' | 'chop' | 'grill' | 'serve' |
// 'error' | 'trash' | null.
export function interact(state, station) {
  if (!station) return null;
  const chef = state.chef;
  switch (station.kind) {
    case 'crate': {
      if (!freeHand(state)) return 'error';
      chef.hand.push(prepared(station.item, 'raw'));
      return 'pickup';
    }
    case 'board': {
      // Put a choppable item on the board, or take a chopped one off it.
      if (state.board.item) {
        if (!freeHand(state)) return 'error';
        chef.hand.push(state.board.item);
        state.board.item = null;
        state.board.progress = 0;
        return 'pickup';
      }
      const raw = takeFromHand(state, (i) => i.kind !== 'plate' && INGREDIENTS[i.kind].chop && i.state === 'raw');
      if (!raw) return 'error';
      state.board.item = raw;
      state.board.progress = 0;
      return 'chop';
    }
    case 'grill': {
      const g = state.grill;
      if (g.state === 'ready' || g.state === 'burnt') {
        if (!freeHand(state)) return 'error';
        if (g.state === 'ready') chef.hand.push(prepared('patty', 'grilled'));
        g.item = null;
        g.progress = 0;
        g.state = 'empty';
        return 'pickup';
      }
      if (g.state === 'empty') {
        const raw = takeFromHand(state, (i) => i.kind === 'patty' && i.state === 'raw');
        if (!raw) return 'error';
        g.item = raw;
        g.progress = 0;
        g.state = 'cooking';
        return 'grill';
      }
      return null; // still cooking: wait for the sizzle
    }
    case 'plates': {
      if (!freeHand(state)) return 'error';
      chef.hand.push({ kind: 'plate', items: [] });
      return 'pickup';
    }
    case 'assembly': {
      // Park a plate on the counter, pick it back up, or load a loose
      // ingredient onto the plate parked there (or the one in hand).
      const plate = plateInHand(state);
      if (state.assembly.plate) {
        const loose = takeFromHand(state, (i) => i.kind !== 'plate');
        if (loose) {
          state.assembly.plate.items.push(loose);
          return 'pickup';
        }
        if (!plate && freeHand(state)) {
          chef.hand.push(state.assembly.plate);
          state.assembly.plate = null;
          return 'pickup';
        }
        return 'error';
      }
      if (plate) {
        state.assembly.plate = plate;
        chef.hand = chef.hand.filter((i) => i !== plate);
        return 'pickup';
      }
      return 'error';
    }
    case 'window': {
      // Serve the plate in hand, or the one parked on the assembly counter.
      const plate = plateInHand(state) || state.assembly.plate;
      if (!plate || plate.items.length === 0) return 'error';
      return 'serve';
    }
    case 'trash': {
      const loose = takeFromHand(state, (i) => i.kind !== 'plate');
      if (loose) return 'trash';
      const plate = plateInHand(state);
      if (plate) {
        chef.hand = chef.hand.filter((i) => i !== plate);
        return 'trash';
      }
      return 'error';
    }
    default:
      return null;
  }
}

// Chopping and grilling advance while the chef works elsewhere.
export function tickKitchen(state, dt) {
  if (state.phase !== 'playing' || state.demo) return;
  if (state.board.item) {
    state.board.progress += dt;
    if (state.board.progress >= CHOP_SECONDS) {
      state.board.item.state = 'chopped';
      state.board.progress = 0;
      state.board.item = { ...state.board.item, chopped: true };
    }
  }
  const g = state.grill;
  if (g.state === 'cooking') {
    g.progress += dt;
    if (g.progress >= BURN_SECONDS) {
      g.state = 'burnt';
    } else if (g.progress >= GRILL_SECONDS) {
      g.state = 'ready';
    }
  }
}
