'use strict';
// The bedroom upstairs: no catalog any more (things are bought in the City shops, see 67-homeshop; the room still
// draws and rebuilds what is owned), the bean bag, the drawing pad at the desk (draw, hang it on the wall, close)
// and the drawing surviving a reload.
module.exports = async (t) => {
  await t.boot();
  const C = await t.ev(() => CFG.UPSTAIRS);

  // ---- the office stairs, close up (they should read as climbing UP to the east)
  await t.ev(() => { const L = CFG.UPSTAIRS.STAIRS.landing; Render.setZoom(2.2); T.tp(L.x - 70, L.y + 6, 'town'); Game.cameraSnap = true; T.step(2); });
  await t.shot('stairs-closeup');
  await t.ev(() => { Render.setZoom(1); Game.cameraSnap = true; T.step(1); });

  // ---- up the office stairs
  await t.ev(() => { const L = CFG.UPSTAIRS.STAIRS.landing; T.tp(L.x, L.y, 'town'); T.act(); T.step(30); });
  t.expectEq(await t.ev(() => Game.area), 'upstairs', 'in the bedroom');

  // ---- no catalog on the bedside table any more: the things are sold in the City shops
  await t.ev(() => { const T2 = CFG.UPSTAIRS.table; T.tp((T2.x0 + T2.x1) / 2, T2.y1 + 16); Game.s.cash = 5000; });
  t.expect(await t.ev(() => !/catalog/i.test(T.label() || '') && !/catalog/i.test(T.hint() || '')), 'no catalog button or hint by the bedside table');
  t.expect(await t.ev(() => CFG.UPSTAIRS.catalog === undefined && !CFG.UPSTAIRS.items.some((i) => i.key === 'hamster')), 'no catalog spot, no hamster wheel');
  // owning something (as a City shop would set it) rebuilds the room with it
  const keyBefore = await t.ev(() => UpstairsExt.bgKey(Game));
  await t.ev(() => { Game.s.upstairs.owned.horse = true; Game.s.upstairs.owned.fish = true; T.step(2); });
  t.expect(await t.ev(() => UpstairsExt.bgKey(Game)) !== keyBefore, 'bgKey changes once something is owned');
  // an old save's hamster wheel is ignored: not drawn into the key, not solid
  const keyHam = await t.ev(() => { const k = UpstairsExt.bgKey(Game); Game.s.upstairs.owned.hamster = true; T.step(1); return k; });
  t.expectEq(await t.ev(() => UpstairsExt.bgKey(Game)), keyHam, 'an owned hamster wheel changes nothing');
  t.expect(await t.ev(() => !UpstairsExt.roomBlocks().some((o) => o.x === 6786 && o.y === 1784)), 'and it is not solid');
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
  t.expect(kept.owned.includes('horse') && kept.owned.includes('fish'), 'owned things persisted across reload');
  await t.page.waitForFunction(() => UpstairsExt.img && UpstairsExt.img.ok, null, { timeout: 5000 });
  // reopening the pad shows the saved picture, ready to touch up
  await t.ev(() => { const ch = CFG.UPSTAIRS.chair; T.tp(ch.x - 24, ch.y, 'upstairs'); T.act(); });
  t.expect(await t.page.isVisible('#modal-draw'), 'pad reopens after reload');
  await t.page.click('#draw-done');
  t.expect(!(await t.page.isVisible('#modal-draw')), 'Done closes the pad');
  // in bed: asleep (night over the screen) until ☀️ Wake up, then a fresh morning and out of bed
  const bed = await t.ev(() => {
    const C = CFG.UPSTAIRS; T.tp(C.sleepSpot.x, C.sleepSpot.y, 'upstairs'); T.step(2);
    const label = T.label(); T.act(); T.step(60 * 8);
    const n = UpstairsExt.st.nap, out = { label, phase: n && n.phase, night: UpstairsExt.napAlpha(), wakeLabel: T.label(), hint: T.hint(), inBed: Math.hypot(Game.player.x - C.napSpot.x, Game.player.y - C.napSpot.y) < 1 };
    T.act(); const k = T.until(() => !UpstairsExt.st.nap, 300);
    out.woke = k >= 0; out.morning = Game.floats.some((f) => f.text === '🐓 Good morning!'); out.out = Math.hypot(Game.player.x - C.sleepSpot.x, Game.player.y - C.sleepSpot.y) < 1;
    return out;
  });
  t.expect(bed.label === '😴 Sleep' && bed.phase === 'sleep' && bed.inBed && bed.night > 0.9, `still asleep in bed after 8 s ${JSON.stringify(bed)}`);
  t.expect(bed.wakeLabel === '☀️ Wake up' && /wake up/i.test(bed.hint || ''), `a Wake up button while asleep ${JSON.stringify(bed)}`);
  t.expect(bed.woke && bed.morning && bed.out, `Wake up: good morning and out of bed ${JSON.stringify(bed)}`);
};
