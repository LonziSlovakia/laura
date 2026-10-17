/* Service worker: pamätá si knižnice, mapové dlaždice a fotky, takže ďalšie otvorenie je
   rýchle (a funguje to aj bez internetu). Stránka a data.js sa vždy najprv skúsia stiahnuť
   nanovo, takže nové spomienky sa ukážu hneď po nahratí.
   Ak zmeníš súbory vo vendor/, zvýš VERSION. */
const VERSION = "v1";
const CORE = `core-${VERSION}`;
const PAGES = "pages-v1";
const PHOTOS = "photos-v1";
const MAP = "map-v1";
const KEEP = [CORE, PAGES, PHOTOS, MAP];
const MAP_MAX = 2500; // max. počet uložených dlaždíc (~100 MB)
const MAP_AGE = 30 * 864e5; // dlaždice obnoviť po 30 dňoch

const PRECACHE = [
  "vendor/leaflet-1.9.4.js",
  "vendor/leaflet-1.9.4.css",
  "vendor/markercluster-1.5.3.js",
  "vendor/markercluster-1.5.3.css",
  "vendor/maplibre-gl-5.24.0.js",
  "vendor/maplibre-gl-5.24.0.css",
  "vendor/leaflet-maplibre-gl-0.1.3.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CORE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    if (url.pathname.includes("/vendor/")) return e.respondWith(cacheFirst(e, req, CORE));
    if (url.pathname.includes("/photos/")) return e.respondWith(cacheFirst(e, req, PHOTOS));
    return e.respondWith(networkFirst(req, PAGES, 3500));
  }
  if (url.hostname === "tiles.versatiles.org") return e.respondWith(cacheFirst(e, req, MAP, { maxAge: MAP_AGE, maxEntries: MAP_MAX }));
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") return e.respondWith(cacheFirst(e, req, CORE));
  // ostatné (vyhľadávanie miest, záložná mapa, knižnice editora) idú normálne cez internet
});

async function cacheFirst(e, req, name, { maxAge = 0, maxEntries = 0 } = {}) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit && (!maxAge || Date.now() - (+hit.headers.get("x-sw-at") || 0) < maxAge)) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) e.waitUntil(store(cache, req, res.clone(), maxEntries));
    return res;
  } catch (err) {
    if (hit) return hit;
    throw err;
  }
}

async function networkFirst(req, name, timeout) {
  const cache = await caches.open(name);
  const net = fetch(req, { cache: "no-cache" }).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  });
  net.catch(() => {});
  try {
    return await Promise.race([net, new Promise((_, no) => setTimeout(() => no(new Error("timeout")), timeout))]);
  } catch (err) {
    const hit = await cache.match(req);
    return hit || net;
  }
}

let puts = 0;
async function store(cache, req, res, maxEntries) {
  const headers = new Headers(res.headers);
  headers.set("x-sw-at", String(Date.now()));
  const body = await res.blob();
  await cache.put(req, new Response(body, { status: res.status, statusText: res.statusText, headers }));
  if (maxEntries && ++puts % 50 === 0) {
    const keys = await cache.keys();
    for (const k of keys.slice(0, Math.max(0, keys.length - maxEntries))) await cache.delete(k);
  }
}
