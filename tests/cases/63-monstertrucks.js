'use strict';
// Monster trucks (js/monstertrucks.js): El Toro Loco and Grave Digger parked at Construction Town's dirt track by the
// stadium gate; both drivable (in, drive, out); driving one through the gate into the Monster Truck Arena (its own map in a
// free rectangle, part of Construction Town on the world map) and back up the tunnel; walking in and out with the button;
// a jump with real air time and a landing (WHOA, dust); a backflip from the air (TA-DA); a wheelie, then a donut (held on
// the spot, a ring of tyre marks); crushing a junk car (CRUNCH) and the forklift bringing a fresh one; the other truck
// driving its laps by itself and stopping for the chef; rescues; Take-me-home; a reload in the arena.
// Screenshots desktop + phone: the trucks at the track, mid-air, crushing, a backflip.
module.exports = async (t) => {
  // until the coordinator wires js/monstertrucks.js into index.html, serve the page with it added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/monstertrucks.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/monstertrucks.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();
  // the hills' own tricks (backflip / front flip) are switched off for the older plain-jump checks and checked at the end
  await t.ev(() => CFG.MTRUCKS.RAMPS.forEach((r) => { r._trick = r.trick; r.trick = null; }));
  if (await t.ev(() => typeof AtmosphereExt !== 'undefined' && !!AtmosphereExt.force)) await t.ev(() => { AtmosphereExt.force({ phase: 'day', weather: 'none' }); T.step(1); });

  // ---- registered: the arena in a free rectangle, part of Construction Town, ahead of the outer maps; the two vehicles
  const reg = await t.ev(() => {
    const W = CFG.AREAS.arena && CFG.AREAS.arena.WORLD, hits = [];
    for (const [k, a] of Object.entries(CFG.AREAS)) { if (k === 'arena' || !a.WORLD) continue; const o = a.WORLD; if (o.x0 < W.x1 + 1000 && o.x1 > W.x0 - 1000 && o.y0 < W.y1 + 1000 && o.y1 > W.y0 - 1000) hits.push(k); }
    return {
      ok: typeof MonsterTrucksExt !== 'undefined' && Game.ext.includes(MonsterTrucksExt) && Render.ext.includes(MonsterTrucksExt),
      order: Game.ext.indexOf(MonsterTrucksExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(MonsterTrucksExt) < Game.ext.indexOf(SiteTownExt),
      world: [W.x0, W.y0, W.x1, W.y1], place: CFG.AREAS.arena.place, hits,
      specs: ['eltoro', 'gravedigger'].map((k) => CFG.VEHICLES[k] && [CFG.VEHICLES[k].label, CFG.VEHICLES[k].exit]),
      worldmap: typeof WorldMapExt !== 'undefined' ? WorldMapExt.placeOf('arena') : 'site',
    };
  });
  t.expect(reg.ok, 'the monster truck extension is registered');
  t.expect(reg.order, 'it answers before Construction Town and the City');
  t.expectEq(JSON.stringify(reg.world), JSON.stringify([36000, 5000, 38400, 6400]), 'the arena sits in its free rectangle');
  t.expectEq(reg.hits.join(','), '', 'no other map within 1000 px of the arena');
  t.expectEq(reg.place, 'site', 'the arena is part of Construction Town');
  t.expectEq(reg.worldmap, 'site', 'the world map puts the arena in Construction Town');
  t.expectEq(JSON.stringify(reg.specs), JSON.stringify([['🐂 Drive El Toro Loco', '🚶 Hop out'], ['👻 Drive Grave Digger', '🚶 Hop out']]), 'vehicle labels');

  // ---- parked at the dirt track by the gate, on free ground, listed as Construction Town's vehicles
  const park = await t.ev(() => {
    T.tp(2900, 1190, 'site');
    const M = CFG.MTRUCKS, obs = Game.obstacles();
    return MonsterTrucksExt.trucks.map((v) => ({ kind: v.kind, area: v.area, x: v.x, y: v.y, listed: Game.vehicles().includes(v), solid: obs.filter((o) => Game.hitRect(v.x, v.y, 40, o)).length, gate: Math.round(U.dist(v.x, v.y, M.DOOR.x, M.DOOR.y)) }));
  });
  for (const p of park) t.expect(p.area === 'site' && p.listed && p.solid === 0 && p.gate < 300, `${p.kind} parked by the gate on free ground ${JSON.stringify(p)}`);
  // the gate: its door button and hint on foot; nothing far away
  const gate = await t.ev(() => {
    const M = CFG.MTRUCKS; T.tp(M.DOOR.x, M.DOOR.y + 10, 'site'); T.step(2);
    const at = { label: T.label(), hint: T.hint(), solid: Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o)) };
    T.tp(3600, 600, 'site'); T.step(2);
    return { at, far: MonsterTrucksExt.hint(Game), farLabel: MonsterTrucksExt.action(Game) };
  });
  t.expectEq(gate.at.label, '🏟️ Go to the arena', 'the gate button on foot');
  t.expectEq(gate.at.hint, 'The Monster Truck Arena! 🏟️', 'the gate hint on foot');
  t.expect(!gate.at.solid, 'the door spot is free ground');
  t.expect(gate.far === undefined && gate.farLabel === null, 'no hint or button far from the trucks and the gate');
  await t.ev(() => { const M = CFG.MTRUCKS; T.tp(2800, 1186, 'site'); Render.setZoom(1); Game.cameraSnap = true; T.step(2); Game.floats.length = 0; });
  await t.shot('track');

  // ---- both trucks: hop in, drive, hop out
  for (const kind of ['eltoro', 'gravedigger']) {
    const r = await t.ev((kind) => {
      const v = MonsterTrucksExt.truck(kind); T.tp(v.x + 10, v.y + 44, 'site'); T.step(2);
      const near = Game.nearVehicle === v, hint = T.hint();
      Game.enterCar(); T.step(1);
      const inIt = Game.driving && Game.vehicle === v, rot0 = v.rot, x0 = v.x, y0 = v.y;
      T.steer(1, 0); T.step(50); T.unsteer(); T.step(20);
      const moved = Math.round(U.dist(x0, y0, v.x, v.y)), face = v.face, spun = v.rot - rot0;
      const btn = document.getElementById('btn-car') ? document.getElementById('btn-car').textContent : null;
      Game.exitCar(); T.step(2);
      const p = Game.player, solid = Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o));
      return { near, hint, inIt, moved, face, spun, btn, out: !Game.driving, solid, still: Math.hypot(v.vx, v.vy) };
    }, kind);
    t.expect(r.near && r.hint === 'Drive a monster truck! 🐂👻', `${kind}: offered on foot beside it ${JSON.stringify(r)}`);
    t.expect(r.inIt, `${kind}: climbed in`);
    t.expect(r.moved > 80 && r.face === 1 && r.spun > 2, `${kind}: drove east, facing east, wheels turning ${JSON.stringify(r)}`);
    t.expect(r.out && !r.solid && r.still === 0, `${kind}: hopped out on free ground ${JSON.stringify(r)}`);
  }
  t.expectEq(await t.ev(() => { T.step(10); return document.getElementById('btn-car') && document.getElementById('btn-car').textContent; }), '👻 Drive Grave Digger', 'the vehicle button names the truck');

  // ---- drive El Toro through the gate into the arena
  const into = await t.ev(() => {
    const M = CFG.MTRUCKS, v = MonsterTrucksExt.truck('eltoro'), o = MonsterTrucksExt.truck('gravedigger');
    MonsterTrucksExt.park(v); MonsterTrucksExt.park(o);
    v.x = M.DOOR.x + 30; v.y = 1262; T.tp(v.x, v.y + 30, 'site'); Game.enterCar(); T.step(1);
    const hint = Game.hint && { text: Game.hint.text, target: !!Game.hint.target };
    T.steer(-0.3, -1); const n = T.until(() => Game.area === 'arena', 200); T.unsteer(); T.step(2);
    const W = CFG.MTRUCKS.FLOOR, p = Game.player, h = Game.hint;
    return { hint, n, area: Game.area, driving: Game.driving && Game.vehicle === v, varea: v.area, oarea: o.area, ai: o.ai, inFloor: p.x > W.x0 && p.x < W.x1 && p.y > W.y0 - 20 && p.y < W.y1, toast: T.toasts.includes(CFG.MTRUCKS.toast), seen: Game.s.mtrucks.seen, hintText: h && h.text, hintTarget: h && h.target ? [h.target.x, h.target.y] : null };
  });
  t.expect(into.hint && into.hint.text === 'Drive into the big gate to the arena! 🏟️', `driving hint points at the gate ${JSON.stringify(into.hint)}`);
  t.expect(into.n >= 0 && into.area === 'arena' && into.driving && into.varea === 'arena', `drove through the gate into the arena ${JSON.stringify(into)}`);
  t.expect(into.inFloor, 'arrived on the arena floor');
  t.expect(into.oarea === 'arena' && into.ai, 'the other truck came along to do its show');
  t.expect(into.toast && into.seen, 'the welcome toast, once');
  t.expect(!into.hintTarget, `no hint arrow pointing out of the arena (${into.hintText})`);

  // ---- the other truck drives by itself
  const ai = await t.ev(() => { const o = MonsterTrucksExt.truck('gravedigger'), x0 = o.x, y0 = o.y; let path = 0, px = o.x, py = o.y; for (let i = 0; i < 240; i++) { T.step(1); path += U.dist(px, py, o.x, o.y); px = o.x; py = o.y; } return { path: Math.round(path), d: Math.round(U.dist(x0, y0, o.x, o.y)) }; });
  t.expect(ai.path > 400, `the AI truck drives its laps (${JSON.stringify(ai)})`);
  const aiJump = await t.ev(() => { const o = MonsterTrucksExt.truck('gravedigger'); const n = T.until(() => !!o.air, 60 * 40); const z = []; T.until(() => { z.push(o.z); return !o.air; }, 300); return { n, top: Math.round(Math.max(...z)) }; });
  t.expect(aiJump.n >= 0 && aiJump.top > 80, `the AI truck flies off a jump by itself ${JSON.stringify(aiJump)}`);

  // ---- a jump: real air time, a shadow on the ground, a bouncy landing with dust and WHOA
  const jump = await t.ev(() => {
    const M = CFG.MTRUCKS, v = Game.vehicle, R = M.RAMPS[0], trick = R.trick; R.trick = null;   // as a plain jump here (its own trick is checked at the end)
    MonsterTrucksExt.still(v); v.x = R.x - 260; v.y = R.y; Game.player.x = v.x; Game.player.y = v.y; Game.cameraSnap = true;
    MonsterTrucksExt.st.pops.length = 0; const jumps0 = Game.s.mtrucks.jumps;
    T.steer(1, 0); const n = T.until(() => !!v.air, 200);
    let air = 0, top = 0, label = null, hint = null;
    T.until(() => { air++; top = Math.max(top, v.z); if (air === 20) { label = T.label(); hint = T.hint(); } return !v.air; }, 400);
    const sq = v.sqv, pops = MonsterTrucksExt.st.pops.map((p) => p.text), dust = MonsterTrucksExt.st.dust.length;
    T.unsteer(); T.step(30);
    R.trick = trick;
    return { n, air, top: Math.round(top), label, hint, sq, pops, dust, jumps: Game.s.mtrucks.jumps - jumps0, z: v.z, flew: Math.round(v.x - R.x) };
  });
  t.expect(jump.n >= 0, 'took off from the dirt hill');
  t.expect(jump.air > 45 && jump.top > 120, `real air time (${jump.air} steps, ${jump.top} px up)`);
  t.expectEq(jump.label, '🔄 Backflip', 'in the air the button offers a backflip');
  t.expect(jump.pops.includes('WHOA! 💥') && jump.dust > 10 && jump.sq < 0, `landed with WHOA, dust and a squash on the springs ${JSON.stringify(jump)}`);
  t.expect(jump.jumps === 1 && jump.flew > 200, `counted, flew well past the hill ${JSON.stringify(jump)}`);
  // mid-air screenshot (hold it still in the air)
  const freeze = async (fn) => t.ev(fn);
  await freeze(() => {
    const M = CFG.MTRUCKS, v = Game.vehicle, R = M.RAMPS[1];
    MonsterTrucksExt.still(v); v.x = R.x - 240; v.y = R.y; T.steer(1, 0); T.until(() => !!v.air, 200); T.step(16); T.unsteer();
    M._G = M.G; M.G = 0; v.vz = 0; v.air.vx = 0; v.air.vy = 0; Game.floats.length = 0; MonsterTrucksExt.st.pops.length = 0; Game.cameraSnap = true; T.step(1);
  });
  await t.shot('midair');
  // ---- a backflip off the next jump: the flip, then TA-DA
  const flip = await t.ev(() => {
    const M = CFG.MTRUCKS, v = Game.vehicle; M.G = M._G;
    MonsterTrucksExt.st.pops.length = 0; const f0 = Game.s.mtrucks.flips;
    const label = T.label(); T.act();
    const flipping = !!v.flip, label2 = T.label(); let maxA = 0;
    T.until(() => { maxA = Math.max(maxA, MonsterTrucksExt.flipAngle(v)); return !v.air; }, 400);
    return { label, flipping, label2, maxA: +maxA.toFixed(2), pops: MonsterTrucksExt.st.pops.map((p) => p.text), flips: Game.s.mtrucks.flips - f0, confetti: MonsterTrucksExt.st.confetti.length };
  });
  t.expectEq(flip.label, '🔄 Backflip', 'backflip button in the air');
  t.expect(flip.flipping && flip.label2 === null, 'the flip starts (no second press mid-flip)');
  t.expect(flip.maxA > 5.5 && flip.pops.includes('TA-DA! 🎉') && flip.flips === 1 && flip.confetti > 10, `a whole flip and a TA-DA landing ${JSON.stringify(flip)}`);
  // backflip screenshot, held at a third of the way round
  await t.ev(() => {
    const M = CFG.MTRUCKS, v = Game.vehicle, R = M.RAMPS[0];
    MonsterTrucksExt.still(v); v.x = R.x - 240; v.y = R.y; T.steer(1, 0); T.until(() => !!v.air, 200); T.unsteer(); T.step(8); T.act(); T.step(10);
    M._G = M.G; M.G = 0; v.vz = 0; v.air.vx = 0; v.air.vy = 0; v.flip.dur = 1000; v.flip.t = 360; Game.floats.length = 0; MonsterTrucksExt.st.pops.length = 0; Game.cameraSnap = true; T.step(1);
  });
  await t.shot('backflip');
  await t.ev(() => { const M = CFG.MTRUCKS, v = Game.vehicle; M.G = M._G; v.flip.dur = 0.5; v.flip.t = 0.5; T.until(() => !v.air, 400); T.step(20); });

  // ---- on flat ground: wheelie, then donut, then wheelie again
  const tricks = await t.ev(() => {
    const v = Game.vehicle; MonsterTrucksExt.still(v); v.x = 37250; v.y = 5850; Game.player.x = v.x; Game.player.y = v.y; T.step(2);
    const l1 = T.label(); T.steer(1, 0); T.act(); T.step(24);
    const wa = MonsterTrucksExt.wheelieAngle(v), wheelie = !!v.wheelie, l2 = T.label();
    T.act(); const donut = !!v.donut, x0 = v.x, y0 = v.y; T.steer(1, 1); T.step(40);
    const held = U.dist(x0, y0, v.x, v.y), spin = v.donut && v.donut.a, dust = MonsterTrucksExt.st.dust.length, l3 = T.label();
    T.until(() => !v.donut, 200); T.unsteer(); T.step(2);
    return { l1, wa: +wa.toFixed(2), wheelie, l2, donut, held, spin: spin && +spin.toFixed(1), dust, l3, l4: T.label(), marks: MonsterTrucksExt.st.marks.length, st: Object.assign({}, Game.s.mtrucks) };
  });
  t.expectEq(tricks.l1, '🤸 Wheelie', 'on the ground the button offers a wheelie');
  t.expect(tricks.wheelie && tricks.wa > 0.3, `the front wheels lift ${JSON.stringify(tricks)}`);
  t.expectEq(tricks.l2, '🍩 Donut', 'then a donut');
  t.expect(tricks.donut && tricks.held < 1 && tricks.spin > 3 && tricks.dust > 15 && tricks.l3 === null, `the donut spins on the spot in a ring of dust ${JSON.stringify(tricks)}`);
  t.expect(tricks.l4 === '🤸 Wheelie' && tricks.marks >= 1 && tricks.st.wheelies === 1 && tricks.st.donuts === 1, `back to wheelie, tyre marks left ${JSON.stringify(tricks)}`);

  // ---- crush a junk car, the forklift brings a fresh one
  const crush = await t.ev(() => {
    const M = CFG.MTRUCKS, v = Game.vehicle, c = MonsterTrucksExt.st.cars[0];
    MonsterTrucksExt.still(v); v.x = c.x - 160; v.y = c.y; Game.player.x = v.x; Game.player.y = v.y; MonsterTrucksExt.st.pops.length = 0;
    T.steer(1, 0); const n = T.until(() => c.flat, 120); T.unsteer(); T.step(6);
    return { n, flat: c.flat, pops: MonsterTrucksExt.st.pops.map((p) => p.text), sparks: MonsterTrucksExt.st.sparks.length, crushed: Game.s.mtrucks.crushed, bump: v.bump };
  });
  t.expect(crush.n >= 0 && crush.flat && crush.pops.includes('CRUNCH! 🚗💥') && crush.sparks > 5 && crush.crushed >= 1, `drove over a junk car and crushed it ${JSON.stringify(crush)}`);
  await t.ev(() => { const v = Game.vehicle, c = MonsterTrucksExt.st.cars[0]; v.x = c.x + 40; Game.player.x = v.x; Game.floats.length = 0; MonsterTrucksExt.st.pops.length = 0; MonsterTrucksExt.crushCheck(Game, null); c.t = 9; Game.cameraSnap = true; T.step(1); MonsterTrucksExt.pop(c.x, c.y - 170, 'CRUNCH! 🚗💥', '#ffd166', 9); MonsterTrucksExt.st.pops[0].t = 2.7; });
  await t.shot('crush');
  const refill = await t.ev(() => {
    const v = Game.vehicle, c = MonsterTrucksExt.st.cars[0]; Game.exitCar(); T.step(1);
    const P = CFG.MTRUCKS.ARENA_PARK; T.tp(P.x, P.y + 60, 'arena');
    const f = MonsterTrucksExt.st.fork, phases = new Set();
    const n = T.until(() => { phases.add(f.phase); return !c.flat; }, 60 * 30);
    const gone = T.until(() => f.phase === 'parked', 60 * 20);
    return { n, phases: [...phases].join(','), flat: c.flat, gone, at: [Math.round(f.x), Math.round(f.y)] };
  });
  t.expect(refill.n > 60 * 5 && /fetch/.test(refill.phases) && /swap/.test(refill.phases) && !refill.flat && refill.gone >= 0, `the forklift fetched a fresh car through its door, swapped it in and parked again ${JSON.stringify(refill)}`);

  // ---- the forklift can be driven too: forks up and down, and it drives itself home after
  const fl = await t.ev(() => {
    const f = MonsterTrucksExt.st.fork; T.tp(f.x - 20, f.y + 40, 'arena'); T.step(2);
    const near = Game.nearVehicle === f, hint = T.hint(), list = Game.vehicles().includes(f);
    Game.enterCar(); T.step(1);
    const inIt = Game.vehicle === f, l1 = T.label(); T.act(); T.step(30); const lift = f.lift, l2 = T.label();
    const x0 = f.x; T.steer(-1, 0); T.step(60); T.unsteer(); T.step(10); const moved = Math.round(x0 - f.x), face = f.face;
    T.act(); Game.exitCar(); T.step(2); const phase = f.phase;
    const n = T.until(() => f.phase === 'parked', 600);
    return { near, hint, list, inIt, l1, lift: +lift.toFixed(2), l2, moved, face, phase, n };
  });
  t.expect(fl.list && fl.near && fl.hint === 'Drive the forklift! 🚜', `the forklift is offered on foot ${JSON.stringify(fl)}`);
  t.expect(fl.inIt && fl.l1 === '⬆️ Forks up' && fl.lift > 0.8 && fl.l2 === '⬇️ Forks down', `drive the forklift, forks up ${JSON.stringify(fl)}`);
  t.expect(fl.moved > 100 && fl.face === -1 && fl.phase === 'home' && fl.n >= 0, `it drives, and goes home by itself after ${JSON.stringify(fl)}`);

  // ---- the AI truck stops for the chef on foot, so he can climb in; the other one takes over the show
  const swap = await t.ev(() => {
    const o = MonsterTrucksExt.truck('gravedigger'), e = MonsterTrucksExt.truck('eltoro');
    T.until(() => !o.air && !o.donut, 400);
    T.tp(o.x, o.y + 50, 'arena'); T.step(60);
    const sp = Math.hypot(o.vx, o.vy), near = Game.nearVehicle === o;
    Game.enterCar(); T.step(2);
    const mine = Game.vehicle === o, eAi = e.ai; const ex = e.x; T.step(200);
    return { sp: Math.round(sp), near, mine, eAi, eMoved: Math.round(Math.abs(e.x - ex)) };
  });
  t.expect(swap.sp < 5 && swap.near && swap.mine, `the AI truck waits for the chef, who climbs in ${JSON.stringify(swap)}`);
  t.expect(swap.eAi && swap.eMoved > 50, `El Toro now does the show ${JSON.stringify(swap)}`);

  // ---- out through the tunnel with the truck, back at the gate in Construction Town
  const outT = await t.ev(() => {
    const M = CFG.MTRUCKS, v = Game.vehicle; MonsterTrucksExt.still(v); v.x = M.TUNNEL.x + 20; v.y = M.ARRIVE.y + 60; Game.player.x = v.x; Game.player.y = v.y; T.step(1);
    T.steer(0, -1); T.step(4); const hint = T.hint(); const n = T.until(() => Game.area === 'site', 200); T.unsteer(); T.step(2);
    const other = MonsterTrucksExt.truck('eltoro'), P = M.PARK.eltoro;
    return { hint, n, area: Game.area, driving: Game.driving && Game.vehicle === v, x: Math.round(v.x), y: Math.round(v.y), vArea: v.area, otherHome: other.area === 'site' && other.x === P.x && other.y === P.y && !other.ai, label: T.label() };
  });
  t.expect(outT.hint === 'Drive up into the tunnel to go back 🏁', `tunnel hint ${outT.hint}`);
  t.expect(outT.n >= 0 && outT.area === 'site' && outT.driving && outT.vArea === 'site', `drove out through the tunnel ${JSON.stringify(outT)}`);
  t.expect(Math.abs(outT.x - 2694) < 10 && outT.y > 1210, `came out at the gate ${JSON.stringify(outT)}`);
  t.expect(outT.otherHome, 'the other truck parked back in its bay');
  t.expectEq(outT.label, '🤸 Wheelie', 'tricks work on the dirt track too');
  // a baby jump on the dirt track
  const baby = await t.ev(() => { const R = CFG.MTRUCKS.SITE_RAMPS[0], v = Game.vehicle; MonsterTrucksExt.still(v); v.x = R.x - 200; v.y = R.y; T.steer(1, 0); const n = T.until(() => !!v.air, 200); let top = 0; T.until(() => { top = Math.max(top, v.z); return !v.air; }, 200); T.unsteer(); T.step(10); return { n, top: Math.round(top) }; });
  t.expect(baby.n >= 0 && baby.top > 30, `a little jump on the dirt track ${JSON.stringify(baby)}`);

  // ---- on foot: walk in with the button, and out again with the button
  const walk = await t.ev(() => {
    const M = CFG.MTRUCKS; Game.exitCar(); T.tp(M.DOOR.x, M.DOOR.y + 8, 'site'); T.step(2);
    const l1 = T.label(); T.act(); T.step(2);
    const a1 = Game.area, p1 = [Math.round(Game.player.x), Math.round(Game.player.y)], hint = Game.hint && Game.hint.text, mine = MonsterTrucksExt.st.mine;
    const parkedMine = mine.area === 'arena' && !mine.ai, aiOther = MonsterTrucksExt.trucks.find((v) => v !== mine).ai;
    T.tp(M.TUNNEL_DOOR.x, M.TUNNEL_DOOR.y + 6, 'arena'); T.step(2);
    const l2 = T.label(), h2 = T.hint(); T.act(); T.step(2);
    return { l1, a1, p1, hint, parkedMine, aiOther, l2, h2, a2: Game.area, p2: [Math.round(Game.player.x), Math.round(Game.player.y)] };
  });
  t.expect(walk.l1 === '🏟️ Go to the arena' && walk.a1 === 'arena' && walk.p1[0] === 36300 && walk.parkedMine && walk.aiOther, `walked into the arena ${JSON.stringify(walk)}`);
  t.expect(walk.l2 === '🏁 Back to the dirt track' && walk.h2 === 'Back to the dirt track 🏁' && walk.a2 === 'site' && Math.abs(walk.p2[0] - 2694) < 2, `walked back out to the gate ${JSON.stringify(walk)}`);

  // ---- rescues: the chef in the arena's wall, in the gate's wall; a truck left inside a building
  const rescue = await t.ev(() => {
    const M = CFG.MTRUCKS;
    T.tp(36020, 5700, 'arena'); T.step(40); const a = [Math.round(Game.player.x), Math.round(Game.player.y)];
    T.tp(M.GATE.x0 + 60, M.GATE.y0 + 60, 'site'); T.step(40); const b = [Math.round(Game.player.x), Math.round(Game.player.y)];
    const v = MonsterTrucksExt.truck('gravedigger'), D = CFG.SITETOWN.DINER; v.x = (D.x0 + D.x1) / 2; v.y = (D.y0 + D.y1) / 2; T.step(40);
    return { a, b, truck: [v.x, v.y], park: [M.PARK.gravedigger.x, M.PARK.gravedigger.y] };
  });
  t.expectEq(JSON.stringify(rescue.a), JSON.stringify([36300, 5372]), 'a chef in the arena wall goes back by the tunnel');
  t.expect(Math.abs(rescue.b[0] - 2694) < 2 && rescue.b[1] > 1150, `a chef inside the gate goes back to its door ${JSON.stringify(rescue.b)}`);
  t.expectEq(JSON.stringify(rescue.truck), JSON.stringify(rescue.park), 'a truck left inside a building goes back to its bay');

  // ---- Take-me-home from the arena while driving: back at the pizzeria, both trucks back in their bays
  const home = await t.ev(() => {
    const M = CFG.MTRUCKS; T.tp(M.DOOR.x, M.DOOR.y + 8, 'site'); T.act(); T.step(2);
    const v = MonsterTrucksExt.st.mine; T.tp(v.x, v.y + 50, 'arena'); Game.enterCar(); T.steer(1, 0); T.step(30); T.act(); T.step(5);
    const was = { area: Game.area, driving: Game.driving };
    Game.goHome(); T.unsteer(); T.step(3);
    return { was, area: Game.area, driving: Game.driving, parked: MonsterTrucksExt.trucks.every((t) => t.area === 'site' && t.x === M.PARK[t.kind].x && t.y === M.PARK[t.kind].y && !t.ai && !t.air && !t.donut && !t.wheelie), hint: MonsterTrucksExt.hint(Game) };
  });
  t.expect(home.was.area === 'arena' && home.was.driving, 'was driving in the arena');
  t.expect(home.area === 'town' && !home.driving && home.parked && home.hint === undefined, `Take-me-home: at the pizzeria, trucks parked ${JSON.stringify(home)}`);

  // ---- a reload while in the arena (on foot): the show is on again
  await t.ev(() => { const M = CFG.MTRUCKS; T.tp(M.ARRIVE.x + 200, M.ARRIVE.y + 100, 'arena'); T.step(2); Game.save(); });
  await t.reload();
  const re = await t.ev(() => { T.step(30); return { area: Game.area, inArena: MonsterTrucksExt.trucks.every((v) => v.area === 'arena'), ai: MonsterTrucksExt.trucks.filter((v) => v.ai).length, seen: Game.s.mtrucks.seen, flips: Game.s.mtrucks.flips }; });
  t.expect(re.area === 'arena' && re.inArena && re.ai === 1 && re.seen && re.flips >= 1, `after a reload in the arena, both trucks are there and one drives ${JSON.stringify(re)}`);

  // ---- phone screenshots
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Game.goHome(); T.tp(2800, 1186, 'site'); Render.setZoom(1); Game.cameraSnap = true; T.step(2); Game.floats.length = 0; });
  await t.shot('phone-track');
  await t.ev(() => {
    const M = CFG.MTRUCKS, v = MonsterTrucksExt.truck('gravedigger'); v.x = M.DOOR.x + 20; v.y = 1262; T.tp(v.x, v.y + 30, 'site'); Game.enterCar();
    T.steer(-0.2, -1); T.until(() => Game.area === 'arena', 200); T.unsteer();
    const R = M.RAMPS[0]; MonsterTrucksExt.still(v); v.x = R.x - 240; v.y = R.y; T.steer(1, 0); T.until(() => !!v.air, 200); T.unsteer(); T.step(6); T.act(); T.step(12);
    M._G = M.G; M.G = 0; v.vz = 0; v.air.vx = 0; v.air.vy = 0; v.flip.dur = 1000; v.flip.t = 300; Game.floats.length = 0; MonsterTrucksExt.st.pops.length = 0; Game.cameraSnap = true; T.step(1);
  });
  await t.shot('phone-backflip');
  await t.ev(() => {
    const M = CFG.MTRUCKS, v = Game.vehicle, c = MonsterTrucksExt.st.cars[2]; M.G = M._G; MonsterTrucksExt.still(v); v.x = c.x - 160; v.y = c.y; T.steer(1, 0); T.until(() => c.flat, 120); T.unsteer(); T.step(4);
    v.vx = 0; v.vy = 0; c.t = 9; Game.floats.length = 0; Game.cameraSnap = true; T.step(1); MonsterTrucksExt.st.pops.length = 0; MonsterTrucksExt.pop(c.x, c.y - 170, 'CRUNCH! 🚗💥', '#ffd166', 9); MonsterTrucksExt.st.pops[0].t = 2.7;
  });
  await t.shot('phone-crush');

  // ---- each big arena hill does its own trick: backflip, front flip, a plain jump
  await t.ev(() => CFG.MTRUCKS.RAMPS.forEach((r) => { if ('_trick' in r) r.trick = r._trick; }));
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); Render.setZoom(1); });
  const flips = await t.ev(() => {
    const E = MonsterTrucksExt, M = CFG.MTRUCKS, out = [];
    M.RAMPS.forEach((rp, i) => {
      const v = E.trucks[0]; if (Game.driving) Game.exitCar(); T.step(2);
      E.still(v); v.area = 'arena'; v.x = rp.x - rp.rx - 120; v.y = rp.y; v.angle = 0; v.face = 1;
      T.tp(v.x, v.y + 50, 'arena'); Game.enterCar(); v.vx = 320; v.vy = 0;
      let dir = null, flipped = false, maxA = 0;
      for (let n = 0; n < 240; n++) { T.steer(1, 0); T.step(1); if (v.flip) { flipped = true; dir = v.flip.dir; maxA = Math.max(maxA, Math.abs(E.flipAngle(v))); } if (flipped && !v.air) break; }
      T.unsteer(); T.step(10);
      out.push({ trick: rp.trick || 'jump', flipped, dir, turned: +(maxA / Math.PI).toFixed(2) });
    });
    if (Game.driving) Game.exitCar(); T.step(2);
    return out;
  });
  t.expect(flips[0].flipped && flips[0].dir === 1 && flips[0].turned > 1.9, `the BACKFLIP hill flips the truck backwards ${JSON.stringify(flips)}`);
  t.expect(flips[1].flipped && flips[1].dir === -1 && flips[1].turned > 1.9, `the FRONT FLIP hill flips it forwards ${JSON.stringify(flips)}`);
  t.expect(!flips[2].flipped, `the plain JUMP hill just flies ${JSON.stringify(flips)}`);
};
