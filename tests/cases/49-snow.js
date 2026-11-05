'use strict';
// Snowy Peak (js/snow.js): the ski lift station in Construction Town sits on free, reachable ground right beside the
// Pizza Mine; riding it plays the lift cut-scene and lands on the snow map's top station (one welcome toast); the sled
// slides downhill by itself, steers left/right, bumps off a tree, stops at the bottom ("Wheee!") and rides the lift up
// again; the skis pass the slalom gates (counted), fly off the jump, cross the finish arch with a time and stop at a tree
// ("Oops! ❄️") without losing anything; a snowman from three rolled snowballs (stacked by pushing and with the button,
// then a face), the built count kept across a reload; the $3 hot cocoa; the in-map lift; rescues; riding back down to
// Construction Town next to the mine; Take-me-home from the snow.
module.exports = async (t) => {
  // until the coordinator wires js/snow.js into index.html, serve the page with it added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/snow.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/snow.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();
  const S = await t.ev(() => CFG.SNOW);

  // ---- registered: the map in its free rectangle, ahead of the outer maps
  const reg = await t.ev(() => ({
    ok: typeof SnowExt !== 'undefined' && Render.ext.includes(SnowExt) && Game.ext.includes(SnowExt),
    world: CFG.AREAS.snow && CFG.AREAS.snow.WORLD, noSky: CFG.AREAS.snow.noSky,
    order: Game.ext.indexOf(SnowExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(SnowExt) < Game.ext.indexOf(SiteTownExt),
    vehicles: !!(CFG.VEHICLES.sled && CFG.VEHICLES.skis),
    save: Game.s.snow && Game.s.snow.built === 0 && Game.s.snow.men.length === 0,
  }));
  t.expect(reg.ok, 'the snow extension is registered');
  t.expectEq(JSON.stringify([reg.world.x0, reg.world.y0, reg.world.x1, reg.world.y1]), JSON.stringify([5000, 5000, 7400, 6600]), 'the snow map sits in its free rectangle');
  t.expect(reg.noSky, 'the snow map draws its own sky');
  t.expect(reg.order, 'the snow extension answers before Construction Town and the City');
  t.expect(reg.vehicles, 'sled and skis are registered vehicles');
  t.expect(reg.save, 'a fresh save has no snowmen yet');

  // ---- the lift station in Construction Town: free ground, below the walkable top edge, next to the mine, reachable
  const ct = await t.ev(() => {
    const C = CFG.SNOW.CT, M = CFG.MINES, B = C.BOARD;
    T.tp(3300, 60, 'site');
    const obs = Game.obstacles(), hit = (x, y) => obs.some((o) => Game.hitRect(x, y, 12, o));
    // walk the grid from the gravel road to the boarding spot (8 px steps, the chef's own radius)
    const top = Game.walkTop(), x0 = 3200, x1 = 4480, y0 = top, y1 = 200, st = 8, key = (x, y) => x + ',' + y, seen = new Set([key(3304, 64)]), q = [[3304, 64]];
    let reached = false;
    while (q.length) {
      const [x, y] = q.pop();
      if (Math.abs(x - B.x) <= 8 && Math.abs(y - B.y) <= 8) { reached = true; break; }
      for (const [dx, dy] of [[st, 0], [-st, 0], [0, st], [0, -st]]) { const nx = x + dx, ny = y + dy; if (nx < x0 || nx > x1 || ny < y0 || ny > y1 || seen.has(key(nx, ny)) || hit(nx, ny)) continue; seen.add(key(nx, ny)); q.push([nx, ny]); }
    }
    const H = C.HUT, hill = M.HILL_BOX;
    return {
      free: !hit(B.x, B.y), aboveTop: B.y >= top, reached, mineDist: Math.hypot(B.x - M.DOOR.x, B.y - M.DOOR.y),
      inKeep: H.x0 >= 3900 && C.DECK.x1 <= 4500 && H.y0 >= -110 && C.DECK.y1 <= 200,
      clearOfHill: C.DECK.x1 <= hill.x && H.x1 <= hill.x,
      hutSolid: obs.some((o) => o.x === H.x0 && o.y === H.y0),
    };
  });
  t.expect(ct.free, 'the boarding spot is not inside anything');
  t.expect(ct.aboveTop, 'the boarding spot respects the walkable top edge');
  t.expect(ct.reached, 'the boarding spot can be walked to from the gravel road');
  t.expect(ct.mineDist < 200, `the lift is right next to the mine door (${Math.round(ct.mineDist)} px)`);
  t.expect(ct.inKeep && ct.clearOfHill, 'the station stays in its free strip, clear of the mine hill');
  t.expect(ct.hutSolid, 'the lift hut is solid');
  const ctHint = await t.ev(() => { const B = CFG.SNOW.CT.BOARD; T.tp(B.x - 50, B.y + 6, 'site'); const far = Game.hint; T.tp(B.x, B.y, 'site'); return { far, label: T.label(), hint: T.hint() }; });
  t.expect(ctHint.far && /ski lift/.test(ctHint.far.text) && ctHint.far.target, 'walking up, the hint points at the ski lift');
  t.expectEq(ctHint.label, '🚡 Ride the ski lift', 'the button at the station');
  t.expect(/ski lift/.test(ctHint.hint), 'the hint at the station');
  await t.ev(() => { Render.setZoom && Render.setZoom(1.2); Game.cameraSnap = true; });
  await t.shot('ct-station');
  // a rescue: a save inside the hut puts the chef on the boarding spot
  const ctRescue = await t.ev(() => { const H = CFG.SNOW.CT.HUT; T.tp((H.x0 + H.x1) / 2, (H.y0 + H.y1) / 2, 'site'); T.step(2); return { x: Game.player.x, y: Game.player.y }; });
  t.expect(ctRescue.x === S.CT.BOARD.x && ctRescue.y === S.CT.BOARD.y, 'a chef stuck in the lift hut lands on the boarding spot');

  // ---- the ride up: the cut-scene, then the top station of Snowy Peak and one welcome toast
  const up = await t.ev(() => { const B = CFG.SNOW.CT.BOARD; T.tp(B.x, B.y, 'site'); T.toasts.length = 0; T.act(); T.step(30); return { travel: Game.travel && { via: Game.travel.via, to: Game.travel.to } }; });
  t.expect(up.travel && up.travel.via === 'skilift' && up.travel.to === 'snow', 'riding the lift starts the ski lift cut-scene');
  await t.shot('lift-cutscene');
  const top = await t.ev(() => { T.until(() => !Game.travel, 600); return { area: Game.area, x: Game.player.x, y: Game.player.y, toasts: T.toasts.slice(), seen: Game.s.snow.seen, label: T.label(), hint: T.hint() }; });
  t.expectEq(top.area, 'snow', 'the lift lands on Snowy Peak');
  t.expect(top.x === S.ARRIVE.x && top.y === S.ARRIVE.y, 'the chef steps off at the top station');
  t.expect(top.toasts.filter((m) => m === '⛄ Welcome to Snowy Peak!').length === 1 && top.seen, 'one welcome toast the first time');
  t.expect(top.hint && top.hint.length > 0, 'a hint on arrival');
  const again = await t.ev(() => { T.toasts.length = 0; Game.startTravel('snow', 'skilift', 1); T.until(() => !Game.travel, 300); return T.toasts.length; });
  t.expectEq(again, 0, 'no second welcome toast');
  const spots = await t.ev(() => {
    const S = CFG.SNOW, obs = Game.obstacles(), out = {};
    for (const k of ['TOP_SPOT', 'EXIT_SPOT', 'ARRIVE', 'BOTTOM_SPOT', 'RACK_SPOT', 'SKI_SPOT', 'COCOA_PAD']) out[k] = !obs.some((o) => Game.hitRect(S[k].x, S[k].y, 12, o)) && S[k].y >= Game.walkTop();
    T.tp(S.TOP_SPOT.x, S.TOP_SPOT.y, 'snow'); out.down = T.label();
    T.tp(S.EXIT_SPOT.x, S.EXIT_SPOT.y, 'snow'); out.down2 = T.label(); out.hint2 = T.hint();
    return out;
  });
  for (const k of Object.keys(spots)) if (!['down', 'down2', 'hint2'].includes(k)) t.expect(spots[k], `${k} is free snow`);
  t.expectEq(spots.down, '🏗️ Back to town', 'the way home at the top station');
  t.expectEq(spots.down2, '🏗️ Back to town', 'the way home at the bottom of the runs too');
  t.expect(/Construction Town/.test(spots.hint2 || ''), 'the hint at the bottom exit says where it goes');

  // ---- sledding: grab a sled, slide down by itself, steer, bump a tree, stop at the bottom, ride up with it
  const sled1 = await t.ev(() => {
    const S = CFG.SNOW;
    T.tp(S.RACK_SPOT.x, S.RACK_SPOT.y, 'snow');
    const label = T.label(); T.act();
    const v = Game.vehicle, out = { label, driving: Game.driving && v && v.kind === 'sled' };
    T.steer(0, 1); out.reach = T.until(() => v.y > S.SLOPE.y0 + 10, 600); T.unsteer();
    const y0 = v.y; T.step(60); out.slid = v.y - y0; out.sy = v.sy;
    const x0 = v.x; T.steer(1, -1); T.step(30); out.steer = v.x - x0; out.still = v.y > y0 + 40; T.unsteer();
    out.hint = T.hint();
    return out;
  });
  t.expectEq(sled1.label, '🛷 Grab a sled', 'the button at the sled rack');
  t.expect(sled1.driving, 'grabbing a sled puts the chef on it');
  t.expect(sled1.reach >= 0, 'the sled is pushed onto the slope');
  t.expect(sled1.slid > 60 && sled1.sy > 50, `the sled slides downhill all by itself (${Math.round(sled1.slid)} px in 1 s)`);
  t.expect(sled1.steer > 30 && sled1.still, 'the joystick steers left/right only (pushing up does not stop it)');
  t.expect(/Steer/.test(sled1.hint), 'a sledding hint');
  await t.shot('sledding');
  const sled2 = await t.ev(() => {
    const S = CFG.SNOW, v = Game.vehicle, floats = () => Game.floats.map((f) => f.text);
    const n = T.until(() => !v.run && v.y >= S.SLOPE.y1 && Math.hypot(v.sx, v.sy) === 0, 2400);
    return { n, y: v.y, wheee: floats().some((f) => /Wheee/.test(f)), sleds: Game.s.snow.sleds, label: T.label(), hint: T.hint() };
  });
  t.expect(sled2.n >= 0 && sled2.y >= S.SLOPE.y1, 'the sled stops on the flat at the bottom');
  t.expect(sled2.wheee && sled2.sleds === 1, '"Wheee!" at the bottom, counted');
  t.expectEq(sled2.label, '🚡 Ride up', 'at the bottom the button rides the lift up');
  const sledUp = await t.ev(() => {
    T.act(); const L = SnowExt.st.lift, out = { lift: !!L, withSled: !!(L && L.veh && L.veh.kind === 'sled') };
    T.step(120); out.lifted = SnowExt.st.lift && SnowExt.st.lift.lift > 0; out.hint = T.hint(); out.label = T.label();
    T.until(() => !SnowExt.st.lift, 900);
    out.area = Game.area; out.x = Game.player.x; out.y = Game.player.y; out.onSled = Game.driving && Game.vehicle && Game.vehicle.kind === 'sled';
    return out;
  });
  t.expect(sledUp.lift && sledUp.withSled, 'the lift takes the chef and the sled');
  t.expect(sledUp.lifted && /Up we go/.test(sledUp.hint) && !sledUp.label, 'gliding up on the chair (no button meanwhile)');
  t.expect(sledUp.area === 'snow' && sledUp.x === S.ARRIVE.x && sledUp.y === S.ARRIVE.y && sledUp.onSled, 'back at the top, still on the sled');
  const bump = await t.ev(() => {
    const v = Game.vehicle, tr = CFG.SNOW.TREES.find((x) => x[0] === 5470 && x[1] === 5700);
    v.x = tr[0] + 4; v.y = tr[1] - 70; v.sy = 200; v.sx = 0; T.step(1);
    const n = T.until(() => v.bump > 0, 120), fl = Game.floats.map((f) => f.text);
    T.until(() => v.y > tr[1] + 30, 300);
    const out = { n, bumped: fl.some((f) => /Bump/.test(f)), past: v.y > tr[1] + 30 };
    Game.exitCar(); T.step(2); out.left = !!SnowExt.st.sled && !Game.driving; out.carBtn = Game.carNear;
    return out;
  });
  t.expect(bump.n >= 0 && bump.bumped, 'the sled bumps softly off a tree');
  t.expect(bump.past, 'and slides on past it');
  t.expect(bump.left && bump.carBtn, 'hopping off leaves the sled there (it can be hopped on again)');

  // ---- skiing: gates counted, the jump, the finish time, a tree only stops you
  const ski1 = await t.ev(() => {
    const S = CFG.SNOW;
    T.tp(S.SKI_SPOT.x, S.SKI_SPOT.y, 'snow');
    const label = T.label(); T.act();
    const v = Game.vehicle, out = { label, skis: Game.driving && v && v.kind === 'skis' };
    T.steer(0, 1); T.until(() => v.y > S.SLOPE.y0 + 4, 600); T.unsteer();
    out.run = !!SnowExt.st.run;
    out.gate2 = T.until(() => SnowExt.st.run.gates.length >= 2, 600);
    return out;
  });
  t.expectEq(ski1.label, '⛷️ Put on skis', 'the button at the ski hut');
  t.expect(ski1.skis && ski1.run, 'skis on, the run starts at the start line');
  t.expect(ski1.gate2 >= 0, 'skiing through the gates counts them');
  await t.shot('ski-gate');
  const ski2 = await t.ev(() => {
    const v = Game.vehicle, out = {};
    out.gateFloat = Game.floats.some((f) => /\/ 8 gates/.test(f.text));
    out.jump = T.until(() => v.z > 24, 600);
    out.whoosh = Game.floats.some((f) => /Whoosh/.test(f.text));
    return out;
  });
  t.expect(ski2.gateFloat, 'a "2 / 8 gates" float');
  t.expect(ski2.jump >= 0 && ski2.whoosh, 'the ramp sends the skier up: "Whoosh!"');
  await t.shot('ski-jump');
  const ski3 = await t.ev(() => {
    const v = Game.vehicle, S = CFG.SNOW;
    const n = T.until(() => SnowExt.st.run && SnowExt.st.run.done, 900);
    const run = SnowExt.st.run, fl = Game.floats.map((f) => f.text);
    T.until(() => Math.hypot(v.sx, v.sy) === 0, 900);
    return { n, gates: run.gates.length, time: run.time, finishFloat: fl.some((f) => /Finish! ⏱️ \d+\.\d s/.test(f)), runs: Game.s.snow.runs, best: Game.s.snow.best, jumps: Game.s.snow.jumps, stopY: v.y, label: T.label(), bottom: v.y >= S.SLOPE.y1 };
  });
  t.expect(ski3.n >= 0, 'the skier reaches the finish arch');
  t.expectEq(ski3.gates, 8, 'straight down the middle passes all eight gates');
  t.expect(ski3.finishFloat && ski3.time > 1 && ski3.runs === 1 && ski3.best > 0 && ski3.jumps >= 1, `a finish cheer with the time (${ski3.time && ski3.time.toFixed(1)} s), saved`);
  t.expect(ski3.bottom && ski3.label === '🚡 Ride up', 'the skier stops at the bottom and can ride up');
  await t.shot('ski-finish');
  const skiTree = await t.ev(() => {
    const v = Game.vehicle, tr = CFG.SNOW.TREES.find((x) => x[0] === 5840 && x[1] === 5900);
    v.x = tr[0]; v.y = tr[1] - 80; v.sy = 250; v.sx = 0; v.run = true; T.step(1);
    const n = T.until(() => v.bump > 0, 120), oops = Game.floats.some((f) => /Oops! ❄️/.test(f.text)), stopped = v.sy === 0;
    T.until(() => v.y > tr[1] + 30, 400);
    const out = { n, oops, stopped, on: v.y > tr[1] + 30, skis: Game.driving && Game.vehicle === v };
    Game.exitCar(); T.step(2); out.gone = !SnowExt.st.skis && !Game.driving;
    return out;
  });
  t.expect(skiTree.n >= 0 && skiTree.oops && skiTree.stopped, 'a tree stops the skier: "Oops! ❄️"');
  t.expect(skiTree.on && skiTree.skis, 'and the skier carries on, skis still on');
  t.expect(skiTree.gone, 'taking the skis off sends them back to the hut');

  // ---- the in-map lift from the bottom station, on foot
  const lift = await t.ev(() => {
    const S = CFG.SNOW; T.tp(S.BOTTOM_SPOT.x, S.BOTTOM_SPOT.y, 'snow');
    const label = T.label(), hint = T.hint(); T.act();
    const n = T.until(() => !SnowExt.st.lift, 900);
    return { label, hint, n, x: Game.player.x, y: Game.player.y, sledBack: !SnowExt.st.sled || SnowExt.st.sled.y < S.SLOPE.y1 };
  });
  t.expectEq(lift.label, '🚡 Ride up', 'the button at the bottom station');
  t.expect(/lift/.test(lift.hint), 'the hint at the bottom station');
  t.expect(lift.n >= 0 && lift.x === S.ARRIVE.x && lift.y === S.ARRIVE.y, 'the in-map lift glides up to the top station');

  // ---- the snowman: three snowballs, stacked, a face; the count kept across a reload
  const sm1 = await t.ev(() => {
    const S = CFG.SNOW, st = SnowExt.st, out = {};
    T.tp(6640, 5480, 'snow'); Game.player.facing = 1;
    out.label = T.label(); out.hint = T.hint(); T.act();
    out.ball = !!st.ball; out.letGoLabel = T.label();
    T.steer(1, 0); T.step(150); T.unsteer(); T.step(10);
    out.r = st.ball && st.ball.r; out.tracks = st.tracks.length;
    T.act(); out.stacks = st.stacks.length;
    return out;
  });
  t.expectEq(sm1.label, '❄️ Roll a snowball', 'the button in the meadow');
  t.expect(/snowball|snowman/i.test(sm1.hint), 'a meadow hint');
  t.expect(sm1.ball && sm1.letGoLabel === '✋ Let go', 'rolling a snowball: pushing it, one button lets go');
  t.expect(sm1.r > 20 && sm1.tracks > 20, `the snowball grows as it rolls and leaves a track (r ${sm1.r && sm1.r.toFixed(1)})`);
  t.expectEq(sm1.stacks, 1, 'letting go leaves the ball there');
  const sm2 = await t.ev(() => {
    const st = SnowExt.st, base = st.stacks[0], out = {};
    // ball two: rolled from the left straight into the first one
    T.tp(base.x - 300, base.y - 2, 'snow'); Game.player.facing = 1; T.act();
    T.steer(1, 0); out.auto = T.until(() => base.balls.length === 2, 400); T.unsteer();
    out.ball = !!st.ball;
    // ball three: up to it, then the button
    T.tp(base.x - 260, base.y - 2, 'snow'); Game.player.facing = 1; T.act();
    T.steer(1, 0); out.near = T.until(() => T.label() === '⛄ Stack it!', 400); T.unsteer();
    if (base.balls.length < 3) T.act();
    out.three = base.balls.length;
    out.faceLabel = T.label(); out.hint = T.hint();
    return out;
  });
  t.expect(sm2.auto >= 0 && !sm2.ball, 'pushing a snowball onto another one stacks it');
  t.expect(sm2.near >= 0, 'close to the stack the button says "⛄ Stack it!"');
  t.expectEq(sm2.three, 3, 'three snowballs stacked');
  t.expectEq(sm2.faceLabel, '🥕 Add a face', 'with three stacked: add a face');
  t.expect(/face/.test(sm2.hint), 'the hint asks for a face');
  const sm3 = await t.ev(() => { T.act(); T.step(20); return { built: Game.s.snow.built, men: Game.s.snow.men.length, stacks: SnowExt.st.stacks.length, float: Game.floats.some((f) => f.text === 'You built a snowman! ⛄') }; });
  t.expect(sm3.built === 1 && sm3.men === 1 && sm3.stacks === 0 && sm3.float, 'a finished snowman: "You built a snowman! ⛄", saved');
  await t.shot('snowman');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Game.cameraSnap = true; T.step(2); });
  await t.shot('snowman-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => Game.save());
  await t.reload();
  const kept = await t.ev(() => ({ built: Game.s.snow.built, men: Game.s.snow.men.length, area: Game.area, sleds: Game.s.snow.sleds, runs: Game.s.snow.runs }));
  t.expect(kept.built === 1 && kept.men === 1 && kept.area === 'snow' && kept.sleds === 1 && kept.runs === 1, 'the snowman and the counts survive a reload (and the chef is still on the snow)');
  const cap = await t.ev(() => { const s = Game.s.snow; for (let i = 0; i < 4; i++) { SnowExt.st.stacks.push({ x: 6700 + i * 120, y: 5700, balls: [26, 20, 15], t: 0 }); SnowExt.addFace(Game, SnowExt.st.stacks[SnowExt.st.stacks.length - 1]); } return { built: s.built, men: s.men.length }; });
  t.expect(cap.built === 5 && cap.men === 3, 'up to three snowmen stay standing');

  // ---- hot cocoa for $3, carried for 30 s
  const cocoa = await t.ev(() => {
    const S = CFG.SNOW; Game.s.cash = 10; T.tp(S.COCOA_PAD.x, S.COCOA_PAD.y, 'snow');
    const n = T.until(() => SnowExt.st.cocoa > 0, 600);
    const out = { n, cash: Game.s.cash, cocoas: Game.s.snow.cocoas, t: SnowExt.st.cocoa };
    T.tp(S.COCOA_PAD.x + 120, S.COCOA_PAD.y + 40, 'snow'); T.step(60 * 31); out.after = SnowExt.st.cocoa;
    return out;
  });
  t.expect(cocoa.n >= 0 && Math.abs(cocoa.cash - 7) < 0.01 && cocoa.cocoas === 1, 'standing on the pad buys a $3 hot cocoa');
  t.expect(cocoa.t > 29 && cocoa.after === 0, 'the cocoa is carried for 30 s');

  // ---- rescue: a chef inside a tree goes to the top station
  const rescue = await t.ev(() => { const tr = CFG.SNOW.TREES[4]; T.tp(tr[0], tr[1] - 2, 'snow'); T.step(2); return { x: Game.player.x, y: Game.player.y }; });
  t.expect(rescue.x === S.ARRIVE.x && rescue.y === S.ARRIVE.y, 'a chef stuck in a tree lands at the top station');
  // the dog and the kids are about
  const life = await t.ev(() => { const st = SnowExt.st, d = st.dog; T.tp(d.x - 40, d.y, 'snow'); const label = T.label(); if (label === '🐶 Pat the dog') T.act(); const said = !!st.dog.say; const k0 = st.kids.map((k) => k.y); T.step(240); return { label, said, kidsMoved: st.kids.some((k, i) => k.y !== k0[i]) }; });
  t.expect(life.label === '🐶 Pat the dog' && life.said, 'the snow dog can be patted (' + life.label + ')');
  t.expect(life.kidsMoved, 'the kids go sledding');

  // ---- riding back down to Construction Town, next to the mine
  const down = await t.ev(() => {
    const S = CFG.SNOW; T.tp(S.TOP_SPOT.x, S.TOP_SPOT.y, 'snow'); T.act();
    const tr = Game.travel && { via: Game.travel.via, to: Game.travel.to };
    T.until(() => !Game.travel, 600);
    const M = CFG.MINES.DOOR, p = Game.player;
    return { tr, area: Game.area, mine: Math.hypot(p.x - M.x, p.y - M.y), x: p.x, y: p.y };
  });
  t.expect(down.tr && down.tr.via === 'skilift' && down.tr.to === 'site', 'riding down plays the lift ride back');
  t.expect(down.area === 'site' && down.x === S.CT.BOARD.x && down.y === S.CT.BOARD.y && down.mine < 200, 'back in Construction Town at the lift, next to the mine');

  // ---- Take-me-home from the snow, on skis
  const home = await t.ev(() => {
    const S = CFG.SNOW; T.tp(S.SKI_SPOT.x, S.SKI_SPOT.y, 'snow'); T.act(); T.steer(0, 1); T.step(80); T.unsteer();
    const was = Game.driving;
    Game.goHome(); T.step(2);
    return { was, area: Game.area, driving: Game.driving, skis: SnowExt.st.skis, sled: SnowExt.st.sled, lift: SnowExt.st.lift, hint: Game.hint && Game.hint.text, label: T.label() };
  });
  t.expect(home.was, 'skiing before going home');
  t.expect(home.area === 'town' && !home.driving && !home.skis && !home.sled && !home.lift, 'Take-me-home works from the snow and clears the gear');
  t.expect(!/lift|snow|sled|ski/i.test(home.hint || '') && !/lift|sled|ski/i.test(home.label || ''), 'no snow hint or button back home');
};
