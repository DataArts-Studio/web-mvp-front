import { sendGTMEvent } from '@next/third-parties/google';

type EventParams = Record<string, string | number | boolean | null | undefined>;

/**
 * GTM dataLayer로 이벤트 전송
 *
 * @example
 * track(GA_EVENTS.LANDING.PROJECT_CREATE_START, { trigger_location: 'landing_hero' });
 * track(GA_EVENTS.ACCESS.SUCCESS, { project_id: slug, time_to_success: 3 });
 */
export function track(eventName: string, params?: EventParams): void {
  if (typeof window === 'undefined') return;

  // undefined/null 파라미터 정리
  const cleanParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
      )
    : {};

  sendGTMEvent({ event: eventName, ...cleanParams });

  // 개발 환경에서 디버깅
  if (process.env.NODE_ENV === 'development') {
    console.log(`[GA] ${eventName}`, cleanParams);
  }
}

/**
 * page_view 이벤트 전송 헬퍼
 *
 * @example
 * trackPageView('Testea - 랜딩', '/', { referrer: document.referrer });
 */
export function trackPageView(
  pageTitle: string,
  pagePath: string,
  extra?: EventParams,
): void {
  track('page_view', {
    page_title: pageTitle,
    page_path: pagePath,
    ...extra,
  });
}
