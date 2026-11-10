import React from 'react';
import { Home, LayoutGrid, Camera, Image } from 'lucide-react';
import { ScreenRoute } from '../types.ts';

interface BottomGNBProps {
  currentRoute: ScreenRoute;
  isShootingActive?: boolean;
}

export const BottomGNB: React.FC<BottomGNBProps> = ({ currentRoute, isShootingActive }) => {
  // Rule: 촬영 시작 시(카운트다운 및 연속 4컷 촬영 중)에만 하단 GNB 숨김. 기본 상태에서는 항상 표시
  if (isShootingActive || currentRoute === 'decorate') {
    return null;
  }

  const tabs: Array<{
    route: ScreenRoute;
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
  }> = [
    {
      route: 'home',
      href: '#/home',
      label: '홈',
      icon: Home,
      isActive: currentRoute === 'home',
    },
    {
      route: 'frames',
      href: '#/frames',
      label: '프레임',
      icon: LayoutGrid,
      isActive: currentRoute === 'frames' || currentRoute === 'frame-detail' || currentRoute === 'ai-frame',
    },
    {
      route: 'capture',
      href: '#/capture',
      label: '촬영',
      icon: Camera,
      isActive: currentRoute === 'capture' || currentRoute === 'shoot',
    },
    {
      route: 'my-photos',
      href: '#/my-photos',
      label: '내 사진',
      icon: Image,
      isActive: currentRoute === 'my-photos' || currentRoute === 'result',
    },
  ];

  return (
    <nav
      className="sticky bottom-0 z-30 h-[64px] w-full bg-[#FFF8F3]/95 backdrop-blur-md border-t border-[#222222]/8 px-3 grid grid-cols-4 items-center shadow-lg shadow-black/5"
      aria-label="하단 네비게이션"
    >
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isShootTab = tab.route === 'capture' || tab.route === 'shoot';

        return (
          <a
            key={tab.route}
            href={tab.href}
            className={`flex flex-col items-center justify-center h-full min-w-[44px] transition-all group ${
              tab.isActive ? 'text-[#FF5C8A]' : 'text-[#222222]/50 hover:text-[#222222]/80'
            }`}
          >
            {isShootTab ? (
              // Distinctive center-styled shoot button affordance
              <div className="relative -mt-3 flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-[#FF5C8A] text-white flex items-center justify-center shadow-md shadow-[#FF5C8A]/40 group-active:scale-95 transition-transform">
                  <Camera className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold mt-0.5 text-[#222222]">
                  {tab.label}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-1">
                <div className="relative">
                  <IconComponent className={`w-5 h-5 transition-transform ${tab.isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {tab.isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF5C8A] rounded-full" />
                  )}
                </div>
                <span className={`text-[11px] mt-1 transition-colors ${tab.isActive ? 'font-bold text-[#FF5C8A]' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </div>
            )}
          </a>
        );
      })}
    </nav>
  );
};
