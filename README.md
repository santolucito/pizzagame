# Pizza Rush — a web-based idle pizzeria

A browser remake of the arcade‑idle restaurant loop popularised by *Pizza Ready!*: run around your
pizzeria, carry pizzas from the oven to the counter, check customers out, scoop up the cash, and reinvest
it in staff, upgrades and new areas until you can franchise to the next city.

No build step, no dependencies: plain HTML5 Canvas + vanilla JavaScript.

## Play it

- **Locally:** open `index.html` in any modern browser, or serve the folder
  (`python3 -m http.server 8000` → http://localhost:8000).
- **GitHub Pages:** in the repo settings, publish the branch root as a Pages site. Nothing else is needed.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | `WASD` / arrow keys | drag anywhere on the game to use the joystick |
| Upgrades / Staff | `U` / `H`, or walk onto the desks | tap the buttons, or walk onto the desks |
| Help / Sound | `?` / `M` | tap the buttons |

## Gameplay loop

1. **Ovens** bake pizzas onto a tray. Walk up to grab a stack (carry capacity is upgradeable).
2. Drop pizzas on the **counter** display. Customers queue, take their order and move to the register.
3. Stand at the **register** to check them out (or hire a cashier). Cash piles up next to the register.
4. Walk over the **cash pile** to collect it.
5. Stand on glowing **pads** to pour money into unlocks:
   - **Dining Area / More Tables** — some customers eat in and leave dirty tables to clean.
   - **2nd Oven** — doubles production.
   - **Drive‑Thru** — cars queue at a window on the road and pay 1.5× for pizzas you drop at the window.
   - **Open Next City** — franchise: start a fresh shop where pizzas sell for 1.8× (and costs are 1.5×).
6. Visit the **Upgrades** desk (speed, capacity, price, oven speed, oven storage, marketing) and the
   **Staff** desk (cashier, up to three kitchen helpers, cleaner, each with training levels).

Impatient customers and cars leave if they wait too long. Progress saves automatically to
`localStorage`, and once you have a cashier and a helper the shop keeps earning a reduced rate for up
to three hours while you are away.

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
