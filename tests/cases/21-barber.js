'use strict';
// The barber shop in the City: the door's label and hint on the sidewalk, going inside (welcome toast, no stray hint),
// the barber chair (spin, the trim and the "Looking sharp" float, staying put while seated), the mirror, the $5 lollipop,
// a rescue from a wall, Take-me-home from inside, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-barber.js into index.html, load it into the booted page
  if (await t.ev(() => typeof BarberExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-barber.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof BarberExt !== 'undefined' && !!CFG.AREAS.barber), 'the barber extension and its map are registered');

  // ---- the door on Bus Street
  await t.ev(() => { const D = CFG.BARBER.DOOR_OUT; T.tp(D.x, D.y + 70, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Get a trim at the barber! 💈', 'barber hint near the door');
  t.expect(await t.ev(() => { const D = CFG.BARBER.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.BARBER.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'barber', 'inside the barber shop');
  t.expect(await t.ev(() => T.toasts.includes('💈 Welcome to the barber shop!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.BARBER.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => BarberExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Sit in the barber chair! 💈', 'chair hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, c = CFG.BARBER.CHAIRS[0]; return !!h.target && h.target.x === c.x && h.target.y === c.y; }), 'the hint points at a chair');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- the barber chair: sit, spin, get a trim, stay put, stand up
  await t.ev(() => { const c = CFG.BARBER.CHAIRS[0]; T.tp(c.x, c.y + 2, 'barber'); });
  t.expectEq(await t.ev(() => T.label()), '💈 Sit in the chair', 'sit label at the chair');
  await t.ev(() => { T.act(); T.step(5); });
  t.expect(await t.ev(() => !!BarberExt.st.seat && BarberExt.st.seat.i === 0), 'seated in the first chair');
  t.expectEq(await t.ev(() => T.label()), '🚶 Stand up', 'stand-up label while seated');
  t.expectEq(await t.ev(() => T.hint()), 'Snip snip! Hold still ✂️', 'seated hint');
  t.expect(await t.ev(() => BarberExt.chairAngle() > 0 && BarberExt.chairAngle() < Math.PI * 2), 'the chair is spinning');
  const stayed = await t.ev(() => { const c = CFG.BARBER.CHAIRS[0]; T.steer(1, 1); T.step(40); T.unsteer(); return Math.hypot(Game.player.x - c.x, Game.player.y - c.y); });
  t.expect(stayed < 1, 'the chef stays in the chair while seated');
  await t.ev(() => T.until(() => BarberExt.st.barber.snip > 0.5, 400));
  t.expect(await t.ev(() => BarberExt.st.barber.snip > 0.5), 'the barber came over and is snipping');
  await t.shot('trim');
  const done = await t.ev(() => { const n = T.until(() => BarberExt.st.seat.done, 600); return { n, trims: Game.s.barber.trims, floats: Game.floats.map((f) => f.text), hint: T.hint() }; });
  t.expect(done.n >= 0, 'the trim finished');
  t.expectEq(done.trims, 1, 'one trim counted');
  t.expect(done.floats.includes('Looking sharp! ✂️'), 'the "Looking sharp" float');
  t.expectEq(done.hint, 'Looking sharp! Press the button to stand up', 'done hint while seated');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !BarberExt.st.seat), 'stood up');
  t.expectEq(await t.ev(() => T.label()), '💈 Sit in the chair', 'can sit again');

  // ---- the mirror reflects the chef standing in front of it
  await t.ev(() => { const M = CFG.BARBER.MIRROR; T.tp((M.x0 + M.x1) / 2 + 40, 3150, 'barber'); T.step(2); });
  await t.shot('mirror');

  // ---- a $5 lollipop from the circle by the reception counter
  const lolly = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.BARBER.PADS.lolly; T.tp(P.x, P.y, 'barber');
    const hint = T.hint();
    const n = T.until(() => BarberExt.st.lolly > 0, 400);
    return { hint, n, cash: Game.s.cash, lolly: BarberExt.st.lolly, lollies: Game.s.barber.lollies, after: T.hint() };
  });
  t.expectEq(lolly.hint, 'Buy a lollipop! 🍭', 'lollipop hint after the trim');
  t.expect(lolly.n >= 0, 'the circle sold a lollipop');
  t.expectEq(lolly.cash, 15, 'the lollipop cost $5');
  t.expectEq(lolly.lollies, 1, 'lollipop counted');
  t.expect(lolly.lolly > 25, 'the lollipop lasts half a minute');
  t.expectEq(lolly.after, 'Mmm, lollipop! 🍭', 'lollipop hint while carrying it');
  await t.ev(() => { T.tp(-60, 3200, 'barber'); T.step(2); });
  await t.shot('lolly');
  // the lollipop is carried along outside too, then runs out
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return BarberExt.st.lolly > 20; }), 'the lollipop comes along to the town');
  t.expect(await t.ev(() => { T.step(60 * 31); return BarberExt.st.lolly === 0; }), 'the lollipop is finished after 30 s');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.BARBER.ROOM; T.tp(R.x0 - 10, 3200, 'barber'); T.step(3); });
  t.expect(await t.ev(() => BarberExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.BARBER.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const B = CFG.BARBER.BENCH; T.tp((B.x0 + B.x1) / 2, (B.y0 + B.y1) / 2, 'barber'); T.step(3); });
  t.expect(await t.ev(() => BarberExt.free(Game.player.x, Game.player.y)), 'dropped onto the bench: rescued');

  // ---- phone-size shop
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const c = CFG.BARBER.CHAIRS[1]; T.tp(c.x, c.y + 40, 'barber'); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from the chair
  await t.ev(() => { const c = CFG.BARBER.CHAIRS[1]; T.tp(c.x, c.y, 'barber'); T.act(); T.step(5); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the shop');
  t.expect(await t.ev(() => !BarberExt.st.seat), 'the seat is cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => BarberExt.hint(Game)), undefined, 'no barber hint in the town');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.BARBER.EXIT; T.tp(E.x, E.y, 'barber'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.BARBER.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '💈 Welcome to the barber shop!').length === 1), 'the welcome toast shows only once');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
