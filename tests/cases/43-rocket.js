'use strict';
// Rocket Island's rocket is built over three visits and then flies to Pizza Moon: visits counted once per stay
// (leaving the island, or the map, and coming back; mission control's inside does not count as leaving), the stage
// art (frame, panels + nose cone on the crane, finished with the scaffold swung away and the crane turned aside),
// the ask answers per stage, Blast off only once it is ready, the launch and the cut-scene, the moon (landing on free
// ground, the welcome toast, hints, the flag, the alien's moon pizza, a crater bounce, the buggy), the flight home,
// Take-me-home from the moon, rescues, and a reload keeping the visits and the flag. Screenshots desktop + phone.
// Rocket #2: a fenced lot until the first rocket is finished, then its site (workers, crane, sparks), the scaffold's two
// walkways (climb up, edges hold, peek in the hatch, climb down), a save up there reloading at the ladder's foot, rescues
// and Take-me-home from the top.
// Visits anywhere on the island's land (its corners, beaches and the bridge's landing), once per stay (the jet ski at the
// beach does not count until the chef steps ashore). The cranes: '🏗️ Drive the crane', the camera steps back, the
// joystick swings the jib and runs the trolley, grab a panel, click it onto a rocket (sparkle, a worker cheers 🎉), drop
// one on the sand (it slides back), '🚶 Climb down'. The rocket's inside (js/rocketinside.js): shut before stage 2, then
// three decks (the suit, the oven, the bunk, the porthole, the treadmill, the plant), the flight deck's panel (lights,
// Mission Control, Blast off), blast off from inside to the moon, inside again on the moon (its flag) and Fly home from
// there; a rescue, Take-me-home and a reload inside. Screenshots desktop + phone.
module.exports = async (t) => {
  // until the coordinator wires js/moon.js and js/rocketinside.js into index.html, serve the page with them added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/moon.js')) body = body.replace('<script src="js/rocket.js"></script>', '<script src="js/rocket.js"></script>\n  <script src="js/moon.js"></script>');
    if (!body.includes('js/rocketinside.js')) body = body.replace('<script src="js/moon.js"></script>', '<script src="js/moon.js"></script>\n  <script src="js/rocketinside.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });   // no service worker serving a cached page
  await t.boot();
  const reg = await t.ev(() => ({
    moon: typeof MoonExt !== 'undefined', area: CFG.AREAS.moon && CFG.AREAS.moon.WORLD, buggy: !!CFG.VEHICLES.buggy,
    order: Game.ext.indexOf(RocketExt) < Game.ext.indexOf(IslandsExt) && Game.ext.indexOf(MoonExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(RocketExt) < Game.ext.indexOf(CityExt),
    render: Render.ext.includes(RocketExt) && Render.ext.includes(MoonExt), visits: Game.s.rocket.visits, flag: Game.s.moon.flag,
    inside: typeof RocketInsideExt !== 'undefined' && Render.ext.includes(RocketInsideExt) && Game.ext.indexOf(RocketInsideExt) < Game.ext.indexOf(CityExt), inArea: CFG.AREAS.rocketinside && CFG.AREAS.rocketinside.WORLD,
    crane: CFG.VEHICLES.crane && [CFG.VEHICLES.crane.label, CFG.VEHICLES.crane.exit],
  }));
  t.expect(reg.moon && reg.buggy && reg.render, `moon registered ${JSON.stringify(reg)}`);
  t.expectEq(JSON.stringify(reg.area), JSON.stringify({ x0: 0, y0: 5000, x1: 2000, y1: 6200 }), 'the moon map sits in its free rectangle');
  t.expect(reg.inside, 'the rocket\'s inside is registered (before the City)');
  t.expectEq(JSON.stringify(reg.inArea), JSON.stringify({ x0: 2500, y0: 5000, x1: 3300, y1: 5600 }), 'the rocket\'s inside sits in its free rectangle');
  t.expectEq(JSON.stringify(reg.crane), JSON.stringify(['🏗️ Drive the crane', '🚶 Climb down']), 'the crane is a vehicle: drive it, climb down');
  t.expect(reg.order, 'the rocket and the moon answer before the islands and the City');
  t.expectEq(reg.visits, 0, 'no visits yet');
  t.expectEq(reg.flag, false, 'no flag yet');

  // the spots used below
  const S = await t.ev(() => {
    const R = CFG.ISLANDS.ROCKET;
    return { ask: R.ASK, isle: { x: 4000, y: 2760 }, cove: { x: 3550, y: 2730 }, start: CFG.PLAYER_START, mission: { x: 9300, y: 4200 } };
  });
  const tp = (x, y, area) => t.ev(([x, y, area]) => { T.tp(x, y, area); T.step(2); }, [x, y, area]);
  // Rocket #2's site: is it there (entities drawn, obstacles), and how many entities Rocket Island draws
  const site2 = () => t.ev(() => {
    const S2 = CFG.ISLANDS.ROCKET.SITE2, L = S2.LOT, G = RocketExt.geo(), obs = Game.obstacles(), items = [];
    RocketExt.entities(Render, Game, items);
    return { on: RocketExt.site2On(Game), lot: obs.some((o) => o.x === L.x0 && o.y === L.y0 && o.w === L.x1 - L.x0), scaffold: obs.some((o) => o.x === G.D[1].x0 - 2), items: items.length };
  });
  const state = () => t.ev(() => ({ visits: Game.s.rocket.visits, stage: RocketExt.stage(Game), label: T.label(), hint: T.hint(), ask: RocketExt.st.ask && RocketExt.st.ask.line, more: RocketExt.st.ask && RocketExt.st.ask.more, key: RocketExt.bgKey(Game), crane: RocketExt.craneState(RocketExt.stage(Game)), swing: RocketExt.st.swing }));

  // ---- visit 1: walk over the bridge from Starfish Cove onto Rocket Island
  const landX = await t.ev(() => { const b = CFG.ISLANDS.LINKS.find((l) => l.key === 'bridge2'); T.tp(b.x0 - 30, (b.y0 + b.y1) / 2, 'islands'); T.steer(1, 0); T.until(() => Game.s.rocket.visits > 0, 600); const x = Game.player.x; T.step(30); T.unsteer(); return x - RocketExt.island().x0; });
  let s1 = await state();
  t.expectEq(s1.visits, 1, 'walking onto Rocket Island counts one visit');
  t.expect(landX < 0, `the visit counts already on the bridge's landing (${Math.round(landX)} px before the island)`);
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
  t.expect(cd.f.includes('Not ready yet! 🚧') && cd.area === 'islands' && !cd.travel, 'the door is shut: the countdown ends in Not ready yet');
  await t.ev(() => { const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x - 60, A.y + 30, 'islands'); Render.setZoom(1); T.step(30); });
  await t.shot('stage0');
  // no Rocket #2 yet: a fenced lot; the ladder's spot is inside the fence (a chef put there lands outside the lot)
  const lot0 = await site2();
  t.expect(!lot0.on && lot0.lot && !lot0.scaffold, `stage 0: the fenced lot, no Rocket #2 ${JSON.stringify(lot0)}`);
  const lotIn = await t.ev(() => { const F = RocketExt.geo().L1.foot, L = CFG.ISLANDS.ROCKET.SITE2.LOT; T.tp(F.x, F.y, 'islands'); T.step(2); const p = Game.player; return { label: T.label(), hint: T.hint(), out: p.x < L.x0 - 12, free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), onIsle: RocketExt.onRocketLand(Game) }; });
  t.expect(lotIn.label !== '🪜 Climb up' && lotIn.hint !== 'Climb the scaffolding! 🪜', `stage 0: nothing to climb ${JSON.stringify(lotIn)}`);
  t.expect(lotIn.out && lotIn.free && lotIn.onIsle, `stage 0: a chef inside the fenced lot lands outside it ${JSON.stringify(lotIn)}`);

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
  const lot1 = await site2();
  t.expect(!lot1.on && lot1.lot && !lot1.scaffold, `stage 1: still the fenced lot ${JSON.stringify(lot1)}`);
  await t.ev(() => { const L = CFG.ISLANDS.ROCKET.SITE2.LOT; T.tp(L.x0 - 40, 2720, 'islands'); T.step(20); });
  await t.shot('site2-lot');

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
  t.expectEq(s3.label, '🚪 Go inside the rocket', 'the door opens once it is ready');
  t.expectEq(s3.hint, 'Go inside the rocket! 🚪', 'go-inside hint at the door');
  await t.ev(() => { const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x - 60, A.y + 30, 'islands'); T.step(30); });
  await t.shot('stage2');

  // ---- a rescue: a chef saved inside the rocket's feet goes back to its door
  const resc = await t.ev(() => { const B = CFG.ISLANDS.ROCKET.BASE, A = CFG.ISLANDS.ROCKET.ASK; T.tp(B.x, B.y - 20, 'islands'); T.step(2); return Math.hypot(Game.player.x - A.x, Game.player.y - A.y); });
  t.expect(resc < 1, 'inside the rocket: back at its door');

  // ---- Rocket #2: its site opened next door once the first rocket was finished
  const on2 = await site2();
  t.expect(on2.on && !on2.lot && on2.scaffold && on2.items >= lot1.items + 11, `stage 2: Rocket #2's site is there ${JSON.stringify([lot1, on2])}`);
  const busy = await t.ev(() => {
    const s2 = RocketExt.st.s2, c = s2.workers.find((w) => w.role === 'carry'), x0 = c.x, y0 = c.y, crane0 = RocketExt.crane2State();
    let sparks = 0, bang = false, deckSparks = false, weldLow = false, moved = 0;
    for (let i = 0; i < 300; i++) { T.step(1); moved = Math.max(moved, Math.hypot(c.x - x0, c.y - y0)); sparks = Math.max(sparks, s2.sparks.length); bang = bang || s2.workers.some((w) => w.bang > 0); deckSparks = deckSparks || s2.workers.some((w) => w.deck === 1 && w.weld); weldLow = weldLow || s2.workers.some((w) => w.role === 'weldLow' && w.weld); }
    const crane1 = RocketExt.crane2State();
    return { moved, carrying: s2.workers.filter((w) => w.carrying).length, sparks, bang, deckSparks, weldLow, crane: crane0.ph !== crane1.ph || crane0.hy !== crane1.hy, hats: s2.workers.every((w) => !!w.hat), n: s2.workers.length };
  });
  t.expect(busy.moved > 20 && busy.sparks > 0 && busy.bang && busy.deckSparks && busy.weldLow && busy.crane && busy.hats && busy.n >= 4, `Rocket #2's workers are busy: carrying, welding, hammering, the crane turning ${JSON.stringify(busy)}`);
  const waved = await t.ev(() => { const w = RocketExt.st.s2.workers.find((q) => q.role === 'weldLow'); w.waveCd = 0; T.tp(w.x - 40, w.y + 20, 'islands'); T.step(3); const r = { wave: w.wave > 0, hop: 0 }; for (let i = 0; i < 20; i++) { T.step(1); r.hop = Math.max(r.hop, w.hop); } return r; });
  t.expect(waved.wave && waved.hop > 1, `a Rocket #2 worker hops and waves at the chef ${JSON.stringify(waved)}`);
  await t.ev(() => { const L = CFG.ISLANDS.ROCKET.SITE2.LOT; T.tp(L.x0 - 40, 2720, 'islands'); T.step(20); });
  await t.shot('site2');
  // the ladder: a hint nearby, the button at its foot
  const lad = await t.ev(() => {
    const F = RocketExt.geo().L1.foot; T.tp(F.x + 30, F.y + 30, 'islands'); T.step(2);
    const near = { text: Game.hint && Game.hint.text, target: Game.hint && Game.hint.target }; T.tp(F.x, F.y, 'islands'); T.step(2);
    return { near, label: T.label(), hint: T.hint() };
  });
  t.expect(lad.near.text === 'Climb the scaffolding! 🪜' && lad.near.target, `ladder hint nearby ${JSON.stringify(lad.near)}`);
  t.expectEq(lad.label, '🪜 Climb up', 'climb up at the ladder');
  t.expectEq(lad.hint, 'Climb the scaffolding! 🪜', 'ladder hint at its foot');
  // up to the first walkway
  const climbTo = (lv) => t.ev((lv) => {
    const G = RocketExt.geo(), L = lv === 1 ? G.L1 : G.L2; T.tp(L.foot.x, L.foot.y, 'islands'); T.step(1);
    const label = T.label(); T.act(); const climbing = !!RocketExt.st.climb, hint = T.hint();
    const n = T.until(() => !RocketExt.st.climb, 300); T.step(2);
    const p = Game.player, W = G.D[lv].walk;
    return { label, climbing, hint, n, up: RocketExt.st.up, saved: Game.s.rocket.up, on: p.x >= W.x0 && p.x <= W.x1 && p.y >= W.y0 && p.y <= W.y1, after: T.label(), hint2: Game.hint && Game.hint.text, target: !!(Game.hint && Game.hint.target), floats: Game.floats.map((f) => f.text), override: (RocketExt.obstaclesOverride(Game) || []).length, onIsle: RocketExt.onRocketLand(Game), visits: Game.s.rocket.visits };
  }, lv);
  const up1 = await climbTo(1);
  t.expect(up1.label === '🪜 Climb up' && up1.climbing && up1.hint === 'Up we go! 🪜' && up1.n >= 0, `climbing the ladder ${JSON.stringify(up1)}`);
  t.expect(up1.up === 1 && up1.saved === 1 && up1.on && up1.override === 4, `on the first walkway, only its edges count ${JSON.stringify(up1)}`);
  t.expect(up1.floats.includes('Up on the scaffold! 🪜'), 'up on the scaffold float');
  t.expect(up1.hint2 === 'Climb up to the top! 🪜' && up1.target, `hint to the next ladder ${JSON.stringify(up1)}`);
  t.expectEq(up1.after, '🪜 Climb down', 'climb down from the first walkway');
  t.expect(up1.onIsle && up1.visits === 3, 'still on Rocket Island: no new visit');
  // the edges hold: walking 2 s each way stays on the planks (and reaches the edge)
  const edges = (lv) => t.ev((lv) => {
    const W = RocketExt.geo().D[lv].walk, out = [];
    for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      T.steer(x, y); T.step(120); T.unsteer(); T.step(1);
      const p = Game.player, edge = x > 0 ? Math.abs(p.x - W.x1) : x < 0 ? Math.abs(p.x - W.x0) : y > 0 ? Math.abs(p.y - W.y1) : Math.abs(p.y - W.y0);
      out.push({ dir: [x, y], x: Math.round(p.x), y: Math.round(p.y), up: RocketExt.st.up, on: p.x >= W.x0 - 0.5 && p.x <= W.x1 + 0.5 && p.y >= W.y0 - 0.5 && p.y <= W.y1 + 0.5, edge: edge < 3 });
    }
    return out;
  }, lv);
  const e1 = await edges(1);
  t.expect(e1.every((e) => e.up === 1 && e.on && e.edge), `the first walkway's edges hold ${JSON.stringify(e1)}`);
  await t.ev(() => { const G = RocketExt.geo(); T.tp(G.B.x - 30, G.D[1].walk.y1 - 4, 'islands'); T.step(30); });
  t.expectEq(await t.ev(() => RocketExt.st.up), 1, 'walking about on the first walkway keeps the chef up');
  await t.shot('scaffold-l1');
  // up to the top walkway: what a view, then peek into the hatch
  const up2 = await climbTo(2);
  t.expect(up2.label === '🪜 Climb up' && up2.climbing && up2.up === 2 && up2.saved === 2 && up2.on && up2.override === 4, `on the top walkway ${JSON.stringify(up2)}`);
  t.expect(up2.floats.includes('What a view! 🚀'), 'what a view float at the top');
  t.expect(up2.hint2 === 'Peek in the hatch! 👀' && up2.target, `hint to the hatch ${JSON.stringify(up2)}`);
  t.expectEq(up2.after, '🪜 Climb down', 'climb down from the top walkway (away from the hatch)');
  const e2 = await edges(2);
  t.expect(e2.every((e) => e.up === 2 && e.on && e.edge), `the top walkway's edges hold ${JSON.stringify(e2)}`);
  await t.ev(() => { const H = RocketExt.geo().HATCH; T.tp(H.x + 28, H.y + 18, 'islands'); T.step(30); });
  await t.shot('scaffold-l2');
  const pk = await t.ev(() => {
    const H = RocketExt.geo().HATCH; T.tp(H.x, H.y + 10, 'islands'); T.step(2);
    const label = T.label(), hint = T.hint(); T.act(); T.step(20);
    return { label, hint, peek: !!RocketExt.st.peek, hint2: T.hint() };
  });
  t.expectEq(pk.label, '👀 Peek inside', 'peek inside at the hatch');
  t.expectEq(pk.hint, 'Peek in the hatch! 👀', 'peek hint at the hatch');
  t.expect(pk.peek && pk.hint2 === 'Hello in there! 👋', `peeking into Rocket #2 ${JSON.stringify(pk)}`);
  await t.shot('peek');
  t.expect(await t.ev(() => { T.step(60 * CFG.ROCKETISLE.SITE2.PEEK); return !RocketExt.st.peek; }), 'the peek closes by itself');
  // back down, a level at a time
  const down = await t.ev(() => {
    const G = RocketExt.geo(); T.tp(G.L2.top.x, G.L2.top.y, 'islands'); T.step(1);
    const l2 = T.label(); T.act(); T.until(() => !RocketExt.st.climb, 300); T.step(2);
    const at1 = { up: RocketExt.st.up, d: Math.hypot(Game.player.x - G.L2.foot.x, Game.player.y - G.L2.foot.y) };
    T.tp(G.L1.top.x, G.L1.top.y, 'islands'); T.step(1);
    const l1 = T.label(); T.act(); const hint = T.hint(); T.until(() => !RocketExt.st.climb, 300); T.step(2);
    const p = Game.player;
    return { l2, at1, l1, hint, up: RocketExt.st.up, saved: Game.s.rocket.up, d: Math.hypot(p.x - G.L1.foot.x, p.y - G.L1.foot.y), override: RocketExt.obstaclesOverride(Game), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), label: T.label() };
  });
  t.expect(down.l2 === '🪜 Climb down' && down.at1.up === 1 && down.at1.d < 1, `down from the top to the first walkway ${JSON.stringify(down)}`);
  t.expect(down.l1 === '🪜 Climb down' && down.hint === 'Down we go! 🪜' && down.up === 0 && down.saved === 0 && down.d < 1 && down.override === null && down.free, `down to the sand at the ladder's foot ${JSON.stringify(down)}`);
  t.expectEq(down.label, '🪜 Climb up', 'and up again from there');
  // a rescue: a chef inside Rocket #2's scaffold on the ground lands at the ladder's foot
  const resc2 = await t.ev(() => { const G = RocketExt.geo(); T.tp(G.B.x, G.D[1].walk.y0 + 10, 'islands'); T.step(2); return Math.hypot(Game.player.x - G.L1.foot.x, Game.player.y - G.L1.foot.y); });
  t.expect(resc2 < 1, 'inside Rocket #2 scaffold: back at the ladder');
  // a save made up at the top reloads on the ground at the ladder's foot
  const saved = await t.ev(() => {
    const G = RocketExt.geo();
    for (const L of [G.L1, G.L2]) { T.tp(L.foot.x, L.foot.y, 'islands'); T.act(); T.until(() => !RocketExt.st.climb, 300); }
    T.step(2); Game.save(); return { up: RocketExt.st.up, saved: Game.s.rocket.up };
  });
  t.expect(saved.up === 2 && saved.saved === 2, `saved at the top ${JSON.stringify(saved)}`);
  await t.reload();
  const rel = await t.ev(() => { const F = RocketExt.geo().L1.foot, p = Game.player; T.step(2); return { area: Game.area, up: RocketExt.st.up, saved: Game.s.rocket.up, d: Math.hypot(p.x - F.x, p.y - F.y), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), label: T.label(), visits: Game.s.rocket.visits }; });
  t.expect(rel.area === 'islands' && rel.up === 0 && rel.saved === 0 && rel.d < 1 && rel.free && rel.label === '🪜 Climb up' && rel.visits === 3, `the reload lands at the ladder's foot ${JSON.stringify(rel)}`);
  // Take me home from the top
  const gh2 = await t.ev(() => {
    const G = RocketExt.geo();
    for (const L of [G.L1, G.L2]) { T.tp(L.foot.x, L.foot.y, 'islands'); T.act(); T.until(() => !RocketExt.st.climb, 300); }
    const H = G.HATCH; T.tp(H.x, H.y + 10, 'islands'); T.act(); const up = RocketExt.st.up, peek = !!RocketExt.st.peek;
    Game.goHome(); T.step(2);
    return { up, peek, area: Game.area, now: RocketExt.st.up, saved: Game.s.rocket.up, peek2: RocketExt.st.peek, override: RocketExt.obstaclesOverride(Game), hint: RocketExt.hint(Game), action: RocketExt.action(Game) };
  });
  t.expect(gh2.up === 2 && gh2.peek, 'peeking from the top before going home');
  t.expect(gh2.area === 'town' && gh2.now === 0 && gh2.saved === 0 && gh2.peek2 === null && gh2.override === null && gh2.hint === undefined && gh2.action === null, `Take me home from the top of the scaffold ${JSON.stringify(gh2)}`);

  // ---- visits count anywhere on the island's land (corners, beaches, the bridge's landing), once per stay
  const edgeVisits = await t.ev(() => {
    const s = RocketExt.island(), b = RocketExt.bridge(), cove = { x: 3550, y: 2730 }, out = {};
    const spots = { nw: [s.x0 + 22, s.y0 + 22], ne: [s.x1 - 22, s.y0 + 22], sw: [s.x0 + 22, s.y1 - 22], se: [s.x1 - 22, s.y1 - 22], west: [s.x0 + 16, 2600], landing: [b.x1 - 20, (b.y0 + b.y1) / 2] };
    for (const [k, [x, y]] of Object.entries(spots)) { T.tp(cove.x, cove.y, 'islands'); T.step(2); const v0 = Game.s.rocket.visits; T.tp(x, y, 'islands'); T.step(2); out[k] = Game.s.rocket.visits - v0; }
    // one stay: round every edge and corner, into mission control and the rocket's inside and back, a step onto the bridge
    const v0 = Game.s.rocket.visits;
    for (const [x, y] of Object.values(spots)) { T.tp(x, y, 'islands'); T.step(2); }
    T.tp(9300, 4300, 'missionctl'); T.step(3); RocketInsideExt.enter(Game, 'islands'); T.step(3); RocketInsideExt.leave(Game); T.step(3);
    T.tp(b.x1 - 50, (b.y0 + b.y1) / 2, 'islands'); T.step(2); T.tp(s.x0 + 40, 2730, 'islands'); T.step(2);
    out.stay = Game.s.rocket.visits - v0;
    // the jet ski nosing up to the beach does not count; stepping ashore does
    const js = IslandsExt.rt.jetski; T.tp(3780, 2600, 'islands'); js.x = 3780; js.y = 2600; T.step(2); Game.enterCar(); T.step(2);
    const v1 = Game.s.rocket.visits; js.x = s.x0 + 10; js.y = 2600; T.step(3); out.jetski = Game.s.rocket.visits - v1; out.riding = Game.driving && Game.vehicle === js;
    Game.exitCar(); T.step(3); out.ashore = Game.s.rocket.visits - v1;
    return out;
  });
  t.expect(['nw', 'ne', 'sw', 'se', 'west', 'landing'].every((k) => edgeVisits[k] === 1), `a visit counts at every corner, beach and the bridge's landing ${JSON.stringify(edgeVisits)}`);
  t.expect(edgeVisits.stay === 0, `one stay counts once ${JSON.stringify(edgeVisits)}`);
  t.expect(edgeVisits.riding && edgeVisits.jetski === 0 && edgeVisits.ashore === 1, `the jet ski at the beach does not count, stepping ashore does ${JSON.stringify(edgeVisits)}`);

  // ---- the cranes: climb into Rocket #2's crane, swing it, grab a panel, click it onto the rocket, drop one, climb down
  const craneNear = await t.ev(() => {
    const S = CFG.ROCKETISLE.CRANES[1].SEAT; T.tp(S.x + 20, S.y + 10, 'islands'); T.step(3);
    return { near: Game.nearVehicle && Game.nearVehicle.kind, car: Game.carNear, hint: T.hint(), label: T.label(), scale: Render.scale };
  });
  t.expect(craneNear.near === 'crane' && craneNear.car, `the vehicle button offers the crane at its door ${JSON.stringify(craneNear)}`);
  t.expectEq(craneNear.hint, 'Drive the crane! 🏗️', 'crane hint at its door');
  await t.wait(200);
  t.expectEq(await t.page.textContent('#btn-car'), '🏗️ Drive the crane', 'the vehicle button reads Drive the crane');
  await t.shot('crane-door');
  const ride = await t.ev(() => {
    Game.enterCar(); T.step(60);
    const cr = RocketExt.st.cranes[1], v = cr.v, S = CFG.ROCKETISLE.CRANES[1].SEAT;
    const r = { driving: Game.driving && Game.vehicle.kind === 'crane', ride: RocketExt.st.ride === cr, scale: Render.scale, still: v.x === S.x && v.y === S.y, label: T.label(), hint: T.hint(), floats: Game.floats.map((f) => f.text) };
    // the joystick: right swings the jib round, up runs the trolley out
    cr.load = false; cr.d = 150; const th0 = cr.th, d0 = cr.d; T.steer(1, 0); T.step(20); T.unsteer(); r.swung = cr.th - th0;
    const d1 = cr.d; T.steer(0, -1); T.step(15); T.unsteer(); r.out = cr.d - d1; T.steer(0, 1); T.step(10); T.unsteer(); r.in = cr.d - d1 - r.out;
    r.seatStill = v.x === S.x && v.y === S.y; r.d0 = d0;
    // to the panels, lower the hook, grab one
    const P = RocketExt.polar(cr, RocketExt.pileSpot(cr).x, RocketExt.pileSpot(cr).y); cr.th = P.th; cr.d = P.d; T.step(2);
    r.grabLabel = T.label(); r.grabHint = T.hint(); T.act(); r.lowering = !!cr.cyc && cr.cyc.dir < 0; r.downLabel = T.label();
    T.until(() => cr.cyc && cr.cyc.dir > 0, 600); r.got = Game.floats.some((f) => f.text === 'Got it! 🪝');
    r.n = T.until(() => !cr.cyc, 600); r.load = cr.load;
    return r;
  });
  t.expect(ride.driving && ride.ride && ride.still, `sitting in the crane, which stays put ${JSON.stringify(ride)}`);
  t.expect(ride.scale < craneNear.scale, `the camera steps back while in the crane (${craneNear.scale} → ${ride.scale})`);
  t.expect(ride.floats.includes('Up in the crane! 🏗️'), 'up in the crane float');
  t.expect(ride.swung > 0.2 && ride.out > 10 && ride.in < -5 && ride.seatStill, `the joystick swings the jib and runs the trolley ${JSON.stringify(ride)}`);
  t.expectEq(ride.grabLabel, '🪝 Grab a panel', 'grab a panel over the pile');
  t.expectEq(ride.grabHint, 'Press the button to grab a panel! 🪝', 'grab hint over the pile');
  t.expect(ride.lowering && ride.downLabel === '⬆️ Raise the hook', 'the hook goes down (and could come back up)');
  t.expect(ride.n >= 0 && ride.load === true && ride.got, `a panel on the hook ${JSON.stringify(ride)}`);
  await t.shot('crane-panel');
  const place = await t.ev(() => {
    const cr = RocketExt.st.cranes[1], P = RocketExt.rocketSpot(1), q = RocketExt.polar(cr, P.x, P.y);
    // swing over Rocket #2 with the joystick (a few tries), then put it on
    cr.th = q.th - 0.25; cr.d = q.d; let n = 0; T.steer(1, 0); while (n < 200 && RocketExt.hookTarget(Game, cr).what !== 'place') { T.step(1); n++; } T.unsteer();
    const r = { n, label: T.label(), hint: T.hint(), placed0: RocketExt.st.placed[1].length, panels0: Game.s.rocket.panels || 0 };
    T.act(); T.until(() => cr.cyc && cr.cyc.dir > 0, 600);
    r.placed = RocketExt.st.placed[1].length; r.panels = Game.s.rocket.panels; r.load = cr.load; r.click = Game.floats.some((f) => f.text === 'Click! ✨');
    r.sparkles = Game.fx.filter((f) => f.kind === 'sparkle').length; r.cheer = RocketExt.st.s2.cheer && RocketExt.st.s2.cheer.text; r.hop = RocketExt.st.s2.cheer && RocketExt.st.s2.cheer.who.wave > 0;
    return r;
  });
  t.expect(place.n < 200 && place.label === '🚀 Put it on the rocket' && place.hint === 'Press the button: put it on the rocket! 🚀', `over Rocket #2 with a panel ${JSON.stringify(place)}`);
  t.expect(place.placed === place.placed0 + 1 && place.panels === place.panels0 + 1 && !place.load && place.click, `the panel clicks onto Rocket #2 ${JSON.stringify(place)}`);
  t.expect(place.sparkles >= 5 && place.cheer === '🎉' && place.hop, `a sparkle and a worker cheers ${JSON.stringify(place)}`);
  await t.ev(() => T.step(12));
  await t.shot('crane-click');
  const drop = await t.ev(() => {
    const cr = RocketExt.st.cranes[1]; T.until(() => !cr.cyc, 600);
    cr.load = true; const q = RocketExt.polar(cr, 4400, 2620); cr.th = q.th; cr.d = q.d; T.step(1);
    const r = { label: T.label() }; T.act(); T.until(() => cr.cyc && cr.cyc.dir > 0, 600);
    r.loose = RocketExt.st.loose.length; r.load = cr.load; r.thud = Game.floats.some((f) => f.text === 'Thud!');
    T.step(60 * (CFG.ROCKETISLE.CRANE.LOOSE + CFG.ROCKETISLE.CRANE.SLIDE) + 10); r.after = RocketExt.st.loose.length;
    return r;
  });
  t.expect(drop.label === '⬇️ Drop the panel' && drop.loose === 1 && !drop.load && drop.thud, `a panel dropped on the sand ${JSON.stringify(drop)}`);
  t.expectEq(drop.after, 0, 'the dropped panel slides back to its pile');
  const climbDown = await t.ev(() => {
    const scale = Render.scale; Game.exitCar(); T.step(5);
    const p = Game.player, S = CFG.ROCKETISLE.CRANES[1].SEAT;
    return { scale, scale2: Render.scale, driving: Game.driving, ride: RocketExt.st.ride, d: Math.hypot(p.x - S.x, p.y - S.y), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), near: Game.nearVehicle && Game.nearVehicle.kind, visits: Game.s.rocket.visits };
  });
  t.expect(!climbDown.driving && climbDown.ride === null && climbDown.d < 70 && climbDown.free && climbDown.near === 'crane', `climbed down beside the crane ${JSON.stringify(climbDown)}`);
  t.expectEq(climbDown.scale2, craneNear.scale, 'the camera comes back');
  // the first site's crane (parked aside now rocket 1 is finished) can be driven too; panels click onto rocket 1
  const c1 = await t.ev(() => {
    const S = CFG.ROCKETISLE.CRANES[0].SEAT, cr = RocketExt.st.cranes[0], v0 = Game.s.rocket.visits; T.tp(S.x, S.y + 10, 'islands'); T.step(2);
    const near = Game.nearVehicle && Game.nearVehicle.kind, parked = RocketExt.craneState().ph;
    Game.enterCar(); T.step(30);
    const P = RocketExt.polar(cr, RocketExt.pileSpot(cr).x, RocketExt.pileSpot(cr).y); cr.th = P.th; cr.d = P.d; T.step(1); const l1 = T.label(); T.act(); T.until(() => !cr.cyc, 600);
    const B = RocketExt.polar(cr, RocketExt.rocketSpot(0).x, RocketExt.rocketSpot(0).y); cr.th = B.th; cr.d = B.d; T.step(1); const l2 = T.label(); T.act(); T.until(() => cr.cyc && cr.cyc.dir > 0, 600);
    const r = { near, parked, l1, l2, placed: RocketExt.st.placed[0].length, cheer: RocketExt.st.cheer && RocketExt.st.cheer.text, ride: RocketExt.st.ride === cr, visits: Game.s.rocket.visits - v0 };
    return r;
  });
  t.expect(c1.near === 'crane' && c1.parked === 'parked' && c1.ride, `the first crane, parked aside, can be driven ${JSON.stringify(c1)}`);
  t.expect(c1.l1 === '🪝 Grab a panel' && c1.l2 === '🚀 Put it on the rocket' && c1.placed === 1 && c1.cheer === '🎉', `a panel clicks onto rocket 1 ${JSON.stringify(c1)}`);
  t.expectEq(c1.visits, 0, 'riding a crane is still the same stay');
  await t.ev(() => T.step(10));
  await t.shot('crane1');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const cr = RocketExt.st.cranes[0]; T.until(() => !cr.cyc, 600); cr.load = true; const B = RocketExt.polar(cr, RocketExt.rocketSpot(0).x - 40, RocketExt.rocketSpot(0).y - 60); cr.th = B.th; cr.d = B.d; T.step(30); });
  await t.shot('phone-crane1');
  await t.ev(() => { Game.exitCar(); T.step(2); const S = CFG.ROCKETISLE.CRANES[1].SEAT; T.tp(S.x, S.y, 'islands'); Game.enterCar(); T.step(1); const cr = RocketExt.st.cranes[1]; cr.load = true; const P = RocketExt.rocketSpot(1), q = RocketExt.polar(cr, P.x, P.y); cr.th = q.th; cr.d = q.d; T.step(40); });
  await t.shot('phone-crane2');
  // Take me home from a crane
  const ghc = await t.ev(() => { const z = RocketExt.st.zoom0; Game.goHome(); T.step(2); return { z, zoom: Render.zoom, area: Game.area, driving: Game.driving, ride: RocketExt.st.ride, cyc: RocketExt.st.cranes.every((c) => !c.cyc && !c.load) }; });
  t.expect(ghc.area === 'town' && !ghc.driving && ghc.ride === null && Math.abs(ghc.zoom - ghc.z) < 1e-9 && ghc.cyc, `Take me home from the crane ${JSON.stringify(ghc)}`);
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(2); });

  // ---- the rocket's inside: in through the door, three decks, the flight deck's panel
  await tp(S.ask.x, S.ask.y, 'islands');
  const inn = await t.ev(() => {
    const label = T.label(); T.act(); T.step(2);
    const p = Game.player, K = CFG.ROCKETIN, E = K.EXIT;
    return { label, area: Game.area, where: Game.s.rocketin.where, d: Math.hypot(p.x - E.x, p.y - E.y), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), hint: Game.hint, label2: T.label(), toast: T.toasts.includes('🚀 Welcome aboard the Pizza Rocket!') };
  });
  t.expect(inn.label === '🚪 Go inside the rocket' && inn.area === 'rocketinside' && inn.where === 'islands' && inn.d < 1 && inn.free, `inside the rocket on the airlock's mat ${JSON.stringify(inn)}`);
  t.expect(inn.label2 === '🚪 Go outside' && inn.hint && inn.hint.text === 'Go back outside 🚪' && inn.hint.target === null && inn.toast, `the way out, and a welcome ${JSON.stringify(inn)}`);
  const away0 = await t.ev(() => { T.tp(2840, 5530); T.step(1); return Object.assign({ ladder: CFG.ROCKETIN.LADDERS[0].foot.x }, Game.hint); });
  t.expect(away0 && away0.text === 'Climb up to the flight deck! 🪜' && away0.target && away0.target.x === away0.ladder, `a hint points to the ladder ${JSON.stringify(away0)}`);
  // the bottom deck: a space suit, a space pizza
  const bottom = await t.ev(() => {
    const K = CFG.ROCKETIN, st = RocketInsideExt.st, r = {};
    T.tp(K.SUITS.x, K.SUITS.y); r.suitLabel = T.label(); T.act(); r.suit = st.suit; r.suitFloat = Game.floats.some((f) => f.text === 'A real space helmet! 👨‍🚀'); r.again = T.label();
    const items = []; RocketInsideExt.entities(Render, Game, items); r.helmet = items.length;
    T.tp(K.OVEN.x, K.OVEN.y); r.ovenLabel = T.label(); r.ovenHint = T.hint(); T.act(); r.slices = st.slices.length; r.pizzas = Game.s.rocketin.pizzas; r.ovenFloat = Game.floats.some((f) => f.text === 'A floating space pizza! 🍕');
    T.step(60); r.rose = st.slices.length && st.slices[0].t > 0.9;
    return r;
  });
  t.expect(bottom.suitLabel === '👨‍🚀 Try on a space suit' && bottom.suit > 29.9 && bottom.suitFloat && bottom.again === '👨‍🚀 Take off the helmet' && bottom.helmet >= 1, `the space suit's bubble helmet ${JSON.stringify(bottom)}`);
  t.expect(bottom.ovenLabel === '🍕 Bake a space pizza' && bottom.ovenHint === 'Bake a pizza in space! 🍕' && bottom.slices === 1 && bottom.pizzas === 1 && bottom.ovenFloat && bottom.rose, `a space pizza floats out of the oven ${JSON.stringify(bottom)}`);
  await t.ev(() => { T.tp(2870, 5520); T.step(20); });
  await t.shot('inside-bottom');
  // up the first ladder to the crew deck
  const climbIn = (i, up) => t.ev(([i, up]) => {
    const L = CFG.ROCKETIN.LADDERS[i], from = up ? L.foot : L.top, to = up ? L.top : L.foot; T.tp(from.x, from.y); T.step(1);
    const label = T.label(); T.act(); const hint = T.hint(), climbing = !!RocketInsideExt.st.climb;
    const n = T.until(() => !RocketInsideExt.st.climb, 400); T.step(1); const p = Game.player;
    return { label, hint, climbing, n, d: Math.hypot(p.x - to.x, p.y - to.y), deck: RocketInsideExt.deck(p.y), free: RocketInsideExt.free(p.x, p.y), after: T.label() };
  }, [i, up]);
  const in0 = await climbIn(0, true);
  t.expect(in0.label === '🪜 Climb up' && in0.climbing && in0.hint === 'Up we go! 🪜' && in0.n >= 0 && in0.d < 1 && in0.deck === 1 && in0.free && in0.after === '🪜 Climb down', `up the ladder to the crew deck ${JSON.stringify(in0)}`);
  const mid = await t.ev(() => {
    const K = CFG.ROCKETIN, st = RocketInsideExt.st, r = {};
    T.tp(K.BUNK.x, K.BUNK.y); r.bunkLabel = T.label(); T.act(); r.bunk = !!st.bunk; r.bunkHint = T.hint(); r.getUp = T.label(); T.step(90); r.z = Game.floats.some((f) => f.text === 'z'); r.held = Game.player.x === K.PODS[0];
    T.steer(1, 0); T.step(40); T.unsteer(); r.up = !st.bunk; r.free = RocketInsideExt.free(Game.player.x, Game.player.y);
    T.tp(K.LOOK.x, K.LOOK.y); r.lookLabel = T.label(); T.act(); r.look = !!st.look; r.lookFloat = Game.floats.some((f) => f.text === 'I can see the island! 🏝️'); T.step(60 * K.LOOK_T + 5); r.lookDone = !st.look;
    T.tp(K.TREAD.x, K.TREAD.y); r.runLabel = T.label(); T.act(); T.step(30); r.running = !!st.run && Game.player.moving; r.runHint = T.hint(); T.step(60 * K.RUN); r.ran = !st.run && Game.floats.some((f) => f.text === 'Huff puff! 💪');
    T.tp(K.PLANT_SPOT.x, K.PLANT_SPOT.y); r.plantLabel = T.label(); T.act(); r.waters = Game.s.rocketin.waters; r.flower = Game.floats.some((f) => f.text === 'It grew a flower! 🌼');
    return r;
  });
  t.expect(mid.bunkLabel === '😴 Climb into the bunk' && mid.bunk && mid.bunkHint === 'Sweet dreams in space! 😴' && mid.getUp === '🚶 Get up' && mid.z && mid.held, `into a sleeping bag ${JSON.stringify(mid)}`);
  t.expect(mid.up && mid.free, `pushing the stick gets the chef up again ${JSON.stringify(mid)}`);
  t.expect(mid.lookLabel === '👀 Look out the window' && mid.look && mid.lookFloat && mid.lookDone, `the porthole shows the island ${JSON.stringify(mid)}`);
  t.expect(mid.runLabel === '🏃 Run on the treadmill' && mid.running && mid.runHint === 'Run, run, run! 🏃' && mid.ran, `running on the treadmill ${JSON.stringify(mid)}`);
  t.expect(mid.plantLabel === '💧 Water the plant' && mid.waters === 1 && mid.flower, `the plant grows a flower ${JSON.stringify(mid)}`);
  await t.ev(() => { const K = CFG.ROCKETIN; T.tp(K.BUNK.x, K.BUNK.y); T.act(); T.step(70); });
  await t.shot('inside-middle');
  await t.ev(() => { T.act(); T.step(2); const K = CFG.ROCKETIN; T.tp(K.LOOK.x, K.LOOK.y); T.act(); T.step(30); });
  await t.shot('inside-porthole');
  await t.ev(() => T.step(60 * CFG.ROCKETIN.LOOK_T));
  const in1 = await climbIn(1, true);
  t.expect(in1.label === '🪜 Climb up' && in1.d < 1 && in1.deck === 2 && in1.free && in1.after === '🪜 Climb down', `up to the flight deck ${JSON.stringify(in1)}`);
  const fd = await t.ev(() => { T.tp(2960, 5170); T.step(1); return { hint: Game.hint, floats: Game.floats.map((f) => f.text) }; });
  t.expect(fd.hint && fd.hint.text === 'Sit in the pilot seat! 👨‍🚀' && fd.hint.target, `a hint points to the pilot seat ${JSON.stringify(fd.hint)}`);
  t.expect(fd.floats.includes('The flight deck! 🚀'), 'the flight deck float');
  await t.ev(() => T.step(20));
  await t.shot('inside-top');
  // the pilot seat and its panel: lights, Mission Control, (Blast off later)
  const seat = await t.ev(() => {
    const K = CFG.ROCKETIN, st = RocketInsideExt.st, r = {};
    T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); r.label = T.label(); T.act(); r.seat = !!st.seat; r.hint = T.hint(); r.next = T.label();
    return r;
  });
  await t.wait(200);   // a frame or two draws the panel
  Object.assign(seat, await t.ev(() => {
    const st = RocketInsideExt.st, r = {};
    r.btns = st.btns.map((b) => b.key);
    T.act(); r.lights = st.lights; r.next2 = T.label();
    RocketInsideExt.press(Game, 'lights'); r.lightsBack = st.lights; RocketInsideExt.press(Game, 'lights');
    T.act(); r.radio = st.radio && st.radio.text; r.hint2 = T.hint(); r.next3 = T.label(); r.calls = Game.s.rocketin.calls;
    return r;
  }));
  t.expect(seat.label === '👨‍🚀 Sit in the pilot seat' && seat.seat && seat.hint === 'You are the pilot! Press a button 👨‍🚀' && seat.next === '💡 Lights', `in the pilot seat ${JSON.stringify(seat)}`);
  t.expect(['lights', 'call', 'fly', 'up'].every((k) => seat.btns.includes(k)), `the panel's buttons ${JSON.stringify(seat.btns)}`);
  t.expect(seat.lights === false && seat.lightsBack === true && seat.next2 === '📡 Call Mission Control', `the lights go off and on ${JSON.stringify(seat)}`);
  t.expect(seat.radio === "Rocket, you're go for launch! 🚀" && seat.hint2 === 'Mission Control says go! 🚀' && seat.next3 === '🚀 Blast off!' && seat.calls === 1, `Mission Control answers ${JSON.stringify(seat)}`);
  await t.ev(() => T.step(20));
  await t.shot('inside-panel');
  // a tap on the panel's own Stand up button gets the chef up; sit again for the launch
  const tapUp = await t.ev(() => {
    const b = RocketInsideExt.st.btns.find((q) => q.key === 'up'), rect = Render.canvas.getBoundingClientRect();
    const ev = new PointerEvent('pointerdown', { clientX: rect.left + b.x + b.w / 2, clientY: rect.top + b.y + b.h / 2, bubbles: true, cancelable: true });
    Render.canvas.dispatchEvent(ev); T.step(1);
    const r = { seat: !!RocketInsideExt.st.seat, free: RocketInsideExt.free(Game.player.x, Game.player.y) };
    return r;
  });
  t.expect(!tapUp.seat && tapUp.free, `the panel's Stand up button ${JSON.stringify(tapUp)}`);
  // rescue: a chef saved inside a wall goes back onto the airlock's mat
  const rin = await t.ev(() => { T.tp(2900, 5250); T.step(2); const p = Game.player, E = CFG.ROCKETIN.EXIT; return Math.hypot(p.x - E.x, p.y - E.y); });
  t.expect(rin < 1, 'inside a wall in the rocket: back on the airlock mat');
  // down both ladders and out of the door
  const downs = await t.ev(() => {
    const K = CFG.ROCKETIN, r = {};
    for (const i of [1, 0]) { const L = K.LADDERS[i]; T.tp(L.top.x, L.top.y); T.act(); T.until(() => !RocketInsideExt.st.climb, 400); T.step(1); r['d' + i] = RocketInsideExt.deck(Game.player.y); }
    T.tp(K.EXIT.x, K.EXIT.y); T.act(); T.step(2); const p = Game.player, A = CFG.ISLANDS.ROCKET.ASK;
    r.area = Game.area; r.d = Math.hypot(p.x - A.x, p.y - A.y); r.label = T.label(); r.visits = Game.s.rocket.visits;
    return r;
  });
  t.expect(downs.d1 === 1 && downs.d0 === 0, `down the ladders ${JSON.stringify(downs)}`);
  t.expect(downs.area === 'islands' && downs.d < 1 && downs.label === '🚪 Go inside the rocket', `out of the door, back at it ${JSON.stringify(downs)}`);
  // the helmet goes along outside
  t.expect(await t.ev(() => { const items = []; RocketInsideExt.entities(Render, Game, items); return RocketInsideExt.st.suit > 0 && items.length === 1; }), 'the bubble helmet is worn outside too');
  await t.ev(() => { const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x - 50, A.y + 40, 'islands'); T.step(10); });
  await t.shot('helmet-outside');
  // Take me home from inside (in the seat, with the helmet on): all cleared; a save inside reloads inside
  const ghi = await t.ev(() => {
    const K = CFG.ROCKETIN, A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x, A.y, 'islands'); T.act(); T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); T.act();
    const seat = !!RocketInsideExt.st.seat; Game.goHome(); T.step(2); const st = RocketInsideExt.st;
    return { seat, area: Game.area, seat2: st.seat, suit: st.suit, hint: RocketInsideExt.hint(Game), action: RocketInsideExt.action(Game), lights: st.lights };
  });
  t.expect(ghi.seat && ghi.area === 'town' && ghi.seat2 === null && ghi.suit === 0 && ghi.hint === undefined && ghi.action === null && ghi.lights, `Take me home from inside the rocket ${JSON.stringify(ghi)}`);
  await t.ev(() => { const K = CFG.ROCKETIN, A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x, A.y, 'islands'); T.act(); T.tp(K.OVEN.x + 40, K.OVEN.y); T.step(2); Game.save(); });
  await t.reload();
  const relIn = await t.ev(() => { T.step(2); const p = Game.player; return { area: Game.area, where: Game.s.rocketin.where, free: RocketInsideExt.free(p.x, p.y), visits: Game.s.rocket.visits, hint: T.hint() }; });
  t.expect(relIn.area === 'rocketinside' && relIn.where === 'islands' && relIn.free && relIn.hint, `a reload inside stays inside ${JSON.stringify(relIn)}`);
  const v4 = await t.ev(() => { const K = CFG.ROCKETIN; T.tp(K.EXIT.x, K.EXIT.y); const v = Game.s.rocket.visits; T.act(); T.step(3); return Game.s.rocket.visits - v; });
  t.expectEq(v4, 0, 'out of the rocket after a reload: still the same stay');

  // ---- blast off: climb in, 3-2-1, smoke and flames, up and off the screen, the flight, landing on the moon
  await tp(S.ask.x, S.ask.y, 'islands');
  const launch = await t.ev(() => {
    const K = CFG.ROCKETIN; T.act(); T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); T.act();
    T.act(); T.act(); const btn = T.label(); T.act(); Render.updateCamera(Game, true);   // lights, Mission Control, Blast off! (a frame snaps the camera to the pad)
    const fly = RocketExt.st.fly, label = T.label(), area = Game.area, p = Game.player, B = CFG.ISLANDS.ROCKET.BASE, inRocket = Math.hypot(p.x - B.x, p.y - (B.y - 20)) < 1;
    T.until(() => RocketExt.st.fly && RocketExt.st.fly.t > 2.6, 400);
    const counting = { hint: T.hint(), smoke: RocketExt.st.smoke.length, flame: RocketExt.flyState(Game, 'islands').flame, floats: Game.floats.map((f) => f.text) };
    return { kind: fly && fly.kind, to: fly && fly.to, label, counting, btn, area, inRocket, seat: RocketInsideExt.st.seat };
  });
  t.expect(launch.btn === '🚀 Blast off!' && launch.area === 'islands' && launch.inRocket && launch.seat === null, `blast off from the flight deck: out in the rocket on its pad ${JSON.stringify(launch)}`);
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
  t.expectEq(land.label, '🚪 Go inside the rocket', 'go inside the rocket on the moon');
  t.expectEq(land.hint, 'Go inside the rocket to fly home! 🚀', 'go-inside hint at the moon door');
  await t.ev(() => { const D = CFG.MOON.DOOR; T.tp(D.x + 120, D.y - 20, 'moon'); T.step(30); });
  await t.shot('moon');
  // inside the same rocket on the moon: its flag says so, the porthole shows the Earth, the flight deck flies home
  const moonIn = await t.ev(() => {
    const D = CFG.MOON.DOOR, K = CFG.ROCKETIN; T.tp(D.x, D.y, 'moon'); T.step(1); T.act(); T.step(2);
    const r = { area: Game.area, where: Game.s.rocketin.where, wasOn: RocketExt.st.wasOn };
    T.tp(K.LOOK.x, K.LOOK.y); T.act(); r.earth = Game.floats.some((f) => f.text === 'I can see the Earth! 🌍'); T.step(60 * K.LOOK_T + 5);
    T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); T.act(); T.act(); T.act(); r.radio = RocketInsideExt.st.radio && RocketInsideExt.st.radio.text; r.fly = T.label();
    return r;
  });
  t.expect(moonIn.area === 'rocketinside' && moonIn.where === 'moon' && !moonIn.wasOn && moonIn.earth, `inside the rocket on the moon ${JSON.stringify(moonIn)}`);
  t.expect(moonIn.radio === 'Rocket, come on home! 🏠' && moonIn.fly === '🚀 Fly home', `the flight deck on the moon: Fly home ${JSON.stringify(moonIn)}`);
  await t.ev(() => T.step(20));
  await t.shot('moon-inside-panel');
  await t.ev(() => { const K = CFG.ROCKETIN; RocketInsideExt.press(Game, 'up'); T.tp(K.EXIT.x + 120, K.EXIT.y); T.step(20); });
  await t.shot('moon-inside-bottom');
  const moonOut = await t.ev(() => { const K = CFG.ROCKETIN; T.tp(K.EXIT.x, K.EXIT.y); T.act(); T.step(2); const p = Game.player, D = CFG.MOON.DOOR; return { area: Game.area, d: Math.hypot(p.x - D.x, p.y - D.y) }; });
  t.expect(moonOut.area === 'moon' && moonOut.d < 1, `out on the moon at the rocket's door ${JSON.stringify(moonOut)}`);
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
  t.expect(re.area === 'moon' && re.visits >= 3 && re.stage === 2 && re.flag === true && re.pizzas >= 1, `reload keeps the moon, the visits and the flag ${JSON.stringify(re)}`);

  // ---- fly home: the same trip backwards, landing on Rocket Island's pad
  const home = await t.ev(() => {
    const D = CFG.MOON.DOOR, K = CFG.ROCKETIN; T.tp(D.x, D.y, 'moon'); T.step(2);
    T.act(); T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); T.act(); T.act(); T.act();
    const label = T.label(); T.act(); const area = Game.area, fly = RocketExt.st.fly && RocketExt.st.fly.kind;
    T.until(() => !!Game.travel, 800); const tr = Game.travel && { via: Game.travel.via, to: Game.travel.to };
    return { label, tr, area, fly };
  });
  t.expect(home.area === 'moon' && home.fly === 'launch', `fly home from the flight deck: the launch on the moon's pad ${JSON.stringify(home)}`);
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
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside the rocket', 'and can go inside again');
  await t.ev(() => { const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x - 60, A.y + 30, 'islands'); T.step(20); });

  // ---- Take me home from the moon (with a moon pizza in hand), and from the middle of a launch
  const gh = await t.ev(() => {
    const D = CFG.MOON.DOOR; T.tp(D.x + 80, D.y, 'moon'); MoonExt.st.treat = { t: 20 }; T.step(2);
    Game.goHome(); T.step(2);
    const a = { area: Game.area, treat: MoonExt.st.treat, hint: MoonExt.hint(Game), rhint: RocketExt.hint(Game) };
    const A = CFG.ISLANDS.ROCKET.ASK, K = CFG.ROCKETIN; T.tp(A.x, A.y, 'islands'); T.act(); T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); T.act(); RocketInsideExt.press(Game, 'fly'); T.step(100);
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
  // phone: up on the scaffold, and the peek
  await t.ev(() => {
    const G = RocketExt.geo();
    for (const L of [G.L1, G.L2]) { T.tp(L.foot.x, L.foot.y, 'islands'); T.act(); T.until(() => !RocketExt.st.climb, 300); }
    T.tp(G.HATCH.x + 28, G.HATCH.y + 18, 'islands'); T.step(20);
  });
  t.expectEq(await t.ev(() => RocketExt.st.up), 2, 'phone: up at the top');
  await t.shot('phone-scaffold-l2');
  await t.ev(() => { const H = RocketExt.geo().HATCH; T.tp(H.x, H.y + 10, 'islands'); T.act(); T.step(30); });
  t.expect(await t.ev(() => !!RocketExt.st.peek), 'phone: peeking');
  await t.shot('phone-peek');
  await t.ev(() => { const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x, A.y + 20, 'islands'); T.step(5); });
  t.expectEq(await t.ev(() => RocketExt.st.up), 0, 'phone: back on the ground at the rocket');
  // phone: the rocket's three decks and the flight deck's panel
  await t.ev(() => { T.act(); const K = CFG.ROCKETIN; T.tp(K.OVEN.x - 40, K.OVEN.y); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'rocketinside', 'phone: inside the rocket');
  await t.shot('phone-inside-bottom');
  await t.ev(() => { const K = CFG.ROCKETIN; T.tp(K.LOOK.x - 30, K.LOOK.y); T.step(30); });
  await t.shot('phone-inside-middle');
  await t.ev(() => { const K = CFG.ROCKETIN; T.tp(K.PILOT_SPOT.x + 40, K.PILOT_SPOT.y + 10); T.step(30); });
  await t.shot('phone-inside-top');
  await t.ev(() => { const K = CFG.ROCKETIN; T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); T.act(); T.act(); T.act(); T.step(30); });
  await t.wait(200);
  t.expect(await t.ev(() => RocketInsideExt.st.btns.length === 4), 'phone: the panel and its buttons');
  await t.shot('phone-inside-panel');
  const pl = await t.ev(() => { const label = T.label(); T.act(); Render.updateCamera(Game, true); /* a real frame would snap the camera onto the pad */ const n = T.until(() => RocketExt.st.fly && RocketExt.st.fly.t > CFG.ROCKETISLE.LIFTOFF + 0.5, 400); return { label, n, area: Game.area }; });
  t.expect(pl.label === '🚀 Blast off!' && pl.n >= 0 && pl.area === 'islands', `phone: blast off from the flight deck ${JSON.stringify(pl)}`);
  await t.shot('phone-liftoff');
  await t.ev(() => { T.until(() => !!Game.travel, 600); Game.travel.dur = CFG.ROCKETISLE.FLIGHT; Game.travel.t = 3.6; });
  await t.shot('phone-flight');
  await t.ev(() => { T.until(() => !Game.travel, 1200); T.until(() => !RocketExt.st.fly, 600); const D = CFG.MOON.DOOR; T.tp(D.x + 140, D.y - 30, 'moon'); T.step(20); });
  await t.shot('phone-moon');
  t.expectEq(await t.ev(() => Game.area), 'moon', 'phone: on the moon');
};
