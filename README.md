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
- **A cosy world to explore**, a tiny town with a park, a dog, ducks, a fountain, houses to deliver to,
  a fire station and a second shop to own, rather than a treadmill.

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
| Buy anything | stand still on a glowing floor circle | stand still on a glowing floor circle |
| Delivery car | walk up to it and press `E` or the Drive button | tap the Drive button |
| Zoom | mouse wheel or +/− buttons | pinch |
| Help / Sound | `?` / `M` | tap the buttons |

## Gameplay loop

1. **Ovens** bake pizzas onto a tray. Walk up to grab a stack (carry capacity is upgradeable). Or stand at
   the **prep table** and make one by hand: stretch the dough, spread the sauce, sprinkle cheese, drag on
   toppings, bake it until the bell dings. A handmade family-size pizza counts as three.
2. Drop pizzas on the **counter** display. Customers queue, take their order and move to the register.
3. Stand at the **register** to check them out (or hire a cashier). Cash piles up next to the register.
4. Walk over the **cash pile** to collect it.
5. Stand on glowing **pads** to pour money into unlocks:
   - **Tables / More Tables** — some customers eat in, leave a tip on the table (half their bill) and a mess to clean.
   - **2nd Oven** — doubles production.
   - **Drive‑Thru** — cars queue at a window on the road and pay 1.5× for pizzas you drop at the window.
     Now and then a concrete mixer, police car, school bus, taxi or tractor turns up, and once in a while
     the fire truck leaves the station, drives the loop around town, picks up a big order and heads home.
6. Upgrade circles (Speed, Carry More, Better Oven) sit in the kitchen; the three staff circles (Cashier,
   Helper, Cleaner) are at the office desk. Stand still on one to buy. Each staff circle hires once, then
   trains that person: a trained helper walks faster and carries a bigger stack.
7. Grayed-out **decorations** (plants, posters, string lights, neon sign, jukebox) show where
   they will go; buy them to bring more, and more patient, customers.
8. Walk out of the door to explore the **tiny town**: a park with a pond and fountain, a street loop, a
   parking lot, four houses, a fire station, and an ice cream shop next door. Coins respawn outside and a
   dog follows you around.
9. Houses order pizza now and then. Carry pizzas out, hop into the **delivery car** in the parking lot or
   onto the quicker, nimbler **scooter** by the door (button or `E`) and drive to their door; delivered
   pizzas pay double.
10. The **farm** past the west road grows tomatoes, wheat, basil and mushrooms, and the cow gives cheese.
    Walk up to pick; everything regrows. Farm ingredients go into handmade pizzas (flour, sauce, cheese,
    and the mushroom and basil tray items), and each one used makes the pizza count for one more.
11. A **train** arrives at the station north of the farm every few minutes with a crowd of passengers who
    walk to the shop (extra people wait in a line outside the door). The **playground** across the south
    road has a slide, swings, a seesaw and a spring horse you can ride.
12. The **car showroom** across the south road sells the delivery car and the scooter (they start white). Drive any vehicle into its bay to pick a colour, rainbow included, whenever you like.
    The farm **tractor** can be driven around the farm. Go **fishing** at the pond, and hop on the **train**
    at the platform for a ride.
13. The **ice cream shop** is for sale. Once bought it runs itself with a scooper and its own customers;
14. **Construction Town**: repair the boarded-up station first, then ride the train yourself and it takes you through the mountains to a second town that is still being built. Ride the excavator, bulldozer and dump truck, flatten dirt piles for a few coins, and take the waiting train home.
15. **The City by bus**: a bus stops at the sign north of Main Street; ride it to a downtown with taxis to drive, pigeons to scatter, a street musician, and the Pizza Tower, whose elevator visits six floors with something silly on each.
16. **The Islands by ferry**: the ferry behind River House crosses to small islands where you set up an island pizza stand and deliver by jet ski. Pizzas you carry wait in a crate on the dock.
17. **Secret path**: somewhere behind the barn a trail leads into the woods to a cabin and a sleeping bear.
18. **Dusk and weather**: a soft dusk every few minutes, rain in town now and then, snow at Construction Town.
    walk in to collect the money, and buy More Flavors inside to make it busier.

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
