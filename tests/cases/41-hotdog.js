'use strict';
// The City's hot dog stand: the vendor behind the cart, the button and hint in front of it, buying with and without
// cash, holding the hot dog, the toss into the chef's mouth (CHOMP!), the eaten count, Take-me-home mid-toss, and no
// button while riding a taxi.
module.exports = async (t) => {
  // the extension may not be wired into index.html yet: load it into the page when it is missing
  const load = async () => { if (!(await t.ev(() => typeof HotdogExt !== 'undefined'))) { await t.page.addScriptTag({ url: '/js/hotdog.js' }); await t.ev(() => T.step(1)); } };
  await t.boot();
  await load();
  const K = await t.ev(() => CFG.HOTDOG);
  t.expect(await t.ev(() => Game.ext.indexOf(HotdogExt) >= 0 && Game.ext.indexOf(HotdogExt) < Game.ext.indexOf(CityExt)), 'the hot dog stand answers before the City');
  t.expect(await t.ev(() => Render.ext.includes(HotdogExt)), 'registered with Render');

  // ---- the stand spot is free sidewalk/grass: not in any obstacle, not on a road
  const spot = await t.ev((S) => ({ blocked: Game.obstacles().some((o) => Game.hitRect(S.x, S.y, 14, o)), road: !!CityExt.roadAt(S.x, S.y) }), K.STAND);
  t.expect(!spot.blocked, 'the stand spot is clear of every obstacle');
  t.expect(!spot.road, 'the stand spot is off the road');
  // and you can walk there from the square
  const walked = await t.ev((S) => { T.tp(S.x, S.y + 90, 'city'); T.steer(0, -1); const n = T.until(() => Game.player.y <= S.y + 2, 300); T.unsteer(); return { n, x: Game.player.x, y: Game.player.y }; }, K.STAND);
  t.expect(walked.n >= 0, `walked up to the cart (${JSON.stringify(walked)})`);

  // ---- hint nearby, nothing far away
  t.expect(await t.ev((S) => { T.tp(S.x, S.y + 200, 'city'); return T.hint() !== 'Hot dogs! 🌭'; }, K.STAND), 'no hot dog hint far away');
  const near = await t.ev((S) => { T.tp(S.x - 10, S.y + 40, 'city'); return { text: T.hint(), target: Game.hint && Game.hint.target, label: T.label() }; }, K.STAND);
  t.expectEq(near.text, 'Hot dogs! 🌭', 'hint within 60 px');
  t.expect(near.target && near.target.x === K.STAND.x && near.target.y === K.STAND.y, 'the hint points at the stand spot');
  t.expect(near.label !== '🌭 Buy a hot dog ($3)', 'no button a little way off');

  // ---- on the spot: the button
  await t.ev((S) => { Game.s.cash = 20; T.tp(S.x, S.y, 'city'); }, K.STAND);
  t.expectEq(await t.ev(() => T.label()), '🌭 Buy a hot dog ($3)', 'buy label at the stand');
  t.expectEq(await t.ev(() => T.hint()), 'Hot dogs! 🌭', 'hint at the stand');
  t.expectEq(await t.ev(() => Game.s.hotdog.eaten), 0, 'none eaten yet');
  await t.ev(() => { Render.MIN_ZOOMED_VIEW = 150; Render.setZoom(2.2); T.step(2); });
  await t.shot('stand');

  // ---- buy with cash
  const bought = await t.ev(() => { T.act(); return { cash: Game.s.cash, phase: HotdogExt.st.dog && HotdogExt.st.dog.phase, label: T.label(), paid: Game.floats.some((f) => f.text === '-$3') }; });
  t.expectEq(bought.cash, 17, 'paid $3');
  t.expectEq(bought.phase, 'give', 'the vendor hands it over');
  t.expect(bought.paid, '-$3 float');
  t.expect(bought.label !== '🌭 Buy a hot dog ($3)', 'one at a time: no button while handing over');
  await t.ev(() => T.step(30));
  t.expectEq(await t.ev(() => HotdogExt.st.dog.phase), 'hold', 'the chef holds the hot dog');
  t.expect(await t.ev(() => T.label() !== '🌭 Buy a hot dog ($3)'), 'no button while holding');
  // the hot dog is drawn at the chef's hand while he walks
  const pose = await t.ev(() => { const p = Game.player; const q = HotdogExt.dogPose(Game); return { dx: q.x - p.x, dy: q.y - p.y, held: q.held }; });
  t.expect(pose.held && Math.abs(pose.dx) > 10 && Math.abs(pose.dx) < 26 && pose.dy < -10 && pose.dy > -30, `held at the hand (${JSON.stringify(pose)})`);
  const d0 = await t.ev(() => HotdogExt.st.drawn);
  await t.wait(300);
  t.expect(await t.ev(() => HotdogExt.st.drawn) > d0, 'the held hot dog is being drawn');
  // walk a little while holding it
  const walk = await t.ev(() => { const x = Game.player.x; T.steer(-1, 0); T.step(20); T.unsteer(); T.step(1); return { moved: x - Game.player.x, phase: HotdogExt.st.dog.phase }; });
  t.expect(walk.moved > 10 && walk.phase === 'hold', `walks normally while holding (${JSON.stringify(walk)})`);
  await t.shot('holding');
  await t.ev(() => { T.step(1); HotdogExt.st.dog.t = CFG.HOTDOG.T.hold - 0.01; T.step(2); });   // skip ahead to the toss (the real game loop also runs in the background)

  // ---- the toss: up above the head, spinning, then into the mouth
  const toss = await t.ev(() => {
    const out = { phase: HotdogExt.st.dog.phase };
    T.step(Math.round(CFG.HOTDOG.T.toss * 60 * 0.5));
    const q = HotdogExt.dogPose(Game); out.midY = q.y - Game.player.y; out.rot = q.rot;
    return out;
  });
  t.expectEq(toss.phase, 'toss', 'the toss starts after holding');
  t.expect(toss.midY < -60, `the hot dog flies up over the head (${toss.midY})`);
  t.expect(Math.abs(toss.rot) > 2, `and spins (${toss.rot})`);
  await t.ev(() => { const d = HotdogExt.st.dog; d.phase = 'toss'; d.t = 0.08; HotdogExt.st.say = null; });   // the real game loop keeps running while the screenshot waits
  await t.shot('midtoss');
  const chomp = await t.ev(() => { const n = T.until(() => HotdogExt.st.dog && HotdogExt.st.dog.phase === 'yum', 120); return { n, eaten: Game.s.hotdog.eaten, chomp: Game.floats.some((f) => f.text === 'CHOMP!'), sparks: HotdogExt.st.sparks.length }; });
  t.expect(chomp.n >= 0, 'the hot dog drops into the mouth');
  t.expect(chomp.chomp, 'CHOMP! float');
  t.expect(chomp.sparks > 0, 'mustard sparkle');
  t.expectEq(chomp.eaten, 1, 'one hot dog eaten');
  await t.shot('chomp');
  const yum = await t.ev(() => { const n = T.until(() => !HotdogExt.st.dog, 120); return { n, yum: Game.floats.some((f) => f.text === 'Yum! 😋'), label: (T.tp(CFG.HOTDOG.STAND.x, CFG.HOTDOG.STAND.y, 'city'), T.label()) }; });
  t.expect(yum.n >= 0, 'the munching ends');
  t.expect(yum.yum, 'Yum! float');
  t.expectEq(yum.label, '🌭 Buy a hot dog ($3)', 'button back after eating');

  // ---- no cash: on the house
  const free = await t.ev(() => { Game.s.cash = 1; T.act(); return { cash: Game.s.cash, phase: HotdogExt.st.dog && HotdogExt.st.dog.phase, float: Game.floats.some((f) => f.text === 'On the house! 🌭') }; });
  t.expectEq(free.cash, 1, 'free when broke');
  t.expectEq(free.phase, 'give', 'still gets a hot dog');
  t.expect(free.float, 'On the house! float');
  const eaten2 = await t.ev(() => { T.until(() => !HotdogExt.st.dog, 400); return Game.s.hotdog.eaten; });
  t.expectEq(eaten2, 2, 'two eaten');

  // ---- Take-me-home mid-toss clears it
  const gh = await t.ev(() => { Game.s.cash = 20; T.tp(CFG.HOTDOG.STAND.x, CFG.HOTDOG.STAND.y, 'city'); T.act(); T.until(() => HotdogExt.st.dog && HotdogExt.st.dog.phase === 'toss', 400); const ph = HotdogExt.st.dog && HotdogExt.st.dog.phase; Game.goHome(); T.step(60); return { ph, dog: HotdogExt.st.dog, area: Game.area, eaten: Game.s.hotdog.eaten, hint: T.hint() }; });
  t.expectEq(gh.ph, 'toss', 'was mid-toss');
  t.expectEq(gh.dog, null, 'home clears the hot dog');
  t.expectEq(gh.area, 'town', 'back home');
  t.expectEq(gh.eaten, 2, 'no extra hot dog counted');
  t.expect(gh.hint !== 'Hot dogs! 🌭', 'no hot dog hint at home');

  // ---- not from a taxi or a car
  const cab = await t.ev(() => {
    T.tp(CFG.HOTDOG.STAND.x, CFG.HOTDOG.STAND.y, 'city');
    const before = T.label();
    CityExt.st.cab = { phase: 'riding', taxi: CityExt.st.taxis[0], curb: { x: Game.player.x, y: Game.player.y }, t: 0, dist: 0 };
    const riding = Game.actionLabel(), hint = HotdogExt.hint(Game);
    CityExt.st.cab = null;
    return { before, riding, hint };
  });
  t.expectEq(cab.before, '🌭 Buy a hot dog ($3)', 'button on foot');
  t.expect(cab.riding !== '🌭 Buy a hot dog ($3)', 'no button from a taxi');
  t.expectEq(cab.hint, undefined, 'no hint from a taxi');

  // ---- phone screenshots: holding and mid-toss
  await t.boot({ viewport: { width: 390, height: 844 } });
  await load();
  await t.ev(() => { Game.s.cash = 20; T.tp(CFG.HOTDOG.STAND.x, CFG.HOTDOG.STAND.y, 'city'); T.act(); T.step(40); Render.MIN_ZOOMED_VIEW = 120; Render.setZoom(3); Game.cameraSnap = true; T.step(1); });
  await t.shot('phone-holding');
  await t.ev(() => { const d = HotdogExt.st.dog; d.phase = 'toss'; d.t = 0.08; HotdogExt.st.say = null; });
  await t.shot('phone-midtoss');
  t.assertNoPageErrors();
};
