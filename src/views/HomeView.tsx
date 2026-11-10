import React, { useState } from 'react';
import { Camera, ArrowRight, Sparkles, Image as ImageIcon } from 'lucide-react';
import { FrameData, FRAMES, DEFAULT_FRAME } from '../data/frames.ts';
import { FrameThumbnailCanvas } from './FramesView.tsx';
import { PWAInstallBanner } from '../components/PWAInstallBanner.tsx';

interface HomeViewProps {
  selectedFrame?: FrameData;
  onSelectFrame: (frame: FrameData) => void;
  onQuickShoot: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  selectedFrame = DEFAULT_FRAME,
  onSelectFrame,
  onQuickShoot,
}) => {
  // Preview toggle to inspect empty state vs dummy state
  const [showRecentPhoto, setShowRecentPhoto] = useState(false);

  return (
    <div className="flex flex-col gap-5 py-3 pb-8 select-none">
      {/* 0. PWA 홈 화면 추가 안내 배너 (Android beforeinstallprompt / iOS Safari 가이드) */}
      <PWAInstallBanner />

      {/* 1. Hero Banner: Quick Shoot CTA */}
      <section className="px-4">
        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#FFEBF1] via-[#FFF0F4] to-[#FFF8F3] border border-[#FF5C8A]/20 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-1 max-w-[210px]">
              <span className="text-[11px] font-bold tracking-wider text-[#FF5C8A] uppercase">
                Life4Cuts Studio
              </span>
              <h2 className="text-xl font-black text-[#222222] tracking-tight leading-tight">
                지금 바로 네컷을<br />남겨보세요!
              </h2>
              <p className="text-xs text-[#222222]/60 pt-1 leading-relaxed">
                현재 선택: <span className="font-bold text-[#FF5C8A]">{selectedFrame?.name || '미니멀'}</span> 프레임
              </p>
            </div>

            {/* Visual Photo Strip Mockup */}
            <div className="w-16 h-28 bg-white rounded-lg shadow-md border border-[#FF5C8A]/30 p-1 flex flex-col justify-between shrink-0 rotate-3 transform hover:rotate-0 transition-transform">
              <div className="w-full h-5 bg-[#FF5C8A]/20 rounded-xs flex items-center justify-center text-[7px] font-bold text-[#FF5C8A]">1</div>
              <div className="w-full h-5 bg-[#FF5C8A]/15 rounded-xs flex items-center justify-center text-[7px] font-bold text-[#FF5C8A]">2</div>
              <div className="w-full h-5 bg-[#FF5C8A]/20 rounded-xs flex items-center justify-center text-[7px] font-bold text-[#FF5C8A]">3</div>
              <div className="w-full h-5 bg-[#FF5C8A]/15 rounded-xs flex items-center justify-center text-[7px] font-bold text-[#FF5C8A]">4</div>
              <div className="text-[6px] font-black text-center text-[#FF5C8A]">LIFE 4 CUTS</div>
            </div>
          </div>

          {/* 1 Dominant Core Action: "바로 찍기" (선택된 프레임 없으면 미니멀로 시작) */}
          <div className="mt-4 pt-1">
            <button
              type="button"
              onClick={onQuickShoot}
              className="w-full h-[52px] bg-[#FF5C8A] hover:bg-[#E84575] active:scale-[0.98] text-white font-bold text-base rounded-[16px] flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C8A]/25 transition-all"
            >
              <Camera className="w-5 h-5 stroke-[2.2]" />
              <span>바로 찍기</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. 추천 프레임 카드 가로 스크롤 (FRAMES 배열에서 생성) */}
      <section className="space-y-3">
        <div className="px-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#222222]">추천 프레임</h3>
            <p className="text-xs text-[#222222]/50">시즌 인기 테마 프레임 5종</p>
          </div>
          <a
            href="#/frames"
            className="text-xs font-semibold text-[#FF5C8A] flex items-center gap-0.5 hover:underline"
          >
            <span>전체보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Horizontal Scroll Cards from FRAMES */}
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {FRAMES.map((frame) => (
            <a
              key={frame.id}
              href={`#/frame-detail?id=${frame.id}`}
              onClick={() => onSelectFrame(frame)}
              className="flex-shrink-0 w-[130px] rounded-[16px] bg-white border border-[#222222]/8 p-2.5 shadow-xs hover:border-[#FF5C8A]/50 active:scale-98 transition-all flex flex-col justify-between group"
            >
              <div className="w-full mb-2">
                <FrameThumbnailCanvas frame={frame} />
              </div>

              <div>
                <span className="text-[10px] font-medium text-[#222222]/50 block">
                  {frame.category}
                </span>
                <h4 className="text-xs font-bold text-[#222222] truncate group-hover:text-[#FF5C8A] transition-colors">
                  {frame.name}
                </h4>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 3. 최근 사진 영역 (빈 상태 문구 포함) */}
      <section className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#222222]">최근 사진</h3>
            <p className="text-xs text-[#222222]/50">최근 촬영하고 저장한 네컷</p>
          </div>

          <button
            type="button"
            onClick={() => setShowRecentPhoto(!showRecentPhoto)}
            className="text-[11px] px-2 py-1 bg-black/5 hover:bg-black/10 rounded-md text-[#222222]/60 font-medium transition-colors"
            title="빈 상태 / 샘플 사진 상태 토글"
          >
            {showRecentPhoto ? '빈 상태 보기' : '샘플 보기'}
          </button>
        </div>

        {showRecentPhoto ? (
          <div className="bg-white rounded-[16px] border border-[#222222]/8 p-3.5 flex items-center gap-3.5 shadow-xs">
            <div className="w-14 h-20 bg-[#FFEBF1] rounded-lg border border-[#FF5C8A]/30 p-1 flex flex-col justify-between shrink-0">
              <div className="w-full h-3 bg-white/80 rounded-xs" />
              <div className="w-full h-3 bg-white/80 rounded-xs" />
              <div className="w-full h-3 bg-white/80 rounded-xs" />
              <div className="w-full h-3 bg-white/80 rounded-xs" />
              <span className="text-[5px] text-center font-bold text-[#FF5C8A]">2026.11.09</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-[#FF5C8A]">방금 저장됨</span>
              <h4 className="text-sm font-bold text-[#222222] truncate">홍대입구에서 지우랑</h4>
              <p className="text-xs text-[#222222]/50 mt-0.5">러블리 핑크 에디션 · 4컷 완성</p>
              <div className="mt-2">
                <a
                  href="#/my-photos"
                  className="text-xs font-bold text-[#222222] hover:text-[#FF5C8A] inline-flex items-center gap-1"
                >
                  사진첩에서 보기 <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[16px] border-2 border-dashed border-[#222222]/15 bg-white/50 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#FFEBF1] text-[#FF5C8A] flex items-center justify-center mb-2.5">
              <ImageIcon className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-bold text-[#222222]">최근에 찍은 사진이 없어요</p>
            <p className="text-xs text-[#222222]/50 mt-1 max-w-[220px]">
              소중한 친구, 연인과의 순간을 지금 바로 촬영하고 첫 네컷을 보관해보세요!
            </p>
            <a
              href="#/capture"
              className="mt-3.5 px-4 py-2 text-xs font-bold text-[#FF5C8A] bg-[#FFEBF1] hover:bg-[#FFD4E2] rounded-xl transition-colors"
            >
              지금 촬영하기
            </a>
          </div>
        )}
      </section>

      {/* 4. AI Frame Banner Promo */}
      <section className="px-4">
        <a
          href="#/ai-frame"
          className="block rounded-[16px] bg-gradient-to-r from-[#222222] to-[#3a3a3a] text-white p-4 shadow-sm hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[#FF5C8A] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI 커스텀 프레임</span>
              </div>
              <h4 className="text-sm font-bold text-white">원하는 단어로 프레임 생성</h4>
              <p className="text-[11px] text-white/70">내 취향과 스타일에 맞춘 나만의 프레임 만들기</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </a>
      </section>
    </div>
  );
};
