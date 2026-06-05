const CACHE_NAME = 'moms-bookshelf-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './assets/style.css',
  './assets/js/main.js',
  './assets/js/bookData.json',
  './assets/js/domRenderer.js',
  './manifest.webmanifest',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png',
  './pdfjs/web/viewer.html',
  './pdfjs/web/viewer.css',
  './pdfjs/web/viewer.mjs',
  './pdfjs/build/pdf.mjs',
  './pdfjs/build/pdf.worker.mjs'
];

// 설치 시 정적 자산 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 새로운 서비스 워커 활성화 시 오래된 캐시 제거
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 우선 순위 전략 (PDF 및 JSON 데이터용) + 정적 자산은 캐시 우선
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // PDF 및 JSON 파일의 경우 네트워크에서 먼저 가져오고 캐시 업데이트 (네트워크 우선)
  if (url.pathname.endsWith('.pdf') || url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open('dynamic-cache').then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // 일반 자산은 캐시 우선
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
