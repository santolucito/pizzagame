'use strict';
// The gym in the City: the door's label and hint on Market Street (tight radii, so the taxi curb next door still
// hails), going inside (welcome toast, no stray hint), the treadmill (belt rolls, the chef runs on the spot, "Zoom!"),
// the trampoline (three bounces, "Boing!", lifted into the air), the climbing wall (holds light up, the bell rings),
// the punching bag's wobble, the water fountain, the $5 sweatband and the $8 medal wall, a rescue from a wall,
// Take-me-home from inside, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-gym.js into index.html, load it into the booted page
  if (await t.ev(() => typeof GymExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-gym.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof GymExt !== 'undefined' && !!CFG.AREAS.gym), 'the gym extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(GymExt) < Game.ext.indexOf(CityExt)), 'the gym answers before the City');
  t.expect(await t.ev(() => { const W = CFG.GYM.WORLD; return W.x0 === 8600 && W.y0 === 3000 && W.x1 === 9200 && W.y1 === 3400; }), 'the interior sits in the rectangle reserved for City building 11');

  // ---- the door on Market Street
  await t.ev(() => { const D = CFG.GYM.DOOR_OUT; T.tp(D.x - 40, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Work out at the gym! 🏋️', 'gym hint near the door');
  t.expect(await t.ev(() => { const D = CFG.GYM.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  // the taxi curb at (5250, 470) is 21 px away: it must still hail a taxi, and the gym hint must be gone past 60 px
  await t.ev(() => { T.tp(5250, 470, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚕 Hail a taxi', 'the taxi curb next to the door still hails');
  await t.ev(() => { T.tp(5271, 540, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => GymExt.hint(Game)), undefined, 'no gym hint 70 px from the door');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.GYM.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'gym', 'inside the gym');
  t.expect(await t.ev(() => T.toasts.includes('🏋️ Welcome to the gym!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.GYM.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => GymExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Hop on the treadmill! 🏃', 'treadmill hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, c = CFG.GYM.TREAD; return !!h.target && h.target.x === c.x && h.target.y === c.y; }), 'the hint points at the treadmill');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- the treadmill: hop on, the belt rolls, the chef runs on the spot and stays put, hop off
  await t.ev(() => { const c = CFG.GYM.TREAD; T.tp(c.x, c.y + 30, 'gym'); });
  t.expectEq(await t.ev(() => T.label()), '🏃 Hop on', 'hop-on label by the treadmill');
  await t.ev(() => { T.act(); T.step(5); });
  t.expect(await t.ev(() => !!GymExt.st.run), 'running on the treadmill');
  t.expectEq(await t.ev(() => T.label()), '🚶 Hop off', 'hop-off label while running');
  t.expectEq(await t.ev(() => T.hint()), 'Run run run! 🏃', 'running hint');
  t.expect(await t.ev(() => Game.floats.some((f) => f.text === 'Zoom!')), 'the "Zoom!" float');
  t.expect(await t.ev(() => Game.player.moving && GymExt.st.cheer > 0), 'the chef runs and the coach cheers');
  const stayed = await t.ev(() => { const c = CFG.GYM.TREAD, b0 = GymExt.st.belt; T.steer(1, 1); T.step(40); T.unsteer(); return { d: Math.hypot(Game.player.x - c.x, Game.player.y - (c.y + 6)), rolled: GymExt.st.belt !== b0 }; });
  t.expect(stayed.d < 1, 'the chef stays on the belt while running');
  t.expect(stayed.rolled, 'the belt rolls');
  await t.shot('treadmill');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !GymExt.st.run && GymExt.free(Game.player.x, Game.player.y)), 'hopped off onto free floor');
  t.expectEq(await t.ev(() => Game.s.gym.runs), 1, 'one run counted');

  // ---- the trampoline: three bounces lift the chef, "Boing!" floats, then back on the mat
  await t.ev(() => { const c = CFG.GYM.TRAMP; T.tp(c.x, c.y + 20, 'gym'); });
  t.expectEq(await t.ev(() => T.hint()), 'Jump on the trampoline! 🤸', 'trampoline hint after the run');
  t.expectEq(await t.ev(() => T.label()), '🤸 Bounce!', 'bounce label on the trampoline');
  const bounce = await t.ev(() => {
    T.act(); let top = 0, boings = 0; const seen = new Set();
    const n = T.until(() => { const h = CFG.GYM.TRAMP.y - Game.player.y; top = Math.max(top, h); for (const f of Game.floats) if (f.text === 'Boing!' && !seen.has(f)) { seen.add(f); boings++; } return !GymExt.st.bounce; }, 400);
    return { n, top, boings, hintMid: null, y: Game.player.y, label: T.label() };
  });
  t.expect(bounce.n > 60, 'the bouncing lasted a while');
  t.expect(bounce.top > 40, 'the chef flew high');
  t.expectEq(bounce.boings, 3, 'three "Boing!" floats');
  t.expectEq(bounce.y, await t.ev(() => CFG.GYM.TRAMP.y), 'back on the mat afterwards');
  t.expectEq(bounce.label, '🤸 Bounce!', 'can bounce again');
  await t.ev(() => { T.act(); T.step(10); });
  t.expectEq(await t.ev(() => T.hint()), 'Boing boing boing! 🤸', 'bouncing hint');
  t.expectEq(await t.ev(() => T.label()), null, 'no button mid-bounce');
  await t.shot('bounce');
  await t.ev(() => T.until(() => !GymExt.st.bounce, 400));

  // ---- the climbing wall: climb to the top, the bell rings, then back at the base
  await t.ev(() => { const c = CFG.GYM.CLIMB.base; T.tp(c.x + 10, c.y + 6, 'gym'); });
  t.expectEq(await t.ev(() => T.hint()), 'Climb up to the bell! 🧗', 'climbing hint');
  t.expectEq(await t.ev(() => T.label()), '🧗 Climb up', 'climb label at the wall');
  await t.ev(() => { T.act(); T.step(80); });
  t.expect(await t.ev(() => !!GymExt.st.climb && !GymExt.st.climb.done && Game.player.y < CFG.GYM.CLIMB.base.y - 30), 'climbing up the wall');
  t.expectEq(await t.ev(() => T.hint()), 'Up up up! 🧗', 'climbing hint on the way up');
  t.expect(await t.ev(() => GymExt.climbFrac() > 0.3 && GymExt.climbFrac() < 0.7), 'the holds light up part way');
  await t.shot('climb');
  const climb = await t.ev(() => { const n = T.until(() => GymExt.st.climb && GymExt.st.climb.done, 400); return { n, bell: GymExt.st.bell, climbs: Game.s.gym.climbs, y: Game.player.y, floats: Game.floats.map((f) => f.text) }; });
  t.expect(climb.n >= 0, 'reached the top');
  t.expect(climb.bell > 0, 'the bell rings');
  t.expectEq(climb.climbs, 1, 'one climb counted');
  t.expect(Math.abs(climb.y - (await t.ev(() => CFG.GYM.CLIMB.top))) < 1, 'standing at the top of the wall');
  t.expect(climb.floats.includes('Ding! Top! 🔔'), 'the bell float');
  await t.ev(() => T.until(() => !GymExt.st.climb, 400));
  t.expect(await t.ev(() => { const c = CFG.GYM.CLIMB.base; return Math.hypot(Game.player.x - c.x, Game.player.y - c.y) < 1 && GymExt.free(Game.player.x, Game.player.y); }), 'back at the base on free floor');

  // ---- bump the punching bag: it wobbles
  await t.ev(() => { const b = CFG.GYM.BAG; T.tp(b.x, b.y - 60, 'gym'); T.steer(0, 1); T.step(30); T.unsteer(); T.step(1); });
  t.expect(await t.ev(() => GymExt.st.wobble > 0.5), 'the bag wobbles after a bump');
  t.expect(await t.ev(() => GymExt.free(Game.player.x, Game.player.y)), 'the chef stays on free floor by the bag');

  // ---- the water fountain is free
  await t.ev(() => { const f = CFG.GYM.FOUNTAIN; Game.s.cash = 20; T.tp(f.x - 30, f.y, 'gym'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Have a drink of water! 💧', 'fountain hint');
  t.expectEq(await t.ev(() => T.label()), '💧 Drink', 'drink label at the fountain');
  await t.ev(() => { T.act(); T.step(5); });
  t.expect(await t.ev(() => Game.floats.some((f) => f.text === 'Glug glug 💧') && GymExt.st.drink > 0), 'glug glug');
  t.expectEq(await t.ev(() => Game.s.cash), 20, 'a drink costs nothing');

  // ---- a $5 sweatband from the circle, worn for half a minute
  const band = await t.ev(() => {
    const P = CFG.GYM.PADS.band; T.tp(P.x, P.y, 'gym');
    const hint = T.hint();
    const n = T.until(() => GymExt.st.band > 0, 400);
    return { hint, n, cash: Game.s.cash, band: GymExt.st.band, bands: Game.s.gym.bands, after: T.hint() };
  });
  t.expectEq(band.hint, 'Buy a sweatband! 💪', 'sweatband hint after the drink');
  t.expect(band.n >= 0, 'the circle sold a sweatband');
  t.expectEq(band.cash, 15, 'the sweatband cost $5');
  t.expectEq(band.bands, 1, 'sweatband counted');
  t.expect(band.band > 25, 'the sweatband lasts half a minute');
  t.expectEq(band.after, 'Get a medal wall! 🏅', 'medal hint next');
  await t.ev(() => { Render.setZoom(2); T.tp(8900, 3250, 'gym'); T.step(2); });
  await t.shot('sweatband');
  await t.ev(() => { Render.setZoom(1); T.step(1); });
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return GymExt.st.band > 20; }), 'the sweatband comes along to the town');
  t.expect(await t.ev(() => { T.step(60 * 31); return GymExt.st.band === 0; }), 'the sweatband is finished after 30 s');

  // ---- the $8 medal wall picture appears on the back wall
  const medal = await t.ev(() => {
    const P = CFG.GYM.PADS.medal; T.tp(P.x, P.y, 'gym'); const key0 = GymExt.bgKey(Game);
    const n = T.until(() => Game.s.gym.medals, 400);
    return { n, cash: Game.s.cash, key0, key1: GymExt.bgKey(Game), maxed: GymExt.pads(Game).find((p) => p.key === 'gymMedal').maxed, hint: T.hint() };
  });
  t.expect(medal.n >= 0, 'the circle sold the medal wall');
  t.expectEq(medal.cash, 7, 'the medal wall cost $8');
  t.expect(medal.key0 !== medal.key1, 'the background key changes so the picture is painted');
  t.expect(medal.maxed, 'the medal pad is done');
  t.expectEq(medal.hint, 'Strong chef! 💪', 'everything done hint');
  await t.ev(() => { T.tp(9040, 3180, 'gym'); T.step(2); });
  await t.shot('medals');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.GYM.ROOM; T.tp(R.x0 - 10, 3200, 'gym'); T.step(3); });
  t.expect(await t.ev(() => GymExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.GYM.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const F = CFG.GYM.FOAM[0]; T.tp(F.x, F.y, 'gym'); T.step(3); });
  t.expect(await t.ev(() => GymExt.free(Game.player.x, Game.player.y)), 'dropped into a foam block: rescued');
  // foam blocks are solid: walking into one stops the chef
  const foam = await t.ev(() => { const F = CFG.GYM.FOAM[2]; T.tp(F.x, F.y - 50, 'gym'); T.steer(0, 1); T.step(60); T.unsteer(); return F.y - Game.player.y; });
  t.expect(foam >= 25, 'a foam block blocks the way');

  // ---- phone-size gym
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const c = CFG.GYM.TRAMP; T.tp(c.x - 60, c.y + 30, 'gym'); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from the treadmill
  await t.ev(() => { const c = CFG.GYM.TREAD; T.tp(c.x, c.y + 30, 'gym'); T.act(); T.step(5); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the gym');
  t.expect(await t.ev(() => !GymExt.st.run && !GymExt.busy()), 'the treadmill is cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => GymExt.hint(Game)), undefined, 'no gym hint in the town');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.GYM.EXIT; T.tp(E.x, E.y, 'gym'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.GYM.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🏋️ Welcome to the gym!').length === 1), 'the welcome toast shows only once');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
