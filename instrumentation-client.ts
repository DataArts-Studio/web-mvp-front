// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',

  // Replay는 초기 번들에서 제거 — 아래에서 lazy load
  integrations: (defaults) =>
    defaults.filter((integration) => integration.name !== 'Replay'),

  tracesSampleRate: isProduction ? 0.2 : 1.0,
  enableLogs: true,
  sendDefaultPii: true,

  enabled: process.env.NODE_ENV !== 'development' && !!dsn,
});

// Replay를 lazy load하여 초기 번들 크기 ~200KB 절감
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development' && dsn) {
  Sentry.lazyLoadIntegration('replayIntegration').then((replayIntegration) => {
    Sentry.addIntegration(replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }));
  }).catch(() => {
    // Replay 로드 실패 시 무시 — 핵심 에러 추적에 영향 없음
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
