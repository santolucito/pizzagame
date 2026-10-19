# Feature extensions

Each big feature lives in its own classic script (`js/city.js`, `js/islands.js`, `js/atmosphere.js`,
`js/secret.js`), loaded after the core (`config.js`, `utils.js`, `audio.js`, `input.js`, `entities.js`,
`minigame.js`, `game.js`, `render.js`, `ui.js`) and before `main.js`. Scripts share globals: `CFG`, `U`,
`Sfx`, `Haptics`, `Input`, `Game`, `Render`, `UI`, classes `Customer`, `Car`, `Staff`, `Dog`, `Train`.

A feature file defines one object, pushes it to **both** `Game.ext` and `Render.ext`, and may add its own
config under a new key on `CFG` (for example `CFG.CITY = {...}`), register a new map in `CFG.AREAS`, and add
vehicle specs to `CFG.VEHICLES`. It must not edit the core files.

## Maps ("areas")

The whole game shares one coordinate space. Each map is a rectangle of it; nothing in one map can reach
another because they are more than 1000 px apart. `Game.area` names the current map (`'town'`, `'site'`,
plus any you register). `Game.bounds()` returns `CFG.AREAS[Game.area].WORLD`, which clamps the player, the
vehicles and the camera. Register a map with:

```js
CFG.AREAS.city = { WORLD: { x0: 4600, y0: -170, x1: 6200, y1: 1100 } };
```

Reserved rectangles: town `-1320..1520 × -170..1330`; Construction Town `2600..4000 × -170..900`;
City `4600..6200 × -170..1100` (bus); Islands `2600..4600 × 1400..2600` (ferry). The town's west strip
(`x < -1020`) is the forest behind the farm (secret path); its south strip (`y > 1180`) is the river.

To move the player to another map use the travel system: `Game.startTravel(to, via, durationSeconds)`.
The core draws the `'train'` ride itself; any other `via` is drawn by the extension's `travel[via]` hook
(full screen, see below). When the ride ends the core sets `Game.area = to`, snaps the camera, and calls
every extension's `arrive(g, travel)` hook, which must place the player (`g.player.x/y`) for its own
`via`/`to`. `travel` carries `{ t, dur, to, via, from }`.

Walk-on pads (the dashed circles money flows into while you stand still) come from the `pads` hook.

## Game hooks (`Game.ext`)

All optional. `g` is `Game`.

| hook | called | returns |
| --- | --- | --- |
| `defaults` (object, not a function) | at load: each key missing from the save state `g.s` is deep-copied in | – |
| `build(g)` | end of `Game.buildRuntime()` (after `g.s` exists; also on a reset) | – |
| `update(g, dt)` | every fixed step (60 Hz), after the core updates, in every map | – |
| `obstacles(g, forCar)` | when the player or a vehicle moves | array of `{x, y, w, h}` AABBs (world coords; keep them in your own map) |
| `vehicles(g)` | often | array of rideable vehicle objects `{ kind, x, y, angle, vx, vy }`; `kind` must exist in `CFG.VEHICLES` |
| `action(g)` | each frame for the big action button | `{ label, run(g) }` or null. Checked after the train/fishing cases |
| `hint(g)` | each frame | `undefined` = not mine; otherwise a hint `{ text, target: {x,y} | null }` or `null` for no hint. Checked after the core's Construction-Town/travel hints and before the town hints, so return `undefined` unless the player is in your map or next to your thing |
| `pads(g)` | each frame | array of `{ key, label, ico, pos: {x,y}, price, maxed?, sub? }`; the core draws them and collects money; `onPad(g, pad)` fires when paid |
| `onPad(g, pad)` | when a pad of yours is paid | – |
| `arrive(g, travel)` | when a ride ends (any `via`) | – |

Useful core state and helpers:

- `g.s` is the saved state (`g.s.cash`, `g.s.stats.earned`, `g.s.unlocked`, `g.s.paint[kind]`); add your own keys via `defaults`. `g.save()` runs every 5 s.
- `g.player` `{ x, y, carry, facing, moving, bob, xferCd, hasMoved }`; `g.playerCap()`; `g.driving`, `g.vehicle`; `g.onTrain`; `g.travel`.
- `g.toast(text, important)`: important toasts show at the top; others float by the chef. Keep important ones rare.
- `g.floats.push({ x, y, text, color, t: 0, dur: 1, big: true })`, `g.fx.push({ kind: 'pizza' | 'cash' | 'bill' | 'sparkle' | 'dirt', x0, y0, x1, y1, t: 0, dur })`.
- `g.hitRect(px, py, r, rect)`, `U.dist`, `U.rand(a, b)`, `U.randInt`, `U.pick`, `U.clamp`, `U.lerp`, `U.moveToward(obj, x, y, speed, dt)` (returns true on arrival), `U.roundRect(ctx, x, y, w, h, r)`, `U.money(n)`, `U.easeOut`.
- `Sfx.pickup() drop() cash() pay() buy() unlock() whistle() error() ding()`; `Haptics.tap() success()`.
- `Game.enterCar()/exitCar()` are driven by the vehicle button; vehicles you return from `vehicles()` work with it automatically (speed/radius/labels from `CFG.VEHICLES[kind]`, painted color from `g.s.paint[kind]`).
- The core keeps simulating the pizza town while the player is elsewhere; do not pause it.

## Render hooks (`Render.ext`)

`r` is `Render`, `ctx = r.ctx`. World-space hooks run with the camera transform set.

| hook | called | notes |
| --- | --- | --- |
| `paint` (object `{ areaName(r, g) }`) | when that map's cached background is (re)built | static art only; draw everything inside your map's rect |
| `paintTown(r, g)` | at the end of the town's cached background | add static art to the town (river, forest, bus shelter) |
| `bgKey(g)` | when deciding whether to rebuild backgrounds | return a string that changes when your static art changes (owned shop, etc.) |
| `dynamic(r, g)` | each frame after the core's moving outside things, before entities | things that move but sit under people |
| `entities(r, g, items)` | each frame | push `{ y, draw() }` into `items`; the core y-sorts and draws them with people and vehicles |
| `overlay(r, g)` | each frame after effects and floats, world space | |
| `screen(r, g)` | each frame after the hint arrow, **screen space** (CSS px, `r.canvas.width / r.dpr` wide) | tints, rain, snow, banners |
| `travel` (object `{ via(r, g, W, H) }`) | each frame during a ride with that `via`, screen space, full screen | the core cleared the canvas already |
| `vehicleArt` (object `{ kind(r, g, color, v, helpers) }`) | from `Render.drawVehicle` for your vehicle kinds | draw at the origin facing +x (the core has translated/rotated); `helpers = { shadow(len, half), wheels(xs, w, h, half), lights(len, half), lightbar(x) }` |

Reusable drawing: `r.drawVehicle(kind, g, color, v)`, `r.drawSiteVehicle(g, v, lift)` (a rideable vehicle with the
chef's head when riding and the pizza stack on top; works for any vehicle), `r.drawPerson(x, y, look)`,
`r.drawBubble(x, y, innerFn, width)`, `r.drawPizza(x, y, radius)`, `r.drawCountBadge`, `r.font(px)`,
`r.drawTrain(g, train)`. Camera: `r.camX, r.camY, r.viewW, r.viewH, r.scale`; `g.cameraSnap = true` snaps it next frame.
Set `ctx.textAlign`/`textBaseline` yourself before text. Colours in the game are flat, friendly and bright.

## Testing

Serve the repo (`python3 -m http.server <port> --bind 127.0.0.1` from the repo root) and drive headless Chromium with
Playwright (`require('playwright')` from the scratchpad; `chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
args: ['--no-sandbox', '--headless=new'] })`). Close the help modal with `document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))`,
teleport with `Game.player.x/y`, zoom with `Render.setZoom(z)`, snap with `Game.cameraSnap = true`, and read
`Game.hint`, `Game.actionLabel()`, `Game.doAction()`. Check `page.on('pageerror')` stays empty. `node --check file.js` for syntax.
