/**
 * Sentry helper for API routes (Vercel Serverless Functions).
 *
 * Usage:
 *   import { captureError } from './lib/sentry.js'
 *
 *   try { ... } catch (err) {
 *     captureError(err, { endpoint: '/api/foo', user_id: '...' })
 *     return res.status(500).json({ error: err.message })
 *   }
 */
import * as Sentry from '@sentry/node'

let initialized = false

function init() {
  if (initialized) return
  if (!process.env.SENTRY_DSN) return
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || 'development',
    tracesSampleRate: 0.1,
  })
  initialized = true
}

/**
 * Capture an error with optional context.
 * Safe to call even if Sentry is not configured.
 */
export function captureError(err, context = {}) {
  try {
    init()
    if (!initialized) return
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
      Sentry.captureException(err)
    })
  } catch {
    // Never throw from error-reporting code
  }
}

/**
 * Capture a custom message (warning/info).
 */
export function captureMessage(message, level = 'info', context = {}) {
  try {
    init()
    if (!initialized) return
    Sentry.withScope((scope) => {
      scope.setLevel(level)
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
      Sentry.captureMessage(message)
    })
  } catch {
    // Never throw
  }
}
