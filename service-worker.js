// ObraFácil — Service Worker v1.0
// Permite funcionamento offline básico e instalação como PWA

const CACHE_NAME = 'obrafacil-v1';

// Arquivos que ficam salvos no celular (funcionam sem internet)
const ARQUIVOS_CACHE = [
  '/',
  '/index.html',
  '/profissional.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instala e salva os arquivos no cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Salvando arquivos no cache...');
      return cache.addAll(ARQUIVOS_CACHE);
    })
  );
  self.skipWaiting();
});

// Limpa caches antigos quando atualiza
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estratégia: tenta buscar da internet primeiro, usa cache se offline
self.addEventListener('fetch', event => {
  // Requisições para o Apps Script (backend) nunca usam cache
  if (event.request.url.includes('script.google.com')) {
    return; // deixa passar normalmente
  }

  // Para os arquivos do app: tenta internet, cai no cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se buscou da internet com sucesso, atualiza o cache
        if (response && response.status === 200) {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
        }
        return response;
      })
      .catch(() => {
        // Sem internet: usa o cache
        return caches.match(event.request);
      })
  );
});
