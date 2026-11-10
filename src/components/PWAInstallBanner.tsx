import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'life4cut_pwa_dismiss_until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // 1. 이미 PWA 스탠드얼론 모드로 실행 중인지 확인
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. 7일간 숨김 설정 확인
    try {
      const dismissUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissUntil && Date.now() < parseInt(dismissUntil, 10)) {
        return;
      }
    } catch {
      // localStorage 접근 불가 무시
    }

    // 3. iOS 기기 감지
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // 4. Android / Chrome beforeinstallprompt 이벤트 리스너
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS Safari의 경우 안내 배너 바로 표시
    if (isIOSDevice) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // 닫기 클릭 시 7일간 숨김 저장
  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + SEVEN_DAYS_MS));
    } catch {
      // 무시
    }
  };

  // Android 설치 프롬프트 실행
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('설치 프롬프트 오류:', err);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mx-4 mb-2 p-3 bg-gradient-to-r from-[#222222] to-[#2E2830] text-white rounded-[16px] border border-[#FF5C8A]/30 shadow-md relative animate-in fade-in slide-in-from-top-2 duration-200">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        aria-label="닫기"
        title="7일간 보지 않기"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        {/* 앱 아이콘 썸네일 */}
        <div className="w-10 h-10 rounded-xl bg-[#FF5C8A] flex items-center justify-center shrink-0 shadow-sm shadow-[#FF5C8A]/30">
          <div className="grid grid-cols-2 gap-0.5 p-1">
            <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>인생4컷 앱으로 사용하기</span>
            <span className="text-[9px] bg-[#FF5C8A] text-white px-1.5 py-0.2 rounded-full font-semibold">
              PWA
            </span>
          </h4>

          {isIOS ? (
            /* iOS Safari 안내 */
            <p className="text-[11px] text-white/70 mt-1 leading-snug">
              Safari 하단 <Share className="w-3 h-3 inline text-[#FF5C8A] mx-0.5" /> 버튼을 누른 후 <strong className="text-white">'홈 화면에 추가'</strong>를 탭하세요.
            </p>
          ) : (
            /* Android / Desktop 안내 */
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-[11px] text-white/70 leading-snug">
                홈 화면에 추가하면 오프라인에서도 앱처럼 바로 켤 수 있어요!
              </p>
              {deferredPrompt && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 rounded-lg bg-[#FF5C8A] hover:bg-[#E84575] active:scale-95 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs transition-all"
                >
                  <Download className="w-3 h-3 stroke-[2.5]" />
                  <span>추가</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
