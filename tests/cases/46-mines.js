'use strict';
// The Pizza Mine (js/mines.js): the shaft in Construction Town's hillside is on free ground you can walk to from the
// streets; the miner hands over a pickaxe; going in; floor 1 has rocks, slimes and one hidden ladder, and every rock can
// be reached (flood fill, on every floor); mining a rock (whacks, bits, the ore float, the count saved); breaking rocks
// until the ladder shows and going down; a floor builds the same each time; a slime bump costs a heart and bounces the
// chef; two bonks pop a slime into goo; no hearts: a rest, waking at the entrance with every rock kept; floor 5 saves
// the elevator and the elevator panel outside goes there; themes at 6/11/16; the chest on floor 20; selling to the
// miner; rescues; Take-me-home from floor 3; a reload keeps the deepest floor, the elevators and the ores.
module.exports = async (t) => {
  // until the coordinator wires js/mines.js into index.html, serve the page with it added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/mines.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/mines.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();
  const helpers = () => {
    // test helpers for the mine: tiles, a flood fill over a floor's grid, standing next to a rock, freezing slimes
    window.MT = {
      M: CFG.MINES,
      f() { return MinesExt.st.floor; },
      tileOf(x, y) { const M = CFG.MINES; return { c: Math.floor((x - M.WORLD.x0) / M.TILE), r: Math.floor((y - M.WORLD.y0) / M.TILE) }; },
      // tiles the chef can reach from the arrival spot, worked out from the real obstacles (a tile is open when the
      // chef can stand on its centre), not from the generator's own grid
      reach() {
        const M = CFG.MINES, f = MT.f(), obs = Game.obstacles(), C = M.COLS, R = M.ROWS, seen = new Set();
        const open = (c, r) => { const p = MinesExt.tileCenter(c, r); return c > 0 && r > 0 && c < C - 1 && r < R - 1 && !obs.some((o) => Game.hitRect(p.x, p.y, 12, o)); };
        const a = MT.tileOf(f.arrival.x, f.arrival.y), q = [[a.c, a.r]]; seen.add(a.c + ',' + a.r);
        while (q.length) { const [c, r] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (c + dx) + ',' + (r + dy); if (!seen.has(k) && open(c + dx, r + dy)) { seen.add(k); q.push([c + dx, r + dy]); } } }
        return seen;
      },
      spotBy(k, seen) {
        seen = seen || MT.reach();
        const t0 = MT.tileOf(k.x, k.y);
        for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (seen.has((t0.c + dx) + ',' + (t0.r + dy))) return MinesExt.tileCenter(t0.c + dx, t0.r + dy);
        return null;
      },
      freeze() { for (const s of MT.f().slimes) { s.stun = 9999; s.hop = null; s.z = 0; } },
      breakRock(k) {
        const s = MT.spotBy(k); if (!s) return false;
        T.tp(s.x, s.y, 'mines'); MT.freeze();
        for (let i = 0; i < 4 && MT.f().rocks.concat(MT.f().crates).includes(k); i++) { MinesExt.whack(Game, k); T.step(1); }
        return !MT.f().rocks.includes(k);
      },
      // break the nearest reachable rocks until the ladder shows (returns how many it took)
      findLadder() {
        let n = 0;
        while (!MT.f().ladder && n < 40) {
          const seen = MT.reach(), a = MT.f().arrival;
          const k = MT.f().rocks.filter((r) => MT.spotBy(r, seen)).sort((x, y) => Math.hypot(x.x - a.x, x.y - a.y) - Math.hypot(y.x - a.x, y.y - a.y))[0];
          if (!k || !MT.breakRock(k)) return -1;
          n++;
        }
        return MT.f().ladder ? n : -1;
      },
      floats() { return Game.floats.map((x) => x.text); },
    };
  };
  await t.ev(helpers);

  // ---- registered: the map in its free rectangle, answering before the City and the site
  const reg = await t.ev(() => ({
    ok: typeof MinesExt !== 'undefined' && Render.ext.includes(MinesExt),
    world: CFG.AREAS.mines && CFG.AREAS.mines.WORLD,
    order: Game.ext.indexOf(MinesExt) < Game.ext.indexOf(CityExt) && Game.ext.indexOf(MinesExt) < Game.ext.indexOf(SiteTownExt),
    save: Game.s.mines && Game.s.mines.deepest === 0 && Game.s.mines.elevators.length === 0,
  }));
  t.expect(reg.ok, 'the mine extension is registered');
  t.expectEq(JSON.stringify(reg.world), JSON.stringify({ x0: 3500, y0: 5000, x1: 4700, y1: 5800 }), 'the mine map sits in its free rectangle');
  t.expect(reg.order, 'the mine answers before Construction Town and the City');
  t.expect(reg.save, 'a fresh save has no floors and no elevators yet');

  // ---- the entrance: free ground, clear of the site block, reachable on foot from the station path
  const ent = await t.ev(() => {
    const M = CFG.MINES; T.tp(3300, 60, 'site');
    const obs = Game.obstacles(), hit = (x, y) => obs.some((o) => Game.hitRect(x, y, 12, o));
    const spots = { door: M.DOOR, miner: M.MINER_SPOT, elev: M.ELEV };
    const solid = Object.keys(spots).filter((k) => hit(spots[k].x, spots[k].y));
    // nothing of the hill lands in the site block (2600..3984 × -170..900) or on Construction Town's buildings
    const B = M.HILL_BOX, inBlock = B.x < 3984 && B.y < 900;
    const others = SiteTownExt.st.siteObs.concat(Game.siteObstacles()).filter((o) => o.x < B.x + B.w && o.x + o.w > B.x && o.y < B.y + B.h && o.y + o.h > B.y);
    // flood fill on a 10 px grid from the station path on the gravel road to the mine door
    const W = CFG.SITE.WORLD, step = 10, S = CFG.SITE.STATION, from = { x: S.stopX + S.boardDx, y: 80 };
    const key = (x, y) => x + ',' + y, seen = new Set([key(from.x, from.y)]), q = [[from.x, from.y]];
    let found = false;
    while (q.length && !found) {
      const [x, y] = q.shift();
      if (Math.hypot(x - M.DOOR.x, y - M.DOOR.y) < 12) { found = true; break; }
      for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (seen.has(k) || nx < W.x0 + 16 || nx > W.x1 - 16 || ny < W.y0 + 16 || ny > W.y1 - 16 || hit(nx, ny)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return { solid, inBlock, others: others.length, found, far: MinesExt.hint(Game) };
  });
  t.expectEq(ent.solid.length, 0, `the door, the miner and the elevator stand on free ground (${ent.solid})`);
  t.expect(!ent.inBlock && ent.others === 0, 'the hillside overlaps neither the site block nor any building');
  t.expect(ent.found, 'the mine door can be walked to from the station path');
  t.expectEq(ent.far, undefined, 'no mine hint far away on the site');
  // walk up to it from the road
  const walkUp = await t.ev(() => {
    const M = CFG.MINES; T.tp(M.DOOR.x, 90, 'site'); T.steer(0, -1); T.step(40); T.unsteer(); T.step(1);
    const p = Game.player; return { x: p.x, y: p.y, label: T.label(), hint: T.hint(), pick: Game.s.mines.pickaxe, say: MinesExt.st.minerSay && MinesExt.st.minerSay.text };
  });
  t.expect(Math.abs(walkUp.y - 16) < 3, `walked up from the road to the foot of the hill (${Math.round(walkUp.x)},${Math.round(walkUp.y)})`);
  t.expectEq(walkUp.label, '⛏️ Go into the mine', 'the big button at the mine door');
  t.expectEq(walkUp.hint, 'Go into the mine! ⛏️', 'the hint at the mine door');
  t.expect(walkUp.pick, 'the miner gave the chef a pickaxe on the way');
  t.expectEq(walkUp.say, 'Here\'s a pickaxe! ⛏️', 'the miner says so');
  const near = await t.ev(() => { const M = CFG.MINES; T.tp(M.DOOR.x + 40, M.DOOR.y + 40, 'site'); const h = MinesExt.hint(Game); return { text: h && h.text, door: !!(h && h.target && h.target.x === M.DOOR.x) }; });
  t.expect(near.text === 'Go into the mine! ⛏️' && near.door, 'a few steps away the hint points at the door');
  const noSell = await t.ev(() => { const M = CFG.MINES; T.tp(M.MINER_SPOT.x, M.MINER_SPOT.y, 'site'); return T.label(); });
  t.expect(noSell !== '💰 Sell your rocks', 'nothing to sell yet');
  await t.ev(() => { const M = CFG.MINES; T.tp(M.DOOR.x + 34, M.DOOR.y + 34, 'site'); Render.setZoom(1.4); Game.cameraSnap = true; T.step(2); });
  await t.shot('entrance');
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; });

  // ---- go in: floor 1
  const in1 = await t.ev(() => {
    const M = CFG.MINES; T.tp(M.DOOR.x, M.DOOR.y, 'site'); T.act();
    const f = MT.f(), p = Game.player;
    return {
      area: Game.area, n: f && f.n, at: Math.hypot(p.x - f.arrival.x, p.y - f.arrival.y), inWorld: p.x > 3500 && p.x < 4700 && p.y > 5000 && p.y < 5800,
      toast: T.toasts.includes('⛏️ The Pizza Mine!'), hint: Game.hint, label: T.label(), cur: Game.s.mines.cur, deepest: Game.s.mines.deepest,
      rocks: f.rocks.length, slimes: f.slimes.length, crates: f.crates.length, ladderRocks: f.rocks.filter((k) => k.ladder).length, ladder: f.ladder,
      up: Math.hypot(f.up.x - f.arrival.x, f.up.y - f.arrival.y),
    };
  });
  t.expectEq(in1.area, 'mines', 'inside the mine');
  t.expect(in1.n === 1 && in1.cur === 1 && in1.deepest === 1, 'on floor 1 (saved as the deepest)');
  t.expect(in1.at < 1 && in1.inWorld, 'standing on the arrival spot inside the map');
  t.expect(in1.toast, 'the one important toast: ⛏️ The Pizza Mine!');
  t.expect(in1.hint && in1.hint.text === 'Mine the rocks to find the ladder! 🪜' && in1.hint.target, 'hint: mine the rocks (pointing at a rock)');
  t.expectEq(in1.label, null, 'no button right on the arrival spot (a mashed button does not climb straight out)');
  t.expect(in1.rocks >= 15 && in1.rocks <= 30, `15-30 rocks (${in1.rocks})`);
  t.expect(in1.slimes >= 2 && in1.slimes <= 5, `2-5 slimes (${in1.slimes})`);
  t.expectEq(in1.crates, 2, 'two crates');
  t.expect(in1.ladderRocks === 1 && !in1.ladder, 'one rock hides the ladder, not found yet');
  t.expect(in1.up > 40, 'the way out is up by the back wall, apart from the arrival spot');
  // every rock (and crate) on floor 1 touches a tile the chef can walk to; and on every floor through the generator
  const reach = await t.ev(() => {
    const seen = MT.reach(), f = MT.f();
    const bad = f.rocks.concat(f.crates).filter((k) => !MT.spotBy(k, seen)).map((k) => [k.c, k.r]);
    const slimesOut = f.slimes.filter((s) => !seen.has(MT.tileOf(s.x, s.y).c + ',' + MT.tileOf(s.x, s.y).r)).length;
    const floors = [];
    for (let n = 1; n <= 20; n++) {
      const g = MinesExt.generate(n), C = CFG.MINES.COLS, at = (c, r) => r * C + c, a = MT.tileOf(g.arrival.x, g.arrival.y);
      const s = new Set([at(a.c, a.r)]), q = [[a.c, a.r]];
      while (q.length) { const [c, r] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = at(c + dx, r + dy); if (!s.has(k) && g.grid[k] === 0) { s.add(k); q.push([c + dx, r + dy]); } } }
      const ok = (k) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => s.has(at(k.c + dx, k.r + dy)));
      floors.push({ n, rocks: g.rocks.length, slimes: g.slimes.length, ladders: g.rocks.filter((k) => k.ladder).length, unreachable: g.rocks.concat(g.crates).filter((k) => !ok(k)).length + (g.chest && !ok(g.chest) ? 1 : 0), chest: !!g.chest, elevator: !!g.elevator });
    }
    return { bad, slimesOut, floors };
  });
  t.expectEq(reach.bad.length, 0, `every rock on floor 1 can be reached: ${JSON.stringify(reach.bad)}`);
  t.expectEq(reach.slimesOut, 0, 'every slime starts on reachable floor');
  for (const fl of reach.floors) {
    t.expect(fl.rocks >= 15 && fl.rocks <= 30 && fl.slimes >= 2 && fl.slimes <= 5 && fl.unreachable === 0, `floor ${fl.n}: ${fl.rocks} rocks, ${fl.slimes} slimes, all reachable`);
    t.expectEq(fl.ladders, fl.n < 20 ? 1 : 0, `floor ${fl.n}: ladder rocks`);
    t.expectEq(fl.elevator, fl.n % 5 === 0, `floor ${fl.n}: elevator`);
    t.expectEq(fl.chest, fl.n === 20, `floor ${fl.n}: chest`);
  }
  // a floor builds the same each time
  const same = await t.ev(() => {
    const sig = (g) => JSON.stringify([g.arrival, g.rocks.map((k) => [k.c, k.r, k.ore, k.hp, k.ladder]), g.crates.map((k) => [k.c, k.r, k.snack]), g.slimes.map((s) => [s.c, s.r]), g.grid.join('')]);
    const a = sig(MinesExt.generate(7)), b = sig(MinesExt.generate(7)), c = sig(MinesExt.generate(8));
    return { a: a === b, diff: a !== c, f1: sig(MT.f()) === sig(MinesExt.generate(1)), sig1: sig(MT.f()) };
  });
  t.expect(same.a && same.f1, 'the same floor number builds the same floor');
  t.expect(same.diff, 'different floors look different');

  // ---- mining a rock with the big button: whacks, bits, the ore float, the count saved
  const mine = await t.ev(() => {
    const f = MT.f(), seen = MT.reach();
    MT.freeze();
    let k = null;
    for (const r of f.rocks.filter((x) => x.ore && !x.ladder && x.hp >= 2)) { const s = MT.spotBy(r, seen); if (!s) continue; T.tp(s.x, s.y, 'mines'); if (MinesExt.nearestBreakable(Game) === r && !MinesExt.nearestSlime(Game, 90)) { k = r; break; } }
    if (!k) return { none: true };
    const label = T.label(), hp0 = k.hp, ore = k.ore;
    T.act();
    const after1 = { hp: k.hp, bits: MinesExt.st.bits.length, act: !!MinesExt.st.act, still: f.rocks.includes(k) };
    return { label, hp0, ore, after1, k: { x: k.x, y: k.y } };
  });
  t.expect(!mine.none, 'found a rock with ore next to open floor');
  t.expectEq(mine.label, '⛏️ Mine', 'the big button says Mine next to a rock');
  t.expect(mine.after1.hp === mine.hp0 - 1 && mine.after1.still, 'one whack: the rock cracks but stays');
  t.expect(mine.after1.bits > 0 && mine.after1.act, 'bits fly and the chef hops');
  await t.ev(() => { Render.setZoom(1.5); Game.cameraSnap = true; T.act(); });
  await t.shot('mining');
  const mined = await t.ev((ore) => {
    const f = MT.f();
    for (let i = 0; i < 4 && T.label() === '⛏️ Mine' && MinesExt.nearestBreakable(Game) && MinesExt.nearestBreakable(Game).ore === ore; i++) { T.step(20); T.act(); }
    return { ores: Game.s.mines.ores[ore], found: Game.s.mines.found[ore], floats: MT.floats(), broken: f.broken, saved: JSON.parse(JSON.stringify(Game.s.mines.ores)) };
  }, mine.ore);
  t.expect(mined.broken >= 1, 'the rock broke');
  t.expect(mined.ores >= 1 && mined.found, `the ${mine.ore} is counted (${mined.ores})`);
  const icons = { copper: '🟤', iron: '⚪', gold: '🟡', gem: '💎' };
  t.expect(mined.floats.includes(`+1 ${icons[mine.ore]} ${mine.ore}`), `the ore float (+1 ${icons[mine.ore]} ${mine.ore}) in ${JSON.stringify(mined.floats)}`);
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; });

  // ---- break rocks until the ladder shows, then go down to floor 2
  const ladder = await t.ev(() => {
    const n = MT.findLadder(), f = MT.f(); T.step(2);
    const hint = Game.hint;
    T.tp(f.ladder.x, f.ladder.y, 'mines'); MT.freeze();
    const label = T.label(); T.act();
    const g = MT.f();
    return { n, hint: hint && hint.text, target: hint && hint.target && hint.target.x === f.ladder.x, label, floor: g.n, deepest: Game.s.mines.deepest, sword: Game.s.mines.sword, floats: MT.floats(), rocks: Game.s.mines.rocks };
  });
  t.expect(ladder.n > 0, `the ladder showed after ${ladder.n} rocks`);
  t.expect(ladder.n <= 7, 'never more than seven rocks before the ladder shows');
  t.expectEq(ladder.hint, 'Go down the ladder! 🪜', 'hint: go down the ladder');
  t.expect(ladder.target, 'the hint points at the ladder');
  t.expectEq(ladder.label, '🪜 Go down', 'the big button on the ladder');
  t.expect(ladder.floor === 2 && ladder.deepest === 2, 'down on floor 2');
  t.expect(ladder.sword && ladder.floats.includes('A pizza sword! 🍕'), 'a pizza sword for going below floor 1');
  // floor 1 again: built the same as before
  t.expectEq(await t.ev(() => { MinesExt.enterFloor(Game, 1); const g = MT.f(); return JSON.stringify([g.arrival, g.rocks.map((k) => [k.c, k.r, k.ore, k.hp, k.ladder]), g.crates.map((k) => [k.c, k.r, k.snack]), g.slimes.map((s) => [s.c, s.r]), g.grid.join('')]); }), same.sig1, 'going back to floor 1 brings back the same floor');

  // ---- a slime bump: a heart gone, the chef bounces back
  const bump = await t.ev(() => {
    MinesExt.enterFloor(Game, 2); T.step(60);
    const f = MT.f(), p = Game.player, st = MinesExt.st, s = f.slimes[0];
    for (const o of f.slimes) if (o !== s) { o.stun = 9999; o.hop = null; }
    const x0 = p.x, y0 = p.y;
    s.hop = null; s.z = 0; s.stun = 0; s.wait = 99; s.x = p.x + 14; s.y = p.y; st.invuln = 0;
    T.step(1);
    const hearts = st.hearts, floats = MT.floats();
    T.step(20);
    const moved = Math.hypot(p.x - x0, p.y - y0), free = !Game.obstacles().some((o) => Game.hitRect(p.x, p.y, 12, o));
    return { hearts, floats, moved, free, invuln: st.invuln > 0, slimeStun: s.stun > 0 };
  });
  t.expectEq(bump.hearts, 4, 'a slime bump costs one heart');
  t.expect(bump.floats.includes('Oof! 💥'), 'Oof! 💥');
  t.expect(bump.moved > 20 && bump.free, `the chef bounced back ${Math.round(bump.moved)} px onto free floor`);
  t.expect(bump.invuln && bump.slimeStun, 'a short safe time after a bump');
  await t.shot('hearts');

  // ---- bonk a slime twice: it pops into goo
  const bonk = await t.ev(() => {
    const f = MT.f(), p = Game.player, st = MinesExt.st, s = f.slimes[0];
    T.step(120);
    MT.freeze(); T.tp(f.arrival.x, f.arrival.y, 'mines');
    s.hop = null; s.z = 0; s.stun = 0; s.wait = 99; s.x = p.x + 48; s.y = p.y; st.invuln = 0; T.step(1);
    const label = T.label(), hint = T.hint(), goo0 = Game.s.mines.goo;
    T.act();
    return { label, hint, hp: s.hp, still: f.slimes.includes(s), floats: MT.floats(), goo0, act: MinesExt.st.act && MinesExt.st.act.kind };
  });
  t.expectEq(bonk.label, '🗡️ Bonk', 'the big button says Bonk next to a slime');
  t.expectEq(bonk.hint, 'Bonk the slime! 🗡️', 'hint: bonk the slime');
  t.expect(bonk.hp === 1 && bonk.still && bonk.floats.includes('Bonk!'), 'one bonk: the slime is dizzy');
  t.expectEq(bonk.act, 'sword', 'bonking with the pizza sword');
  await t.ev(() => { Render.setZoom(1.6); Game.cameraSnap = true; });
  await t.shot('bonk');
  const pop = await t.ev((goo0) => {
    const f = MT.f(), n0 = f.slimes.length, dbg = { label: T.label(), sl: f.slimes.map((s) => [Math.round(s.x - Game.player.x), Math.round(s.y - Game.player.y), s.hp]) }; T.act();
    return { dbg, gone: f.slimes.length === n0 - 1, goo: Game.s.mines.goo - goo0, floats: MT.floats(), splats: MinesExt.st.splats.length, found: Game.s.mines.found.goo };
  }, bonk.goo0);
  t.expect(pop.gone && pop.goo === 1 && pop.found, `the second bonk pops the slime: +1 goo ${JSON.stringify(pop)}`);
  t.expect(pop.floats.includes('Boing!') && pop.floats.includes('+1 🟢 goo'), 'Boing! and +1 🟢 goo');
  t.expect(pop.splats > 0, 'a goo puddle');
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; });

  // ---- a snack from a crate fills a heart back
  const snack = await t.ev(() => {
    const f = MT.f(), st = MinesExt.st; st.hearts = 3;
    const c = f.crates.find((k) => k.snack && MT.spotBy(k));
    if (!c) return { none: true };
    MT.breakRock(c);
    const sn = f.snacks.length; T.step(30);
    T.tp(c.x, c.y, 'mines'); T.step(3);
    return { sn, left: f.snacks.length, hearts: st.hearts, floats: MT.floats() };
  });
  t.expect(snack.none || (snack.sn === 1 && snack.left === 0 && snack.hearts === 4 && snack.floats.includes('Yum! ❤️')), `a pizza snack from a crate fills a heart (${JSON.stringify(snack)})`);

  // ---- no hearts: a rest, then the chef wakes at the entrance with everything kept
  const sleepy = await t.ev(() => {
    const st = MinesExt.st, s = Game.s.mines, f = MT.f(), p = Game.player;
    s.ores.gold += 2; const loot = JSON.stringify([s.ores, s.goo]);
    MT.freeze(); T.tp(f.arrival.x, f.arrival.y, 'mines');
    st.hearts = 1; st.invuln = 0; const sl = f.slimes[0]; sl.stun = 0; sl.hop = null; sl.z = 0; sl.wait = 99; sl.x = p.x + 10; sl.y = p.y;
    T.step(1);
    const asleep = !!st.sleep, hint = T.hint(), label = T.label();
    T.step(30);
    return { asleep, hint, label, loot };
  });
  t.expect(sleepy.asleep, 'the last heart: the chef gets sleepy');
  t.expectEq(sleepy.hint, 'Time for a rest! 😴', 'hint: time for a rest');
  t.expectEq(sleepy.label, null, 'no button while resting');
  await t.shot('sleepy');
  const woke = await t.ev(() => {
    const st = MinesExt.st, s = Game.s.mines, p = Game.player, M = CFG.MINES;
    const n = T.until(() => !st.sleep, 400); T.step(2);
    return { n, area: Game.area, d: Math.hypot(p.x - M.DOOR.x, p.y - M.DOOR.y), hearts: st.hearts, floor: st.floor, loot: JSON.stringify([s.ores, s.goo]), cur: s.cur, floats: MT.floats() };
  });
  t.expect(woke.n >= 0 && woke.area === 'site' && woke.d < 2, `woke up at the mine entrance (${woke.area}, ${Math.round(woke.d)} px)`);
  t.expect(woke.hearts === 5 && !woke.floor && woke.cur === 0, 'full hearts, the floor forgotten');
  t.expectEq(woke.loot, sleepy.loot, 'every rock kept');
  t.expect(woke.floats.includes('Good morning! ☀️'), 'Good morning! ☀️');

  // ---- floor 5: the elevator is saved; the way out; the elevator outside goes back to 5
  const five = await t.ev(() => {
    MinesExt.enterFloor(Game, 4);
    const n = MT.findLadder(), f = MT.f(); T.tp(f.ladder.x, f.ladder.y, 'mines'); MT.freeze(); T.act();
    const g = MT.f(), s = Game.s.mines;
    const out = { n, floor: g.n, elevators: s.elevators.slice(), elevator: !!g.elevator, floats: MT.floats() };
    T.tp(g.elevator.x, g.elevator.y, 'mines'); MT.freeze(); out.elLabel = T.label();
    T.tp(g.up.x, g.up.y, 'mines'); MT.freeze(); out.upLabel = T.label();
    MinesExt.st.hearts = 2; T.act();
    const M = CFG.MINES, p = Game.player;
    out.after = { area: Game.area, d: Math.hypot(p.x - M.DOOR.x, p.y - M.DOOR.y), hearts: MinesExt.st.hearts, cur: s.cur };
    return out;
  });
  t.expect(five.n > 0 && five.floor === 5, 'down the ladder from floor 4 to floor 5');
  t.expect(five.elevators.includes(5) && five.elevator && five.floats.includes('🛗 Elevator!'), 'floor 5 has an elevator, and it is saved');
  t.expectEq(five.elLabel, '🛗 Elevator', 'the big button at the elevator inside');
  t.expectEq(five.upLabel, '☀️ Go outside', 'the big button at the ladder up');
  t.expect(five.after.area === 'site' && five.after.d < 2 && five.after.hearts === 5 && five.after.cur === 0, 'back outside at the door, hearts refilled');
  const panel = await t.ev(() => {
    const M = CFG.MINES; T.tp(M.ELEV.x, M.ELEV.y, 'site');
    const label = T.label(), hint = T.hint(); T.act();
    const el = document.getElementById('mines-panel');
    return { label, hint, shown: !!el && !el.classList.contains('mp-hidden'), btns: el ? [...el.querySelectorAll('button')].map((b) => b.dataset.f) : [] };
  });
  t.expectEq(panel.label, '🛗 Elevator', 'the elevator button outside');
  t.expectEq(panel.hint, 'Ride the elevator! 🛗', 'the elevator hint outside');
  t.expect(panel.shown, 'the elevator panel opens');
  t.expectEq(panel.btns.join(','), '1,5,x', 'floors 1 and 5, and a close button');
  await t.ev(() => { Render.setZoom(1.4); Game.cameraSnap = true; });
  await t.shot('elevator');
  await t.page.click('#mines-panel button[data-f="5"]');
  const rode = await t.ev(() => { T.step(2); const el = document.getElementById('mines-panel'); return { area: Game.area, n: MT.f() && MT.f().n, hidden: el.classList.contains('mp-hidden') }; });
  t.expect(rode.area === 'mines' && rode.n === 5 && rode.hidden, 'the elevator took the chef to floor 5 and the panel closed');
  // the elevator inside offers the way to the top too; ✕ closes; walking away closes it
  const inPanel = await t.ev(() => {
    const f = MT.f(); T.tp(f.elevator.x, f.elevator.y, 'mines'); MT.freeze(); T.act();
    const el = document.getElementById('mines-panel'), btns = [...el.querySelectorAll('button')].map((b) => b.dataset.f), shown = !el.classList.contains('mp-hidden');
    T.tp(f.elevator.x, f.elevator.y + 100, 'mines'); T.step(1);
    return { btns, shown, closed: el.classList.contains('mp-hidden') };
  });
  t.expect(inPanel.shown && inPanel.btns.join(',') === '0,1,5,x', `inside, the panel has the top, floors 1 and 5 (${inPanel.btns})`);
  t.expect(inPanel.closed, 'walking away closes the panel');
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; });

  // ---- the themes change at floors 6, 11 and 16
  const themes = await t.ev(() => [1, 5, 6, 10, 11, 15, 16, 20].map((n) => { MinesExt.enterFloor(Game, n); return MT.f().theme.key; }));
  t.expectEq(themes.join(','), 'earth,earth,ice,ice,crystal,crystal,pizza,pizza', 'themes by depth');
  for (const n of [1, 6, 11, 16]) {
    const fl = await t.ev((n) => { MinesExt.enterFloor(Game, n); T.step(2); return { floats: MT.floats(), key: MT.f().theme.key }; }, n);
    await t.shot('floor' + n);
    if (n > 1) t.expect(fl.floats.some((x) => /caves!/.test(x)), `floor ${n}: a hello for the new caves`);
  }

  // ---- floor 20: the treasure chest and the golden pizza
  const chest = await t.ev(() => {
    MinesExt.enterFloor(Game, 20); const f = MT.f(); f.slimes = []; T.step(1);
    const hint = Game.hint; T.tp(f.chest.spot.x, f.chest.spot.y, 'mines'); MT.freeze();
    const label = T.label(); T.act();
    return { hint: hint && hint.text, target: !!(hint && hint.target), label, open: f.chest.open, trophy: Game.s.mines.trophy, floats: MT.floats(), ladderRocks: f.rocks.filter((k) => k.ladder).length, after: T.hint() };
  });
  t.expect(chest.hint === 'Open the treasure chest! 🎁' && chest.target, 'hint: open the treasure chest');
  t.expectEq(chest.label, '🎁 Open the chest', 'the big button at the chest');
  t.expect(chest.open && chest.trophy && chest.floats.includes('🏆 The golden pizza!'), 'the golden pizza trophy, saved');
  t.expectEq(chest.ladderRocks, 0, 'no ladder below floor 20');
  await t.ev(() => { Render.setZoom(1.6); Game.cameraSnap = true; });
  await t.shot('chest');
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; });
  t.expect(await t.ev(() => { MinesExt.enterFloor(Game, 20); return MT.f().chest.open; }), 'the chest stays open on a later visit');

  // ---- sell the rocks to the miner
  const sell = await t.ev(() => {
    const s = Game.s.mines, M = CFG.MINES;
    MinesExt.leave(Game);
    s.ores = { copper: 3, iron: 2, gold: 1, gem: 1 }; s.goo = 2;   // 3 + 4 + 5 + 10 + 2 = 24
    T.tp(M.MINER_SPOT.x, M.MINER_SPOT.y, 'site');
    const label = T.label(), hint = T.hint(), cash0 = Game.s.cash; T.act();
    return { label, hint, got: Game.s.cash - cash0, ores: JSON.stringify(s.ores), goo: s.goo, floats: MT.floats(), say: MinesExt.st.minerSay && MinesExt.st.minerSay.text, after: T.label() };
  });
  t.expectEq(sell.label, '💰 Sell your rocks', 'the big button by the miner');
  t.expectEq(sell.hint, 'Sell your rocks to the miner! 💰', 'the hint by the miner');
  t.expectEq(sell.got, 24, 'copper $1, iron $2, gold $5, gem $10, goo $1');
  t.expect(sell.ores === JSON.stringify({ copper: 0, iron: 0, gold: 0, gem: 0 }) && sell.goo === 0, 'the pockets are empty');
  t.expect(sell.floats.includes('+$24 💰') && sell.say === 'Thank you! 💰', 'a big coin float and a thank you');
  t.expect(sell.after !== '💰 Sell your rocks', 'nothing more to sell');
  await t.ev(() => { Render.setZoom(1.6); Game.cameraSnap = true; T.step(2); });
  await t.shot('shelf');
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; });

  // ---- rescues: inside a rock goes back to the arrival spot; inside the hill goes to the door
  const rescue = await t.ev(() => {
    MinesExt.enterFloor(Game, 2); const f = MT.f(), k = f.rocks[3], p = Game.player;
    p.x = k.x; p.y = k.y; T.step(2);
    const inMine = Math.hypot(p.x - f.arrival.x, p.y - f.arrival.y);
    const M = CFG.MINES; MinesExt.leave(Game); p.x = M.HILL_BOX.x + 100; p.y = M.HILL_BOX.y + 60; T.step(2);
    return { inMine, hill: Math.hypot(p.x - M.DOOR.x, p.y - M.DOOR.y) };
  });
  t.expect(rescue.inMine < 1, 'stuck in a rock: back on the arrival spot');
  t.expect(rescue.hill < 1, 'stuck in the hill: back on the door mat');

  // ---- Take me home from floor 3
  const home = await t.ev(() => {
    MinesExt.enterFloor(Game, 3); MinesExt.st.hearts = 2; Game.goHome(); T.step(2);
    return { area: Game.area, floor: MinesExt.st.floor, cur: Game.s.mines.cur, hearts: MinesExt.st.hearts, hint: MinesExt.hint(Game) };
  });
  t.expect(home.area === 'town' && !home.floor && home.cur === 0 && home.hearts === 5, 'Take me home from floor 3: in town, the floor forgotten');
  t.expectEq(home.hint, undefined, 'no mine hint back in town');

  // ---- a reload keeps the deepest floor, the elevators, the ores and the trophy; inside, it starts the floor afresh
  const before = await t.ev(() => {
    const s = Game.s.mines; s.ores.copper = 4; s.ores.gem = 2; s.goo = 3;
    MinesExt.enterFloor(Game, 5); T.step(2); Game.save();
    return JSON.stringify({ deepest: s.deepest, elevators: s.elevators, ores: s.ores, goo: s.goo, trophy: s.trophy, sword: s.sword, pickaxe: s.pickaxe });
  });
  await t.reload();
  await t.ev(helpers);
  const after = await t.ev(() => {
    const s = Game.s.mines, f = MT.f(), p = Game.player;
    return { saved: JSON.stringify({ deepest: s.deepest, elevators: s.elevators, ores: s.ores, goo: s.goo, trophy: s.trophy, sword: s.sword, pickaxe: s.pickaxe }), area: Game.area, n: f && f.n, at: f && Math.hypot(p.x - f.arrival.x, p.y - f.arrival.y) };
  });
  t.expectEq(after.saved, before, 'the save keeps the deepest floor, the elevators, the ores and the trophy');
  t.expect(after.area === 'mines' && after.n === 5 && after.at < 1, `reloaded inside: floor 5 again, on its arrival spot (${JSON.stringify(after)})`);

  // ---- phone
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { Game.cameraSnap = true; T.step(2); });
  await t.shot('phone-floor');
  await t.ev(() => { const f = MT.f(); T.tp(f.elevator.x, f.elevator.y, 'mines'); MT.freeze(); T.act(); });
  await t.shot('phone-elevator');
  await t.ev(() => { MinesExt.closePanel(); MinesExt.enterFloor(Game, 20); const f = MT.f(); T.tp(f.chest.spot.x, f.chest.spot.y, 'mines'); MT.freeze(); T.step(2); });
  await t.shot('phone-chest');
  await t.ev(() => { MinesExt.leave(Game); const M = CFG.MINES; T.tp(M.DOOR.x, M.DOOR.y + 40, 'site'); T.step(2); });
  await t.shot('phone-entrance');
};
