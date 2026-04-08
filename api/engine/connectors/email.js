/**
 * Actero Engine — Email Connector
 * Sends AI responses to customers via Resend.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || 'support@actero.fr'

export async function sendViaEmail(supabase, { customerEmail, customerName, subject, response, brandName }) {
  if (!RESEND_API_KEY) return { success: false, error: 'RESEND_API_KEY not configured' }
  if (!customerEmail) return { success: false, error: 'No customer email' }

  const greeting = customerName ? `Bonjour ${customerName},` : 'Bonjour,'
  const emailSubject = subject ? `Re: ${subject}` : `${brandName} — Reponse a votre demande`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${brandName} <${RESEND_FROM}>`,
      to: [customerEmail],
      subject: emailSubject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="color: #262626; font-size: 15px; line-height: 1.6;">${greeting}</p>
          <p style="color: #262626; font-size: 15px; line-height: 1.6;">${response.replace(/\n/g, '<br/>')}</p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">
            ${brandName} — Service client assiste par IA<br/>
            Si vous avez besoin d'une aide supplementaire, repondez directement a cet email.
          </p>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return { success: false, error: `Resend ${res.status}: ${err}` }
  }

  return { success: true }
}
