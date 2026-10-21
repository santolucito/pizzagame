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
  t.expectEq(await t.ev(() => T.label()), '📕 Close the catalog', 'cover action closes');
  t.expectEq(await t.ev(() => T.hint()), null, 'no hint while reading');
  await t.shot('catalog-cover');
  // frozen while reading
  const held = await t.ev(() => { const x = Game.player.x; T.steer(0, -1); T.step(40); T.unsteer(); T.step(2); return Math.abs(Game.player.x - x) < 0.01; });
  t.expect(held, 'the chef stays put while the catalog is open');
  // flip to the second item (two pages right), the flip animation finishing between presses
  await t.ev(() => { T.steer(1, 0); T.step(5); T.unsteer(); T.step(25); T.steer(1, 0); T.step(5); T.unsteer(); T.step(25); });
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
  await t.ev(() => { T.steer(1, 0); T.step(5); T.unsteer(); T.step(25); Game.s.cash = 10; });
  t.expect((await t.ev(() => T.label())).startsWith('💰 Need'), 'need-more label when poor');
  // DOWN closes
  await t.ev(() => { T.steer(0, 1); T.step(5); T.unsteer(); T.step(2); });
  t.expect(await t.ev(() => !UpstairsExt.st.cat.on), 'walking down closes the catalog');
  await t.ev(() => { Game.s.cash = 5000; T.step(20); });
  await t.shot('room-bought');

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
