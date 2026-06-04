// public/sw.js

const CACHE_NAME = "praktika-v1";

const STATIC_ASSETS = [
  "/",
  "/stats",
  "/settings",
];

// ─── Установка ─────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── Активация — чистим старые кэши ───────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch — стратегия Network First ──────────────────────────────────────

self.addEventListener("fetch", (event) => {
  // Пропускаем не-GET запросы
  if (event.request.method !== "GET") return;

  // Пропускаем запросы к API и внешним ресурсам
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Кэшируем успешные ответы
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback на кэш если нет сети
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Для навигационных запросов возвращаем главную
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Нет соединения", { status: 503 });
        });
      })
  );
});