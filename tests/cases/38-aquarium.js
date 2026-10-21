'use strict';
// The Aquarium in the City: the door's label and hint on Harbour Street, going inside (welcome toast, hint pointing at
// the tunnel), the fish tunnel, feeding the fish (flakes, every fish rushes over), petting the starfish, the shy octopus,
// the penguins sliding when you come close, the diver waving, the $5 fish plush and the $3 shells on the shelf, a rescue
// from a wall, Take-me-home from inside, and going back out onto the door spot.
module.exports = async (t) => {
  await t.boot();
  // until the coordinator wires js/city-aquarium.js into index.html, load it into the booted page
  if (await t.ev(() => typeof AquariumExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-aquarium.js' }); await t.ev(() => T.step(2)); }
  t.expect(await t.ev(() => typeof AquariumExt !== 'undefined' && !!CFG.AREAS.aquarium), 'the aquarium extension and its map are registered');
  t.expect(await t.ev(() => Game.ext.indexOf(AquariumExt) < Game.ext.indexOf(CityExt)), 'the aquarium answers before the City');
  t.expect(await t.ev(() => { const W = CFG.AQUARIUM.WORLD; return W.x0 === 14900 && W.y0 === 3000 && W.x1 === 15500 && W.y1 === 3400; }), 'the interior uses the rectangle reserved for City building 18');

  // ---- the door on Harbour Street
  await t.ev(() => { const D = CFG.AQUARIUM.DOOR_OUT; T.tp(D.x + 50, D.y, 'city'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'Visit the aquarium! 🐠', 'aquarium hint near the door');
  t.expect(await t.ev(() => { const D = CFG.AQUARIUM.DOOR_OUT, h = Game.hint; return !!h.target && h.target.x === D.x && h.target.y === D.y; }), 'the hint arrow points at the door');
  t.expect(await t.ev(() => T.label() !== '🚪 Go inside'), 'no door button away from the door');
  t.expectEq(await t.ev(() => { const D = CFG.AQUARIUM.DOOR_OUT; T.tp(D.x, D.y + 90, 'city'); T.step(2); return AquariumExt.hint(Game); }), undefined, 'no aquarium hint further than 70 px from the door');
  await t.ev(() => { Render.setZoom(1.2); const D = CFG.AQUARIUM.DOOR_OUT; T.tp(D.x, D.y, 'city'); T.step(2); });
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label at the door spot');
  await t.shot('door');
  await t.ev(() => { T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'aquarium', 'inside the aquarium');
  t.expect(await t.ev(() => T.toasts.includes('🐠 Welcome to the Aquarium!')), 'welcome toast the first time');
  t.expect(await t.ev(() => { const E = CFG.AQUARIUM.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'arrived on the mat inside the door');
  t.expect(await t.ev(() => AquariumExt.free(Game.player.x, Game.player.y)), 'the arrival spot is free floor');
  t.expectEq(await t.ev(() => T.hint()), 'Walk through the fish tunnel! 🐟', 'tunnel hint inside');
  t.expect(await t.ev(() => { const h = Game.hint, T2 = CFG.AQUARIUM.TUNNEL; return !!h.target && h.target.x > T2.x0 && h.target.x < T2.x1; }), 'the hint points at the tunnel');
  await t.ev(() => { Render.setZoom(1); T.step(2); });
  await t.shot('inside');

  // ---- the fish tunnel: walk in from the east end, fish swim overhead
  const tunnel = await t.ev(() => {
    const T2 = CFG.AQUARIUM.TUNNEL; T.tp(T2.x1 + 30, (T2.y0 + T2.y1) / 2, 'aquarium'); T.steer(-1, 0); T.step(50); T.unsteer();
    return { inside: AquariumExt.inTunnel(Game.player.x, Game.player.y), flag: Game.s.aquarium.tunnel, hint: T.hint(), fish: AquariumExt.st.fish.filter((f) => f.tank === T2).length, floats: Game.floats.map((f) => f.text) };
  });
  t.expect(tunnel.inside, 'walked into the tunnel');
  t.expect(tunnel.flag, 'the tunnel counts as seen');
  t.expectEq(tunnel.hint, 'Look up! Fish are swimming over you 🐟', 'tunnel hint while inside it');
  t.expect(tunnel.fish >= 5, 'fish swim in the tunnel');
  t.expect(tunnel.floats.includes('Fish overhead! 🐟'), 'the tunnel float');
  await t.shot('tunnel');
  // the glass sides keep you in: pushing north stays inside the tunnel
  t.expect(await t.ev(() => { T.steer(0, -1); T.step(40); T.unsteer(); return AquariumExt.inTunnel(Game.player.x, Game.player.y); }), 'the tunnel glass keeps the chef inside');
  t.expectEq(await t.ev(() => { const T2 = CFG.AQUARIUM.TUNNEL; T.tp(T2.x0 - 40, (T2.y0 + T2.y1) / 2 + 40, 'aquarium'); T.step(2); return T.hint(); }), 'Feed the fish! 🐟', 'feeding hint after the tunnel');

  // ---- feeding: flakes drop and every fish rushes over
  const feed = await t.ev(() => {
    const F = CFG.AQUARIUM.FEED; T.tp(F.x + 24, F.y + 2, 'aquarium'); T.step(2);
    const label = T.label(); T.act(); T.step(2);
    const flakes = AquariumExt.st.flakes.length, fed = Game.s.aquarium.fed, after = T.label(), floats = Game.floats.map((f) => f.text);
    const big = CFG.AQUARIUM.TANKS[0], before = AquariumExt.st.fish.filter((f) => f.tank === big).map((f) => f.x);
    T.step(90);
    const moved = AquariumExt.st.fish.filter((f) => f.tank === big).filter((f, i) => Math.abs(f.x - before[i]) > 8).length;
    return { label, flakes, fed, after, moved, floats, hint: T.hint() };
  });
  t.expectEq(feed.label, '🐟 Feed the fish', 'feed label by the bucket');
  t.expect(feed.flakes >= 8, `flakes dropped into the tank (${feed.flakes})`);
  t.expectEq(feed.fed, 1, 'one feed counted');
  t.expect(feed.after !== '🐟 Feed the fish', 'no second feed right away');
  t.expect(feed.moved >= 5, `the fish rushed over (${feed.moved} moved)`);
  t.expect(feed.floats.includes('Nom nom! 🐟'), 'the feeding float');
  t.expectEq(feed.hint, 'Pet the starfish! ⭐', 'starfish hint after feeding');
  await t.shot('feeding');
  t.expect(await t.ev(() => { T.step(60 * 7); return AquariumExt.st.flakes.length === 0 && AquariumExt.st.feedCd === 0 && T.label() === '🐟 Feed the fish'; }), 'the flakes are gone and feeding is offered again');

  // ---- the shy octopus changes colour when you stand close to its tank
  const octo = await t.ev(() => {
    const T2 = CFG.AQUARIUM.TANKS[1], cx = (T2.x0 + T2.x1) / 2; T.tp(cx, 3250, 'aquarium'); T.step(1); const far = AquariumExt.octoNear(Game);
    T.tp(cx + 34, 3120, 'aquarium'); T.step(1); const near = AquariumExt.octoNear(Game);
    return { far, near, free: AquariumExt.free(Game.player.x, Game.player.y) };
  });
  t.expect(octo.far === 0 && octo.near > 0.9 && octo.free, `the octopus hides when you stand close (far ${octo.far}, near ${octo.near.toFixed(2)})`);
  await t.shot('octopus');

  // ---- the touch pool: pet the starfish
  const pet = await t.ev(() => {
    const P = CFG.AQUARIUM.POOL; T.tp(P.x, P.y + P.ry + 14, 'aquarium'); T.step(2);
    const label = T.label(); T.act(); T.step(3);
    return { label, star: AquariumExt.st.star, pets: Game.s.aquarium.pets, floats: Game.floats.map((f) => f.text), hint: T.hint() };
  });
  t.expectEq(pet.label, '⭐ Pet the starfish', 'pet label at the pool');
  t.expect(pet.star > 0.5, 'the starfish wiggles');
  t.expectEq(pet.pets, 1, 'one pet counted');
  t.expect(pet.floats.includes('Squishy! ⭐'), 'the Squishy float');
  t.expectEq(pet.hint, 'Say hi to the penguins! 🐧', 'penguin hint after the starfish');
  await t.shot('starfish');

  // ---- the penguins waddle, then flop onto their bellies and slide when you come near
  const peng = await t.ev(() => {
    T.tp(15150, 3250, 'aquarium'); T.step(60);
    const waddle = AquariumExt.st.penguins.every((p) => p.mode === 'waddle');
    const I = CFG.AQUARIUM.ICE; T.tp(I.x0 - 26, I.y0 - 20, 'aquarium'); T.step(30);
    const slide = AquariumExt.st.penguins.every((p) => p.mode === 'slide'), inside = AquariumExt.st.penguins.every((p) => p.x > I.x0 && p.x < I.x1 && p.y > I.y0 && p.y < I.y1);
    return { waddle, slide, inside, flag: Game.s.aquarium.penguins, floats: Game.floats.map((f) => f.text), hint: T.hint() };
  });
  t.expect(peng.waddle, 'penguins waddle while nobody is near');
  t.expect(peng.slide && peng.inside, 'penguins slide on their bellies, staying on the ice, when the chef comes near');
  t.expect(peng.flag && peng.floats.includes('Wheee! 🐧'), 'the penguins cheered');
  await t.shot('penguins');
  t.expect(await t.ev(() => { T.tp(15150, 3250, 'aquarium'); T.step(5); return AquariumExt.st.penguins.every((p) => p.mode === 'waddle'); }), 'penguins stand back up when the chef walks away');

  // ---- the diver mascot walks a loop and waves when you are close
  const diver = await t.ev(() => {
    const d = AquariumExt.st.diver; T.tp(15150, 3250, 'aquarium'); const x0 = d.x, y0 = d.y; T.step(120); const walked = Math.hypot(d.x - x0, d.y - y0) > 20 || d.leg !== 1;
    T.tp(d.x - 40, d.y + 10, 'aquarium'); T.step(20);
    return { walked, wave: d.wave > 0, facing: d.facing, free: AquariumExt.free(Game.player.x, Game.player.y) };
  });
  t.expect(diver.walked, 'the diver walks about');
  t.expect(diver.wave && diver.facing === -1, 'the diver stops and waves at the chef');

  // ---- the $5 fish plush and the $3 shells
  const plush = await t.ev(() => {
    Game.s.cash = 20; const P = CFG.AQUARIUM.PADS.plush; T.tp(P.x, P.y, 'aquarium'); T.step(1);
    const hint = T.hint(), n = T.until(() => AquariumExt.st.plush > 0, 400);
    return { hint, n, cash: Game.s.cash, plush: AquariumExt.st.plush, plushes: Game.s.aquarium.plushes, after: T.hint() };
  });
  t.expectEq(plush.hint, 'Buy a fish plush! 🐠', 'plush hint with cash in hand');
  t.expect(plush.n >= 0, 'the circle sold a fish plush');
  t.expectEq(plush.cash, 15, 'the plush cost $5');
  t.expectEq(plush.plushes, 1, 'plush counted');
  t.expect(plush.plush > 25, 'the plush lasts half a minute');
  t.expectEq(plush.after, 'Buy a shell for your shelf! 🐚', 'shell hint next');
  const shell = await t.ev(() => {
    const P = CFG.AQUARIUM.PADS.shell; T.tp(P.x, P.y, 'aquarium'); T.step(1);
    const n = T.until(() => Game.s.aquarium.shells > 0, 400);
    const pads = Game.allPads().filter((p) => p.key === 'aquaShell');
    return { n, cash: Game.s.cash, shells: Game.s.aquarium.shells, sub: pads[0] && pads[0].sub, hint: T.hint() };
  });
  t.expect(shell.n >= 0, 'the circle sold a shell');
  t.expectEq(shell.cash, 12, 'the shell cost $3');
  t.expectEq(shell.shells, 1, 'one shell on the shelf');
  t.expectEq(shell.sub, '1 on the shelf', 'the shell circle counts the shelf');
  t.expectEq(shell.hint, 'A fishy friend! 🐠', 'plush hint while carrying it');
  await t.ev(() => { T.tp(15090, 3300, 'aquarium'); T.step(2); });
  await t.shot('gifts');
  // the plush comes along outside, then runs out; the shells stay saved
  t.expect(await t.ev(() => { T.tp(540, 430, 'town'); T.step(2); return AquariumExt.st.plush > 20; }), 'the plush comes along to the town');
  t.expect(await t.ev(() => { T.step(60 * 31); return AquariumExt.st.plush === 0; }), 'the plush is finished after 30 s');
  t.expectEq(await t.ev(() => AquariumExt.hint(Game)), undefined, 'no aquarium hint in the town');
  await t.ev(() => Game.save());
  await t.reload();
  if (await t.ev(() => typeof AquariumExt === 'undefined')) { await t.page.addScriptTag({ url: 'js/city-aquarium.js' }); await t.ev(() => T.step(2)); }
  t.expectEq(await t.ev(() => Game.s.aquarium.shells), 1, 'the shell survives a reload');

  // ---- a reload or push into a wall, the pool or the ice lands back on the mat
  await t.ev(() => { const R = CFG.AQUARIUM.ROOM; T.tp(R.x0 - 10, 3200, 'aquarium'); T.step(3); });
  t.expect(await t.ev(() => AquariumExt.free(Game.player.x, Game.player.y)), 'pushed into the wall: rescued onto the floor');
  t.expect(await t.ev(() => { const E = CFG.AQUARIUM.EXIT; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'the rescue lands on the exit mat');
  await t.ev(() => { const P = CFG.AQUARIUM.POOL; T.tp(P.x, P.y, 'aquarium'); T.step(3); });
  t.expect(await t.ev(() => AquariumExt.free(Game.player.x, Game.player.y)), 'dropped into the touch pool: rescued');
  await t.ev(() => { const c = AquariumExt.iceCentre(); T.tp(c.x, c.y, 'aquarium'); T.step(3); });
  t.expect(await t.ev(() => AquariumExt.free(Game.player.x, Game.player.y)), 'dropped onto the ice: rescued');

  // ---- phone-size hall
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const T2 = CFG.AQUARIUM.TUNNEL; T.tp((T2.x0 + T2.x1) / 2, (T2.y0 + T2.y1) / 2, 'aquarium'); T.step(100); });
  await t.shot('phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- Take-me-home from inside
  await t.ev(() => { const F = CFG.AQUARIUM.FEED; T.tp(F.x + 24, F.y + 2, 'aquarium'); T.act(); T.step(5); Game.goHome(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'town', 'Take-me-home leaves the aquarium');
  t.expect(await t.ev(() => AquariumExt.st.flakes.length === 0 && AquariumExt.st.feedCd === 0), 'the feeding is cleared by Take-me-home');
  t.expect(await t.ev(() => { const S = CFG.PLAYER_START; return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 2; }), 'back on the pizzeria floor');

  // ---- out through the door: back on the sidewalk at the door spot
  await t.ev(() => { const E = CFG.AQUARIUM.EXIT; T.tp(E.x, E.y, 'aquarium'); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back outside in the City');
  t.expect(await t.ev(() => { const D = CFG.AQUARIUM.DOOR_OUT; return Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 2; }), 'standing at the door spot');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'the door offers going back in');
  t.expect(await t.ev(() => T.toasts.filter((m) => m === '🐠 Welcome to the Aquarium!').length === 0), 'no second welcome toast after the reload (already seen)');

  await t.ev(() => { Render.setZoom(1); T.tp(540, 430, 'town'); });
};
