'use strict';
// The hiring desk in the office corner of the pizzeria (first floor, town map): a little chair beside it where the
// chef can sit and draw. It opens the same drawing pad as the desk upstairs (UpstairsExt's pad, slot 'office'),
// and "Hang it on the wall" saves the picture to `g.s.hiredesk.drawing` and hangs it in its own frame on the
// office's back wall, between the Hire Cashier and Hire Helper circles. The bedroom's drawing is not touched.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
CFG.HIREDESK = {
  // free floor just west of the desk (the desk spans x 130..210), clear of the hire pads' circles (y 535, r 40)
  chair: { x: 104, y: 620 }, reach: 26, hintReach: 60,
  // on the office's back wall (y 472..478), in the gap between the Hire Cashier (x 60) and Hire Helper (x 170) pads
  frame: { x: 115, y: 497, w: 40, h: 30 },
};

const HireDeskExt = {
  name: 'hiredesk',

  // ---------- game hooks ----------
  defaults: { hiredesk: { drawing: null } },
  state(g) { if (!g.s.hiredesk) g.s.hiredesk = { drawing: null }; return g.s.hiredesk; },
  // the pad is open on the office's picture
  drawing(g) { const st = typeof UpstairsExt !== 'undefined' && UpstairsExt.st; return !!(st && st.draw.on && st.draw.slot === 'office'); },
  // on foot in the town map, not riding anything
  ready(g) {
    if (g.area !== 'town' || g.driving || g.onTrain || g.ride || g.travel || g.fishing) return false;
    if (typeof CityExt !== 'undefined' && (CityExt.floor || (CityExt.st && (CityExt.st.cab || CityExt.st.boarding)))) return false;
    return typeof UpstairsExt !== 'undefined';
  },
  dist(g) { const p = g.player, c = CFG.HIREDESK.chair; return U.dist(p.x, p.y, c.x, c.y); },
  // the office's slot on the shared drawing pad (registered at load, or later if js/upstairs.js loads after this file)
  register() {
    if (typeof UpstairsExt === 'undefined' || UpstairsExt.artSlots.office) return;
    UpstairsExt.addArtSlot('office', {
      get: (g) => g.s.hiredesk && g.s.hiredesk.drawing,
      set: (g, url) => { HireDeskExt.state(g).drawing = url; },
      area: 'town', frame: () => CFG.HIREDESK.frame, hung: '🖼️ Hung up in the shop!',
    });
  },
  build(g) { this.state(g); this.register(); },
  action(g) {
    if (this.drawing(g) || !this.ready(g) || this.dist(g) >= CFG.HIREDESK.reach) return null;
    return { label: '✏️ Sit and draw', run: (gg) => this.sit(gg) };
  },
  hint(g) {
    if (this.drawing(g)) return g.area === 'town' ? null : undefined;   // the pad explains itself
    if (!this.ready(g)) return undefined;
    const d = this.dist(g), H = CFG.HIREDESK;
    if (d >= H.hintReach) return undefined;
    return { text: 'Sit at the desk and draw ✏️', target: d < H.reach ? null : H.chair };
  },
  // sit on the chair, facing the desk, and open the pad (UpstairsExt keeps the chef on the chair until it closes)
  sit(g) {
    const p = g.player, c = CFG.HIREDESK.chair;
    p.x = c.x; p.y = c.y; p.facing = 1; p.moving = false;
    this.state(g); this.register();
    UpstairsExt.openPad(g, 'office');
  },

  // ---------- render hooks ----------
  bgKey(g) {
    if (typeof UpstairsExt === 'undefined' || !g.s) return '';
    this.register();
    const rec = UpstairsExt.art(g, 'office');
    return 'hd:' + (rec && rec.ok ? rec.n : 0);
  },
  paintTown(r, g) {
    const ctx = r.ctx, H = CFG.HIREDESK, c = H.chair;
    // the chair: a round red seat with its back to the wall side, facing the desk
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(c.x + 2, c.y + 3, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; ctx.beginPath(); ctx.arc(c.x, c.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b23a48'; ctx.beginPath(); ctx.arc(c.x, c.y, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(c.x - 2.5, c.y - 2.5, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1a'; U.roundRect(ctx, c.x - 13, c.y - 6, 5, 13, 2); ctx.fill();
    // a pot of crayons on the floor beside it
    const px = c.x - 26, py = c.y + 4;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(px + 1, py + 6, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    [['#e4572e', -3], ['#2f9e44', 0], ['#3b7dd8', 3]].forEach(([col, dx]) => { ctx.fillStyle = col; ctx.fillRect(px + dx - 1, py - 12, 2.4, 10); });
    ctx.fillStyle = '#f2b134'; U.roundRect(ctx, px - 6, py - 4, 12, 10, 2); ctx.fill();
    // the office's own picture, once one is hung
    const rec = typeof UpstairsExt !== 'undefined' ? UpstairsExt.art(g, 'office') : null;
    if (rec && rec.ok) { const F = H.frame; UpstairsExt.paintArt(ctx, F.x, F.y, F.w, F.h, rec.el); }
  },
};

HireDeskExt.register();
Game.ext.unshift(HireDeskExt);   // first in line so the chair's button and hint beat the shop's own
Render.ext.push(HireDeskExt);
