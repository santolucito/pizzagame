'use strict';
// Rooftops: the ice cream shop's roof fades as the chef walks in and out; the helicopter lands on the pizzeria's
// roof and on the ice cream shop's roof, the chef walks about up there inside the edge walls, hops back in and
// flies off; a landing half over the edge never ends up in the shop; a reload keeps the chef on the roof; Take-me-home
// clears it.
module.exports = async (t) => {
  await t.boot();
  // the coordinator wires js/rooftops.js into index.html; until then the case loads it itself
  const ensure = async () => { if (!(await t.ev(() => typeof RooftopsExt !== 'undefined'))) { await t.page.addScriptTag({ url: 'js/rooftops.js' }); } await t.ev(() => T.step(2)); };
  await ensure();
  const inRect = (R, x, y) => x > R.x0 && x < R.x1 && y > R.y0 && y < R.y1;

  // ---- the ice cream roof: on outside, off inside the shop and in its door, on again outside
  await t.ev(() => { T.tp(1120, 380, 'town'); T.step(40); });
  t.expectEq(await t.ev(() => RooftopsExt.st.iceA), 1, 'ice cream roof on while outside');
  await t.ev(() => { T.tp(1120, 322, 'town'); T.step(40); });
  t.expectEq(await t.ev(() => RooftopsExt.st.iceA), 0, 'ice cream roof fades off in the door');
  await t.ev(() => { T.tp(1120, 250, 'town'); T.step(5); });
  t.expectEq(await t.ev(() => RooftopsExt.st.iceA), 0, 'ice cream roof off inside the shop');
  await t.ev(() => { T.tp(1120, 380, 'town'); T.step(40); });
  t.expectEq(await t.ev(() => RooftopsExt.st.iceA), 1, 'ice cream roof back on outside');
  t.expect(await t.ev(() => { Render.draw(Game); return !!RooftopsExt.iceBg; }), 'the roof art rendered (overlay ran)');
  t.expect((await t.ev(() => T.hint())) !== "You're on the roof! 🚁 Hop back in to fly", 'no roof hint on the ground');

  // ---- fly the helicopter over the pizzeria and land on its roof
  const landOn = async (x, y) => t.ev(([x, y]) => {
    const H = AirfieldExt.rt.heli; T.tp(H.x, H.y + 50, 'town'); T.step(2); Game.enterCar(); T.step(1);
    T.steer(-1, 0); T.step(20); T.unsteer();
    const v = Game.vehicle; v.x = x; v.y = y; v.vx = 0; v.vy = 0; T.step(30);
    Game.exitCar(); T.step(3);
    const p = Game.player, rf = RooftopsExt.st.roof;
    return { driving: Game.driving, kind: Game.vehicle && Game.vehicle.kind, roof: rf && rf.key, p: [p.x, p.y], heli: [AirfieldExt.rt.heli.x, AirfieldExt.rt.heli.y], lift: AirfieldExt.rt.heli.lift, floats: Game.floats.map((f) => f.text) };
  }, [x, y]);
  const B = await t.ev(() => CFG.BUILDING), IC = await t.ev(() => CFG.ICE_CREAM.rect);
  const l1 = await landOn(483, 372);
  t.expect(!l1.driving && l1.roof === 'pizzeria', `landed on the pizzeria roof and stepped out (${JSON.stringify(l1)})`);
  t.expect(inRect(B, l1.p[0], l1.p[1]), 'the chef stands on the roof');
  t.expect(l1.floats.includes('Rooftop view! 🌆'), 'first landing: rooftop view float');
  t.expect(await t.ev(() => T.toasts.includes('🚁 You landed on the roof!')), 'first landing toast');
  const obs1 = await t.ev(() => JSON.stringify(Game.obstacles()) === JSON.stringify(RooftopsExt.walls(RooftopsExt.st.roof)) && Game.obstacles().length === 4);
  t.expect(obs1, 'on the roof the only obstacles are its four edge walls');
  t.expectEq(await t.ev(() => { T.step(30); return UpstairsExt.st.roofA; }), 1, 'the pizzeria roof stays on with the chef on it');
  // walking in every direction for two seconds never leaves the roof
  const walk1 = await t.ev(() => {
    const R = CFG.BUILDING, W = RooftopsExt.st.roof.walk, out = [];
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      T.steer(ax, ay);
      for (let i = 0; i < 120; i++) { Game.update(1 / 60); const p = Game.player; if (!(p.x > R.x0 && p.x < R.x1 && p.y > R.y0 && p.y < R.y1) || p.x < W.x0 - 1 || p.x > W.x1 + 1 || p.y < W.y0 - 1 || p.y > W.y1 + 1) out.push([ax, ay, Math.round(p.x), Math.round(p.y)]); }
      T.unsteer();
    }
    return { out, roof: RooftopsExt.st.roof && RooftopsExt.st.roof.key, cash: Game.s.cash };
  });
  t.expectEq(walk1.out.length, 0, `never off the pizzeria roof: ${JSON.stringify(walk1.out.slice(0, 3))}`);
  t.expectEq(walk1.roof, 'pizzeria', 'still on the roof after the walk');
  // the hint points to the helicopter when it is far, says hop in when near
  const far = await t.ev(() => { const h = AirfieldExt.rt.heli; T.tp(h.x - 200, h.y, 'town'); return { hint: T.hint(), target: Game.hint && Game.hint.target === AirfieldExt.rt.heli, roof: !!RooftopsExt.st.roof }; });
  t.expectEq(far.hint, "You're on the roof! 🚁 Hop back in to fly", 'roof hint');
  t.expect(far.target && far.roof, 'hint points at the helicopter from afar');
  const near = await t.ev(() => { const h = AirfieldExt.rt.heli; T.tp(h.x, h.y + 50, 'town'); return { hint: T.hint(), target: Game.hint && Game.hint.target, can: Game.canEnterCar(), roof: !!RooftopsExt.st.roof }; });
  t.expectEq(near.hint, "You're on the roof! 🚁 Hop back in to fly", 'roof hint beside the helicopter');
  t.expect(near.target === null && near.can && near.roof, 'no arrow beside the helicopter, and you can hop in');
  // a pigeon flutters off when the chef comes close
  const pigeon = await t.ev(() => { const q = RooftopsExt.st.pigeons[0]; T.tp(q.hx - 40, q.hy, 'town'); T.step(10); return { state: q.state, z: q.z, roof: !!RooftopsExt.st.roof }; });
  t.expect(pigeon.state === 'fly' && pigeon.z > 0 && pigeon.roof, `the pigeon flies off (${JSON.stringify(pigeon)})`);
  // screenshots on the pizzeria roof with the chef and the helicopter
  await t.ev(() => { const h = AirfieldExt.rt.heli; T.tp(h.x - 70, h.y + 20, 'town'); Render.setZoom(1); Game.cameraSnap = true; T.step(2); });
  await t.shot('pizzeria-roof');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Game.cameraSnap = true; T.step(2); });
  await t.shot('pizzeria-roof-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); Game.cameraSnap = true; T.step(2); });
  // hop back in and fly away: off the roof
  const off1 = await t.ev(() => { const h = AirfieldExt.rt.heli; T.tp(h.x, h.y + 50, 'town'); Game.enterCar(); T.step(1); const kind = Game.vehicle && Game.vehicle.kind; T.steer(0, 1); const n = T.until(() => !RooftopsExt.st.roof, 400); T.unsteer(); return { kind, n, parked: Game.s.rooftops.parked }; });
  t.expect(off1.kind === 'heli' && off1.n >= 0 && off1.parked === null, `flew off the pizzeria roof (${JSON.stringify(off1)})`);
  await t.ev(() => { T.tp(300, 760, 'town'); T.step(2); });

  // ---- the ice cream shop's roof
  const l2 = await landOn(1120, 215);
  t.expect(!l2.driving && l2.roof === 'icecream', `landed on the ice cream roof (${JSON.stringify(l2)})`);
  t.expect(inRect(IC, l2.p[0], l2.p[1]), 'the chef stands on the ice cream roof');
  t.expect(l2.floats.includes('Rooftop view! 🌆'), 'first landing here: rooftop view float');
  t.expect(await t.ev(() => JSON.stringify(Game.obstacles()) === JSON.stringify(RooftopsExt.walls(RooftopsExt.st.roof))), 'only the ice cream roof edges count');
  t.expectEq(await t.ev(() => { T.step(30); return RooftopsExt.st.iceA; }), 1, 'the ice cream roof stays on with the chef on it');
  const walk2 = await t.ev(() => {
    const R = CFG.ICE_CREAM.rect, out = [];
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      T.steer(ax, ay);
      for (let i = 0; i < 120; i++) { Game.update(1 / 60); const p = Game.player; if (!(p.x > R.x0 && p.x < R.x1 && p.y > R.y0 && p.y < R.y1)) out.push([ax, ay, Math.round(p.x), Math.round(p.y)]); }
      T.unsteer();
    }
    return { out, roof: RooftopsExt.st.roof && RooftopsExt.st.roof.key, a: RooftopsExt.st.iceA };
  });
  t.expectEq(walk2.out.length, 0, `never off the ice cream roof: ${JSON.stringify(walk2.out.slice(0, 3))}`);
  t.expect(walk2.roof === 'icecream' && walk2.a === 1, 'still on the ice cream roof, roof on');
  // the frosty vent puffs when you stand by it; the vane spins when touched
  const vent = await t.ev(() => { const V = CFG.ROOFTOPS.ICE.vent; T.tp(V.x, V.y + 30, 'town'); T.step(30); return { mist: RooftopsExt.st.mist.length, roof: !!RooftopsExt.st.roof }; });
  t.expect(vent.mist > 0 && vent.roof, `the vent puffs (${JSON.stringify(vent)})`);
  const vane = await t.ev(() => { const V = CFG.ROOFTOPS.ICE.vane; T.tp(V.x + 10, V.y, 'town'); T.step(3); return { v: RooftopsExt.st.vane.v, a: RooftopsExt.st.vane.a }; });
  t.expect(vane.v > 5 && vane.a > 0, `the vane spins (${JSON.stringify(vane)})`);
  await t.ev(() => { const h = AirfieldExt.rt.heli; T.tp(h.x - 50, h.y + 40, 'town'); Game.cameraSnap = true; T.step(2); });
  await t.shot('icecream-roof');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Game.cameraSnap = true; T.step(2); });
  await t.shot('icecream-roof-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); Game.cameraSnap = true; T.step(2); });

  // ---- a reload with the chef on the roof: still on it, helicopter beside them
  await t.ev(() => Game.save());
  await t.reload(); await ensure();
  const back = await t.ev(() => { T.step(3); const p = Game.player, h = AirfieldExt.rt.heli, R = CFG.ICE_CREAM.rect; return { roof: RooftopsExt.st.roof && RooftopsExt.st.roof.key, chefIn: p.x > R.x0 && p.x < R.x1 && p.y > R.y0 && p.y < R.y1, heliIn: h.x > R.x0 && h.x < R.x1 && h.y > R.y0 && h.y < R.y1, driving: Game.driving }; });
  t.expect(back.roof === 'icecream' && back.chefIn && back.heliIn && !back.driving, `reload keeps the chef on the roof with the helicopter (${JSON.stringify(back)})`);
  t.expect(await t.ev(() => JSON.stringify(Game.obstacles()) === JSON.stringify(RooftopsExt.walls(RooftopsExt.st.roof))), 'roof walls after the reload');
  // fly off again
  const off2 = await t.ev(() => { const h = AirfieldExt.rt.heli; T.tp(h.x, h.y + 50, 'town'); Game.enterCar(); T.step(1); T.steer(0, 1); const n = T.until(() => !RooftopsExt.st.roof, 400); T.unsteer(); return { n, kind: Game.vehicle && Game.vehicle.kind }; });
  t.expect(off2.kind === 'heli' && off2.n >= 0, 'flew off the ice cream roof');

  // ---- half over the edge: the chef lands fully on the roof (inside the walls), never in the shop
  const half = await t.ev(() => { const v = Game.vehicle, B = CFG.BUILDING; v.x = B.x1 - 8; v.y = 400; v.vx = 0; v.vy = 0; T.step(20); Game.exitCar(); T.step(3); const p = Game.player, rf = RooftopsExt.st.roof, W = rf && rf.walk; return { driving: Game.driving, roof: rf && rf.key, inWalk: !!W && p.x >= W.x0 && p.x <= W.x1 && p.y >= W.y0 && p.y <= W.y1, p: [Math.round(p.x), Math.round(p.y)] }; });
  t.expect(!half.driving && half.roof === 'pizzeria' && half.inWalk, `half over the edge: set down fully on the roof (${JSON.stringify(half)})`);
  // just outside the wall: refused, or set down on the ground past the wall, or on the roof; never inside the shop
  const edge = await t.ev(() => { const h = AirfieldExt.rt.heli, B = CFG.BUILDING; T.tp(h.x, h.y + 50, 'town'); Game.enterCar(); T.step(1); h.x = B.x1 + 20; h.y = 400; h.vx = 0; h.vy = 0; T.step(20); Game.exitCar(); T.step(3); const p = Game.player; return { driving: Game.driving, roof: !!RooftopsExt.st.roof, inside: Game.insideBuilding(p.x, p.y), p: [Math.round(p.x), Math.round(p.y)] }; });
  t.expect(edge.driving || edge.roof || !edge.inside, `landing just past the edge never puts the chef in the shop (${JSON.stringify(edge)})`);

  // ---- Take-me-home from a roof clears it
  const home = await t.ev(() => { if (Game.driving) { Game.vehicle.x = 483; Game.vehicle.y = 372; Game.vehicle.vx = 0; Game.vehicle.vy = 0; T.step(20); Game.exitCar(); T.step(3); } const on = !!RooftopsExt.st.roof; Game.goHome(); T.step(2); const H = CFG.AIRFIELD.HELI, h = AirfieldExt.rt.heli; return { on, roof: RooftopsExt.st.roof, parked: Game.s.rooftops.parked, area: Game.area, heliHome: Math.hypot(h.x - H.x, h.y - H.y) < 2, obs: Game.obstacles().length }; });
  t.expect(home.on && home.roof === null && home.parked === null && home.area === 'town' && home.heliHome && home.obs > 4, `go home clears the roof (${JSON.stringify(home)})`);
  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
