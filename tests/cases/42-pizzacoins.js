'use strict';
// Pizza Coins: every hand-placed coin sits on free floor in its map; the chest badge under the cash pill stays clear of
// the HUD on phones; walking onto a coin collects it (count, save, float, one toast); coins in an interior and in the
// City; the panel with its per-place list and ✕; a reload keeps the count; the soft "shiny" hint; collecting them all.
const fs = require('fs');
const path = require('path');
module.exports = async (t) => {
  // until index.html lists js/pizzacoins.js, load it just before main.js
  const root = path.resolve(__dirname, '..', '..');
  if (!fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('js/pizzacoins.js')) {
    const body = fs.readFileSync(path.join(root, 'js', 'pizzacoins.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
    await t.page.route('**/js/main.js*', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body }));
  }
  // the service worker would serve its cached copies on the reload below, skipping the route above
  await t.page.addInitScript(() => { if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.reject(new Error('no service worker in this test')); });
  await t.boot();
  t.expect(await t.ev(() => typeof PizzaCoinsExt !== 'undefined' && Game.ext.indexOf(PizzaCoinsExt) > Game.ext.indexOf(CityExt) && Render.ext.includes(PizzaCoinsExt)), 'PizzaCoinsExt loaded, after the City in Game.ext');
  t.expect(await t.ev(() => { const s = Game.s.pizzacoins; return !!s && typeof s.got === 'object' && typeof s.seen === 'object' && Object.keys(s.got).length === 0; }), 'save state starts empty');

  // ---- every spot: a real map, inside its bounds, on free floor (roof: on the roof's walkable part; hayloft: on the planks)
  const spots = await t.ev(() => {
    const bad = [], per = {}, ids = new Set();
    for (const s of CFG.PIZZACOINS.SPOTS) {
      per[s.area] = (per[s.area] || 0) + 1;
      if (ids.has(s.id)) bad.push(`${s.id}: duplicate id`); ids.add(s.id);
      if (!CFG.AREAS[s.area]) { bad.push(`${s.id}: no map ${s.area}`); continue; }
      Game.area = s.area;
      const W = Game.bounds();
      if (s.x < W.x0 + 16 || s.x > W.x1 - 16 || s.y < W.y0 + 16 || s.y > W.y1 - 16) bad.push(`${s.id}: outside ${s.area} bounds`);
      if (s.roof) {
        const rf = CFG.ROOFTOPS.ROOFS.find((q) => q.key === s.roof), R = rf && rf.walk;
        if (!R || !(s.x > R.x0 + 12 && s.x < R.x1 - 12 && s.y > R.y0 + 12 && s.y < R.y1 - 12)) bad.push(`${s.id}: not on the ${s.roof} roof`);
        continue;
      }
      if (s.loft) BarnExt.st.loft = true;
      const inside = Game.obstacles().filter((o) => s.x > o.x && s.x < o.x + o.w && s.y > o.y && s.y < o.y + o.h);
      const touching = Game.obstacles().filter((o) => Game.hitRect(s.x, s.y, 12, o));
      if (s.loft) BarnExt.st.loft = false;
      if (inside.length) bad.push(`${s.id} (${s.area} ${s.x},${s.y}): inside ${JSON.stringify(inside[0])}`);
      else if (touching.length) bad.push(`${s.id} (${s.area} ${s.x},${s.y}): the chef cannot stand there, touches ${JSON.stringify(touching[0])}`);
    }
    Game.area = 'town';
    const missing = Object.keys(CFG.AREAS).filter((a) => !per[a]);
    return { n: CFG.PIZZACOINS.SPOTS.length, bad, per, missing };
  });
  console.log('   pizza coins per map: ' + JSON.stringify(spots.per));
  t.expectEq(spots.bad.length, 0, `every pizza coin on free floor:\n     ${spots.bad.join('\n     ')}`);
  t.expect(spots.n >= 20 && spots.n <= 30, `20–30 coins (${spots.n})`);
  for (const a of ['town', 'site', 'city']) t.expect(spots.per[a] >= 3 && spots.per[a] <= 6, `3–6 coins in ${a} (${spots.per[a]})`);
  // the Islands' three coins are hidden inside island buildings, none lie out on the Islands map itself
  t.expect(['crabshack', 'coconuthut', 'missionctl'].every((a) => spots.per[a] === 1) && !spots.per.islands, `one coin in each of three island buildings, none outside (${JSON.stringify(spots.per)})`);
  t.expect(await t.ev(() => ['crabshack', 'coconuthut', 'missionctl'].every((a) => !!CFG.PIZZACOINS.PLACES[a])), 'the island buildings have friendly names in the panel');
  t.expect(Object.keys(spots.per).length >= 15, `spread over many places (${Object.keys(spots.per).length})`);

  // ---- the badge: under the cash pill, clear of the cash, the shop name and the hint, at phone widths too
  const N = spots.n;
  const layout = async (w, h) => {
    await t.page.setViewportSize({ width: w, height: h });
    await t.wait(150);
    return t.ev(() => {
      T.tp(CFG.DOOR_OUT.x + 40, CFG.DOOR_OUT.y + 60, 'town');
      UI.update(0);
      const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x0: b.left, y0: b.top, x1: b.right, y1: b.bottom, shown: b.width > 0 && getComputedStyle(e).display !== 'none' }; };
      return { badge: r('#pc-badge'), cash: r('#hud-cash'), city: r('#hud-city'), hint: r('#hint'), text: document.querySelector('#pc-badge').textContent, W: innerWidth };
    });
  };
  const overlap = (a, b) => a && b && b.shown && a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  for (const [w, h] of [[1100, 720], [390, 844], [320, 640]]) {
    const L = await layout(w, h);
    t.expect(L.badge && L.badge.shown, `badge shown at ${w}px`);
    t.expectEq(L.text.trim(), `0 / ${N}`, `badge counts 0 / ${N} at ${w}px`);
    t.expect(L.hint.shown, `a hint is showing for the overlap check at ${w}px`);
    t.expect(!overlap(L.badge, L.cash) && !overlap(L.badge, L.city) && !overlap(L.badge, L.hint), `badge clear of cash, shop name and hint at ${w}px: ${JSON.stringify(L)}`);
    t.expect(L.badge.y0 >= L.cash.y1 && L.badge.x0 >= 0 && L.badge.x1 < L.W / 2, `badge sits under the cash pill on the left at ${w}px`);
  }
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.wait(150);
  await t.page.screenshot({ path: path.join(__dirname, '..', 'out', '42-pizzacoins-badge.png'), clip: { x: 0, y: 0, width: 360, height: 110 } });

  // ---- the soft hint near an uncollected coin: on foot only, no arrow
  const hintNear = await t.ev(() => {
    const s = CFG.PIZZACOINS.SPOTS.find((q) => q.id === 'river-house');
    T.tp(s.x - 70, s.y, 'town'); T.step(1);
    const onFoot = { hint: T.hint(), target: Game.hint && Game.hint.target, got: !!Game.s.pizzacoins.got[s.id] };
    T.tp(s.x - 200, s.y - 60, 'town'); T.step(1);
    const far = T.hint();
    return { onFoot, far };
  });
  t.expectEq(hintNear.onFoot.hint, 'Something shiny nearby! ✨', 'soft hint within 90 px of an uncollected coin');
  t.expect(hintNear.onFoot.target === null && !hintNear.onFoot.got, 'no arrow, and not collected from 70 px away');
  t.expect(hintNear.far !== 'Something shiny nearby! ✨', `no shiny hint far away (${hintNear.far})`);

  // ---- walk onto a coin in town: count 1, saved, a float, one important toast
  const first = await t.ev(() => {
    const s = CFG.PIZZACOINS.SPOTS.find((q) => q.id === 'farm-scarecrow');
    T.toasts.length = 0;
    T.tp(s.x - 60, s.y, 'town');
    const before = !!Game.s.pizzacoins.got[s.id];
    T.steer(1, 0); const n = T.until(() => Game.s.pizzacoins.got[s.id], 120); T.unsteer();
    T.step(2);
    let saved = null; try { saved = JSON.parse(localStorage.getItem(CFG.SAVE_KEY)).pizzacoins.got[s.id]; } catch (e) { /* none */ }
    return { before, n, count: PizzaCoinsExt.count(Game), saved, floats: Game.floats.map((f) => f.text), toasts: T.toasts.slice(), pops: PizzaCoinsExt.rt.pops.length, badge: document.querySelector('#pc-badge').textContent.trim(), d: Math.hypot(Game.player.x - s.x, Game.player.y - s.y) };
  });
  t.expect(!first.before && first.n > 0, `walked onto the scarecrow coin (${first.n} steps)`);
  t.expectEq(first.count, 1, 'one pizza coin found');
  t.expect(first.saved === true, 'the coin is saved straight away');
  t.expect(first.floats.includes('+1 🍕 Pizza Coin!'), 'float "+1 🍕 Pizza Coin!"');
  t.expect(first.pops === 1, 'the coin pops up');
  t.expectEq(first.toasts.filter((m) => m.includes('Pizza Coin')).join('|'), '🍕 You found a Pizza Coin! Find them all!', 'the first-coin toast');
  t.expectEq(first.badge, `1 / ${N}`, 'the badge counts it');
  await t.ev(() => { Render.setZoom(2.2); const s = CFG.PIZZACOINS.SPOTS.find((q) => q.id === 'farm-scarecrow'); T.tp(s.x - 20, s.y + 40, 'town'); T.step(8); });
  await t.shot('collect');

  // ---- a coin in an interior (the bakery) and one in a big map (the City, by car-free walking): no more toasts
  const more = await t.ev(() => {
    T.toasts.length = 0;
    const res = [];
    for (const id of ['bakery', 'city-gardens-west']) {
      const s = CFG.PIZZACOINS.SPOTS.find((q) => q.id === id);
      // start 50 px off along a straight, clear line and walk onto it
      Game.area = s.area;
      const obs = Game.obstacles(), clear = (x, y) => !obs.some((o) => Game.hitRect(x, y, 12, o));
      const dir = [[0, 1], [1, 0], [-1, 0], [0, -1], [0.7, 0.7], [-0.7, 0.7]].find(([dx, dy]) => { for (let k = 0; k <= 50; k += 5) if (!clear(s.x + dx * k, s.y + dy * k)) return false; return true; });
      T.tp(s.x + dir[0] * 50, s.y + dir[1] * 50, s.area);
      T.steer(-dir[0], -dir[1]); const n = T.until(() => Game.s.pizzacoins.got[s.id], 120); T.unsteer();
      res.push({ id, n, area: Game.area });
    }
    T.step(2);
    return { res, count: PizzaCoinsExt.count(Game), toasts: T.toasts.filter((m) => m.includes('Pizza Coin')), seen: Object.assign({}, Game.s.pizzacoins.seen) };
  });
  for (const r of more.res) t.expect(r.n >= 0, `collected ${r.id} in ${r.area} (${r.n})`);
  t.expectEq(more.count, 3, 'three coins found');
  t.expectEq(more.toasts.length, 0, 'no toast for later coins');
  t.expect(more.seen.town && more.seen.bakery && more.seen.city && !more.seen.islands, `visited maps are remembered (${JSON.stringify(more.seen)})`);
  // a coin in the world, zoomed in (the City)
  await t.ev(() => { Render.setZoom(2.6); const s = CFG.PIZZACOINS.SPOTS.find((q) => q.id === 'city-square-tree'); T.tp(s.x + 60, s.y - 20, 'city'); T.step(30); });
  await t.shot('coin-world');

  // ---- the panel: tap the badge; totals, progress bar, per-place rows (unvisited ones are ???); ✕ closes it
  await t.page.click('#pc-badge');
  await t.wait(400);
  const panel = await t.ev(() => {
    const m = document.querySelector('#modal-pizzacoins');
    const rows = [...m.querySelectorAll('.pc-row')].map((r) => ({ area: r.dataset.area, text: [...r.children].map((c) => c.textContent.trim()).join(' ') }));
    return { open: UI.open, shown: !m.classList.contains('hidden'), total: m.querySelector('.pc-total').textContent, bar: m.querySelector('.pc-bar i').style.width, rows, places: Object.keys(PizzaCoinsExt.byPlace(Game)).length };
  });
  t.expect(panel.open === 'pizzacoins' && panel.shown, 'the panel opens from the badge');
  t.expectEq(panel.total, `You found 3 of ${N} Pizza Coins!`, 'panel total');
  t.expect(parseFloat(panel.bar) > 0, `progress bar filled a little (${panel.bar})`);
  t.expectEq(panel.rows.length, panel.places, 'one row per place');
  const row = (a) => (panel.rows.find((r) => r.area === a) || {}).text;
  t.expect(/Bakery/.test(row('bakery')) && /✅ 1 \/ 1/.test(row('bakery')), `bakery row: ${row('bakery')}`);
  t.expect(/City/.test(row('city')) && / 1 \/ 3$/.test(row('city')), `city row: ${row('city')}`);
  t.expect(/^❔ \?\?\? 0 \/ \d+$/.test(row('crabshack')), `unvisited Crab Shack row is ???: ${row('crabshack')}`);
  await t.shot('panel');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.wait(300);
  await t.shot('panel-phone');
  await t.page.click('#modal-pizzacoins .pc-close');
  await t.wait(100);
  t.expect(await t.ev(() => UI.open === null && document.querySelector('#modal-pizzacoins').classList.contains('hidden') && Input.enabled), 'the ✕ closes the panel');
  await t.page.setViewportSize({ width: 1100, height: 720 });

  // ---- Take me home from an interior: nothing lost
  await t.ev(() => { const s = CFG.PIZZACOINS.SPOTS.find((q) => q.id === 'cinema'); T.tp(s.x - 80, s.y + 80, 'cinema'); Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => Game.area === 'town' && PizzaCoinsExt.count(Game) === 3), 'Take-me-home keeps the coins');

  // ---- a reload keeps the count
  await t.ev(() => Game.save());
  await t.reload();
  const after = await t.ev(() => ({ count: PizzaCoinsExt.count(Game), badge: document.querySelector('#pc-badge').textContent.trim(), first: Game.s.pizzacoins.first }));
  t.expectEq(after.count, 3, 'count after reload');
  t.expectEq(after.badge, `3 / ${N}`, 'badge after reload');
  t.expect(after.first, 'the first-coin toast stays shown-once after a reload');

  // ---- driving collects too, then collect all the rest: one all-found toast and confetti
  const drive = await t.ev(() => {
    const s = CFG.PIZZACOINS.SPOTS.find((q) => q.id === 'icecream-roof'), H = AirfieldExt.rt.heli;
    T.tp(H.x, H.y + 50, 'town'); T.step(2); Game.enterCar(); T.step(1);
    const driving = Game.driving && Game.vehicle === H;
    H.x = s.x; H.y = s.y; T.step(3);
    const got = !!Game.s.pizzacoins.got[s.id];
    T.tp(CFG.DOOR_OUT.x, CFG.DOOR_OUT.y, 'town');
    return { driving, got };
  });
  t.expect(drive.driving && drive.got, `flying the helicopter over the ice cream roof picks up its coin (${JSON.stringify(drive)})`);
  const all = await t.ev(() => {
    T.toasts.length = 0;
    const left = CFG.PIZZACOINS.SPOTS.filter((s) => !Game.s.pizzacoins.got[s.id]);
    const missed = [];
    for (const s of left) {
      if (s.loft) { Game.area = 'barn'; BarnExt.st.loft = true; }
      T.tp(s.x, s.y, s.area);
      if (!Game.s.pizzacoins.got[s.id]) missed.push(s.id);
      if (s.loft) BarnExt.st.loft = false;
      if (missed.length === 0 && Game.s.pizzacoins.got[s.id] && PizzaCoinsExt.count(Game) < CFG.PIZZACOINS.SPOTS.length && T.toasts.some((m) => m.includes('every'))) missed.push('early all-found toast at ' + s.id);
    }
    T.step(2);
    return { n: left.length, missed, count: PizzaCoinsExt.count(Game), toasts: T.toasts.slice(), confetti: PizzaCoinsExt.rt.confetti.length, all: Game.s.pizzacoins.all, badge: document.querySelector('#pc-badge').textContent.trim(), done: document.querySelector('#pc-badge').classList.contains('pc-done') };
  });
  t.expectEq(all.missed.join(', '), '', `every remaining coin picked up where it stands (${all.n} coins)`);
  t.expectEq(all.count, N, 'all coins found');
  t.expectEq(all.toasts.filter((m) => m.includes('Pizza Coin')).join('|'), '🏆 You found every Pizza Coin!', 'the all-found toast, once');
  t.expect(all.confetti > 50 && all.all, 'confetti burst and the done flag saved');
  t.expectEq(all.badge, `${N} / ${N}`, 'badge full');
  t.expect(all.done, 'badge glows when complete');
  await t.ev(() => { T.tp(CFG.DOOR_OUT.x, CFG.DOOR_OUT.y + 40, 'town'); Render.setZoom(1); T.step(1); });
  await t.shot('all-found');
  await t.ev(() => T.step(400));
  t.expect(await t.ev(() => PizzaCoinsExt.rt.confetti.length === 0), 'the confetti settles');

  // ---- the reset button in the panel: one tap asks, a second tap puts every coin back
  await t.ev(() => { PizzaCoinsExt.openPanel(Game); T.step(1); });
  await t.wait(200);
  const r1 = await t.ev(() => { const b = PizzaCoinsExt.dom.reset; b.click(); return { label: b.textContent, n: PizzaCoinsExt.count(Game) }; });
  t.expect(/Tap again/.test(r1.label) && r1.n === N, `the first tap only asks (${r1.label}, ${r1.n})`);
  await t.shot('reset-confirm');
  const r2 = await t.ev(() => { PizzaCoinsExt.dom.reset.click(); T.step(1); const st = Game.s.pizzacoins; return { n: PizzaCoinsExt.count(Game), seen: Object.keys(st.seen).length, first: st.first, all: st.all, label: PizzaCoinsExt.dom.reset.textContent, text: PizzaCoinsExt.dom.totalEl.textContent }; });
  t.expect(r2.n === 0 && !r2.first && !r2.all && /Start the hunt/.test(r2.label), `the second tap resets the hunt (${JSON.stringify(r2)})`);
  t.expect(/found 0 of/.test(r2.text), `the panel shows 0 found (${r2.text})`);
  const r3 = await t.ev(() => { const s = CFG.PIZZACOINS.SPOTS.find((q) => q.id === 'farm-scarecrow'); T.tp(s.x, s.y, 'town'); T.step(2); return { n: PizzaCoinsExt.count(Game), saved: !!Game.s.pizzacoins.got['farm-scarecrow'] }; });
  t.expect(r3.n === 1 && r3.saved, 'coins can be collected again after the reset');
  await t.ev(() => PizzaCoinsExt.closePanel());
};
