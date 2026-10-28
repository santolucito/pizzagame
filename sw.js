'use strict';
// Service worker: caches the app shell so the game installs to the home screen and loads offline.
// Network-first so a new deploy is picked up on the next load; cache is the fallback.
const CACHE = 'pizza-rush-v100';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/config.js', 'js/utils.js', 'js/audio.js', 'js/input.js',
  'js/entities.js', 'js/minigame.js', 'js/game.js', 'js/render.js', 'js/ui.js', 'js/city.js', 'js/islands.js', 'js/atmosphere.js', 'js/secret.js', 'js/balloons.js', 'js/icdrivethru.js', 'js/upstairs.js', 'js/airfield.js', 'js/subway.js', 'js/sportscar.js', 'js/city-barber.js', 'js/city-toys.js', 'js/city-petshop.js', 'js/city-bakery.js', 'js/city-hotel.js', 'js/bedroomscope.js', 'js/city-arcade.js', 'js/rooftops.js', 'js/barn.js', 'js/city-candy.js', 'js/city-books.js', 'js/city-catcafe.js', 'js/city-gym.js', 'js/city-flowers.js', 'js/city-music.js', 'js/city-cinema.js', 'js/city-post.js', 'js/city-grocery.js', 'js/city-school.js', 'js/city-bank.js', 'js/city-cafe.js', 'js/city-aquarium.js', 'js/city-firedept.js', 'js/firestation.js', 'js/sitetown.js', 'js/pizzarain.js', 'js/hotdog.js', 'js/hiredesk.js', 'js/pizzacoins.js', 'js/islands-inside.js', 'js/rocket.js', 'js/moon.js', 'js/main.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/barnard-seal.png'];

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
