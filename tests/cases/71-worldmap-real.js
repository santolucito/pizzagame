'use strict';
// The real world map (js/worldmap-real.js): two big tabs in the world map modal switch between the storybook map and
// the real maps of every outdoor place (drawn the way the game draws them, once each, cached), laid out side by side
// at one scale with a line for each ride. Checked here: the tabs switch views and the storybook still works; every
// outdoor place is drawn exactly once, at the same scale, with no overlaps; every ride has a line going its `dir`,
// from where the ride really leaves; the chef hat is on the chef's place (at the door from an interior); drag, wheel,
// pinch and the ➕ ➖ 🌍 buttons; drawing the maps never changes the game (area, player, camera, zoom, money, save) and
// the game draws normally after; the second open draws nothing again; a frame is cheap; a new map with a ride appears.
module.exports = async (t) => {
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();

  // ---- loaded, with its tabs in the world map modal; the picture map is the default
  const reg = await t.ev(() => ({
    ok: typeof WorldMapReal !== 'undefined' && !!WorldMapReal.dom,
    tabs: [...document.querySelectorAll('#modal-worldmap .wmr-tab')].map((b) => b.textContent),
    mode: WorldMapReal.mode, notExt: !Game.ext.includes(WorldMapReal) && !Render.ext.includes(WorldMapReal),
  }));
  t.expect(reg.ok, 'the real map view is built');
  t.expectEq(reg.tabs.join(' | '), '🫧 Picture map | 🛰️ Real map', 'two big tabs');
  t.expectEq(reg.mode, 'picture', 'the picture map comes first');
  t.expect(reg.notExt, 'it is not a game extension (it changes nothing in the game)');

  // ---- open the world map: the storybook shows
  await t.page.click('#btn-help');
  await t.page.click('#btn-worldmap');
  await t.wait(200);
  const vis = () => t.ev(() => ({
    story: getComputedStyle(WorldMapExt.dom.canvas).display !== 'none' && WorldMapExt.dom.canvas.clientWidth > 100,
    real: getComputedStyle(WorldMapReal.dom.wrap).display !== 'none' && WorldMapReal.dom.canvas.clientWidth > 100,
    storyRun: WorldMapExt.running, realRun: WorldMapReal.running, open: UI.open,
    on: [...document.querySelectorAll('.wmr-tab.on')].map((b) => b.dataset.view).join(','),
  }));
  let v = await vis();
  t.expect(v.story && !v.real && v.storyRun && !v.realRun && v.on === 'picture', 'the picture map is open: ' + JSON.stringify(v));

  // ---- the real map tab: placeholders at once, then the maps are drawn a few per frame
  await t.page.click('.wmr-tab[data-view="real"]');
  const first = await t.ev(() => ({ queue: WorldMapReal.queue.length, renders: WorldMapReal.renders, stored: localStorage.getItem(CFG.WORLDMAP_REAL.STORE_KEY) }));
  t.expect(first.queue > 0, 'the maps are drawn after the view opens (progressively): ' + JSON.stringify(first));
  t.expectEq(first.stored, 'real', 'the choice is remembered');
  await t.page.waitForFunction(() => !WorldMapReal.queue.length && WorldMapReal.places().every((k) => WorldMapReal.ready(k)), null, { timeout: 15000 });
  v = await vis();
  t.expect(!v.story && v.real && !v.storyRun && v.realRun && v.on === 'real', 'the real map is open, the storybook loop is stopped: ' + JSON.stringify(v));
  const drawn = await t.ev(() => ({ renders: WorldMapReal.renders, ms: Math.round(WorldMapReal.renderMs), errors: WorldMapReal.errors, cache: Object.keys(WorldMapReal.cache).sort(), places: WorldMapExt.places().slice().sort(), res: WorldMapReal.res(), px: Object.values(WorldMapReal.cache).reduce((n, c) => n + c.w * c.h, 0), maxW: Math.max(...Object.values(WorldMapReal.cache).map((c) => c.w)) }));
  console.log(`    drew ${drawn.renders} maps in ${drawn.ms} ms at ${drawn.res.toFixed(3)} px/unit, ${(drawn.px / 1e6).toFixed(1)} Mpx, widest ${drawn.maxW} px`);
  t.expectEq(drawn.cache.join(','), drawn.places.join(','), 'every outdoor place of the world map has its real map');
  t.expectEq(drawn.renders, drawn.places.length, 'each place drawn exactly once');
  t.expectEq(drawn.errors.join(' | '), '', 'no drawing hook threw');
  t.expect(drawn.maxW >= 1000 && drawn.maxW <= 1700 && drawn.px < 8e6, 'modest resolution and memory');
  await t.shot('fitted');

  // ---- the layout: the same scale, no overlaps, a line per ride going its way, from where the ride really leaves
  const L = await t.ev(() => {
    const lay = WorldMapReal.layout(), P = lay.places, keys = Object.keys(P), bad = [];
    for (const k of keys) { const W = CFG.AREAS[k].WORLD; if (Math.abs((P[k].x1 - P[k].x0) - (W.x1 - W.x0)) > 0.01 || Math.abs((P[k].y1 - P[k].y0) - (W.y1 - W.y0)) > 0.01) bad.push('scale ' + k); }
    const gap = lay.G * 0.5;
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) { const a = P[keys[i]], b = P[keys[j]]; if (a.x0 < b.x1 + gap && a.x1 > b.x0 - gap && a.y0 < b.y1 + gap && a.y1 > b.y0 - gap) bad.push('overlap ' + keys[i] + '/' + keys[j]); }
    const onEdge = (r, p) => p.x >= r.x0 - 0.5 && p.x <= r.x1 + 0.5 && p.y >= r.y0 - 0.5 && p.y <= r.y1 + 0.5 && Math.min(Math.abs(p.x - r.x0), Math.abs(p.x - r.x1), Math.abs(p.y - r.y0), Math.abs(p.y - r.y1)) < 0.5;
    const routes = lay.routes.map((r) => {
      const [dx, dy] = WorldMapExt.dirVec(r.dir), vx = r.b.x - r.a.x, vy = r.b.y - r.a.y, len = Math.hypot(vx, vy);
      return { id: r.from + '>' + r.to + ':' + r.via, cos: (vx * dx + vy * dy) / len, len, edges: onEdge(P[r.from], r.a) && onEdge(P[r.to], r.b), spots: r.sa.found && r.sb.found, sa: r.sa.path, sb: r.sb.path, ico: r.r.ico };
    });
    return { bad, routes, links: WorldMapExt.links().map((l) => l.from + '>' + l.to + ':' + l.via), G: lay.G, W: lay.W, H: lay.H };
  });
  t.expectEq(L.bad.join(', '), '', 'every map at the real scale and none overlapping');
  t.expectEq(L.routes.map((r) => r.id).sort().join(' '), L.links.slice().sort().join(' '), 'every ride (CFG.LINKS) has a line');
  for (const r of L.routes) {
    t.expect(r.cos >= Math.cos(40 * Math.PI / 180), `the ${r.id} line goes its way (cos ${r.cos.toFixed(2)})`);
    t.expect(r.edges, `the ${r.id} line runs from map edge to map edge`);
    t.expect(r.len >= L.G * 0.9, `the ${r.id} line has room for its vehicle`);
    t.expect(r.spots, `the ${r.id} line leaves from where the ride really does (${r.sa} → ${r.sb})`);
  }
  console.log('    rides: ' + L.routes.map((r) => `${r.ico} ${r.id} (${r.sa.replace('CFG.', '')} → ${r.sb.replace('CFG.', '')})`).join(', '));
  t.expect(L.routes.find((r) => r.id === 'town>site:train').sa === 'CFG.STATION.platform', 'the train leaves from the town station');

  // ---- every place drawn exactly once per frame (when all are in view), from its cached picture
  const frame = await t.ev(() => {
    WorldMapReal.anim = null; WorldMapReal.view = WorldMapReal.fitView();
    const ctx = WorldMapReal.dom.canvas.getContext('2d'), orig = ctx.drawImage, seen = new Map();
    ctx.drawImage = function (img) { seen.set(img, (seen.get(img) || 0) + 1); return orig.apply(this, arguments); };
    try { WorldMapReal.draw(0); } finally { delete ctx.drawImage; }
    const per = Object.entries(WorldMapReal.cache).map(([k, c]) => k + ':' + (seen.get(c.canvas) || 0));
    // and the cost of a frame
    const t0 = performance.now(); for (let i = 0; i < 40; i++) WorldMapReal.draw(1 / 60); const ms = (performance.now() - t0) / 40;
    return { per, ms };
  });
  t.expect(frame.per.every((s) => s.endsWith(':1')), 'each place drawn once a frame: ' + frame.per.join(' '));
  console.log(`    a frame of the open view: ${frame.ms.toFixed(2)} ms`);
  t.expect(frame.ms < 12, 'a frame of the open view is cheap: ' + frame.ms.toFixed(2) + ' ms');

  // ---- the chef hat: on the chef in Home Town
  const hat = await t.ev(() => { const s = WorldMapReal.chefSpot(), r = WorldMapReal.layout().places[s.place]; return { s, inside: s.x >= r.x0 && s.x <= r.x1 && s.y >= r.y0 && s.y <= r.y1, px: Game.player.x - CFG.AREAS.town.WORLD.x0 + r.x0 }; });
  t.expect(hat.s.place === 'town' && hat.s.how === 'chef' && hat.inside && Math.abs(hat.s.x - hat.px) < 0.01, 'the hat is on the chef in Home Town: ' + JSON.stringify(hat.s));

  // ---- pan and zoom: drag, wheel, the buttons, a pinch, tap a map to zoom in and again to zoom out
  const box = await t.ev(() => { const r = WorldMapReal.dom.canvas.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const view = () => t.ev(() => Object.assign({}, WorldMapReal.view));
  const fitS = await t.ev(() => WorldMapReal.fitView().s);
  let v0 = await view();
  await t.page.mouse.move(box.x + box.w * 0.5, box.y + box.h * 0.5);
  await t.page.mouse.down();
  await t.page.mouse.move(box.x + box.w * 0.5 - 120, box.y + box.h * 0.5 - 60, { steps: 6 });
  await t.page.mouse.up();
  let v1 = await view();
  t.expect(Math.abs((v1.x - v0.x) * v1.s - 120) < 2 && Math.abs((v1.y - v0.y) * v1.s - 60) < 2 && v1.s === v0.s, 'dragging pans the map: ' + JSON.stringify([v0, v1]));
  await t.page.mouse.move(box.x + box.w * 0.4, box.y + box.h * 0.5);
  await t.page.mouse.wheel(0, -300); await t.wait(150);
  v0 = v1; v1 = await view();
  t.expect(v1.s > v0.s * 1.3, 'the mouse wheel zooms in: ' + v0.s.toFixed(4) + ' → ' + v1.s.toFixed(4));
  await t.page.click('.wmr-zoom button[data-z="out"]'); await t.wait(700);
  v0 = v1; v1 = await view();
  t.expect(v1.s < v0.s * 0.8, '➖ zooms out');
  await t.page.click('.wmr-zoom button[data-z="in"]'); await t.wait(700);
  v0 = v1; v1 = await view();
  t.expect(v1.s > v0.s * 1.3, '➕ zooms in');
  await t.page.click('.wmr-zoom button[data-z="fit"]'); await t.wait(700);
  v1 = await view();
  t.expect(Math.abs(v1.s / fitS - 1) < 0.01, '🌍 shows the whole world again');
  // a two-finger pinch (touch pointers)
  const pinch = await t.ev(() => {
    const c = WorldMapReal.dom.canvas, r = c.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, s0 = WorldMapReal.view.s;
    const ev = (type, id, x, y) => c.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, cancelable: true }));
    ev('pointerdown', 11, cx - 40, cy); ev('pointerdown', 12, cx + 40, cy);
    for (let i = 1; i <= 5; i++) { ev('pointermove', 11, cx - 40 - i * 16, cy); ev('pointermove', 12, cx + 40 + i * 16, cy); }
    ev('pointerup', 11, cx - 120, cy); ev('pointerup', 12, cx + 120, cy);
    return { s0, s1: WorldMapReal.view.s, ptrs: WorldMapReal.ptrs.size };
  });
  t.expect(pinch.s1 > pinch.s0 * 2.5 && pinch.ptrs === 0, 'pinching zooms in: ' + JSON.stringify(pinch));
  await t.page.click('.wmr-zoom button[data-z="fit"]'); await t.wait(700);
  // tap Home Town: zoom right into it
  const town = await t.ev(() => { const r = WorldMapReal.layout().places.town, v = WorldMapReal.view, b = WorldMapReal.dom.canvas.getBoundingClientRect(); return { x: b.left + ((r.x0 + r.x1) / 2 - v.x) * v.s, y: b.top + ((r.y0 * 0.4 + r.y1 * 0.6) - v.y) * v.s, s: WorldMapReal.fitView(r).s }; });
  const before = await t.ev(() => ({ area: Game.area, x: Game.player.x, y: Game.player.y }));
  await t.page.mouse.click(town.x, town.y); await t.wait(800);
  v1 = await view();
  t.expect(Math.abs(v1.s / town.s - 1) < 0.02, 'tapping Home Town zooms into it');
  const after = await t.ev(() => ({ area: Game.area, x: Game.player.x, y: Game.player.y, travel: !!Game.travel }));
  t.expect(after.area === before.area && after.x === before.x && after.y === before.y && !after.travel, 'tapping a map never moves the chef (no fast travel)');
  await t.shot('hometown');
  await t.page.mouse.click(town.x, town.y); await t.wait(800);
  v1 = await view();
  t.expect(Math.abs(v1.s / fitS - 1) < 0.01, 'tapping it again shows the whole world');

  // ---- drawing the maps never changes the game
  const quiet = await t.ev(() => {
    const snap = () => ({
      area: Game.area, px: Game.player.x, py: Game.player.y, camX: Render.camX, camY: Render.camY, zoom: Render.zoom, scale: Render.scale, viewW: Render.viewW, viewH: Render.viewH, dpr: Render.dpr,
      ctx: Render.ctx === Render.canvas.getContext('2d'), ext: Render.ext.length, gext: Game.ext.length, own: Object.prototype.hasOwnProperty.call(Render, 'drawPlayer'), cash: Game.s.cash,
      s: JSON.stringify(Game.s), save: localStorage.getItem(CFG.SAVE_KEY), toasts: T.toasts.length, floats: Game.floats.length, travel: !!Game.travel, snap: Game.cameraSnap,
      atm: typeof AtmosphereExt !== 'undefined' ? AtmosphereExt.phase + AtmosphereExt.dusk : '', floor: typeof CityExt !== 'undefined' ? CityExt.floor : null,
    });
    if (typeof AtmosphereExt !== 'undefined') AtmosphereExt.force({ phase: 'dusk', weather: 'rain' });   // and the pictures are still in daylight
    const ext0 = Render.ext, dp = Render.drawPlayer;
    const a = snap();
    WorldMapReal.cache = {}; WorldMapReal.renderAll();
    const b = snap(), diff = Object.keys(a).filter((k) => a[k] !== b[k]);
    return { diff, same: Render.ext === ext0 && Render.drawPlayer === dp, errors: WorldMapReal.errors.slice() };
  });
  t.expectEq(quiet.diff.join(','), '', 'drawing every map changes nothing in the game (area, player, camera, zoom, money, save, toasts)');
  t.expect(quiet.same, 'the renderer\'s hooks are put back');
  t.expectEq(quiet.errors.join(' | '), '', 'no hook threw while drawing at dusk in the rain');

  // ---- the chef in another place, and inside an interior (the hat at its door)
  const where = await t.ev(() => {
    const out = {};
    const W = CFG.AREAS.islands.WORLD; T.tp(CFG.ISLANDS.FERRY.x, CFG.ISLANDS.FERRY.y + 60, 'islands');
    out.islands = WorldMapReal.chefSpot();
    const B = CFG.AREAS.bakery.WORLD; T.tp((B.x0 + B.x1) / 2, (B.y0 + B.y1) / 2, 'bakery');
    out.bakery = WorldMapReal.chefSpot();
    const doors = WorldMapExt.doorSpots('bakery', WorldMapExt.cfgIndex()), C = WorldMapReal.layout().places.city;
    out.bakeryDoor = doors.some((d) => Math.abs(C.x0 + d.x - C.W.x0 - out.bakery.x) < 0.01 && Math.abs(C.y0 + d.y - C.W.y0 - out.bakery.y) < 0.01);
    const U2 = CFG.AREAS.upstairs.WORLD; T.tp((U2.x0 + U2.x1) / 2, (U2.y0 + U2.y1) / 2, 'upstairs');
    out.upstairs = WorldMapReal.chefSpot();
    return out;
  });
  t.expect(where.islands.place === 'islands' && where.islands.how === 'chef', 'the hat follows the chef to the Islands');
  t.expect(where.bakery.place === 'city' && where.bakery.how === 'door' && where.bakeryDoor, 'in the bakery the hat sits at its door in the City: ' + JSON.stringify(where.bakery));
  t.expect(where.upstairs.place === 'town' && where.upstairs.how !== 'chef', 'upstairs the hat is in Home Town: ' + JSON.stringify(where.upstairs));
  await t.ev(() => { T.tp(CFG.ISLANDS.FERRY.x, CFG.ISLANDS.FERRY.y + 60, 'islands'); WorldMapReal.anim = null; WorldMapReal.view = WorldMapReal.fitView(); });
  await t.shot('chef-islands');

  // ---- close: the loop stops, the game draws normally
  await t.page.click('#modal-worldmap .wm-close');
  await t.wait(300);
  const closed = await t.ev(() => ({ run: WorldMapReal.running, story: WorldMapExt.running, open: UI.open }));
  t.expect(!closed.run && !closed.story && !closed.open, 'closing stops both maps: ' + JSON.stringify(closed));
  await t.ev(() => { T.tp(400, 760, 'town'); });
  await t.wait(500);
  const game = await t.ev(() => {
    const c = Render.canvas, x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data, cols = new Set();
    for (let i = 0; i < d.length; i += 4 * 997) cols.add((d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4));
    return { area: Game.area, cols: cols.size, key: Render.bgs.town && Render.bgs.town.key, ctx: Render.ctx === c.getContext('2d') };
  });
  t.expect(game.area === 'town' && game.cols > 12 && game.key && game.ctx, 'the game keeps drawing Home Town normally: ' + JSON.stringify(game));

  // ---- the second open: nothing drawn again (cached); the real view comes back by itself
  await t.page.click('#btn-help');
  await t.page.click('#btn-worldmap');
  const reopen = await t.ev(() => new Promise((res) => { const r0 = WorldMapReal.renders, t0 = performance.now(); requestAnimationFrame(() => requestAnimationFrame(() => res({ dr: WorldMapReal.renders - r0, queue: WorldMapReal.queue.length, ms: performance.now() - t0, run: WorldMapReal.running, story: WorldMapExt.running }))); }));
  t.expect(reopen.dr === 0 && reopen.queue === 0 && reopen.run && !reopen.story, 'the second open shows the cached maps at once: ' + JSON.stringify(reopen));
  await t.page.click('.wmr-tab[data-view="picture"]');
  await t.wait(300);
  // the storybook still works: tap a place for its bubble
  const sp = await t.ev(() => { const s = WorldMapExt.spot('city'), r = WorldMapExt.dom.canvas.getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y, frames: WorldMapExt.frames }; });
  await t.page.mouse.click(sp.x, sp.y); await t.wait(300);
  const story = await t.ev(() => ({ sel: WorldMapExt.sel && WorldMapExt.sel.key, frames: WorldMapExt.frames, real: WorldMapReal.running, mode: localStorage.getItem(CFG.WORLDMAP_REAL.STORE_KEY) }));
  t.expect(story.sel === 'city' && story.frames > sp.frames && !story.real && story.mode === 'picture', 'back on the picture map, tapping a place still pops its bubble: ' + JSON.stringify(story));
  await t.page.click('#modal-worldmap .wm-close');

  // ---- remembered across a reload
  await t.ev(() => localStorage.setItem(CFG.WORLDMAP_REAL.STORE_KEY, 'real'));
  await t.reload();
  await t.ev(() => WorldMapExt.open());
  await t.wait(200);
  v = await vis();
  t.expect(v.real && !v.story && v.realRun, 'the real map opens again after a reload when it was picked last');
  await t.ev(() => WorldMapExt.close());

  // ---- a new outdoor map with a ride just appears (generated, nothing placed by hand)
  const added = await t.ev(() => {
    CFG.AREAS.testland = { WORLD: { x0: 60000, y0: 60000, x1: 61200, y1: 60900 } };
    CFG.LINKS.push({ from: 'site', to: 'testland', via: 'zipline', dir: 'down' });
    const lay = WorldMapReal.layout(), P = lay.places, r = lay.routes.find((q) => q.via === 'zipline'), keys = Object.keys(P), bad = [];
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) { const a = P[keys[i]], b = P[keys[j]]; if (a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0) bad.push(keys[i] + '/' + keys[j]); }
    const ms = WorldMapReal.renderPlace('testland');
    const out = { has: !!P.testland, r: !!r, down: r ? (r.b.y - r.a.y) / Math.hypot(r.b.x - r.a.x, r.b.y - r.a.y) : 0, bad, ok: WorldMapReal.ready('testland'), ms };
    CFG.LINKS.pop(); delete CFG.AREAS.testland; delete WorldMapReal.cache.testland;
    return out;
  });
  t.expect(added.has && added.r && added.down > 0.8 && !added.bad.length && added.ok, 'a new map with a ride appears below Construction Town: ' + JSON.stringify(added));

  // ---- the phone: fitted, zoomed into Home Town, the chef elsewhere
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.ev(() => { T.tp(CFG.CITY.STOP.x, CFG.CITY.STOP.y + 40, 'city'); WorldMapExt.open(); });
  await t.page.waitForFunction(() => WorldMapReal.running && !WorldMapReal.queue.length && WorldMapReal.places().every((k) => WorldMapReal.ready(k)), null, { timeout: 15000 });
  await t.wait(200);
  const ph = await t.ev(() => { const c = WorldMapReal.dom.canvas, b = c.getBoundingClientRect(), z = document.querySelector('.wmr-zoom button').getBoundingClientRect(), tab = document.querySelector('.wmr-tab').getBoundingClientRect(); return { w: c.clientWidth, h: c.clientHeight, in: b.right <= innerWidth && b.bottom <= innerHeight, btn: z.width, tab: tab.height, place: WorldMapReal.chefSpot().place }; });
  t.expect(ph.w > 340 && ph.h > 500 && ph.in, 'the real map fills the phone screen: ' + JSON.stringify(ph));
  t.expect(ph.btn >= 48 && ph.tab >= 40, 'big buttons and tabs on a phone');
  t.expectEq(ph.place, 'city', 'the hat is in the City');
  await t.shot('phone-fitted');
  // one finger drags the map
  const pv0 = await view();
  await t.ev(() => {
    const c = WorldMapReal.dom.canvas, r = c.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const ev = (type, px, py) => c.dispatchEvent(new PointerEvent(type, { pointerId: 21, pointerType: 'touch', clientX: px, clientY: py, bubbles: true, cancelable: true }));
    ev('pointerdown', x, y); for (let i = 1; i <= 5; i++) ev('pointermove', x + i * 12, y + i * 6); ev('pointerup', x + 60, y + 30);
  });
  const pv1 = await view();
  t.expect(Math.abs((pv0.x - pv1.x) * pv1.s - 60) < 2, 'one finger pans the map on a phone');
  const pt = await t.ev(() => { const r = WorldMapReal.layout().places.town, v = WorldMapReal.view, b = WorldMapReal.dom.canvas.getBoundingClientRect(); return { x: b.left + ((r.x0 + r.x1) / 2 - v.x) * v.s, y: b.top + ((r.y0 + r.y1) / 2 - v.y) * v.s }; });
  await t.page.mouse.click(pt.x, pt.y); await t.wait(800);
  t.expect(await t.ev(() => WorldMapReal.view.s > WorldMapReal.fitView().s * 2), 'tapping Home Town zooms into it on a phone');
  await t.shot('phone-hometown');
  await t.ev(() => WorldMapExt.close());
};
