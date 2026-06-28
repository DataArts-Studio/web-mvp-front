import { isAllowedAnalyticsHost } from '@/shared/analytics/host';
import { sendGAEvent } from '@next/third-parties/google';

type EventParams = Record<string, string | number | boolean | undefined | null>;

/**
 * GA4 커스텀 이벤트 전송.
 * 운영 호스트(qaground.gettestea.com) 밖에서는 이벤트를 전송하지 않는다.
 * 개인정보는 보내지 않고, 어떤 챌린지에서 무엇을 제출했는지 같은 비식별 사용 데이터만 수집한다.
 *
 * @example track('issue_submit', { type: 'bug' });
 */
export function track(event: string, params?: EventParams): void {
  if (typeof window === 'undefined') return;
  const clean = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))
    : {};

  if (process.env.NODE_ENV === 'development') {
    console.log(`[GA] ${event}`, clean);
  }

  if (!isAllowedAnalyticsHost()) return;

  sendGAEvent('event', event, clean);
}
