/* sw.js — Service Worker: کش کامل برنامه برای کار آفلاین */
self.PRECACHE = {"version":"8277fa9e2017","files":["./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png"]};

const CACHE = "pcm-" + self.PRECACHE.version;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then(async (c) => {
        // "./" را به index.html تبدیل می‌کنیم؛ برخی میزبان‌ها آدرس ریشه را سرو نمی‌کنند
        const files = [...new Set(self.PRECACHE.files.map((f) => (f === "./" ? "./index.html" : f)))];
        await Promise.all(files.map(async (f) => {
          try {
            const res = await fetch(new Request(f, { cache: "reload" }));
            if (res.ok) await c.put(new Request(f), res);
            else if (f === "./index.html") throw new Error("index.html unavailable");
          } catch (e) { if (f === "./index.html") throw e; }
        }));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("pcm-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    let hit = await cache.match(req, { ignoreSearch: true });
    if (!hit && req.mode === "navigate") hit = await cache.match("./index.html");
    if (hit) return hit;
    if (req.mode === "navigate") {
      const shell = await cache.match("./index.html");
      if (shell) return shell;
    }
    try { return await fetch(req); }
    catch { return new Response("آفلاین", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }); }
  })());
});
