'use strict';
// Helpers for the cases. `t.ev(fn, arg)` runs code inside the page where the game's globals live
// (CFG, Game, Render, UI, Input, the extensions). After `t.boot()` the page also has `window.T` with:
//   T.step(n)            advance the simulation n fixed steps (1/60 s each) without waiting
//   T.steer(x, y)        hold the joystick (-1..1); T.unsteer() releases it
//   T.until(fn, max)     step until fn() is true (max steps, default 1200); returns steps taken, or -1 if it gave up
//   T.tp(x, y, area)     put the player somewhere (optionally in another map), reset riding/driving
//   T.label()            the big action button's label; T.act() presses it
//   T.hint()             the current hint text
// Rides between maps are shortened to 1.5 s so travel checks stay fast.
const path = require('path');

const PAGE_HELPERS = () => {
  const T = {
    axis0: Input.axis,
    step(n) { for (let i = 0; i < n; i++) Game.update(1 / 60); },
    steer(x, y) { Input.axis = () => ({ x, y }); },
    unsteer() { Input.axis = T.axis0; },
    until(fn, max = 1200) { for (let i = 0; i < max; i++) { if (fn()) return i; Game.update(1 / 60); } return fn() ? max : -1; },
    tp(x, y, area) {
      if (area && Game.area !== area) Game.area = area;
      if (Game.driving) Game.exitCar();
      Game.onTrain = false; Game.ride = null; Game.fishing = null; Game.travel = null;
      Game.player.x = x; Game.player.y = y; Game.player.moving = false; Game.player.hasMoved = true; Game.cameraSnap = true;
      T.step(1);
    },
    label() { return Game.actionLabel(); },
    act() { Game.doAction(); T.step(1); },
    hint() { return Game.hint && Game.hint.text; },
    toasts: [],
  };
  const origStart = Game.startTravel.bind(Game);
  Game.startTravel = (to, via, dur) => origStart(to, via, Math.min(dur || 1.5, 1.5));
  const origOnToast = Game.onToast;
  Game.onToast = (m) => { T.toasts.push(m); if (origOnToast) origOnToast(m); };
  document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  if (UI.open) UI.open = null;
  Game.dog.x = -9999; Game.dog.y = -9999;   // keep the dog from wandering into checks
  window.T = T;
};

function makeT(page, { baseUrl, outDir, name }) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const t = {
    page, errors, checks: 0,
    // boot() starts from a clean save unless { fresh: false }; reload() keeps whatever is saved
    async boot(opts = {}) {
      if (opts.viewport) await page.setViewportSize(opts.viewport);
      if (!t._init) { t._init = true; await page.addInitScript(() => { if (location.search.includes('fresh=1')) { try { localStorage.clear(); } catch (e) { /* ignore */ } } }); }
      await page.goto(baseUrl + '?t=' + Date.now() + (opts.fresh === false ? '' : '&fresh=1'));
      await page.waitForFunction(() => typeof Game !== 'undefined' && Game.player && typeof Render !== 'undefined' && Render.bgs, null, { timeout: 15000 });
      await page.waitForTimeout(400);
      await page.evaluate(PAGE_HELPERS);
    },
    async reload() { await page.goto(baseUrl + '?t=' + Date.now()); await page.waitForFunction(() => typeof Game !== 'undefined' && Game.player && Render.bgs, null, { timeout: 15000 }); await page.waitForTimeout(400); await page.evaluate(PAGE_HELPERS); },
    ev(fn, arg) { return page.evaluate(fn, arg); },
    async wait(ms) { await page.waitForTimeout(ms); },
    async shot(label) { await page.waitForTimeout(250); await page.screenshot({ path: path.join(outDir, `${name}-${label}.png`) }); },
    expect(cond, msg) { t.checks++; if (!cond) throw new Error('expected ' + msg); },
    expectEq(a, b, msg) { t.checks++; if (a !== b) throw new Error(`${msg}: got ${JSON.stringify(a)}, wanted ${JSON.stringify(b)}`); },
    assertNoPageErrors() { if (errors.length) throw new Error('page errors:\n' + errors.join('\n')); },
  };
  return t;
}

module.exports = { makeT };
