'use strict';
// The playroom (js/playroom.js) behind the bedroom: its map in a free rectangle; the green door on the bedroom's north
// wall (its mat is free floor, reachable from the top of the stairs with and without every bedroom item bought, clear
// of the pizza room's door; button and hint, not while the bedroom is busy); going in (one toast) and back out to the same mat;
// a grid walk from the door mat reaches every toy; the big slide (climb the ladder, "Wheee!", whoosh down the twisty
// chute with the camera on the chef, into the ball pit, hop out); the ball pit; the trampoline; the toy train (one lap);
// the castle (crawl in, peekaboo, crawl out); the soft blocks (knock down, stack again); the slide out of the window to
// town (lands on free grass by the pizzeria); rescues; Take-me-home mid-slide and mid-town-slide; screenshots.
module.exports = async (t) => {
  // until the coordinator wires js/playroom.js into index.html, serve the page with it added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/playroom.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/playroom.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();
  const C = await t.ev(() => CFG.PLAYROOM);

  // ---- registered, in a free rectangle, ahead of the bedroom, the pizza room and the City
  const reg = await t.ev(() => {
    const W = CFG.PLAYROOM.WORLD, over = Object.keys(CFG.AREAS).filter((k) => k !== 'playroom').filter((k) => { const o = CFG.AREAS[k].WORLD; return o && o.x0 < W.x1 && o.x1 > W.x0 && o.y0 < W.y1 && o.y1 > W.y0; });
    return {
      ok: typeof PlayroomExt !== 'undefined' && Render.ext.includes(PlayroomExt),
      order: Game.ext.indexOf(PlayroomExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(PlayroomExt) < Game.ext.indexOf(UpstairsExt) && (typeof PizzaRainExt === 'undefined' || Game.ext.indexOf(PlayroomExt) < Game.ext.indexOf(PizzaRainExt)),
      over, place: CFG.AREAS.playroom.place, size: [W.x1 - W.x0, W.y1 - W.y0], save: Game.s.playroom && Game.s.playroom.seen === false,
      wm: typeof WorldMapExt === 'undefined' ? 'town' : WorldMapExt.placeOf('playroom'),
    };
  });
  t.expect(reg.ok, 'the playroom extension is registered in Game.ext and Render.ext');
  t.expect(reg.order, 'it answers before the bedroom, the pizza room and the City');
  t.expectEq(reg.over.join(','), '', 'the playroom map overlaps no other map');
  t.expectEq(reg.place, 'town', 'the playroom belongs to the town');
  t.expectEq(reg.wm, 'town', 'the world map puts the playroom in the town');
  t.expect(reg.save, 'a fresh save has not seen the playroom yet');

  // ---- the door in the bedroom: free floor, reachable from the stairs (with and without every bedroom item), clear of
  // the pizza room's door
  const mat = await t.ev(() => {
    const M = CFG.PLAYROOM.MAT_OUT, U2 = CFG.UPSTAIRS, out = {};
    const reach = () => {
      T.tp(U2.top.x, U2.top.y, 'upstairs');
      const obs = Game.obstacles(), hit = (x, y) => obs.some((o) => Game.hitRect(x, y, 12, o)), R = U2.room, st = 4, key = (x, y) => x + ',' + y;
      const sx = U2.top.x, sy = U2.top.y, seen = new Set([key(sx, sy)]), q = [[sx, sy]];
      while (q.length) {
        const [x, y] = q.pop();
        if (Math.abs(x - M.x) <= 4 && Math.abs(y - M.y) <= 4) return { free: !hit(M.x, M.y), reached: true };
        for (const [dx, dy] of [[st, 0], [-st, 0], [0, st], [0, -st]]) { const nx = x + dx, ny = y + dy; if (nx < R.x0 || nx > R.x1 || ny < R.y0 || ny > R.y1 || seen.has(key(nx, ny)) || hit(nx, ny)) continue; seen.add(key(nx, ny)); q.push([nx, ny]); }
      }
      return { free: !hit(M.x, M.y), reached: false };
    };
    out.bare = reach();
    for (const it of U2.items) Game.s.upstairs.owned[it.key] = true;
    out.full = reach();
    out.rain = typeof CFG.PIZZARAIN === 'undefined' ? 999 : Math.hypot(M.x - CFG.PIZZARAIN.MAT_OUT.x, M.y - CFG.PIZZARAIN.MAT_OUT.y);
    const D = CFG.PLAYROOM.DOOR_OUT; out.inWall = D.y1 === U2.room.y0 && D.x0 > U2.table.x1 && D.x1 < U2.wardrobe.x0;
    return out;
  });
  t.expect(mat.bare.free && mat.bare.reached, 'the bedroom mat is free floor, reachable from the top of the stairs');
  t.expect(mat.full.free && mat.full.reached, 'still reachable with every bedroom item bought');
  t.expect(mat.rain > 150, 'the mat is clear of the pizza room door');
  t.expect(mat.inWall, 'the door sits in the north wall between the bedside table and the wardrobe');

  await t.ev(() => { const M = CFG.PLAYROOM.MAT_OUT; T.tp(M.x, M.y, 'upstairs'); T.step(2); Render.setZoom && Render.setZoom(1.6); Game.cameraSnap = true; T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go to the playroom', 'door button on the mat');
  t.expectEq(await t.ev(() => T.hint()), 'A playroom! 🛝', 'door hint on the mat');
  await t.shot('bedroom-door');
  const far = await t.ev(() => {
    const M = CFG.PLAYROOM.MAT_OUT, out = {};
    T.tp(M.x + 20, M.y + 45, 'upstairs'); out.near = Game.hint && { text: Game.hint.text, target: !!Game.hint.target };
    T.tp(M.x + 40, M.y + 80, 'upstairs'); out.far = T.hint(); out.farLabel = T.label();
    const st = UpstairsExt.st; T.tp(M.x, M.y, 'upstairs');
    st.nap = { phase: 'sleep', t: 0 }; out.nap = [T.label(), PlayroomExt.hint(Game)]; st.nap = null;
    st.draw.on = true; out.drawOn = [T.label(), PlayroomExt.hint(Game)]; st.draw.on = false;
    return out;
  });
  t.expect(far.near && far.near.text === 'A playroom! 🛝' && far.near.target, 'walking up, the hint points at the door');
  t.expect(far.far !== 'A playroom! 🛝' && far.farLabel !== '🚪 Go to the playroom', 'no door hint or button 90 px away');
  t.expect(far.nap[0] !== '🚪 Go to the playroom' && !far.nap[1] && far.drawOn[0] !== '🚪 Go to the playroom' && !far.drawOn[1], 'no door while napping or drawing');

  // ---- go in
  const inside = await t.ev(() => { const M = CFG.PLAYROOM.MAT_OUT; T.tp(M.x, M.y, 'upstairs'); T.toasts.length = 0; T.act(); T.step(2); const E = CFG.PLAYROOM.EXIT; return { area: Game.area, d: Math.hypot(Game.player.x - E.x, Game.player.y - E.y), label: T.label(), hint: Game.hint && { text: Game.hint.text, target: Game.hint.target }, toasts: T.toasts.slice(), seen: Game.s.playroom.seen }; });
  t.expectEq(inside.area, 'playroom', 'through the door into the playroom');
  t.expect(inside.d < 1, 'standing on the mat inside the door');
  t.expectEq(inside.label, '🚪 Back to the bedroom', 'exit button on the mat');
  t.expect(inside.toasts.filter((m) => m === '🛝 A playroom with a giant slide!').length === 1 && inside.seen, 'one welcome toast');
  // ---- a grid walk from the mat reaches every toy, the window and the ladder
  const walk = await t.ev(() => {
    const C2 = CFG.PLAYROOM, E = C2.EXIT, R = C2.ROOM, obs = Game.obstacles(), hit = (x, y) => obs.some((o) => Game.hitRect(x, y, 12, o)), st = 6, key = (x, y) => x + ',' + y;
    const seen = new Set([key(E.x, E.y)]), q = [[E.x, E.y]];
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[st, 0], [-st, 0], [0, st], [0, -st]]) { const nx = x + dx, ny = y + dy; if (nx < R.x0 || nx > R.x1 || ny < R.y0 || ny > R.y1 || seen.has(key(nx, ny)) || hit(nx, ny)) continue; seen.add(key(nx, ny)); q.push([nx, ny]); } }
    const spots = { ladder: C2.LADDER, pit: C2.PIT.spot, tramp: C2.TRAMP.spot, castle: C2.CASTLE.spot, train: C2.TRAIN.spot, blocks: C2.BLOCKS.spot, window: C2.WINDOW.spot };
    const out = {};
    for (const [k, s] of Object.entries(spots)) { let ok = false; for (const v of seen) { const [x, y] = v.split(',').map(Number); if (Math.hypot(x - s.x, y - s.y) < 14) { ok = true; break; } } out[k] = { ok, free: !hit(s.x, s.y) }; }
    return { out, cells: seen.size };
  });
  for (const [k, v] of Object.entries(walk.out)) t.expect(v.ok && v.free, `the ${k} spot is free floor the chef can walk to from the door`);
  t.expect(walk.cells > 8000, `lots of room to run around (${walk.cells} cells)`);
  await t.ev(() => { T.tp(32100, 4500, 'playroom'); Render.setZoom && Render.setZoom(0.9); Game.cameraSnap = true; T.step(2); });
  await t.shot('room');

  // each spot's button and hint
  const labels = await t.ev(() => {
    const C2 = CFG.PLAYROOM, out = {};
    for (const [k, s] of Object.entries({ ladder: C2.LADDER, pit: C2.PIT.spot, tramp: C2.TRAMP.spot, castle: C2.CASTLE.spot, train: C2.TRAIN.spot, blocks: C2.BLOCKS.spot, window: C2.WINDOW.spot })) { T.tp(s.x, s.y, 'playroom'); out[k] = [T.label(), T.hint()]; }
    T.tp(32100, 4640, 'playroom'); out.open = Game.hint && { text: Game.hint.text, target: Game.hint.target };
    return out;
  });
  t.expectEq(labels.ladder[0], '🪜 Climb up', 'ladder button');
  t.expectEq(labels.pit[0], '🏊 Jump in the ball pit', 'ball pit button');
  t.expectEq(labels.tramp[0], '🤸 Bounce!', 'trampoline button');
  t.expectEq(labels.castle[0], '🏰 Crawl into the castle', 'castle button');
  t.expectEq(labels.train[0], '🚂 Ride the toy train', 'train button');
  t.expectEq(labels.blocks[0], '💥 Knock down the blocks', 'blocks button');
  t.expectEq(labels.window[0], '🛝 Slide down to town!', 'town slide button');
  for (const [k, v] of Object.entries(labels)) if (k !== 'open') t.expect(!!v[1], `a hint at the ${k}`);
  t.expect(labels.open && labels.open.text === 'Climb the big slide! 🛝' && labels.open.target && labels.open.target.x === C.LADDER.x, 'in the open, the hint points at the ladder');

  // ---- THE BIG SLIDE: climb, wheee, down the chute (the chef on it, the camera on the chef), splash, hop out
  const slide = await t.ev(() => {
    const C2 = CFG.PLAYROOM, L = C2.LADDER, p = Game.player, path = PlayroomExt.slidePath();
    T.tp(L.x, L.y, 'playroom'); Game.floats.length = 0; T.act();
    const out = { climb: [], slide: [], cam: 0, label: [] };
    T.until(() => PlayroomExt.st.ride.phase === 'climb', 60);
    let minY = p.y;
    T.until(() => { minY = Math.min(minY, p.y); out.climb.push(p.x); return PlayroomExt.st.ride.phase === 'slide'; }, 200);
    out.top = minY; out.wheee = Game.floats.some((f) => /Wheee/.test(f.text)); out.label.push(T.label());
    let off = 0, n = 0, prevX = p.x, prevY = p.y, moved = 0;
    T.until(() => {
      const r = PlayroomExt.st.ride; if (!r || r.phase !== 'slide') return true;
      // the chef is on the chute: the nearest point of its path is right under them
      let best = 1e9; for (let i = 1; i < path.vis.length; i++) { const a = path.vis[i - 1], b = path.vis[i], dx = b[0] - a[0], dy = b[1] - a[1], k = Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / (dx * dx + dy * dy || 1))); best = Math.min(best, Math.hypot(a[0] + dx * k - p.x, a[1] + dy * k - p.y)); }
      off = Math.max(off, best); n++; moved += Math.hypot(p.x - prevX, p.y - prevY); prevX = p.x; prevY = p.y;
      return false;
    }, 400);
    out.off = off; out.frames = n; out.moved = moved; out.total = path.total;
    out.splash = Game.floats.some((f) => /Splash/.test(f.text)); out.balls = PlayroomExt.st.balls.length; out.phase = PlayroomExt.st.ride && PlayroomExt.st.ride.phase;
    const P = C2.PIT; out.inPit = p.x > P.x0 && p.x < P.x1 && p.y > P.y0 && p.y < P.y1;
    out.slides = Game.s.playroom.slides;
    return out;
  });
  t.expect(slide.top < C.TOWER.y1 - C.TOWER.h, `the chef climbs the ladder to the platform (y ${slide.top.toFixed(0)})`);
  t.expect(slide.climb.every((x) => Math.abs(x - C.LADDER.x) < 50), 'climbing straight up the ladder');
  t.expect(slide.wheee, '"Wheee!" at the top');
  t.expect(slide.frames > 100 && slide.moved > slide.total * 0.95, `a long ride down the twisty chute (${slide.frames} frames, ${slide.moved.toFixed(0)} of ${slide.total.toFixed(0)} px)`);
  t.expect(slide.off < 1.5, `the chef stays on the chute all the way (max ${slide.off.toFixed(2)} px off)`);
  t.expect(slide.splash && slide.balls > 5 && slide.inPit && slide.phase === 'sink', 'splash into the ball pit, balls flying');
  t.expectEq(slide.slides, 1, 'one slide counted');
  await t.shot('ball-pit-landing');
  const slideOut = await t.ev(() => { T.until(() => !PlayroomExt.st.ride, 300); const S = CFG.PLAYROOM.PIT.spot; return { d: Math.hypot(Game.player.x - S.x, Game.player.y - S.y), hint: T.hint() }; });
  t.expect(slideOut.d < 1, 'hops out of the pit onto its front edge');
  t.expect(slideOut.hint !== 'Climb the big slide! 🛝', 'the slide hint stops nagging after a ride');
  // a mid-slide screenshot
  await t.ev(() => { const L = CFG.PLAYROOM.LADDER; T.tp(L.x, L.y, 'playroom'); T.act(); T.until(() => PlayroomExt.st.ride.phase === 'slide', 200); T.step(70); });
  await t.shot('sliding');
  // the camera follows the chef down (the page's own frames ran while the screenshot was taken): the chef is well inside the view
  const cam = await t.ev(() => { const p = Game.player, k = [(p.x - Render.camX) / Render.viewW, (p.y - Render.camY) / Render.viewH]; return { k, riding: !!PlayroomExt.st.ride }; });
  t.expect(cam.k[0] > 0.25 && cam.k[0] < 0.75 && cam.k[1] > 0.2 && cam.k[1] < 0.8, `the camera follows the chef down the slide (${cam.k.map((v) => v.toFixed(2))})`);
  await t.ev(() => T.until(() => !PlayroomExt.st.ride, 400));

  // ---- the ball pit
  const pit = await t.ev(() => {
    const P = CFG.PLAYROOM.PIT; T.tp(P.spot.x, P.spot.y, 'playroom'); Game.floats.length = 0; T.act(); T.until(() => PlayroomExt.st.ride.phase === 'in', 120);
    const o = { x: Game.player.x, y: Game.player.y, balls: PlayroomExt.st.balls.length, float: Game.floats.some((f) => /Sploosh/.test(f.text)), label: T.label() };
    return o;
  });
  t.expect(pit.y > C.PIT.y0 && pit.y < C.PIT.y1 && pit.balls > 5 && pit.float, 'jumps into the balls with a splash');
  t.expect(pit.label === null, 'nothing to press while splashing');
  await t.shot('in-the-pit');
  t.expect(await t.ev(() => { T.until(() => !PlayroomExt.st.ride, 300); const S = CFG.PLAYROOM.PIT.spot; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 1; }), 'and hops back out');

  // ---- the trampoline
  const tramp = await t.ev(() => {
    const M = CFG.PLAYROOM.TRAMP; T.tp(M.spot.x, M.spot.y, 'playroom'); Game.floats.length = 0; T.act();
    let top = 1e9; const seen = new Set(); T.until(() => { top = Math.min(top, Game.player.y); for (const f of Game.floats) if (/Boing/.test(f.text)) seen.add(f); return !PlayroomExt.st.ride; }, 600);
    const boings = seen.size;
    return { high: M.y - top, boings, back: Math.hypot(Game.player.x - M.spot.x, Game.player.y - M.spot.y) };
  });
  t.expect(tramp.high > 90, `bounces up high (${tramp.high.toFixed(0)} px)`);
  t.expectEq(tramp.boings, C.TRAMP.bounces.length, 'a "Boing!" for every bounce');
  t.expect(tramp.back < 1, 'hops off in front of the trampoline');
  await t.ev(() => { const M = CFG.PLAYROOM.TRAMP; T.tp(M.spot.x, M.spot.y, 'playroom'); T.act(); T.until(() => PlayroomExt.st.ride.phase === 'bounce' && PlayroomExt.st.ride.n === 3 && PlayroomExt.st.ride.h > 90, 400); });
  await t.shot('trampoline');
  await t.ev(() => T.until(() => !PlayroomExt.st.ride, 400));

  // ---- the toy train: one lap round the track, the chef in the cab
  const train = await t.ev(() => {
    const T2 = CFG.PLAYROOM.TRAIN; T.tp(T2.spot.x, T2.spot.y, 'playroom'); T.act();
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, onTrack = true;
    T.until(() => PlayroomExt.st.ride.phase === 'ride', 60);
    T.until(() => { const r = PlayroomExt.st.ride; if (!r || r.phase !== 'ride') return true; const p = Game.player; minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); const c = PlayroomExt.cabPos(PlayroomExt.st.trainA); if (Math.hypot(c.x - p.x, c.y - p.y) > 0.5) onTrack = false; return false; }, 800);
    T.until(() => !PlayroomExt.st.ride, 100);
    return { w: maxX - minX, h: maxY - minY, onTrack, back: Math.hypot(Game.player.x - T2.spot.x, Game.player.y - T2.spot.y), parked: Math.abs(PlayroomExt.st.trainA - T2.a0) < 1e-6 };
  });
  t.expect(train.w > 380 && train.h > 100 && train.onTrack, `rides a whole lap in the cab (${train.w.toFixed(0)} × ${train.h.toFixed(0)} px)`);
  t.expect(train.back < 1 && train.parked, 'the train parks again and the chef hops off');
  await t.ev(() => { const T2 = CFG.PLAYROOM.TRAIN; T.tp(T2.spot.x, T2.spot.y, 'playroom'); T.act(); T.step(200); Render.setZoom && Render.setZoom(1.3); Game.cameraSnap = true; });
  await t.shot('train');
  await t.ev(() => T.until(() => !PlayroomExt.st.ride, 800));

  // ---- the castle: crawl in, peekaboo, crawl out
  const castle = await t.ev(() => {
    const K = CFG.PLAYROOM.CASTLE; T.tp(K.spot.x, K.spot.y, 'playroom'); T.act(); T.step(60);
    const o = { x: Game.player.x, y: Game.player.y, label: T.label(), hint: T.hint() };
    T.steer(1, 0); T.step(30); T.unsteer(); o.pinned = Game.player.x === K.inside.x && Game.player.y === K.inside.y;
    return o;
  });
  t.expect(castle.y > C.CASTLE.y0 && castle.y < C.CASTLE.y1, 'inside the castle');
  t.expectEq(castle.label, '🚶 Crawl out', 'the button inside the castle');
  t.expectEq(castle.hint, 'Peekaboo! 👀', 'peekaboo');
  t.expect(castle.pinned, 'stays inside until crawling out');
  await t.shot('castle');
  t.expect(await t.ev(() => { T.act(); T.until(() => !PlayroomExt.st.ride, 120); const S = CFG.PLAYROOM.CASTLE.spot; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 1; }), 'crawls back out in front of the door');

  // ---- the soft blocks
  const blocks = await t.ev(() => {
    const B = CFG.PLAYROOM.BLOCKS; T.tp(B.spot.x, B.spot.y, 'playroom'); T.act(); const mid = T.label(); T.step(80);
    const st = PlayroomExt.st.blocks, down = st.pieces.every((q) => q.h === 0), l2 = T.label();
    T.act(); T.step(90); const up = st.pieces.map((q, i) => { const h = PlayroomExt.blockHome(i); return Math.abs(q.x - h.x) + Math.abs(q.h - h.h) < 0.5; }).every(Boolean);
    return { mid, down, l2, up, l3: T.label() };
  });
  t.expect(blocks.mid === null && blocks.down, 'the blocks tumble onto the floor');
  t.expectEq(blocks.l2, '🧱 Stack the blocks', 'then they can be stacked again');
  t.expect(blocks.up && blocks.l3 === '💥 Knock down the blocks', 'stacked back into a tower');

  // ---- rescues: in a wall, in the pit, in the castle → the door mat
  const rescue = await t.ev(() => {
    const E = CFG.PLAYROOM.EXIT, out = [];
    for (const [x, y] of [[CFG.PLAYROOM.ROOM.x0 - 10, 4400], [32300, 4470], [31760, 4600], [32000, 4290], [32200, 4300]]) { T.tp(x, y, 'playroom'); T.step(2); out.push(Math.hypot(Game.player.x - E.x, Game.player.y - E.y) < 1); }
    return out;
  });
  t.expect(rescue.every(Boolean), `stuck in a wall or a toy, the chef lands on the door mat (${rescue})`);

  // ---- back out through the door to the same mat
  const out = await t.ev(() => { const E = CFG.PLAYROOM.EXIT; T.tp(E.x, E.y, 'playroom'); T.act(); T.step(2); const M = CFG.PLAYROOM.MAT_OUT; return { area: Game.area, d: Math.hypot(Game.player.x - M.x, Game.player.y - M.y), label: T.label() }; });
  t.expectEq(out.area, 'upstairs', 'back in the bedroom');
  t.expect(out.d < 1, 'on the mat in front of the playroom door');
  t.expectEq(out.label, '🚪 Go to the playroom', 'and the door is right there again');

  // ---- the slide down to town: out of the window, down the chute on the pizzeria's wall, onto free grass
  await t.ev(() => { const M = CFG.PLAYROOM.MAT_OUT; T.tp(M.x, M.y, 'upstairs'); T.act(); T.step(2); });
  const town = await t.ev(() => {
    const W = CFG.PLAYROOM.WINDOW; T.tp(W.spot.x, W.spot.y, 'playroom'); Game.floats.length = 0; T.act();
    T.until(() => Game.area === 'town', 120);
    const o = { area: Game.area, hint: T.hint(), path: [] };
    const path = PlayroomExt.townPath(), p = Game.player;
    let off = 0;
    T.until(() => { const r = PlayroomExt.st.ride; if (!r) return true; o.path.push([p.x, p.y]); let best = 1e9; for (let i = 1; i < path.vis.length; i++) { const a = path.vis[i - 1], b = path.vis[i], dx = b[0] - a[0], dy = b[1] - a[1], k = Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / (dx * dx + dy * dy || 1))); best = Math.min(best, Math.hypot(a[0] + dx * k - p.x, a[1] + dy * k - p.y)); } off = Math.max(off, best); return false; }, 300);
    o.off = off; o.n = o.path.length; o.path = null;
    const L = PlayroomExt.townLand(), obs = Game.obstacles();
    o.land = { d: Math.hypot(p.x - L.x, p.y - L.y), free: !obs.some((q) => Game.hitRect(L.x, L.y, 12, q)), outside: !Game.insideBuilding(L.x, L.y), area: Game.area };
    o.hooray = Game.floats.some((f) => /Hooray/.test(f.text)); o.count = Game.s.playroom.town;
    // and the chef can walk off the mat in every direction
    const moves = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { T.tp(L.x, L.y, 'town'); T.steer(dx, dy); T.step(12); T.unsteer(); moves.push(Math.hypot(p.x - L.x, p.y - L.y) > 20); }
    o.moves = moves;
    return o;
  });
  t.expectEq(town.area, 'town', 'out of the window and into town');
  t.expectEq(town.hint, 'Wheee! 🛝', 'wheee on the way down');
  t.expect(town.n > 60 && town.off < 1.5, `slides down the whole chute (${town.n} frames, max ${town.off.toFixed(2)} px off)`);
  t.expect(town.land.d < 1 && town.land.area === 'town' && town.land.free && town.land.outside, 'lands on the mat on free ground outside the pizzeria');
  t.expect(town.hooray && town.count === 1, 'hooray, and counted');
  t.expect(town.moves.every(Boolean), 'and can walk off in every direction');
  await t.ev(() => { const L = PlayroomExt.townLand(); T.tp(L.x + 40, L.y - 60, 'town'); Render.setZoom && Render.setZoom(1.2); Game.cameraSnap = true; T.step(30); });
  await t.shot('town-chute');
  await t.ev(() => { const W = CFG.PLAYROOM.WINDOW; T.tp(W.spot.x, W.spot.y, 'playroom'); T.act(); T.until(() => Game.area === 'town', 120); T.step(6); });
  await t.shot('town-sliding');
  await t.ev(() => T.until(() => !PlayroomExt.st.ride, 300));

  // ---- Take me home mid-slide (in the playroom) and mid-town-slide
  const home = await t.ev(() => {
    const out = {};
    const L = CFG.PLAYROOM.LADDER; T.tp(L.x, L.y, 'playroom'); T.act(); T.until(() => PlayroomExt.st.ride.phase === 'slide', 200); T.step(20);
    Game.goHome(); T.step(30);
    out.a = { area: Game.area, ride: PlayroomExt.st.ride, x: Game.player.x, y: Game.player.y, inShop: Game.insideBuilding(Game.player.x, Game.player.y) };
    const W = CFG.PLAYROOM.WINDOW; T.tp(W.spot.x, W.spot.y, 'playroom'); T.act(); T.until(() => Game.area === 'town', 120); T.step(20);
    Game.goHome(); T.step(30);
    out.b = { area: Game.area, ride: PlayroomExt.st.ride, x: Game.player.x, y: Game.player.y };
    const C2 = CFG.PLAYROOM.CASTLE; T.tp(C2.spot.x, C2.spot.y, 'playroom'); T.act(); T.step(60); Game.goHome(); T.step(10);
    out.c = { area: Game.area, ride: PlayroomExt.st.ride };
    T.steer(1, 0); T.step(10); T.unsteer(); out.c.moves = Game.player.x > CFG.PLAYER_START.x;
    return out;
  });
  t.expect(home.a.area === 'town' && home.a.ride === null && home.a.x === 540 && home.a.inShop, 'Take me home mid-slide: back in the shop, the ride cleared');
  t.expect(home.b.area === 'town' && home.b.ride === null && home.b.x === 540, 'Take me home mid-town-slide: back in the shop');
  t.expect(home.c.area === 'town' && home.c.ride === null && home.c.moves, 'Take me home from the castle: free to walk');

  // ---- phone screenshots
  await t.boot({ viewport: { width: 390, height: 844 }, fresh: false });
  await t.ev(() => { const M = CFG.PLAYROOM.MAT_OUT; T.tp(M.x, M.y + 10, 'upstairs'); T.step(2); });
  await t.shot('phone-bedroom');
  await t.ev(() => { const L = CFG.PLAYROOM.LADDER; T.tp(L.x, L.y, 'playroom'); T.act(); T.until(() => PlayroomExt.st.ride.phase === 'slide', 200); T.step(50); });
  await t.shot('phone-sliding');
  await t.ev(() => { T.until(() => !PlayroomExt.st.ride, 400); T.tp(31760, 4480, 'playroom'); T.step(5); });
  await t.shot('phone-room');
};
