// demo.js — staged kitchen scenes for the screenshots.
// A screenshot has to show the game at its best: a full order board, food
// on the counters, a dish mid-assembly, the timer running and a plate ready
// to serve. These presets put the kitchen in exactly that state, frozen in
// time so every screenshot is reproducible. They only run when the page is
// opened with ?demo=cover (or rush / serve / title); normal play is untouched.

import { prepared } from './recipes.js';
import { newState } from './state.js';

function baseState() {
  const state = newState();
  state.phase = 'playing';
  return state;
}

function ticket(state, id, recipeId, patienceFrac) {
  const max = 45;
  state.orders.push({ id, recipeId, patience: max * patienceFrac, maxPatience: max, born: 0 });
  state.nextOrderId = Math.max(state.nextOrderId, id + 1);
}

// The cover: three tickets, a plate mid-assembly on the counter with bun and
// patty already on it, a patty sizzling on the grill, chopped tomato waiting
// on the board, 47 seconds on the clock.
export function demoCover() {
  const state = baseState();
  state.demo = 'cover';
  state.timeLeft = 47;
  state.elapsed = 43;
  state.coins = 34;
  state.served = 3;
  ticket(state, 4, 'copper-burger', 0.7);
  ticket(state, 5, 'garden-bowl', 0.45);
  ticket(state, 6, 'melty-stack', 0.85);
  state.chef.x = 660;
  state.chef.y = 432;
  state.chef.dir = 'up';
  state.chef.hand = [prepared('tomato', 'chopped')];
  state.assembly.plate = { kind: 'plate', items: [prepared('bun', 'raw'), prepared('patty', 'grilled')] };
  state.grill.item = prepared('patty', 'raw');
  state.grill.progress = 4;
  state.grill.state = 'cooking';
  state.board.item = prepared('tomato', 'chopped');
  state.board.progress = 0;
  return state;
}

// The rush: four tickets, one about to walk out, the chef hauling chopped
// vegetables while the grill finishes a patty. 23 seconds left.
export function demoRush() {
  const state = baseState();
  state.demo = 'rush';
  state.timeLeft = 23;
  state.elapsed = 67;
  state.coins = 58;
  state.served = 5;
  state.combo = 2;
  state.comboTimer = 6;
  ticket(state, 7, 'farmhouse-plate', 0.12);
  ticket(state, 8, 'copper-burger', 0.55);
  ticket(state, 9, 'garden-bowl', 0.8);
  ticket(state, 10, 'melty-stack', 0.65);
  state.chef.x = 520;
  state.chef.y = 480;
  state.chef.dir = 'right';
  state.chef.moving = true;
  state.chef.hand = [prepared('lettuce', 'chopped'), prepared('tomato', 'chopped')];
  state.assembly.plate = { kind: 'plate', items: [prepared('bun', 'raw')] };
  state.grill.item = prepared('patty', 'raw');
  state.grill.progress = 5.2;
  state.grill.state = 'ready';
  return state;
}

// The serve: the chef at the window with a finished Copper Burger, the
// matching ticket on top, coins already popping.
export function demoServe() {
  const state = baseState();
  state.demo = 'serve';
  state.timeLeft = 61;
  state.elapsed = 29;
  state.coins = 86;
  state.served = 6;
  ticket(state, 11, 'copper-burger', 0.6);
  ticket(state, 12, 'garden-bowl', 0.9);
  state.chef.x = 1050;
  state.chef.y = 470;
  state.chef.dir = 'up';
  state.chef.hand = [{
    kind: 'plate',
    items: [prepared('bun', 'raw'), prepared('patty', 'grilled'), prepared('cheese', 'raw')],
  }];
  // The floater lives long enough to survive the screenshot wait.
  state.floaters = [{ x: 1050, y: 400, text: '+18 coins', color: '#2b7a3d', life: 5 }];
  return state;
}

// The title screen over a quiet, stocked kitchen.
export function demoTitle() {
  const state = baseState();
  state.demo = 'title';
  state.phase = 'title';
  state.timeLeft = 90;
  ticket(state, 1, 'copper-burger', 0.9);
  ticket(state, 2, 'garden-bowl', 0.75);
  state.chef.x = 640;
  state.chef.y = 520;
  return state;
}

export function demoFor(name) {
  if (name === 'cover') return demoCover();
  if (name === 'rush') return demoRush();
  if (name === 'serve') return demoServe();
  if (name === 'title') return demoTitle();
  return null;
}
