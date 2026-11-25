// render.js — everything the player sees, drawn with canvas shapes.
// No image files: the kitchen, the food and the chef are all vector art
// painted here, so the game loads nothing over the network.

import { INGREDIENTS, RECIPES, itemLabel } from './recipes.js';
import { STATIONS } from './kitchen.js';
import { handSummary } from './player.js';

const W = 1280;
const H = 720;

// --- small drawing helpers -------------------------------------------------

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color || '#2b1d16';
  ctx.font = (weight || '700') + ' ' + size + 'px Georgia, serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// One ingredient, drawn as a little vector snack. `size` is its box in px.
export function drawIngredient(ctx, kind, state, x, y, size) {
  const c = INGREDIENTS[kind];
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (state === 'chopped') {
    // Chopped food reads as a little pile of pieces, never one whole piece.
    ctx.fillStyle = c.color;
    for (const [px, py, pr] of [[-0.2, 0.12, 0.17], [0.18, 0.14, 0.15], [0, -0.16, 0.16]]) {
      ctx.beginPath();
      ctx.arc(px * s, py * s, pr * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.arc(0.02 * s, 0.02 * s, 0.05 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  if (kind === 'bun') {
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.08, s * 0.42, s * 0.26, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#d99a4e';
    ctx.fillRect(-s * 0.42, -s * 0.1, s * 0.84, s * 0.12);
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-0.2, -0.22], [0.05, -0.28], [0.24, -0.18]]) {
      ctx.beginPath();
      ctx.arc(sx * s, sy * s, s * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = c.color;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc((i - 2) * s * 0.16, Math.sin(i * 1.3) * s * 0.06, s * 0.17, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.moveTo(-s * 0.32, 0);
    ctx.lineTo(s * 0.32, 0);
    ctx.stroke();
  } else if (kind === 'tomato') {
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7dc383';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.3);
    ctx.lineTo(-s * 0.12, -s * 0.44);
    ctx.lineTo(0, -s * 0.36);
    ctx.lineTo(s * 0.12, -s * 0.44);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'cheese') {
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.38, s * 0.24);
    ctx.lineTo(s * 0.38, s * 0.24);
    ctx.lineTo(s * 0.38, -s * 0.1);
    ctx.lineTo(-s * 0.38, -s * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c.dark;
    for (const [hx, hy] of [[-0.15, 0.08], [0.16, 0.0]]) {
      ctx.beginPath();
      ctx.arc(hx * s, hy * s, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = state === 'grilled' ? '#6b4429' : c.color;
    rr(ctx, -s * 0.4, -s * 0.2, s * 0.8, s * 0.4, s * 0.16);
    ctx.fill();
    ctx.strokeStyle = '#4a2c17';
    ctx.lineWidth = s * 0.045;
    for (const gx of [-0.2, 0, 0.2]) {
      ctx.beginPath();
      ctx.moveTo(gx * s, -s * 0.18);
      ctx.lineTo(gx * s, s * 0.18);
      ctx.stroke();
    }
    if (state === 'grilled') {
      ctx.strokeStyle = '#8a5a3b';
      ctx.lineWidth = s * 0.03;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.05);
      ctx.lineTo(s * 0.3, -s * 0.05);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, size, items) {
  ctx.fillStyle = '#f7f3ea';
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9b896';
  ctx.lineWidth = 2;
  ctx.stroke();
  let oy = y - 4;
  for (const item of items) {
    drawIngredient(ctx, item.kind, item.state, x, oy, size * 0.72);
    oy -= 7;
  }
}

// --- the kitchen ------------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = '#e9c795';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#dfba83';
  for (let y = 84; y < H; y += 56) {
    for (let x = 316 + ((y / 56) % 2) * 28; x < W; x += 56) {
      ctx.fillRect(x, y, 54, 54);
    }
  }
  // Wall band along the top of the kitchen.
  ctx.fillStyle = '#8a4f3d';
  ctx.fillRect(316, 84, 948, 8);
  // Order-board wall on the left.
  ctx.fillStyle = '#6e3f31';
  ctx.fillRect(0, 0, 316, H);
  ctx.fillStyle = '#5a3328';
  ctx.fillRect(0, 0, 316, 8);
}

function drawTopBar(ctx, state) {
  ctx.fillStyle = '#2b1d16';
  ctx.fillRect(0, 0, W, 64);
  text(ctx, 'THE COPPER LADLE', 24, 33, 22, '#f3e2c7', 'left');
  text(ctx, 'a cozy rush-hour kitchen', 320, 36, 14, '#c9a582', 'left', '400');
  // Timer in the middle, red when the shift is nearly done.
  const mins = Math.floor(state.timeLeft / 60);
  const secs = Math.floor(state.timeLeft % 60);
  const t = mins + ':' + String(secs).padStart(2, '0');
  const urgent = state.timeLeft <= 15 && state.phase === 'playing';
  ctx.fillStyle = urgent ? '#e2574c' : '#f3e2c7';
  rr(ctx, 560, 12, 160, 40, 20);
  ctx.fill();
  text(ctx, '⏱ ' + t, 640, 33, 22, urgent ? '#fff' : '#2b1d16', 'center');
  text(ctx, '🪙 ' + state.coins + ' coins', 800, 33, 20, '#f7c948', 'left');
  text(ctx, 'Served: ' + state.served, 960, 33, 18, '#f3e2c7', 'left');
  if (state.combo > 1) {
    text(ctx, 'COMBO x' + state.combo, 1120, 33, 18, '#ff9d5c', 'left');
  }
}

function drawOrders(ctx, state) {
  text(ctx, 'ORDER BOARD', 158, 92, 18, '#f3e2c7', 'center');
  ctx.strokeStyle = '#c9a582';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 108);
  ctx.lineTo(292, 108);
  ctx.stroke();
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet —', 158, 200, 15, '#c9a582', 'center', '400');
    text(ctx, 'the lunch crowd', 158, 224, 15, '#c9a582', 'center', '400');
    text(ctx, 'is on its way.', 158, 248, 15, '#c9a582', 'center', '400');
  }
  state.orders.forEach((o, i) => {
    const recipe = RECIPES.find((r) => r.id === o.recipeId);
    const y = 128 + i * 132;
    const frac = Math.max(0, o.patience / o.maxPatience);
    const urgent = frac < 0.3;
    ctx.fillStyle = '#f7ead2';
    rr(ctx, 20, y, 276, 120, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#b3261e' : '#c9b896';
    ctx.lineWidth = urgent ? 3 : 1.5;
    ctx.stroke();
    text(ctx, '#' + o.id + '  ' + recipe.name, 34, y + 22, 17, '#2b1d16', 'left');
    text(ctx, recipe.price + ' coins', 282, y + 22, 14, '#8a6d3b', 'right');
    recipe.needs.forEach((need, j) => {
      drawIngredient(ctx, need.kind, need.state, 52 + j * 56, y + 62, 40);
    });
    text(ctx, recipe.blurb, 34, y + 100, 12, '#8a6d3b', 'left', '400');
    // Patience bar.
    ctx.fillStyle = '#e0cdb0';
    rr(ctx, 34, y + 110, 248, 0, 0);
    ctx.fillRect(34, y + 106, 248, 7);
    ctx.fillStyle = urgent ? '#b3261e' : frac < 0.6 ? '#d9a41f' : '#4a8f52';
    const bw = Math.round(248 * frac);
    if (bw > 0) ctx.fillRect(34, y + 106, bw, 7);
  });
}

function drawStation(ctx, s, state, nearest) {
  const active = nearest && nearest.id === s.id;
  ctx.save();
  if (active) {
    ctx.shadowColor = '#ffcf5c';
    ctx.shadowBlur = 18;
  }
  ctx.fillStyle = '#a9744f';
  rr(ctx, s.x, s.y, s.w, s.h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#c98f5f';
  rr(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 8, 6);
  ctx.fill();
  ctx.restore();

  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  if (s.kind === 'crate') {
    drawIngredient(ctx, s.item, 'raw', cx, cy - 8, 44);
    text(ctx, s.label, cx, s.y + s.h - 14, 12, '#5a3a22', 'center');
  } else if (s.kind === 'board') {
    ctx.fillStyle = '#e8d3a8';
    rr(ctx, s.x + 16, s.y + 14, s.w - 32, s.h - 44, 6);
    ctx.fill();
    if (state.board.item) {
      drawIngredient(ctx, state.board.item.kind, state.board.item.state, cx, cy - 4, 46);
      const pct = state.board.item.state === 'chopped' ? 'ready!' : Math.round((state.board.progress / 1.2) * 100) + '%';
      text(ctx, pct, cx, s.y + s.h - 12, 12, '#5a3a22', 'center');
    } else {
      text(ctx, 'Chop here', cx, cy - 2, 13, '#8a6d3b', 'center', '400');
      text(ctx, s.label, cx, s.y + s.h - 12, 11, '#5a3a22', 'center', '400');
    }
  } else if (s.kind === 'grill') {
    ctx.fillStyle = '#3a3a3a';
    rr(ctx, s.x + 12, s.y + 12, s.w - 24, s.h - 40, 6);
    ctx.fill();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x + 12 + i * ((s.w - 24) / 5), s.y + 16);
      ctx.lineTo(s.x + 12 + i * ((s.w - 24) / 5), s.y + s.h - 32);
      ctx.stroke();
    }
    const g = state.grill;
    if (g.item) {
      drawIngredient(ctx, 'patty', g.state === 'ready' || g.state === 'burnt' ? 'grilled' : 'raw', cx, cy - 6, 52);
      const label = g.state === 'cooking' ? 'Grilling… ' + Math.round((g.progress / 5) * 100) + '%'
        : g.state === 'ready' ? 'Ready — take it!' : 'BURNT!';
      text(ctx, label, cx, s.y + s.h - 12, 12, g.state === 'burnt' ? '#b3261e' : '#f3e2c7', 'center');
    } else {
      text(ctx, 'Grill — patties here', cx, cy - 2, 13, '#c9a582', 'center', '400');
      text(ctx, s.label, cx, s.y + s.h - 12, 11, '#5a3a22', 'center', '400');
    }
  } else if (s.kind === 'assembly') {
    if (state.assembly.plate) {
      drawPlate(ctx, cx, cy - 4, 46, state.assembly.plate.items);
      text(ctx, 'Plate on the counter', cx, s.y + s.h - 12, 11, '#5a3a22', 'center', '400');
    } else {
      ctx.strokeStyle = '#8a6d3b';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 16, 44, 13, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'Assemble dishes here', cx, cy + 14, 13, '#8a6d3b', 'center', '400');
      text(ctx, s.label, cx, s.y + s.h - 12, 11, '#5a3a22', 'center', '400');
    }
  } else if (s.kind === 'plates') {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#f7f3ea';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10 - i * 7, 34, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9b896';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    text(ctx, s.label, cx, s.y + s.h - 12, 12, '#5a3a22', 'center');
  } else if (s.kind === 'window') {
    ctx.fillStyle = '#7a4a3a';
    rr(ctx, s.x + 10, s.y + 10, s.w - 20, s.h - 34, 6);
    ctx.fill();
    ctx.fillStyle = '#f3e2c7';
    text(ctx, 'SERVE', cx, cy - 8, 20, '#f3e2c7', 'center');
    text(ctx, 'window', cx, cy + 14, 13, '#c9a582', 'center', '400');
    text(ctx, s.label, cx, s.y + s.h - 12, 11, '#5a3a22', 'center', '400');
  } else if (s.kind === 'trash') {
    ctx.fillStyle = '#5a5a5a';
    rr(ctx, s.x + 22, s.y + 12, s.w - 44, s.h - 32, 6);
    ctx.fill();
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(s.x + 18, s.y + 8, s.w - 36, 8);
    text(ctx, 'Trash', cx, s.y + s.h - 10, 12, '#f3e2c7', 'center');
  }
}

function drawChef(ctx, state) {
  const chef = state.chef;
  const bob = chef.moving ? Math.sin(performance.now() / 90) * 2 : 0;
  // Shadow.
  ctx.fillStyle = 'rgba(43,29,22,.25)';
  ctx.beginPath();
  ctx.ellipse(chef.x, chef.y + 18, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#f7f3ea';
  rr(ctx, chef.x - 17, chef.y - 12 + bob, 34, 32, 12);
  ctx.fill();
  ctx.fillStyle = '#4a8f52';
  ctx.fillRect(chef.x - 17, chef.y + 6 + bob, 34, 14);
  // Head + toque.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(chef.x, chef.y - 20 + bob, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(chef.x - 7, chef.y - 30 + bob, 8, 0, Math.PI * 2);
  ctx.arc(chef.x + 7, chef.y - 30 + bob, 8, 0, Math.PI * 2);
  ctx.arc(chef.x, chef.y - 34 + bob, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(chef.x - 12, chef.y - 30 + bob, 24, 6);
  // Eyes look where the chef faces.
  const ex = chef.dir === 'left' ? -3 : chef.dir === 'right' ? 3 : 0;
  const ey = chef.dir === 'up' ? -2 : chef.dir === 'down' ? 2 : 0;
  ctx.fillStyle = '#2b1d16';
  ctx.beginPath();
  ctx.arc(chef.x - 5 + ex, chef.y - 21 + ey + bob, 1.8, 0, Math.PI * 2);
  ctx.arc(chef.x + 5 + ex, chef.y - 21 + ey + bob, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Carried items float above the toque.
  chef.hand.forEach((item, i) => {
    const ix = chef.x + (i - (chef.hand.length - 1) / 2) * 30;
    const iy = chef.y - 52 + bob;
    if (item.kind === 'plate') {
      drawPlate(ctx, ix, iy, 15, item.items);
    } else {
      drawIngredient(ctx, item.kind, item.state, ix, iy, 26);
    }
  });
}

function drawHandHud(ctx, state) {
  ctx.fillStyle = 'rgba(43,29,22,.85)';
  rr(ctx, 330, 648, 420, 56, 10);
  ctx.fill();
  text(ctx, 'HAND', 346, 676, 13, '#c9a582', 'left');
  const items = handSummary(state);
  if (items.length === 0) {
    text(ctx, 'empty — grab an ingredient!', 396, 676, 14, '#f3e2c7', 'left', '400');
  } else {
    items.forEach((label, i) => {
      text(ctx, (i + 1) + '. ' + label, 396 + i * 130, 676, 13, '#f3e2c7', 'left', '400');
    });
  }
}

function drawPrompt(ctx, state, nearest) {
  if (!nearest || state.phase !== 'playing') return;
  const hints = {
    crate: 'E — Take ' + nearest.label.toLowerCase(),
    board: state.board.item ? 'E — Take it off the board' : 'E — Chop (needs lettuce / tomato)',
    grill: state.grill.state === 'empty' ? 'E — Grill a patty' : state.grill.state === 'ready' ? 'E — Take the grilled patty' : 'Sizzling…',
    assembly: state.assembly.plate ? 'E — Add food / take plate' : 'E — Park your plate here',
    plates: 'E — Take a plate',
    window: 'E — Serve the plate!',
    trash: 'E — Throw away the top item',
  };
  const hint = hints[nearest.kind] || 'E — Use';
  text(ctx, hint, 1240, 676, 16, '#2b1d16', 'right');
}

function drawFloaters(ctx, state) {
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    text(ctx, f.text, f.x, f.y, 22, f.color, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43,29,22,.55)';
  ctx.fillRect(0, 64, W, H - 64);
  ctx.fillStyle = '#f7ead2';
  rr(ctx, 340, 150, 600, 380, 16);
  ctx.fill();
  ctx.strokeStyle = '#b97f3e';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'THE COPPER LADLE', 640, 210, 44, '#2b1d16', 'center');
  text(ctx, 'A cozy rush-hour kitchen game', 640, 252, 19, '#8a6d3b', 'center', '400');
  text(ctx, 'Tickets print on the board. Chop, grill, stack', 640, 300, 17, '#2b1d16', 'center', '400');
  text(ctx, 'and serve each dish before its customer walks out.', 640, 326, 17, '#2b1d16', 'center', '400');
  text(ctx, '90 seconds a shift. Tips for fast serves,', 640, 352, 17, '#2b1d16', 'center', '400');
  text(ctx, 'combos for serving dish after dish.', 640, 378, 17, '#2b1d16', 'center', '400');
  ctx.fillStyle = '#4a8f52';
  rr(ctx, 520, 410, 240, 56, 28);
  ctx.fill();
  text(ctx, '▶  START THE SHIFT', 640, 439, 20, '#ffffff', 'center');
  text(ctx, 'WASD / arrows to move · E or click to use a station', 640, 494, 14, '#8a6d3b', 'center', '400');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,29,22,.55)';
  ctx.fillRect(0, 64, W, H - 64);
  text(ctx, 'PAUSED', 640, 360, 44, '#f3e2c7', 'center');
  text(ctx, 'Press P to keep cooking', 640, 410, 18, '#c9a582', 'center', '400');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(43,29,22,.6)';
  ctx.fillRect(0, 64, W, H - 64);
  ctx.fillStyle = '#f7ead2';
  rr(ctx, 390, 170, 500, 330, 16);
  ctx.fill();
  ctx.strokeStyle = '#b97f3e';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'SHIFT OVER', 640, 220, 38, '#2b1d16', 'center');
  text(ctx, state.overReason, 640, 262, 16, '#8a6d3b', 'center', '400');
  text(ctx, '🪙  ' + state.coins + ' coins earned', 640, 320, 24, '#2b1d16', 'center');
  text(ctx, 'Dishes served: ' + state.served + '    Best combo: x' + Math.max(1, state.bestCombo), 640, 360, 18, '#2b1d16', 'center', '400');
  const verdict = state.coins >= 60 ? 'Head chef material. The Ladle is proud of you.'
    : state.coins >= 30 ? 'A solid shift — the regulars will be back.'
    : 'A quiet shift. The grill is still warm — try again?';
  text(ctx, verdict, 640, 400, 16, '#8a6d3b', 'center', '400');
  ctx.fillStyle = '#4a8f52';
  rr(ctx, 520, 430, 240, 52, 26);
  ctx.fill();
  text(ctx, '↻  COOK AGAIN  (R)', 640, 457, 18, '#ffffff', 'center');
}

// --- main entry --------------------------------------------------------------

export function render(ctx, state, nearest) {
  drawFloor(ctx);
  drawTopBar(ctx, state);
  drawOrders(ctx, state);
  for (const s of STATIONS) drawStation(ctx, s, state, nearest);
  drawChef(ctx, state);
  drawHandHud(ctx, state);
  drawPrompt(ctx, state, nearest);
  drawFloaters(ctx, state);
  if (state.phase === 'title') drawTitle(ctx, state);
  else if (state.phase === 'paused') drawPaused(ctx);
  else if (state.phase === 'over') drawGameOver(ctx, state);
}
