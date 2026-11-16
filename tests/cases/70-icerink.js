'use strict';
// The ice rink on Snowy Peak (js/icerink.js): placed on free snow in the south-east (no pines, huts, runs, lifts, the
// cabin door, the dog's patch or the plow's spot inside it; reachable on foot from the valley lift; no fresh powder on
// it; the plow cannot drive in); skates on at the stand (label, hint within 70 px), stepping in through the gate, gliding
// with momentum, a soft bounce off the boards, spin and jump, scratch marks; skates off at the gate and with the vehicle
// button; the gate shut without skates; the Zamboni (get in at its garage, it keeps to the ice, smooths the scratches to
// 100% with "Shiny! ✨", hop out at the garage); the skaters loop, leave the ice while it is out and come back; the
// auto-Zamboni; rescues, Take-me-home and the saved counters. Screenshots desktop + phone, by day and at dusk.
module.exports = async (t) => {
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();

  // in-page helpers: drive/steer to a point, and a look at the rink
  await t.ev(() => {
    T.goTo = (x, y, tol = 18, max = 400) => {
      for (let i = 0; i < max; i++) {
        const p = Game.player, dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
        if (d < tol) { T.unsteer(); return i; }
        T.steer(dx / d, dy / d); T.step(1);
      }
      T.unsteer(); return -1;
    };
    T.rink = () => { const st = IceRinkExt.st, z = st.zam, sk = st.skate; return { pct: IceRinkExt.cleanPct(), dirty: st.dirty, mode: z.mode, zx: z.x, zy: z.y, driving: Game.driving, kind: Game.vehicle && Game.vehicle.kind, sk: sk && { phase: sk.phase, x: sk.x, y: sk.y, sp: Math.hypot(sk.sx, sk.sy), z: sk.z, spin: sk.spin }, states: st.skaters.map((k) => k.state), p: { x: Game.player.x, y: Game.player.y } }; };
    T.floatTexts = () => Game.floats.map((f) => f.text);
    AtmosphereExt.force({ phase: 'day', weather: 'none' });
  });

  // ---- registered: ahead of Snowy Peak, the plow and the City; two vehicle kinds; the save slot
  const reg = await t.ev(() => ({
    ok: typeof IceRinkExt !== 'undefined' && Game.ext.includes(IceRinkExt) && Render.ext.includes(IceRinkExt),
    order: Game.ext.indexOf(IceRinkExt) < Game.ext.indexOf(SnowExt) && Game.ext.indexOf(IceRinkExt) < Game.ext.indexOf(SnowPlowExt) && Game.ext.indexOf(IceRinkExt) < Game.ext.indexOf(CityExt),
    skates: CFG.VEHICLES.skates, zam: CFG.VEHICLES.zamboni, save: Game.s.icerink,
    script: [...document.scripts].some((s) => /js\/icerink\.js/.test(s.src)),
  }));
  t.expect(reg.ok && reg.script, 'the ice rink extension is loaded and registered');
  t.expect(reg.order, 'it answers before Snowy Peak, the snow plow and the City');
  t.expect(reg.skates && reg.skates.exit === '🚶 Take off skates' && reg.zam && reg.zam.label === '🧊 Drive the Zamboni' && reg.zam.exit === '🚶 Hop out', 'skates and the Zamboni are vehicle kinds');
  t.expect(reg.save && reg.save.spins === 0 && reg.save.shiny === 0, `the save slot starts empty ${JSON.stringify(reg.save)}`);

  // ---- placement: free snow in the south-east, nothing important under it
  const place = await t.ev(() => {
    T.tp(CFG.SNOW.VALLEY.OFF.x, CFG.SNOW.VALLEY.OFF.y, 'snow');
    const K = CFG.ICERINK, S = CFG.SNOW, C = K.CUT, I = K.ICE;
    const inC = (x, y, pad = 0) => x > C.x0 - pad && x < C.x1 + pad && y > C.y0 - pad && y < C.y1 + pad;
    const boxHit = (b) => b.x < C.x1 && b.x + b.w > C.x0 && b.y < C.y1 && b.y + b.h > C.y0;
    const rect = (R) => ({ x: R.x0, y: R.y0, w: R.x1 - R.x0, h: R.y1 - R.y0 });
    const bad = [];
    S.TREES.forEach(([x, y]) => { if (inC(x, y, 12)) bad.push('tree ' + x + ',' + y); });
    for (const [n, R] of [['cabin', S.CABIN], ['meadow', S.MEADOW], ['slope', S.SLOPE], ['valley hut', S.VALLEY.HUT], ['valley deck', S.VALLEY.DECK], ['bottom station', S.BOTTOM], ['ski hut', S.SKI_HUT]]) if (boxHit(rect(R))) bad.push(n);
    for (const [n, P] of [['cabin door', S.CABIN_DOOR], ['valley board', S.VALLEY.BOARD], ['valley off', S.VALLEY.OFF], ['bottom spot', S.BOTTOM_SPOT], ['down arrive', S.DOWN_ARRIVE], ['plow spot', CFG.SNOWPLOW.SPOT], ['dog home', S.DOG.home]]) if (inC(P.x, P.y, 30)) bad.push(n);
    if (S.DOG.y1 > C.y0) bad.push('dog patch');
    if (S.FINISH_Y + 200 > C.y0 && S.FINISH.x1 > C.x0) bad.push('ski runout');
    // none of Snowy Peak's own obstacles (pines, huts, towers) inside the rink's area
    const snowObs = SnowExt.st.obs.filter(boxHit).length;
    // the rink's spots are free to stand on
    const free = (P) => !Game.obstacles().some((o) => Game.hitRect(P.x, P.y, 12, o));
    const spots = { skate: free(K.SKATE_SPOT), gate: free(K.GATE_OUT), zam: free(K.ZAM_SPOT) };
    // reachable on foot from the valley lift: a flood fill on a 12 px grid over the south of the map
    const W = S.WORLD, step = 12, x0 = 5040, y0 = 6200, cols = Math.floor((W.x1 - 40 - x0) / step), rows = Math.floor((W.y1 - 20 - y0) / step);
    const obs = Game.obstacles(), ok = new Uint8Array(cols * rows), seen = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = x0 + c * step, y = y0 + r * step; ok[r * cols + c] = obs.some((o) => Game.hitRect(x, y, 12, o)) ? 0 : 1; }
    const idx = (P) => Math.round((P.y - y0) / step) * cols + Math.round((P.x - x0) / step);
    const q = [idx(S.VALLEY.OFF)]; seen[q[0]] = 1;
    while (q.length) { const i = q.pop(), c = i % cols, r = (i - c) / cols; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr; if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue; const j = nr * cols + nc; if (!seen[j] && ok[j]) { seen[j] = 1; q.push(j); } } }
    const reach = { skate: !!seen[idx(K.SKATE_SPOT)], zam: !!seen[idx(K.ZAM_SPOT)], cabin: !!seen[idx(S.CABIN_DOOR)], plow: !!seen[idx({ x: CFG.SNOWPLOW.SPOT.x + 50, y: CFG.SNOWPLOW.SPOT.y + 40 })], east: !!seen[idx({ x: 7300, y: 6740 })] };
    // no fresh powder on the ice (the plow's layer leaves the rink out), powder still on the flat snow nearby
    const powder = { ice: SnowPlowExt.depthAt('snow', (I.x0 + I.x1) / 2, (I.y0 + I.y1) / 2) + SnowPlowExt.depthAt('snow', I.x0 + 30, I.y1 - 30) + SnowPlowExt.depthAt('snow', K.SKATE_SPOT.x, K.SKATE_SPOT.y), near: SnowPlowExt.depthAt('snow', 6400, 6720) };
    return { bad, snowObs, spots, reach, powder, cells: IceRinkExt.st.total };
  });
  t.expect(!place.bad.length, `nothing important inside the rink's area ${JSON.stringify(place.bad)}`);
  t.expectEq(place.snowObs, 0, "none of Snowy Peak's pines or huts inside the rink's area");
  t.expect(place.spots.skate && place.spots.gate && place.spots.zam, `the rink's spots are free ${JSON.stringify(place.spots)}`);
  t.expect(Object.values(place.reach).every(Boolean), `the stand, the Zamboni mat, the cabin door and the plow are all reachable from the valley lift ${JSON.stringify(place.reach)}`);
  t.expect(place.powder.ice === 0 && place.powder.near > 0.5, `no fresh powder on the rink, powder beside it ${JSON.stringify(place.powder)}`);
  t.expect(place.cells > 500, `the clean grid covers the ice (${place.cells} cells)`);

  // ---- the plow cannot drive onto the ice through the gate
  const plow = await t.ev(() => {
    const K = CFG.ICERINK, v = SnowPlowExt.v; T.tp(v.x + 40, v.y + 40, 'snow'); Game.enterCar(); const kind = Game.vehicle && Game.vehicle.kind;
    v.x = K.GATE_OUT.x - 90; v.y = K.GATE.y; v.angle = 0; T.steer(1, 0); T.step(120); T.unsteer();
    const r = { kind, x: v.x, sdf: IceRinkExt.sdf(v.x, v.y) };
    Game.exitCar(); SnowPlowExt.home(Game); return r;
  });
  t.expect(plow.kind === 'snowplow' && plow.sdf > 20, `the plow stops at the gate ${JSON.stringify(plow)}`);

  // ---- by the stand: the label and the hint (within 70 px only), the gate is shut without skates
  const stand = await t.ev(() => {
    const K = CFG.ICERINK, S = K.SKATE_SPOT; T.tp(S.x + 50, S.y + 30, 'snow'); T.step(2);
    const far = Game.hint && { text: Game.hint.text, target: !!Game.hint.target };
    T.tp(S.x - 75, S.y + 10, 'snow'); const out = IceRinkExt.hint(Game);
    T.tp(S.x, S.y, 'snow'); T.step(2);
    const at = { label: T.label(), hint: T.hint() };
    T.tp(K.GATE_OUT.x, K.GATE_OUT.y, 'snow'); const gateHint = T.hint(); T.steer(1, 0); T.step(60); T.unsteer();
    const p = Game.player;
    return { far, out, at, gateHint, gateX: p.x, onIce: IceRinkExt.onIce(p.x, p.y, -8) };
  });
  t.expect(stand.far && stand.far.text === 'Put on skates and glide on the ice! ⛸️' && stand.far.target, `hint near the stand points at it ${JSON.stringify(stand.far)}`);
  t.expectEq(stand.out, undefined, 'no rink hint further than 70 px from the stand');
  t.expectEq(stand.at.label, '⛸️ Put on skates', 'the skates button at the stand');
  t.expectEq(stand.gateHint, 'Put on skates first! ⛸️', 'at the gate without skates: the hint sends you to the stand');
  t.expect(!stand.onIce, `the gate stays shut without skates (x ${Math.round(stand.gateX)})`);

  // ---- skates on: step through the gate onto the ice
  const on = await t.ev(() => {
    const K = CFG.ICERINK; T.tp(K.SKATE_SPOT.x, K.SKATE_SPOT.y, 'snow'); T.act();
    const r0 = T.rink(), hint0 = T.hint();
    const n = T.until(() => IceRinkExt.st.skate && IceRinkExt.st.skate.phase === 'on', 300);
    IceRinkExt.polishAll(null);   // a clean rink, so the chef's own scratches show
    return { r0, hint0, n, r: T.rink(), btn: (UI.update(0), UI.els.btnCar.textContent), label: T.label(), s: Game.s.icerink.skates };
  });
  t.expect(on.r0.driving && on.r0.kind === 'skates' && on.r0.sk.phase === 'in', `skates on: walking to the gate ${JSON.stringify(on.r0)}`);
  t.expectEq(on.hint0, 'Here we go! ⛸️', 'hint while stepping in');
  t.expect(on.n > 0 && on.r.sk && on.r.sk.phase === 'on' && on.r.sk.x > 6720, `on the ice after stepping through the gate ${JSON.stringify(on.r)}`);
  t.expectEq(on.btn, '🚶 Take off skates', 'the vehicle button takes the skates off');
  t.expectEq(on.s, 1, 'skates counted');

  // ---- gliding: momentum, slow to stop, gentle top speed, bouncing off the boards, scratches
  const glide = await t.ev(() => {
    const st = IceRinkExt.st, sk = st.skate, K = CFG.ICERINK; sk.x = 6960; sk.y = 6470; sk.sx = 0; sk.sy = 0;
    T.steer(1, 0.3); let top = 0; for (let i = 0; i < 70; i++) { T.step(1); top = Math.max(top, Math.hypot(sk.sx, sk.sy)); } T.unsteer();
    const x0 = sk.x, sp0 = Math.hypot(sk.sx, sk.sy);
    T.step(30); const sp1 = Math.hypot(sk.sx, sk.sy), x1 = sk.x;
    T.step(240); const sp2 = Math.hypot(sk.sx, sk.sy);
    // curving: pushing up while gliding right bends the path
    sk.x = 6800; sk.y = 6560; sk.sx = 140; sk.sy = 0; T.steer(0, -1); T.step(20); T.unsteer(); const bend = { sx: sk.sx, sy: sk.sy };
    // the boards: push into them for 4 s, stay on the ice, then glide away
    T.steer(-1, 0); T.step(240); T.unsteer(); const atBoards = { x: sk.x, sdf: IceRinkExt.sdf(sk.x, sk.y) };
    T.steer(1, 0); T.step(40); T.unsteer(); const away = sk.x - atBoards.x;
    return { top, sp0, sp1, sp2, glideOn: x1 - x0, bend, atBoards, away, pct: IceRinkExt.cleanPct(), dirty: st.dirty, max: K.SKATE.max };
  });
  t.expect(glide.top > 100 && glide.top <= glide.max + 0.01, `speeds up gently to the top speed (${glide.top.toFixed(0)} <= ${glide.max})`);
  t.expect(glide.sp1 > 40 && glide.glideOn > 25, `keeps gliding after letting go (${glide.sp1.toFixed(0)} px/s, ${glide.glideOn.toFixed(0)} px further)`);
  t.expect(glide.sp2 < 8, `slowly glides to a stop (${glide.sp2.toFixed(1)})`);
  t.expect(glide.bend.sx > 60 && glide.bend.sy < -60, `steering bends the glide into a curve ${JSON.stringify(glide.bend)}`);
  t.expect(glide.atBoards.sdf < -10 && glide.away > 30, `the boards bounce you back, never stuck ${JSON.stringify(glide)}`);
  t.expect(glide.pct < 100 && glide.dirty > 5, `the skates scratch the ice (${glide.pct}% clean)`);

  // ---- spin (slow) and jump (fast)
  const spin = await t.ev(() => {
    const sk = IceRinkExt.st.skate; sk.x = 6960; sk.y = 6520; sk.sx = 0; sk.sy = 0; T.step(1);
    const label = T.label(); T.act(); T.step(20);
    return { label, spin: sk.spin, spins: Game.s.icerink.spins, floats: T.floatTexts() };
  });
  t.expect(spin.label === '🌀 Spin' && spin.spin > 0 && spin.spins === 1 && spin.floats.includes('Wheee! 🌀'), `the spin twirls ${JSON.stringify(spin)}`);
  await t.ev(() => { Render.setZoom(1.6); Game.cameraSnap = true; Game.floats.length = 0; IceRinkExt.st.skate.spin = 1.0; IceRinkExt.st.skate.spinA = 1.1; });
  await t.shot('spin');
  const jump = await t.ev(() => {
    const sk = IceRinkExt.st.skate; T.until(() => sk.spin === 0, 200); sk.x = 6820; sk.y = 6500; sk.sx = 0; sk.sy = 0;
    T.steer(1, 0); T.step(40); const label = T.label(); T.act(); let zmax = 0; for (let i = 0; i < 50; i++) { T.step(1); zmax = Math.max(zmax, sk.z); } T.unsteer();
    return { label, zmax, z: sk.z, jumps: Game.s.icerink.jumps };
  });
  t.expect(jump.label === '⭐ Jump' && jump.zmax > 20 && jump.z === 0 && jump.jumps === 1, `gliding fast the button jumps and lands ${JSON.stringify(jump)}`);

  // ---- skates off at the gate, and with the vehicle button from the middle of the ice
  const off = await t.ev(() => {
    const K = CFG.ICERINK, sk = IceRinkExt.st.skate; T.step(120); sk.x = K.GATE_IN.x + 20; sk.y = K.GATE_IN.y; sk.sx = 0; sk.sy = 0; T.step(1);
    const label = T.label(); T.act(); const n = T.until(() => !Game.driving, 300); const p = Game.player;
    return { label, n, driving: Game.driving, skate: !!IceRinkExt.st.skate, x: p.x, y: p.y, sdf: IceRinkExt.sdf(p.x, p.y), solid: Game.obstacles().filter((o) => Game.hitRect(p.x, p.y, 12, o)).length };
  });
  t.expect(off.label === '🚶 Take off skates' && off.n >= 0 && !off.driving && !off.skate, `skates off at the gate ${JSON.stringify(off)}`);
  t.expect(off.sdf > 20 && off.solid === 0, `stepped out of the gate onto free snow ${JSON.stringify(off)}`);
  const off2 = await t.ev(() => {
    const K = CFG.ICERINK; T.tp(K.SKATE_SPOT.x, K.SKATE_SPOT.y, 'snow'); T.act(); T.until(() => IceRinkExt.st.skate.phase === 'on', 300);
    const sk = IceRinkExt.st.skate; sk.x = 7100; sk.y = 6560; T.step(1);
    UI.toggleCar(); T.step(1); const mid = T.rink();
    const n = T.until(() => !Game.driving, 600); const p = Game.player;
    return { mid, n, driving: Game.driving, sdf: IceRinkExt.sdf(p.x, p.y), solid: Game.obstacles().filter((o) => Game.hitRect(p.x, p.y, 12, o)).length };
  });
  t.expect(off2.mid.driving && off2.mid.sk && off2.mid.sk.phase === 'out', `the vehicle button glides the chef back to the gate ${JSON.stringify(off2.mid)}`);
  t.expect(off2.n > 0 && !off2.driving && off2.sdf > 20 && off2.solid === 0, `...and out onto free snow ${JSON.stringify(off2)}`);

  // ---- the skaters loop round the ice
  const loop = await t.ev(() => { const st = IceRinkExt.st, a = st.skaters.map((k) => [k.x, k.y]); T.step(300); return { moved: st.skaters.map((k, i) => Math.hypot(k.x - a[i][0], k.y - a[i][1])), states: st.skaters.map((k) => k.state), on: st.skaters.every((k) => IceRinkExt.onIce(k.x, k.y, 10)) }; });
  t.expect(loop.moved.every((d) => d > 20) && loop.on, `the skaters glide round the ice ${JSON.stringify(loop)}`);

  // ---- day screenshot with a scratched rink
  await t.ev(() => { IceRinkExt.preScratch(5); T.tp(6950, 6290, 'snow'); Render.setZoom(1); Game.cameraSnap = true; Game.floats.length = 0; T.step(1); });
  await t.shot('rink-day');

  // ---- the Zamboni: the hint and the button at its garage, getting in, the skaters leave the ice
  const zin = await t.ev(() => {
    const K = CFG.ICERINK, Z = K.ZAM_SPOT; T.tp(Z.x + 40, Z.y + 30, 'snow'); T.step(2); const near = Game.hint && { text: Game.hint.text, target: !!Game.hint.target };
    T.tp(Z.x, Z.y, 'snow'); T.step(1); const label = T.label(); Game.floats.length = 0; T.act(); const r = T.rink(), btn = (UI.update(0), UI.els.btnCar.textContent), floats = T.floatTexts();
    T.step(180);
    return { near, label, r, btn, floats, states: IceRinkExt.st.skaters.map((k) => k.state), hint: T.hint(), drives: Game.s.icerink.drives };
  });
  t.expect(zin.near && zin.near.text === 'Drive the Zamboni and smooth the ice! 🧊' && zin.near.target, `hint by the Zamboni ${JSON.stringify(zin.near)}`);
  t.expectEq(zin.label, '🧊 Drive the Zamboni', 'the Zamboni button by its garage');
  t.expect(zin.r.driving && zin.r.kind === 'zamboni' && zin.r.mode === 'chef' && zin.btn === '🚶 Hop out' && zin.drives === 1, `in the Zamboni ${JSON.stringify(zin.r)}`);
  t.expect(zin.floats.includes('🎵 Tweet!'), `a little whistle when the Zamboni comes out ${JSON.stringify(zin.floats)}`);
  t.expect(zin.states.every((s) => s === 'exit' || s === 'bench'), `the skaters leave the ice ${JSON.stringify(zin.states)}`);
  t.expect(/^Smooth the ice! 🧊 \d+% clean$/.test(zin.hint), `the clean meter in the hint (${zin.hint})`);

  // ---- it keeps to the ice: out of the garage, and pushing against the boards
  const keep = await t.ev(() => {
    const K = CFG.ICERINK, z = IceRinkExt.st.zam; T.goTo(K.LANE.x, K.ICE.y0 + 70, 10, 300);
    T.steer(-1, 0); T.step(400); T.unsteer(); const west = { x: z.x, sdf: IceRinkExt.sdf(z.x, z.y) };
    T.steer(0, 1); T.step(300); T.unsteer(); const south = { y: z.y, sdf: IceRinkExt.sdf(z.x, z.y) };
    T.steer(0, -1); T.step(300); T.unsteer(); const north = { y: z.y, x: z.x };
    return { west, south, north, ice: K.ICE };
  });
  t.expect(keep.west.sdf <= -29 && keep.south.sdf <= -29 && keep.north.y >= keep.ice.y0 + 29, `the Zamboni stays on the ice ${JSON.stringify(keep)}`);

  // ---- smoothing: drive the resurfacing pattern; screenshot halfway (scratches ahead, a wet trail behind)
  await t.ev(() => { IceRinkExt.preScratch(11); IceRinkExt.preScratch(23); });
  const half = await t.ev(() => {
    const path = IceRinkExt.autoPath(), p0 = IceRinkExt.cleanPct(), n = 1 + IceRinkExt.outline(32, 26).length + 1 + 6;   // out on the second lap's top edge
    for (let i = 0; i < n; i++) T.goTo(path[i].x, path[i].y, 20, 300);
    return { p0, p1: IceRinkExt.cleanPct(), wet: IceRinkExt.st.wet.length, i: n };
  });
  t.expect(half.p1 > half.p0 + 10 && half.wet > 30, `the Zamboni wipes the scratches and leaves a wet trail ${JSON.stringify(half)}`);
  await t.ev(() => { Render.setZoom(1.3); Game.cameraSnap = true; Game.floats.length = 0; T.step(1); });
  await t.shot('zamboni-smoothing');
  const shiny = await t.ev((from) => {
    const path = IceRinkExt.autoPath(); let pctLog = [];
    Game.floats.length = 0; let saw = false;
    for (let i = from; i < path.length - 3; i++) { T.goTo(path[i].x, path[i].y, 20, 300); pctLog.push(IceRinkExt.cleanPct()); if (T.floatTexts().includes('Shiny! ✨')) saw = true; if (saw) break; }
    return { pct: IceRinkExt.cleanPct(), saw, shiny: Game.s.icerink.shiny, hint: T.hint(), rising: pctLog.every((v, i) => !i || v >= pctLog[i - 1]) };
  }, half.i);
  t.expect(shiny.pct === 100 && shiny.saw && shiny.shiny === 1 && shiny.rising, `the whole rink smooth: 100% and "Shiny! ✨" ${JSON.stringify(shiny)}`);
  t.expectEq(shiny.hint, 'Shiny! ✨ Drive back into the garage', 'the hint sends the Zamboni home');
  await t.ev(() => { T.step(30); });
  await t.shot('zamboni-shiny');
  // drive home and hop out
  const zout = await t.ev(() => {
    const K = CFG.ICERINK, z = IceRinkExt.st.zam; T.goTo(K.LANE.x, K.ICE.y0 + 64, 12, 400); T.goTo(K.LANE.x, K.LANE.top + 6, 8, 400);
    const label = T.label(); T.act(); const p = Game.player;
    const r = { label, driving: Game.driving, px: p.x, py: p.y, spot: K.ZAM_SPOT, solid: Game.obstacles().filter((o) => Game.hitRect(p.x, p.y, 12, o)).length };
    T.until(() => z.mode === 'park', 300); r.mode = z.mode; r.zx = z.x; r.zy = z.y;
    T.step(300); r.states = IceRinkExt.st.skaters.map((k) => k.state); r.on = IceRinkExt.st.skaters.every((k) => k.state !== 'skate' || IceRinkExt.onIce(k.x, k.y, 10));
    return r;
  });
  t.expect(zout.label === '🚶 Hop out' && !zout.driving && zout.px === zout.spot.x && zout.py === zout.spot.y && zout.solid === 0, `hop out at the garage ${JSON.stringify(zout)}`);
  t.expect(zout.mode === 'park' && zout.zx === 7080 && zout.zy === 6334, `the Zamboni parks in its garage ${JSON.stringify(zout)}`);
  t.expect(zout.states.every((s) => s === 'skate' || s === 'fall') && zout.on, `the skaters come back onto the ice ${JSON.stringify(zout.states)}`);

  // ---- the vehicle button on the ice drives the Zamboni home first
  const zbtn = await t.ev(() => {
    const K = CFG.ICERINK, z = IceRinkExt.st.zam; T.tp(K.ZAM_SPOT.x, K.ZAM_SPOT.y, 'snow'); T.act(); T.goTo(6900, 6540, 20, 600);
    UI.toggleCar(); T.step(2); const mid = { driving: Game.driving, mode: z.mode, hint: T.hint() };
    const n = T.until(() => !Game.driving, 1200); const p = Game.player;
    return { mid, n, mode: z.mode, px: p.x, py: p.y, spot: K.ZAM_SPOT };
  });
  t.expect(zbtn.mid.driving && zbtn.mid.mode === 'home' && zbtn.mid.hint === 'Back to the garage! 🧊', `the Zamboni drives itself home with the chef ${JSON.stringify(zbtn.mid)}`);
  t.expect(zbtn.n > 0 && zbtn.mode === 'park' && zbtn.px === zbtn.spot.x && zbtn.py === zbtn.spot.y, `...and the chef hops out at the garage ${JSON.stringify(zbtn)}`);

  // ---- the auto-Zamboni: a scratched rink and nobody on the ice: the driver takes it out, the skaters leave and return
  const auto = await t.ev(() => {
    const st = IceRinkExt.st, z = st.zam, K = CFG.ICERINK; T.tp(6860, 6300, 'snow');
    T.step(200); IceRinkExt.preScratch(41); IceRinkExt.preScratch(53); IceRinkExt.preScratch(67); const p0 = IceRinkExt.cleanPct();
    st.since = K.AUTO_GAP + 1; st.whistleT = 0; Game.floats.length = 0; T.step(2);
    const started = { mode: z.mode, autos: Game.s.icerink.autos, floats: T.floatTexts() };
    T.step(150); const states = st.skaters.map((k) => k.state);
    const n = T.until(() => z.mode === 'park', 60 * 120);
    const done = { n, pct: IceRinkExt.cleanPct(), mode: z.mode };
    T.step(360);
    return { p0, started, states, done, back: st.skaters.map((k) => k.state), shiny: Game.s.icerink.shiny };
  });
  t.expect(auto.p0 < 70 && auto.started.mode === 'auto' && auto.started.autos === 1 && auto.started.floats.includes('🎵 Tweet!'), `the driver takes the Zamboni out on his own ${JSON.stringify(auto)}`);
  t.expect(auto.states.every((s) => s === 'exit' || s === 'bench'), `the skaters leave the ice while it is out ${JSON.stringify(auto.states)}`);
  t.expect(auto.done.n > 0 && auto.done.mode === 'park' && auto.done.pct === 100, `the auto run smooths the whole rink ${JSON.stringify(auto.done)}`);
  t.expect(auto.back.every((s) => s === 'skate' || s === 'fall') && auto.shiny === 1, `the skaters come back; the chef's shiny count unchanged ${JSON.stringify(auto)}`);
  // no auto run while the chef skates
  const noAuto = await t.ev(() => {
    const st = IceRinkExt.st, K = CFG.ICERINK; T.tp(K.SKATE_SPOT.x, K.SKATE_SPOT.y, 'snow'); T.act(); T.until(() => st.skate.phase === 'on', 300);
    IceRinkExt.preScratch(71); IceRinkExt.preScratch(83); IceRinkExt.preScratch(97); st.since = K.AUTO_GAP + 1; T.step(30);
    return { mode: st.zam.mode, pct: IceRinkExt.cleanPct() };
  });
  t.expect(noAuto.mode === 'park' && noAuto.pct < 70, `no auto run while the chef is on the ice ${JSON.stringify(noAuto)}`);

  // ---- Take-me-home while skating, and while driving the Zamboni
  const home1 = await t.ev(() => { Game.goHome(); T.step(2); return { area: Game.area, driving: Game.driving, skate: !!IceRinkExt.st.skate }; });
  t.expect(home1.area === 'town' && !home1.driving && !home1.skate, `Take-me-home takes the skates off ${JSON.stringify(home1)}`);
  const home2 = await t.ev(() => {
    const K = CFG.ICERINK, z = IceRinkExt.st.zam; IceRinkExt.st.since = 0; T.tp(K.ZAM_SPOT.x, K.ZAM_SPOT.y, 'snow'); T.act(); T.goTo(6900, 6520, 20, 600);
    Game.goHome(); T.step(2);
    return { area: Game.area, driving: Game.driving, mode: z.mode, x: z.x, y: z.y, states: IceRinkExt.st.skaters.map((k) => k.state) };
  });
  t.expect(home2.area === 'town' && !home2.driving && home2.mode === 'park' && home2.x === 7080 && home2.y === 6334, `Take-me-home parks the Zamboni ${JSON.stringify(home2)}`);
  t.expect(home2.states.every((s) => s === 'skate' || s === 'fall'), `...and the skaters are back on the ice ${JSON.stringify(home2.states)}`);

  // ---- rescues: on foot on the ice, inside the stand, inside the garage
  const rescue = await t.ev(() => {
    const K = CFG.ICERINK, out = [];
    for (const [x, y] of [[6960, 6510], [6615, 6420], [7080, 6330], [6630, 6590]]) {
      T.tp(x, y, 'snow'); T.step(2); const p = Game.player;
      out.push({ at: [x, y], x: p.x, y: p.y, solid: Game.obstacles().filter((o) => Game.hitRect(p.x, p.y, 12, o)).length, onIce: IceRinkExt.sdf(p.x, p.y) < 6 });
    }
    return out;
  });
  t.expect(rescue.every((r) => r.solid === 0 && !r.onIce && (r.x !== r.at[0] || r.y !== r.at[1])), `rescued out of the ice, the stand, the garage and a bench ${JSON.stringify(rescue)}`);

  // ---- saved counters survive a reload; nothing else is
  await t.ev(() => Game.save());
  await t.reload();
  const saved = await t.ev(() => ({ s: Game.s.icerink, mode: IceRinkExt.st.zam.mode, skate: IceRinkExt.st.skate }));
  t.expect(saved.s.spins === 1 && saved.s.jumps === 1 && saved.s.shiny === 1 && saved.s.drives >= 3 && saved.s.skates >= 3 && saved.s.autos === 1 && saved.s.seen, `the counters are saved ${JSON.stringify(saved.s)}`);
  t.expect(saved.mode === 'park' && !saved.skate, 'after a reload the Zamboni is parked and nobody wears skates');

  // ---- screenshots: dusk with the lights, then the phone
  await t.ev(() => {
    AtmosphereExt.force({ phase: 'dusk', weather: 'none' }); const K = CFG.ICERINK;
    T.tp(K.SKATE_SPOT.x, K.SKATE_SPOT.y, 'snow'); Game.doAction(); T.step(1);
    for (let i = 0; i < 200 && IceRinkExt.st.skate.phase !== 'on'; i++) T.step(1);
    const sk = IceRinkExt.st.skate; sk.x = 6900; sk.y = 6560; sk.sx = 90; sk.sy = -30;
    Render.setZoom(1); Game.cameraSnap = true; Game.floats.length = 0; T.step(2);
  });
  await t.shot('rink-dusk');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); Render.setZoom(1.2); Game.cameraSnap = true; T.step(2); });
  await t.shot('phone-dusk');
  await t.ev(() => {
    AtmosphereExt.force({ phase: 'day' }); const sk = IceRinkExt.st.skate; sk.x = 6960; sk.y = 6520; sk.sx = 0; sk.sy = 0; T.step(1); Game.doAction(); T.step(16); Game.cameraSnap = true; Game.floats.length = 0;
  });
  await t.shot('phone-spin');
  await t.ev(() => {
    const K = CFG.ICERINK; Game.goHome(); T.step(1); IceRinkExt.preScratch(13); IceRinkExt.preScratch(29);
    T.tp(K.ZAM_SPOT.x, K.ZAM_SPOT.y, 'snow'); Game.doAction(); T.step(1);
    const path = IceRinkExt.autoPath(), n = Math.floor(path.length * 0.3), z = IceRinkExt.st.zam;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 300; j++) { const dx = path[i].x - z.x, dy = path[i].y - z.y, d = Math.hypot(dx, dy); if (d < 20) break; Input.axis = () => ({ x: dx / d, y: dy / d }); Game.update(1 / 60); }
    }
    T.unsteer(); Render.setZoom(1); Game.cameraSnap = true; Game.floats.length = 0; T.step(1);
  });
  await t.shot('phone-zamboni');
  await t.ev(() => { Game.goHome(); T.step(1); const K = CFG.ICERINK; T.tp(K.SKATE_SPOT.x + 30, K.SKATE_SPOT.y + 60, 'snow'); Render.setZoom(0.9); Game.cameraSnap = true; Game.floats.length = 0; T.step(2); });
  await t.shot('phone-rink');
};
