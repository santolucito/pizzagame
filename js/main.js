'use strict';
(function () {
  const canvas = document.getElementById('game');
  Render.init(canvas);
  Input.toScreen = (cx, cy) => Render.toScreen(cx, cy);
  Input.onZoom = (z) => Render.setZoom(z);
  Input.init(canvas);
  const loaded = Game.init();
  UI.init();
  Render.updateCamera(Game, true);

  const offline = loaded ? Game.computeOffline() : null;
  if (offline) {
    const mins = Math.round(offline.elapsed / 60);
    UI.message('Welcome back!', `<div>Your staff kept the ovens running for ${mins} min.</div><div class="big">+${U.money(offline.earned)}</div>`);
  } else if (!loaded) {
    UI.show('help');
  }

  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    dt = Math.min(dt, 0.1);
    // fixed-step simulation keeps interactions deterministic across frame rates
    acc += dt;
    while (acc >= STEP) { Game.update(STEP); acc -= STEP; }
    Render.draw(Game);
    UI.update(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Installable / offline: register the service worker when served over http(s).
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ }); });
  }

  const saveNow = () => Game.save();
  window.addEventListener('beforeunload', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
})();
