// 인생4컷 Service Worker
// 앱 셸(HTML/CSS/JS/아이콘/폰트)만 캐시 우선, API 호출 및 이미지 생성 요청은 항상 네트워크 사용

const CACHE_NAME = 'life4cut-shell-v1';

// 사전 캐시할 앱 셸 에셋 목록
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './apple-touch-icon.png'
];

// 서비스 워커 설치 시 앱 셸 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch((err) => {
        console.warn('앱 셸 사전 캐싱 일부 실패:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 활성화 시 이전 버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 네트워크 요청 인터셉트
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API 호출, 이미지 생성, 동적 백엔드 요청은 캐시하지 않고 항상 네트워크로 통과
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/generate') ||
    url.searchParams.has('api') ||
    event.request.method !== 'GET'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. 앱 셸 에셋 (HTML, CSS, JS, 폰트, 이미지 등) 캐시 우선 전략
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // 유효한 응답인 경우 캐시에 저장 후 반환
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 오프라인 상태에서 페이지 탐색 시 캐시된 index.html 반환
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('/');
        }
      });
    })
  );
});
