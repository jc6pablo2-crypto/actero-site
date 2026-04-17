/**
 * Send a Slack notification when a new client signs up.
 *
 * Non-blocking: failures are logged but never thrown.
 *
 * Env required: SLACK_WEBHOOK_URL (Incoming Webhook URL)
 */

export async function notifySignup({ email, brand_name, acquisition_source }) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) {
    console.log('[notify-signup] Skipped (SLACK_WEBHOOK_URL not set)')
    return { sent: false, reason: 'not_configured' }
  }

  // Build a compact, scannable message
  const src = acquisition_source || {}
  const srcLine = src.source
    ? `*${src.source}*${src.medium ? ` / ${src.medium}` : ''}${src.campaign ? ` — _${src.campaign}_` : ''}${src.content ? ` (${src.content})` : ''}`
    : '_direct / unknown_'

  const text = `🎉 *New signup:* \`${email}\` — *${brand_name}*\n📣 ${srcLine}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      console.error('[notify-signup] Slack webhook non-OK:', res.status)
      return { sent: false, status: res.status }
    }
    return { sent: true }
  } catch (err) {
    console.error('[notify-signup] Exception:', err.message)
    return { sent: false, error: err.message }
  }
}
