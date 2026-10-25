'use strict';
// Pizza Coins: golden coins with a pizza slice on their face, hidden all over the world (every map has at least one).
// Walk (or drive, ride, fly) onto one to collect it; a little treasure-chest badge under the cash pill counts them, and
// tapping it opens a card listing how many each place still hides. They are a different thing from the core's shiny
// coins (`g.coins`, which give cash): Pizza Coins are only for collecting, and they stay collected for good.
// Extension module: registered LAST in Game.ext (its soft "something shiny nearby" hint only speaks when nothing else
// does) and in Render.ext. See js/EXTENSIONS.md.
CFG.PIZZACOINS = {
  R: 22,          // walk (or drive) this close to pick one up
  HINT_R: 90,     // within this of an uncollected coin, on foot, the soft hint shows (no arrow: finding it is the fun)
  // Hand-placed, each on free floor in its map (tests/cases/42-pizzacoins.js checks every one). `id` is stable and
  // is what the save remembers. `roof`: on that flat roof (land the helicopter there); `loft`: up in the barn's hayloft.
  SPOTS: [
    // ---- the home town: woods, farm, station, playground, river, park, airfield, a roof
    { id: 'woods-stream', area: 'town', x: -1238, y: 333, note: 'on the stepping stones in the secret woods' },
    { id: 'woods-clearing', area: 'town', x: -1120, y: 790, note: 'at the edge of the cabin clearing in the woods' },
    { id: 'farm-scarecrow', area: 'town', x: -818, y: 488, note: 'beside the scarecrow on the farm' },
    { id: 'old-station', area: 'town', x: -950, y: -95, note: 'at the west end of the old train station' },
    { id: 'playground-reeds', area: 'town', x: -655, y: 1172, note: 'in the reeds behind the playground' },
    { id: 'river-house', area: 'town', x: 300, y: 1180, note: 'behind River House by the water' },
    { id: 'railway-tree', area: 'town', x: 270, y: -100, note: 'under a tree by the railway' },
    { id: 'paint-shop-tree', area: 'town', x: 1335, y: 1150, note: 'under the tree behind the paint shop' },
    { id: 'runway-meadow', area: 'town', x: 2075, y: 1262, note: 'in the flowers past the end of the runway' },
    { id: 'workshop-back', area: 'town', x: 2300, y: 165, note: 'behind the airfield workshop' },
    { id: 'icecream-roof', area: 'town', x: 1140, y: 232, roof: 'icecream', note: 'on the ice cream shop roof (land the helicopter)' },
    // ---- Construction Town
    { id: 'site-station', area: 'site', x: 2650, y: -100, note: 'west of the station by the rails' },
    { id: 'site-house', area: 'site', x: 2995, y: 360, note: 'inside the future Pizza #2' },
    { id: 'site-track', area: 'site', x: 2800, y: 1185, note: 'in the middle of the dirt track' },
    { id: 'site-puddle', area: 'site', x: 2650, y: 680, note: 'by the puddle on the building site' },
    { id: 'site-hardware', area: 'site', x: 4460, y: 300, note: 'beside the hardware store' },
    { id: 'site-park', area: 'site', x: 4480, y: 900, note: 'in the corner of the park' },
    { id: 'site-factory', area: 'site', x: 4470, y: 1270, note: 'in the far corner of the concrete factory' },
    { id: 'site-diner-park', area: 'site', x: 3780, y: 1270, note: 'under a tree in the little park by the diner' },
    // ---- the City
    { id: 'city-gardens-west', area: 'city', x: 4630, y: 1080, note: 'west end of Riverside Gardens' },
    { id: 'city-gardens-east', area: 'city', x: 6170, y: 1080, note: 'under the last tree in Riverside Gardens' },
    { id: 'city-square-tree', area: 'city', x: 5510, y: 445, note: 'by a tree in Pizza Square' },
    { id: 'city-square-bench', area: 'city', x: 5755, y: 300, note: 'beside a bench in Pizza Square' },
    { id: 'city-subway-tree', area: 'city', x: 5020, y: 640, note: 'by the tree near the subway stairs' },
    { id: 'city-car-lot', area: 'city', x: 5125, y: 705, note: 'in the corner of the sports car lot' },
    { id: 'city-flowers-end', area: 'city', x: 6172, y: 470, note: 'at the end of the sidewalk past the flower shop' },
    { id: 'city-catcafe-end', area: 'city', x: 4625, y: 470, note: 'at the end of the sidewalk past the cat café' },
    // ---- the Islands (the jet ski reaches the little ones)
    { id: 'isle-sandcastle', area: 'islands', x: 2770, y: 2420, note: 'on the beach past the sandcastle' },
    { id: 'isle-main-east', area: 'islands', x: 3255, y: 2060, note: 'east beach of Pizza Island' },
    { id: 'isle-main-nw', area: 'islands', x: 2745, y: 2060, note: 'west beach of Pizza Island' },
    { id: 'isle-coconut', area: 'islands', x: 3720, y: 1560, note: 'behind the Coconut Hut' },
    { id: 'isle-lighthouse', area: 'islands', x: 4370, y: 1695, note: 'below the lighthouse' },
    { id: 'isle-treasure', area: 'islands', x: 3650, y: 2350, note: 'on Treasure Isle' },
    { id: 'isle-crab', area: 'islands', x: 4400, y: 2300, note: 'east of the Crab Shack' },
    { id: 'isle-crab-west', area: 'islands', x: 4130, y: 2390, note: 'west beach of Crab Shack island' },
    // ---- Cloud Harbor and the Sky Café
    { id: 'cloud-glider', area: 'cloud', x: 8535, y: -105, note: 'far corner of Glider Cloud' },
    { id: 'cloud-bouncy', area: 'cloud', x: 8540, y: 830, note: 'far corner of the bouncy clouds' },
    { id: 'cloud-landing', area: 'cloud', x: 7270, y: 830, note: 'corner of Landing Cloud' },
    { id: 'skycafe', area: 'skycafe', x: 7850, y: 1795, note: 'in the far corner of the Sky Café' },
    // ---- under the City and up at Columbia
    { id: 'subway-platform-end', area: 'subway', x: 7245, y: 2380, note: 'at the end of the subway platform' },
    { id: 'subway-slice', area: 'subway', x: 7250, y: 2235, note: 'beside the Slice & Soda stand' },
    { id: 'campus-dance', area: 'campus', x: 9320, y: 1070, note: 'beside the dance studio' },
    { id: 'campus-corner', area: 'campus', x: 10620, y: -120, note: 'behind Low Library' },
    { id: 'lowlibrary', area: 'lowlibrary', x: 1515, y: 4105, note: 'by the bookshelves in Low Library' },
    { id: 'barnardhall', area: 'barnardhall', x: 2085, y: 4075, note: 'under the notice board in Barnard Hall' },
    // ---- home: the cabin, the bedroom, the pizza rain room, the barn's hayloft, the fire station, the hardware store
    { id: 'cabin', area: 'cabin', x: 4785, y: 1585, note: 'in the corner of the secret cabin' },
    { id: 'bedroom', area: 'upstairs', x: 6915, y: 1615, note: 'by the bedroom window' },
    { id: 'pizzarain', area: 'pizzarain', x: 5525, y: 4335, note: 'in the corner of the pizza rain room' },
    { id: 'hayloft', area: 'barn', x: 500, y: 4075, loft: true, note: 'up in the hayloft' },
    { id: 'firestation', area: 'firestation', x: 3535, y: 4125, note: 'in the corner of the fire station' },
    { id: 'hardware', area: 'hardware', x: 4195, y: 4125, note: 'under the paint shelf in the hardware store' },
    // ---- inside the City's shops
    { id: 'toyshop', area: 'toyshop', x: -1245, y: 3115, note: 'by the teddy shelf' },
    { id: 'barber', area: 'barber', x: 135, y: 3125, note: 'in the barber shop corner' },
    { id: 'bakery', area: 'bakery', x: 785, y: 3115, note: 'behind the bakery counter' },
    { id: 'arcade', area: 'arcade', x: 1945, y: 3125, note: 'behind the claw machine' },
    { id: 'petshop', area: 'petshop', x: 2805, y: 3065, note: 'by the fish tank' },
    { id: 'hotel', area: 'hotel', x: 3745, y: 3095, note: 'in the hotel lobby corner' },
    { id: 'books', area: 'books', x: 4635, y: 3175, note: 'by the reading lamp' },
    { id: 'candy', area: 'candy', x: 5535, y: 3125, note: 'by the candy jars' },
    { id: 'catcafe', area: 'catcafe', x: 6085, y: 3125, note: 'in the cat café corner' },
    { id: 'music', area: 'music', x: 7285, y: 3145, note: 'behind the music shop counter' },
    { id: 'gym', area: 'gym', x: 8665, y: 3135, note: 'in the gym corner' },
    { id: 'cinema', area: 'cinema', x: 10055, y: 3185, note: 'at the back of the cinema' },
    { id: 'flowers', area: 'flowers', x: 10948, y: 3258, note: 'in the flower shop corner' },
    { id: 'bank', area: 'bank', x: 11835, y: 3135, note: 'beside the vault' },
    { id: 'post', area: 'post', x: 12265, y: 3125, note: 'under the PO boxes' },
    { id: 'school', area: 'school', x: 13635, y: 3145, note: 'in the classroom corner' },
    { id: 'cafe', area: 'cafe', x: 14065, y: 3125, note: 'beside the little stage' },
    { id: 'aquarium', area: 'aquarium', x: 15065, y: 3255, note: 'in the aquarium corner' },
    { id: 'firedept', area: 'firedept', x: 15865, y: 3125, note: 'under the helmet rack' },
    { id: 'grocery', area: 'grocery', x: 16765, y: 3145, note: 'by the bread shelf' },
  ],
  // friendly names for the list in the panel, in the order they are listed
  PLACES: {
    town: ['🏡', 'Home Town'], site: ['🏗️', 'Construction Town'], city: ['🏙️', 'City'], islands: ['🏝️', 'Islands'],
    cloud: ['☁️', 'Cloud Harbor'], skycafe: ['🌤️', 'Sky Café'], subway: ['🚇', 'Subway'], campus: ['🎓', 'Columbia Campus'],
    lowlibrary: ['🏛️', 'Low Library'], barnardhall: ['🐻', 'Barnard Hall'], cabin: ['🌲', 'Secret Cabin'],
    upstairs: ['🛏️', 'Bedroom'], pizzarain: ['🌧️', 'Pizza Rain Room'], barn: ['🐐', 'Barn'], firestation: ['🧯', 'Fire Station'],
    hardware: ['🔧', 'Hardware Store'], toyshop: ['🧸', 'Toy Shop'], barber: ['💈', 'Barber'], bakery: ['🥐', 'Bakery'],
    arcade: ['🕹️', 'Arcade'], petshop: ['🐶', 'Pet Shop'], hotel: ['🏨', 'Grand Hotel'], books: ['📚', 'Book Shop'],
    candy: ['🍭', 'Candy Shop'], catcafe: ['🐱', 'Cat Café'], music: ['🎸', 'Music Shop'], gym: ['🏋️', 'Gym'],
    cinema: ['🎬', 'Cinema'], flowers: ['🌷', 'Flower Shop'], bank: ['🏦', 'Bank'], post: ['📮', 'Post Office'],
    school: ['🏫', 'School'], cafe: ['☕', 'Café'], aquarium: ['🐠', 'Aquarium'], firedept: ['🚒', 'Fire Dept'], grocery: ['🛒', 'Grocery'],
  },
};

const PizzaCoinsExt = {
  name: 'pizzacoins',
  rt: null, dom: null,
  defaults: { pizzacoins: { got: {}, seen: {}, first: false, all: false } },

  // ---------- state ----------
  save(g) {
    const d = this.defaults.pizzacoins;
    if (!g.s.pizzacoins || typeof g.s.pizzacoins !== 'object') g.s.pizzacoins = JSON.parse(JSON.stringify(d));
    const st = g.s.pizzacoins;
    if (!st.got || typeof st.got !== 'object') st.got = {};
    if (!st.seen || typeof st.seen !== 'object') st.seen = {};
    return st;
  },
  spots() { return CFG.PIZZACOINS.SPOTS; },
  total() { return this.spots().length; },
  count(g) { const got = this.save(g).got; let n = 0; for (const s of this.spots()) if (got[s.id]) n++; return n; },
  // coins per place: { area: { n, got } } in the panel's order
  byPlace(g) {
    const got = this.save(g).got, out = {};
    for (const a of Object.keys(CFG.PIZZACOINS.PLACES)) out[a] = { n: 0, got: 0 };
    for (const s of this.spots()) { const o = out[s.area] || (out[s.area] = { n: 0, got: 0 }); o.n++; if (got[s.id]) o.got++; }
    for (const a of Object.keys(out)) if (!out[a].n) delete out[a];
    return out;
  },
  phase(id) { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000; return h / 1000 * 6.283; },

  build(g) {
    this.save(g);
    this.rt = { t: 0, pops: [], sparks: [], confetti: [], bump: 0, shown: -1, panelT: 0 };
    this.buildDom();
  },
  home() { if (!this.rt) return; this.rt.pops = []; this.rt.sparks = []; this.rt.confetti = []; this.rt.bump = 0; },

  // ---------- where the chef can reach a coin right now ----------
  heliFlying(g) { return typeof RooftopsExt !== 'undefined' && RooftopsExt.flying && RooftopsExt.flying(g); },
  onRoof(key) { return typeof RooftopsExt !== 'undefined' && RooftopsExt.st && RooftopsExt.st.roof && RooftopsExt.st.roof.key === key; },
  inLoft() { return typeof BarnExt !== 'undefined' && BarnExt.st && !!BarnExt.st.loft; },
  // a roof coin is reached from that roof (or by flying over it); a hayloft coin from the loft; the rest from the floor
  reachable(g, s) {
    if (s.roof) return this.onRoof(s.roof) || this.heliFlying(g);
    if (s.loft) return this.inLoft();
    return !(g.area === 'barn' && this.inLoft());
  },
  busy(g) {
    if (g.travel || g.onTrain || g.ride) return true;
    if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && CityExt.st.boarding))) return true;
    return false;
  },

  update(g, dt) {
    if (!this.rt) this.build(g);
    const rt = this.rt, st = this.save(g);
    rt.t += dt;
    if (CFG.PIZZACOINS.PLACES[g.area] && !g.travel && !st.seen[g.area]) st.seen[g.area] = true;
    // pick up any coin within reach
    if (!this.busy(g)) {
      const p = g.player, R = CFG.PIZZACOINS.R;
      for (const s of this.spots()) {
        if (s.area !== g.area || st.got[s.id]) continue;
        if (Math.abs(p.x - s.x) > R || Math.abs(p.y - s.y) > R + 4) continue;
        if (U.dist(p.x, p.y, s.x, s.y) > R || !this.reachable(g, s)) continue;
        this.collect(g, s);
      }
    }
    // animations
    for (const q of rt.pops) q.t += dt;
    rt.pops = rt.pops.filter((q) => q.t < 0.9);
    for (const k of rt.sparks) { k.t += dt; k.x += k.vx * dt; k.y += k.vy * dt; k.vy += 60 * dt; }
    rt.sparks = rt.sparks.filter((k) => k.t < k.dur);
    for (const c of rt.confetti) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 160 * dt; c.vx *= 0.99; c.a += c.va * dt; }
    rt.confetti = rt.confetti.filter((c) => c.t < c.dur);
    if (rt.bump > 0) rt.bump = Math.max(0, rt.bump - dt);
    this.updateDom(g, dt);
  },

  collect(g, s) {
    const st = this.save(g), rt = this.rt;
    st.got[s.id] = true;
    rt.pops.push({ x: s.x, y: s.y, t: 0, ph: this.phase(s.id) });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.3, v = 70 + Math.random() * 70;
      rt.sparks.push({ x: s.x, y: s.y - 18, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, dur: 0.6 + Math.random() * 0.35, c: i % 3 ? '#ffd84a' : '#ffffff' });
    }
    g.fx.push({ kind: 'sparkle', x0: s.x, y0: s.y - 14, x1: s.x, y1: s.y - 14, t: 0, dur: 0.6 });
    g.floats.push({ x: s.x, y: s.y - 62, text: '+1 🍕 Pizza Coin!', color: '#ffd84a', t: 0, dur: 1.4, big: true });
    Sfx.ding(); Haptics.tap();
    rt.bump = 0.7;
    const n = this.count(g), N = this.total();
    if (n >= N && !st.all) {
      st.all = true; st.first = true;
      g.toast('🏆 You found every Pizza Coin!', true);
      this.confettiBurst();
    } else if (!st.first) {
      st.first = true;
      g.toast('🍕 You found a Pizza Coin! Find them all!', true);
    }
    g.save();
  },

  confettiBurst() {
    const W = (typeof window !== 'undefined' ? window.innerWidth : 800), cols = ['#ff4d4d', '#ffb000', '#ffe600', '#3bd16f', '#3b7dd8', '#8e5bd1', '#ff8fab'];
    for (let i = 0; i < 120; i++) {
      this.rt.confetti.push({ x: W * (0.1 + Math.random() * 0.8), y: -10 - Math.random() * 80, vx: (Math.random() - 0.5) * 160, vy: 60 + Math.random() * 160, a: Math.random() * 6, va: (Math.random() - 0.5) * 12, t: 0, dur: 2.6 + Math.random() * 1.2, c: cols[i % cols.length], w: 6 + Math.random() * 5, h: 4 + Math.random() * 4 });
    }
  },

  // A soft nudge, no arrow: only on foot, only when nothing else has anything to say (this extension is last in line).
  hint(g) {
    if (!this.rt || g.driving || g.onTrain || g.ride || g.travel || g.fishing || this.busy(g)) return undefined;
    if (typeof CityExt !== 'undefined' && CityExt.st && CityExt.st.cab) return undefined;
    const p = g.player;
    if (g.area === 'town' && (p.carry > 0 || g.insideBuilding(p.x, p.y))) return undefined;
    const got = this.save(g).got, HR = CFG.PIZZACOINS.HINT_R;
    for (const s of this.spots()) {
      if (s.area !== g.area || got[s.id] || (s.roof && !this.onRoof(s.roof))) continue;
      if (U.dist(p.x, p.y, s.x, s.y) < HR) return { text: 'Something shiny nearby! ✨', target: null };
    }
    return undefined;
  },

  // ======================= drawing =======================
  // A spinning gold coin with a pizza slice on its face. (x, y) is the coin's centre; w is how much of the face shows (spin).
  drawCoin(ctx, x, y, R, spin) {
    const c = Math.cos(spin), w = Math.max(0.1, Math.abs(c)), side = c < 0 ? -1 : 1;
    ctx.save(); ctx.translate(x, y);
    // the coin's edge peeks out while it turns
    ctx.fillStyle = '#b5770f';
    ctx.beginPath(); ctx.ellipse(side * (1 - w) * R * 0.22, 0, R * w + 0.8, R, 0, 0, Math.PI * 2); ctx.fill();
    const gr = ctx.createLinearGradient(-R, -R, R, R); gr.addColorStop(0, '#fff2a8'); gr.addColorStop(0.45, '#ffcf3a'); gr.addColorStop(1, '#e09b14');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, 0, R * w, R, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9870f'; ctx.lineWidth = Math.max(1, R * 0.12);
    ctx.beginPath(); ctx.ellipse(0, 0, R * w * 0.8, R * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
    if (w > 0.3) {
      ctx.scale(w * side, 1);
      const s = R * 0.62;
      // the slice: cheese triangle point-down, a crust along the top, three pepperoni
      ctx.fillStyle = '#ffe07a'; ctx.strokeStyle = '#c0661c'; ctx.lineWidth = Math.max(0.8, R * 0.07);
      ctx.beginPath(); ctx.moveTo(-s * 0.78, -s * 0.5); ctx.quadraticCurveTo(0, -s * 0.78, s * 0.78, -s * 0.5); ctx.lineTo(0, s * 0.95); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#d9822b'; ctx.lineWidth = Math.max(1.2, R * 0.2); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-s * 0.74, -s * 0.52); ctx.quadraticCurveTo(0, -s * 0.8, s * 0.74, -s * 0.52); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#d63c2f';
      for (const [px, py] of [[-0.25, -0.18], [0.24, -0.2], [0, 0.3]]) { ctx.beginPath(); ctx.arc(px * s, py * s, s * 0.15, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  },
  // a four-pointed twinkle
  drawStar(ctx, x, y, r, color) {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  },
  drawWorldCoin(ctx, s, t) {
    const ph = this.phase(s.id), R = 10, lift = 10 + Math.sin(t * 2.1 + ph) * 2.5;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 3, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    const glow = ctx.createRadialGradient(s.x, s.y - lift, 2, s.x, s.y - lift, 20);
    glow.addColorStop(0, 'rgba(255,230,120,0.35)'); glow.addColorStop(1, 'rgba(255,230,120,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(s.x, s.y - lift, 20, 0, Math.PI * 2); ctx.fill();
    this.drawCoin(ctx, s.x, s.y - lift, R, t * 2.2 + ph);
    // a soft sparkle every few seconds, so a careful eye spots it
    const k = (t + ph) % 3.2;
    if (k < 0.6) { const a = Math.sin((k / 0.6) * Math.PI); this.drawStar(ctx, s.x + 7, s.y - lift - 9, 2 + a * 6, `rgba(255,255,255,${(0.9 * a).toFixed(3)})`); }
  },
  visible(g, s) {
    if (s.roof) return this.onRoof(s.roof) || (typeof RooftopsExt !== 'undefined' && RooftopsExt.st && (RooftopsExt.aboveRoofs(g) || !RooftopsExt.insideIce(g)));
    return true;
  },
  entities(r, g, items) {
    if (!this.rt) return;
    const got = this.save(g).got, t = this.rt.t;
    for (const s of this.spots()) {
      if (s.area !== g.area || got[s.id] || s.roof) continue;
      items.push({ y: s.y, draw: () => this.drawWorldCoin(r.ctx, s, t) });
    }
  },
  overlay(r, g) {
    if (!this.rt) return;
    const ctx = r.ctx, rt = this.rt, got = this.save(g).got;
    // roof coins sit on top of the roof art
    for (const s of this.spots()) if (s.roof && s.area === g.area && !got[s.id] && this.visible(g, s)) this.drawWorldCoin(ctx, s, rt.t);
    // a collected coin pops up, spins fast and fades; sparkles fly out
    for (const q of rt.pops) {
      const k = q.t / 0.9, e = U.easeOut(Math.min(1, k * 1.4));
      ctx.globalAlpha = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
      this.drawCoin(ctx, q.x, q.y - 10 - e * 44, 10 + e * 4, q.t * 16 + q.ph);
      ctx.globalAlpha = 1;
    }
    for (const k of rt.sparks) { const a = 1 - k.t / k.dur; this.drawStar(ctx, k.x, k.y, 2 + a * 4, k.c === '#ffffff' ? `rgba(255,255,255,${a.toFixed(3)})` : `rgba(255,216,74,${a.toFixed(3)})`); }
  },
  screen(r, g) {
    if (!this.rt || !this.rt.confetti.length) return;
    const ctx = r.ctx;
    for (const c of this.rt.confetti) {
      ctx.save(); ctx.globalAlpha = Math.min(1, (c.dur - c.t) * 2); ctx.translate(c.x, c.y); ctx.rotate(c.a);
      ctx.fillStyle = c.c; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); ctx.restore();
    }
  },

  // An open treasure chest with a pizza coin popping out of it, drawn into a w × h box (CSS px). hop 0..1 lifts the coin.
  drawChest(ctx, w, h, t, hop) {
    const cx = w / 2, bw = w * 0.78, bh = h * 0.34, by = h - bh - h * 0.04, bx = cx - bw / 2;
    // lid, tipped open behind the box
    ctx.fillStyle = '#6d3f1c'; ctx.beginPath();
    ctx.moveTo(bx + bw * 0.04, by); ctx.lineTo(bx + bw * 0.12, by - bh * 0.95); ctx.lineTo(bx + bw * 0.88, by - bh * 0.95); ctx.lineTo(bx + bw * 0.96, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e9b02f'; ctx.fillRect(bx + bw * 0.12, by - bh * 0.95, bw * 0.76, Math.max(1.5, bh * 0.12));
    // the golden glow inside
    const gl = ctx.createRadialGradient(cx, by, 1, cx, by, bw * 0.6);
    gl.addColorStop(0, 'rgba(255,240,150,0.95)'); gl.addColorStop(1, 'rgba(255,220,90,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, by, bw * 0.6, Math.PI, 0); ctx.fill();
    // the coin popping out
    const R = Math.min(w, h) * 0.24, cy = by - R * 0.55 - (0.25 + 0.75 * hop) * R * 0.9 - Math.sin(t * 3) * R * 0.08;
    this.drawCoin(ctx, cx, cy, R, t * 2.4);
    // the box in front, with gold bands and a lock
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, bx, by, bw, bh, Math.max(2, bh * 0.15)); ctx.fill();
    ctx.fillStyle = '#a86d38'; ctx.fillRect(bx, by, bw, Math.max(1.5, bh * 0.22));
    ctx.fillStyle = '#e9b02f';
    ctx.fillRect(bx + bw * 0.12, by, Math.max(1.5, bw * 0.08), bh); ctx.fillRect(bx + bw * 0.8, by, Math.max(1.5, bw * 0.08), bh);
    U.roundRect(ctx, cx - bw * 0.08, by + bh * 0.18, bw * 0.16, bh * 0.5, 2); ctx.fill();
    ctx.fillStyle = '#6d3f1c'; ctx.beginPath(); ctx.arc(cx, by + bh * 0.42, Math.max(1, bh * 0.07), 0, Math.PI * 2); ctx.fill();
    // twinkles round the coin
    const k = (t % 1.6) / 1.6, a = Math.sin(k * Math.PI);
    this.drawStar(ctx, cx + R * 1.35, cy - R * 0.6, 1 + a * R * 0.35, `rgba(255,255,255,${(0.95 * a).toFixed(3)})`);
    const k2 = ((t + 0.8) % 1.6) / 1.6, a2 = Math.sin(k2 * Math.PI);
    this.drawStar(ctx, cx - R * 1.3, cy + R * 0.1, 1 + a2 * R * 0.3, `rgba(255,246,190,${(0.95 * a2).toFixed(3)})`);
  },

  // ======================= the HUD badge and the panel (DOM) =======================
  buildDom() {
    if (this.dom || typeof document === 'undefined' || !document.body) return;
    const host = document.getElementById('app') || document.body;
    const style = document.createElement('style');
    style.textContent = `
      #pc-badge { position: absolute; z-index: 5; left: calc(10px + env(safe-area-inset-left)); top: calc(52px + env(safe-area-inset-top));
        display: flex; align-items: center; gap: 4px; padding: 2px 12px 2px 4px; border: 0; border-radius: 999px; cursor: pointer;
        background: rgba(43, 29, 20, 0.85); color: #ffd84a; font: 800 15px "Trebuchet MS", "Segoe UI", system-ui, sans-serif;
        box-shadow: 0 2px 0 rgba(0,0,0,0.3); min-height: 38px; transform-origin: 20px 50%; -webkit-tap-highlight-color: transparent; }
      #pc-badge:active { transform: translateY(1px); }
      #pc-badge canvas { width: 40px; height: 34px; display: block; }
      #pc-badge .pc-n { white-space: nowrap; font-variant-numeric: tabular-nums; }
      #pc-badge.pc-done { color: #fff3b0; box-shadow: 0 2px 0 rgba(0,0,0,0.3), 0 0 0 2px #f2b134; }
      @media (max-width: 600px) { #pc-badge { top: calc(44px + env(safe-area-inset-top)); font-size: 13px; min-height: 34px; padding: 1px 10px 1px 3px; }
        #pc-badge canvas { width: 36px; height: 31px; } }
      #modal-pizzacoins .pc-card { width: min(520px, 100%); }
      #modal-pizzacoins .modal-head { background: #c9870f; }
      .pc-body { padding: 12px 16px 16px; overflow-y: auto; display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .pc-body > * { flex-shrink: 0; }
      .pc-hero { width: 180px; height: 150px; display: block; }
      .pc-total { font-size: 20px; font-weight: 900; text-align: center; color: #2b1d14; }
      .pc-total b { color: #c9870f; }
      .pc-bar { width: 100%; height: 18px; border-radius: 999px; background: #efdcc0; overflow: hidden; box-shadow: inset 0 2px 0 rgba(0,0,0,0.08); }
      .pc-bar i { display: block; height: 100%; width: 0; border-radius: 999px; background: linear-gradient(90deg, #ffd84a, #f2a20c); transition: width 0.4s; }
      .pc-list { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
      .pc-row { display: flex; align-items: center; gap: 8px; background: #fff; border: 2px solid #efdcc0; border-radius: 12px; padding: 6px 10px; font-weight: 800; font-size: 14px; min-width: 0; }
      .pc-row .pc-ico { font-size: 20px; width: 26px; text-align: center; flex: 0 0 auto; }
      .pc-row .pc-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .pc-row .pc-c { flex: 0 0 auto; color: #8a7a6a; font-variant-numeric: tabular-nums; }
      .pc-row.pc-full { border-color: #f2b134; background: #fff6d6; }
      .pc-row.pc-full .pc-c { color: #c9870f; }
      .pc-row.pc-unseen { opacity: 0.6; }
      @media (max-width: 700px), (max-height: 520px) { .pc-body { flex: 1; } .pc-row { font-size: 16px; padding: 10px 12px; } }
      @media (max-width: 420px) { .pc-list { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
    const badge = document.createElement('button');
    badge.id = 'pc-badge'; badge.type = 'button'; badge.title = 'Pizza Coins'; badge.setAttribute('aria-label', 'Pizza Coins');
    badge.innerHTML = '<canvas width="80" height="68"></canvas><span class="pc-n"></span>';
    host.appendChild(badge);
    const modal = document.createElement('div');
    modal.id = 'modal-pizzacoins'; modal.className = 'modal hidden';
    modal.innerHTML = `<div class="modal-card pc-card">
        <div class="modal-head"><h2>🍕 Pizza Coins</h2><button class="close pc-close" aria-label="Close">✕</button></div>
        <div class="pc-body">
          <canvas class="pc-hero" width="360" height="300"></canvas>
          <div class="pc-total"></div>
          <div class="pc-bar"><i></i></div>
          <div class="pc-list"></div>
        </div>
      </div>`;
    host.appendChild(modal);
    this.dom = {
      badge, icon: badge.querySelector('canvas'), num: badge.querySelector('.pc-n'), modal,
      hero: modal.querySelector('.pc-hero'), totalEl: modal.querySelector('.pc-total'), bar: modal.querySelector('.pc-bar i'), list: modal.querySelector('.pc-list'),
      close: modal.querySelector('.pc-close'),
    };
    badge.addEventListener('click', () => this.openPanel(Game));
    this.dom.close.addEventListener('click', () => this.closePanel());
    modal.addEventListener('click', (e) => { if (e.target === modal) this.closePanel(); });
    this.drawIcon(0);
  },
  drawIcon(hop) {
    const c = this.dom && this.dom.icon; if (!c) return;
    const ctx = c.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    this.drawChest(ctx, 40, 34, this.rt ? this.rt.t : 0, hop);
  },
  isOpen() { return typeof UI !== 'undefined' && UI.open === 'pizzacoins'; },
  openPanel(g) {
    if (!this.dom || typeof UI === 'undefined') return;
    UI.els.pizzacoins = this.dom.modal;
    this.refreshPanel(g);
    UI.show('pizzacoins');
    this.rt.panelT = 0;
    Sfx.init(); Sfx.resume();
  },
  closePanel() { if (this.isOpen()) UI.close(); else if (this.dom) this.dom.modal.classList.add('hidden'); },
  refreshPanel(g) {
    const d = this.dom, st = this.save(g), n = this.count(g), N = this.total();
    d.totalEl.innerHTML = n >= N ? `🏆 You found all <b>${N}</b> Pizza Coins!` : `You found <b>${n}</b> of <b>${N}</b> Pizza Coins!`;
    d.bar.style.width = (N ? (100 * n / N) : 0).toFixed(1) + '%';
    const P = CFG.PIZZACOINS.PLACES, rows = [];
    const places = this.byPlace(g);
    for (const a of Object.keys(places)) {
      const o = places[a], seen = !!st.seen[a] || o.got > 0, [ico, name] = P[a] || ['📍', a];
      const cls = o.got >= o.n ? ' pc-full' : seen ? '' : ' pc-unseen';
      rows.push(`<div class="pc-row${cls}" data-area="${a}"><span class="pc-ico">${seen ? ico : '❔'}</span><span class="pc-name">${seen ? name : '???'}</span><span class="pc-c">${o.got >= o.n ? '✅ ' : ''}${o.got} / ${o.n}</span></div>`);
    }
    d.list.innerHTML = rows.join('');
  },
  updateDom(g, dt) {
    const d = this.dom; if (!d) return;
    const rt = this.rt, n = this.count(g), N = this.total();
    if (n !== rt.shown) {
      rt.shown = n; d.num.textContent = `${n} / ${N}`; d.badge.classList.toggle('pc-done', n >= N);
      if (this.isOpen()) this.refreshPanel(g);
    }
    const b = rt.bump > 0 ? Math.sin((1 - rt.bump / 0.7) * Math.PI) : 0;
    d.badge.style.transform = b ? `scale(${(1 + 0.18 * b).toFixed(3)})` : '';
    // the little chest's coin hops when a coin is found, and bobs gently now and then
    rt.iconT = (rt.iconT || 0) + dt;
    if (rt.iconT > 1 / 20 || b) { rt.iconT = 0; this.drawIcon(b); }
    if (this.isOpen()) {
      rt.panelT += dt;
      const c = d.hero, ctx = c.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.setTransform(2, 0, 0, 2, 0, 0);
      const rise = U.easeOut(Math.min(1, rt.panelT / 0.8));
      this.drawChest(ctx, 180, 150, rt.t, rise);
    }
  },
};

Game.ext.push(PizzaCoinsExt);     // last in line: the soft hint only speaks when no other extension has anything to say
Render.ext.push(PizzaCoinsExt);
