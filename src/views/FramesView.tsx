import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import {
  FrameData,
  FRAMES,
  SLOTS,
  SLOT_WIDTH,
  SLOT_HEIGHT,
} from '../data/frames.ts';
import {
  getAllCustomFrames,
  saveCustomFrame,
  deleteCustomFrame,
} from '../data/frameDB.ts';

interface FramesViewProps {
  onSelectFrame: (frame: FrameData) => void;
  customFrames?: FrameData[];
  onCustomFramesChange?: (frames: FrameData[]) => void;
}

// 200x600 캔버스에 프레임 실제 장식과 4개 회색 사진 박스를 그리는 컴포넌트
export const FrameThumbnailCanvas: React.FC<{ frame: FrameData }> = ({ frame }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;
    const w = 200;
    const h = 600;
    canvas.width = w;
    canvas.height = h;

    const scale = w / 1200;

    // 1. 공통: 흰 배경 채우기
    ctx.fillStyle = frame.type === 'image' ? '#FFFFFF' : (frame.bg || '#FFFFFF');
    ctx.fillRect(0, 0, w, h);

    // 2. draw 타입 배경 장식 (사진 슬롯 뒤)
    if (frame.type === 'draw' && frame.draw) {
      frame.draw(ctx, w, h);
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

      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.font = 'bold 11px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`CUT 0${i + 1}`, x + slotW / 2, y + slotH / 2);
    }

    // 4. 후속 렌더링
    if (frame.type === 'image' && frame.src) {
      // image 타입: 투명 PNG 오버레이를 200x600 전체에 덮어 그리기
      const img = new Image();
      img.onload = () => {
        if (!isMounted) return;
        ctx.drawImage(img, 0, 0, w, h);
      };
      img.src = frame.src;
    } else if (frame.type === 'draw') {
      // draw 타입: 하단 텍스트 렌더링
      const bottomH = 180 * scale;
      ctx.fillStyle = frame.textColor || '#222222';
      ctx.font = 'bold 9px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(frame.footerText || 'life4cut', w / 2, h - bottomH / 2);
    }

    return () => {
      isMounted = false;
    };
  }, [frame]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto aspect-[1/3] rounded-xl shadow-xs border border-black/10 object-contain block bg-white"
    />
  );
};

export const FramesView: React.FC<FramesViewProps> = ({
  onSelectFrame,
  customFrames: propCustomFrames,
  onCustomFramesChange,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [customFrames, setCustomFrames] = useState<FrameData[]>(propCustomFrames || []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // IndexedDB에서 커스텀 프레임 불러오기
  useEffect(() => {
    getAllCustomFrames().then((list) => {
      setCustomFrames(list);
      if (onCustomFramesChange) {
        onCustomFramesChange(list);
      }
    });
  }, []);

  // LNB 칩 카테고리 목록 ("내 프레임" 추가)
  const categories = ['전체', '기념일', '감성', '팬덤', 'AI 생성', '내 프레임'] as const;

  // 전체 프레임 (기본 5종 + IndexedDB 내 프레임)
  const allFrames = [...FRAMES, ...customFrames];

  // 카테고리 필터링
  const filteredFrames = allFrames.filter((f) => {
    if (activeCategory === '전체') return true;
    return f.category === activeCategory;
  });

  const isPendingCategory = activeCategory === '팬덤' || activeCategory === 'AI 생성';
  const isMyFrameCategory = activeCategory === '내 프레임';

  // PNG 파일 업로드 및 검증 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
      alert('1200x3600 비율의 PNG 파일만 지원합니다.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();

      img.onload = async () => {
        // 1) 비율 검증 (1:3 비율, 오차 2%)
        const ratio = img.width / img.height;
        const targetRatio = 1200 / 3600; // 1/3 ~ 0.333333
        const diff = Math.abs(ratio - targetRatio) / targetRatio;

        if (diff > 0.02) {
          alert('1200x3600 비율의 PNG만 가능해요');
          e.target.value = '';
          return;
        }

        // 2) 4개 슬롯 중앙 픽셀 투명도 검사 (오프스크린 캔버스)
        const testCanvas = document.createElement('canvas');
        testCanvas.width = img.width;
        testCanvas.height = img.height;
        const tCtx = testCanvas.getContext('2d');
        if (!tCtx) return;

        tCtx.drawImage(img, 0, 0);

        let opaqueSlotFound = false;
        for (const slot of SLOTS) {
          const cx = Math.round((slot.x + SLOT_WIDTH / 2) * (img.width / 1200));
          const cy = Math.round((slot.y + SLOT_HEIGHT / 2) * (img.height / 3600));

          const pixel = tCtx.getImageData(cx, cy, 1, 1).data;
          const alpha = pixel[3]; // 0: 투명, 255: 불투명

          // 중앙 픽셀이 불투명한 경우
          if (alpha > 25) {
            opaqueSlotFound = true;
            break;
          }
        }

        if (opaqueSlotFound) {
          const proceed = confirm(
            '사진이 들어갈 구멍이 뚫려 있지 않아요.\n그래도 추가하시겠습니까?'
          );
          if (!proceed) {
            e.target.value = '';
            return;
          }
        }

        // 프레임 이름 결정
        const frameName =
          file.name.replace(/\.[^/.]+$/, '').trim() || `내 프레임 ${customFrames.length + 1}`;

        const newFrame: FrameData = {
          id: `custom_${Date.now()}`,
          name: frameName,
          category: '내 프레임',
          type: 'image',
          src: dataUrl,
          createdAt: Date.now(),
        };

        // IndexedDB에 저장
        const updated = await saveCustomFrame(newFrame);
        setCustomFrames(updated);
        if (onCustomFramesChange) {
          onCustomFramesChange(updated);
        }

        // 선택 후 내 프레임 카테고리로 전환
        onSelectFrame(newFrame);
        setActiveCategory('내 프레임');
        e.target.value = '';
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  };

  // 커스텀 프레임 삭제
  const handleDeleteCustomFrame = async (e: React.MouseEvent, frameId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('이 프레임을 삭제하시겠습니까?')) return;

    await deleteCustomFrame(frameId);
    const updated = await getAllCustomFrames();
    setCustomFrames(updated);
    if (onCustomFramesChange) {
      onCustomFramesChange(updated);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-3 pb-8 select-none">
      {/* 숨김 PNG 파일 입력 엘리먼트 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 1. 상단 바: LNB 칩 + "+ 내 프레임" 버튼 */}
      <section className="px-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-[#222222]">프레임 둘러보기</span>

          {/* 우측 상단: "+ 내 프레임" 버튼 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-[34px] px-3 bg-[#FF5C8A] hover:bg-[#E84575] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>내 프레임</span>
          </button>
        </div>

        {/* LNB: 프레임 가로 스크롤 칩 (내 프레임 포함) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-[#FF5C8A] text-white shadow-sm shadow-[#FF5C8A]/30'
                    : 'bg-white text-[#222222]/70 border border-[#222222]/10 hover:text-[#222222]'
                }`}
              >
                {cat}
                {cat === '내 프레임' && customFrames.length > 0 && (
                  <span className="ml-1 text-[10px] opacity-90 font-mono">
                    ({customFrames.length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Top Banner: AI 프레임 만들기 바로가기 (내 프레임 탭이 아닐 때) */}
      {!isMyFrameCategory && (
        <section className="px-4">
          <a
            href="#/ai-frame"
            className="w-full h-[52px] rounded-[16px] bg-[#FFEBF1] border border-[#FF5C8A]/30 text-[#FF5C8A] hover:bg-[#FFD4E2] active:scale-[0.98] font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>나만의 AI 프레임 만들기</span>
          </a>
        </section>
      )}

      {/* 3. 콘텐츠 영역: 프레임 카드 그리드 or 빈 상태 */}
      <section className="px-4">
        {/* 일반 카테고리 정보 표시 */}
        {!isPendingCategory && (!isMyFrameCategory || customFrames.length > 0) && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#222222]/60">
              총 <span className="text-[#FF5C8A] font-bold">{filteredFrames.length}</span>개의 프레임
            </p>
            <span className="text-[11px] text-[#222222]/40">카드를 탭해 상세 보기</span>
          </div>
        )}

        {/* 1) 팬덤 / AI 생성 빈 상태: "준비 중이에요" */}
        {isPendingCategory && (
          <div className="rounded-[16px] border-2 border-dashed border-[#222222]/15 bg-white/50 p-8 text-center my-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#FFEBF1] text-[#FF5C8A] flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#222222]">준비 중이에요</h4>
            <p className="text-xs text-[#222222]/50 mt-1 max-w-[220px]">
              {activeCategory} 테마 프레임이 곧 업데이트될 예정입니다.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory('전체')}
              className="mt-4 px-4 py-2 text-xs font-bold text-[#FF5C8A] bg-[#FFEBF1] hover:bg-[#FFD4E2] rounded-xl transition-colors"
            >
              전체 테마 프레임 보기
            </button>
          </div>
        )}

        {/* 2) 내 프레임 빈 상태: "PNG로 나만의 프레임을 추가해봐" + 추가 버튼 */}
        {isMyFrameCategory && customFrames.length === 0 && (
          <div className="rounded-[16px] border-2 border-dashed border-[#FF5C8A]/30 bg-[#FFEBF1]/30 p-8 text-center my-4 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-[#FFEBF1] text-[#FF5C8A] flex items-center justify-center mb-3 shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-[#222222]">PNG로 나만의 프레임을 추가해봐</h4>
            <p className="text-xs text-[#222222]/55 mt-1 max-w-[250px] leading-relaxed">
              1200x3600 비율의 투명 PNG를 등록하면 나만의 특별한 네컷 프레임으로 촬영할 수 있어요. (최대 10개)
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 h-[48px] px-5 bg-[#FF5C8A] hover:bg-[#E84575] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#FF5C8A]/25 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>PNG 프레임 등록하기</span>
            </button>
          </div>
        )}

        {/* 3) 프레임 카드 2열 그리드 */}
        {!isPendingCategory && (!isMyFrameCategory || customFrames.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {filteredFrames.map((frame) => {
              const isCustom = frame.category === '내 프레임';

              return (
                <div
                  key={frame.id}
                  className="bg-white rounded-[16px] border border-[#222222]/8 p-2.5 shadow-xs hover:border-[#FF5C8A]/50 transition-all flex flex-col justify-between group relative"
                >
                  {/* 카드 링크 영역 */}
                  <a
                    href={`#/frame-detail?id=${frame.id}`}
                    onClick={() => onSelectFrame(frame)}
                    className="block cursor-pointer"
                  >
                    {/* 200x600 썸네일 캔버스 렌더링 */}
                    <div className="w-full mb-2">
                      <FrameThumbnailCanvas frame={frame} />
                    </div>

                    {/* 메타 정보 */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[#FF5C8A]">
                          {frame.category}
                        </span>
                        {frame.type === 'image' && (
                          <span className="text-[9px] bg-black/5 text-[#222222]/60 px-1.5 py-0.2 rounded-xs font-mono">
                            PNG
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-[#222222] truncate group-hover:text-[#FF5C8A] transition-colors">
                        {frame.name}
                      </h4>
                      <p className="text-[10px] text-[#222222]/50 truncate">
                        {frame.description || (isCustom ? '내가 등록한 PNG 프레임' : '')}
                      </p>
                    </div>
                  </a>

                  {/* 내 프레임 전용 삭제 버튼 */}
                  {isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustomFrame(e, frame.id)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center shadow-md active:scale-90 transition-all z-10"
                      title="프레임 삭제"
                      aria-label="프레임 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
