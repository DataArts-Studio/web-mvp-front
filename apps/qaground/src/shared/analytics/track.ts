import { sendGAEvent } from '@next/third-parties/google';

type EventParams = Record<string, string | number | boolean | undefined | null>;

/**
 * GA4 커스텀 이벤트 전송.
 *
 * production 외(로컬·preview)에서는 GoogleAnalytics 스크립트가 로드되지 않으므로
 * dataLayer 로 push 돼도 실제 전송되지 않는다(무해). 개인정보는 보내지 않고,
 * 어떤 챌린지에서 무엇을 제출했는지 같은 비식별 사용 데이터만 수집한다.
 *
 * @example track('issue_submit', { type: 'bug' });
 */
export function track(event: string, params?: EventParams): void {
  if (typeof window === 'undefined') return;
  const clean = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))
    : {};
  sendGAEvent('event', event, clean);
  if (process.env.NODE_ENV === 'development') {
    console.log(`[GA] ${event}`, clean);
  }
}
