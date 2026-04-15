import { createClient } from '@supabase/supabase-js'

// Save the initial URL state BEFORE createClient() consumes the hash fragment
// This is critical for invite/recovery flows where tokens arrive via hash
export const INITIAL_URL = {
  hash: window.location.hash,
  search: window.location.search,
  path: window.location.pathname,
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing. Check your .env file.')
}

/**
 * Hybrid storage: localStorage primary + cookie backup.
 *
 * Why: localStorage can be cleared by the browser (privacy mode, "clear data",
 * extensions, OS cleanup tools). The cookie copy lets us recover the session
 * across page loads even if localStorage was wiped, so the user doesn't have
 * to re-authenticate every morning.
 *
 * The cookie is HttpOnly=false (must be readable by JS) and lasts 365 days.
 * It's only used for the session token (not for any other sensitive data).
 */
const COOKIE_PREFIX = 'actero_auth_'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year in seconds

function readCookie(name) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name, value, maxAge) {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

function deleteCookie(name) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

const hybridStorage = {
  getItem: (key) => {
    try {
      const fromLocal = window.localStorage.getItem(key)
      if (fromLocal) return fromLocal
      // Fallback to cookie if localStorage was cleared
      const fromCookie = readCookie(COOKIE_PREFIX + key)
      if (fromCookie) {
        // Restore to localStorage for future reads
        try { window.localStorage.setItem(key, fromCookie) } catch { /* quota or private mode */ }
        return fromCookie
      }
      return null
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try { window.localStorage.setItem(key, value) } catch { /* private mode */ }
    writeCookie(COOKIE_PREFIX + key, value, COOKIE_MAX_AGE)
  },
  removeItem: (key) => {
    try { window.localStorage.removeItem(key) } catch { /* ignore */ }
    deleteCookie(COOKIE_PREFIX + key)
  },
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Stronger refresh token rotation, longer-lived sessions
    storageKey: 'actero-auth',
    storage: hybridStorage,
  },
})
