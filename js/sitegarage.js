'use strict';
// Construction Town's machine garage: a big friendly depot on the strip between the railway and the gravel road
// (north of the road, east of the station), one bay per machine: the bulldozer, the excavator, the crane truck,
// the dump truck and the two concrete mixers. Each bay has a big roll-up door, a name plate with the machine's
// picture, a cosy mattress with a pillow and a little bed-lamp; a moon-and-stars sign stands over the roof.
// Bedtime: when the sky turns to dusk every machine nobody is driving drives itself home along the roads (an A*
// path over the map's obstacles, string-pulled to a few waypoints with rounded turns, gliding at a gentle speed,
// headlights on), noses into its own bay, stops, its lights go off, the door rolls down and a "Zzz" bubble floats
// up. In the morning the doors roll up, each machine hops "Good morning! ☀️", backs out and drives to its usual
// parking spot. The chef can also put a machine to bed any time: drive it into its own bay and stop ("Night night!
// 😴"), hop out (the chef steps out in front of the bay) and the door rolls down; it sleeps until morning or until
// the chef presses '🌅 Wake up' at its door (tucked in during the day, it just naps for CFG.SITEGARAGE.NAP seconds). A new
// session starts in the morning, so machines saved asleep wake up when the game loads. Which machines are tucked in is saved (g.s.sitegarage.beds).
// Extension module: registered with Game.ext (first, so its button and hints beat the site's) and Render.ext.
CFG.SITEGARAGE = {
  X0: 3232, Y0: -106,               // the building's top-left corner (its back wall sits on the walkable edge below the rails)
  // keep east of x 3900 free: the ski lift station by the mine entrance (no garage, no self-driving paths in this box)
  KEEP_OUT: { x0: 3900, y0: -110, x1: 4500, y1: 200 },
  DOOR_Y: 44,                       // the front line: the doors come down to here (the gravel road starts at y 40)
  BACK: 12, OUTER: 16, WALL: 12, BAY_W: 96,
  PARK_Y: -36,                      // where a machine's centre rests in its bay (nose north)
  APPROACH_Y: 112,                  // the point on the road in front of each bay where the drive in starts
  MAT_Y: 76,                        // where the chef stands in front of a bay (the Wake-up spot)
  SIGN: { y: -150 },                // the moon-and-stars sign over the roof (centred on the building)
  // left to right, roughly in the order of where the machines park (the mixers come from the factory in the east); the
  // crane truck's boom rests over the back wall, so its bay is clear of the moon sign and of the train parked at the station
  BAYS: [
    { kind: 'bulldozer', id: 'bulldozer', name: 'dozer', label: 'DOZER', door: '#e4572e', bed: '#ffd2c2' },
    { kind: 'cranetruck', id: 'cranetruck', name: 'crane truck', label: 'CRANE', door: '#41b883', bed: '#cff3df' },
    { kind: 'excavator', id: 'excavator', name: 'digger', label: 'DIGGER', door: '#3b7dd8', bed: '#cfe2ff' },
    { kind: 'dumptruck', id: 'dumptruck', name: 'dump truck', label: 'DUMPER', door: '#f2b134', bed: '#fff0c4' },
    { kind: 'mixer', id: 'mixer0', name: 'mixer', label: 'MIXER', door: '#8e5bd1', bed: '#e7d8fb' },
    { kind: 'mixer', id: 'mixer1', name: 'mixer', label: 'MIXER', door: '#ff6f9a', bed: '#ffd9e5' },
  ],
  SPEED: 120, BACK_SPEED: 70,       // px/s driving home, backing out of a bay
  CELL: 16, PLAN_R: 30,             // path planning grid and the clearance kept from every obstacle (vehicles are r 20..24)
  FILLET: 56,                       // how round the turns are
  DOOR_T: 1.2,                      // seconds for a door to roll up or down
  START_GAP: 0.5,                   // seconds between machines setting off at bedtime
  NAP: 40,                          // a machine tucked in during the day naps this long, then wakes up by itself
};
(() => {
  const G = CFG.SITEGARAGE;
  G.BAYS.forEach((b, i) => { b.i = i; b.x0 = G.X0 + G.OUTER + i * (G.BAY_W + G.WALL); b.x1 = b.x0 + G.BAY_W; b.cx = b.x0 + G.BAY_W / 2; });
  G.X1 = G.BAYS[G.BAYS.length - 1].x1 + G.OUTER;
  G.SIGN.x = (G.X0 + G.X1) / 2;
})();

const SiteGarageExt = {
  name: 'sitegarage',
  st: null,
  defaults: { sitegarage: { beds: {}, toasted: false, tucks: 0, wakes: 0 } },

  // ---------- state ----------
  build(g) {
    if (!g.s.sitegarage) g.s.sitegarage = JSON.parse(JSON.stringify(this.defaults.sitegarage));
    if (!g.s.sitegarage.beds || typeof g.s.sitegarage.beds !== 'object') g.s.sitegarage.beds = {};
    const m = {};
    for (const b of CFG.SITEGARAGE.BAYS) m[b.id] = { id: b.id, kind: b.kind, state: 'out', bay: null, trip: null, t: 0, hop: 0 };
    this.st = {
      m, doors: CFG.SITEGARAGE.BAYS.map(() => ({ d: 0 })),
      placed: false, night: null, lastDriven: null, inBay: null, saidNight: false, wrongT: 0,
      grid: null, obs: null,
    };
  },
  // the six machines: the core's three, the crane truck and the two mixers (looked up live: they are rebuilt on a reset)
  vehicleOf(g, id) {
    if (id === 'excavator' || id === 'dumptruck' || id === 'bulldozer') return g[id] || null;
    if (typeof SiteTownExt === 'undefined' || !SiteTownExt.mixers) return null;
    if (id === 'cranetruck') return SiteTownExt.crane || null;
    if (id === 'mixer0') return SiteTownExt.mixers[0] || null;
    if (id === 'mixer1') return SiteTownExt.mixers[1] || null;
    return null;
  },
  idOf(g, v) {
    if (!v) return null;
    for (const b of CFG.SITEGARAGE.BAYS) if (this.vehicleOf(g, b.id) === v) return b.id;
    return null;
  },
  // where each machine usually parks (and which way it faces there)
  homeOf(id) {
    const SV = CFG.SITE.VEHICLES, ST = typeof CFG.SITETOWN !== 'undefined' ? CFG.SITETOWN : null;
    if (id === 'excavator') return { x: SV.excavator.x, y: SV.excavator.y, angle: 0.4 };
    if (id === 'dumptruck') return { x: SV.dumptruck.x, y: SV.dumptruck.y, angle: Math.PI };
    if (id === 'bulldozer') return { x: SV.bulldozer.x, y: SV.bulldozer.y, angle: -0.5 };
    if (id === 'cranetruck') return { x: ST.CRANETRUCK.x, y: ST.CRANETRUCK.y, angle: ST.CRANETRUCK.angle };
    const M = ST.MIXERS[id === 'mixer0' ? 0 : 1]; return { x: M.x, y: M.y, angle: M.angle };
  },
  bay(i) { return CFG.SITEGARAGE.BAYS[i]; },
  // the bay rect a machine's centre must be in to count as parked inside (x within the walls, well past the door)
  bayRect(i) { const G = CFG.SITEGARAGE, b = this.bay(i); return { x0: b.x0, y0: G.Y0 + G.BACK, x1: b.x1, y1: G.DOOR_Y }; },
  bayAt(x, y, deep) {
    const G = CFG.SITEGARAGE;
    if (y < G.Y0 || y > G.DOOR_Y - (deep ? 26 : 0)) return null;
    for (const b of G.BAYS) if (x > b.x0 && x < b.x1) return b.i;
    return null;
  },
  // who has a bay: a machine heading there, settling in or asleep in it
  claimer(i) { for (const k in this.st.m) { const m = this.st.m[k]; if (m.bay === i && (m.state === 'toBed' || m.state === 'parking' || m.state === 'asleep')) return m; } return null; },
  fits(m, i) { const b = this.bay(i), c = this.claimer(i); return b.kind === m.kind && (!c || c === m); },
  // the bay a machine sleeps in: its own, or (the mixers are twins) the other mixer bay when its own is taken
  bedFor(m) {
    const own = CFG.SITEGARAGE.BAYS.find((b) => b.id === m.id).i;
    if (this.fits(m, own)) return own;
    const alt = CFG.SITEGARAGE.BAYS.find((b) => b.kind === m.kind && b.i !== own && this.fits(m, b.i));
    return alt ? alt.i : null;
  },
  isNight() {
    if (typeof AtmosphereExt === 'undefined') return false;
    const p = AtmosphereExt.phase; return p === 'dusk' || p === 'dawn';
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing && !(typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))); },
  asleep(i) { const c = this.claimer(i); return !!c && c.state === 'asleep'; },
  anyAsleep() { for (const k in this.st.m) if (this.st.m[k].state === 'asleep') return true; return false; },
  nearGarage(g) {
    const G = CFG.SITEGARAGE, p = g.player;
    return g.area === 'site' && p.x > G.X0 - 70 && p.x < G.X1 + 70 && p.y < G.DOOR_Y + 120;
  },

  // ---------- game hooks ----------
  obstacles(g) {
    if (g.area !== 'site') return [];
    const G = CFG.SITEGARAGE, o = this.walls();
    if (this.st) for (const b of G.BAYS) if (this.st.doors[b.i].d > 0.6) o.push({ x: b.x0, y: G.DOOR_Y - 10, w: G.BAY_W, h: 12 });   // a closed door
    return o;
  },
  walls() {
    const G = CFG.SITEGARAGE, o = [], top = G.Y0, h = G.DOOR_Y - G.Y0;
    o.push({ x: G.X0, y: top, w: G.X1 - G.X0, h: G.BACK });                         // the back wall
    o.push({ x: G.X0, y: top, w: G.OUTER, h }, { x: G.X1 - G.OUTER, y: top, w: G.OUTER, h });   // the end walls
    for (let i = 0; i < G.BAYS.length - 1; i++) o.push({ x: G.BAYS[i].x1, y: top, w: G.WALL, h });   // walls between the bays
    return o;
  },
  action(g) {
    if (!this.st || g.area !== 'site' || g.travel || g.onTrain) return null;
    const G = CFG.SITEGARAGE, p = g.player;
    if (g.driving) {
      const id = this.idOf(g, g.vehicle); if (!id) return null;
      const m = this.st.m[id], v = g.vehicle, i = this.bayAt(v.x, v.y, true);
      if (i !== null && this.fits(m, i) && Math.hypot(v.vx, v.vy) < 15) return { label: '😴 Tuck in', run: (gg) => { gg.exitCar(); this.afterExit(gg, v); } };
      return null;
    }
    if (!this.onFoot(g)) return null;
    for (const b of G.BAYS) if (this.asleep(b.i) && U.dist(p.x, p.y, b.cx, G.MAT_Y) < 44) return { label: '🌅 Wake up', run: (gg) => this.wakeBay(gg, b.i, true) };
    return null;
  },
  hint(g) {
    if (!this.st || g.area !== 'site' || g.travel || g.onTrain || g.ride || g.fishing) return undefined;
    const G = CFG.SITEGARAGE, p = g.player;
    if (g.driving) {
      const id = this.idOf(g, g.vehicle); if (!id) return undefined;
      const m = this.st.m[id], v = g.vehicle, i = this.bayAt(v.x, v.y, true);
      if (i !== null) {
        if (this.fits(m, i)) return { text: Math.hypot(v.vx, v.vy) < 15 ? 'Night night! Press the button to tuck it in 😴' : 'Night night! 😴', target: null };
        const own = this.bedFor(m); return { text: `That's the ${this.bay(i).name}'s bed! 🛏️`, target: own === null ? null : { x: this.bay(own).cx, y: G.PARK_Y } };
      }
      const own = this.bedFor(m); if (own === null) return undefined;
      const b = this.bay(own);
      if (U.dist(v.x, v.y, b.cx, G.APPROACH_Y) < 230) return { text: 'Park in your bay to sleep! 🛏️', target: { x: b.cx, y: G.PARK_Y } };
      return undefined;
    }
    if (!this.onFoot(g) || !this.nearGarage(g)) return undefined;
    for (const b of G.BAYS) if (this.asleep(b.i) && U.dist(p.x, p.y, b.cx, G.MAT_Y) < 44) return { text: 'Shh… it is sleeping 😴 Press 🌅 to wake it up', target: null };
    if (this.isNight() || this.anyAsleep()) return { text: 'Shh… the machines are sleeping 😴', target: null };
    return undefined;
  },
  home(g) {
    if (!this.st) return;
    this.st.inBay = null; this.st.saidNight = false;
  },
  // a save or a push that left the chef behind a closed door or in a wall goes out onto the road in front of the bays
  rescue(g) {
    const G = CFG.SITEGARAGE, p = g.player;
    if (g.area !== 'site' || !this.onFoot(g)) return false;
    if (p.x < G.X0 - 12 || p.x > G.X1 + 12 || p.y > G.DOOR_Y + 12 || p.y < G.Y0 - 20) return false;
    const i = this.bayAt(p.x, p.y);
    const inWall = this.walls().some((o) => g.hitRect(p.x, p.y, 4, o));
    if (!inWall && !(i !== null && this.st.doors[i].d > 0.6 && p.y < G.DOOR_Y - 10)) return false;
    const b = i !== null ? this.bay(i) : G.BAYS.slice().sort((a, c) => Math.abs(a.cx - p.x) - Math.abs(c.cx - p.x))[0];
    p.x = b.cx; p.y = G.MAT_Y; p.moving = false;
    return true;
  },

  // ---------- update ----------
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, G = CFG.SITEGARAGE, s = g.s.sitegarage;
    if (typeof SiteTownExt !== 'undefined' && !SiteTownExt.mixers) return;   // the mixers are made on the site's first build
    if (!st.placed) this.placeSleepers(g);
    // the sky: bedtime when dusk falls, morning when the day comes back
    const night = this.isNight();
    if (st.night === null) {
      st.night = night;
      // a new session always starts in the morning: whoever was put to bed last time wakes up now
      if (!night && this.anyAsleep()) this.morning(g);
    } else if (night !== st.night) { st.night = night; if (night) this.bedtime(g); else this.morning(g); }
    // a daytime nap: a machine tucked in while the sun is up wakes by itself after a little while
    if (!night) for (const b of G.BAYS) {
      const m = st.m[b.id];
      if (m.state === 'asleep' && m.napUntil && g.time >= m.napUntil) { m.napUntil = null; this.forget(g, m); m.state = 'waking'; m.t = 0; m.wakeAt = 2.0; m.hopped = false; m.hop = 0; m.trip = null; }
    }
    // the chef driving a machine: no self-driving for that one; parking in a bay; hopping out tucks it in
    const drv = g.driving ? g.vehicle : null, did = this.idOf(g, drv);
    if (did) this.driven(g, st.m[did], drv);
    else { st.inBay = null; st.saidNight = false; }
    if (st.lastDriven && st.lastDriven !== drv) this.afterExit(g, st.lastDriven);
    st.lastDriven = did ? drv : null;
    st.wrongT = Math.max(0, st.wrongT - dt);
    // each machine
    G.BAYS.forEach((b, k) => {
      const m = st.m[b.id], v = this.vehicleOf(g, b.id); if (!v) return;
      if (v === drv) return;
      if (m.state === 'toBed' || m.state === 'toHome') this.stepTrip(g, m, v, dt, k);
      else if (m.state === 'parking') this.stepParking(g, m, v, dt);
      else if (m.state === 'asleep') { const B = this.bay(m.bay); v.x = B.cx; v.y = G.PARK_Y; v.angle = -Math.PI / 2; v.vx = 0; v.vy = 0; }
      else if (m.state === 'waking') this.stepWaking(g, m, v, dt);
      else if (m.state === 'turning') { if (this.turnTo(v, m.angle, dt)) m.state = 'out'; }
    });
    // the doors: down over a settled (or sleeping) machine, as long as the chef is not standing under it
    for (const b of G.BAYS) {
      const door = st.doors[b.i], c = this.claimer(b.i);
      let want = c && (c.state === 'asleep' || (c.state === 'parking' && c.settled)) ? 1 : 0;
      const p = g.player;
      if (want && door.d < 1 && !g.driving && p.x > b.x0 - 8 && p.x < b.x1 + 8 && p.y > G.Y0 && p.y < G.DOOR_Y + 14) want = 0;
      if (want && door.d < 1 && g.driving && g.vehicle !== this.vehicleOf(g, c.id) && this.bayAt(g.vehicle.x, g.vehicle.y) === b.i) want = 0;
      const was = door.d;
      door.d = want ? Math.min(1, door.d + dt / G.DOOR_T) : Math.max(0, door.d - dt / G.DOOR_T);
      if (door.d > 0.999) door.d = 1; else if (door.d < 0.001) door.d = 0;
      if (want && was < 1 && door.d >= 1 && c.state === 'parking') this.fallAsleep(g, c);
    }
    if (g.area === 'site') this.rescue(g);
    void s;
  },
  // a reload (or a reset) puts the tucked-in machines straight back in their bays with the doors shut
  placeSleepers(g) {
    const st = this.st, G = CFG.SITEGARAGE, beds = g.s.sitegarage.beds;
    for (const id of Object.keys(beds)) {
      const m = st.m[id], i = beds[id], v = this.vehicleOf(g, id);
      if (!m || !v || typeof i !== 'number' || !this.bay(i) || this.bay(i).kind !== m.kind || this.claimer(i)) { delete beds[id]; continue; }
      m.state = 'asleep'; m.bay = i; m.trip = null;
      v.x = this.bay(i).cx; v.y = G.PARK_Y; v.angle = -Math.PI / 2; v.vx = 0; v.vy = 0;
      st.doors[i].d = 1;
    }
    st.placed = true;
  },
  // the chef is driving machine m: cancel any self-driving, notice the bays
  driven(g, m, v) {
    const st = this.st;
    if (m.state !== 'out') {
      if (m.state === 'asleep' || m.state === 'parking') this.forget(g, m);
      m.state = 'out'; m.trip = null; m.bay = null; m.settled = false;
    }
    const i = this.bayAt(v.x, v.y, true);
    if (i !== st.inBay) {
      st.inBay = i; st.saidNight = false;
      if (i !== null && !this.fits(m, i) && st.wrongT <= 0) {
        st.wrongT = 1.5;
        g.floats.push({ x: v.x, y: v.y - 60, text: `That's the ${this.bay(i).name}'s bed! 🛏️`, color: '#ffe08a', t: 0, dur: 1.8, big: true });
        Haptics.tap();
      }
    }
    if (i !== null && this.fits(m, i) && !st.saidNight && Math.hypot(v.vx, v.vy) < 15) {
      st.saidNight = true;
      g.floats.push({ x: v.x, y: v.y - 64, text: 'Night night! 😴', color: '#ffe08a', t: 0, dur: 1.8, big: true });
      Sfx.pickup(); Haptics.tap();
    }
  },
  // the chef just stopped driving v: in its own bay it is tucked in (the chef steps out in front of the bay)
  afterExit(g, v) {
    const id = this.idOf(g, v); if (!id || g.driving && g.vehicle === v) return;
    const m = this.st.m[id], G = CFG.SITEGARAGE;
    if (m.state !== 'out') return;
    const i = this.bayAt(v.x, v.y, true);
    if (i === null || !this.fits(m, i)) return;
    const p = g.player, b = this.bay(i);
    if (g.area === 'site' && U.dist(p.x, p.y, v.x, v.y) < 110) { p.x = b.cx; p.y = G.MAT_Y; p.moving = false; p.facing = 1; }
    this.st.inBay = null; this.st.saidNight = false;
    m.state = 'parking'; m.bay = i; m.settled = false; m.trip = null; m.manual = true;
  },
  // ---------- bedtime and morning ----------
  bedtime(g) {
    const st = this.st, G = CFG.SITEGARAGE;
    let n = 0;
    for (const b of G.BAYS) {
      const m = st.m[b.id], v = this.vehicleOf(g, b.id); if (!v) continue;
      if (g.driving && g.vehicle === v) continue;               // it stays with the chef
      if (m.state !== 'out' && m.state !== 'toHome' && m.state !== 'turning' && m.state !== 'waking') continue;
      m.trip = null; m.bay = null;
      const i = this.bedFor(m); if (i === null) { m.state = 'out'; continue; }
      m.bay = i; m.settled = false; m.manual = false;
      // already standing in its own bay: just settle in
      if (this.bayAt(v.x, v.y) === i && v.y < G.DOOR_Y - 20) { m.state = 'parking'; continue; }
      m.state = 'toBed';
      m.trip = this.makeTrip(g, m, v, { x: this.bay(i).cx, y: G.PARK_Y, angle: -Math.PI / 2, bay: i }, n * G.START_GAP);
      if (!m.trip) { m.state = 'out'; m.bay = null; continue; }
      n++;
    }
    if (g.area === 'site' && !g.travel && n) {
      if (!g.s.sitegarage.toasted) { g.s.sitegarage.toasted = true; g.toast('🌙 The machines are going to bed!', true); }
    }
  },
  morning(g) {
    const st = this.st, G = CFG.SITEGARAGE;
    let k = 0;
    for (const b of G.BAYS) {
      const m = st.m[b.id], v = this.vehicleOf(g, b.id); if (!v) continue;
      if (g.driving && g.vehicle === v) continue;
      if (m.state === 'asleep' || m.state === 'parking') { this.forget(g, m); m.state = 'waking'; m.t = 0; m.wakeAt = 2.0 + k * 0.7; m.hopped = false; m.hop = 0; m.trip = null; k++; }
      else if (m.state === 'toBed') { m.bay = null; m.state = 'toHome'; m.trip = this.makeTrip(g, m, v, this.homeOf(m.id), 0); if (!m.trip) m.state = 'out'; }
    }
    if (k && g.area === 'site' && this.nearGarage(g)) Sfx.chime ? Sfx.chime() : Sfx.ding();
  },
  // the chef pressed Wake up at a closed door: it rolls up and the machine is awake (it stays in its bay)
  wakeBay(g, i, byChef) {
    const m = this.claimer(i), G = CFG.SITEGARAGE; if (!m) return;
    this.forget(g, m);
    m.state = 'waking'; m.t = 0; m.wakeAt = Infinity; m.hopped = false; m.hop = 0; m.trip = null; m.stay = !!byChef;
    if (byChef) { g.s.sitegarage.wakes = (g.s.sitegarage.wakes || 0) + 1; Sfx.ding(); Haptics.success(); }
    void G;
  },
  forget(g, m) { if (g.s.sitegarage.beds) delete g.s.sitegarage.beds[m.id]; },
  fallAsleep(g, m) {
    m.state = 'asleep'; m.trip = null;
    m.napUntil = this.isNight() ? null : g.time + CFG.SITEGARAGE.NAP;
    g.s.sitegarage.beds[m.id] = m.bay;
    if (m.manual) g.s.sitegarage.tucks = (g.s.sitegarage.tucks || 0) + 1;
    m.manual = false;
    const p = g.player, b = this.bay(m.bay);
    if (g.area === 'site' && U.dist(p.x, p.y, b.cx, CFG.SITEGARAGE.MAT_Y) < 400) Sfx.drop();
  },
  stepParking(g, m, v, dt) {
    const G = CFG.SITEGARAGE, b = this.bay(m.bay);
    const k = Math.min(1, dt * 4);
    v.x += (b.cx - v.x) * k; v.y += (G.PARK_Y - v.y) * k; v.vx = 0; v.vy = 0;
    this.turnTo(v, -Math.PI / 2, dt);
    if (!m.settled && U.dist(v.x, v.y, b.cx, G.PARK_Y) < 1.5 && Math.abs(this.wrap(v.angle + Math.PI / 2)) < 0.02) { m.settled = true; v.x = b.cx; v.y = G.PARK_Y; v.angle = -Math.PI / 2; }
  },
  stepWaking(g, m, v, dt) {
    const G = CFG.SITEGARAGE, b = this.bay(m.bay);
    m.t += dt;
    // the door rolls up first (it is not claimed any more), then a little hop and a yawn
    const hopT = G.DOOR_T + 0.1;
    if (m.t >= hopT && !m.hopped) {
      m.hopped = true; m.hop = 0;
      g.floats.push({ x: b.cx, y: G.PARK_Y - 70, text: 'Good morning! ☀️', color: '#ffe08a', t: 0, dur: 1.8, big: true });
      g.floats.push({ x: b.cx + 30, y: G.PARK_Y - 30, text: '🥱', color: '#fff8ee', t: 0, dur: 1.2, big: false });
    }
    if (m.hopped && m.hop < 0.5) { m.hop = Math.min(0.5, m.hop + dt); v.y = G.PARK_Y - Math.sin(m.hop / 0.5 * Math.PI) * 9; }
    else v.y = G.PARK_Y;
    v.x = b.cx; v.angle = -Math.PI / 2;
    if (m.stay && m.hop >= 0.5) { m.state = 'out'; m.bay = null; m.stay = false; return; }
    if (m.t >= m.wakeAt) {
      const home = this.homeOf(m.id); m.bay = null; m.state = 'toHome';
      m.trip = this.makeTrip(g, m, v, home, 0);
      if (!m.trip) m.state = 'out';
    }
  },
  wrap(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; },
  turnTo(v, a, dt, rate = 2.6) {
    const d = this.wrap(a - v.angle);
    if (Math.abs(d) < 0.01) { v.angle = a; return true; }
    v.angle += Math.sign(d) * Math.min(Math.abs(d), rate * dt);
    return false;
  },

  // ---------- trips ----------
  // A trip is a list of legs (polylines), driven one after the other; a leg can be a reverse (backing out of a bay).
  // goal: { x, y, angle, bay? } (a bay: drive in nose first from the road in front of it; a parking spot: arrive facing its angle)
  makeTrip(g, m, v, goal, delay) {
    const G = CFG.SITEGARAGE, legs = [];
    this.buildGrid(g);   // fresh obstacles for the checks below (shared by every machine setting off this frame)
    let from = { x: v.x, y: v.y };
    const inBay = this.bayAt(v.x, v.y);
    if (inBay !== null) {   // in a bay: back straight out onto the road first
      const out = { x: this.bay(inBay).cx, y: G.APPROACH_Y };
      if (goal.bay === inBay) return null;
      legs.push(this.leg([from, out], true));
      from = out;
    }
    let tail;
    if (goal.bay !== undefined) {
      const b = this.bay(goal.bay);
      tail = [{ x: b.cx, y: G.APPROACH_Y }, { x: b.cx, y: G.PARK_Y }];
    } else {
      const pre = { x: goal.x - Math.cos(goal.angle) * 70, y: goal.y - Math.sin(goal.angle) * 70 };
      tail = this.blockedAt(pre.x, pre.y, 22) ? [{ x: goal.x, y: goal.y }] : [pre, { x: goal.x, y: goal.y }];
    }
    const mid = this.findPath(g, from, tail[0]);
    if (!mid) return null;
    const pts = this.fillet([from].concat(mid, tail));
    legs.push(this.leg(pts, false));
    return { legs, k: 0, s: 0, sp: 0, delay: delay || 0, wait: 0, goal, honked: false, started: false };
  },
  leg(pts, rev) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    return { pts, cum, len: cum[cum.length - 1], rev };
  },
  pointAt(L, s) {
    s = U.clamp(s, 0, L.len);
    let i = 1; while (i < L.cum.length - 1 && L.cum[i] < s) i++;
    const a = L.pts[i - 1], b = L.pts[i], seg = L.cum[i] - L.cum[i - 1] || 1, k = (s - L.cum[i - 1]) / seg;
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
  },
  headingAt(L, s) {
    const a = this.pointAt(L, s - 4), b = this.pointAt(L, s + 10);
    if (Math.hypot(b.x - a.x, b.y - a.y) < 0.01) { const p = L.pts[L.pts.length - 1], q = L.pts[Math.max(0, L.pts.length - 2)]; return Math.atan2(p.y - q.y, p.x - q.x); }
    return Math.atan2(b.y - a.y, b.x - a.x);
  },
  stepTrip(g, m, v, dt, idx) {
    const tr = m.trip, G = CFG.SITEGARAGE;
    if (!tr) { m.state = 'out'; return; }
    v.vx = 0; v.vy = 0;
    if (tr.delay > 0) { tr.delay -= dt; return; }
    if (!tr.started) {
      tr.started = true;
      if (m.state === 'toBed' && g.area === 'site' && U.dist(g.player.x, g.player.y, v.x, v.y) < 500) g.floats.push({ x: v.x, y: v.y - 50, text: 'Bedtime! 🥱', color: '#fff8ee', t: 0, dur: 1.4, big: false });
    }
    const L = tr.legs[tr.k], last = tr.k === tr.legs.length - 1;
    const motion = this.headingAt(L, tr.s), want = L.rev ? motion + Math.PI : motion;
    // at the start of a leg, swing round on the spot to face the way it is going
    if (tr.s < 2 && Math.abs(this.wrap(want - v.angle)) > 0.3) { this.turnTo(v, want, dt, 2.4); tr.sp = 0; return; }
    // wait for the chef (on foot) or a machine ahead of it on the way
    const ax = v.x + Math.cos(motion) * 52, ay = v.y + Math.sin(motion) * 52, p = g.player;
    let blocked = false;
    if (g.area === 'site' && this.onFoot(g) && U.dist(p.x, p.y, ax, ay) < 46) {
      blocked = true;
      if (!tr.honked) { tr.honked = true; g.floats.push({ x: v.x, y: v.y - 50, text: 'Beep beep! 🚚', color: '#ffe08a', t: 0, dur: 1.2, big: true }); }
    }
    if (!blocked) G.BAYS.forEach((b, j) => {
      if (j >= idx || blocked) return;
      const o = this.st.m[b.id], ov = this.vehicleOf(g, b.id);
      if (!ov || !o.trip || o.trip.delay > 0 || (o.state !== 'toBed' && o.state !== 'toHome')) return;
      if (U.dist(ov.x, ov.y, ax, ay) < 60 && U.dist(ov.x, ov.y, v.x, v.y) > 20) blocked = true;
    });
    if (blocked && tr.wait < 3) { tr.wait += dt; tr.sp = 0; return; }
    if (!blocked) tr.wait = 0;
    const V = L.rev ? G.BACK_SPEED : G.SPEED;
    const target = last ? Math.min(V, 22 + (L.len - tr.s) * 1.6) : (L.rev ? Math.min(V, 18 + (L.len - tr.s) * 2) : V);
    tr.sp += (target - tr.sp) * Math.min(1, dt * 2.5);
    tr.s = Math.min(L.len, tr.s + Math.max(8, tr.sp) * dt);
    const q = this.pointAt(L, tr.s); v.x = q.x; v.y = q.y;
    const d = this.wrap(want - v.angle); v.angle += d * Math.min(1, dt * 7);
    if (tr.s >= L.len - 0.01) {
      if (!last) { tr.k++; tr.s = 0; tr.sp = 0; return; }
      // arrived
      const goal = tr.goal; m.trip = null;
      if (m.state === 'toBed') { m.state = 'parking'; m.settled = false; }
      else { v.x = goal.x; v.y = goal.y; m.angle = goal.angle; m.state = 'turning'; }
    }
  },
  lightsOn(m) { return (m.state === 'toBed' || m.state === 'toHome') && m.trip && m.trip.delay <= 0 && m.trip.started; },

  // ---------- path planning (A* on a grid over the map's obstacles, then string-pulled and rounded) ----------
  planObstacles(g) {
    const area = g.area; let obs;
    g.area = 'site';
    try { obs = g.townObstacles(true).slice(); } finally { g.area = area; }
    const W = CFG.SITE.WORLD;
    obs = obs.filter((o) => o.x < W.x1 && o.x + o.w > W.x0 && o.y < W.y1 && o.y + o.h > W.y0 - 40);
    const G = CFG.SITEGARAGE, box = (x0, y0, x1, y1) => obs.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    box(G.X0, G.Y0, G.X1, G.DOOR_Y);                                        // the garage itself (bays are entered by the last straight bit)
    { const K = G.KEEP_OUT; box(K.x0, K.y0, K.x1, K.y1); }   // the lift station's corner by the mine
    for (const mo of g.mounds || []) if (!mo.flat) { const r = mo.r * 0.75; box(mo.x - r, mo.y - r, mo.x + r, mo.y + r); }   // dirt piles
    for (const [x, y] of CFG.SITE.CONES) box(x - 6, y - 6, x + 6, y + 6);
    { const S = CFG.SITE.SIGN; box(S.x - 40, S.y - 50, S.x + 40, S.y + 6); }  // the UNDER CONSTRUCTION sign
    const T = typeof CFG.SITETOWN !== 'undefined' ? CFG.SITETOWN : null;
    if (T) {
      for (const h of T.HOUSES) box(h.x0 - 4, h.y1, h.x1 + 4, h.y1 + 12 + T.GARDEN_H);   // the fenced gardens
      const SL = T.SLIDE; box(SL.top.x - 40, SL.top.y - 30, SL.top.x + 40, SL.bottom.y + 40);
      const F = T.FACTORY; box(F.x0, F.y0, F.x1, F.y0 + 8); box(F.x0 - 2, F.y0, F.x0 + 6, F.y0 + 120); box(F.x0 - 2, F.y1 - 30, F.x0 + 6, F.y1);   // the factory fence (gate on the left)
      box(T.SIGN.x - 110, T.SIGN.y - 64, T.SIGN.x + 110, T.SIGN.y + 8);       // the WELCOME sign
      box(T.BUS.x - 26, T.BUS.y - 36, T.BUS.x + 34, T.BUS.y + 22);            // bus shelter
      for (const [x, y] of T.BEDS) box(x - 30, y - 12, x + 30, y + 12);       // flower beds
      for (const [x, y] of T.LAMPS) box(x - 4, y - 4, x + 4, y + 4);
      const P = T.PARK; box(P.x0 + 20, P.y0 + 20, P.x1, P.y1 - 20);           // keep off the park lawn
    }
    return obs;
  },
  blockedAt(x, y, R) {
    const W = CFG.SITE.WORLD;
    if (x < W.x0 + 30 || x > W.x1 - 30 || y > W.y1 - 30 || y < W.walkY0 + 12) return true;
    for (const o of this.st.obs || []) if (x + R > o.x && x - R < o.x + o.w && y + R > o.y && y - R < o.y + o.h) return true;
    return false;
  },
  onRoad(x, y) {
    const R = CFG.SITE.ROAD; if (y > R.y0 && y < R.y1) return true;
    const T = typeof CFG.SITETOWN !== 'undefined' ? CFG.SITETOWN : null; if (!T) return false;
    const inB = (b) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1;
    return inB(T.SITE_ROAD) || inB(T.SOUTH_ST) || inB(T.FACTORY);
  },
  buildGrid(g) {
    if (this.st.grid && this.st.gridAt === g.time) return this.st.grid;   // one grid for all the machines setting off together
    const G = CFG.SITEGARAGE, W = CFG.SITE.WORLD, cs = G.CELL, x0 = W.x0, y0 = W.walkY0;
    const nx = Math.ceil((W.x1 - x0) / cs), ny = Math.ceil((W.y1 - y0) / cs), R = G.PLAN_R;
    this.st.obs = this.planObstacles(g);
    const blocked = new Uint8Array(nx * ny), cost = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + i * cs + cs / 2, y = y0 + j * cs + cs / 2, k = j * nx + i;
      blocked[k] = this.blockedAt(x, y, R) ? 1 : 0;
      cost[k] = this.onRoad(x, y) ? 1 : 1.6;
    }
    // a little extra cost close to things, so the paths keep a friendly distance
    const near = new Uint8Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (blocked[j * nx + i]) for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < nx && b < ny) near[b * nx + a] = 1; }
    for (let k = 0; k < nx * ny; k++) if (near[k] && !blocked[k]) cost[k] += 0.8;
    this.st.grid = { nx, ny, cs, x0, y0, blocked, cost }; this.st.gridAt = g.time;
    return this.st.grid;
  },
  cellOf(gr, x, y) { return { i: U.clamp(Math.floor((x - gr.x0) / gr.cs), 0, gr.nx - 1), j: U.clamp(Math.floor((y - gr.y0) / gr.cs), 0, gr.ny - 1) }; },
  centre(gr, k) { const i = k % gr.nx, j = (k - i) / gr.nx; return { x: gr.x0 + i * gr.cs + gr.cs / 2, y: gr.y0 + j * gr.cs + gr.cs / 2 }; },
  nearestFree(gr, x, y) {
    const c = this.cellOf(gr, x, y);
    for (let r = 0; r < 30; r++) {
      let best = -1, bd = Infinity;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = c.i + di, j = c.j + dj; if (i < 0 || j < 0 || i >= gr.nx || j >= gr.ny) continue;
        const k = j * gr.nx + i; if (gr.blocked[k]) continue;
        const q = this.centre(gr, k), d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = k; }
      }
      if (best >= 0) return best;
    }
    return -1;
  },
  // A* from a to b: returns the waypoints in between (not a or b themselves), or null
  findPath(g, a, b) {
    const gr = this.buildGrid(g), n = gr.nx * gr.ny;
    const s = this.nearestFree(gr, a.x, a.y), e = this.nearestFree(gr, b.x, b.y);
    if (s < 0 || e < 0) return null;
    const gs = new Float32Array(n).fill(Infinity), from = new Int32Array(n).fill(-1), done = new Uint8Array(n);
    const heap = [], push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const ei = e % gr.nx, ej = (e - ei) / gr.nx;
    const h = (k) => { const i = k % gr.nx, j = (k - i) / gr.nx, dx = Math.abs(i - ei), dy = Math.abs(j - ej); return (Math.max(dx, dy) + 0.414 * Math.min(dx, dy)) * gr.cs; };
    gs[s] = 0; push(s, h(s));
    let found = false;
    while (heap.length) {
      const [, k] = pop(); if (done[k]) continue; done[k] = 1;
      if (k === e) { found = true; break; }
      const i = k % gr.nx, j = (k - i) / gr.nx;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const a2 = i + di, b2 = j + dj; if (a2 < 0 || b2 < 0 || a2 >= gr.nx || b2 >= gr.ny) continue;
        const k2 = b2 * gr.nx + a2; if (gr.blocked[k2] || done[k2]) continue;
        if (di && dj && (gr.blocked[j * gr.nx + a2] || gr.blocked[b2 * gr.nx + i])) continue;   // no cutting corners
        const step = (di && dj ? 1.414 : 1) * gr.cs * (gr.cost[k] + gr.cost[k2]) / 2;
        const ng = gs[k] + step;
        if (ng < gs[k2]) { gs[k2] = ng; from[k2] = k; push(k2, ng + h(k2)); }
      }
    }
    if (!found) return null;
    const cells = []; for (let k = e; k >= 0; k = from[k]) { cells.push(k); if (k === s) break; }
    cells.reverse();
    const pts = cells.map((k) => this.centre(gr, k)), acc = [0];
    for (let i = 1; i < cells.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y) * (gr.cost[cells[i]] + gr.cost[cells[i - 1]]) / 2);
    // string-pull: jump to the furthest cell in plain sight, as long as the straight line is not much dearer (keeps to the roads)
    const out = [];
    let i = 0;
    const startClear = !this.segBlocked(a, pts[0], 22);
    if (!startClear) out.push(pts[0]);
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      for (; j > i + 1; j--) if (!this.segBlocked(pts[i], pts[j], CFG.SITEGARAGE.PLAN_R - 2) && this.lineCost(gr, pts[i], pts[j]) <= (acc[j] - acc[i]) * 1.04 + 2) break;
      out.push(pts[j]); i = j;
    }
    // the very last point is the goal's own cell: replace it by the goal when it can see it
    if (out.length && !this.segBlocked(out.length > 1 ? out[out.length - 2] : a, b, 22)) out.pop();
    return out;
  },
  segBlocked(a, b, R) {
    const L = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(L / 6));
    for (let k = 0; k <= n; k++) { const t = k / n; if (this.blockedAt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, R)) return true; }
    return false;
  },
  lineCost(gr, a, b) {
    const L = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(L / (gr.cs / 2)));
    let c = 0;
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, q = this.cellOf(gr, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); c += gr.cost[q.j * gr.nx + q.i] * L / n; }
    return c;
  },
  // round every corner with a quadratic curve (smaller where the curve would brush something; the last corner, into a
  // bay, keeps its straight run-in)
  fillet(pts) {
    const G = CFG.SITEGARAGE, out = [pts[0]];
    // drop points that sit on top of each other
    const P = [pts[0]]; for (let i = 1; i < pts.length; i++) if (Math.hypot(pts[i].x - P[P.length - 1].x, pts[i].y - P[P.length - 1].y) > 1) P.push(pts[i]);
    for (let i = 1; i < P.length - 1; i++) {
      const A = P[i - 1], B = P[i], C = P[i + 1];
      const l1 = Math.hypot(B.x - A.x, B.y - A.y), l2 = Math.hypot(C.x - B.x, C.y - B.y);
      const u1 = { x: (B.x - A.x) / l1, y: (B.y - A.y) / l1 }, u2 = { x: (C.x - B.x) / l2, y: (C.y - B.y) / l2 };
      if (u1.x * u2.x + u1.y * u2.y > 0.998) { out.push(B); continue; }
      let d = Math.min(G.FILLET, l1 / 2, l2 / 2);
      let curve = null;
      while (d >= 6) {
        const p1 = { x: B.x - u1.x * d, y: B.y - u1.y * d }, p2 = { x: B.x + u2.x * d, y: B.y + u2.y * d }, c = [];
        for (let k = 0; k <= 8; k++) { const t = k / 8, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, e = t * t; c.push({ x: a * p1.x + b * B.x + e * p2.x, y: a * p1.y + b * B.y + e * p2.y }); }
        if (!c.some((q) => this.blockedAt(q.x, q.y, G.PLAN_R - 6))) { curve = c; break; }
        d *= 0.5;
      }
      if (curve) out.push(...curve); else out.push(B);
    }
    out.push(P[P.length - 1]);
    return out;
  },

  // ---------- drawing ----------
  bgKey() { return 'sg1'; },
  paintAfter(r, g, area) { if (area === 'site') this.paintGarage(r, g); },
  miniVehicle(r, g, kind, x, y, sc, color) {
    const ctx = r.ctx;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    r.drawVehicle(kind, g, color, null);
    ctx.restore();
  },
  paintGarage(r, g) {
    const ctx = r.ctx, G = CFG.SITEGARAGE, x0 = G.X0, x1 = G.X1, y0 = G.Y0, y1 = G.DOOR_Y, w = x1 - x0;
    // the concrete apron on the road in front, with a yellow stripe in front of each door
    ctx.fillStyle = '#c9c3b6'; ctx.fillRect(x0 - 6, y1, w + 12, 18);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = x0; x < x1; x += 24) ctx.fillRect(x, y1, 2, 18);
    // the building's shadow and its concrete floor
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x0 + 6, y0 + 8, w, y1 - y0);
    ctx.fillStyle = '#bdb6a8'; ctx.fillRect(x0, y0, w, y1 - y0);
    for (const b of G.BAYS) {
      // the bay floor, a mattress with a quilt pattern and a fat pillow at the back
      ctx.fillStyle = '#a9a294'; ctx.fillRect(b.x0, y0 + G.BACK, G.BAY_W, y1 - y0 - G.BACK);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = y0 + G.BACK + 8; y < y1; y += 16) ctx.fillRect(b.x0, y, G.BAY_W, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; U.roundRect(ctx, b.cx - 40, y0 + G.BACK + 6, 84, 124, 12); ctx.fill();
      ctx.fillStyle = b.bed; U.roundRect(ctx, b.cx - 42, y0 + G.BACK + 4, 84, 124, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(b.cx - 42 + k * 21, y0 + G.BACK + 30); ctx.lineTo(b.cx - 42 + k * 21, y0 + G.BACK + 124); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.fillStyle = b.door; ctx.globalAlpha = 0.35; U.roundRect(ctx, b.cx - 42, y0 + G.BACK + 70, 84, 58, 12); ctx.fill(); ctx.globalAlpha = 1;   // the blanket's turned-down end
      ctx.fillStyle = '#fffaf0'; U.roundRect(ctx, b.cx - 30, y0 + G.BACK + 6, 60, 20, 9); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.cx - 22, y0 + G.BACK + 16); ctx.lineTo(b.cx + 22, y0 + G.BACK + 16); ctx.stroke();
      // the yellow stop line just inside the door
      ctx.fillStyle = '#f2c94c'; ctx.fillRect(b.x0 + 6, y1 - 8, G.BAY_W - 12, 4);
    }
    // the walls: a brick back wall, cream end walls and dividers with rounded caps at the front
    ctx.fillStyle = '#b5523b'; ctx.fillRect(x0, y0, w, G.BACK);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = x0; x < x1; x += 16) ctx.fillRect(x, y0 + 5, 1.5, G.BACK - 5); ctx.fillRect(x0, y0 + 5, w, 1.5);
    ctx.fillStyle = '#8d3a28'; ctx.fillRect(x0, y0 + G.BACK - 3, w, 3);
    const wall = (x, ww) => {
      ctx.fillStyle = '#f3e3c3'; ctx.fillRect(x, y0, ww, y1 - y0);
      ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = y0 + 10; y < y1; y += 12) ctx.fillRect(x, y, ww, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + ww - 2, y0, 2, y1 - y0);
      ctx.fillStyle = '#d8c39b'; U.roundRect(ctx, x - 2, y1 - 10, ww + 4, 12, 3); ctx.fill();
    };
    wall(x0, G.OUTER); wall(x1 - G.OUTER, G.OUTER);
    for (let i = 0; i < G.BAYS.length - 1; i++) wall(G.BAYS[i].x1, G.WALL);
  },
  // the door of bay b, rolled down by d (0 open .. 1 shut), with the machine's picture on it once it is down
  drawDoor(r, g, b, d) {
    const ctx = r.ctx, G = CFG.SITEGARAGE, top = G.Y0 + G.BACK, full = G.DOOR_Y - top, h = full * d;
    if (h > 0.5) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(b.x0, top, G.BAY_W, h + 3);
      ctx.fillStyle = b.door; ctx.fillRect(b.x0 + 1, top, G.BAY_W - 2, h);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; for (let y = top + h - 4; y > top; y -= 9) ctx.fillRect(b.x0 + 1, y - 2, G.BAY_W - 2, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = top + h - 4; y > top; y -= 9) ctx.fillRect(b.x0 + 1, y, G.BAY_W - 2, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(b.x0 + 1, top + h - 7, G.BAY_W - 2, 7);
      ctx.fillStyle = '#e8e8e8'; U.roundRect(ctx, b.cx - 12, top + h - 6, 24, 4, 2); ctx.fill();
      if (d > 0.7) {
        const a = (d - 0.7) / 0.3, cy = top + h * 0.5;
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.beginPath(); ctx.arc(b.cx, cy, 34, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(43,29,20,0.3)'; ctx.lineWidth = 2; ctx.stroke();
        this.miniVehicle(r, g, b.kind, b.cx, cy + 2, 0.46, g.s.paint[b.kind]);
        // a little moon over the picture: it is sleeping in there
        ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(b.cx + 26, cy - 30, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = b.door; ctx.beginPath(); ctx.arc(b.cx + 31, cy - 34, 9, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    // the rolled-up drum at the top of the opening, with the name plate on it: a picture of the machine and its name
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, b.x0 - 2, top - 7, G.BAY_W + 4, 11, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(b.x0 + 2, top - 5, G.BAY_W - 4, 2);
    const py = top - 14;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, b.cx - 42, py - 2, 84, 24, 6); ctx.fill();
    ctx.fillStyle = '#fff8ee'; U.roundRect(ctx, b.cx - 40, py, 80, 20, 5); ctx.fill();
    ctx.fillStyle = b.door; ctx.fillRect(b.cx - 40, py + 16, 80, 4);
    this.miniVehicle(r, g, b.kind, b.cx - 20, py + 9, 0.24);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.label, b.cx + 18, py + 9);
  },
  // the little bed-lamp on the wall just right of each door
  lampPos(b) { const G = CFG.SITEGARAGE; return { x: b.i === G.BAYS.length - 1 ? b.x1 + G.OUTER / 2 : b.x1 + G.WALL / 2, y: G.DOOR_Y - 6 }; },
  drawLamp(r, g, b, lit) {
    const ctx = r.ctx, L = this.lampPos(b);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(L.x - 1.5, L.y - 22, 3, 22);
    ctx.fillStyle = lit ? '#fff3b0' : '#e8dcc0'; ctx.beginPath(); ctx.arc(L.x, L.y - 22, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lit ? '#ff9f43' : '#b88a5a'; ctx.beginPath(); ctx.moveTo(L.x - 8, L.y - 22); ctx.lineTo(L.x + 8, L.y - 22); ctx.lineTo(L.x + 4, L.y - 32); ctx.lineTo(L.x - 4, L.y - 32); ctx.closePath(); ctx.fill();
  },
  signLit() { return this.isNight() || (typeof AtmosphereExt !== 'undefined' && AtmosphereExt.dusk > 0.3); },
  drawSign(r, g) {
    const ctx = r.ctx, G = CFG.SITEGARAGE, S = G.SIGN, lit = this.signLit(), t = g.time, w = 170, h = 36, x = S.x - w / 2, y = S.y - h / 2;
    ctx.fillStyle = '#2d3a4a'; ctx.fillRect(S.x - 60, y + h, 5, G.Y0 - (y + h)); ctx.fillRect(S.x + 55, y + h, 5, G.Y0 - (y + h));
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; U.roundRect(ctx, x + 4, y + 5, w, h, 10); ctx.fill();
    ctx.fillStyle = lit ? '#ffd166' : '#5c6670'; U.roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 12); ctx.fill();
    ctx.fillStyle = lit ? '#1d2a6b' : '#2d3a4a'; U.roundRect(ctx, x, y, w, h, 10); ctx.fill();
    // a big crescent moon and twinkling stars
    ctx.fillStyle = lit ? '#ffe066' : '#9aa3b8'; ctx.beginPath(); ctx.arc(x + 24, S.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lit ? '#1d2a6b' : '#2d3a4a'; ctx.beginPath(); ctx.arc(x + 31, S.y - 5, 11, 0, Math.PI * 2); ctx.fill();
    const star = (sx, sy, sr) => { ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? sr * 0.45 : sr; ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
    [[x + 52, y + 10, 5, 0], [x + w - 22, y + 11, 6, 1.3], [x + w - 40, y + 27, 4, 2.6], [x + 46, y + 27, 3.5, 3.7]].forEach(([sx, sy, sr, ph]) => {
      ctx.fillStyle = lit ? `rgba(255,243,176,${(0.65 + 0.35 * Math.sin(t * 3 + ph)).toFixed(2)})` : '#7c86a0'; star(sx, sy, sr);
    });
    ctx.fillStyle = lit ? '#fff3b0' : '#c9ccd2'; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('GARAGE', S.x + 8, S.y + 1);
  },
  entities(r, g, items) {
    if (!this.st || g.area !== 'site') return;
    const G = CFG.SITEGARAGE;
    items.push({ y: G.Y0 + 1, draw: () => this.drawSign(r, g) });
    for (const b of G.BAYS) {
      const d = this.st.doors[b.i].d, lit = this.asleep(b.i);
      items.push({ y: G.DOOR_Y + 2, draw: () => { this.drawDoor(r, g, b, d); this.drawLamp(r, g, b, lit); } });
    }
  },
  // screen space, over the dusk tint: headlights on the machines driving home, the bed-lamps and the moon sign glowing,
  // and a "Zzz" bubble floating up from each sleeping bay
  screen(r, g) {
    if (!this.st || g.area !== 'site' || g.travel) return;
    const ctx = r.ctx, G = CFG.SITEGARAGE, sc = r.scale, k = typeof AtmosphereExt !== 'undefined' ? AtmosphereExt.dusk : 0;
    const W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    const sx = (x) => (x - r.camX) * sc, sy = (y) => (y - r.camY) * sc, gs = Math.min(sc, 2);
    const glow = (x, y, rad, a, col) => {
      const X = sx(x), Y = sy(y), R = rad * gs; if (X + R < 0 || Y + R < 0 || X - R > W || Y - R > H) return;
      const gr = ctx.createRadialGradient(X, Y, 0, X, Y, R); gr.addColorStop(0, `rgba(${col},${(0.55 * a).toFixed(3)})`); gr.addColorStop(0.5, `rgba(${col},${(0.2 * a).toFixed(3)})`); gr.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gr; ctx.fillRect(X - R, Y - R, R * 2, R * 2);
    };
    ctx.save();
    if (k > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      for (const b of G.BAYS) {
        const m = this.st.m[b.id], v = this.vehicleOf(g, b.id);
        if (v && this.lightsOn(m)) {
          // two soft beams in front of the machine
          const a = v.angle, ca = Math.cos(a), sa = Math.sin(a), len = 56;
          for (const side of [-1, 1]) {
            const hx = v.x + ca * len - sa * side * 12, hy = v.y + sa * len + ca * side * 12;
            const X = sx(hx), Y = sy(hy), R = 70 * gs;
            ctx.save(); ctx.translate(X, Y); ctx.rotate(a); ctx.scale(1, 0.55);
            const gr = ctx.createRadialGradient(R * 0.35, 0, 0, R * 0.35, 0, R); gr.addColorStop(0, `rgba(255,236,170,${(0.32 * k).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,236,170,0)');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R * 1.2, -0.45, 0.45); ctx.closePath(); ctx.fill();
            ctx.restore();
          }
        }
        if (this.asleep(b.i)) { const L = this.lampPos(b); glow(L.x, L.y - 24, 40, k, '255,205,110'); }
      }
      if (this.signLit()) glow(G.SIGN.x, G.SIGN.y, 120, k, '255,214,120');
      ctx.globalCompositeOperation = 'source-over';
    }
    // Zzz bubbles
    for (const b of G.BAYS) {
      if (this.asleep(b.i)) {
        const ph = ((g.time + b.i * 0.7) % 2.6) / 2.6, bx = b.cx + 24 + Math.sin(ph * 6) * 3 + ph * 8, by = G.DOOR_Y - 22 - ph * 50;
        const X = sx(bx), Y = sy(by), s = Math.max(0.75, Math.min(sc, 1.5)) * (0.75 + ph * 0.5);
        if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue;
        ctx.globalAlpha = ph < 0.15 ? ph / 0.15 : ph > 0.8 ? (1 - ph) / 0.2 : 1;
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; U.roundRect(ctx, X - 22 * s, Y - 12 * s, 44 * s, 24 * s, 12 * s); ctx.fill();
        ctx.beginPath(); ctx.arc(X - 14 * s, Y + 14 * s, 4 * s, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(X - 20 * s, Y + 20 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(29,42,107,0.35)'; ctx.lineWidth = 1.5; U.roundRect(ctx, X - 22 * s, Y - 12 * s, 44 * s, 24 * s, 12 * s); ctx.stroke();
        ctx.fillStyle = '#1d2a6b'; ctx.font = r.font(Math.round(13 * s)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Zzz', X, Y + 1);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },
};
Game.ext.unshift(SiteGarageExt);   // first in line so its button and hints beat the site's own
Render.ext.push(SiteGarageExt);
