// Naikkan versi (kg-v1 -> kg-v2) setiap kali Anda mengubah file agar cache lama diganti.
const V = 'kg-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'icons/logo.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network-first untuk file aplikasi sendiri; Firebase & domain lain tidak disentuh.
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => {
      const copy = res.clone();
      caches.open(V).then(c => c.put(r, copy));
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('index.html')))
  );
});
