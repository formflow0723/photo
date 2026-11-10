// 테마 프레임 데이터 및 캔버스 장식 정의

export type FrameType = 'draw' | 'image';
export type FrameCategory = '기념일' | '감성' | '팬덤' | '내 프레임';

export interface FrameData {
  id: string;
  name: string;
  category: FrameCategory;
  type: FrameType;
  bg?: string;
  textColor?: string;
  footerText?: string;
  draw?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  src?: string; // image 타입용 dataURL 또는 이미지 경로
  description?: string;
  createdAt?: number;
}

// 캔버스 및 슬롯 4개 규격 상수
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 3600;
export const SLOT_WIDTH = 1080;
export const SLOT_HEIGHT = 810;

// 4개 슬롯 고정 좌표
export const SLOTS = [
  { x: 60, y: 60 },
  { x: 60, y: 910 },
  { x: 60, y: 1760 },
  { x: 60, y: 2610 },
] as const;

// 시드 고정 난수 생성기
function createPRNG(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 4각 별 그리기 헬퍼
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    const innerAngle = angle + Math.PI / 4;
    const ix = cx + Math.cos(innerAngle) * (r * 0.35);
    const iy = cy + Math.sin(innerAngle) * (r * 0.35);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const FRAMES: FrameData[] = [
  // 1. 미니멀 (감성 - 기본값)
  {
    id: 'minimal',
    name: '미니멀',
    category: '감성',
    type: 'draw',
    bg: '#FFFFFF',
    textColor: '#222222',
    footerText: 'life4cut',
    description: '심플하고 정갈한 클래식 화이트 프레임',
    draw: (ctx, w, h) => {
      const scale = w / 1200;
      // 얇은 회색 테두리만
      ctx.strokeStyle = '#E5E5E5';
      ctx.lineWidth = Math.max(1, 2 * scale);
      const inset = 16 * scale;
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    },
  },

  // 2. 졸업 (기념일)
  {
    id: 'graduation',
    name: '졸업',
    category: '기념일',
    type: 'draw',
    bg: '#0F1E36',
    textColor: '#D4AF37',
    footerText: 'CONGRATULATIONS',
    description: '네이비 톤과 고급스러운 골드 스타 장식',
    draw: (ctx, w, h) => {
      const scale = w / 1200;
      const gold = '#D4AF37';

      // 금색 얇은 테두리
      ctx.save();
      ctx.strokeStyle = gold;
      ctx.lineWidth = Math.max(2, 3 * scale);
      const inset = 24 * scale;
      ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

      // 코너 장식 박스
      const cornerSize = 18 * scale;
      ctx.strokeRect(inset + 4 * scale, inset + 4 * scale, cornerSize, cornerSize);
      ctx.strokeRect(w - inset - cornerSize - 4 * scale, inset + 4 * scale, cornerSize, cornerSize);
      ctx.strokeRect(inset + 4 * scale, h - inset - cornerSize - 4 * scale, cornerSize, cornerSize);
      ctx.strokeRect(w - inset - cornerSize - 4 * scale, h - inset - cornerSize - 4 * scale, cornerSize, cornerSize);

      // 상단 및 하단 골드 스타
      drawStar(ctx, w / 2, 30 * scale, 12 * scale, gold);
      drawStar(ctx, w / 2 - 120 * scale, 30 * scale, 8 * scale, gold);
      drawStar(ctx, w / 2 + 120 * scale, 30 * scale, 8 * scale, gold);

      // 슬롯 간격 여백에 작은 금색 점들
      const gaps = [890 * scale, 1740 * scale, 2590 * scale];
      gaps.forEach((gy) => {
        drawStar(ctx, w / 2, gy, 9 * scale, gold);
        ctx.fillStyle = gold;
        ctx.beginPath();
        ctx.arc(w / 2 - 60 * scale, gy, 2.5 * scale, 0, Math.PI * 2);
        ctx.arc(w / 2 + 60 * scale, gy, 2.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    },
  },

  // 3. 생일 (기념일)
  {
    id: 'birthday',
    name: '생일',
    category: '기념일',
    type: 'draw',
    bg: '#FFEBF1',
    textColor: '#FF5C8A',
    footerText: 'HAPPY BIRTHDAY',
    description: '사랑스러운 연핑크와 파스텔 컨페티 축제',
    draw: (ctx, w, h) => {
      const scale = w / 1200;
      const rng = createPRNG(777); // 고정 시드
      const colors = ['#FF85A1', '#FFC2D1', '#FBB1BD', '#70D6FF', '#FFD166', '#B388EB'];

      ctx.save();

      // 슬롯 바깥 여백 및 틈새에 60개의 컨페티 배치
      for (let i = 0; i < 65; i++) {
        const cx = rng() * w;
        const cy = rng() * h;
        const color = colors[Math.floor(rng() * colors.length)];
        const shape = rng() > 0.5 ? 'circle' : 'triangle';
        const size = (4 + rng() * 8) * scale;

        ctx.fillStyle = color;
        if (shape === 'circle') {
          ctx.beginPath();
          ctx.arc(cx, cy, size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(cx, cy - size);
          ctx.lineTo(cx + size, cy + size);
          ctx.lineTo(cx - size, cy + size);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore();
    },
  },

  // 4. 크리스마스 (기념일)
  {
    id: 'christmas',
    name: '크리스마스',
    category: '기념일',
    type: 'draw',
    bg: '#0F3823',
    textColor: '#FFFFFF',
    footerText: 'MERRY CHRISTMAS',
    description: '딥 그린과 따스한 눈송이, 레드 포인트',
    draw: (ctx, w, h) => {
      const scale = w / 1200;
      const rng = createPRNG(1225); // 크리스마스 고정 시드

      ctx.save();

      // 빨간 하단 띠 (바닥 180px 영역)
      const bottomHeight = 180 * scale;
      ctx.fillStyle = '#C41E3A';
      ctx.fillRect(0, h - bottomHeight, w, bottomHeight);

      // 하단 띠 상단 골드 하이라이트 선
      ctx.fillStyle = '#E5B869';
      ctx.fillRect(0, h - bottomHeight, w, 3 * scale);

      // 흰 눈송이 점들
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let i = 0; i < 70; i++) {
        const x = rng() * w;
        const y = rng() * (h - bottomHeight);
        const radius = (1.5 + rng() * 5.5) * scale;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 상단 테두리 액센트
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(16 * scale, 16 * scale, w - 32 * scale, h - bottomHeight - 24 * scale);

      ctx.restore();
    },
  },

  // 5. 레트로 (감성)
  {
    id: 'retro',
    name: '레트로',
    category: '감성',
    type: 'draw',
    bg: '#FBF6EB',
    textColor: '#4A3525',
    footerText: 'LIFE 4 CUTS 1998',
    description: '빈티지 필름 스프로킷 구멍과 아날로그 감성',
    draw: (ctx, w, h) => {
      const scale = w / 1200;
      ctx.save();

      // 갈색 필름 구멍 무늬를 좌우 가장자리에 반복
      const holeWidth = 26 * scale;
      const holeHeight = 36 * scale;
      const holeRadius = 6 * scale;
      const leftX = (60 * scale - holeWidth) / 2;
      const rightX = w - 60 * scale + leftX;

      ctx.fillStyle = '#4A3525';

      const step = 80 * scale;
      const totalHoles = Math.floor(h / step);

      for (let i = 0; i < totalHoles; i++) {
        const y = i * step + 20 * scale;

        // 좌측 필름 구멍
        ctx.beginPath();
        ctx.roundRect(leftX, y, holeWidth, holeHeight, holeRadius);
        ctx.fill();

        // 우측 필름 구멍
        ctx.beginPath();
        ctx.roundRect(rightX, y, holeWidth, holeHeight, holeRadius);
        ctx.fill();
      }

      // 좌우 필름 구분선
      ctx.strokeStyle = '#D9CFBA';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(60 * scale, 0);
      ctx.lineTo(60 * scale, h);
      ctx.moveTo(w - 60 * scale, 0);
      ctx.lineTo(w - 60 * scale, h);
      ctx.stroke();

      ctx.restore();
    },
  },
];

export const DEFAULT_FRAME = FRAMES[0];
