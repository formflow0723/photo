import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Upload, AlertCircle, Sparkles, Smile, ShieldCheck } from 'lucide-react';
import { ShotItem } from '../types.ts';
import { track } from '../utils/analytics.ts';

// 저장 시 좌우 반전(미러링) 적용 여부 상수
const MIRROR_SAVED = true;

interface ShootViewProps {
  onCompleteShooting: (shots: ShotItem[]) => void;
  onShootingStateChange?: (isShooting: boolean) => void;
}

export const ShootView: React.FC<ShootViewProps> = ({ onCompleteShooting, onShootingStateChange }) => {
  // DOM 및 스트림 참조
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const virtualAnimRef = useRef<number | null>(null);

  // 화면 상태 관리
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVirtualCamera, setIsVirtualCamera] = useState<boolean>(false);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cutCount, setCutCount] = useState<number>(0);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [shots, setShots] = useState<ShotItem[]>([]);

  // 1. 카메라 시작 함수
  const startCamera = async () => {
    setCameraError(null);
    setIsVirtualCamera(false);
    stopVirtualAnimation();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('이 브라우저는 카메라 API를 지원하지 않습니다.');
      }

      // 전면 카메라 ideal 1280x960 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      // 권한 거부 또는 장치 없음 시 경고 처리 및 안내 상태 전환
      console.warn('카메라 접근 권한 확인 필요:', err);
      setCameraError('카메라 권한이 거부되었거나 지원하지 않는 환경입니다.');
    }
  };

  // 1-1. 가상 카메라 시작 함수 (체험 및 권한 거부 시 대체 뷰)
  const startVirtualCamera = () => {
    stopCamera();
    setCameraError(null);
    setIsVirtualCamera(true);

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;
    const poses = [
      { text: '✌️ 브이 포즈', sub: '손가락으로 귀엽게 브이!' },
      { text: '🫶 볼 하트', sub: '두 손으로 볼에 하트를 만들어봐요' },
      { text: '😎 윙크 & 미소', sub: '자연스러운 눈맞춤과 윙크' },
      { text: '🎉 활짝 웃기', sub: '제일 행복한 순간을 기록해요' },
    ];

    const renderVirtualFeed = () => {
      tick++;
      // 스튜디오 배경 그라데이션
      const grad = ctx.createLinearGradient(0, 0, 1280, 960);
      grad.addColorStop(0, '#FFEBF1');
      grad.addColorStop(0.5, '#FFF4EB');
      grad.addColorStop(1, '#FFE8F0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 960);

      // 장식 패턴
      ctx.fillStyle = 'rgba(255, 92, 138, 0.08)';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(200 * i + 100, 150 + Math.sin(tick * 0.03 + i) * 30, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      const bounce = Math.sin(tick * 0.06) * 12;

      // 귀여운 캐릭터 얼굴
      ctx.fillStyle = '#FFE0BD';
      ctx.beginPath();
      ctx.arc(640, 420 + bounce, 170, 0, Math.PI * 2);
      ctx.fill();

      // 볼터치
      ctx.fillStyle = 'rgba(255, 92, 138, 0.45)';
      ctx.beginPath();
      ctx.arc(540, 460 + bounce, 36, 0, Math.PI * 2);
      ctx.arc(740, 460 + bounce, 36, 0, Math.PI * 2);
      ctx.fill();

      // 눈
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.arc(570, 400 + bounce, 14, 0, Math.PI * 2);
      ctx.arc(710, 400 + bounce, 14, 0, Math.PI * 2);
      ctx.fill();

      // 입 (미소)
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#222222';
      ctx.beginPath();
      ctx.arc(640, 440 + bounce, 45, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();

      // 손 제스처 (포즈)
      const handY = Math.sin(tick * 0.1) * 22;
      ctx.fillStyle = '#FFE0BD';
      ctx.beginPath();
      ctx.arc(860, 450 + handY, 55, 0, Math.PI * 2);
      ctx.fill();

      // 현재 포즈 텍스트
      const currentPose = poses[cutCount % 4];
      ctx.fillStyle = '#FF5C8A';
      ctx.font = 'bold 42px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentPose.text, 640, 740);

      ctx.fillStyle = 'rgba(34, 34, 34, 0.6)';
      ctx.font = '26px Pretendard, sans-serif';
      ctx.fillText(currentPose.sub, 640, 800);

      ctx.fillStyle = 'rgba(255, 92, 138, 0.8)';
      ctx.font = 'bold 22px Pretendard, sans-serif';
      ctx.fillText('인생4컷 VIRTUAL STUDIO LIVE', 640, 860);

      virtualAnimRef.current = requestAnimationFrame(renderVirtualFeed);
    };

    renderVirtualFeed();

    // 캔버스 스트림을 비디오 엘리먼트에 주입
    if (canvas.captureStream) {
      const stream = canvas.captureStream(30);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const stopVirtualAnimation = () => {
    if (virtualAnimRef.current) {
      cancelAnimationFrame(virtualAnimRef.current);
      virtualAnimRef.current = null;
    }
  };

  // 2. 카메라 중지 함수
  const stopCamera = () => {
    stopVirtualAnimation();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // 3. 단일 컷 캡처 함수 (Canvas -> Blob)
  const captureShot = async (): Promise<ShotItem | null> => {
    const video = videoRef.current;
    if (!video) return null;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 960;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 저장 시 미러링 적용
    if (MIRROR_SAVED) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // dataURL이 아닌 Blob으로 보관
    return new Promise<ShotItem | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const previewUrl = URL.createObjectURL(blob);
          resolve({ blob, previewUrl });
        },
        'image/jpeg',
        0.95
      );
    });
  };

  // 4. 4컷 연속 촬영 시퀀스 실행 함수
  const runSequence = async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsShooting(true);
    onShootingStateChange?.(true);
    setCutCount(0);
    setShots([]);

    const capturedShots: ShotItem[] = [];

    // 대기 보조 함수
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), ms);
        if (!isRunningRef.current) clearTimeout(timer);
      });

    for (let cut = 1; cut <= 4; cut++) {
      if (!isRunningRef.current) break;

      // 3초 카운트다운
      for (let sec = 3; sec >= 1; sec--) {
        if (!isRunningRef.current) break;
        setCountdown(sec);
        await sleep(1000);
      }
      setCountdown(null);

      if (!isRunningRef.current) break;

      // 셔터 효과: 흰색 플래시 0.2초
      setFlashActive(true);
      const shot = await captureShot();
      await sleep(200);
      setFlashActive(false);

      if (shot) {
        capturedShots.push(shot);
        setShots([...capturedShots]);
        setCutCount(cut);
      }

      // 마지막 컷이 아니면 컷 사이 간격 대기
      if (cut < 4 && isRunningRef.current) {
        await sleep(1000);
      }
    }

    // 4컷 완료 시 결과 화면으로 이동
    if (isRunningRef.current && capturedShots.length === 4) {
      stopCamera();
      isRunningRef.current = false;
      setIsShooting(false);
      onShootingStateChange?.(false);
      track('capture_complete');
      onCompleteShooting(capturedShots);
      window.location.hash = '#/result';
    } else {
      isRunningRef.current = false;
      setIsShooting(false);
      onShootingStateChange?.(false);
      setCountdown(null);
    }
  };

  // 촬영 취소
  const cancelSequence = () => {
    isRunningRef.current = false;
    setIsShooting(false);
    onShootingStateChange?.(false);
    setCountdown(null);
    setCutCount(0);
  };

  // 대체 사진 불러오기 (파일 선택)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).slice(0, 4);
    const newShots: ShotItem[] = fileList.map((file) => ({
      blob: file,
      previewUrl: URL.createObjectURL(file),
    }));

    if (newShots.length > 0) {
      while (newShots.length < 4) {
        newShots.push(newShots[0]);
      }
      stopCamera();
      onCompleteShooting(newShots);
      window.location.hash = '#/result';
    }
  };

  // 화면 진입 시 카메라 시작, 화면 벗어날 때 스트림 정리
  useEffect(() => {
    startCamera();
    return () => {
      isRunningRef.current = false;
      stopCamera();
      onShootingStateChange?.(false);
    };
  }, []);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-56px-64px)] justify-between py-3 px-4 pb-6 bg-[#1A181B] text-white select-none">
      {/* 숨김 파일 입력창 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 상단 진행 표시 (0/4 -> 4/4) */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2 bg-black/50 px-3.5 py-1.5 rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#FF5C8A] animate-ping" />
          <span className="text-xs font-bold text-white tracking-wide">
            진행 상태 <span className="text-[#FF5C8A] font-mono text-sm ml-1">{cutCount}/4</span>
          </span>
        </div>

        {/* 모드 표시 태그 */}
        <span className="text-[10px] font-medium text-white/70 bg-white/10 px-2 py-1 rounded-md flex items-center gap-1">
          {isVirtualCamera ? (
            <>
              <Sparkles className="w-3 h-3 text-[#FF5C8A]" />
              <span>가상 스튜디오</span>
            </>
          ) : (
            <span>전면 4:3 미러링</span>
          )}
        </span>
      </div>

      {/* 카메라 미리보기 영역 (4:3 고정, 미러링) */}
      <div className="relative w-full aspect-[4/3] bg-[#2A272D] rounded-[16px] border border-white/15 overflow-hidden flex items-center justify-center shadow-2xl">
        {/* 카메라 비디오 엘리먼트 (autoplay, muted, playsinline, 좌우 반전) */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-300 ${cameraError ? 'opacity-0' : 'opacity-100'}`}
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* 카메라 권한 거부/오류 시 대체 안내 UI */}
        {cameraError && (
          <div className="absolute inset-0 bg-[#242127]/95 p-4 flex flex-col items-center justify-center text-center gap-2.5 z-20">
            <div className="w-11 h-11 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white mb-0.5">카메라 연결을 대기 중입니다</p>
              <p className="text-[11px] text-white/60 leading-relaxed max-w-[260px]">
                {cameraError} 주소창의 카메라 권한을 허용하거나 아래 체험 모드로 바로 촬영해보세요.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 w-full max-w-[250px] mt-1">
              {/* 가상 카메라 체험 버튼 */}
              <button
                type="button"
                onClick={startVirtualCamera}
                className="w-full py-2 bg-[#FF5C8A] hover:bg-[#E84575] active:scale-95 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#FF5C8A]/30 transition-all text-white"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>체험용 가상 카메라 사용</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={startCamera}
                  className="py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors text-white"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>다시 시도</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors text-white"
                >
                  <Upload className="w-3 h-3" />
                  <span>사진 불러오기</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 셔터 플래시 효과 (0.2초) */}
        {flashActive && (
          <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200 pointer-events-none" />
        )}

        {/* 3초 카운트다운 숫자 표시 */}
        {countdown !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
            <span className="text-8xl font-black text-white drop-shadow-2xl animate-pulse font-mono">
              {countdown}
            </span>
          </div>
        )}

        {/* 뷰파인더 3분할 안내선 */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-white" />
          <div className="border-r border-white" />
          <div />
        </div>

        {/* 우측 상단 실시간 촬영 컷 썸네일 스트립 */}
        <div className="absolute right-2 top-2 bottom-2 w-8 bg-black/60 rounded-lg p-1 flex flex-col justify-between border border-white/10 z-10">
          {[0, 1, 2, 3].map((index) => {
            const hasShot = shots[index];
            return (
              <div
                key={index}
                className={`w-full flex-1 rounded-sm my-0.5 overflow-hidden flex items-center justify-center transition-all ${
                  hasShot
                    ? 'border border-[#FF5C8A] bg-black'
                    : 'bg-white/10 text-white/30 text-[9px] font-bold'
                }`}
              >
                {hasShot ? (
                  <img
                    src={hasShot.previewUrl}
                    alt={`컷 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  index + 1
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 컨트롤 영역: 촬영 중에는 취소 버튼만 표시 */}
      <div className="flex flex-col items-center gap-3 pt-2">
        {isShooting ? (
          /* 촬영 중: "취소" 버튼만 표시 */
          <div className="w-full flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={cancelSequence}
              className="w-full h-[52px] bg-white/15 hover:bg-white/25 active:scale-[0.98] text-white font-bold text-base rounded-[16px] flex items-center justify-center gap-2 border border-white/20 transition-all"
            >
              <X className="w-5 h-5" />
              <span>촬영 취소</span>
            </button>
            <p className="text-[11px] text-white/60 animate-pulse">
              3초 간격으로 4컷이 연속 촬영됩니다
            </p>
          </div>
        ) : (
          /* 대기 상태: "촬영 시작" 버튼 */
          <div className="w-full flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={runSequence}
              disabled={!!cameraError}
              className="w-full h-[52px] bg-[#FF5C8A] hover:bg-[#E84575] disabled:opacity-50 active:scale-[0.98] text-white font-bold text-base rounded-[16px] flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C8A]/30 transition-all"
            >
              <Camera className="w-5 h-5 stroke-[2.2]" />
              <span>촬영 시작 (4컷 자동)</span>
            </button>
            <p className="text-[11px] text-white/50 text-center">
              버튼을 누르면 3초 카운트다운 후 촬영이 시작됩니다
            </p>
            {/* 개인정보 보호 안내 문구 */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] text-white/70">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF5C8A] shrink-0" />
              <span>사진은 이 기기 안에서만 처리돼요. 서버로 보내지 않아요.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
