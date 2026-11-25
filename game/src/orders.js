// orders.js — the order board: tickets print, patience drains, serving pays.
// A ticket is a promise to a customer. Serve it while its patience bar is
// still green and the tip is fat; let it run out and the customer walks.

import { RECIPES, plateMatchesRecipe } from './recipes.js';
import { addFloater } from './state.js';

export const MAX_ORDERS = 4;
const PATIENCE_SECONDS = 45;
const COMBO_WINDOW = 10;

// Pick the next recipe, avoiding three of the same dish in a row on the board.
export function pickRecipe(state, rng) {
  const counts = {};
  for (const o of state.orders) counts[o.recipeId] = (counts[o.recipeId] || 0) + 1;
  const pool = RECIPES.filter((r) => (counts[r.id] || 0) < 2);
  const list = pool.length ? pool : RECIPES;
  return list[Math.floor(rng() * list.length)];
}

export function spawnOrder(state, rng) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const recipe = pickRecipe(state, rng);
  const order = {
    id: state.nextOrderId++,
    recipeId: recipe.id,
    patience: PATIENCE_SECONDS,
    maxPatience: PATIENCE_SECONDS,
    born: state.elapsed,
  };
  state.orders.push(order);
  return order;
}

export function tickOrders(state, dt, rng) {
  if (state.phase !== 'playing' || state.demo) return;
  for (const o of state.orders) o.patience -= dt;
  const walked = state.orders.filter((o) => o.patience <= 0);
  state.orders = state.orders.filter((o) => o.patience > 0);
  for (const o of walked) {
    state.combo = 0;
    addFloater(state, 170, 120, 'A customer walked out!', '#b3261e');
  }
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0) {
    spawnOrder(state, rng);
    // Orders print faster as the shift wears on.
    const rush = 1 - state.elapsed / 100;
    state.nextOrderIn = 9 + rng() * 5 * Math.max(0.55, rush);
  }
}

// Find the ticket a plate can satisfy: the oldest matching ticket first.
export function matchingOrder(state, plateItems) {
  for (const o of state.orders) {
    const recipe = RECIPES.find((r) => r.id === o.recipeId);
    if (recipe && plateMatchesRecipe(plateItems, recipe)) return { order: o, recipe };
  }
  return null;
}

// Serve a finished plate. Returns the coins earned, or 0 when no ticket fits.
export function servePlate(state, plateItems) {
  const match = matchingOrder(state, plateItems);
  if (!match) return 0;
  const { order, recipe } = match;
  const patienceFrac = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(patienceFrac * 6);
  const comboBonus = state.combo > 0 ? 2 : 0;
  const earned = recipe.price + tip + comboBonus;
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.comboTimer = COMBO_WINDOW;
  state.orders = state.orders.filter((o) => o.id !== order.id);
  const floaterText = '+' + earned + ' coins' + (state.combo > 1 ? '  x' + state.combo + ' combo!' : '');
  addFloater(state, 1080, 330, floaterText, '#2b7a3d');
  return earned;
}
