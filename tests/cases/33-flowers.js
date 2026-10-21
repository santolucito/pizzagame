'use strict';
// The flower shop in the City: the door's label and hint on Market Street, going inside (welcome toast, no stray hint),
// the watering can and the thirsty plant (pour, bloom, the can goes back), the potting table (a seed grows into a
// flower in ten seconds), the $4 flower behind the hat and the $7 bouquet (carried along outside, then gone),
// butterflies and the bee, a rescue from a wall, Take-me-home from inside, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-flowers.js into index.html, load it into the booted page
  if (await t.ev(() => typeof FlowersExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-flowers.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof FlowersExt !== 'undefined' && !!CFG.AREAS.flowers), 'the flower shop extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(FlowersExt) < Game.ext.indexOf(CityExt) && Render.ext.includes(FlowersExt)), 'registered before the City in Game.ext and in Render.ext');
  t.expectEq(await t.ev(() => { const b = CFG.CITY.BUILDINGS[CFG.FLOWERS.BUILDING]; return b.sign; }), 'FLOWERS', 'owns the FLOWERS building');

  // ---- the door on Market Street
  await t.ev(() => { const D = CFG.FLOWERS.DOOR_OUT; T.tp(D.x, D.y + 60, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Visit the flower shop! 🌸', 'flower shop hint near the door');
  t.expect(await t.ev(() => { const D = CFG.FLOWERS.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { const D = CFG.FLOWERS.DOOR_OUT; T.tp(D.x - 120, D.y, 'city'); T.step(1); return FlowersExt.hint(Game); }), undefined, 'no flower shop hint further down the street');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.FLOWERS.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'flowers', 'inside the flower shop');
  t.expect(await t.ev(() => T.toasts.includes('🌸 Welcome to the flower shop!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.FLOWERS.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => FlowersExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Pick up the watering can! 💧', 'watering can hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, c = CFG.FLOWERS.CAN_HOME; return !!h.target && h.target.x === c.x && h.target.y === c.y; }), 'the hint points at the can');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- butterflies flutter around the chef and the bee visits the buckets
  const bugs = await t.ev(() => {
    const p = Game.player, b0 = { x: FlowersExt.st.bee.x, y: FlowersExt.st.bee.y };
    T.step(240);
    const near = FlowersExt.st.butterflies.filter((b) => Math.hypot(b.x - p.x, b.y - (p.y - 34)) < 90).length;
    return { near, beeMoved: Math.hypot(FlowersExt.st.bee.x - b0.x, FlowersExt.st.bee.y - b0.y) };
  });
  t.expectEq(bugs.near, 3, 'three butterflies flutter close to the chef');
  t.expect(bugs.beeMoved > 20, 'the bee flew off to another flower');

  // ---- the watering can and the thirsty plant
  await t.ev(() => { const C = CFG.FLOWERS.CAN_HOME; T.tp(C.x + 10, C.y - 20, 'flowers'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '💧 Take the watering can', 'can label by the can');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => FlowersExt.st.can), 'carrying the watering can');
  t.expectEq(await t.ev(() => T.hint()), 'Water the thirsty plant! 💧', 'hint points to the thirsty plant');
  t.expect(await t.ev(() => { const h = Game.hint, w = CFG.FLOWERS.WILTED; return !!h.target && h.target.x === w.x && h.target.y === w.y; }), 'the hint arrow points at the plant');
  t.expect(await t.ev(() => T.label() === null || T.label() === ''), 'no button away from the plant while carrying the can');
  await t.ev(() => { const W = CFG.FLOWERS.WILTED; T.tp(W.x - 34, W.y + 10, 'flowers'); T.step(2); });
  t.expect(await t.ev(() => FlowersExt.free(Game.player.x, Game.player.y)), 'standing on free floor beside the plant');
  t.expectEq(await t.ev(() => T.label()), '💧 Water the plant', 'water label by the plant');
  await t.ev(() => { T.act(); T.step(10); });
  t.expect(await t.ev(() => FlowersExt.st.pour > 0), 'pouring');
  t.expectEq(await t.ev(() => T.hint()), 'Glug glug glug… 💧', 'pouring hint');
  const stayed = await t.ev(() => { const x = Game.player.x, y = Game.player.y; T.steer(1, 1); T.step(20); T.unsteer(); return Math.hypot(Game.player.x - x, Game.player.y - y); });
  t.expect(stayed < 1, 'the chef stands still while pouring');
  await t.shot('pour');
  const watered = await t.ev(() => { const n = T.until(() => FlowersExt.st.plant.bloom > 0, 300); T.step(90); return { n, can: FlowersExt.st.can, perk: FlowersExt.st.plant.perk, watered: Game.s.flowers.watered, floats: Game.floats.map((f) => f.text), sparkles: Game.fx.filter((f) => f.kind === 'sparkle').length }; });
  t.expect(watered.n >= 0, 'the plant got its water');
  t.expectEq(watered.watered, 1, 'one watering counted');
  t.expect(!watered.can, 'the can went back to its spot');
  t.expect(watered.perk > 0.9, 'the plant perked up');
  t.expect(watered.floats.includes("Ahh, that's better! 🌸"), 'the plant says thank you');
  t.expectEq(await t.ev(() => T.hint()), 'Plant a seed at the potting table! 🌱', 'next hint: the potting table');
  await t.shot('bloomed');

  // ---- the potting table: one press plants a seed; it grows into a flower in ten seconds
  await t.ev(() => { const S = CFG.FLOWERS.TABLE_SPOT; T.tp(S.x, S.y, 'flowers'); T.step(2); });
  t.expect(await t.ev(() => FlowersExt.free(Game.player.x, Game.player.y)), 'the table spot is free floor');
  t.expectEq(await t.ev(() => T.label()), '🌱 Plant a seed', 'plant label at the table');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !!FlowersExt.st.pot && !FlowersExt.st.pot.done), 'a seed is planted');
  t.expect(await t.ev(() => Game.floats.some((f) => f.text === "It's growing! 🌱")), '"It\'s growing" float');
  t.expectEq(await t.ev(() => T.hint()), "It's growing! 🌱", 'growing hint');
  t.expect(await t.ev(() => T.label() !== '🌱 Plant a seed'), 'no second seed while one grows');
  await t.ev(() => T.step(60 * 5));
  await t.shot('growing');
  const grown = await t.ev(() => { T.step(60 * 5 + 10); return { done: FlowersExt.st.pot.done, planted: Game.s.flowers.planted, floats: Game.floats.map((f) => f.text), label: T.label() }; });
  t.expect(grown.done, 'the flower bloomed after ten seconds');
  t.expectEq(grown.planted, 1, 'one flower grown counted');
  t.expect(grown.floats.includes('🌸 Bloom!'), 'the "Bloom!" float');
  t.expectEq(grown.label, '🌱 Plant a seed', 'can plant another seed');
  await t.shot('grown');

  // ---- a $4 flower for the hat and a $7 bouquet from the circles by the counter
  const flower = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.FLOWERS.PADS.flower; T.tp(P.x, P.y, 'flowers');
    const hint = T.hint();
    const n = T.until(() => FlowersExt.st.flower > 0, 400);
    return { hint, n, cash: Game.s.cash, flower: FlowersExt.st.flower, flowers: Game.s.flowers.flowers, after: T.hint() };
  });
  t.expectEq(flower.hint, 'Buy a flower! 🌷', 'flower hint once the chores are done');
  t.expect(flower.n >= 0, 'the circle sold a flower');
  t.expectEq(flower.cash, 16, 'the flower cost $4');
  t.expectEq(flower.flowers, 1, 'flower counted');
  t.expect(flower.flower > 25, 'the flower lasts half a minute');
  t.expectEq(flower.after, 'So pretty! 🌷', 'hint while wearing the flower');
  const bouquet = await t.ev(() => {
    const P = CFG.FLOWERS.PADS.bouquet; T.tp(P.x, P.y, 'flowers');
    const n = T.until(() => FlowersExt.st.bouquet > 0, 400);
    return { n, cash: Game.s.cash, bouquets: Game.s.flowers.bouquets };
  });
  t.expect(bouquet.n >= 0, 'the circle sold a bouquet');
  t.expectEq(bouquet.cash, 9, 'the bouquet cost $7');
  t.expectEq(bouquet.bouquets, 1, 'bouquet counted');
  await t.ev(() => { T.tp(10570, 3250, 'flowers'); Game.player.facing = 1; T.step(2); });
  await t.shot('flower');
  // both come along outside too, then run out
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return FlowersExt.st.flower > 20 && FlowersExt.st.bouquet > 20; }), 'the flower and bouquet come along to the town');
  t.expectEq(await t.ev(() => FlowersExt.hint(Game)), undefined, 'no flower shop hint in the town');
  t.expect(await t.ev(() => { T.step(60 * 31); return FlowersExt.st.flower === 0 && FlowersExt.st.bouquet === 0; }), 'the flower and bouquet are gone after 30 s');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.FLOWERS.ROOM; T.tp(R.x0 - 10, 3200, 'flowers'); T.step(3); });
  t.expect(await t.ev(() => FlowersExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.FLOWERS.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const C = CFG.FLOWERS.COUNTER; T.tp((C.x0 + C.x1) / 2, (C.y0 + C.y1) / 2, 'flowers'); T.step(3); });
  t.expect(await t.ev(() => FlowersExt.free(Game.player.x, Game.player.y)), 'dropped onto the counter: rescued');
  await t.ev(() => { const C = CFG.FLOWERS.CAT; T.tp(C.x, C.y, 'flowers'); T.step(3); });
  t.expect(await t.ev(() => FlowersExt.free(Game.player.x, Game.player.y)), 'dropped onto the sleeping cat: rescued');

  // ---- phone-size shop
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(10590, 3250, 'flowers'); T.step(120); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home while carrying the can
  await t.ev(() => { const C = CFG.FLOWERS.CAN_HOME; T.tp(C.x, C.y - 20, 'flowers'); T.act(); T.step(2); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the shop');
  t.expect(await t.ev(() => !FlowersExt.st.can && FlowersExt.st.pour === 0), 'the can is put down by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => FlowersExt.hint(Game)), undefined, 'no flower shop hint in the town');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.FLOWERS.EXIT; T.tp(E.x, E.y, 'flowers'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.FLOWERS.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🌸 Welcome to the flower shop!').length === 1), 'the welcome toast shows only once');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
