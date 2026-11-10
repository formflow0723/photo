import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2, RefreshCw, Info } from 'lucide-react';
import { track } from '../utils/analytics.ts';

export const AiFrameView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [viewState, setViewState] = useState<'empty' | 'loading' | 'generated'>('empty');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // AI 이벤트 기록 (개인 텍스트 내용은 수집하지 않음)
    track('ai_frame_generate');

    // Simulate transition to loading state, then generated
    setViewState('loading');
    setTimeout(() => {
      setViewState('generated');
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-5 py-4 px-4 pb-8">
      {/* 1. Prompt Input Section */}
      <form onSubmit={handleGenerate} className="space-y-3">
        <label htmlFor="ai-prompt" className="block text-sm font-bold text-[#222222]">
          어떤 프레임을 만들고 싶나요?
        </label>
        <div className="relative">
          <textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 몽환적인 보랏빛 은하수와 별똥별이 쏟아지는 감성 프레임"
            rows={3}
            className="w-full rounded-[16px] border border-[#222222]/15 bg-white p-3.5 text-sm text-[#222222] placeholder:text-[#222222]/35 focus:outline-none focus:border-[#FF5C8A] focus:ring-2 focus:ring-[#FF5C8A]/20 transition-all resize-none"
          />
        </div>

        {/* Quick Recommended Prompt Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] text-[#222222]/40 shrink-0">추천:</span>
          {['분홍 벚꽃 피크닉', '빈티지 레트로 캠코더', '사이버펑크 네온'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setPrompt(tag)}
              className="text-[11px] font-medium bg-white hover:bg-[#FFEBF1] hover:text-[#FF5C8A] border border-[#222222]/10 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* AI 안내 고지 문구 */}
        <div className="flex items-start gap-2 p-3 rounded-[14px] bg-[#FFEBF1]/70 border border-[#FF5C8A]/25 text-[11px] text-[#222222]/80 leading-relaxed">
          <Info className="w-4 h-4 text-[#FF5C8A] shrink-0 mt-0.5" />
          <span>입력한 설명 문장만 AI 서버로 전송돼요. AI가 만든 이미지예요.</span>
        </div>

        {/* Core Action: 52px Button */}
        <button
          type="submit"
          disabled={viewState === 'loading'}
          className="w-full h-[52px] bg-[#FF5C8A] hover:bg-[#E84575] active:scale-[0.98] disabled:opacity-70 text-white font-bold text-base rounded-[16px] flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C8A]/25 transition-all"
        >
          {viewState === 'loading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI가 프레임을 디자인하는 중...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>AI 프레임 생성하기</span>
            </>
          )}
        </button>
      </form>

      {/* State Switcher for Layout Review (빈 상태 / 로딩 상태 / 완성 상태) */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold text-[#222222]/50">미리보기 영역</span>
        <div className="flex items-center gap-1 bg-black/5 p-0.5 rounded-lg text-[10px] font-semibold text-[#222222]/60">
          <button
            type="button"
            onClick={() => setViewState('empty')}
            className={`px-2 py-0.5 rounded-md transition-colors ${viewState === 'empty' ? 'bg-white text-[#222222] shadow-xs' : ''}`}
          >
            빈 상태
          </button>
          <button
            type="button"
            onClick={() => setViewState('loading')}
            className={`px-2 py-0.5 rounded-md transition-colors ${viewState === 'loading' ? 'bg-white text-[#222222] shadow-xs' : ''}`}
          >
            로딩 상태
          </button>
          <button
            type="button"
            onClick={() => setViewState('generated')}
            className={`px-2 py-0.5 rounded-md transition-colors ${viewState === 'generated' ? 'bg-white text-[#222222] shadow-xs' : ''}`}
          >
            결과 상태
          </button>
        </div>
      </div>

      {/* 2. Preview Container (Empty / Loading / Generated states) */}
      <div className="min-h-[300px] flex items-center justify-center">
        {viewState === 'empty' && (
          /* Empty State Area (미리보기 영역 - 아직 비어 있음) */
          <div className="w-full h-[320px] rounded-[16px] border-2 border-dashed border-[#222222]/15 bg-white/40 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#FFEBF1] text-[#FF5C8A] flex items-center justify-center mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-[#222222]">프레임 미리보기가 비어 있어요</h4>
            <p className="text-xs text-[#222222]/50 mt-1 max-w-[240px] leading-relaxed">
              위 입력창에 프롬프트를 적고 'AI 프레임 생성하기'를 누르면 나만의 4컷 프레임이 실시간으로 디자인됩니다.
            </p>
          </div>
        )}

        {viewState === 'loading' && (
          /* Loading State Skeleton */
          <div className="w-full h-[320px] rounded-[16px] border border-[#222222]/10 bg-white p-6 flex flex-col items-center justify-center text-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-[#FFEBF1] text-[#FF5C8A] flex items-center justify-center mb-3">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <p className="text-sm font-bold text-[#222222]">AI 프레임 생성 중...</p>
            <p className="text-xs text-[#222222]/40 mt-1">팔레트와 일러스트 요소를 조합하고 있습니다</p>
            <div className="w-40 h-2 bg-black/5 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-[#FF5C8A] w-2/3 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {viewState === 'generated' && (
          /* Generated Mock Preview */
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-[180px] rounded-[16px] p-2.5 bg-gradient-to-b from-[#2D1B4E] to-[#170E28] border-2 border-[#D946EF] shadow-lg flex flex-col justify-between">
              <div className="space-y-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="w-full h-[54px] bg-white/90 rounded-sm flex items-center justify-center"
                  >
                    <span className="text-[8px] font-bold text-[#2D1B4E]/40">CUT 0{n}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 text-center">
                <span className="text-[8px] font-black text-[#D946EF] tracking-wider">
                  AI DREAM EDITION
                </span>
              </div>
            </div>

            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewState('empty')}
                className="flex-1 h-[44px] rounded-[12px] bg-white border border-[#222222]/10 text-xs font-bold text-[#222222] hover:bg-black/5 transition-colors"
              >
                다시 만들기
              </button>
              <a
                href="#/capture?frame=ai-generated"
                onClick={() => track('ai_frame_use')}
                className="flex-1 h-[44px] rounded-[12px] bg-[#FF5C8A] text-white text-xs font-bold flex items-center justify-center hover:bg-[#E84575] transition-colors"
              >
                이 프레임 적용
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
