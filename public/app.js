// 인생4컷 PWA 부트스트랩 및 서비스 워커 등록 스크립트

// 1. 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker 등록 성공:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker 등록 실패:', error);
      });
  });
}

// 2. 홈 화면 추가 프롬프트 이벤트 캐치 (Android)
window.addEventListener('beforeinstallprompt', (e) => {
  // 브라우저 기본 미니 정보 모음 방지 및 이벤트 보관
  window.deferredPWAInstallPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

// 3. 앱 설치 완료 이벤트
window.addEventListener('appinstalled', () => {
  console.log('[PWA] 인생4컷 앱 설치 완료');
  window.deferredPWAInstallPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});
