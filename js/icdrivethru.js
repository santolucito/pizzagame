'use strict';
// A drive-thru window for the ice cream shop.
// Extension module: registered with Game.ext and Render.ext. See the hook list in js/EXTENSIONS.md.
//
// Once the ice cream shop is owned, a pad in the parking-lot corner south-east of the shop sells a drive-thru
// window on the shop's east wall, facing East Road. From then on NPC cars come up East Road's west lane from
// the South Road junction, queue at the window (up to three, nose to tail behind it), get a cone handed
// through, pay into the shop's money pile (the one the player already collects inside the shop), then drive
// on north and turn east along Main Street out of town, the way the pizza drive-thru cars leave. The cars are
// purely decorative traffic: no obstacles, nothing for the player to do but watch and collect the money.
//
// Why the cars come from the south: they drive along the shop's wall in the lane next to it, and a queue of
// three only fits behind the window on the long stretch of East Road south of it (north of the window there
// are just 100 px before the Main Street junction).

CFG.IC_DRIVE = {
  pad: { x: 1186, y: 380 }, price: 500,            // parking-lot corner, below the shop's south-east corner
  window: { x: 1222, y: 218 },                     // on the shop's east wall (x 1216..1222)
  board: { x: 1228, y: 146 },                      // menu board north of the window
  sign: { x: 1202, y: 184 },                       // "DRIVE-THRU" sign over the wall, clear of the cars
  laneX: 1264,                                     // centre of East Road's west lane (road is 1240..1320)
  spawnY: 1100,                                    // cars appear on the grass below the South Road junction
  entryGap: 90,                                    // no new car while the last one is still this close to the entrance
  stopLine: 166,                                   // white bar just ahead of the first car's nose
  laneEnd: 560,                                    // dashed guide line runs from the road top down to here
  exitY: 58,                                       // Main Street's centre line, where the cars turn east
  queueMax: 3,
  gap: 14,                                         // bumper-to-bumper gap between queued cars
  spawnEvery: [12, 25],                            // seconds between cars (first one sooner after buying)
  serve: 2.5,                                      // seconds a car waits at the window
  slideAt: 1.1, slideDur: 0.5,                     // when (into the wait) the cone slides over, and how long
  priceMult: 1.5,                                  // drive-thru cones cost more than walk-in ones
  speed: 170,
  coneHold: 2,                                     // seconds the passenger holds the cone out of the window
  honkAfter: 7,                                    // a car that has queued this long gives a little beep
  funChance: 1 / 7, funKinds: ['mixer', 'police', 'schoolbus', 'taxi'],
  flavors: ['#ffb6c1', '#fff3c4', '#8d5a2b', '#b8f2c8', '#cdb4ff', '#ffd166'],
};

// Vehicle lengths along their nose axis (from Render.drawVehicle), used to space the queue so nothing overlaps.
const IC_DRIVE_LEN = { car: 92, taxi: 92, police: 92, mixer: 108, schoolbus: 112, firetruck: 124 };

// One NPC car in the ice cream drive-thru line. States: arriving -> waiting (at the window) -> leaving -> gone.
class IcDriveCar {
  constructor(kind) {
    const D = CFG.IC_DRIVE;
    this.kind = kind; this.color = U.pick(COLORS.cars); this.flavor = U.pick(D.flavors);
    this.x = D.laneX; this.y = D.spawnY; this.angle = -Math.PI / 2;   // nose pointing north
    this.state = 'arriving'; this.t = 0; this.paid = false; this.coneT = 0; this.waitT = 0; this.honked = false;
    this.speed = D.speed; this.path = null;
  }
  get inLine() { return this.state === 'arriving' || this.state === 'waiting'; }
  get half() { return (IC_DRIVE_LEN[this.kind] || 92) / 2; }
  // turn smoothly toward a point (same feel as the core's cars on their exit paths)
  steer(tx, ty, dt) {
    const ang = Math.atan2(ty - this.y, tx - this.x);
    let d = ang - this.angle; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    this.angle += d * Math.min(1, dt * 6);
  }
}

const IceCreamDriveThruExt = {
  name: 'icdrivethru',
  defaults: { icDrive: { owned: false, served: 0 } },

  cars: [], spawnT: 4, cone: null,   // cone: the one sliding from the window to a car {x, y, x1, y1, t, dur, flavor}

  st(g) { return g.s.icDrive || (g.s.icDrive = { owned: false, served: 0 }); },
  owned(g) { return !!(g.s.iceCream && g.s.iceCream.owned && this.st(g).owned); },
  onFoot(g) { return !g.driving && !g.onTrain && !g.travel && !g.ride && !g.fishing; },

  // ---------- game hooks ----------
  build(g) { this.cars = []; this.spawnT = 4; this.cone = null; },

  pads(g) {
    if (!g.s.iceCream || !g.s.iceCream.owned || this.st(g).owned) return [];
    const D = CFG.IC_DRIVE;
    return [{ key: 'icDrive', label: 'Ice Cream Drive-Thru', ico: '🚗', pos: D.pad, price: D.price, sub: 'cars buy on their own' }];
  },
  onPad(g, pad) {
    if (pad.key !== 'icDrive') return;
    this.st(g).owned = true; this.spawnT = 2;
    Sfx.unlock(); Haptics.success();
    g.toast('🍦 Ice cream drive-thru open!', true, 'town');
  },
  bgKey(g) { return 'icd' + (this.owned(g) ? 1 : 0); },

  hint(g) {
    if (g.area !== 'town' || !g.s.iceCream || !g.s.iceCream.owned || this.st(g).owned || !this.onFoot(g)) return undefined;
    const D = CFG.IC_DRIVE, p = g.player;
    if (U.dist(p.x, p.y, D.pad.x, D.pad.y) > 400) return undefined;
    if (p.carry > 0 && g.houses.some((h) => h.order)) return undefined;   // a delivery is more urgent
    if (g.s.cash + (g.s.padPaid.icDrive || 0) < D.price) return undefined;
    return { text: 'Open an ice cream drive-thru!', target: D.pad };
  },

  // Where the i-th car in line should stop: the first at the window, the rest nose-to-tail behind it (south).
  queueY(idx) {
    const D = CFG.IC_DRIVE, line = this.cars.filter((c) => c.inLine);
    let y = D.window.y;
    for (let i = 1; i <= idx && i < line.length; i++) y += line[i - 1].half + D.gap + line[i].half;
    return y;
  },

  update(g, dt) {
    if (!this.owned(g)) return;
    const D = CFG.IC_DRIVE, IC = CFG.ICE_CREAM, W = D.window;
    // spawn: a car every 12-25 s, half as often while the player is far away or on another map
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      const far = g.area !== 'town' || U.dist(g.player.x, g.player.y, W.x, W.y) > 1400;
      this.spawnT = U.rand(D.spawnEvery[0], D.spawnEvery[1]) * (far ? 2 : 1);
      const line = this.cars.filter((c) => c.inLine);
      const clear = !this.cars.some((c) => c.y > D.spawnY - D.entryGap);   // nobody still sitting on the entrance
      if (line.length < D.queueMax && clear) this.cars.push(new IcDriveCar(Math.random() < D.funChance ? U.pick(D.funKinds) : 'car'));
    }
    // the cone sliding across to the car
    if (this.cone) { this.cone.t += dt; if (this.cone.t >= this.cone.dur) this.cone = null; }
    let idx = 0;
    for (const c of this.cars) {
      c.coneT = Math.max(0, c.coneT - dt);
      if (c.inLine) {
        const myIdx = idx++;
        const ty = this.queueY(myIdx);
        const arrived = U.moveToward(c, D.laneX, ty, c.speed, dt);
        if (myIdx === 0 && arrived) {
          if (c.state !== 'waiting') { c.state = 'waiting'; c.t = 0; }
          c.t += dt;
          if (!this.cone && !c.paid && c.t >= D.slideAt) this.cone = { x: W.x + 8, y: W.y, x1: c.x - 10, y1: c.y, t: 0, dur: D.slideDur, flavor: c.flavor };
          if (!c.paid && c.t >= D.slideAt + D.slideDur) {
            c.paid = true;
            const amt = Math.round(g.iceCreamPrice() * D.priceMult);
            g.s.iceCream.cash += amt; g.secEarned += amt;
            g.s.stats.scoops = (g.s.stats.scoops || 0) + 1; this.st(g).served++;
            g.floats.push({ x: W.x + 16, y: W.y - 34, text: '+' + U.money(amt), color: '#2f9e44', t: 0, dur: 1, big: true });
            g.fx.push({ kind: 'cash', x0: c.x, y0: c.y - 10, x1: IC.cash.x, y1: IC.cash.y, t: 0, dur: 0.4 });
            if (g.area === 'town') Sfx.cash();
          }
          if (c.t >= D.serve) {
            c.state = 'leaving'; c.coneT = D.coneHold; c.speed = D.speed * 1.2;
            // up to the junction, a rounded right turn, then east along Main Street and out of town
            c.path = [{ x: D.laneX, y: D.exitY + 30 }, { x: D.laneX + 14, y: D.exitY + 6 }, { x: D.laneX + 44, y: D.exitY }, { x: CFG.WORLD.x1 + 130, y: D.exitY }];
          }
        } else {
          c.state = 'arriving';
          if (arrived) {
            c.waitT += dt;
            if (!c.honked && c.waitT > D.honkAfter) {
              c.honked = true;
              g.floats.push({ x: c.x + 30, y: c.y - 20, text: 'beep!', color: '#2b1d14', t: 0, dur: 1 });
              if (g.area === 'town' && Sfx.throttle('icbeep', 4000)) { Sfx.tone(440, 0.09, 'square', 0.03); setTimeout(() => Sfx.tone(440, 0.12, 'square', 0.03), 130); }
            }
          }
        }
      } else if (c.state === 'leaving') {
        const wp = c.path[0];
        c.steer(wp.x, wp.y, dt);
        if (U.moveToward(c, wp.x, wp.y, c.speed, dt)) { c.path.shift(); if (!c.path.length) c.state = 'gone'; }
      }
    }
    this.cars = this.cars.filter((c) => c.state !== 'gone');
  },

  // ---------- render hooks ----------
  drawCone(ctx, x, y, flavor, s = 1) {
    ctx.fillStyle = '#d98a3c'; ctx.beginPath(); ctx.moveTo(x - 5 * s, y); ctx.lineTo(x + 5 * s, y); ctx.lineTo(x, y + 12 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = flavor; ctx.beginPath(); ctx.arc(x, y - 3 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(x + 1 * s, y - 9 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
  },

  // static art: window, awning, menu board, sign, lane marking, stop line
  paintTown(r, g) {
    if (!this.owned(g)) return;
    const ctx = r.ctx, D = CFG.IC_DRIVE, W = D.window, lx = D.laneX;
    // dashed guide line up the west lane, with little arrows pointing the way (north, then out east)
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.setLineDash([14, 12]);
    ctx.beginPath(); ctx.moveTo(lx, D.laneEnd); ctx.lineTo(lx, 100); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const ay of [130, 440, 520]) { ctx.beginPath(); ctx.moveTo(lx - 8, ay + 6); ctx.lineTo(lx + 8, ay + 6); ctx.lineTo(lx, ay - 6); ctx.closePath(); ctx.fill(); }
    // stop line and "STOP HERE" by the window
    ctx.fillStyle = '#fff'; ctx.fillRect(lx - 17, D.stopLine, 34, 5);
    ctx.font = r.font(8); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('STOP', lx, W.y - 6); ctx.fillText('HERE', lx, W.y + 6);
    // window frame straddling the wall, glass inside
    ctx.fillStyle = '#2d3a4a'; U.roundRect(ctx, W.x - 12, W.y - 22, 20, 44, 4); ctx.fill();
    const glass = ctx.createLinearGradient(0, W.y - 18, 0, W.y + 18);
    glass.addColorStop(0, '#9fe0ff'); glass.addColorStop(0.5, '#d9f3ff'); glass.addColorStop(1, '#8fd4ff');
    ctx.fillStyle = glass; U.roundRect(ctx, W.x - 9, W.y - 18, 12, 36, 3); ctx.fill();
    // serving shelf on the road side of the frame
    ctx.fillStyle = '#8a5527'; ctx.fillRect(W.x + 4, W.y - 14, 4, 28);
    // striped awning jutting out over the sidewalk (cars stop just past its edge)
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(W.x + 9, W.y - 26, 3, 54);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#ff8fab'; ctx.fillRect(W.x + 10, W.y - 27 + i * 9, 10, 9); }
    // menu board: three cones under a "MENU" header; the served counter is drawn dynamically below
    const B = D.board;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; U.roundRect(ctx, B.x - 18, B.y - 24, 40, 54, 4); ctx.fill();
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, B.x - 20, B.y - 26, 40, 54, 4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(7); ctx.fillText('MENU', B.x, B.y - 18);
    for (let i = 0; i < 3; i++) this.drawCone(ctx, B.x - 11 + i * 11, B.y - 2, D.flavors[i], 0.75);
    // the sign, hung on the wall between the board and the awning
    const S = D.sign;
    ctx.fillStyle = '#2b1d14'; U.roundRect(ctx, S.x - 44, S.y - 9, 88, 18, 5); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.font = r.font(10); ctx.fillText('DRIVE-THRU 🍦', S.x, S.y + 1);
  },

  // the served counter on the menu board (changes, so it is drawn each frame under the people)
  dynamic(r, g) {
    if (g.area !== 'town' || !this.owned(g)) return;
    const ctx = r.ctx, B = CFG.IC_DRIVE.board, n = this.st(g).served;
    ctx.fillStyle = '#fff'; ctx.font = r.font(7); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`🍦 ${U.fmt(n)} served`, B.x, B.y + 20);
  },

  entities(r, g, items) {
    if (g.area !== 'town' || !this.owned(g)) return;
    const ctx = r.ctx, D = CFG.IC_DRIVE;
    for (const c of this.cars) {
      items.push({ y: c.y + 10, draw: () => {
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.angle); r.drawVehicle(c.kind, g, c.color); ctx.restore();
        if (c.state === 'waiting' && !c.paid) {
          r.drawBubble(c.x + 34, c.y - 24, () => { ctx.font = r.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2b1d14'; ctx.fillText('🍦', 0, 0); }, 30);
        }
        // the passenger holds the cone out of the window for a moment after being served
        if (c.coneT > 0) {
          const k = Math.min(1, (D.coneHold - c.coneT) * 4), lift = 10 * U.easeOut(k);
          const side = Math.abs(c.angle + Math.PI / 2) < 0.8 ? -1 : 0;   // out of the shop-side window while still heading north
          this.drawCone(ctx, c.x + 20 * side, c.y - 6 - lift - (side ? 0 : 14), c.flavor, 1);
        }
      } });
    }
    // the cone sliding from the window to the first car, drawn above everything on the road
    if (this.cone) {
      const cn = this.cone, k = U.easeOut(Math.min(1, cn.t / cn.dur));
      const x = U.lerp(cn.x, cn.x1, k), y = U.lerp(cn.y, cn.y1, k) - Math.sin(k * Math.PI) * 10;
      items.push({ y: cn.y1 + 40, draw: () => this.drawCone(ctx, x, y, cn.flavor, 1) });
    }
  },
};
Game.ext.push(IceCreamDriveThruExt);
Render.ext.push(IceCreamDriveThruExt);
