// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',

  // Replay는 초기 번들에서 제거 — 아래에서 lazy load
  integrations: (defaults) => defaults.filter((integration) => integration.name !== 'Replay'),

  tracesSampleRate: isProduction ? 0.2 : 1.0,
  replaysSessionSampleRate: isProduction ? 0.1 : 0,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
  sendDefaultPii: true,

  // 브라우저 확장(패스워드 매니저·광고차단·DevTools 등)에서 새는 노이즈는 우리 코드와 무관.
  // Sentry 알림이 더러워지지 않도록 필터링한다.
  ignoreErrors: [
    // chrome.runtime.onMessage listener 가 비동기 응답 반환 전에 채널이 닫혀서 나는 에러.
    // 거의 모든 확장에서 발생.
    /A listener indicated an asynchronous response by returning true/i,
    /The message port closed before a response was received/i,
    // 확장 컨텍스트가 reload 되면서 발생
    /Extension context invalidated/i,
    // ResizeObserver 무한 루프 경고 (사용자 코드 영향 없음, 브라우저 자체 노이즈)
    /ResizeObserver loop (?:limit exceeded|completed with undelivered notifications)/i,
  ],
  denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-(?:web-)?extension:\/\//],

  enabled: process.env.NODE_ENV !== 'development' && !!dsn,
});

// Replay를 lazy load하여 초기 번들 크기 ~200KB 절감
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development' && dsn) {
  Sentry.lazyLoadIntegration('replayIntegration')
    .then((replayIntegration) => {
      Sentry.addIntegration(
        replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        })
      );
    })
    .catch(() => {
      // Replay 로드 실패 시 무시 — 핵심 에러 추적에 영향 없음
    });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
