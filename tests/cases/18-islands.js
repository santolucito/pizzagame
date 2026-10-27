'use strict';
// The Islands, grown: the ferry over, the sandbar and rope bridges that reach Sunny Beach, Starfish Cove, the marina
// pier to Treasure Isle and Rocket Island on foot (a flood fill over the map's obstacles), volleyball, the shaved-ice
// kiosk, the tide pools; Rocket Island's workers and the ask-about-the-rocket bubble with its countdown; every
// interior (door label and hint, inside, the main thing to do, out again, a rescue from a wall, Take-me-home); the
// huts still take pizza deliveries at their doors. Screenshots at desktop and phone size.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires the new files into index.html, load them into the booted page (after js/islands.js)
  const loadNew = async () => {
    for (const [glob, src] of [['IslandsInsideExt', 'js/islands-inside.js'], ['RocketExt', 'js/rocket.js']]) {
      const has = await t.ev((n) => { try { return eval('typeof ' + n) !== 'undefined'; } catch (e) { return false; } }, glob);
      if (!has) await t.page.addScriptTag({ url: src });
    }
  };
  await loadNew();
  await t.ev(() => T.step(2));
  const reg = await t.ev(() => ({
    inside: typeof IslandsInsideExt !== 'undefined', rocket: typeof RocketExt !== 'undefined',
    areas: ['lighthouse', 'crabshack', 'coconuthut', 'missionctl'].every((a) => !!CFG.AREAS[a]),
    order: Game.ext.indexOf(IslandsInsideExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(RocketExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(IslandsInsideExt) < Game.ext.indexOf(IslandsExt),
    render: Render.ext.includes(IslandsInsideExt) && Render.ext.includes(RocketExt),
    world: CFG.AREAS.islands.WORLD,
  }));
  t.expect(reg.inside && reg.rocket && reg.areas && reg.render, `extensions and interior maps registered ${JSON.stringify(reg)}`);
  t.expect(reg.order, 'the interiors and the rocket answer before the City and the islands');
  t.expect(reg.world.x0 >= 2600 && reg.world.x1 <= 4600 && reg.world.y1 > 2600 && reg.world.y1 <= 2950, `the Islands map grew south within its limits ${JSON.stringify(reg.world)}`);
  const rects = await t.ev(() => Object.keys(CFG.ISLE_IN.ROOMS).map((k) => [k, CFG.AREAS[k].WORLD]));
  const want = { lighthouse: 6000, crabshack: 7000, coconuthut: 8000, missionctl: 9000 };
  for (const [k, W] of rects) t.expect(W.x0 === want[k] && W.x1 - W.x0 === 600 && W.y0 === 4000 && W.y1 === 4400, `${k} sits in its reserved rectangle`);

  // ---- the ferry over
  await t.ev(() => { const D = CFG.ISLANDS.TOWN_DOCK; T.tp((D.x0 + D.x1) / 2, D.y1 - 30, 'town'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '⛴️ Ride the ferry', 'ferry label on the town dock');
  await t.ev(() => { T.act(); T.until(() => Game.area === 'islands' && !Game.travel, 3000); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'islands', 'the ferry brought the chef to the Islands');

  // ---- every new island (and the pier to Treasure Isle) can be walked to from where the ferry lands
  const walk = await t.ev(() => {
    const W = CFG.ISLANDS.WORLD, step = 10, nx = Math.floor((W.x1 - W.x0) / step), ny = Math.floor((W.y1 - W.y0) / step);
    const obs = Game.obstacles(), free = new Uint8Array(nx * ny), seen = new Uint8Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = W.x0 + i * step, y = W.y0 + j * step;
      if (x < W.x0 + 16 || x > W.x1 - 16 || y < W.y0 + 16 || y > W.y1 - 16) continue;
      if (!obs.some((o) => Game.hitRect(x, y, 12, o))) free[j * nx + i] = 1;
    }
    const A = CFG.ISLANDS.ARRIVE, cell = (x, y) => Math.round((y - W.y0) / step) * nx + Math.round((x - W.x0) / step);
    const q = [cell(A.x, A.y)]; seen[q[0]] = 1;
    while (q.length) { const c = q.pop(), i = c % nx, j = (c - i) / nx; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue; const n = jj * nx + ii; if (free[n] && !seen[n]) { seen[n] = 1; q.push(n); } } }
    const reach = (x, y) => { for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const n = cell(x + di * step, y + dj * step); if (seen[n]) return true; } return false; };
    const I = CFG.ISLANDS, isle = (k) => I.ISLANDS.find((s) => s.key === k), mid = (s) => ({ x: (s.x0 + s.x1) / 2, y: s.y1 - 40 });
    const M = I.ROCKET.MISSION, R = I.ROCKET;
    const spots = {
      start: A, sunny: mid(isle('sunny')), cove: { x: 3550, y: 2730 }, rocket: { x: 4000, y: 2760 }, treasure: { x: 3640, y: 2340 },
      court: I.SUNNY.PLAYERS[0], kiosk: I.SUNNY.PAD, pool: { x: I.COVE.POOLS[0].x, y: I.COVE.POOLS[0].y + I.COVE.POOLS[0].ry + 20 },
      ask: R.ASK, missionDoor: { x: M.x, y: M.y + M.h / 2 + 20 },
    };
    const out = {}; for (const [k, s] of Object.entries(spots)) out[k] = reach(s.x, s.y);
    out.crabDoorNeedsJetski = !reach(isle('crab').hut.x, isle('crab').hut.y + 54);
    return out;
  });
  for (const [k, ok] of Object.entries(walk)) t.expect(ok, `walkable on foot from the ferry: ${k}`);

  // ---- really walk: down the sandbar from Pizza Island onto Sunny Beach
  const sand = await t.ev(() => {
    const L = CFG.ISLANDS.LINKS.find((l) => l.key === 'sandbar');
    T.tp((L.x0 + L.x1) / 2, L.y0 - 40, 'islands'); T.steer(0, 1);
    const n = T.until(() => Game.player.y > L.y1 + 40, 900); T.unsteer(); T.step(2);
    return { n, y: Game.player.y, toast: T.toasts.includes('🏖️ Sunny Beach! Play volleyball!') };
  });
  t.expect(sand.n >= 0, `walked across the sandbar onto Sunny Beach (y ${Math.round(sand.y)})`);
  t.expect(sand.toast, 'Sunny Beach says hello the first time');
  // and over both rope bridges to Rocket Island
  const bridges = await t.ev(() => {
    const b1 = CFG.ISLANDS.LINKS.find((l) => l.key === 'bridge1'), b2 = CFG.ISLANDS.LINKS.find((l) => l.key === 'bridge2'), y = (b1.y0 + b1.y1) / 2;
    T.tp(b1.x0 - 40, y, 'islands'); T.steer(1, 0);
    const n = T.until(() => Game.player.x > b2.x1 + 40, 1600); T.unsteer(); T.step(2);
    return { n, x: Game.player.x, cove: T.toasts.includes('⭐ Starfish Cove! Peek in the tide pools'), rocket: T.toasts.includes('🚀 Rocket Island! A rocket is being built!') };
  });
  t.expect(bridges.n >= 0, `walked over both rope bridges to Rocket Island (x ${Math.round(bridges.x)})`);
  t.expect(bridges.cove && bridges.rocket, 'Starfish Cove and Rocket Island say hello the first time');

  // ---- Sunny Beach: volleyball over the net, a shaved ice from the kiosk
  const vb = await t.ev(() => {
    const SU = CFG.ISLANDS.SUNNY, A = SU.PLAYERS[0]; T.tp(A.x, A.y, 'islands'); T.step(2);
    const label = T.label(), hint = T.hint();
    T.act(); const r1 = IslandsExt.rt.vb.rally, chef = IslandsExt.rt.vb.chef;
    const back = T.until(() => IslandsExt.rt.vb.wait, 400);
    const waitHint = T.hint();
    T.act(); const r2 = IslandsExt.rt.vb.rally;
    T.tp(SU.PLAYERS[0].x, SU.COURT.y1 + 160, 'islands'); T.step(3);
    return { label, hint, r1, chef, back, waitHint, r2, left: IslandsExt.rt.vb.chef, floats: Game.floats.map((f) => f.text) };
  });
  t.expectEq(vb.label, '🏐 Hit the ball!', 'volleyball label on the court');
  t.expectEq(vb.hint, 'Press the button to hit the ball! 🏐', 'volleyball hint on the court');
  t.expect(vb.chef && vb.r1 === 1, 'the chef took the left side and hit the ball');
  t.expect(vb.back >= 0, 'the other player sent it back to the chef');
  t.expectEq(vb.waitHint, 'Hit the ball back over the net! 🏐', 'hint while the ball waits');
  t.expectEq(vb.r2, 2, 'a two-hit rally');
  t.expect(!vb.left, 'walking off the court hands the game back to the beach player');
  await t.ev(() => { const SU = CFG.ISLANDS.SUNNY; T.tp(SU.PLAYERS[0].x + 20, SU.PLAYERS[0].y + 30, 'islands'); Render.setZoom(1); T.step(20); });
  await t.shot('sunny');
  const ice = await t.ev(() => {
    Game.s.cash = 10; const P = CFG.ISLANDS.SUNNY.PAD; T.tp(P.x, P.y, 'islands');
    const n = T.until(() => IslandsExt.rt.treat && IslandsExt.rt.treat.kind === 'snowcone', 400);
    return { n, cash: Game.s.cash, hint: T.hint() };
  });
  t.expect(ice.n >= 0, 'the kiosk circle sold a shaved ice');
  t.expectEq(ice.cash, 7, 'the shaved ice cost $3');
  t.expectEq(ice.hint, 'Yum, shaved ice! 🍧', 'shaved-ice hint while holding it');

  // ---- Starfish Cove: peek into a tide pool
  const pool = await t.ev(() => {
    const P = CFG.ISLANDS.COVE.POOLS[0]; T.tp(P.x, P.y + P.ry + 20, 'islands'); T.step(2);
    const label = T.label(); T.act(); T.step(10);
    return { label, peek: !!IslandsExt.rt.peek, floats: Game.floats.map((f) => f.text) };
  });
  t.expectEq(pool.label, '⭐ Peek in the tide pool', 'tide pool label');
  t.expect(pool.peek && pool.floats.includes('A starfish! ⭐'), 'a starfish pops up in the pool');
  await t.shot('cove');

  // ---- Rocket Island: workers at work, the ask-about-the-rocket bubble and its countdown
  const rk = await t.ev(() => {
    const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x - 150, A.y, 'islands'); T.step(2);
    const far = T.hint();
    const before = RocketExt.st.workers.map((w) => [w.x, w.y, w.z]);
    T.step(150);
    const after = RocketExt.st.workers.map((w) => [w.x, w.y, w.z]);
    const moved = before.filter((b, i) => Math.hypot(b[0] - after[i][0], b[1] - after[i][1], b[2] - after[i][2]) > 4).length;
    const climber = RocketExt.st.workers.find((w) => w.role === 'climb'); T.until(() => climber.z > 40, 600);
    const welding = RocketExt.st.workers.some((w) => w.weld) ? (T.step(10), RocketExt.st.sparks.length) : -1;
    T.tp(A.x, A.y, 'islands'); T.step(2);
    const label = T.label(), hint = T.hint();
    T.act(); const line1 = RocketExt.st.ask && RocketExt.st.ask.line, who = !!(RocketExt.st.ask && RocketExt.st.ask.who);
    const floats = []; for (let i = 0; i < 200; i++) { T.step(1); for (const f of Game.floats) if (!floats.includes(f.text)) floats.push(f.text); }
    T.act(); const line2 = RocketExt.st.ask && RocketExt.st.ask.line;
    return { far, moved, climbed: climber.z, welding, label, hint, line1, who, floats, line2, sparks: RocketExt.st.sparks.length };
  });
  t.expectEq(rk.far, 'A real rocket! 🚀', 'the rocket hint near the pad');
  t.expect(rk.moved >= 2, `the workers walk and climb (${rk.moved} moved)`);
  t.expect(rk.climbed > 40, 'a worker climbed the scaffold ladder');
  t.expect(rk.welding !== 0, 'welding throws sparks');
  t.expectEq(rk.label, '🚀 Ask about the rocket', 'ask label in front of the rocket');
  t.expectEq(rk.hint, 'Ask the workers about the rocket! 🚀', 'ask hint in front of the rocket');
  t.expect(rk.line1 === 'Almost ready!' && rk.who, 'a worker answers in a bubble');
  t.expect(rk.floats.includes('3…') && rk.floats.includes('1…') && rk.floats.includes('🚧 Not yet! Coming soon!'), `the countdown float runs and nothing launches: ${JSON.stringify(rk.floats)}`);
  t.expectEq(rk.line2, 'Blast-off soon!', 'the next answer is a different line');
  t.expect(await t.ev(() => Game.area === 'islands' && !Game.travel), 'no new place to travel to: still on the Islands');
  const wave = await t.ev(() => { const b = RocketExt.st.workers.find((w) => w.role === 'boss'); b.waveCd = 0; T.tp(b.x + 40, b.y + 30, 'islands'); T.step(2); return b.wave > 0; });
  t.expect(wave, 'a worker waves when the chef walks by');
  await t.ev(() => { const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x - 60, A.y + 20, 'islands'); T.step(40); });
  await t.shot('rocket');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const A = CFG.ISLANDS.ROCKET.ASK; T.tp(A.x - 20, A.y, 'islands'); T.step(30); });
  await t.shot('rocket-phone');
  await t.ev(() => { const P = CFG.ISLANDS.SUNNY.PLAYERS[0]; T.tp(P.x + 24, P.y + 40, 'islands'); T.step(30); });
  await t.shot('sunny-phone');
  await t.ev(() => { T.tp(3550, 2730, 'islands'); T.step(30); });
  await t.shot('cove-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- the interiors, one by one
  const doors = await t.ev(() => CFG.ISLE_IN.DOORS.map((d) => ({ room: d.room, x: d.x, y: d.y, text: d.text })));
  t.expectEq(doors.length, 5, 'five doors on the Islands (lighthouse tower and cottage, crab shack, coconut hut, mission control)');
  const doorCheck = async (i) => t.ev((i) => {
    const d = CFG.ISLE_IN.DOORS[i], R = CFG.ISLE_IN.ROOMS[d.room];
    T.tp(d.x, d.y + 50, 'islands'); T.step(2);
    const farHint = T.hint(), farTarget = Game.hint && Game.hint.target, farLabel = T.label();
    T.tp(d.x, d.y, 'islands'); T.step(2);
    const free = !Game.obstacles().some((o) => Game.hitRect(d.x, d.y, 12, o));
    const label = T.label(), atHint = T.hint();
    T.act(); T.step(30);
    const W = R.WORLD, h = Game.hint, inWorld = (q) => q.x >= W.x0 && q.x <= W.x1 && q.y >= W.y0 && q.y <= W.y1;
    return {
      farHint, farTarget: !!farTarget && farTarget.x === d.x && farTarget.y === d.y, farLabel, free, label, atHint,
      area: Game.area, onMat: Math.hypot(Game.player.x - R.EXIT.x, Game.player.y - (R.EXIT.y - 8)) < 2, floor: IslandsInsideExt.free(Game, Game.player.x, Game.player.y),
      hintOk: !h || !h.target || inWorld(h.target), hint: h && h.text, toast: T.toasts.includes(R.toast),
    };
  }, i);
  const goOut = async (i) => t.ev((i) => {
    const d = CFG.ISLE_IN.DOORS[i], R = CFG.ISLE_IN.ROOMS[d.room];
    T.tp(R.EXIT.x, R.EXIT.y, d.room); T.step(1);
    const label = T.label(); T.act(); T.step(30);
    return { label, area: Game.area, atDoor: Math.hypot(Game.player.x - d.x, Game.player.y - d.y) < 2, again: T.label() };
  }, i);
  const rescueHome = async (room) => t.ev((room) => {
    const R = CFG.ISLE_IN.ROOMS[room], A = R.ROOM;
    T.tp(A.x0 - 8, (A.y0 + A.y1) / 2, room); T.step(3);
    const rescued = IslandsInsideExt.free(Game, Game.player.x, Game.player.y) && Math.hypot(Game.player.x - R.EXIT.x, Game.player.y - (R.EXIT.y - 8)) < 2;
    return { rescued };
  }, room);
  const checkDoor = (i, r) => {
    const d = doors[i];
    t.expectEq(r.farHint, d.text, `${d.room} door hint near door ${i}`);
    t.expect(r.farTarget, `the ${d.room} hint arrow points at the door`);
    t.expect(r.farLabel !== '🚪 Go inside', `no door button away from the ${d.room} door`);
    t.expect(r.free, `the ${d.room} door spot is free ground`);
    t.expectEq(r.label, '🚪 Go inside', `door label at the ${d.room} door`);
    t.expectEq(r.area, d.room, `inside the ${d.room}`);
    t.expect(r.onMat && r.floor, `arrived on the mat inside the ${d.room}`);
    t.expect(r.hintOk, `the ${d.room} hint points at something inside (${r.hint})`);
    t.expect(r.toast, `the ${d.room} welcome toast`);
  };

  // -- the lighthouse: the keeper, the cat, the spiral stairs, the lamp room and its telescope
  const lh = await doorCheck(0); checkDoor(0, lh);
  t.expectEq(lh.hint, 'Say hi to the lighthouse keeper! 👋', 'first lighthouse hint');
  await t.shot('lighthouse');
  const keeper = await t.ev(() => {
    const R = CFG.ISLE_IN.ROOMS.lighthouse, K = R.KEEPER; T.tp(K.x - 40, K.y + 34, 'lighthouse'); T.step(2);
    const label = T.label(); T.act(); T.step(5);
    const line = IslandsInsideExt.st.keeper && IslandsInsideExt.st.keeper.line;
    const c = IslandsInsideExt.st.cat; T.tp(c.x - 30, c.y + 10, 'lighthouse'); T.step(2);
    const catLabel = T.label(); T.act(); T.step(5);
    return { label, line, catLabel, purr: IslandsInsideExt.st.cat.purr > 0, pets: Game.s.isleIn.pets };
  });
  t.expectEq(keeper.label, '👋 Say hi to the keeper', 'say-hi label by the keeper');
  t.expectEq(keeper.line, 'Ahoy, chef! ⚓', 'the keeper says ahoy');
  t.expectEq(keeper.catLabel, '🐱 Pet the cat', 'pet label by the cat');
  t.expect(keeper.purr && keeper.pets === 1, 'the cat purrs');
  const climb = await t.ev(() => {
    const R = CFG.ISLE_IN.ROOMS.lighthouse; T.tp(R.FOOT.x, R.FOOT.y, 'lighthouse'); T.step(2);
    const label = T.label(), hint = T.hint(); T.act(); T.step(10);
    const climbing = !!IslandsInsideExt.st.climb, during = T.label();
    T.steer(1, 0); T.step(10); T.unsteer(); const held = Math.hypot(Game.player.x - R.FOOT.x, Game.player.y - R.FOOT.y) < 2;
    return { label, hint, climbing, during, held };
  });
  t.expectEq(climb.label, '🪜 Climb the stairs', 'climb label at the foot of the stairs');
  t.expectEq(climb.hint, 'Climb the stairs to the lamp! 🪜', 'climb hint at the stairs');
  t.expect(climb.climbing && climb.during === null && climb.held, 'climbing: no button, the chef stays on the stairs');
  await t.shot('lighthouse-climb');
  const top = await t.ev(() => {
    T.until(() => !IslandsInsideExt.st.climb, 200); T.step(2);
    const R = CFG.ISLE_IN.ROOMS.lighthouse;
    const up = IslandsInsideExt.st.up, floats = Game.floats.map((f) => f.text), hint = T.hint(), downLabel = T.label();
    const lampSolid = Game.obstacles().some((o) => Game.hitRect(R.LAMP.x, R.LAMP.y - 20, 12, o));
    T.tp(R.SCOPE.x - 6, R.SCOPE.y + 30, 'lighthouse'); T.step(2);
    const scopeLabel = T.label(); T.act(); T.step(30);
    const viewing = !!IslandsInsideExt.st.viewing, viewLabel = T.label();
    T.steer(1, 0); T.step(40); T.unsteer();
    const panned = IslandsInsideExt.st.viewing.f > 0.44, stayed = Math.hypot(Game.player.x - (R.SCOPE.x - 6), Game.player.y - (R.SCOPE.y + 30)) < 2;
    return { up, floats, hint, downLabel, lampSolid, scopeLabel, viewing, viewLabel, panned, stayed, looks: Game.s.isleIn.looks };
  });
  t.expect(top.up && top.floats.includes('The lamp room! 💡'), 'up in the lamp room');
  t.expectEq(top.hint, 'Look out to sea with the telescope! 🔭', 'telescope hint in the lamp room');
  t.expectEq(top.downLabel, '🪜 Go down the stairs', 'the stairs lead back down');
  t.expect(top.lampSolid, 'the big lamp stands on a solid pedestal');
  t.expectEq(top.scopeLabel, '🔭 Look through the telescope', 'telescope label');
  t.expect(top.viewing && top.viewLabel === '🚶 Done looking' && top.looks === 1, 'looking through the telescope');
  t.expect(top.panned && top.stayed, 'the stick pans the view and the chef stays at the eyepiece');
  await t.ev(() => { IslandsInsideExt.st.viewing.f = 0.64; IslandsInsideExt.st.viewing.vel = 0; T.step(40); });
  await t.shot('lighthouse-telescope');
  const down = await t.ev(() => {
    T.act(); const off = !IslandsInsideExt.st.viewing;
    const R = CFG.ISLE_IN.ROOMS.lighthouse; T.tp(R.LAMP.x + 80, R.LAMP.y + 60, 'lighthouse'); T.step(20);
    return { off };
  });
  t.expect(down.off, 'done looking');
  await t.shot('lamproom');
  const lhRescue = await t.ev(() => {
    const R = CFG.ISLE_IN.ROOMS.lighthouse; T.tp(R.LAMP.x, R.LAMP.y - 20, 'lighthouse'); T.step(3);
    const rescued = IslandsInsideExt.free(Game, Game.player.x, Game.player.y) && Math.hypot(Game.player.x - R.FOOT.x, Game.player.y - R.FOOT.y) < 2;
    T.tp(R.FOOT.x, R.FOOT.y, 'lighthouse'); T.act(); T.until(() => !IslandsInsideExt.st.climb, 200); T.step(2);
    return { rescued, up: IslandsInsideExt.st.up, hasExit: Math.hypot(Game.player.x - R.FOOT.x, Game.player.y - R.FOOT.y) < 2 };
  });
  t.expect(lhRescue.rescued, 'pushed into the lamp: rescued onto the stair top');
  t.expect(!lhRescue.up && lhRescue.hasExit, 'back down the stairs on the ground floor');
  t.expect((await rescueHome('lighthouse')).rescued, 'lighthouse: pushed into the wall, rescued onto the mat');
  const lhOut = await goOut(0);
  t.expect(lhOut.label === '🚪 Go outside' && lhOut.area === 'islands' && lhOut.atDoor && lhOut.again === '🚪 Go inside', `out of the lighthouse at the tower door ${JSON.stringify(lhOut)}`);
  // the keeper's cottage door leads into the same lighthouse, and back out to the cottage
  const cot = await doorCheck(1);
  t.expectEq(cot.label, '🚪 Go inside', 'the keeper’s cottage has a door too');
  t.expectEq(cot.area, 'lighthouse', 'the cottage door opens into the lighthouse');
  const cotOut = await goOut(1);
  t.expect(cotOut.area === 'islands' && cotOut.atDoor, 'out again at the cottage door');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🗼 Welcome to the lighthouse!').length === 1), 'the lighthouse welcome toast shows only once');

  // -- the crab shack: wave at the crabs, a crab cookie, the jukebox
  const cr = await doorCheck(2); checkDoor(2, cr);
  const crab = await t.ev(() => {
    const R = CFG.ISLE_IN.ROOMS.crabshack, out = {};
    T.tp(R.TANK_SPOT.x, R.TANK_SPOT.y, 'crabshack'); T.step(2); out.tankLabel = T.label(); T.act(); out.wave = IslandsInsideExt.st.tankWave > 0;
    Game.s.cash = 10; T.tp(R.PAD.x, R.PAD.y, 'crabshack'); out.hint = T.hint(); out.n = T.until(() => IslandsExt.rt.treat && IslandsExt.rt.treat.kind === 'cookie', 400); out.cash = Game.s.cash; out.fry = IslandsInsideExt.st.cook.fry > 0;
    T.tp(R.JUKE_SPOT.x, R.JUKE_SPOT.y, 'crabshack'); T.step(2); out.jukeLabel = T.label(); T.act(); T.step(40); out.juke = IslandsInsideExt.st.juke > 0; out.notes = IslandsInsideExt.st.notes.length; out.jukeHint = T.hint();
    return out;
  });
  t.expectEq(crab.tankLabel, '🦀 Wave at the crabs', 'tank label');
  t.expect(crab.wave, 'the crabs wave back');
  t.expectEq(crab.hint, 'Buy a crab cookie! 🦀🍪', 'cookie hint');
  t.expect(crab.n >= 0 && crab.cash === 6 && crab.fry, `the $4 circle sold a crab cookie (cash ${crab.cash})`);
  t.expectEq(crab.jukeLabel, '🎵 Play the jukebox', 'jukebox label');
  t.expect(crab.juke && crab.notes > 0, 'the jukebox plays and notes float up');
  t.expectEq(crab.jukeHint, 'Dance to the music! 🎵', 'jukebox hint');
  await t.ev(() => { const R = CFG.ISLE_IN.ROOMS.crabshack; T.tp(R.PAD.x - 60, R.PAD.y + 20, 'crabshack'); T.step(10); });
  await t.shot('crabshack');
  t.expect((await rescueHome('crabshack')).rescued, 'crab shack: pushed into the wall, rescued onto the mat');
  const crOut = await goOut(2);
  t.expect(crOut.area === 'islands' && crOut.atDoor, 'out of the Crab Shack at its door');

  // -- the coconut hut: a hammock, the ukulele, a coconut drink
  const co = await doorCheck(3); checkDoor(3, co);
  t.expectEq(co.hint, 'Lie in a hammock! 🌴', 'first coconut hut hint');
  const coco = await t.ev(() => {
    const R = CFG.ISLE_IN.ROOMS.coconuthut, h = R.HAMMOCKS[0], out = {};
    T.tp(h.x, h.y + 28, 'coconuthut'); T.step(2); out.lieLabel = T.label(); T.act(); T.step(80);
    out.lying = !!IslandsInsideExt.st.lie; out.getUp = T.label(); out.hint = T.hint();
    T.steer(0, 1); T.step(30); T.unsteer(); out.stayed = Math.abs(Game.player.y - (h.y + 6)) < 1 && Math.abs(Game.player.x - h.x) < 6;
    out.z = Game.floats.some((f) => f.text === 'z');
    T.act(); out.up = !IslandsInsideExt.st.lie && Math.hypot(Game.player.x - h.x, Game.player.y - (h.y + 28)) < 2;
    T.tp(R.UKE_SPOT.x, R.UKE_SPOT.y, 'coconuthut'); T.step(2); out.ukeLabel = T.label(); T.act(); out.strum = IslandsInsideExt.st.strumN; T.act(); out.strum2 = IslandsInsideExt.st.strumN;
    Game.s.cash = 10; T.tp(R.PAD.x, R.PAD.y, 'coconuthut'); out.n = T.until(() => IslandsExt.rt.treat && IslandsExt.rt.treat.kind === 'coconut', 400); out.cash = Game.s.cash;
    return out;
  });
  t.expectEq(coco.lieLabel, '🌴 Lie in the hammock', 'hammock label');
  t.expect(coco.lying && coco.getUp === '🚶 Get up', 'lying in the hammock');
  t.expect(coco.stayed && coco.z, 'the hammock sways with the chef in it, Zzz');
  t.expect(coco.up, 'got up beside the hammock');
  t.expectEq(coco.ukeLabel, '🎶 Play the ukulele', 'ukulele label');
  t.expect(coco.strum === 1 && coco.strum2 === 2, 'the ukulele plays a chord each press');
  t.expect(coco.n >= 0 && coco.cash === 7, 'the $3 circle sold a coconut drink');
  await t.ev(() => { const R = CFG.ISLE_IN.ROOMS.coconuthut, h = R.HAMMOCKS[1]; T.tp(h.x, h.y + 28, 'coconuthut'); T.act(); T.step(60); });
  await t.shot('coconuthut');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect((await rescueHome('coconuthut')).rescued, 'coconut hut: pushed into the wall, rescued onto the mat');
  const coOut = await goOut(3);
  t.expect(coOut.area === 'islands' && coOut.atDoor, 'out of the Coconut Hut at its door');

  // -- mission control: the big red button counts down… not yet
  const mc = await doorCheck(4); checkDoor(4, mc);
  const btn = await t.ev(() => {
    const R = CFG.ISLE_IN.ROOMS.missionctl; T.tp(R.BTN_SPOT.x, R.BTN_SPOT.y, 'missionctl'); T.step(2);
    const label = T.label(); T.act(); T.step(60);
    const counting = !!IslandsInsideExt.st.count, during = T.label(), hint = T.hint();
    const floats = []; for (let i = 0; i < 200; i++) { T.step(1); for (const f of Game.floats) if (!floats.includes(f.text)) floats.push(f.text); }
    return { label, counting, during, hint, floats, done: !IslandsInsideExt.st.count, again: T.label(), area: Game.area };
  });
  t.expectEq(btn.label, '🔴 Press the big red button', 'big red button label');
  t.expect(btn.counting && btn.during !== '🔴 Press the big red button' && btn.hint === 'Countdown! 🚀', 'the countdown runs on the big screen');
  t.expect(btn.floats.includes('Not yet! Coming soon! 🚧') && btn.done && btn.again === '🔴 Press the big red button', 'not yet: the button is ready again');
  t.expectEq(btn.area, 'missionctl', 'nothing launches');
  await t.ev(() => { const R = CFG.ISLE_IN.ROOMS.missionctl; T.tp(R.BTN_SPOT.x - 60, R.BTN_SPOT.y, 'missionctl'); IslandsInsideExt.pressButton(Game); T.step(30); });
  await t.shot('mission');
  await t.page.setViewportSize({ width: 390, height: 844 });
  for (const room of ['lighthouse', 'crabshack', 'coconuthut', 'missionctl']) {
    await t.ev((room) => { Render.resize(); const R = CFG.ISLE_IN.ROOMS[room]; T.tp(R.EXIT.x, R.EXIT.y - 60, room); T.step(20); }, room);
    await t.shot(room + '-phone');
  }
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });
  t.expect((await rescueHome('missionctl')).rescued, 'mission control: pushed into the wall, rescued onto the mat');
  const mcOut = await goOut(4);
  t.expect(mcOut.area === 'islands' && mcOut.atDoor, 'out of Mission Control at its door');

  // ---- a save made inside a wall, reloaded: rescued onto the mat
  await t.ev(() => { const R = CFG.ISLE_IN.ROOMS.crabshack; Game.area = 'crabshack'; Game.player.x = R.TANK.x0 + 20; Game.player.y = R.TANK.y0 + 20; Game.save(); });
  await t.reload();
  await loadNew();
  const reload = await t.ev(() => {
    // (while index.html does not list the new files yet, do what the core does at load with the saved spot)
    const pos = Game.s.pos; if (pos && Game.area !== pos.area && CFG.AREAS[pos.area]) { Game.area = pos.area; Game.player.x = pos.x; Game.player.y = pos.y; }
    T.step(3); const R = CFG.ISLE_IN.ROOMS.crabshack; return { area: Game.area, mat: Math.hypot(Game.player.x - R.EXIT.x, Game.player.y - (R.EXIT.y - 8)) < 2 }; });
  t.expect(reload.area === 'crabshack' && reload.mat, `a save inside the tank wakes up on the mat ${JSON.stringify(reload)}`);

  // ---- Take-me-home from inside clears everything
  const home = await t.ev(() => {
    const R = CFG.ISLE_IN.ROOMS.coconuthut, h = R.HAMMOCKS[0];
    T.tp(R.EXIT.x, R.EXIT.y - 8, 'coconuthut'); T.tp(h.x, h.y + 28, 'coconuthut'); T.act(); T.step(5);
    const lying = !!IslandsInsideExt.st.lie;
    Game.goHome(); T.step(2);
    const S = CFG.PLAYER_START;
    return { lying, area: Game.area, lie: IslandsInsideExt.st.lie, up: IslandsInsideExt.st.up, atStart: Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2, hint: IslandsInsideExt.hint(Game), rocketHint: RocketExt.hint(Game) };
  });
  t.expect(home.lying, 'lying in a hammock before going home');
  t.expect(home.area === 'town' && home.atStart && !home.lie && !home.up, 'Take-me-home from inside: back at the pizzeria, the hammock let go');
  t.expect(home.hint === undefined && home.rocketHint === undefined, 'no island hints in the town');
  const home2 = await t.ev(() => {
    const R = CFG.ISLE_IN.ROOMS.lighthouse; T.tp(R.FOOT.x, R.FOOT.y, 'lighthouse'); T.act(); T.until(() => !IslandsInsideExt.st.climb, 200);
    const up = IslandsInsideExt.st.up; Game.goHome(); T.step(2);
    return { up, after: IslandsInsideExt.st.up, area: Game.area };
  });
  t.expect(home2.up && !home2.after && home2.area === 'town', 'Take-me-home from the lamp room clears the top floor');

  // ---- the huts still order pizza, and delivering at the door still works
  const del = await t.ev(() => {
    const out = {};
    for (const key of ['crab', 'coconut', 'lighthouse']) {
      const h = IslandsExt.rt.huts.find((q) => q.key === key), d = CFG.ISLE_IN.DOORS.find((q) => q.hut === key);
      h.order = { want: 2, have: 0, t: 120 };
      T.tp(d.x, d.y, 'islands'); Game.player.carry = 2; Game.player.xferCd = 0;
      const cash = Game.s.cash, delivered = Game.s.stats.delivered;
      const n = T.until(() => !h.order, 300);
      out[key] = { n, paid: Game.s.cash > cash, count: Game.s.stats.delivered - delivered, carry: Game.player.carry, label: T.label() };
    }
    return out;
  });
  for (const [key, r] of Object.entries(del)) {
    t.expect(r.n >= 0 && r.paid && r.count === 1 && r.carry === 0, `${key}: the pizzas were delivered at the door ${JSON.stringify(r)}`);
    t.expectEq(r.label, '🚪 Go inside', `${key}: the door still offers going inside after the delivery`);
  }
  const hutHint = await t.ev(() => {
    const h = IslandsExt.rt.huts.find((q) => q.key === 'crab'), d = CFG.ISLE_IN.DOORS.find((q) => q.hut === 'crab');
    h.order = { want: 1, have: 0, t: 120 }; Game.player.carry = 0;
    T.tp(d.x, d.y + 50, 'islands'); Game.player.carry = 3; T.step(1);
    const withPizza = IslandsInsideExt.hint(Game);
    h.order = null; Game.player.carry = 0; T.step(1);
    return { withPizza };
  });
  t.expectEq(hutHint.withPizza, undefined, 'the door hint steps aside for a delivery');

  // ---- the ferry home still works from the island dock
  await t.ev(() => { const A = CFG.ISLANDS.ARRIVE; T.tp(A.x, A.y, 'islands'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '⛴️ Ferry home', 'ferry home label on the island dock');
  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
