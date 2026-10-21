'use strict';
// The music shop: City building 9 (middle row, facing Market Street, the 'MUSIC' sign). Step inside for a wooden-floored
// shop with a wall of guitars and ukuleles (strum them), an upright piano whose keys light up and play as you walk along
// them, a drum kit you can sit at and bash (Boom! Tish!), a trumpet on a stand that toots, a record player spinning with
// notes drifting up, a jukebox with a button that changes the shop's tune, a shopkeeper in headphones who bops to the
// beat, a $4 kazoo that hums while you walk and a $6 maraca that shakes.
// Extension module: registered with Game.ext (first, so its door beats the City's taxis) and Render.ext (see js/EXTENSIONS.md).
CFG.MUSIC = {
  BUILDING: 9,                                   // index in CFG.CITY.BUILDINGS: { x0: 4772, y0: 200, x1: 4890, y1: 456 }
  DOOR_OUT: { x: 4831, y: 470 },                 // on the sidewalk just below the door
  WORLD: { x0: 6800, y0: 3000, x1: 7400, y1: 3400 },
  ROOM: { x0: 6840, y0: 3100, x1: 7360, y1: 3340 }, WALL: 24, BACK_TOP: 3016,   // the back wall is tall: instruments hang on it
  GUITARS: { x0: 6846, y0: 3022, x1: 7050, y1: 3096 },         // the wall of guitars and ukuleles
  STRUM: { x: 6948, y: 3128 },                                 // stand here to strum them
  PIANO: { x0: 7070, y0: 3032, x1: 7230, keysY: 3100, keysH: 16, keys: 14 },   // an upright piano; its keys stick out of the back wall
  PIANO_FRONT: { x: 7150, y: 3136 },                           // the strip you walk along to play it
  CABINET: { x0: 7262, y0: 3092, x1: 7340, y1: 3120 }, RECORD: { x: 7300, y: 3076 },
  DRUMS: { x: 6940, y: 3240 }, STOOL: { x: 6940, y: 3192 }, DRUM_RECT: { x: 6896, y: 3208, w: 88, h: 46 },
  TRUMPET: { x: 7060, y: 3212 },
  JUKEBOX: { x: 7330, y: 3150, w: 52, h: 64 }, JUKE_SPOT: { x: 7334, y: 3240 },
  COUNTER: { x0: 7110, y0: 3272, x1: 7300, y1: 3306 }, KEEPER: { x: 7138, y: 3286 }, REGISTER: { x: 7178, y: 3268 },
  PADS: { kazoo: { x: 7198, y: 3226 }, maraca: { x: 7280, y: 3226 } },
  PLANT: { x: 6860, y: 3312 }, AMP: { x: 7338, y: 3312 },
  EXIT: { x: 6970, y: 3322 },                    // the mat inside the door (the door is in the bottom wall)
  KAZOO: 30, MARACA: 30, BEAT: 0.4,              // seconds: how long the kazoo and the maraca last, the jukebox beat
  SCALE: [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784, 880, 988],   // one note per piano key
  TUNES: [
    [523, 659, 784, 659, 523, 659, 880, 0],
    [392, 494, 587, 0, 440, 523, 659, 0],
    [330, 0, 415, 0, 494, 0, 659, 587],
  ],
};
CFG.AREAS.music = { WORLD: CFG.MUSIC.WORLD };

const MusicExt = {
  name: 'music',
  st: null,
  defaults: { music: { seen: false, bashes: 0, keys: 0, toots: 0, strums: 0, kazoos: 0, maracas: 0, tune: 0 } },

  // ---------- state ----------
  build(g) {
    const M = CFG.MUSIC;
    if (!g.s.music) g.s.music = { seen: false, bashes: 0, keys: 0, toots: 0, strums: 0, kazoos: 0, maracas: 0, tune: 0 };
    this.st = {
      fade: 0, drum: false, bounce: 0, hit: 0,                         // drum: seated at the kit; bounce: the kit's squash; hit: which drum was hit last
      lit: new Array(M.PIANO.keys).fill(0), lastKey: -1, keyT: 0,       // lit[k]: glow left on key k
      toot: 0, strum: 0, disc: 0, notes: [], noteT: 0, cityNotes: [], cityNoteT: 0,
      beatT: 0, beat: 0, pulse: 0, nod: 0, pressed: 0,                 // the jukebox beat; pulse: light flash; nod: the keeper's bop; pressed: button press
      kazoo: 0, kazooT: 0, hum: 0, maraca: 0, shakeT: 0,
      obs: null,
    };
    const R = M.ROOM, w = M.WALL, o = [];
    o.push({ x: R.x0 - w, y: R.y0 - w, w: R.x1 - R.x0 + 2 * w, h: w }, { x: R.x0 - w, y: R.y1, w: R.x1 - R.x0 + 2 * w, h: w });
    o.push({ x: R.x0 - w, y: R.y0, w, h: R.y1 - R.y0 }, { x: R.x1, y: R.y0, w, h: R.y1 - R.y0 });
    o.push({ x: M.PIANO.x0, y: M.PIANO.keysY, w: M.PIANO.x1 - M.PIANO.x0, h: M.PIANO.keysH });
    o.push({ x: M.CABINET.x0, y: R.y0, w: M.CABINET.x1 - M.CABINET.x0, h: M.CABINET.y1 - R.y0 });
    o.push(Object.assign({}, M.DRUM_RECT));
    o.push({ x: M.TRUMPET.x - 10, y: M.TRUMPET.y - 8, w: 20, h: 16 });
    o.push({ x: M.JUKEBOX.x - M.JUKEBOX.w / 2, y: M.JUKEBOX.y, w: M.JUKEBOX.w, h: M.JUKEBOX.h });
    o.push({ x: M.COUNTER.x0, y: M.COUNTER.y0, w: M.COUNTER.x1 - M.COUNTER.x0, h: M.COUNTER.y1 - M.COUNTER.y0 });
    o.push({ x: M.PLANT.x - 14, y: M.PLANT.y - 14, w: 28, h: 26 });
    o.push({ x: M.AMP.x - 16, y: M.AMP.y - 16, w: 32, h: 30 });
    this.st.obs = o;
  },
  obstacles(g) { return g.area === 'music' && this.st ? this.st.obs : []; },
  free(x, y) {
    const R = CFG.MUSIC.ROOM, r = 12;
    if (x < R.x0 + r || x > R.x1 - r || y < R.y0 + r || y > R.y1 - r) return false;
    for (const o of this.st.obs) if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return false;
    return true;
  },
  onFoot(g) { return !g.driving && !g.onTrain && !g.ride && !g.travel && !g.fishing; },
  inStreet(g) { return g.area === 'city' && this.onFoot(g) && !(typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))); },
  atDoor(g) { const D = CFG.MUSIC.DOOR_OUT, p = g.player; return this.inStreet(g) && U.dist(p.x, p.y, D.x, D.y) < 30; },
  near(g, pt, r) { const p = g.player; return U.dist(p.x, p.y, pt.x, pt.y) < r; },
  onKeys(g) { const P = CFG.MUSIC.PIANO, p = g.player; return p.x >= P.x0 && p.x <= P.x1 && p.y > P.keysY + P.keysH && p.y < P.keysY + P.keysH + 44; },

  // ---------- game hooks ----------
  action(g) {
    if (!this.st) this.build(g);
    const M = CFG.MUSIC, st = this.st;
    if (this.atDoor(g)) return { label: '🚪 Go inside', run: (gg) => this.enter(gg) };
    if (g.area !== 'music') return null;
    if (st.drum) return { label: '🥁 Bash!', run: (gg) => this.bash(gg) };
    if (this.near(g, M.EXIT, 30)) return { label: '🚪 Go outside', run: (gg) => this.leave(gg) };
    if (this.near(g, M.STOOL, 26)) return { label: '🥁 Sit at the drums', run: (gg) => this.sitDown(gg) };
    if (this.near(g, M.TRUMPET, 32)) return { label: '🎺 Toot!', run: (gg) => this.toot(gg) };
    if (this.near(g, M.JUKE_SPOT, 30)) return { label: '🎵 Change the tune', run: (gg) => this.changeTune(gg) };
    if (this.near(g, M.STRUM, 34)) return { label: '🎸 Strum!', run: (gg) => this.strum(gg) };
    return null;
  },
  enter(g) {
    const M = CFG.MUSIC, p = g.player;
    g.area = 'music'; p.x = M.EXIT.x; p.y = M.EXIT.y - 8; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.fade = 0.45; this.st.lastKey = -1; Sfx.ding(); Haptics.tap();
    if (!g.s.music.seen) { g.s.music.seen = true; g.toast('🎵 Welcome to the music shop!', true); }
  },
  leave(g) {
    const M = CFG.MUSIC, p = g.player;
    g.area = 'city'; p.x = M.DOOR_OUT.x; p.y = M.DOOR_OUT.y; p.moving = false; p.facing = 1; p.hasMoved = true; g.cameraSnap = true;
    this.st.drum = false; this.st.fade = 0.45; Sfx.drop();
  },
  sitDown(g) {
    const S = CFG.MUSIC.STOOL, p = g.player;
    this.st.drum = true; p.x = S.x; p.y = S.y; p.moving = false; p.facing = 1;
    Sfx.pickup(); Haptics.tap();
  },
  bash(g) {
    const st = this.st, p = g.player, D = CFG.MUSIC.DRUMS;
    st.hit = st.hit ? 0 : 1; st.bounce = 1; g.s.music.bashes++;
    if (st.hit) { Sfx.chuff(0.9); Sfx.tone(1400, 0.07, 'triangle', 0.02, -600); }   // tish: the cymbal
    else Sfx.tone(100, 0.18, 'sine', 0.08, -50);                                    // boom: the bass drum
    g.floats.push({ x: D.x + (st.hit ? 36 : -30), y: p.y - 56, text: st.hit ? 'Tish!' : 'Boom!', color: st.hit ? '#ffe08a' : '#ff8fab', t: 0, dur: 0.9, big: true });
    Haptics.tap();
  },
  toot(g) {
    const st = this.st, T = CFG.MUSIC.TRUMPET;
    if (st.toot > 0.25) return;
    st.toot = 0.6; g.s.music.toots++;
    Sfx.tone(392, 0.22, 'sawtooth', 0.03, 40); setTimeout(() => Sfx.tone(523, 0.28, 'sawtooth', 0.03, -20), 170);
    g.floats.push({ x: T.x + 10, y: T.y - 50, text: 'Toot! 🎺', color: '#ffe08a', t: 0, dur: 1.1, big: true });
    Haptics.tap();
  },
  strum(g) {
    const st = this.st, S = CFG.MUSIC.STRUM;
    if (st.strum > 0.3) return;
    st.strum = 0.7; g.s.music.strums++;
    [330, 415, 494, 659].forEach((f, i) => setTimeout(() => Sfx.tone(f, 0.3, 'triangle', 0.028), i * 55));
    g.floats.push({ x: S.x, y: S.y - 70, text: 'Strum! 🎸', color: '#ffe08a', t: 0, dur: 1.1, big: true });
    Haptics.tap();
  },
  changeTune(g) {
    const st = this.st, J = CFG.MUSIC.JUKE_SPOT;
    g.s.music.tune = (g.s.music.tune + 1) % CFG.MUSIC.TUNES.length; st.beat = 0; st.beatT = 0; st.pressed = 0.3;
    Sfx.tone(880, 0.1, 'square', 0.02, 300);
    g.floats.push({ x: J.x - 10, y: J.y - 70, text: 'New tune! 🎵', color: '#9fd8ff', t: 0, dur: 1.1, big: true });
    Haptics.tap();
  },
  home(g) { if (!this.st) return; this.st.drum = false; this.st.fade = 0; this.st.lastKey = -1; },
  // a save or a push that left the chef in a wall or inside the furniture goes back onto the door mat
  rescue(g) {
    const p = g.player, M = CFG.MUSIC;
    if (this.free(p.x, p.y)) return false;
    p.x = M.EXIT.x; p.y = M.EXIT.y - 8; p.moving = false;
    g.floats.push({ x: p.x, y: p.y - 50, text: 'Oops! Back inside', color: '#ffe08a', t: 0, dur: 1.4, big: true });
    return true;
  },
  update(g, dt) {
    if (!this.st) this.build(g);
    const st = this.st, p = g.player, M = CFG.MUSIC;
    st.fade = Math.max(0, st.fade - dt);
    // the kazoo hums and the maraca shakes while the chef walks, in any map
    st.kazoo = Math.max(0, st.kazoo - dt); st.maraca = Math.max(0, st.maraca - dt); st.hum = Math.max(0, st.hum - dt);
    const walking = p.moving && this.onFoot(g);
    if (st.kazoo > 0 && walking) { st.kazooT -= dt; if (st.kazooT <= 0) { st.kazooT = 0.55; st.hum = 0.35; Sfx.tone(U.pick([330, 370, 415, 440]), 0.14, 'sawtooth', 0.018, 30); } } else st.kazooT = 0;
    if (st.maraca > 0 && walking) { st.shakeT -= dt; if (st.shakeT <= 0) { st.shakeT = 0.3; Sfx.chuff(0.35); } } else st.shakeT = 0;
    // notes drift out of the shop's sign in the City
    for (const n of st.cityNotes) n.t += dt;
    st.cityNotes = st.cityNotes.filter((n) => n.t < 2);
    if (g.area === 'city') { st.cityNoteT -= dt; if (st.cityNoteT <= 0) { const b = this.bld(); st.cityNoteT = 0.9; st.cityNotes.push({ x: (b.x0 + b.x1) / 2 + U.rand(-30, 30), y: b.y1 - 66, ch: U.pick(['♪', '♫', '♩']), t: 0 }); } }
    if (g.area !== 'music') { st.drum = false; st.lastKey = -1; return; }
    // seated at the drums: walking away stands up again
    if (st.drum && U.dist(p.x, p.y, M.STOOL.x, M.STOOL.y) > 8) st.drum = false;
    if (!st.drum) this.rescue(g);
    st.bounce = Math.max(0, st.bounce - dt * 4); st.toot = Math.max(0, st.toot - dt); st.strum = Math.max(0, st.strum - dt); st.pressed = Math.max(0, st.pressed - dt);
    // the piano: one note per key crossed, lit for a moment
    st.keyT = Math.max(0, st.keyT - dt);
    for (let k = 0; k < st.lit.length; k++) st.lit[k] = Math.max(0, st.lit[k] - dt * 2.2);
    if (this.onKeys(g)) {
      const P = M.PIANO, k = U.clamp(Math.floor((p.x - P.x0) / ((P.x1 - P.x0) / P.keys)), 0, P.keys - 1);
      if (k !== st.lastKey) {
        st.lastKey = k; st.lit[k] = 1; g.s.music.keys++;
        if (st.keyT <= 0) { st.keyT = 0.09; Sfx.tone(M.SCALE[k], 0.22, 'triangle', 0.035); }
      }
    } else st.lastKey = -1;
    // the record spins and notes drift up from it
    st.disc += dt * 3;
    for (const n of st.notes) n.t += dt;
    st.notes = st.notes.filter((n) => n.t < 1.8);
    st.noteT -= dt; if (st.noteT <= 0) { st.noteT = 0.65; st.notes.push({ x: M.RECORD.x + U.rand(-10, 10), y: M.RECORD.y - 14, ch: U.pick(['♪', '♫', '♩']), t: 0 }); }
    // the jukebox plays the shop's tune, quietly; the lights flash and the shopkeeper bops on every beat
    st.pulse = Math.max(0, st.pulse - dt * 3); st.nod = Math.max(0, st.nod - dt * 3);
    st.beatT -= dt;
    if (st.beatT <= 0) {
      const tune = M.TUNES[g.s.music.tune % M.TUNES.length], f = tune[st.beat % tune.length];
      st.beatT = M.BEAT; st.beat++; st.pulse = 1; if (st.beat % 2 === 1) st.nod = 1;
      if (f) Sfx.tone(f, 0.12, 'triangle', 0.016);
    }
  },
  pads(g) {
    if (g.area !== 'music' || !this.st) return [];
    // each circle hides while the chef still holds that instrument, so standing there does not buy it over and over
    const P = CFG.MUSIC.PADS, out = [];
    if (this.st.kazoo <= 0) out.push({ key: 'musicKazoo', label: 'Kazoo', ico: '🎶', pos: P.kazoo, price: 4, sub: 'hmmm!' });
    if (this.st.maraca <= 0) out.push({ key: 'musicMaraca', label: 'Maraca', ico: '🪇', pos: P.maraca, price: 6, sub: 'shake it!' });
    return out;
  },
  onPad(g, pad) {
    const p = g.player, st = this.st;
    if (pad.key === 'musicKazoo') { st.kazoo = CFG.MUSIC.KAZOO; g.s.music.kazoos++; g.floats.push({ x: p.x, y: p.y - 60, text: 'A kazoo! 🎶', color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
    else if (pad.key === 'musicMaraca') { st.maraca = CFG.MUSIC.MARACA; g.s.music.maracas++; g.floats.push({ x: p.x, y: p.y - 60, text: 'A maraca! 🪇', color: '#ffe08a', t: 0, dur: 1.5, big: true }); }
    else return;
    Haptics.success();
  },
  hint(g) {
    if (!this.st) return undefined;
    const p = g.player, M = CFG.MUSIC, st = this.st, s = g.s.music;
    if (g.area === 'city') {
      if (!this.inStreet(g)) return undefined;
      const d = U.dist(p.x, p.y, M.DOOR_OUT.x, M.DOOR_OUT.y);
      if (d < 70) return { text: 'Make some music at the shop! 🎵', target: d < 30 ? null : M.DOOR_OUT };
      return undefined;
    }
    if (g.area !== 'music') return undefined;
    if (st.drum) return { text: 'Press the button to bash the drums! 🥁', target: null };
    if (!s.bashes) return { text: 'Sit at the drums! 🥁', target: M.STOOL };
    if (!s.keys) return { text: 'Walk along the piano keys! 🎹', target: M.PIANO_FRONT };
    if (!s.toots) return { text: 'Toot the trumpet! 🎺', target: M.TRUMPET };
    if (!s.kazoos && st.kazoo <= 0 && g.s.cash + (g.s.padPaid.musicKazoo || 0) >= 4) return { text: 'Buy a kazoo! 🎶', target: M.PADS.kazoo };
    if (st.kazoo > 0) return { text: 'Hmmm hmmm! Walk around and hum 🎶', target: null };
    if (st.maraca > 0) return { text: 'Shake it! 🪇', target: null };
    return { text: 'Rock on! 🎸', target: null };
  },

  // ---------- the City outside: a mat and window decals (static), drifting notes (live) ----------
  bld() { return CFG.CITY.BUILDINGS[CFG.MUSIC.BUILDING]; },
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, b = this.bld(), cx = (b.x0 + b.x1) / 2, gy = b.y1 - 40, D = CFG.MUSIC.DOOR_OUT;
    // a guitar and a big note in the shop windows
    ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🎸', (b.x0 + 10 + cx - 12) / 2, gy + 21); ctx.fillText('🎹', (cx + 12 + b.x1 - 10) / 2, gy + 21);
    // a piano-key welcome mat on the sidewalk in front of the door
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(D.x - 16, D.y - 6, 32, 10);
    ctx.fillStyle = '#2b1d14'; for (let i = 0; i < 4; i++) ctx.fillRect(D.x - 13 + i * 8, D.y - 6, 4, 6);
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(D.x - 16, D.y - 6, 32, 10);
  },

  // ---------- the interior, static ----------
  paint: { music(r, g) { MusicExt.paintRoom(r, g); } },
  drawGuitar(ctx, x, y, s, col, uke) {
    // hangs on the wall: the body at (x, y), the neck pointing up
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(2, 4, 13, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-2.5, -58, 5, 50);                                  // neck
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -5, -68, 10, 12, 3); ctx.fill();                  // head
    ctx.fillStyle = '#e0b44c'; for (let k = 0; k < 3; k++) { ctx.fillRect(-7, -66 + k * 3.5, 2, 2); ctx.fillRect(5, -66 + k * 3.5, 2, 2); }   // tuning pegs
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -8, uke ? 9 : 11, uke ? 10 : 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 6, 13, 13, 0, 0, Math.PI * 2); ctx.fill();   // body
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-4, 4, 5, 7, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, -2, 4.5, 0, Math.PI * 2); ctx.fill();   // sound hole
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-6, 8, 12, 3);                                          // bridge
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.6; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 1.5, -64); ctx.lineTo(k * 2, 9); ctx.stroke(); }
    ctx.restore();
  },
  paintRoom(r, g) {
    const ctx = r.ctx, M = CFG.MUSIC, W = M.WORLD, R = M.ROOM, w = M.WALL;
    // outside the shop: dark plum with a faint tile pattern
    ctx.fillStyle = '#33294a'; ctx.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = W.y0; y < W.y1; y += 40) for (let x = W.x0 + ((y / 40) % 2) * 20; x < W.x1; x += 40) ctx.fillRect(x, y, 38, 38);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(R.x0 - w + 8, M.BACK_TOP + 10, R.x1 - R.x0 + 2 * w, R.y1 + w - M.BACK_TOP);
    // wooden plank floor with a round rug by the drums
    ctx.fillStyle = '#d9a066'; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
    for (let y = R.y0, j = 0; y < R.y1; y += 20, j++) { ctx.fillStyle = j % 2 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'; ctx.fillRect(R.x0, y, R.x1 - R.x0, 20); ctx.fillStyle = 'rgba(43,29,20,0.25)'; ctx.fillRect(R.x0, y, R.x1 - R.x0, 1); for (let x = R.x0 + ((j % 3) * 60); x < R.x1; x += 180) ctx.fillRect(x, y + 2, 1, 16); }
    ctx.fillStyle = '#8e5bd1'; ctx.beginPath(); ctx.ellipse(M.DRUMS.x, M.DRUMS.y - 10, 78, 50, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b39ddb'; ctx.beginPath(); ctx.ellipse(M.DRUMS.x, M.DRUMS.y - 10, 62, 38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8e5bd1'; ctx.beginPath(); ctx.ellipse(M.DRUMS.x, M.DRUMS.y - 10, 46, 27, 0, 0, Math.PI * 2); ctx.fill();
    // walls: a tall plum back wall with a neon strip and a dado; wooden side and bottom walls
    ctx.fillStyle = '#4a3b6b'; ctx.fillRect(R.x0 - w, M.BACK_TOP, R.x1 - R.x0 + 2 * w, R.y0 - M.BACK_TOP);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = R.x0 - w + 6; x < R.x1 + w; x += 14) ctx.fillRect(x, M.BACK_TOP, 5, R.y0 - M.BACK_TOP);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#ff8fab', '#ffd166', '#4dd0e1'][i]; ctx.fillRect(R.x0 - w, M.BACK_TOP + i * 3, R.x1 - R.x0 + 2 * w, 3); }   // striped cornice
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y0 - 6, R.x1 - R.x0 + 2 * w, 6);   // skirting along the back wall
    ctx.fillStyle = '#b5773a'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, w); ctx.fillRect(R.x0 - w, R.y0, w, R.y1 - R.y0); ctx.fillRect(R.x1, R.y0, w, R.y1 - R.y0);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = R.x0 - w; x < R.x1 + w; x += 16) ctx.fillRect(x, R.y1, 2, w); for (let y = R.y0; y < R.y1; y += 16) { ctx.fillRect(R.x0 - w, y, w, 2); ctx.fillRect(R.x1, y, w, 2); }
    ctx.fillStyle = '#8d5a2b'; ctx.fillRect(R.x0 - w, R.y1, R.x1 - R.x0 + 2 * w, 3); ctx.fillRect(R.x0 - w, R.y0, 3, R.y1 - R.y0); ctx.fillRect(R.x1 + w - 3, R.y0, 3, R.y1 - R.y0);
    // the wall of guitars and ukuleles: a pegboard with hooks
    const G = M.GUITARS;
    ctx.fillStyle = '#6b5a8e'; U.roundRect(ctx, G.x0, G.y0, G.x1 - G.x0, G.y1 - G.y0, 4); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = G.y0 + 6; y < G.y1; y += 8) for (let x = G.x0 + 6; x < G.x1; x += 8) ctx.fillRect(x, y, 2, 2);
    const guitars = [['#e4572e', 0], ['#3b7dd8', 0], ['#ffd166', 0], ['#41b883', 0], ['#ff8fab', 1], ['#4dd0e1', 1], ['#f2b134', 1]];
    guitars.forEach(([col, uke], i) => { const x = G.x0 + 20 + i * 28, s = uke ? 0.6 : 0.85; ctx.fillStyle = '#c9ccd2'; ctx.fillRect(x - 3, G.y0 + 8, 6, 3); this.drawGuitar(ctx, x, G.y1 - 12 - (uke ? 8 : 0), s, col, uke); });
    // the upright piano: a dark wooden body on the wall, a music stand with a sheet, the keys sticking out below
    const P = M.PIANO, pw = P.x1 - P.x0;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(P.x0 + 4, P.y0 + 4, pw, P.keysY - P.y0);
    ctx.fillStyle = '#3b2416'; U.roundRect(ctx, P.x0, P.y0, pw, P.keysY - P.y0 + 2, 4); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(P.x0 + 6, P.y0 + 6, pw - 12, 30);
    ctx.fillStyle = '#e0b44c'; ctx.fillRect(P.x0, P.y0 + 40, pw, 2);
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(P.x0 + pw / 2 - 16, P.y0 + 12, 32, 22); ctx.fillStyle = '#2b1d14'; for (let k = 0; k < 4; k++) ctx.fillRect(P.x0 + pw / 2 - 12, P.y0 + 16 + k * 4, 24, 1); ctx.font = r.font(8); ctx.fillText('♪ ♫', P.x0 + pw / 2, P.y0 + 25);   // sheet music
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(P.x0 - 2, P.keysY - 4, pw + 4, 4);                      // the ledge over the keys
    const kw = pw / P.keys;
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(P.x0, P.keysY, pw, P.keysH);
    ctx.fillStyle = 'rgba(43,29,20,0.35)'; for (let k = 1; k < P.keys; k++) ctx.fillRect(P.x0 + k * kw - 0.5, P.keysY, 1, P.keysH);
    ctx.fillStyle = '#2b1d14'; for (let k = 0; k < P.keys - 1; k++) { const n = k % 7; if (n === 2 || n === 6) continue; ctx.fillRect(P.x0 + (k + 1) * kw - 3, P.keysY, 6, P.keysH * 0.58); }   // black keys
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(P.x0, P.keysY + P.keysH, pw, 3);
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(P.x0 + 4, P.keysY + P.keysH, 6, 4); ctx.fillRect(P.x1 - 10, P.keysY + P.keysH, 6, 4);   // feet
    // the record cabinet; the turntable base (the disc spins live)
    const C = M.CABINET, Rc = M.RECORD;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(C.x0 + 3, C.y0 + 4, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#8d5a2b'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 3); ctx.fill();
    ctx.fillStyle = '#a86b36'; ctx.fillRect(C.x0 + 4, C.y0 + 6, C.x1 - C.x0 - 8, 8); ctx.fillStyle = '#e0b44c'; ctx.fillRect((C.x0 + C.x1) / 2 - 3, C.y0 + 9, 6, 2);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#e4572e', '#3b7dd8', '#41b883', '#ffd166', '#ff8fab', '#8e5bd1'][k]; ctx.fillRect(C.x0 + 6 + k * 5, C.y0 - 14, 4, 12); }   // a row of record sleeves
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, Rc.x - 24, Rc.y - 10, 48, 20, 3); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.fillRect(Rc.x + 14, Rc.y - 8, 6, 4);
    // the jukebox body is drawn as an entity (the chef can stand beside it); its shadow on the wall is static
    // the counter is drawn as an entity too (the shopkeeper stands behind it); the kazoos and maracas on it are static
    // a plant in the corner and an amp stack in the other
    const Pl = M.PLANT;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(Pl.x + 2, Pl.y + 12, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b86f2d'; U.roundRect(ctx, Pl.x - 11, Pl.y - 4, 22, 16, 4); ctx.fill(); ctx.fillStyle = '#8d5a2b'; ctx.fillRect(Pl.x - 12, Pl.y - 6, 24, 4);
    ctx.fillStyle = '#3f9a4a'; ctx.beginPath(); ctx.arc(Pl.x, Pl.y - 14, 12, 0, Math.PI * 2); ctx.arc(Pl.x - 10, Pl.y - 8, 8, 0, Math.PI * 2); ctx.arc(Pl.x + 10, Pl.y - 8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#56b862'; ctx.beginPath(); ctx.arc(Pl.x - 3, Pl.y - 18, 5, 0, Math.PI * 2); ctx.fill();
    const A = M.AMP;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(A.x - 13, A.y - 12, 32, 30);
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, A.x - 16, A.y - 16, 32, 30, 4); ctx.fill();
    ctx.fillStyle = '#5c6670'; U.roundRect(ctx, A.x - 12, A.y - 4, 24, 15, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let y = A.y - 2; y < A.y + 10; y += 3) ctx.fillRect(A.x - 10, y, 20, 1);
    ctx.fillStyle = '#c9ccd2'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(A.x - 9 + k * 6, A.y - 10, 2, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(A.x + 12, A.y - 10, 1.5, 0, Math.PI * 2); ctx.fill();
    // a neon note on the back wall over the record cabinet
    ctx.font = r.font(22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(77,208,225,0.35)'; ctx.fillText('♫', Rc.x + 1, M.BACK_TOP + 36); ctx.fillStyle = '#4dd0e1'; ctx.fillText('♫', Rc.x, M.BACK_TOP + 35);
    // the door in the bottom wall, its mat, and the shop's name plate below
    const E = M.EXIT;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(E.x - 22, R.y1, 44, w); ctx.fillStyle = '#bfe3ff'; ctx.fillRect(E.x - 16, R.y1 + 4, 32, 10); ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(E.x + 14, R.y1 + 17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.fillRect(E.x - 21, E.y - 8, 42, 14); ctx.fillStyle = '#2b1d14'; for (let i = 0; i < 6; i++) ctx.fillRect(E.x - 18 + i * 7, E.y - 8, 3, 8);
    ctx.strokeStyle = 'rgba(43,29,20,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(E.x - 21, E.y - 8, 42, 14);
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EXIT', E.x, E.y + 2);
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, (R.x0 + R.x1) / 2 - 46, R.y1 + w + 4, 92, 14, 4); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.font = r.font(8); ctx.fillText('🎵 MUSIC 🎵', (R.x0 + R.x1) / 2, R.y1 + w + 11);
  },

  // ---------- moving things ----------
  // outside the shop's little map the screen would show the dark backdrop: paint the floor around it
  drawOutside(r, g) {
    const ctx = r.ctx, W = CFG.MUSIC.WORLD, x0 = r.camX - 20, y0 = r.camY - 20, x1 = r.camX + r.viewW + 20, y1 = r.camY + r.viewH + 20;
    ctx.fillStyle = '#33294a';
    if (y0 < W.y0) ctx.fillRect(x0, y0, x1 - x0, W.y0 - y0);
    if (y1 > W.y1) ctx.fillRect(x0, W.y1, x1 - x0, y1 - W.y1);
    if (x0 < W.x0) ctx.fillRect(x0, W.y0, W.x0 - x0, W.y1 - W.y0);
    if (x1 > W.x1) ctx.fillRect(W.x1, W.y0, x1 - W.x1, W.y1 - W.y0);
  },
  drawNotes(r, list, dur) {
    const ctx = r.ctx;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const n of list) {
      const k = n.t / dur;
      ctx.globalAlpha = 1 - k; ctx.font = r.font(12 + k * 6); ctx.fillStyle = ['#ff8fab', '#4dd0e1', '#ffd166'][n.ch === '♪' ? 0 : n.ch === '♫' ? 1 : 2];
      ctx.fillText(n.ch, n.x + Math.sin(n.t * 4) * 6, n.y - k * 44);
    }
    ctx.globalAlpha = 1;
  },
  dynamic(r, g) {
    if (!this.st) return;
    const ctx = r.ctx, st = this.st, M = CFG.MUSIC, t = g.time;
    if (g.area === 'city' && !(typeof CityExt !== 'undefined' && CityExt.floor)) { this.drawNotes(r, st.cityNotes, 2); return; }
    if (g.area !== 'music') return;
    this.drawOutside(r, g);
    // lit piano keys
    const P = M.PIANO, kw = (P.x1 - P.x0) / P.keys;
    for (let k = 0; k < P.keys; k++) if (st.lit[k] > 0) { ctx.fillStyle = `rgba(${['255,143,171', '77,208,225', '255,209,102'][k % 3]},${(st.lit[k] * 0.85).toFixed(2)})`; ctx.fillRect(P.x0 + k * kw + 1, P.keysY, kw - 2, P.keysH); }
    // the spinning record and its tonearm
    const Rc = M.RECORD;
    ctx.save(); ctx.translate(Rc.x - 6, Rc.y); ctx.rotate(st.disc);
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.fillRect(-0.5, -2, 1, 1);
    ctx.restore();
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(Rc.x + 17, Rc.y - 6); ctx.lineTo(Rc.x + 2, Rc.y + 1 + Math.sin(t * 6) * 0.5); ctx.stroke();
    // the jukebox's glow on the wall behind it, with the beat
    const J = M.JUKEBOX;
    ctx.fillStyle = `rgba(255,143,171,${(0.08 + st.pulse * 0.18).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(J.x, J.y + 10, 46 + st.pulse * 6, 24, 0, 0, Math.PI * 2); ctx.fill();
  },
  entities(r, g, items) {
    if (!this.st) return;
    const st = this.st, p = g.player, M = CFG.MUSIC;
    if ((st.kazoo > 0 || st.maraca > 0) && this.onFoot(g)) items.push({ y: p.y + 1, draw: () => this.drawInstruments(r, g) });
    if (g.area !== 'music') return;
    items.push({ y: M.DRUMS.y + 14, draw: () => this.drawDrums(r, g) });
    if (st.drum) items.push({ y: p.y + 2, draw: () => this.drawSticks(r, g) });
    items.push({ y: M.TRUMPET.y + 8, draw: () => this.drawTrumpet(r, g) });
    items.push({ y: M.JUKEBOX.y + M.JUKEBOX.h, draw: () => this.drawJukebox(r, g) });
    items.push({ y: M.KEEPER.y, draw: () => this.drawKeeper(r, g) });
    items.push({ y: M.COUNTER.y1, draw: () => this.drawCounter(r, g) });
  },
  drawDrums(r, g) {
    const ctx = r.ctx, D = CFG.MUSIC.DRUMS, st = this.st, b = st.bounce, t = g.time;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(D.x + 2, D.y + 8, 52, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(D.x, D.y + 6); ctx.scale(1 + b * 0.06, 1 - b * 0.08);
    const drum = (x, y, rx, ry, h, col) => {
      ctx.fillStyle = col; ctx.fillRect(x - rx, y - h, rx * 2, h); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x - rx, y - h, rx * 0.3, h);
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.ellipse(x, y - h, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 1.5; ctx.stroke();
    };
    // cymbal stands (hi-hat left, crash right); the cymbals wobble after a hit
    const wob = b * Math.sin(t * 40) * 0.25;
    ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-46, -2); ctx.lineTo(-46, -40); ctx.moveTo(52, -2); ctx.lineTo(52, -46); ctx.stroke();
    for (const [x, y, rx, k] of [[-46, -40, 13, 1], [-46, -36, 13, 0], [52, -46, 16, 1]]) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(k ? wob : 0);
      ctx.fillStyle = '#e0b44c'; ctx.beginPath(); ctx.ellipse(0, 0, rx, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#b8862c'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // toms at the back, the snare and floor tom at the sides, the big bass drum in front
    drum(-14, -24, 11, 4, 10, '#e4572e'); drum(14, -24, 11, 4, 10, '#e4572e');
    drum(-34, -8, 12, 4, 8, '#3b7dd8'); drum(34, -4, 13, 5, 14, '#e4572e');
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(0, -10, 21, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8ee'; ctx.beginPath(); ctx.arc(0, -10, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -10, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e4572e'; ctx.font = r.font(11); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🍕', 0, -10);
    ctx.fillStyle = '#5c6670'; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * 19, -10 + Math.sin(a) * 19, 1.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(-26, 6, 10, 3); ctx.fillRect(16, 6, 10, 3);   // bass-drum legs
    ctx.restore();
  },
  drawSticks(r, g) {
    const ctx = r.ctx, p = g.player, st = this.st, b = st.bounce, t = g.time, y = p.y - 18 + (p.moving ? Math.sin(p.bob || 0) * 2 : 0);
    ctx.strokeStyle = '#d9a066'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (const d of [-1, 1]) { const a = (st.hit === (d > 0 ? 1 : 0) ? b : 0) * 0.9; ctx.beginPath(); ctx.moveTo(p.x + d * 14, y); ctx.lineTo(p.x + d * 24, y + 14 - a * 10 + Math.sin(t * 6 + d) * 1.2); ctx.stroke(); }
  },
  drawTrumpet(r, g) {
    const ctx = r.ctx, T = CFG.MUSIC.TRUMPET, st = this.st, k = st.toot > 0 ? st.toot / 0.6 : 0, j = k * Math.sin(g.time * 40) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(T.x + 2, T.y + 8, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5c6670'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(T.x, T.y + 6); ctx.lineTo(T.x, T.y - 22); ctx.moveTo(T.x - 8, T.y + 7); ctx.lineTo(T.x + 8, T.y + 7); ctx.stroke();   // the stand
    ctx.save(); ctx.translate(T.x + j, T.y - 30); ctx.rotate(-0.35);
    ctx.fillStyle = '#e0b44c'; U.roundRect(ctx, -14, -3, 24, 6, 3); ctx.fill();                                     // the tube
    ctx.beginPath(); ctx.moveTo(10, -3); ctx.lineTo(22, -11); ctx.lineTo(22, 11); ctx.lineTo(10, 3); ctx.closePath(); ctx.fill();   // the bell
    ctx.fillStyle = '#b8862c'; ctx.fillRect(-18, -1.5, 6, 3); for (let i = 0; i < 3; i++) ctx.fillRect(-6 + i * 5, -9, 2.5, 6);   // mouthpiece and valves
    ctx.fillStyle = '#fff3b0'; ctx.fillRect(-10, -2, 14, 1.5);
    ctx.restore();
    if (k > 0) { ctx.fillStyle = `rgba(255,255,255,${(k * 0.7).toFixed(2)})`; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(T.x + 26 + (1 - k) * (14 + i * 8), T.y - 38 - i * 6 + Math.sin(g.time * 9 + i) * 2, 2 + i, 0, Math.PI * 2); ctx.fill(); } }
  },
  drawJukebox(r, g) {
    const ctx = r.ctx, J = CFG.MUSIC.JUKEBOX, st = this.st, x = J.x, y = J.y, w = J.w, h = J.h, t = g.time;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, x - w / 2 + 4, y + 6, w, h, 10); ctx.fill();
    ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.moveTo(x - w / 2, y + h); ctx.lineTo(x - w / 2, y + 22); ctx.arc(x, y + 22, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y + h); ctx.closePath(); ctx.fill();
    // the arch of lights chases round with the beat
    const cols = ['#ffd166', '#4dd0e1', '#ff8fab', '#41b883'], on = Math.floor(t * 6) % 4;
    for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI, lx = x + Math.cos(a) * (w / 2 - 5), ly = y + 22 + Math.sin(a) * (w / 2 - 5); ctx.fillStyle = (i % 4) === on || st.pulse > 0.6 ? cols[i % 4] : 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(lx, ly, 2.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffe08a'; U.roundRect(ctx, x - 14, y + 10, 28, 18, 5); ctx.fill();                         // the window with the record inside
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(x, y + 19, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x, y + 19, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c6670'; ctx.fillRect(x - w / 2 + 4, y + 34, w - 8, 10); ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let k = 0; k < 5; k++) ctx.fillRect(x - w / 2 + 7 + k * 8, y + 36, 5, 6);   // the speaker grille
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TUNE ' + (g.s.music.tune + 1), x, y + 50);
    // the big round button, pressed in for a moment
    const pr = st.pressed > 0 ? 1 : 0;
    ctx.fillStyle = '#8d1b1b'; ctx.beginPath(); ctx.arc(x, y + 58, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = pr ? '#2f9e44' : '#41b883'; ctx.beginPath(); ctx.arc(x, y + 57 + pr, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - 1.5, y + 55 + pr, 1.8, 0, Math.PI * 2); ctx.fill();
  },
  drawCounter(r, g) {
    const ctx = r.ctx, C = CFG.MUSIC.COUNTER, Rg = CFG.MUSIC.REGISTER;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(C.x0 + 4, C.y0 + 6, C.x1 - C.x0, C.y1 - C.y0);
    ctx.fillStyle = '#8e5bd1'; U.roundRect(ctx, C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; for (let x = C.x0 + 8; x < C.x1 - 6; x += 16) ctx.fillRect(x, C.y0 + 14, 8, C.y1 - C.y0 - 18);
    ctx.fillStyle = '#f6e7cf'; U.roundRect(ctx, C.x0 - 2, C.y0 - 8, C.x1 - C.x0 + 4, 20, 6); ctx.fill();
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, Rg.x - 14, Rg.y - 14, 28, 18, 4); ctx.fill(); ctx.fillStyle = '#8ef0a0'; ctx.fillRect(Rg.x - 10, Rg.y - 11, 20, 6); ctx.fillStyle = '#9aa0a8'; for (let k = 0; k < 3; k++) ctx.fillRect(Rg.x - 9 + k * 7, Rg.y - 3, 5, 3);
    // kazoos in a cup and a pair of maracas on the counter top
    ctx.fillStyle = '#4dd0e1'; U.roundRect(ctx, C.x0 + 96, C.y0 - 16, 14, 14, 3); ctx.fill();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#ff8fab', '#ffd166', '#41b883'][k]; ctx.save(); ctx.translate(C.x0 + 99 + k * 4, C.y0 - 16); ctx.rotate(-0.3 + k * 0.3); ctx.fillRect(-1.5, -12, 3, 12); ctx.restore(); }
    for (const [dx, rot] of [[152, -0.4], [168, 0.4]]) { ctx.save(); ctx.translate(C.x0 + dx, C.y0 - 6); ctx.rotate(rot); ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-1.5, -4, 3, 12); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(0, -10, 6, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-3 + k * 3, -10 + (k % 2) * 3, 1, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
    ctx.fillStyle = '#2b1d14'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KAZOOS  ·  MARACAS', C.x0 + 134, C.y0 + 4);
  },
  drawKeeper(r, g) {
    const ctx = r.ctx, K = CFG.MUSIC.KEEPER, st = this.st, p = g.player, nod = U.easeOut(st.nod) * 3, f = p.x < K.x ? -1 : 1;
    ctx.save(); ctx.translate(0, -nod);
    r.drawPerson(K.x, K.y, { shirt: '#4dd0e1', skin: '#8d5a2b', hair: '#2b1d14', hairStyle: 2, facing: f, moving: false, bob: 0, carry: 0, pants: '#2d3a4a', stripes: true });
    // headphones over the hair: a band and two cups
    ctx.strokeStyle = '#e4572e'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(K.x, K.y - 40, 12.5, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.fillStyle = '#e4572e'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(K.x + d * 11, K.y - 38, 4, 5.5, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffd166'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(K.x + d * 11, K.y - 38, 2, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (st.nod > 0.5) { ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ff8fab'; ctx.fillText('♪', K.x + 16, K.y - 58); }
  },
  drawInstruments(r, g) {
    const ctx = r.ctx, p = g.player, st = this.st, f = p.facing || 1, t = g.time, bob = p.moving ? Math.sin(p.bob || 0) * 2 : 0;
    if (st.kazoo > 0) {
      // a little kazoo held up to the mouth, a note puffing out while it hums
      const x = p.x + f * 9, y = p.y - 33 + bob;
      ctx.save(); ctx.translate(x, y); ctx.rotate(f * 0.25); ctx.scale(f, 1);
      ctx.fillStyle = '#3b7dd8'; U.roundRect(ctx, -2, -2.5, 14, 5, 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.fillRect(4, -4, 4, 3); ctx.fillStyle = '#2b1d14'; ctx.fillRect(11, -1.5, 3, 3);
      ctx.restore();
      if (st.hum > 0) { ctx.globalAlpha = Math.min(1, st.hum * 3); ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#4dd0e1'; ctx.fillText('♪', x + f * 16, y - 10 - (0.35 - st.hum) * 20); ctx.globalAlpha = 1; }
    }
    if (st.maraca > 0) {
      // a maraca in the other hand, shaking while walking
      const x = p.x - f * 16, y = p.y - 18 + bob, sh = p.moving ? Math.sin(t * 28) * 0.45 : Math.sin(t * 2) * 0.08;
      ctx.save(); ctx.translate(x, y); ctx.rotate(sh - f * 0.3);
      ctx.fillStyle = '#5b3a1a'; ctx.fillRect(-1.5, -4, 3, 12); ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.ellipse(0, -11, 6.5, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-3 + k * 3, -11 + (k % 2) * 3, 1.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      if (p.moving) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - f * 8 + Math.sin(t * 20 + k * 2) * 3, y - 16 - k * 4, 1.2, 0, Math.PI * 2); ctx.fill(); } }
    }
  },
  overlay(r, g) {
    if (!this.st || g.area !== 'music') return;
    this.drawNotes(r, this.st.notes, 1.8);
    // the guitars shiver when strummed
    const st = this.st, S = CFG.MUSIC.STRUM;
    if (st.strum > 0) { const ctx = r.ctx, k = st.strum / 0.7; ctx.globalAlpha = k; ctx.font = r.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#ff8fab', '#4dd0e1', '#ffd166'][i]; ctx.fillText('♪', S.x - 30 + i * 30 + Math.sin(g.time * 8 + i) * 4, S.y - 50 - (1 - k) * 30 - i * 6); } ctx.globalAlpha = 1; }
  },
  screen(r, g) {
    if (!this.st || this.st.fade <= 0) return;
    const ctx = r.ctx, W = r.canvas.width / r.dpr, H = r.canvas.height / r.dpr;
    ctx.fillStyle = `rgba(20,12,6,${(this.st.fade / 0.45).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  },
};
Game.ext.unshift(MusicExt);   // first in line so the door's button and hint beat the City's taxis and coins
Render.ext.push(MusicExt);
