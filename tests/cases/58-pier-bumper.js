'use strict';
// Pizza Pier bumper cars (js/pier-bumper.js): the pavilion sits in its plot with the gate on the boardwalk side; the
// gate's hint and '🚗 Drive a bumper car'; driving the free car, bumping a visitor's car (a bounce and "BONK! 💥") and the
// rail; steering hard into every wall never lets the car off the floor; the visitors' cars move and never leave; hopping
// out lands on the gate mat and the car glides home; a rescue from inside the pavilion; Take-me-home while driving.
const fs = require('fs');
const path = require('path');

module.exports = async (t) => {
  // until the coordinator wires the pier files into index.html, serve the page with them added
  const extra = ['js/pizzapier.js', 'js/pier-bumper.js'].filter((f) => f === 'js/pier-bumper.js' || fs.existsSync(path.join(__dirname, '..', '..', f)));
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    const add = extra.filter((f) => !body.includes(f)).map((f) => `<script src="${f}"></script>\n  `).join('');
    if (add) body = body.replace('<script src="js/main.js"></script>', add + '<script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();

  // ---- registered, and laid out inside its plot with the gate mat on free ground facing the boardwalk
  const reg = await t.ev(() => {
    const B = CFG.PIER_BUMPER, P = CFG.PIER.PLOTS.bumper, K = B.BLOCK, G = B.GATE, inP = (x0, y0, x1, y1) => x0 >= P.x0 && x1 <= P.x1 && y0 >= P.y0 - 40 && y1 <= P.y1;
    return {
      ok: typeof PierBumperExt !== 'undefined' && Game.ext.includes(PierBumperExt) && Render.ext.includes(PierBumperExt),
      order: Game.ext.indexOf(PierBumperExt) < Game.ext.indexOf(CityExt),
      spec: CFG.VEHICLES.bumpercar,
      block: inP(K.x0, K.y0, K.x1, K.y1), gate: G.x > P.x0 && G.x < P.x1 && G.y - 12 > K.y1 && G.y + 12 <= P.y1,
      floor: B.FLOOR.x0 > K.x0 && B.FLOOR.x1 < K.x1 && B.FLOOR.y1 < K.y1, boardwalk: P.y1 <= CFG.PIER.BOARDWALK.y0,
      cars: PierBumperExt.st.cars.length,
    };
  });
  t.expect(reg.ok, 'the bumper cars are registered');
  t.expect(reg.order, 'the bumper cars answer before the City');
  t.expect(reg.spec && reg.spec.label === '🚗 Drive a bumper car' && reg.spec.exit === '🚶 Hop out', 'bumpercar vehicle kind');
  t.expect(reg.block && reg.floor, 'the pavilion stays inside its plot');
  t.expect(reg.gate && reg.boardwalk, 'the gate mat is in front of the pavilion, on the boardwalk side');
  t.expect(reg.cars >= 4 && reg.cars <= 5, `4-5 bumper cars (${reg.cars})`);

  // ---- away from the gate: no hint of ours; at the gate: the hint and the button
  const away = await t.ev(() => { T.tp(9300, 5980, 'pizzapier'); return { mine: PierBumperExt.hint(Game), label: PierBumperExt.action(Game) }; });
  t.expect(away.mine === undefined && !away.label, 'no hint or button away from the gate');
  const gate = await t.ev(() => {
    const G = CFG.PIER_BUMPER.GATE; T.tp(G.x + 40, G.y + 30, 'pizzapier'); T.step(2);
    const solid = Game.obstacles().some((o) => Game.hitRect(G.x, G.y, 12, o));
    return { hint: T.hint(), label: T.label(), target: Game.hint && Game.hint.target, solid };
  });
  t.expectEq(gate.hint, 'Drive the bumper cars! 🚗💥', 'hint near the gate');
  t.expectEq(gate.label, '🚗 Drive a bumper car', 'button at the gate');
  t.expect(!gate.solid, 'the gate mat is free ground');
  // walking up from the boardwalk to the gate mat works
  const walkUp = await t.ev(() => {
    const G = CFG.PIER_BUMPER.GATE; T.tp(G.x, 5980, 'pizzapier'); T.steer(0, -1); T.step(90); T.unsteer();
    return { y: Game.player.y, near: Math.hypot(Game.player.x - G.x, Game.player.y - G.y) };
  });
  t.expect(walkUp.near < 30, `walked from the boardwalk up to the gate (${Math.round(walkUp.near)} px away)`);
  await t.ev(() => { T.step(30); });
  await t.shot('gate');

  // ---- get in
  const inCar = await t.ev(() => {
    const G = CFG.PIER_BUMPER.GATE; T.tp(G.x, G.y, 'pizzapier'); T.act();
    const v = Game.vehicle;
    return { driving: Game.driving, kind: v && v.kind, same: v === PierBumperExt.st.free, at: v && Math.hypot(Game.player.x - v.x, Game.player.y - v.y), hint: T.hint(), label: T.label(), carBtn: v && CFG.VEHICLES[v.kind].exit };
  });
  t.expect(inCar.driving && inCar.kind === 'bumpercar' && inCar.same, 'in the free bumper car');
  t.expect(inCar.at < 1, 'the chef sits in the car');
  t.expectEq(inCar.hint, 'Bump the other cars! 💥', 'hint while driving');
  t.expect(!inCar.label, `no extra action button while driving (${inCar.label})`);
  t.expectEq(inCar.carBtn, '🚶 Hop out', 'the vehicle button hops out');

  // ---- bump a visitor's car: chase the nearest one until we hit it
  const bump = await t.ev(() => {
    const st = PierBumperExt.st, me = st.free, n0 = st.bonks.car, f0 = Game.floats.length;
    let target = null, steps = 0, bonk = false, sawFloat = false, apart = false;
    for (; steps < 600 && st.bonks.car === n0; steps++) {
      target = st.cars.filter((c) => c !== me).sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0];
      const dx = target.x - me.x, dy = target.y - me.y, d = Math.hypot(dx, dy) || 1;
      T.steer(dx / d, dy / d); T.step(1);
    }
    T.unsteer();
    bonk = st.bonks.car > n0;
    sawFloat = Game.floats.some((f) => f.text === 'BONK! 💥');
    // right after the bump the two cars move apart
    const vn = ((target.vx - me.vx) * (target.x - me.x) + (target.vy - me.vy) * (target.y - me.y)) / (Math.hypot(target.x - me.x, target.y - me.y) || 1);
    apart = vn > 0;
    return { steps, bonk, sawFloat, apart, sparks: st.sparks.length, laugh: target.laugh > 0, gap: Math.hypot(target.x - me.x, target.y - me.y), min: CFG.PIER_BUMPER.R * 2 - 1 };
  });
  t.expect(bump.bonk, `bumped a visitor's car (after ${bump.steps} steps)`);
  t.expect(bump.sawFloat, 'a BONK! float');
  t.expect(bump.apart, 'the cars bounce apart');
  t.expect(bump.sparks > 0 && bump.sparks <= 8, `a little spark (${bump.sparks})`);
  t.expect(bump.gap >= bump.min, `no overlap after the bump (${bump.gap.toFixed(1)})`);
  await t.ev(() => T.step(4));
  await t.shot('bonk');

  // ---- steering hard into each wall for 4 s: the car bounces but never leaves the floor; the rail bonks too
  const walls = await t.ev(() => {
    const B = CFG.PIER_BUMPER, F = B.FLOOR, R = B.R, st = PierBumperExt.st, me = st.free, out = [];
    let bad = 0, aiBad = 0, synced = true;
    const r0 = st.bonks.rail;
    for (const [ax, ay, name] of [[-1, 0, 'west'], [1, 0, 'east'], [0, -1, 'north'], [0, 1, 'south'], [-0.7, -0.7, 'nw'], [0.7, 0.7, 'se']]) {
      T.steer(ax, ay);
      let reach = 1e9;
      for (let i = 0; i < 240; i++) {
        T.step(1);
        if (me.x < F.x0 + R - 0.5 || me.x > F.x1 - R + 0.5 || me.y < F.y0 + R - 0.5 || me.y > F.y1 - R + 0.5) bad++;
        for (const c of st.cars) if (c.x < F.x0 + R - 0.5 || c.x > F.x1 - R + 0.5 || c.y < F.y0 + R - 0.5 || c.y > F.y1 - R + 0.5) aiBad++;
        if (Game.player.x !== me.x || Game.player.y !== me.y) synced = false;
        const d = ax < 0 && !ay ? me.x - (F.x0 + R) : ax > 0 && !ay ? (F.x1 - R) - me.x : ay < 0 && !ax ? me.y - (F.y0 + R) : ay > 0 && !ax ? (F.y1 - R) - me.y : 0;
        reach = Math.min(reach, d);
      }
      out.push([name, Math.round(reach)]);
    }
    T.unsteer();
    return { bad, aiBad, synced, reach: out, rail: st.bonks.rail - r0, driving: Game.driving };
  });
  t.expectEq(walls.bad, 0, 'the bumper car never left the floor');
  t.expectEq(walls.aiBad, 0, 'no car ever left the floor');
  t.expect(walls.synced, 'the chef rides with the car');
  t.expect(walls.reach.slice(0, 4).every(([, d]) => d < 30), `the car reached each wall ${JSON.stringify(walls.reach)}`);
  t.expect(walls.rail > 0, `bumped the rail (${walls.rail})`);
  t.expect(walls.driving, 'still driving');

  // ---- never stuck: wedge into a corner, then drive out the other way
  const corner = await t.ev(() => {
    const me = PierBumperExt.st.free;
    T.steer(-0.7, -0.7); T.step(150); const x0 = me.x, y0 = me.y;
    T.steer(0.7, 0.7); T.step(90); T.unsteer();
    return Math.hypot(me.x - x0, me.y - y0);
  });
  t.expect(corner > 80, `drove out of the corner (${Math.round(corner)} px)`);

  // ---- the visitors drive about and stay on the floor for a good while
  const ai = await t.ev(() => {
    const B = CFG.PIER_BUMPER, F = B.FLOOR, R = B.R, st = PierBumperExt.st, cars = st.cars.filter((c) => c !== st.free);
    const travel = cars.map(() => 0), last = cars.map((c) => [c.x, c.y]);
    let out = 0;
    for (let i = 0; i < 1200; i++) {
      T.step(1);
      cars.forEach((c, k) => { travel[k] += Math.hypot(c.x - last[k][0], c.y - last[k][1]); last[k] = [c.x, c.y]; if (c.x < F.x0 + R - 0.5 || c.x > F.x1 - R + 0.5 || c.y < F.y0 + R - 0.5 || c.y > F.y1 - R + 0.5) out++; });
    }
    return { travel: travel.map(Math.round), out, aiBonks: st.bonks.ai };
  });
  t.expect(ai.travel.every((d) => d > 300), `every visitor car drives about ${JSON.stringify(ai.travel)}`);
  t.expectEq(ai.out, 0, 'visitor cars never leave the floor');
  await t.ev(() => { const me = PierBumperExt.st.free; T.steer(0, 0); T.step(1); T.unsteer(); Game.cameraSnap = true; T.step(2); });
  await t.shot('driving');

  // ---- hop out (the vehicle button): onto the gate mat; the car glides back to its spot
  const hop = await t.ev(() => {
    const G = CFG.PIER_BUMPER.GATE, H = CFG.PIER_BUMPER.HOME, me = PierBumperExt.st.free;
    me.x = 8560; me.y = 5700; Game.player.x = me.x; Game.player.y = me.y; T.step(1);
    UI.toggleCar(); T.step(2);
    const at = Math.hypot(Game.player.x - G.x, Game.player.y - G.y), driving = Game.driving;
    const solid = Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o));
    const n = T.until(() => Math.hypot(me.x - H.x, me.y - H.y) < 2 && !me.vx && !me.vy, 600);
    return { at, driving, solid, n, hint: T.hint(), label: T.label() };
  });
  t.expect(!hop.driving, 'hopped out');
  t.expect(hop.at < 2, `on the gate mat (${hop.at.toFixed(1)} px)`);
  t.expect(!hop.solid, 'standing on free ground');
  t.expect(hop.n >= 0, `the car glided back to its spot (${hop.n} steps; a visitor's car can bump it on the way, so it gets up to 10 s)`);
  t.expectEq(hop.label, '🚗 Drive a bumper car', 'can get in again');
  // walking away from the gate works (not stuck)
  const walkAway = await t.ev(() => { const y0 = Game.player.y; T.steer(0, 1); T.step(40); T.unsteer(); return Game.player.y - y0; });
  t.expect(walkAway > 40, 'walks away from the gate');

  // ---- rescue: a chef on foot inside the pavilion goes back to the gate mat
  const rescue = await t.ev(() => {
    const G = CFG.PIER_BUMPER.GATE; T.tp(8700, 5720, 'pizzapier'); T.step(1);
    return Math.hypot(Game.player.x - G.x, Game.player.y - G.y);
  });
  t.expect(rescue < 2, 'rescued onto the gate mat');
  const rescueWall = await t.ev(() => { const G = CFG.PIER_BUMPER.GATE; T.tp(8700, 5600, 'pizzapier'); T.step(1); return Math.hypot(Game.player.x - G.x, Game.player.y - G.y); });
  t.expect(rescueWall < 2, 'rescued from inside the back wall');

  // ---- Take-me-home while driving: everything put back
  const home = await t.ev(() => {
    const G = CFG.PIER_BUMPER.GATE, H = CFG.PIER_BUMPER.HOME; T.tp(G.x, G.y, 'pizzapier'); T.act();
    const wasDriving = Game.driving;
    T.steer(1, -0.5); T.step(60); T.unsteer();
    Game.goHome(); T.step(2);
    const st = PierBumperExt.st, me = st.free;
    return { wasDriving, area: Game.area, driving: Game.driving, vehicle: Game.vehicle, home: Math.hypot(me.x - H.x, me.y - H.y), still: !me.vx && !me.vy, sparks: st.sparks.length, rode: st.rode, mine: PierBumperExt.hint(Game) };
  });
  t.expect(home.wasDriving, 'was driving before Take-me-home');
  t.expectEq(home.area, 'town', 'home in town');
  t.expect(!home.driving && !home.vehicle, 'not driving after Take-me-home');
  t.expect(home.home < 1 && home.still, 'the free car is back on its spot');
  t.expect(!home.rode && home.sparks === 0, 'no bumper state left over');
  t.expect(home.mine === undefined, 'no bumper hint in town');
  // back at the pier, nothing teleports the chef
  const back = await t.ev(() => { T.tp(9300, 5980, 'pizzapier'); T.step(5); return { x: Game.player.x, y: Game.player.y }; });
  t.expect(back.x === 9300 && back.y === 5980, 'no stray teleport on returning to the pier');

  // ---- screenshots: desktop and phone
  await t.ev(() => { const G = CFG.PIER_BUMPER.GATE; T.tp(G.x, G.y, 'pizzapier'); T.act(); T.steer(-0.6, -0.8); T.step(30); T.unsteer(); T.step(10); Game.cameraSnap = true; });
  await t.shot('desktop');
  if (await t.ev(() => typeof AtmosphereExt !== 'undefined' && !!AtmosphereExt.force)) {
    await t.ev(() => { AtmosphereExt.force({ phase: 'dusk' }); T.step(600); Game.cameraSnap = true; });
    await t.shot('dusk');
    await t.ev(() => { AtmosphereExt.force({ phase: 'day' }); T.step(2); });
  }
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Game.cameraSnap = true; T.step(2); });
  await t.shot('phone');
  await t.ev(() => { UI.toggleCar(); T.step(2); Game.cameraSnap = true; });
  await t.shot('phone-gate');
  await t.page.setViewportSize({ width: 1100, height: 720 });
};
