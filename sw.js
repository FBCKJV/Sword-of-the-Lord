// Bump this on every deploy — it is the only thing that forces clients to
// fetch fresh files instead of serving the previous cache. Same pattern as
// the Hymns app: one version string, cache name derived from it, old caches
// swept on activate.
const VERSION = 'v9';
const CACHE_NAME = `sword-of-the-lord-${VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/main.js',
  './js/core/audio-context.js',
  './js/core/dom.js',
  './js/core/draw.js',
  './js/core/fx.js',
  './js/core/input.js',
  './js/core/loop.js',
  './js/core/round-plan.js',
  './js/core/spawn.js',
  './js/core/state.js',
  './js/core/update.js',
  './js/data/demons.js',
  './js/data/difficulty.js',
  './js/data/images.js',
  './js/data/verses.js',
  './js/firebase/config.js',
  './js/firebase/leaderboard.js',
  './js/ui/badges.js',
  './js/ui/mastery.js',
  './js/ui/music.js',
  './js/ui/screens.js',
  './js/ui/settings.js',
  './js/ui/sound.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon.ico',
  './assets/backgrounds/study.jpg',
  './assets/backgrounds/splash.jpg',
  './assets/demons/flameimp_laughing.jpg', './assets/demons/flameimp_struck.jpg',
  './assets/demons/hellhound_laughing.jpg', './assets/demons/hellhound_struck.jpg',
  './assets/demons/wraith_laughing.jpg', './assets/demons/wraith_struck.jpg',
  './assets/demons/boneguard_laughing.jpg', './assets/demons/boneguard_struck.jpg',
  './assets/demons/bladefiend_laughing.jpg', './assets/demons/bladefiend_struck.jpg',
  './assets/demons/shadowdervish_laughing.jpg', './assets/demons/shadowdervish_struck.jpg',
  './assets/demons/satan_laughing.jpg', './assets/demons/satan_struck.jpg',
  './assets/badges/first-strike.svg',
  './assets/badges/verse-keeper.svg',
  './assets/badges/giant-slayer.svg',
  './assets/badges/full-armor.svg',
  './assets/badges/watchman.svg',
  './assets/badges/sword-master.svg',
  './assets/badges/overcomer.svg',
  './assets/badges/steadfast.svg',
  './assets/badges/scribe.svg',
  './assets/badges/hidden-word.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Lets the page force this waiting worker to activate immediately
// (used by the "update available" banner in main.js).
self.addEventListener('message', event => {
  if(event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // let CDN/font/Firestore requests pass through untouched

  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if(cached) return cached;
      return fetch(req).then(res => {
        if(res.ok){
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
