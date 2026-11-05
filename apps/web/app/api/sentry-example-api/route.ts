import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = 'SentryExampleAPIError';
  }
}

// A faulty API route to test Sentry's error monitoring
export function GET() {
  // 미들웨어도 막지만, 운영 빌드에서는 라우트 자체도 열리지 않게 한다.
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }
  Sentry.logger.info('Sentry example API called');
  throw new SentryExampleAPIError(
    'This error is raised on the backend called by the example page.'
  );
}
