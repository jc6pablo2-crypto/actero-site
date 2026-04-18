import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import { initTheme } from './lib/theme'
import { initAnalytics } from './lib/analytics'

// Apply stored / system theme before React mounts to avoid flash of wrong theme
initTheme()

// Initialize Sentry (error tracking + performance monitoring)
// Only enabled in production to avoid noise in local dev
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1, // 10% of transactions
    replaysSessionSampleRate: 0.0, // Session replay disabled by default (Amplitude handles it)
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
  })
  // Expose Sentry globally so ErrorBoundary can report errors
  window.Sentry = Sentry
}

// Initialize Amplitude Analytics + Session Replay (client-side only, once per lifecycle).
// Canonical init path lives in src/lib/analytics.ts — this call just wires it up.
initAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
