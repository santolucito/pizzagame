'use strict';
// Stuck detector: drop the chef on a grid of walkable spots in every map and make sure they can walk away
// in at least one direction, and never get flung far. Known rides (playground, cloud rides) are skipped.
module.exports = async (t) => {
  await t.boot();
  const report = await t.ev(() => {
    const out = {};
    const rects = {
      town: CFG.WORLD, site: CFG.SITE.WORLD, city: CFG.CITY.WORLD, islands: CFG.ISLANDS.WORLD, cloud: CFG.CLOUD.WORLD,
      cabin: CFG.SECRET.HOME.room, upstairs: CFG.UPSTAIRS.room,
    };
    const skip = (a, x, y) => {
      if (a === 'town') { const P = CFG.PLAYGROUND; if (x > P.x0 - 40 && x < P.x1 + 40 && y > P.y0 - 60 && y < P.y1 + 20) return true; }
      return false;
    };
    const hit = (x, y) => Game.obstacles().some((o) => Game.hitRect(x, y, 12, o));
    Game.s.cash = 0;
    for (const [area, R] of Object.entries(rects)) {
      const stuck = [], flung = []; let sampled = 0;
      Game.area = area;
      for (let y = R.y0 + 30; y < R.y1 - 30; y += 48) for (let x = R.x0 + 30; x < R.x1 - 30; x += 48) {
        if (skip(area, x, y)) continue;
        Game.player.x = x; Game.player.y = y; Game.player.hasMoved = true; Game.player.moving = false; Game.onTrain = false; Game.ride = null; Game.fishing = null;
        if (Game.driving) Game.exitCar();
        if (AirfieldExt.rt) AirfieldExt.rt.ride = null;
        if (hit(x, y)) continue;
        sampled++;
        let best = 0, worst = 0;
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          Game.player.x = x; Game.player.y = y; Game.ride = null; if (AirfieldExt.rt) AirfieldExt.rt.ride = null;
          T.steer(ax, ay); T.step(9); T.unsteer();
          const d = Math.hypot(Game.player.x - x, Game.player.y - y);
          best = Math.max(best, d); worst = Math.max(worst, d);
        }
        if (Game.ride || (AirfieldExt.rt && AirfieldExt.rt.ride)) continue;   // stepped onto a ride: not a trap
        if (best < 2) stuck.push([x, y]);
        if (worst > 70) flung.push([x, y, Math.round(worst)]);
      }
      out[area] = { sampled, stuck, flung };
    }
    Game.area = 'town'; Game.player.x = 540; Game.player.y = 430; Game.cameraSnap = true;
    return out;
  });
  for (const [area, r] of Object.entries(report)) {
    t.expect(r.sampled > 20, `${area}: sampled enough walkable spots (${r.sampled})`);
    t.expect(r.stuck.length === 0, `${area}: no stuck spots, found ${r.stuck.length}: ${JSON.stringify(r.stuck.slice(0, 8))}`);
    t.expect(r.flung.length === 0, `${area}: no spots that fling the chef, found ${r.flung.length}: ${JSON.stringify(r.flung.slice(0, 8))}`);
  }
};
