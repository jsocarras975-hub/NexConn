/* N3xUs Konc3pt'z service worker — app shell + offline fallback.
 *
 * Strategies:
 * - Navigations: network-first. A fresh PUBLIC page is cached on success;
 *   when the network fails, the cached page is served, and if there is none,
 *   the offline page (/offline) is served instead. Signed-in pages are never
 *   cached (see PRIVATE_PREFIXES), and any response with Cache-Control
 *   no-store/private is never cached either.
 * - Static assets (/_next/static, /icons, manifest, images, fonts, css, js):
 *   cache-first with a background refresh, so repeat visits are instant and
 *   updates still land.
 * - /api/* and all cross-origin requests (Turnstile, etc.): never touched.
 *   API calls are always live, so the app can never show stale orders,
 *   invoices, or auth state.
 *
 * Bump CACHE_VERSION whenever the offline page or the precache list changes.
 * Old caches are deleted on activate.
 */

const CACHE_VERSION = "nexcon-pwa-v2";
const STATIC_CACHE = `nexcon-static-${CACHE_VERSION}`;
const PAGE_CACHE = `nexcon-pages-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// Pages that must never be cached: signed-in areas and URLs that carry
// tokens. A cached /admin or /portal page — or a /reset-password link with a
// token in it — would stay readable offline on a shared device.
const PRIVATE_PREFIXES = [
  "/admin",
  "/portal",
  "/owner",
  "/reset-password",
  "/verify-email",
  "/forgot-password",
];

function isPrivatePath(pathname: string) {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isCacheableResponse(response: Response) {
  const control = response.headers.get("cache-control") || "";
  return !/no-store|private/.test(control);
}

const PRECACHE_URLS = [
  "/",
  "/offline",
  "/marketplace",
  "/lab",
  "/about",
  "/services",
  "/work",
  "/contact",
  "/login",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => {
              /* Installing while offline: that page just isn't cached yet. */
            }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("nexcon-") &&
                key !== STATIC_CACHE &&
                key !== PAGE_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// The app posts { type: "SKIP_WAITING" } when the user accepts an update.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  // The app posts { type: "CLEAR_PAGE_CACHE" } on sign-out, so cached pages
  // from a signed-in session do not linger on a shared device. Re-precache
  // the public pages so offline browsing still works.
  if (event.data && event.data.type === "CLEAR_PAGE_CACHE") {
    event.waitUntil(
      caches
        .delete(PAGE_CACHE)
        .then(() => caches.open(PAGE_CACHE))
        .then((cache) =>
          Promise.all(
            PRECACHE_URLS.map((url) =>
              cache.add(url).catch(() => {
                /* Offline during logout: that page just isn't cached yet. */
              }),
            ),
          ),
        ),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Third-party requests (Turnstile, etc.) pass through untouched.
  if (url.origin !== self.location.origin) return;
  // API calls are always live and never cached.
  if (url.pathname.startsWith("/api/")) return;

  // Page navigations: network-first, cached page, then the offline page.
  // Only public pages are cached, and only when the response allows it.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && !isPrivatePath(url.pathname) && isCacheableResponse(response)) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          return offline || Response.error();
        }),
    );
    return;
  }

  // Static assets: serve from cache, refresh in the background.
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/icon.svg" ||
    /\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$/.test(url.pathname);
  if (!isStatic) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});
