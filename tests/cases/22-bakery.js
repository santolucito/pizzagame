'use strict';
// The Bakery (City building 2), now a big bakery of its own: the door on Bus Street, the shop / kitchen / café inside
// (a grid walk reaches every part from the door), the cake mini game played by taps and the big button (flavour, eggs,
// flour, stir by circling, the tin, the oven, icing, sprinkles, candles, a topper, Ta-da), carrying the cake to a café
// table and eating it slice by slice, a second cake sent home by the delivery bike and then eaten upstairs in the pizza
// rain room, the bread mini game (knead, shape, bake) eaten at a table and put on the shelf, the bell and the treat pads,
// rescues, going out, Take me home mid-game, and a reload inside.
module.exports = async (t) => {
  await t.boot();
  const K = await t.ev(() => CFG.BAKERY);
  const tap = async (px, py) => { const c = await t.ev((q) => BakeryExt.toClient(q[0], q[1]), [px, py]); await t.page.mouse.click(c.x, c.y); await t.ev(() => T.step(1)); };
  const G = () => t.ev(() => { const g = BakeryExt.st.game; return g && { stage: g.stage, dec: g.dec, adds: g.adds, stir: g.stir, baking: g.baking, baked: g.baked, kneads: g.kneads, shape: g.shape, cake: g.cake && JSON.parse(JSON.stringify(g.cake)) }; });

  // ---- registered first, a map of its own in a free rectangle, placed in the City on the world map
  const reg = await t.ev(() => {
    const W = CFG.AREAS.bakery.WORLD, over = Object.entries(CFG.AREAS).filter(([k, a]) => k !== 'bakery' && a.WORLD && a.WORLD.x0 < W.x1 && a.WORLD.x1 > W.x0 && a.WORLD.y0 < W.y1 && a.WORLD.y1 > W.y0).map(([k]) => k);
    return { order: Game.ext.indexOf(BakeryExt) < Game.ext.indexOf(CityExt), place: CFG.AREAS.bakery.place, W, over, room: CFG.BAKERY.ROOM, wm: typeof WorldMapExt !== 'undefined' ? WorldMapExt.placeOf('bakery') : 'city' };
  });
  t.expect(reg.order, 'the bakery comes before the City in Game.ext');
  t.expectEq(reg.place, 'city', 'the bakery map belongs to the City');
  t.expectEq(reg.wm, 'city', 'the world map puts the bakery in the City');
  t.expectEq(reg.over.join(','), '', 'the bakery rectangle overlaps no other map');
  t.expect(reg.room.x1 - reg.room.x0 >= 1500 && reg.room.y1 - reg.room.y0 >= 900, `a much larger bakery (${reg.room.x1 - reg.room.x0} × ${reg.room.y1 - reg.room.y0})`);

  // ---- outside: the hint near the door, the button on the door spot
  await t.ev((D) => { T.tp(D.x, D.y + 50, 'city'); T.step(1); }, K.DOOR_OUT);
  t.expectEq(await t.ev(() => T.hint()), 'Go inside the bakery 🥐', 'bakery hint near the door');
  t.expect(await t.ev((D) => { const h = Game.hint && Game.hint.target; return !!h && Math.abs(h.x - D.x) < 1; }, K.DOOR_OUT), 'the hint points at the door');
  t.expect(await t.ev((D) => { T.tp(D.x, D.y + 110, 'city'); T.step(1); return T.hint() !== 'Go inside the bakery 🥐'; }, K.DOOR_OUT), 'no bakery hint from further away');
  await t.ev((D) => { T.tp(D.x, D.y, 'city'); }, K.DOOR_OUT);
  t.expectEq(await t.ev(() => T.label()), '🚪 Go inside', 'door label on the door spot');
  await t.ev(() => { Render.setZoom(1.2); T.step(2); });
  await t.shot('door');

  // ---- going in
  await t.ev(() => { T.act(); T.step(30); Render.setZoom(1); T.step(1); });
  t.expectEq(await t.ev(() => Game.area), 'bakery', 'inside the bakery');
  const at = await t.ev(() => [Game.player.x, Game.player.y]);
  t.expect(Math.abs(at[0] - K.EXIT.x) < 1 && Math.abs(at[1] - (K.EXIT.y - 8)) < 1, `arrived just above the exit mat (${at})`);
  t.expect(await t.ev(() => T.toasts.includes('🥐 Welcome to the Bakery!')), 'welcome toast the first time');
  t.expect(await t.ev(() => BakeryExt.free(Game.player.x, Game.player.y)), 'standing on free floor');
  const h0 = await t.ev(() => ({ text: T.hint(), target: Game.hint && Game.hint.target }));
  t.expectEq(h0.text, 'Make a cake in the kitchen! 🎂', 'first hint: make a cake');
  t.expect(h0.target && h0.target.x === K.MIX.spot.x && h0.target.y === K.MIX.spot.y, `the hint points at the mixing station (${JSON.stringify(h0)})`);
  await t.shot('inside');

  // ---- every part can be reached on foot from the door (a grid walk with the chef's size)
  const reach = await t.ev(() => {
    const K = CFG.BAKERY, R = K.ROOM, obs = Game.obstacles(), step = 12, r = 12;
    const ok = (x, y) => x > R.x0 + r && x < R.x1 - r && y > R.y0 + r && y < R.y1 - r && !obs.some((o) => Game.hitRect(x, y, r, o));
    const key = (i, j) => i + ',' + j, seen = new Set(), q = [];
    const i0 = Math.round((K.EXIT.x - R.x0) / step), j0 = Math.round((K.EXIT.y - 8 - R.y0) / step);
    seen.add(key(i0, j0)); q.push([i0, j0]);
    while (q.length) { const [i, j] = q.shift(); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj, k = key(a, b); if (seen.has(k)) continue; if (!ok(R.x0 + a * step, R.y0 + b * step)) continue; seen.add(k); q.push([a, b]); } }
    const can = (x, y) => { for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const i = Math.round((x - R.x0) / step) + a, j = Math.round((y - R.y0) / step) + b; if (seen.has(key(i, j)) && Math.hypot(R.x0 + i * step - x, R.y0 + j * step - y) < 20) return true; } return false; };
    const spots = { exit: K.EXIT, mix: K.MIX.spot, decor: K.DECOR.spot, dough: K.DOUGH.spot, bell: K.BELL.spot, croissant: K.PADS.croissant, cupcake: K.PADS.cupcake, cake: K.PADS.cake, shelf: K.SHELF.spot, desk: K.DESK.spot, coin: K.COIN,
      kitchenNW: { x: 29110, y: 5270 }, kitchenNE: { x: 30030, y: 5180 }, cafeNE: { x: 30600, y: 5240 }, cafeSE: { x: 30580, y: 6060 }, shopSW: { x: 29170, y: 6060 } };
    K.TABLES.forEach((_, i) => { spots['seat' + i] = BakeryExt.seat(i); });
    const missing = Object.entries(spots).filter(([, s]) => !can(s.x, s.y)).map(([k]) => k);
    const blocked = Object.entries(spots).filter(([, s]) => !ok(s.x, s.y)).map(([k]) => k);
    return { cells: seen.size, missing, blocked };
  });
  t.expectEq(reach.blocked.join(','), '', 'every stand spot is free floor');
  t.expectEq(reach.missing.join(','), '', `every part reachable on foot from the door (${reach.cells} cells)`);
  t.expect(reach.cells > 5000, `lots of room to walk (${reach.cells} cells of 12 px)`);
  // the opening into the kitchen is wide, and walking through it works
  t.expect(K.COUNTER.b[0] - K.COUNTER.a[1] >= 240, 'a wide way into the kitchen');
  const walked = await t.ev(() => { const K = CFG.BAKERY; T.tp((K.COUNTER.a[1] + K.COUNTER.b[0]) / 2, 5760, 'bakery'); T.steer(0, -1); T.step(90); T.unsteer(); return Game.player.y; });
  t.expect(walked < K.COUNTER.y0 - 40, `walked up through the counter gap into the kitchen (y ${walked.toFixed(0)})`);

  // ---- the cake game: open it at the mixing station
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); }, K.MIX.spot);
  t.expectEq(await t.ev(() => T.hint()), 'Make a cake! 🎂', 'the cake hint at the mixing station');
  t.expectEq(await t.ev(() => T.label()), '🎂 Make a cake', 'make-a-cake button at the mixing station');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq((await G()).stage, 'flavour', 'the cake game opens on the flavours');
  t.expect(await t.ev(() => !Game.hint), 'no hint over the game');
  t.expect(/^(🍫 Chocolate|🍓 Strawberry|🍦 Vanilla)!$/.test(await t.ev(() => T.label())), 'the button names the lit flavour');
  t.expect(await t.ev((S) => { T.steer(1, 0); T.step(30); T.unsteer(); return Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 1; }, K.MIX.spot), 'the chef stays at the station while the game is open');
  t.expectEq(await t.ev(() => Game.allPads().filter((p) => p.key.startsWith('bakery')).length), 0, 'no treat pads while a game is open');
  await t.shot('cake-flavour');
  await tap(180, 250);   // tap the strawberry bowl
  let g1 = await G();
  t.expectEq(g1.cake.flavour, 'strawberry', 'tapped strawberry');
  t.expectEq(g1.stage, 'mix', 'on to the mixing bowl');
  t.expectEq(await t.ev(() => T.label()), '🥚 Crack an egg', 'crack an egg first');
  const mixLabels = [];
  for (let i = 0; i < 4; i++) mixLabels.push(await t.ev(() => { const l = T.label(); T.act(); T.step(30); return l; }));
  t.expectEq(mixLabels.join(' | '), '🥚 Crack an egg | 🥚 Crack an egg | 🌾 Pour the flour | 🍓 Add strawberries', 'the ingredients go in one press at a time');
  g1 = await G();
  t.expect(g1.adds === 4 && g1.stage === 'stir', `all four in, on to stirring (${JSON.stringify(g1)})`);
  // stir by circling a finger round the bowl
  {
    const pts = []; for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 4; pts.push([180 + Math.cos(a) * 80, 300 + Math.sin(a) * 30]); }
    const cs = await t.ev((ps) => ps.map((p) => BakeryExt.toClient(p[0], p[1])), pts);
    await t.page.mouse.move(cs[0].x, cs[0].y); await t.page.mouse.down();
    for (const c of cs.slice(1)) await t.page.mouse.move(c.x, c.y);
    await t.page.mouse.up(); await t.ev(() => T.step(1));
  }
  g1 = await G();
  t.expect(g1.stir >= 5 || g1.stage === 'pour', `circling the finger stirs (${g1.stir})`);
  await t.shot('cake-stir');
  t.expect(await t.ev(() => T.until(() => { const g = BakeryExt.st.game; if (g.stage !== 'stir') return true; if (T.label() === '🥄 Stir!') T.act(); return false; }, 60) >= 0), 'the button stirs it smooth');
  t.expectEq((await G()).stage, 'pour', 'on to pouring');
  t.expectEq(await t.ev(() => T.label()), '🥣 Pour it in the tin', 'pour button');
  await t.ev(() => { T.act(); T.step(70); });
  t.expectEq((await G()).stage, 'oven', 'into the oven step');
  t.expectEq(await t.ev(() => T.label()), '🔥 Put it in the oven', 'oven button');
  await t.ev(() => { T.act(); T.step(60); });
  g1 = await G();
  t.expect(g1.baking && !g1.baked, 'baking');
  t.expectEq(await t.ev(() => T.label()), '⏳ Baking…', 'waiting while it bakes');
  await t.shot('cake-oven');
  await t.ev(() => T.step(260));
  t.expect((await G()).baked, 'the cake is baked (DING)');
  t.expectEq(await t.ev(() => T.label()), '🧤 Take it out!', 'take it out');
  await t.ev(() => { T.act(); T.step(2); });
  g1 = await G();
  t.expect(g1.stage === 'decorate' && g1.dec === 'icing', 'decorating: icing first');
  for (let i = 0; i < 4; i++) await t.ev(() => { T.act(); T.step(10); });
  t.expectEq((await G()).dec, 'sprinkles', 'four squeezes of icing, then sprinkles');
  t.expectEq(await t.ev(() => T.label()), '✨ Add sprinkles', 'sprinkles button');
  await t.ev(() => { T.act(); T.step(5); });
  await t.shot('cake-sprinkles');
  await t.ev(() => T.step(80));
  g1 = await G();
  t.expect(g1.dec === 'candles' && g1.cake.decor.sprinkles, 'sprinkles landed, now candles');
  for (let i = 0; i < 3; i++) await t.ev(() => { T.act(); T.step(5); });
  g1 = await G();
  t.expect(g1.dec === 'topper' && g1.cake.decor.candles === 3, 'three candles, then the topper');
  await t.shot('cake-topper');
  await tap(300, 160);   // tap the pizza topper
  g1 = await G();
  t.expect(g1.stage === 'tada' && g1.cake.decor.topper === 'pizza', `a pizza on top, Ta-da! (${JSON.stringify(g1)})`);
  t.expectEq(await t.ev(() => T.label()), '🎂 Carry the cake', 'carry the cake');
  await t.ev(() => T.step(30));
  await t.shot('cake-tada');
  await t.ev(() => { T.act(); T.step(2); });
  const carried = await t.ev(() => ({ game: !!BakeryExt.st.game, carry: BakeryExt.st.carry && JSON.parse(JSON.stringify(BakeryExt.st.carry)), cakes: Game.s.bakery.cakes, last: Game.s.bakery.lastCake, free: BakeryExt.free(Game.player.x, Game.player.y), hint: T.hint(), target: Game.hint && Game.hint.target }));
  t.expect(!carried.game && carried.carry && carried.carry.kind === 'cake' && carried.carry.cake.flavour === 'strawberry', 'carrying the strawberry cake');
  t.expectEq(carried.cakes, 1, 'one cake made');
  t.expect(carried.last && carried.last.decor.topper === 'pizza', 'the last cake shows on the decorating table');
  t.expect(carried.free, 'stepped out onto free floor');
  t.expectEq(carried.hint, 'Eat it at a café table 🪑 or send it home 📦', 'the carry hint');
  t.expect(!!carried.target, 'the hint points somewhere');
  t.expectEq(await t.ev(() => T.label()), null, 'no new game with full hands');
  await t.shot('carry-cake');

  // ---- sit and eat it at a café table, slice by slice
  const S0 = await t.ev(() => BakeryExt.seat(0));
  await t.ev((S) => { T.tp(S.x - 20, S.y + 14, 'bakery'); T.step(1); }, S0);
  t.expectEq(await t.ev(() => T.hint()), 'Sit and eat your cake! 🪑', 'the sit hint at a table');
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit and eat', 'sit-and-eat button');
  await t.ev(() => { Game.floats.length = 0; T.act(); T.step(80); });
  const eating = await t.ev((S) => ({ eat: BakeryExt.st.eat && BakeryExt.st.eat.kind, pinned: Math.hypot(Game.player.x - S.x, Game.player.y - S.y) < 0.5, facing: Game.player.facing, left: BakeryExt.eatLeft(), carry: BakeryExt.st.carry, label: T.label(), hint: T.hint() }), S0);
  t.expect(eating.eat === 'cake' && eating.pinned && eating.facing === 1 && !eating.carry, `sitting at the table eating the cake (${JSON.stringify(eating)})`);
  t.expect(eating.left < 1 && eating.left > 0, `slice by slice (${eating.left})`);
  t.expectEq(eating.hint, 'Yum yum! 😋', 'yum hint while eating');
  await t.shot('cafe-eating');
  const ate = await t.ev(() => { const seen = new Set(Game.floats.filter((f) => f.text === 'Yum!')); for (let i = 0; i < 140; i++) { T.step(1); for (const f of Game.floats) if (f.text === 'Yum!') seen.add(f); } return { eat: BakeryExt.st.eat, yums: seen.size, done: Game.floats.some((f) => f.text === 'Delicious! 😋'), eaten: Game.s.bakery.eaten, free: BakeryExt.free(Game.player.x, Game.player.y) }; });
  t.expect(!ate.eat && ate.done && ate.eaten === 1 && ate.free, `the cake is eaten (${JSON.stringify(ate)})`);
  t.expect(ate.yums >= 3, `"Yum!" with every slice (${ate.yums})`);

  // ---- a second cake, played with the big button only, sent home with the delivery bike
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); T.act(); T.step(2); }, K.DECOR.spot);
  t.expectEq((await G()).stage, 'flavour', 'the decorating table opens the cake game too');
  const second = await t.ev(() => T.until(() => { const g = BakeryExt.st.game; if (!g) return true; if (T.label() !== '⏳ Baking…') T.act(); return false; }, 2000));
  t.expect(second >= 0, 'the whole cake game can be played with the big button');
  const cake2 = await t.ev(() => JSON.parse(JSON.stringify(BakeryExt.st.carry)));
  t.expect(cake2 && cake2.kind === 'cake' && cake2.cake.decor.candles === 3 && cake2.cake.decor.icing === 4 && !!cake2.cake.decor.topper, `a finished cake in hand (${JSON.stringify(cake2)})`);
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); T.step(1); }, K.DESK.spot);
  t.expectEq(await t.ev(() => T.hint()), 'Send your cake home! 📦', 'the delivery hint at the desk');
  t.expectEq(await t.ev(() => T.label()), '📦 Send it home', 'send-it-home button at the desk');
  await t.ev(() => { T.act(); T.step(20); });
  const sent = await t.ev(() => ({ home: Game.s.bakery.homeCake && JSON.parse(JSON.stringify(Game.s.bakery.homeCake)), carry: BakeryExt.st.carry, phase: BakeryExt.st.del && BakeryExt.st.del.phase, hint: T.hint(), sentN: Game.s.bakery.sent }));
  t.expect(sent.home && sent.home.flavour === cake2.cake.flavour && sent.home.decor.topper === cake2.cake.decor.topper && !sent.carry, `the cake is saved to go home (${JSON.stringify(sent)})`);
  t.expectEq(sent.phase, 'box', 'it is boxed on the desk');
  t.expect(/going home/.test(sent.hint), 'the going-home hint');
  await t.shot('delivery-box');
  const phases = await t.ev(() => { const seen = []; T.until(() => { const d = BakeryExt.st.del; if (d && seen[seen.length - 1] !== d.phase) seen.push(d.phase); if (d && d.phase === 'ride' && d.t > 0.3 && d.t < 0.33) { Game.player.y = 6060; Game.player.x = 29700; Game.cameraSnap = true; } return !d; }, 2400); return seen; });
  t.expectEq(phases.join(','), 'box,out,street,ride,away,back,park,in', 'the delivery person carries it out, rides off on the bike and comes back');
  t.expectEq(await t.ev(() => T.label()), null, 'nothing to send now');
  await t.ev(() => { BakeryExt.st.del = { phase: 'ride', t: 0.5, x: 29900, y: CFG.BAKERY.STREET.bike.y, wp: 0, facing: 1, moving: true, bob: 0, cake: Game.s.bakery.homeCake, bike: true }; T.tp(29760, 6060, 'bakery'); Game.cameraSnap = true; T.step(1); });
  await t.shot('delivery-bike');
  await t.ev(() => { BakeryExt.st.del = null; T.step(1); });

  // ---- the bread game: knead, shape (tap the pretzel), bake, take it out golden
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); T.step(1); }, K.DOUGH.spot);
  t.expectEq(await t.ev(() => T.hint()), 'Bake some bread! 🍞', 'bread hint at the dough table');
  t.expectEq(await t.ev(() => T.label()), '🍞 Bake bread', 'bake-bread button');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq((await G()).stage, 'knead', 'the bread game opens on kneading');
  t.expectEq(await t.ev(() => T.label()), '👐 Knead the dough', 'knead button');
  await tap(180, 260);
  for (let i = 0; i < 4; i++) await t.ev(() => { T.act(); T.step(6); });
  t.expectEq((await G()).kneads, 5, 'five kneads (a tap and four presses)');
  await t.shot('bread-knead');
  await t.ev(() => { T.act(); T.step(3); });
  t.expectEq((await G()).stage, 'shape', 'the dough is big: shape it');
  t.expect(/^(🍞 A loaf|🥖 A baguette|🥨 A pretzel)!$/.test(await t.ev(() => T.label())), 'the button names the lit shape');
  await t.shot('bread-shape');
  await tap(290, 330);
  t.expectEq((await G()).shape, 'pretzel', 'tapped the pretzel');
  await t.ev(() => T.step(50));
  t.expectEq((await G()).stage, 'oven', 'into the oven step');
  await t.ev(() => { T.act(); T.step(120); });
  await t.shot('bread-oven');
  await t.ev(() => T.step(150));
  t.expect((await G()).baked, 'the bread is baked');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq((await G()).stage, 'tada', 'golden bread: Ta-da!');
  t.expectEq(await t.ev(() => T.label()), '🍞 Carry the bread', 'carry the bread');
  await t.shot('bread-tada');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev(() => BakeryExt.st.carry && BakeryExt.st.carry.kind === 'bread' && BakeryExt.st.carry.shape === 'pretzel' && Game.s.bakery.breads === 1), 'carrying the pretzel');
  // eat it at the table with the customer
  const S3 = await t.ev(() => BakeryExt.seat(5));
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); T.step(1); }, S3);
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit and eat', 'sit and eat the bread');
  await t.ev(() => { T.act(); T.step(90); });
  t.expect(await t.ev(() => BakeryExt.st.eat && BakeryExt.st.eat.kind === 'bread'), 'eating the bread');
  await t.shot('cafe-bread');
  await t.ev(() => T.step(120));
  t.expect(await t.ev(() => !BakeryExt.st.eat && Game.s.bakery.eaten === 2), 'the bread is eaten');
  // a second bread goes on the shelf
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); T.act(); T.step(1); T.until(() => { const g = BakeryExt.st.game; if (!g) return true; if (!/Baking|Shaping/.test(T.label())) T.act(); return false; }, 2000); }, K.DOUGH.spot);
  const bread2 = await t.ev(() => BakeryExt.st.carry && BakeryExt.st.carry.shape);
  t.expect(!!bread2, 'a second bread in hand');
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); T.step(1); }, K.SHELF.spot);
  t.expectEq(await t.ev(() => T.label()), '🧺 Put it on the shelf', 'shelf button');
  await t.ev(() => { T.act(); T.step(2); });
  t.expect(await t.ev((b) => !BakeryExt.st.carry && Game.s.bakery.shelf.length === 1 && Game.s.bakery.shelf[0] === b, bread2), 'the bread is on the shelf');

  // ---- the old bits: the bell, the treat pads (the cupcake can be eaten at a table too), the cat
  await t.ev((B) => { T.tp(B.spot.x, B.spot.y, 'bakery'); }, K.BELL);
  t.expectEq(await t.ev(() => T.label()), '🔔 Ring the bell', 'bell label at the counter');
  await t.ev(() => { T.act(); T.step(3); });
  t.expect(await t.ev(() => BakeryExt.st.wave > 0 && Game.floats.some((f) => f.text === 'Ding!')), 'ding, the baker waves');
  t.expectEq(await t.ev(() => T.hint()), 'The baker says hello! 👋', 'hello hint while waving');
  await t.ev(() => T.step(200));
  const cro = await t.ev((P) => { Game.s.cash = 50; T.tp(P.x, P.y, 'bakery'); const n = T.until(() => Game.s.bakery.treats === 1, 400); return { n, cash: Game.s.cash }; }, K.PADS.croissant);
  t.expect(cro.n >= 0 && cro.cash === 47, `a croissant for $3 (${JSON.stringify(cro)})`);
  const cup = await t.ev((P) => { T.tp(P.x, P.y, 'bakery'); const n = T.until(() => BakeryExt.st.cupcake > 0, 400); T.tp(P.x, P.y + 70, 'bakery'); return { n, cash: Game.s.cash, hint: T.hint() }; }, K.PADS.cupcake);
  t.expect(cup.n >= 0 && cup.cash === 42, 'a cupcake for $5');
  t.expectEq(cup.hint, 'Yum! Eat your cupcake at a café table 🧁', 'cupcake hint');
  const S1 = await t.ev(() => BakeryExt.seat(1));
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); T.step(1); }, S1);
  t.expectEq(await t.ev(() => T.label()), '🪑 Sit and eat', 'sit and eat the cupcake');
  await t.ev(() => { T.act(); T.step(220); });
  t.expect(await t.ev(() => !BakeryExt.st.eat && BakeryExt.st.cupcake === 0 && Game.s.bakery.eaten === 3), 'the cupcake is eaten at the table');
  const cake = await t.ev((P) => { T.tp(P.x, P.y, 'bakery'); const n = T.until(() => BakeryExt.st.candles > 0, 400); T.step(2); return { n, cash: Game.s.cash, confetti: BakeryExt.st.confetti.length, hint: T.hint() }; }, K.PADS.cake);
  t.expect(cake.n >= 0 && cake.cash === 30 && cake.confetti > 20, `a birthday cake with confetti (${JSON.stringify(cake)})`);
  t.expectEq(cake.hint, 'Happy day! Make a wish 🎂', 'candle hint');
  await t.shot('pads');
  await t.ev(() => { T.tp(29700, 5900, 'bakery'); T.step(700); });
  await t.ev((C) => { T.tp(C.x + 50, C.y + 20, 'bakery'); }, K.CAT);
  t.expectEq(await t.ev(() => T.hint()), 'Shh… the cat is sleeping by the warm oven 🐱', 'cat hint');

  // ---- rescues: pushed into the counter, and an old save from the small bakery's rectangle
  const resc = await t.ev(() => { const K = CFG.BAKERY; Game.player.x = 29300; Game.player.y = K.COUNTER.y0 + 20; T.step(3); return { free: BakeryExt.free(Game.player.x, Game.player.y), x: Game.player.x, y: Game.player.y, oops: Game.floats.some((f) => f.text === 'Oops! Back inside') }; });
  t.expect(resc.free && Math.abs(resc.x - K.EXIT.x) < 1 && resc.oops, `rescued onto the exit mat (${JSON.stringify(resc)})`);
  const old = await t.ev(() => { Game.player.x = 940; Game.player.y = 3314; T.step(3); return { free: BakeryExt.free(Game.player.x, Game.player.y), x: Game.player.x }; });
  t.expect(old.free && Math.abs(old.x - K.EXIT.x) < 1, `a position from the old bakery is rescued too (${JSON.stringify(old)})`);

  // ---- phone-size views: the shop, the café, a game
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); T.tp(29560, 5800, 'bakery'); T.step(90); });
  await t.shot('phone-shop');
  await t.ev(() => { T.tp(30380, 5600, 'bakery'); T.step(10); });
  await t.shot('phone-cafe');
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); T.act(); T.step(2); }, K.MIX.spot);
  await tap(70, 250);
  for (let i = 0; i < 3; i++) await t.ev(() => { T.act(); T.step(30); });
  await t.shot('phone-cake');
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); }, K.MIX.spot);
  // the ✖ closes the game
  { const L = await t.ev(() => { const r = Render, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr, L = BakeryExt.layout(W, H); return L; }); const c = await t.ev((L) => { const rect = Render.canvas.getBoundingClientRect(); return { x: rect.left + L.ox + (L.FW - 26) * L.s, y: rect.top + L.oy + 26 * L.s }; }, L); await t.page.mouse.click(c.x, c.y); }
  t.expect(await t.ev(() => !BakeryExt.st.game), 'the ✖ closes the game');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); T.step(1); });

  // ---- out again with bread in hand: it goes on the shelf; back on the door spot
  await t.ev(() => { BakeryExt.st.carry = { kind: 'bread', shape: 'loaf' }; });
  await t.ev((E) => { T.tp(E.x, E.y, 'bakery'); }, K.EXIT);
  t.expectEq(await t.ev(() => T.hint()), 'Eat it at a café table 🪑 or put it on the shelf 🧺', 'the carry hint still shows on the mat');
  t.expectEq(await t.ev(() => T.label()), '🚪 Go outside', 'exit label on the mat');
  t.expectEq(await t.ev(() => { const c = BakeryExt.st.carry; BakeryExt.st.carry = null; T.step(1); const h = T.hint(); BakeryExt.st.carry = c; T.step(1); return h; }), 'Press the button to go outside', 'exit hint on the mat');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'city', 'back in the City');
  t.expect(await t.ev((D) => Math.hypot(Game.player.x - D.x, Game.player.y - D.y) < 1, K.DOOR_OUT), 'standing on the door spot');
  t.expect(await t.ev(() => !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o))), 'the door spot is free sidewalk');
  t.expect(await t.ev(() => !BakeryExt.st.carry && Game.s.bakery.shelf.length === 2), 'the bread went on the shelf on the way out');
  await t.ev(() => { T.act(); T.step(2); });
  t.expectEq(await t.ev(() => Game.area), 'bakery', 'inside again');
  t.expectEq(await t.ev(() => T.toasts.filter((m) => m === '🥐 Welcome to the Bakery!').length), 1, 'the welcome toast shows once');

  // ---- the delivery bike is rideable: parked by the bakery door in the City, ride it round, hop off anywhere
  const bike0 = await t.ev((D) => { T.tp(D.x, D.y, 'city'); T.step(2); const b = BakeryExt.st.bike, P = CFG.BAKERY.BIKE_PARK; return { near: Game.nearVehicle === b, kind: b.kind, home: Math.hypot(b.x - P.x, b.y - P.y) < 1, label: CFG.VEHICLES.deliverybike.label, action: T.label(), free: !Game.obstacles().some((o) => Game.hitRect(P.x, P.y, 13, o)) }; }, K.DOOR_OUT);
  t.expect(bike0.near && bike0.kind === 'deliverybike' && bike0.home && bike0.free, `the bike waits on the sidewalk by the door (${JSON.stringify(bike0)})`);
  t.expectEq(bike0.label, '🚲 Ride the bike', 'the vehicle button says ride the bike');
  t.expectEq(bike0.action, '🚪 Go inside', 'the door button still works next to the bike');
  await t.ev(() => { Render.setZoom(1.4); T.step(2); });
  await t.shot('bike-parked');
  const ride = await t.ev(() => {
    const b = BakeryExt.st.bike; Game.enterCar(); T.step(1);
    const on = Game.driving && Game.vehicle === b, hint = T.hint(), x0 = b.x;
    T.steer(1, 0); T.step(50); T.unsteer(); T.step(20);
    const x1 = b.x; T.steer(0, 1); T.step(25); T.unsteer(); T.step(20);
    return { on, hint, moved: x1 - x0, y: b.y, stuck: Game.obstacles().some((o) => Game.hitRect(b.x, b.y, 10, o)), px: Game.player.x - b.x };
  });
  t.expect(ride.on, 'riding the delivery bike');
  t.expectEq(ride.hint, 'Ring ring! 🚲 Ride round the City, hop off anywhere', 'the riding hint');
  t.expect(ride.moved > 120 && !ride.stuck && ride.px === 0, `pedalled along the street (${JSON.stringify(ride)})`);
  await t.shot('bike-riding');
  const off = await t.ev(() => { const b = BakeryExt.st.bike; Game.exitCar(); T.step(2); return { driving: Game.driving, bx: b.x, by: b.y, free: !Game.obstacles().some((o) => Game.hitRect(Game.player.x, Game.player.y, 12, o)), home: BakeryExt.bikeHome(Game) }; });
  t.expect(!off.driving && off.free && !off.home, `hopped off; the bike stays where it was left (${JSON.stringify(off)})`);
  // a delivery while the chef has the bike away: the delivery person walks the box
  await t.ev(() => { BakeryExt.enter(Game); T.step(30); BakeryExt.st.carry = { kind: 'cake', cake: { flavour: 'vanilla', decor: { icing: 4, sprinkles: true, candles: 3, topper: 'strawberry' } } }; });
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); T.step(1); }, K.DESK.spot);
  t.expectEq(await t.ev(() => T.label()), '📦 Send it home', 'send it home with the bike away');
  const walkDel = await t.ev(() => { T.act(); const walk = BakeryExt.st.del && BakeryExt.st.del.walk, seen = []; const n = T.until(() => { const d = BakeryExt.st.del; if (d && seen[seen.length - 1] !== d.phase) seen.push(d.phase); return !d; }, 3000); return { walk, seen, n, home: Game.s.bakery.homeCake && Game.s.bakery.homeCake.flavour, bikeHome: BakeryExt.bikeHome(Game) }; });
  t.expect(walkDel.walk && walkDel.n >= 0 && walkDel.home === 'vanilla' && !walkDel.bikeHome, `the delivery person walked the box (${JSON.stringify(walkDel)})`);
  t.expectEq(walkDel.seen.join(','), 'box,out,street,ride,away,back,park,in', 'the walking delivery goes out and comes back');
  // with the bike at home, a delivery takes it: it is not rideable while it is away
  await t.ev(() => { BakeryExt.parkBike(); BakeryExt.st.carry = { kind: 'cake', cake: { flavour: 'vanilla', decor: { icing: 4, sprinkles: true, candles: 3, topper: 'strawberry' } } }; T.act(); T.until(() => BakeryExt.st.del && BakeryExt.st.del.phase === 'ride', 2000); });
  t.expect(await t.ev(() => !BakeryExt.st.del.walk && BakeryExt.vehicles(Game).length === 0), 'the bike is out with the delivery');
  await t.ev(() => T.until(() => !BakeryExt.st.del, 3000));
  t.expect(await t.ev(() => BakeryExt.vehicles(Game).length === 1 && BakeryExt.bikeHome(Game)), 'and back, parked by the door');
  // Take me home parks a bike left anywhere back by the bakery door
  await t.ev(() => { const b = BakeryExt.st.bike; b.x = 5600; b.y = 520; Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => BakeryExt.bikeHome(Game)), 'Take me home parks the bike by the bakery door');
  await t.ev(() => { Render.setZoom(1); T.tp(CFG.BAKERY.EXIT.x, CFG.BAKERY.EXIT.y - 8, 'bakery'); T.step(1); });

  // ---- Take me home mid-game (the game closes) and with a cake in hand (it goes home: nothing is lost)
  await t.ev((S) => { T.tp(S.x, S.y, 'bakery'); T.act(); T.step(2); Game.goHome(); T.step(2); }, K.MIX.spot);
  t.expect(await t.ev(() => Game.area === 'town' && !BakeryExt.st.game && !BakeryExt.st.carry && BakeryExt.st.fade === 0), 'Take me home closes the game');
  t.expect(await t.ev(() => T.hint() !== 'Go inside the bakery 🥐'), 'no bakery hint in town');
  t.expectEq(await t.ev(() => T.label() === '🎂 Make a cake'), false, 'no bakery button in town');
  await t.ev(() => { Game.s.bakery.homeCake = null; T.tp(29560, 5900, 'bakery'); BakeryExt.st.carry = { kind: 'cake', cake: { flavour: 'chocolate', decor: { icing: 4, sprinkles: true, candles: 3, topper: 'strawberry' } } }; Game.goHome(); T.step(2); });
  t.expect(await t.ev(() => !BakeryExt.st.carry && Game.s.bakery.homeCake && Game.s.bakery.homeCake.flavour === 'chocolate'), 'Take me home with a cake: it is waiting at home');
  await t.ev((c) => { Game.s.bakery.homeCake = c; }, sent.home);   // the cake the delivery bike took

  // ---- at home: the cake waits on the table in the pizza rain room, and is eaten slice by slice
  const PR = await t.ev(() => CFG.PIZZARAIN);
  await t.ev((P) => { T.tp(P.TABLE.x - 90, P.TABLE.y - 40, 'pizzarain'); T.step(3); }, PR);
  const prh = await t.ev(() => ({ hint: T.hint(), target: Game.hint && Game.hint.target, waiting: PizzaRainExt.cakeWaiting(Game) }));
  t.expect(prh.waiting, 'the cake is waiting at home');
  t.expectEq(prh.hint, 'A cake from the bakery! 🎂', 'the cake hint in the pizza room');
  t.expect(prh.target && prh.target.x === PR.TABLE.seat.x, 'the hint points at the stool by the table');
  await t.ev(() => { Render.setZoom(1.6); T.step(2); });
  await t.shot('home-cake');
  await t.ev((P) => { T.tp(P.TABLE.seat.x, P.TABLE.seat.y, 'pizzarain'); T.step(1); }, PR);
  t.expectEq(await t.ev(() => T.label()), '🎂 Eat the cake', 'eat-the-cake button at the table');
  await t.ev(() => { Game.floats.length = 0; T.act(); window._yum = new Set(); for (let i = 0; i < 100; i++) { T.step(1); for (const f of Game.floats) if (f.text === 'Yum!') window._yum.add(f); } });
  const prEat = await t.ev(() => ({ meal: PizzaRainExt.st.meal && PizzaRainExt.st.meal.kind, seat: PizzaRainExt.st.seat, bites: PizzaRainExt.st.meal && PizzaRainExt.st.meal.bites, cake: !!Game.s.bakery.homeCake, yums: window._yum.size }));
  t.expect(prEat.meal === 'cake' && prEat.seat === 'table' && prEat.bites >= 2 && prEat.cake && prEat.yums >= 2, `eating the cake upstairs (${JSON.stringify(prEat)})`);
  await t.shot('home-eating');
  const prDone = await t.ev(() => { T.step(120); return { meal: PizzaRainExt.st.meal, cake: Game.s.bakery.homeCake, waiting: PizzaRainExt.cakeWaiting(Game), label: T.label(), yay: Game.floats.some((f) => /What a cake/.test(f.text)) }; });
  t.expect(!prDone.meal && !prDone.cake && !prDone.waiting && prDone.yay, `the cake is all gone (${JSON.stringify(prDone)})`);
  t.expectEq(prDone.label, '🥤 Drink a soda pop', 'and then a soda');
  await t.ev(() => { Render.setZoom(1); T.step(1); });

  // ---- a save inside the bakery reloads onto the floor
  await t.ev((E) => { T.tp(E.x, E.y - 8, 'bakery'); Game.save(); }, K.EXIT);
  await t.reload();
  await t.ev(() => T.step(3));
  t.expectEq(await t.ev(() => Game.area), 'bakery', 'reloaded inside the bakery');
  t.expect(await t.ev(() => BakeryExt.free(Game.player.x, Game.player.y)), 'reloaded onto free floor');
  t.expect(await t.ev(() => Game.s.bakery.shelf.length === 2 && Game.s.bakery.cakes >= 2 && Game.s.bakery.breads === 2), 'the bakery remembers the shelf and the counts');
  await t.ev(() => { Game.goHome(); T.step(1); });
};
