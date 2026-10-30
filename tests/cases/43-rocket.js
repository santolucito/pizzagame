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
// beach does not count until the chef steps ashore). The trucks, sized like the concrete mixer and kept on the island's
// land: the rocket fuel truck (drive it to a rocket, '⛽ Fuel the rocket!': the hose reaches out, the gauge fills, a worker
// cheers 🎉; a horn toot elsewhere; hop out). The tower cranes ('🏗️ Drive the crane', no zoom, the camera follows the
// hook): the joystick moves the hook over the ground; steer it to the pile, '🪝 Grab a panel', steer to a rocket, '🚀 Put
// it on the rocket': sparkle, a worker cheers 🎉; '⬇️ Put it down' elsewhere, it slides back; '🚶 Climb down'; the
// second crane only with Rocket #2's site. The rocket's inside (js/rocketinside.js): shut before stage 2, then
// three decks (the suit, the oven, the bunk, the porthole, the treadmill, the plant), the flight deck (sit in the pilot
// seat: no panel, Mission Control's bubble, the big button says Blast off), blast off from inside to the moon, inside again on the moon (its flag) and Fly home from
// there; a rescue, Take-me-home and a reload inside. Screenshots desktop + phone.
module.exports = async (t) => {
  // until the coordinator wires js/towercrane.js, js/moon.js and js/rocketinside.js into index.html, serve the page with them added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/towercrane.js')) body = body.replace('<script src="js/islands.js"></script>', '<script src="js/islands.js"></script>\n  <script src="js/towercrane.js"></script>');
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
    fuel: CFG.VEHICLES.fueltruck && [CFG.VEHICLES.fueltruck.label, CFG.VEHICLES.fueltruck.exit, CFG.VEHICLES.fueltruck.speed > 100],
  }));
  t.expect(reg.moon && reg.buggy && reg.render, `moon registered ${JSON.stringify(reg)}`);
  t.expectEq(JSON.stringify(reg.area), JSON.stringify({ x0: 0, y0: 5000, x1: 2000, y1: 6200 }), 'the moon map sits in its free rectangle');
  t.expect(reg.inside, 'the rocket\'s inside is registered (before the City)');
  t.expectEq(JSON.stringify(reg.inArea), JSON.stringify({ x0: 2500, y0: 5000, x1: 3300, y1: 5600 }), 'the rocket\'s inside sits in its free rectangle');
  t.expectEq(JSON.stringify(reg.crane), JSON.stringify(['🏗️ Drive the crane', '🚶 Climb down']), 'the crane is a vehicle: drive it, climb down');
  t.expectEq(JSON.stringify(reg.fuel), JSON.stringify(['⛽ Drive the fuel truck', '🚶 Hop out', true]), 'the rocket fuel truck is a vehicle that drives');
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
  const state = () => t.ev(() => ({ visits: Game.s.rocket.visits, stage: RocketExt.stage(Game), label: T.label(), hint: T.hint(), ask: RocketExt.st.ask && RocketExt.st.ask.line, more: RocketExt.st.ask && RocketExt.st.ask.more, key: RocketExt.bgKey(Game), crane: RocketExt.craneState(), swing: RocketExt.st.swing, trucks: RocketExt.vehicles(Game).concat(TowerCrane.vehicles(Game)).map((v) => v.kind + (v.tc ? ':' + v.tc : '')).join(',') }));

  // ---- visit 1: walk over the bridge from Starfish Cove onto Rocket Island
  const landX = await t.ev(() => { const b = CFG.ISLANDS.LINKS.find((l) => l.key === 'bridge2'); T.tp(b.x0 - 30, (b.y0 + b.y1) / 2, 'islands'); T.steer(1, 0); T.until(() => Game.s.rocket.visits > 0, 600); const x = Game.player.x; T.step(30); T.unsteer(); return x - RocketExt.island().x0; });
  let s1 = await state();
  t.expectEq(s1.visits, 1, 'walking onto Rocket Island counts one visit');
  t.expect(landX < 0, `the visit counts already on the bridge's landing (${Math.round(landX)} px before the island)`);
  t.expectEq(s1.stage, 0, 'stage 0: a bare frame');
  t.expectEq(s1.ask, "We're building a rocket! Come back soon!", 'a worker greets the chef');
  t.expect(!s1.crane.nose && s1.crane.ph !== 'parked', 'the crane fetches panels');
  t.expectEq(s1.trucks, 'fueltruck,crane:rocket1', 'the fuel truck and the first crane can be climbed into (no second crane yet)');
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

  // ---- the trucks are regular size: like Construction Town's concrete mixer and dump truck (radius and drawn size)
  const size = await t.ev(() => {
    const bbox = (kind, v) => {
      const c = document.createElement('canvas'); c.width = 400; c.height = 300; const cx = c.getContext('2d'), ctx0 = Render.ctx;
      Render.ctx = cx; cx.translate(200, 150);
      try { Render.drawVehicle(kind, Game, undefined, v); } finally { Render.ctx = ctx0; }
      const d = cx.getImageData(0, 0, 400, 300).data; let x0 = 400, y0 = 300, x1 = -1, y1 = -1;
      for (let y = 0; y < 300; y++) for (let x = 0; x < 400; x++) if (d[(y * 400 + x) * 4 + 3] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return { w: x1 - x0 + 1, h: y1 - y0 + 1 };
    };
    const V = CFG.VEHICLES, st = RocketExt.st;
    return {
      mixer: bbox('mixer', { kind: 'mixer', x: 0, y: 0, angle: 0, drum: 0 }), dump: bbox('dumptruck', Game.dumptruck), fuel: bbox('fueltruck', st.truck),
      r: { mixer: V.mixer.radius, dump: V.dumptruck.radius, fuel: V.fueltruck.radius },
    };
  });
  const like = (a, b) => a.w >= b.w * 0.85 && a.w <= b.w * 1.15 && a.h >= b.h * 0.85 && a.h <= b.h * 1.2;
  t.expect(like(size.fuel, size.mixer) && like(size.fuel, size.dump), `the fuel truck is drawn the mixer's size ${JSON.stringify(size)}`);
  t.expect(size.r.fuel === size.r.mixer && Math.abs(size.r.fuel - size.r.dump) <= 2, `its radius matches the mixer's ${JSON.stringify(size.r)}`);

  // ---- the rocket fuel truck: parked by pad 1; climb in, drive to the rocket, fuel it, hop out
  const fpark = await t.ev(() => {
    const v = RocketExt.st.truck, P = CFG.ROCKETISLE.TRUCK.PARK, A = CFG.ISLANDS.ROCKET.ASK; T.tp(P.x, P.y - 48, 'islands'); Render.setZoom(1.6); T.step(3);
    return { at: Math.hypot(v.x - P.x, v.y - P.y), d: Math.hypot(P.x - A.x, P.y - A.y), near: Game.nearVehicle === v, hint: T.hint(), zoom: Render.zoom };
  });
  t.expect(fpark.at < 1 && fpark.d < 220 && fpark.near, `the fuel truck is parked by the first pad ${JSON.stringify(fpark)}`);
  t.expectEq(fpark.hint, 'Drive the fuel truck! ⛽', 'fuel truck hint beside it');
  await t.wait(200);
  t.expectEq(await t.page.textContent('#btn-car'), '⛽ Drive the fuel truck', 'the vehicle button reads Drive the fuel truck');
  await t.shot('fuel-parked');
  const fuel = await t.ev(() => {
    const v = RocketExt.st.truck, st = RocketExt.st; Game.enterCar(); T.step(2);
    const r = { driving: Game.driving && Game.vehicle === v, zoom: Render.zoom, label0: T.label(), hint0: T.hint(), target0: !!(Game.hint && Game.hint.target) };
    // drive east along the pad's south edge until the button offers fuel
    T.steer(1, 0); r.n = T.until(() => T.label() === '⛽ Fuel the rocket!', 400); T.step(10); T.unsteer(); T.step(20);
    r.label = T.label(); r.hint = T.hint(); r.x = v.x; r.y = v.y; r.moved = v.x - CFG.ROCKETISLE.TRUCK.PARK.x;
    r.gauge0 = st.gauge[0]; T.act();
    r.fueling = !!st.fuel; r.glug = Game.floats.some((f) => f.text === 'Glug glug ⛽'); r.hint2 = T.hint(); r.label2 = T.label();
    T.step(30); r.hose = !!st.fuel;
    // the joystick does not pull the truck away while the hose is out
    T.steer(-1, 0); T.step(30); T.unsteer(); r.held = Math.hypot(v.x - r.x, v.y - r.y);
    r.mid = st.gauge[0];
    T.until(() => st.fuel && st.fuel.done, 600); r.cheer = st.cheer && st.cheer.text; r.who = st.cheer && st.cheer.who.wave > 0;
    T.until(() => !st.fuel, 600);
    r.full = st.gauge[0]; r.fuelled = Game.s.rocket.fuel; r.fullFloat = Game.floats.some((f) => f.text === 'Full tank! 🚀'); r.zoom2 = Render.zoom;
    return r;
  });
  t.expect(fuel.driving && fuel.label0 === '📯 Toot toot!' && fuel.hint0 === 'Drive to a rocket! ⛽' && fuel.target0, `in the fuel truck: a horn, and a hint to the rocket ${JSON.stringify(fuel)}`);
  t.expect(fuel.n >= 0 && fuel.moved > 30 && fuel.label === '⛽ Fuel the rocket!' && fuel.hint === 'Fuel the rocket! ⛽', `drove up to the rocket ${JSON.stringify(fuel)}`);
  t.expect(fuel.fueling && fuel.glug && fuel.hint2 === 'Glug glug! ⛽' && fuel.label2 === null && fuel.hose, `fuelling: the hose goes out, glug glug ${JSON.stringify(fuel)}`);
  t.expect(fuel.held < 1 && fuel.mid > fuel.gauge0 && fuel.mid < 1, `the truck stays put while the gauge fills ${JSON.stringify(fuel)}`);
  t.expect(fuel.full === 1 && fuel.fuelled === 1 && fuel.fullFloat && fuel.cheer === '🎉' && fuel.who, `the gauge is full and a worker cheers ${JSON.stringify(fuel)}`);
  t.expect(Math.abs(fuel.zoom2 - fpark.zoom) < 1e-9 && Math.abs(fuel.zoom - fpark.zoom) < 1e-9, 'the camera does not zoom while driving');
  await t.ev(() => { const st = RocketExt.st; RocketExt.startFuel(Game, st.truck, 0); T.step(60); });
  await t.shot('fuel-fuelling');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Render.setZoom(1.4); Game.cameraSnap = true; T.step(30); });
  await t.shot('phone-fuel-fuelling');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  // it stays on the island: driving hard at the bridge, the beaches and the water never takes it off the land
  const onLand = await t.ev(() => {
    const v = RocketExt.st.truck, s = RocketExt.island(), m = CFG.ROCKETISLE.LAND_M, out = [];
    T.until(() => !RocketExt.st.fuel, 600); Render.resize();
    for (const [x, y, n] of [[-1, 0, 240], [0, 1, 120], [-1, -0.2, 120], [0, -1, 300], [1, 0, 400], [0, 1, 300], [-1, 0.3, 300]]) {
      T.steer(x, y); T.step(n); T.unsteer(); T.step(5);
      out.push({ x: Math.round(v.x), y: Math.round(v.y), bad: Math.round(RocketExt.truckBad(Game, v.x, v.y, v.angle) * 10) / 10, on: v.x >= s.x0 + m - 0.5 && v.x <= s.x1 - m + 0.5 && v.y >= s.y0 + m - 0.5 && v.y <= s.y1 - m + 0.5, chef: Game.player.x === v.x && Game.player.y === v.y, driving: Game.vehicle === v });
    }
    return { out, visits: Game.s.rocket.visits };
  });
  t.expect(onLand.out.every((o) => o.on && o.bad < 4 && o.chef && o.driving), `the fuel truck stays on Rocket Island's land ${JSON.stringify(onLand)}`);
  t.expectEq(onLand.visits, 1, 'driving about the island is the same stay');
  const fout = await t.ev(() => {
    const v = RocketExt.st.truck; Game.exitCar(); T.step(3); const p = Game.player;
    return { driving: Game.driving, d: Math.hypot(p.x - v.x, p.y - v.y), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), near: Game.nearVehicle === v, visits: Game.s.rocket.visits };
  });
  t.expect(!fout.driving && fout.d < 70 && fout.free && fout.near && fout.visits === 1, `hopped out beside the fuel truck ${JSON.stringify(fout)}`);

  // ---- the first tower crane: climb in at the mast's door; the joystick moves the hook over the ground (the camera
  // follows it), steer it to the pile, grab a panel, steer to the rocket, put it on; put one down elsewhere; climb down
  const steerHelpers = () => t.ev(() => {
    // push the joystick straight at a ground spot until the button reads `label` (or `max` steps)
    window.steerHook = (cr, P, label, max) => {
      let n = 0;
      for (; n < (max || 400); n++) {
        if (T.label() === label) break;
        const G = TowerCrane.hook(cr), dx = P.x - G.x, dy = P.y - G.y, d = Math.hypot(dx, dy) || 1;
        T.steer(dx / d, dy / d); T.step(1);
      }
      T.unsteer(); return T.label() === label ? n : -1;
    };
  });
  await steerHelpers();
  const cdoor = await t.ev(() => {
    const cr = TowerCrane.get('rocket1'), S = CFG.ROCKETISLE.CRANES[0].SEAT; T.tp(S.x - 20, S.y + 10, 'islands'); T.step(3);
    return { near: Game.nearVehicle === cr.v, hint: T.hint(), zoom: Render.zoom, scale: Render.scale, second: TowerCrane.vehicles(Game).includes(TowerCrane.get('rocket2').v) };
  });
  t.expect(cdoor.near && cdoor.hint === 'Drive the crane! 🏗️', `the vehicle button offers the crane at its door ${JSON.stringify(cdoor)}`);
  t.expect(!cdoor.second, 'no second crane before Rocket #2\'s site opens');
  await t.wait(200);
  t.expectEq(await t.page.textContent('#btn-car'), '🏗️ Drive the crane', 'the vehicle button reads Drive the crane');
  const crane = await t.ev(() => {
    const st = RocketExt.st, cr = TowerCrane.get('rocket1'), S = CFG.ROCKETISLE.CRANES[0].SEAT, K = CFG.TOWERCRANE; Game.enterCar(); T.step(30); cr.load = false;
    const G0 = TowerCrane.hook(cr), p = Game.player;
    const r = { driving: Game.driving && Game.vehicle === cr.v, ride: TowerCrane.ride === cr, still: cr.v.x === S.x && cr.v.y === S.y, zoom: Render.zoom, scale: Render.scale, up: Game.floats.some((f) => f.text === 'Up in the crane! 🏗️'), cam: Math.hypot(p.x - G0.x, p.y - (G0.y - 50)) };
    // the joystick moves the hook like walking: left goes left, up goes up (from the middle of its reach)
    const M = { x: cr.C.x - 90, y: cr.C.y + 90 };
    for (let i = 0; i < 300; i++) { const G = TowerCrane.hook(cr), dx = M.x - G.x, dy = M.y - G.y, d = Math.hypot(dx, dy); if (d < 4) break; T.steer(dx / d, dy / d); T.step(1); }
    T.unsteer(); const Gm = TowerCrane.hook(cr); r.mid = Math.round(Math.hypot(Gm.x - M.x, Gm.y - M.y));
    T.steer(-1, 0); T.step(15); T.unsteer(); const G1 = TowerCrane.hook(cr); r.left = G1.x - Gm.x; r.leftY = Math.abs(G1.y - Gm.y);
    T.steer(0, -1); T.step(15); T.unsteer(); const G2 = TowerCrane.hook(cr); r.upMove = G2.y - G1.y;
    // pushed far away the hook stops at the jib's reach and on the sand
    T.steer(1, 1); T.step(240); T.unsteer(); const G3 = TowerCrane.hook(cr); r.reach = Math.round(U.dist(cr.C.x, cr.C.y, G3.x, G3.y)); r.L = cr.L; r.land = RocketExt.landOk(G3);
    // to the pile, grab
    r.n1 = window.steerHook(cr, TowerCrane.pileSpot(TowerCrane.piles(Game, cr)[0]), '🪝 Grab a panel'); r.grabHint = T.hint();
    T.act(); r.during = T.label(); r.dip = T.until(() => !cr.cyc, 120); r.load = cr.load; r.got = Game.floats.some((f) => f.text === 'Got it! 🪝'); r.carryHint = T.hint();
    return r;
  });
  t.expect(crane.driving && crane.ride && crane.still && crane.up, `up in the crane, which stays put ${JSON.stringify(crane)}`);
  t.expect(Math.abs(crane.zoom - cdoor.zoom) < 1e-9 && crane.cam < 1, `no zoom; the camera follows the hook ${JSON.stringify(crane)}`);
  t.expect(crane.left < -40 && crane.leftY < 2 && crane.upMove < -40, `the joystick moves the hook left and up ${JSON.stringify(crane)}`);
  t.expect(crane.reach <= crane.L - 7 && crane.land, `the hook stops at the jib's reach ${JSON.stringify(crane)}`);
  t.expect(crane.n1 >= 0 && crane.grabHint === 'Grab a panel! 🪝', `steered the hook to the pile ${JSON.stringify(crane)}`);
  t.expect(crane.during === '🪝 Grab a panel' && crane.dip >= 0 && crane.dip < 60 && crane.load && crane.got && crane.carryHint === 'Move the panel to the rocket! 🚀', `one quick dip grabs a panel ${JSON.stringify(crane)}`);
  await t.ev(() => { T.step(20); T.act(); T.step(10); });   // the next press puts it down right by the pile; grab it back for the pictures
  await t.ev(() => { const cr = TowerCrane.get('rocket1'); T.until(() => !cr.cyc, 120); T.step(20); window.steerHook(cr, TowerCrane.pileSpot(TowerCrane.piles(Game, cr)[0]), '🪝 Grab a panel'); Render.setZoom(1.3); T.act(); T.step(24); });
  await t.shot('crane-grab');
  const cplace = await t.ev(() => {
    const st = RocketExt.st, cr = TowerCrane.get('rocket1'); T.until(() => !cr.cyc, 120);
    const n = window.steerHook(cr, RocketExt.rocketSpot(0), '🚀 Put it on the rocket');
    const r = { n, hint: T.hint(), placed0: st.placed[0].length, panels0: Game.s.rocket.panels || 0 };
    T.act(); T.step(16); r.lifting = cr.z > 150 && cr.load;
    return r;
  });
  t.expect(cplace.n >= 0 && cplace.hint === 'Put the panel on the rocket! 🚀', `steered the panel over to the rocket ${JSON.stringify(cplace)}`);
  t.expect(cplace.lifting, `the hook lifts the panel up the rocket ${JSON.stringify(cplace)}`);
  await t.shot('crane-place');
  const click = await t.ev(() => {
    const st = RocketExt.st, cr = TowerCrane.get('rocket1'); const dip = T.until(() => !cr.cyc, 120); T.step(2);
    return { dip, load: cr.load, placed: st.placed[0].length, panels: Game.s.rocket.panels, click: Game.floats.some((f) => f.text === 'Click! ✨'), sparkles: Game.fx.filter((f) => f.kind === 'sparkle').length, cheer: st.cheer && st.cheer.text, hop: st.cheer && st.cheer.who.wave > 0 };
  });
  t.expect(!click.load && click.dip < 60 && click.placed === cplace.placed0 + 1 && click.panels === cplace.panels0 + 1, `the panel clicks onto the rocket ${JSON.stringify(click)}`);
  t.expect(click.click && click.sparkles >= 5 && click.cheer === '🎉' && click.hop, `a sparkle and a worker cheers ${JSON.stringify(click)}`);
  await t.ev(() => T.step(4));
  await t.shot('crane-click');
  const cdown = await t.ev(() => {
    const st = RocketExt.st, cr = TowerCrane.get('rocket1');
    const n = window.steerHook(cr, TowerCrane.pileSpot(TowerCrane.piles(Game, cr)[0]), '🪝 Grab a panel'); T.act(); T.until(() => !cr.cyc, 120);
    const r = { n, load: cr.load };
    T.steer(1, 0); T.step(30); T.unsteer(); r.label = T.label(); r.hint = T.hint(); T.act(); T.until(() => !cr.cyc, 120);
    T.step(10); r.loose = cr.loose.length; r.load2 = cr.load; r.thud = Game.floats.some((f) => f.text === 'Thud!'); r.empty = T.label();
    T.step(60 * (CFG.TOWERCRANE.LOOSE + CFG.TOWERCRANE.SLIDE) + 10); r.after = cr.loose.length;
    Game.exitCar(); T.step(3); const p = Game.player, S = CFG.ROCKETISLE.CRANES[0].SEAT;
    Object.assign(r, { driving: Game.driving, ride: TowerCrane.ride, d: Math.hypot(p.x - S.x, p.y - S.y), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), near: Game.nearVehicle === cr.v, zoom: Render.zoom, visits: Game.s.rocket.visits });
    return r;
  });
  t.expect(cdown.n >= 0 && cdown.load && cdown.label === '⬇️ Put it down' && cdown.hint === 'Move the panel to the rocket! 🚀', `carrying a panel away from the rockets: put it down ${JSON.stringify(cdown)}`);
  t.expect(cdown.loose === 1 && !cdown.load2 && cdown.thud && cdown.empty === '🪝 Grab a panel' && cdown.after === 0, `the panel lands on the sand (it can be picked up again) and slides back to its pile ${JSON.stringify(cdown)}`);
  t.expect(!cdown.driving && cdown.ride === null && cdown.d < 70 && cdown.free && cdown.near && cdown.visits === 1, `climbed down beside the crane ${JSON.stringify(cdown)}`);
  await t.ev(() => { Render.setZoom(1); T.step(90); });   // the crane goes back to its own work

  // ---- visit 2: off the island (to Starfish Cove) and back
  await tp(S.cove.x, S.cove.y, 'islands');
  t.expectEq((await state()).visits, 1, 'leaving does not count');
  await tp(S.isle.x, S.isle.y, 'islands');
  let s2 = await state();
  t.expectEq(s2.visits, 2, 'coming back counts the second visit');
  t.expectEq(s2.stage, 1, 'stage 1: most panels on');
  t.expectEq(s2.ask, 'We made progress! Come back soon!', 'the progress greeting');
  t.expect(s2.crane.nose, 'the crane lifts the nose cone');
  t.expect(await t.ev(() => T.toasts.includes('🚀 The rocket grew! Come back once more!')), 'one toast for the new stage');
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
  t.expectEq(s3.trucks, 'fueltruck,crane:rocket1,crane:rocket2', 'the second crane came with Rocket #2\'s site');
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
  t.expect(on2.on && !on2.lot && on2.scaffold && on2.items >= lot1.items + 9, `stage 2: Rocket #2's site is there ${JSON.stringify([lot1, on2])}`);
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

  // ---- Rocket #2's crane (it came with the site): steer the hook to its pile, grab, steer to Rocket #2, put it on
  await steerHelpers();
  const c2 = await t.ev(() => {
    const st = RocketExt.st, cr = TowerCrane.get('rocket2'), S = CFG.ROCKETISLE.CRANES[1].SEAT; T.tp(S.x + 20, S.y + 10, 'islands'); T.step(3);
    const r = { near: Game.nearVehicle === cr.v, hint: T.hint(), offered: TowerCrane.vehicles(Game).includes(cr.v), zoom: Render.zoom };
    Game.enterCar(); T.step(30); r.driving = Game.vehicle === cr.v; r.took = cr.load; cr.load = false;   // (it may take over a panel from its own work: start empty)
    r.n1 = window.steerHook(cr, TowerCrane.pileSpot(TowerCrane.piles(Game, cr)[0]), '🪝 Grab a panel'); T.act(); T.until(() => !cr.cyc, 120); r.load = cr.load; r.carryHint = T.hint();
    r.n2 = window.steerHook(cr, RocketExt.rocketSpot(1), '🚀 Put it on the rocket'); r.placed0 = st.placed[1].length; r.panels0 = Game.s.rocket.panels;
    T.act(); T.until(() => !cr.cyc, 120); T.step(2);
    r.placed = st.placed[1].length; r.panels = Game.s.rocket.panels; r.cheer = st.s2.cheer && st.s2.cheer.text; r.hop = st.s2.cheer && st.s2.cheer.who.wave > 0; r.zoom2 = Render.zoom;
    return r;
  });
  t.expect(c2.offered && c2.near && c2.hint === 'Drive the crane! 🏗️' && c2.driving, `Rocket #2's crane ${JSON.stringify(c2)}`);
  t.expect(c2.n1 >= 0 && c2.load && c2.carryHint === 'Move the panel to the rocket! 🚀' && c2.n2 >= 0, `steered to its pile, grabbed, steered to Rocket #2 ${JSON.stringify(c2)}`);
  t.expect(c2.placed === c2.placed0 + 1 && c2.panels === c2.panels0 + 1 && c2.cheer === '🎉' && c2.hop, `the panel clicks onto Rocket #2 and a worker cheers ${JSON.stringify(c2)}`);
  t.expect(Math.abs(c2.zoom2 - c2.zoom) < 1e-9, 'no camera zoom in the second crane');
  // the fuel truck fuels Rocket #2 too
  const f2 = await t.ev(() => {
    const st = RocketExt.st, v = st.truck; Game.exitCar(); T.step(2); v.x = v.px = 4372; v.y = v.py = 2850; v.angle = v.pa = 0; T.tp(v.x, v.y + 46, 'islands'); Game.enterCar(); T.step(2);
    const label = T.label(); T.act(); const i = st.fuel && st.fuel.i; T.until(() => !st.fuel, 600);
    return { label, i, gauge: st.gauge[1], cheer: st.s2.cheer && st.s2.cheer.text };
  });
  t.expect(f2.label === '⛽ Fuel the rocket!' && f2.i === 1 && f2.gauge === 1 && f2.cheer === '🎉', `the fuel truck fuels Rocket #2 ${JSON.stringify(f2)}`);
  // pictures: the second crane grabbing and placing (desktop and phone), the fuel truck on the phone
  const c2grab = () => t.ev(() => { const st = RocketExt.st, cr = TowerCrane.get('rocket2'), S = CFG.ROCKETISLE.CRANES[1].SEAT; Game.exitCar(); T.tp(S.x + 20, S.y + 10, 'islands'); Game.enterCar(); T.step(20); cr.load = false; window.steerHook(cr, TowerCrane.pileSpot(TowerCrane.piles(Game, cr)[0]), '🪝 Grab a panel'); T.act(); T.step(24); });
  const c2place = () => t.ev(() => { const cr = TowerCrane.get('rocket2'); T.until(() => !cr.cyc, 120); window.steerHook(cr, RocketExt.rocketSpot(1), '🚀 Put it on the rocket'); T.act(); T.step(16); });
  await t.ev(() => Render.setZoom(1.2));
  await c2grab(); await t.shot('crane2-grab');
  await c2place(); await t.shot('crane2-place');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Render.setZoom(1.2); });
  await c2grab(); await t.shot('phone-crane-grab');
  await c2place(); await t.shot('phone-crane-place');
  await t.ev(() => { const st = RocketExt.st, v = st.truck; Game.exitCar(); T.step(2); v.x = v.px = 4100; v.y = v.py = 2850; v.angle = v.pa = 0; T.tp(v.x, v.y + 46, 'islands'); Game.enterCar(); T.act(); T.step(70); });
  await t.shot('phone-fuel-rocket1');
  // Take me home from a crane (carrying a panel, mid-dip, the truck fuelling): everything cleared, the zoom untouched
  const ghc = await t.ev(() => {
    const st = RocketExt.st, cr = TowerCrane.get('rocket1'), S = CFG.ROCKETISLE.CRANES[0].SEAT; Game.exitCar(); T.step(2); RocketExt.startFuel(Game, st.truck, 0);
    T.tp(S.x, S.y + 20, 'islands'); Game.enterCar(); T.step(5); cr.load = true; T.act();
    const z = Render.zoom, cyc = !!cr.cyc; Game.goHome(); T.step(2);
    const P = CFG.ROCKETISLE.TRUCK.PARK;
    return { z, cyc, zoom: Render.zoom, area: Game.area, driving: Game.driving, ride: TowerCrane.ride, parked: Math.hypot(st.truck.x - P.x, st.truck.y - P.y), busy: RocketExt.cranes.some((c) => c.load || c.cyc), fuel: st.fuel, hint: RocketExt.hint(Game), action: RocketExt.action(Game), vehicles: RocketExt.vehicles(Game).length };
  });
  t.expect(ghc.cyc && ghc.area === 'town' && !ghc.driving && ghc.ride === null && ghc.parked < 1 && !ghc.busy && ghc.fuel === null && Math.abs(ghc.zoom - ghc.z) < 1e-9, `Take me home from the crane ${JSON.stringify(ghc)}`);
  t.expect(ghc.hint === undefined && ghc.action === null && ghc.vehicles === 0, `no rocket hints, buttons or vehicles in town ${JSON.stringify(ghc)}`);
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); Render.setZoom(1); T.step(2); });

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
  // the pilot seat: no panel, the big button says Blast off (pressed later); Mission Control pipes up on its own
  const seat = await t.ev(() => {
    const K = CFG.ROCKETIN, st = RocketInsideExt.st, r = {}, calls = Game.s.rocketin.calls;
    T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); r.label = T.label(); T.act(); r.seat = !!st.seat; r.hint = T.hint(); r.next = T.label();
    r.noPanel = !('btns' in st) && !('lights' in st) && typeof RocketInsideExt.drawPanel !== 'function' && typeof RocketInsideExt.press !== 'function';
    T.step(90); r.radio = st.radio && st.radio.t >= 0 && st.radio.text; r.calls = Game.s.rocketin.calls - calls; r.still = !!st.seat; r.next2 = T.label();
    // watch what the real frames draw while seated
    const ctx = Render.ctx, fill = ctx.fillText; window.__drawn = []; ctx.fillText = function (txt, ...a) { window.__drawn.push(String(txt)); return fill.call(this, txt, ...a); };
    return r;
  });
  await t.wait(250);   // a few real frames draw the flight deck with the chef in the seat
  Object.assign(seat, await t.ev(() => {
    const ctx = Render.ctx; delete ctx.fillText; const drawn = window.__drawn; delete window.__drawn;
    const dom = [...document.querySelectorAll('button, [role=button]')].filter((b) => b.id !== 'btn-make').map((b) => b.textContent).filter((x) => /Lights|Mission Control|Stand up|Blast off/.test(x));
    return { frames: drawn.length, panelText: drawn.filter((x) => /Lights|Call|Stand up|MISSION CONTROL|Press Call/.test(x)), dom, bigBtn: document.getElementById('btn-make').textContent };
  }));
  t.expect(seat.label === '👨‍🚀 Sit in the pilot seat' && seat.seat && seat.hint === 'Press the button to blast off! 🚀' && seat.next === '🚀 Blast off!', `in the pilot seat: the big button says Blast off ${JSON.stringify(seat)}`);
  t.expect(seat.noPanel && seat.frames > 0 && seat.panelText.length === 0 && seat.dom.length === 0 && seat.bigBtn === '🚀 Blast off!', `no cockpit panel (no buttons, nothing drawn) ${JSON.stringify(seat)}`);
  t.expect(seat.radio === "You're go for launch! 🚀" && seat.calls === 1 && seat.still && seat.next2 === '🚀 Blast off!', `Mission Control pipes up by itself ${JSON.stringify(seat)}`);
  await t.ev(() => T.step(20));
  await t.shot('inside-pilot');
  // pushing the stick gets the chef up again; sit again for the launch
  const stickUp = await t.ev(() => {
    T.steer(1, 0); T.step(40); T.unsteer();
    return { seat: !!RocketInsideExt.st.seat, free: RocketInsideExt.free(Game.player.x, Game.player.y), label: T.label() };
  });
  t.expect(!stickUp.seat && stickUp.free && stickUp.label !== '🚀 Blast off!', `the stick stands the chef up ${JSON.stringify(stickUp)}`);
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
    return { seat, area: Game.area, seat2: st.seat, suit: st.suit, hint: RocketInsideExt.hint(Game), action: RocketInsideExt.action(Game), radio: st.radio };
  });
  t.expect(ghi.seat && ghi.area === 'town' && ghi.seat2 === null && ghi.suit === 0 && ghi.hint === undefined && ghi.action === null && ghi.radio === null, `Take me home from inside the rocket ${JSON.stringify(ghi)}`);
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
    const btn = T.label(); T.act(); Render.updateCamera(Game, true);   // sit, Blast off! (a frame snaps the camera to the pad)
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
    T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); T.act(); T.step(90); r.radio = RocketInsideExt.st.radio && RocketInsideExt.st.radio.text; r.fly = T.label(); r.hint = T.hint();
    return r;
  });
  t.expect(moonIn.area === 'rocketinside' && moonIn.where === 'moon' && !moonIn.wasOn && moonIn.earth, `inside the rocket on the moon ${JSON.stringify(moonIn)}`);
  t.expect(moonIn.radio === 'Come on home, Rocket! 🏠' && moonIn.fly === '🚀 Fly home' && moonIn.hint === 'Press the button to fly home! 🚀', `the flight deck on the moon: Fly home ${JSON.stringify(moonIn)}`);
  await t.ev(() => T.step(20));
  await t.shot('moon-inside-pilot');
  await t.ev(() => { const K = CFG.ROCKETIN; RocketInsideExt.standUp(Game); T.tp(K.EXIT.x + 120, K.EXIT.y); T.step(20); });
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
    T.act(); T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); T.act();   // in, sit: the big button says Fly home
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
    const A = CFG.ISLANDS.ROCKET.ASK, K = CFG.ROCKETIN; T.tp(A.x, A.y, 'islands'); T.act(); T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); T.act(); T.act(); T.step(100);
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
  // phone: the rocket's three decks and the pilot seat
  await t.ev(() => { T.act(); const K = CFG.ROCKETIN; T.tp(K.OVEN.x - 40, K.OVEN.y); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'rocketinside', 'phone: inside the rocket');
  await t.shot('phone-inside-bottom');
  await t.ev(() => { const K = CFG.ROCKETIN; T.tp(K.LOOK.x - 30, K.LOOK.y); T.step(30); });
  await t.shot('phone-inside-middle');
  await t.ev(() => { const K = CFG.ROCKETIN; T.tp(K.PILOT_SPOT.x + 40, K.PILOT_SPOT.y + 10); T.step(30); });
  await t.shot('phone-inside-top');
  await t.ev(() => { const K = CFG.ROCKETIN; T.tp(K.PILOT_SPOT.x, K.PILOT_SPOT.y); T.act(); T.step(90); });
  t.expect(await t.ev(() => !!RocketInsideExt.st.seat && T.label() === '🚀 Blast off!'), 'phone: in the pilot seat, Blast off on the big button');
  await t.shot('phone-inside-pilot');
  const pl = await t.ev(() => { const label = T.label(); T.act(); Render.updateCamera(Game, true); /* a real frame would snap the camera onto the pad */ const n = T.until(() => RocketExt.st.fly && RocketExt.st.fly.t > CFG.ROCKETISLE.LIFTOFF + 0.5, 400); return { label, n, area: Game.area }; });
  t.expect(pl.label === '🚀 Blast off!' && pl.n >= 0 && pl.area === 'islands', `phone: blast off from the flight deck ${JSON.stringify(pl)}`);
  await t.shot('phone-liftoff');
  await t.ev(() => { T.until(() => !!Game.travel, 600); Game.travel.dur = CFG.ROCKETISLE.FLIGHT; Game.travel.t = 3.6; });
  await t.shot('phone-flight');
  await t.ev(() => { T.until(() => !Game.travel, 1200); T.until(() => !RocketExt.st.fly, 600); const D = CFG.MOON.DOOR; T.tp(D.x + 140, D.y - 30, 'moon'); T.step(20); });
  await t.shot('phone-moon');
  t.expectEq(await t.ev(() => Game.area), 'moon', 'phone: on the moon');
};
