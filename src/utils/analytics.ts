// 인생4컷 통합 이벤트 추적 함수 (console.log + localStorage 카운터 집계)
export type AnalyticsEvent =
  | 'onboarding_done'
  | 'capture_complete'
  | 'save'
  | 'share'
  | 'ai_frame_generate'
  | 'ai_frame_use';

export interface AnalyticsProps {
  [key: string]: string | number | boolean | undefined;
}

const STORAGE_KEY = 'life4cut_analytics_counts';

/**
 * 이벤트 기록 함수
 * - 콘솔 출력과 localStorage 카운터로 저장 (추후 분석 도구 연동 가능)
 * - 개인 사진이나 사용자 텍스트 내용은 절대 기록하지 않음
 */
export function track(eventName: AnalyticsEvent | string, props?: AnalyticsProps) {
  // 1. 개발 콘솔 출력
  console.log(`[Life4Cuts Analytics] ${eventName}`, props || {});

  // 2. localStorage 카운터 집계
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const counts = raw ? JSON.parse(raw) : {};
    counts[eventName] = (counts[eventName] || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch (err) {
    console.warn('Analytics 카운터 저장 실패:', err);
  }
}
