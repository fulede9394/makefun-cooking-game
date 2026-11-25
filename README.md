[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/fulede9394/makefun-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/fulede9394/makefun-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# The Copper Ladle — a cozy rush-hour kitchen game

An entry for [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) on make.fun.

You run a tiny bistro kitchen for one 90-second shift. Tickets print on the
order board; chop the lettuce and tomato, grill the patty (but don't let it
burn), stack each dish on a plate and serve it at the window before its
customer walks out. Fast serves earn tips, back-to-back serves build a combo.

## How to play

- **Move:** WASD or arrow keys (mouse: click a station to use it)
- **Interact:** E or Space (or click the station you are standing by)
- **Pause:** P · **Restart:** R · **Mute:** M

## The menu

| Dish | Needs | Pays |
| --- | --- | --- |
| Garden Bowl | chopped lettuce + chopped tomato | 8 coins |
| Copper Burger | bun + grilled patty + cheese | 14 coins |
| Melty Stack | bun + cheese + chopped tomato | 11 coins |
| Farmhouse Plate | bun + grilled patty + chopped lettuce + chopped tomato | 16 coins |

Fast serves add a tip of up to 6 coins; serving dish after dish builds a
combo worth +2 coins a plate.

## Play it

The game is plain static files under `game/` — open `game/index.html` in a
desktop browser (or serve the folder with any static server) and it plays
with no network request. All art is drawn in code and all sounds are
synthesized with WebAudio; nothing is loaded from outside the folder.

## Layout

- `game/index.html` — the page and canvas
- `game/src/main.js` — boot, input and the game loop
- `game/src/state.js` — the game state and the shift clock
- `game/src/recipes.js` — ingredients and the four dishes
- `game/src/orders.js` — the order board, patience and serving
- `game/src/kitchen.js` — the stations and what E does at each
- `game/src/player.js` — the chef: walking and carrying
- `game/src/render.js` — everything you see, drawn in canvas
- `game/src/sound.js` — synthesized kitchen sounds
- `game/src/demo.js` — staged scenes used for the screenshots
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  the output folder and writes `dossier.json` with the kit's library
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `screenshots/` — 4 renders of the game itself (cover first)
