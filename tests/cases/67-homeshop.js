'use strict';
// Home shopping in the City (js/homeshop.js): the bedroom's and the cabin's things are sold on display stands in
// the City shops instead of from catalogs. Every item is sold exactly once (the Hamster Wheel is gone); every stand
// is inside its shop, on free floor, clear of the shop's furniture, its walk-on circles and its buttons, reachable
// from the door, and leaves every other button of the shop reachable; the cabin's stands wait until the cabin is
// found; buying (and not having enough money yet) works and the thing then appears at home; an old save keeps what
// it bought (and its hamster wheel quietly disappears). Screenshots of a few stands and of the furnished bedroom.
module.exports = async (t) => {
  await t.boot();
  const SHOPS = { toyshop: 'TOYSHOP', petshop: 'PETSHOP', music: 'MUSIC', books: 'BOOKS', flowers: 'FLOWERS', bakery: 'BAKERY' };

  // ---- the catalogs are gone; every item is sold once
  const data = await t.ev(() => ({
    up: CFG.UPSTAIRS.items.map((i) => i.key), cab: CFG.SECRET.HOME.items.map((i) => i.key),
    stands: CFG.HOMESHOP.STANDS.map((s) => s.home + ':' + s.key),
    noCat: CFG.UPSTAIRS.catalog === undefined && CFG.SECRET.HOME.catalog === undefined && !UpstairsExt.openCatalog && !SecretExt.openCatalog && !('cat' in UpstairsExt.st) && !('cat' in SecretExt.st),
  }));
  t.expect(data.noCat, 'no catalog left in the bedroom or the cabin');
  t.expect(!data.up.includes('hamster') && !data.stands.some((k) => k.endsWith(':hamster')), 'the hamster wheel is gone');
  const want = data.up.map((k) => 'bedroom:' + k).concat(data.cab.map((k) => 'cabin:' + k)).sort();
  t.expectEq(data.stands.slice().sort().join(','), want.join(','), 'every bedroom and cabin item has exactly one stand');
  const shopOf = await t.ev(() => Object.fromEntries(CFG.HOMESHOP.STANDS.map((s) => [s.home + ':' + s.key, s.area])));
  const expectShop = { 'bedroom:fish': 'petshop', 'bedroom:drums': 'music', 'bedroom:telescope': 'books', 'cabin:plant': 'flowers', 'cabin:fish': 'petshop', 'cabin:dogbed': 'petshop', 'cabin:books': 'books', 'cabin:telescope': 'books', 'cabin:record': 'music', 'cabin:jar': 'bakery', 'cabin:oven': 'bakery' };
  for (const k of want) t.expectEq(shopOf[k], expectShop[k] || 'toyshop', `${k} is sold in the right shop`);

  // ---- geometry, shop by shop: inside the room, on free floor, clear of every button/circle, reachable
  await t.ev(() => { Game.s.cabin.seen = true; });
  for (const [area, key] of Object.entries(SHOPS)) {
    const res = await t.ev(([area, key]) => {
      const K = CFG[key], R = K.ROOM, HS = HomeShopExt, r = 12;
      T.tp(K.EXIT.x, K.EXIT.y - 8, area); T.step(2);
      const mine = HS.stands(Game);
      // the shop as it would be without the stands
      const myObs = HS.obstacles; HS.obstacles = () => [];
      const myAct = HS.action; HS.action = () => null;
      const base = Game.obstacles();
      const pads = Game.ext.filter((e) => e.pads).flatMap((e) => e.pads(Game)).map((p) => p.pos).filter((q) => q.x > R.x0 && q.x < R.x1 && q.y > R.y0 && q.y < R.y1);
      const step = area === 'bakery' ? 12 : 6, spots = [], gridFree = (obs, x, y) => x > R.x0 + r && x < R.x1 - r && y > R.y0 + r && y < R.y1 - r && !obs.some((o) => Game.hitRect(x, y, r, o));
      for (let y = R.y0 + r + 1; y < R.y1 - r; y += step) for (let x = R.x0 + r + 1; x < R.x1 - r; x += step) {
        if (!gridFree(base, x, y)) continue;
        Game.player.x = x; Game.player.y = y; const l = Game.actionLabel();
        if (l) spots.push({ x, y, l });
      }
      HS.obstacles = myObs; HS.action = myAct;
      const all = Game.obstacles(), rects = mine.map((s) => HS.rect(s));
      // flood fill from the door mat over the floor with the stands in place
      const cols = Math.ceil((R.x1 - R.x0) / step), rows = Math.ceil((R.y1 - R.y0) / step), seen = new Uint8Array(cols * rows);
      const cx = (x) => Math.round((x - R.x0) / step), cy = (y) => Math.round((y - R.y0) / step);
      const ok = (i, j) => i >= 0 && j >= 0 && i < cols && j < rows && gridFree(all, R.x0 + i * step, R.y0 + j * step);
      let q = [[cx(K.EXIT.x), cy(K.EXIT.y - 8)]];
      if (!ok(q[0][0], q[0][1])) { let b = null, bd = 1e9; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (ok(i, j)) { const d = Math.hypot(R.x0 + i * step - K.EXIT.x, R.y0 + j * step - K.EXIT.y); if (d < bd) { bd = d; b = [i, j]; } } q = [b]; }
      seen[q[0][1] * cols + q[0][0]] = 1;
      while (q.length) { const nq = []; for (const [i, j] of q) for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (ok(a, b) && !seen[b * cols + a]) { seen[b * cols + a] = 1; nq.push([a, b]); } } q = nq; }
      const reach = (x, y) => { for (let j = cy(y) - 1; j <= cy(y) + 1; j++) for (let i = cx(x) - 1; i <= cx(x) + 1; i++) if (i >= 0 && j >= 0 && i < cols && j < rows && seen[j * cols + i] && Math.hypot(R.x0 + i * step - x, R.y0 + j * step - y) <= step * 1.5) return true; return false; };
      const out = [];
      for (const s of mine) {
        const b = HS.rect(s), o = { key: s.home + ':' + s.key, spot: s.spot };
        o.inRoom = b.x > R.x0 && b.x + b.w < R.x1 && b.y > R.y0 && b.y + b.h < R.y1;
        o.clearObs = !base.some((a) => b.x < a.x + a.w + 2 && b.x + b.w + 2 > a.x && b.y < a.y + a.h + 2 && b.y + b.h + 2 > a.y);
        o.clearStands = !mine.some((m) => m !== s && Math.abs(m.spot.x - s.spot.x) < b.w + 6 && Math.abs(m.spot.y - s.spot.y) < b.h + 6);
        o.btnDist = Math.round(Math.min(1e9, ...spots.map((p) => Math.hypot(Math.max(b.x - p.x, 0, p.x - b.x - b.w), Math.max(b.y - p.y, 0, p.y - b.y - b.h)))));
        o.padDist = Math.round(Math.min(1e9, ...pads.map((p) => Math.hypot(p.x - s.spot.x, p.y - s.spot.y))));
        // a reachable floor spot where this stand's own button shows
        let use = null;
        for (let y = s.spot.y - 44; y <= s.spot.y + 44 && !use; y += 3) for (let x = s.spot.x - 44; x <= s.spot.x + 44 && !use; x += 3) {
          if (!gridFree(all, x, y) || !reach(x, y)) continue;
          Game.player.x = x; Game.player.y = y;
          if (HS.nearest(Game) === s && Game.actionLabel() === HS.action(Game).label) use = { x, y };
        }
        o.use = use;
        out.push(o);
      }
      // every button and circle of the shop is still reachable with the stands in place
      const lost = spots.filter((p) => !reach(p.x, p.y) && gridFree(all, p.x, p.y)).length + pads.filter((p) => !reach(p.x, p.y)).length;
      const labelsBefore = new Set(spots.map((p) => p.l)), labelsAfter = new Set();
      for (const p of spots) { if (!gridFree(all, p.x, p.y) || !reach(p.x, p.y)) continue; Game.player.x = p.x; Game.player.y = p.y; labelsAfter.add(Game.actionLabel()); }
      const missing = [...labelsBefore].filter((l) => !labelsAfter.has(l));
      return { out, lost, missing, n: mine.length };
    }, [area, key]);
    t.expect(res.n > 0, `${area} has stands`);
    for (const o of res.out) {
      t.expect(o.inRoom && o.clearObs && o.clearStands, `${o.key} in the ${area} stands inside the room on free floor (${JSON.stringify(o)})`);
      t.expect(o.btnDist >= 14, `${o.key} in the ${area} keeps clear of the shop's buttons (${o.btnDist} px)`);
      t.expect(o.padDist >= 56, `${o.key} in the ${area} keeps clear of the walk-on circles (${o.padDist} px)`);
      t.expect(!!o.use, `${o.key} in the ${area} can be reached and shows its own button`);
    }
    t.expectEq(res.missing.join('|'), '', `every button of the ${area} still shows somewhere reachable`);
  }

  // ---- the cabin's stands wait until the cabin is found
  const hidden = await t.ev(() => {
    Game.s.cabin.seen = false; Game.s.cabin.owned = {};
    const s = CFG.HOMESHOP.STANDS.find((q) => q.key === 'teddy');
    T.tp(s.spot.x, s.spot.y + 22, 'toyshop'); T.step(1);
    const out = { stands: HomeShopExt.stands(Game).map((q) => q.home), label: T.label(), obs: Game.obstacles().some((o) => Game.hitRect(s.spot.x, s.spot.y, 2, o)) };
    Game.s.cabin.seen = true; T.step(1); out.after = T.label();
    return out;
  });
  t.expect(hidden.stands.every((h) => h === 'bedroom') && hidden.label !== '🛒 Buy Teddy Bear ($45)' && !hidden.obs, `before the cabin is found only bedroom things are on sale (${JSON.stringify(hidden)})`);
  t.expect(/Teddy Bear/.test(hidden.after) || /Need/.test(hidden.after), `after finding the cabin the teddy is on sale (${hidden.after})`);

  // ---- buying: not enough money, then buy, then "you have this one"
  const use = async (home, key) => t.ev(([home, key]) => {
    const s = CFG.HOMESHOP.STANDS.find((q) => q.home === home && q.key === key), all = () => Game.obstacles();
    T.tp(s.spot.x, s.spot.y + 30, s.area);
    for (const [dx, dy] of [[0, 24], [0, 26], [0, 30], [-28, 0], [28, 0], [0, -26], [-24, 18], [24, 18]]) {
      const x = s.spot.x + dx, y = s.spot.y + dy;
      if (all().some((o) => Game.hitRect(x, y, 12, o))) continue;
      Game.player.x = x; Game.player.y = y; T.step(1);
      if (HomeShopExt.nearest(Game) === s) return true;
    }
    return false;
  }, [home, key]);
  t.expect(await use('bedroom', 'beanbag'), 'standing at the bean bag stand');
  const poor = await t.ev(() => { Game.s.cash = 20; T.step(1); const label = T.label(), hint = T.hint(); T.act(); return { label, hint, owned: UpstairsExt.owned(Game, 'beanbag'), cash: Game.s.cash, float: Game.floats.some((f) => /Earn more/.test(f.text)) }; });
  t.expectEq(poor.label, '💰 Need $50 more', 'kindly says how much more is needed');
  t.expect(!poor.owned && poor.cash === 20 && poor.float, `nothing bought without the money (${JSON.stringify(poor)})`);
  const buy = await t.ev(() => { Game.s.cash = 1000; T.step(1); const label = T.label(), hint = T.hint(); T.act(); T.step(2); return { label, hint, owned: UpstairsExt.owned(Game, 'beanbag'), cash: Game.s.cash, float: Game.floats.some((f) => f.text === "🛏️ It's in your bedroom!"), confetti: HomeShopExt.st.confetti.length, after: T.label() }; });
  t.expectEq(buy.label, '🛒 Buy Bean Bag ($70)', 'the buy button names the thing and its price');
  t.expectEq(buy.hint, '🛋️ Bean Bag for your bedroom! 🛒', 'a hint at the stand');
  t.expect(buy.owned && buy.cash === 930 && buy.float && buy.confetti > 0, `bought: paid, owned, confetti, "It's in your bedroom!" (${JSON.stringify(buy)})`);
  t.expectEq(buy.after, '✅ You have this one!', 'then it says you have it');
  await t.ev(() => { Render.setZoom(1.6); Game.cameraSnap = true; T.step(10); });
  await t.shot('toyshop-bought');
  await t.ev(() => { Render.setZoom(1); });
  // the bean bag is now in the bedroom (drawn, solid, and you can flop on it)
  const home = await t.ev(() => { const it = CFG.UPSTAIRS.items.find((i) => i.key === 'beanbag'), b = it.block; return { solid: UpstairsExt.roomBlocks().some((o) => o.x === b[0] && o.y === b[1]), key: UpstairsExt.bgKey(Game) }; });
  t.expect(home.solid, 'the bean bag stands in the bedroom');

  // a cabin thing: the potted plant at the flower shop
  t.expect(await use('cabin', 'plant'), 'standing at the plant stand');
  const plant = await t.ev(() => { T.act(); T.step(1); return { owned: SecretExt.owned(Game, 'plant'), float: Game.floats.some((f) => f.text === "🏡 It's in your cabin!"), solid: SecretExt.homeBlocks(Game).some((o) => o.x === 5198 && o.y === 1806) }; });
  t.expect(plant.owned && plant.float && plant.solid, `the plant is in the cabin (${JSON.stringify(plant)})`);
  // the same key in two homes: the bedroom's fish tank and the cabin's fish bowl are separate
  t.expect(await use('bedroom', 'fish'), 'standing at the fish tank stand');
  const fish = await t.ev(() => { const l = T.label(); T.act(); return { l, up: UpstairsExt.owned(Game, 'fish'), cab: SecretExt.owned(Game, 'fish') }; });
  t.expect(fish.l === '🛒 Buy Fish Tank ($120)' && fish.up && !fish.cab, `the fish tank goes to the bedroom only (${JSON.stringify(fish)})`);
  await t.ev(() => { Render.setZoom(1.5); Game.cameraSnap = true; T.step(10); });
  await t.shot('petshop');
  await t.ev(() => { const s = CFG.HOMESHOP.STANDS.find((q) => q.area === 'books'); T.tp(s.spot.x + 30, s.spot.y + 40, 'books'); Render.setZoom(1.5); Game.cameraSnap = true; T.step(10); });
  await t.shot('bookshop');
  await t.ev(() => { T.tp(-1088, 3200, 'toyshop'); Render.setZoom(1.05); Game.cameraSnap = true; T.step(10); });
  await t.shot('toyshop');
  await t.ev(() => { Render.setZoom(1); });

  // ---- an old save keeps what it bought; its hamster wheel quietly disappears
  await t.ev(() => {
    Game.s.upstairs.owned = { hamster: true, drums: true, telescope: true, slide: true, racecar: true, poster: true, lava: true, stars: true, chest: true, horse: true };
    Game.s.cabin.owned = { rug: true, oven: true }; Game.s.cabin.seen = true;
    Game.save();
  });
  await t.reload();
  const old = await t.ev(() => ({
    up: Object.keys(Game.s.upstairs.owned).sort().join(','), cab: Object.keys(Game.s.cabin.owned).sort().join(','),
    noWheel: !UpstairsExt.roomBlocks().some((o) => o.x === 6786 && o.y === 1784),
    drums: UpstairsExt.roomBlocks().some((o) => o.x === 6716 && o.y === 1782),
    oven: SecretExt.homeBlocks(Game).some((o) => o.x === 4765 && o.y === 1786),
    key: UpstairsExt.bgKey(Game),
  }));
  t.expect(old.up.includes('drums') && old.up.includes('telescope') && old.cab === 'oven,rug', `the old save keeps its things (${JSON.stringify(old)})`);
  t.expect(old.noWheel && old.drums && old.oven, 'the drums and the oven are there, the hamster wheel is not');
  t.expect(await use('bedroom', 'drums'), 'standing at the drum stand');
  t.expectEq(await t.ev(() => T.label()), '✅ You have this one!', 'the shop knows you have the drums already');
  // the furnished bedroom
  await t.ev(() => { T.tp(CFG.UPSTAIRS.top.x - 120, CFG.UPSTAIRS.top.y - 60, 'upstairs'); Render.setZoom(1.2); Game.cameraSnap = true; T.step(30); });
  t.expect(await t.ev(() => Game.area === 'upstairs' && UpstairsExt.roomFree(Game.player.x, Game.player.y)), 'in the bedroom on free floor');
  await t.shot('bedroom');
};
