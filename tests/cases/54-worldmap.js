'use strict';
// World map (js/worldmap.js): a '🗺️ World map' button at the front of the help panel's button row opens a storybook
// map in its own modal (✕ closes it); every map (CFG.AREAS key) belongs to a place on it; the bouncing chef hat sits
// on the place the chef is in (interiors count as their outer place); tapping a place pops its speech bubble with how
// to get there (and never moves the chef); the map's animation loop runs only while it is open.
module.exports = async (t) => {
  // until the coordinator wires js/worldmap.js into index.html, serve the page with it added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/worldmap.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/worldmap.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();

  // ---- registered, and every map belongs to a place
  const reg = await t.ev(() => ({
    ok: typeof WorldMapExt !== 'undefined' && Game.ext.includes(WorldMapExt),
    unmapped: WorldMapExt.unmapped(),
    n: Object.keys(CFG.AREAS).length,
    places: Object.keys(CFG.WORLDMAP.PLACES),
    bad: Object.keys(CFG.AREAS).filter((k) => !CFG.WORLDMAP.PLACES[WorldMapExt.placeOf(k)]),
    table: Object.keys(CFG.AREAS).map((k) => k + '→' + WorldMapExt.placeOf(k)).join(' '),
  }));
  t.expect(reg.ok, 'the world map extension is registered');
  t.expect(reg.n > 40, 'the game has lots of maps');
  t.expectEq(reg.unmapped.join(','), '', 'every CFG.AREAS key maps to a place on the world map');
  t.expectEq(reg.bad.join(','), '', 'every area maps to a real place');
  console.log('    area → place: ' + reg.table);

  // ---- every route on the map is a real ride (Game.startTravel destinations), and each ride has its route
  const routes = await t.ev(() => CFG.WORLDMAP.ROUTES.map((r) => r.a + '-' + r.b + ':' + r.via));
  for (const r of ['town-site:train', 'site-snow:skilift', 'town-city:bus', 'city-campus:subway', 'town-islands:ferry', 'islands-moon:rocket', 'town-cloud:flight', 'city-pizzapier:pierline']) {
    t.expect(routes.includes(r), 'the map has the route ' + r);
  }

  // ---- the help panel: the World map button is first, before Take me home
  await t.page.click('#btn-help');
  const help = await t.ev(() => {
    const row = document.querySelector('#modal-help .help-actions'), first = row.querySelector('button');
    return { open: UI.open, first: first && first.id, text: first && first.textContent, home: row.querySelector('#btn-home') && first.compareDocumentPosition(row.querySelector('#btn-home')) & Node.DOCUMENT_POSITION_FOLLOWING };
  });
  t.expectEq(help.open, 'help', 'the help panel is open');
  t.expectEq(help.first, 'btn-worldmap', 'the World map button is the first button in the help row');
  t.expect(/World map/.test(help.text), 'the button says World map');
  t.expect(!!help.home, 'Take me home comes after it');
  await t.ev(() => document.getElementById('btn-worldmap').scrollIntoView({ block: 'center' }));
  await t.shot('help-1100');

  // ---- open the map: the modal shows, the help closes, input is off, the loop runs
  await t.page.click('#btn-worldmap');
  await t.wait(300);
  const open = await t.ev(() => ({
    open: UI.open, shown: !document.getElementById('modal-worldmap').classList.contains('hidden'),
    helpHidden: document.getElementById('modal-help').classList.contains('hidden'),
    input: Input.enabled, running: WorldMapExt.running, frames: WorldMapExt.frames,
    canvas: (() => { const c = document.querySelector('#modal-worldmap canvas'); return { w: c.clientWidth, h: c.clientHeight }; })(),
  }));
  t.expectEq(open.open, 'worldmap', 'the world map is the open modal');
  t.expect(open.shown, 'the world map modal is shown');
  t.expect(open.helpHidden, 'the help panel is hidden behind it');
  t.expect(!open.input, 'game input is off while the map is open');
  t.expect(open.running && open.frames > 3, 'the map animates while open');
  t.expect(open.canvas.w > 900 && open.canvas.h > 500, 'the map fills most of the modal on a desktop: ' + JSON.stringify(open.canvas));

  // ---- you are here: town by default
  const hereIn = async (area) => t.ev((a) => { Game.area = a; return WorldMapExt.here(Game); }, area);
  t.expectEq(await hereIn('town'), 'town', 'in town the hat is on Home Town');
  await t.shot('town-1100');

  // ---- tapping a place: a speech bubble, no teleport
  const tapPlace = async (key) => {
    const p = await t.ev((k) => { const s = WorldMapExt.spot(k), r = document.querySelector('#modal-worldmap canvas').getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; }, key);
    await t.page.mouse.click(p.x, p.y);
    await t.wait(350);
    return t.ev(() => ({ sel: WorldMapExt.sel && WorldMapExt.sel.kind + ':' + WorldMapExt.sel.key, lines: WorldMapExt.sel ? WorldMapExt.bubbleLines(Game, WorldMapExt.sel) : [], area: Game.area }));
  };
  let tap = await tapPlace('islands');
  t.expectEq(tap.sel, 'place:islands', 'tapping the Islands selects them');
  t.expect(/Islands/.test(tap.lines[0]) && /ferry/.test(tap.lines[1]), 'the bubble names the Islands and says take the ferry: ' + tap.lines.join(' | '));
  t.expectEq(tap.area, 'town', 'tapping a place does not move the chef');
  await t.shot('tap-islands-1100');
  tap = await tapPlace('city');
  t.expect(/bus/.test(tap.lines[1]), 'the City bubble says take the bus');
  tap = await tapPlace('moon');
  t.expect(/rocket/.test(tap.lines[1]), 'the Moon bubble says fly the rocket');
  t.expect(tap.lines.some((l) => /Not visited/.test(l)), 'the Moon is not visited yet on a fresh save');
  await t.shot('tap-moon-1100');
  // a sub-place icon answers too
  const sub = await t.ev(() => { const s = WorldMapExt.lay.subs.find((q) => q.place === 'site'); return s ? { x: s.x, y: s.y, i: s.i } : null; });
  t.expect(!!sub, 'Construction Town has little sub-place icons');
  {
    const r = await t.ev(() => { const r = document.querySelector('#modal-worldmap canvas').getBoundingClientRect(); return { x: r.left, y: r.top }; });
    await t.page.mouse.click(r.x + sub.x, r.y + sub.y); await t.wait(300);
    const s = await t.ev(() => WorldMapExt.sel && WorldMapExt.sel.kind + ':' + WorldMapExt.sel.key);
    t.expectEq(s, 'sub:site', 'tapping a sub-place icon selects it');
  }
  // tapping empty sea clears the bubble
  {
    const r = await t.ev(() => { const r = document.querySelector('#modal-worldmap canvas').getBoundingClientRect(); return { x: r.left + r.width * 0.72, y: r.top + r.height * 0.97 }; });
    await t.page.mouse.click(r.x, r.y); await t.wait(100);
    t.expect(await t.ev(() => WorldMapExt.sel === null), 'tapping empty map clears the bubble');
  }

  // ---- you are here in other maps and interiors
  const cases = { site: 'site', snow: 'snow', city: 'city', bakery: 'city', arcade: 'city', subway: 'city', moon: 'moon', mines: 'site', cocoacabin: 'snow', barn: 'town', upstairs: 'town', lighthouse: 'islands', skycafe: 'cloud', lowlibrary: 'campus', rocketinside: 'islands', jetcabin: 'town', pizzapier: 'pizzapier' };
  for (const [a, want] of Object.entries(cases)) t.expectEq(await hereIn(a), want, `in ${a} the hat is on ${want}`);
  await hereIn('bakery'); await t.wait(200); await t.shot('here-bakery-1100');
  await hereIn('moon'); await t.wait(200); await t.shot('here-moon-1100');
  await hereIn('town');

  // ---- visits are remembered: the game update marks the place the chef is in
  const seen = await t.ev(() => { T.tp(3300, 400, 'site'); T.step(2); const a = WorldMapExt.visited(Game, 'site'); T.tp(400, 400, 'town'); return a; });
  t.expect(seen, 'being in Construction Town marks it visited');

  // ---- close with ✕: the modal hides, input comes back, the loop stops
  await t.page.click('#modal-worldmap .wm-close');
  await t.wait(200);
  const closed = await t.ev(() => ({ open: UI.open, hidden: document.getElementById('modal-worldmap').classList.contains('hidden'), input: Input.enabled, running: WorldMapExt.running, raf: WorldMapExt.raf, f: WorldMapExt.frames }));
  t.expectEq(closed.open, null, 'nothing is open after ✕');
  t.expect(closed.hidden, 'the map modal is hidden');
  t.expect(closed.input, 'game input is back on');
  t.expect(!closed.running && closed.raf === null, 'the animation loop has stopped');
  await t.wait(300);
  t.expectEq(await t.ev(() => WorldMapExt.frames), closed.f, 'no more map frames are drawn after closing');

  // ---- Escape closes it too (and stops the loop)
  await t.ev(() => { UI.show('help'); WorldMapExt.open(); });
  await t.wait(150);
  await t.page.keyboard.press('Escape');
  await t.wait(150);
  t.expect(await t.ev(() => UI.open === null && !WorldMapExt.running), 'Escape closes the map and stops its loop');

  // ---- phone size
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.wait(200);
  await t.page.click('#btn-help');
  await t.wait(200);
  await t.ev(() => document.getElementById('btn-worldmap').scrollIntoView({ block: 'center' }));
  await t.shot('help-390');
  await t.page.click('#btn-worldmap');
  await t.wait(400);
  const ph = await t.ev(() => { const c = document.querySelector('#modal-worldmap canvas'), x = document.querySelector('#modal-worldmap .wm-close').getBoundingClientRect(); return { w: c.clientWidth, h: c.clientHeight, wide: WorldMapExt.lay.wide, closeIn: x.right <= innerWidth && x.top >= 0 }; });
  t.expect(ph.w > 340 && ph.h > 650, 'the map fills the phone screen: ' + JSON.stringify(ph));
  t.expect(!ph.wide, 'the phone gets the tall layout');
  t.expect(ph.closeIn, 'the ✕ is on screen');
  // every place and its label inside the canvas, and no two bubbles overlapping
  const fitOk = await t.ev(() => {
    const L = WorldMapExt.lay, out = [];
    const ps = Object.values(L.places);
    for (const p of ps) {
      if (p.x - L.R < 0 || p.x + L.R > L.W || p.y - L.R < 0 || p.label.y1 > L.H || p.label.x0 < 0 || p.label.x1 > L.W) out.push('out:' + p.key);
      for (const q of ps) if (q !== p && Math.hypot(p.x - q.x, p.y - q.y) < L.R * 2 + 8) out.push('overlap:' + p.key + '/' + q.key);
    }
    return out;
  });
  t.expectEq(fitOk.join(','), '', 'every place fits on the phone map without overlapping');
  await t.shot('town-390');
  tap = await tapPlace('campus');
  t.expect(/subway/.test(tap.lines[1]), 'the campus bubble says ride the subway');
  await t.shot('tap-campus-390');
  tap = await tapPlace('moon');
  await t.shot('tap-moon-390');
  await hereIn('moon'); await t.wait(200); await t.shot('here-moon-390');
  // the bouncing hat stays inside the map at its highest hop
  const hatTop = await t.ev(() => { const L = WorldMapExt.lay, p = L.places.moon, s = Math.min(24, Math.max(12, L.R * 0.44)); return p.y - L.R - s * 0.55 - L.R * 0.28 - s * 1.2; });
  t.expect(hatTop > 0, 'the chef hat over Pizza Moon stays on the phone map: ' + hatTop.toFixed(1));
  await hereIn('town');
  await t.page.click('#modal-worldmap .wm-close');
  await t.wait(150);
  t.expect(await t.ev(() => UI.open === null && !WorldMapExt.running), 'the phone map closes and stops');

  // the same fit check on the desktop
  await t.page.setViewportSize({ width: 1100, height: 720 });
  await t.ev(() => { UI.show('help'); WorldMapExt.open(); });
  await t.wait(300);
  const fitDesk = await t.ev(() => {
    const L = WorldMapExt.lay, out = [];
    const ps = Object.values(L.places);
    for (const p of ps) {
      if (p.x - L.R < 0 || p.x + L.R > L.W || p.y - L.R < 0 || p.label.y1 > L.H || p.label.x0 < 0 || p.label.x1 > L.W) out.push('out:' + p.key);
      for (const q of ps) if (q !== p && Math.hypot(p.x - q.x, p.y - q.y) < L.R * 2 + 8) out.push('overlap:' + p.key + '/' + q.key);
    }
    return { out, subs: L.subs.length, want: Object.values(CFG.WORLDMAP.PLACES).reduce((n, P) => n + P.subs.length, 0) };
  });
  t.expectEq(fitDesk.out.join(','), '', 'every place fits on the desktop map without overlapping');
  console.log(`    sub-place icons placed: ${fitDesk.subs} / ${fitDesk.want}`);
  await t.ev(() => WorldMapExt.close());
};
