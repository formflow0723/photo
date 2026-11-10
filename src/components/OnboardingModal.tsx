import React, { useState, useEffect } from 'react';
import { LayoutGrid, Camera, Share2, Sparkles, ArrowRight, Check } from 'lucide-react';
import { track } from '../utils/analytics.ts';

const ONBOARDING_KEY = 'life4cut_onboarding_done';

export const OnboardingModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    try {
      const isDone = localStorage.getItem(ONBOARDING_KEY);
      if (!isDone) {
        setIsOpen(true);
      }
    } catch {
      // 무시
    }
  }, []);

  const handleComplete = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // 무시
    }
    track('onboarding_done');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  if (!isOpen) return null;

  const slides = [
    {
      stepLabel: 'STEP 1',
      title: '① 프레임 고르기',
      desc: '기념일, 감성, 팬덤, AI 생성 등 취향에 꼭 맞는 프레임을 자유롭게 골라보세요.',
      icon: LayoutGrid,
      color: '#FF5C8A',
      bgLight: '#FFEBF1',
      badge: '다양한 테마',
    },
    {
      stepLabel: 'STEP 2',
      title: '② 4컷 촬영',
      desc: '3초 카운트다운 후 연속으로 4컷이 촬영돼요. 셔터 순간 귀여운 포즈를 취해보세요!',
      icon: Camera,
      color: '#8338EC',
      bgLight: '#F3EBFF',
      badge: '자동 연속 촬영',
    },
    {
      stepLabel: 'STEP 3',
      title: '③ 저장·공유',
      desc: '컷별 필터와 스티커로 꾸민 후 고화질 네컷 사진을 기기에 저장하거나 친구에게 바로 공유해요.',
      icon: Share2,
      color: '#3A86FF',
      bgLight: '#EBF3FF',
      badge: 'Web Share & 저장',
    },
  ];

  const currentSlide = slides[step];
  const IconComponent = currentSlide.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[340px] bg-white rounded-[24px] p-6 shadow-2xl border border-black/10 flex flex-col items-center text-center relative overflow-hidden">
        {/* 상단 건너뛰기 버튼 */}
        <button
          type="button"
          onClick={handleComplete}
          className="absolute top-4 right-4 text-xs font-semibold text-[#222222]/40 hover:text-[#222222] transition-colors"
        >
          건너뛰기
        </button>

        {/* 일러스트 아이콘 원형 영역 */}
        <div
          style={{ backgroundColor: currentSlide.bgLight }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 transition-colors duration-300"
        >
          <IconComponent
            style={{ color: currentSlide.color }}
            className="w-10 h-10 stroke-[2] transition-transform duration-300 transform scale-105"
          />
        </div>

        {/* 스텝 태그 */}
        <span
          style={{ color: currentSlide.color }}
          className="text-[11px] font-extrabold tracking-widest uppercase mb-1"
        >
          {currentSlide.stepLabel} · {currentSlide.badge}
        </span>

        {/* 타이틀 및 설명 */}
        <h3 className="text-lg font-black text-[#222222] mb-2 tracking-tight">
          {currentSlide.title}
        </h3>
        <p className="text-xs text-[#222222]/60 leading-relaxed max-w-[260px] min-h-[38px]">
          {currentSlide.desc}
        </p>

        {/* 단계 인디케이터 도트 */}
        <div className="flex items-center gap-1.5 my-5">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStep(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === idx
                  ? 'w-6 bg-[#FF5C8A]'
                  : 'w-1.5 bg-black/15 hover:bg-black/30'
              }`}
              title={`${idx + 1}단계로 이동`}
            />
          ))}
        </div>

        {/* 액션 버튼: 다음 / 시작하기 */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full h-[48px] bg-[#FF5C8A] hover:bg-[#E84575] active:scale-[0.98] text-white font-bold text-sm rounded-[14px] flex items-center justify-center gap-1.5 shadow-md shadow-[#FF5C8A]/30 transition-all"
        >
          {step === 2 ? (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>인생4컷 시작하기</span>
            </>
          ) : (
            <>
              <span>다음</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
