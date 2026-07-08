const CACHE_NAME = "sierra-coaching-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/src/main.jsx",
  "/src/index.css",
  "/coach.png",
  "/logo-192.png",
  "/logo-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
