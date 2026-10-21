'use strict';
// The candy shop in the City: the door's label and hint on the sidewalk, going inside (welcome toast, no stray hint),
// the gumball machine (press the button, the gumball rolls down and lands as a coloured float), the cotton-candy machine
// (spins up when you stand by it, $3 for a cloud carried for 30 s), the $5 pick-and-mix bag ("Yum!"), a rescue from a
// wall, Take-me-home from inside, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-candy.js into index.html, load it into the booted page
  if (await t.ev(() => typeof CandyExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-candy.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof CandyExt !== 'undefined' && !!CFG.AREAS.candy), 'the candy extension and its map are registered');

  // ---- the door on Bus Street
  await t.ev(() => { const D = CFG.CANDY.DOOR_OUT; T.tp(D.x, D.y + 70, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Sweets at the candy shop! 🍬', 'candy hint near the door');
  t.expect(await t.ev(() => { const D = CFG.CANDY.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  await t.ev(() => { T.tp(5600, 300, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => CandyExt.hint(Game)), undefined, 'no candy hint elsewhere in the City');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.CANDY.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'candy', 'inside the candy shop');
  t.expect(await t.ev(() => T.toasts.includes('🍬 Welcome to the candy shop!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.CANDY.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => CandyExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Press the gumball button! 🔴', 'gumball hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, B = CFG.CANDY.BUTTON; return !!h.target && h.target.x === B.x && h.target.y === B.y; }), 'the hint points at the gumball button');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- the gumball machine: press the button, the ball rolls down the spiral and lands in the chef's hand
  await t.ev(() => { const B = CFG.CANDY.BUTTON; T.tp(B.x, B.y, 'candy'); T.step(1); });
  t.expect(await t.ev(() => CandyExt.free(Game.player.x, Game.player.y)), 'the button spot is free floor');
  t.expectEq(await t.ev(() => T.label()), '🔴 Press the button', 'button label by the gumball machine');
  await t.ev(() => { T.act(); T.step(20); });
  t.expect(await t.ev(() => !!CandyExt.st.gum && CandyExt.st.gum.t > 0), 'a gumball is rolling');
  t.expect(await t.ev(() => T.label() !== '🔴 Press the button'), 'no second press while it rolls');
  t.expect(await t.ev(() => (T.hint() || '').startsWith('Here it comes!')), 'rolling hint');
  const roll = await t.ev(() => { const gp = CandyExt.gumPos(Game), G = CFG.CANDY.GUMBALL; return { d: Math.hypot(gp.x - G.x, gp.y - (G.y - 50)), phase: gp.phase }; });
  t.expect(roll.phase === 0 && roll.d > 0 && roll.d < 20, `the gumball is inside the globe on the spiral (${JSON.stringify(roll)})`);
  await t.ev(() => T.step(50));
  await t.shot('gumball');
  const gum = await t.ev(() => { const n = T.until(() => !CandyExt.st.gum, 300); const f = Game.floats.find((fl) => fl.text.startsWith('Gumball! ')); return { n, gumballs: Game.s.candy.gumballs, floats: Game.floats.map((fl) => fl.text), colored: !!f && CFG.CANDY.GUMS.some(([col]) => col === f.color) }; });
  t.expect(gum.n >= 0 && gum.n < 160, `the gumball arrived in about two seconds (${gum.n} steps)`);
  t.expectEq(gum.gumballs, 1, 'one gumball counted');
  t.expect(gum.floats.some((f) => f.startsWith('Gumball! ')), `the "Gumball!" float (${JSON.stringify(gum.floats)})`);
  t.expect(gum.colored, 'the float is in a gumball colour');
  t.expectEq(await t.ev(() => T.label()), '🔴 Press the button', 'can press the button again');

  // ---- the cotton-candy machine: spins up while you stand by it, $3 for a pink cloud
  const cotton = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.CANDY.PADS.cotton; T.tp(P.x, P.y, 'candy');
    const hint = T.hint();
    const n = T.until(() => CandyExt.st.cotton > 0, 400);
    const floats = Game.floats.map((f) => f.text), cash = Game.s.cash, cotton = CandyExt.st.cotton, cottons = Game.s.candy.cottons;
    T.step(120); const spin = CandyExt.st.spin;
    return { hint, spin, n, cash, cotton, cottons, after: T.hint(), floats };
  });
  t.expectEq(cotton.hint, 'Get a cotton candy! ☁️', 'cotton-candy hint after the gumball');
  t.expect(cotton.spin > 0.9, `the machine spun up while the chef stood by it (${cotton.spin})`);
  t.expect(cotton.n >= 0, 'the circle sold a cotton candy');
  t.expectEq(cotton.cash, 17, 'the cotton candy cost $3');
  t.expectEq(cotton.cottons, 1, 'cotton candy counted');
  t.expect(cotton.cotton > 25, 'the cotton candy lasts half a minute');
  t.expect(cotton.floats.includes('Cotton candy! ☁️'), 'the cotton-candy float');
  t.expect(await t.ev(() => !CandyExt.pads(Game).some((p) => p.key === 'candyCotton')), 'the cotton-candy circle hides while the chef holds one');
  t.expect(await t.ev(() => { T.step(120); return Game.s.cash === 17; }), 'standing there longer buys nothing more');
  await t.shot('cotton');
  // walk away: the machine winds down
  t.expect(await t.ev(() => { T.tp(5200, 3200, 'candy'); T.step(240); return CandyExt.st.spin === 0; }), 'the machine winds down when the chef leaves');

  // ---- the pick-and-mix counter: $5 for a bag of sweets
  const mix = await t.ev(() => {
    const P = CFG.CANDY.PADS.mix; T.tp(P.x, P.y, 'candy');
    const hint = T.hint();
    const n = T.until(() => CandyExt.st.bag > 0, 400);
    return { hint, n, cash: Game.s.cash, mixes: Game.s.candy.mixes, floats: Game.floats.map((f) => f.text), after: T.hint() };
  });
  t.expectEq(mix.hint, 'Pick and mix some sweets! 🍬', 'pick-and-mix hint');
  t.expect(mix.n >= 0, 'the circle sold a bag of sweets');
  t.expectEq(mix.cash, 12, 'the bag cost $5');
  t.expectEq(mix.mixes, 1, 'bag counted');
  t.expect(mix.floats.includes('Yum!'), 'the "Yum!" float');
  t.expectEq(mix.after, 'Mmm, fluffy cotton candy! ☁️', 'carrying hint afterwards');
  await t.shot('pickmix');
  // the cotton candy comes along outside too, then runs out
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return CandyExt.st.cotton > 20; }), 'the cotton candy comes along to the town');
  t.expect(await t.ev(() => { T.step(60 * 31); return CandyExt.st.cotton === 0 && CandyExt.st.bag === 0; }), 'the cotton candy and the bag are finished after 30 s');
  t.expectEq(await t.ev(() => CandyExt.hint(Game)), undefined, 'no candy hint in the town');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.CANDY.ROOM; T.tp(R.x0 - 10, 3200, 'candy'); T.step(3); });
  t.expect(await t.ev(() => CandyExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.CANDY.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const F = CFG.CANDY.FOUNTAIN; T.tp(F.x, F.y, 'candy'); T.step(3); });
  t.expect(await t.ev(() => CandyExt.free(Game.player.x, Game.player.y)), 'dropped into the fountain: rescued');
  t.expectEq(await t.ev(() => T.hint()), 'So many sweets! 🍬', 'the idle hint once everything was tried');
  await t.ev(() => { Render.setZoom(1.8); const F = CFG.CANDY.FOUNTAIN; T.tp(F.x + 50, F.y + 40, 'candy'); T.step(90); });
  await t.shot('fountain');

  // ---- phone-size shop
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Render.setZoom(1); T.tp(5250, 3230, 'candy'); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home while a gumball is rolling
  await t.ev(() => { const B = CFG.CANDY.BUTTON; T.tp(B.x, B.y, 'candy'); T.act(); T.step(5); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the shop');
  t.expect(await t.ev(() => !CandyExt.st.gum), 'the rolling gumball is cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.CANDY.EXIT; T.tp(E.x, E.y, 'candy'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.CANDY.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🍬 Welcome to the candy shop!').length === 1), 'the welcome toast shows only once');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
