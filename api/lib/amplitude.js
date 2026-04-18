/**
 * Amplitude server-side event shipper — HTTP API v2.
 *
 * Used by the automation engine (api/engine/logger.js) to fire events that
 * happen OFF the browser (Ticket Resolved / Ticket Escalated). A client-side
 * track from the dashboard would lag (events appear only once the user opens
 * the feed) and would be attributed to the admin viewing the dashboard rather
 * than the end-user / client.
 *
 * Wire format: https://api.eu.amplitude.com/2/httpapi
 * Docs:        https://amplitude.com/docs/apis/analytics/http-v2
 *
 * We fetch and forget: if the POST fails, we log and move on. No retry —
 * engine hot path must stay under 100ms server budget, analytics is best-effort.
 *
 * ─── Rules ─────────────────────────────────────────────────────────────
 * - NEVER send PII (customer email, phone, name). Use client_id / playbook / etc.
 * - Use a stable `user_id` (the client_id) or `device_id` for anonymous.
 * - Keep payload small — Amplitude caps at 32 KB per event.
 */

// EU workspace endpoint (Actero project is EU).
const AMPLITUDE_ENDPOINT = 'https://api.eu.amplitude.com/2/httpapi'

/**
 * Fire a single event server-side.
 *
 * @param {Object} params
 * @param {string} params.eventType  - canonical event name ("Ticket Resolved")
 * @param {string} [params.userId]   - stable user identifier (client_id)
 * @param {string} [params.deviceId] - device id for anon events
 * @param {Object} [params.properties] - event properties (no PII)
 * @param {Object} [params.userProperties] - user-scoped properties
 * @returns {Promise<void>}
 */
export async function trackServerEvent({
  eventType,
  userId,
  deviceId,
  properties = {},
  userProperties,
}) {
  const apiKey = process.env.AMPLITUDE_API_KEY
  if (!apiKey) {
    // No key = don't spam logs every hit. Warn once per cold start.
    if (!trackServerEvent._warned) {
      console.warn('[amplitude] AMPLITUDE_API_KEY unset — server events disabled')
      trackServerEvent._warned = true
    }
    return
  }

  if (!userId && !deviceId) {
    console.warn('[amplitude] trackServerEvent: userId or deviceId required; got neither (event', eventType, 'dropped)')
    return
  }

  const event = {
    event_type: eventType,
    user_id: userId || undefined,
    device_id: deviceId || userId || 'server',
    event_properties: properties,
    user_properties: userProperties || undefined,
    time: Date.now(),
    // Flag server-originated events so they can be filtered in dashboards
    platform: 'server',
    library: 'actero-engine/1.0',
  }

  try {
    const res = await fetch(AMPLITUDE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, events: [event] }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[amplitude] HTTP', res.status, eventType, body.slice(0, 200))
    }
  } catch (err) {
    console.error('[amplitude] fetch failed:', eventType, err?.message)
  }
}
