// Offline cache so the list works on patchy camp Wi-Fi. Network-first, cache fallback.
// Only successful responses are cached; error pages never replace the working copy.
const C = "campshots-v3";
const FILES = ["./", "index.html", "manifest.json", "icon.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  const fromCache = () => caches.match(e.request, { ignoreSearch: true })
    .then(r => r || (e.request.mode === "navigate" ? caches.match("index.html") : undefined));
  e.respondWith(
    fetch(e.request).then(r => {
      if (!r.ok) return fromCache().then(c => c || r);
      const copy = r.clone();
      e.waitUntil(caches.open(C).then(c => c.put(e.request, copy)));
      return r;
    }).catch(() => fromCache().then(c => c || Response.error()))
  );
});
