'use strict';
// Things that bit us once and must stay fixed.
module.exports = async (t) => {
  await t.boot();

  // town toasts stay in town
  const silo = await t.ev(() => { T.toasts.length = 0; Game.area = 'site'; Game.toast('🍕 Green House wants pizza!', true, 'town'); Game.toast('🏗️ site news', true); Game.area = 'town'; Game.toast('🍕 Green House wants pizza!', true, 'town'); return T.toasts.slice(); });
  t.expectEq(silo.length, 2, 'a town toast is dropped while away and shown at home');

  // the train stops with its coaches along the platform
  await t.ev(() => { Game.s.unlocked.station = true; Game.train.summon(); T.until(() => Game.train.state === 'stopped', 1500); });
  const tr = await t.ev(() => ({ x: Game.train.x, P: CFG.STATION.platform }));
  t.expect(tr.x - 484 > tr.P.x0 - 20 && tr.x - 172 < tr.P.x1 + 20, `coaches sit along the platform (train front at ${tr.x})`);

  // boarding makes the train leave within about a second
  await t.ev(() => { const S = CFG.STATION; T.tp(S.stopX + S.boardDx, S.platform.y1 - 12); T.act(); });
  const leave = await t.ev(() => T.until(() => Game.train.state === 'leaving', 150));
  t.expect(leave >= 0 && leave <= 75, `train leaves within 1.25 s of boarding (took ${leave} steps)`);
  await t.ev(() => { Game.onTrain = false; Game.travel = null; Game.train.state = 'away'; Game.train.timer = 999; T.tp(540, 430, 'town'); });

  // standing at the bus stop calls the bus; the stop zone covers the bench
  await t.ev(() => { CityExt.st.bus.state = 'away'; CityExt.st.bus.timer = 500; T.tp(380, -30); });
  const called = await t.ev(() => T.until(() => CityExt.st.bus.state === 'stopped', 1500));
  t.expect(called >= 0 && called <= 540, `waiting at the stop brings the bus within 9 s (took ${called} steps)`);
  t.expectEq(await t.ev(() => T.label()), '🚌 Ride the bus', 'bus can be boarded from beside the bench');
  // the stop zone covers the sign, the sidewalk behind the shelter and the kerb along the whole bus
  const zone = await t.ev(() => [[380, -30], [500, -70], [340, -104], [600, -20], [560, 30], [420, 10]].map(([x, y]) => { T.tp(x, y); T.step(1); return T.label() === '🚌 Ride the bus'; }));
  t.expect(zone.every(Boolean), `bus can be boarded from all around the stop (${zone.join('/')})`);
  await t.ev(() => { CityExt.st.bus.state = 'away'; CityExt.st.bus.timer = 999; });

  // the dog walks to the door and waits outside instead of jumping
  const dog = await t.ev(() => {
    T.tp(1060, 605); Game.dog.x = 1120; Game.dog.y = 640; Game.dog.state = 'wander';
    T.steer(-1, 0); let maxJump = 0, lx = Game.dog.x, ly = Game.dog.y;
    for (let i = 0; i < 180; i++) { Game.update(1 / 60); maxJump = Math.max(maxJump, Math.hypot(Game.dog.x - lx, Game.dog.y - ly)); lx = Game.dog.x; ly = Game.dog.y; }
    T.unsteer(); const inside = Game.insideBuilding(Game.dog.x, Game.dog.y); Game.dog.x = -9999; Game.dog.y = -9999; return { maxJump, inside };
  });
  t.expect(dog.maxJump < 8 && !dog.inside, `dog never jumps (max step ${dog.maxJump.toFixed(1)} px) and stays outside`);

  // an obstacle that appears under the chef never flings them
  const fling = await t.ev(() => { const H = CFG.STATION.house; T.tp((H.x0 + H.x1) / 2, (H.y0 + H.y1) / 2); const y0 = Game.player.y; T.steer(0, 1); T.step(6); const d1 = Game.player.y - y0; T.step(30); T.unsteer(); return { d1, out: !Game.hitRect(Game.player.x, Game.player.y, 12, { x: H.x0, y: H.y0, w: H.x1 - H.x0, h: H.y1 - H.y0 }) }; });
  t.expect(fling.d1 > 0 && fling.d1 < 30 && fling.out, 'chef walks out of an obstacle smoothly');

  // a trapped cabin save is rescued onto the mat
  await t.ev(() => { T.tp(4720, 1520, 'cabin'); T.step(3); });
  const resc = await t.ev(() => { const R = CFG.SECRET.HOME.room; return Game.player.x > R.x0 && Game.player.x < R.x1 && Game.player.y > R.y0 && Game.player.y < R.y1; });
  t.expect(resc, 'cabin rescue puts a chef outside the walls back inside');

  // 'Take me home' rescues the chef from anywhere: mid-ride, inside the tower, off the edge of a cloud
  const homeFrom = await t.ev(() => {
    const out = [];
    const check = (label) => { Game.goHome(); T.step(2); const st = CFG.PLAYER_START; out.push({ label, area: Game.area, at: Math.abs(Game.player.x - st.x) < 1 && Math.abs(Game.player.y - st.y) < 1, driving: Game.driving, onTrain: Game.onTrain, travel: !!Game.travel, floor: CityExt.floor, hint: T.hint() }); };
    T.tp(7215, 100, 'cloud'); check('cloud void');
    const D = CFG.CITY.TOWER.door; T.tp(D.x, D.y, 'city'); T.act(); check('inside the tower');
    T.tp(1900, 520, 'town'); T.step(2); Game.enterCar(); check('driving the plane');
    Game.s.unlocked.station = true; Game.train.summon(); T.until(() => Game.train.state === 'stopped', 1500); const S = CFG.STATION; T.tp(S.stopX + S.boardDx, S.platform.y1 - 12); T.act(); T.step(90); check('on the train');
    return out;
  });
  for (const h of homeFrom) t.expect(h.area === 'town' && h.at && !h.driving && !h.onTrain && !h.travel && h.floor === null, `take me home works from ${h.label}: ${JSON.stringify(h)}`);
  t.expect(await t.ev(() => !!document.getElementById('btn-home')), 'the help panel has a Take me home button');
  const cash = await t.ev(() => { const before = Game.s.cash; document.getElementById('btn-cash').click(); return Game.s.cash - before; });
  t.expectEq(cash, 10000, 'the debug money button adds $10,000');

  // alert sounds collapse to one per burst
  const tones = await t.ev(() => { const oc = Sfx.ctx; Sfx.ctx = Sfx.ctx || {}; let n = 0; const orig = Sfx.tone; Sfx.tone = () => n++; Sfx.lastAt = {}; for (let i = 0; i < 10; i++) { Sfx.unlock(); Sfx.ding(); Sfx.chime(); Sfx.pickup(); Sfx.drop(); } Sfx.tone = orig; Sfx.ctx = oc; return n; });
  t.expect(tones <= 6, `repeated alert calls make few sounds (${tones} immediate tones for 50 calls)`);

  // the HUD's three buttons stay on one row on a narrow phone
  await t.boot({ viewport: { width: 320, height: 640 } });
  const tops = await t.ev(() => ['btn-help', 'btn-sound', 'btn-fullscreen'].map((id) => Math.round(document.getElementById(id).getBoundingClientRect().top)));
  t.expect(tops[0] === tops[1] && tops[1] === tops[2], `HUD buttons share one row at 320 px (${tops.join('/')})`);

  // the paint bar never covers the car in the bay
  await t.ev(() => { Game.s.vehicles.car = true; Game.s.cash = 0; T.tp(Game.car.x + 30, Game.car.y, 'town'); T.step(2); Game.enterCar(); const c = Game.vehicle; c.x = CFG.GARAGE.bay.x; c.y = CFG.GARAGE.bay.y; c.vx = 0; c.vy = 0; Game.cameraSnap = true; T.step(10); });
  await t.wait(400);
  const bay = await t.ev(() => ({ inBay: Game.inPaintBay, barBottom: document.getElementById('paint-bar').getBoundingClientRect().bottom, carY: (Game.car.y - Render.camY) * Render.scale }));
  t.expect(bay.inBay, 'car in the paint bay shows the colour bar');
  t.expect(bay.carY - 30 > bay.barBottom, `colour bar sits above the car (bar bottom ${Math.round(bay.barBottom)}, car ${Math.round(bay.carY)})`);
  await t.shot('paint-bay-phone');

  // taking off from Cloud Harbor: the plane turns, rolls down the runway, lifts off and flies right off the screen (past the map's edge) before the flight cut-scene
  await t.boot();
  const off = await t.ev(() => {
    const v = AirfieldExt.rt.cloudPlane, H = CFG.CLOUD.PLANE_HOME; v.x = H.x; v.y = H.y; v.angle = H.angle; v.lift = 0;
    T.tp(v.x + 40, v.y, 'cloud'); Game.enterCar(); AirfieldExt.takeOff(Game);
    let minX = v.x, maxX = v.x, steps = 0, stuck = 0, last = v.x;
    for (; steps < 600 && !Game.travel; steps++) {
      Game.update(1 / 60); Render.updateCamera(Game, 1 / 60); minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
      if (steps > 90 && Math.abs(v.x - last) < 0.5) stuck++; last = v.x;   // after the turn it must keep moving every step
    }
    return { minX, maxX, steps, stuck, flying: !!Game.travel && Game.travel.to === 'town', edge: CFG.CLOUD.WORLD.x0, driving: Game.driving, free: v.free };
  });
  t.expect(off.flying && !off.driving && !off.free, `cloud take-off ends in the flight home (took ${off.steps} steps)`);
  t.expect(off.stuck === 0, `the plane is never pinned in place while taking off (${off.stuck} stuck steps)`);
  t.expect(off.minX < off.edge - 60, `the plane flies off past the cloud's edge (min x ${Math.round(off.minX)}, edge ${off.edge})`);
  await t.ev(() => Game.goHome());

  // the helicopter never sets you down inside the woods (you could not get back on), and it comes home with you
  const heli = await t.ev(() => {
    const h = AirfieldExt.rt.heli, S = CFG.SECRET, r = {};
    const land = (x, y) => { h.x = CFG.AIRFIELD.HELI.x; h.y = CFG.AIRFIELD.HELI.y; h.lift = 0; Game.driving = false; Game.vehicle = null; T.tp(h.x + 30, h.y, 'town'); Game.enterCar(); h.x = x; h.y = y; Game.player.x = x; Game.player.y = y; T.step(30); Game.exitCar(); T.step(1); return { out: !Game.driving, near: Game.canEnterCar(), inObs: Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o)) }; };
    r.woods = land(-1200, 500); r.clearing = land(S.clearing.x, S.clearing.y); r.street = land(500, 800);
    Game.driving = false; Game.vehicle = null; h.x = -1200; h.y = 500; T.tp(600, 800, 'town'); Game.goHome(); T.step(1);
    r.home = Math.round(h.x) === CFG.AIRFIELD.HELI.x && Math.round(h.y) === CFG.AIRFIELD.HELI.y;
    return r;
  });
  t.expect(!heli.woods.out, 'landing in the solid woods is refused: you stay in the helicopter');
  t.expect(heli.clearing.out && heli.clearing.near && !heli.clearing.inObs, 'landing in the forest clearing sets you down on a free spot next to the helicopter');
  t.expect(heli.street.out && heli.street.near && !heli.street.inObs, 'landing in the street sets you down next to the helicopter');
  t.expect(heli.home, 'Take me home brings the helicopter back to its pad');

  // the cabin catalog uses the same X / ◀ ▶ buttons
  const cab = await t.ev(() => {
    const H = CFG.SECRET.HOME; Game.s.cabin = Game.s.cabin || { owned: {} }; T.tp(H.catalog.x + 24, H.catalog.y - 14, 'cabin'); T.step(2);
    const open = T.label(); T.act(); T.step(1);
    const cover = SecretExt.st.cat.on && SecretExt.st.cat.page === 0 && !document.getElementById('catalog-ctl').classList.contains('hidden');
    T.steer(1, 0); T.step(10); T.unsteer(); T.step(2); const stillCover = SecretExt.st.cat.page === 0 && SecretExt.st.cat.on;
    document.getElementById('cat-next').click(); T.step(25); const p1 = SecretExt.st.cat.page;
    document.getElementById('cat-close').click(); T.step(2);
    return { open, cover, stillCover, p1, closed: !SecretExt.st.cat.on && document.getElementById('catalog-ctl').classList.contains('hidden') };
  });
  t.expect(cab.open === '📖 Open the catalog' && cab.cover, `cabin catalog opens on the cover (${cab.open})`);
  t.expect(cab.stillCover && cab.p1 === 1 && cab.closed, `cabin catalog: joystick ignored, ▶ turns, X closes (${JSON.stringify(cab)})`);
  await t.ev(() => Game.goHome());

  // the sports car takes paint on the City turntable, and all the swatches fit on a phone in one row
  await t.boot({ viewport: { width: 390, height: 740 } });
  const sc = await t.ev(() => {
    Game.s.sports.owned = true; Game.s.paint.sportscar = '#ffffff'; const v = SportsCarExt.city, TT = CFG.SPORTS.TURNTABLE;
    v.x = TT.x + 200; v.y = TT.y; v.vx = 0; v.vy = 0; T.tp(v.x + 30, v.y, 'city'); Game.enterCar(); T.step(5);
    const hint = T.hint(), before = Game.inPaintBay;
    v.x = TT.x; v.y = TT.y; v.vx = 0; v.vy = 0; T.step(5);
    const on = Game.inPaintBay; if (on) Game.paintVehicle('#e4572e');
    return { driving: Game.driving && Game.vehicle === v, hint, before, on, painted: Game.s.paint.sportscar };
  });
  t.expect(sc.driving && !sc.before && sc.on && sc.painted === '#e4572e', `sports car is painted on the City turntable (${JSON.stringify(sc)})`);
  t.expectEq(sc.hint, 'Park on the turntable to pick a colour 🎨', 'a white sports car is pointed at the turntable');
  await t.wait(300);
  const bar = await t.ev(() => { const b = document.getElementById('paint-bar').getBoundingClientRect(), sw = [...document.querySelectorAll('.swatch')].map((e) => e.getBoundingClientRect()); return { shown: !document.getElementById('paint-bar').classList.contains('hidden'), left: Math.round(b.left), right: Math.round(b.right), n: sw.length, oneRow: new Set(sw.map((r) => Math.round(r.top))).size === 1, inside: sw.every((r) => r.left >= b.left && r.right <= b.right) }; });
  t.expect(bar.shown && bar.left >= 0 && bar.right <= 390 && bar.oneRow && bar.inside, `paint bar fits a 390 px phone in one row (${JSON.stringify(bar)})`);
  await t.shot('paint-bar-sportscar-phone');
  await t.ev(() => Game.goHome());

  // driving the concrete mixer: the Pour button never sits on top of the Hop out button
  await t.boot({ viewport: { width: 390, height: 740 } });
  await t.ev(() => { const m = SiteTownExt.mixers[0]; T.tp(m.x + 30, m.y, 'site'); Game.enterCar(); T.step(5); });
  await t.wait(300);
  const mix = await t.ev(() => { const r = (id) => document.getElementById(id).getBoundingClientRect(), a = r('btn-car'), b = r('btn-make'); return { driving: Game.driving && Game.vehicle.kind === 'mixer', car: document.getElementById('btn-car').textContent, act: document.getElementById('btn-make').textContent, overlap: a.bottom > b.top && b.bottom > a.top && a.right > b.left && b.right > a.left, shown: !document.getElementById('btn-make').classList.contains('hidden') }; });
  t.expect(mix.driving && mix.shown && !mix.overlap, `pour and hop-out buttons do not overlap (${JSON.stringify(mix)})`);
  await t.ev(() => Game.goHome());

  // unlocking something repaints the whole town picture: that must stay quick (it used to freeze the game for 5+ seconds)
  await t.boot();
  const repaint = await t.ev(() => {
    T.tp(540, 600, 'town'); Render.draw(Game); Render.bgs.town.canvas.getContext('2d').getImageData(0, 0, 1, 1);
    const times = [];
    for (const k of ['oven2', 'tables2', 'driveThru']) { Game.s.unlocked[k] = true; const s = performance.now(); Render.draw(Game); Render.ctx.getImageData(0, 0, 1, 1); times.push(Math.round(performance.now() - s)); }
    return times;
  });
  t.expect(Math.max(...repaint) < 1000, `unlocking things repaints the town quickly (${repaint.join(' / ')} ms)`);

  // the railway is the edge of the map: walking (or driving) north stops just below the rails, in town and in Construction Town
  await t.boot({ viewport: { width: 1100, height: 720 } });
  const top = await t.ev(() => {
    const out = [];
    for (const [area, x, y] of [['town', -730, -84], ['town', 500, -40], ['town', 2000, 60], ['town', -1200, 40], ['site', 2990, -84], ['site', 3700, 20]]) {
      T.tp(x, y, area); T.steer(0.2, -1); T.step(150); T.unsteer();
      out.push({ area, x, y: Math.round(Game.player.y), top: Game.walkTop(), rails: Game.station().trackY + 18 });
    }
    Game.s.vehicles.car = true; Game.car.x = 300; Game.car.y = 0; T.tp(300, 40, 'town'); Game.enterCar(); T.steer(0, -1); T.step(120); T.unsteer();
    out.push({ area: 'car', y: Math.round(Game.car.y), rails: CFG.STATION.trackY + 18, driving: Game.driving }); Game.exitCar();
    return out;
  });
  for (const r of top) t.expect(r.y > r.rails && (r.area === 'car' ? r.driving : r.y >= r.top), `nobody gets onto the rails: ${JSON.stringify(r)}`);
  t.expectEq(await t.ev(() => { const S = CFG.STATION; T.tp(S.stopX + S.boardDx, -60, 'town'); T.steer(0, -1); T.step(90); T.unsteer(); const p = Game.player, P = S.platform; return p.y > P.y0 && p.y < P.y1; }), true, 'the platform itself is still walkable');
  await t.shot('top-edge-station');
  await t.boot({ viewport: { width: 390, height: 844 } });
  await t.ev(() => { Game.s.unlocked.station = true; T.tp(-700, -60, 'town'); T.steer(0, -1); T.step(60); T.unsteer(); Game.cameraSnap = true; });
  await t.shot('top-edge-station-phone');

  // waiting by the platform for about 5 s calls the train (once the station is fixed); walking away does not
  await t.boot({ viewport: { width: 1100, height: 720 } });
  const call = await t.ev(() => {
    const tr = Game.train, S = CFG.STATION;
    tr.state = 'away'; tr.timer = 200; tr.warned = false;
    T.tp(S.stopX + S.boardDx, S.platform.y1 - 12, 'town'); T.step(400);
    const broken = tr.timer > 100;   // the old station is not fixed yet: nothing comes
    Game.s.unlocked.station = true; tr.timer = 200; Game.floats.length = 0;
    const early = T.until(() => tr.timer < 10, 4 * 60), steps = T.until(() => tr.timer < 10, 90);
    const float = Game.floats.some((f) => /Here comes the train/.test(f.text));
    const arrived = T.until(() => tr.state === 'stopped', 1500); T.step(1); const label = T.label();
    tr.state = 'away'; tr.timer = 200; T.tp(540, 430, 'town'); T.step(600);
    return { broken, early, steps, float, arrived, label, away: tr.timer > 100 };
  });
  t.expect(call.broken && call.early === -1 && call.steps >= 0 && call.float, `standing on the platform for 5 s calls the train (${JSON.stringify(call)})`);
  t.expect(call.arrived >= 0 && call.label === '🚂 Ride the train', `the called train pulls in and can be boarded (${JSON.stringify(call)})`);
  t.expect(call.away, 'nobody on the platform: the train keeps its timetable');
  const siteCall = await t.ev(() => {
    const tr = Game.siteTrain, S = CFG.SITE.STATION;
    tr.state = 'away'; tr.x = CFG.SITE.WORLD.x1 + 600; T.tp(S.stopX + S.boardDx, S.platform.y1 - 12, 'site');
    const early = T.until(() => tr.state !== 'away', 4 * 60), arrived = T.until(() => tr.state === 'stopped', 900); T.step(1);
    return { early, arrived, label: T.label() };
  });
  t.expect(siteCall.early === -1 && siteCall.arrived >= 0 && siteCall.label === '🚂 Ride the train', `waiting on the Construction Town platform brings its train (${JSON.stringify(siteCall)})`);

  // drive-thru traffic (pizza and ice cream) only ever drives on real roads: never out of the woods, over grass or buildings
  await t.boot();
  const traffic = await t.ev(() => {
    Game.s.iceCream.owned = true; Game.s.icDrive.owned = true; Game.s.unlocked.driveThru = true;
    const onRoad = (x, y) => CFG.ROADS.some((R) => x >= R.x0 && x <= R.x1 && y >= R.y0 && y <= R.y1) || (x > CFG.WORLD.x1 && y >= CFG.ROADS[0].y0 && y <= CFG.ROADS[0].y1);
    const bad = [], seen = new Set(); let ic = 0, pz = 0;
    // watch from the shop, from the ice cream shop, and from the farm end of town (where the roads meet the woods)
    for (const [x, y] of [[540, 430], [1150, 650], [-760, 960], [-900, 60]]) {
      T.tp(x, y, 'town');
      for (let i = 0; i < 60 * 70; i++) {
        Game.s.piles.dt = 20; Game.update(1 / 60); if (i % 4 === 0) Render.draw(Game);
        for (const c of IceCreamDriveThruExt.cars) { if (!seen.has(c)) { seen.add(c); ic++; } if (!onRoad(c.x, c.y)) bad.push(['ice cream', Math.round(c.x), Math.round(c.y), c.state]); }
        for (const c of Game.cars) { if (!seen.has(c)) { seen.add(c); pz++; } const F = CFG.FIRE_STATION, bay = c.kind === 'firetruck' && c.x > F.x0 - 30 && c.x < F.x1 && c.y > F.y0 && c.y < F.y1;   // the fire truck backs home into its bay
        if (!onRoad(c.x, c.y) && !bay) bad.push(['pizza', Math.round(c.x), Math.round(c.y), c.state]); }
      }
    }
    return { bad: bad.slice(0, 6), nbad: bad.length, ic, pz, served: Game.s.icDrive.served, pizzas: Game.s.stats.served };
  });
  t.expect(traffic.nbad === 0, `drive-thru cars stay on the roads (${JSON.stringify(traffic)})`);
  t.expect(traffic.ic >= 4 && traffic.pz >= 6 && traffic.served >= 3 && traffic.pizzas >= 3, `both drive-thrus still get cars and serve them (${JSON.stringify(traffic)})`);
  await t.ev(() => { Render.setZoom(0.1); T.tp(1100, 700, 'town'); Render.draw(Game); IceCreamDriveThruExt.cars = []; IceCreamDriveThruExt.spawnT = 0.01; T.until(() => { Render.draw(Game); return IceCreamDriveThruExt.cars.some((c) => c.state === 'approach' && c.x > 1150); }, 3000); });
  await t.shot('icecream-drivethru-route');
};
