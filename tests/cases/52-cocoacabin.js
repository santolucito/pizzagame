'use strict';
// The Cocoa Cabin on Snowy Peak (js/cocoacabin.js): the door spot below the cabin's door (free snow, label, hint within
// 70 px only), going inside (mat, welcome toast once), a free hot cocoa from the cocoa maker that counts as Snowy Peak's
// own cup (and is still carried outside), marshmallows plopped into the cup (or eaten), warming up in the armchair by
// the crackling fire (walk off or press Stand up), the Pizza Coin by the woodpile, rescues from walls and furniture,
// Take-me-home, not offering the door while sledding, and going back out to the door.
module.exports = async (t) => {
  // until the coordinator wires js/cocoacabin.js into index.html, serve the page with it added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/cocoacabin.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/cocoacabin.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();

  // ---- registered: the map in its free rectangle, ahead of Snowy Peak and the City
  const reg = await t.ev(() => ({
    ok: typeof CocoaCabinExt !== 'undefined' && Render.ext.includes(CocoaCabinExt) && Game.ext.includes(CocoaCabinExt) && !!CFG.AREAS.cocoacabin,
    order: Game.ext.indexOf(CocoaCabinExt) < Game.ext.indexOf(SnowExt) && Game.ext.indexOf(CocoaCabinExt) < Game.ext.indexOf(CityExt),
    world: CFG.AREAS.cocoacabin && CFG.AREAS.cocoacabin.WORLD,
    save: !!Game.s.cocoacabin && Game.s.cocoacabin.cocoas === 0,
  }));
  t.expect(reg.ok, 'the cocoa cabin extension and its map are registered');
  t.expect(reg.order, 'the cocoa cabin is ahead of Snowy Peak and the City in Game.ext');
  t.expect(reg.world && reg.world.x0 === 18000 && reg.world.y0 === 4000 && reg.world.x1 === 18600 && reg.world.y1 === 4400, 'the cocoa cabin uses its free rectangle');
  t.expect(reg.save, 'save state starts empty');

  // ---- the door spot on the snow
  const spot = await t.ev(() => {
    const D = CFG.COCOACABIN.DOOR_OUT, S = CFG.SNOW;
    return { dx: D.x - (S.CABIN.x0 + S.CABIN.x1) / 2, below: D.y - S.CABIN.y1, free: SnowExt.free(Game, D.x, D.y, 12), pad: S.COCOA_PAD, padD: Math.hypot(D.x - S.COCOA_PAD.x, D.y - S.COCOA_PAD.y) };
  });
  t.expect(spot.dx === 0 && spot.below > 20 && spot.below < 40, `the door spot is right below the cabin's door (${JSON.stringify(spot)})`);
  t.expect(spot.free, 'the door spot is free snow');
  if (spot.pad.x === 6830 && spot.pad.y === 6266) console.log('   (the hot cocoa pad is still at its old spot in front of the door; the coordinator is moving it)');
  else t.expect(spot.padD > 40 + 6 + 12, `the door spot is off the hot cocoa pad (${JSON.stringify(spot)})`);
  await t.ev(() => { const D = CFG.COCOACABIN.DOOR_OUT; T.tp(D.x + 50, D.y + 10, 'snow'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Go inside the Cocoa Cabin! 🍫', 'door hint near the door');
  t.expect(await t.ev(() => { const D = CFG.COCOACABIN.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { const D = CFG.COCOACABIN.DOOR_OUT; T.tp(D.x + 72, D.y + 6, 'snow'); return CocoaCabinExt.hint(Game); }), undefined, 'no door hint further than 70 px from the door');
  await t.ev(() => { Render.setZoom(1.3); const D = CFG.COCOACABIN.DOOR_OUT; T.tp(D.x, D.y, 'snow'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expectEq(await t.ev(() => T.hint()), 'Go inside the Cocoa Cabin! 🍫', 'door hint at the door');
  t.expect(await t.ev(() => { const D = CFG.COCOACABIN.DOOR_OUT, p = Game.player; T.steer(0, -1); T.step(20); T.unsteer(); const moved = Math.hypot(p.x - D.x, p.y - D.y); T.tp(D.x, D.y, 'snow'); return moved < 30 && p.y > CFG.SNOW.CABIN.y1; }), 'the cabin wall stops the chef just above the door spot');
  await t.shot('door');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.step(2); });
  await t.shot('door-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });
  // not while sledding past the door
  t.expect(await t.ev(() => {
    const D = CFG.COCOACABIN.DOOR_OUT, sled = SnowExt.newSled(D.x, D.y);
    SnowExt.st.sled = sled; Game.vehicle = sled; Game.driving = true; Game.player.x = D.x; Game.player.y = D.y;
    const ok = CocoaCabinExt.action(Game) === null && CocoaCabinExt.hint(Game) === undefined;
    Game.driving = false; Game.vehicle = null; SnowExt.st.sled = null; T.tp(D.x, D.y, 'snow');
    return ok;
  }), 'no door button or hint while riding a sled');

  // ---- inside
  const cash0 = await t.ev(() => Game.s.cash);
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'cocoacabin', 'inside the cocoa cabin');
  t.expect(await t.ev(() => T.toasts.includes('🍫 Welcome to the Cocoa Cabin!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.COCOACABIN.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => CocoaCabinExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Get a hot cocoa! ☕', 'cocoa hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, P = CFG.COCOACABIN.COCOA_SPOT; return !!h.target && h.target.x === P.x && h.target.y === P.y; }), 'the hint points at the cocoa counter');
  t.expectEq(await t.ev(() => CocoaCabinExt.pads ? CocoaCabinExt.pads(Game).length : 0), 0, 'no pads: everything is free inside');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // every action spot and the coin are reachable floor, far enough apart that their buttons never fight
  const spots = await t.ev(() => {
    const K = CFG.COCOACABIN, coin = CFG.PIZZACOINS.SPOTS.find((s) => s.id === 'cocoacabin');
    const all = { exit: K.EXIT, sit: K.SIT, cocoa: K.COCOA_SPOT, mallow: K.MALLOW_SPOT, coin }, bad = [], close = [];
    for (const [k, s] of Object.entries(all)) if (!CocoaCabinExt.free(s.x, s.y)) bad.push(k);
    const keys = ['exit', 'sit', 'cocoa', 'mallow'];
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) if (U.dist(all[keys[i]].x, all[keys[i]].y, all[keys[j]].x, all[keys[j]].y) < 2 * K.SPOT_R) close.push(keys[i] + '/' + keys[j]);
    return { bad, close, coin };
  });
  t.expectEq(spots.bad.length, 0, `spots are free floor: ${JSON.stringify(spots.bad)}`);
  t.expectEq(spots.close.length, 0, `spots are apart: ${JSON.stringify(spots.close)}`);
  t.expect(spots.coin && spots.coin.area === 'cocoacabin', 'a Pizza Coin hides in the cocoa cabin');
  // nowhere on the floor traps the chef
  const stuck = await t.ev(() => {
    const R = CFG.COCOACABIN.ROOM, out = [];
    for (let y = R.y0 + 14; y < R.y1 - 12; y += 24) for (let x = R.x0 + 14; x < R.x1 - 12; x += 24) {
      if (!CocoaCabinExt.free(x, y)) continue;
      let best = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { Game.player.x = x; Game.player.y = y; T.steer(ax, ay); T.step(9); T.unsteer(); best = Math.max(best, Math.hypot(Game.player.x - x, Game.player.y - y)); }
      if (best < 2) out.push([x, y]);
    }
    const E = CFG.COCOACABIN.EXIT; T.tp(E.x, E.y - 8, 'cocoacabin');
    return out;
  });
  t.expectEq(stuck.length, 0, `no stuck spots on the cabin floor: ${JSON.stringify(stuck)}`);

  // ---- the fire crackles and the snow falls past the window by itself
  t.expect(await t.ev(() => { let n = 0; for (let i = 0; i < 240; i++) { T.step(1); n = Math.max(n, CocoaCabinExt.st.sparks.length); } return n > 0; }), 'the fire throws little sparks');

  // ---- a free hot cocoa from the cocoa maker: Snowy Peak's own cup, counted there too
  await t.ev(() => { const P = CFG.COCOACABIN.COCOA_SPOT; T.tp(P.x + 6, P.y + 4, 'cocoacabin'); });
  t.expectEq(await t.ev(() => T.label()), '☕ Get a hot cocoa', 'cocoa label at the counter');
  t.expectEq(await t.ev(() => T.hint()), 'Get a hot cocoa! ☕', 'cocoa hint at the counter');
  const cocoa = await t.ev(() => {
    T.act();
    return { full: CFG.SNOW.COCOA_T, cocoa: SnowExt.st.cocoa, snowCount: Game.s.snow.cocoas, mine: Game.s.cocoacabin.cocoas, cash: Game.s.cash, floats: Game.floats.map((f) => f.text), label: T.label(), hop: CocoaCabinExt.st.hop };
  });
  t.expect(cocoa.cocoa > cocoa.full - 0.5, `the chef carries Snowy Peak's hot cocoa (${cocoa.cocoa})`);
  t.expect(cocoa.snowCount === 1 && cocoa.mine === 1, 'the cup counts for Snowy Peak and the cabin');
  t.expectEq(cocoa.cash, cash0, 'the cocoa is free inside');
  t.expect(cocoa.floats.includes('Mmm, hot cocoa! ☕') && cocoa.floats.includes('Here you go! ☕'), 'the cocoa maker hands it over');
  t.expect(cocoa.hop > 0 && cocoa.label !== '☕ Get a hot cocoa', 'the cocoa maker hops while she pours');
  t.expectEq(await t.ev(() => { T.step(60); return T.label(); }), '☕ Get a hot cocoa', 'another cup any time');
  await t.ev(() => { Render.setZoom(1.6); T.step(2); });
  await t.shot('cocoa');

  // ---- marshmallows: plop up to three into the cup
  await t.ev(() => { Render.setZoom(1); const P = CFG.COCOACABIN.COCOA_SPOT; T.tp(P.x - 60, P.y + 30, 'cocoacabin'); });
  t.expectEq(await t.ev(() => T.hint()), 'Add marshmallows to your cocoa! ☁️', 'marshmallow hint with a cup');
  t.expect(await t.ev(() => { const h = Game.hint, M = CFG.COCOACABIN.MALLOW_SPOT; return !!h.target && h.target.x === M.x && h.target.y === M.y; }), 'the hint points at the marshmallow bowl');
  await t.ev(() => { const M = CFG.COCOACABIN.MALLOW_SPOT; T.tp(M.x, M.y, 'cocoacabin'); });
  t.expectEq(await t.ev(() => T.label()), '🍬 Add a marshmallow', 'marshmallow label with a cup');
  const mal = await t.ev(() => {
    const out = [];
    for (let i = 0; i < 3; i++) { T.act(); out.push(CocoaCabinExt.st.mallows); T.step(40); }
    return { out, label: T.label(), floats: Game.floats.map((f) => f.text) };
  });
  t.expectEq(mal.out.join(','), '1,2,3', 'three marshmallows plopped in');
  t.expect(mal.floats.includes('So fluffy! ☁️'), 'so fluffy!');
  t.expectEq(mal.label, '🍬 Eat a marshmallow', 'a full cup: eat one instead');
  await t.ev(() => { Render.setZoom(1.8); T.step(2); });
  await t.shot('marshmallows');
  await t.ev(() => { Render.setZoom(1); T.step(1); });

  // ---- warm up in the armchair by the fire
  await t.ev(() => { const S = CFG.COCOACABIN.SIT; T.tp(S.x + 8, S.y + 10, 'cocoacabin'); });
  t.expectEq(await t.ev(() => T.label()), '🔥 Warm up by the fire', 'fire label by the armchair');
  t.expectEq(await t.ev(() => T.hint()), 'Warm up by the fire! 🔥', 'fire hint by the armchair');
  const sit = await t.ev(() => {
    const n0 = CocoaCabinExt.st.sparks.length; T.act(); T.step(30);
    const S = CFG.COCOACABIN.SIT, p = Game.player;
    return { sit: !!CocoaCabinExt.st.sit, at: Math.hypot(p.x - S.x, p.y - S.y), warms: Game.s.cocoacabin.warms, label: T.label(), hint: T.hint(), floats: Game.floats.map((f) => f.text), sparks: CocoaCabinExt.st.sparks.length, n0 };
  });
  t.expect(sit.sit && sit.at < 1, 'sitting in the armchair');
  t.expectEq(sit.warms, 1, 'warm-up counted');
  t.expectEq(sit.label, '🚶 Stand up', 'stand-up label');
  t.expectEq(sit.hint, 'Cocoa by the fire! So cosy ☕', 'cosy hint with a cup');
  t.expect(sit.floats.includes('Ahh, toasty! 😊'), 'toasty!');
  t.expect(sit.sparks > 0, 'the fire crackles brighter');
  await t.ev(() => { Render.setZoom(1.7); T.step(20); });
  await t.shot('fire');
  t.expect(await t.ev(() => { T.step(120); return !!CocoaCabinExt.st.sit; }), 'the chef stays seated without the joystick');
  t.expect(await t.ev(() => { T.steer(1, 0.4); T.step(15); T.unsteer(); return !CocoaCabinExt.st.sit && CocoaCabinExt.free(Game.player.x, Game.player.y); }), 'walking off the armchair stands the chef up');
  t.expect(await t.ev(() => { const S = CFG.COCOACABIN.SIT; T.tp(S.x, S.y, 'cocoacabin'); T.act(); const a = !!CocoaCabinExt.st.sit; T.act(); return a && !CocoaCabinExt.st.sit; }), 'the Stand up button works');
  await t.ev(() => { Render.setZoom(1); T.step(1); });

  // ---- the cup runs out after a while, the marshmallows with it; then marshmallows are eaten
  const done = await t.ev(() => { T.step(60 * 31); return { cocoa: SnowExt.st.cocoa, mallows: CocoaCabinExt.st.mallows }; });
  t.expect(done.cocoa === 0 && done.mallows === 0, `the cocoa is finished (${JSON.stringify(done)})`);
  const eat = await t.ev(() => {
    const M = CFG.COCOACABIN.MALLOW_SPOT; T.tp(M.x, M.y, 'cocoacabin');
    const label = T.label(); T.act();
    return { label, eaten: Game.s.cocoacabin.mallows, floats: Game.floats.map((f) => f.text), hint: T.hint() };
  });
  t.expectEq(eat.label, '🍬 Eat a marshmallow', 'eat label without a cup');
  t.expect(eat.eaten === 1 && eat.floats.includes('Yum! 😋'), 'a marshmallow eaten');
  t.expectEq(eat.hint, 'Yummy marshmallows! ☁️', 'marshmallow hint without a cup');

  // ---- the Pizza Coin in the corner by the woodpile
  const coin = await t.ev(() => {
    const s = CFG.PIZZACOINS.SPOTS.find((q) => q.id === 'cocoacabin');
    delete Game.s.pizzacoins.got[s.id];   // the floor check above may have walked over it already
    T.tp(s.x + 50, s.y, 'cocoacabin');
    const before = !!Game.s.pizzacoins.got[s.id];
    T.steer(-1, 0); const n = T.until(() => Game.s.pizzacoins.got[s.id], 120); T.unsteer();
    return { before, n, place: CFG.PIZZACOINS.PLACES.cocoacabin };
  });
  t.expect(!coin.before && coin.n > 0, `walked onto the cabin's Pizza Coin (${coin.n} steps)`);
  t.expect(coin.place && coin.place[1] === 'Cocoa Cabin', 'the cabin has a friendly name in the coin panel');

  // ---- rescues: a push into a wall, the counter or the table lands back on the mat
  for (const [x, y, what] of [[18030, 4200, 'wall'], [18430, 4130, 'counter'], [18460, 4250, 'table'], [18130, 4125, 'hearth']]) {
    const ok = await t.ev(([px, py]) => {
      T.tp(px, py, 'cocoacabin'); T.step(3); const E = CFG.COCOACABIN.EXIT;
      return CocoaCabinExt.free(Game.player.x, Game.player.y) && Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2;
    }, [x, y, what]);
    t.expect(ok, `pushed into the ${what}: rescued onto the mat`);
  }

  // ---- phone-size cabin
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const P = CFG.COCOACABIN.COCOA_SPOT; T.tp(P.x, P.y, 'cocoacabin'); T.act(); T.tp(18250, 4230, 'cocoacabin'); T.step(60); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from the armchair
  await t.ev(() => { const S = CFG.COCOACABIN.SIT; T.tp(S.x, S.y, 'cocoacabin'); T.act(); T.step(5); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the cocoa cabin');
  t.expect(await t.ev(() => !CocoaCabinExt.st.sit && CocoaCabinExt.st.mallows === 0 && SnowExt.st.cocoa === 0), 'the seat and the cup are cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => CocoaCabinExt.hint(Game)), undefined, 'no cocoa cabin hint in the town');
  t.expectEq(await t.ev(() => CocoaCabinExt.action(Game)), null, 'no cocoa cabin button in the town');

  // ---- out through the door with a cup of cocoa (and marshmallows): back on the snow at the door spot
  await t.ev(() => { const P = CFG.COCOACABIN.COCOA_SPOT; T.tp(P.x, P.y, 'cocoacabin'); T.act(); const M = CFG.COCOACABIN.MALLOW_SPOT; T.tp(M.x, M.y, 'cocoacabin'); T.act(); T.step(40); T.act(); });
  await t.ev(() => { const E = CFG.COCOACABIN.EXIT; T.tp(E.x, E.y, 'cocoacabin'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'snow', 'back outside on Snowy Peak');
  t.expect(await t.ev(() => { const D = CFG.COCOACABIN.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expect(await t.ev(() => SnowExt.st.cocoa > 20 && CocoaCabinExt.st.mallows === 2), 'still carrying the cocoa with its marshmallows');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🍫 Welcome to the Cocoa Cabin!').length === 1), 'the welcome toast shows only once');
  await t.ev(() => { const D = CFG.COCOACABIN.DOOR_OUT; Render.setZoom(1.6); T.tp(D.x + 20, D.y + 30, 'snow'); T.step(30); });
  await t.shot('outside-cocoa');
  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
