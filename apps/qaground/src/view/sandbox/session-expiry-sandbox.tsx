'use client';

import { useState } from 'react';

/**
 * 세션 만료 샌드박스 (테스트 대상).
 * - 로그인 → 만료 시뮬레이트 → 만료 배너 → 재로그인의 상태 전이를 검증한다.
 */
export const SessionExpirySandbox = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [expired, setExpired] = useState(false);

  const btn =
    'bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors';

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 flex w-full max-w-sm flex-col gap-4 rounded-2xl border p-8">
        <h1 className="text-xl font-bold">세션 관리</h1>
        {!loggedIn ? (
          <button
            data-testid="login-btn"
            className={btn}
            onClick={() => {
              setLoggedIn(true);
              setExpired(false);
            }}
          >
            로그인
          </button>
        ) : expired ? (
          <>
            <p
              data-testid="expired-banner"
              role="alert"
              className="border-system-red/30 bg-system-red/10 text-system-red rounded-xl border px-4 py-3 text-sm"
            >
              세션이 만료되었습니다. 다시 로그인해 주세요.
            </p>
            <button data-testid="relogin-btn" className={btn} onClick={() => setExpired(false)}>
              다시 로그인
            </button>
          </>
        ) : (
          <>
            <p
              data-testid="session-status"
              className="border-primary/30 bg-primary/10 text-primary rounded-xl border px-4 py-3 text-sm font-medium"
            >
              로그인 상태입니다.
            </p>
            <button data-testid="expire-btn" className={btn} onClick={() => setExpired(true)}>
              세션 만료 시뮬레이트
            </button>
          </>
        )}
      </div>
    </main>
  );
};
