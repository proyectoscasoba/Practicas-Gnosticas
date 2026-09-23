const CACHE_NAME = "practicas-gnosticas-v9";
const APP_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/audio/Asistencia de la Monada Divina.MP3",
  "/audio/Culto a la Madre.MP3",
  "/audio/El Divino Daimon y el Ego.MP3",
  "/audio/El Estado Emocional y el Yo.MP3",
  "/audio/El Quinto Elemento.MP3",
  "/audio/El Valor Exacto del Silencio.MP3",
  "/audio/Huesped en el Corazon de Dios.MP3",
  "/audio/Inspiracion Individual.MP3",
  "/audio/Integracion con Dios.MP3",
  "/audio/Integracion Natural.MP3",
  "/audio/Integracion con Dios.MP3",
  "/audio/La Comprension del YO Psi.MP3",
  "/audio/La Recurrencia.MP3",
  "/audio/Matrimonios.MP3",
  "/audio/Meditacion co el Padre Nuestro.MP3",
  "/audio/Meditar en el Padre Nuestro.MP3",
  "/audio/Mi Corazon los Distinque.MP3",
  "/audio/Nada es Regalado.MP3",
  "/audio/Oracion a la Divina Madre.MP3",
  "/audio/Oracion de Curacion.MP3",
  "/audio/Practica Especial de Año Nuevo.MP3",
  "/audio/Regreso al Padre Interno.MP3",
  "/audio/Trabajo Especial con el Cristo Lucifer.MP3",
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
