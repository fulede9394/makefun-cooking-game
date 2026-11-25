// recipes.js — every ingredient and dish in The Copper Ladle.
// Ingredients are the atoms; a recipe is the exact set of prepared items a
// ticket asks for. A plate only serves when its contents match a ticket
// exactly, so the player has to read the board, not just pile food.

// Raw ingredients the crates hand out.
export const INGREDIENTS = {
  bun:     { id: 'bun',     name: 'Bun',     color: '#e8b06a', dark: '#b97f3e', chop: false, grill: false },
  lettuce: { id: 'lettuce', name: 'Lettuce', color: '#7dc383', dark: '#4a8f52', chop: true,  grill: false },
  tomato:  { id: 'tomato',  name: 'Tomato',  color: '#e2574c', dark: '#a83228', chop: true,  grill: false },
  cheese:  { id: 'cheese',  name: 'Cheese',  color: '#f7c948', dark: '#d9a41f', chop: false, grill: false },
  patty:   { id: 'patty',   name: 'Patty',   color: '#8a5a3b', dark: '#5d3a24', chop: false, grill: true  },
};

// A prepared item is { kind: 'bun' | 'lettuce' | ..., state: 'raw' | 'chopped' | 'grilled' }.
// Only the states below ever reach a plate: bun and cheese go on raw, lettuce
// and tomato must be chopped, patty must be grilled.
export function prepared(kind, state) {
  return { kind, state };
}
export function itemLabel(item) {
  const base = INGREDIENTS[item.kind].name;
  if (item.state === 'chopped') return 'Chopped ' + base;
  if (item.state === 'grilled') return 'Grilled ' + base;
  return base;
}
export function itemKey(item) {
  return item.kind + ':' + item.state;
}

// The four dishes on the menu. `needs` lists prepared items; `price` is the
// base pay, and a fast serve adds a tip of up to 6 coins on top.
export const RECIPES = [
  {
    id: 'garden-bowl',
    name: 'Garden Bowl',
    needs: [prepared('lettuce', 'chopped'), prepared('tomato', 'chopped')],
    price: 8,
    blurb: 'Crisp, bright, gone in a minute.',
  },
  {
    id: 'copper-burger',
    name: 'Copper Burger',
    needs: [prepared('bun', 'raw'), prepared('patty', 'grilled'), prepared('cheese', 'raw')],
    price: 14,
    blurb: 'The house classic, still sizzling.',
  },
  {
    id: 'melty-stack',
    name: 'Melty Stack',
    needs: [prepared('bun', 'raw'), prepared('cheese', 'raw'), prepared('tomato', 'chopped')],
    price: 11,
    blurb: 'Cheese over tomato, bun on top.',
  },
  {
    id: 'farmhouse-plate',
    name: 'Farmhouse Plate',
    needs: [prepared('bun', 'raw'), prepared('patty', 'grilled'), prepared('lettuce', 'chopped'), prepared('tomato', 'chopped')],
    price: 16,
    blurb: 'Everything the farm sent, on one plate.',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// True when a plate's items are exactly a recipe's needs, in any order.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const have = plateItems.map(itemKey).sort();
  const want = recipe.needs.map(itemKey).sort();
  return have.every((k, i) => k === want[i]);
}
