'use strict';
// The Egg Barn (js/eggfarm.js, with the bigger barn map in js/barn.js): in through the barn door, the old barn's parts
// still there, through the archway into the hall. Then the egg chain, step by step, as a kid plays it:
// - no Egg Belt at the start: hens lay into the egg trays under their coops; walking past them the eggs hop onto the
//   tower (from the trays, never from outside the hall);
// - each coop draws exactly as many hen faces as the number on its roof, and the board shows the same total;
// - 📦 Pack the eggs puts the tower into the packer's hopper; the packer makes boxes onto the pile;
// - 📦 Load the truck at the dock; nothing loads by itself without a Loader; the truck toots, drives out of the north
//   doors, up the farm track onto Main Street to the Egg Market (a path clear of every obstacle), unloads, comes back
//   and pays;
// - 🌽 corn: a fan of corn bits, chicks run out to peck, the Eggs ×2 badge, twice the laying;
// - the Egg Belt pad builds the belt (an animation), then the belt carries the eggs to the packer; the Loader pad hires
//   a loader who walks the boxes onto the truck;
// - the spare truck: load it at the pile, drive it out of the north doors, 🥚 Deliver the eggs at the Egg Market for
//   the normal price, drive back in;
// - the lucky egg floats inside the hall; every flying egg starts inside the map it flies in;
// - every pad, egg types, the tall tower (timed), offline catch-up, an old save keeps its upgrades, rescues, a stuck
//   check, Take-me-home; screenshots of each.
module.exports = async (t) => {
  await t.boot();
  const quiet = () => t.page.addStyleTag({ content: '#toasts { display: none !important; }' });   // keep the pictures clear of passing toasts
  await quiet();
  const K = await t.ev(() => CFG.EGGFARM);
  // every egg that starts flying onto the tower is logged, with where it starts
  await t.ev(() => { window.__eggFrom = []; const orig = EggFarmExt.catchEgg; EggFarmExt.catchEgg = function (g, x, y, type, delay) { window.__eggFrom.push({ x, y, area: g.area }); return orig.call(this, g, x, y, type, delay); }; EggFarmExt.ready(Game).luckyT = 1e9; });
  t.expect(await t.ev(() => Game.ext.indexOf(EggFarmExt) >= 0 && Game.ext.indexOf(EggFarmExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(EggFarmExt) < Game.ext.indexOf(BarnExt) && Render.ext.includes(EggFarmExt)), 'registered first-ish in Game.ext and in Render.ext');
  const map = await t.ev(() => {
    const W = CFG.AREAS.barn.WORLD, over = Object.keys(CFG.AREAS).filter((k) => k !== 'barn').filter((k) => { const o = CFG.AREAS[k].WORLD; return o && o.x0 < W.x1 + 1000 && o.x1 > W.x0 - 1000 && o.y0 < W.y1 + 1000 && o.y1 > W.y0 - 1000; });
    return { W, over, place: CFG.AREAS.barn.place, mapped: WorldMapExt.placeOf('barn'), area: (W.x1 - W.x0) * (W.y1 - W.y0) / (600 * 400) };
  });
  t.expectEq(map.over.join(','), '', `the barn's map (${JSON.stringify(map.W)}) is at least 1000 px from every other map`);
  t.expect(map.place === 'town' && map.mapped === 'town', 'the barn still belongs to the farm on the world map');
  t.expect(map.area > 4 && map.area < 7, `the barn's map is about 4-6× the old one (${map.area.toFixed(1)}×)`);
  t.expect(await t.ev(() => Game.s.eggfarm && Game.s.eggfarm.coops === 1 && Game.s.eggfarm.hens.every((n) => n === 0) && Game.s.eggfarm.lv.belt === 0 && Game.s.eggfarm.lv.loader === 0), 'a fresh farm: one empty coop, no belt, no loader');

  // ---- in through the barn door on the farm; the old barn is still all there and reachable
  await t.ev(() => { const D = CFG.BARN.DOOR_OUT; T.tp(D.x, D.y, 'town'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🚪 Go into the barn', 'door label on the farm');
  await t.ev(() => { T.act(); T.step(5); });
  t.expectEq(await t.ev(() => Game.area), 'barn', 'inside the barn');
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
  const walk = await t.ev(() => {
    const A = CFG.BARN.arch, x = (A.x0 + A.x1) / 2; T.tp(x, 4300, 'barn');
    T.steer(0, 1); T.step(70); T.unsteer(); const down = Game.player.y;
    T.steer(0, -1); T.step(70); T.unsteer(); const up = Game.player.y;
    return { down, up };
  });
  t.expect(walk.down > K.HALL.y0 + 30 && walk.up < 4330, `walked through the archway into the hall and back (${Math.round(walk.down)}, ${Math.round(walk.up)})`);
  t.expectEq(await t.ev(() => Game.s.eggfarm.seen), true, 'the hall is marked as found');

  // ---- the hall, early: no conveyor belt at all, a nest box under the coop; the hint points at the big red button
  await t.ev(() => { T.tp(40200, 4620, 'barn'); T.step(2); });
  const h0 = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, Bt = CFG.EGGFARM.BELT, hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    return { text: T.hint(), target: Game.hint && Game.hint.target, beltOn: EggFarmExt.beltOn(s), tokens: st.belt.length, beltSolid: hit(40300, Bt.y), bg: EggFarmExt.bgKey(Game) };
  });
  t.expectEq(h0.text, 'Press the big red button! 🐣', 'first hint in the hall');
  t.expect(h0.target && h0.target.x === K.HATCHER.btn.x, 'the hint points at the button');
  t.expect(!h0.beltOn && h0.tokens === 0 && !h0.beltSolid && !/b$/.test(h0.bg), `no Egg Belt at the start: not drawn, not solid, nothing on it (${JSON.stringify(h0)})`);
  await t.shot('hall-early');

  // ---- hatch: a chick pops out, waddles along the path and into the coop; the refill ring stops a runaway
  await t.ev(() => { const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); T.step(1); });
  t.expectEq(await t.ev(() => T.label()), '🐣 Hatch!', 'the hatch button label at the machine');
  const h1 = await t.ev(() => { T.act(); const a = { hens: Game.s.eggfarm.hens[0], chicks: EggFarmExt.st.chicks.length, refill: EggFarmExt.st.refill, shown: EggFarmExt.shown(Game.s.eggfarm, 0) }; T.act(); a.hens2 = Game.s.eggfarm.hens[0]; return a; });
  t.expect(h1.hens === 1 && h1.chicks === 1 && h1.refill > 0.3 && h1.shown === 0, `one chick hatched, not in its coop yet (${JSON.stringify(h1)})`);
  t.expectEq(h1.hens2, 1, 'pressing again during the refill does nothing');
  await t.ev(() => T.step(14));
  await t.shot('hatch');
  const arrive = await t.ev(() => T.until(() => EggFarmExt.st.chicks.length === 0, 900));
  t.expect(arrive > 0, `the chick reached the coop (${arrive} steps)`);
  t.expectEq(await t.ev(() => EggFarmExt.shown(Game.s.eggfarm, 0)), 1, 'and is now a hen inside');

  // ---- each coop draws one hen face per hen: the faces, the number on its roof and the board's total all agree
  const faces = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt, out = [];
    T.tp(40300, 4620, 'barn');
    for (const [lv, n] of [[0, 0], [0, 1], [0, 7], [0, 20], [2, 23], [4, 37], [4, 60], [10, 87], [10, 120]]) {
      s.lv.coop = lv; s.hens[0] = n; Render.draw(Game);
      const f = st.faces[0];
      out.push({ n, cap: E.cap(s), drawn: f.drawn, label: st.labels[0], board: st.boardN, key: f.key });
    }
    // with chicks still on the path: they are on neither the coop nor its number nor the board until they arrive
    s.lv.coop = 0; s.hens[0] = 5; st.refill = 0; const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); T.act(); T.act(); T.step(30); st.refill = 0; T.act(); T.step(2);
    T.tp(40300, 4620, 'barn'); Render.draw(Game);
    const walking = { hens: s.hens[0], incoming: st.incoming[0], drawn: st.faces[0].drawn, label: st.labels[0], board: st.boardN };
    T.until(() => !st.chicks.length, 900); Render.draw(Game);
    const after = { hens: s.hens[0], drawn: st.faces[0].drawn, label: st.labels[0], board: st.boardN };
    // the grid always fits in the coop's front
    const fits = [20, 30, 50, 60, 80, 120].every((cap) => { const F = E.coopFront(0), G = E.grid(cap, F.w, F.h); return G.cols * G.rows >= cap && G.cols * G.cell <= F.w + 0.01 && G.rows * G.cell <= F.h + 0.01 && G.cell >= 4; });
    return { out, walking, after, fits };
  });
  for (const f of faces.out) t.expect(f.drawn === f.n && f.label === f.n && f.board === f.n, `a coop of ${f.n}/${f.cap} hens draws ${f.drawn} faces, its roof says ${f.label}, the board says ${f.board}`);
  t.expect(faces.walking.drawn === faces.walking.label && faces.walking.label === faces.walking.board && faces.walking.label === faces.walking.hens - faces.walking.incoming && faces.walking.incoming > 0, `chicks still walking are not counted yet (${JSON.stringify(faces.walking)})`);
  t.expect(faces.after.drawn === faces.after.hens && faces.after.label === faces.after.hens && faces.after.board === faces.after.hens, `once in, the coop, its number and the board all count them (${JSON.stringify(faces.after)})`);
  t.expect(faces.fits, 'the rows of faces fit any coop size');
  await t.ev(() => { const s = Game.s.eggfarm; s.lv.coop = 0; s.hens[0] = 14; s.trays.fill(0); EggFarmExt.st.acc.fill(0); T.tp(40100, 4536, 'barn'); T.step(3); Render.setZoom(2.1); T.step(2); });
  await t.shot('coop-count');
  await t.ev(() => { Render.setZoom(1); });

  // fill the coop: FULL, no more chicks, a friendly float; buy a new coop
  const fill = await t.ev(() => { const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); let n = 0; while (Game.s.eggfarm.hens[0] < 20 && n < 60) { T.act(); T.step(26); n++; } return { hens: Game.s.eggfarm.hens[0], presses: n }; });
  t.expectEq(fill.hens, 20, `the coop filled up to 20 (${fill.presses} presses)`);
  const full = await t.ev(() => { T.step(30); Game.floats.length = 0; T.act(); return { hens: Game.s.eggfarm.hens[0], flash: EggFarmExt.st.fullFlash, float: Game.floats.some((f) => f.text.includes('All full')), room: EggFarmExt.room(Game.s.eggfarm) }; });
  t.expect(full.hens === 20 && full.flash > 0 && full.float && full.room === 0, `a full coop: FULL sign, no more chicks, a friendly float (${JSON.stringify(full)})`);
  await t.ev(() => { T.until(() => EggFarmExt.st.chicks.length === 0, 900); const s = Game.s.eggfarm; s.trays.fill(0); T.tp(40104, 4640, 'barn'); T.step(2); Render.draw(Game); });
  const fullDraw = await t.ev(() => ({ drawn: EggFarmExt.st.faces[0].drawn, label: EggFarmExt.st.labels[0], hint: T.hint() }));
  t.expect(fullDraw.drawn === 20 && fullDraw.label === 20, `the full coop shows all 20 hens (${JSON.stringify(fullDraw)})`);
  await t.shot('coop-full');
  const coop = await t.ev(() => {
    const pad = EggFarmExt.pads(Game).find((p) => p.key === 'egg_newcoop'); Game.s.cash = pad.price;
    T.tp(pad.pos.x, pad.pos.y, 'barn'); const n = T.until(() => Game.s.eggfarm.coops === 2, 900);
    return { n, coops: Game.s.eggfarm.coops, cash: Game.s.cash, price: pad.price, next: (EggFarmExt.pads(Game).find((p) => p.key === 'egg_newcoop') || {}).price };
  });
  t.expect(coop.coops === 2 && coop.n > 0 && coop.cash < 1, `bought a second coop for ${coop.price} (${JSON.stringify(coop)})`);
  t.expect(coop.next > coop.price, 'the next coop costs more (Shop.cost)');
  const into2 = await t.ev(() => { const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); T.step(30); T.act(); return Game.s.eggfarm.hens[1]; });
  t.expectEq(into2, 1, 'the next chick goes into the new coop');

  // ---- THE CHAIN BY HAND. Laying: eggs drop into the egg tray under each coop (no belt)
  const lay = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st; T.tp(39900, 4760, 'barn'); s.trays.fill(0); st.acc.fill(0); const laid0 = s.laid;
    const n = T.until(() => s.trays[0] >= 3, 1200);
    return { n, trays: s.trays.slice(0, 2), laid: s.laid - laid0, belt: st.belt.length, hint: T.hint(), target: Game.hint && Game.hint.target };
  });
  t.expect(lay.n > 0 && lay.trays[0] >= 3 && lay.belt === 0, `the hens lay into their egg tray (${JSON.stringify(lay)})`);
  t.expect(lay.hint === 'Collect the eggs! 🥚' && lay.target && Math.abs(lay.target.x - (K.COOP_X[0] + K.TRAY.dx)) < 1, 'the hint says to collect the eggs, pointing at the tray');
  // walking past the trays: the eggs hop from the tray onto the tower
  const collect = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, T0 = EggFarmExt.trayAt(0), hens = s.hens.slice(); s.hens.fill(0); st.stack.length = 0; s.trays[0] = 10; s.trays[1] = 4; window.__eggFrom.length = 0;
    T.tp(T0.x - 30, T0.y + 40, 'barn'); T.step(4);
    const from = window.__eggFrom.slice(), flying = st.fly.length;
    T.steer(1, 0); T.step(45); T.unsteer(); T.step(40); s.hens = hens;
    return { from: from.map((f) => [Math.round(f.x), Math.round(f.y)]), flying, stack: st.stack.length, trays: s.trays.slice(0, 2), tray: [T0.x, T0.y] };
  });
  t.expect(collect.from.length > 0 && collect.from.every(([x, y]) => Math.abs(x - collect.tray[0]) < 12 && Math.abs(y - collect.tray[1]) < 8), `the eggs fly up from the tray itself (${JSON.stringify(collect.from.slice(0, 3))})`);
  t.expect(collect.stack >= 14 && collect.trays[0] === 0 && collect.trays[1] === 0, `walking along the coops collects the trays (${JSON.stringify(collect)})`);
  await t.ev(() => { const st = EggFarmExt.st; T.step(1); });
  // pack: the tower goes into the packer's hopper, the packer makes boxes onto the pile
  const pack = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, P = CFG.EGGFARM.PACK; s.boxes = 0; s.boxVal = 0; s.box = 0; s.boxEggVal = 0; s.hopper = 0; s.hopperVal = 0;
    T.tp(P.x - 120, P.y, 'barn'); T.step(1); const hint = T.hint(), target = Game.hint && Game.hint.target;
    T.tp(P.x, P.y, 'barn'); T.step(1);
    return { hint, target, label: T.label(), n: st.stack.length };
  });
  t.expect(pack.hint === 'Put the eggs in the packer! 📦' && pack.target && pack.target.x === K.PACK.x, `the hint sends the eggs to the packer (${JSON.stringify(pack)})`);
  t.expectEq(pack.label, '📦 Pack the eggs', 'the pack button at the packer');
  await t.ev(() => { T.act(); T.step(12); });
  const stream = await t.ev(() => { const st = EggFarmExt.st, H = CFG.EGGFARM.PACKER.hopper; const out = st.fly.filter((f) => f.out); return { flying: out.length, toHopper: out.every((f) => Math.abs(f.x1 - H.x) < 14 && Math.abs(f.y1 - H.y) < 6), left: st.stack.length }; });
  t.expect(stream.flying > 2 && stream.toHopper, `the eggs stream off the tower into the packer's hopper (${JSON.stringify(stream)})`);
  await t.shot('packing-stream');
  const packed = await t.ev((n0) => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, O = CFG.EGGFARM.PACKER.out; let fromPacker = 0;
    const n = T.until(() => { fromPacker = Math.max(fromPacker, st.boxFly.filter((b) => b.to === 'pile' && Math.abs(b.x0 - O.x) < 2).length); return !st.stack.length && !st.fly.length && s.hopper === 0; }, 900);
    T.step(30);
    return { n, boxes: s.boxes, box: s.box, per: EggFarmExt.boxEggs(s), n0, fromPacker, val: s.boxVal, hint: T.hint() };
  }, pack.n);
  t.expect(packed.n >= 0 && packed.boxes * packed.per + packed.box === packed.n0, `all ${packed.n0} eggs went through the packer into boxes (${JSON.stringify(packed)})`);
  t.expect(packed.fromPacker > 0, 'the boxes pop out of the packer onto the pile');
  t.expect(Math.abs(packed.val - packed.boxes * packed.per) < 0.01, 'each plain egg in a box is worth $1');
  // nothing loads the truck by itself without a loader
  const still = await t.ev(() => { const st = EggFarmExt.st; T.tp(39900, 4760, 'barn'); T.step(600); const tr = EggFarmExt.dockTruck(); return { boxes: Game.s.eggfarm.boxes, truck: tr && tr.boxes, state: tr && tr.state, hint: T.hint(), target: Game.hint && Game.hint.target }; });
  t.expect(still.boxes === packed.boxes && still.truck === 0 && still.state === 'dock', `without a loader the boxes wait on the pile (${JSON.stringify(still)})`);
  t.expect(still.hint === 'Load the boxes onto the truck! 🚚' && still.target && still.target.x === K.LOAD[0].x, 'the hint says to load the truck');
  // load the truck: the boxes fly from the pile onto the truck at the dock, its fill bar fills
  const load = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, L = CFG.EGGFARM.LOAD[0], BP = CFG.EGGFARM.BOXPILE; Game.s.eggfarm.trays.fill(0); st.acc.fill(0);
    T.tp(L.x, L.y, 'barn'); T.step(1); const label = T.label(); const b0 = s.boxes; T.act(); T.step(3);
    const fly = st.boxFly.filter((b) => b.to !== 'pile' && b.to !== 'market').map((b) => ({ x0: Math.round(b.x0), y0: Math.round(b.y0), x1: Math.round(b.x1), y1: Math.round(b.y1) }));
    T.step(60); const tr = EggFarmExt.dockTruck();
    return { label, b0, fly, boxes: s.boxes, truck: tr && tr.boxes, drawn: tr && tr.drawBoxes, cap: EggFarmExt.truckCap(s), pile: [BP.x, BP.y], bay: CFG.EGGFARM.BAYS[0] };
  });
  t.expectEq(load.label, '📦 Load the truck', 'the load button behind the truck');
  t.expect(load.fly.length > 0 && load.fly.every((b) => Math.abs(b.x0 - load.pile[0]) < 40 && Math.abs(b.y0 - load.pile[1]) < 70 && Math.abs(b.x1 - load.bay.x) < 30 && b.y1 > load.bay.y - 10), `boxes fly from the pile onto the truck (${JSON.stringify(load.fly.slice(0, 2))})`);
  t.expect(load.truck === Math.min(load.b0, load.cap) && load.drawn === load.truck && load.boxes === load.b0 - load.truck, `the truck took the boxes (${JSON.stringify(load)})`);
  await t.shot('loading');
  // the truck toots and drives out of the north doors (straight up, through the doorway), then out on the farm
  const ship = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, D = CFG.EGGFARM.DOOR, tr = st.trucks[0]; Game.floats.length = 0; const val = tr.val, c0 = Game.s.cash;
    const n1 = T.until(() => tr.state === 'toot', 900); const toot = Game.floats.some((f) => f.text.includes('Toot')); const hint = T.hint();
    const ys = []; const n2 = T.until(() => { if (tr.state === 'out') ys.push({ x: tr.x, y: tr.y }); return tr.state === 'road'; }, 600);
    return { n1, n2, toot, hint, val, c0, north: ys.length > 3 && ys.every((q, i) => i === 0 || q.y <= ys[i - 1].y) && ys.every((q) => q.x > D.x0 && q.x < D.x1) && ys[ys.length - 1].y < CFG.EGGFARM.HALL.y0 };
  });
  t.expect(ship.n1 > 0 && ship.toot, `the truck toots when it is ready to go (${JSON.stringify(ship)})`);
  t.expect(ship.hint === 'Toot toot! Off to the Egg Market! 🚚', `the hint says it is off to the market (${ship.hint})`);
  t.expect(ship.n2 > 0 && ship.north, 'it drives straight out of the big north doors');
  // inside, the picture of it leaving: shrinking through the doorway
  // (the trucks hold still for the pictures: the game keeps running in real time while a screenshot is taken)
  await t.ev(() => { const st = EggFarmExt.st, tr = st.trucks[0]; tr.state = 'out'; tr.x = CFG.EGGFARM.BAYS[0].x; tr.y = 4400; tr.angle = -Math.PI / 2; tr.t = 0.3; T.tp(40600, 4600, 'barn'); T.step(1); tr.y = 4372; window.__ut = EggFarmExt.updateTrucks; EggFarmExt.updateTrucks = () => {}; });
  await t.shot('truck-leaving-north');
  await t.ev(() => { EggFarmExt.updateTrucks = window.__ut; T.until(() => EggFarmExt.st.trucks[0].state === 'road', 300); });
  // on the farm: out of the barn's north doors, up the track, right onto Main Street, to the Egg Market
  const road = await t.ev(() => {
    const st = EggFarmExt.st, tr = st.trucks[0], B = CFG.FARM.barn, M = CFG.EGGFARM.MARKET, NG = CFG.FARM.northGate, pts = [];
    T.tp(-760, 60, 'town'); T.step(1);
    const n = T.until(() => { pts.push({ x: tr.x, y: tr.y, a: tr.angle, s: tr.state }); return tr.state === 'unload'; }, 900);
    const first = pts[0], northOut = pts.filter((q) => q.y > CFG.ROAD.y2).every((q) => Math.abs(q.x - NG.x) < NG.half - 10);
    return { n, first, northOut, end: { x: Math.round(tr.x), y: Math.round(tr.y) }, inBarn: first.x > B.x0 && first.x < B.x1 && first.y > B.y0, drop: M.drop };
  });
  t.expect(road.inBarn && road.northOut, `on the farm the truck comes out of the barn's north side, through the fence gap (${JSON.stringify(road.first)})`);
  t.expect(road.n > 0 && Math.abs(road.end.x - road.drop.x) < 2 && Math.abs(road.end.y - road.drop.y) < 2, `and drives along Main Street to the Egg Market (${JSON.stringify(road.end)})`);
  await t.ev(() => { const tr = EggFarmExt.st.trucks[0]; Render.setZoom(1); T.tp(-470, 80, 'town'); T.step(6); EggFarmExt.updateTrucks = () => {}; });
  await t.shot('truck-at-market');
  await t.ev(() => { EggFarmExt.updateTrucks = window.__ut; });
  const back = await t.ev((d) => {
    const st = EggFarmExt.st, tr = st.trucks[0], s = Game.s.eggfarm, pts = []; Game.floats.length = 0;
    const n1 = T.until(() => tr.state === 'back', 600); const mkt = st.mkt, thanks = Game.floats.some((f) => f.text.includes('Thank'));
    const n2 = T.until(() => { if (tr.state === 'back') pts.push({ x: tr.x, y: tr.y }); return tr.state !== 'back'; }, 900);
    const last = pts[pts.length - 1];
    T.step(2);
    return { n1, n2, mkt, thanks, barnY0: CFG.FARM.barn.y0, bank: s.bank, val: d.val, state: tr.state, last, same: pts.filter((q) => q.y > CFG.ROAD.y2).every((q) => Math.abs(q.x - CFG.FARM.northGate.x) < 30) };
  }, ship);
  t.expect(back.n1 > 0 && back.mkt > 0 && back.thanks, `at the market the boxes hop onto the counter (${JSON.stringify(back)})`);
  t.expect(back.n2 > 0 && back.same && back.last.y > back.barnY0, `and the truck comes back the same way, into the barn's north doors (${JSON.stringify(back.last)})`);
  t.expect(Math.abs(back.bank - Math.round(back.val)) < 1, `it brings the money home (banked while the chef is out: ${back.bank} for ${back.val})`);
  // the truck path on the town map: from the north doors to the market and back, clear of every building, fence,
  // field and the train tracks
  const path = await t.ev(() => {
    const K2 = CFG.EGGFARM, obs = Game.townObstacles(true), B = CFG.FARM.barn, S = CFG.STATION, bad = [];
    for (const R of [K2.ROUTE_OUT, K2.ROUTE_BACK]) {
      const len = EggFarmExt.routeLen(R);
      for (let d = 0; d <= len; d += 6) {
        const q = EggFarmExt.along(R, d); if (q.y > B.y0 - 26) continue;   // still inside the barn's doorway
        for (const dx of [-20, 0, 20]) for (const dy of [-20, 0, 20]) if (obs.some((o) => Game.hitRect(q.x + dx, q.y + dy, 2, o))) { bad.push([Math.round(q.x), Math.round(q.y)]); break; }
        if (q.y < S.trackY + 60) bad.push(['tracks', Math.round(q.x), Math.round(q.y)]);
      }
    }
    const M = K2.MARKET, roadOK = M.drop.y > CFG.ROAD.y1 && M.drop.y < CFG.ROAD.y2 && M.y1 < CFG.ROAD.y1 && M.y0 > S.platform.y1 - 30;
    return { bad: bad.slice(0, 6), roadOK };
  });
  t.expect(path.bad.length === 0, `the trucks' route on the town map hits nothing (${JSON.stringify(path.bad)})`);
  t.expect(path.roadOK, 'the Egg Market stands on the far side of Main Street, its drop-off on the road, below the station');
  // back in the hall, the money waits by the cash spot and goes into the chef's pocket
  const cashIn = await t.ev(() => { const s = Game.s.eggfarm, c0 = Game.s.cash, b = s.bank; T.tp(CFG.EGGFARM.CASH.x, CFG.EGGFARM.CASH.y, 'barn'); T.step(2); return { got: Game.s.cash - c0, b, left: s.bank }; });
  t.expect(cashIn.got === cashIn.b && cashIn.b > 0 && cashIn.left === 0, `the egg money picked up in the hall (${JSON.stringify(cashIn)})`);
  // paid straight into the chef's pocket when he is in the hall when the truck gets back
  const inHall = await t.ev(() => { const s = Game.s.eggfarm, c0 = Game.s.cash; T.tp(40300, 4700, 'barn'); EggFarmExt.pay(Game, 25); return { got: Game.s.cash - c0, bank: s.bank, beep: Game.floats.some((f) => f.text.includes('Beep')) }; });
  t.expect(inHall.got === 25 && inHall.bank === 0 && inHall.beep, 'in the hall, the truck money flies to the chef');

  // ---- 🌽 corn: a fan of corn lands in front of the coops, chicks run out and peck, Eggs ×2 with a countdown
  const corn = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, C = CFG.EGGFARM.CORN.spot, Kc = CFG.EGGFARM; s.hens[0] = 12; s.hens[1] = 6; T.tp(C.x, C.y, 'barn'); T.step(1); const label = T.label();
    st.acc.fill(0); s.trays.fill(0); T.step(120); const plain = s.laid; s.trays.fill(0);
    T.act(); const throwN = st.corn.length, hands = st.corn.every((c) => Math.abs(c.x0 - C.x) < 20 && c.y0 < C.y - 20), land = st.corn.every((c) => c.y1 > Kc.CHICK_Y - 8 && c.y1 < Kc.CHICK_Y + 40 && c.x1 > Kc.COOP_X[0] - 50 && c.x1 < Kc.COOP_X[s.coops - 1] + 50);
    const laid0 = s.laid; T.step(120); const boosted = s.laid - laid0; const out = st.peck.filter((q) => q.state !== 'out').length, peck = st.peck.length;
    Render.draw(Game);
    return { label, throwN, hands, land, boost: st.boost, plain: plain, boosted, out, peck, badge: st.badge };
  });
  t.expectEq(corn.label, '🌽 Scatter corn', 'the corn button at the sack');
  t.expect(corn.throwN >= 16 && corn.hands && corn.land, `a fan of corn flies from the chef's hands onto the floor in front of the coops (${JSON.stringify(corn)})`);
  t.expect(corn.peck >= 2 && corn.out >= 2, 'chicks come out of the coops to peck');
  t.expect(corn.badge >= 10 && corn.boost > 10, `the Eggs ×2 badge counts down (${corn.badge})`);
  const cornRate = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt; s.trays.fill(0); st.acc.fill(0);
    const a = s.laid; T.step(240); const boosted = s.laid - a; st.boost = 0; s.trays.fill(0); st.acc.fill(0);
    const b = s.laid; T.step(240); const plain = s.laid - b; return { boosted, plain };
  });
  t.expect(cornRate.boosted >= cornRate.plain * 1.7 && cornRate.plain > 0, `the hens lay twice as fast with corn (${JSON.stringify(cornRate)})`);
  const cornPic = await t.ev(() => { const s = Game.s.eggfarm, st = EggFarmExt.st, C = CFG.EGGFARM.CORN.spot; T.tp(C.x, C.y, 'barn'); T.act(); T.step(80); return st.peck.filter((q) => q.state === 'peck' || q.state === 'walk').length; });
  t.expect(cornPic > 0, 'the chicks are pecking the corn');
  await t.shot('corn');
  const cornEnd = await t.ev(() => { const st = EggFarmExt.st; T.step(60 * 16); T.until(() => !st.peck.length, 900); return { peck: st.peck.length, corn: st.corn.length, boost: st.boost }; });
  t.expect(cornEnd.peck === 0 && cornEnd.corn === 0 && cornEnd.boost === 0, 'when the corn time is up the chicks go back in');

  // ---- every pad: a growing price and a visible effect (the Egg Belt is bought once)
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

  // ---- the Egg Belt: bought on its pad, built piece by piece, then it carries the eggs from the trays to the packer
  const belt = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt, Bt = CFG.EGGFARM.BELT, pad = E.pads(Game).find((p) => p.key === 'egg_belt');
    Game.s.cash = pad.price; T.tp(pad.pos.x, pad.pos.y, 'barn'); const n = T.until(() => s.lv.belt === 1, 900);
    const building = !!st.build && !E.beltOn(s), solidWhile = Game.obstacles().some((o) => Game.hitRect(40300, Bt.y, 12, o)), maxed = E.pads(Game).find((p) => p.key === 'egg_belt').maxed;
    return { n, building, solidWhile, maxed, price: pad.price };
  });
  t.expect(belt.n > 0 && belt.building && !belt.solidWhile && belt.maxed, `the Egg Belt pad starts building the belt (${JSON.stringify(belt)})`);
  await t.ev(() => { T.tp(40300, 4640, 'barn'); T.step(70); });
  await t.shot('belt-build');
  const built = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt, Bt = CFG.EGGFARM.BELT; T.until(() => !st.build, 400);
    s.hens[0] = 20; s.hens[1] = 10; s.trays.fill(0); s.hopper = 0; s.hopperVal = 0; s.boxes = 0; s.boxVal = 0; s.box = 0; s.boxEggVal = 0; st.stack.length = 0; T.tp(39900, 4780, 'barn');
    const n1 = T.until(() => st.belt.length > 0, 900), n2 = T.until(() => st.slide.length > 0, 1200), n3 = T.until(() => s.hopper > 0 || s.box > 0 || s.boxes > 0, 600), n4 = T.until(() => s.boxes > 0, 1200);
    return { on: E.beltOn(s), solid: Game.obstacles().some((o) => Game.hitRect(40300, Bt.y, 12, o)), n1, n2, n3, n4, bg: E.bgKey(Game) };
  });
  t.expect(built.on && built.solid && /b$/.test(built.bg), `the belt is built and in place (${JSON.stringify(built)})`);
  t.expect(built.n1 >= 0 && built.n2 >= 0 && built.n3 >= 0 && built.n4 >= 0, 'the trays tip onto the belt, the eggs slide into the hopper, the packer makes boxes');
  await t.ev(() => { T.tp(40420, 4640, 'barn'); T.step(20); });
  await t.shot('belt-running');

  // ---- the Loader: hired on his pad, he walks the boxes from the pile onto the truck
  const loader = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt, pad = E.pads(Game).find((p) => p.key === 'egg_loader');
    Game.s.cash = pad.price; T.tp(pad.pos.x, pad.pos.y, 'barn'); const n = T.until(() => s.lv.loader === 1, 900); T.tp(40560, 4700, 'barn');
    st.trucks.forEach((tr, i) => { tr.state = i ? 'road' : 'dock'; tr.d = 0; tr.boxes = 0; tr.val = 0; tr.idle = 0; tr.x = CFG.EGGFARM.BAYS[0].x; tr.y = i ? 0 : CFG.EGGFARM.BAYS[0].y; });
    s.boxes = 5; s.boxVal = 5 * E.boxEggs(s); s.hens.fill(0); s.trays.fill(0); s.hopper = 0; st.belt.length = 0; st.slide.length = 0;
    const seen = new Set(), L = () => st.loader; let carried = 0;
    const n2 = T.until(() => { if (L()) { seen.add(L().state); if (L().carry > 0 && L().state === 'toTruck') carried = Math.max(carried, L().carry); } return E.dockTruck() && E.dockTruck().boxes >= 2; }, 1200);
    return { n, n2, states: [...seen], carried, truck: E.dockTruck() && E.dockTruck().boxes, label: pad.label, next: E.pads(Game).find((p) => p.key === 'egg_loader').label };
  });
  t.expect(loader.n > 0 && loader.label === 'Hire a Loader' && loader.next === 'Faster Loader', `hired a loader (${JSON.stringify(loader)})`);
  t.expect(loader.n2 > 0 && ['toPile', 'toTruck'].every((k) => loader.states.includes(k)) && loader.carried === 1, `he walks to the pile, carries a box to the truck, and back (${JSON.stringify(loader)})`);
  await t.ev(() => { const st = EggFarmExt.st; T.until(() => st.loader.state === 'toTruck', 600); T.step(20); });
  await t.shot('loader');
  const auto = await t.ev(() => { const st = EggFarmExt.st, s = Game.s.eggfarm; s.hens[0] = 20; s.hens[1] = 20; const sh = s.shipped; T.tp(39800, 4780, 'barn'); const n = T.until(() => s.shipped > sh, 60 * 60); return { n, shipped: s.shipped - sh, auto: EggFarmExt.automatic(s) }; });
  t.expect(auto.n > 0 && auto.auto, `with the belt and the loader the farm ships eggs all by itself (${JSON.stringify(auto)})`);

  // ---- the egg types climb with the flock: golden at 30, rainbow 100, space 250, pizza 500 (once the chick is in)
  const types = [];
  for (let k = 1; k <= 4; k++) {
    const m = await t.ev((k) => {
      const s = Game.s.eggfarm, E = EggFarmExt, T2 = CFG.EGGFARM.TYPES;
      s.coops = 6; s.lv.coop = 10; E.st.obs = E.st.obsCar = null; s.type = k - 1; E.st.autoT = -1e9;
      const per = Math.floor((T2[k].at - 1) / 6), extra = T2[k].at - 1 - per * 6; s.hens = [0, 1, 2, 3, 4, 5].map((i) => per + (i < extra ? 1 : 0));
      const before = s.type; E.st.refill = 0; E.st.banner = null; const B = CFG.EGGFARM.HATCHER.btn; T.tp(B.x, B.y, 'barn'); T.act();
      const early = s.type; T.until(() => !E.st.chicks.length, 900);
      return { before, early, after: s.type, hens: E.shownHens(s), banner: E.st.banner && E.st.banner.type, value: E.eggValue(s, s.type) };
    }, k);
    types.push(m);
    t.expect(m.before === k - 1 && m.early === k - 1 && m.after === k && m.banner === k, `egg type ${k} unlocks at ${m.hens} hens, when the chick gets into its coop (${JSON.stringify(m)})`);
  }
  t.expect(types.every((m, i) => i === 0 || m.value > types[i - 1].value), 'each egg type is worth more');
  for (let k = 0; k <= 4; k++) {
    await t.ev((k) => {
      const s = Game.s.eggfarm, E = EggFarmExt; s.type = k; E.st.banner = null; E.st.stack.length = 0; E.st.fly.length = 0;
      for (let i = 0; i < 16; i++) E.st.stack.push({ t: k, x: 0, land: 9 });
      s.hens = [60, 60, 60, 60, 60, 60]; T.tp(40260, 4620, 'barn'); T.step(20);
    }, k);
    await t.shot('type-' + k);
  }
  await t.ev(() => { const s = Game.s.eggfarm; s.type = 0; EggFarmExt.st.stack.length = 0; s.hens = [20, 20, 0, 0, 0, 0]; s.coops = 2; s.lv.coop = 0; s.lv.belt = 0; s.lv.loader = 0; EggFarmExt.st.loader = null; EggFarmExt.st.belt.length = 0; EggFarmExt.st.autoT = 0; EggFarmExt.st.obs = EggFarmExt.st.obsCar = null; T.step(2); });

  // ---- the egg tower: walk along full trays until it is 100+ high
  const scoop = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, E = EggFarmExt; s.coops = 6; s.trays = [24, 24, 24, 24, 24, 24]; s.hens.fill(0); st.stack.length = 0; st.obs = null;
    const T0 = E.trayAt(0); T.tp(T0.x, T0.y + 40, 'barn'); T.steer(1, 0); const n = T.until(() => st.stack.length >= 120, 1200); T.unsteer();
    return { n, stack: st.stack.length };
  });
  t.expect(scoop.n > 0 && scoop.stack >= 120, `the egg tower grew to ${scoop.stack} (${scoop.n} steps)`);
  t.expect(scoop.n < 60 * 8, 'it grows fast (a few seconds for 120 eggs)');
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
  const wob = await t.ev(() => {
    const st = EggFarmExt.st, top = () => st.stack[st.stack.length - 1].x; T.tp(39800, 4700, 'barn'); T.step(60);
    const still = top(); T.steer(1, 0); T.step(30); const walking = top(), lean = st.lean, mid = st.stack[40].x; T.unsteer();
    let maxSwing = 0, maxLean = 0; for (let i = 0; i < 120; i++) { T.step(1); maxSwing = Math.max(maxSwing, top()); maxLean = Math.max(maxLean, st.lean); }
    T.step(300); const settled = top();
    return { still, walking, lean, mid, maxSwing, maxLean, settled };
  });
  t.expect(Math.abs(wob.still) < 2, `a still tower stands straight (${wob.still.toFixed(1)})`);
  t.expect(wob.walking < -40 && wob.mid > wob.walking, `walking right, the tower leans back like a noodle (${JSON.stringify(wob)})`);
  t.expect(wob.maxSwing > 5 && wob.maxLean > 5, 'stopping swings the tower forward past straight');
  t.expect(Math.abs(wob.settled) < 3, `and it settles (${wob.settled.toFixed(1)})`);
  await t.ev(() => { T.tp(39800, 4760, 'barn'); T.step(2); T.steer(1, 0); T.step(18); });
  await t.shot('tower-walking');
  await t.ev(() => { T.unsteer(); T.step(10); });
  // a whole tall tower goes through the packer
  const bigPack = await t.ev(() => {
    const s = Game.s.eggfarm, st = EggFarmExt.st, P = CFG.EGGFARM.PACK; s.boxes = 0; s.boxVal = 0; s.box = 0; s.boxEggVal = 0; s.hopper = 0; s.hopperVal = 0; const n0 = st.stack.length;
    T.tp(P.x, P.y, 'barn'); T.act(); const n = T.until(() => !st.stack.length && !st.fly.length, 900); const m = T.until(() => s.hopper === 0, 3600);
    return { n0, n, m, boxes: s.boxes, box: s.box, per: EggFarmExt.boxEggs(s) };
  });
  t.expect(bigPack.n > 0 && bigPack.n < 60 * 4 && bigPack.boxes * bigPack.per + bigPack.box === bigPack.n0, `a ${bigPack.n0}-egg tower goes into the packer in a few seconds and comes out in boxes (${JSON.stringify(bigPack)})`);
  await t.ev(() => { const s = Game.s.eggfarm; s.boxes = 0; s.boxVal = 0; });

  // ---- loose eggs and the old barn's eggs join the tower
  const mag = await t.ev(() => {
    const st = EggFarmExt.st; st.stack.length = 0; T.tp(39800, 4800, 'barn');
    for (let i = 0; i < 5; i++) st.strays.push({ x: 39840 + i * 12, y: 4790, type: 0, z: 0, vz: 0, vx: 0, vy: 0, t: 0 });
    Game.floats.length = 0; T.step(30);
    return { left: st.strays.filter((e) => e.x < 39920 && e.y > 4780).length, boing: Game.floats.some((f) => f.text.includes('Boing')), stack: (T.step(30), st.stack.length) };
  });
  t.expect(mag.left === 0 && mag.stack === 5 && mag.boing, `loose eggs hop onto the tower (${JSON.stringify(mag)})`);
  const oldEgg = await t.ev(() => { const st = EggFarmExt.st, n0 = st.stack.length; BarnExt.st.eggs.push({ x: 39830, y: 4230, t: 1 }); T.tp(39830, 4230, 'barn'); T.step(40); return st.stack.length - n0; });
  t.expectEq(oldEgg, 1, 'an egg from the old barn hops onto the tower');

  // ---- the spare truck: load it at the pile, drive it out of the north doors to the Egg Market, deliver for the
  // normal price, and drive back in
  const spare = await t.ev(() => {
    const st = EggFarmExt.st, s = Game.s.eggfarm, v = st.spare, E = EggFarmExt, B1 = CFG.EGGFARM.BAYS[1], L1 = CFG.EGGFARM.LOAD[1];
    st.stack.length = 0; s.hens.fill(0); s.trays.fill(0); s.boxes = 4; s.boxVal = 4 * E.boxEggs(s) * E.eggValue(s, 0); s.bank = 0;
    st.trucks.forEach((tr) => { tr.state = 'road'; tr.d = 0; tr.boxes = 0; tr.val = 0; });
    T.tp(L1.x, L1.y, 'barn'); T.step(1); const label = T.label(); T.act(); T.until(() => !st.loading, 300); T.step(30);
    const loaded = v.boxes, val = v.val;
    T.tp(B1.x, B1.y + 62, 'barn'); T.step(1); const near = Game.findNearVehicle() === v; Game.enterCar(); T.step(1);
    const hintIn = T.hint();
    const ys = []; T.steer(0, -1); const n = T.until(() => { if (Game.area === 'barn') ys.push(v.y); return Game.area === 'town'; }, 300); T.unsteer();
    return { label, loaded, val, near, hintIn, n, north: ys.length > 2 && ys[ys.length - 1] < ys[0], area: Game.area, x: v.x, y: v.y, angle: v.angle };
  });
  t.expect(spare.label === '📦 Load the truck' && spare.loaded === 4, `loaded the spare truck at the pile (${JSON.stringify(spare)})`);
  t.expect(spare.near && spare.hintIn === 'Drive out of the big doors to the Egg Market! 🚚', `hopped in; the hint says to drive out to the market (${JSON.stringify(spare)})`);
  t.expect(spare.n > 0 && spare.north && spare.area === 'town', 'drove north out of the big doors');
  const farmOut = await t.ev(() => { const v = EggFarmExt.st.spare, B = CFG.FARM.barn; return { solid: Game.townObstacles(true).some((o) => Game.hitRect(v.x, v.y, 24, o)), north: v.y < B.y0 && Math.abs(v.x - CFG.FARM.northGate.x) < 10, hint: T.hint(), target: Game.hint && Game.hint.target, label: T.label() }; });
  t.expect(farmOut.label !== '🚚 Drive into the barn', `no drive-back-in button the moment it comes out (${farmOut.label})`);
  t.expect(!farmOut.solid && farmOut.north, `out on the farm, at the barn's north doors, on free ground (${JSON.stringify(farmOut)})`);
  t.expect(farmOut.hint === 'Drive the eggs to the Egg Market! 🥚' && farmOut.target && farmOut.target.x === K.MARKET.drop.x && farmOut.target.y === K.MARKET.drop.y, `an arrow to the Egg Market (${JSON.stringify(farmOut)})`);
  await t.shot('spare-farm');
  // drive up the track onto Main Street and along to the market
  const drive = await t.ev(() => {
    const v = EggFarmExt.st.spare, M = CFG.EGGFARM.MARKET.drop;
    T.steer(0, -1); T.until(() => v.y < 64, 300); T.steer(1, 0); const n = T.until(() => v.x > M.x - 40, 900); T.unsteer(); T.step(20);
    return { n, x: Math.round(v.x), y: Math.round(v.y), label: T.label(), hint: T.hint() };
  });
  t.expect(drive.n > 0 && drive.label === '🥚 Deliver the eggs', `drove along Main Street to the Egg Market (${JSON.stringify(drive)})`);
  const deliver = await t.ev((sp) => {
    const st = EggFarmExt.st, s = Game.s.eggfarm, c0 = Game.s.cash, e0 = s.earned; Game.floats.length = 0; T.act(); T.step(4);
    const flying = st.boxFly.filter((b) => b.to === 'market').length; const n = T.until(() => !st.deliver, 600);
    const E = EggFarmExt; return { flying, n, got: Game.s.cash - c0, earned: s.earned - e0, val: sp.val, normal: Math.round(4 * E.boxEggs(s) * E.eggValue(s, 0)), thanks: Game.floats.some((f) => f.text.includes('Thank')), boxes: st.spare.boxes, mkt: st.mkt, hint: T.hint() };
  }, spare);
  t.expect(deliver.flying > 0 && deliver.n > 0 && deliver.boxes === 0 && deliver.mkt > 0 && deliver.thanks, `the boxes hop onto the market counter (${JSON.stringify(deliver)})`);
  t.expect(deliver.got === Math.round(deliver.val) && deliver.earned === deliver.got && deliver.got === deliver.normal, `the market pays the normal price: $${deliver.got} for 4 boxes, what the eggs in them are worth, the same as a truck gets (${JSON.stringify(deliver)})`);
  t.expectEq(deliver.hint, 'Drive back into the barn! 🚚', 'then the hint says to drive back to the barn');
  await t.ev(() => { T.step(10); });
  await t.shot('market-delivery');
  const backIn = await t.ev(() => {
    const v = EggFarmExt.st.spare, S = CFG.EGGFARM.TOWN.spot; v.x = S.x + 20; v.y = S.y - 30; T.step(1);
    const label = T.label(); T.act(); T.step(3);
    return { label, area: Game.area, driving: Game.driving };
  });
  t.expect(backIn.label === '🚚 Drive into the barn' && backIn.area === 'barn' && backIn.driving, `drove back into the barn through the north doors (${JSON.stringify(backIn)})`);
  await t.ev(() => { T.steer(0, 1); T.step(25); T.unsteer(); T.step(5); });
  await t.shot('truck-driving');
  const parked = await t.ev(() => { Game.exitCar(); T.step(1); const v = EggFarmExt.st.spare; return { free: BarnExt.free(Game.player.x, Game.player.y), where: v.where }; });
  t.expect(parked.free && parked.where === 'barn', 'hopped out onto free floor in the hall');
  const home1 = await t.ev(() => { const st = EggFarmExt.st, v = st.spare; EggFarmExt.driveOut(Game); Game.driving = false; Game.vehicle = null; T.tp(540, 430, 'town'); T.step(2); return { where: v.where, x: v.x, y: v.y }; });
  t.expect(home1.where === 'barn' && home1.x === K.BAYS[1].x && home1.y === K.BAYS[1].y, 'a truck left on the farm goes back to its bay');

  // ---- the lucky egg floats on its balloon inside the hall (never through a wall); walk into it for a bonus
  const lucky = await t.ev(() => {
    const st = EggFarmExt.st, H = CFG.EGGFARM.HALL; st.stack.length = 0; T.tp(40000, 4720, 'barn'); let inside = true, n = 0;
    for (let k = 0; k < 8; k++) { EggFarmExt.spawnLucky(Game); const L = st.lucky; while (st.lucky === L && n < 6000) { if (L.x < H.x0 + 40 || L.x > H.x1 - 40 || L.y < H.y0 + 150 || L.y > H.y1) inside = false; Game.player.x = 39600; Game.player.y = 4880; T.step(1); n++; } }
    return { inside, n };
  });
  t.expect(lucky.inside, 'the lucky egg always floats inside the hall');
  const catchIt = await t.ev(() => {
    const st = EggFarmExt.st; window.__eggFrom.length = 0; T.tp(40000, 4720, 'barn'); EggFarmExt.spawnLucky(Game); st.lucky.x = 39940; st.lucky.y = 4720; st.lucky.dir = 1; st.lucky.t = 1;
    const c0 = Game.s.cash; T.step(3); const hint = Game.hint && Game.hint.text; const n = T.until(() => !st.lucky, 200); T.step(60);
    return { n, got: Game.s.cash - c0, stack: st.stack.length, float: Game.floats.some((f) => f.text.includes('Lucky')), hint, from: window.__eggFrom.map((f) => [Math.round(f.x), Math.round(f.y)]) };
  });
  t.expect(catchIt.n >= 0 && catchIt.got >= 50 && catchIt.stack === 6 && catchIt.float, `caught the lucky egg: money and eggs (${JSON.stringify(catchIt)})`);
  t.expect(catchIt.from.every(([x, y]) => Math.abs(x - 39940) < 80 && y > 4600 && y < 4720), 'its eggs fly from the balloon');
  const luckyBtn = await t.ev(() => { const st = EggFarmExt.st; EggFarmExt.spawnLucky(Game); st.lucky.x = Game.player.x + 50; st.lucky.y = Game.player.y; st.lucky.dir = 0; T.step(1); const l = T.label(); T.act(); return { l, gone: !st.lucky }; });
  t.expect(luckyBtn.l === '🎈 Catch the lucky egg!' && luckyBtn.gone, 'or press the button when it is close');
  await t.ev(() => { const st = EggFarmExt.st; EggFarmExt.spawnLucky(Game); st.lucky.x = 39800; st.lucky.y = 4700; st.lucky.dir = 0; st.lucky.t = 2; T.tp(39920, 4740, 'barn'); T.step(2); });
  await t.shot('lucky');
  await t.ev(() => { EggFarmExt.st.lucky = null; });
  // no egg ever flies in from outside: every egg that flew onto the tower in the barn started inside the barn's rooms
  const origins = await t.ev(() => {
    const H = CFG.EGGFARM.HALL, R = CFG.BARN.room, A = CFG.BARN.arch, bad = [];
    for (const f of window.__eggFrom.concat(window.__allFrom || [])) {
      if (f.area !== 'barn') { bad.push(f); continue; }
      const inHall = f.x > H.x0 && f.x < H.x1 && f.y > H.y0 - 120 && f.y < H.y1, inOld = f.x > R.x0 && f.x < R.x1 && f.y > R.y0 - 60 && f.y < R.y1, inArch = f.x > A.x0 && f.x < A.x1 && f.y > R.y1 && f.y < H.y0;
      if (!inHall && !inOld && !inArch) bad.push(f);
    }
    // flights do not cross maps: an egg in the air when the chef leaves lands at once
    EggFarmExt.catchEgg(Game, 40000, 4600, 0); Game.area = 'town'; T.step(1); const settled = EggFarmExt.st.fly.length;
    return { bad: bad.slice(0, 4), settled };
  });
  t.expect(origins.bad.length === 0, `no flying egg starts outside the hall (${JSON.stringify(origins.bad)})`);
  t.expectEq(origins.settled, 0, 'eggs in the air land at once when the chef changes maps');
  await t.ev(() => { Game.area = 'barn'; EggFarmExt.st.stack.length = 0; });

  // ---- the rooster crows at dawn; peeking into a coop shows every hen
  const crow = await t.ev(() => { AtmosphereExt.force({ phase: 'day' }); T.step(2); Game.floats.length = 0; AtmosphereExt.force({ phase: 'dawn' }); T.step(2); return { crow: EggFarmExt.st.crow, float: Game.floats.some((f) => f.text.includes('doodle')) }; });
  t.expect(crow.crow > 0 && crow.float, 'the rooster crows when dawn breaks');
  await t.ev(() => { T.tp(39750, 4580, 'barn'); T.step(10); });
  await t.shot('rooster');
  await t.ev(() => { AtmosphereExt.force({ phase: 'day' }); T.step(2); });
  const peek = await t.ev(() => { Game.s.eggfarm.hens[0] = 15; T.tp(CFG.EGGFARM.COOP_X[0] - 28, CFG.EGGFARM.CHICK_Y + 4, 'barn'); T.step(1); const l = T.label(); T.act(); T.step(10); Render.draw(Game); return { l, peek: !!EggFarmExt.st.peek, l2: T.label(), drawn: EggFarmExt.st.peekDrawn }; });
  t.expect(peek.l === '👀 Peek inside' && peek.peek && peek.l2 === '👀 Back out' && peek.drawn === 15, `peeking into a coop shows all 15 hens (${JSON.stringify(peek)})`);
  await t.shot('peek');
  t.expect(await t.ev(() => { T.steer(0, 1); T.step(5); T.unsteer(); return !EggFarmExt.st.peek; }), 'walking away closes the peek');

  // ---- a busy farm: six coops, the belt full of eggs, the loader and the trucks coming and going
  await t.ev(() => {
    const s = Game.s.eggfarm, E = EggFarmExt; s.coops = 6; s.lv.coop = 4; s.lv.feed = 6; s.lv.truck = 3; s.lv.box = 4; s.lv.hatch = 6; s.lv.belt = 1; s.lv.loader = 2; s.hens = [60, 60, 52, 40, 31, 18]; s.type = 2; E.st.obs = E.st.obsCar = null; E.syncTrucks(Game);
    T.tp(40260, 4700, 'barn'); T.step(60 * 20);
    for (let i = 0; i < 40; i++) E.st.stack.push({ t: 2, x: 0, land: 9 });
    T.tp(40400, 4660, 'barn'); T.step(30);
  });
  await t.shot('busy');
  const busy = await t.ev(() => ({ belt: EggFarmExt.st.belt.length, trucks: EggFarmExt.st.trucks.map((x) => x.state).join(','), loader: EggFarmExt.st.loader.state }));
  console.log('   busy farm: ' + JSON.stringify(busy));
  // the town map with a truck on its way (picture)
  await t.ev(() => { const st = EggFarmExt.st, tr = st.trucks[0]; st.stack.length = 0; tr.state = 'road'; tr.d = 70; tr.boxes = 6; tr.val = 6; T.tp(-760, 60, 'town'); Render.setZoom(1.3); T.step(1); window.__ut = EggFarmExt.updateTrucks; EggFarmExt.updateTrucks = () => {}; });
  await t.shot('town-truck-north');
  await t.ev(() => { const tr = EggFarmExt.st.trucks[0]; tr.d = 200; tr.angle = 0; EggFarmExt.updateTrucks = window.__ut; T.step(1); EggFarmExt.updateTrucks = () => {}; });
  await t.shot('town-truck-road');
  await t.ev(() => { EggFarmExt.updateTrucks = window.__ut; Render.setZoom(1); });

  // ---- offline catch-up (the shared Shop helpers)
  const away = await t.ev(() => {
    const s = Game.s.eggfarm; s.rate = 4; s.bank = 0; s.hens = [10, 0, 0, 0, 0, 0]; s.trays.fill(0); Game.s.savedAt = Date.now() - 3600 * 1000;
    const amt = EggFarmExt.away(Game, Shop.awaySeconds(Game)); Game.s.savedAt = Date.now();
    return { amt, bank: s.bank, hens: EggFarmExt.hens(s), msg: EggFarmExt.st.awayMsg, trays: s.trays[0] };
  });
  t.expect(away.amt === 7200 && away.bank === 7200 && away.hens > 10 && /away/.test(away.msg || ''), `with the belt and a loader the farm kept working while the game was closed (${JSON.stringify(away)})`);
  const awayHand = await t.ev(() => {
    const s = Game.s.eggfarm; s.lv.loader = 0; s.rate = 4; s.bank = 0; s.trays.fill(0); s.lv.hatch = 0;
    const amt = EggFarmExt.away(Game, 3600); const r = { amt, bank: s.bank, trays: s.trays.slice(0, 2), msg: EggFarmExt.st.awayMsg }; s.lv.loader = 2; s.lv.hatch = 6; return r;
  });
  t.expect(awayHand.amt === 0 && awayHand.trays[0] === K.TRAY.cap && /laid/.test(awayHand.msg || ''), `without a loader nothing ships while away, but the trays fill up (${JSON.stringify(awayHand)})`);
  t.expectEq(await t.ev(() => EggFarmExt.away(Game, 10)), 0, 'nothing for a few seconds away');
  // saved and loaded: the farm and the carried eggs come back
  await t.ev(() => { const st = EggFarmExt.st; st.stack.length = 0; for (let i = 0; i < 9; i++) st.stack.push({ t: 1, x: 0, land: 9 }); T.tp(40300, 4700, 'barn'); T.step(1); Game.save(); });
  await t.reload();
  await quiet();
  const loaded = await t.ev(() => ({ coops: Game.s.eggfarm.coops, stack: EggFarmExt.st.stack.length, area: Game.area, free: BarnExt.free(Game.player.x, Game.player.y), belt: EggFarmExt.beltOn(Game.s.eggfarm), loader: !!EggFarmExt.st.loader || Game.s.eggfarm.lv.loader }));
  t.expect(loaded.coops === 6 && loaded.stack === 9 && loaded.area === 'barn' && loaded.free && loaded.belt && loaded.loader, `saved and loaded (${JSON.stringify(loaded)})`);
  // an old save (before the egg chain): it had trucks and a running farm; it keeps its trucks and gets the belt and a
  // loader, so nothing that worked stops working
  const migrated = await t.ev(() => {
    Game.save(); Game.save = () => {}; const data = JSON.parse(localStorage.getItem(CFG.SAVE_KEY));
    data.eggfarm = { seen: true, coops: 3, hens: [20, 20, 5, 0, 0, 0], lv: { hatch: 2, coop: 0, feed: 1, box: 1, truck: 2, fancy: 1 }, type: 0, hopper: 12, box: 2, boxEggVal: 2, boxes: 3, boxVal: 27, bank: 0, transit: 0, rate: 3, stack: [0, 0], hatched: 45, laid: 300, shipped: 40, earned: 260 };
    localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(data)); return true;
  });
  await t.reload();
  await quiet();
  const mig = await t.ev(() => { const s = Game.s.eggfarm; return { ver: s.ver, belt: s.lv.belt, loader: s.lv.loader, truck: s.lv.truck, trucks: EggFarmExt.st.trucks.length, hopperVal: s.hopperVal, trays: s.trays.length, boxes: s.boxes, on: EggFarmExt.beltOn(s) }; });
  t.expect(migrated && mig.ver === 2 && mig.belt === 1 && mig.loader === 1 && mig.truck === 2 && mig.trucks === 3 && mig.on && mig.hopperVal > 0 && mig.hopperVal <= 12 && mig.boxes >= 3, `an old save keeps its trucks and gets a free Egg Belt and Loader (${JSON.stringify(mig)})`);
  await t.ev(() => { window.__eggFrom = []; const orig = EggFarmExt.catchEgg; EggFarmExt.catchEgg = function (g, x, y, type, delay) { window.__eggFrom.push({ x, y, area: g.area }); return orig.call(this, g, x, y, type, delay); }; EggFarmExt.ready(Game).luckyT = 1e9; });

  // ---- rescues: pushed into a coop, a wall or the packer, back under the archway
  for (const [x, y] of [[K.COOP_X[2], 4450], [K.HALL.x1 + 8, 4600], [K.PACKER.x0 + 30, 4740], [K.BAYS[0].x, 4470]]) {
    const r = await t.ev(([x, y]) => { T.tp(40300, 4700, 'barn'); Game.player.x = x; Game.player.y = y; T.step(2); const M = CFG.EGGFARM.ARCH_MAT; return { d: Math.hypot(Game.player.x - M.x, Game.player.y - M.y), free: BarnExt.free(Game.player.x, Game.player.y) }; }, [x, y]);
    t.expect(r.d < 2 && r.free, `rescued from ${x},${y} onto the archway mat`);
  }
  // the chef cannot walk out of the north doors (only a truck can)
  const doorWalk = await t.ev(() => { const B = CFG.EGGFARM.BAYS[1]; T.tp(B.x, 4560, 'barn'); EggFarmExt.st.spare.x = 40000; T.steer(0, -1); T.step(120); T.unsteer(); const y = Game.player.y; EggFarmExt.parkSpare(); return { y, area: Game.area }; });
  t.expect(doorWalk.area === 'barn' && doorWalk.y > K.HALL.y0, `the chef stays inside at the north doors (${JSON.stringify(doorWalk)})`);
  // a stuck check over the whole hall: from every free spot the chef can walk away
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

  // ---- Take-me-home from the hall, mid-peek and mid-pack, with the spare truck out on the farm mid-delivery
  const home = await t.ev(() => {
    const st = EggFarmExt.st, s = Game.s.eggfarm; for (let i = 0; i < 10; i++) st.stack.push({ t: 0, x: 0, land: 9 });
    st.spare.boxes = 2; st.spare.val = 12; st.spare.where = 'town'; st.deliver = { t: 0, k: 0, n: 2, val: 12 };
    T.tp(CFG.EGGFARM.PACK.x, CFG.EGGFARM.PACK.y, 'barn'); T.act(); T.step(5); st.peek = { c: 0, t: 5 };
    const c0 = Game.s.cash; Game.goHome(); T.step(2);
    return { area: Game.area, peek: st.peek, packing: st.packing, deliver: st.deliver, fly: st.fly.length, where: st.spare.where, paid: Game.s.cash - c0, d: Math.hypot(Game.player.x - CFG.PLAYER_START.x, Game.player.y - CFG.PLAYER_START.y), hint: EggFarmExt.hint(Game) };
  });
  t.expect(home.area === 'town' && !home.peek && !home.packing && !home.deliver && home.fly === 0 && home.where === 'barn' && home.paid >= 12 && home.d < 2 && home.hint === undefined, `home from the egg farm (${JSON.stringify(home)})`);

  // ---- phone-size pictures
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Render.resize(); const st = EggFarmExt.st, s = Game.s.eggfarm; st.stack.length = 0; T.tp(39650, 4580, 'barn'); T.step(20); });
  await t.shot('phone-hatcher');
  await t.ev(() => { const st = EggFarmExt.st; for (let i = 0; i < 110; i++) st.stack.push({ t: i % 5, x: 0, land: 9 }); T.tp(40000, 4760, 'barn'); T.step(30); T.steer(1, 0); T.step(16); });
  await t.shot('phone-tower');
  await t.ev(() => { T.unsteer(); const P = CFG.EGGFARM.PACK; T.tp(P.x, P.y, 'barn'); T.step(2); T.act(); T.step(30); });
  await t.shot('phone-packing');
  await t.ev(() => { T.step(300); const C = CFG.EGGFARM.CORN.spot; T.tp(C.x, C.y, 'barn'); T.act(); T.step(60); });
  await t.shot('phone-corn');
  await t.ev(() => { T.tp(CFG.EGGFARM.COOP_X[1] - 28, CFG.EGGFARM.CHICK_Y + 4, 'barn'); T.step(1); T.act(); T.step(10); });
  await t.shot('phone-peek');
  await t.ev(() => { EggFarmExt.st.peek = null; T.tp(-390, 0, 'town'); T.step(2); });
  await t.shot('phone-market');
  const origins2 = await t.ev(() => window.__eggFrom.filter((f) => f.area === 'barn' && (f.x < CFG.EGGFARM.HALL.x0 - 50 || f.x > CFG.EGGFARM.HALL.x1 || f.y > CFG.EGGFARM.HALL.y1)).length);
  t.expectEq(origins2, 0, 'still no egg flying in from outside');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { Render.resize(); EggFarmExt.st.peek = null; T.tp(540, 430, 'town'); T.step(1); });
};

