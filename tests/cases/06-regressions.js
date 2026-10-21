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
  t.expect(called >= 0 && called <= 1200, `waiting at the stop brings the bus (took ${called} steps)`);
  t.expectEq(await t.ev(() => T.label()), '🚌 Ride the bus', 'bus can be boarded from beside the bench');
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
};
