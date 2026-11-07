'use strict';
// World map (js/worldmap.js): a '🗺️ World map' button at the front of the help panel's button row opens a storybook
// map in its own modal (✕ closes it); every map (CFG.AREAS key) belongs to a place on it; the bouncing chef hat sits
// on the place the chef is in (interiors count as their outer place); tapping a place pops its speech bubble with how
// to get there (and never moves the chef); the map's animation loop runs only while it is open.
// The map is generated from data: the places are the maps CFG.LINKS reaches, interiors find their place from their
// own `place`, their door, or the old table; the rides in CFG.LINKS must match every Game.startTravel( call in js/
// (grepped here); the layout puts each place in its ride's direction with nothing overlapping on wide and tall
// canvases; and a new place, ride and interiors added at run time show up without any hand edits.
module.exports = async (t) => {
  // until the coordinator wires js/worldmap.js into index.html, serve the page with it added
  await t.page.route(/^http:\/\/127\.0\.0\.1:\d+\/(index\.html)?(\?.*)?$/, async (route) => {
    const resp = await route.fetch(); let body = await resp.text();
    if (!body.includes('js/worldmap.js')) body = body.replace('<script src="js/main.js"></script>', '<script src="js/worldmap.js"></script>\n  <script src="js/main.js"></script>');
    await route.fulfill({ response: resp, body, headers: Object.assign({}, resp.headers(), { 'content-type': 'text/html' }) });
  });
  await t.page.addInitScript(() => { try { navigator.serviceWorker.register = () => Promise.resolve(); } catch (e) { /* none */ } });
  await t.boot();

  // ---- registered, and every map belongs to a place (generated: the map's own `place`, its door, or the old table)
  const reg = await t.ev(() => ({
    ok: typeof WorldMapExt !== 'undefined' && Game.ext.includes(WorldMapExt),
    unmapped: WorldMapExt.unmapped(),
    n: Object.keys(CFG.AREAS).length,
    places: WorldMapExt.places(),
    bad: Object.keys(CFG.AREAS).filter((k) => !WorldMapExt.places().includes(WorldMapExt.placeOf(k))),
    table: Object.keys(CFG.AREAS).map((k) => k + '→' + WorldMapExt.placeOf(k) + '(' + WorldMapExt.mappedBy(k) + ')').join(' '),
    legacy: Object.keys(CFG.AREAS).filter((k) => WorldMapExt.mappedBy(k) === 'legacy'),
  }));
  t.expect(reg.ok, 'the world map extension is registered');
  t.expect(reg.n > 40, 'the game has lots of maps');
  t.expectEq(reg.unmapped.join(','), '', 'every CFG.AREAS key maps to a place on the world map');
  t.expectEq(reg.bad.join(','), '', 'every area maps to a real place');
  t.expectEq(reg.places.slice().sort().join(','), 'campus,city,cloud,islands,moon,pizzapier,site,snow,town', 'the places are the outdoor maps the rides reach');
  console.log('    area → place (how): ' + reg.table);
  console.log('    still from the old hand table: ' + (reg.legacy.join(', ') || 'none'));
  // the membership the old hand table had is what the procedure finds
  const want = { town: 'town', upstairs: 'town', barn: 'town', firestation: 'town', cabin: 'town', afterminal: 'town', afhangar: 'town', pizzarain: 'town', mines: 'site', diner: 'site', hardware: 'site', cocoacabin: 'snow', bakery: 'city', aquarium: 'city', subway: 'city', lowlibrary: 'campus', barnardhall: 'campus', lighthouse: 'islands', beachhut: 'islands', rocketinside: 'islands', skycafe: 'cloud', moon: 'moon', pizzapier: 'pizzapier' };
  const got = await t.ev((w) => Object.keys(w).map((k) => k + '→' + WorldMapExt.placeOf(k)).join(' '), want);
  t.expectEq(got, Object.entries(want).map(([k, v]) => k + '→' + v).join(' '), 'interiors land in the right places');
  const fromDoors = await t.ev(() => ['barn', 'bakery', 'mines', 'diner', 'cocoacabin', 'lighthouse', 'lowlibrary', 'afterminal', 'skycafe', 'pizzarain'].filter((k) => WorldMapExt.mappedBy(k) !== 'door' && WorldMapExt.mappedBy(k) !== 'place'));
  t.expectEq(fromDoors.join(','), '', 'interiors with door data are placed from their doors, not the old table');

  // ---- the rides: CFG.LINKS matches every Game.startTravel( call in js/
  {
    const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', '..', 'js'), calls = [];
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      const re = /startTravel\(([^;]*?)\)\s*[;}]/g; let m;
      while ((m = re.exec(src))) {
        if (/startTravel\(to, via = /.test(m[0])) continue;   // the definition in game.js
        // split the arguments at top-level commas
        const args = []; let depth = 0, cur = '';
        for (const ch of m[1]) { if (ch === '(' || ch === '[') depth++; if (ch === ')' || ch === ']') depth--; if (ch === ',' && depth === 0) { args.push(cur.trim()); cur = ''; } else cur += ch; }
        args.push(cur.trim());
        const via = args[1] ? (args[1].match(/^'([^']+)'$/) || [])[1] : 'train';
        const tos = (args[0].match(/'([^']+)'/g) || []).map((q) => q.slice(1, -1));
        calls.push({ file: f, via, tos, src: m[0].slice(0, 80) });
      }
    }
    t.expect(calls.length >= 9, 'found the startTravel calls in js/: ' + calls.length);
    t.expectEq(calls.filter((c) => !c.via).map((c) => c.file + ': ' + c.src).join(' | '), '', 'every startTravel names its ride kind');
    const res = await t.ev((calls) => {
      const L = WorldMapExt.links(), bad = [];
      for (const c of calls) {
        const ls = L.filter((l) => l.via === c.via);
        if (!ls.length) { bad.push('no link for ' + c.via + ' (' + c.file + ')'); continue; }
        for (const to of c.tos) { const p = WorldMapExt.placeOf(to); if (!ls.some((l) => l.from === p || l.to === p)) bad.push(c.via + ' to ' + to + ' (' + p + ') is not on its link'); }
      }
      for (const l of L) if (!calls.some((c) => c.via === l.via)) bad.push('the link ' + l.via + ' has no startTravel');
      for (const l of CFG.LINKS) if (!CFG.AREAS[l.from] || !CFG.AREAS[l.to] || !WorldMapExt.dirVec(l.dir)) bad.push('bad link ' + JSON.stringify(l));
      return { bad, links: L.map((l) => l.from + '-' + l.to + ':' + l.via + ':' + l.dir) };
    }, calls);
    t.expectEq(res.bad.join(' | '), '', 'the links and the startTravel calls agree');
    console.log('    links: ' + res.links.join(' '));
    for (const r of ['town-site:train:right', 'site-snow:skilift:up', 'town-city:bus:left', 'city-campus:subway:up', 'town-islands:ferry:down-left', 'islands-moon:rocket:up', 'town-cloud:flight:up-right', 'city-pizzapier:pierline:left']) {
      t.expect(res.links.includes(r), 'the map has the ride ' + r);
    }
  }
  t.expect(await t.ev(() => WorldMapExt.place('pizzapier').name === 'Coney Island' && /orange D train/.test(WorldMapExt.place('pizzapier').how) && CFG.WORLDMAP.RIDES.pierline.col === '#ff6319'), 'the park is Coney Island, reached by the orange D train');

  // ---- the generated layout, on a wide and a tall canvas: each ride goes its way, no overlaps, all on the canvas
  const layoutCheck = (sz) => t.ev(([W, H]) => {
    const c = document.createElement('canvas').getContext('2d'), L = WorldMapExt.layout(W, H, c), P = L.places, out = [];
    for (const l of WorldMapExt.links()) {
      const a = P[l.from], b = P[l.to], [dx, dy] = WorldMapExt.dirVec(l.dir);
      if (dx > 0.3 && !(b.x > a.x + 4)) out.push(l.via + ' should go right');
      if (dx < -0.3 && !(b.x < a.x - 4)) out.push(l.via + ' should go left');
      if (dy < -0.3 && !(b.y < a.y - 4)) out.push(l.via + ' should go up');
      if (dy > 0.3 && !(b.y > a.y + 4)) out.push(l.via + ' should go down');
    }
    const ps = Object.values(P);
    for (const p of ps) {
      if (p.x - L.R < 0 || p.x + L.R > L.W || p.y - L.R - WorldMapExt.hatRoom(L.R) < 0 || p.label.y1 > L.H || p.label.x0 < 0 || p.label.x1 > L.W) out.push('out:' + p.key);
      for (const q of ps) {
        if (q === p) continue;
        if (Math.hypot(p.x - q.x, p.y - q.y) < L.R * 2 + 8) out.push('overlap:' + p.key + '/' + q.key);
        const a = p.label, b = q.label;
        if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) out.push('labels:' + p.key + '/' + q.key);
        if (Math.hypot(Math.max(a.x0 - q.x, 0, q.x - a.x1), Math.max(a.y0 - q.y, 0, q.y - a.y1)) < L.R) out.push('label-on-bubble:' + p.key + '/' + q.key);
      }
    }
    // the scenery: seaside places in the sea, space places in their starry patch, the snowy place has mountains
    const S = L.scene;
    for (const p of ps) {
      if ((p.scene === 'sea' || p.scene === 'shore') && !(p.y > S.seaTop - L.R)) out.push('not by the sea:' + p.key);
      if (p.scene !== 'sea' && p.scene !== 'shore' && p.label.y1 > S.seaTop + 8) out.push('in the sea:' + p.key);
      if (p.scene === 'space' && !S.spaces.some((q) => q.key === p.key)) out.push('no space:' + p.key);
    }
    if (!S.mountains.length || !S.hills.length || !S.skies.length) out.push('scenery missing');
    return { out, pos: Object.fromEntries(ps.map((p) => [p.key, [Math.round(p.x), Math.round(p.y)]])), subs: L.subs.length, decor: L.decor.map((d) => d[0]).join('') };
  }, sz);
  for (const sz of [[1036, 582], [378, 766], [1300, 700], [700, 900]]) {
    const r = await layoutCheck(sz);
    t.expectEq(r.out.join(', '), '', `the generated layout at ${sz.join('×')} is tidy (${JSON.stringify(r.pos)})`);
    const p = r.pos;
    t.expect(p.site[0] > p.town[0] && p.city[0] < p.town[0] && p.islands[0] < p.town[0] && p.islands[1] > p.town[1] && p.cloud[1] < p.town[1] && p.cloud[0] > p.town[0], 'rides point the right way at ' + sz.join('×') + ': ' + JSON.stringify(p));
    t.expect(p.snow[1] < p.site[1] && p.moon[1] < p.islands[1] && p.campus[1] < p.city[1] && p.pizzapier[0] < p.city[0], 'the second-step places too at ' + sz.join('×'));
    console.log(`    ${sz.join('×')}: ${JSON.stringify(p)} subs ${r.subs} decor ${r.decor}`);
  }

  // ---- a new place, a new ride and new interiors appear without hand edits
  const added = await t.ev(() => {
    CFG.AREAS.wmtestvolcano = { WORLD: { x0: 90000, y0: 0, x1: 91000, y1: 800 } };
    CFG.AREAS.wmtesthut = { WORLD: { x0: 92000, y0: 0, x1: 92600, y1: 400 }, place: 'cloud' };              // names its place
    CFG.WMTESTSHOP = { WORLD: { x0: 93000, y0: 0, x1: 93600, y1: 400 }, DOOR_OUT: { x: 5300, y: 14 }, toast: '🦖 Welcome to the dino shop!' };
    CFG.AREAS.wmtestshop = { WORLD: CFG.WMTESTSHOP.WORLD };                                               // a door in the City
    CFG.AREAS.wmtestcave = { WORLD: { x0: 94000, y0: 0, x1: 94600, y1: 400 }, place: 'wmtestvolcano' };   // inside the new place
    CFG.LINKS.push({ from: 'site', to: 'wmtestvolcano', via: 'wmtestcart', dir: 'down' });
    const c = document.createElement('canvas').getContext('2d'), L = WorldMapExt.layout(1036, 582, c);
    const r = {
      places: WorldMapExt.places().join(','), volcano: WorldMapExt.placeOf('wmtestvolcano'), hut: WorldMapExt.placeOf('wmtesthut'),
      shop: WorldMapExt.placeOf('wmtestshop') + ':' + WorldMapExt.mappedBy('wmtestshop'), cave: WorldMapExt.placeOf('wmtestcave'),
      below: L.places.wmtestvolcano && L.places.wmtestvolcano.y > L.places.site.y, unmapped: WorldMapExt.unmapped().join(','),
      info: WorldMapExt.interiorInfo('wmtestshop'), how: WorldMapExt.place('wmtestvolcano').how, route: L.routes.some((rt) => rt.r.via === 'wmtestcart'),
    };
    CFG.LINKS.pop(); for (const k of ['wmtestvolcano', 'wmtesthut', 'wmtestshop', 'wmtestcave']) delete CFG.AREAS[k]; delete CFG.WMTESTSHOP;
    WorldMapExt._mem = null;
    return r;
  });
  t.expect(added.places.endsWith(',wmtestvolcano'), 'a new ride brings a new place: ' + added.places);
  t.expectEq(added.volcano, 'wmtestvolcano', 'the new place is its own place');
  t.expectEq(added.hut, 'cloud', 'an interior that names its place goes there');
  t.expectEq(added.shop, 'city:door', 'an interior with a door in the City goes to the City');
  t.expectEq(added.cave, 'wmtestvolcano', 'an interior of the new place goes there');
  t.expect(added.below && added.route, 'the new place sits below its station, joined by its ride');
  t.expectEq(added.unmapped, '', 'nothing unmapped after adding things');
  t.expect(added.info.ico === '🦖' && added.info.name === 'Dino shop', 'the new interior takes its picture and name from its config: ' + JSON.stringify(added.info));
  t.expect(/Construction/.test(added.how), 'the new place says how to get there: ' + added.how);
  t.expectEq(await t.ev(() => WorldMapExt.places().length), 9, 'back to nine places after the test');

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
    return { out, subs: L.subs.length, want: WorldMapExt.places().reduce((n, k) => n + WorldMapExt.subsOf(k, CFG.WORLDMAP.SUBS.wide).length, 0) };
  });
  t.expectEq(fitDesk.out.join(','), '', 'every place fits on the desktop map without overlapping');
  console.log(`    sub-place icons placed: ${fitDesk.subs} / ${fitDesk.want}`);
  await t.ev(() => WorldMapExt.close());
};
