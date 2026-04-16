/**
 * Vercel Cron — Poll inbound emails via IMAP (native, no n8n).
 *
 * Schedule: every 2 minutes
 *   { "path": "/api/cron/poll-inbound-emails", "schedule": "*\/2 * * * *" }
 *
 * For each client with an active smtp_imap integration + email_agent_enabled = true:
 *   1. Connect to their IMAP server (ImapFlow)
 *   2. Fetch unread INBOX messages (max 20 per cycle to stay under Vercel timeout)
 *   3. For each message:
 *      - Clean body, extract threading headers
 *      - POST to /api/engine/webhooks/inbound-email with x-engine-secret header
 *      - Mark as \Seen in IMAP
 *   4. Update clients.email_last_polled_at
 *
 * Auth: Vercel Cron header OR Authorization: Bearer <CRON_SECRET>.
 */
import { createClient } from '@supabase/supabase-js'
import { ImapFlow } from 'imapflow'
import { decryptToken } from '../lib/crypto.js'
import { cleanEmailBody, extractThreadHeaders } from '../lib/email.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// 60s max — we have ~10s headroom on Hobby, 60s on Pro
export const maxDuration = 60

const MAX_MESSAGES_PER_CYCLE = 20
const IMAP_CONNECT_TIMEOUT_MS = 15_000
const SITE_URL = process.env.SITE_URL || 'https://actero.fr'

export default async function handler(req, res) {
  // Auth: Vercel Cron or manual with CRON_SECRET
  const cronSecret = process.env.CRON_SECRET
  const provided = req.headers['authorization']?.replace('Bearer ', '') || req.query?.secret
  const isVercelCron = req.headers['x-vercel-cron']
  if (!isVercelCron && cronSecret && provided !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!cronSecret && !isVercelCron) {
    return res.status(503).json({ error: 'CRON_SECRET missing' })
  }

  try {
    // 1. Fetch all clients with active IMAP + email agent enabled
    const { data: integrations } = await supabase
      .from('client_integrations')
      .select('client_id, api_key, extra_config')
      .eq('provider', 'smtp_imap')
      .eq('status', 'active')

    if (!integrations?.length) {
      return res.status(200).json({ ok: true, polled: 0, reason: 'no active IMAP integrations' })
    }

    const results = []
    for (const integ of integrations) {
      try {
        // Check the client has email_agent_enabled
        const { data: settings } = await supabase
          .from('client_settings')
          .select('email_agent_enabled')
          .eq('client_id', integ.client_id)
          .maybeSingle()

        if (!settings?.email_agent_enabled) {
          results.push({ client_id: integ.client_id, skipped: 'agent_disabled' })
          continue
        }

        const processed = await pollOne({
          clientId: integ.client_id,
          extraConfig: integ.extra_config || {},
          apiKey: integ.api_key,
        })
        results.push({ client_id: integ.client_id, processed })
      } catch (err) {
        console.error(`[poll-inbound-emails] client ${integ.client_id} failed:`, err.message)
        results.push({ client_id: integ.client_id, error: err.message })
      }
    }

    return res.status(200).json({
      ok: true,
      clients_checked: integrations.length,
      results,
    })
  } catch (err) {
    console.error('[poll-inbound-emails] fatal:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

/**
 * Poll one mailbox. Returns the number of messages forwarded to the Engine.
 */
async function pollOne({ clientId, extraConfig, apiKey }) {
  const { imap_host, imap_port, username, email, use_ssl } = extraConfig
  const password = decryptToken(apiKey) || apiKey // tolerate legacy plain values

  if (!imap_host || !username || !password) {
    throw new Error('IMAP config incomplete')
  }

  const client = new ImapFlow({
    host: imap_host,
    port: parseInt(imap_port, 10) || 993,
    secure: use_ssl !== false,
    auth: { user: username, pass: password },
    logger: false,
    socketTimeout: IMAP_CONNECT_TIMEOUT_MS,
  })

  let processed = 0
  try {
    await client.connect()
    await client.mailboxOpen('INBOX')

    // List unseen messages
    const uids = await client.search({ seen: false })
    if (!uids || !uids.length) {
      return 0
    }

    // Cap per cycle
    const slice = uids.slice(0, MAX_MESSAGES_PER_CYCLE)

    // Fetch envelope + body
    for await (const msg of client.fetch(slice, {
      envelope: true,
      bodyStructure: false,
      source: true,
    })) {
      try {
        const env = msg.envelope || {}
        const fromObj = env.from?.[0] || {}
        const toObj = env.to?.[0] || {}
        const fromEmail = fromObj.address
        const fromName = fromObj.name || ''
        const toEmail = toObj.address || email
        const subject = env.subject || ''
        const messageIdHeader = env.messageId || null
        const inReplyToHeader = env.inReplyTo || null

        // Parse body — ImapFlow gives us raw source; we extract plain text crudely
        const rawSource = msg.source?.toString('utf8') || ''
        const textBody = extractPlainText(rawSource)
        const cleaned = cleanEmailBody(textBody)

        // Skip empty / tiny messages
        if (!cleaned || cleaned.length < 3) {
          await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true })
          continue
        }

        // Forward to Actero Engine
        const resp = await fetch(
          `${SITE_URL}/api/engine/webhooks/inbound-email?client_id=${clientId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-engine-secret': process.env.ENGINE_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify({
              from: fromEmail,
              from_name: fromName,
              to: toEmail,
              subject,
              text: cleaned,
              message_id: messageIdHeader,
              in_reply_to: inReplyToHeader,
              references: env.references || null,
            }),
          },
        )

        if (!resp.ok) {
          const errBody = await resp.text().catch(() => '')
          console.error(`[poll] forward failed uid=${msg.uid}: ${resp.status} ${errBody.slice(0, 200)}`)
          continue // don't mark as Seen — we'll retry next cycle
        }

        // Mark as \Seen
        await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true })
        processed += 1
      } catch (inner) {
        console.error(`[poll] per-message error uid=${msg.uid}:`, inner.message)
      }
    }
  } finally {
    try { await client.logout() } catch { /* noop */ }
  }

  // Touch last_polled_at
  await supabase.from('client_settings')
    .update({ email_last_polled_at: new Date().toISOString() })
    .eq('client_id', clientId)

  return processed
}

/**
 * Very naive extractor — grabs the text/plain part if multipart, otherwise
 * falls back to stripping HTML tags. Good enough for 95% of cases. For robust
 * parsing we'd use mailparser but imapflow + mailparser doubles bundle size.
 */
function extractPlainText(raw) {
  if (!raw) return ''
  // Try to find the text/plain part of a multipart message
  const plainMatch = raw.match(/Content-Type:\s*text\/plain[\s\S]*?\r?\n\r?\n([\s\S]+?)(?:\r?\n--|$)/i)
  if (plainMatch) return plainMatch[1]
  // Fall back: strip headers + HTML
  const bodyStart = raw.indexOf('\r\n\r\n')
  let body = bodyStart >= 0 ? raw.slice(bodyStart + 4) : raw
  body = body.replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
  return body
}
