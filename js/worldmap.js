'use strict';
// World map: a big '🗺️ World map' button at the front of the help panel's button row opens a storybook map of every
// place in the game. It is NOT a plot of map coordinates (the maps sit far apart in one coordinate space): each place
// is a round, picture-book bubble with an emoji and a short name, little dotted paths join the places that are
// connected, and the vehicle that makes each trip (🚂 🚌 ⛴️ ✈️ 🚡 🚇 🚀) rides gently back and forth along its path.
// A bouncing chef hat marks where the chef is now (interiors count as their outer place: a City shop is the City).
// Tapping a place bounces it and pops up a speech bubble with its name and how to get there. No fast travel.
// Each place also shows how many of its Pizza Coins have been found. Places never visited get a "?" and a sparkle.
// The map draws into its own canvas with its own requestAnimationFrame loop, which runs only while the map is open.
// Opening it, like any modal, only turns the game's input off (UI.show); the town keeps simulating behind it.
// Extension module: Game.ext.push (it only remembers which places the chef has been to). See js/EXTENSIONS.md.
//
// THE MAP IS GENERATED FROM THE GAME'S OWN DATA (nothing is positioned by hand):
//  * Rides: CFG.LINKS, one entry per ride between two outdoor maps, { from, to, via, dir }, where `via` is the
//    Game.startTravel kind and `dir` the way the ride travels ON SCREEN going from → to (right, left, up, down,
//    up-right, down-left, ...). A new ride adds one entry (from its own file: `CFG.LINKS.push(...)`, or here); the
//    world map test greps every Game.startTravel( call in js/ and fails if a ride has no link.
//  * Places: Home Town plus every map a link arrives at. Everything else in CFG.AREAS is an interior.
//  * Membership (which place an interior belongs to), in order: `CFG.AREAS.x.place` (a place or another area) →
//    its door: a DOOR / DOOR_OUT / MAT_OUT point in the config that owns its WORLD (or a `DOORS` table entry naming
//    it), and the place of the map whose WORLD holds that point → the old hand table LEGACY_PLACE (old interiors).
//  * Layout: Home Town starts in the middle and each linked place goes one step away in its link's direction; the
//    steps are stretched onto the canvas (wide or tall), then relaxed: bubbles and labels are pushed apart, every
//    ride keeps within a cone of its direction, paths keep clear of other bubbles, seaside places sit in the sea at
//    the bottom, space and sky places up top, and everything stays on the canvas with room for the hat and labels.
//  * Scenery comes from the places' `scene`: sea under 'sea'/'shore' places, snowy mountains behind 'snow', a hill
//    under 'hill', a starry patch around 'space', clouds around 'sky'; the trees, boats and balloon fill empty room.
//  * Sub-places (little icons by each bubble): the place's interiors (their picture and name from INSIDE, or from
//    their own config's name / toast) plus its outdoor landmarks (`marks`), the most notable few, then "+N".

(() => {
  // the rides between the places (every Game.startTravel kind). `dir`: where the ride goes on screen, from → to.
  const LINKS = [
    { from: 'town', to: 'site', via: 'train', dir: 'right' },          // the train pulls out of town to the right
    { from: 'site', to: 'snow', via: 'skilift', dir: 'up' },           // the ski lift climbs the mountain
    { from: 'town', to: 'city', via: 'bus', dir: 'left' },             // the bus drives right to left to the City
    { from: 'city', to: 'campus', via: 'subway', dir: 'up' },          // red Line 1 uptown to Columbia
    { from: 'city', to: 'pizzapier', via: 'pierline', dir: 'left' },   // the orange D train rolls in LEFT by the sea
    { from: 'town', to: 'islands', via: 'ferry', dir: 'down-left' },   // the ferry sails left across the sea
    { from: 'islands', to: 'moon', via: 'rocket', dir: 'up' },         // the rocket lifts straight up
    { from: 'town', to: 'cloud', via: 'flight', dir: 'up-right' },     // the plane climbs up and away to the right
  ];
  const have = Array.isArray(CFG.LINKS) ? CFG.LINKS : [];   // links another file pushed before this one loaded stay
  for (const l of LINKS) if (!have.some((q) => q.via === l.via && q.from === l.from && q.to === l.to)) have.push(l);
  CFG.LINKS = have;
})();

CFG.WORLDMAP = {
  // how each kind of ride looks on the map: its vehicle, its path, its name (unknown kinds get a road and a car)
  RIDES: {
    train: { ico: '🚂', style: 'rail', name: 'train' },
    skilift: { ico: '🚡', style: 'cable', name: 'ski lift' },
    bus: { ico: '🚌', style: 'road', name: 'bus' },
    subway: { ico: '🚇', style: 'tunnel', name: 'subway', col: '#d42a2a' },
    pierline: { ico: '🚇', style: 'tunnel', name: 'orange D train', col: '#ff6319' },
    ferry: { ico: '⛴️', style: 'water', name: 'ferry' },
    rocket: { ico: '🚀', style: 'space', name: 'rocket', loop: true },
    flight: { ico: '✈️', style: 'air', name: 'plane', loop: true },
  },
  // a little data for each place: picture, name, colour, how to get there, its scenery, and landmarks that are not
  // interiors ([emoji, name, words, how notable]). A place missing here still shows, with a pin and its map's name.
  PLACES: {
    town: { ico: '🍕', name: 'Home Town', col: '#ffd6a0', scene: 'land', how: '🏡 Home! Your pizzeria is here.' },
    site: { ico: '🏗️', name: 'Construction Town', short: 'Construction', col: '#ffe08a', scene: 'land', how: '🚂 Take the train from the station by the farm' },
    snow: { ico: '⛷️', name: 'Snowy Peak', col: '#e3f4ff', scene: 'snow', how: '🚡 Ride the ski lift by the Pizza Mine', marks: [['🛷', 'Sledding', 'The sledding hill', 3]] },
    city: { ico: '🏙️', name: 'The City', col: '#d7d2ff', scene: 'land', how: '🚌 Take the bus from Main Street', marks: [['🌭', 'Hot dogs', 'The hot dog cart in Pizza Square', 2]] },
    campus: { ico: '🎓', name: 'Columbia', col: '#cfe3ff', scene: 'hill', how: '🚇 Ride the subway from the City' },
    islands: { ico: '🏝️', name: 'The Islands', col: '#c9f3e8', scene: 'sea', how: '⛴️ Take the ferry from the dock by River House', marks: [['🏖️', 'Sunny Beach', 'Sunny Beach', 2]] },
    pizzapier: {
      ico: '🎡', name: 'Coney Island', col: '#ffd6ec', scene: 'shore', how: '🚇 Ride the orange D train from the City',
      marks: [['🎢', 'Coaster', 'The roller coaster', 3], ['🚗', 'Bumper cars', 'The bumper cars', 3], ['🎯', 'Games', 'The midway games', 2]],
    },
    moon: { ico: '🌕', name: 'Pizza Moon', col: '#3d3f78', dark: true, scene: 'space', how: '🚀 Fly the rocket from Rocket Island', marks: [['👽', 'Alien', 'The friendly alien', 3]] },
    cloud: { ico: '☁️', name: 'Cloud Harbor', col: '#ffffff', scene: 'sky', how: '✈️ Hop in a plane at the airfield', marks: [['🎈', 'Balloons', 'Hot-air balloon rides', 3]] },
  },
  // pictures, names and words for interiors whose own config has none, and how notable each is (3 = shown first)
  INSIDE: {
    barn: ['🐄', 'Farm', 'The farm and the barn', 3], firestation: ['🚒', 'Fire Station', 'The fire station', 3],
    cabin: ['🌲', 'Woods', 'The secret woods and the cabin', 3], upstairs: ['🛏️', 'Upstairs', 'Your room upstairs', 1],
    pizzarain: ['🌧️', 'Pizza Rain', 'The room where it rains pizza', 1], jetcabin: ['✈️', 'Jet', 'Inside the big jet', 2],
    mines: ['⛏️', 'Pizza Mine', 'The Pizza Mine', 3], diner: ['🥞', 'Diner', 'The diner', 3], hardware: ['🔧', 'Hardware', 'The hardware store', 3],
    cocoacabin: ['☕', 'Cocoa Cabin', 'The Cocoa Cabin', 3],
    subway: ['🚇', 'Subway', 'The subway station', 1], barber: ['💈', 'Barber', 'The barber shop', 1], toyshop: ['🧸', 'Toys', 'The toy shop', 2],
    petshop: ['🐶', 'Pets', 'The pet shop', 1], bakery: ['🥐', 'Bakery', 'The bakery', 1], hotel: ['🏨', 'Hotel', 'The hotel', 1],
    arcade: ['🕹️', 'Arcade', 'The arcade', 1], candy: ['🍭', 'Candy', 'The candy shop', 1], books: ['📚', 'Books', 'The book shop', 1],
    catcafe: ['🐱', 'Cat Café', 'The cat café', 1], gym: ['🤸', 'Gym', 'The gym', 1], flowers: ['🌷', 'Flowers', 'The flower shop', 1],
    music: ['🎸', 'Music', 'The music shop', 1], cinema: ['🎬', 'Cinema', 'The cinema', 1], post: ['📮', 'Post Office', 'The post office', 1],
    grocery: ['🛒', 'Grocery', 'The grocery store', 1], school: ['🏫', 'School', 'The school', 1], bank: ['🏦', 'Bank', 'The bank', 1],
    cafe: ['☕', 'Café', 'The café', 1], aquarium: ['🐠', 'Aquarium', 'The aquarium', 2], firedept: ['🚒', 'Fire Dept', 'The fire department', 1],
    lowlibrary: ['🏛️', 'Library', 'Low Library', 3], barnardhall: ['🐻', 'Barnard', 'Barnard Hall', 3],
    lighthouse: ['🗼', 'Lighthouse', 'The Lighthouse', 3], rocketinside: ['🚀', 'Rocket', 'Inside the rocket', 1],
    skycafe: ['🧁', 'Sky Café', 'The Sky Café', 3],
  },
  // the old hand-made "which place is this map in" table: only a fallback for interiors with no `place` and no door data
  LEGACY_PLACE: {
    town: 'town', upstairs: 'town', pizzarain: 'town', barn: 'town', firestation: 'town', cabin: 'town',
    jetcabin: 'town', afterminal: 'town', afhangar: 'town', aftower: 'town', afworkshop: 'town',
    site: 'site', mines: 'site', diner: 'site', hardware: 'site',
    snow: 'snow', cocoacabin: 'snow',
    city: 'city', subway: 'city', barber: 'city', toyshop: 'city', petshop: 'city', bakery: 'city', hotel: 'city', arcade: 'city',
    candy: 'city', books: 'city', catcafe: 'city', gym: 'city', flowers: 'city', music: 'city', cinema: 'city', post: 'city',
    grocery: 'city', school: 'city', bank: 'city', cafe: 'city', aquarium: 'city', firedept: 'city',
    campus: 'campus', lowlibrary: 'campus', barnardhall: 'campus',
    islands: 'islands', lighthouse: 'islands', crabshack: 'islands', coconuthut: 'islands', missionctl: 'islands', beachhut: 'islands', rocketinside: 'islands',
    moon: 'moon', pizzapier: 'pizzapier', cloud: 'cloud', skycafe: 'cloud',
  },
  // scenery a new place gets from the ride that reaches it, when the place table does not say
  VIA_SCENE: { ferry: 'sea', rocket: 'space', flight: 'sky', skilift: 'snow' },
  COLOURS: ['#ffd6a0', '#d7f5c8', '#ffe0f0', '#d6ecff', '#fff1b8', '#e8dcff'],
  SUBS: { wide: 4, tall: 3 },   // at most this many little sub-place icons per place (the last one may be "+N")
};

const WorldMapExt = {
  name: 'worldmap',
  defaults: { worldmap: { seen: { town: true } } },
  dom: null, raf: null, running: false, frames: 0, t: 0, last: 0,
  sel: null,       // { kind: 'place' | 'sub', key, i, t } : the thing tapped last, with its speech bubble
  lay: null,       // the computed layout for the canvas's current size (positions in CSS px)
  _mem: null,      // the generated membership (rebuilt when maps or links are added)

  // ======================= the places and rides, from the data =======================
  links() { return (CFG.LINKS || []).filter((l) => l && CFG.AREAS[l.from] && CFG.AREAS[l.to] && l.from !== l.to); },
  ride(via) { return Object.assign({ ico: '🚗', style: 'road', name: via, loop: false }, CFG.WORLDMAP.RIDES[via] || {}); },
  // the outdoor places: Home Town and every map a ride arrives at (a map that names its `place` is an interior)
  placeKeys() {
    const out = ['town'];
    for (const l of this.links()) for (const k of [l.from, l.to]) if (!out.includes(k) && !CFG.AREAS[k].place) out.push(k);
    return out;
  },
  places() { return this.membership().keys; },
  // a place's picture, name, colour, words and scenery (defaults for a place missing from the table)
  place(k) {
    const P = CFG.WORLDMAP.PLACES[k] || {}, m = this.membership();
    if (m.info[k]) return m.info[k];
    const into = this.links().find((l) => l.to === k) || this.links().find((l) => l.from === k);
    const r = into ? this.ride(into.via) : null, from = into ? (into.to === k ? into.from : into.to) : null;
    const nice = k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const fromName = from ? ((CFG.WORLDMAP.PLACES[from] || {}).name || from) : '';
    const info = Object.assign({
      ico: '📍', name: nice, col: CFG.WORLDMAP.COLOURS[m.keys.indexOf(k) % CFG.WORLDMAP.COLOURS.length],
      how: r ? `${r.ico} Take the ${r.name} from ${fromName}` : '🗺️ Somewhere to explore!',
      scene: (into && CFG.WORLDMAP.VIA_SCENE[into.via]) || 'land', marks: [],
    }, P);
    if (!info.marks) info.marks = [];
    m.info[k] = info;
    return info;
  },
  // the way a link's `dir` points, as a unit vector on screen (y grows down)
  dirVec(dir) {
    let x = 0, y = 0;
    for (const p of String(dir || 'right').toLowerCase().split(/[-\s]+/)) { if (p === 'right') x++; else if (p === 'left') x--; else if (p === 'up') y--; else if (p === 'down') y++; }
    const l = Math.hypot(x, y);
    return l ? [x / l, y / l] : [1, 0];
  },

  // ---------- which place is a map in (generated, cached until a map or a link is added) ----------
  membership() {
    const sig = Object.keys(CFG.AREAS).length + '|' + (CFG.LINKS || []).length;
    if (this._mem && this._mem.sig === sig) return this._mem;
    const keys = this.placeKeys(), map = {}, how = {}, idx = this.cfgIndex();
    for (const k of keys) { map[k] = k; how[k] = 'outdoor'; }
    const resolve = (a, depth) => {
      if (a in map) return map[a];
      const A = CFG.AREAS[a]; if (!A || depth > 6) return null;
      map[a] = null;   // (guards against a loop of interiors naming each other)
      let pl = null, src = null;
      if (A.place) {
        if (keys.includes(A.place)) pl = A.place;
        else if (CFG.AREAS[A.place] && A.place !== a) pl = resolve(A.place, depth + 1);
        if (pl) src = 'place';
      }
      if (!pl) { const par = this.doorParent(a, idx); if (par) { pl = resolve(par, depth + 1); if (pl) src = 'door'; } }
      if (!pl) { const p = CFG.WORLDMAP.LEGACY_PLACE[a]; if (p && keys.includes(p)) { pl = p; src = 'legacy'; } }
      map[a] = pl; how[a] = src;
      return pl;
    };
    for (const a of Object.keys(CFG.AREAS)) resolve(a, 0);
    this._mem = { sig, keys, map, how, idx, info: {} };
    return this._mem;
  },
  // one walk over CFG: which config objects own each map's WORLD, and every DOORS table
  cfgIndex() {
    const owners = new Map(), doors = [], seen = new Set();
    const walk = (o, d, name) => {
      if (!o || typeof o !== 'object' || seen.has(o) || d > 5) return;
      seen.add(o);
      if (/doors$/i.test(name)) doors.push(o);
      if (Array.isArray(o)) return;
      if (o.WORLD && typeof o.WORLD === 'object') { const l = owners.get(o.WORLD) || []; l.push(o); owners.set(o.WORLD, l); }
      for (const [k, v] of Object.entries(o)) if (v && typeof v === 'object' && k !== 'AREAS' && k !== 'WORLDMAP' && k !== 'LINKS') walk(v, d + 1, k);
    };
    walk(CFG, 0, 'CFG');
    return { owners, doors };
  },
  // the config objects that describe a map (the ones holding its WORLD, or CFG.<NAME>)
  ownersOf(a, idx) {
    const A = CFG.AREAS[a], out = (A && idx.owners.get(A.WORLD) || []).filter((o) => o !== A);
    const up = CFG[a.toUpperCase()];
    if (up && typeof up === 'object' && !Array.isArray(up) && !out.includes(up)) out.push(up);
    return out;
  },
  // where an interior's door is (points in the outer map), from its config or a DOORS table
  doorSpots(a, idx) {
    const isPt = (v) => v && typeof v === 'object' && typeof v.x === 'number' && typeof v.y === 'number';
    const pts = [], owners = this.ownersOf(a, idx), names = [a];
    for (const o of owners) {
      for (const [k, v] of Object.entries(o)) if (isPt(v) && /^(door|door_?out|mat_?out|door_?spot|entrance|entry|outside)$/i.test(k)) pts.push(v);
      if (typeof o.door === 'string') names.push(o.door);
    }
    for (const D of idx.doors) {
      const list = Array.isArray(D) ? D : Object.entries(D).map(([k, v]) => (isPt(v) ? Object.assign({ key: k }, v) : null));
      for (const e of list) if (isPt(e) && (names.includes(e.key) || e.room === a || e.area === a)) pts.push(e);
    }
    return pts;
  },
  // the map holding most of an interior's door spots
  doorParent(a, idx) {
    const votes = {};
    for (const p of this.doorSpots(a, idx || this.cfgIndex())) {
      let best = null, ba = Infinity;
      for (const [k, A] of Object.entries(CFG.AREAS)) {
        const W = A.WORLD; if (k === a || !W) continue;
        if (p.x >= W.x0 && p.x <= W.x1 && p.y >= W.y0 && p.y <= W.y1) { const ar = (W.x1 - W.x0) * (W.y1 - W.y0); if (ar < ba) { ba = ar; best = k; } }
      }
      if (best) votes[best] = (votes[best] || 0) + 1;
    }
    let win = null;
    for (const k of Object.keys(votes)) if (!win || votes[k] > votes[win]) win = k;
    return win;
  },
  placeOf(area) { return this.membership().map[area] || null; },
  mappedBy(area) { return this.membership().how[area] || null; },   // 'outdoor' | 'place' | 'door' | 'legacy' | null
  unmapped() { return Object.keys(CFG.AREAS).filter((k) => !this.placeOf(k)); },

  // ---------- the little sub-places by each bubble: its interiors and landmarks, the most notable first ----------
  interiorInfo(a) {
    const T = CFG.WORLDMAP.INSIDE[a];
    if (T) return { ico: T[0], name: T[1], text: T[2], rank: T[3] == null ? 1 : T[3] };
    const m = this.membership(), EMO = /\p{Extended_Pictographic}️?(‍\p{Extended_Pictographic}️?)*/u;
    let ico = null, name = null;
    for (const o of this.ownersOf(a, m.idx)) {
      for (const f of ['ico', 'icon', 'emoji', 'toast', 'title', 'hint', 'name']) { const v = o[f]; if (!ico && typeof v === 'string') { const e = v.match(EMO); if (e) ico = e[0]; } }
      if (!name && typeof o.name === 'string') name = o.name;
      if (!name && typeof o.toast === 'string') { const w = o.toast.match(/welcome to (?:the )?(.+?)[!.]/i); if (w) name = w[1]; }
      if (!name && typeof o.title === 'string') name = o.title.replace(EMO, '').trim().toLowerCase();
    }
    name = (name || a).replace(/^\w/, (c) => c.toUpperCase());
    return { ico: ico || '🚪', name, text: name, rank: 1 };
  },
  subsOf(place, cap) {
    cap = cap || CFG.WORLDMAP.SUBS.wide;
    const items = [], P = this.place(place);
    for (const a of Object.keys(CFG.AREAS)) {
      if (a === place || this.placeOf(a) !== place) continue;
      const W = CFG.AREAS[a].WORLD, size = W ? (W.x1 - W.x0) * (W.y1 - W.y0) : 0;
      items.push(Object.assign(this.interiorInfo(a), { area: a, size, order: items.length }));
    }
    (P.marks || []).forEach((s, i) => items.push({ ico: s[0], name: s[1], text: s[2] || s[1], rank: s[3] == null ? 2 : s[3], size: 0, order: -100 + i }));
    // the most notable first: the rank, then the biggest map, then the oldest
    items.sort((p, q) => (q.rank - p.rank) || (q.size - p.size) || (p.order - q.order));
    if (items.length <= cap) return items;
    const shown = items.slice(0, cap - 1), rest = items.slice(cap - 1);
    shown.push({ ico: '🚪', name: `+${rest.length}`, text: rest.slice(0, 10).map((s) => s.ico).join(' '), more: true, rank: 0 });
    return shown;
  },

  here(g) { return this.placeOf(g.area) || 'town'; },
  seenState(g) {
    if (!g.s.worldmap || typeof g.s.worldmap !== 'object') g.s.worldmap = { seen: { town: true } };
    if (!g.s.worldmap.seen || typeof g.s.worldmap.seen !== 'object') g.s.worldmap.seen = { town: true };
    return g.s.worldmap.seen;
  },
  // been there: remembered here, or the Pizza Coins hunt saw one of its maps
  visited(g, place) {
    if (place === 'town' || this.seenState(g)[place]) return true;
    const pc = g.s.pizzacoins && g.s.pizzacoins.seen;
    if (pc) for (const a of Object.keys(pc)) if (pc[a] && this.placeOf(a) === place) return true;
    return false;
  },
  // Pizza Coins found / hidden per place (every coin's map mapped the same way)
  coins(g) {
    const out = {}, P = CFG.PIZZACOINS, got = (g.s.pizzacoins && g.s.pizzacoins.got) || {};
    if (!P || !P.SPOTS) return out;
    for (const s of P.SPOTS) { const pl = this.placeOf(s.area); if (!pl) continue; const o = out[pl] || (out[pl] = { n: 0, got: 0 }); o.n++; if (got[s.id]) o.got++; }
    return out;
  },

  // ---------- game hook: remember the places the chef has been ----------
  update(g) {
    if (g.travel) return;
    const pl = this.placeOf(g.area);
    if (pl) { const seen = this.seenState(g); if (!seen[pl]) seen[pl] = true; }
  },
  home() {},

  // ======================= DOM: the help button and the modal =======================
  buildDom() {
    if (this.dom || typeof document === 'undefined' || !document.body) return;
    const help = document.querySelector('#modal-help .help-actions');
    const host = document.getElementById('app') || document.body;
    const style = document.createElement('style');
    style.textContent = `
      #btn-worldmap { background: var(--gold, #f2b134); color: var(--ink, #2b1d14); box-shadow: 0 3px 0 #b8801a; font-size: 16px; padding: 10px 18px; }
      #btn-worldmap:active { box-shadow: none; }
      .wm-head-btn { margin-left: auto; margin-right: 10px; background: var(--gold, #f2b134); color: var(--ink, #2b1d14); border: 0; border-radius: 999px; padding: 7px 14px; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 2px 0 #b8801a; font-family: inherit; }
      .wm-head-btn:active { box-shadow: none; transform: translateY(2px); }
      @media (max-width: 700px), (max-height: 520px) { .wm-head-btn { font-size: 18px; padding: 10px 16px; } }
      @media (max-width: 700px), (max-height: 520px) { #btn-worldmap { flex: 1 1 100%; font-size: 19px; padding: 16px; } }
      #modal-worldmap .wm-card { width: min(1060px, 100%); height: min(92vh, 760px); max-height: none; }
      #modal-worldmap .modal-head { background: #2f8fc9; }
      .wm-body { flex: 1; min-height: 0; padding: 8px; background: var(--panel, #fff8ee); display: flex; }
      .wm-canvas { flex: 1; min-width: 0; min-height: 0; width: 100%; height: 100%; display: block; border-radius: 14px; touch-action: manipulation; cursor: pointer; -webkit-tap-highlight-color: transparent; }
      @media (max-width: 700px), (max-height: 520px) { #modal-worldmap .wm-card { height: 100%; } .wm-body { padding: 6px; } .wm-canvas { border-radius: 10px; } }
    `;
    document.head.appendChild(style);
    const btn = document.createElement('button');
    btn.id = 'btn-worldmap'; btn.type = 'button'; btn.className = 'btn'; btn.textContent = '🗺️ World map';
    if (help) help.insertBefore(btn, help.firstChild);
    // and a small one in the help panel's header, always in view (the help text is long)
    const head = document.querySelector('#modal-help .modal-head');
    if (head) {
      const hb = document.createElement('button');
      hb.id = 'btn-worldmap-head'; hb.type = 'button'; hb.className = 'wm-head-btn'; hb.textContent = '🗺️ Map'; hb.title = 'World map';
      hb.addEventListener('click', () => this.open());
      const close = head.querySelector('.close'); head.insertBefore(hb, close || null);
    }
    const modal = document.createElement('div');
    modal.id = 'modal-worldmap'; modal.className = 'modal hidden';
    modal.innerHTML = `<div class="modal-card wm-card">
        <div class="modal-head"><h2>🗺️ World map</h2><button class="close wm-close" aria-label="Close">✕</button></div>
        <div class="wm-body"><canvas class="wm-canvas" aria-label="A map of all the places"></canvas></div>
      </div>`;
    host.appendChild(modal);
    this.dom = { btn, modal, canvas: modal.querySelector('canvas'), close: modal.querySelector('.wm-close') };
    btn.addEventListener('click', () => this.open());
    this.dom.close.addEventListener('click', () => this.close());
    modal.addEventListener('click', (e) => { if (e.target === modal) this.close(); });
    this.dom.canvas.addEventListener('pointerdown', (e) => {
      const r = this.dom.canvas.getBoundingClientRect();
      this.tap(e.clientX - r.left, e.clientY - r.top);
    });
  },
  isOpen() { return typeof UI !== 'undefined' && UI.open === 'worldmap'; },
  open() {
    if (!this.dom || typeof UI === 'undefined') return;
    UI.els.worldmap = this.dom.modal;     // UI.init rebuilds UI.els, so hand it the modal each time
    UI.show('worldmap');
    this.sel = null; this.lay = null;
    try { Sfx.init(); Sfx.resume(); } catch (e) { /* sound is optional */ }
    this.start();
  },
  close() {
    if (this.isOpen()) UI.close(); else if (this.dom) this.dom.modal.classList.add('hidden');
    this.stop();
  },
  // the animation runs only while the map is open; it notices any close (✕, Escape, the backdrop) and stops itself
  start() {
    if (this.running) return;
    this.running = true; this.last = performance.now();
    const frame = (now) => {
      if (!this.isOpen() || this.dom.modal.classList.contains('hidden')) { this.stop(); return; }
      const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000)); this.last = now;
      this.t += dt; this.frames++;
      if (this.sel) this.sel.t += dt;
      this.draw();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  },
  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null; this.running = false;
  },

  // ======================= layout (generated from the links, once per canvas size) =======================
  fit() {
    const c = this.dom.canvas, W = Math.max(1, c.clientWidth), H = Math.max(1, c.clientHeight);
    const dpr = Math.min(2, window.devicePixelRatio || 1), bw = Math.round(W * dpr), bh = Math.round(H * dpr);
    if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
    if (!this.lay || this.lay.W !== W || this.lay.H !== H) this.lay = this.layout(W, H, this.dom.canvas.getContext('2d'));
    return dpr;
  },
  // the hat's height over a bubble at its highest hop (it must stay on the canvas)
  hatRoom(R) { const s = U.clamp(R * 0.44, 12, 24); return s * 0.55 + R * 0.28 + s * 1.2; },
  layout(W, H, ctx) {
    const wide = W / H >= 1.05;
    const R = Math.round(U.clamp(wide ? Math.min(W * 0.05, H * 0.085) : Math.min(W * 0.1, H * 0.052), 24, 58));
    const fs = U.clamp(Math.round(R * 0.36), 12, 18), lh = fs + 10;
    const lay = { W, H, wide, R, fs, places: {}, routes: [], subs: [], obs: [], decor: [] };
    const keys = this.places(), links = this.links().filter((l) => keys.includes(l.from) && keys.includes(l.to));
    ctx.font = this.font(fs);
    // each place's footprint around its centre: the bubble, the name label below, the coin badge to the right
    const N = {};
    for (const k of keys) {
      const P = this.place(k);
      const name = (P.short && ctx.measureText(P.name).width + 22 > R * 3.2) ? P.short : P.name;
      const lw = ctx.measureText(name).width + 20, half = Math.max(R, lw / 2);
      N[k] = { key: k, name, lw, scene: P.scene, x: 0, y: 0, l: half + 4, r: Math.max(half + 4, R * 1.14 + fs * 2.2 + 10), t: R + Math.max(8, this.hatRoom(R) * 0.7), b: R + 4 + lh + 4 };
    }
    const list = keys.map((k) => N[k]);
    // the bands: hat room at the top, labels at the bottom, the sea along the bottom, the horizon
    const top = R + this.hatRoom(R) + 4, bottom = H - 6 - (R + 4 + lh);
    const sea = (n) => n.scene === 'sea' || n.scene === 'shore', high = (n) => ['sky', 'space', 'snow', 'hill'].includes(n.scene);
    const hasSea = list.some(sea), seaTop = hasSea ? H - Math.max(H * 0.24, 2.1 * R + lh + 10) : null;
    const horizon = (wide ? 0.34 : 0.3) * H, landFloor = hasSea ? seaTop + 6 : H;

    // 1. the ideal spots: Home Town at (0, 0), each linked place one step away in its link's direction (breadth first)
    const ideal = { town: [0, 0] }, queue = ['town'];
    while (queue.length) {
      const cur = queue.shift();
      for (const l of links) {
        const other = l.from === cur ? l.to : l.to === cur ? l.from : null;
        if (!other || ideal[other]) continue;
        const [dx, dy] = this.dirVec(l.dir), s = l.from === cur ? 1 : -1;
        ideal[other] = [ideal[cur][0] + dx * s, ideal[cur][1] + dy * s];
        queue.push(other);
      }
    }
    let far = Math.max(...Object.values(ideal).map((p) => p[0]));
    for (const k of keys) if (!ideal[k]) ideal[k] = [++far, 0];   // not linked to anything: off to the side
    // 2. stretched onto the canvas
    const ix = keys.map((k) => ideal[k][0]), iy = keys.map((k) => ideal[k][1]);
    const minX = Math.min(...ix), maxX = Math.max(...ix), minY = Math.min(...iy), maxY = Math.max(...iy);
    const bx0 = W * 0.12, bx1 = W * 0.88, by0 = top, by1 = hasSea ? seaTop - R - lh - 8 : bottom;
    for (const n of list) {
      const [x, y] = ideal[n.key];
      // Home Town in the middle: each side stretched to its own edge
      n.ix = x < 0 ? W / 2 - x / minX * (W / 2 - bx0) : x > 0 ? W / 2 + x / maxX * (bx1 - W / 2) : W / 2;
      n.iy = maxY > minY ? by0 + (y - minY) / (maxY - minY) * (by1 - by0) : (by0 + by1) / 2;
      if (n.scene === 'space') n.iy = top;
      if (n.scene === 'sea') n.iy = bottom;
      if (n.scene === 'shore') n.iy = seaTop;
      n.x = n.ix; n.y = n.iy;
    }
    // the rules every place keeps: on the canvas, in its band
    const zone = (n) => {
      if (n.scene === 'sea') n.y = Math.max(n.y, seaTop + R * 0.7);
      else if (n.scene === 'shore') n.y = U.clamp(n.y, seaTop - R * 0.45, seaTop + R * 0.3);
      else {
        n.y = Math.min(n.y, landFloor - n.b + 4);
        if (n.scene === 'space') n.y = Math.min(n.y, top + R * 0.4);
        else if (high(n)) n.y = Math.min(n.y, horizon + R * (n.scene === 'hill' ? 0.6 : 0.3));
        else n.y = Math.max(n.y, horizon + R * 0.4);
      }
      n.x = U.clamp(n.x, n.l + 4, W - n.r - 4); n.y = U.clamp(n.y, top, bottom);
    };
    const sideA = (wide ? 38 : 58) * Math.PI / 180, slopeA = 38 * Math.PI / 180,   // how far a ride may stray from its direction (a side-to-side ride on a phone needs more)
      minLen = 2 * R + (wide ? 56 : 34), gap = wide ? 12 : 6;
    const spaceW = (n) => Math.max(2.05 * R, n.lw / 2 + 14);
    // 3. relax
    // each ride keeps to a cone around its direction, and is long enough to see the vehicle on it
    const cones = (k) => {
      for (const l of links) {
        const a = N[l.from], b = N[l.to], [dx, dy] = this.dirVec(l.dir), maxA = Math.abs(dy) < 0.3 ? sideA : slopeA;
        const vx = b.x - a.x, vy = b.y - a.y, len = Math.hypot(vx, vy);
        const ang = len > 0.01 ? Math.atan2(dx * vy - dy * vx, dx * vx + dy * vy) : 0;
        if (Math.abs(ang) <= maxA && len >= minLen) continue;
        const th = U.clamp(ang, -maxA, maxA), tx = dx * Math.cos(th) - dy * Math.sin(th), ty = dx * Math.sin(th) + dy * Math.cos(th);
        const L = Math.max(len, minLen), ex = tx * L - vx, ey = ty * L - vy;
        a.x -= ex * 0.5 * k; a.y -= ey * 0.5 * k; b.x += ex * 0.5 * k; b.y += ey * 0.5 * k;
      }
    };
    // bubbles, labels and badges never overlap
    const apart = (k) => {
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const p = list[i], q = list[j];
        const ox = Math.min(p.x + p.r, q.x + q.r) - Math.max(p.x - p.l, q.x - q.l) + gap;
        const oy = Math.min(p.y + p.b, q.y + q.b) - Math.max(p.y - p.t, q.y - q.t) + gap;
        if (ox <= 0 || oy <= 0) continue;
        // apart along the line between them (measured in box sizes), always with a little up/down in it so that two
        // places side by side against an edge can slide past each other
        let ux = (q.x - p.x) / (p.l + p.r + q.l + q.r), uy = (q.y - p.y) / (p.t + p.b + q.t + q.b);
        uy += (uy > 0 || (uy === 0 && i % 2 === 0) ? 1 : -1) * 0.12;
        if (Math.abs(ux) < 1e-6 && Math.abs(uy) < 1e-6) ux = 1;
        const ul = Math.hypot(ux, uy), m = Math.min(ox, oy) * 0.5 * k;
        p.x -= ux / ul * m; p.y -= uy / ul * m; q.x += ux / ul * m; q.y += uy / ul * m;
      }
    };
    // the paths keep clear of the other bubbles and labels
    const paths = (k) => {
      for (const l of links) {
        const a = N[l.from], b = N[l.to], bl = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        for (const n of list) {
          if (n === a || n === b) continue;
          for (const [py, need] of [[n.y, R + 18], [n.y + R + 4 + lh / 2, lh / 2 + 10]]) {
            const c = this.nearestOnSeg(a.x, a.y, b.x, b.y, n.x, py), d = Math.hypot(n.x - c.x, py - c.y);
            if (d >= need) continue;
            const ux = d > 0.01 ? (n.x - c.x) / d : -(b.y - a.y) / bl, uy = d > 0.01 ? (py - c.y) / d : (b.x - a.x) / bl;
            n.x += ux * (need - d) * 0.5 * k; n.y += uy * (need - d) * 0.5 * k;
          }
        }
      }
    };
    // the starry patch around a space place keeps everyone else out
    const space = (k) => {
      for (const s of list) {
        if (s.scene !== 'space') continue;
        const w = spaceW(s), x0 = s.x - w, x1 = s.x + w, y1 = s.y + R + 4 + lh + 14;
        for (const n of list) {
          if (n === s) continue;
          const ox = Math.min(n.x + n.r, x1) - Math.max(n.x - n.l, x0) + 8, oy = y1 - (n.y - n.t) + 8;
          if (ox <= 0 || oy <= 0) continue;
          if (ox < oy) { const sg = n.x < s.x ? -1 : 1; n.x += sg * ox * 0.6 * k; s.x -= sg * ox * 0.25 * k; } else n.y += oy * 0.6 * k;
        }
      }
    };
    for (let it = 0; it < 400; it++) {
      const k = it < 300 ? 0.5 : 0.8;
      if (it < 240) for (const n of list) { n.x += (n.ix - n.x) * 0.03; n.y += (n.iy - n.y) * 0.03; }
      cones(k); paths(k); space(k); apart(k); apart(k);
      for (const n of list) zone(n);
    }
    // and a last tidy-up where the overlaps, the directions, the bands and the edges count
    for (let it = 0; it < 80; it++) { apart(0.9); apart(0.9); space(0.9); cones(0.9); for (const n of list) zone(n); }

    // the places, with their name labels
    for (const n of list) {
      const ly = n.y + R + 4;
      lay.places[n.key] = { key: n.key, x: n.x, y: n.y, name: n.name, scene: n.scene, label: { x0: n.x - n.lw / 2, y0: ly, x1: n.x + n.lw / 2, y1: ly + lh } };
    }
    const ps = Object.values(lay.places);
    // the scenery, from the places
    lay.scene = { horizon, seaTop, spaces: [], mountains: [], hills: [], skies: [] };
    for (const p of ps) {
      if (p.scene === 'space') { const w = spaceW(N[p.key]); lay.scene.spaces.push({ key: p.key, x0: p.x - w, y0: -0.05 * H, x1: p.x + w, y1: p.label.y1 + 14 }); }
      if (p.scene === 'snow') {
        const base = Math.max(horizon + 30, p.y + R * 1.2);
        lay.scene.mountains.push([p.x - 2.6 * R, Math.max(6, p.y - 0.8 * R), 2.5 * R, base], [p.x + 2.5 * R, Math.max(6, p.y - 0.6 * R), 2.5 * R, base], [p.x, Math.max(4, p.y - 1.6 * R), 3.4 * R, base]);
      }
      if (p.scene === 'hill') lay.scene.hills.push([p.x, p.y + R * 0.55, R * 2.7, Math.max(horizon + 20, p.y + R * 1.5)]);
      if (p.scene === 'sky') lay.scene.skies.push(p.key);
    }
    // the rides: a gentle curve, bent the way that keeps clearest of the other places
    links.forEach((l, i) => {
      const a = lay.places[l.from], b = lay.places[l.to], r = Object.assign({ a: l.from, b: l.to, via: l.via, dir: l.dir }, this.ride(l.via));
      const twin = links.slice(0, i).filter((q) => (q.from === l.from && q.to === l.to) || (q.from === l.to && q.to === l.from)).length;
      let best = null;
      for (const bend of r.style === 'cable' ? [0] : [0.1, -0.1, 0.16, -0.16, 0.05, -0.05, 0]) {
        const rt = this.curve(a, b, bend + twin * 0.12);
        let cl = R;
        for (const p of ps) {
          if (p === a || p === b) continue;
          for (const [x, y] of rt.pts) { cl = Math.min(cl, Math.hypot(p.x - x, p.y - y) - R - 6, this.clear({ rect: p.label }, x, y) - 6); }
        }
        const score = Math.min(cl, R * 0.8) - Math.abs(bend) * 30 + (bend ? 3 : 0);
        if (!best || score > best.score) best = Object.assign(rt, { score });
      }
      lay.routes.push(Object.assign(best, { r, a, b }));
    });
    // what the little sub-place icons and the decorations must keep clear of
    const obs = lay.obs;
    for (const p of ps) {
      obs.push({ x: p.x, y: p.y, r: R + 4 });
      obs.push({ rect: p.label });
      obs.push({ x: p.x, y: p.y - R - 16, r: 18 });                                  // the chef hat
      obs.push({ rect: { x0: p.x + R * 0.42 - 2, y0: p.y + R * 0.26 - 2, x1: p.x + R * 1.14 + fs * 2.2 + 10, y1: p.y + R * 0.98 + 2 } });   // the coin badge
    }
    for (const rt of lay.routes) for (let i = 4; i <= 36; i += 2) obs.push({ x: rt.pts[i][0], y: rt.pts[i][1], r: 10 });
    this.placeSubs(lay, ctx);
    this.placeDecor(lay);
    return lay;
  },
  nearestOnSeg(ax, ay, bx, by, x, y) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, u = l2 ? U.clamp(((x - ax) * dx + (y - ay) * dy) / l2, 0, 1) : 0;
    return { x: ax + dx * u, y: ay + dy * u };
  },
  // a quadratic curve from a to b, bowed sideways by `bend` (a fraction of its length)
  curve(a, b, bend) {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const cx = (a.x + b.x) / 2 - dy / len * bend * len, cy = (a.y + b.y) / 2 + dx / len * bend * len, pts = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40, v = 1 - u; pts.push([v * v * a.x + 2 * v * u * cx + u * u * b.x, v * v * a.y + 2 * v * u * cy + u * u * b.y]); }
    return { cx, cy, pts, bend };
  },
  // each sub-icon goes in the roomiest spot around its bubble (it is skipped if there is no room at all)
  placeSubs(lay, ctx) {
    const { W, H, R, obs } = lay, S = lay.scene;
    const rs = Math.round(U.clamp(R * 0.36, 11, 19)), sfs = U.clamp(Math.round(R * 0.22), 9, 12), labelled = R >= 40;
    const cap = lay.wide ? CFG.WORLDMAP.SUBS.wide : CFG.WORLDMAP.SUBS.tall;
    ctx.font = this.font(sfs);
    const others = Object.values(lay.places);
    for (const k of Object.keys(lay.places)) {
      const p = lay.places[k], own = S.spaces.find((q) => q.key === k);
      this.subsOf(k, cap).forEach((s, i) => {
        const tw = labelled ? ctx.measureText(s.name).width + 8 : 0;
        let best = null;
        for (let a = 0; a < 360; a += 10) {
          for (const d of labelled ? [R + rs + 8, R + rs * 2 + 16, R + rs * 3 + 26] : [R + rs + 6, R + rs + 14]) {
            const x = p.x + Math.cos(a * Math.PI / 180) * d, y = p.y + Math.sin(a * Math.PI / 180) * d;
            // it must sit clearly nearer its own place than any other
            const mine = Math.hypot(p.x - x, p.y - y), other = Math.min(Infinity, ...others.filter((q) => q !== p).map((q) => Math.hypot(q.x - x, q.y - y)));
            if (other < mine + R * 0.9) continue;
            // land things stay on land (a sea place's things may float), a space place's things in its patch, nobody else's
            const bot = y + rs + (labelled ? sfs + 4 : 0);
            if (S.seaTop != null && p.scene !== 'sea' && bot > S.seaTop - 6) continue;
            if (own ? !(x - rs > own.x0 + 4 && x + rs < own.x1 - 4 && bot < own.y1 - 4) : S.spaces.some((q) => x + rs > q.x0 - 4 && x - rs < q.x1 + 4 && y - rs < q.y1 + 4)) continue;
            const lab = labelled ? { x0: x - tw / 2, y0: y + rs + 1, x1: x + tw / 2, y1: y + rs + sfs + 4 } : null;
            let cl = Math.min(x - rs - 4, W - 4 - rs - x, y - rs - 4, H - 4 - (lab ? lab.y1 - y : rs) - y);
            if (lab) cl = Math.min(cl, lab.x0 - 4, W - 4 - lab.x1);
            for (const o of obs) {
              cl = Math.min(cl, this.clear(o, x, y) - rs);
              if (lab) cl = Math.min(cl, this.clearRect(o, lab));
              if (cl < 0) break;
            }
            const score = Math.min(cl, 24) - (d - R - rs) * 0.6 + Math.min(other / mine, 2.5) * 10;   // roomy, close, and away from the neighbours
            if (cl >= 2 && (!best || score > best.score)) best = { x, y, score, lab };
          }
        }
        if (!best) return;
        const sub = { place: k, i, ico: s.ico, name: s.name, text: s.text, more: !!s.more, x: best.x, y: best.y, r: rs, fs: sfs, lab: best.lab };
        lay.subs.push(sub);
        obs.push({ x: sub.x, y: sub.y, r: rs + 3 });
        if (sub.lab) obs.push({ rect: sub.lab });
      });
    }
  },
  // a few friendly things in the empty room: a whale, a boat and a fish in the sea, trees and a flower on the land,
  // a balloon in the sky
  placeDecor(lay) {
    const { W, H, R, obs } = lay, S = lay.scene, hz = S.horizon, sea = S.seaTop;
    const inSpace = (x, y, r) => S.spaces.some((q) => x + r > q.x0 - 6 && x - r < q.x1 + 6 && y - r < q.y1 + 6);
    const regions = {
      sea: (x, y, r) => sea != null && y - r > sea + 14 && y + r < H - 4,
      land: (x, y, r) => y - r > hz + 14 && y + r < (sea != null ? sea - 8 : H - 4),
      sky: (x, y, r) => y + r < hz - 12 && y - r > 6 && !inSpace(x, y, r),
    };
    const want = [['🐳', 1.0, 'sea'], ['⛵', 0.8, 'sea'], ['🌳', 0.75, 'land'], ['🌳', 0.7, 'land'], ['🐟', 0.55, 'sea'], ['🌻', 0.55, 'land'], ['🎈', 0.7, 'sky']];
    const step = Math.max(10, R * 0.4);
    for (const [ch, k, where] of want) {
      const r = R * 0.75 * k * 0.55;
      let best = null;
      for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
        if (x - r < 4 || x + r > W - 4 || !regions[where](x, y, r)) continue;
        let cl = Infinity;
        for (const o of obs) { cl = Math.min(cl, this.clear(o, x, y) - r); if (cl < 4) break; }
        if (cl < 4) continue;
        const score = Math.min(cl, R * 2.5) + ((x * 7 + y * 13) % 17) * 0.01;
        if (!best || score > best.score) best = { x, y, score };
      }
      if (!best) continue;
      lay.decor.push([ch, best.x, best.y, k]);
      obs.push({ x: best.x, y: best.y, r: r + 6 });
    }
  },
  // clearance from an obstacle to a point (minus the obstacle's own size)
  clear(o, x, y) {
    if (o.rect) { const q = o.rect, dx = Math.max(q.x0 - x, 0, x - q.x1), dy = Math.max(q.y0 - y, 0, y - q.y1); return Math.hypot(dx, dy); }
    return Math.hypot(o.x - x, o.y - y) - o.r;
  },
  clearRect(o, q) {
    if (o.rect) { const a = o.rect, dx = Math.max(a.x0 - q.x1, q.x0 - a.x1, 0), dy = Math.max(a.y0 - q.y1, q.y0 - a.y1, 0); return Math.hypot(dx, dy) - 2; }
    const dx = Math.max(q.x0 - o.x, 0, o.x - q.x1), dy = Math.max(q.y0 - o.y, 0, o.y - q.y1);
    return Math.hypot(dx, dy) - o.r;
  },
  font(px, w = 800) { return `${w} ${px}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"`; },

  // ======================= tapping =======================
  hit(x, y) {
    const lay = this.lay; if (!lay) return null;
    for (const s of lay.subs) if (Math.hypot(s.x - x, s.y - y) <= s.r + 6) return { kind: 'sub', key: s.place, i: s.i };
    let best = null, bd = Infinity;
    for (const p of Object.values(lay.places)) {
      const d = Math.hypot(p.x - x, p.y - y), onLabel = x >= p.label.x0 - 4 && x <= p.label.x1 + 4 && y >= p.label.y0 - 4 && y <= p.label.y1 + 4;
      if ((d <= lay.R + 8 || onLabel) && d < bd) { bd = d; best = { kind: 'place', key: p.key }; }
    }
    return best;
  },
  tap(x, y) {
    if (!this.lay) return;
    const h = this.hit(x, y);
    if (!h) { this.sel = null; return; }
    this.sel = Object.assign(h, { t: 0 });
    try { Sfx.pickup(); Haptics.tap(); } catch (e) { /* optional */ }
  },
  // where a place is on the canvas (CSS px from the canvas's top-left), for tests and anyone curious
  spot(key) {
    if (!this.dom) return null;
    this.fit();
    const p = this.lay.places[key]; if (!p) return null;
    return { x: p.x, y: p.y, r: this.lay.R };
  },
  // the words in the speech bubble for the current selection
  bubbleLines(g, sel) {
    const P = this.place(sel.key);
    if (sel.kind === 'sub') {
      const s = this.lay && this.lay.subs.find((q) => q.place === sel.key && q.i === sel.i);
      if (s && s.more) return [`🚪 ${s.name.slice(1)} more to find`, s.text, `in ${P.ico} ${P.name}`];
      return s ? [`${s.ico} ${s.text}`, `in ${P.ico} ${P.name}`] : [`${P.ico} ${P.name}`];
    }
    const lines = [`${P.ico} ${P.name}`, P.how];
    if (this.here(g) === sel.key) lines.push('👨‍🍳 You are here!');
    else if (!this.visited(g, sel.key)) lines.push('✨ Not visited yet!');
    const c = this.coins(g)[sel.key];
    if (c) lines.push(c.got >= c.n ? `🍕 All ${c.n} Pizza Coins found!` : `🍕 Pizza Coins: ${c.got} of ${c.n}`);
    return lines;
  },

  // ======================= drawing =======================
  draw() {
    const dpr = this.fit(), c = this.dom.canvas, ctx = c.getContext('2d'), lay = this.lay, g = Game, t = this.t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, lay.W, lay.H);
    this.drawScenery(ctx, lay, t);
    for (const rt of lay.routes) this.drawRoute(ctx, lay, rt);
    for (const rt of lay.routes) this.drawVehicle(ctx, lay, rt, t);
    const here = this.here(g), coins = this.coins(g);
    for (const s of lay.subs) this.drawSub(ctx, lay, s);
    for (const k of Object.keys(lay.places)) this.drawPlace(ctx, lay, lay.places[k], t, k === here, this.visited(g, k), coins[k]);
    this.drawHat(ctx, lay, lay.places[here], t);
    if (this.sel) this.drawBubble(ctx, lay, this.bubbleLines(g, this.sel), t);
  },

  emoji(ctx, ch, x, y, size) {
    ctx.font = `${Math.round(size)}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, y + size * 0.06);
  },
  star(ctx, x, y, r, color) {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  },
  cloudPuff(ctx, x, y, s, a) {
    ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath();
    ctx.arc(x - s * 0.9, y, s * 0.55, 0, Math.PI * 2); ctx.arc(x, y - s * 0.25, s * 0.75, 0, Math.PI * 2); ctx.arc(x + s * 0.9, y, s * 0.55, 0, Math.PI * 2);
    ctx.fill(); ctx.fillRect(x - s * 0.9, y - s * 0.05, s * 1.8, s * 0.6);
  },
  drawScenery(ctx, lay, t) {
    const { W, H, R } = lay, S = lay.scene, hz = S.horizon;
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, hz + 40);
    sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#d9f2ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hz + 40);
    // drifting clouds
    for (let i = 0; i < 4; i++) {
      const s = R * (0.35 + (i % 2) * 0.12), x = ((i * 0.29 + t * 0.008 * (1 + i * 0.3)) % 1.2 - 0.1) * W, y = hz * (0.25 + 0.17 * i);
      this.cloudPuff(ctx, x, y, s, 0.7);
    }
    // snowy mountains behind the snowy places
    for (const [x, top, w, base] of S.mountains) {
      ctx.fillStyle = '#8aa0c8'; ctx.beginPath(); ctx.moveTo(x - w, base); ctx.lineTo(x, top); ctx.lineTo(x + w, base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7189b6'; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + w, base); ctx.lineTo(x + w * 0.25, base); ctx.closePath(); ctx.fill();
      const k = 0.32; ctx.fillStyle = '#ffffff'; ctx.beginPath();
      ctx.moveTo(x, top); ctx.lineTo(x + w * k, top + (base - top) * k);
      ctx.lineTo(x + w * k * 0.4, top + (base - top) * k * 0.8); ctx.lineTo(x, top + (base - top) * k * 1.05);
      ctx.lineTo(x - w * k * 0.4, top + (base - top) * k * 0.8); ctx.lineTo(x - w * k, top + (base - top) * k); ctx.closePath(); ctx.fill();
    }
    // a green hill under each hill place (rising from the horizon, or a mound on the land when it is lower down)
    const hill = ([x, top, w, base]) => { ctx.fillStyle = '#8fd46a'; ctx.beginPath(); ctx.ellipse(x, base, w, Math.max(4, base - top), 0, Math.PI, 0); ctx.fill(); };
    for (const h of S.hills) if (h[3] <= hz + 25) hill(h);
    // the land, with a soft wavy horizon
    ctx.fillStyle = '#a6e07a'; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, hz + Math.sin(x / 70) * 6);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 26; i++) { const x = ((i * 137) % 997) / 997 * W, y = hz + 20 + ((i * 71) % 487) / 487 * (H - hz - 20); ctx.beginPath(); ctx.ellipse(x, y, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); }
    for (const h of S.hills) if (h[3] > hz + 25) hill(h);
    // the sea along the bottom (when there are seaside places), with a sandy beach and moving waves
    if (S.seaTop != null) {
      const X0 = -0.05 * W, Y0 = S.seaTop, X1 = 1.05 * W, Y1 = H * 1.1;
      ctx.fillStyle = '#ffe6a8'; U.roundRect(ctx, X0 - 10, Y0 - 10, X1 - X0 + 20, Y1 - Y0 + 20, 60); ctx.fill();
      const sea = ctx.createLinearGradient(0, Y0, 0, H); sea.addColorStop(0, '#5cc6f2'); sea.addColorStop(1, '#2f97d9');
      ctx.fillStyle = sea; U.roundRect(ctx, X0, Y0, X1 - X0, Y1 - Y0, 54); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) {
        const x = X0 + 30 + (((i * 0.37 + t * 0.012) % 1) * (Math.min(X1, W) - X0 - 60)), y = Y0 + 22 + ((i * 53) % 97) / 97 * (Math.min(Y1, H) - Y0 - 34);
        ctx.beginPath(); ctx.arc(x - 6, y, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(x + 6, y, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      }
    }
    // a starry patch around each space place, with twinkling stars
    for (const Q of S.spaces) {
      const p = lay.places[Q.key], rr = 40;
      const sp = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, Math.max(Q.x1 - Q.x0, Q.y1 - Q.y0));
      sp.addColorStop(0, '#3a2f7a'); sp.addColorStop(1, '#151a3d');
      ctx.fillStyle = sp; U.roundRect(ctx, Q.x0, Q.y0, Q.x1 - Q.x0, Q.y1 - Q.y0, rr); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.setLineDash([2, 8]); U.roundRect(ctx, Q.x0, Q.y0, Q.x1 - Q.x0, Q.y1 - Q.y0, rr); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); U.roundRect(ctx, Q.x0, Q.y0, Q.x1 - Q.x0, Q.y1 - Q.y0, rr); ctx.clip();
      for (let i = 0; i < 18; i++) {
        const x = Q.x0 + 8 + ((i * 89) % 101) / 101 * (Q.x1 - Q.x0 - 16), y = Q.y0 + 8 + ((i * 47) % 103) / 103 * (Q.y1 - Q.y0 - 16);
        const a = 0.45 + 0.55 * Math.abs(Math.sin(t * (1.2 + (i % 5) * 0.35) + i));
        this.star(ctx, x, y, 2 + (i % 3) * 1.3 * a, `rgba(255,${240 - (i % 3) * 20},${200 + (i % 2) * 55},${a.toFixed(3)})`);
      }
      ctx.restore();
    }
    // a few friendly things to look at (gently bobbing)
    for (const [ch, x, y, k] of lay.decor) {
      const bob = Math.sin(t * 1.6 + x * 0.01) * 3;
      this.emoji(ctx, ch, x, y + bob, R * 0.75 * k);
    }
    // the sky places float on a bed of clouds
    for (const key of S.skies) {
      const cp = lay.places[key];
      this.cloudPuff(ctx, cp.x - R * 0.95, cp.y + R * 0.55, R * 0.42, 0.9); this.cloudPuff(ctx, cp.x + R * 0.95, cp.y + R * 0.5, R * 0.46, 0.9);
    }
  },

  drawRoute(ctx, lay, rt) {
    const s = rt.r.style, pts = rt.pts, line = () => { ctx.beginPath(); ctx.moveTo(rt.a.x, rt.a.y); ctx.quadraticCurveTo(rt.cx, rt.cy, rt.b.x, rt.b.y); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (s === 'road') {
      ctx.strokeStyle = '#6f6f78'; ctx.lineWidth = 14; line(); ctx.stroke();
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 9]); line(); ctx.stroke(); ctx.setLineDash([]);
    } else if (s === 'rail') {
      ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 3;
      for (let i = 1; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i + 1], [x, y] = pts[i], dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * 8, ny = dx / l * 8;
        ctx.beginPath(); ctx.moveTo(x - nx, y - ny); ctx.lineTo(x + nx, y + ny); ctx.stroke();
      }
      ctx.strokeStyle = '#6b6b75'; ctx.lineWidth = 2.5;
      for (const off of [-5, 5]) {
        ctx.beginPath();
        pts.forEach(([x, y], i) => { const j = Math.min(pts.length - 1, Math.max(1, i)), [ax, ay] = pts[j - 1], [bx, by] = pts[j], l = Math.hypot(bx - ax, by - ay) || 1, X = x - (by - ay) / l * off, Y = y + (bx - ax) / l * off; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
        ctx.stroke();
      }
    } else if (s === 'cable') {
      ctx.strokeStyle = '#3d3d48'; ctx.lineWidth = 2.5; line(); ctx.stroke();
      ctx.fillStyle = '#8d5a2b';
      for (const u of [0.33, 0.66]) { const [x, y] = pts[Math.round(u * 40)]; ctx.fillRect(x - 2.5, y - 2, 5, 22); }
    } else {
      const col = rt.r.col || { tunnel: '#7a52c7', water: '#ffffff', space: '#ffd84a', air: '#ffffff' }[s] || '#fff';
      ctx.strokeStyle = s === 'air' ? 'rgba(80,140,200,0.35)' : s === 'tunnel' ? col + '44' : 'rgba(0,0,0,0.12)';
      ctx.lineWidth = s === 'tunnel' ? 12 : 8; line(); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.setLineDash([1, 11]); line(); ctx.stroke(); ctx.setLineDash([]);
    }
  },
  // where along a route a vehicle is (0..1) and which way it is going
  vehicleAt(rt, t) {
    const sp = 0.32 + (rt.r.ico.charCodeAt(0) % 7) * 0.02;
    if (rt.r.loop) { const k = (t * sp * 0.5 + rt.r.a.length * 0.13) % 1; return { u: 0.18 + 0.64 * k, dir: 1, fade: Math.min(1, k * 6, (1 - k) * 6) }; }
    const ph = t * sp + rt.r.b.length;
    return { u: 0.2 + 0.6 * (0.5 - 0.5 * Math.cos(ph)), dir: Math.sin(ph) >= 0 ? 1 : -1, fade: 1 };
  },
  drawVehicle(ctx, lay, rt, t) {
    const v = this.vehicleAt(rt, t), f = v.u * 40, i = Math.min(39, Math.floor(f)), k = f - i, [x0, y0] = rt.pts[i], [x1, y1] = rt.pts[i + 1];
    const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k, dx = (x1 - x0) * v.dir;
    const size = lay.R * 0.72, bob = rt.r.style === 'water' ? Math.sin(t * 3) * 2.5 : rt.r.style === 'cable' ? 6 : Math.sin(t * 6) * 1;
    ctx.save(); ctx.globalAlpha = v.fade;
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x, y + bob, size * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.translate(x, y + bob);
    if (rt.r.style === 'water') ctx.rotate(Math.sin(t * 2.2) * 0.08);
    if (!rt.r.loop && dx > 0 && rt.r.style !== 'cable' && rt.r.style !== 'tunnel') ctx.scale(-1, 1);   // the emoji face left
    this.emoji(ctx, rt.r.ico, 0, 0, size);
    ctx.restore();
  },
  drawSub(ctx, lay, s) {
    const sel = this.sel && this.sel.kind === 'sub' && this.sel.key === s.place && this.sel.i === s.i;
    const sc = sel ? 1 + 0.25 * Math.exp(-this.sel.t * 5) * Math.abs(Math.sin(this.sel.t * 14)) : 1;
    ctx.save(); ctx.translate(s.x, s.y); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(1, 2.5, s.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.strokeStyle = sel ? '#e4572e' : '#e9c48a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, s.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    this.emoji(ctx, s.ico, 0, 0, s.r * 1.15);
    ctx.restore();
    if (s.lab) {
      ctx.font = this.font(s.fs); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,248,238,0.9)'; ctx.strokeText(s.name, s.x, s.lab.y0 + 1);
      ctx.fillStyle = '#5a3d22'; ctx.fillText(s.name, s.x, s.lab.y0 + 1);
    }
  },
  drawPlace(ctx, lay, p, t, here, seen, coins) {
    const P = this.place(p.key), R = lay.R;
    const sel = this.sel && this.sel.kind === 'place' && this.sel.key === p.key;
    const sc = sel ? 1 + 0.18 * Math.exp(-this.sel.t * 4) * Math.abs(Math.sin(this.sel.t * 12)) : 1;
    const bob = Math.sin(t * 1.3 + p.x * 0.01) * 1.5;
    // a soft glow ring where the chef is
    if (here) {
      const k = (t % 1.6) / 1.6;
      ctx.strokeStyle = `rgba(228,87,46,${(0.6 * (1 - k)).toFixed(3)})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(p.x, p.y + bob, R + 4 + k * 14, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.save(); ctx.translate(p.x, p.y + bob); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(60,40,20,0.22)'; ctx.beginPath(); ctx.ellipse(2, R * 0.92, R * 0.95, R * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    const gr = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R);
    gr.addColorStop(0, P.dark ? '#5a5ca8' : '#ffffff'); gr.addColorStop(1, P.col);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = Math.max(3, R * 0.1); ctx.strokeStyle = here ? '#e4572e' : sel ? '#f2b134' : '#ffffff'; ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(90,61,34,0.35)'; ctx.beginPath(); ctx.arc(0, 0, R + Math.max(3, R * 0.1) / 2 + 0.5, 0, Math.PI * 2); ctx.stroke();
    this.emoji(ctx, P.ico, 0, 0, R * 1.05);
    ctx.restore();
    // name label
    const L = p.label, y = L.y0 + bob;
    ctx.fillStyle = 'rgba(60,40,20,0.2)'; U.roundRect(ctx, L.x0 + 1, y + 2, L.x1 - L.x0, L.y1 - L.y0, (L.y1 - L.y0) / 2); ctx.fill();
    ctx.fillStyle = here ? '#e4572e' : '#fff8ee'; U.roundRect(ctx, L.x0, y, L.x1 - L.x0, L.y1 - L.y0, (L.y1 - L.y0) / 2); ctx.fill();
    ctx.strokeStyle = here ? '#b8401c' : '#e9c48a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = this.font(lay.fs); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = here ? '#ffffff' : '#2b1d14'; ctx.fillText(p.name, p.x, y + (L.y1 - L.y0) / 2 + 1);
    // the Pizza Coin badge: found / hidden here
    if (coins && coins.n) {
      const bx = p.x + R * 0.78, by = p.y + R * 0.62 + bob, br = R * 0.36, full = coins.got >= coins.n;
      const txt = `${coins.got}/${coins.n}`;
      ctx.font = this.font(Math.max(10, Math.round(br * 0.78)));
      const tw = ctx.measureText(txt).width, w = br * 2 + tw + 8;
      ctx.fillStyle = full ? '#fff3b0' : '#ffffff'; U.roundRect(ctx, bx - br, by - br, w, br * 2, br); ctx.fill();
      ctx.strokeStyle = '#e09b14'; ctx.lineWidth = 2; ctx.stroke();
      if (typeof PizzaCoinsExt !== 'undefined' && PizzaCoinsExt.drawCoin) PizzaCoinsExt.drawCoin(ctx, bx, by, br * 0.78, 0);
      else { ctx.fillStyle = '#ffcf3a'; ctx.beginPath(); ctx.arc(bx, by, br * 0.78, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = full ? '#b5770f' : '#5a3d22'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, bx + br + 2, by + 1);
    }
    // not been there yet: a question mark and a twinkle
    if (!seen) {
      const qx = p.x - R * 0.74, qy = p.y - R * 0.7 + bob;
      ctx.fillStyle = '#7a52c7'; ctx.beginPath(); ctx.arc(qx, qy, R * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = this.font(Math.round(R * 0.4), 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', qx, qy + 1);
      const a = Math.abs(Math.sin(t * 2.2 + p.x));
      this.star(ctx, p.x + R * 0.7, p.y - R * 0.85 + bob, 3 + a * 5, `rgba(255,236,140,${(0.4 + 0.6 * a).toFixed(3)})`);
    }
  },
  // the bouncing chef hat over the place the chef is in now
  drawHat(ctx, lay, p, t) {
    if (!p) return;
    const R = lay.R, s = U.clamp(R * 0.44, 12, 24), hop = Math.abs(Math.sin(t * 3.2)) * R * 0.28;
    const x = p.x, y = p.y - R - s * 0.55 - hop;
    ctx.fillStyle = 'rgba(60,40,20,0.2)'; ctx.beginPath(); ctx.ellipse(x, p.y - R + 2, s * (0.9 - hop / (R * 0.9)), s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3.2) * 0.08);
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.55); ctx.lineTo(s * 0.3, s * 0.55); ctx.lineTo(0, s * 1.0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#c9b8a6'; ctx.lineWidth = 1.6;
    U.roundRect(ctx, -s * 0.62, -s * 0.05, s * 1.24, s * 0.62, s * 0.12); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(-s * 0.5, -s * 0.35, s * 0.42, 0, Math.PI * 2); ctx.arc(s * 0.5, -s * 0.35, s * 0.42, 0, Math.PI * 2); ctx.arc(0, -s * 0.62, s * 0.55, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-s * 0.58, -s * 0.4, s * 1.16, s * 0.46);
    ctx.strokeStyle = '#e8ddd0'; ctx.lineWidth = 1.2;
    for (const k of [-0.25, 0.25]) { ctx.beginPath(); ctx.moveTo(k * s, s * 0.02); ctx.lineTo(k * s, s * 0.5); ctx.stroke(); }
    ctx.restore();
  },
  // the speech bubble over the tapped place (or under it, when there is no room above)
  drawBubble(ctx, lay, lines, t) {
    const sel = this.sel, p = lay.places[sel.key], s = sel.kind === 'sub' ? lay.subs.find((q) => q.place === sel.key && q.i === sel.i) : null;
    const ax = s ? s.x : p.x, ay = s ? s.y : p.y, ar = s ? s.r : lay.R;
    const fs = U.clamp(Math.round(lay.R * 0.38), 14, 19), pad = 12, maxW = Math.min(lay.W - 24, Math.max(240, fs * 20));
    const rows = [];
    lines.forEach((ln, i) => {
      ctx.font = this.font(i === 0 ? fs + 3 : fs, i === 0 ? 900 : 700);
      for (const r of this.wrap(ctx, ln, maxW - pad * 2)) rows.push({ text: r, big: i === 0, w: ctx.measureText(r).width });
    });
    const lh = fs * 1.35, w = Math.min(maxW, Math.max(...rows.map((r) => r.w)) + pad * 2), h = rows.length * lh + pad * 2 - 2;
    const pop = Math.min(1, sel.t / 0.18), sc = 0.6 + 0.4 * U.easeOut(pop);
    let above = ay - ar - 18 - h > 6;
    if (!s && !above && ay + ar + 18 + h + 30 > lay.H) above = true;
    let bx = U.clamp(ax - w / 2, 8, lay.W - 8 - w), by = above ? ay - ar - 16 - h : ay + ar + (s ? 14 : 34);
    by = U.clamp(by, 6, lay.H - 6 - h);
    ctx.save(); ctx.translate(ax, ay); ctx.scale(sc, sc); ctx.translate(-ax, -ay); ctx.globalAlpha = pop;
    ctx.fillStyle = 'rgba(43,29,20,0.25)'; U.roundRect(ctx, bx + 2, by + 4, w, h, 16); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e9c48a'; ctx.lineWidth = 3;
    U.roundRect(ctx, bx, by, w, h, 16); ctx.fill(); ctx.stroke();
    // the tail points at the place
    const tx = U.clamp(ax, bx + 20, bx + w - 20), ty = above ? by + h : by, tip = above ? Math.min(ay - ar - 2, ty + 14) : Math.max(ay + ar + 2, ty - 14);
    ctx.beginPath(); ctx.moveTo(tx - 10, ty); ctx.lineTo(ax + (tx - ax) * 0.3, tip); ctx.lineTo(tx + 10, ty); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx - 10, ty); ctx.lineTo(ax + (tx - ax) * 0.3, tip); ctx.lineTo(tx + 10, ty); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(tx - 11.5, above ? ty - 4 : ty + 1, 23, 3.5);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    rows.forEach((r, i) => {
      ctx.font = this.font(r.big ? fs + 3 : fs, r.big ? 900 : 700); ctx.fillStyle = r.big ? '#2b1d14' : '#5a3d22';
      ctx.fillText(r.text, bx + w / 2, by + pad + lh * (i + 0.5));
    });
    ctx.restore();
  },
  wrap(ctx, text, maxW) {
    const words = text.split(' '), out = []; let cur = '';
    for (const w of words) { const n = cur ? cur + ' ' + w : w; if (cur && ctx.measureText(n).width > maxW) { out.push(cur); cur = w; } else cur = n; }
    if (cur) out.push(cur);
    return out;
  },
};

WorldMapExt.buildDom();
Game.ext.push(WorldMapExt);
