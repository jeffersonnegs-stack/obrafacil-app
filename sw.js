// ============================================================
// ObraFácil — sw.js (Service Worker)
// Correções aplicadas:
//   ✅ CACHE_NAME com versão — atualiza automaticamente
//   ✅ Estratégia network-first para HTML (sempre atualizado)
//   ✅ Cache-first para assets estáticos (CSS, JS, fontes)
//   ✅ Bypass total para chamadas ao backend
//   ✅ Página offline amigável
//   ✅ Limpeza de caches antigos na ativação
// ============================================================

// ⚠️ IMPORTANTE: mude esta versão a cada deploy para forçar atualização
const CACHE_VERSION = '2026-05-07-v1';
const CACHE_STATIC  = 'of-static-'  + CACHE_VERSION;
const CACHE_PAGES   = 'of-pages-'   + CACHE_VERSION;

// Arquivos que ficam em cache permanente (assets estáticos)
const ASSETS_ESTATICOS = [
  'css/app.css',
  'js/config.js',
  'js/api.js',
  'js/auth.js',
  'js/ui.js',
  'js/app.js',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'offline.html',
];

// Páginas principais (network-first)
const PAGINAS = [
  './',
  'index.html',
  'manifest.json',
];

// ── Instalação ────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_STATIC).then(cache => cache.addAll(ASSETS_ESTATICOS).catch(e => {
        console.warn('[SW] Erro ao cachear assets:', e);
      })),
      caches.open(CACHE_PAGES).then(cache => cache.addAll(PAGINAS).catch(e => {
        console.warn('[SW] Erro ao cachear páginas:', e);
      })),
    ])
  );
  // Assume controle imediatamente sem esperar reload
  self.skipWaiting();
});

// ── Ativação — limpa caches antigos ──────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_PAGES)
          .map(k => {
            console.log('[SW] Removendo cache antigo:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch — estratégias por tipo de recurso ───────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Chamadas ao backend — NUNCA usar cache
  if (url.hostname.includes('script.google.com')) {
    return; // Deixa passar direto para a rede
  }

  // 2. Fontes Google — cache-first (raramente mudam)
  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(event.request, CACHE_STATIC));
    return;
  }

  // 3. Assets estáticos (CSS, JS, imagens) — cache-first
  if (
    url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff2?)$/)
  ) {
    event.respondWith(cacheFirst(event.request, CACHE_STATIC));
    return;
  }

  // 4. Páginas HTML — network-first (sempre frescas)
  if (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/'
  ) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // 5. Qualquer outra coisa — network com fallback para cache
  event.respondWith(networkFirst(event.request));
});

// ── Estratégia: Cache primeiro ────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return new Response('Recurso não disponível offline.', { status: 503 });
  }
}

// ── Estratégia: Network primeiro ─────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_PAGES);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    // Sem rede — tenta o cache
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback para página offline
    const offline = await caches.match('offline.html');
    return offline || new Response(
      '<h1>Sem conexão</h1><p>Verifique sua internet e tente novamente.</p>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
