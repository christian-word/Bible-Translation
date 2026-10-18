// Офлайн-кэш читалки. Увеличьте номер версии, если обновили файлы данных.
const V = 'bible-v1.1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if(r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const u = new URL(r.url);
  const isBook = /\/data\/(?!index|mapping)[^/]+\/[^/]+\.json$/.test(u.pathname);
  if(isBook){            // тексты книг не меняются: сначала кэш
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
      if(res.ok){ const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    })));
  }else{                 // страница, оглавление и таблица сдвигов: сначала сеть, без сети — кэш
    e.respondWith(fetch(r).then(res => {
      if(res.ok){ const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r)));
  }
});
