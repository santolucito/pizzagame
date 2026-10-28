'use strict';
// Rocket Island's rocket is built over three visits and then flies to Pizza Moon: visits counted once per stay
// (leaving the island, or the map, and coming back; mission control's inside does not count as leaving), the stage
// art (frame, panels + nose cone on the crane, finished with the scaffold swung away and the crane turned aside),
// the ask answers per stage, Blast off only once it is ready, the launch and the cut-scene, the moon (landing on free
// ground, the welcome toast, hints, the flag, the alien's moon pizza, a crater bounce, the buggy), the flight home,
// Take-me-home from the moon, rescues, and a reload keeping the visits and the flag. Screenshots desktop + phone.
module.exports = async (t) => {
  // until the coordinator wires js/moon.js into index.html, serve the page with it added after js/rocket.js
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/moon.js')) body = body.replace('<script src="js/rocket.js"></script>', '<script src="js/rocket.js"></script>\n  <script src="js/moon.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });   // no service worker serving a cached page
  await t.boot();
  const reg = await t.ev(() => ({
    moon: typeof MoonExt !== 'undefined', area: CFG.AREAS.moon && CFG.AREAS.moon.WORLD, buggy: !!CFG.VEHICLES.buggy,
    order: Game.ext.indexOf(RocketExt) < Game.ext.indexOf(IslandsExt) && Game.ext.indexOf(MoonExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(RocketExt) < Game.ext.indexOf(CityExt),
    render: Render.ext.includes(RocketExt) && Render.ext.includes(MoonExt), visits: Game.s.rocket.visits, flag: Game.s.moon.flag,
  }));
  t.expect(reg.moon && reg.buggy && reg.render, `moon registered ${JSON.stringify(reg)}`);
  t.expectEq(JSON.stringify(reg.area), JSON.stringify({ x0: 0, y0: 5000, x1: 2000, y1: 6200 }), 'the moon map sits in its free rectangle');
  t.expect(reg.order, 'the rocket and the moon answer before the islands and the City');
  t.expectEq(reg.visits, 0, 'no visits yet');
  t.expectEq(reg.flag, false, 'no flag yet');

  // the spots used below
  const S = await t.ev(() => {
    const R = CFG.ISLANDS.ROCKET;
    return { ask: R.ASK, isle: { x: 4000, y: 2760 }, cove: { x: 3550, y: 2730 }, start: CFG.PLAYER_START, mission: { x: 9300, y: 4200 } };
  });
  const tp = (x, y, area) => t.ev(([x, y, area]) => { T.tp(x, y, area); T.step(2); }, [x, y, area]);
  const state = () => t.ev(() => ({ visits: Game.s.rocket.visits, stage: RocketExt.stage(Game), label: T.label(), hint: T.hint(), ask: RocketExt.st.ask && RocketExt.st.ask.line, more: RocketExt.st.ask && RocketExt.st.ask.more, key: RocketExt.bgKey(Game), crane: RocketExt.craneState(RocketExt.stage(Game)), swing: RocketExt.st.swing }));

  // ---- visit 1: walk over the bridge from Starfish Cove onto Rocket Island
  await t.ev(() => { const b = CFG.ISLANDS.LINKS.find((l) => l.key === 'bridge2'); T.tp(b.x0 - 30, (b.y0 + b.y1) / 2, 'islands'); T.steer(1, 0); T.until(() => Game.s.rocket.visits > 0, 600); T.step(30); T.unsteer(); });
  let s1 = await state();
  t.expectEq(s1.visits, 1, 'walking onto Rocket Island counts one visit');
  t.expectEq(s1.stage, 0, 'stage 0: a bare frame');
  t.expectEq(s1.ask, "We're building a rocket! Come back soon!", 'a worker greets the chef');
  t.expect(!s1.crane.nose && s1.crane.ph !== 'parked', 'the crane fetches panels');
  t.expectEq(s1.key, 'rocket0', 'the sign shows stage 0');
  // walking about on the island, or stepping into mission control and out, is the same stay
  await tp(S.isle.x, S.isle.y, 'islands'); await tp(S.ask.x + 40, S.ask.y + 30, 'islands');
  await t.ev(() => { T.tp(9300, 4300, 'missionctl'); T.step(5); const M = CFG.ISLANDS.ROCKET.MISSION; T.tp(M.x, M.y + M.h / 2 + 24, 'islands'); T.step(5); });
  t.expectEq((await state()).visits, 1, 'one stay counts once (walking around, mission control and back)');
  await tp(S.ask.x, S.ask.y, 'islands');
  s1 = await state();
  t.expectEq(s1.label, '🚀 Ask about the rocket', 'ask label at the door while it is being built');
  await t.ev(() => { T.act(); T.step(2); });
  s1 = await state();
  t.expectEq(s1.more, '2 more visits!', 'stage 0 answer: 2 more visits');
  const cd = await t.ev(() => { const f = []; for (let i = 0; i < 200; i++) { T.step(1); for (const q of Game.floats) if (!f.includes(q.text)) f.push(q.text); } return { f, area: Game.area, travel: !!Game.travel }; });
  t.expect(cd.f.includes('🚧 Not yet! Coming soon!') && cd.area === 'islands' && !cd.travel, 'the countdown still ends in Not yet');
  await t.ev(() => { const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x - 60, A.y + 30, 'islands'); Render.setZoom(1); T.step(30); });
  await t.shot('stage0');

  // ---- visit 2: off the island (to Starfish Cove) and back
  await tp(S.cove.x, S.cove.y, 'islands');
  t.expectEq((await state()).visits, 1, 'leaving does not count');
  await tp(S.isle.x, S.isle.y, 'islands');
  let s2 = await state();
  t.expectEq(s2.visits, 2, 'coming back counts the second visit');
  t.expectEq(s2.stage, 1, 'stage 1: most panels on');
  t.expectEq(s2.ask, 'We made progress! Come back soon!', 'the progress greeting');
  t.expect(await t.ev(() => T.toasts.includes('🚀 The rocket grew! Come back once more!')), 'one toast for the new stage');
  t.expect(s2.crane.nose, 'the crane lifts the nose cone');
  t.expectEq(s2.key, 'rocket1', 'the art changed to stage 1');
  await tp(S.ask.x, S.ask.y, 'islands');
  t.expectEq((await state()).label, '🚀 Ask about the rocket', 'still no Blast off at stage 1');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq((await state()).more, '1 more visit!', 'stage 1 answer: 1 more visit');
  await t.ev(() => { T.step(240); const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x - 60, A.y + 30, 'islands'); RocketExt.st.crane = 0.62 * CFG.ROCKETISLE.CRANE_PERIOD; T.step(30); });
  await t.shot('stage1');

  // ---- visit 3: to another map (town) and back
  await tp(S.start.x, S.start.y, 'town');
  await tp(S.ask.x, S.ask.y + 40, 'islands');
  let s3 = await state();
  t.expectEq(s3.visits, 3, 'coming back from another map counts the third visit');
  t.expectEq(s3.stage, 2, 'stage 2: finished');
  t.expectEq(s3.ask, "It's ready! Hop in!", 'the ready greeting');
  t.expect(await t.ev(() => T.toasts.includes('🚀 The rocket is ready! Hop in!')), 'the ready toast');
  t.expectEq(s3.key, 'rocket2', 'the sign reads READY FOR LAUNCH');
  t.expectEq(s3.crane.ph, 'parked', 'the crane turned aside');
  const cheer = await t.ev(() => { T.step(300); return { swing: RocketExt.st.swing, ground: RocketExt.st.workers.every((w) => w.z === 0), hop: RocketExt.st.workers.some((w) => w.hop > 0), sparks: RocketExt.st.sparks.length }; });
  t.expect(cheer.swing === 1 && cheer.ground && cheer.sparks === 0, `the scaffold swung away and the workers came down ${JSON.stringify(cheer)}`);
  const hopped = await t.ev(() => { let h = false; for (let i = 0; i < 300 && !h; i++) { T.step(1); h = RocketExt.st.workers.some((w) => w.hop > 2); } return h; });
  t.expect(hopped, 'the workers hop for joy');
  await tp(S.ask.x, S.ask.y, 'islands');
  s3 = await state();
  t.expectEq(s3.label, '🚀 Blast off!', 'Blast off at the door once it is ready');
  t.expectEq(s3.hint, 'Press the button to blast off! 🚀', 'blast-off hint at the door');
  await t.ev(() => { const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x - 60, A.y + 30, 'islands'); T.step(30); });
  await t.shot('stage2');

  // ---- a rescue: a chef saved inside the rocket's feet goes back to its door
  const resc = await t.ev(() => { const B = CFG.ISLANDS.ROCKET.BASE, A = CFG.ISLANDS.ROCKET.ASK; T.tp(B.x, B.y - 20, 'islands'); T.step(2); return Math.hypot(Game.player.x - A.x, Game.player.y - A.y); });
  t.expect(resc < 1, 'inside the rocket: back at its door');

  // ---- blast off: climb in, 3-2-1, smoke and flames, up and off the screen, the flight, landing on the moon
  await tp(S.ask.x, S.ask.y, 'islands');
  const launch = await t.ev(() => {
    T.act();
    const fly = RocketExt.st.fly, label = T.label();
    T.until(() => RocketExt.st.fly && RocketExt.st.fly.t > 2.6, 400);
    const counting = { hint: T.hint(), smoke: RocketExt.st.smoke.length, flame: RocketExt.flyState(Game, 'islands').flame, floats: Game.floats.map((f) => f.text) };
    return { kind: fly && fly.kind, to: fly && fly.to, label, counting };
  });
  t.expectEq(launch.kind, 'launch', 'blast off starts the launch');
  t.expectEq(launch.to, 'moon', 'heading for the moon');
  t.expectEq(launch.label, null, 'no button during the launch');
  t.expectEq(launch.counting.hint, '3… 2… 1… 🚀', 'countdown hint');
  t.expect(launch.counting.smoke > 0 && launch.counting.flame > 0, 'smoke and flames during the countdown');
  t.expect(['3', '2', '1'].every((m) => launch.counting.floats.includes(m)) || launch.counting.floats.includes('1'), `the 3-2-1 floats ${JSON.stringify(launch.counting.floats)}`);
  await t.shot('countdown');
  const lift = await t.ev(() => { T.until(() => RocketExt.st.fly && RocketExt.st.fly.t > CFG.ROCKETISLE.LIFTOFF + 0.8, 400); return RocketExt.flyState(Game, 'islands').lift; });
  t.expect(lift > 50, `the rocket lifts off the pad (${Math.round(lift)})`);
  await t.shot('liftoff');
  await t.ev(() => T.until(() => !!Game.travel, 600));
  t.expect(await t.ev(() => Game.travel && Game.travel.via === 'rocket' && Game.travel.to === 'moon'), 'the rocket cut-scene starts');
  // show the cut-scene at its real length for the pictures
  await t.ev(() => { Game.travel.dur = CFG.ROCKETISLE.FLIGHT; Game.travel.t = 1.6; });
  await t.shot('flight-islands');
  await t.ev(() => { Game.travel.t = 4; });
  await t.shot('flight-space');
  await t.ev(() => { Game.travel.t = 6.6; });
  await t.shot('flight-moon');
  const land = await t.ev(() => { T.until(() => !Game.travel, 1200); const landing = !!(RocketExt.st.fly && RocketExt.st.fly.kind === 'land'); T.until(() => !RocketExt.st.fly, 600); T.step(2); const p = Game.player; return { landing, area: Game.area, x: p.x, y: p.y, free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), door: CFG.MOON.DOOR, toast: T.toasts.includes('🌙 Welcome to Pizza Moon!'), seen: Game.s.moon.seen, label: T.label(), hint: T.hint() }; });
  t.expect(land.landing, 'the rocket comes down onto the moon pad');
  t.expectEq(land.area, 'moon', 'arrived on the moon');
  t.expect(land.free && Math.hypot(land.x - land.door.x, land.y - land.door.y) < 2, `standing on free ground at the rocket's door (${land.x},${land.y})`);
  t.expect(land.toast && land.seen, 'the first-time moon toast');
  t.expectEq(land.label, '🚀 Fly home', 'fly home at the rocket');
  t.expectEq(land.hint, 'Press the button to fly home! 🚀', 'fly-home hint at the door');
  await t.ev(() => { const D = CFG.MOON.DOOR; T.tp(D.x + 120, D.y - 20, 'moon'); T.step(30); });
  await t.shot('moon');
  const away = await t.ev(() => { T.tp(1000, 5900, 'moon'); T.step(2); return Game.hint; });
  t.expect(away && away.text === 'Plant a flag on the moon! 🚩' && away.target, `a hint points to the flag ${JSON.stringify(away)}`);

  // ---- the flag
  const flag = await t.ev(() => { const F = CFG.MOON.FLAG; T.tp(F.x, F.y + 24, 'moon'); T.step(2); const label = T.label(), hint = T.hint(); T.act(); return { label, hint, flag: Game.s.moon.flag, after: T.label() }; });
  t.expectEq(flag.label, '🚩 Plant the flag', 'plant-the-flag label');
  t.expectEq(flag.hint, 'Plant the flag on the moon! 🚩', 'flag hint');
  t.expect(flag.flag && flag.after !== '🚩 Plant the flag', 'the flag is planted (and stays planted)');

  // ---- the alien: waves, hands out a free moon pizza carried 30 s
  const alien = await t.ev(() => {
    const a = MoonExt.st.alien; a.waveCd = 0; T.tp(a.x + 40, a.y + 10, 'moon'); T.step(3);
    const waved = a.wave > 0, label = T.label(), cash = Game.s.cash;
    T.act(); const treat = MoonExt.st.treat && MoonExt.st.treat.t, say = a.say && a.say.text, cash2 = Game.s.cash, label2 = T.label();
    T.step(60 * 29); const still = !!MoonExt.st.treat; T.step(90); const gone = !MoonExt.st.treat;
    return { waved, label, treat, say, cash, cash2, label2, still, gone, pizzas: Game.s.moon.pizzas };
  });
  t.expect(alien.waved, 'the alien waves at the chef');
  t.expectEq(alien.label, '🍕 Moon pizza, please!', 'moon pizza label by the alien');
  t.expect(alien.treat > 29 && alien.cash2 === alien.cash && alien.pizzas === 1, `a free moon pizza ${JSON.stringify(alien)}`);
  t.expectEq(alien.say, 'Here! A moon pizza! 🍕', 'the alien says so');
  t.expectEq(alien.label2, '👋 Say hi', 'then just say hi');
  t.expect(alien.still && alien.gone, 'carried for 30 seconds');
  await t.ev(() => { const a = MoonExt.st.alien; T.tp(a.x + 40, a.y + 10, 'moon'); T.act(); T.step(20); });
  await t.shot('alien');

  // ---- a crater: walk in, boing!
  const boing = await t.ev(() => {
    const c = CFG.MOON.CRATERS[0]; T.tp(c.x - c.rx - 30, c.y, 'moon'); T.steer(1, 0);
    const n = T.until(() => !!MoonExt.st.boing, 200); T.unsteer();
    T.step(20); const lift = MoonExt.st.boing && MoonExt.st.boing.lift, hint = T.hint();
    T.until(() => !MoonExt.st.boing, 200); T.step(2);
    const label = T.label(); const again = (T.act(), !!MoonExt.st.boing);
    T.until(() => !MoonExt.st.boing, 200);
    return { n, lift, hint, label, again, boings: Game.s.moon.boings, floats: Game.floats.map((f) => f.text) };
  });
  t.expect(boing.n >= 0 && boing.lift > 30, `walking into a crater bounces the chef up (${JSON.stringify(boing)})`);
  t.expectEq(boing.hint, 'Boing! 🌕', 'boing hint');
  t.expectEq(boing.label, '🌕 Boing!', 'the button bounces again in a crater');
  t.expect(boing.again && boing.boings >= 2, 'bounced again');

  // ---- the moon buggy
  const buggy = await t.ev(() => {
    const b = MoonExt.st.buggy; T.tp(b.x, b.y - 50, 'moon'); T.step(2);
    const near = Game.nearVehicle && Game.nearVehicle.kind; Game.enterCar(); T.step(1);
    const kind = Game.vehicle && Game.vehicle.kind, x0 = b.x;
    T.steer(1, 0.3); T.step(90); T.unsteer(); T.step(30);
    const moved = b.x - x0, hint = T.hint(), dust = MoonExt.st.dust.length;
    Game.exitCar(); T.step(2);
    return { near, kind, moved, hint, dust, drove: Game.s.moon.drove, out: !Game.driving };
  });
  t.expectEq(buggy.near, 'buggy', 'the buggy is offered nearby');
  t.expectEq(buggy.kind, 'buggy', 'driving the moon buggy');
  t.expect(buggy.moved > 150 && buggy.drove && buggy.out, `the buggy drives ${JSON.stringify(buggy)}`);
  t.expectEq(buggy.hint, 'Vroom! Drive the moon buggy 🚙', 'buggy hint');
  await t.ev(() => { const b = MoonExt.st.buggy; T.tp(b.x, b.y - 50, 'moon'); Game.enterCar(); T.steer(-1, 0); T.step(20); T.unsteer(); T.step(10); });
  await t.shot('buggy');
  await t.ev(() => { Game.exitCar(); T.step(2); });

  // ---- a rescue on the moon: stuck in a pepperoni rock goes back to the rocket's door
  const mres = await t.ev(() => { const r = CFG.MOON.ROCKS.find((q) => q[3]), D = CFG.MOON.DOOR; T.tp(r[0], r[1], 'moon'); T.step(2); return Math.hypot(Game.player.x - D.x, Game.player.y - D.y); });
  t.expect(mres < 1, 'out of the rock, back at the rocket');

  // ---- save and reload on the moon: the visits and the flag stay
  await t.ev(() => { const D = CFG.MOON.DOOR; T.tp(D.x + 60, D.y, 'moon'); Game.save(); });
  await t.reload();
  const re = await t.ev(() => ({ area: Game.area, visits: Game.s.rocket.visits, flag: Game.s.moon.flag, stage: RocketExt.stage(Game), pizzas: Game.s.moon.pizzas }));
  t.expect(re.area === 'moon' && re.visits === 3 && re.stage === 2 && re.flag === true && re.pizzas >= 1, `reload keeps the moon, the visits and the flag ${JSON.stringify(re)}`);

  // ---- fly home: the same trip backwards, landing on Rocket Island's pad
  const home = await t.ev(() => {
    const D = CFG.MOON.DOOR; T.tp(D.x, D.y, 'moon'); T.step(2);
    const label = T.label(); T.act();
    T.until(() => !!Game.travel, 800); const tr = Game.travel && { via: Game.travel.via, to: Game.travel.to };
    return { label, tr };
  });
  await t.ev(() => { Game.travel.dur = CFG.ROCKETISLE.FLIGHT; Game.travel.t = 2; });
  await t.shot('flight-home-space');
  await t.ev(() => { Game.travel.t = 6.4; });
  await t.shot('flight-home-islands');
  Object.assign(home, await t.ev(() => {
    T.until(() => !Game.travel, 800); T.step(30); const landing = RocketExt.flyState(Game, 'islands');
    return { landing: landing && landing.lift, landHint: T.hint(), landLabel: T.label() };
  }));
  await t.shot('landing-islands');
  Object.assign(home, await t.ev(() => {
    T.until(() => !RocketExt.st.fly, 600); T.step(2);
    const p = Game.player, A = CFG.ISLANDS.ROCKET.ASK;
    return { area: Game.area, d: Math.hypot(p.x - A.x, p.y - A.y), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), onIsle: RocketExt.onRocketLand(Game), visits: Game.s.rocket.visits };
  }));
  t.expect(home.landing > 100, 'the rocket comes down onto its pad');
  t.expect(home.landHint === 'Touchdown! 🚀' && home.landLabel === null, `landing hint, no button while landing ${JSON.stringify([home.landHint, home.landLabel])}`);
  t.expectEq(home.label, '🚀 Fly home', 'fly home label');
  t.expect(home.tr && home.tr.via === 'rocket' && home.tr.to === 'islands', 'the rocket flies home');
  t.expect(home.area === 'islands' && home.d < 2 && home.free && home.onIsle, `back on Rocket Island at the pad ${JSON.stringify(home)}`);
  t.expectEq(await t.ev(() => T.label()), '🚀 Blast off!', 'and can blast off again');
  await t.ev(() => { const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x - 60, A.y + 30, 'islands'); T.step(20); });

  // ---- Take me home from the moon (with a moon pizza in hand), and from the middle of a launch
  const gh = await t.ev(() => {
    const D = CFG.MOON.DOOR; T.tp(D.x + 80, D.y, 'moon'); MoonExt.st.treat = { t: 20 }; T.step(2);
    Game.goHome(); T.step(2);
    const a = { area: Game.area, treat: MoonExt.st.treat, hint: MoonExt.hint(Game), rhint: RocketExt.hint(Game) };
    const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x, A.y, 'islands'); T.act(); T.step(100);
    const mid = !!RocketExt.st.fly; Game.goHome(); T.step(2);
    return Object.assign(a, { mid, fly: RocketExt.st.fly, area2: Game.area, travel: Game.travel });
  });
  t.expectEq(gh.area, 'town', 'Take me home from the moon');
  t.expect(gh.treat === null && gh.hint === undefined && gh.rhint === undefined, 'moon state cleared, no moon hints in town');
  t.expect(gh.mid && gh.fly === null && gh.area2 === 'town' && gh.travel === null, 'Take me home mid-launch');

  // ---- phone size: each stage, the moon, the cut-scene
  await t.page.setViewportSize({ width: 390, height: 844 });
  for (const v of [0, 1, 2]) {
    const pv = await t.ev((v) => { T.tp(3550, 2730, 'islands'); Game.s.rocket.visits = v; Render.resize(); const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x, A.y + 20, 'islands'); T.step(20); return Game.s.rocket.visits; }, v);
    t.expectEq(pv, v + 1, 'phone: the visit counted');
    await t.shot(`phone-stage${v}`);
  }
  await t.ev(() => { T.act(); T.until(() => RocketExt.st.fly && RocketExt.st.fly.t > CFG.ROCKETISLE.LIFTOFF + 0.5, 400); });
  await t.shot('phone-liftoff');
  await t.ev(() => { T.until(() => !!Game.travel, 600); Game.travel.dur = CFG.ROCKETISLE.FLIGHT; Game.travel.t = 3.6; });
  await t.shot('phone-flight');
  await t.ev(() => { T.until(() => !Game.travel, 1200); T.until(() => !RocketExt.st.fly, 600); const D = CFG.MOON.DOOR; T.tp(D.x + 140, D.y - 30, 'moon'); T.step(20); });
  await t.shot('phone-moon');
  t.expectEq(await t.ev(() => Game.area), 'moon', 'phone: on the moon');
};
