'use strict';
// Every building at both airports can be entered. The inventory: on the town airfield the arrivals terminal, the Pizza
// Air hangar, the control tower, the workshop, the fuel farm and the gate pier (Gate 1); at Cloud Harbor the Sky Terminal
// and the Sky Café; each has a door spot beside it that takes you inside and back out. The three new rooms in detail:
// the FUEL FARM's pump room (turn the big red valve: glug glug, the tank fills; say hi to the fuel worker; the fuel truck
// drives you out onto the apron), GATE 1 (ride the moving walkway, a juice from the machine, seats by the big window, down the jet-bridge
// into the jet) and the SKY TERMINAL (cloud check-in, a fluffy bag off the carousel, look out of the big window at the
// sky, sit on a cloud chair). For each: the door (free ground, label, hint, nothing further away), in and out, a toast
// once, a hint inside pointing into the room, every spot free floor and no stuck spots, a rescue from a wall,
// Take-me-home from inside, and screenshots at desktop and phone size.
module.exports = async (t) => {
  // until the coordinator wires js/cloud-inside.js into index.html, serve the page with it added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/cloud-inside.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/cloud-inside.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();
  const helpers = () => {
    window.AB = {
      cloud: (k) => k === 'cloudterminal',
      R: (k) => (k === 'cloudterminal' ? CFG.CLOUD_IN.ROOM : CFG.AF_IN.ROOMS[k]),
      E: (k) => (k === 'cloudterminal' ? CloudInsideExt : AirfieldInsideExt),
      door: (k) => (k === 'cloudterminal' ? CloudInsideExt.doorSpot() : AirfieldInsideExt.doorSpot(k)),
      outer: (k) => (k === 'cloudterminal' ? 'cloud' : 'town'),
      reset: (k) => (k === 'cloudterminal' ? CloudInsideExt.reset() : AirfieldInsideExt.resetRoom()),
      mat: (k) => { const R = AB.R(k); T.tp(R.EXIT.x, R.EXIT.y - 8, k); },
      dRect: (p, q) => Math.hypot(Math.max(q.x0 - p.x, 0, p.x - q.x1), Math.max(q.y0 - p.y, 0, p.y - q.y1)),
    };
  };
  await t.ev(helpers);

  // ---- registered: the new rooms in free rectangles, on the world map, ahead of the outer maps
  const reg = await t.ev(() => {
    const mine = ['affuel', 'afgate', 'cloudterminal'];
    const overlap = [];
    for (const k of mine) {
      const a = CFG.AREAS[k].WORLD;
      for (const [o, A] of Object.entries(CFG.AREAS)) { if (o === k) continue; const b = A.WORLD; if (a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0) overlap.push(k + '×' + o); }
    }
    return {
      ok: typeof CloudInsideExt !== 'undefined' && Game.ext.includes(CloudInsideExt) && Render.ext.includes(CloudInsideExt),
      order: Game.ext.indexOf(CloudInsideExt) < Game.ext.indexOf(AirfieldExt) && Game.ext.indexOf(CloudInsideExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(AirfieldInsideExt) < Game.ext.indexOf(AirfieldExt),
      rects: mine.map((k) => [k, CFG.AREAS[k].WORLD.x0, CFG.AREAS[k].WORLD.y0, CFG.AREAS[k].WORLD.x1 - CFG.AREAS[k].WORLD.x0, CFG.AREAS[k].WORLD.y1 - CFG.AREAS[k].WORLD.y0]),
      places: mine.map((k) => WorldMapExt.placeOf(k)), overlap, unmapped: WorldMapExt.unmapped(),
    };
  });
  t.expect(reg.ok, 'the cloud-inside extension is registered');
  t.expect(reg.order, 'the interiors answer before the airfield and the City');
  t.expectEq(JSON.stringify(reg.rects), JSON.stringify([['affuel', 19000, 4000, 600, 400], ['afgate', 23000, 4000, 600, 400], ['cloudterminal', 24000, 4000, 600, 400]]), 'the new rooms in their rectangles');
  t.expectEq(reg.overlap.join(','), '', 'no other map overlaps them');
  t.expectEq(JSON.stringify(reg.places), JSON.stringify(['town', 'town', 'cloud']), 'the world map knows where they belong');
  t.expectEq(reg.unmapped.join(','), '', 'every map is on the world map');

  // ---- the inventory: every building at both airports has a door beside it that takes you in and back out
  const inv = await t.ev(() => {
    const A = CFG.AIRFIELD, D = A.DOORS, C = CFG.CLOUD, Tw = A.TOWER;
    const list = [
      ['town', 'arrivals terminal', A.TERMINAL, D.terminal], ['town', 'hangar', A.HANGAR, D.hangar],
      ['town', 'control tower', { x0: Tw.x - 22, y0: Tw.y - 20, x1: Tw.x + 22, y1: Tw.y + 12 }, D.tower], ['town', 'workshop', A.SHED, D.workshop],
      ['town', 'fuel farm', A.FUEL_FARM, D.fuel], ['town', 'gate pier', A.GATE, D.gate],
      ['cloud', 'sky terminal', C.TERMINAL, C.DOORS.terminal], ['cloud', 'sky café', C.CAFE, CFG.SKYCAFE.DOOR_OUT],
    ];
    return list.map(([outer, name, rect, d]) => {
      if (!d) return { name, ok: false, why: 'no door spot' };
      const near = AB.dRect(d, rect);
      T.tp(d.x, d.y, outer); T.step(2);
      const label = T.label(); T.act(); T.step(3);
      const area = Game.area, place = WorldMapExt.placeOf(area), inArea = !!CFG.AREAS[area];
      let back = T.label(); let i = 0;
      // walk straight to whatever exit mat is close by: press the exit button there
      const W = CFG.AREAS[area].WORLD; const R = Object.values(CFG.AF_IN.ROOMS).concat([CFG.CLOUD_IN.ROOM]).find((q) => q.WORLD === W);
      const exit = R ? R.EXIT : CFG.SKYCAFE.EXIT;
      T.tp(exit.x, exit.y, area); back = T.label(); T.act(); T.step(2); i = Math.hypot(Game.player.x - d.x, Game.player.y - d.y);
      return { name, near: Math.round(near), label, area, place, inArea, back, out: Game.area, d: Math.round(i), ok: near < 40 && /Go inside/.test(label) && area !== outer && inArea && place === outer && /Go outside/.test(back) && Game.area === outer && i < 2 };
    });
  });
  console.log('   inventory: ' + inv.map((b) => `${b.name} → ${b.area}`).join(', '));
  for (const b of inv) t.expect(b.ok, `${b.name}: a door beside it goes in and back out (${JSON.stringify(b)})`);
  t.expectEq(inv.length, 8, 'eight buildings at the two airports');

  const ROOMS = ['affuel', 'afgate', 'cloudterminal'];
  const HINTS = { affuel: 'Go inside the fuel farm! ⛽', afgate: 'Go inside Gate 1! 🛫', cloudterminal: 'Go inside the Sky Terminal! ☁️' };
  const TOASTS = { affuel: '⛽ Welcome to the fuel farm!', afgate: '🛫 Welcome to Gate 1!', cloudterminal: '☁️ Welcome to the Sky Terminal!' };
  const SPOTS = { affuel: ['EXIT', 'VALVE_SPOT', 'TRUCK_SPOT', 'HI_SPOT'], afgate: ['EXIT', 'BRIDGE_SPOT', 'VEND_SPOT'], cloudterminal: ['EXIT', 'CHECKIN', 'LOOK_SPOT', 'BAG_SPOT'] };

  // ---- the door spots: free ground, the chef can walk away, the label and hint, nothing further away
  for (const k of ROOMS) {
    const spot = await t.ev((k) => {
      const D = AB.door(k), o = AB.outer(k);
      T.tp(D.x, D.y, o);
      const blocked = Game.obstacles().some((q) => Game.hitRect(D.x, D.y, 12, q));
      let moved = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1]]) { T.tp(D.x, D.y, o); T.steer(ax, ay); T.step(10); T.unsteer(); moved = Math.max(moved, Math.hypot(Game.player.x - D.x, Game.player.y - D.y)); }
      T.tp(D.x, D.y + 50, o); T.steer(0, -1); T.step(14); T.unsteer();
      return { D, blocked, moved, reached: Math.hypot(Game.player.x - D.x, Game.player.y - D.y) };
    }, k);
    t.expect(!spot.blocked, `${k}: the door spot ${JSON.stringify(spot.D)} is clear`);
    t.expect(spot.moved > 20, `${k}: the chef can walk away from the door spot`);
    t.expect(spot.reached < 14, `${k}: walking up from below gets to the door (${spot.reached.toFixed(1)} px short)`);
    const near = await t.ev((k) => { const D = AB.door(k); T.tp(D.x - 32, D.y + 32, AB.outer(k)); T.step(2); const h = Game.hint; return { text: h && h.text, at: !!(h && h.target && h.target.x === D.x && h.target.y === D.y), label: T.label() }; }, k);
    t.expectEq(near.text, HINTS[k], `${k}: the door hint nearby`);
    t.expect(near.at, `${k}: the hint arrow points at the door`);
    t.expect(near.label !== '🚪 Go inside', `${k}: no door button 45 px away`);
    const at = await t.ev((k) => { const D = AB.door(k); T.tp(D.x, D.y, AB.outer(k)); T.step(2); return { label: T.label(), hint: T.hint(), target: Game.hint && Game.hint.target }; }, k);
    t.expectEq(at.label, '🚪 Go inside', `${k}: door label`);
    t.expectEq(at.hint, HINTS[k], `${k}: door hint at the door`);
    t.expect(!at.target, `${k}: no arrow while on the door spot`);
    t.expectEq(await t.ev((k) => { const D = AB.door(k); T.tp(D.x - 60, D.y + 60, AB.outer(k)); T.step(1); return AB.E(k).hint(Game); }, k), undefined, `${k}: no door hint further away`);
  }
  await t.ev(() => { Render.setZoom(1.1); const D = AB.door('affuel'); T.tp(D.x, D.y, 'town'); T.step(2); });
  await t.shot('door-fuel');
  await t.ev(() => { const D = AB.door('afgate'); T.tp(D.x, D.y, 'town'); T.step(2); });
  await t.shot('door-gate');
  await t.ev(() => { const D = AB.door('cloudterminal'); T.tp(D.x, D.y, 'cloud'); T.step(2); Render.setZoom(1); });
  await t.shot('door-cloudterminal');

  // ---- in and out: on the mat, a toast once, a hint into the room, every spot free, nobody stuck
  for (const k of ROOMS) {
    const inside = await t.ev((k) => {
      const D = AB.door(k); T.tp(D.x, D.y, AB.outer(k)); T.act(); T.step(30);
      const R = AB.R(k), W = R.WORLD, h = Game.hint;
      return { area: Game.area, d: Math.hypot(Game.player.x - R.EXIT.x, Game.player.y - (R.EXIT.y - 8)), free: AB.E(k).free(Game, Game.player.x, Game.player.y), label: T.label(), hint: h && h.text, inRoom: !!(h && h.target && h.target.x > W.x0 && h.target.x < W.x1 && h.target.y > W.y0 && h.target.y < W.y1), toasts: T.toasts.filter((m) => m === R.toast).length, toast: R.toast };
    }, k);
    t.expectEq(inside.area, k, `${k}: inside`);
    t.expect(inside.d < 2 && inside.free, `${k}: on the mat, on free floor`);
    t.expectEq(inside.label, '🚪 Go outside', `${k}: exit label on the mat`);
    t.expect(inside.inRoom, `${k}: the hint points at something in the room (${inside.hint})`);
    t.expectEq(inside.toasts, 1, `${k}: welcome toast`);
    t.expectEq(inside.toast, TOASTS[k], `${k}: its toast`);
    const bad = await t.ev(([k, names]) => {
      const R = AB.R(k), E = AB.E(k), pts = names.map((n) => [n, R[n]]);
      if (R.SEAT_XS) for (const y of R.SEAT_YS) for (const x of R.SEAT_XS) pts.push(['seat', { x, y }]);
      if (R.CHAIRS) for (const c of R.CHAIRS) pts.push(['chair', c]);
      if (R.WALK) pts.push(['walk', { x: R.WALK.x0 + 20, y: (R.WALK.y0 + R.WALK.y1) / 2 }]);
      return pts.filter(([n, q]) => !E.free(Game, q.x, q.y) || Game.obstacles().some((o) => Game.hitRect(q.x, q.y, 11.5, o))).map(([n]) => n);
    }, [k, SPOTS[k]]);
    t.expectEq(bad.length, 0, `${k}: every spot is free floor (${JSON.stringify(bad)})`);
    const stuck = await t.ev((k) => {
      const R = AB.R(k), A = R.ROOM, out = [];
      for (let y = A.y0 + 14; y < A.y1 - 12; y += 24) for (let x = A.x0 + 14; x < A.x1 - 12; x += 24) {
        if (Game.obstacles().some((o) => Game.hitRect(x, y, 12, o))) continue;
        let best = 0;
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { T.tp(x, y, k); T.steer(ax, ay); T.step(8); T.unsteer(); best = Math.max(best, Math.hypot(Game.player.x - x, Game.player.y - y)); }
        AB.reset(k);
        if (best < 2) out.push([x, y]);
      }
      return out;
    }, k);
    t.expectEq(stuck.length, 0, `${k}: no stuck spots (${JSON.stringify(stuck.slice(0, 6))})`);
    const out = await t.ev((k) => { const R = AB.R(k); T.tp(R.EXIT.x, R.EXIT.y, k); const label = T.label(); T.act(); T.step(2); const D = AB.door(k); return { label, area: Game.area, d: Math.hypot(Game.player.x - D.x, Game.player.y - D.y), again: T.label() }; }, k);
    t.expectEq(out.label, '🚪 Go outside', `${k}: exit label`);
    t.expect(out.area === AB_outer(k) && out.d < 2, `${k}: back outside on the door spot (${JSON.stringify(out)})`);
    t.expectEq(out.again, '🚪 Go inside', `${k}: the door button is back`);
    const again = await t.ev((k) => { T.act(); T.step(5); return { area: Game.area, n: T.toasts.filter((m) => m === AB.R(k).toast).length }; }, k);
    t.expect(again.area === k && again.n === 1, `${k}: in again, the toast only once`);
  }
  function AB_outer(k) { return k === 'cloudterminal' ? 'cloud' : 'town'; }
  await t.ev(() => { for (const k of Object.keys(Game.s.afIn)) if (typeof Game.s.afIn[k] === 'number') Game.s.afIn[k] = 0; for (const k of Object.keys(Game.s.cloudIn)) if (typeof Game.s.cloudIn[k] === 'number') Game.s.cloudIn[k] = 0; AirfieldInsideExt.home(Game); CloudInsideExt.home(Game); });

  // ======== the fuel farm ========
  await t.ev(() => { AB.mat('affuel'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Turn the big red wheel! 🔴', 'fuel: the valve first');
  await t.shot('fuel');
  await t.ev(() => { const S = CFG.AF_IN.ROOMS.affuel.VALVE_SPOT; T.tp(S.x, S.y, 'affuel'); });
  t.expectEq(await t.ev(() => T.label()), '🔴 Turn the valve', 'fuel: valve label');
  const valve = await t.ev(() => { const st = AirfieldInsideExt.st, f0 = st.fuel, a0 = st.valveA; T.act(); T.step(60); return { f0, f1: st.fuel, turned: st.valveA - a0, glug: st.glug, n: Game.s.afIn.valves, hint: T.hint(), floats: Game.floats.map((f) => f.text) }; });
  t.expect(valve.n === 1 && valve.glug > 0 && valve.f1 > valve.f0 + 0.2 && valve.turned > 2 && valve.floats.includes('Glug glug! ⛽'), `fuel: glug glug, the wheel turns and the tank fills (${JSON.stringify(valve)})`);
  t.expectEq(valve.hint, 'Glug glug! The big tank is filling up ⛽', 'fuel: glug hint');
  await t.shot('fuel-glug');
  t.expectEq(await t.ev(() => { T.step(120); return T.hint(); }), 'Say hi to the fuel worker 👋', 'fuel: the worker next');
  await t.ev(() => { const S = CFG.AF_IN.ROOMS.affuel.HI_SPOT; T.tp(S.x, S.y, 'affuel'); });
  t.expectEq(await t.ev(() => T.label()), '👋 Say hi', 'fuel: say hi label');
  t.expect(await t.ev(() => { T.act(); T.step(10); return !!AirfieldInsideExt.st.worker && Game.s.afIn.fuelHellos === 1; }), 'fuel: the worker says hi');
  await t.shot('fuel-worker');
  // the fuel truck: honk honk, and it drives you out onto the apron (the airfield's own fuel truck, js/airfield.js)
  t.expectEq(await t.ev(() => { T.step(200); return T.hint(); }), 'Drive the fuel truck out to the planes! 🚚', 'fuel: the truck next');
  await t.ev(() => { const S = CFG.AF_IN.ROOMS.affuel.TRUCK_SPOT; T.tp(S.x, S.y, 'affuel'); });
  t.expectEq(await t.ev(() => T.label()), '🚚 Drive the fuel truck', 'fuel: truck label');
  const truck = await t.ev(() => { T.act(); T.step(10); const st = AirfieldInsideExt.st, T0 = CFG.AF_IN.ROOMS.affuel.TRUCK; return { truck: !!st.truck, n: Game.s.afIn.trucks, label: T.label(), hint: T.hint(), d: Math.hypot(Game.player.x - (T0.x - 56), Game.player.y - (T0.y - 2)), floats: Game.floats.map((f) => f.text) }; });
  t.expect(truck.truck && truck.n === 1 && truck.d < 1 && truck.floats.includes('Honk honk! 🚚'), `fuel: in the truck's cab, honk honk (${JSON.stringify(truck)})`);
  t.expectEq(truck.label, null, 'fuel: no button while the truck starts off');
  t.expectEq(truck.hint, 'Honk honk! Off we go! 🚚', 'fuel: truck hint');
  await t.shot('fuel-truck');
  const drove = await t.ev(() => { T.step(60); const v = Game.vehicle, H = CFG.AIRFIELD.GSE.fuel; return { area: Game.area, driving: Game.driving, kind: v && v.kind, d: v ? Math.hypot(v.x - H.x, v.y - H.y) : -1, busy: AirfieldInsideExt.busy() }; });
  t.expect(drove.area === 'town' && drove.driving && drove.kind === 'fuelbowser' && drove.d < 1 && !drove.busy, `fuel: drove out at the wheel of the fuel truck on the apron (${JSON.stringify(drove)})`);
  await t.ev(() => { Game.exitCar(); AB.mat('affuel'); T.step(2); });
  t.expectEq(await t.ev(() => { T.step(200); return T.hint(); }), 'Back outside through the door 🚪', 'fuel: all done, back outside');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const S = CFG.AF_IN.ROOMS.affuel.VALVE_SPOT; T.tp(S.x + 40, S.y + 20, 'affuel'); T.step(2); });
  await t.shot('fuel-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ======== gate 1 ========
  await t.ev(() => { AB.mat('afgate'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Ride the moving walkway! 🚶', 'gate: the walkway first');
  await t.shot('gate');
  const walk = await t.ev(() => {
    const Wk = CFG.AF_IN.ROOMS.afgate.WALK, y = (Wk.y0 + Wk.y1) / 2; T.tp(Wk.x0 + 10, y, 'afgate');
    const x0 = Game.player.x; T.step(60);
    const x1 = Game.player.x, hint = T.hint(), n = Game.s.afIn.walks, floats = Game.floats.map((f) => f.text);
    T.step(240);
    return { moved: x1 - x0, hint, n, floats, end: Game.player.x, x1w: Wk.x1, onWalk: AirfieldInsideExt.st.onWalk };
  });
  t.expect(walk.moved > 70 && walk.n === 1 && walk.floats.includes('Wheee! 🚶'), `gate: standing still on the walkway carries you along (${JSON.stringify(walk)})`);
  t.expectEq(walk.hint, 'Wheee! The floor is moving! 🚶', 'gate: walkway hint');
  t.expect(walk.end >= walk.x1w && !walk.onWalk, `gate: off the far end of the walkway (${JSON.stringify(walk)})`);
  const against = await t.ev(() => { const Wk = CFG.AF_IN.ROOMS.afgate.WALK, y = (Wk.y0 + Wk.y1) / 2; T.tp(Wk.x1 - 20, y, 'afgate'); T.steer(-1, 0); const n = T.until(() => Game.player.x < Wk.x0 - 4, 600); T.unsteer(); return { n }; });
  t.expect(against.n > 0, `gate: you can still walk back against it (${JSON.stringify(against)})`);
  await t.ev(() => { const Wk = CFG.AF_IN.ROOMS.afgate.WALK; T.tp(Wk.x0 + 80, (Wk.y0 + Wk.y1) / 2, 'afgate'); T.step(4); });
  await t.shot('gate-walkway');
  t.expectEq(await t.ev(() => { AB.mat('afgate'); T.step(2); return T.hint(); }), 'Get a juice from the machine! 🧃', 'gate: the juice next');
  await t.ev(() => { const S = CFG.AF_IN.ROOMS.afgate.VEND_SPOT; T.tp(S.x, S.y, 'afgate'); });
  t.expectEq(await t.ev(() => T.label()), '🧃 Get a juice', 'gate: juice label');
  const juice = await t.ev(() => { T.act(); T.step(10); return { juice: AirfieldInsideExt.st.juice, n: Game.s.afIn.juices, floats: Game.floats.map((f) => f.text) }; });
  t.expect(juice.juice > 25 && juice.n === 1 && juice.floats.includes('Clunk! A juice! 🧃'), `gate: a juice box in hand (${JSON.stringify(juice)})`);
  await t.ev(() => { const S = CFG.AF_IN.ROOMS.afgate.VEND_SPOT; T.tp(S.x + 40, S.y + 10, 'afgate'); T.step(2); });
  await t.shot('gate-juice');
  t.expectEq(await t.ev(() => T.hint()), 'Have a seat by the big window 💺', 'gate: the seats next');
  const seat = await t.ev(() => {
    const R = CFG.AF_IN.ROOMS.afgate, x = R.SEAT_XS[1], y = R.SEAT_YS[0]; T.tp(x, y + 4, 'afgate');
    const label = T.label(); T.act(); T.step(2);
    const sat = !!AirfieldInsideExt.st.seat, l2 = T.label(), hint = T.hint(), n = Game.s.afIn.gateSits;
    T.act(); T.step(2);
    return { label, sat, l2, hint, n, up: !AirfieldInsideExt.st.seat };
  });
  t.expect(seat.label === '💺 Sit down' && seat.sat && seat.n === 1 && seat.l2 === '🚶 Stand up' && seat.up, `gate: sit down and stand up (${JSON.stringify(seat)})`);
  t.expectEq(seat.hint, 'Ding-dong! Your plane is boarding soon 🔔', 'gate: seated hint');
  // the jet is at its gate: down the jet-bridge into it
  const board = await t.ev(() => {
    const R = CFG.AF_IN.ROOMS.afgate; T.tp(R.EXIT.x, R.EXIT.y - 8, 'afgate'); T.step(2);
    const hint = T.hint(), target = Game.hint && Game.hint.target;
    T.tp(R.BRIDGE_SPOT.x, R.BRIDGE_SPOT.y, 'afgate');
    const can = AirfieldInsideExt.canBoard(Game), label = T.label(); T.act(); T.step(5);
    return { hint, at: !!(target && target.x === R.BRIDGE_SPOT.x), can, label, area: Game.area, n: Game.s.afIn.boards, busy: AirfieldInsideExt.busy() };
  });
  t.expectEq(board.hint, 'Walk down the jet-bridge to the big jet! ✈️', 'gate: the jet-bridge hint');
  t.expect(board.at && board.can, 'gate: the hint points at the jet-bridge door');
  t.expectEq(board.label, '✈️ Board the jet', 'gate: board label');
  t.expect(board.area === 'jetcabin' && board.n === 1 && !board.busy, `gate: inside the jet (${JSON.stringify(board)})`);
  // the jet off flying: no way down the bridge, the window shows an empty stand
  const away = await t.ev(() => {
    const v = AirfieldExt.rt.jet; v.away = true;
    const R = CFG.AF_IN.ROOMS.afgate; T.tp(R.BRIDGE_SPOT.x, R.BRIDGE_SPOT.y, 'afgate'); T.step(2);
    const r = { label: T.label(), can: AirfieldInsideExt.canBoard(Game), here: AirfieldInsideExt.jetAtGate(), hint: T.hint() };
    return r;
  });
  t.expect(away.label !== '✈️ Board the jet' && !away.can && !away.here, `gate: no boarding while the jet is away (${JSON.stringify(away)})`);
  await t.ev(() => { const R = CFG.AF_IN.ROOMS.afgate; T.tp(R.BRIDGE_SPOT.x - 60, R.BRIDGE_SPOT.y + 40, 'afgate'); T.step(2); });
  await t.shot('gate-jet-away');
  await t.ev(() => { AirfieldExt.rt.jet.away = false; T.step(2); });
  await t.ev(() => { const R = CFG.AF_IN.ROOMS.afgate; T.tp(R.BRIDGE_SPOT.x - 60, R.BRIDGE_SPOT.y + 40, 'afgate'); T.step(2); });
  await t.shot('gate-jet');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const R = CFG.AF_IN.ROOMS.afgate; T.tp(R.WALK.x0 + 60, R.WALK.y1 + 30, 'afgate'); T.step(2); });
  await t.shot('gate-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ======== the sky terminal ========
  await t.ev(() => { AB.mat('cloudterminal'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Check in at the cloud desk! 🎫', 'sky terminal: check-in first');
  await t.shot('cloudterminal');
  await t.ev(() => { const S = CFG.CLOUD_IN.ROOM.CHECKIN; T.tp(S.x, S.y, 'cloudterminal'); });
  t.expectEq(await t.ev(() => T.label()), '🎫 Check in', 'sky terminal: check-in label');
  t.expect(await t.ev(() => { T.act(); T.step(2); return Game.s.cloudIn.checkins === 1 && CloudInsideExt.st.agent > 0 && Game.floats.some((f) => f.text === '🎫 Boarding pass!'); }), 'sky terminal: checked in');
  await t.shot('cloudterminal-checkin');
  t.expectEq(await t.ev(() => T.hint()), 'Grab a fluffy bag from the belt! 🧳', 'sky terminal: the bag next');
  await t.ev(() => { const S = CFG.CLOUD_IN.ROOM.BAG_SPOT; T.tp(S.x, S.y, 'cloudterminal'); });
  t.expectEq(await t.ev(() => T.label()), '🧳 Grab a fluffy bag', 'sky terminal: bag label');
  const bag = await t.ev(() => { T.act(); T.step(2); return { bag: CloudInsideExt.st.bag, n: Game.s.cloudIn.bags, label: T.label(), floats: Game.floats.map((f) => f.text) }; });
  t.expect(bag.bag > 29 && bag.n === 1 && bag.floats.includes('So fluffy! 🧳') && bag.label !== '🧳 Grab a fluffy bag', `sky terminal: carrying a fluffy bag (${JSON.stringify(bag)})`);
  await t.ev(() => { const S = CFG.CLOUD_IN.ROOM.BAG_SPOT; T.tp(S.x - 70, S.y + 10, 'cloudterminal'); T.step(2); });
  await t.shot('cloudterminal-bag');
  t.expectEq(await t.ev(() => T.hint()), 'Look out of the big window! 👀', 'sky terminal: the window next');
  await t.ev(() => { const S = CFG.CLOUD_IN.ROOM.LOOK_SPOT; T.tp(S.x, S.y, 'cloudterminal'); });
  t.expectEq(await t.ev(() => T.label()), '👀 Look out', 'sky terminal: look label');
  const look = await t.ev(() => { T.act(); T.step(60); return { view: !!CloudInsideExt.st.view, n: Game.s.cloudIn.looks, label: T.label(), hint: T.hint() }; });
  t.expect(look.view && look.n === 1 && look.label === '🚶 Done looking', `sky terminal: looking at the sky (${JSON.stringify(look)})`);
  t.expectEq(look.hint, 'Look at the sky! 🌈', 'sky terminal: look hint');
  await t.shot('cloudterminal-view');
  t.expect(await t.ev(() => { T.step(Math.ceil(CFG.CLOUD_IN.VIEW * 60)); return !CloudInsideExt.st.view; }), 'sky terminal: the view ends by itself');
  t.expect(await t.ev(() => { T.act(); T.step(5); T.act(); T.step(1); return !CloudInsideExt.st.view; }), 'sky terminal: the button ends the view');
  t.expectEq(await t.ev(() => { T.step(2); return T.hint(); }), 'Sit on a cloud chair ☁️', 'sky terminal: the chairs next');
  const chair = await t.ev(() => {
    const c = CFG.CLOUD_IN.ROOM.CHAIRS[1]; T.tp(c.x, c.y + 4, 'cloudterminal');
    const label = T.label(); T.act(); T.step(20);
    const r = { label, sat: !!CloudInsideExt.st.seat, n: Game.s.cloudIn.sits, l2: T.label(), hint: T.hint(), floats: Game.floats.map((f) => f.text) };
    T.steer(1, 0); T.step(40); T.unsteer(); r.up = !CloudInsideExt.st.seat;
    return r;
  });
  t.expect(chair.label === '☁️ Sit on a cloud' && chair.sat && chair.n === 1 && chair.l2 === '🚶 Stand up' && chair.floats.includes('So soft! ☁️'), `sky terminal: sitting on a cloud (${JSON.stringify(chair)})`);
  t.expectEq(chair.hint, 'So soft! Like sitting on a cloud ☁️', 'sky terminal: chair hint');
  t.expect(chair.up, 'sky terminal: pushing the stick gets you up');
  await t.ev(() => { const c = CFG.CLOUD_IN.ROOM.CHAIRS[1]; T.tp(c.x, c.y + 4, 'cloudterminal'); T.act(); T.step(4); });
  await t.shot('cloudterminal-chair');
  await t.ev(() => { T.act(); T.step(200); });
  t.expectEq(await t.ev(() => T.hint()), 'Back outside through the door 🚪', 'sky terminal: all done, back outside');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const S = CFG.CLOUD_IN.ROOM.BAG_SPOT; T.tp(S.x - 80, S.y, 'cloudterminal'); T.step(2); });
  await t.shot('cloudterminal-phone');
  await t.ev(() => { const S = CFG.CLOUD_IN.ROOM.LOOK_SPOT; T.tp(S.x, S.y, 'cloudterminal'); T.act(); T.step(40); });
  await t.shot('cloudterminal-view-phone');
  await t.ev(() => { T.act(); T.step(2); });
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- a push into a wall lands back on the mat
  for (const k of ROOMS) {
    const res = await t.ev((k) => { const R = AB.R(k), A = R.ROOM; T.tp(A.x0 - 8, (A.y0 + A.y1) / 2, k); T.step(3); return { d: Math.hypot(Game.player.x - R.EXIT.x, Game.player.y - (R.EXIT.y - 8)), oops: Game.floats.some((f) => f.text === 'Oops! Back inside') }; }, k);
    t.expect(res.d < 1 && res.oops, `${k}: pushed into the wall: back on the mat (${JSON.stringify(res)})`);
  }
  // a saved spot inside the furniture after a reload: back on the mat
  await t.ev(() => { const C = CFG.CLOUD_IN.ROOM.CAROUSEL; Game.area = 'cloudterminal'; Game.player.x = C.x; Game.player.y = C.y; Game.save(); });
  await t.reload(); await t.ev(helpers);
  const reloaded = await t.ev(() => { T.step(3); const R = CFG.CLOUD_IN.ROOM; return { area: Game.area, d: Math.hypot(Game.player.x - R.EXIT.x, Game.player.y - (R.EXIT.y - 8)), seen: Game.s.cloudIn.seen }; });
  t.expect(reloaded.area === 'cloudterminal' && reloaded.d < 1 && reloaded.seen, `after a reload inside the carousel: on the mat (${JSON.stringify(reloaded)})`);

  // ---- Take-me-home from inside: in the fuel truck, sitting at the gate, looking out at the sky
  for (const [k, setup] of [['affuel', 'truck'], ['afgate', 'seat'], ['cloudterminal', 'look']]) {
    const home = await t.ev(([k, setup]) => {
      const R = AB.R(k), E = AB.E(k);
      if (setup === 'truck') { T.tp(R.TRUCK_SPOT.x, R.TRUCK_SPOT.y, k); T.act(); E.st.juice = 20; }
      if (setup === 'seat') { T.tp(R.SEAT_XS[2], R.SEAT_YS[1], k); T.act(); }
      if (setup === 'look') { T.tp(R.LOOK_SPOT.x, R.LOOK_SPOT.y, k); T.act(); E.st.bag = 20; }
      const busy = k === 'cloudterminal' ? !!(E.st.view) : E.busy();
      Game.goHome(); T.step(3);
      const S = CFG.PLAYER_START, a = AirfieldInsideExt.st, c = CloudInsideExt.st;
      return { busy, area: Game.area, d: Math.hypot(Game.player.x - S.x, Game.player.y - S.y), clear: !a.truck && !a.seat && a.juice === 0 && !a.onWalk && !c.view && !c.seat && c.bag === 0, hints: [AirfieldInsideExt.hint(Game), CloudInsideExt.hint(Game)] };
    }, [k, setup]);
    t.expect(home.busy, `${k}: ${setup} before Take-me-home`);
    t.expect(home.area === 'town' && home.d < 2, `${k}: Take-me-home goes back to the pizzeria`);
    t.expect(home.clear, `${k}: Take-me-home clears the ${setup}`);
    t.expect(home.hints[0] === undefined && home.hints[1] === undefined, `${k}: no interior hints in the pizzeria`);
  }
  await t.ev(() => { T.tp(540, 430, 'town'); T.step(1); });
};
