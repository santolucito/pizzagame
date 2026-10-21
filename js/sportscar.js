'use strict';
// The sports car dealership in the City: a little open-air lot with a car on a turntable. Buy it and it is yours to
// drive around the City, and a second one is delivered to the pizzeria's parking lot at home. It starts white, like
// the showroom vehicles, and takes paint in the garage bay.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
CFG.SPORTS = {
  LOT: { x0: 5010, y0: 690, x1: 5130, y1: 880 },      // the empty lot west of the school, under the tree
  TURNTABLE: { x: 5070, y: 770, r: 44 },
  PAD: { x: 5070, y: 848 },
  SIGN: { x: 5024, y: 712 },
  CITY_SPOT: { x: 5070, y: 770, angle: -Math.PI / 2 },   // your city car waits on the turntable
  TOWN_SPOT: { x: 1170, y: 452, angle: -Math.PI / 2 },   // the one delivered home: right column of the pizzeria lot
  PRICE: 900,
};
CFG.VEHICLES.sportscar = { speed: 520, radius: 20, label: '🏎️ Drive', exit: '🚶 Get out' };

const SportsCarExt = {
  name: 'sportscar',
  defaults: { sports: { owned: false } },
  build(g) {
    const S = CFG.SPORTS;
    this.city = { kind: 'sportscar', x: S.CITY_SPOT.x, y: S.CITY_SPOT.y, angle: S.CITY_SPOT.angle, vx: 0, vy: 0 };
    this.town = { kind: 'sportscar', x: S.TOWN_SPOT.x, y: S.TOWN_SPOT.y, angle: S.TOWN_SPOT.angle, vx: 0, vy: 0 };
  },
  vehicles(g) { return g.s.sports.owned ? [this.city, this.town] : []; },
  onTurntable(g) { const v = this.city, T = CFG.SPORTS.TURNTABLE; return g.area === 'city' && g.driving && g.vehicle === v && U.dist(v.x, v.y, T.x, T.y) < T.r + 10 && Math.hypot(v.vx, v.vy) < 15; },
  // the turntable doubles as a paint bay: park the sports car on it and the colour swatches appear, like the garage at home
  update(g, dt) { if (this.onTurntable(g)) g.inPaintBay = true; },
  bgKey(g) { return g.s.sports.owned ? 'sc1' : 'sc0'; },
  pads(g) {
    if (g.s.sports.owned || g.area !== 'city') return [];
    return [{ key: 'sportscar', label: 'Sports Car', ico: '🏎️', pos: CFG.SPORTS.PAD, price: CFG.SPORTS.PRICE, sub: 'super fast!' }];
  },
  onPad(g, pad) {
    g.s.sports.owned = true; g.s.paint.sportscar = '#ffffff';
    Sfx.unlock(); Haptics.success();
    g.toast('🏎️ Your sports car! Park it on the turntable to pick a colour. A second one is waiting in the pizzeria lot', true);
    for (let i = 0; i < 12; i++) g.fx.push({ kind: 'sparkle', x0: this.city.x + U.rand(-34, 34), y0: this.city.y + U.rand(-20, 20), x1: 0, y1: 0, t: -i * 0.05, dur: 0.5 });
  },
  hint(g) {
    if (g.area === 'city' && g.s.sports.owned && g.driving && g.vehicle === this.city && (g.s.paint.sportscar || '#ffffff') === '#ffffff' && !this.onTurntable(g)) return { text: 'Park on the turntable to pick a colour 🎨', target: CFG.SPORTS.TURNTABLE };
    if (g.area !== 'city' || g.s.sports.owned || g.driving) return undefined;
    const p = g.player, P = CFG.SPORTS.PAD;
    if (U.dist(p.x, p.y, P.x, P.y) < 420 && g.s.cash + (g.s.padPaid.sportscar || 0) >= CFG.SPORTS.PRICE) return { text: 'Buy the sports car! 🏎️', target: P };
    return undefined;
  },

  // ---- the lot: asphalt, a turntable, a sign and bunting (static, in the City's cached background)
  paintAfter(r, g, area) {
    if (area !== 'city') return;
    const ctx = r.ctx, S = CFG.SPORTS, L = S.LOT, T = S.TURNTABLE;
    ctx.fillStyle = '#5a5d63'; ctx.fillRect(L.x0, L.y0, L.x1 - L.x0, L.y1 - L.y0);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 40; i++) ctx.fillRect(L.x0 + ((i * 37) % (L.x1 - L.x0)), L.y0 + ((i * 53) % (L.y1 - L.y0)), 2, 2);
    ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3; ctx.strokeRect(L.x0 + 6, L.y0 + 6, L.x1 - L.x0 - 12, L.y1 - L.y0 - 12);
    // turntable: a raised disc with a chequered rim
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(T.x + 3, T.y + 5, T.r + 4, (T.r + 4) * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(T.x, T.y, T.r + 4, (T.r + 4) * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.ellipse(T.x, T.y, T.r, T.r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#2b1d14' : '#fff'; const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(T.x + Math.cos(a0) * T.r, T.y + Math.sin(a0) * T.r * 0.8); ctx.lineTo(T.x + Math.cos(a0) * (T.r + 4), T.y + Math.sin(a0) * (T.r + 4) * 0.8); ctx.lineTo(T.x + Math.cos(a1) * (T.r + 4), T.y + Math.sin(a1) * (T.r + 4) * 0.8); ctx.lineTo(T.x + Math.cos(a1) * T.r, T.y + Math.sin(a1) * T.r * 0.8); ctx.closePath(); ctx.fill(); }
    // bunting across the lot and a sign on a post
    ctx.strokeStyle = '#2b1d14'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L.x0 + 10, L.y0 + 14); ctx.quadraticCurveTo(T.x, L.y0 + 30, L.x1 - 10, L.y0 + 14); ctx.stroke();
    const cols = ['#e4572e', '#f2b134', '#3b7dd8', '#41b883', '#f06292'];
    for (let i = 0; i < 9; i++) { const k = (i + 0.5) / 9, x = L.x0 + 10 + k * (L.x1 - L.x0 - 20), y = L.y0 + 14 + 16 * (1 - Math.pow(2 * k - 1, 2)) * 0.5; ctx.fillStyle = cols[i % 5]; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 9); ctx.closePath(); ctx.fill(); }
    const G = S.SIGN;
    ctx.fillStyle = '#5b3a1a'; ctx.fillRect(G.x - 3, G.y - 26, 6, 30);
    ctx.fillStyle = '#c62828'; U.roundRect(ctx, G.x - 46, G.y - 50, 92, 26, 6); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🏎️ SPORTS CARS', G.x, G.y - 42);
    ctx.font = r.font(8); ctx.fillText(g.s.sports.owned ? 'SOLD! · 🎨 PAINT HERE' : 'TEST DRIVE TODAY', G.x, G.y - 31);
  },

  // ---- the car for sale turns slowly on the turntable until it is bought
  dynamic(r, g) {
    if (g.area !== 'city' || g.s.sports.owned) return;
    const ctx = r.ctx, T = CFG.SPORTS.TURNTABLE;
    ctx.save(); ctx.translate(T.x, T.y); ctx.rotate(g.time * 0.5); ctx.globalAlpha = 0.92;
    r.drawVehicle('sportscar', g, '#ffffff');
    ctx.restore();
    const bob = Math.sin(g.time * 3) * 3;
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✨', T.x - 30, T.y - 34 + bob); ctx.fillText('✨', T.x + 32, T.y - 26 - bob);
  },
  entities(r, g, items) {
    if (!g.s.sports.owned) return;
    const v = g.area === 'city' ? this.city : g.area === 'town' ? this.town : null;
    if (v) items.push({ y: v.y + 10, draw: () => r.drawSiteVehicle(g, v, 30) });
  },

  // ---- the car itself, nose +x: low wedge body, dark windscreen, side vents, a spoiler and fat tyres
  vehicleArt: {
    sportscar(r, g, color, v, h) {
      const ctx = r.ctx, c = color || '#ffffff';
      h.shadow(96, 22);
      ctx.fillStyle = '#1e1e1e'; for (const wx of [-30, 30]) { U.roundRect(ctx, wx - 9, -26, 18, 10, 3); ctx.fill(); U.roundRect(ctx, wx - 9, 16, 18, 10, 3); ctx.fill(); }
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-46, -16); ctx.lineTo(28, -20); ctx.quadraticCurveTo(50, -14, 50, 0); ctx.quadraticCurveTo(50, 14, 28, 20); ctx.lineTo(-46, 16); ctx.quadraticCurveTo(-52, 0, -46, -16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-20, -17, 3, 34); ctx.fillRect(-14, -17, 3, 34);   // side vents
      ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, -6, -14, 26, 28, 7); ctx.fill();                          // cabin glass
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; U.roundRect(ctx, 6, -11, 8, 22, 4); ctx.fill();            // windscreen gleam
      ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, -50, -22, 8, 44, 3); ctx.fill();                         // spoiler
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-44, -12, 10, 24);
      ctx.fillStyle = '#fff6b0'; U.roundRect(ctx, 44, -14, 5, 8, 2); ctx.fill(); U.roundRect(ctx, 44, 6, 5, 8, 2); ctx.fill();   // headlights
      ctx.fillStyle = '#ff5252'; U.roundRect(ctx, -49, -16, 4, 7, 1); ctx.fill(); U.roundRect(ctx, -49, 9, 4, 7, 1); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; U.roundRect(ctx, -40, -4, 60, 3, 1); ctx.fill();          // racing stripe
    },
  },
  home(g) {},
};
Game.ext.unshift(SportsCarExt);   // first in line so its paint hint beats the City's coin hint while you drive the sports car
Render.ext.push(SportsCarExt);
