// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring — znížené z 10% na 1% kvôli Vercel free tier limitom
  tracesSampleRate: 0.01,

  // Session Replay — VYPNUTÉ kvôli Vercel bandwidth a function invocation limitom
  // Replay dáta prechádzali cez /monitoring tunnel = serverless function invocations
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Enable in production and allow testing in development with SENTRY_DEBUG env
  enabled: process.env.NODE_ENV === 'production' || (process.env.NEXT_PUBLIC_SENTRY_DSN?.length ?? 0) > 0,

  // Filter out known non-issues
  ignoreErrors: [
    // Browser extensions
    'ResizeObserver loop',
    'Non-Error promise rejection',
    // React hydration errors (caused by browser extensions, translators, etc.)
    /removeChild/,
    /insertBefore/,
    /appendChild/,
    /Hydration failed/,
    /There was an error while hydrating/,
    /Minified React error #418/,
    /Minified React error #423/,
    // Network errors
    'Failed to fetch',
    'NetworkError',
    'Load failed',
    // User cancellations
    'AbortError',
    // Microsoft Clarity - third-party analytics script errors (iOS Safari race condition)
    /usedContainerScopedDefaults/,
    /clarity\.js/,
  ],

  // Ignore errors from third-party scripts
  denyUrls: [
    // Microsoft Clarity
    /clarity\.ms/i,
    /clarity\.js/i,
    // Google Analytics / GTM
    /gtag/i,
    /googletagmanager\.com/i,
  ],

  // Integrations — replayIntegration ODSTRÁNENÁ kvôli Vercel limitom
  // (replay SDK pridával ~36 KB gzip do bundlu + generoval kontinuálny stream dát)
  integrations: [],
});
