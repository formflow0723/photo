import React, { useEffect, useRef } from 'react';
import { Camera, CheckCircle2 } from 'lucide-react';
import {
  FrameData,
  FRAMES,
  DEFAULT_FRAME,
  SLOTS,
  SLOT_WIDTH,
  SLOT_HEIGHT,
} from '../data/frames.ts';

interface FrameDetailViewProps {
  frameId?: string;
  frame?: FrameData;
  onChooseFrame: (frame: FrameData) => void;
}

export const FrameDetailView: React.FC<FrameDetailViewProps> = ({
  frameId,
  frame: propFrame,
  onChooseFrame,
}) => {
  const currentFrame: FrameData =
    propFrame ||
    FRAMES.find((f) => f.id === frameId) ||
    DEFAULT_FRAME;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 대형 프레임 캔버스 렌더링 (300x900)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;
    const w = 300;
    const h = 900;
    canvas.width = w;
    canvas.height = h;

    const scale = w / 1200;
    const isImageOverlay = currentFrame.type === 'image';

    // 1. 배경
    ctx.fillStyle = isImageOverlay ? '#FFFFFF' : (currentFrame.bg || '#FFFFFF');
    ctx.fillRect(0, 0, w, h);

    // 2. draw 타입 배경 장식 (사진 슬롯 뒤)
    if (!isImageOverlay && currentFrame.draw) {
      currentFrame.draw(ctx, w, h);
    }

    // 3. 4개 사진 슬롯 (회색 박스)
    for (let i = 0; i < SLOTS.length; i++) {
      const slot = SLOTS[i];
      const x = Math.round(slot.x * scale);
      const y = Math.round(slot.y * scale);
      const slotW = Math.round(SLOT_WIDTH * scale);
      const slotH = Math.round(SLOT_HEIGHT * scale);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(x, y, slotW, slotH);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.font = 'bold 13px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`PHOTO SLOT 0${i + 1}`, x + slotW / 2, y + slotH / 2);
    }

    // 4. 후속 렌더링
    if (isImageOverlay && currentFrame.src) {
      // image 타입: 투명 PNG 오버레이를 300x900 전체에 덮어 그리기
      const img = new Image();
      img.onload = () => {
        if (!isMounted) return;
        ctx.drawImage(img, 0, 0, w, h);
      };
      img.src = currentFrame.src;
    } else if (!isImageOverlay) {
      // draw 타입: 하단 텍스트 및 날짜
      const bottomH = 180 * scale;
      ctx.fillStyle = currentFrame.textColor || '#222222';
      ctx.font = 'bold 14px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(currentFrame.footerText || 'life4cut', w / 2, h - bottomH / 2 - 6 * scale);

      const now = new Date();
      const dateFormatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
      ctx.font = '500 10px Pretendard, monospace';
      ctx.globalAlpha = 0.7;
      ctx.fillText(dateFormatted, w / 2, h - bottomH / 2 + 10 * scale);
      ctx.globalAlpha = 1.0;
    }

    return () => {
      isMounted = false;
    };
  }, [currentFrame]);

  const handleSelectAndShoot = () => {
    onChooseFrame(currentFrame);
    window.location.hash = `#/capture?frame=${currentFrame.id}`;
  };

  return (
    <div className="flex flex-col gap-5 py-4 px-4 pb-8 select-none">
      {/* 1. Large Frame Canvas Preview */}
      <div className="flex flex-col items-center">
        <div className="p-1.5 bg-white rounded-2xl shadow-xl border border-black/10">
          <canvas
            ref={canvasRef}
            className="w-[180px] sm:w-[200px] h-auto aspect-[1/3] rounded-xl block object-contain shadow-xs bg-white"
          />
        </div>
        <p className="text-[11px] text-[#222222]/40 mt-2">
          {currentFrame.type === 'image'
            ? '투명 PNG 오버레이가 사진 4컷 위에 덮여 합성됩니다'
            : '실제 촬영 및 저장 시 적용되는 테마 규격입니다'}
        </p>
      </div>

      {/* 2. Frame Info Card */}
      <div className="bg-white rounded-[16px] border border-[#222222]/8 p-4 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#FF5C8A] bg-[#FFEBF1] px-2.5 py-1 rounded-md">
            {currentFrame.category}
          </span>
          <div className="flex items-center gap-1 text-xs text-[#222222]/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5C8A]" />
            <span>{currentFrame.type === 'image' ? '커스텀 PNG 프레임' : '공식 테마 프레임'}</span>
          </div>
        </div>

        <h3 className="text-lg font-black text-[#222222]">{currentFrame.name}</h3>
        <p className="text-xs text-[#222222]/60 leading-relaxed">
          {currentFrame.description ||
            (currentFrame.type === 'image'
              ? '내 기기에서 직접 등록한 1200x3600 투명 PNG 프레임입니다.'
              : '인생4컷 감성 테마 프레임으로 특별한 순간을 기록해보세요.')}
        </p>

        <div className="pt-2 border-t border-[#222222]/5 flex items-center justify-between text-[11px] text-[#222222]/40">
          <span>인생4컷 공식 규격 1200x3600</span>
          <span>4컷 세로형 (1x4)</span>
        </div>
      </div>

      {/* 3. Core Action: "이 프레임으로 찍기" (52px, #FF5C8A) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleSelectAndShoot}
          className="w-full h-[52px] bg-[#FF5C8A] hover:bg-[#E84575] active:scale-[0.98] text-white font-bold text-base rounded-[16px] flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C8A]/25 transition-all"
        >
          <Camera className="w-5 h-5 stroke-[2.2]" />
          <span>이 프레임으로 찍기</span>
        </button>
      </div>
    </div>
  );
};
