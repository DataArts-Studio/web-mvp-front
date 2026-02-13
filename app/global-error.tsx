'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body style={{ margin: 0, backgroundColor: '#0c0d0e', color: '#ffffff', fontFamily: 'Pretendard, sans-serif' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          {/* Background 500 */}
          <p
            style={{
              position: 'absolute',
              fontSize: 'clamp(120px, 20vw, 300px)',
              fontWeight: 700,
              color: '#063f2e',
              userSelect: 'none',
              pointerEvents: 'none',
              margin: 0,
              lineHeight: 1.4,
            }}
            aria-hidden="true"
          >
            500
          </p>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1
              style={{
                fontSize: 'clamp(24px, 5vw, 48px)',
                fontWeight: 700,
                marginBottom: '12px',
                lineHeight: 1.4,
              }}
            >
              앗! 심각한 오류가 발생했어요.
            </h1>
            <p
              style={{
                fontSize: 'clamp(14px, 2vw, 20px)',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '24px',
                lineHeight: 1.4,
              }}
            >
              페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  backgroundColor: '#0BB57F',
                  color: '#0c0d0e',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                다시 시도
              </button>
              <a
                href="/"
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid #2B2D31',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                홈으로 돌아가기
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
