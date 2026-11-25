// state.js — the single game-state object and the shift clock.
// Everything the game loop reads or writes lives here, so render, orders and
// the kitchen all agree about what "the game" is right now.

export const SHIFT_SECONDS = 90;
export const MAX_HAND = 3;

export function newState() {
  return {
    phase: 'title', // 'title' | 'playing' | 'paused' | 'over'
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    bestCombo: 0,
    combo: 0,
    comboTimer: 0, // seconds left on the current combo window
    orders: [], // { id, recipeId, patience, maxPatience, born }
    nextOrderId: 1,
    nextOrderIn: 2, // seconds until the first ticket prints
    chef: { x: 640, y: 520, dir: 'down', moving: false, hand: [], chopHold: 0 },
    grill: { item: null, progress: 0, state: 'empty' }, // state: empty|cooking|ready|burnt
    board: { item: null, progress: 0 }, // chopping board: item being chopped
    assembly: { plate: null }, // plate parked on the assembly counter
    floaters: [], // { x, y, text, color, life }
    muted: false,
    demo: null, // 'cover' | 'rush' | 'serve' | 'title' when staging a screenshot
    overReason: '',
  };
}

// The shift clock. Returns true the moment the shift ends.
export function tickClock(state, dt) {
  if (state.phase !== 'playing' || state.demo) return false;
  state.elapsed += dt;
  state.timeLeft -= dt;
  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.phase = 'over';
    state.overReason = state.served === 0
      ? 'Not a single plate left the kitchen.'
      : 'Shift over — the dinner crowd is full and happy.';
    return true;
  }
  return false;
}

export function addFloater(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color: color || '#2b7a3d', life: 1.4 });
}

export function tickFloaters(state, dt) {
  for (const f of state.floaters) {
    f.y -= 34 * dt;
    f.life -= dt;
  }
  state.floaters = state.floaters.filter((f) => f.life > 0);
}
