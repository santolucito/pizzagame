'use strict';
// The Cat Café in the City: the door's label and hint on Market Street, going inside (welcome toast, a hint that points at a
// cat), patting a cat (purring hearts), the laser dot that runs ahead of the chef and the cat that chases it, the feather wand
// (every cat follows, then goes home when it is put back), the $4 cookie and $5 cocoa, the window seat and the lap cat,
// a rescue from a wall and from the counter, Take-me-home from the seat, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-catcafe.js into index.html, load it into the booted page
  if (await t.ev(() => typeof CatCafeExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-catcafe.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof CatCafeExt !== 'undefined' && !!CFG.AREAS.catcafe), 'the cat café extension and its map are registered');
  t.expect(await t.ev(() => { const b = CFG.CITY.BUILDINGS[CFG.CATCAFE.BUILDING], D = CFG.CATCAFE.DOOR_OUT; return b.cat === true && D.x === (b.x0 + b.x1) / 2 && D.y === b.y1 + 14; }), 'the door spot is on the sidewalk under the cat building\'s door');

  // ---- the door on Market Street
  await t.ev(() => { const D = CFG.CATCAFE.DOOR_OUT; T.tp(D.x, D.y + 70, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Visit the Cat Café! 🐱', 'café hint near the door');
  t.expect(await t.ev(() => { const D = CFG.CATCAFE.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { T.tp(5620, 700, 'city'); T.step(1); return CatCafeExt.hint(Game); }), undefined, 'no café hint elsewhere in the City');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.CATCAFE.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'catcafe', 'inside the cat café');
  t.expect(await t.ev(() => T.toasts.includes('🐱 Welcome to the Cat Café!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.CATCAFE.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => CatCafeExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Pat a cat! 🐾', 'pat hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, c = CFG.CATCAFE.CATS[0].home; return !!h.target && h.target.x === c.x && h.target.y === c.y; }), 'the hint points at the sleeping cat');
  t.expectEq(await t.ev(() => CatCafeExt.st.cats.map((c) => c.pose).join(',')), 'sleep,sit,box,tree,beg', 'five cats in their places');
  t.expect(await t.ev(() => new Set(CatCafeExt.st.cats.map((c) => c.col)).size === 5), 'five different colours');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- pat the sleeping cat: purring hearts
  await t.ev(() => { const c = CFG.CATCAFE.CATS[0].home; T.tp(c.x - 30, c.y + 10, 'catcafe'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🐾 Pat the cat', 'pat label next to the cat');
  const pat = await t.ev(() => { T.act(); T.step(20); return { pats: Game.s.catcafe.pats, purr: CatCafeExt.st.cats[0].purr, hearts: CatCafeExt.st.hearts.length, floats: Game.floats.map((f) => f.text), pose: CatCafeExt.st.cats[0].pose }; });
  t.expectEq(pat.pats, 1, 'one pat counted');
  t.expect(pat.purr > 0 && pat.hearts > 0, `the cat purrs with hearts (${JSON.stringify(pat)})`);
  t.expect(pat.floats.includes('Purrr 💗'), 'the "Purrr" float');
  t.expectEq(pat.pose, 'sleep', 'the sunbeam cat keeps sleeping');
  t.expectEq(await t.ev(() => T.hint()), 'Pick up the feather wand! 🪶', 'wand hint after the pat');
  await t.shot('pat');

  // ---- the laser dot runs ahead of the chef; the black cat chases and catches it
  const laser = await t.ev(() => {
    T.tp(6100, 3250, 'catcafe'); T.steer(1, 0); T.step(45); T.unsteer(); T.step(1);
    const p = Game.player, d = CatCafeExt.st.dot, cat = CatCafeExt.st.cats[1];
    const ahead = d.x > p.x + 40 && Math.abs(d.y - p.y) < 6;
    const n = T.until(() => cat.caught, 600);
    return { ahead, n, near: Math.hypot(cat.x - d.x, cat.y - d.y), hop: cat.hop, pose: cat.pose };
  });
  t.expect(laser.ahead, 'the red dot runs ahead of the chef in the walking direction');
  t.expect(laser.n >= 0 && laser.near < 2, `the black cat caught the dot (${JSON.stringify(laser)})`);
  t.expect(laser.hop > 0, 'it pounced');
  await t.shot('laser');

  // ---- the feather wand: every cat follows, then goes home when it is put back
  await t.ev(() => { const W = CFG.CATCAFE.WAND; T.tp(W.x + 28, W.y, 'catcafe'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🪶 Take the wand', 'take-the-wand label at the toy jar');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => CatCafeExt.st.wand && Game.s.catcafe.wands === 1), 'holding the wand');
  t.expectEq(await t.ev(() => T.hint()), 'The cats follow the feather! 🪶', 'wand hint');
  const follow = await t.ev(() => {
    T.tp(6150, 3220, 'catcafe'); T.step(240);
    const p = Game.player, far = CatCafeExt.st.cats.map((c) => Math.round(Math.hypot(c.x - p.x, c.y - p.y)));
    return { far, poses: CatCafeExt.st.cats.map((c) => c.pose) };
  });
  t.expect(follow.far.every((d) => d < 60), `all five cats gathered round the chef (${follow.far})`);
  t.expect(follow.poses.every((p) => p === 'sit'), `they sit by the chef (${follow.poses})`);
  await t.shot('wand');
  await t.ev(() => { const W = CFG.CATCAFE.WAND; T.tp(W.x + 28, W.y, 'catcafe'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🪶 Put the wand back', 'put-back label at the jar');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !CatCafeExt.st.wand), 'the wand is back in the jar');
  const home = await t.ev(() => { T.tp(6200, 3314, 'catcafe'); const n = T.until(() => CatCafeExt.st.cats.every((c) => c.id === 'laser' || (c.x === c.home.x && c.y === c.home.y)), 900); return { n, poses: CatCafeExt.st.cats.map((c) => c.pose).join(',') }; });
  t.expect(home.n >= 0, 'the cats walked back to their places');
  t.expectEq(home.poses.replace('walk', 'sit'), 'sleep,sit,box,tree,beg', 'back in their favourite spots');

  // ---- treats from the counter: a $4 cat cookie and a $5 cocoa
  const cookie = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.CATCAFE.PADS.cookie; T.tp(P.x, P.y, 'catcafe');
    const hint = T.hint();
    const n = T.until(() => CatCafeExt.st.cookie > 0, 400);
    return { hint, n, cash: Game.s.cash, cookie: CatCafeExt.st.cookie, cookies: Game.s.catcafe.cookies, say: CatCafeExt.st.barista.say, after: T.hint() };
  });
  t.expectEq(cookie.hint, 'Buy a cat cookie! 🍪', 'cookie hint');
  t.expect(cookie.n >= 0, 'the circle sold a cookie');
  t.expectEq(cookie.cash, 16, 'the cookie cost $4');
  t.expectEq(cookie.cookies, 1, 'cookie counted');
  t.expect(cookie.cookie > 25 && cookie.say > 0, 'the cookie lasts half a minute and the barista hands it over');
  t.expectEq(cookie.after, 'Sit by the sunny window 🪟', 'seat hint after the cookie');
  const cocoa = await t.ev(() => { const P = CFG.CATCAFE.PADS.cocoa; T.tp(P.x, P.y, 'catcafe'); const n = T.until(() => CatCafeExt.st.cocoa > 0, 400); return { n, cash: Game.s.cash, cocoas: Game.s.catcafe.cocoas }; });
  t.expect(cocoa.n >= 0, 'the circle sold a cocoa');
  t.expectEq(cocoa.cash, 11, 'the cocoa cost $5');
  t.expectEq(cocoa.cocoas, 1, 'cocoa counted');
  await t.ev(() => { T.tp(6160, 3300, 'catcafe'); T.step(2); });
  await t.shot('treats');

  // ---- the window seat: sit, a cat hops onto your lap, stand up
  await t.ev(() => { const S = CFG.CATCAFE.SEAT; T.tp(S.x, S.y + 28, 'catcafe'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit by the window', 'sit label by the window seat');
  await t.ev(() => { T.act(); T.step(5); });
  t.expect(await t.ev(() => !!CatCafeExt.st.seat), 'seated');
  t.expectEq(await t.ev(() => T.label()), '🚶 Stand up', 'stand-up label while seated');
  t.expectEq(await t.ev(() => T.hint()), 'Sit still, a kitty is coming 🐱', 'seated hint before the cat');
  const stayed = await t.ev(() => { const S = CFG.CATCAFE.SEAT; T.steer(1, 1); T.step(40); T.unsteer(); return Math.hypot(Game.player.x - S.x, Game.player.y - S.y); });
  t.expect(stayed < 1, 'the chef stays on the seat while seated');
  const lap = await t.ev(() => { const n = T.until(() => CatCafeExt.st.lap, 600); return { n, laps: Game.s.catcafe.laps, pose: CatCafeExt.st.cats[3].pose, floats: Game.floats.map((f) => f.text), hint: T.hint() }; });
  t.expect(lap.n >= 0 && lap.pose === 'lap', `the grey cat hopped onto the lap (${JSON.stringify(lap)})`);
  t.expectEq(lap.laps, 1, 'lap counted');
  t.expect(lap.floats.includes('Purrr 😻'), 'the "Purrr 😻" float');
  t.expectEq(lap.hint, 'Purrr… a kitty on your lap 😻', 'lap hint');
  await t.shot('seat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !CatCafeExt.st.seat && CatCafeExt.free(Game.player.x, Game.player.y)), 'stood up onto free floor');
  t.expect(await t.ev(() => T.until(() => CatCafeExt.st.cats[3].pose === 'tree', 900) >= 0), 'the cat climbed back up its tree');
  t.expectEq(await t.ev(() => T.hint()), 'Mmm, cat cookie! 🍪', 'cookie hint while still carrying it');
  // the cookie comes along to the town, then runs out
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return CatCafeExt.st.cookie > 15; }), 'the cookie comes along to the town');
  t.expect(await t.ev(() => { T.step(60 * 31); return CatCafeExt.st.cookie === 0 && CatCafeExt.st.cocoa === 0; }), 'the treats are finished after half a minute');

  // ---- a reload or push into a wall lands back on the mat
  await t.ev(() => { const R = CFG.CATCAFE.ROOM; T.tp(R.x0 - 10, 3200, 'catcafe'); T.step(3); });
  t.expect(await t.ev(() => CatCafeExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.CATCAFE.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const C = CFG.CATCAFE.COUNTER; T.tp((C.x0 + C.x1) / 2, (C.y0 + C.y1) / 2, 'catcafe'); T.step(3); });
  t.expect(await t.ev(() => CatCafeExt.free(Game.player.x, Game.player.y)), 'dropped onto the counter: rescued');

  // ---- phone-size café
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(6150, 3240, 'catcafe'); T.step(100); });   // a moment for the rescue float to fade
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from the seat with the wand in hand
  await t.ev(() => { const W = CFG.CATCAFE.WAND; T.tp(W.x + 28, W.y, 'catcafe'); T.act(); const S = CFG.CATCAFE.SEAT; T.tp(S.x, S.y + 28, 'catcafe'); T.act(); T.step(5); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the café');
  t.expect(await t.ev(() => !CatCafeExt.st.seat && !CatCafeExt.st.wand && !CatCafeExt.st.lap), 'the seat and the wand are cleared by Take-me-home');
  t.expect(await t.ev(() => CatCafeExt.st.cats.every((c) => c.x === c.home.x && c.y === c.home.y)), 'the cats are back in their places');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');
  t.expectEq(await t.ev(() => CatCafeExt.hint(Game)), undefined, 'no café hint in the town');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.CATCAFE.EXIT; T.tp(E.x, E.y, 'catcafe'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.CATCAFE.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🐱 Welcome to the Cat Café!').length === 1), 'the welcome toast shows only once');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
