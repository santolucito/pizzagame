'use strict';
// js/towercrane.js: Construction Town's drivable tower crane by the half-built house. Climb in at its door, the joystick
// moves the hook over the ground (the camera follows it, no zoom), steer it to the pallets, grab a steel beam, steer to
// the house, put it on (it clicks onto the wall: sparkle, "Click! ✨", a builder cheers 🎉); grab a bucket, put it down
// elsewhere (it slides back to the pallets); climb down; a rescue from inside the mast; Take-me-home from the cab; the
// old static crane is hidden. Screenshots desktop + phone.
module.exports = async (t) => {
  // until the coordinator wires js/towercrane.js into index.html, serve the page with it added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/towercrane.js')) body = body.replace('<script src="js/islands.js"></script>', '<script src="js/islands.js"></script>\n  <script src="js/towercrane.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();
  const reg = await t.ev(() => {
    const c = TowerCrane.get('site');
    return { ok: !!c, first: Game.ext[0] === TowerCrane, render: Render.ext.includes(TowerCrane), hidden: CFG.SITE.CRANE.hidden === true, spec: [CFG.VEHICLES.crane.label, CFG.VEHICLES.crane.exit], area: c && c.area, base: c && c.C, rocket: !!TowerCrane.get('rocket1') };
  });
  t.expect(reg.ok && reg.first && reg.render && reg.hidden && reg.area === 'site' && reg.rocket, `the crane module is registered (first in line) ${JSON.stringify(reg)}`);
  t.expectEq(JSON.stringify(reg.spec), JSON.stringify(['🏗️ Drive the crane', '🚶 Climb down']), 'the crane vehicle');
  // its base stands on free ground, clear of the house, the pallets, the machines, the mounds and the east lot
  const spot = await t.ev(() => {
    const S = CFG.SITE, c = TowerCrane.get('site'), B = TowerCrane.mastBox(c), hit = (o) => B.x < o.x + o.w && B.x + B.w > o.x && B.y < o.y + o.h && B.y + B.h > o.y;
    const others = Game.siteObstacles(false).filter((o) => !(o.x === S.CRANE.x - 22 && o.y === S.CRANE.y - 22));
    const veh = Object.values(S.VEHICLES).every((v) => U.dist(v.x, v.y, c.C.x, c.C.y) > 120);
    const mounds = S.MOUNDS.every((m) => U.dist(m.x, m.y, c.C.x, c.C.y) > m.r + 60);
    const lot = !(c.C.x > 3300 - 60 && c.C.x < 3500 + 60 && c.C.y > 520 - 60 && c.C.y < 760 + 60);
    const reach = S.PALLETS.every(([x, y]) => TowerCrane.reaches(c, { x, y: y + 12 }));
    Game.area = 'site'; const inObs = Game.obstacles().some((o) => o.x === B.x && o.y === B.y && o.w === B.w);
    return { clear: !others.some(hit), veh, mounds, lot, reach, inObs };
  });
  t.expect(spot.clear && spot.veh && spot.mounds && spot.lot && spot.reach && spot.inObs, `the crane's base is on free ground and reaches the pallets ${JSON.stringify(spot)}`);
  await t.ev(() => {
    window.steerHook = (c, P, label, max) => {
      let n = 0;
      for (; n < (max || 400); n++) {
        if (T.label() === label) break;
        const G = TowerCrane.hook(c), dx = P.x - G.x, dy = P.y - G.y, d = Math.hypot(dx, dy) || 1;
        T.steer(dx / d, dy / d); T.step(1);
      }
      T.unsteer(); return T.label() === label ? n : -1;
    };
  });
  // at the door: the hint and the vehicle button
  const door = await t.ev(() => {
    const c = TowerCrane.get('site'), S = c.seat; T.tp(S.x + 10, S.y + 20, 'site'); T.step(3);
    return { near: Game.nearVehicle === c.v, hint: T.hint(), zoom: Render.zoom };
  });
  t.expect(door.near && door.hint === 'Drive the crane! 🏗️', `the crane's door ${JSON.stringify(door)}`);
  await t.wait(200);
  t.expectEq(await t.page.textContent('#btn-car'), '🏗️ Drive the crane', 'the vehicle button reads Drive the crane');
  await t.shot('door');
  // in, to the beams, grab one, to the house, put it on
  const beam = await t.ev(() => {
    const c = TowerCrane.get('site'), [b] = CFG.SITE.PALLETS, B = CFG.SITE.BUILDING; Game.enterCar(); T.step(30); c.load = false;
    const r = { driving: Game.vehicle === c.v, ride: TowerCrane.ride === c, zoom: Render.zoom, up: Game.floats.some((f) => f.text === 'Up in the crane! 🏗️') };
    const G0 = TowerCrane.hook(c); r.cam = Math.hypot(Game.player.x - G0.x, Game.player.y - (G0.y - 50));
    r.n1 = window.steerHook(c, { x: b[0], y: b[1] + 12 }, '🪝 Grab a beam'); r.grabHint = T.hint();
    T.act(); r.dip = T.until(() => !c.cyc, 120); r.load = c.load; r.kind = c.kind; r.got = Game.floats.some((f) => f.text === 'Got it! 🪝'); r.carry = T.hint();
    r.n2 = window.steerHook(c, { x: (B.x0 + B.x1) / 2 + 60, y: B.y0 + 20 }, '🏠 Put it on the house'); r.putHint = T.hint();
    T.act(); r.lifting = c.cyc && c.cyc.what === 'place'; T.until(() => !c.cyc, 120);
    const crew = c.crewSt.find((w) => w.say);
    Object.assign(r, { placed: c.placed.length, onWall: c.placed[0] && (Math.abs(c.placed[0].y - (B.y0 + 7)) < 1 || Math.abs(c.placed[0].x - (B.x1 - 7)) < 1), click: Game.floats.some((f) => f.text === 'Click! ✨'), sparkles: Game.fx.filter((f) => f.kind === 'sparkle').length, cheer: crew && crew.say.text, hop: crew && crew.wave > 0, count: Game.s.towercrane.placed, zoom2: Render.zoom });
    return r;
  });
  t.expect(beam.driving && beam.ride && beam.up && beam.cam < 1, `up in the crane, the camera on the hook ${JSON.stringify(beam)}`);
  t.expect(beam.n1 >= 0 && beam.grabHint === 'Grab a beam! 🪝' && beam.dip < 60 && beam.load && beam.kind === 'beam' && beam.got && ['Move it over to the house! 🏠', 'Put it on the house! 🏠'].includes(beam.carry), `steered to the pallets and grabbed a beam ${JSON.stringify(beam)}`);
  t.expect(beam.n2 >= 0 && beam.putHint === 'Put it on the house! 🏠' && beam.lifting, `steered the beam over the house ${JSON.stringify(beam)}`);
  t.expect(beam.placed === 1 && beam.onWall && beam.click && beam.sparkles >= 5 && beam.cheer === '🎉' && beam.hop && beam.count === 1, `the beam clicks onto the wall and a builder cheers ${JSON.stringify(beam)}`);
  t.expect(Math.abs(beam.zoom - door.zoom) < 1e-9 && Math.abs(beam.zoom2 - door.zoom) < 1e-9, 'no camera zoom in the crane');
  await t.ev(() => T.step(6));
  await t.shot('placed');
  // a bucket, put down elsewhere: it slides back to the pallets
  const bucket = await t.ev(() => {
    const c = TowerCrane.get('site'), k = CFG.SITE.PALLETS[1];
    const n = window.steerHook(c, { x: k[0], y: k[1] + 12 }, '🪝 Grab a bucket'); T.act(); T.until(() => !c.cyc, 120);
    const r = { n, kind: c.kind };
    T.steer(1, 1); T.step(25); T.unsteer(); r.label = T.label(); T.act(); T.until(() => !c.cyc, 120);
    r.loose = c.loose.length; r.load = c.load; r.thud = Game.floats.some((f) => f.text === 'Thud!');
    T.step(60 * (CFG.TOWERCRANE.LOOSE + CFG.TOWERCRANE.SLIDE) + 10); r.after = c.loose.length;
    return r;
  });
  t.expect(bucket.n >= 0 && bucket.kind === 'bucket' && bucket.label === '⬇️ Put it down' && bucket.loose === 1 && !bucket.load && bucket.thud && bucket.after === 0, `a bucket put down elsewhere slides back ${JSON.stringify(bucket)}`);
  // pictures: grabbing and placing, desktop and phone
  const grabShot = () => t.ev(() => { const c = TowerCrane.get('site'), [b] = CFG.SITE.PALLETS; T.until(() => !c.cyc, 120); c.load = false; window.steerHook(c, { x: b[0], y: b[1] + 12 }, '🪝 Grab a beam'); T.act(); T.step(26); });
  const placeShot = () => t.ev(() => { const c = TowerCrane.get('site'), B = CFG.SITE.BUILDING; T.until(() => !c.cyc, 120); window.steerHook(c, { x: B.x1 - 40, y: (B.y0 + B.y1) / 2 }, '🏠 Put it on the house'); T.act(); T.step(24); });
  await t.ev(() => Render.setZoom(1.2));
  await grabShot(); await t.shot('grab');
  await placeShot(); await t.shot('place');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Render.setZoom(1.1); });
  await grabShot(); await t.shot('phone-grab');
  await placeShot(); await t.shot('phone-place');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); Render.setZoom(1); });
  // climb down beside the mast
  const out = await t.ev(() => {
    const c = TowerCrane.get('site'); T.until(() => !c.cyc, 120); Game.exitCar(); T.step(3); const p = Game.player;
    return { driving: Game.driving, ride: TowerCrane.ride, d: Math.hypot(p.x - c.seat.x, p.y - c.seat.y), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), near: Game.nearVehicle === c.v, action: TowerCrane.action(Game) };
  });
  t.expect(!out.driving && out.ride === null && out.d < 70 && out.free && out.near && out.action === null, `climbed down beside the crane ${JSON.stringify(out)}`);
  // a rescue: a chef saved inside the mast's base stands at its door
  const resc = await t.ev(() => { const c = TowerCrane.get('site'); T.tp(c.C.x, c.C.y, 'site'); T.step(2); const p = Game.player; return { d: Math.hypot(p.x - c.seat.x, p.y - (c.seat.y + 12)), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)) }; });
  t.expect(resc.d < 1 && resc.free, `inside the mast: out at its door ${JSON.stringify(resc)}`);
  // Take me home from the cab, mid-dip with a beam: all cleared
  const gh = await t.ev(() => {
    const c = TowerCrane.get('site'); T.tp(c.seat.x, c.seat.y + 10, 'site'); Game.enterCar(); T.step(5); c.load = true; c.kind = 'beam'; T.act();
    const cyc = !!c.cyc; Game.goHome(); T.step(2);
    return { cyc, area: Game.area, driving: Game.driving, ride: TowerCrane.ride, load: c.load, busy: !!c.cyc, hint: TowerCrane.hint(Game), action: TowerCrane.action(Game), vehicles: TowerCrane.vehicles(Game).length };
  });
  t.expect(gh.cyc && gh.area === 'town' && !gh.driving && gh.ride === null && !gh.load && !gh.busy && gh.hint === undefined && gh.action === null && gh.vehicles === 0, `Take me home from the crane ${JSON.stringify(gh)}`);
};
