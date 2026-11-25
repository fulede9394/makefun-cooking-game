// main.js — boot, input and the game loop for The Copper Ladle.
// One 90-second shift: tickets print on the board, the chef walks the
// kitchen, chops and grills, stacks dishes on plates and serves them at the
// window before patience runs out. WASD or arrows to move, E (or a click on
// a station) to use it, P to pause, R to restart, M to mute.

import { newState, tickClock, tickFloaters } from './state.js';
import { spawnOrder, tickOrders, servePlate, matchingOrder } from './orders.js';
import { nearestStation, interact, tickKitchen, plateInHand } from './kitchen.js';
import { moveChef } from './player.js';
import { render } from './render.js';
import { playEvent, setGrillSizzle } from './sound.js';
import { demoFor } from './demo.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);

// A seeded shuffle so the demo scenes and the first tickets are stable.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20261125);

let state = newState();
const demoName = params.get('demo');
if (demoName) {
  const staged = demoFor(demoName);
  if (staged) state = staged;
}

const keys = {};
let lastTickSecond = -1;

function startShift() {
  state = newState();
  state.phase = 'playing';
  spawnOrder(state, rng);
  spawnOrder(state, rng);
  playEvent('start', state.muted);
}

function doInteract() {
  if (state.phase !== 'playing') return;
  const station = nearestStation(state);
  if (!station) return;
  if (station.kind === 'window') {
    const plate = plateInHand(state) || state.assembly.plate;
    if (!plate || plate.items.length === 0) {
      playEvent('error', state.muted);
      return;
    }
    if (!matchingOrder(state, plate.items)) {
      playEvent('error', state.muted);
      return;
    }
    const earned = servePlate(state, plate.items);
    if (earned > 0) {
      if (plateInHand(state)) {
        state.chef.hand = state.chef.hand.filter((i) => i !== plate);
      } else {
        state.assembly.plate = null;
      }
      playEvent('serve', state.muted);
    }
    return;
  }
  const event = interact(state, station);
  if (event) playEvent(event, state.muted);
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.code === 'KeyE' || e.code === 'Space') doInteract();
  if (e.code === 'Enter' && state.phase === 'title') startShift();
  if (e.code === 'KeyR' && (state.phase === 'over' || state.phase === 'playing')) startShift();
  if (e.code === 'KeyP' && (state.phase === 'playing' || state.phase === 'paused')) {
    state.phase = state.phase === 'playing' ? 'paused' : 'playing';
  }
  if (e.code === 'KeyM') state.muted = !state.muted;
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

canvas.addEventListener('click', (e) => {
  if (state.phase === 'title') {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (x >= 520 && x <= 760 && y >= 410 && y <= 466) startShift();
    return;
  }
  if (state.phase === 'over') {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (x >= 520 && x <= 760 && y >= 430 && y <= 482) startShift();
    return;
  }
  doInteract();
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.phase === 'playing') {
    moveChef(state, keys, dt);
    tickClock(state, dt);
    tickOrders(state, dt, rng);
    tickKitchen(state, dt);
    tickFloaters(state, dt);
    const sec = Math.ceil(state.timeLeft);
    if (sec !== lastTickSecond) {
      lastTickSecond = sec;
      if (sec <= 10 && sec > 0) playEvent('tick', state.muted);
    }
    setGrillSizzle(state.grill.state === 'cooking', state.muted);
  }
  render(ctx, state, state.phase === 'playing' ? nearestStation(state) : null);
  requestAnimationFrame(frame);
}

window.__gameReady = true;
requestAnimationFrame(frame);
