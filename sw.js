'use strict';
// Service worker: caches the app shell so the game installs to the home screen and loads offline.
// Network-first so a new deploy is picked up on the next load; cache is the fallback.
const CACHE = 'pizza-rush-v52';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/config.js', 'js/utils.js', 'js/audio.js', 'js/input.js',
  'js/entities.js', 'js/minigame.js', 'js/game.js', 'js/render.js', 'js/ui.js', 'js/city.js', 'js/islands.js', 'js/atmosphere.js', 'js/secret.js', 'js/balloons.js', 'js/main.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
