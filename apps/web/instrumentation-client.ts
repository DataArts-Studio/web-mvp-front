// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import { onFirstInteraction } from '@/shared/lib/defer/on-first-interaction';
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
  // IP·요청 헤더 같은 식별 정보는 보내지 않는다.
  sendDefaultPii: false,

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

/** 랜딩(`/`, `/en`, `/ko`). 처음 방문자가 가장 많이 들어오는 화면이라 첫 몇 초를 가볍게 둔다. */
const LANDING_PATH = /^\/(?:en|ko)?\/?$/;
/** 랜딩에서 첫 상호작용이 없을 때 Replay 를 로드하기까지 기다리는 시간. */
const LANDING_REPLAY_FALLBACK_MS = 8000;

// Replay를 lazy load하여 초기 번들 크기 ~200KB 절감
const loadReplay = () =>
  Sentry.lazyLoadIntegration('replayIntegration')
    .then((replayIntegration) => {
      Sentry.addIntegration(
        // 비공개 프로젝트 화면(케이스 내용 등)이 외부로 나가지 않도록 텍스트·입력·미디어를 가린다.
        replayIntegration({
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
        })
      );
    })
    .catch(() => {
      // Replay 로드 실패 시 무시 — 핵심 에러 추적에 영향 없음
    });

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development' && dsn) {
  // 랜딩에서는 Replay 로드(스크립트 실행 약 250ms)를 첫 상호작용 뒤로 미룬다.
  // 그 전에 난 오류는 Replay 없이 이벤트만 남는다. 다른 화면은 지금처럼 바로 로드한다.
  if (LANDING_PATH.test(window.location.pathname)) {
    onFirstInteraction(loadReplay, LANDING_REPLAY_FALLBACK_MS);
  } else {
    void loadReplay();
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
