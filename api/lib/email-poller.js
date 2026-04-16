/**
 * Actero — Shared email polling logic.
 *
 * Supports BOTH :
 *   - IMAP (provider = 'smtp_imap') via imapflow
 *   - Gmail OAuth (provider = 'gmail') via Gmail REST API
 *
 * Both return the same diagnostics shape so the UI renders identically.
 *
 *   pollOneMailbox({ supabase, clientId, provider, integration })
 *     -> { processed, diagnostics, error? }
 */
import { ImapFlow } from 'imapflow'
import { decryptToken } from './crypto.js'
import { cleanEmailBody } from './email.js'

const SITE_URL = process.env.SITE_URL || 'https://actero.fr'
const MAX_MESSAGES_PER_CYCLE = 20

export async function pollOneMailbox({ supabase, clientId, provider, integration }) {
  if (provider === 'gmail') {
    return pollGmail({ clientId, integration })
  }
  // default: IMAP
  return pollImap({ clientId, integration })
}

/* -------------------------------------------------------------------------- */
/*  Gmail API poller                                                          */
/* -------------------------------------------------------------------------- */

async function pollGmail({ clientId, integration }) {
  const diagnostics = { connected: false, mailbox_total: 0, unread_count: 0, last_5: [], folders: [{ path: 'INBOX (Gmail)', specialUse: 'gmail' }] }
  const accessToken = decryptToken(integration.access_token)
  if (!accessToken) return { processed: 0, diagnostics, error: 'Gmail token indéchiffrable' }

  // Refresh token if expired (Gmail tokens last 1h)
  const refreshedToken = await refreshGmailTokenIfNeeded(integration, accessToken)
  const bearer = refreshedToken || accessToken

  try {
    // 1. Profile check
    const profileResp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${bearer}` },
    })
    if (!profileResp.ok) {
      const errTxt = await profileResp.text().catch(() => '')
      return { processed: 0, diagnostics, error: `Gmail auth: ${profileResp.status} ${errTxt.slice(0, 150)}` }
    }
    const profile = await profileResp.json()
    diagnostics.connected = true
    diagnostics.mailbox_total = profile.messagesTotal || 0

    // 2. List unread in INBOX (primary category only, skip promotions/social)
    const listUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' +
      encodeURIComponent('is:unread in:inbox category:primary') + '&maxResults=20'
    const listResp = await fetch(listUrl, { headers: { Authorization: `Bearer ${bearer}` } })
    if (!listResp.ok) {
      return { processed: 0, diagnostics, error: `Gmail list: ${listResp.status}` }
    }
    const listData = await listResp.json()
    const msgIds = (listData.messages || []).map(m => m.id)
    diagnostics.unread_count = msgIds.length

    // 3. Diagnostics — fetch last 5 recent messages (any status) for display
    const recentUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' +
      encodeURIComponent('in:inbox') + '&maxResults=5'
    const recentResp = await fetch(recentUrl, { headers: { Authorization: `Bearer ${bearer}` } })
    const recentData = recentResp.ok ? await recentResp.json() : { messages: [] }
    for (const m of recentData.messages || []) {
      try {
        const detailResp = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${bearer}` } },
        )
        if (!detailResp.ok) continue
        const detail = await detailResp.json()
        const headers = Object.fromEntries(
          (detail.payload?.headers || []).map(h => [h.name.toLowerCase(), h.value]),
        )
        diagnostics.last_5.push({
          uid: m.id,
          from: headers.from || '',
          subject: headers.subject || '',
          date: headers.date,
          unread: (detail.labelIds || []).includes('UNREAD'),
        })
      } catch { /* skip */ }
    }

    // 4. Process unread (cap at 20)
    let processed = 0
    for (const id of msgIds.slice(0, MAX_MESSAGES_PER_CYCLE)) {
      try {
        const full = await fetchGmailMessage(bearer, id)
        if (!full) continue
        const { from, fromName, to, subject, body, messageId, inReplyTo, references } = full
        if (!body || body.length < 3) {
          await markGmailAsRead(bearer, id)
          continue
        }
        const resp = await fetch(
          `${SITE_URL}/api/engine/webhooks/inbound-email?client_id=${clientId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-engine-secret': process.env.ENGINE_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify({
              from, from_name: fromName, to, subject, text: body,
              message_id: messageId, in_reply_to: inReplyTo, references,
            }),
          },
        )
        if (!resp.ok) continue
        await markGmailAsRead(bearer, id)
        processed += 1
      } catch (err) {
        console.warn('[gmail-poll] msg error:', err.message)
      }
    }
    return { processed, diagnostics }
  } catch (err) {
    return { processed: 0, diagnostics, error: err.message }
  }
}

async function fetchGmailMessage(bearer, id) {
  const resp = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
    { headers: { Authorization: `Bearer ${bearer}` } },
  )
  if (!resp.ok) return null
  const m = await resp.json()
  const headers = Object.fromEntries(
    (m.payload?.headers || []).map(h => [h.name.toLowerCase(), h.value]),
  )

  // Parse from header: "Name <email@domain.com>" OR just "email@domain.com"
  const fromRaw = headers.from || ''
  const fromMatch = fromRaw.match(/^([^<]*)<([^>]+)>/)
  const fromName = fromMatch ? fromMatch[1].trim().replace(/^"|"$/g, '') : ''
  const from = fromMatch ? fromMatch[2] : fromRaw.trim()
  const to = (headers.to || '').split('<')[1]?.split('>')[0] || headers.to || ''

  // Extract text/plain body from payload parts
  const body = extractGmailBody(m.payload) || ''
  const cleaned = cleanEmailBody(body)

  return {
    from,
    fromName,
    to,
    subject: headers.subject || '',
    body: cleaned,
    messageId: headers['message-id'] || null,
    inReplyTo: headers['in-reply-to'] || null,
    references: headers.references || null,
  }
}

function extractGmailBody(payload) {
  if (!payload) return ''
  // Direct text/plain
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data)
  }
  // Multipart — recurse
  if (payload.parts) {
    // Prefer text/plain
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data)
      }
    }
    // Fallback: text/html stripped
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64Url(part.body.data).replace(/<[^>]+>/g, ' ')
      }
    }
    // Recurse deeper
    for (const part of payload.parts) {
      const nested = extractGmailBody(part)
      if (nested) return nested
    }
  }
  return ''
}

function decodeBase64Url(data) {
  try {
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
  } catch {
    return ''
  }
}

async function markGmailAsRead(bearer, id) {
  try {
    await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearer}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
      },
    )
  } catch { /* noop */ }
}

async function refreshGmailTokenIfNeeded(integration, currentToken) {
  const expiresAt = integration.expires_at
  if (!expiresAt) return null
  const expiry = new Date(expiresAt).getTime()
  if (expiry - Date.now() > 5 * 60 * 1000) return null // still valid > 5 min

  const refreshToken = integration.refresh_token ? decryptToken(integration.refresh_token) : null
  if (!refreshToken) return null

  try {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    if (!resp.ok) return null
    const data = await resp.json()
    return data.access_token || null
  } catch {
    return null
  }
}

/* -------------------------------------------------------------------------- */
/*  IMAP poller                                                               */
/* -------------------------------------------------------------------------- */

async function pollImap({ clientId, integration }) {
  const diagnostics = { connected: false, mailbox_total: 0, unread_count: 0, last_5: [], folders: [] }
  const { imap_host, imap_port, username, use_ssl } = integration.extra_config || {}
  const password = decryptToken(integration.api_key) || integration.api_key

  if (!imap_host || !username || !password) {
    return { processed: 0, diagnostics, error: 'Config IMAP incomplète' }
  }

  const client = new ImapFlow({
    host: imap_host,
    port: parseInt(imap_port, 10) || 993,
    secure: use_ssl !== false,
    auth: { user: username, pass: password },
    logger: false,
    socketTimeout: 15_000,
  })

  let processed = 0
  let errorMsg = null
  try {
    await client.connect()
    diagnostics.connected = true
    try {
      const list = await client.list()
      diagnostics.folders = (list || []).map(f => ({ path: f.path, specialUse: f.specialUse || null }))
    } catch { /* noop */ }

    const mb = await client.mailboxOpen('INBOX')
    diagnostics.mailbox_total = mb?.exists || 0
    const unreadUids = await client.search({ seen: false })
    diagnostics.unread_count = (unreadUids || []).length

    try {
      const total = mb?.exists || 0
      if (total > 0) {
        const from = Math.max(1, total - 4)
        for await (const msg of client.fetch(`${from}:${total}`, { envelope: true })) {
          const env = msg.envelope || {}
          const fromObj = env.from?.[0] || {}
          diagnostics.last_5.push({
            uid: msg.uid,
            from: fromObj.address,
            subject: (env.subject || '').slice(0, 80),
            date: env.date,
            unread: (unreadUids || []).includes(msg.uid),
          })
        }
      }
    } catch { /* noop */ }

    const slice = (unreadUids || []).slice(0, MAX_MESSAGES_PER_CYCLE)
    for await (const msg of client.fetch(slice, { envelope: true, source: true })) {
      try {
        const env = msg.envelope || {}
        const fromObj = env.from?.[0] || {}
        const toObj = env.to?.[0] || {}
        const rawSource = msg.source?.toString('utf8') || ''
        const textBody = extractPlainText(rawSource)
        const cleaned = cleanEmailBody(textBody)
        if (!cleaned || cleaned.length < 3) {
          await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true })
          continue
        }
        const resp = await fetch(
          `${SITE_URL}/api/engine/webhooks/inbound-email?client_id=${clientId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-engine-secret': process.env.ENGINE_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify({
              from: fromObj.address,
              from_name: fromObj.name || '',
              to: toObj.address,
              subject: env.subject || '',
              text: cleaned,
              message_id: env.messageId || null,
              in_reply_to: env.inReplyTo || null,
              references: env.references || null,
            }),
          },
        )
        if (!resp.ok) continue
        await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true })
        processed += 1
      } catch (err) {
        console.warn('[imap-poll] msg error:', err.message)
      }
    }
  } catch (err) {
    errorMsg = err.message
  } finally {
    try { await client.logout() } catch { /* noop */ }
  }
  return { processed, diagnostics, error: errorMsg }
}

function extractPlainText(raw) {
  if (!raw) return ''
  const plainMatch = raw.match(/Content-Type:\s*text\/plain[\s\S]*?\r?\n\r?\n([\s\S]+?)(?:\r?\n--|$)/i)
  if (plainMatch) return plainMatch[1]
  const bodyStart = raw.indexOf('\r\n\r\n')
  let body = bodyStart >= 0 ? raw.slice(bodyStart + 4) : raw
  body = body.replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
  return body
}
