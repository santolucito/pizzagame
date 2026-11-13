'use strict';
// The Egg Barn (js/eggfarm.js, with the bigger barn map in js/barn.js): in through the barn door, the old barn's parts
// still there and reachable, through the archway into the hall; hatch chicks that waddle into a coop, the coop fills up
// (FULL), buy a new coop; hens lay onto the belt, the packer boxes, the truck ships and cash rises; every pad; the egg
// type milestones; the carried egg tower reaches 100+ and draws fast (timed); packing at the packer and at the truck;
// driving the spare egg truck out onto the farm and back (no extra pay); the lucky egg, corn, the rooster at dawn,
// peeking into a coop, offline catch-up, rescues, Take-me-home, a stuck check of the hall; screenshots.
module.exports = async (t) => {
  await t.boot();
  const K = await t.ev(() => CFG.EGGFARM);
  t.expect(await t.ev(() => Game.ext.indexOf(EggFarmExt) >= 0 && Game.ext.indexOf(EggFarmExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(EggFarmExt) < Game.ext.indexOf(BarnExt) && Render.ext.includes(EggFarmExt)), 'registered first-ish in Game.ext and in Render.ext');
  const map = await t.ev(() => {
    const W = CFG.AREAS.barn.WORLD, over = Object.keys(CFG.AREAS).filter((k) => k !== 'barn').filter((k) => { const o = CFG.AREAS[k].WORLD; return o && o.x0 < W.x1 + 1000 && o.x1 > W.x0 - 1000 && o.y0 < W.y1 + 1000 && o.y1 > W.y0 - 1000; });
    return { W, over, place: CFG.AREAS.barn.place, mapped: WorldMapExt.placeOf('barn'), area: (W.x1 - W.x0) * (W.y1 - W.y0) / (600 * 400) };
  });
  t.expectEq(map.over.join(','), '', `the barn's map (${JSON.stringify(map.W)}) is at least 1000 px from every other map`);
  t.expect(map.place === 'town' && map.mapped === 'town', 'the barn still belongs to the farm on the world map');
  t.expect(map.area > 4 && map.area < 7, `the barn's map is about 4-6× the old one (${map.area.toFixed(1)}×)`);
  t.expect(await t.ev(() => Game.s.eggfarm && Game.s.eggfarm.coops === 1 && Game.s.eggfarm.hens.every((n) => n === 0)), 'a fresh farm: one empty coop');

  // ---- in through the barn door on the farm; the old barn is still all there and reachable
  await t.ev(() => { const D = CFG.BARN.DOOR_OUT; T.tp(D.x, D.y, 'town'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go into the barn', 'door label on the farm');
  await t.ev(() => { T.act(); T.step(5); });
  t.expectEq(await t.ev(() => Game.area), 'barn', 'inside the barn');
  t.expect(await t.ev(() => { const E = CFG.BARN.exit; return Math.hypot(Game.player.x - E.x, Game.player.y - (E.y - 8)) < 2; }), 'standing on the exit mat');
  const old = await t.ev(() => {
    const K2 = CFG.BARN, hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o)), out = {};
    const spots = { goat: { x: K2.stalls.goat.x1 + 26, y: K2.stalls.goat.at.y }, pig: { x: K2.stalls.pig.x1 + 20, y: K2.stalls.pig.at.y - 14 }, ladder: K2.ladder.foot, bale: { x: K2.bales[2].x, y: K2.bales[2].y + 30 }, mat: { x: K2.exit.x, y: K2.exit.y - 8 } };
    for (const [k, q] of Object.entries(spots)) { T.tp(q.x, q.y, 'barn'); out[k] = !hit(q.x, q.y) && BarnExt.free(q.x, q.y) ? T.label() : 'blocked'; }
    return out;
  });
  t.expectEq(old.goat, '🐐 Pat the goat', 'the goat is still there');
  t.expectEq(old.pig, '🐷 Pat the pig', 'the pig is still there');
  t.expectEq(old.ladder, '🪜 Climb up', 'the hayloft ladder is still there');
  t.expectEq(old.bale, '🪑 Sit on the hay', 'the hay bale seat is still there');
  t.expectEq(old.mat, '🚪 Go outside', 'the way out is still there');
  // walk from the barn floor through the archway into the hall and back
  const walk = await t.ev(() => {
    const A = CFG.BARN.arch, x = (A.x0 + A.x1) / 2; T.tp(x, 4300, 'barn');
    T.steer(0, 1); T.step(70); T.unsteer(); const down = Game.player.y;
    T.steer(0, -1); T.step(70); T.unsteer(); const up = Game.player.y;
    return { down, up, hint: T.hint() };
  });
  t.expect(walk.down > CFG_HALL_Y0(K) + 30 && walk.up < 4330, `walked through the archway into the hall and back (${Math.round(walk.down)}, ${Math.round(walk.up)})`);
  t.expectEq(await t.ev(() => Game.s.eggfarm.seen), true, 'the hall is marked as found');

  // ---- the hall, early: the hint points at the big red button
  await t.ev(() => { const M = CFG.EGGFARM.ARCH_MAT; T.tp(M.x, M.y + 40, 'barn'); T.step(2); });
  const h0 = await t.ev(() => ({ text: T.hint(), target: Game.hint && Game.hint.target }));
  t.expectEq(h0.text, 'Press the big red button! 🐣', 'first hint in the hall');
  t.expect(h0.target && h0.target.x === K.HATCHER.btn.x, 'the hint points at the button');
  await t.shot('hall-early');

  // ---- hatch: a chick pops out, waddles along the path and into the coop; the refill ring stops a runaway
  await t.ev(() => { const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🐣 Hatch!', 'the hatch button label at the machine');
  const h1 = await t.ev(() => { T.act(); const a = { hens: Game.s.eggfarm.hens[0], chicks: EggFarmExt.st.chicks.length, refill: EggFarmExt.st.refill }; T.act(); a.hens2 = Game.s.eggfarm.hens[0]; return a; });
  t.expect(h1.hens === 1 && h1.chicks === 1 && h1.refill > 0.3, `one chick hatched (${JSON.stringify(h1)})`);
  t.expectEq(h1.hens2, 1, 'pressing again during the refill does nothing');
  await t.ev(() => T.step(14));
  await t.shot('hatch');
  const arrive = await t.ev(() => T.until(() => EggFarmExt.st.chicks.length === 0, 900));
  t.expect(arrive > 0, `the chick reached the coop (${arrive} steps)`);
  t.expectEq(await t.ev(() => EggFarmExt.st.incoming[0]), 0, 'and is now a hen inside');
  // fill the coop: FULL
  const fill = await t.ev(() => { let n = 0; while (Game.s.eggfarm.hens[0] < 20 && n < 60) { T.act(); T.step(26); n++; } return { hens: Game.s.eggfarm.hens[0], presses: n }; });
  t.expectEq(fill.hens, 20, `the coop filled up to 20 (${fill.presses} presses)`);
  const full = await t.ev(() => { T.step(30); Game.floats.length = 0; T.act(); return { hens: Game.s.eggfarm.hens[0], flash: EggFarmExt.st.fullFlash, float: Game.floats.some((f) => f.text.includes('All full')), room: EggFarmExt.room(Game.s.eggfarm) }; });
  t.expect(full.hens === 20 && full.flash > 0 && full.float && full.room === 0, `a full coop: FULL sign, no more chicks, a friendly float (${JSON.stringify(full)})`);
  await t.ev(() => { T.until(() => EggFarmExt.st.chicks.length === 0, 900); T.tp(40104, 4600, 'barn'); T.step(2); });
  t.expectEq(await t.ev(() => T.hint()), 'The coops are full! Buy more room 🏠', 'the hint says to buy room');
  await t.shot('coop-full');
  // buy a new coop on its pad
  const coop = await t.ev(() => {
    const pad = EggFarmExt.pads(Game).find((p) => p.key === 'egg_newcoop'); Game.s.cash = pad.price;
    T.tp(pad.pos.x, pad.pos.y, 'barn'); const n = T.until(() => Game.s.eggfarm.coops === 2, 900);
    return { n, coops: Game.s.eggfarm.coops, cash: Game.s.cash, price: pad.price, next: (EggFarmExt.pads(Game).find((p) => p.key === 'egg_newcoop') || {}).price };
  });
  t.expect(coop.coops === 2 && coop.n > 0 && coop.cash < 1, `bought a second coop for ${coop.price} (${JSON.stringify(coop)})`);
  t.expect(coop.next > coop.price, 'the next coop costs more (Shop.cost)');
  const into2 = await t.ev(() => { const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); T.step(30); T.act(); return Game.s.eggfarm.hens[1]; });
  t.expectEq(into2, 1, 'the next chick goes into the new coop');

  // ---- laying: eggs roll onto the belt, the packer boxes them, the truck ships them and comes back with money
  const lay = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st; T.tp(39900, 4720, 'barn'); Game.s.cash = 0;
    const n1 = T.until(() => st.belt.length > 0, 600);
    const n2 = T.until(() => s.hopper > 0 || s.boxes > 0 || s.box > 0, 1800);
    const n3 = T.until(() => st.trucks.some((tr) => tr.state === 'dock' && tr.boxes > 0), 3000);
    const n4 = T.until(() => st.trucks.some((tr) => tr.state === 'out' || tr.state === 'away'), 3000);
    const before = Game.s.cash, n5 = T.until(() => Game.s.cash > before, 3000);
    return { n1, n2, n3, n4, n5, laid: s.laid, cash: Game.s.cash, shipped: s.shipped, beep: Game.floats.some((f) => f.text.includes('Beep')), earned: s.earned };
  });
  t.expect(lay.n1 >= 0, 'eggs dropped onto the belt');
  t.expect(lay.n2 >= 0, 'they rolled to the packer');
  t.expect(lay.n3 >= 0, 'the truck loaded the boxes');
  t.expect(lay.n4 >= 0 && lay.shipped > 0, 'the truck drove off with them');
  t.expect(lay.n5 >= 0 && lay.cash > 0 && lay.earned > 0, `the truck came back and cash rose (${JSON.stringify(lay)})`);
  // the money waits in a pile by the dock while the chef is away, and goes into his pocket when he walks over it
  const bank = await t.ev(() => { const s = Game.s.eggfarm; Game.area = 'town'; EggFarmExt.pay(Game, 25); const banked = s.bank, c0 = Game.s.cash; T.tp(CFG.EGGFARM.CASH.x, CFG.EGGFARM.CASH.y, 'barn'); T.step(2); return { banked, left: s.bank, got: Game.s.cash - c0 }; });
  t.expect(bank.banked >= 25 && bank.left === 0 && bank.got >= 25, `money banked while away, then picked up by the dock (${JSON.stringify(bank)})`);

  // ---- every pad, each with a growing price and a visible effect
  const pads = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt, out = [];
    const effect = { egg_hatch: () => E.refill(s), egg_coop: () => E.cap(s), egg_feed: () => E.layTime(s), egg_box: () => E.boxEggs(s), egg_truck: () => (E.syncTrucks(Game), st.trucks.length), egg_fancy: () => E.eggValue(s, 0) };
    for (const key of Object.keys(effect)) {
      const pad = E.pads(Game).find((p) => p.key === key), before = effect[key](), lv0 = s.lv[pad.upg];
      Game.s.cash = pad.price; T.tp(pad.pos.x, pad.pos.y, 'barn');
      const n = T.until(() => s.lv[pad.upg] > lv0, 900);
      const after = effect[key](), next = E.pads(Game).find((p) => p.key === key).price;
      out.push({ key, label: pad.label, price: pad.price, next, n, lv: s.lv[pad.upg], before, after });
      T.tp(39900, 4700, 'barn');
    }
    return out;
  });
  for (const p of pads) {
    t.expect(p.n > 0 && p.lv === 1, `${p.label} bought (${JSON.stringify(p)})`);
    t.expect(p.next > p.price, `${p.label} costs more next time (${p.price} → ${p.next})`);
    t.expect(p.after !== p.before, `${p.label} changes something (${p.before} → ${p.after})`);
  }
  t.expect(await t.ev(() => EggFarmExt.st.trucks.length === 2), 'a second truck after More Trucks');
  console.log('   pads: ' + pads.map((p) => `${p.label} $${p.price}→$${p.next}`).join(', '));

  // ---- the egg types climb with the flock: golden at 30, rainbow 100, space 250, pizza 500
  const types = [];
  for (let k = 1; k <= 4; k++) {
    const m = await t.ev((k) => {
      const s = Game.s.eggfarm, E = EggFarmExt, T2 = CFG.EGGFARM.TYPES;
      s.coops = 6; s.lv.coop = 10; E.st.obs = E.st.obsCar = null;
      const per = Math.floor((T2[k].at - 1) / 6), extra = T2[k].at - 1 - per * 6; s.hens = [0, 1, 2, 3, 4, 5].map((i) => per + (i < extra ? 1 : 0));
      const before = s.type; E.st.refill = 0; E.st.banner = null; const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); T.act();
      return { before, after: s.type, hens: E.hens(s), banner: E.st.banner && E.st.banner.type, value: E.eggValue(s, s.type) };
    }, k);
    types.push(m);
    t.expect(m.before === k - 1 && m.after === k && m.banner === k, `egg type ${k} unlocks at ${m.hens} hens (${JSON.stringify(m)})`);
  }
  t.expect(types.every((m, i) => i === 0 || m.value > types[i - 1].value), 'each egg type is worth more');
  // a picture of each egg type: hens dressed up in the coops, a little tower of those eggs, the board
  for (let k = 0; k <= 4; k++) {
    await t.ev((k) => {
      const s = Game.s.eggfarm, E = EggFarmExt; s.type = k; E.st.banner = null; E.st.stack.length = 0; E.st.fly.length = 0; E.st.belt.length = 0;
      for (let i = 0; i < 16; i++) E.st.stack.push({ t: k, x: 0, land: 9 });
      s.hens = [60, 60, 60, 60, 60, 60]; T.tp(40260, 4600, 'barn'); T.step(20);
    }, k);
    await t.shot('type-' + k);
  }
  await t.ev(() => { const s = Game.s.eggfarm; s.type = 0; EggFarmExt.st.stack.length = 0; s.hens = [20, 20, 0, 0, 0, 0]; s.coops = 2; s.lv.coop = 0; s.type = 0; EggFarmExt.st.obs = EggFarmExt.st.obsCar = null; T.step(2); });

  // ---- the egg tower: scoop at the belt's end / hopper until it is 100+ high
  const scoop = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, C = CFG.EGGFARM.COLLECT; s.hopper = 150; st.stack.length = 0;
    T.tp(C.x, C.y, 'barn'); const n = T.until(() => st.stack.length >= 120, 1200);
    return { n, stack: st.stack.length, hopper: s.hopper, flying: st.fly.length };
  });
  t.expect(scoop.n > 0 && scoop.stack >= 120, `the egg tower grew to ${scoop.stack} (${scoop.n} steps)`);
  t.expect(scoop.n < 60 * 8, 'it grows fast (a few seconds for 120 eggs)');
  // the tower is drawn cheaply: only the eggs on screen, each a cached sprite; time a frame with it and without it
  const perf = await t.ev(() => {
    const st = EggFarmExt.st, time = (n) => { const t0 = performance.now(); for (let i = 0; i < n; i++) Render.draw(Game); return (performance.now() - t0) / n; };
    T.tp(40200, 4700, 'barn'); T.step(2); time(10);
    const withStack = time(60), drawn = st.drawn, saved = st.stack.slice(); st.stack.length = 0; T.step(1); time(10);
    const without = time(60); st.stack.push(...saved);
    const stackOnly = (() => { const t0 = performance.now(); for (let i = 0; i < 200; i++) EggFarmExt.drawStack(Render, Game); return (performance.now() - t0) / 200; })();
    const upd = (() => { const t0 = performance.now(); for (let i = 0; i < 200; i++) EggFarmExt.update(Game, 1 / 60); return (performance.now() - t0) / 200; })();
    return { withStack, without, drawn, n: st.stack.length, stackOnly, upd };
  });
  console.log(`   frame cost: ${perf.withStack.toFixed(2)} ms with a ${perf.n}-egg tower (${perf.drawn} drawn), ${perf.without.toFixed(2)} ms without; drawStack ${perf.stackOnly.toFixed(3)} ms, update ${perf.upd.toFixed(3)} ms`);
  t.expect(perf.drawn < perf.n, `only the eggs on screen are drawn (${perf.drawn} of ${perf.n})`);
  t.expect(perf.stackOnly < 2, `drawing the tower is cheap (${perf.stackOnly.toFixed(3)} ms)`);
  t.expect(perf.upd < 1.5, `the farm's update is cheap (${perf.upd.toFixed(3)} ms)`);
  // the tower wobbles: walking leans it back and the top lags, stopping swings it and it settles
  const wob = await t.ev(() => {
    const st = EggFarmExt.st, top = () => st.stack[st.stack.length - 1].x; T.tp(39800, 4700, 'barn'); T.step(60);
    const still = top(); T.steer(1, 0); T.step(30); const walking = top(), lean = st.lean, mid = st.stack[40].x; T.unsteer();
    let maxSwing = 0, maxLean = 0; for (let i = 0; i < 120; i++) { T.step(1); maxSwing = Math.max(maxSwing, top()); maxLean = Math.max(maxLean, st.lean); }
    T.step(300); const settled = top();
    return { still, walking, lean, mid, maxSwing, maxLean, settled };
  });
  t.expect(Math.abs(wob.still) < 2, `a still tower stands straight (${wob.still.toFixed(1)})`);
  t.expect(wob.walking < -40 && wob.mid > wob.walking, `walking right, the tower leans back like a noodle, the top more than the middle (${JSON.stringify(wob)})`);
  t.expect(wob.maxSwing > 5 && wob.maxLean > 5, `stopping swings the tower forward past straight (${JSON.stringify(wob)})`);
  t.expect(Math.abs(wob.settled) < 3, `and it settles (${wob.settled.toFixed(1)})`);
  // the tall tower mid-wobble while walking (the joystick stays held for the picture)
  await t.ev(() => { T.tp(39800, 4760, 'barn'); T.step(2); T.steer(1, 0); T.step(18); });
  await t.shot('tower-walking');
  await t.ev(() => { T.steer(-1, 0); T.step(30); });
  await t.shot('tower-turning');
  await t.ev(() => { T.unsteer(); T.step(10); });

  // ---- pack at the packer: the eggs stream off one by one into boxes
  const pack = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, P = CFG.EGGFARM.PACK; s.boxes = 0; s.boxVal = 0; s.box = 0; s.boxEggVal = 0; s.hopper = 0; st.belt.length = 0; s.hens = [0, 0, 0, 0, 0, 0]; st.acc.fill(0);
    st.trucks.forEach((tr) => { tr.state = 'away'; tr.t = 999; });
    T.tp(P.x, P.y, 'barn'); T.step(1);
    return { label: T.label(), n: st.stack.length, hint: T.hint() };
  });
  t.expectEq(pack.label, '📦 Pack the eggs', 'the pack button at the packer');
  t.expectEq(pack.hint, 'Pack the eggs! 📦', 'the hint asks to pack');
  await t.ev(() => { T.act(); T.step(40); });
  const stream = await t.ev(() => ({ flying: EggFarmExt.st.fly.filter((f) => f.out).length, left: EggFarmExt.st.stack.length, packing: !!EggFarmExt.st.packing }));
  t.expect(stream.flying > 3 && stream.left > 0 && stream.packing, `the eggs stream off one by one (${JSON.stringify(stream)})`);
  await t.shot('packing-stream');
  const packed = await t.ev((n0) => { const s = Game.s.eggfarm, st = EggFarmExt.st; const n = T.until(() => !st.stack.length && !st.fly.length, 900); return { n, boxes: s.boxes, box: s.box, per: EggFarmExt.boxEggs(s), n0 }; }, pack.n);
  t.expect(packed.n >= 0 && packed.boxes * packed.per + packed.box === packed.n0, `all ${packed.n0} eggs went into boxes (${JSON.stringify(packed)})`);
  t.expect(packed.n < 60 * 4, 'packing a big tower takes a few seconds');
  // ...and straight into the truck at its loading spot
  const truckPack = await t.ev(() => {
    const st = EggFarmExt.st, s = Game.s.eggfarm, S = CFG.EGGFARM.TRUCK_SPOT;
    st.trucks.forEach((tr) => { tr.state = 'ready'; tr.t = 0; tr.value = 0; tr.boxes = 0; }); s.boxes = 0; s.boxVal = 0;
    T.until(() => st.trucks.some((tr) => tr.state === 'dock'), 600);
    for (let i = 0; i < 24; i++) st.stack.push({ t: 0, x: 0, land: 9 });
    T.tp(S.x, S.y, 'barn'); T.step(1); const label = T.label(); T.act(); T.step(20);
    const flying = st.fly.filter((f) => f.out).map((f) => f.x1); T.until(() => !st.fly.length && !st.stack.length, 600);
    return { label, flying: flying.length, nearTruck: flying.every((x) => Math.abs(x - CFG.EGGFARM.DOCK.x) < 60), shipped: s.boxes + st.trucks.reduce((a, tr) => a + tr.boxes, 0) };
  });
  t.expect(truckPack.label === '📦 Pack the eggs' && truckPack.flying > 0 && truckPack.nearTruck && truckPack.shipped > 0, `packing at the truck sends the eggs into its bed (${JSON.stringify(truckPack)})`);
  await t.ev(() => T.step(20));
  await t.shot('truck-dock');

  // ---- loose eggs: one rolls off the belt now and then; walking near pulls them in, boing boing
  const mag = await t.ev(() => {
    const st = EggFarmExt.st; st.stack.length = 0; T.tp(39800, 4800, 'barn');
    for (let i = 0; i < 5; i++) st.strays.push({ x: 39840 + i * 12, y: 4790, type: 0, z: 0, vz: 0, vx: 0, vy: 0, t: 0 });
    Game.floats.length = 0; T.step(30);
    return { left: st.strays.filter((e) => e.x < 39920 && e.y > 4780).length, boing: Game.floats.some((f) => f.text.includes('Boing')), stack: (T.step(30), st.stack.length) };
  });
  t.expect(mag.left === 0 && mag.stack === 5 && mag.boing, `loose eggs hop onto the tower (${JSON.stringify(mag)})`);
  // the old barn's hens' eggs join the tower too
  const oldEgg = await t.ev(() => { const st = EggFarmExt.st, n0 = st.stack.length; BarnExt.st.eggs.push({ x: 39830, y: 4230, t: 1 }); T.tp(39830, 4230, 'barn'); T.step(40); return st.stack.length - n0; });
  t.expectEq(oldEgg, 1, 'an egg from the old barn hops onto the tower');

  // ---- drive the spare egg truck: out of the back door onto the farm and back in (driving pays nothing)
  const drive = await t.ev(() => {
    const st = EggFarmExt.st, s = Game.s.eggfarm, v = st.spare, SP = CFG.EGGFARM.SPARE;
    st.trucks.forEach((tr) => { tr.state = 'ready'; tr.value = 0; tr.boxes = 0; }); s.boxes = 0; s.boxVal = 0; s.hopper = 0; s.bank = 0;
    T.tp(SP.x, SP.y - 50, 'barn'); T.step(1);
    const near = Game.canEnterCar() && Game.findNearVehicle() === v; Game.enterCar(); T.step(1);
    const cash0 = Game.s.cash, earned0 = s.earned;
    T.steer(0, -1); T.until(() => v.y < CFG.EGGFARM.DOCK.y + 6, 200); T.steer(1, 0); const n = T.until(() => Game.area === 'town', 600); T.unsteer();
    return { near, driving: Game.driving && Game.vehicle === v, n, area: Game.area, x: v.x, y: v.y, cash0, earned0 };
  });
  t.expect(drive.near && drive.driving, 'hopped into the spare egg truck');
  t.expect(drive.n >= 0 && drive.area === 'town', `drove out of the back door onto the farm (${JSON.stringify(drive)})`);
  const farm = await t.ev(() => { const v = EggFarmExt.st.spare; return { solid: Game.townObstacles(true).some((o) => Game.hitRect(v.x, v.y, 24, o)), hint: T.hint() }; });
  t.expect(!farm.solid, 'the truck comes out on free farm ground');
  await t.shot('truck-farm');
  const back = await t.ev((d) => {
    const v = EggFarmExt.st.spare, D = CFG.BARN.DOOR_OUT; T.steer(1, 0); T.step(30); T.unsteer();
    v.x = D.x + 40; v.y = D.y + 20; T.step(1);
    const label = T.label(), hint = T.hint(); T.act(); T.step(5);
    return { label, hint, area: Game.area, driving: Game.driving, extra: Game.s.cash - d.cash0, earned: Game.s.eggfarm.earned - d.earned0 };
  }, drive);
  t.expectEq(back.label, '🚚 Drive into the barn', 'the drive-in button at the barn door');
  t.expect(back.area === 'barn' && back.driving, `drove back into the barn hall (${JSON.stringify(back)})`);
  t.expect(back.extra === 0 && back.earned === 0, 'driving the truck pays nothing extra');
  await t.ev(() => { T.steer(-1, 0); T.step(30); T.unsteer(); T.step(5); });
  await t.shot('truck-driving');
  const parked = await t.ev(() => { Game.exitCar(); T.step(1); const v = EggFarmExt.st.spare; const free = BarnExt.free(Game.player.x, Game.player.y); return { free, where: v.where }; });
  t.expect(parked.free && parked.where === 'barn', 'hopped out onto free floor in the hall');
  // the fleet kept working the whole time
  t.expect(await t.ev(() => EggFarmExt.st.trucks.length === 2 && EggFarmExt.st.trucks.every((tr) => tr !== EggFarmExt.st.spare)), 'the spare truck is not one of the shipping trucks');
  // left out on the farm, it drives itself home
  const home1 = await t.ev(() => { const st = EggFarmExt.st, v = st.spare; EggFarmExt.driveOut(Game); Game.driving = false; Game.vehicle = null; T.tp(540, 430, 'town'); T.step(2); return { where: v.where, x: v.x }; });
  t.expect(home1.where === 'barn' && home1.x === K.SPARE.x, 'a truck left on the farm goes back to its bay');

  // ---- the lucky egg on its balloon: walk into it for a bonus
  const lucky = await t.ev(() => {
    const st = EggFarmExt.st; st.stack.length = 0; T.tp(40000, 4720, 'barn'); EggFarmExt.spawnLucky(Game); st.lucky.x = 39940; st.lucky.y = 4720; st.lucky.dir = 1;
    const c0 = Game.s.cash; T.step(3); const hint = Game.hint && Game.hint.text; const n = T.until(() => !st.lucky, 200); T.step(60);
    return { n, got: Game.s.cash - c0, stack: st.stack.length, float: Game.floats.some((f) => f.text.includes('Lucky')), hint };
  });
  t.expect(lucky.n >= 0 && lucky.got >= 50 && lucky.stack === 6 && lucky.float, `caught the lucky egg: money and eggs (${JSON.stringify(lucky)})`);
  const luckyBtn = await t.ev(() => { const st = EggFarmExt.st; EggFarmExt.spawnLucky(Game); st.lucky.x = Game.player.x + 50; st.lucky.y = Game.player.y; st.lucky.dir = 0; T.step(1); const l = T.label(); T.act(); return { l, gone: !st.lucky }; });
  t.expect(luckyBtn.l === '🎈 Catch the lucky egg!' && luckyBtn.gone, 'or press the button when it is close');
  await t.ev(() => { const st = EggFarmExt.st; EggFarmExt.spawnLucky(Game); st.lucky.x = 39800; st.lucky.y = 4700; st.lucky.dir = 0; T.tp(39920, 4740, 'barn'); T.step(2); });
  await t.shot('lucky');
  await t.ev(() => { EggFarmExt.st.lucky = null; });

  // ---- corn: a short laying boost
  const corn = await t.ev(() => {
    const st = EggFarmExt.st, C = CFG.EGGFARM.CORN.spot; T.tp(C.x, C.y, 'barn'); T.step(1); const label = T.label();
    st.acc[0] = 0; T.step(60); const plain = st.acc[0]; T.act(); st.acc[0] = 0; T.step(60); const boosted = st.acc[0];
    return { label, boost: st.boost, plain, boosted, corn: st.corn.length };
  });
  t.expectEq(corn.label, '🌽 Scatter corn', 'the corn button at the sack');
  t.expect(corn.boost > 10 && corn.boosted > corn.plain * 1.8 && corn.corn > 10, `corn doubles the laying for a while (${JSON.stringify(corn)})`);
  await t.ev(() => T.step(20));
  await t.shot('corn');

  // ---- the rooster crows at dawn
  const crow = await t.ev(() => { AtmosphereExt.force({ phase: 'day' }); T.step(2); Game.floats.length = 0; AtmosphereExt.force({ phase: 'dawn' }); T.step(2); return { crow: EggFarmExt.st.crow, float: Game.floats.some((f) => f.text.includes('doodle')) }; });
  t.expect(crow.crow > 0 && crow.float, 'the rooster crows when dawn breaks');
  await t.ev(() => { T.tp(39750, 4560, 'barn'); T.step(10); });
  await t.shot('rooster');
  await t.ev(() => { AtmosphereExt.force({ phase: 'day' }); T.step(2); });

  // ---- peek into a coop
  const peek = await t.ev(() => { Game.s.eggfarm.hens[0] = 15; T.tp(CFG.EGGFARM.COOP_X[0], CFG.EGGFARM.CHICK_Y + 4, 'barn'); T.step(1); const l = T.label(); T.act(); T.step(10); return { l, peek: !!EggFarmExt.st.peek, l2: T.label(), hint: T.hint() }; });
  t.expect(peek.l === '👀 Peek inside' && peek.peek && peek.l2 === '👀 Back out', `peeking into a coop (${JSON.stringify(peek)})`);
  await t.shot('peek');
  t.expect(await t.ev(() => { T.steer(0, 1); T.step(5); T.unsteer(); return !EggFarmExt.st.peek; }), 'walking away closes the peek');

  // ---- a busy farm: six coops, belt full of eggs, trucks coming and going
  await t.ev(() => {
    const s = Game.s.eggfarm, E = EggFarmExt; s.coops = 6; s.lv.coop = 4; s.lv.feed = 6; s.lv.truck = 3; s.lv.box = 4; s.lv.hatch = 6; s.hens = [60, 60, 52, 40, 31, 18]; s.type = 2; E.st.obs = E.st.obsCar = null; E.syncTrucks(Game);
    T.tp(40260, 4700, 'barn'); T.step(60 * 20);
    for (let i = 0; i < 40; i++) E.st.stack.push({ t: 2, x: 0, land: 9 });
    T.tp(40400, 4640, 'barn'); T.step(30);
  });
  await t.shot('busy');
  const busyPhone = await t.ev(() => ({ chicks: EggFarmExt.st.chicks.length, belt: EggFarmExt.st.belt.length, trucks: EggFarmExt.st.trucks.map((x) => x.state).join(',') }));
  console.log('   busy farm: ' + JSON.stringify(busyPhone));

  // ---- offline catch-up (the shared Shop helpers): money for the time away, and the auto-hatcher hatched a few
  const away = await t.ev(() => {
    const s = Game.s.eggfarm; s.rate = 4; s.bank = 0; s.hens = [10, 0, 0, 0, 0, 0]; Game.s.savedAt = Date.now() - 3600 * 1000;
    const amt = EggFarmExt.away(Game, Shop.awaySeconds(Game)); Game.s.savedAt = Date.now();
    return { amt, bank: s.bank, hens: EggFarmExt.hens(s), msg: EggFarmExt.st.awayMsg };
  });
  t.expect(away.amt === 7200 && away.bank === 7200 && away.hens > 10 && /away/.test(away.msg || ''), `the farm kept working while the game was closed (${JSON.stringify(away)})`);
  t.expectEq(await t.ev(() => EggFarmExt.away(Game, 10)), 0, 'nothing for a few seconds away');
  // saved and loaded: the farm and the carried eggs come back
  await t.ev(() => { const st = EggFarmExt.st; st.stack.length = 0; for (let i = 0; i < 9; i++) st.stack.push({ t: 1, x: 0, land: 9 }); T.step(1); Game.save(); });
  await t.reload();
  const loaded = await t.ev(() => ({ coops: Game.s.eggfarm.coops, stack: EggFarmExt.st.stack.length, area: Game.area, free: BarnExt.free(Game.player.x, Game.player.y) }));
  t.expect(loaded.coops === 6 && loaded.stack === 9 && loaded.area === 'barn' && loaded.free, `saved and loaded (${JSON.stringify(loaded)})`);

  // ---- rescues: pushed into a coop or a wall of the hall, back under the archway
  for (const [x, y] of [[K.COOP_X[2], 4450], [K.HALL.x1 + 8, 4600], [K.PACKER.x0 + 30, 4520]]) {
    const r = await t.ev(([x, y]) => { Game.player.x = x; Game.player.y = y; T.step(2); const M = CFG.EGGFARM.ARCH_MAT; return { d: Math.hypot(Game.player.x - M.x, Game.player.y - M.y), free: BarnExt.free(Game.player.x, Game.player.y) }; }, [x, y]);
    t.expect(r.d < 2 && r.free, `rescued from ${x},${y} onto the archway mat`);
  }
  // ---- a stuck check over the whole hall: from every free spot the chef can walk away
  const stuck = await t.ev(() => {
    const H = CFG.EGGFARM.HALL, bad = []; let n = 0;
    const hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    for (let y = H.y0 + 20; y < H.y1 - 16; y += 40) for (let x = H.x0 + 20; x < H.x1 - 16; x += 40) {
      if (hit(x, y)) continue; n++;
      let best = 0;
      for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { T.tp(x, y, 'barn'); T.steer(ax, ay); T.step(10); T.unsteer(); best = Math.max(best, Math.hypot(Game.player.x - x, Game.player.y - y)); }
      if (best < 10) bad.push(x + ',' + y);
    }
    return { n, bad };
  });
  t.expect(stuck.n > 100 && stuck.bad.length === 0, `no stuck spots in the hall (${stuck.n} sampled; ${stuck.bad.join(' ')})`);

  // ---- Take-me-home from the hall, mid-peek and mid-pack, with the truck out on the farm
  const home = await t.ev(() => {
    const st = EggFarmExt.st; for (let i = 0; i < 10; i++) st.stack.push({ t: 0, x: 0, land: 9 });
    T.tp(CFG.EGGFARM.PACK.x, CFG.EGGFARM.PACK.y, 'barn'); T.act(); T.step(5); st.peek = { c: 0, t: 5 };
    Game.goHome(); T.step(2);
    return { area: Game.area, peek: st.peek, packing: st.packing, fly: st.fly.length, where: st.spare.where, d: Math.hypot(Game.player.x - CFG.PLAYER_START.x, Game.player.y - CFG.PLAYER_START.y), hint: EggFarmExt.hint(Game) };
  });
  t.expect(home.area === 'town' && !home.peek && !home.packing && home.fly === 0 && home.where === 'barn' && home.d < 2 && home.hint === undefined, `home from the egg farm (${JSON.stringify(home)})`);

  // ---- phone-size pictures
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const st = EggFarmExt.st; st.stack.length = 0; T.tp(39650, 4560, 'barn'); T.step(20); });
  await t.shot('phone-hatcher');
  await t.ev(() => { const st = EggFarmExt.st; for (let i = 0; i < 110; i++) st.stack.push({ t: i % 5, x: 0, land: 9 }); T.tp(40000, 4760, 'barn'); T.step(30); T.steer(1, 0); T.step(16); });
  await t.shot('phone-tower');
  await t.ev(() => { T.unsteer(); const P = CFG.EGGFARM.PACK; T.tp(P.x, P.y, 'barn'); T.step(2); T.act(); T.step(30); });
  await t.shot('phone-packing');
  await t.ev(() => { T.step(300); const B = CFG.BARN; T.tp(B.arch.mat.x, B.arch.mat.y, 'barn'); T.step(5); });
  await t.shot('phone-barn');
  await t.ev(() => { T.tp(CFG.EGGFARM.COOP_X[1], CFG.EGGFARM.CHICK_Y + 4, 'barn'); T.step(1); T.act(); T.step(10); });
  await t.shot('phone-peek');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); EggFarmExt.st.peek = null; T.tp(540, 430, 'town'); T.step(1); });
};

function CFG_HALL_Y0(K) { return K.HALL.y0; }
