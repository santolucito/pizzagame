'use strict';
// The hiring desk in the office corner (first floor of the pizzeria): a chair beside it where the chef sits and
// draws on the same pad as upstairs (slot 'office'); the picture is hung in its own frame on the office wall, saved
// apart from the bedroom drawing, and survives a reload.
const path = require('path');
module.exports = async (t) => {
  // the extension is loaded by index.html once wired in; until then the case injects it itself
  const load = async () => { if (await t.ev(() => typeof HireDeskExt === 'undefined')) await t.page.addScriptTag({ path: path.join(__dirname, '..', '..', 'js', 'hiredesk.js') }); };
  // red ink on the pad (or in a region of the game canvas), in canvas pixels
  const padInk = () => t.ev(() => { const p = UpstairsExt.pad, d = p.ctx.getImageData(0, 0, p.cv.width, p.cv.height).data; let ink = 0, red = 0, blue = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] < 250 || d[i + 1] < 250 || d[i + 2] < 250) ink++; if (d[i] > 200 && d[i + 1] < 130 && d[i + 2] < 100) red++; if (d[i] < 90 && d[i + 2] > 200) blue++; } return { ink, red, blue }; });
  const frameRed = () => t.ev(() => {
    const F = CFG.HIREDESK.frame, k = Render.scale * Render.dpr, cx = Render.canvas.getContext('2d');
    const x0 = Math.round((F.x - F.w / 2 + 3 - Render.camX) * k), y0 = Math.round((F.y - F.h / 2 + 3 - Render.camY) * k), w = Math.round((F.w - 6) * k), h = Math.round((F.h - 6) * k);
    const d = cx.getImageData(x0, y0, w, h).data; let red = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 130 && d[i + 2] < 100) red++;
    return red;
  });
  // the cached background rebuilds a moment after a zoom or a new picture: give it up to 4 s of real frames
  const redSoon = async () => { let n = 0; for (let i = 0; i < 20; i++) { await t.wait(200); n = await frameRed(); if (n > 60) break; } return n; };
  await t.boot();
  await load();
  t.expect(await t.ev(() => Game.ext.indexOf(HireDeskExt) >= 0 && Game.ext.indexOf(HireDeskExt) < Game.ext.indexOf(UpstairsExt) && Render.ext.includes(HireDeskExt)), 'registered ahead of the bedroom in Game.ext, and in Render.ext');
  t.expect(await t.ev(() => !!UpstairsExt.artSlots.office), 'the office slot is on the shared drawing pad');
  const H = await t.ev(() => CFG.HIREDESK);

  // ---- the chair spot: free floor beside the desk, inside the office, off every pad's circle
  await t.ev(() => { Game.s.unlocked.dining = true; Game.s.unlocked.tables2 = true; T.step(2); });
  const spot = await t.ev((c) => {
    const pads = Game.allPads().map((p) => p.pos).concat(CFG.SHOP_PADS.map((p) => p.pos), CFG.PADS.map((p) => p.pos));
    const minPad = Math.min(...pads.map((q) => U.dist(c.x, c.y, q.x, q.y)));
    const blocked = Game.obstacles().some((o) => Game.hitRect(c.x, c.y, 12, o));
    const D = CFG.OFFICE_DESK;
    return { minPad, blocked, inside: Game.insideBuilding(c.x, c.y), office: c.x < 372 && c.y > 478, byDesk: U.dist(c.x, c.y, D.x, D.y) < 80, offDesk: c.x < D.x - 40 || c.x > D.x + 40 };
  }, H.chair);
  t.expect(spot.minPad > (await t.ev(() => CFG.PAD_RADIUS)) + 18, 'the chair is off every pad circle (nearest pad ' + spot.minPad.toFixed(1) + ' px)');
  t.expect(!spot.blocked && spot.inside && spot.office, 'the chair is on free office floor');
  t.expect(spot.byDesk && spot.offDesk, 'the chair is beside the hiring desk, not on it');
  const stairs = await t.ev(() => CFG.UPSTAIRS.STAIRS.landing);
  t.expect(Math.hypot(stairs.x - H.chair.x, stairs.y - H.chair.y) > 110, 'the chair is away from the stairs and their hint');
  // the frame on the office wall: off the pads, their icons, and the dining room's copy of the bedroom drawing
  const frameOk = await t.ev((F) => {
    const pads = Game.allPads().filter((p) => p.kind !== 'decor');
    // every point of the frame (with its 4 px moulding) lies outside every pad's drawn ellipse (R × 0.6 R)
    const R = CFG.PAD_RADIUS, pts = [];
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) pts.push([F.x - F.w / 2 - 4 + i * (F.w + 8) / 8, F.y - F.h / 2 - 4 + j * (F.h + 8) / 8]);
    const clearOfPads = pads.every((p) => pts.every(([x, y]) => ((x - p.pos.x) / R) ** 2 + ((y - p.pos.y) / (R * 0.6)) ** 2 > 1));
    const icons = pads.every((p) => Math.abs(p.pos.x - F.x) > F.w / 2 + 14 || Math.abs(p.pos.y - 44 - F.y) > F.h / 2 + 12);
    const S = CFG.UPSTAIRS.art.shop, apart = Math.abs(S.x - F.x) > (S.w + F.w) / 2 + 10 || Math.abs(S.y - F.y) > (S.h + F.h) / 2 + 10;
    return { clearOfPads, icons, apart, inside: Game.insideBuilding(F.x, F.y), onWall: F.y - F.h / 2 >= 478 && F.y - F.h / 2 < 490 };
  }, H.frame);
  t.expect(frameOk.clearOfPads && frameOk.icons && frameOk.apart && frameOk.inside && frameOk.onWall, 'the office frame hangs on a free stretch of the office wall ' + JSON.stringify(frameOk));

  // ---- hints and the button
  await t.ev((c) => { Game.s.cash = 1000; T.tp(c.x + 75, c.y - 20, 'town'); T.step(2); }, H.chair);
  t.expect(await t.ev(() => T.hint() !== 'Sit at the desk and draw ✏️'), 'no desk hint when just walking by (75 px away)');
  t.expect(await t.ev(() => T.label() !== '✏️ Sit and draw'), 'no draw button 75 px away');
  await t.ev((c) => { T.tp(c.x + 45, c.y - 10, 'town'); T.step(2); }, H.chair);
  t.expectEq(await t.ev(() => T.hint()), 'Sit at the desk and draw ✏️', 'desk hint within 60 px');
  t.expect(await t.ev((c) => { const tg = Game.hint && Game.hint.target; return !!tg && tg.x === c.x && tg.y === c.y; }, H.chair), 'the hint points at the chair from a little way off');
  await t.ev((c) => { T.tp(c.x + 10, c.y, 'town'); T.step(2); }, H.chair);
  t.expectEq(await t.ev(() => T.label()), '✏️ Sit and draw', 'draw button at the chair');
  t.expectEq(await t.ev(() => T.hint()), 'Sit at the desk and draw ✏️', 'desk hint at the chair');
  t.expect(await t.ev(() => Game.hint.target === null), 'no arrow at the chair itself');
  await t.ev(() => { Render.setZoom(2); Game.cameraSnap = true; });
  await t.wait(300);
  await t.shot('at-desk');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.wait(300);
  await t.shot('at-desk-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.wait(200);

  // ---- a bedroom drawing already exists (solid blue): it must stay put
  const blueUrl = await t.ev(() => { const c = document.createElement('canvas'); c.width = 160; c.height = 120; const x = c.getContext('2d'); x.fillStyle = '#1040ff'; x.fillRect(0, 0, 160, 120); const u = c.toDataURL('image/png'); Game.s.upstairs.drawing = u; return u; });
  await t.page.waitForFunction(() => UpstairsExt.bgKey(Game) && UpstairsExt.img && UpstairsExt.img.ok, null, { timeout: 5000 });

  // ---- sit and draw
  t.expectEq(await t.ev(() => HireDeskExt.bgKey(Game)), 'hd:0', 'no office picture yet');
  const redBefore = await frameRed();
  await t.ev(() => T.act());
  t.expect(await t.ev(() => UpstairsExt.st.draw.on && UpstairsExt.st.draw.slot === 'office'), 'the pad opens on the office slot');
  t.expect(await t.page.isVisible('#modal-draw'), 'the drawing pad overlay is visible');
  t.expect(await t.ev((c) => Game.player.x === c.x && Game.player.y === c.y && Game.player.facing === 1, H.chair), 'the chef sits on the chair, facing the desk');
  const blank = await padInk();
  t.expectEq(blank.ink, 0, 'the office pad starts blank (not the bedroom picture)');
  t.expectEq(await t.ev(() => T.label()), null, 'no action button while drawing');
  t.expectEq(await t.ev(() => T.hint()), null, 'no hint while drawing');
  const held = await t.ev(() => { const x = Game.player.x, y = Game.player.y, cash = Game.s.cash; T.steer(-1, -1); T.step(60); T.unsteer(); T.step(30); return Math.abs(Game.player.x - x) < 0.01 && Math.abs(Game.player.y - y) < 0.01 && Game.s.cash === cash; });
  t.expect(held, 'the chef stays on the chair, and no money flows into a pad');
  // strokes with the mouse: a thin dark one, then fat red ones
  const box = await t.page.locator('#draw-canvas').boundingBox();
  await t.page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
  await t.page.mouse.down();
  await t.page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.7, { steps: 8 });
  await t.page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3, { steps: 8 });
  await t.page.mouse.up();
  await t.page.click('#draw-colors button:nth-child(2)');
  await t.page.click('#draw-sizes button:nth-child(3)');
  for (let k = 0; k < 6; k++) {
    const y = box.y + box.height * (0.2 + k * 0.12);
    await t.page.mouse.move(box.x + box.width * 0.1, y);
    await t.page.mouse.down();
    await t.page.mouse.move(box.x + box.width * 0.9, y, { steps: 6 });
    await t.page.mouse.up();
  }
  const inked = await padInk();
  t.expect(inked.ink > 5000 && inked.red > 3000, 'the canvas has ink on it ' + JSON.stringify(inked));
  await t.shot('drawing-pad');

  // ---- hang it up
  await t.page.click('#draw-hang');
  const saved = await t.ev(() => ({ office: Game.s.hiredesk && Game.s.hiredesk.drawing, bedroom: Game.s.upstairs.drawing, on: UpstairsExt.st.draw.on, float: Game.floats.some((f) => f.text === '🖼️ Hung up in the shop!') }));
  t.expect(typeof saved.office === 'string' && saved.office.startsWith('data:image/png'), 'the office picture is saved as a PNG data URL');
  t.expect(saved.office.length < 40000, 'the saved picture stays small (' + saved.office.length + ' chars)');
  t.expect(saved.bedroom === blueUrl, 'the bedroom drawing is unaffected');
  t.expect(!saved.on && !(await t.page.isVisible('#modal-draw')), 'the pad closes after hanging');
  t.expect(saved.float, 'a "Hung up in the shop!" float');
  const moved = await t.ev(() => { const y = Game.player.y; T.steer(0, -1); T.step(20); T.unsteer(); T.step(2); return Game.player.y < y - 10; });
  t.expect(moved, 'the chef can walk again');
  // the picture loads, the town background rebuilds with it, and it shows in the office frame
  await t.page.waitForFunction(() => UpstairsExt.arts.office && UpstairsExt.arts.office.ok, null, { timeout: 5000 });
  t.expect((await t.ev(() => HireDeskExt.bgKey(Game))) !== 'hd:0', 'the bgKey changes once the picture has loaded');
  await t.ev((F) => { T.tp(F.x, F.y + 93, 'town'); Game.cameraSnap = true; T.step(3); }, H.frame);
  const redAfter = await redSoon();
  t.expect(redBefore < 20 && redAfter > 60, `the office frame shows the picture (red px ${redBefore} -> ${redAfter})`);
  await t.shot('office-drawing');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.wait(400);
  await t.shot('office-drawing-phone');
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.wait(200);
  // the dining room still has the bedroom's copy, and the bedroom's own pad still opens on the bedroom picture
  await t.ev(() => { const ch = CFG.UPSTAIRS.chair; T.tp(ch.x - 24, ch.y, 'upstairs'); });
  t.expectEq(await t.ev(() => T.label()), '✏️ Sit and draw', 'the bedroom desk still offers drawing');
  await t.ev(() => T.act());
  const bedPad = await padInk();
  t.expect(await t.ev(() => UpstairsExt.st.draw.slot === 'bedroom') && bedPad.blue > 50000 && bedPad.red === 0, 'the bedroom pad opens on the bedroom picture ' + JSON.stringify(bedPad));
  await t.page.click('#draw-done');
  t.expect(await t.ev(() => Game.s.upstairs.drawing === Game.s.upstairs.drawing && !UpstairsExt.st.draw.on), 'Done closes the bedroom pad');
  t.expect((await t.ev(() => Game.s.upstairs.drawing)) === blueUrl, 'the bedroom drawing is still the same');

  // ---- reload: both pictures persist, the office pad reopens with its picture
  await t.ev(() => Game.save());
  await t.reload();
  await load();
  const kept = await t.ev(() => ({ office: Game.s.hiredesk && Game.s.hiredesk.drawing, bedroom: Game.s.upstairs.drawing }));
  t.expect(kept.office === saved.office, 'the office picture persisted across reload');
  t.expect(kept.bedroom === blueUrl, 'the bedroom picture persisted, unchanged');
  await t.ev(() => { HireDeskExt.bgKey(Game); });
  await t.page.waitForFunction(() => UpstairsExt.arts.office && UpstairsExt.arts.office.ok, null, { timeout: 5000 });
  await t.ev((F) => { Render.setZoom(2); T.tp(F.x, F.y + 93, 'town'); Game.cameraSnap = true; T.step(3); }, H.frame);
  await t.wait(500);
  const redReload = await redSoon();
  t.expect(redReload > 60, 'the office frame still shows the picture after reload (' + redReload + ' red px)');
  await t.ev((c) => { T.tp(c.x, c.y, 'town'); T.act(); }, H.chair);
  t.expect(await t.page.isVisible('#modal-draw'), 'the pad reopens after reload');
  const re = await padInk();
  t.expect(re.red > 3000 && re.blue === 0, 'the pad reopens with the office picture on it ' + JSON.stringify(re));
  // Take me home while drawing: the pad closes
  await t.ev(() => { Game.goHome(); T.step(3); });
  t.expect(await t.ev(() => !UpstairsExt.st.draw.on) && !(await t.page.isVisible('#modal-draw')), 'Take me home closes the pad');
  const free = await t.ev(() => { const x = Game.player.x; T.steer(1, 0); T.step(20); T.unsteer(); T.step(2); return Game.player.x > x + 10; });
  t.expect(free, 'and the chef can walk');
};
