'use strict';
// The grocery in the City: the door's label and hint on Harbour Street, going inside (welcome toast, no stray hint),
// the basket (take it, fill it from the crates, up to five things), the checkout (beep per item, "Thank you!", nothing
// charged), the scale, the free samples, the cat, the freezer's frosty breath, the $4 grapes and $6 plush carrot,
// a rescue from a wall, Take-me-home from inside, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-grocery.js into index.html, load it into the booted page
  if (await t.ev(() => typeof GroceryExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-grocery.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof GroceryExt !== 'undefined' && !!CFG.AREAS.grocery), 'the grocery extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(GroceryExt) < Game.ext.indexOf(CityExt)), 'the grocery answers before the City');
  t.expect(await t.ev(() => { const b = CFG.CITY.BUILDINGS[CFG.GROCERY.BUILDING]; return b.x0 === 6072 && b.y1 === 876 && !b.sign; }), 'owns the unsigned building 20');

  // ---- the door on Harbour Street
  await t.ev(() => { const D = CFG.GROCERY.DOOR_OUT; T.tp(D.x, D.y + 60, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Shop at the grocery! 🥕', 'grocery hint near the door');
  t.expect(await t.ev(() => { const D = CFG.GROCERY.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { const D = CFG.GROCERY.DOOR_OUT; T.tp(D.x, D.y + 90, 'city'); T.step(2); return GroceryExt.hint(Game); }), undefined, 'no grocery hint further than 70 px from the door');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.GROCERY.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'grocery', 'inside the grocery');
  t.expect(await t.ev(() => T.toasts.includes('🥕 Welcome to the grocery!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.GROCERY.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => GroceryExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Grab a shopping basket! 🧺', 'basket hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, B = CFG.GROCERY.BASKETS; return !!h.target && h.target.x === B.x && h.target.y === B.y; }), 'the hint points at the basket rack');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- walking over a crate without a basket collects nothing
  const noBasket = await t.ev(() => { const c = CFG.GROCERY.CRATES[0]; T.tp(c.x - 40, c.y, 'grocery'); T.steer(1, 0); T.step(40); T.unsteer(); return { x: Game.player.x, cx: c.x, items: GroceryExt.st.items.length }; });
  t.expect(noBasket.x > noBasket.cx + 20, `crates are walk-through (${Math.round(noBasket.x)} vs ${noBasket.cx})`);
  t.expectEq(noBasket.items, 0, 'nothing collected without a basket');

  // ---- take a basket, fill it from the crates
  await t.ev(() => { const B = CFG.GROCERY.BASKETS; T.tp(B.x - 30, B.y + 10, 'grocery'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🧺 Take a basket', 'basket label at the rack');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => GroceryExt.st.basket && GroceryExt.st.items.length === 0), 'carrying an empty basket');
  t.expectEq(await t.ev(() => T.hint()), 'Walk over the crates to fill your basket! 🍎', 'fill hint with the empty basket');
  t.expectEq(await t.ev(() => T.label()), '🧺 Put the basket back', 'the rack offers to take the basket back');
  const fill = await t.ev(() => {
    const C = CFG.GROCERY.CRATES, kinds = [];
    for (let i = 0; i < C.length; i++) { T.tp(C[i].x, C[i].y - 30, 'grocery'); T.steer(0, 1); T.step(14); T.unsteer(); T.step(1); kinds.push(GroceryExt.st.items.length); }
    return { kinds, items: GroceryExt.st.items.slice(), hint: T.hint() };
  });
  t.expectEq(fill.kinds.join(','), '1,2,3,4,5,5,5,5', 'one thing per crate, the basket holds five');
  t.expectEq(fill.items.join(','), 'apple,banana,carrot,tomato,melon', 'the basket shows what was picked');
  t.expectEq(fill.hint, 'Bring your basket to the checkout! 🛒', 'checkout hint with a full basket');
  await t.ev(() => { const c = CFG.GROCERY.CRATES[4]; T.tp(c.x + 30, c.y + 20, 'grocery'); T.step(2); });
  await t.shot('basket');

  // ---- the checkout: beep per item, nothing charged, "Thank you!"
  const checkout = await t.ev(() => {
    Game.s.cash = 25; const S = CFG.GROCERY.CHECKOUT_SPOT; T.tp(S.x, S.y, 'grocery'); T.step(1);
    const label = T.label(); T.act(); T.step(3);
    const scanning = !!GroceryExt.st.scan, hint = T.hint();
    T.steer(1, 1); T.step(30); T.unsteer();
    const stayed = Math.hypot(Game.player.x - S.x, Game.player.y - S.y);
    const n = T.until(() => !GroceryExt.st.scan, 600);
    return { label, scanning, hint, stayed, n, items: GroceryExt.st.items.length, basket: GroceryExt.st.basket, cash: Game.s.cash, checkouts: Game.s.grocery.checkouts, floats: Game.floats.map((f) => f.text) };
  });
  t.expectEq(checkout.label, '🛒 Check out', 'checkout label with a basket of things');
  t.expect(checkout.scanning, 'the cashier starts scanning');
  t.expectEq(checkout.hint, 'Beep beep! 🛒', 'scanning hint');
  t.expect(checkout.stayed < 1, 'the chef waits at the counter while scanning');
  t.expect(checkout.n >= 0, 'the scan finished');
  t.expectEq(checkout.items, 0, 'the basket is empty after the scan');
  t.expect(checkout.basket, 'still carrying the basket');
  t.expectEq(checkout.cash, 25, 'nothing is charged at the checkout');
  t.expectEq(checkout.checkouts, 1, 'one checkout counted');
  t.expect(checkout.floats.includes('Thank you! 🛒'), 'the "Thank you" float');
  await t.shot('checkout');

  // ---- the free samples, the scale, the cat
  await t.ev(() => { const S = CFG.GROCERY.SAMPLES; T.tp(S.x + 34, S.y, 'grocery'); T.step(1); });
  t.expectEq(await t.ev(() => T.hint()), 'Try a free sample! 🧀', 'sample hint after the checkout');
  t.expectEq(await t.ev(() => T.label()), '🧀 Try a free sample', 'sample label at the stand');
  const sample = await t.ev(() => { Game.s.cash = 25; T.act(); T.step(2); return { cash: Game.s.cash, samples: Game.s.grocery.samples, floats: Game.floats.map((f) => f.text) }; });
  t.expectEq(sample.cash, 25, 'samples are free');
  t.expectEq(sample.samples, 1, 'sample counted');
  t.expect(sample.floats.includes('Mmm, cheese! 🧀'), 'the cheese float');
  await t.ev(() => { const S = CFG.GROCERY.SCALE; T.tp(S.x + 34, S.y + 4, 'grocery'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '⚖️ Weigh a watermelon', 'scale label at the scale');
  const weigh = await t.ev(() => { T.act(); T.step(2); return { weigh: GroceryExt.st.weigh, weighed: Game.s.grocery.weighed, floats: Game.floats.map((f) => f.text) }; });
  t.expect(weigh.weigh > 2 && weigh.weighed === 1, 'the scale wobbles under the melon');
  t.expect(weigh.floats.includes('Heavy! 🍉'), 'the "Heavy" float');
  await t.shot('scale');
  await t.ev(() => { const C = CFG.GROCERY.CAT_CRATE; T.tp(C.x, C.y + 36, 'grocery'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🐱 Pet the cat', 'cat label by the crate');
  t.expect(await t.ev(() => { T.act(); T.step(2); return GroceryExt.st.cat.tail > 0 && Game.floats.some((f) => f.text === 'Purrr 🐱'); }), 'the cat purrs');

  // ---- the freezer makes the chef's breath frosty; the bakery says hello
  const cold = await t.ev(() => { const F = CFG.GROCERY.FREEZER_SPOT; T.tp(F.x, F.y + 70, 'grocery'); T.step(2); const before = GroceryExt.st.puffs.length; T.tp(F.x, F.y, 'grocery'); T.step(40); return { before, puffs: GroceryExt.st.puffs.length, cold: GroceryExt.st.cold, floats: Game.floats.map((f) => f.text) }; });
  t.expect(cold.before === 0 && cold.puffs > 0 && cold.cold, 'frosty breath puffs by the freezer');
  t.expect(cold.floats.includes('Brrr! ❄️'), 'the "Brrr" float');
  await t.shot('freezer');
  t.expect(await t.ev(() => { const B = CFG.GROCERY.BAKERY_SPOT; T.tp(B.x, B.y, 'grocery'); T.step(2); return GroceryExt.st.warm && Game.floats.some((f) => f.text === 'Warm bread! 🍞'); }), 'warm bread by the bakery corner');
  await t.shot('bakery');

  // ---- $4 grapes on a balloon, $6 plush carrot
  const grapes = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.GROCERY.PADS.grapes; T.tp(P.x, P.y, 'grocery');
    const hint = T.hint();
    const n = T.until(() => GroceryExt.st.grapes > 0, 400);
    return { hint, n, cash: Game.s.cash, grapes: GroceryExt.st.grapes, bought: Game.s.grocery.grapes, after: T.hint() };
  });
  t.expectEq(grapes.hint, 'Buy some grapes! 🍇', 'grapes hint');
  t.expect(grapes.n >= 0, 'the circle sold the grapes');
  t.expectEq(grapes.cash, 16, 'the grapes cost $4');
  t.expectEq(grapes.bought, 1, 'grapes counted');
  t.expect(grapes.grapes > 25, 'the grapes last half a minute');
  t.expectEq(grapes.after, 'Grapes on a balloon! 🍇🎈', 'grapes hint while carrying them');
  const carrot = await t.ev(() => {
    const P = CFG.GROCERY.PADS.carrot; T.tp(P.x, P.y, 'grocery');
    const n = T.until(() => GroceryExt.st.carrot > 0, 400);
    return { n, cash: Game.s.cash, carrots: Game.s.grocery.carrots };
  });
  t.expect(carrot.n >= 0 && carrot.cash === 10 && carrot.carrots === 1, 'the plush carrot cost $6');
  await t.ev(() => { T.tp(17180, 3300, 'grocery'); T.step(2); });
  await t.shot('grapes');
  // the grapes and the carrot come along outside; the basket stays in the shop
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return GroceryExt.st.grapes > 20 && GroceryExt.st.carrot > 20 && !GroceryExt.st.basket; }), 'the grapes and carrot come along, the basket does not');
  t.expect(await t.ev(() => { T.step(60 * 31); return GroceryExt.st.grapes === 0; }), 'the grapes are gone after 30 s');
  t.expectEq(await t.ev(() => GroceryExt.hint(Game)), undefined, 'no grocery hint in the town');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.GROCERY.ROOM; T.tp(R.x0 - 10, 3200, 'grocery'); T.step(3); });
  t.expect(await t.ev(() => GroceryExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.GROCERY.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const F = CFG.GROCERY.FREEZER; T.tp((F.x0 + F.x1) / 2, (F.y0 + F.y1) / 2, 'grocery'); T.step(3); });
  t.expect(await t.ev(() => GroceryExt.free(Game.player.x, Game.player.y)), 'dropped into the freezer: rescued');

  // ---- phone-size shop
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const c = CFG.GROCERY.CRATES[2]; T.tp(c.x, c.y + 40, 'grocery'); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from the checkout, mid-scan
  await t.ev(() => { const B = CFG.GROCERY.BASKETS; T.tp(B.x - 30, B.y + 10, 'grocery'); T.act(); const c = CFG.GROCERY.CRATES[0]; T.tp(c.x, c.y - 30, 'grocery'); T.steer(0, 1); T.step(14); T.unsteer(); const S = CFG.GROCERY.CHECKOUT_SPOT; T.tp(S.x, S.y, 'grocery'); T.act(); T.step(3); });
  t.expect(await t.ev(() => !!GroceryExt.st.scan), 'scanning again');
  await t.ev(() => { Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the shop');
  t.expect(await t.ev(() => !GroceryExt.st.scan && !GroceryExt.st.basket && GroceryExt.st.items.length === 0), 'the scan and the basket are cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.GROCERY.EXIT; T.tp(E.x, E.y, 'grocery'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.GROCERY.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🥕 Welcome to the grocery!').length === 1), 'the welcome toast shows only once');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
