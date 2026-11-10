import React, { useState, useEffect, useRef } from 'react';
import {
  Undo2,
  Redo2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Check,
  Type,
  Smile,
  RotateCw,
  Plus,
} from 'lucide-react';
import { ShotItem, EditState, DecoItem } from '../types.ts';
import {
  FrameData,
  DEFAULT_FRAME,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../data/frames.ts';
import { STICKERS, DECO_COLORS, DECO_FONTS, StickerDefinition } from '../data/stickers.ts';
import { composeStrip } from './ResultView.tsx';

interface DecorateViewProps {
  shots: ShotItem[];
  currentFrame?: FrameData;
  edit: EditState;
  onEditChange: (edit: EditState) => void;
  onComplete: () => void;
}

export const DecorateView: React.FC<DecorateViewProps> = ({
  shots,
  currentFrame = DEFAULT_FRAME,
  edit,
  onEditChange,
  onComplete,
}) => {
  // 데코 항목 목록 및 히스토리 관리
  const [decos, setDecos] = useState<DecoItem[]>(edit.decos || []);
  const [history, setHistory] = useState<DecoItem[][]>([edit.decos || []]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);

  // 선택된 데코 항목 ID
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 도구 트레이 탭 ('sticker' | 'text')
  const [activeTab, setActiveTab] = useState<'sticker' | 'text'>('sticker');

  // 스티커 설정
  const [selectedColor, setSelectedColor] = useState<string>(DECO_COLORS[0]);

  // 텍스트 설정
  const [textInput, setTextInput] = useState<string>('');
  const [textColor, setTextColor] = useState<string>(DECO_COLORS[0]);
  const [textFont, setTextFont] = useState<string>('Pretendard');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // 배경 캔버스 이미지 URL (사진+프레임 합성본)
  const [baseBgUrl, setBaseBgUrl] = useState<string | null>(null);

  // 뷰포트 내 프리뷰 컨테이너 및 캔버스 참조
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageScale, setStageScale] = useState<number>(0.25); // 화면 너비에 맞춘 프리뷰 스케일

  // 터치/포인터 제스처 추적용 Ref
  const gestureRef = useRef<{
    isDragging: boolean;
    startPointer: { x: number; y: number };
    startItemPos: { x: number; y: number };
    startScale: number;
    startRot: number;
    pinchStartDist: number;
    pinchStartAngle: number;
  }>({
    isDragging: false,
    startPointer: { x: 0, y: 0 },
    startItemPos: { x: 0, y: 0 },
    startScale: 1,
    startRot: 0,
    pinchStartDist: 0,
    pinchStartAngle: 0,
  });

  // 사진이 없으면 촬영 화면으로 이동
  useEffect(() => {
    if (!shots || shots.length === 0) {
      window.location.hash = '#/capture';
    }
  }, [shots]);

  // 1. 기본 프레임+사진 베이스 이미지 렌더링 (데코 제외한 배경용)
  useEffect(() => {
    if (!shots || shots.length === 0) return;

    let isMounted = true;
    // decos가 없는 상태로 베이스 캔버스 생성
    const baseEdit: EditState = {
      ...edit,
      decos: [],
    };

    composeStrip(shots, baseEdit, currentFrame, 0.35)
      .then((canvas) => {
        if (!isMounted) return;
        setBaseBgUrl(canvas.toDataURL('image/png'));
      })
      .catch((err) => {
        console.warn('베이스 합성 오류:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [shots, currentFrame, edit.filterAll, JSON.stringify(edit.filters)]);

  // 2. 화면 크기 반응형 프리뷰 스케일 계산
  useEffect(() => {
    const updateScale = () => {
      if (!stageRef.current) return;
      const containerWidth = stageRef.current.clientWidth;
      // 컨테이너 너비(보통 300~360px)에 맞춰 1200 너비 스트립 스케일 조정
      const scale = Math.min(0.28, Math.max(0.2, (containerWidth - 32) / CANVAS_WIDTH));
      setStageScale(scale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // 3. 히스토리 기록 (최대 20개 스택)
  const pushHistory = (newDecos: DecoItem[]) => {
    const nextHistory = history.slice(0, historyIdx + 1);
    if (nextHistory.length >= 20) {
      nextHistory.shift();
    }
    nextHistory.push(newDecos);
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
    setDecos(newDecos);
    onEditChange({ ...edit, decos: newDecos });
  };

  // 실행 취소 (Undo)
  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      const prevDecos = history[prevIdx];
      setHistoryIdx(prevIdx);
      setDecos(prevDecos);
      onEditChange({ ...edit, decos: prevDecos });
    }
  };

  // 다시 실행 (Redo)
  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      const nextDecos = history[nextIdx];
      setHistoryIdx(nextIdx);
      setDecos(nextDecos);
      onEditChange({ ...edit, decos: nextDecos });
    }
  };

  // 4. 스티커 캔버스 중앙에 추가
  const handleAddSticker = (sticker: StickerDefinition) => {
    const newItem: DecoItem = {
      id: `deco_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'sticker',
      key: sticker.key,
      color: selectedColor,
      x: 600 + (Math.random() * 80 - 40),
      y: 1800 + (Math.random() * 80 - 40),
      scale: 1,
      rot: 0,
    };

    const nextDecos = [...decos, newItem];
    pushHistory(nextDecos);
    setSelectedId(newItem.id);
  };

  // 5. 텍스트 추가 또는 수정
  const handleAddOrUpdateText = () => {
    if (!textInput.trim()) return;

    if (editingTextId) {
      // 기존 텍스트 수정
      const nextDecos = decos.map((item) => {
        if (item.id === editingTextId) {
          return {
            ...item,
            text: textInput.trim(),
            color: textColor,
            font: textFont,
          };
        }
        return item;
      });
      pushHistory(nextDecos);
      setEditingTextId(null);
      setTextInput('');
    } else {
      // 새 텍스트 추가
      const newItem: DecoItem = {
        id: `deco_text_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'text',
        text: textInput.trim(),
        color: textColor,
        font: textFont,
        x: 600,
        y: 1800,
        scale: 1,
        rot: 0,
      };

      const nextDecos = [...decos, newItem];
      pushHistory(nextDecos);
      setSelectedId(newItem.id);
      setTextInput('');
    }
  };

  // 선택된 항목 삭제
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    const nextDecos = decos.filter((d) => d.id !== selectedId);
    pushHistory(nextDecos);
    setSelectedId(null);
    if (editingTextId === selectedId) {
      setEditingTextId(null);
      setTextInput('');
    }
  };

  // 선택된 항목 복제
  const handleDuplicateSelected = () => {
    const target = decos.find((d) => d.id === selectedId);
    if (!target) return;

    const copyItem: DecoItem = {
      ...target,
      id: `deco_copy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: Math.min(1150, target.x + 40),
      y: Math.min(3550, target.y + 40),
    };

    const nextDecos = [...decos, copyItem];
    pushHistory(nextDecos);
    setSelectedId(copyItem.id);
  };

  // z-index 순서: 앞으로 가져오기
  const handleBringForward = () => {
    if (!selectedId) return;
    const idx = decos.findIndex((d) => d.id === selectedId);
    if (idx === -1 || idx >= decos.length - 1) return;

    const nextDecos = [...decos];
    const temp = nextDecos[idx];
    nextDecos[idx] = nextDecos[idx + 1];
    nextDecos[idx + 1] = temp;
    pushHistory(nextDecos);
  };

  // z-index 순서: 뒤로 보내기
  const handleSendBackward = () => {
    if (!selectedId) return;
    const idx = decos.findIndex((d) => d.id === selectedId);
    if (idx <= 0) return;

    const nextDecos = [...decos];
    const temp = nextDecos[idx];
    nextDecos[idx] = nextDecos[idx - 1];
    nextDecos[idx - 1] = temp;
    pushHistory(nextDecos);
  };

  // 더블탭으로 텍스트 수정 진입
  const handleTextDoubleTap = (item: DecoItem) => {
    if (item.type !== 'text') return;
    setSelectedId(item.id);
    setEditingTextId(item.id);
    setTextInput(item.text || '');
    setTextColor(item.color);
    setTextFont(item.font || 'Pretendard');
    setActiveTab('text');
  };

  // 6. 포인터 이벤트 핸들러 (드래그 및 핀치)
  const handleItemPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    item: DecoItem
  ) => {
    e.stopPropagation();
    setSelectedId(item.id);

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    gestureRef.current = {
      isDragging: true,
      startPointer: { x: e.clientX, y: e.clientY },
      startItemPos: { x: item.x, y: item.y },
      startScale: item.scale,
      startRot: item.rot,
      pinchStartDist: 0,
      pinchStartAngle: 0,
    };
  };

  const handleItemPointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
    item: DecoItem
  ) => {
    if (!gestureRef.current.isDragging || selectedId !== item.id) return;

    const dx = (e.clientX - gestureRef.current.startPointer.x) / stageScale;
    const dy = (e.clientY - gestureRef.current.startPointer.y) / stageScale;

    // 캔버스 밖으로 완전히 나가지 않게 클램프 (0 ~ 1200, 0 ~ 3600)
    const newX = Math.min(1160, Math.max(40, gestureRef.current.startItemPos.x + dx));
    const newY = Math.min(3560, Math.max(40, gestureRef.current.startItemPos.y + dy));

    setDecos((prev) =>
      prev.map((d) => (d.id === item.id ? { ...d, x: Math.round(newX), y: Math.round(newY) } : d))
    );
  };

  const handleItemPointerUp = (
    e: React.PointerEvent<HTMLDivElement>,
    item: DecoItem
  ) => {
    if (gestureRef.current.isDragging && selectedId === item.id) {
      gestureRef.current.isDragging = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // 이미 릴리즈됨
      }
      // 변경 사항 히스토리에 기록
      pushHistory(decos);
    }
  };

  // 모바일 두 손가락 핀치 제스처 처리 (Touch Events)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, item: DecoItem) => {
    if (e.touches.length === 2 && selectedId === item.id) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);

      gestureRef.current.pinchStartDist = dist;
      gestureRef.current.pinchStartAngle = angle;
      gestureRef.current.startScale = item.scale;
      gestureRef.current.startRot = item.rot;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>, item: DecoItem) => {
    if (e.touches.length === 2 && selectedId === item.id) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const curAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);

      if (gestureRef.current.pinchStartDist > 0) {
        const factor = curDist / gestureRef.current.pinchStartDist;
        const newScale = Math.min(3.5, Math.max(0.4, gestureRef.current.startScale * factor));
        const angleDiff = curAngle - gestureRef.current.pinchStartAngle;
        const newRot = gestureRef.current.startRot + angleDiff;

        setDecos((prev) =>
          prev.map((d) =>
            d.id === item.id ? { ...d, scale: newScale, rot: newRot } : d
          )
        );
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2 && gestureRef.current.pinchStartDist > 0) {
      gestureRef.current.pinchStartDist = 0;
      pushHistory(decos);
    }
  };

  // 선택된 항목 크기 조절 (버튼 지원: 모바일/PC 모두 편리하게 사용)
  const handleScaleChange = (delta: number) => {
    if (!selectedId) return;
    const nextDecos = decos.map((d) => {
      if (d.id === selectedId) {
        const nextScale = Math.min(3.5, Math.max(0.4, (d.scale || 1) + delta));
        return { ...d, scale: Number(nextScale.toFixed(2)) };
      }
      return d;
    });
    pushHistory(nextDecos);
  };

  // 선택된 항목 회전 조절 (15도씩)
  const handleRotateStep = (deltaDeg: number) => {
    if (!selectedId) return;
    const deltaRad = (deltaDeg * Math.PI) / 180;
    const nextDecos = decos.map((d) => {
      if (d.id === selectedId) {
        return { ...d, rot: (d.rot || 0) + deltaRad };
      }
      return d;
    });
    pushHistory(nextDecos);
  };

  // 완료 버튼 클릭 시 상위 동기화 후 #/result로 이동
  const handleFinish = () => {
    onEditChange({ ...edit, decos });
    onComplete();
  };

  const selectedItem = decos.find((d) => d.id === selectedId);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-56px)] bg-[#FFF8F3] select-none relative">
      {/* 1. 상단 플로팅 보조 바: 실행취소/다시실행 + 완료 버튼 */}
      <div className="px-4 py-2 border-b border-black/5 bg-white/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIdx <= 0}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-black/10 text-[#222222] disabled:opacity-30 active:scale-95 transition-all shadow-xs"
            title="실행 취소"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-black/10 text-[#222222] disabled:opacity-30 active:scale-95 transition-all shadow-xs"
            title="다시 실행"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-[#222222]/50 ml-1">
            스티커 {decos.length}개
          </span>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          className="h-8 px-4 rounded-full bg-[#FF5C8A] hover:bg-[#E84575] text-white text-xs font-bold flex items-center gap-1 shadow-sm shadow-[#FF5C8A]/30 active:scale-95 transition-all"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>완료</span>
        </button>
      </div>

      {/* 2. 인터랙티브 캔버스 작업 영역 (스크롤 가능) */}
      <div
        ref={stageRef}
        onClick={() => setSelectedId(null)}
        className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center justify-start py-3 px-2 relative min-h-[360px]"
      >
        {/* 네컷 스트립 캔버스 컨테이너 (1200 x 3600 가상 좌표계) */}
        <div
          style={{
            width: `${CANVAS_WIDTH * stageScale}px`,
            height: `${CANVAS_HEIGHT * stageScale}px`,
          }}
          className="relative bg-white shadow-xl rounded-md border border-black/10 overflow-hidden shrink-0 touch-none"
        >
          {/* 베이스 스트립 이미지 (사진 4컷 + 프레임 오버레이) */}
          {baseBgUrl ? (
            <img
              src={baseBgUrl}
              alt="네컷 베이스"
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-xs text-gray-400">
              불러오는 중...
            </div>
          )}

          {/* 데코 아이템 레이어 (SVG 스티커 및 텍스트) */}
          {decos.map((item) => {
            const isSelected = item.id === selectedId;
            const stickerDef =
              item.type === 'sticker'
                ? STICKERS.find((s) => s.key === item.key)
                : null;

            // 1200x3600 가상 좌표 -> 화면 픽셀 좌표 변환
            const screenX = item.x * stageScale;
            const screenY = item.y * stageScale;
            const size = 160 * (item.scale || 1) * stageScale;

            return (
              <div
                key={item.id}
                onPointerDown={(e) => handleItemPointerDown(e, item)}
                onPointerMove={(e) => handleItemPointerMove(e, item)}
                onPointerUp={(e) => handleItemPointerUp(e, item)}
                onTouchStart={(e) => handleTouchStart(e, item)}
                onTouchMove={(e) => handleTouchMove(e, item)}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={() => handleTextDoubleTap(item)}
                style={{
                  left: `${screenX}px`,
                  top: `${screenY}px`,
                  transform: `translate(-50%, -50%) rotate(${item.rot || 0}rad)`,
                  minWidth: '44px',
                  minHeight: '44px',
                }}
                className={`absolute cursor-move select-none flex items-center justify-center p-1.5 transition-shadow ${
                  isSelected
                    ? 'border-2 border-dashed border-[#FF5C8A] ring-2 ring-[#FF5C8A]/30 z-20'
                    : 'border border-transparent hover:border-black/20 z-10'
                }`}
              >
                {/* 1. 스티커 렌더링 */}
                {item.type === 'sticker' && stickerDef && (
                  <svg
                    viewBox={stickerDef.viewBox}
                    style={{ width: `${size}px`, height: `${size}px` }}
                    className="pointer-events-none overflow-visible"
                  >
                    {stickerDef.paths.map((p, pIdx) => (
                      <path
                        key={pIdx}
                        d={p.d}
                        fill={p.fill ? item.color : 'none'}
                        stroke={p.stroke ? item.color : 'none'}
                        strokeWidth={p.strokeWidth || 6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </svg>
                )}

                {/* 2. 텍스트 렌더링 */}
                {item.type === 'text' && (
                  <span
                    style={{
                      color: item.color,
                      fontSize: `${Math.max(12, 48 * (item.scale || 1) * stageScale)}px`,
                      fontFamily: `"${item.font || 'Pretendard'}", sans-serif`,
                      whiteSpace: 'nowrap',
                    }}
                    className="font-bold pointer-events-none drop-shadow-xs"
                  >
                    {item.text}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 선택된 데코 플로팅 조작 바 (삭제, 복제, 순서, 크기/회전) */}
        {selectedItem && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="sticky bottom-2 z-40 bg-[#222222]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2 mt-2 animate-in fade-in zoom-in duration-150"
          >
            {/* 크기 조절 (- / +) */}
            <div className="flex items-center bg-white/10 rounded-lg px-1 py-0.5">
              <button
                type="button"
                onClick={() => handleScaleChange(-0.15)}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold hover:text-[#FF5C8A]"
                title="축소"
              >
                -
              </button>
              <span className="text-[10px] font-mono px-1">
                {Math.round((selectedItem.scale || 1) * 100)}%
              </span>
              <button
                type="button"
                onClick={() => handleScaleChange(0.15)}
                className="w-6 h-6 flex items-center justify-center text-xs font-bold hover:text-[#FF5C8A]"
                title="확대"
              >
                +
              </button>
            </div>

            {/* 15도 회전 */}
            <button
              type="button"
              onClick={() => handleRotateStep(15)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-[#FF5C8A] active:scale-90 transition-transform"
              title="15도 회전"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* 순서: 앞으로 / 뒤로 */}
            <div className="flex items-center gap-0.5 border-l border-white/10 pl-1">
              <button
                type="button"
                onClick={handleBringForward}
                className="p-1 rounded-md hover:bg-white/10"
                title="앞으로 가져오기"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleSendBackward}
                className="p-1 rounded-md hover:bg-white/10"
                title="뒤로 보내기"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 복제 */}
            <button
              type="button"
              onClick={handleDuplicateSelected}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-[#FF5C8A] active:scale-90 transition-transform"
              title="복제"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* 삭제 */}
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 active:scale-90 transition-transform"
              title="삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. 하단 도구 트레이: 스티커 / 텍스트 탭 */}
      <div className="bg-white border-t border-black/8 rounded-t-2xl shadow-xl p-3 shrink-0 z-30">
        {/* 트레이 탭 버튼 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center bg-black/5 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('sticker')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === 'sticker'
                  ? 'bg-[#FF5C8A] text-white shadow-xs'
                  : 'text-[#222222]/60 hover:text-[#222222]'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>스티커 (24종)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === 'text'
                  ? 'bg-[#FF5C8A] text-white shadow-xs'
                  : 'text-[#222222]/60 hover:text-[#222222]'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>텍스트</span>
            </button>
          </div>

          {/* 6종 색상 팔레트 */}
          <div className="flex items-center gap-1.5">
            {DECO_COLORS.map((c) => {
              const isCur =
                activeTab === 'sticker' ? selectedColor === c : textColor === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    if (activeTab === 'sticker') {
                      setSelectedColor(c);
                      if (selectedItem && selectedItem.type === 'sticker') {
                        const next = decos.map((d) =>
                          d.id === selectedId ? { ...d, color: c } : d
                        );
                        pushHistory(next);
                      }
                    } else {
                      setTextColor(c);
                      if (selectedItem && selectedItem.type === 'text') {
                        const next = decos.map((d) =>
                          d.id === selectedId ? { ...d, color: c } : d
                        );
                        pushHistory(next);
                      }
                    }
                  }}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full transition-transform border border-black/10 active:scale-90 ${
                    isCur ? 'scale-125 ring-2 ring-[#FF5C8A] ring-offset-1 shadow-xs' : 'hover:scale-110'
                  }`}
                  title={c}
                />
              );
            })}
          </div>
        </div>

        {/* 탭 내용 1: 스티커 격자 (24종 수제 SVG path) */}
        {activeTab === 'sticker' && (
          <div className="max-h-36 overflow-y-auto no-scrollbar grid grid-cols-6 gap-2 p-1">
            {STICKERS.map((stk) => (
              <button
                key={stk.key}
                type="button"
                onClick={() => handleAddSticker(stk)}
                className="h-12 flex flex-col items-center justify-center p-1 rounded-xl bg-gray-50 hover:bg-[#FFEBF1] active:scale-90 transition-all border border-black/5 group"
                title={`${stk.name} 추가`}
              >
                <svg
                  viewBox={stk.viewBox}
                  className="w-6 h-6 overflow-visible transition-transform group-hover:scale-110"
                >
                  {stk.paths.map((p, idx) => (
                    <path
                      key={idx}
                      d={p.d}
                      fill={p.fill ? selectedColor : 'none'}
                      stroke={p.stroke ? selectedColor : 'none'}
                      strokeWidth={p.strokeWidth || 6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </svg>
                <span className="text-[9px] text-[#222222]/60 mt-0.5 truncate max-w-full">
                  {stk.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 탭 내용 2: 텍스트 입력창 + 폰트 선택 + 추가 버튼 */}
        {activeTab === 'text' && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-150">
            {/* 3종 폰트 선택 */}
            <div className="flex items-center gap-1.5">
              {DECO_FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTextFont(f.id)}
                  style={{ fontFamily: `"${f.id}", sans-serif` }}
                  className={`flex-1 py-1 text-xs rounded-lg border font-bold transition-all ${
                    textFont === f.id
                      ? 'bg-[#222222] text-white border-[#222222]'
                      : 'bg-gray-50 text-[#222222]/70 border-black/5 hover:text-[#222222]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 입력 필드 및 버튼 */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddOrUpdateText();
                }}
                placeholder={
                  editingTextId
                    ? '선택된 텍스트 수정'
                    : '문구를 입력하세요 (더블탭으로 수정)'
                }
                style={{ fontFamily: `"${textFont}", sans-serif`, color: textColor }}
                className="flex-1 h-10 px-3 bg-gray-50 border border-black/10 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#FF5C8A] transition-colors"
                maxLength={25}
              />

              <button
                type="button"
                onClick={handleAddOrUpdateText}
                disabled={!textInput.trim()}
                className="h-10 px-4 bg-[#FF5C8A] hover:bg-[#E84575] disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-xs"
              >
                {editingTextId ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>수정</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>추가</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
