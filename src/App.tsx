/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ScreenRoute } from './types.ts';
import { Header } from './components/Header.tsx';
import { BottomGNB } from './components/BottomGNB.tsx';
import { HomeView } from './views/HomeView.tsx';
import { FramesView } from './views/FramesView.tsx';
import { FrameDetailView } from './views/FrameDetailView.tsx';
import { AiFrameView } from './views/AiFrameView.tsx';
import { ShootView } from './views/ShootView.tsx';
import { ResultView } from './views/ResultView.tsx';
import { DecorateView } from './views/DecorateView.tsx';
import { MyPhotosView } from './views/MyPhotosView.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';

import { EditState } from './types.ts';
import { FrameData, FRAMES, DEFAULT_FRAME } from './data/frames.ts';
import { getAllCustomFrames } from './data/frameDB.ts';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>('home');
  const [customFrames, setCustomFrames] = useState<FrameData[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<FrameData>(DEFAULT_FRAME);
  const [shots, setShots] = useState<import('./types.ts').ShotItem[]>([]);
  const [edit, setEdit] = useState<EditState>({ filterAll: 'none', filters: [null, null, null, null], decos: [] });
  const [isShootingActive, setIsShootingActive] = useState<boolean>(false);

  // 화면 방문 히스토리 스택 추적 ('<' 버튼 클릭 시 이전 화면으로 정확히 복귀)
  const historyStackRef = useRef<string[]>(['home']);
  const isBackNavigatingRef = useRef<boolean>(false);

  // IndexedDB 커스텀 프레임 불러오기
  useEffect(() => {
    getAllCustomFrames().then((list) => {
      setCustomFrames(list);
    });
  }, []);

  const allFrames = [...FRAMES, ...customFrames];

  // Parse window.location.hash for routing and query parameters
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace(/^#\/?/, '') || 'home';
      const [path, queryString] = rawHash.split('?');
      const params = new URLSearchParams(queryString || '');

      let normalizedPath = path;
      if (path === 'result/decorate' || path === 'decorate') {
        normalizedPath = 'decorate';
      }

      const validRoutes: ScreenRoute[] = [
        'home',
        'frames',
        'frame-detail',
        'ai-frame',
        'shoot',
        'capture',
        'result',
        'decorate',
        'my-photos',
      ];

      const targetRoute = validRoutes.includes(normalizedPath as ScreenRoute)
        ? (normalizedPath as ScreenRoute)
        : 'home';

      setCurrentRoute(targetRoute);

      // 방문 히스토리 스택 동기화
      if (isBackNavigatingRef.current) {
        isBackNavigatingRef.current = false;
      } else {
        const stack = historyStackRef.current;
        if (stack.length > 1 && stack[stack.length - 2] === targetRoute) {
          stack.pop();
        } else if (stack[stack.length - 1] !== targetRoute) {
          stack.push(targetRoute);
        }
      }

      const frameParam = params.get('id') || params.get('frame');
      if (frameParam) {
        const found = allFrames.find((f) => f.id === frameParam);
        if (found) {
          setSelectedFrame(found);
        }
      }

      // Scroll content to top on screen change
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // Initialize route on mount
    if (!window.location.hash) {
      window.location.hash = '#/home';
    } else {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [allFrames.length]);

  // Programmatic navigation helper
  const navigate = (route: ScreenRoute) => {
    window.location.hash = `#/${route}`;
  };

  // '<' 버튼 클릭 시 이전 화면으로 이동
  const handleBack = () => {
    // 촬영 중이면 촬영 상태 해제
    if (isShootingActive) {
      setIsShootingActive(false);
    }

    const stack = historyStackRef.current;
    if (stack.length > 1) {
      stack.pop(); // 현재 화면 제거
      const prevRoute = stack[stack.length - 1];
      isBackNavigatingRef.current = true;
      window.location.hash = `#/${prevRoute}`;
      return;
    }

    // 히스토리 스택이 비어있는 경우 (직접 URL 접근 등) 논리적 이전 화면
    const fallbackMap: Record<ScreenRoute, string> = {
      decorate: 'result',
      result: 'capture',
      capture: 'home',
      shoot: 'home',
      'frame-detail': 'frames',
      'ai-frame': 'frames',
      frames: 'home',
      'my-photos': 'home',
      home: 'home',
    };

    const target = fallbackMap[currentRoute] || 'home';
    isBackNavigatingRef.current = true;
    window.location.hash = `#/${target}`;
  };

  return (
    <div className="min-h-screen w-full bg-[#1A181C] flex flex-col items-center justify-start sm:py-6">
      {/* Mobile-First Frame: 390px fixed container */}
      <div className="w-full max-w-[390px] min-h-screen sm:min-h-[844px] bg-[#FFF8F3] text-[#222222] shadow-2xl relative flex flex-col sm:rounded-[36px] sm:border-[8px] sm:border-[#2D2A30] overflow-hidden">
        {/* Top Status Notch indicator for mobile realism on desktop */}
        <div className="hidden sm:flex h-5 w-full bg-[#FFF8F3] items-center justify-center shrink-0">
          <div className="w-24 h-3.5 bg-[#2D2A30] rounded-b-xl" />
        </div>

        {/* 1. 상단 헤더 (높이 56px, 고정) */}
        <Header
          currentRoute={currentRoute}
          onNavigate={navigate}
          onBack={handleBack}
        />

        {/* 2. 콘텐츠 영역 (헤더와 GNB 사이에서 스크롤) */}
        <main className="flex-1 w-full overflow-y-auto no-scrollbar">
          {currentRoute === 'home' && (
            <HomeView
              selectedFrame={selectedFrame}
              onSelectFrame={(frame) => {
                setSelectedFrame(frame);
                window.location.hash = `#/frame-detail?id=${frame.id}`;
              }}
              onQuickShoot={() => {
                if (!selectedFrame) {
                  setSelectedFrame(DEFAULT_FRAME);
                }
                window.location.hash = '#/capture';
              }}
            />
          )}

          {currentRoute === 'frames' && (
            <FramesView
              customFrames={customFrames}
              onCustomFramesChange={setCustomFrames}
              onSelectFrame={(frame) => {
                setSelectedFrame(frame);
                window.location.hash = `#/frame-detail?id=${frame.id}`;
              }}
            />
          )}

          {currentRoute === 'frame-detail' && (
            <FrameDetailView
              frame={selectedFrame}
              onChooseFrame={(frame) => {
                setSelectedFrame(frame);
              }}
            />
          )}

          {currentRoute === 'ai-frame' && <AiFrameView />}

          {(currentRoute === 'shoot' || currentRoute === 'capture') && (
            <ShootView
              onCompleteShooting={(capturedShots) => {
                setShots(capturedShots);
              }}
              onShootingStateChange={setIsShootingActive}
            />
          )}

          {currentRoute === 'result' && (
            <ResultView
              shots={shots}
              allFrames={allFrames}
              currentFrame={selectedFrame}
              edit={edit}
              onEditChange={setEdit}
              onSelectFrame={(frame) => {
                setSelectedFrame(frame);
              }}
              onRetake={() => {
                setShots([]);
                setEdit({ filterAll: 'none', filters: [null, null, null, null], decos: [] });
                window.location.hash = '#/capture';
              }}
            />
          )}

          {currentRoute === 'decorate' && (
            <DecorateView
              shots={shots}
              currentFrame={selectedFrame}
              edit={edit}
              onEditChange={setEdit}
              onComplete={() => {
                window.location.hash = '#/result';
              }}
            />
          )}

          {currentRoute === 'my-photos' && <MyPhotosView />}
        </main>

        {/* 3. 하단 GNB 탭바 (높이 64px, 고정): 촬영 시작 시에만 숨김, 기본 상태에서는 항상 표시 */}
        <BottomGNB currentRoute={currentRoute} isShootingActive={isShootingActive} />

        {/* Bottom Home Indicator Bar on desktop frame */}
        <div className="hidden sm:flex h-4 w-full bg-[#FFF8F3] items-center justify-center shrink-0 pb-1">
          <div className="w-28 h-1 bg-[#222222]/20 rounded-full" />
        </div>

        {/* 최초 1회 온보딩 팝업 */}
        <OnboardingModal />
      </div>

      {/* Quick Screen Switcher Bar (Desktop convenience) */}
      <footer className="mt-4 px-4 py-2 hidden lg:flex items-center gap-1.5 bg-white/10 rounded-full backdrop-blur-md text-xs text-white/70">
        <span className="font-bold text-[#FF5C8A] mr-1">빠른 화면 이동:</span>
        {[
          { route: 'home', label: '1) 홈' },
          { route: 'frames', label: '2) 프레임' },
          { route: 'frame-detail', label: '3) 상세' },
          { route: 'ai-frame', label: '4) AI 프레임' },
          { route: 'capture', label: '5) 촬영' },
          { route: 'result', label: '6) 결과' },
          { route: 'decorate', label: '7) 꾸미기' },
          { route: 'my-photos', label: '8) 내 사진' },
        ].map((item) => (
          <a
            key={item.route}
            href={`#/${item.route}`}
            className={`px-2 py-1 rounded-md transition-colors ${
              currentRoute === item.route || (item.route === 'capture' && currentRoute === 'shoot')
                ? 'bg-[#FF5C8A] text-white font-bold'
                : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </a>
        ))}
      </footer>
    </div>
  );
}
