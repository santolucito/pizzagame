'use strict';
// The Pizza Coaster (js/pier-coaster.js) in Pizza Pier's coaster plot: the station's boarding spot is free and can be
// walked to from the boardwalk (through the alley between the bumper cars and the games); the hint by the queue entrance
// only; a train always comes to the station; '🎢 Ride the coaster' puts the chef in the front car: the chef moves along
// the track, rises on the lift hill, gets the "Wheee! 🎢" float at the big drop and the hands-up moment, and after one
// lap (15-20 s) steps off on the platform by themselves, with '🎢 Again!' offered; the visitors' trains go round while
// the chef isn't riding; Take-me-home mid-ride; a rescue from inside the ride's fence; screenshots of the lift hill and
// the drop at desktop and phone size.
const fs = require('fs');
const path = require('path');

module.exports = async (t) => {
  // until the coordinator wires the pier files into index.html, serve the page with them added
  const extra = ['js/pizzapier.js', 'js/pier-coaster.js'].filter((f) => fs.existsSync(path.join(__dirname, '..', '..', f)));
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    const add = extra.filter((f) => !body.includes(f)).map((f) => `<script src="${f}"></script>\n  `).join('');
    body = body.replace('<script src="js/main.js"></script>', add + '<script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();
  // freeze the real-time loop while a screenshot is taken mid-ride, so the picture shows the moment the steps reached
  const freeze = () => t.ev(() => { window.__upd = window.__upd || Game.update; Game.update = function () {}; });
  const thaw = () => t.ev(() => { if (window.__upd) { Game.update = window.__upd; window.__upd = null; } });

  // ---- registered, ahead of the City; everything inside the coaster plot
  const reg = await t.ev(() => {
    const C = CFG.PIER_COASTER, P = CFG.PIER.PLOTS.coaster, inPlot = (R) => R.x0 >= P.x0 && R.x1 <= P.x1 && R.y0 >= P.y0 && R.y1 <= P.y1;
    const gr = PierCoasterExt.ground;
    return {
      ok: typeof PierCoasterExt !== 'undefined' && Game.ext.includes(PierCoasterExt) && Render.ext.includes(PierCoasterExt),
      order: Game.ext.indexOf(PierCoasterExt) < Game.ext.indexOf(CityExt),
      fence: inPlot(C.FENCE), house: inPlot(C.HOUSE), platform: inPlot(C.PLATFORM),
      track: gr.every((q) => q.x - 8 >= P.x0 && q.x + 8 <= P.x1 && q.y - 8 >= P.y0 && q.y + 8 <= P.y1),
      top: Math.min(...gr.map((q) => q.y - q.h - 8)), walkY0: CFG.PIER.WORLD.walkY0, lap: PierCoasterExt.lapTime(), save: Game.s.pierCoaster && Game.s.pierCoaster.rides === 0,
    };
  });
  t.expect(reg.ok, 'the coaster extension is registered');
  t.expect(reg.order, 'the coaster answers before the City');
  t.expect(reg.fence && reg.house && reg.platform && reg.track, 'the fence, station house, platform and track stay inside the coaster plot');
  t.expect(reg.top >= reg.walkY0, `the chef's seat never goes above the park's walkable top, so no rescue fires mid-ride (${Math.round(reg.top)})`);
  t.expect(reg.lap > 14 && reg.lap < 20, `one lap takes about 15-20 s (${reg.lap.toFixed(1)} s)`);
  t.expect(reg.save, 'a fresh save has no coaster rides yet');

  // ---- the boarding spot is free and can be walked to from the boardwalk; the station is solid
  const walk = await t.ev(() => {
    const C = CFG.PIER_COASTER, B = C.BOARD;
    T.tp(8980, 5980, 'pizzapier');
    const obs = Game.obstacles(), hit = (x, y) => obs.some((o) => Game.hitRect(x, y, 12, o));
    const top = Game.walkTop(), x0 = 8420, x1 = 9700, y0 = top, y1 = 6040, st = 8, key = (x, y) => x + ',' + y;
    const start = [8984, 5976], seen = new Set([key(...start)]), q = [start];
    let reached = false;
    while (q.length) {
      const [x, y] = q.pop();
      if (Math.abs(x - B.x) <= 8 && Math.abs(y - B.y) <= 8) { reached = true; break; }
      for (const [dx, dy] of [[st, 0], [-st, 0], [0, st], [0, -st]]) { const nx = x + dx, ny = y + dy; if (nx < x0 || nx > x1 || ny < y0 || ny > y1 || seen.has(key(nx, ny)) || hit(nx, ny)) continue; seen.add(key(nx, ny)); q.push([nx, ny]); }
    }
    const H = C.HOUSE;
    return { free: !hit(B.x, B.y), entranceFree: !hit(C.ENTRANCE.x, C.ENTRANCE.y), reached, houseSolid: hit((H.x0 + H.x1) / 2, (H.y0 + H.y1) / 2), trackSolid: hit(9100, 5470) };
  });
  t.expect(walk.free && walk.entranceFree, 'the boarding spot and the queue entrance are free ground');
  t.expect(walk.reached, 'the boarding spot can be walked to from the boardwalk');
  t.expect(walk.houseSolid && walk.trackSolid, 'the station house and the track are solid');

  // ---- walking up the queue path from the boardwalk side ends on the platform
  const steer = await t.ev(() => {
    const C = CFG.PIER_COASTER; T.tp(C.ENTRANCE.x, C.ENTRANCE.y + 6, 'pizzapier');
    T.steer(0, -1); T.step(40); T.unsteer();
    return { onPlatform: PierCoasterExt.onPlatform(Game.player), y: Game.player.y };
  });
  t.expect(steer.onPlatform, `walking north up the queue path reaches the platform (${Math.round(steer.y)})`);

  // ---- hints: only near the queue entrance (and on the platform); nothing from the coaster further away
  const hints = await t.ev(() => {
    const C = CFG.PIER_COASTER;
    T.tp(9600, 5980, 'pizzapier'); const far = PierCoasterExt.hint(Game);
    T.tp(C.ENTRANCE.x, C.ENTRANCE.y + 50, 'pizzapier'); const near = PierCoasterExt.hint(Game), nearText = T.hint();
    T.tp(C.ENTRANCE.x + 90, C.ENTRANCE.y + 30, 'pizzapier'); const beside = PierCoasterExt.hint(Game);
    T.tp(8980, 5300, 'town'); const town = PierCoasterExt.hint(Game);
    return { far, near, nearText, beside, town };
  });
  t.expectEq(hints.far, undefined, 'no coaster hint far away on the boardwalk');
  t.expect(hints.near && hints.near.text === 'Ride the roller coaster! 🎢' && hints.near.target, 'the hint by the queue entrance points at the station');
  t.expectEq(hints.nearText, 'Ride the roller coaster! 🎢', 'the coaster hint shows by the entrance');
  t.expectEq(hints.beside, undefined, 'no coaster hint off to the side of the entrance');
  t.expectEq(hints.town, undefined, 'no coaster hint in another map');

  // ---- the visitors' trains go round by themselves: one waits at the station, the other runs; they swap
  const idle = await t.ev(() => {
    T.tp(9300, 5980, 'pizzapier');
    const st = PierCoasterExt.st, us0 = st.trains.map((x) => x.u), states = new Set(), parks = new Set(), riders = st.trains.map((x) => x.riders.filter(Boolean).length);
    let minGap = Infinity;
    for (let i = 0; i < 60 * 40; i++) {
      Game.update(1 / 60);
      for (const x of st.trains) { states.add(x.state); if (x.state === 'park') parks.add(x.id); }
      const L = PierCoasterExt.U.L, [a, b] = st.trains, d = Math.abs(a.u - b.u), gap = Math.min(d, L - d);
      minGap = Math.min(minGap, gap);
    }
    return { moved: st.trains.some((x, i) => x.u !== us0[i]), states: [...states], parks: [...parks], riders, minGap, ride: !!st.ride };
  });
  t.expect(idle.moved && !idle.ride, 'the visitors\' trains go round while the chef is not riding');
  t.expect(idle.riders.every((n) => n >= 3), `happy visitors ride in the cars (${idle.riders})`);
  t.expect(idle.states.includes('park') && idle.states.includes('run') && idle.states.includes('wait'), `trains stop at the station, run and wait their turn (${idle.states})`);
  t.expect(idle.parks.length === 2, 'both trains take turns at the station');
  t.expect(idle.minGap >= CFG_GAP_OK(), `the two trains never bump (closest ${Math.round(idle.minGap)} px)`);
  await t.ev(() => { Render.setZoom && Render.setZoom(1); T.tp(9000, 5470, 'pizzapier'); Game.player.y = 5560; Game.cameraSnap = true; T.step(1); });
  await t.ev(() => { const C = CFG.PIER_COASTER; T.tp(C.ENTRANCE.x, C.ENTRANCE.y + 30, 'pizzapier'); });
  await t.shot('station');

  // ---- on the platform: the ride button (a train always comes to the station within a few seconds)
  const ready = await t.ev(() => {
    const B = CFG.PIER_COASTER.BOARD; T.tp(B.x, B.y, 'pizzapier');
    const n = T.until(() => !!PierCoasterExt.parked(), 60 * 12);
    return { n, label: T.label(), hint: T.hint() };
  });
  t.expect(ready.n >= 0 && ready.n < 60 * 10, `a train is at the station within a few seconds (${ready.n} steps)`);
  t.expectEq(ready.label, '🎢 Ride the coaster', 'the button on the platform');
  t.expectEq(ready.hint, 'Ride the roller coaster! 🎢', 'the hint on the platform');

  // ---- the ride: in the front car, along the track, up the lift hill, the drop, back to the station on foot
  const ride = await t.ev(() => {
    const st = PierCoasterExt.st, U2 = PierCoasterExt.U, B = CFG.PIER_COASTER.BOARD, p = Game.player;
    T.act();
    const R = st.ride, train = R && R.train, boarding = R && R.phase;
    T.step(40);
    const seated = st.ride && st.ride.phase === 'go';
    // the chef sits on the front car
    const c = PierCoasterExt.seat(train.u), onCar = Math.hypot(p.x - c.x, p.y - c.y) < 1;
    const label = T.label();
    // walk the joystick: the chef stays in the car
    T.steer(1, 1); T.step(20); T.unsteer();
    const c2 = PierCoasterExt.seat(train.u), stays = Math.hypot(p.x - c2.x, p.y - c2.y) < 1;
    let minY = Infinity, minX = Infinity, maxX = -Infinity, liftHint = null, wheee = false, hands = false, steps = 0, liftY0 = null, dropHint = null;
    while (st.ride && steps < 60 * 40) {
      Game.update(1 / 60); steps++;
      if (st.ride && st.ride.phase === 'go' && Math.abs(p.y - PierCoasterExt.seat(train.u).y) > 1 && !window.__bad) window.__bad = [steps, p.y, PierCoasterExt.seat(train.u).y, train.u];
      minY = Math.min(minY, p.y); minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      if (st.ride && train.u > U2.LIFT0 + 10 && liftY0 === null) liftY0 = p.y;
      if (st.ride && train.u > (U2.LIFT0 + U2.LIFT1) / 2 && !liftHint) liftHint = T.hint();
      if (st.ride && train.u > U2.DROP0 + 20 && !dropHint) { dropHint = T.hint(); hands = PierCoasterExt.handsUpNow(train.u); }
      if (Game.floats.some((f) => /Wheee! 🎢/.test(f.text))) wheee = true;
    }
    return {
      boarding, seated, onCar, label, stays, minY, minX, maxX, liftY0, liftHint, dropHint, wheee, hands, steps: steps + 60,
      bad: window.__bad, done: !st.ride, area: Game.area, x: p.x, y: p.y, board: B, after: T.label(), rides: Game.s.pierCoaster.rides,
      trainBack: train.state === 'park', chefFlag: !!train.chef,
    };
  });
  t.expectEq(ride.boarding, 'board', 'pressing the button hops the chef in');
  t.expect(ride.seated && ride.onCar, 'the chef sits in the front car');
  t.expectEq(ride.label, '🙌 Hands up!', 'the button while riding');
  t.expect(ride.stays, 'the joystick does not pull the chef out of the car');
  t.expect(ride.maxX - ride.minX > 700, `the chef goes all the way round the track (${Math.round(ride.minX)}..${Math.round(ride.maxX)})`);
  t.expectEq(ride.bad, undefined, 'the chef stays in the front car the whole lap (nothing else moves them)');
  t.expect(ride.liftY0 !== null && ride.minY < ride.liftY0 - 80, `the chef rises up the lift hill (${Math.round(ride.liftY0)} → ${Math.round(ride.minY)})`);
  t.expectEq(ride.liftHint, 'Click, click, click… up we go! ⛰️', 'the lift hill hint');
  t.expect(ride.wheee, 'the "Wheee! 🎢" float at the big drop');
  t.expect(ride.hands && ride.dropHint === 'Wheee! Hands up! 🙌', 'hands up on the drop');
  t.expect(ride.done && ride.area === 'pizzapier', 'the ride ends at the pier');
  t.expect(ride.steps > 60 * 15 && ride.steps < 60 * 21, `one lap takes about 15-20 s (${(ride.steps / 60).toFixed(1)} s)`);
  t.expect(ride.x === ride.board.x && ride.y === ride.board.y, 'the chef steps off onto the platform by themselves');
  t.expect(ride.trainBack && !ride.chefFlag, 'the train is back in the station');
  t.expectEq(ride.after, '🎢 Again!', '"Again!" is offered right after');
  t.expectEq(ride.rides, 1, 'the ride is counted');
  const walkOff = await t.ev(() => { const x0 = Game.player.x; T.steer(1, 0); T.step(15); T.unsteer(); return Game.player.x - x0; });
  t.expect(walkOff > 20, 'the chef walks off on foot');

  // ---- screenshots on the lift hill and on the drop (desktop, then phone)
  const shoot = async (tag) => {
    await t.ev(() => { const B = CFG.PIER_COASTER.BOARD; T.tp(B.x, B.y, 'pizzapier'); T.until(() => !!PierCoasterExt.parked(), 60 * 12); T.act(); T.until(() => PierCoasterExt.st.ride && PierCoasterExt.st.ride.train.u > (PierCoasterExt.U.LIFT0 + PierCoasterExt.U.LIFT1) / 2 + 30, 60 * 20); Game.cameraSnap = true; });
    await freeze(); await t.shot('lift-' + tag); await thaw();
    const swoop = await t.ev(() => { const P = PierCoasterExt.P; T.until(() => PierCoasterExt.at(PierCoasterExt.st.ride.train.u).s > P.sC + 360, 60 * 10); Game.cameraSnap = true; return PierCoasterExt.st.ride.phase; });
    t.expectEq(swoop, 'go', 'still riding on the drop');
    await freeze(); await t.shot('drop-' + tag); await thaw();
    await t.ev(() => { T.until(() => !PierCoasterExt.st.ride, 60 * 20); });
  };
  await shoot('desktop');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => Render.resize());
  await shoot('phone');
  await t.ev(() => { const C = CFG.PIER_COASTER; T.tp(C.BOARD.x, C.BOARD.y + 10, 'pizzapier'); });
  await t.shot('platform-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => Render.resize());

  // ---- '🎢 Again!' starts another ride; Take-me-home mid-ride stops it cleanly
  const home = await t.ev(() => {
    const st = PierCoasterExt.st, B = CFG.PIER_COASTER.BOARD;
    T.tp(B.x, B.y, 'pizzapier'); T.until(() => !!PierCoasterExt.parked(), 60 * 12);
    T.act(); T.step(300);
    const mid = !!st.ride && st.ride.phase === 'go', train = st.ride && st.ride.train;
    Game.goHome(); T.step(2);
    const after = { area: Game.area, ride: st.ride, chef: train && !!train.chef, label: T.label(), hint: PierCoasterExt.hint(Game) };
    T.step(60 * 25);   // the train carries on round with its visitors
    T.tp(B.x, B.y, 'pizzapier'); const n = T.until(() => !!PierCoasterExt.parked(), 60 * 12);
    return { mid, after, n, label: T.label(), trains: st.trains.map((x) => [x.state, Math.round(x.u)]) };
  });
  t.expect(home.mid, 'riding before Take-me-home');
  t.expect(home.after.area === 'town' && home.after.ride === null && !home.after.chef, 'Take-me-home stops the ride and leaves the train');
  t.expectEq(home.after.hint, undefined, 'no coaster hint at home');
  t.expect(home.n >= 0 && home.label === '🎢 Ride the coaster', `back at the pier the coaster works again (${JSON.stringify(home.trains)})`);

  // ---- dusk: the station's and the lift hill's bulbs twinkle
  await t.ev(() => { if (typeof AtmosphereExt !== 'undefined' && AtmosphereExt.force) AtmosphereExt.force({ phase: 'dusk', weather: 'clear' }); const C = CFG.PIER_COASTER; T.tp(C.ENTRANCE.x, C.ENTRANCE.y + 30, 'pizzapier'); T.step(60 * 9); });
  await t.shot('dusk');
  await t.ev(() => { if (typeof AtmosphereExt !== 'undefined' && AtmosphereExt.force) AtmosphereExt.force({ phase: 'day', weather: 'clear' }); });

  // ---- rescue: a chef pushed inside the ride's fence or the station house lands on the platform
  const rescue = await t.ev(() => {
    const C = CFG.PIER_COASTER, out = [];
    for (const [x, y] of [[9100, 5300], [(C.HOUSE.x0 + C.HOUSE.x1) / 2, (C.HOUSE.y0 + C.HOUSE.y1) / 2], [8500, 5400]]) {
      T.tp(x, y, 'pizzapier'); T.step(2); out.push([Game.player.x, Game.player.y]);
    }
    return { out, B: C.BOARD };
  });
  t.expect(rescue.out.every(([x, y]) => x === rescue.B.x && y === rescue.B.y), `a chef stuck in the ride lands on the platform (${JSON.stringify(rescue.out)})`);

  // ---- a save made mid-ride reloads onto free ground
  await t.ev(() => { const B = CFG.PIER_COASTER.BOARD; T.tp(B.x, B.y, 'pizzapier'); T.until(() => !!PierCoasterExt.parked(), 60 * 12); T.act(); T.step(400); Game.save(); });
  await t.reload();
  const reload = await t.ev(() => { T.step(3); const p = Game.player; return { area: Game.area, free: !PierCoasterExt.obs().some((o) => Game.hitRect(p.x, p.y, 8, o)), ride: PierCoasterExt.st.ride }; });
  t.expect(reload.area !== 'pizzapier' || (reload.free && !reload.ride), 'a reload after a mid-ride save stands the chef on free ground');
};

// the closest the two trains may come (rail px between their front cars): a whole train plus a little room
function CFG_GAP_OK() { return 4 * 44; }
