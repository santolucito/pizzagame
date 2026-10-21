'use strict';
// The Arcade (City building 3): the door on Bus Street, the games room inside (claw machine, pinball, cabinets,
// dance pad, photo booth, token bag), the way back out, a rescue from a wall, and Take-me-home from inside.
const fs = require('fs');
const path = require('path');

module.exports = async (t) => {
  // js/city-arcade.js is wired into index.html by the coordinator; until then, load it just before main.js
  const root = path.resolve(__dirname, '..', '..');
  if (!fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('city-arcade.js')) {
    const src = fs.readFileSync(path.join(root, 'js', 'city-arcade.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');
    await t.page.route('**/js/main.js*', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'Cache-Control': 'no-store' }, body: src }));
    // the service worker fetches outside the page's routes and would serve the real main.js on reload: keep it off
    await t.page.addInitScript(() => { try { ServiceWorkerContainer.prototype.register = () => Promise.reject(new Error('no service worker in this test')); } catch (e) { /* ignore */ } });
  }
  await t.boot();
  t.expect(await t.ev(() => typeof ArcadeExt !== 'undefined' && Game.ext.indexOf(ArcadeExt) < Game.ext.indexOf(CityExt) && !!CFG.AREAS.arcade), 'the arcade extension is loaded first');

  // ---- outside: far from the door the hint is not ours; near it, the door hint and the button
  await t.ev(() => T.tp(5000, 300, 'city'));
  t.expectEq(await t.ev(() => ArcadeExt.hint(Game)), undefined, 'no arcade hint away from the door');
  t.expectEq(await t.ev(() => ArcadeExt.action(Game)), null, 'no arcade button away from the door');
  await t.ev(() => { const D = CFG.ARCADE.DOOR; T.tp(D.x, D.y + 46, 'city'); });
  t.expectEq(await t.ev(() => T.hint()), 'Go inside the Arcade! 🕹️', 'door hint near the door');
  await t.ev(() => { const D = CFG.ARCADE.DOOR; T.tp(D.x, D.y, 'city'); Render.setZoom(1.6); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'go-inside label at the door');
  await t.shot('door');

  // ---- go inside
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'arcade', 'inside the arcade');
  t.expect(await t.ev(() => T.toasts.includes('🕹️ Welcome to the Arcade!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.ARCADE.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2 && ArcadeExt.free(Game, Game.player.x, Game.player.y); }), 'arrived on the mat, on free floor');
  const h0 = await t.ev(() => Game.hint && { text: Game.hint.text, target: Game.hint.target });
  t.expect(h0 && h0.text === 'Try the claw machine! 🧸', `first hint points at the claw (${JSON.stringify(h0)})`);
  t.expect(await t.ev(() => { const W = CFG.ARCADE.WORLD, h = Game.hint; return !!h.target && h.target.x > W.x0 && h.target.x < W.x1 && h.target.y > W.y0 && h.target.y < W.y1; }), 'the hint target is inside the arcade');
  await t.ev(() => Render.setZoom(1));
  await t.shot('inside');

  // ---- the claw machine: one press, a 3 s grab, always a prize
  await t.ev(() => { const S = CFG.ARCADE.CLAW.spot; T.tp(S.x, S.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to grab a prize! 🧸', 'claw hint');
  t.expectEq(await t.ev(() => T.label()), '🧸 Grab a prize', 'claw label');
  await t.ev(() => { T.act(); T.step(5); });
  t.expectEq(await t.ev(() => ArcadeExt.st.play && ArcadeExt.st.play.kind), 'claw', 'the claw is grabbing');
  t.expectEq(await t.ev(() => T.label()), '🧸 Grabbing…', 'button waits while the claw works');
  t.expectEq(await t.ev(() => T.hint()), 'Grabbing a prize… 🧸', 'claw hint while grabbing');
  const held = await t.ev(() => { const S = CFG.ARCADE.CLAW.spot; T.steer(-1, 1); T.step(40); T.unsteer(); return Math.hypot(Game.player.x - S.x, Game.player.y - S.y); });
  t.expect(held < 1, 'the chef stays at the machine during the grab');
  await t.ev(() => T.step(50));
  await t.shot('claw');
  const claw = await t.ev(() => { const n = T.until(() => !ArcadeExt.st.play, 400); return { n, prizes: Game.s.arcade.prizes, float: Game.floats.some((f) => f.text === 'You got a prize! 🧸'), plays: Game.s.arcade.plays }; });
  t.expect(claw.n >= 0 && claw.n < 120, `the grab finished after about 3 s (${claw.n} more steps)`);
  t.expectEq(claw.prizes, 1, 'one prize won');
  t.expect(claw.float, 'the prize float showed');
  t.expectEq(claw.plays, 1, 'one play counted');

  // ---- pinball
  await t.ev(() => { const S = CFG.ARCADE.PINBALL.spot; T.tp(S.x, S.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.label()), '🪩 Play pinball', 'pinball label');
  const pin = await t.ev(() => { T.act(); const n = T.until(() => !ArcadeExt.st.play, 400); return { n, score: ArcadeExt.st.pin.score, games: Game.s.arcade.pinball, float: Game.floats.some((f) => f.text === '⭐ Great score!') }; });
  t.expect(pin.n > 150 && pin.n < 200, `pinball lasted about 3 s (${pin.n})`);
  t.expect(pin.score > 0 && pin.games === 1 && pin.float, `pinball scored and cheered (${JSON.stringify(pin)})`);

  // ---- a cabinet
  await t.ev(() => { const S = CFG.ARCADE.CABINETS[0].spot; T.tp(S.x, S.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to play! 👾', 'cabinet hint');
  t.expectEq(await t.ev(() => T.label()), '👾 Play', 'cabinet label');
  const cab = await t.ev(() => { T.act(); T.step(90); const mid = ArcadeExt.st.play && ArcadeExt.st.play.key; const n = T.until(() => !ArcadeExt.st.play, 400); return { mid, n, float: Game.floats.some((f) => f.text === '⭐ High score!') }; });
  t.expect(cab.mid === 'invaders' && cab.n >= 0 && cab.float, `played the invaders cabinet (${JSON.stringify(cab)})`);

  // ---- the dance pad: arrows light up and the chef bobs while standing on it
  const dance = await t.ev(() => { const D = CFG.ARCADE.DANCE; T.tp(D.x, D.y, 'arcade'); T.step(40); return { on: ArcadeExt.st.dance.on, beat: ArcadeExt.st.dance.beat, moving: Game.player.moving, hint: T.hint(), notes: ArcadeExt.st.notes.length, danced: Game.s.arcade.danced }; });
  t.expect(dance.on && dance.beat >= 0 && dance.moving && dance.notes > 0 && dance.danced, `dancing on the pad (${JSON.stringify(dance)})`);
  t.expectEq(dance.hint, 'Dance to the beat! 💃', 'dance hint');
  await t.shot('dance');
  const off = await t.ev(() => { T.tp(1640, 3300, 'arcade'); T.step(2); return ArcadeExt.st.dance.on; });
  t.expect(!off, 'stepping off the pad stops the dance');

  // ---- the photo booth: three flashes and a photo strip
  await t.ev(() => { const S = CFG.ARCADE.BOOTH.spot; T.tp(S.x, S.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.label()), '📸 Take a photo', 'booth label');
  const booth = await t.ev(() => { T.act(); let flashes = 0, maxFlash = 0; T.until(() => { maxFlash = Math.max(maxFlash, ArcadeExt.st.flash); flashes = ArcadeExt.st.play ? ArcadeExt.st.play.flashes : flashes; return !ArcadeExt.st.play; }, 400); return { flashes, maxFlash, photos: Game.s.arcade.photos, strip: !!ArcadeExt.st.photo, float: Game.floats.some((f) => f.text === '📸 Say cheese!') }; });
  t.expect(booth.flashes === 3 && booth.maxFlash > 0 && booth.photos === 1 && booth.strip && booth.float, `photo taken (${JSON.stringify(booth)})`);
  await t.shot('photo');

  // ---- the token bag: $2 on the circle by the counter
  const tokens = await t.ev(() => { Game.s.cash = 20; const P = CFG.ARCADE.TOKEN_PAD; T.tp(P.x, P.y, 'arcade'); const n = T.until(() => Game.s.arcade.tokens > 0, 400); return { n, cash: Game.s.cash, tokens: Game.s.arcade.tokens, hint: T.hint() }; });
  t.expect(tokens.n >= 0, 'the token circle paid out');
  t.expectEq(tokens.cash, 18, 'the token bag cost $2');
  t.expectEq(tokens.tokens, 10, 'ten tokens in the bag');
  // a game drops a token in
  const spent = await t.ev(() => { const S = CFG.ARCADE.CLAW.spot; T.tp(S.x, S.y, 'arcade'); T.act(); return Game.s.arcade.tokens; });
  t.expectEq(spent, 9, 'playing used one token');
  await t.ev(() => T.until(() => !ArcadeExt.st.play, 400));
  t.expectEq(await t.ev(() => Game.s.arcade.prizes), 2, 'second prize won');

  // ---- rescue: pushed into the wall, the chef is put back on the mat
  const rescued = await t.ev(() => { Game.player.x = 1410; Game.player.y = 3200; T.step(3); const E = CFG.ARCADE.EXIT; return { d: Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)), free: ArcadeExt.free(Game, Game.player.x, Game.player.y) }; });
  t.expect(rescued.d < 1 && rescued.free, `rescued onto the mat (${JSON.stringify(rescued)})`);
  // the walls hold: walking into the top row of machines stops the chef
  const wall = await t.ev(() => { T.tp(1620, 3140, 'arcade'); T.steer(0, -1); T.step(60); T.unsteer(); return Game.player.y; });
  t.expect(wall >= 3112 - 0.5, `the machines are solid (y ${wall})`);

  // ---- phone-size
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const S = CFG.ARCADE.CLAW.spot; T.tp(S.x - 40, S.y + 30, 'arcade'); T.step(2); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => Render.resize());

  // ---- back outside, at the door
  await t.ev(() => { const E = CFG.ARCADE.EXIT; T.tp(E.x, E.y, 'arcade'); });
  t.expectEq(await t.ev(() => T.hint()), 'Press the button to go outside 🚪', 'exit hint on the mat');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back in the City');
  t.expect(await t.ev(() => { const D = CFG.ARCADE.DOOR; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 1; }), 'standing at the arcade door');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door button is right there again');

  // ---- Take-me-home from inside, mid-game
  await t.ev(() => { T.act(); T.step(2); const S = CFG.ARCADE.PINBALL.spot; T.tp(S.x, S.y, 'arcade'); T.act(); T.step(10); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'home after Take-me-home');
  t.expect(await t.ev(() => !ArcadeExt.st.play && ArcadeExt.st.fade === 0 && !ArcadeExt.st.dance.on), 'arcade state cleared by Take-me-home');
  t.expectEq(await t.ev(() => T.toasts.filter((m) => m === '🕹️ Welcome to the Arcade!').length), 1, 'the welcome toast showed only once');

  // ---- a save inside the arcade loads back inside, on the floor
  await t.ev(() => { const S = CFG.ARCADE.BOOTH.spot; T.tp(S.x, S.y, 'arcade'); Game.save(); });
  await t.reload();
  const back = await t.ev(() => ({ area: Game.area, free: ArcadeExt.free(Game, Game.player.x, Game.player.y), prizes: Game.s.arcade.prizes, tokens: Game.s.arcade.tokens }));
  t.expect(back.area === 'arcade' && back.free, `reloaded inside the arcade on the floor (${JSON.stringify(back)})`);
  t.expectEq(back.prizes, 2, 'prizes survived the reload');
  t.expectEq(back.tokens, 8, 'tokens survived the reload (the pinball game before Take-me-home used one)');
};
