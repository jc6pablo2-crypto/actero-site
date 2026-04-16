/**
 * Actero — Shared email utilities for Email Agent.
 *
 * Responsibilities:
 *   - Strip common quoted history + mobile signatures ("Sent from iPhone", etc.)
 *   - Detect & extract conversation threads (Message-ID, In-Reply-To, References)
 *   - Check if a sender is excluded (internal domains, unsubscribes)
 *   - Respect quiet hours (Paris timezone by default)
 */

// Patterns we remove from the START of incoming email bodies (quoted history).
const QUOTE_BOUNDARIES = [
  /^On .+ wrote:$/im,
  /^Le .+ a écrit :$/im,
  /^Le .+ écrivait :$/im,
  /^De\s*:.+$\s*Envoyé\s*:.+$/im,
  /^From:.+$\s*Sent:.+$/im,
  /^-+ ?Original Message ?-+$/im,
  /^-+ ?Message original ?-+$/im,
  /^>+/m, // quoted lines
  /^_{5,}$/m, // Outlook separator
]

// Signatures to strip (mostly from auto-added mobile/email clients).
const SIGNATURE_PATTERNS = [
  /^-- ?$[\s\S]*$/m, // standard email signature delimiter
  /^Sent from my (iPhone|iPad|Samsung|Android).*$/im,
  /^Envoyé de mon (iPhone|iPad|Samsung|Android|mobile).*$/im,
  /^Envoyé depuis mon (iPhone|iPad|Samsung|Android|mobile).*$/im,
  /^Obtenez Outlook pour (iOS|Android).*$/im,
  /^Get Outlook for (iOS|Android).*$/im,
  /^\s*--\s*\n[\s\S]{0,500}$/m,
]

/**
 * Clean an email body by stripping quoted history + signatures.
 * Returns the meaningful part of the message.
 */
export function cleanEmailBody(raw) {
  if (!raw) return ''
  let text = String(raw).replace(/\r\n/g, '\n').trim()

  // Remove HTML if it snuck through (safer fallback)
  text = text.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')

  // Cut at the first quote boundary
  for (const pattern of QUOTE_BOUNDARIES) {
    const match = text.match(pattern)
    if (match && match.index !== undefined) {
      text = text.slice(0, match.index).trim()
      break
    }
  }

  // Strip signatures
  for (const pattern of SIGNATURE_PATTERNS) {
    text = text.replace(pattern, '').trim()
  }

  // Collapse excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim()
  return text
}

/**
 * Extract threading headers from an email to make replies land in the right
 * conversation in Gmail/Outlook/Apple Mail.
 *
 * Returns: { messageId, inReplyTo, references }
 */
export function extractThreadHeaders(email) {
  if (!email) return { messageId: null, inReplyTo: null, references: null }
  const headers = email.headers || {}
  const messageId = email.messageId || headers['message-id'] || headers['Message-ID'] || null
  const inReplyTo = email.inReplyTo || headers['in-reply-to'] || headers['In-Reply-To'] || null
  const references = email.references || headers.references || headers.References || null
  return {
    messageId: messageId ? String(messageId).trim() : null,
    inReplyTo: inReplyTo ? String(inReplyTo).trim() : null,
    references: references ? String(references).trim() : null,
  }
}

/**
 * Check if the sender's email should be ignored (internal domain, newsletter, etc.).
 */
export function isExcludedSender(senderEmail, exclusions = []) {
  if (!senderEmail) return true
  const lower = String(senderEmail).toLowerCase()

  // Always-ignore patterns (auto-responders, mailer-daemon, etc.)
  const BUILT_IN = [
    /mailer-daemon@/,
    /postmaster@/,
    /no-?reply@/,
    /do-?not-?reply@/,
    /bounce@/,
    /notifications?@/,
  ]
  if (BUILT_IN.some(p => p.test(lower))) return true

  // User-provided exclusions (domains or exact emails)
  for (const rule of exclusions || []) {
    if (!rule) continue
    const r = String(rule).toLowerCase().trim()
    if (r.startsWith('@')) {
      // domain rule: @example.com
      if (lower.endsWith(r)) return true
    } else if (r.includes('@')) {
      // exact email
      if (lower === r) return true
    } else {
      // bare domain: example.com
      if (lower.endsWith(`@${r}`) || lower === r) return true
    }
  }
  return false
}

/**
 * Check if now is within a quiet hours window (inclusive start, exclusive end).
 * Uses Paris timezone.
 */
export function isInQuietHours(startHour, endHour) {
  if (startHour == null || endHour == null) return false
  const parisHour = Number(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  )
  if (startHour === endHour) return false
  if (startHour < endHour) {
    return parisHour >= startHour && parisHour < endHour
  }
  // Wraps midnight (ex: 22 → 8)
  return parisHour >= startHour || parisHour < endHour
}

/**
 * Decide if we should auto-reply based on confidence + settings.
 */
export function shouldAutoReply({ confidence, settings }) {
  if (!settings?.email_agent_enabled) return { reply: false, reason: 'agent_disabled' }
  if (!settings?.email_auto_reply_enabled) return { reply: false, reason: 'auto_reply_disabled' }
  if (isInQuietHours(settings.email_quiet_hours_start, settings.email_quiet_hours_end)) {
    return { reply: false, reason: 'quiet_hours' }
  }
  const threshold = (settings.email_confidence_threshold ?? 80) / 100
  if (typeof confidence === 'number' && confidence < threshold) {
    return { reply: false, reason: 'low_confidence' }
  }
  return { reply: true, reason: 'ok' }
}
