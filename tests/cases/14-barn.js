'use strict';
// Inside the barn: the door on the farm, the goat and the pig to pat, hens that scatter and leave an egg, the hay bale
// seat, the ladder to the hayloft and its window view, back out through the big door, a rescue from the wall, Take-me-home
// from inside, and the secret gap behind the barn still leads into the woods.
module.exports = async (t) => {
  // js/barn.js is wired into index.html by the coordinator; until then, add the tag ourselves
  await t.page.route((url) => /\/(\?.*)?$|index\.html/.test(url.pathname + url.search) && !/\.(js|css|png|json|webmanifest)$/.test(url.pathname), async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const res = await route.fetch();
    let html = await res.text();
    if (!html.includes('js/barn.js')) html = html.replace('<script src="js/main.js">', '<script src="js/barn.js"></script>\n  <script src="js/main.js">');
    return route.fulfill({ response: res, body: html, headers: Object.assign({}, res.headers(), { 'content-type': 'text/html' }) });
  });
  // the service worker would serve its cached copy of index.html on the reload below, skipping the route above
  await t.page.addInitScript(() => { if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.reject(new Error('no service worker in this test')); });
  await t.boot();
  t.expect(await t.ev(() => typeof BarnExt !== 'undefined' && Game.ext.indexOf(BarnExt) < Game.ext.indexOf(CityExt)), 'BarnExt loaded and first in Game.ext');

  // ---- the door spot on the farm is free ground; label and hint there
  const spot = await t.ev(() => { const D = CFG.BARN.DOOR_OUT; return { blocked: Game.obstacles().some((o) => Game.hitRect(D.x, D.y, 12, o)), D }; });
  t.expect(!spot.blocked, `the door spot ${JSON.stringify(spot.D)} is clear of obstacles`);
  await t.ev(() => { const D = CFG.BARN.DOOR_OUT; T.tp(D.x + 70, D.y + 40, 'town'); T.step(1); });
  t.expectEq(await t.ev(() => T.hint()), 'Go into the barn! 🐐', 'barn hint near the door');
  t.expect(await t.ev(() => Game.hint.target && Game.hint.target.x === CFG.BARN.DOOR_OUT.x), 'the hint points at the door spot');
  await t.ev(() => { const D = CFG.BARN.DOOR_OUT; T.tp(D.x, D.y, 'town'); Render.setZoom(1.2); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go into the barn', 'door label on the farm');
  await t.shot('door-outside');

  // ---- go in: on the mat, welcome toast, hint inside points somewhere real
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'barn', 'inside the barn');
  t.expect(await t.ev(() => T.toasts.includes('🐐 Welcome to the barn!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.BARN.exit; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'standing on the exit mat');
  t.expect(await t.ev(() => Game.s.barn.seen), 'the barn is marked seen');
  const h1 = await t.ev(() => ({ text: T.hint(), target: Game.hint && Game.hint.target }));
  t.expect(!!h1.text, 'a hint shows inside');
  t.expect(!h1.target || (h1.target.x > 0 && h1.target.x < 600 && h1.target.y > 4000 && h1.target.y < 4400), `the hint target is inside the barn (${JSON.stringify(h1.target)})`);
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { Render.setZoom(1); T.tp(300, 4250, 'barn'); T.step(2); });
  await t.shot('inside');

  // ---- pat the goat and the pig: floats, hearts, and the hint moves on (any egg the startled hens left is cleared first)
  await t.ev(() => { BarnExt.st.eggs.length = 0; BarnExt.st.eggT = 20; const S = CFG.BARN.stalls.goat; T.tp(S.x1 + 26, S.at.y, 'barn'); T.step(1); });
  t.expectEq(await t.ev(() => T.hint()), 'Pat the goat! 🐐', 'goat hint');
  t.expectEq(await t.ev(() => T.label()), '🐐 Pat the goat', 'pat-the-goat label');
  await t.ev(() => T.act());
  t.expect(await t.ev(() => Game.floats.some((f) => f.text.includes('Baa')) && BarnExt.st.goat.happy > 0), 'the goat says Baa');
  await t.shot('goat');
  await t.ev(() => { const S = CFG.BARN.stalls.pig; T.tp(S.x1 + 26, S.at.y, 'barn'); T.step(1); });
  t.expectEq(await t.ev(() => T.hint()), 'Pat the pig! 🐷', 'pig hint');
  t.expectEq(await t.ev(() => T.label()), '🐷 Pat the pig', 'pat-the-pig label');
  await t.ev(() => T.act());
  t.expect(await t.ev(() => Game.floats.some((f) => f.text.includes('Oink')) && BarnExt.st.pig.happy > 0), 'the pig says Oink');
  t.expectEq(await t.ev(() => { T.step(1); return T.hint(); }), 'Climb the ladder to the hayloft 🪜', 'hint moves on to the ladder');

  // ---- scatter the hens: the first burst leaves an egg; walk over it to pick it up
  const scatter = await t.ev(() => {
    const h = BarnExt.st.hens[0]; h.x = 330; h.y = 4220; h.flee = 0; h.target = null; BarnExt.st.eggT = 0; BarnExt.st.bokT = 0;
    T.tp(362, 4220, 'barn'); T.step(3);
    return { flee: h.flee, eggs: BarnExt.st.eggs.length, hint: T.hint(), bok: Game.floats.some((f) => f.text.includes('Bok')) };
  });
  t.expect(scatter.flee > 0, 'the hen scatters');
  t.expectEq(scatter.eggs, 1, 'an egg was laid');
  t.expect(scatter.bok, 'Bok bok!');
  t.expectEq(scatter.hint, 'Pick up the egg! 🥚', 'hint points at the egg');
  await t.shot('hens');
  const egg = await t.ev(() => { const e = BarnExt.st.eggs[0]; T.tp(e.x, e.y, 'barn'); T.step(2); return { count: Game.s.barn.eggs, left: BarnExt.st.eggs.length, float: Game.floats.some((f) => f.text === '🥚 +1') }; });
  t.expectEq(egg.count, 1, 'egg counted');
  t.expectEq(egg.left, 0, 'the egg is gone from the floor');
  t.expect(egg.float, '🥚 +1 float');
  // the count survives a reload
  await t.ev(() => Game.save());
  await t.reload();
  t.expectEq(await t.ev(() => Game.s.barn.eggs), 1, 'egg count saved across a reload');
  t.expectEq(await t.ev(() => Game.area), 'barn', 'still in the barn after the reload');
  t.expect(await t.ev(() => BarnExt.free(Game.player.x, Game.player.y)), 'standing on free floor after the reload');

  // ---- sit on the hay, stand up
  await t.ev(() => { const b = CFG.BARN.bales.find((x) => x.seat); T.tp(b.x, b.y + 30, 'barn'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit on the hay', 'sit label by the blanket bale');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !!BarnExt.st.seat), 'seated');
  const seated = await t.ev(() => { const p = Game.player, x0 = p.x, y0 = p.y; T.steer(1, 1); T.step(40); T.unsteer(); return Math.hypot(p.x - x0, p.y - y0); });
  t.expect(seated < 1, 'the chef stays on the hay while seated');
  t.expectEq(await t.ev(() => T.label()), '🚶 Stand up', 'stand-up label');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !BarnExt.st.seat && BarnExt.free(Game.player.x, Game.player.y)), 'stood up onto free floor');

  // ---- up the ladder to the hayloft: the window view, walk about, climb back down
  await t.ev(() => { const L = CFG.BARN.ladder.foot; T.tp(L.x, L.y, 'barn'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🪜 Climb up', 'climb-up label at the ladder');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => BarnExt.st.loft && BarnExt.st.view > 0), 'in the loft with the window view showing');
  t.expectEq(await t.ev(() => T.hint()), 'What a view! 🌾', 'view hint');
  await t.shot('loft-view');
  const loft = await t.ev(() => {
    const p = Game.player, L = CFG.BARN.loft.walk;
    T.steer(0, 1); T.step(120); T.unsteer(); const yDown = p.y;
    T.steer(1, 0); T.step(60); T.unsteer();
    return { yDown, x: p.x, y: p.y, inLoft: p.x >= L.x0 && p.x <= L.x1 && p.y >= L.y0 && p.y <= L.y1, loft: BarnExt.st.loft, view: BarnExt.st.view };
  });
  t.expect(loft.inLoft && loft.loft, `the chef stays on the loft planks (${Math.round(loft.x)},${Math.round(loft.y)})`);
  t.expect(loft.yDown < 4100, 'cannot walk off the loft edge');
  t.expectEq(loft.view, 0, 'the view ended when the chef walked');
  t.expectEq(await t.ev(() => T.label()), '🪜 Climb down', 'climb-down label in the loft');
  await t.ev(() => { const E = CFG.BARN.eye; T.tp(E.x, E.y, 'barn'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🪟 Look outside', 'look-outside label at the window');
  await t.ev(() => { T.act(); T.step(1); });
  t.expect(await t.ev(() => BarnExt.st.view > 0), 'looking outside again');
  await t.ev(() => { T.steer(-1, 0); T.step(30); T.unsteer(); T.step(40); });
  t.expectEq(await t.ev(() => T.hint()), 'Climb back down the ladder 🪜', 'climb-down hint');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => !BarnExt.st.loft && Math.hypot(Game.player.x - CFG.BARN.ladder.foot.x, Game.player.y - CFG.BARN.ladder.foot.y) < 10 && BarnExt.free(Game.player.x, Game.player.y)), 'back on the floor at the ladder');

  // ---- phone-size barn
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(300, 4250, 'barn'); T.step(2); });
  await t.shot('phone');
  await t.ev(() => { const L = CFG.BARN.ladder.foot; T.tp(L.x, L.y, 'barn'); T.act(); T.step(2); });
  await t.shot('loft-view-phone');
  await t.ev(() => { T.act(); T.step(2); });
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- rescue: pushed into a wall, back onto the mat
  await t.ev(() => { Game.player.x = 30; Game.player.y = 4250; T.step(3); });
  t.expect(await t.ev(() => { const E = CFG.BARN.exit; return BarnExt.free(Game.player.x, Game.player.y) && Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'rescued onto the exit mat');

  // ---- out through the big door: back at the door spot on the farm
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'back outside');
  t.expect(await t.ev(() => { const D = CFG.BARN.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the barn door');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free ground');
  t.expectEq(await t.ev(() => T.hint()), 'Go into the barn! 🐐', 'door hint right at the door');
  t.expect(await t.ev(() => Game.hint.target === null), 'no arrow when already at the door');
  // walk away: the hint is handed back to the farm
  await t.ev(() => { T.tp(-700, 700, 'town'); T.step(1); });
  t.expect(await t.ev(() => T.hint() !== 'Go into the barn! 🐐'), 'barn hint only near the door');

  // ---- Take-me-home from inside the loft (the hens may have left more eggs by now: compare with the count going in)
  const eggsBefore = await t.ev(() => { BarnExt.st.eggT = 60; BarnExt.st.eggs.length = 0; return Game.s.barn.eggs; });
  await t.ev(() => { const L = CFG.BARN.ladder.foot; T.tp(L.x, L.y, 'barn'); T.act(); T.step(2); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'home from the barn');
  const home = await t.ev(() => ({ loft: BarnExt.st.loft, seat: BarnExt.st.seat, view: BarnExt.st.view, d: Math.hypot(Game.player.x - CFG.PLAYER_START.x, Game.player.y - CFG.PLAYER_START.y) }));
  t.expect(!home.loft && !home.seat && home.view === 0 && home.d < 2, `barn state cleared, chef at the pizza shop (${JSON.stringify(home)})`);
  t.expectEq(await t.ev(() => Game.s.barn.eggs), eggsBefore, 'eggs kept');

  // ---- the secret gap behind the barn is still walkable: from the slot behind the barn into the woods
  const gap = await t.ev(() => {
    const F = CFG.FARM, B = F.barn, x = B.x0 + 12, y = F.secretGate.y;
    T.tp(x, y, 'town'); T.step(1);
    const blocked = Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    T.steer(-1, 0); T.step(90); T.unsteer();
    return { blocked, x: Game.player.x, y: Game.player.y };
  });
  t.expect(!gap.blocked, 'the slot behind the barn is clear');
  t.expect(gap.x < -1010, `walked west through the hidden fence gap into the woods (${Math.round(gap.x)},${Math.round(gap.y)})`);
  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
