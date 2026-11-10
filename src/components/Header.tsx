import React from 'react';
import { ChevronLeft, Sparkles, Share2, Info, Camera, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
import { ScreenRoute } from '../types.ts';

interface HeaderProps {
  currentRoute: ScreenRoute;
  onNavigate: (route: ScreenRoute) => void;
  onBack: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, onBack, title }) => {
  const isHome = currentRoute === 'home';

  // Subpage title fallback mapping
  const getTitle = () => {
    if (title) return title;
    switch (currentRoute) {
      case 'frames':
        return '프레임 선택';
      case 'frame-detail':
        return '프레임 상세';
      case 'ai-frame':
        return 'AI 프레임 만들기';
      case 'shoot':
      case 'capture':
        return '네컷 촬영';
      case 'result':
        return '완성된 네컷';
      case 'decorate':
        return '꾸미기';
      case 'my-photos':
        return '내 사진';
      default:
        return '';
    }
  };

  // Right icon slot based on current route
  const renderRightSlot = () => {
    switch (currentRoute) {
      case 'home':
        return (
          <a
            href="#/ai-frame"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#FF5C8A] hover:bg-[#FF5C8A]/10 active:scale-95 transition-all"
            aria-label="AI 프레임 만들기"
            title="AI 프레임 만들기"
          >
            <Sparkles className="w-5 h-5" />
          </a>
        );
      case 'frames':
        return (
          <a
            href="#/ai-frame"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#FF5C8A] hover:bg-[#FF5C8A]/10 active:scale-95 transition-all"
            aria-label="AI 프레임 제작"
            title="AI 프레임 제작"
          >
            <Sparkles className="w-5 h-5" />
          </a>
        );
      case 'frame-detail':
        return (
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).catch(() => {});
              }
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#222222]/70 hover:text-[#222222] hover:bg-black/5 active:scale-95 transition-all"
            aria-label="공유하기"
            title="링크 복사"
          >
            <Share2 className="w-5 h-5" />
          </button>
        );
      case 'shoot':
      case 'capture':
        return (
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#222222]/70 hover:text-[#222222] hover:bg-black/5 active:scale-95 transition-all"
            aria-label="촬영 안내"
            title="밝은 조명과 4:3 뷰파인더에 맞춰 촬영해보세요"
          >
            <Info className="w-5 h-5" />
          </button>
        );
      case 'result':
        return (
          <a
            href="#/my-photos"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#FF5C8A] hover:bg-[#FF5C8A]/10 active:scale-95 transition-all"
            aria-label="사진첩 보기"
            title="사진첩 보기"
          >
            <Share2 className="w-5 h-5" />
          </a>
        );
      case 'decorate':
        return (
          <a
            href="#/result"
            className="h-8 px-3.5 rounded-full bg-[#FF5C8A] hover:bg-[#E84575] text-white text-xs font-bold flex items-center justify-center shadow-xs active:scale-95 transition-all"
          >
            완료
          </a>
        );
      case 'my-photos':
        return (
          <a
            href="#/capture"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#FF5C8A] hover:bg-[#FF5C8A]/10 active:scale-95 transition-all"
            aria-label="새 촬영"
          >
            <Camera className="w-5 h-5" />
          </a>
        );
      default:
        return <div className="w-10 h-10" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-[56px] w-full bg-[#FFF8F3]/95 backdrop-blur-md border-b border-[#222222]/8 px-4 flex items-center justify-between transition-colors">
      {isHome ? (
        /* Home: Brand Logo */
        <a href="#/home" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-[#FF5C8A] flex items-center justify-center text-white shadow-sm shadow-[#FF5C8A]/30">
            {/* 4-cut mini grid icon */}
            <div className="grid grid-cols-2 gap-0.5 p-1">
              <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-xs"></div>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black tracking-tight text-[#222222]">
              인생<span className="text-[#FF5C8A]">4</span>컷
            </span>
            <span className="text-[10px] font-bold text-[#FF5C8A] tracking-widest uppercase">STUDIO</span>
          </div>
        </a>
      ) : (
        /* Sub-screen: Back Button + Title */
        <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-[#222222] hover:bg-black/5 active:scale-90 transition-all shrink-0"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-[17px] font-bold text-[#222222] truncate tracking-tight">
            {getTitle()}
          </h1>
        </div>
      )}

      {/* Right Slot: exactly 1 action/icon */}
      <div className="shrink-0 flex items-center justify-end">
        {renderRightSlot()}
      </div>
    </header>
  );
};
