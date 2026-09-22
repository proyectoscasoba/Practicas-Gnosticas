const CACHE_NAME = "practicas-gnosticas-v7";
const APP_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/audio/integracion-nivel-01.mp3",
  "/audio/integracion-nivel-02.mp3",
  "/audio/integracion-nivel-03.mp3",
  "/audio/integracion-nivel-04.mp3",
  "/audio/integracion-nivel-05.mp3",
  "/audio/integracion-nivel-06.mp3",
  "/audio/integracion-nivel-07.mp3",
  "/audio/integracion-nivel-08.mp3",
  "/audio/integracion-nivel-09.mp3",
  "/audio/integracion-nivel-10.mp3",
  "/audio/integracion-nivel-11.mp3",
  "/audio/integracion-nivel-12.mp3",
  "/audio/integracion-nivel-13.mp3",
  "/audio/WhatsApp Audio 2026-09-15 at 1.36.05 PM.mp3",
  "/audio/WhatsApp Audio 2026-09-15 at 1.39.45 PM.mp3",
  "/audio/integracion-nivel-17.mp3",
  "/audio/integracion-nivel-18.mp3",
  "/audio/integracion-nivel-19.mp3",
  "/audio/integracion-nivel-20.mp3",
  "/audio/meditar en el padre nuestro.mp3",
  "/audio/meditacion con el padre nuestro.mp3",
  "/audio/practica-especial-de-ano-nuevo.mp3",
  "/audio/trabajo-especial-con-el-cristo-lucifer.mp3",
];
const CACHEABLE_EXTERNAL_ORIGINS = [
  "https://www.gstatic.com",
  "https://cdn.tailwindcss.com",
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

const getRangeResponse = async (request) => {
  const cachedResponse = await caches.match(new Request(request.url));
  const response = cachedResponse || (await fetch(request));
  const rangeHeader = request.headers.get("range");

  if (!rangeHeader || !cachedResponse) return response;

  const rangeMatch = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!rangeMatch) return response;

  const body = await response.arrayBuffer();
  const totalLength = body.byteLength;
  const start = rangeMatch[1] ? Number(rangeMatch[1]) : 0;
  const requestedEnd = rangeMatch[2]
    ? Number(rangeMatch[2])
    : totalLength - 1;
  const end = Math.min(requestedEnd, totalLength - 1);

  if (start >= totalLength || start > end) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${totalLength}` },
    });
  }

  return new Response(body.slice(start, end + 1), {
    status: 206,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${totalLength}`,
      "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
    },
  });
};

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.headers.has("range")) {
    event.respondWith(getRangeResponse(event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
          return networkResponse;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        const requestOrigin = new URL(event.request.url).origin;
        if (
          networkResponse.ok &&
          (requestOrigin === self.location.origin ||
            CACHEABLE_EXTERNAL_ORIGINS.includes(requestOrigin))
        ) {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        }
        return networkResponse;
      });
    }),
  );
});
