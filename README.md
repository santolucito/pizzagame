# Pizza Rush — a web-based idle pizzeria

A browser game inspired by the arcade‑idle restaurant loop of *Pizza Ready!*: run around your pizzeria,
carry pizzas from the oven to the counter, check customers out, scoop up the cash, and spend it on staff,
upgrades, new areas and decorations. Then wander outside to the park.

## Design intent

Spiritually this is meant to be closer to **Stardew Valley** than to a pay‑to‑win mobile cash grab, and
it is built so a five‑year‑old can play it:

- **Nothing ever resets.** There is no prestige, no "next city", no wiping the shop to start over.
  Everything you buy stays bought.
- **No ads, no purchases, no timers to pay away, no dark patterns.** Money only comes from serving
  pizza and finding coins outside.
- **No menus.** Everything is bought by standing still on a glowing circle placed where the thing lives:
  the oven upgrade is by the oven, the cashier by the register, each decoration where it will appear.
- **A cosy world to explore**, with a park, a dog, ducks and a fountain, rather than a treadmill.

No build step, no dependencies: plain HTML5 Canvas + vanilla JavaScript.

## Play it

- **Live:** https://santolucito.github.io/pizzagame/
- **Locally:** open `index.html` in any modern browser, or serve the folder
  (`python3 -m http.server 8000` → http://localhost:8000).
- **GitHub Pages:** `.github/workflows/pages.yml` deploys the site on every push to `main` or the
  development branch. Enable it once under **Settings → Pages → Build and deployment → Source: GitHub
  Actions**, then the site appears at `https://<user>.github.io/pizzagame/`. (GitHub only serves Pages
  from private repositories on paid plans; make the repo public otherwise.)

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | `WASD` / arrow keys | drag anywhere on the game to use the joystick |
| Buy anything | stand on a glowing floor circle | stand on a glowing floor circle |
| Zoom | mouse wheel or +/− buttons | pinch |
| Help / Sound | `?` / `M` | tap the buttons |

## Gameplay loop

1. **Ovens** bake pizzas onto a tray. Walk up to grab a stack (carry capacity is upgradeable).
2. Drop pizzas on the **counter** display. Customers queue, take their order and move to the register.
3. Stand at the **register** to check them out (or hire a cashier). Cash piles up next to the register.
4. Walk over the **cash pile** to collect it.
5. Stand on glowing **pads** to pour money into unlocks:
   - **Tables / More Tables** — some customers eat in, leave a tip on the table (half their bill) and a mess to clean.
   - **2nd Oven** — doubles production.
   - **Drive‑Thru** — cars queue at a window on the road and pay 1.5× for pizzas you drop at the window.
6. Upgrade circles (Speed, Carry More, Better Oven) and staff circles (Cashier, Helper, Cleaner) sit where
   they belong in the shop; stand still on one to buy. Staff circles hire first, then train.
7. Grayed-out **decorations** (plants, posters, string lights, neon sign, jukebox) show where
   they will go; buy them to bring more, and more patient, customers.
8. Walk out of the door to explore the **park, street and parking lot**: collect coins and meet the dog.

Impatient customers and cars leave if they wait too long. Progress saves automatically to
`localStorage` and never resets; once you have a cashier and a helper the shop keeps earning a reduced
rate for up to three hours while you are away.

## Project layout

```
index.html        page shell + HUD / modal markup
css/style.css     HUD, modals, toasts
js/config.js      map layout and balance numbers (prices, costs, timings)
js/utils.js       small helpers
js/audio.js       procedural WebAudio sound effects
js/input.js       keyboard + pointer joystick
js/entities.js    Customer, Car and Staff behaviour
js/game.js        simulation, economy, interactions, save/load, offline earnings
js/render.js      canvas renderer and camera
js/ui.js          HUD, upgrade/staff panels, toasts
js/main.js        bootstrap and fixed‑step game loop
```

Tuning the game is mostly a matter of editing `js/config.js`.
