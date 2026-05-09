import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!dsn) return;
  Sentry.init({ dsn, tracesSampleRate: 0.1, environment: process.env.NODE_ENV });
}
