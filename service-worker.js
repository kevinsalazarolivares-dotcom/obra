/**
 * Service worker de la PWA estática (Ronda 5). Plantilla: scripts/construir-web.js la convierte
 * en web/service-worker.js, reemplazando el marcador de la config de Firebase (ver más abajo)
 * por el contenido de web/firebase-config.json — así, a diferencia de web/config.js (que solo
 * se crea una vez y nunca se vuelve a tocar), este archivo SÍ se regenera en cada build, para
 * que editar la config de Firebase y correr `npm run build:web` de nuevo alcance para que el
 * service worker la use.
 *
 *  - Cachea el "shell" (HTML/CSS/JS/íconos propios) para que la app abra sin Internet.
 *  - Estrategia "stale-while-revalidate": responde al toque con lo cacheado, y en paralelo
 *    busca la versión nueva para la próxima vez. Así nadie necesita acordarse de subir un
 *    número de versión cada vez que se reconstruye el sitio.
 *  - NUNCA intercepta llamadas a Apps Script (otro origen) ni nada que no sea GET: esas
 *    pasan directo a la red, tal cual, para no romper CORS ni cachear respuestas de la API.
 *  - Notificaciones push (Firebase Cloud Messaging, tarea #38): mismo service worker que el
 *    shell (no uno aparte, para no competir por el "scope"), inicializado con la config de
 *    Firebase horneada acá abajo en tiempo de build (un service worker no puede hacer un fetch
 *    "de arranque" garantizado antes de que el navegador ya necesite tener sus escuchadores de
 *    eventos listos, así que se hornea en vez de pedirla en tiempo real). Si Kevin no configuró
 *    Firebase todavía (sigue con los valores de ejemplo), esto simplemente no hace nada.
 */
const CACHE = 'obras-shell-v1';
const ARCHIVOS_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (evento) => {
  self.skipWaiting();
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS_SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return; // apiLlamar viaja por POST: nunca se cachea
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; // Apps Script (otro origen): directo a la red
  // config.js y firebase-config.json: siempre a la red, nunca cacheados. Son archivos chicos que
  // casi no se piden (arranque, y al activar notificaciones), y si Kevin edita la config real de
  // Firebase, no queremos que un valor viejo cacheado quede pisando al nuevo un buen rato.
  if (/\/(config\.js|firebase-config\.json)$/.test(url.pathname)) return;

  evento.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((cacheada) => {
        const enRed = fetch(req)
          .then((resp) => { if (resp && resp.ok) cache.put(req, resp.clone()); return resp; })
          .catch(() => cacheada);
        return cacheada || enRed;
      })
    )
  );
});

// ---------- Firebase Cloud Messaging (Ronda 5, tarea #38) ----------
const FIREBASE_CONFIG = {
  "_comentario": "Config web del proyecto Firebase (Ronda 5, tarea #38). Se pega acá tal cual la muestra Firebase (Configuración del proyecto → Tus apps → app web → Config) y no es secreta: Google la diseñó para vivir en el navegador de cualquiera. Después de editar este archivo hay que correr `npm run build:web` de nuevo (regenera web/service-worker.js con esta config adentro). Este archivo en sí NUNCA se pisa solo (igual que config.js): solo se crea la primera vez.",
  "apiKey": "PEGA_AQUI",
  "authDomain": "PEGA_AQUI",
  "projectId": "PEGA_AQUI",
  "messagingSenderId": "PEGA_AQUI",
  "appId": "PEGA_AQUI",
  "vapidKey": "PEGA_AQUI"
};

if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey.indexOf('PEGA_AQUI') !== 0) {
  try {
    importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
    firebase.initializeApp(FIREBASE_CONFIG);
    // Con esto Firebase engancha solo sus propios escuchadores de 'push' y 'notificationclick'
    // (SDK compat) y muestra la notificación del sistema cuando la app está cerrada o de fondo.
    firebase.messaging();
  } catch (e) {
    console.error('No se pudo inicializar Firebase Messaging en el service worker.', e);
  }
}
