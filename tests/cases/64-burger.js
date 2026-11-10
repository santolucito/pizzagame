'use strict';
// The burger shop west of the pizzeria: its footprint is clear of roads, trees, the pond, the slide's landing mat and
// the other town things; the chef walks from the slide's mat to the door; the hint near the door; going in and out;
// ordering a burger (built layer by layer, eaten in three CHOMPs, Yum!), with and without cash; fries and a
// milkshake; sitting in a booth; Take-me-home mid-bite; screenshots outside and inside.
module.exports = async (t) => {
  await t.boot();
  const K = await t.ev(() => CFG.BURGER);
  t.expect(await t.ev(() => Game.ext.indexOf(BurgerExt) >= 0 && Render.ext.includes(BurgerExt)), 'registered with Game and Render');
  t.expectEq(await t.ev(() => CFG.AREAS.burger && CFG.AREAS.burger.place), 'town', 'the interior belongs to the town (world map)');

  // ---- the shop's rectangle is clear: no roads, no trees, the pond, the dog's home, the slide's mat, the pizzeria
  const clear = await t.ev((K) => {
    const S = K.SHOP, out = [];
    const inS = (x, y, m = 0) => x > S.x0 - m && x < S.x1 + m && y > S.y0 - m && y < S.y1 + m;
    for (const tr of CFG.TREES) if (inS(tr.x, tr.y, 30) || inS(tr.x, tr.y - 44 * tr.s, 0)) out.push('tree ' + tr.x + ',' + tr.y);
    const P = CFG.POND; if (inS(P.x, P.y, P.rx)) out.push('pond');
    if (inS(CFG.DOG_HOME.x, CFG.DOG_HOME.y, 20)) out.push('dog home');
    const L = CFG.PLAYROOM.TOWN.land; if (inS(L.x, L.y, 40)) out.push('slide mat');
    const B = CFG.BUILDING; if (S.x1 > B.x0 - 20 && S.y0 < B.y1) out.push('pizzeria');
    if (S.x0 < -400 + 20) out.push('West Road');
    if (S.y1 > 920 - 60) out.push('South Road');
    // every other obstacle in the town stays out of the shop (and out from under the door mat)
    T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town');
    for (const o of Game.obstacles()) {
      if (o.x === S.x0 && o.y === S.y0) continue;
      if (o.x < S.x1 && o.x + o.w > S.x0 && o.y < S.y1 && o.y + o.h > S.y0) out.push('obstacle ' + JSON.stringify(o));
    }
    return out;
  }, K);
  t.expectEq(clear.join('; '), '', 'nothing else in the burger shop rectangle');
  const mat = await t.ev((K) => { T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); return Game.obstacles().some((o) => Game.hitRect(K.DOOR_OUT.x, K.DOOR_OUT.y, 14, o)); }, K);
  t.expect(!mat, 'the door mat is clear of obstacles');
  const solid = await t.ev((K) => { T.tp(-276, 760, 'town'); const a = Game.obstacles().some((o) => Game.hitRect(-276, 760, 14, o)); const c = Game.townObstacles(true).some((o) => Game.hitRect(-276, 760, 14, o)); return { a, c }; }, K);
  t.expect(solid.a && solid.c, 'the building is solid for the chef and for cars');

  // ---- walk from the slide's landing mat to the door: down the grass east of the shop, then west along its front
  const walk = await t.ev((K) => {
    const L = CFG.PLAYROOM.TOWN.land; T.tp(L.x, L.y, 'town');
    T.steer(0, 1); const a = T.until(() => Game.player.y >= K.DOOR_OUT.y, 600); T.unsteer();
    T.steer(-1, 0); const b = T.until(() => Game.player.x <= K.DOOR_OUT.x, 600); T.unsteer(); T.step(1);
    return { a, b, x: Game.player.x, y: Game.player.y, label: T.label() };
  }, K);
  t.expect(walk.a >= 0 && walk.b >= 0, `walked from the slide mat to the door (${JSON.stringify(walk)})`);
  t.expectEq(walk.label, '🚪 Go inside', 'the door button after walking there');
  // and walking straight into the front wall stops at it
  const bump = await t.ev((K) => { T.tp(K.DOOR_OUT.x - 50, K.DOOR_OUT.y, 'town'); T.steer(0, -1); T.step(60); T.unsteer(); return Game.player.y; }, K);
  t.expect(bump >= K.SHOP.y1, `the front wall stops the chef (${bump})`);

  // ---- hints: none far away, one near the door pointing at it
  t.expect(await t.ev((K) => { T.tp(K.DOOR_OUT.x + 250, K.DOOR_OUT.y + 40, 'town'); return T.hint() !== 'Burgers! Go inside 🍔'; }, K), 'no burger hint far away');
  const near = await t.ev((K) => { T.tp(K.DOOR_OUT.x + 60, K.DOOR_OUT.y + 10, 'town'); return { text: T.hint(), target: Game.hint && Game.hint.target, label: T.label() }; }, K);
  t.expectEq(near.text, 'Burgers! Go inside 🍔', 'hint near the door');
  t.expect(near.target && near.target.x === K.DOOR_OUT.x, 'the hint points at the door');
  t.expect(near.label !== '🚪 Go inside', 'no door button a little way off');

  // ---- screenshot outside
  await t.ev((K) => { T.tp(K.DOOR_OUT.x + 40, K.DOOR_OUT.y + 10, 'town'); Render.MIN_ZOOMED_VIEW = 150; Render.setZoom(1.4); Game.cameraSnap = true; T.step(2); }, K);
  await t.shot('outside');
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; T.step(1); });

  // ---- in through the door
  const inside = await t.ev((K) => { T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); T.act(); return { area: Game.area, x: Game.player.x, y: Game.player.y, seen: Game.s.burger.seen, free: BurgerExt.free(Game.player.x, Game.player.y), label: T.label() }; }, K);
  t.expectEq(inside.area, 'burger', 'inside the burger shop');
  t.expect(inside.free, 'standing on free floor inside');
  t.expect(inside.seen, 'first visit remembered');
  t.expectEq(inside.label, '🚪 Go outside', 'the way back out on the mat');
  t.expectEq(await t.ev(() => T.hint()), 'Get a burger! 🍔', 'inside, the hint says to get a burger');
  // walk from the mat to the burger spot (up, then along)
  const toSpot = await t.ev((K) => {
    const S = K.SPOTS.burger;
    T.steer(0, -1); const a = T.until(() => Game.player.y <= S.y + 40, 600); T.unsteer();
    T.steer(-1, 0); const b = T.until(() => Game.player.x <= S.x, 600); T.unsteer();
    T.steer(0, -1); const c = T.until(() => Game.player.y <= S.y, 200); T.unsteer(); T.step(1);
    return { a, b, c, label: T.label() };
  }, K);
  t.expectEq(toSpot.label, '🍔 Get a burger ($3)', `walked to the burger spot (${JSON.stringify(toSpot)})`);

  // ---- a burger with cash: built layer by layer, then three CHOMPs and Yum
  const buy = await t.ev(() => { Game.s.cash = 20; T.act(); const o = BurgerExt.st.order; return { cash: Game.s.cash, kind: o && o.kind, phase: o && o.phase, label: T.label(), paid: Game.floats.some((f) => f.text === '-$3') }; });
  t.expectEq(buy.cash, 17, 'paid $3');
  t.expectEq(buy.phase, 'make', 'the cook starts making it');
  t.expect(buy.paid, '-$3 float');
  t.expect(buy.label !== '🍔 Get a burger ($3)', 'one order at a time');
  const half = await t.ev(() => { T.step(Math.round(CFG.BURGER.T.layer * 3.5 * 60)); return BurgerExt.st.order.landed; });
  t.expectEq(half, 3, 'three layers stacked after a while');
  await t.ev(() => { Render.MIN_ZOOMED_VIEW = 150; Render.setZoom(2.2); Game.cameraSnap = true; T.step(1); BurgerExt.st.order.t = CFG.BURGER.T.layer * 3.5; });
  await t.shot('stacking');
  const built = await t.ev(() => { const n = T.until(() => BurgerExt.st.order.phase !== 'make', 400); return { n, landed: BurgerExt.st.order.landed, phase: BurgerExt.st.order.phase }; });
  t.expectEq(built.landed, 6, 'all six layers: bun, patty, cheese, lettuce, tomato, bun');
  t.expectEq(built.phase, 'give', 'then it is handed over');
  const eat = await t.ev(() => {
    T.until(() => BurgerExt.st.order.phase === 'eat', 100);
    const pose = BurgerExt.foodPose(Game), p = Game.player;
    T.until(() => BurgerExt.st.order.bites >= 1, 200);
    return { held: pose.held, dx: pose.x - p.x, chomp: Game.floats.some((f) => f.text === 'CHOMP!') };
  });
  t.expect(eat.held && Math.abs(eat.dx) > 10, `the chef holds the burger (${JSON.stringify(eat)})`);
  t.expect(eat.chomp, 'CHOMP!');
  await t.ev(() => { BurgerExt.st.order.t = CFG.BURGER.T.bite * 0.5; BurgerExt.st.order.bites = 1; BurgerExt.st.say = null; });
  await t.shot('chomp');
  const done = await t.ev(() => { const n = T.until(() => BurgerExt.st.order && BurgerExt.st.order.phase === 'yum', 400); return { n, eaten: Game.s.burger.eaten, yum: Game.floats.some((f) => f.text === 'Yum! 😋'), chomps: Game.floats.filter((f) => f.text === 'CHOMP!').length }; });
  t.expect(done.n >= 0, 'eaten up');
  t.expectEq(done.eaten, 1, 'one burger eaten');
  t.expect(done.yum, 'Yum! 😋');
  const back = await t.ev(() => { T.until(() => !BurgerExt.st.order, 200); return T.label(); });
  t.expectEq(back, '🍔 Get a burger ($3)', 'the button is back after eating');

  // ---- broke: on the house
  const free = await t.ev(() => { Game.s.cash = 1; T.act(); return { cash: Game.s.cash, phase: BurgerExt.st.order && BurgerExt.st.order.phase, float: Game.floats.some((f) => f.text === 'On the house! 🍔') }; });
  t.expectEq(free.cash, 1, 'free when broke');
  t.expectEq(free.phase, 'make', 'still gets a burger');
  t.expect(free.float, 'On the house! float');
  t.expectEq(await t.ev(() => { T.until(() => !BurgerExt.st.order, 800); return Game.s.burger.eaten; }), 2, 'two burgers eaten');

  // ---- fries and a milkshake
  const fries = await t.ev((K) => { Game.s.cash = 20; T.tp(K.SPOTS.fries.x, K.SPOTS.fries.y, 'burger'); const label = T.label(); T.act(); T.until(() => !BurgerExt.st.order, 800); return { label, n: Game.s.burger.fries, cash: Game.s.cash }; }, K);
  t.expectEq(fries.label, '🍟 Get fries ($2)', 'fries button');
  t.expectEq(fries.n, 1, 'fries eaten');
  t.expectEq(fries.cash, 18, 'fries cost $2');
  const shake = await t.ev((K) => { T.tp(K.SPOTS.shake.x, K.SPOTS.shake.y, 'burger'); const label = T.label(); T.act(); T.step(60); const o = BurgerExt.st.order; const ph = o && o.phase; T.until(() => !BurgerExt.st.order, 800); return { label, ph, n: Game.s.burger.shakes }; }, K);
  t.expectEq(shake.label, '🥤 Get a milkshake ($2)', 'milkshake button');
  t.expectEq(shake.n, 1, 'milkshake drunk');

  // ---- sit in a booth (with fries in hand), stand up again
  const sit = await t.ev(() => {
    const s = BurgerExt.seats()[0]; T.tp(s.spot.x, s.spot.y, 'burger');
    const label = T.label(); T.act();
    const sat = { x: Game.player.x, y: Game.player.y, label: T.label(), hint: T.hint() };
    T.steer(-1, 0); T.step(30); T.unsteer();
    const still = Game.player.x === sat.x && Game.player.y === sat.y;
    T.act();
    return { label, sat, still, after: T.label(), free: BurgerExt.free(Game.player.x, Game.player.y), sits: Game.s.burger.sits };
  });
  t.expectEq(sit.label, '🪑 Sit down', 'sit button by the booth');
  t.expectEq(sit.sat.label, '🚶 Stand up', 'stand-up button while seated');
  t.expect(sit.still, 'stays seated while the stick is pushed');
  t.expectEq(sit.sits, 1, 'sit counted');
  t.expect(sit.free && sit.after !== '🚶 Stand up', 'stood up onto free floor');
  // sit at a little table too
  t.expectEq(await t.ev(() => { const s = BurgerExt.seats()[2]; T.tp(s.spot.x, s.spot.y, 'burger'); const l = T.label(); T.act(); const l2 = T.label(); T.act(); return l + '|' + l2; }), '🪑 Sit down|🚶 Stand up', 'the round table has a seat too');

  // ---- every spot inside is on free floor and reachable spots are not inside furniture
  const spots = await t.ev((K) => {
    const bad = [];
    for (const [k, S] of Object.entries(K.SPOTS)) if (!BurgerExt.free(S.x, S.y)) bad.push(k);
    BurgerExt.seats().forEach((s, i) => { if (!BurgerExt.free(s.spot.x, s.spot.y)) bad.push('seat' + i); });
    if (!BurgerExt.free(K.EXIT.x, K.EXIT.y - 8)) bad.push('exit');
    return bad;
  }, K);
  t.expectEq(spots.join(','), '', 'all spots on free floor');

  // ---- a screenshot of the room with a burger being built
  await t.ev((K) => { Game.s.cash = 20; T.tp(K.SPOTS.burger.x, K.SPOTS.burger.y, 'burger'); T.act(); BurgerExt.st.order.t = CFG.BURGER.T.layer * 4.6; BurgerExt.st.say = null; Render.setZoom(1); Game.cameraSnap = true; T.step(1); }, K);
  await t.shot('inside');
  await t.ev(() => { T.until(() => !BurgerExt.st.order, 800); });

  // ---- rescue: stuck inside the counter goes back onto the mat
  const rescue = await t.ev((K) => { Game.player.x = K.SPOTS.burger.x; Game.player.y = K.COUNTER.y0 + 10; T.step(2); return { x: Game.player.x, y: Game.player.y }; }, K);
  t.expect(Math.abs(rescue.x - K.EXIT.x) < 2 && Math.abs(rescue.y - (K.EXIT.y - 8)) < 2, `rescued onto the mat (${JSON.stringify(rescue)})`);

  // ---- out again
  const out = await t.ev((K) => { T.tp(K.EXIT.x, K.EXIT.y - 8, 'burger'); T.act(); return { area: Game.area, x: Game.player.x, y: Game.player.y, blocked: Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 14, o)) }; }, K);
  t.expectEq(out.area, 'town', 'back in town');
  t.expect(Math.abs(out.x - K.DOOR_OUT.x) < 2 && !out.blocked, 'outside the door, not in a wall');

  // ---- Take-me-home mid-bite clears the burger; nothing counted twice
  const gh = await t.ev((K) => {
    Game.s.cash = 20; T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); T.act(); T.tp(K.SPOTS.burger.x, K.SPOTS.burger.y, 'burger'); T.act();
    T.until(() => BurgerExt.st.order && BurgerExt.st.order.phase === 'eat', 600);
    const ph = BurgerExt.st.order && BurgerExt.st.order.phase, n = Game.s.burger.eaten;
    Game.goHome(); T.step(30);
    return { ph, order: BurgerExt.st.order, area: Game.area, eaten: Game.s.burger.eaten, n, hint: T.hint() };
  }, K);
  t.expectEq(gh.ph, 'eat', 'was eating');
  t.expectEq(gh.order, null, 'home clears the burger');
  t.expectEq(gh.area, 'town', 'back home');
  t.expectEq(gh.eaten, gh.n, 'no extra burger counted');

  // ---- saved: the counts survive a reload
  const saved = await t.ev(() => { Game.save(); return Game.s.burger; });
  await t.reload();
  const loaded = await t.ev(() => Game.s.burger);
  t.expectEq(loaded.eaten, saved.eaten, 'burgers eaten survive a reload');
  t.expectEq(loaded.fries, 1, 'fries survive a reload');

  // ---- not while driving
  const drive = await t.ev((K) => {
    T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); const v = Game.vehicles()[0];
    if (!v) return { skip: true };
    Game.driving = true; Game.vehicle = v;
    const label = Game.actionLabel(), hint = BurgerExt.hint(Game);
    Game.driving = false; Game.vehicle = null;
    return { label, hint };
  }, K);
  if (!drive.skip) { t.expect(drive.label !== '🚪 Go inside', 'no door button while driving'); t.expectEq(drive.hint, undefined, 'no hint while driving'); }

  // ---- phone screenshot inside, eating
  await t.boot({ viewport: { width: 390, height: 844 } });
  await t.ev((K) => { Game.s.cash = 20; T.tp(K.DOOR_OUT.x, K.DOOR_OUT.y, 'town'); T.act(); T.tp(K.SPOTS.burger.x, K.SPOTS.burger.y + 30, 'burger'); Game.player.y = K.SPOTS.burger.y; T.act(); T.until(() => BurgerExt.st.order.phase === 'eat', 600); BurgerExt.st.say = null; Render.MIN_ZOOMED_VIEW = 120; Render.setZoom(2.4); Game.cameraSnap = true; T.step(1); }, K);
  await t.ev(() => { BurgerExt.st.order.t = CFG.BURGER.T.bite * 1.2; BurgerExt.st.order.bites = 1; });
  await t.shot('phone-eating');
  t.assertNoPageErrors();
};
