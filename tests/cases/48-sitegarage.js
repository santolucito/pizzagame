'use strict';
// js/sitegarage.js: Construction Town's machine garage. The building stands on free ground by the gravel road and every
// bay can be driven into; at dusk every idle machine drives itself home (never through anything on the way) into its own
// bay, the doors roll down and Zzz floats up; in the morning they hop, back out and drive to their parking spots; a
// machine the chef is driving at bedtime stays with the chef and can be tucked in later by hand (Night night, the chef
// steps out in front, the door rolls down); a wrong bay only says whose bed it is; '🌅 Wake up' at a door; a reload at
// night keeps them in bed; a rescue from behind a closed door; Take-me-home. Screenshots desktop + phone.
module.exports = async (t) => {
  // until the coordinator wires js/sitegarage.js into index.html, serve the page with it added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/sitegarage.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/sitegarage.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  const helpers = () => {
    window.SG = {
      ids: CFG.SITEGARAGE.BAYS.map((b) => b.id),
      v: (id) => SiteGarageExt.vehicleOf(Game, id),
      m: (id) => SiteGarageExt.st.m[id],
      bayOf: (id) => CFG.SITEGARAGE.BAYS.find((b) => b.id === id).i,
      inRect: (v, i) => { const R = SiteGarageExt.bayRect(i); return v.x > R.x0 && v.x < R.x1 && v.y > R.y0 && v.y < R.y1; },
      // step until fn() holds, sampling every machine that drives itself: never inside anything solid on the way
      run(fn, max) {
        const bad = []; let n = 0;
        const area = Game.area; Game.area = 'site'; const obs = Game.townObstacles(true); Game.area = area;
        for (; n < max; n++) {
          if (fn()) break;
          Game.update(1 / 60);
          if (n % 4) continue;
          for (const id of SG.ids) {
            const m = SG.m(id), v = SG.v(id);
            if (m.state !== 'toBed' && m.state !== 'toHome') continue;
            const r = CFG.VEHICLES[v.kind].radius;
            Game.area = 'site'; const live = SiteGarageExt.obstacles(Game); Game.area = area;
            const hit = obs.concat(live).find((o) => Game.hitRect(v.x, v.y, r, o));
            if (hit && bad.length < 6) bad.push([id, Math.round(v.x), Math.round(v.y), JSON.stringify(hit)]);
            const K = CFG.SITEGARAGE.KEEP_OUT;   // the ski lift's corner by the mine stays free
            if (v.x + r > K.x0 && v.y - r < K.y1 && bad.length < 6) bad.push([id, Math.round(v.x), Math.round(v.y), 'lift corner']);
          }
        }
        return { n, bad, ok: fn() };
      },
      homeOk(id) { const v = SG.v(id), h = SiteGarageExt.homeOf(id); return U.dist(v.x, v.y, h.x, h.y) < 3 && Math.abs(SiteGarageExt.wrap(v.angle - h.angle)) < 0.05; },
    };
  };
  await t.boot();
  await t.ev(helpers);

  const reg = await t.ev(() => ({ first: Game.ext.indexOf(SiteGarageExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(SiteGarageExt) < Game.ext.indexOf(SiteTownExt), render: Render.ext.includes(SiteGarageExt), save: JSON.stringify(Game.s.sitegarage) }));
  t.expect(reg.first && reg.render, `the garage module is registered ${JSON.stringify(reg)}`);
  t.expectEq(reg.save, JSON.stringify({ beds: {}, toasted: false, tucks: 0, wakes: 0 }), 'the save starts empty');

  // ---- the spot: on free ground, clear of everything else in Construction Town, the bays open onto the gravel road
  const spot = await t.ev(() => {
    const G = CFG.SITEGARAGE, S = CFG.SITE, T2 = CFG.SITETOWN, W = S.WORLD;
    const box = { x: G.X0, y: G.Y0, w: G.X1 - G.X0, h: G.DOOR_Y - G.Y0 + 18 };   // the building and its apron
    const hit = (o) => box.x < o.x + o.w && box.x + box.w > o.x && box.y < o.y + o.h && box.y + box.h > o.y;
    Game.area = 'site';
    const mine = SiteGarageExt.obstacles(Game);
    const others = Game.townObstacles(true).concat(Game.obstacles()).filter((o) => !mine.some((q) => q.x === o.x && q.y === o.y && q.w === o.w && q.h === o.h));
    const R = (b) => ({ x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 });
    const places = [R(T2.FACTORY), R(T2.DINER), R(T2.PARK), R(T2.STORE), R(S.BUILDING), R(S.STATION.platform), { x: CFG.MINES.HILL.x0, y: CFG.MINES.HILL.top, w: CFG.MINES.HILL.x1 - CFG.MINES.HILL.x0, h: 140 },
      { x: T2.SLIDE.top.x - 40, y: T2.SLIDE.top.y - 30, w: 80, h: 170 }, { x: T2.TRACK.x - T2.TRACK.rx - 20, y: T2.TRACK.y - T2.TRACK.ry - 20, w: 2 * T2.TRACK.rx + 40, h: 2 * T2.TRACK.ry + 40 }]
      .concat(T2.HOUSES.map((h) => ({ x: h.x0, y: h.y0, w: h.x1 - h.x0, h: h.y1 - h.y0 + 90 })));
    const crane = TowerCrane.get('site'), cb = TowerCrane.mastBox(crane);
    const homes = SG.ids.map((id) => SiteGarageExt.homeOf(id)).every((h) => !hit({ x: h.x - 70, y: h.y - 40, w: 140, h: 80 }));
    const mounds = S.MOUNDS.every((m) => !hit({ x: m.x - m.r, y: m.y - m.r, w: 2 * m.r, h: 2 * m.r }));
    const cones = S.CONES.concat(S.BARRELS, S.PALLETS).every(([x, y]) => !hit({ x: x - 10, y: y - 10, w: 20, h: 20 }));
    const inWorld = G.X0 >= W.x0 && G.X1 <= W.x1 && G.Y0 >= W.walkY0;
    const road = G.BAYS.every((b) => G.APPROACH_Y > S.ROAD.y0 && G.APPROACH_Y < S.ROAD.y1 && b.cx > S.ROAD.x0 && b.cx < S.ROAD.x1) && G.DOOR_Y >= S.ROAD.y0 - 4;
    const cbay = G.BAYS.find((b) => b.kind === 'cranetruck');   // the crane's resting boom and the sign stay clear of the train parked at the station
    const trainClear = cbay.x0 > S.STATION.stopX + 30 && G.SIGN.x - 90 > S.STATION.stopX + 30;
    const keepOut = G.X1 <= G.KEEP_OUT.x0;
    const bays = G.BAYS.map((b) => SiteGarageExt.bayRect(b.i));
    return { keepOut, clear: !others.some(hit), places: places.filter(hit).length, crane: !hit(cb), homes, mounds, cones, inWorld, road, trainClear, bays, x0: G.X0, x1: G.X1 };
  });
  t.expect(spot.clear && spot.places === 0 && spot.crane && spot.homes && spot.mounds && spot.cones && spot.inWorld && spot.road && spot.trainClear && spot.keepOut, `the garage stands on free ground by the gravel road ${JSON.stringify(spot)}`);

  // ---- every bay can be driven into from the road (its own machine), the walls stop it, then it drives back out
  const drive = await t.ev(() => {
    const G = CFG.SITEGARAGE, out = [];
    for (const b of G.BAYS) {
      const v = SG.v(b.id), h = SiteGarageExt.homeOf(b.id);
      T.tp(b.cx + 40, G.APPROACH_Y + 30, 'site');
      v.x = b.cx; v.y = G.APPROACH_Y; v.angle = -Math.PI / 2; T.step(1);
      Game.enterCar(); const inside = Game.vehicle === v;
      T.steer(0, -1); T.step(110); T.unsteer(); T.step(20);
      const r = { id: b.id, inside, inBay: SG.inRect(v, b.i), y: Math.round(v.y), x: Math.round(v.x), label: T.label(), hint: T.hint(), night: Game.floats.some((f) => f.text === 'Night night! 😴') };
      T.steer(0, 1); T.step(80); T.unsteer(); T.step(20);
      r.out = v.y > G.DOOR_Y + 40; T.tp(b.cx + 200, 200, 'site');
      v.x = h.x; v.y = h.y; v.angle = h.angle; r.state = SG.m(b.id).state;
      out.push(r);
    }
    return out;
  });
  for (const r of drive) t.expect(r.inside && r.inBay && r.out && r.state === 'out' && r.label === '😴 Tuck in' && /Night night/.test(r.hint), `the ${r.id} drives into its bay and out again ${JSON.stringify(r)}`);
  t.expect(drive.every((r) => r.night), 'stopping in its own bay says Night night');

  // ---- day screenshot (machines out at work, the garage open)
  await t.ev(() => { T.tp(3640, 170, 'site'); Game.floats.length = 0; Render.setZoom(0.75); Game.cameraSnap = true; T.step(2); });
  await t.shot('day');

  // ---- bedtime: every idle machine drives itself home into its own bay, never through anything
  const toBed = await t.ev(() => {
    T.tp(2700, 860, 'site'); T.toasts.length = 0;
    AtmosphereExt.force({ phase: 'dusk' }); T.step(1);
    const started = SG.ids.filter((id) => SG.m(id).state === 'toBed').length;
    const r = SG.run(() => SG.ids.every((id) => SG.m(id).state === 'asleep'), 60 * 60);
    return {
      started, n: r.n, bad: r.bad, ok: r.ok, toast: T.toasts.includes('🌙 The machines are going to bed!'), toasted: Game.s.sitegarage.toasted,
      inBays: SG.ids.every((id) => SG.inRect(SG.v(id), SG.bayOf(id))), doors: SiteGarageExt.st.doors.map((d) => d.d),
      beds: JSON.stringify(SG.ids.map((id) => [id, Game.s.sitegarage.beds[id]])),
    };
  });
  t.expectEq(toBed.started, 6, 'all six machines set off for bed');
  t.expect(toBed.ok && toBed.n < 60 * 45, `every machine is asleep in its bay within 45 s (${(toBed.n / 60).toFixed(1)} s)`);
  t.expectEq(toBed.bad.length, 0, `nothing solid on the way home: ${JSON.stringify(toBed.bad)}`);
  t.expect(toBed.inBays && toBed.doors.every((d) => d === 1), `inside their own bays with the doors down ${JSON.stringify(toBed)}`);
  t.expect(toBed.toast && toBed.toasted, 'the bedtime toast showed once in Construction Town');
  t.expectEq(toBed.beds, JSON.stringify([['bulldozer', 0], ['cranetruck', 1], ['excavator', 2], ['dumptruck', 3], ['mixer0', 4], ['mixer1', 5]]), 'the beds are saved');
  // the sleepers cannot be climbed into; Shh near the garage; the Wake up button at a door
  const night = await t.ev(() => {
    const G = CFG.SITEGARAGE, b = G.BAYS[3];
    T.tp(b.cx + 20, G.MAT_Y + 70, 'site'); T.step(2); const shh = T.hint();
    T.tp(b.cx, G.MAT_Y, 'site'); T.step(2);
    const near = Game.findNearVehicle(); const label = T.label(), hint = T.hint();
    // walking up to the door does not get in
    T.steer(0, -1); T.step(40); T.unsteer();
    const y = Game.player.y, near2 = Game.findNearVehicle();
    return { shh, near: near && near.kind, label, hint, y: Math.round(y), near2: near2 && near2.kind };
  });
  t.expectEq(night.shh, 'Shh… the machines are sleeping 😴', 'the hint near the garage at night');
  t.expect(!night.near && !night.near2 && night.y > 44, `the sleeping machines cannot be climbed into ${JSON.stringify(night)}`);
  t.expectEq(night.label, '🌅 Wake up', 'the Wake up button at a closed door');
  await t.ev(() => { const G = CFG.SITEGARAGE; T.tp(3650, G.MAT_Y + 20, 'site'); Render.setZoom(0.75); Game.cameraSnap = true; T.step(2); });
  await t.shot('night');

  // ---- morning: the doors roll up, a hop and a Good morning, then back to the usual parking spots
  const morning = await t.ev(() => {
    T.tp(2700, 860, 'site'); Game.floats.length = 0;
    AtmosphereExt.force({ phase: 'day' }); T.step(1);
    const waking = SG.ids.filter((id) => SG.m(id).state === 'waking').length;
    T.step(90);
    const doors = SiteGarageExt.st.doors.map((d) => +d.d.toFixed(2)), hello = Game.floats.filter((f) => f.text === 'Good morning! ☀️').length;
    const r = SG.run(() => SG.ids.every((id) => SG.m(id).state === 'out'), 60 * 60);
    return { waking, doors, hello, n: r.n, ok: r.ok, bad: r.bad, home: SG.ids.filter((id) => !SG.homeOk(id)), beds: JSON.stringify(Game.s.sitegarage.beds) };
  });
  t.expectEq(morning.waking, 6, 'all six wake up in the morning');
  t.expect(morning.doors.every((d) => d === 0) && morning.hello === 6, `the doors rolled up and each said Good morning ${JSON.stringify(morning)}`);
  t.expect(morning.ok && morning.n < 60 * 45, `back at work within 45 s (${(morning.n / 60).toFixed(1)} s)`);
  t.expectEq(morning.bad.length, 0, `nothing solid on the way back: ${JSON.stringify(morning.bad)}`);
  t.expectEq(morning.home.length, 0, `each machine is back on its own parking spot ${JSON.stringify(morning.home)}`);
  t.expectEq(morning.beds, '{}', 'nobody is saved as asleep');

  // ---- the chef is driving the excavator at bedtime: it stays with the chef; the others go to bed
  const withChef = await t.ev(() => {
    const v = SG.v('excavator'); T.tp(v.x, v.y + 40, 'site'); Game.enterCar();
    T.steer(1, 0); T.step(30); T.unsteer();
    AtmosphereExt.force({ phase: 'dusk' }); T.step(1);
    const st = SG.m('excavator').state;
    T.steer(-1, 0); T.step(40); T.unsteer();
    const r = SG.run(() => SG.ids.filter((id) => id !== 'excavator').every((id) => SG.m(id).state === 'asleep'), 60 * 60);
    return { st, driving: Game.vehicle === v, st2: SG.m('excavator').state, withChef: U.dist(v.x, v.y, Game.player.x, Game.player.y) < 1, ok: r.ok, bad: r.bad, open: SiteGarageExt.st.doors[SG.bayOf('excavator')].d };
  });
  t.expect(withChef.st === 'out' && withChef.st2 === 'out' && withChef.driving && withChef.withChef, `the excavator stays with the chef ${JSON.stringify(withChef)}`);
  t.expect(withChef.ok && !withChef.bad.length && withChef.open === 0, `the others went to bed, the digger's door waits open ${JSON.stringify(withChef)}`);
  // ... and the chef parks it in its bay later: Night night, hop out, the chef steps out in front, the door rolls down
  const tuck = await t.ev(() => {
    const G = CFG.SITEGARAGE, b = G.BAYS[SG.bayOf('excavator')], v = SG.v('excavator');
    v.x = b.cx + 150; v.y = G.APPROACH_Y; Game.player.x = v.x; Game.player.y = v.y; Game.floats.length = 0;
    T.steer(-1, 0); T.until(() => v.x <= b.cx + 2, 200); T.unsteer(); v.x = b.cx; T.step(10);
    const hint1 = T.hint();
    T.steer(0, -1); T.step(110); T.unsteer(); T.step(20);
    const night = Game.floats.some((f) => f.text === 'Night night! 😴'), label = T.label();
    T.act(); const p = Game.player, chef = { x: Math.round(p.x), y: Math.round(p.y), driving: Game.driving };
    const d0 = SiteGarageExt.st.doors[b.i].d;
    T.step(120);
    return { doorY: G.DOOR_Y, bay: b.i, hint1, night, label, chef, cx: b.cx, d0, d: SiteGarageExt.st.doors[b.i].d, st: SG.m('excavator').state, inBay: SG.inRect(v, b.i), bed: Game.s.sitegarage.beds.excavator, tucks: Game.s.sitegarage.tucks };
  });
  t.expectEq(tuck.hint1, 'Park in your bay to sleep! 🛏️', 'the hint while driving near its bay');
  t.expect(tuck.night && tuck.label === '😴 Tuck in', `Night night in its own bay ${JSON.stringify(tuck)}`);
  t.expect(!tuck.chef.driving && Math.abs(tuck.chef.x - tuck.cx) < 2 && tuck.chef.y > tuck.doorY + 12, `the chef hopped out in front of the bay ${JSON.stringify(tuck)}`);
  t.expect(tuck.d0 < 0.2 && tuck.d === 1 && tuck.st === 'asleep' && tuck.inBay && tuck.bed === tuck.bay && tuck.tucks === 1, `then the door rolled down and it sleeps ${JSON.stringify(tuck)}`);
  await t.ev(() => { const G = CFG.SITEGARAGE; T.tp(3560, G.MAT_Y + 30, 'site'); Render.setZoom(0.75); Game.cameraSnap = true; T.step(2); });

  // ---- save at night and reload: a new session starts in the morning, so everybody wakes up and goes back to work
  await t.ev(() => Game.save());
  await t.reload();
  await t.ev(helpers);
  const reload = await t.ev(() => {
    Game.area = 'site'; T.step(3);
    const waking = SG.ids.filter((id) => SG.m(id).state === 'waking').length, phase = AtmosphereExt.phase;
    const r = SG.run(() => SG.ids.every((id) => SG.m(id).state === 'out'), 60 * 60);
    return { waking, phase, ok: r.ok, s: (r.n / 60).toFixed(1), beds: Object.keys(Game.s.sitegarage.beds).length, doors: SiteGarageExt.st.doors.map((d) => d.d), toasted: Game.s.sitegarage.toasted };
  });
  t.expect(reload.phase === 'day' && reload.waking === 6, `after a reload (morning) all six wake up ${JSON.stringify(reload)}`);
  t.expect(reload.ok && reload.beds === 0 && reload.doors.every((d) => d === 0) && reload.toasted, `and drive back out, doors up, nobody saved asleep ${JSON.stringify(reload)}`);
  // tucked in during the day: '🌅 Wake up' at its door, or it wakes by itself after a nap
  const wake = await t.ev(() => {
    const G = CFG.SITEGARAGE, b = G.BAYS[SG.bayOf('bulldozer')], v = SG.v('bulldozer'), m = SG.m('bulldozer');
    const tuck = () => { v.x = b.cx; v.y = G.PARK_Y; v.angle = -Math.PI / 2; m.state = 'parking'; m.bay = b.i; m.settled = false; m.manual = true; T.tp(b.cx, G.MAT_Y + 60, 'site'); SG.run(() => m.state === 'asleep', 60 * 10); };
    tuck(); const still = m.state;
    T.tp(b.cx, G.MAT_Y, 'site'); T.step(2); const label = T.label(); Game.floats.length = 0;
    T.act(); T.step(130);
    const r = { still, label, d: SiteGarageExt.st.doors[b.i].d, st: m.state, hello: Game.floats.some((f) => f.text === 'Good morning! ☀️'), bed: Game.s.sitegarage.beds.bulldozer, wakes: Game.s.sitegarage.wakes, inBay: SG.inRect(v, b.i) };
    T.steer(0, -1); T.step(30); T.unsteer(); r.near = Game.findNearVehicle() === v;
    // a nap: tucked in again, left alone, it wakes by itself
    T.tp(b.cx, G.MAT_Y + 60, 'site'); T.step(1); Game.enterCar && Game.driving && Game.exitCar();
    tuck(); r.napping = m.state;
    const n = SG.run(() => m.state !== 'asleep', 60 * (G.NAP + 10)); r.napWoke = n.ok; r.napS = (n.n / 60).toFixed(1);
    SG.run(() => m.state === 'out', 60 * 60);
    return r;
  });
  t.expect(wake.still === 'asleep' && wake.label === '🌅 Wake up', `a machine tucked in by day sleeps, Wake up at its door ${JSON.stringify(wake)}`);
  t.expect(wake.d === 0 && wake.st === 'out' && wake.hello && wake.bed === undefined && wake.wakes === 1 && wake.inBay && wake.near, `Wake up rolls the door up and the dozer can be driven ${JSON.stringify(wake)}`);
  t.expect(wake.napping === 'asleep' && wake.napWoke && Number(wake.napS) > 30, `a daytime nap ends by itself ${JSON.stringify(wake)}`);

  // ---- a wrong bay only says whose bed it is: the dump truck into the dozer's (open) bay
  const wrong = await t.ev(() => {
    const G = CFG.SITEGARAGE, b = G.BAYS[SG.bayOf('bulldozer')], dz = SG.v('bulldozer'), v = SG.v('dumptruck');
    dz.x = 3000; dz.y = 300;   // the dozer is out and about
    SiteGarageExt.st.m.dumptruck.state = 'out'; SiteGarageExt.forget(Game, SiteGarageExt.st.m.dumptruck); SiteGarageExt.st.m.dumptruck.bay = null;
    v.x = b.cx; v.y = G.APPROACH_Y; v.angle = -Math.PI / 2; T.tp(b.cx + 30, G.APPROACH_Y + 30, 'site'); Game.enterCar(); Game.floats.length = 0;
    T.steer(0, -1); T.step(110); T.unsteer(); T.step(20);
    const msg = Game.floats.some((f) => f.text === "That's the dozer's bed! 🛏️"), hint = T.hint(), label = T.label(), inBay = SG.inRect(v, b.i);
    Game.exitCar(); T.step(120);
    return { msg, hint, label, inBay, st: SG.m('dumptruck').state, d: SiteGarageExt.st.doors[b.i].d, night: Game.floats.some((f) => f.text === 'Night night! 😴') };
  });
  t.expect(wrong.msg && wrong.inBay && wrong.hint === "That's the dozer's bed! 🛏️" && wrong.label !== '😴 Tuck in', `the wrong bay says whose bed it is ${JSON.stringify(wrong)}`);
  t.expect(wrong.st === 'out' && wrong.d === 0 && !wrong.night, `and nothing else happens ${JSON.stringify(wrong)}`);

  // ---- a rescue: the chef stuck behind a closed door ends up in front of it
  const resc = await t.ev(() => {
    const G = CFG.SITEGARAGE, b = G.BAYS[SG.bayOf('mixer0')], v = SG.v('mixer0'), m = SG.m('mixer0');
    v.x = b.cx; v.y = G.PARK_Y; v.angle = -Math.PI / 2; m.state = 'parking'; m.bay = b.i; m.settled = false; m.manual = true;
    T.tp(b.cx, G.MAT_Y + 60, 'site'); SG.run(() => m.state === 'asleep' && SiteGarageExt.st.doors[b.i].d === 1, 60 * 10);
    T.tp(b.cx + 30, G.PARK_Y + 20, 'site'); T.step(2);
    return { x: Math.round(Game.player.x), y: Math.round(Game.player.y), cx: b.cx, mat: G.MAT_Y };
  });
  t.expect(resc.x === resc.cx && resc.y === resc.mat, `the chef behind a closed door is put on the mat ${JSON.stringify(resc)}`);

  // ---- dusk screenshots: the machines driving home (desktop and phone), then the night ones on the phone
  const shots = await t.ev(() => {
    // everyone awake and at home again (after the reload the clock started in the morning: one more night and morning)
    AtmosphereExt.force({ phase: 'dusk' }); T.step(1); AtmosphereExt.force({ phase: 'day' }); T.step(1);
    const r = SG.run(() => SG.ids.every((id) => SG.m(id).state === 'out'), 60 * 60);
    T.tp(3600, 190, 'site'); AtmosphereExt.force({ phase: 'dusk' }); T.step(1);
    SG.run(() => SG.ids.filter((id) => SG.m(id).state === 'toBed' && SG.v(id).y < 260).length >= 3, 60 * 20);
    Render.setZoom(0.7); Game.cameraSnap = true;
    return r.ok;
  });
  t.expect(shots, 'they all went back to work for the dusk screenshot');
  await t.shot('dusk');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Render.setZoom(0.6); Game.cameraSnap = true; T.step(1); });
  await t.shot('phone-dusk');
  await t.ev(() => { SG.run(() => SG.ids.every((id) => SG.m(id).state === 'asleep'), 60 * 60); const G = CFG.SITEGARAGE; T.tp(3560, G.MAT_Y + 10, 'site'); Render.setZoom(0.6); Game.cameraSnap = true; T.step(2); });
  await t.shot('phone-night');
  await t.ev(() => { AtmosphereExt.force({ phase: 'day' }); SG.run(() => SG.ids.every((id) => SG.m(id).state === 'out'), 60 * 60); T.tp(3650, 160, 'site'); Render.setZoom(0.6); Game.cameraSnap = true; T.step(2); });
  await t.shot('phone-day');

  // ---- Take me home from beside the garage
  const home = await t.ev(() => { const G = CFG.SITEGARAGE; T.tp(G.BAYS[2].cx, G.MAT_Y, 'site'); Game.goHome(); T.step(2); return { area: Game.area, hint: SiteGarageExt.hint(Game) }; });
  t.expect(home.area === 'town' && home.hint === undefined, `Take me home works from the garage ${JSON.stringify(home)}`);
};
