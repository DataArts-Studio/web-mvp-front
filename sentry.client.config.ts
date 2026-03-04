import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',

  tracesSampleRate: process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 0.2 : 1.0,

  integrations: (defaults) =>
    defaults.filter((integration) => integration.name !== 'Replay'),

  enabled: process.env.NODE_ENV !== 'development' && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
