'use strict';
// The rest of Construction Town: the new streets east and south of the site block are walkable without traps, the
// concrete mixers at the factory can be driven (the chute swings out and telescopes, a stream pours from its tip into a
// puddle under it, the chute folds back, no double pour), the crane truck in the site block (drive, lift a steel beam
// from the pile, set it on the half-built house with a click, put one down elsewhere), the hardware store's door,
// interior, every interaction, rescue, Take-me-home and the way back out, the diner's picnic table and milkshake, the slide.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/sitetown.js into index.html, load it into the booted page
  if (await t.ev(() => typeof SiteTownExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/sitetown.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof SiteTownExt !== 'undefined' && !!CFG.AREAS.hardware && !!CFG.VEHICLES.mixer), 'the extension, its map and the mixer spec are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(SiteTownExt) < Game.ext.indexOf(CityExt)), 'Construction Town answers before the City');
  t.expect(await t.ev(() => { const W = CFG.SITETOWN.WORLD; return W.x0 === 4000 && W.y0 === 4000 && W.x1 === 4600 && W.y1 === 4400; }), 'the store interior sits in its reserved rectangle');
  t.expect(await t.ev(() => { const W = CFG.SITE.WORLD; return W.x1 === 4500 && W.y1 === 1300; }), 'the site map was widened');

  // ---- arrive at the site: the new strips are walkable without traps (stuck-detector style)
  const walk = await t.ev(() => {
    T.tp(4050, 300, 'site');
    const hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    const stuck = [], flung = []; let sampled = 0, solid = 0;
    const rects = [CFG.SITETOWN.EAST, CFG.SITETOWN.SOUTH];
    const top = Game.walkTop ? Game.walkTop() + 4 : -140;   // the railway along the top is not walkable
    for (const R of rects) for (let y = Math.max(R.y0 + 30, top); y < R.y1 - 30; y += 40) for (let x = R.x0 + 30; x < R.x1 - 30; x += 40) {
      if (hit(x, y)) { solid++; continue; }
      sampled++;
      let best = 0, worst = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        T.tp(x, y, 'site'); SiteTownExt.st.slide = null; SiteTownExt.st.seat = null;
        T.steer(ax, ay); T.step(9); T.unsteer();
        const d = Math.hypot(Game.player.x - x, Game.player.y - y); best = Math.max(best, d); worst = Math.max(worst, d);
      }
      if (best < 2) stuck.push([x, y]);
      if (worst > 70) flung.push([x, y, Math.round(worst)]);
    }
    SiteTownExt.st.slide = null;
    return { sampled, solid, stuck, flung };
  });
  t.expect(walk.sampled > 200 && walk.solid > 20, `sampled the new streets (${walk.sampled} walkable, ${walk.solid} solid)`);
  t.expectEq(walk.stuck.length, 0, `no stuck spots in the new districts: ${JSON.stringify(walk.stuck.slice(0, 8))}`);
  t.expectEq(walk.flung.length, 0, `no spots that fling the chef: ${JSON.stringify(walk.flung.slice(0, 8))}`);
  // the old site block, the station and the train are untouched by the new obstacles
  const siteBlock = await t.ev(() => { const core = new Set(Game.siteObstacles().map((o) => JSON.stringify(o))), B = CFG.SITETOWN.BEAM_PILE_BOX, own = (o) => o.x === B.x0 && o.y === B.y0; return Game.obstacles().filter((o) => o.x + o.w > 2600 && o.x < 3984 && o.y + o.h > -170 && o.y < 900 && !core.has(JSON.stringify(o)) && !own(o) && SiteTownExt.st.siteObs.includes(o)).length; });
  t.expectEq(siteBlock, 0, 'no new obstacle of ours inside the site block (besides the steel beam pile)');
  const sitePos = await t.ev(() => { const S = CFG.SITE.STATION; T.tp(S.stopX + S.boardDx, S.platform.y1 - 12, 'site'); Game.siteTrain.summon(); T.until(() => Game.siteTrain.state === 'stopped', 1500); T.step(2); return T.label(); });
  t.expectEq(sitePos, '🚂 Ride the train', 'the train still stops at the site platform');
  await t.ev(() => { Game.siteTrain.state = 'away'; Game.siteTrain.x = CFG.SITE.WORLD.x0 - 500; });
  // the hint stays quiet out on the new streets, away from the things
  t.expectEq(await t.ev(() => { T.tp(4056, 600, 'site'); return SiteTownExt.hint(Game); }), undefined, 'no hint out on Site Road');

  // ---- the concrete mixers: hop in, drive, pour, hop out
  const mix = await t.ev(() => {
    const m = SiteTownExt.mixers[0]; T.tp(m.x, m.y + 50, 'site'); T.step(2);
    const hint = SiteTownExt.hint(Game);
    Game.enterCar(); T.step(1);
    return { hint: hint && hint.text, kind: Game.vehicle && Game.vehicle.kind, driving: Game.driving, same: Game.vehicle === m, exit: CFG.VEHICLES[Game.vehicle.kind].exit, label: CFG.VEHICLES.mixer.label, n: SiteTownExt.vehicles(Game).filter((x) => x.kind === 'mixer').length, inList: Game.vehicles().includes(m) };
  });
  t.expectEq(mix.hint, 'Drive the concrete mixer! 🚛', 'mixer hint by the parked mixers');
  t.expect(mix.n === 2 && mix.inList, 'two mixers listed among the vehicles');
  t.expect(mix.driving && mix.kind === 'mixer' && mix.same, 'climbed into the first mixer');
  t.expectEq(mix.exit, '🚶 Hop out', 'hop-out label from the mixer spec');
  t.expectEq(mix.label, '🚛 Drive the mixer', 'drive label from the mixer spec');
  await t.wait(150);
  t.expectEq(await t.ev(() => document.getElementById('btn-car').textContent), '🚶 Hop out', 'the vehicle button says Hop out');
  const drove = await t.ev(() => {
    const v = Game.vehicle, x0 = v.x, y0 = v.y, d0 = v.drum;
    T.steer(-1, 0); T.step(120); T.unsteer(); T.step(10);
    return { dx: x0 - v.x, dy: Math.abs(v.y - y0), drum: v.drum - d0, x: Math.round(v.x), y: Math.round(v.y), hint: SiteTownExt.hint(Game).text, label: T.label() };
  });
  t.expect(drove.dx > 150, `drove the mixer west out of the yard (${drove.dx.toFixed(0)} px to ${drove.x},${drove.y})`);
  t.expect(drove.drum > 3, 'the drum turned while driving');
  t.expectEq(drove.label, '🪣 Pour!', 'pour button while driving the mixer');
  t.expectEq(drove.hint, 'Press the big button to pour concrete! 🪣', 'pour hint while driving the mixer');
  await t.ev(() => { T.steer(0, -1); T.step(40); T.unsteer(); T.step(10); });   // up towards the street, clear of the map's bottom edge
  // the pour: the chute swings out and extends in two segments (~0.5 s), a stream pours from its tip for ~1.5 s into a
  // puddle growing under the tip, then the chute folds back; the truck holds still meanwhile; a second press does nothing
  const pour = await t.ev(() => {
    const v = Game.vehicle, P = CFG.SITETOWN.POUR, d0 = v.drum, n0 = SiteTownExt.st.puddles.length;
    const stowed = SiteTownExt.chute(v);
    T.act();
    const x0 = v.x, y0 = v.y;
    T.steer(1, 1); T.step(14); T.unsteer();
    const early = SiteTownExt.chute(v);
    T.step(12);
    const late = SiteTownExt.chute(v);
    T.step(20);   // ~0.8 s in: pouring
    const ch = SiteTownExt.chute(v), q = SiteTownExt.st.puddles[SiteTownExt.st.puddles.length - 1];
    const behind = { x: v.x - Math.cos(v.angle) * 60, y: v.y - Math.sin(v.angle) * 60 };
    const label = T.label(); T.act();
    return {
      stowed: { segs: stowed.segs, swing: stowed.swing, flowing: stowed.flowing },
      early: { segs: early.segs, swing: early.swing, flowing: early.flowing }, late: { segs: late.segs, flowing: late.flowing },
      flowing: ch.flowing, segs: ch.segs, tip: ch.tip, tipFar: Math.hypot(ch.tip.x - v.x, ch.tip.y - v.y),
      puddles: SiteTownExt.st.puddles.length - n0, puddle: q && { x: q.x, y: q.y }, behindD: q && Math.hypot(q.x - behind.x, q.y - behind.y),
      held: Math.hypot(v.x - x0, v.y - y0), drum: v.drum - d0, floats: Game.floats.map((f) => f.text), drop: P.DROP,
      label, pours: Game.s.sitetown.pours, stillT: v.pour && v.pour.t,
    };
  });
  t.expect(pour.stowed.swing === 0 && pour.stowed.segs[1] === 0 && pour.stowed.segs[2] === 0 && !pour.stowed.flowing, 'the chute starts folded');
  t.expect(pour.early.swing > 0.8 && pour.early.segs[1] > 0 && pour.early.segs[2] === 0 && !pour.early.flowing, `0.25 s: the chute has swung out and its second segment slides open (${JSON.stringify(pour.early)})`);
  t.expect(pour.late.segs[1] === 20 && pour.late.segs[2] > 0 && !pour.late.flowing, `0.45 s: the third segment slides open (${JSON.stringify(pour.late)})`);
  t.expect(pour.flowing && pour.segs[2] === 18 && pour.tipFar > 90, `pouring from the extended chute's tip (${Math.round(pour.tipFar)} px from the truck)`);
  t.expectEq(pour.puddles, 1, 'one puddle on the ground');
  t.expect(Math.abs(pour.puddle.x - pour.tip.x) < 2 && Math.abs(pour.puddle.y - (pour.tip.y + pour.drop)) < 2, `the puddle grows right under the chute's tip (${JSON.stringify(pour.puddle)} vs ${JSON.stringify(pour.tip)})`);
  t.expect(pour.behindD > 30, 'not behind the truck centre any more');
  t.expect(pour.floats.includes('Splosh!'), 'the Splosh float');
  t.expect(pour.held < 1, `the truck holds still while it pours (${pour.held.toFixed(1)} px)`);
  t.expect(pour.drum > 6, `the drum spins fast while pouring (${pour.drum.toFixed(1)} in 0.8 s)`);
  t.expectEq(pour.label, '🪣 Pour!', 'the button stays while pouring');
  t.expect(pour.pours === 1 && pour.stillT > 0.7, 'pressing again during the pour does nothing: one pour, still the same one');
  await t.ev(() => { Render.setZoom(1.6); Game.cameraSnap = true; T.step(2); });
  await t.shot('mixer-pour');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Render.setZoom(1.6); Game.cameraSnap = true; T.step(2); });
  await t.shot('mixer-pour-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });
  const folded = await t.ev(() => {
    const v = Game.vehicle, mid = T.until(() => v.pour && v.pour.t > 2.2, 200), half = SiteTownExt.chute(v), n = T.until(() => !v.pour, 200), ch = SiteTownExt.chute(v), q = SiteTownExt.st.puddles[SiteTownExt.st.puddles.length - 1];
    const puddles = SiteTownExt.st.puddles.length, x0 = v.x, y0 = v.y; T.steer(0, -1); T.step(30); T.unsteer();
    return { mid, half: { segs: half.segs, flowing: half.flowing }, n, swing: ch.swing, segs: ch.segs, grown: q.t >= q.grow, moved: Math.hypot(v.x - x0, v.y - y0), puddles, hint: SiteTownExt.hint(Game).text, pours: Game.s.sitetown.pours };
  });
  t.expect(folded.mid >= 0 && !folded.half.flowing && folded.half.segs[2] < 18, `the stream stops and the chute starts folding (${JSON.stringify(folded.half)})`);
  t.expect(folded.n >= 0 && folded.swing === 0 && folded.segs[1] === 0 && folded.segs[2] === 0, `the chute folds back after the pour (${JSON.stringify(folded)})`);
  t.expect(folded.grown && folded.puddles === 1 && folded.pours === 1, 'the puddle stays, fully grown; still one pour');
  t.expect(folded.moved > 40, `the chef drives on after the pour (${Math.round(folded.moved)} px)`);
  t.expectEq(folded.hint, 'Press the big button to pour concrete! 🪣', 'ready to pour again');
  await t.ev(() => { Render.setZoom(1.2); Game.cameraSnap = true; T.step(2); });
  await t.shot('mixer');
  const puddleLife = await t.ev(() => { T.step(60 * 21); return SiteTownExt.st.puddles.length; });
  t.expectEq(puddleLife, 0, 'the puddle is gone after 20 s');
  const out = await t.ev(() => { const v = Game.vehicle; Game.exitCar(); T.step(5); const p = Game.player; return { driving: Game.driving, d: Math.hypot(p.x - v.x, p.y - v.y), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), vx: v.vx, vy: v.vy }; });
  t.expect(!out.driving && out.d < 60 && out.free, `hopped out beside the mixer on free ground (${JSON.stringify(out)})`);
  t.expect(await t.ev(() => { const m = SiteTownExt.mixers[1], M = CFG.SITETOWN.MIXERS[1]; return m.x === M.x && m.y === M.y; }), 'the second mixer stays parked');
  // the site vehicles can drive the dirt track loop: nothing solid on it
  const track = await t.ev(() => { const Tk = CFG.SITETOWN.TRACK, obs = Game.townObstacles(true); let bad = 0; for (let a = 0; a < Math.PI * 2; a += 0.2) { const rr = (Tk.rx + Tk.rxi) / 2, x = Tk.x + Math.cos(a) * rr, y = Tk.y + Math.sin(a) * rr * Tk.ry / Tk.rx; if (obs.some((o) => Game.hitRect(x, y, 22, o))) bad++; } return bad; });
  t.expectEq(track, 0, 'the dirt track loop is clear for vehicles');

  // ---- the crane truck in the site block: parked on free ground by the other machines, drive it, lift a steel beam,
  // set it on the half-built house (click + sparkle), put another down on open ground, hop out
  const park = await t.ev(() => {
    const v = SiteTownExt.crane, C = CFG.SITETOWN.CRANETRUCK, P = CFG.SITETOWN.BEAM_PILE_BOX, obs = Game.townObstacles(true);
    T.tp(v.x, v.y + 60, 'site');
    const inTower = (x, y) => x > 3050 && x < 3320 && y > 220 && y < 520;   // the tower crane's corner (another feature)
    return {
      spec: CFG.VEHICLES.cranetruck, listed: SiteTownExt.vehicles(Game).includes(v) && Game.vehicles().includes(v), kind: v.kind,
      at: v.x === C.x && v.y === C.y, inBlock: v.x > 2630 && v.x < 3970 && v.y > -140 && v.y < 870, free: !obs.some((o) => o.w && Game.hitRect(v.x, v.y, 24, o)),
      nearExc: Math.hypot(v.x - Game.excavator.x, v.y - Game.excavator.y), notTower: !inTower(v.x, v.y) && !inTower(P.x0, P.y0) && !inTower(P.x1, P.y1),
      pileInBlock: P.x0 > 2600 && P.x1 < 3984 && P.y1 < 900, hint: SiteTownExt.hint(Game),
    };
  });
  t.expect(park.spec && park.spec.radius === 24 && park.spec.label === '🏗️ Drive the crane', `the crane truck's spec (${JSON.stringify(park.spec)})`);
  t.expect(park.listed && park.kind === 'cranetruck', 'the crane truck is a rideable vehicle');
  t.expect(park.at && park.inBlock && park.free, 'parked on free ground inside the site block');
  t.expect(park.nearExc < 300, `next to the excavator (${Math.round(park.nearExc)} px)`);
  t.expect(park.notTower && park.pileInBlock, 'the truck and the beam pile keep clear of the tower crane corner');
  t.expect(park.hint && park.hint.text === 'Drive the crane truck! 🏗️', 'hint by the parked crane truck');
  const crIn = await t.ev(() => {
    Game.enterCar(); T.step(1); const v = Game.vehicle, x0 = v.x, y0 = v.y;
    const label0 = T.label(), hint0 = T.hint();
    T.steer(0, 1); T.step(25); T.unsteer(); T.step(10);
    const moved = Math.hypot(v.x - x0, v.y - y0);
    T.steer(0, -1); T.step(25); T.unsteer(); T.step(10);
    T.steer(-1, 0); T.step(4); T.unsteer(); T.step(10);
    return { crane: v === SiteTownExt.crane, label0, hint0, moved, label: T.label(), hint: T.hint(), btn: document.getElementById('btn-car').textContent };
  });
  t.expect(crIn.crane, 'climbed into the crane truck');
  t.expectEq(crIn.label0, '🪝 Lift a beam', 'parked with its hook by the steel beam pile: Lift a beam');
  t.expectEq(crIn.hint0, 'Press the big button to lift a beam! 🪝', 'lift hint');
  t.expect(crIn.moved > 60, `the joystick drives it (${Math.round(crIn.moved)} px)`);
  t.expectEq(crIn.label, '🪝 Lift a beam', 'back by the pile');
  const far = await t.ev(() => { const v = Game.vehicle, s = { x: v.x, y: v.y, a: v.angle }; v.x = 3700; v.y = 400; v.angle = 0; T.step(1); const r = { label: T.label(), hint: T.hint(), target: Game.hint && Game.hint.target }; v.x = s.x; v.y = s.y; v.angle = s.a; T.step(1); return r; });
  t.expect(far.label === null && far.hint === 'Drive the hook to the steel beams! 🪝' && !!far.target, `away from the beams: no button, the hint points at them (${JSON.stringify(far)})`);
  const lift = await t.ev(() => {
    const v = Game.vehicle; T.act();
    const x0 = v.x, y0 = v.y; T.steer(1, 0); T.step(12); T.unsteer();
    const a = { out: v.out, boom: v.boom, label: T.label(), hint: T.hint(), held: Math.hypot(v.x - x0, v.y - y0) };
    T.step(30); const b = { out: v.out, boom: v.boom, beam: SiteTownExt.beamNow(v) };
    T.step(50); return { a, b, carry: !!v.carry, anim: !!v.anim, out: v.out, boom: v.boom, label: T.label(), hint: T.hint(), target: Game.hint && Game.hint.target };
  });
  t.expect(lift.a.out > 0.5 && lift.a.held < 1 && lift.a.label === null && lift.a.hint === 'Up it goes! 🪝', `lifting: the outriggers drop and the truck holds still (${JSON.stringify(lift.a)})`);
  t.expect(lift.b.boom > 0.4 && lift.b.beam && lift.b.beam.h > 10, `the boom raises the beam (${JSON.stringify(lift.b)})`);
  await t.ev(() => { const v = Game.vehicle; v.carry = null; const C = CFG.SITETOWN.CRANETRUCK; v.anim = { kind: 'lift', t: 0.75, lock: { x: C.x, y: C.y, angle: C.angle }, from: { x: CFG.SITETOWN.BEAM_PILE.x, y: CFG.SITETOWN.BEAM_PILE.y - 14, a: 0 } }; Render.setZoom(1.5); Game.cameraSnap = true; T.step(2); });
  await t.shot('crane-lift');
  await t.ev(() => { T.step(60); });
  t.expect(lift.carry && !lift.anim && lift.out === 0 && lift.boom === 1, 'the beam hangs from the hook, outriggers tucked in');
  t.expectEq(lift.label, '⬇️ Put it down', 'Put it down button while carrying');
  t.expect(lift.hint === 'Bring the beam to the house! 🏠' && !!lift.target, 'the hint points at the house');
  const frame = await t.ev(() => {
    const v = Game.vehicle, B = CFG.SITE.BUILDING;
    v.x = 3120; v.y = 485; v.angle = Math.PI; T.step(1);   // drove round to the house's east wall: the hook hangs over it
    const hook = SiteTownExt.hookPos(v), label = T.label(), hint = T.hint(), spot = SiteTownExt.frameSpot(hook.x, hook.y), n0 = SiteTownExt.st.frameBeams.length;
    T.act(); T.step(30);
    const mid = { beam: SiteTownExt.beamNow(v), label: T.label(), hint: T.hint() };
    T.step(40);
    const fb = SiteTownExt.st.frameBeams[SiteTownExt.st.frameBeams.length - 1];
    const res = { label, hint, spot, mid, placed: SiteTownExt.st.frameBeams.length - n0, fb, floats: Game.floats.map((f) => f.text), sparkles: Game.fx.filter((f) => f.kind === 'sparkle').length, B };
    T.step(20); res.after = { anim: !!v.anim, carry: !!v.carry, label: T.label() };
    return res;
  });
  t.expectEq(frame.label, '⬇️ Put it down', 'Put it down over the house');
  t.expectEq(frame.hint, 'Press the big button to put the beam on the house! 🏠', 'hint over the house');
  t.expect(!!frame.spot && frame.spot.a === Math.PI / 2 && Math.abs(frame.spot.x - (frame.B.x1 - 7)) < 1, `the beam lines up with the east wall (${JSON.stringify(frame.spot)})`);
  t.expect(frame.mid.beam && frame.mid.hint === 'Down it goes! ⬇️' && frame.mid.label === null, 'lowering the beam');
  t.expect(frame.placed === 1 && frame.fb.x === frame.spot.x && frame.fb.a === frame.spot.a, 'the beam clicks onto the house frame');
  t.expect(frame.floats.includes('Click! ✨') && frame.sparkles > 0, 'Click! and a sparkle');
  t.expect(!frame.after.anim && !frame.after.carry && frame.after.label === null, 'done: nothing on the hook');
  await t.ev(() => { const v = Game.vehicle; v.carry = { t: 0 }; v.anim = null; T.step(1); T.act(); T.step(48); Render.setZoom(1.4); Game.cameraSnap = true; T.step(1); });
  await t.shot('crane-place');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Render.setZoom(1.4); Game.cameraSnap = true; T.step(2); });
  await t.shot('crane-place-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(40); });
  const ground = await t.ev(() => {
    const v = Game.vehicle, C = CFG.SITETOWN.CRANETRUCK;
    v.x = C.x; v.y = C.y; v.angle = C.angle; T.step(1); T.act(); T.step(90);
    const carry = !!v.carry;
    v.x = 3560; v.y = 560; v.angle = 0; T.step(1);   // open ground east of the excavator
    const hook = SiteTownExt.hookPos(v), n0 = SiteTownExt.st.beams.length, f0 = SiteTownExt.st.frameBeams.length, label = T.label();
    T.act(); T.step(90);
    const b = SiteTownExt.st.beams[SiteTownExt.st.beams.length - 1];
    return { carry, label, loose: SiteTownExt.st.beams.length - n0, frame: SiteTownExt.st.frameBeams.length - f0, d: Math.hypot(b.x - hook.x, b.y - hook.y), floats: Game.floats.map((f) => f.text), again: T.label() };
  });
  t.expect(ground.carry && ground.label === '⬇️ Put it down', 'lifted another beam from the pile');
  t.expect(ground.loose === 1 && ground.frame === 0 && ground.d < 2, `elsewhere the beam just lies on the ground under the hook (${JSON.stringify(ground)})`);
  t.expect(ground.floats.includes('Clunk!'), 'Clunk!');
  t.expectEq(ground.again, '🪝 Lift a beam', 'a beam lying on the ground can be lifted again');
  const crOut = await t.ev(() => { const v = Game.vehicle; Game.exitCar(); T.step(3); const p = Game.player; return { driving: Game.driving, d: Math.hypot(p.x - v.x, p.y - v.y), free: !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o)), label: T.label() }; });
  t.expect(!crOut.driving && crOut.d < 60 && crOut.free, `hopped out of the crane truck onto free ground (${JSON.stringify(crOut)})`);
  t.expect(crOut.label !== '🪝 Lift a beam', 'no crane button on foot');

  // ---- the hardware store: door spot, hint, go in
  const door = await t.ev(() => {
    const D = CFG.SITETOWN.DOOR_OUT, blocked = Game.obstacles().some((o) => Game.hitRect(D.x, D.y, 12, o));
    let moved = 0; for (const [ax, ay] of [[-1, 0], [1, 0], [0, 1]]) { T.tp(D.x, D.y, 'site'); T.steer(ax, ay); T.step(8); T.unsteer(); moved = Math.max(moved, Math.hypot(Game.player.x - D.x, Game.player.y - D.y)); }
    T.tp(D.x - 50, D.y + 10, 'site'); T.step(2); const far = SiteTownExt.hint(Game);
    T.tp(D.x, D.y, 'site'); T.step(2);
    return { blocked, moved, far: far && far.text, farTarget: far && far.target && far.target.x === D.x, label: T.label(), near: SiteTownExt.hint(Game).text, nearTarget: SiteTownExt.hint(Game).target };
  });
  t.expect(!door.blocked && door.moved > 20, 'the door spot is free and the chef can walk away from it');
  t.expect(door.far === 'Go into the hardware store! 🔧' && door.farTarget, 'the door hint points at the door spot from nearby');
  t.expectEq(door.label, '🚪 Go inside', 'door label at the door spot');
  t.expect(door.near === 'Go into the hardware store! 🔧' && door.nearTarget === null, 'door hint at the spot points nowhere');
  await t.shot('store-door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'hardware', 'inside the hardware store');
  t.expect(await t.ev(() => T.toasts.includes('🔧 Welcome to the hardware store!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.SITETOWN.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2 && SiteTownExt.free(Game.player.x, Game.player.y); }), 'arrived on the mat inside the door, on free floor');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  t.expectEq(await t.ev(() => T.hint()), 'Hammer the nail into the board! 🔨', 'the first hint inside points at the nail');
  t.expect(await t.ev(() => { const h = Game.hint, s = CFG.SITETOWN.NAIL_SPOT; return !!h.target && h.target.x === s.x && h.target.y === s.y; }), 'the hint points at the nail spot');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('store-inside');
  const spots = await t.ev(() => { const S = CFG.SITETOWN; return [S.KEY_SPOT, S.MIX_SPOT, S.NAIL_SPOT, S.PADS.toolbox, S.PADS.hardhat, S.EXIT, { x: S.EXIT.x, y: S.EXIT.y - 8 }].map((s) => SiteTownExt.free(s.x, s.y)); });
  t.expect(spots.every(Boolean), `every spot inside is free floor (${JSON.stringify(spots)})`);
  // no traps inside
  const inside = await t.ev(() => {
    const R = CFG.SITETOWN.ROOM, hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o)), stuck = []; let sampled = 0;
    for (let y = R.y0 + 14; y < R.y1 - 12; y += 24) for (let x = R.x0 + 14; x < R.x1 - 12; x += 24) {
      if (hit(x, y)) continue; sampled++; let best = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { T.tp(x, y, 'hardware'); T.steer(ax, ay); T.step(9); T.unsteer(); best = Math.max(best, Math.hypot(Game.player.x - x, Game.player.y - y)); }
      if (best < 2) stuck.push([x, y]);
    }
    return { sampled, stuck };
  });
  t.expect(inside.sampled > 60 && inside.stuck.length === 0, `no stuck spots in the store (${inside.sampled} sampled, stuck ${JSON.stringify(inside.stuck)})`);

  // ---- hammer the nail: three whacks
  await t.ev(() => { const s = CFG.SITETOWN.NAIL_SPOT; T.tp(s.x, s.y, 'hardware'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🔨 Whack the nail!', 'whack label at the bench');
  const nail = await t.ev(() => { const out = []; for (let i = 0; i < 3; i++) { T.act(); T.step(3); out.push({ depth: SiteTownExt.st.nail.depth, hint: T.hint() }); } return { out, floats: Game.floats.map((f) => f.text), nails: Game.s.sitetown.nails, label: T.label() }; });
  t.expect(nail.out[0].depth === 1 && nail.out[0].hint === 'Whack it again! 2 to go 🔨', 'first whack: two to go');
  t.expect(nail.out[2].depth === 3 && nail.floats.includes('Nailed it! 🔨'), 'third whack: Nailed it!');
  t.expectEq(nail.nails, 1, 'nail counted');
  await t.shot('store-nail');
  const reset = await t.ev(() => { T.step(60 * 2.5); return SiteTownExt.st.nail.depth; });
  t.expectEq(reset, 0, 'a fresh nail after a moment');

  // ---- cut a key: buzzes, the chef stays put, then a key
  await t.ev(() => { const s = CFG.SITETOWN.KEY_SPOT; T.tp(s.x, s.y, 'hardware'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🔑 Cut a key', 'key label at the machine');
  const key = await t.ev(() => { T.act(); T.step(5); const s = CFG.SITETOWN.KEY_SPOT; T.steer(1, 1); T.step(20); T.unsteer(); const during = { hint: T.hint(), d: Math.hypot(Game.player.x - s.x, Game.player.y - s.y), label: T.label(), sparks: SiteTownExt.st.sparks.length }; T.step(70); return { during, done: !SiteTownExt.st.key, floats: Game.floats.map((f) => f.text), keys: Game.s.sitetown.keys }; });
  t.expect(key.during.hint === 'Bzzzzt! Cutting your key 🔑' && key.during.d < 1 && key.during.label === null && key.during.sparks > 0, `buzzing with sparks while the key is cut (${JSON.stringify(key.during)})`);
  t.expect(key.done && key.floats.includes('A shiny new key! 🔑') && key.keys === 1, 'a new key');

  // ---- shake the paint
  await t.ev(() => { const s = CFG.SITETOWN.MIX_SPOT; T.tp(s.x, s.y, 'hardware'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🎨 Shake the paint', 'shaker label');
  const shake = await t.ev(() => { T.act(); T.step(5); const h = T.hint(); T.step(100); return { h, done: !SiteTownExt.st.mix, floats: Game.floats.map((f) => f.text), mixes: Game.s.sitetown.mixes, sparks: SiteTownExt.st.sparks.length }; });
  t.expect(shake.h === 'Shake shake shake! 🎨' && shake.done && shake.floats.includes('🌈 Splash!') && shake.mixes === 1 && shake.sparks > 0, `the paint shaker rattles and splashes (${JSON.stringify(shake)})`);

  // ---- the toolbox ($4) and the hard hat ($6)
  const buy = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.SITETOWN.PADS;
    T.tp(P.toolbox.x, P.toolbox.y, 'hardware'); const a = T.until(() => SiteTownExt.st.toolbox > 0, 400); const c1 = Game.s.cash;
    T.tp(P.hardhat.x, P.hardhat.y, 'hardware'); const b = T.until(() => SiteTownExt.st.hat > 0, 400);
    return { a, b, c1, cash: Game.s.cash, hint: T.hint(), toolboxes: Game.s.sitetown.toolboxes, hats: Game.s.sitetown.hats };
  });
  t.expect(buy.a >= 0 && buy.c1 === 16, 'the toolbox cost $4');
  t.expect(buy.b >= 0 && buy.cash === 10, 'the hard hat cost $6');
  t.expect(buy.toolboxes === 1 && buy.hats === 1, 'both counted');
  t.expectEq(buy.hint, 'Looking safe! ⛑️', 'hint while wearing the hat');
  await t.shot('store-hat');
  t.expect(await t.ev(() => { T.tp(4300, 4215, 'hardware'); T.step(60 * 31); return SiteTownExt.st.hat === 0 && SiteTownExt.st.toolbox === 0; }), 'the hat and toolbox are put away after 30 s');

  // ---- the shopkeeper waves when you come close
  t.expect(await t.ev(() => { const K = CFG.SITETOWN.KEEPER_HOME; T.tp(K.x, K.y + 60, 'hardware'); T.step(10); return SiteTownExt.st.keeper.wave > 0; }), 'the shopkeeper waves');

  // ---- a push into a wall is rescued onto the mat; Take-me-home from inside
  const rescued = await t.ev(() => { Game.player.x = CFG.SITETOWN.ROOM.x0 - 10; Game.player.y = 4200; T.step(3); const E = CFG.SITETOWN.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; });
  t.expect(rescued, 'pushed into the wall: rescued onto the mat');
  // phone-size store
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(4300, 4220, 'hardware'); T.step(2); });
  await t.shot('store-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(2); Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => Game.area === 'town' && !SiteTownExt.st.key && !SiteTownExt.st.mix), 'Take-me-home from the store lands in town with the store state cleared');
  // back in, then out through the door: standing on the door spot outside
  await t.ev(() => { const D = CFG.SITETOWN.DOOR_OUT; T.tp(D.x, D.y, 'site'); T.act(); T.step(30); const E = CFG.SITETOWN.EXIT; T.tp(E.x, E.y, 'hardware'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => { const D = CFG.SITETOWN.DOOR_OUT; return Game.area === 'site' && Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'back outside on the door spot');

  // ---- the diner: sit at the picnic table, buy a milkshake
  const diner = await t.ev(() => { const S = CFG.SITETOWN.SEAT; T.tp(S.x, S.y - 40, 'site'); T.step(2); const far = SiteTownExt.hint(Game); T.tp(S.x, S.y, 'site'); T.step(1); return { far: far && far.text, label: T.label() }; });
  t.expect(diner.far === 'Buy a milkshake at the diner! 🥤' || diner.far === 'Sit at the picnic table! 🪑', `a diner hint near the table (${diner.far})`);
  t.expectEq(diner.label, '🪑 Sit down', 'sit label at the bench');
  const sat = await t.ev(() => { T.act(); T.step(5); const S = CFG.SITETOWN.SEAT; T.steer(1, 1); T.step(60); T.unsteer(); return { seat: !!SiteTownExt.st.seat, d: Math.hypot(Game.player.x - S.x, Game.player.y - S.y), label: T.label(), hint: SiteTownExt.hint(Game).text, sits: Game.s.sitetown.sits }; });
  t.expect(sat.seat && sat.d < 1 && sat.sits === 1, 'seated on the bench and staying there');
  t.expectEq(sat.label, '🚶 Stand up', 'stand-up label while seated');
  t.expectEq(sat.hint, 'Enjoy the sunshine! Press the button to stand up', 'seated hint');
  await t.ev(() => { Render.setZoom(1.1); Game.cameraSnap = true; T.step(2); });
  await t.shot('diner');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !SiteTownExt.st.seat), 'stood up');
  const shakeBuy = await t.ev(() => { Game.s.cash = 10; const P = CFG.SITETOWN.PADS.shake; T.tp(P.x, P.y, 'site'); const n = T.until(() => SiteTownExt.st.shake > 0, 400); return { n, cash: Game.s.cash, shakes: Game.s.sitetown.shakes }; });
  t.expect(shakeBuy.n >= 0 && shakeBuy.cash === 7 && shakeBuy.shakes === 1, 'a $3 milkshake');

  // ---- the slide: walk onto the ladder, whoosh to the bottom
  const slide = await t.ev(() => {
    const SL = CFG.SITETOWN.SLIDE, s0 = Game.s.sitetown.slides; T.tp(SL.top.x, SL.top.y - 40, 'site'); T.step(2); const far = SiteTownExt.hint(Game);
    T.steer(0, 1); const n = T.until(() => !!SiteTownExt.st.slide, 120); T.unsteer();
    const during = SiteTownExt.hint(Game); T.step(70);
    return { far: far && far.text, n, during: during && during.text, y: Game.player.y, bottom: SL.bottom.y, done: !SiteTownExt.st.slide, floats: Game.floats.map((f) => f.text), slides: Game.s.sitetown.slides - s0 };
  });
  t.expectEq(slide.far, 'Climb the slide! 🛝', 'slide hint by the ladder');
  t.expect(slide.n >= 0 && slide.during === 'Wheee! 🛝', 'walked onto the ladder and started sliding');
  t.expect(slide.done && slide.y > slide.bottom && slide.slides === 1, `landed past the bottom of the slide (y ${Math.round(slide.y)})`);
  t.expect(slide.floats.includes('Wheee!'), 'the Wheee float');

  // ---- the dog barks when you pass its garden
  const dog = await t.ev(() => { const D = CFG.SITETOWN.DOG; T.tp(D.home.x, D.y1 + 30, 'site'); T.step(20); return Game.floats.some((f) => /Woof|Arf/.test(f.text)); });
  t.expect(dog, 'the dog barks');

  // ---- screenshots of each district, desktop and phone
  await t.ev(() => { Render.setZoom(0.45); T.tp(4250, 420, 'site'); T.step(2); });
  await t.shot('east-north');
  await t.ev(() => { T.tp(4250, 850, 'site'); T.step(2); });
  await t.shot('east-park');
  await t.ev(() => { T.tp(4300, 1150, 'site'); T.step(2); });
  await t.shot('factory');
  await t.ev(() => { T.tp(3650, 1150, 'site'); T.step(2); });
  await t.shot('south-diner');
  await t.ev(() => { T.tp(2950, 1150, 'site'); T.step(2); });
  await t.shot('south-track');
  await t.ev(() => { Render.setZoom(0.22); T.tp(3550, 600, 'site'); T.step(2); });
  await t.shot('whole-town');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Render.setZoom(1); T.tp(4300, 1180, 'site'); T.step(2); });
  await t.shot('factory-phone');
  await t.ev(() => { T.tp(4285, 430, 'site'); T.step(2); });
  await t.shot('store-door-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); Render.setZoom(1); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'home again');
};
