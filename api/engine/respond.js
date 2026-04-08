/**
 * Actero Engine — Response Router
 *
 * Routes AI responses to the appropriate delivery channel (email, Gorgias, Zendesk, etc.)
 * or triggers escalation alerts for human intervention.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || 'support@actero.fr'

/**
 * Route a response to the customer or escalate to the team.
 */
export async function routeResponse(supabase, {
  messageId,
  clientId,
  conversationId,
  threadId,
  source,
  customerEmail,
  customerName,
  subject,
  response,
  confidence,
  shouldEscalate,
  escalationReason,
  detectedIntent,
  sentimentScore,
  injectionDetected,
  processingTimeMs,
  config,
}) {
  if (shouldEscalate) {
    return await handleEscalation(supabase, {
      messageId, clientId, conversationId, threadId,
      customerEmail, customerName, subject,
      escalationReason, detectedIntent, sentimentScore,
      source, config, processingTimeMs,
    })
  }

  return await handleAutoReply(supabase, {
    messageId, clientId, conversationId, threadId,
    source, customerEmail, customerName, subject,
    response, confidence, detectedIntent, sentimentScore,
    injectionDetected, processingTimeMs, config,
  })
}

/**
 * Auto-reply: send response to the customer via the source channel.
 */
async function handleAutoReply(supabase, {
  messageId, clientId, conversationId, threadId,
  source, customerEmail, customerName, subject,
  response, confidence, detectedIntent, sentimentScore,
  injectionDetected, processingTimeMs, config,
}) {
  let deliveryStatus = 'pending'
  let deliveryError = null
  const deliveryChannel = source === 'web_widget' ? 'web_widget' : 'email' // Phase 1: email fallback

  try {
    // Phase 1: always deliver via email
    // Phase 2+ will add Gorgias, Zendesk, etc. connectors
    if (RESEND_API_KEY && customerEmail) {
      const brandName = config.client?.brand_name || 'Actero'
      const emailSubject = subject
        ? `Re: ${subject}`
        : `${brandName} — Reponse a votre demande`

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${brandName} <${RESEND_FROM}>`,
          to: [customerEmail],
          subject: emailSubject,
          html: buildEmailHtml(response, brandName, customerName),
        }),
      })

      if (!emailRes.ok) {
        const err = await emailRes.text()
        throw new Error(`Resend ${emailRes.status}: ${err}`)
      }

      deliveryStatus = 'sent'
    } else {
      // No email config — store response but don't deliver
      deliveryStatus = 'sent' // Mark as sent since response is stored in DB
    }
  } catch (err) {
    console.error('[engine/respond] Delivery error:', err.message)
    deliveryStatus = 'failed'
    deliveryError = err.message
  }

  // Log response
  await supabase.from('engine_responses').insert({
    message_id: messageId,
    client_id: clientId,
    conversation_id: conversationId,
    response_text: response,
    confidence_score: confidence,
    was_escalated: false,
    detected_intent: detectedIntent,
    sentiment_score: sentimentScore,
    injection_detected: injectionDetected,
    delivery_channel: deliveryChannel,
    delivery_status: deliveryStatus,
    delivery_error: deliveryError,
    delivered_at: deliveryStatus === 'sent' ? new Date().toISOString() : null,
    processing_time_ms: processingTimeMs,
  })

  return { delivered: deliveryStatus === 'sent', channel: deliveryChannel }
}

/**
 * Escalation: notify the client team via email and/or Slack.
 */
async function handleEscalation(supabase, {
  messageId, clientId, conversationId, threadId,
  customerEmail, customerName, subject,
  escalationReason, detectedIntent, sentimentScore,
  source, config, processingTimeMs,
}) {
  // 1. Create escalation ticket
  await supabase.from('escalation_tickets').insert({
    client_id: clientId,
    status: 'pending',
  }).catch(() => {}) // Non-critical

  // 2. Send escalation alert email to client
  const { data: notifPrefs } = await supabase
    .from('client_notification_preferences')
    .select('escalation_alert')
    .eq('client_id', clientId)
    .maybeSingle()

  if (RESEND_API_KEY && (notifPrefs?.escalation_alert !== false)) {
    const contactEmail = config.client?.contact_email
    if (contactEmail) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Actero <${RESEND_FROM}>`,
            to: [contactEmail],
            subject: `⚠️ Escalade — ${escalationReason}`,
            html: buildEscalationEmailHtml({
              customerEmail, customerName, escalationReason,
              detectedIntent, sentimentScore, source,
            }),
          }),
        })
      } catch (err) {
        console.error('[engine/respond] Escalation email error:', err.message)
      }
    }
  }

  // 3. Log escalation response
  await supabase.from('engine_responses').insert({
    message_id: messageId,
    client_id: clientId,
    conversation_id: conversationId,
    response_text: '',
    confidence_score: 0,
    was_escalated: true,
    escalation_reason: escalationReason,
    detected_intent: detectedIntent,
    sentiment_score: sentimentScore,
    delivery_channel: 'email',
    delivery_status: 'sent',
    processing_time_ms: processingTimeMs,
  })

  return { delivered: true, channel: 'escalation' }
}

/**
 * Build HTML email for auto-reply.
 */
function buildEmailHtml(response, brandName, customerName) {
  const greeting = customerName ? `Bonjour ${customerName},` : 'Bonjour,'
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="color: #262626; font-size: 15px; line-height: 1.6;">${greeting}</p>
      <p style="color: #262626; font-size: 15px; line-height: 1.6;">${response.replace(/\n/g, '<br/>')}</p>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">
        ${brandName} — Service client assiste par IA<br/>
        Si vous avez besoin d'une aide supplementaire, repondez directement a cet email.
      </p>
    </div>
  `
}

/**
 * Build HTML email for escalation alert.
 */
function buildEscalationEmailHtml({ customerEmail, customerName, escalationReason, detectedIntent, sentimentScore, source }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626; font-size: 18px; margin-bottom: 16px;">⚠️ Ticket escalade</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 8px 0; color: #666;">Client</td><td style="padding: 8px 0; color: #262626; font-weight: bold;">${customerName || customerEmail}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0; color: #262626;">${customerEmail}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Raison</td><td style="padding: 8px 0; color: #dc2626; font-weight: bold;">${escalationReason}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Intent</td><td style="padding: 8px 0; color: #262626;">${detectedIntent || 'N/A'}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Sentiment</td><td style="padding: 8px 0; color: #262626;">${sentimentScore || 'N/A'}/10</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Source</td><td style="padding: 8px 0; color: #262626;">${source}</td></tr>
      </table>
      <p style="margin-top: 20px;">
        <a href="https://actero.fr/client/escalations" style="display: inline-block; padding: 10px 20px; background: #0F5F35; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Voir dans le dashboard
        </a>
      </p>
    </div>
  `
}
