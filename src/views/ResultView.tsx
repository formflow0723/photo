import React, { useState, useEffect, useRef } from 'react';
import { Download, RotateCcw, Loader2, Check, Undo2, CopyCheck, Sparkles, Share2 } from 'lucide-react';
import { ShotItem, FilterType, EditState } from '../types.ts';
import { track } from '../utils/analytics.ts';
import {
  FrameData,
  FRAMES,
  DEFAULT_FRAME,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SLOT_WIDTH,
  SLOT_HEIGHT,
  SLOTS,
} from '../data/frames.ts';
import { STICKERS, drawStickerOnCanvas } from '../data/stickers.ts';

interface FilterOption {
  id: FilterType;
  label: string;
}

const FILTERS: FilterOption[] = [
  { id: 'none', label: '원본' },
  { id: 'mono', label: '흑백' },
  { id: 'warm', label: '따뜻한' },
  { id: 'cool', label: '쿨톤' },
  { id: 'film', label: '필름' },
];

export const DEFAULT_EDIT_STATE: EditState = {
  filterAll: 'none',
  filters: [null, null, null, null],
  decos: [],
};

interface ResultViewProps {
  shots: ShotItem[];
  allFrames?: FrameData[];
  currentFrame?: FrameData;
  edit?: EditState;
  onEditChange?: (edit: EditState) => void;
  onSelectFrame?: (frame: FrameData) => void;
  onRetake: () => void;
}

// 1. 필터 적용 함수 (해당 슬롯 영역만 getImageData로 처리, 원본 미수정)
export const applyFilter = (canvas: HTMLCanvasElement, filterName: FilterType): HTMLCanvasElement => {
  if (filterName === 'none') return canvas;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    switch (filterName) {
      case 'mono': {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const contrastGray = Math.min(255, Math.max(0, (gray - 128) * 1.15 + 128));
        data[i] = contrastGray;
        data[i + 1] = contrastGray;
        data[i + 2] = contrastGray;
        break;
      }
      case 'warm': {
        data[i] = Math.min(255, Math.max(0, r + 12));
        data[i + 2] = Math.min(255, Math.max(0, b - 12));
        break;
      }
      case 'cool': {
        data[i] = Math.min(255, Math.max(0, r - 10));
        data[i + 2] = Math.min(255, Math.max(0, b + 14));
        break;
      }
      case 'film': {
        const noise = (Math.random() - 0.5) * 12;
        let r2 = (r - 128) * 0.88 + 128;
        let g2 = (g - 128) * 0.88 + 128;
        let b2 = (b - 128) * 0.88 + 128;

        r2 = r2 * 0.92 + 18;
        g2 = g2 * 0.92 + 18;
        b2 = b2 * 0.92 + 20;

        data[i] = Math.min(255, Math.max(0, r2 + noise));
        data[i + 1] = Math.min(255, Math.max(0, g2 + noise));
        data[i + 2] = Math.min(255, Math.max(0, b2 + noise));
        break;
      }
      default:
        break;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
};

// 2. 4컷 스트립 합성 함수 (edit 객체 지원: filters[i] ?? filterAll)
export const composeStrip = async (
  shots: ShotItem[],
  edit: EditState = DEFAULT_EDIT_STATE,
  frame: FrameData = DEFAULT_FRAME,
  scale: number = 1 // 미리보기는 축소본(0.35), 저장은 1200x3600 풀사이즈(1)
): Promise<HTMLCanvasElement> => {
  const width = Math.round(CANVAS_WIDTH * scale);
  const height = Math.round(CANVAS_HEIGHT * scale);

  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = width;
  masterCanvas.height = height;
  const ctx = masterCanvas.getContext('2d');
  if (!ctx) throw new Error('2D 컨텍스트 생성 실패');

  const isImageOverlay = frame.type === 'image';

  // 1. 배경 처리
  ctx.fillStyle = isImageOverlay ? '#FFFFFF' : (frame.bg || '#FFFFFF');
  ctx.fillRect(0, 0, width, height);

  // 2. draw 타입의 경우 사진 슬롯 "뒤"에 배경 장식 그리기
  if (!isImageOverlay && frame.draw) {
    frame.draw(ctx, width, height);
  }

  // 3. Blob에서 Image 객체 로드
  const loadedImages: HTMLImageElement[] = await Promise.all(
    shots.slice(0, 4).map((shot) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = shot.previewUrl;
      });
    })
  );

  // 4. 슬롯마다 filters[i] ?? filterAll 적용 (해당 슬롯 영역만 개별 처리)
  for (let idx = 0; idx < loadedImages.length; idx++) {
    const img = loadedImages[idx];
    const slotPos = SLOTS[idx] || SLOTS[0];
    const x = Math.round(slotPos.x * scale);
    const y = Math.round(slotPos.y * scale);
    const slotW = Math.round(SLOT_WIDTH * scale);
    const slotH = Math.round(SLOT_HEIGHT * scale);

    const slotCanvas = document.createElement('canvas');
    slotCanvas.width = slotW;
    slotCanvas.height = slotH;
    const slotCtx = slotCanvas.getContext('2d');
    if (!slotCtx) continue;

    // cover 비율 계산
    const imgRatio = img.width / img.height;
    const slotRatio = slotW / slotH;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;

    if (imgRatio > slotRatio) {
      sw = img.height * slotRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / slotRatio;
      sy = (img.height - sh) / 2;
    }

    slotCtx.drawImage(img, sx, sy, sw, sh, 0, 0, slotW, slotH);

    // 슬롯별 필터 적용 (filters[i] ?? filterAll)
    const slotFilter = edit.filters[idx] ?? edit.filterAll;
    applyFilter(slotCanvas, slotFilter);

    ctx.drawImage(slotCanvas, x, y, slotW, slotH);
  }

  // 5. 프레임 합성 마무리
  if (isImageOverlay && frame.src) {
    // image 타입: 프레임 PNG를 1200x3600 전체에 덮어 그리기
    const overlayImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = frame.src!;
    });
    ctx.drawImage(overlayImg, 0, 0, width, height);
  } else if (!isImageOverlay) {
    // draw 타입: 하단 영역 푸터 문구 및 날짜 그리기
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateFormatted = `${year}.${month}.${day}`;

    const bottomHeight = 180 * scale;
    const bottomCenterY = height - bottomHeight / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = frame.textColor || '#222222';
    const titleSize = Math.max(12, Math.round(48 * scale));
    ctx.font = `bold ${titleSize}px Pretendard, -apple-system, sans-serif`;
    ctx.fillText(frame.footerText || 'life4cut', width / 2, bottomCenterY - 22 * scale);

    const dateSize = Math.max(9, Math.round(28 * scale));
    ctx.font = `500 ${dateSize}px Pretendard, monospace`;
    ctx.fillStyle = frame.textColor || '#666666';
    ctx.globalAlpha = 0.75;
    ctx.fillText(dateFormatted, width / 2, bottomCenterY + 24 * scale);
    ctx.globalAlpha = 1.0;
  }

  // 6. 데코 렌더링 (합성 순서: 배경 → 사진(컷별 필터) → 프레임 오버레이 → 데코 순서대로)
  if (edit.decos && edit.decos.length > 0) {
    try {
      await document.fonts.ready;
    } catch {
      // 폰트 대기 폴백
    }

    for (const item of edit.decos) {
      ctx.save();
      const posX = item.x * scale;
      const posY = item.y * scale;
      ctx.translate(posX, posY);
      ctx.rotate(item.rot || 0);

      if (item.type === 'sticker' && item.key) {
        const stickerDef = STICKERS.find((s) => s.key === item.key);
        if (stickerDef) {
          const size = 160 * (item.scale || 1) * scale;
          drawStickerOnCanvas(ctx, stickerDef, item.color, size);
        }
      } else if (item.type === 'text' && item.text) {
        const fontSize = Math.max(10, Math.round(48 * (item.scale || 1) * scale));
        const fontFam = item.font || 'Pretendard';
        ctx.font = `bold ${fontSize}px "${fontFam}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = item.color || '#FF5C8A';
        ctx.fillText(item.text, 0, 0);
      }

      ctx.restore();
    }
  }

  return masterCanvas;
};

export const ResultView: React.FC<ResultViewProps> = ({
  shots,
  allFrames = FRAMES,
  currentFrame = DEFAULT_FRAME,
  edit: propEdit,
  onEditChange,
  onSelectFrame,
  onRetake,
}) => {
  // 프레임 및 편집 상태
  const [activeFrame, setActiveFrame] = useState<FrameData>(currentFrame);
  const [edit, setEdit] = useState<EditState>(propEdit || DEFAULT_EDIT_STATE);
  const [filterMode, setFilterMode] = useState<'all' | 'individual'>('all');
  const [selectedCut, setSelectedCut] = useState<number>(0);

  // 미리보기 및 로딩 상태
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // shots 비어있을 시 촬영 화면으로 되돌리기
  useEffect(() => {
    if (!shots || shots.length === 0) {
      window.location.hash = '#/capture';
    }
  }, [shots]);

  // props frame 변경 반영 (프레임 변경 시 edit 상태는 그대로 유지)
  useEffect(() => {
    if (currentFrame) {
      setActiveFrame(currentFrame);
    }
  }, [currentFrame]);

  // edit 변경 시 상위 동기화
  const updateEdit = (newEdit: EditState) => {
    setEdit(newEdit);
    if (onEditChange) {
      onEditChange(newEdit);
    }
  };

  // 필터 또는 프레임 변경 시 축소본(scale = 0.35)으로 즉시 합성
  useEffect(() => {
    if (!shots || shots.length === 0) return;

    let isMounted = true;
    setIsComposing(true);

    composeStrip(shots, edit, activeFrame, 0.35)
      .then((canvas) => {
        if (!isMounted) return;
        const dataUrl = canvas.toDataURL('image/png');
        setPreviewUrl(dataUrl);
        setIsComposing(false);
      })
      .catch((err) => {
        console.warn('합성 오류:', err);
        if (isMounted) setIsComposing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shots, edit, activeFrame]);

  // 프레임 변경 (edit 상태는 유지)
  const handleFrameChange = (frame: FrameData) => {
    setActiveFrame(frame);
    if (onSelectFrame) {
      onSelectFrame(frame);
    }
  };

  // 필터 칩 탭 핸들러 (전체 모드 vs 컷별 모드)
  const handleFilterSelect = (filterId: FilterType) => {
    if (filterMode === 'all') {
      // 전체 모드: filterAll 갱신
      updateEdit({
        ...edit,
        filterAll: filterId,
      });
    } else {
      // 컷별 모드: 선택된 컷만 갱신
      const updatedFilters = [...edit.filters];
      updatedFilters[selectedCut] = filterId;
      updateEdit({
        ...edit,
        filters: updatedFilters,
      });
    }
  };

  // 이 컷 되돌리기 (null로 설정하여 filterAll 따름)
  const handleResetCurrentCut = () => {
    const updatedFilters = [...edit.filters];
    updatedFilters[selectedCut] = null;
    updateEdit({
      ...edit,
      filters: updatedFilters,
    });
  };

  // 전체에 적용 (선택 컷의 필터를 filterAll로 복사하고 나머지 초기화)
  const handleApplyToAll = () => {
    const effectiveFilter = edit.filters[selectedCut] ?? edit.filterAll;
    updateEdit({
      ...edit,
      filterAll: effectiveFilter,
      filters: [null, null, null, null],
    });
  };

  // 다시 찍기 (state.edit 초기화 및 샷 초기화)
  const handleRetakeWithReset = () => {
    updateEdit(DEFAULT_EDIT_STATE);
    onRetake();
  };

  // 캔버스 파일 다운로드 및 썸네일 보관 공통 헬퍼
  const downloadAndStoreThumbnail = (
    fullCanvas: HTMLCanvasElement,
    blob: Blob,
    fileName: string,
    dateStr: string
  ) => {
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

    // localStorage에 썸네일(200x600) 저장 (최대 20개)
    try {
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 200;
      thumbCanvas.height = 600;
      const tCtx = thumbCanvas.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(fullCanvas, 0, 0, 200, 600);
        const thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.85);

        const storageKey = 'life4cut_saved_photos';
        const savedRaw = localStorage.getItem(storageKey);
        let list: Array<{ id: string; thumbnail: string; date: string; createdAt: number }> = [];
        if (savedRaw) {
          try {
            list = JSON.parse(savedRaw);
          } catch {
            list = [];
          }
        }

        const newItem = {
          id: `cut_${Date.now()}`,
          thumbnail: thumbUrl,
          date: dateStr,
          createdAt: Date.now(),
        };

        const updatedList = [newItem, ...list].slice(0, 20);
        localStorage.setItem(storageKey, JSON.stringify(updatedList));
      }
    } catch (storageErr) {
      console.warn('localStorage 저장 실패:', storageErr);
    }
  };

  // PNG 저장: 1200x3600 풀사이즈 합성 다운로드
  const handleSave = async () => {
    if (!shots || shots.length === 0) return;

    setIsComposing(true);

    try {
      const fullCanvas = await composeStrip(shots, edit, activeFrame, 1);
      setIsComposing(false);

      const now = new Date();
      const YYYY = now.getFullYear();
      const MM = String(now.getMonth() + 1).padStart(2, '0');
      const DD = String(now.getDate()).padStart(2, '0');
      const HH = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const fileName = `life4cut_${YYYY}${MM}${DD}_${HH}${mm}.png`;
      const dateStr = `${YYYY}.${MM}.${DD}`;

      fullCanvas.toBlob((blob) => {
        if (!blob) return;
        downloadAndStoreThumbnail(fullCanvas, blob, fileName, dateStr);
        track('save');
        setToastMessage('저장했어요');
        setTimeout(() => setToastMessage(null), 2500);
      }, 'image/png');
    } catch (saveErr) {
      console.warn('저장 중 합성 실패:', saveErr);
      setIsComposing(false);
    }
  };

  // Web Share API 공유하기 (파일 지원 시 직접 공유, 미지원 시 저장으로 대체)
  const handleShare = async () => {
    if (!shots || shots.length === 0) return;

    setIsComposing(true);

    try {
      const fullCanvas = await composeStrip(shots, edit, activeFrame, 1);
      setIsComposing(false);

      const now = new Date();
      const YYYY = now.getFullYear();
      const MM = String(now.getMonth() + 1).padStart(2, '0');
      const DD = String(now.getDate()).padStart(2, '0');
      const HH = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const fileName = `life4cut_${YYYY}${MM}${DD}_${HH}${mm}.png`;
      const dateStr = `${YYYY}.${MM}.${DD}`;

      fullCanvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], fileName, { type: 'image/png' });

        // navigator.canShare({ files }) 지원 확인
        const canShareFiles =
          typeof navigator !== 'undefined' &&
          Boolean(navigator.canShare && navigator.canShare({ files: [file] }));

        if (canShareFiles && navigator.share) {
          try {
            await navigator.share({
              title: '인생4컷',
              text: '인생4컷으로 만든 네컷 사진이에요!',
              files: [file],
            });
            track('share', { method: 'web_share' });
          } catch (err: unknown) {
            // 사용자가 공유창을 닫은 경우(AbortError)는 오류로 처리하지 않음
            if ((err as Error)?.name === 'AbortError') {
              return;
            }
            console.warn('Web Share 실행 실패, 저장으로 대체:', err);
            downloadAndStoreThumbnail(fullCanvas, blob, fileName, dateStr);
            setToastMessage('이 기기는 바로 공유가 안 돼요. 저장했어요');
            setTimeout(() => setToastMessage(null), 3000);
            track('share', { method: 'download_fallback' });
          }
        } else {
          // 지원하지 않으면 저장(다운로드)으로 대체하고 안내 토스트
          downloadAndStoreThumbnail(fullCanvas, blob, fileName, dateStr);
          setToastMessage('이 기기는 바로 공유가 안 돼요. 저장했어요');
          setTimeout(() => setToastMessage(null), 3000);
          track('share', { method: 'download_fallback' });
        }
      }, 'image/png');
    } catch (shareErr) {
      console.warn('공유 중 합성 실패:', shareErr);
      setIsComposing(false);
    }
  };

  if (!shots || shots.length === 0) {
    return null;
  }

  // 현재 선택된 모드에 따른 활성 필터값 계산
  const currentActiveFilter =
    filterMode === 'all'
      ? edit.filterAll
      : (edit.filters[selectedCut] ?? edit.filterAll);

  const hasIndividualSetting = edit.filters[selectedCut] !== null;

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-56px-64px)] justify-between py-2 px-4 pb-4 select-none relative">
      {/* 저장 완료 토스트 */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#222222]/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
          <Check className="w-3.5 h-3.5 text-[#FF5C8A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 상단: 합성 미리보기 (한 화면에 보이도록 축소) + 컷별 탭 영역 오버레이 */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[330px] py-1 relative">
        {isComposing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xs z-20 rounded-2xl">
            <Loader2 className="w-7 h-7 text-[#FF5C8A] animate-spin mb-2" />
            <span className="text-xs font-bold text-[#222222]">프레임 & 필터 합성 중...</span>
          </div>
        )}

        {previewUrl ? (
          <div className="relative p-1 bg-white rounded-lg shadow-xl border border-black/10 inline-block">
            {/* 스트립 이미지 */}
            <img
              src={previewUrl}
              alt="완성된 인생4컷 스트립"
              className="max-h-[42vh] sm:max-h-[46vh] w-auto h-auto object-contain rounded-xs block pointer-events-none"
            />

            {/* 4컷 인터랙티브 오버레이 (탭하여 컷 선택 및 점 표시) */}
            <div className="absolute inset-1 pointer-events-auto">
              {[0, 1, 2, 3].map((idx) => {
                const isSelected = filterMode === 'individual' && selectedCut === idx;
                const hasCutFilter = edit.filters[idx] !== null;

                // 3600 높이 기준 슬롯 위치 비율 (상단 60, 슬롯 810, 간격 40)
                const topPct = (SLOTS[idx].y / CANVAS_HEIGHT) * 100;
                const heightPct = (SLOT_HEIGHT / CANVAS_HEIGHT) * 100;
                const leftPct = (SLOTS[idx].x / CANVAS_WIDTH) * 100;
                const widthPct = (SLOT_WIDTH / CANVAS_WIDTH) * 100;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedCut(idx);
                      if (filterMode === 'all') {
                        setFilterMode('individual');
                      }
                    }}
                    style={{
                      top: `${topPct}%`,
                      height: `${heightPct}%`,
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                    className={`absolute rounded-xs transition-all flex items-start justify-end p-1.5 focus:outline-none ${
                      isSelected
                        ? 'border-2 border-[#FF5C8A] ring-2 ring-[#FF5C8A]/40 shadow-sm'
                        : 'border border-transparent hover:border-black/20'
                    }`}
                    title={`${idx + 1}번 컷 선택`}
                  >
                    {/* 컷별 개별 설정이 있는 경우 작은 점 표시 */}
                    {hasCutFilter && (
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-[#FF5C8A] border-2 border-white shadow-xs animate-in zoom-in"
                        title="컷별 필터 적용됨"
                      />
                    )}

                    {/* 선택된 컷 라벨 뱃지 */}
                    {isSelected && (
                      <span className="absolute bottom-1 right-1 bg-[#FF5C8A] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-xs shadow-xs">
                        {idx + 1}번 컷
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-[140px] h-[390px] bg-white rounded-lg animate-pulse border border-black/10" />
        )}
      </div>

      {/* 컨트롤 영역: 프레임 칩 + 필터 토글 + 컷별 제어 + 필터 칩 */}
      <div className="space-y-2 py-1">
        {/* 1. 프레임 선택 가로 칩 줄 */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[11px] font-bold text-[#222222]/60">테마 프레임</span>
            <span className="text-[10px] text-[#FF5C8A] font-semibold">{activeFrame.name}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {allFrames.map((f) => {
              const isSelected = activeFrame.id === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFrameChange(f)}
                  disabled={isComposing}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-[#222222] text-white shadow-xs'
                      : 'bg-white text-[#222222]/70 border border-[#222222]/10 hover:text-[#222222]'
                  }`}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 필터 모드 토글 (전체 / 컷별) */}
        <div className="pt-0.5">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[11px] font-bold text-[#222222]/60">사진 필터 적용 방식</span>

            {/* 전체 / 컷별 세그먼트 토글 */}
            <div className="flex items-center bg-black/5 p-0.5 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterMode === 'all'
                    ? 'bg-[#FF5C8A] text-white shadow-xs'
                    : 'text-[#222222]/60 hover:text-[#222222]'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('individual')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterMode === 'individual'
                    ? 'bg-[#FF5C8A] text-white shadow-xs'
                    : 'text-[#222222]/60 hover:text-[#222222]'
                }`}
              >
                컷별
              </button>
            </div>
          </div>

          {/* 컷별 모드일 때: 컷 선택 탭 및 보조 제어 버튼 */}
          {filterMode === 'individual' && (
            <div className="bg-[#FFEBF1]/50 border border-[#FF5C8A]/20 rounded-xl p-2 mb-1.5 space-y-1.5 animate-in fade-in duration-150">
              {/* 4개 컷 선택 탭 (1번 ~ 4번) */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-[#222222] shrink-0">선택 컷:</span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3].map((num) => {
                    const isCurrent = selectedCut === num;
                    const hasSetting = edit.filters[num] !== null;

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedCut(num)}
                        className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                          isCurrent
                            ? 'bg-[#FF5C8A] text-white shadow-xs'
                            : 'bg-white text-[#222222]/70 border border-black/5'
                        }`}
                      >
                        <span>{num + 1}컷</span>
                        {hasSetting && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCurrent ? 'bg-white' : 'bg-[#FF5C8A]'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 컷별 모드 전용 버튼: "이 컷 되돌리기", "전체에 적용" */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5 border-t border-[#FF5C8A]/10">
                <button
                  type="button"
                  onClick={handleResetCurrentCut}
                  disabled={!hasIndividualSetting}
                  className="h-7 px-2 bg-white hover:bg-black/5 disabled:opacity-40 text-[#222222] text-[11px] font-bold rounded-lg border border-black/10 flex items-center justify-center gap-1 transition-colors"
                >
                  <Undo2 className="w-3 h-3 text-[#222222]/70" />
                  <span>이 컷 되돌리기</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyToAll}
                  className="h-7 px-2 bg-white hover:bg-black/5 text-[#FF5C8A] text-[11px] font-bold rounded-lg border border-[#FF5C8A]/30 flex items-center justify-center gap-1 transition-colors"
                >
                  <CopyCheck className="w-3 h-3 text-[#FF5C8A]" />
                  <span>전체에 적용</span>
                </button>
              </div>
            </div>
          )}

          {/* 필터 칩 가로 스크롤 (5종) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {FILTERS.map((ft) => {
              const isSelected = currentActiveFilter === ft.id;
              return (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => handleFilterSelect(ft.id)}
                  disabled={isComposing}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-[#FF5C8A] text-white shadow-xs'
                      : 'bg-white text-[#222222]/70 border border-[#222222]/10 hover:text-[#222222]'
                  }`}
                >
                  {ft.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단 버튼: 꾸미기 + 저장하기 & 공유하기 + 다시 찍기 */}
      <div className="space-y-2 pt-1">
        {/* 보조 버튼: 꾸미기 */}
        <a
          href="#/result/decorate"
          className="w-full h-[46px] bg-[#FFEBF1] hover:bg-[#FFD9E5] text-[#FF5C8A] font-bold text-sm rounded-[14px] flex items-center justify-center gap-1.5 border border-[#FF5C8A]/30 active:scale-[0.98] transition-all shadow-xs"
        >
          <Sparkles className="w-4 h-4 stroke-[2.2]" />
          <span>꾸미기 (스티커 & 문구)</span>
        </a>

        {/* 메인 버튼 그리드: 저장하기 옆에 공유하기 */}
        <div className="grid grid-cols-2 gap-2">
          {/* 주 버튼 1: 저장하기 (PNG) */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isComposing || !previewUrl}
            className="h-[48px] bg-[#222222] hover:bg-[#333333] disabled:opacity-50 active:scale-[0.98] text-white font-bold text-sm rounded-[14px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 stroke-[2.2]" />
            <span>저장하기</span>
          </button>

          {/* 주 버튼 2: 공유하기 (Web Share API) */}
          <button
            type="button"
            onClick={handleShare}
            disabled={isComposing || !previewUrl}
            className="h-[48px] bg-[#FF5C8A] hover:bg-[#E84575] disabled:opacity-50 active:scale-[0.98] text-white font-bold text-sm rounded-[14px] flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF5C8A]/25 transition-all"
          >
            <Share2 className="w-4 h-4 stroke-[2.2]" />
            <span>공유하기</span>
          </button>
        </div>

        {/* 보조 버튼: 다시 찍기 (state.edit 초기화 및 capture 이동) */}
        <button
          type="button"
          onClick={handleRetakeWithReset}
          className="w-full h-[40px] rounded-[12px] bg-white border border-[#222222]/10 text-xs font-bold text-[#222222] hover:bg-black/5 active:scale-95 flex items-center justify-center gap-1.5 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#222222]/70" />
          <span>다시 찍기</span>
        </button>
      </div>
    </div>
  );
};
