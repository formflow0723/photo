// 24종 수제 SVG path 스티커 라이브러리 및 캔버스 렌더링 헬퍼

export interface StickerDefinition {
  key: string;
  name: string;
  viewBox: string;
  paths: Array<{
    d: string;
    fill?: boolean;
    stroke?: boolean;
    strokeWidth?: number;
  }>;
}

export const DECO_COLORS = [
  '#FF5C8A', // 시그니처 핑크
  '#FFB703', // 선셋 옐로우
  '#8338EC', // 비비드 퍼플
  '#3A86FF', // 스카이 블루
  '#06D6A0', // 민트 그린
  '#222222', // 차콜 블랙
] as const;

export const DECO_FONTS = [
  { id: 'Pretendard', label: '기본 고딕' },
  { id: 'Nanum Pen Script', label: '손글씨' },
  { id: 'Black Han Sans', label: '굵은 타이틀' },
] as const;

export const STICKERS: StickerDefinition[] = [
  // 1. 하트 클래식
  {
    key: 'heart-classic',
    name: '하트',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 85 C20 60 5 40 5 24 C5 10 16 0 30 0 C38 0 45 4 50 12 C55 4 62 0 70 0 C84 0 95 10 95 24 C95 40 80 60 50 85 Z', fill: true },
    ],
  },
  // 2. 하트 아웃라인
  {
    key: 'heart-outline',
    name: '하트 라인',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 82 C22 58 8 38 8 23 C8 11 18 2 31 2 C39 2 46 6 50 14 C54 6 61 2 69 2 C82 2 92 11 92 23 C92 38 78 58 50 82 Z', stroke: true, strokeWidth: 8 },
    ],
  },
  // 3. 반짝이 하트
  {
    key: 'heart-sparkle',
    name: '스파클 하트',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M46 80 C18 56 6 38 6 24 C6 12 16 3 28 3 C36 3 42 7 46 14 C50 7 56 3 64 3 C76 3 86 12 86 24 C86 38 74 56 46 80 Z', fill: true },
      { d: 'M80 65 Q85 75 95 80 Q85 85 80 95 Q75 85 65 80 Q75 75 80 65 Z', fill: true },
    ],
  },
  // 4. 별 클래식
  {
    key: 'star-classic',
    name: '별',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 5 L63 35 L96 38 L71 60 L78 92 L50 75 L22 92 L29 60 L4 38 L37 35 Z', fill: true },
    ],
  },
  // 5. 4각 별 (Y2K)
  {
    key: 'star-4point',
    name: '4각 별',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 0 Q50 50 100 50 Q50 50 50 100 Q50 50 0 50 Q50 50 50 0 Z', fill: true },
    ],
  },
  // 6. 반짝이는 별무리
  {
    key: 'star-burst',
    name: '반짝별',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 5 Q50 50 95 50 Q50 50 50 95 Q50 50 5 50 Q50 50 50 5 Z', fill: true },
      { d: 'M25 25 Q35 35 35 45 Q35 35 45 25 Q35 25 25 25 Z', fill: true },
    ],
  },
  // 7. 싱글 글린트
  {
    key: 'sparkle-single',
    name: '글린트',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 0 L56 44 L100 50 L56 56 L50 100 L44 56 L0 50 L44 44 Z', fill: true },
    ],
  },
  // 8. 스파클 클러스터
  {
    key: 'sparkle-cluster',
    name: '스파클',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M35 10 Q35 35 60 35 Q35 35 35 60 Q35 35 10 35 Q35 35 35 10 Z', fill: true },
      { d: 'M75 55 Q75 70 90 70 Q75 70 75 85 Q75 70 60 70 Q75 70 75 55 Z', fill: true },
      { d: 'M70 15 Q70 23 78 23 Q70 23 70 31 Q70 23 62 23 Q70 23 70 15 Z', fill: true },
    ],
  },
  // 9. 다이아몬드 크로스
  {
    key: 'sparkle-cross',
    name: '다이아몬드',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 10 L75 50 L50 90 L25 50 Z', stroke: true, strokeWidth: 8 },
      { d: 'M50 30 L62 50 L50 70 L38 50 Z', fill: true },
    ],
  },
  // 10. 리본 보우
  {
    key: 'ribbon-bow',
    name: '리본',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 45 C35 20 10 25 12 50 C14 65 35 55 50 48 Z', fill: true },
      { d: 'M50 45 C65 20 90 25 88 50 C86 65 65 55 50 48 Z', fill: true },
      { d: 'M50 42 C45 42 42 46 42 50 C42 55 45 58 50 58 C55 58 58 55 58 50 C58 46 55 42 50 42 Z', fill: true },
      { d: 'M45 52 Q35 75 25 90 Q40 82 48 60 Z', fill: true },
      { d: 'M55 52 Q65 75 75 90 Q60 82 52 60 Z', fill: true },
    ],
  },
  // 11. 컬리 리본
  {
    key: 'ribbon-curly',
    name: '웨이브 리본',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M15 25 Q35 15 50 30 Q65 45 85 35 Q90 50 75 60 Q55 45 40 65 Q25 85 10 75 Q15 50 15 25 Z', stroke: true, strokeWidth: 8 },
    ],
  },
  // 12. 데이지 꽃
  {
    key: 'flower-daisy',
    name: '데이지',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 35 C42 15 58 15 50 35 Z M65 50 C85 42 85 58 65 50 Z M50 65 C58 85 42 85 50 65 Z M35 50 C15 58 15 42 35 50 Z M60 38 C75 25 82 38 60 38 Z M60 62 C82 62 75 75 60 62 Z M40 62 C25 75 18 62 40 62 Z M40 38 C18 38 25 25 40 38 Z', fill: true },
      { d: 'M50 40 A10 10 0 1 0 50 60 A10 10 0 1 0 50 40 Z', stroke: true, strokeWidth: 5 },
    ],
  },
  // 13. 벚꽃
  {
    key: 'flower-cherry',
    name: '벚꽃',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 45 C45 20 55 20 50 45 Z', stroke: true, strokeWidth: 10 },
      { d: 'M50 40 C40 10 60 10 50 40 C75 25 85 45 55 48 C85 60 70 80 50 55 C30 80 15 60 45 48 C15 45 25 25 50 40 Z', fill: true },
    ],
  },
  // 14. 말풍선
  {
    key: 'speech-bubble',
    name: '말풍선',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M15 20 H85 C90 20 95 25 95 30 V65 C95 70 90 75 85 75 H35 L15 90 V75 H15 C10 75 5 70 5 65 V30 C5 25 10 20 15 20 Z', stroke: true, strokeWidth: 7 },
    ],
  },
  // 15. 하트 말풍선
  {
    key: 'speech-heart',
    name: '하트 말풍선',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M15 15 H85 C90 15 95 20 95 25 V60 C95 65 90 70 85 70 H30 L15 85 V70 H15 C10 70 5 65 5 60 V25 C5 20 10 15 15 15 Z', fill: true },
      { d: 'M50 52 C38 42 32 34 32 28 C32 23 36 19 41 19 C44 19 48 21 50 24 C52 21 56 19 59 19 C64 19 68 23 68 28 C68 34 62 42 50 52 Z', stroke: true, strokeWidth: 5 },
    ],
  },
  // 16. 마스킹 테이프
  {
    key: 'tape-washi',
    name: '테이프',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M5 35 L12 40 L5 45 L12 50 L5 55 L12 60 L5 65 H95 L88 60 L95 55 L88 50 L95 45 L88 40 L95 35 Z', fill: true },
    ],
  },
  // 17. 코너 테이프
  {
    key: 'tape-corner',
    name: '코너 테이프',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M10 50 L50 10 L80 40 L40 80 Z', fill: true },
    ],
  },
  // 18. 왕관
  {
    key: 'crown-royal',
    name: '왕관',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M10 75 L15 35 L38 55 L50 20 L62 55 L85 35 L90 75 Z', fill: true },
      { d: 'M10 78 H90 V85 H10 Z', fill: true },
    ],
  },
  // 19. 구름
  {
    key: 'cloud-fluffy',
    name: '구름',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M25 70 H75 C85 70 92 62 92 52 C92 43 85 36 76 35 C74 24 64 16 52 16 C42 16 33 22 29 32 C21 33 15 40 15 48 C15 58 22 70 25 70 Z', fill: true },
    ],
  },
  // 20. 번개
  {
    key: 'lightning-bolt',
    name: '번개',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M55 5 L20 52 H48 L40 95 L80 42 H52 Z', fill: true },
    ],
  },
  // 21. 네잎클로버
  {
    key: 'clover-lucky',
    name: '클로버',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 50 C38 32 30 15 50 15 C70 15 62 32 50 50 Z', fill: true },
      { d: 'M50 50 C68 38 85 30 85 50 C85 70 68 62 50 50 Z', fill: true },
      { d: 'M50 50 C62 68 70 85 50 85 C30 85 38 68 50 50 Z', fill: true },
      { d: 'M50 50 C32 62 15 70 15 50 C15 30 32 38 50 50 Z', fill: true },
      { d: 'M50 50 Q48 85 30 95', stroke: true, strokeWidth: 5 },
    ],
  },
  // 22. 체리
  {
    key: 'cherry-pair',
    name: '체리',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M30 75 A18 18 0 1 0 30 40 A18 18 0 1 0 30 75 Z', fill: true },
      { d: 'M70 70 A18 18 0 1 0 70 35 A18 18 0 1 0 70 70 Z', fill: true },
      { d: 'M30 45 Q40 20 60 15 Q65 30 70 40', stroke: true, strokeWidth: 5 },
      { d: 'M60 15 Q75 10 82 20 Q70 25 60 15 Z', fill: true },
    ],
  },
  // 23. 천사 날개
  {
    key: 'wings-pair',
    name: '천사 날개',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M48 50 C30 20 5 35 10 65 C20 70 30 65 35 60 C38 68 45 60 48 50 Z', fill: true },
      { d: 'M52 50 C70 20 95 35 90 65 C80 70 70 65 65 60 C62 68 55 60 52 50 Z', fill: true },
    ],
  },
  // 24. 나비
  {
    key: 'butterfly',
    name: '나비',
    viewBox: '0 0 100 100',
    paths: [
      { d: 'M50 45 C35 15 10 25 15 55 C25 65 40 55 50 48 Z', fill: true },
      { d: 'M50 45 C65 15 90 25 85 55 C75 65 60 55 50 48 Z', fill: true },
      { d: 'M50 50 C40 60 25 75 35 85 C45 85 48 70 50 50 Z', fill: true },
      { d: 'M50 50 C60 60 75 75 65 85 C55 85 52 70 50 50 Z', fill: true },
      { d: 'M50 35 V65', stroke: true, strokeWidth: 4 },
    ],
  },
];

// 캔버스에 스티커 렌더링 함수
export function drawStickerOnCanvas(
  ctx: CanvasRenderingContext2D,
  sticker: StickerDefinition,
  color: string,
  targetSize: number
) {
  ctx.save();
  // 100x100 viewBox 기준 변환
  const s = targetSize / 100;
  ctx.scale(s, s);
  ctx.translate(-50, -50);

  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  for (const p of sticker.paths) {
    const path2d = new Path2D(p.d);
    if (p.fill) {
      ctx.fill(path2d);
    }
    if (p.stroke) {
      ctx.lineWidth = p.strokeWidth || 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(path2d);
    }
  }

  ctx.restore();
}
