
// 離線快取
const C = "kyoto-trip-v3";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== C)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  const url = new URL(r.url);

  if (r.method !== "GET" || url.origin !== location.origin) return;

  // 圖示一律直接向網路取得，不使用舊快取
  if (
    url.pathname.endsWith("/apple-touch-icon.png") ||
    url.pathname.endsWith("/favicon-32.png") ||
    url.pathname.endsWith("/icon-192.png") ||
    url.pathname.endsWith("/icon-512.png")
  ) {
    e.respondWith(
      fetch(r, { cache: "no-store" })
    );
    return;
  }

  // 其他網站資源：網路優先，離線時使用快取
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) {
        const cp = res.clone();
        caches.open(C).then(cache => cache.put(r, cp));
      }
      return res;
    }).catch(() =>
      caches.match(r, { ignoreSearch: true })
        .then(m => m || caches.match("./"))
    )
  );
});
