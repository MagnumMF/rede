/* =====================================================================
   SERVICE WORKER — Rede de Proteção
   Faz cache do "shell" do app (HTML, CSS, JS, ícones, fontes) para que
   ele abra rápido e funcione offline. Os DADOS (catálogo) vêm sempre da
   rede (jsonblob) com fallback para o último cache quando estiver offline.

   IMPORTANTE: ao publicar uma nova versão dos arquivos, troque o número
   em CACHE_VERSION abaixo para forçar a atualização nos aparelhos.
   ===================================================================== */
var CACHE_VERSION = "rede-protecao-v2";

/* Arquivos do shell (sempre disponíveis offline). */
var SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./config.js",
  "./store.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (c) {
      // addAll falha tudo se um item falhar; usamos add individual tolerante.
      return Promise.all(SHELL.map(function (u) {
        return c.add(u).catch(function () {});
      }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);

  /* Dados do jsonblob: rede primeiro, cache como reserva (offline). */
  if (url.hostname.indexOf("jsonblob.com") !== -1) {
    e.respondWith(
      fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
        return resp;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  /* QR Code / imagens externas: cache primeiro, depois rede. */
  if (url.hostname.indexOf("qrserver.com") !== -1) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (resp) {
          var copy = resp.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
          return resp;
        }).catch(function () { return hit; });
      })
    );
    return;
  }

  /* Shell e demais GETs: cache primeiro, rede como reserva. */
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === "basic") {
          var copy = resp.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
        }
        return resp;
      }).catch(function () {
        // Última reserva: para navegação, devolve a página inicial cacheada.
        if (req.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
