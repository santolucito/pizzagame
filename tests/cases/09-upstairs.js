'use strict';
// The bedroom upstairs: the decoration catalog (open, flip, buy), the drawing pad at the desk (draw, hang it on
// the wall, close) and the drawing surviving a reload.
module.exports = async (t) => {
  await t.boot();
  const C = await t.ev(() => CFG.UPSTAIRS);

  // ---- up the office stairs
  await t.ev(() => { const L = CFG.UPSTAIRS.STAIRS.landing; T.tp(L.x, L.y, 'town'); T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'upstairs', 'in the bedroom');

  // ---- the catalog on the bedside table
  await t.ev(() => { const c = CFG.UPSTAIRS.catalog; T.tp(c.x, c.y + 20); Game.s.cash = 5000; });
  t.expectEq(await t.ev(() => T.label()), '📖 Open the catalog', 'catalog label by the bedside table');
  t.expectEq(await t.ev(() => T.hint()), 'Open the catalog to decorate 📖', 'catalog hint');
  const keyBefore = await t.ev(() => UpstairsExt.bgKey(Game));
  await t.ev(() => T.act());
  t.expect(await t.ev(() => UpstairsExt.st.cat.on && UpstairsExt.st.cat.page === 0), 'catalog opens on the cover');
  t.expectEq(await t.ev(() => T.label()), '📖 Open it up!', 'cover action turns to the first page');
  // the controls are DOM buttons on the card: the X on its top-right corner, the arrows on its sides, under the HUD
  await t.wait(150);
  const ctl = await t.ev(() => { const r = (id) => document.getElementById(id).getBoundingClientRect(); const c = r('cat-close'), p = r('cat-prev'), n = r('cat-next'), W = innerWidth; return { shown: !document.getElementById('catalog-ctl').classList.contains('hidden'), closeRight: c.left > W / 2, closeTop: c.top > 40 && c.top < innerHeight / 2, prevLeft: p.left < W / 2, nextRight: n.left > W / 2, prevOff: document.getElementById('cat-prev').disabled, nextOn: !document.getElementById('cat-next').disabled }; });
  t.expect(ctl.shown && ctl.closeRight && ctl.closeTop && ctl.prevLeft && ctl.nextRight && ctl.prevOff && ctl.nextOn, `catalog buttons sit on the card (${JSON.stringify(ctl)})`);
  t.expectEq(await t.ev(() => T.hint()), null, 'no hint while reading');
  await t.shot('catalog-cover');
  // frozen while reading
  const held = await t.ev(() => { const x = Game.player.x; T.steer(0, -1); T.step(40); T.unsteer(); T.step(2); return Math.abs(Game.player.x - x) < 0.01; });
  t.expect(held, 'the chef stays put while the catalog is open');
  // walking does not turn pages any more
  await t.ev(() => { T.steer(1, 0); T.step(10); T.unsteer(); T.step(25); T.steer(0, 1); T.step(10); T.unsteer(); T.step(2); });
  t.expect(await t.ev(() => UpstairsExt.st.cat.on && UpstairsExt.st.cat.page === 0), 'the joystick neither turns pages nor closes the catalog');
  // flip to the second item with the ▶ button (two taps), the flip animation finishing between taps
  await t.ev(() => { document.getElementById('cat-next').click(); T.step(25); document.getElementById('cat-next').click(); T.step(25); });
  const page = await t.ev(() => UpstairsExt.st.cat.page);
  t.expectEq(page, 2, 'two pages to the right');
  const item = C.items[page - 1];
  t.expectEq(await t.ev(() => T.label()), '🛒 Buy for ' + await t.ev((p) => U.money(p), item.price), 'buy label with enough cash');
  await t.shot('catalog-item');
  await t.ev(() => T.act());
  t.expect(await t.ev((k) => !!Game.s.upstairs.owned[k], item.key), `bought the ${item.label}`);
  t.expectEq(await t.ev(() => Math.round(Game.s.cash)), 5000 - item.price, 'paid for it');
  t.expectEq(await t.ev(() => T.label()), '✅ You have this one!', 'owned label after buying');
  t.expect(await t.ev(() => UpstairsExt.bgKey(Game)) !== keyBefore, 'bgKey changes once something is owned');
  // too poor on the next page
  await t.ev(() => { document.getElementById('cat-next').click(); T.step(25); Game.s.cash = 10; });
  t.expect((await t.ev(() => T.label())).startsWith('💰 Need'), 'need-more label when poor');
  // ◀ goes back, the X closes
  await t.ev(() => { document.getElementById('cat-prev').click(); T.step(25); });
  t.expectEq(await t.ev(() => UpstairsExt.st.cat.page), 2, 'the ◀ button turns back a page');
  await t.ev(() => { document.getElementById('cat-close').click(); T.step(2); });
  t.expect(await t.ev(() => !UpstairsExt.st.cat.on && document.getElementById('catalog-ctl').classList.contains('hidden')), 'the X closes the catalog and hides the buttons');
  await t.ev(() => { Game.s.cash = 5000; T.step(20); });
  await t.shot('room-bought');

  // ---- the bean bag: a seat once it is bought
  const bag = C.items.find((it) => it.key === 'beanbag');
  const side = { x: bag.block[0] - 16, y: bag.spot.y };   // just west of its solid block
  await t.ev((s) => { delete Game.s.upstairs.owned.beanbag; T.tp(s.x, s.y, 'upstairs'); }, side);
  t.expect(await t.ev(() => T.label() !== '🛋️ Flop on the bean bag'), 'no flopping before the bean bag is bought');
  const keyNoBag = await t.ev(() => UpstairsExt.bgKey(Game));
  await t.ev((s) => { Game.s.upstairs.owned.beanbag = true; T.tp(s.x - 30, s.y, 'upstairs'); }, side);
  t.expect(await t.ev(() => UpstairsExt.bgKey(Game)) !== keyNoBag, 'the room rebuilds with the bean bag in it');
  t.expect(await t.ev((b) => Game.obstacles().some((o) => o.x === b[0] && o.y === b[1] && o.w === b[2] && o.h === b[3]), bag.block), 'the bean bag is solid');
  // walking into it stops at its side
  const stopX = await t.ev(() => { T.steer(1, 0); T.step(40); T.unsteer(); T.step(2); return Game.player.x; });
  t.expect(stopX <= bag.block[0] - 11.9 && stopX > bag.block[0] - 20, 'walking east stops at the bean bag (x ' + stopX.toFixed(1) + ')');
  await t.ev((s) => T.tp(s.x, s.y, 'upstairs'), side);
  t.expectEq(await t.ev(() => T.label()), '🛋️ Flop on the bean bag', 'flop label beside the bean bag');
  t.expectEq(await t.ev(() => T.hint()), 'Flop on the bean bag! 🛋️', 'bean bag hint');
  // also offered from the other sides
  for (const [dx, dy] of [[0, 30], [0, -30], [36, 0]]) {
    const lbl = await t.ev(([x, y]) => { T.tp(x, y, 'upstairs'); return T.label(); }, [bag.spot.x + dx, bag.spot.y + dy]);
    t.expectEq(lbl, '🛋️ Flop on the bean bag', `flop label from (${dx}, ${dy})`);
  }
  // not while the drawing pad is open (checked without stepping), nor far away
  await t.ev((s) => T.tp(s.x, s.y, 'upstairs'), side);
  t.expect(await t.ev(() => { UpstairsExt.st.draw.on = true; const l = T.label(); UpstairsExt.st.draw.on = false; return l !== '🛋️ Flop on the bean bag'; }), 'no flopping while the drawing pad is open');
  t.expect(await t.ev(() => { UpstairsExt.st.nap = { phase: 'sleep', t: 0 }; const l = T.label(); UpstairsExt.st.nap = null; return l !== '🛋️ Flop on the bean bag'; }), 'no flopping while napping');
  // flop!
  await t.ev(() => T.act());
  t.expect(await t.ev(() => !!UpstairsExt.st.sit), 'sitting state on');
  await t.ev(() => T.step(30));
  const sat = await t.ev(() => ({ p: { x: Game.player.x, y: Game.player.y }, seat: UpstairsExt.seat(), landed: UpstairsExt.st.sit.landed, sq: UpstairsExt.squash(Game), comfy: Game.floats.some((f) => f.text === 'Ahh, comfy! 😌') }));
  t.expect(sat.landed && Math.abs(sat.p.x - sat.seat.x) < 0.01 && Math.abs(sat.p.y - sat.seat.y) < 0.01, 'the chef lands in the bean bag');
  t.expect(sat.p.y > bag.spot.y && sat.p.y < bag.block[1] + bag.block[3], 'sitting low, inside the bag');
  t.expect(sat.sq > 0.5, 'the bag squashes (' + sat.sq.toFixed(2) + ')');
  t.expect(sat.comfy, 'a happy "Ahh, comfy!" float');
  t.expectEq(await t.ev(() => T.label()), '🚶 Get up', 'get-up label while seated');
  t.expectEq(await t.ev(() => T.hint()), null, 'no hint while seated');
  const pinned = await t.ev(() => { const x = Game.player.x, y = Game.player.y; T.steer(1, 1); T.step(40); T.steer(-1, 0); T.step(20); T.unsteer(); T.step(2); return Math.abs(Game.player.x - x) < 0.01 && Math.abs(Game.player.y - y) < 0.01; });
  t.expect(pinned, 'the chef stays in the bag while seated');
  await t.ev(() => { Game.floats.length = 0; Game.floats.push({ x: UpstairsExt.seat().x, y: UpstairsExt.seat().y - 70, text: 'Ahh, comfy! 😌', color: '#ffe08a', t: 0.3, dur: 60, big: true }); T.step(2); });
  await t.shot('beanbag');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.wait(300);
  await t.shot('beanbag-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.wait(200);
  await t.ev(() => { Game.floats.length = 0; });
  // get up: back where the chef stood, free to walk
  await t.ev(() => T.act());
  const up = await t.ev(() => ({ sit: UpstairsExt.st.sit, x: Game.player.x, y: Game.player.y, free: UpstairsExt.clearSpot(Game, Game.player.x, Game.player.y) }));
  t.expect(!up.sit && up.free, 'stood up on a free spot');
  t.expect(Math.abs(up.x - side.x) < 0.01 && Math.abs(up.y - side.y) < 0.01, 'stood up where the chef was before');
  const walked = await t.ev(() => { const x = Game.player.x; T.steer(-1, 0); T.step(20); T.unsteer(); T.step(2); return Game.player.x < x - 10; });
  t.expect(walked, 'the chef can walk again after getting up');
  // a save made on the bean bag: after a reload the chef just gets up beside it (not sent back to the stairs)
  await t.ev((s) => { T.tp(s.x, s.y, 'upstairs'); T.act(); T.step(30); UpstairsExt.st.sit = null; T.step(2); }, side);
  const res = await t.ev((b) => ({ x: Game.player.x, y: Game.player.y, free: UpstairsExt.clearSpot(Game, Game.player.x, Game.player.y), d: U.dist(Game.player.x, Game.player.y, b.x, b.y) }), bag.spot);
  t.expect(res.free && res.d < 60, 'a seated save is rescued to beside the bean bag (' + JSON.stringify(res) + ')');
  // Take me home from the bean bag
  await t.ev((s) => { T.tp(s.x, s.y, 'upstairs'); T.act(); T.step(30); Game.goHome(); T.step(5); }, side);
  t.expect(await t.ev(() => !UpstairsExt.st.sit && Game.area !== 'upstairs'), 'Take me home gets the chef out of the bean bag');
  await t.ev(() => { const L = CFG.UPSTAIRS.STAIRS.landing; T.tp(L.x, L.y, 'town'); T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'upstairs', 'back up in the bedroom');

  // ---- the drawing pad at the desk
  await t.ev(() => { const ch = CFG.UPSTAIRS.chair; T.tp(ch.x - 24, ch.y); });
  t.expectEq(await t.ev(() => T.label()), '✏️ Sit and draw', 'draw label by the desk chair');
  t.expectEq(await t.ev(() => T.hint()), 'Sit at the desk and draw ✏️', 'desk hint');
  await t.ev(() => T.act());
  t.expect(await t.ev(() => UpstairsExt.st.draw.on), 'pad state on');
  t.expect(await t.page.isVisible('#modal-draw'), 'the drawing pad overlay is visible');
  t.expectEq(await t.ev(() => T.label()), null, 'no action while drawing');
  t.expectEq(await t.ev(() => T.hint()), null, 'no hint while drawing');
  const heldDraw = await t.ev(() => { const x = Game.player.x, y = Game.player.y; T.steer(1, 1); T.step(40); T.unsteer(); T.step(2); return Math.abs(Game.player.x - x) < 0.01 && Math.abs(Game.player.y - y) < 0.01; });
  t.expect(heldDraw, 'the chef stays put while drawing');
  // a stroke with the mouse (real pointer events on the canvas), then a different colour and size
  const box = await t.page.locator('#draw-canvas').boundingBox();
  await t.page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
  await t.page.mouse.down();
  await t.page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.7, { steps: 8 });
  await t.page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3, { steps: 8 });
  await t.page.mouse.up();
  await t.page.click('#draw-colors button:nth-child(2)');
  await t.page.click('#draw-sizes button:nth-child(3)');
  await t.page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.8);
  await t.page.mouse.down();
  await t.page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.8, { steps: 6 });
  await t.page.mouse.up();
  t.expect(await t.ev(() => UpstairsExt.pad.dirty), 'the stroke reached the pad');
  const inked = await t.ev(() => { const p = UpstairsExt.pad, d = p.ctx.getImageData(0, 0, p.cv.width, p.cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 250 || d[i + 1] < 250 || d[i + 2] < 250) n++; return n; });
  t.expect(inked > 500, 'the canvas has ink on it (' + inked + ' px)');
  await t.shot('drawing-pad');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.wait(300);
  await t.shot('drawing-pad-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.wait(300);
  // hang it on the wall
  await t.page.click('#draw-hang');
  const url = await t.ev(() => Game.s.upstairs.drawing);
  t.expect(typeof url === 'string' && url.startsWith('data:image/png'), 'drawing saved as a PNG data URL');
  t.expect(url.length < 40000, 'the saved drawing stays small (' + url.length + ' chars)');
  t.expect(await t.ev(() => !UpstairsExt.st.draw.on), 'pad closes after hanging');
  t.expect(!(await t.page.isVisible('#modal-draw')), 'overlay hidden again');
  const moved = await t.ev(() => { const x = Game.player.x; T.steer(-1, 0); T.step(20); T.unsteer(); T.step(2); return Game.player.x < x - 10; });
  t.expect(moved, 'the chef can walk again');
  // the picture loads and the backgrounds rebuild with it
  await t.page.waitForFunction(() => UpstairsExt.img && UpstairsExt.img.ok, null, { timeout: 5000 });
  await t.ev(() => { T.tp(6700, 1700); T.step(5); });
  t.expect((await t.ev(() => UpstairsExt.bgKey(Game))).endsWith(':1'), 'bgKey carries the loaded picture');
  await t.shot('room-with-drawing');
  // and downstairs, in the dining room
  await t.ev(() => { T.tp(900, 200, 'town'); T.step(5); });
  await t.shot('shop-with-drawing');

  // ---- reload: the drawing and the purchase persist
  await t.ev(() => Game.save());
  await t.reload();
  const kept = await t.ev(() => ({ url: Game.s.upstairs.drawing, owned: Object.keys(Game.s.upstairs.owned) }));
  t.expect(typeof kept.url === 'string' && kept.url.startsWith('data:image/png'), 'drawing persisted across reload');
  t.expect(kept.owned.includes(item.key), 'purchase persisted across reload');
  await t.page.waitForFunction(() => UpstairsExt.img && UpstairsExt.img.ok, null, { timeout: 5000 });
  // reopening the pad shows the saved picture, ready to touch up
  await t.ev(() => { const ch = CFG.UPSTAIRS.chair; T.tp(ch.x - 24, ch.y, 'upstairs'); T.act(); });
  t.expect(await t.page.isVisible('#modal-draw'), 'pad reopens after reload');
  await t.page.click('#draw-done');
  t.expect(!(await t.page.isVisible('#modal-draw')), 'Done closes the pad');
};
