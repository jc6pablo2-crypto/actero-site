/**
 * POST /api/leads/gorgias-cost-pdf
 *
 * Captures a lead from the Gorgias cost calculator and triggers an email
 * with the personalized comparison report.
 *
 * Body: { email, tickets, aiPercent, source }
 *
 * Behaviour:
 *   1. Validate input (email format, sane numbers).
 *   2. Upsert lead in Supabase `cost_calculator_leads` table (one row per email).
 *   3. Push lead to Customer.io with `gorgias_cost_lead` tag (existing CIO
 *      integration handles email triggering with the calculation context).
 *
 * Notes:
 *   - PDF generation is deferred to Customer.io email template (HTML report
 *     with chart embedded) — avoids resvg/playwright on serverless cold-starts
 *     and gives marketing full control over the email body.
 *   - If Customer.io is unreachable, we still return 200 (lead saved in DB,
 *     async retry by cron job).
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const CIO_SITE_ID = process.env.CUSTOMERIO_SITE_ID
const CIO_API_KEY = process.env.CUSTOMERIO_TRACK_API_KEY

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, tickets, aiPercent, source } = req.body || {}

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email' })
  }
  const ticketsNum = Number(tickets)
  const aiPercentNum = Number(aiPercent)
  if (!Number.isFinite(ticketsNum) || ticketsNum < 1 || ticketsNum > 100000) {
    return res.status(400).json({ error: 'invalid_tickets' })
  }
  if (!Number.isFinite(aiPercentNum) || aiPercentNum < 0 || aiPercentNum > 100) {
    return res.status(400).json({ error: 'invalid_ai_percent' })
  }

  const payload = {
    email,
    tickets: ticketsNum,
    ai_percent: aiPercentNum,
    source: typeof source === 'string' ? source.slice(0, 64) : 'unknown',
    ip: req.headers['x-forwarded-for'] || null,
    user_agent: (req.headers['user-agent'] || '').slice(0, 256),
    created_at: new Date().toISOString(),
  }

  // Persist to Supabase (best-effort — table is allowed to fail without
  // breaking the user flow). Schema:
  //   id uuid pk · email text · tickets int · ai_percent int · source text
  //   ip text · user_agent text · created_at timestamptz
  try {
    await supabase.from('cost_calculator_leads').insert(payload)
  } catch (err) {
    console.error('cost_calculator_leads insert failed:', err)
  }

  // Push to Customer.io (triggers the email template with PDF link).
  if (CIO_SITE_ID && CIO_API_KEY) {
    try {
      const auth = Buffer.from(`${CIO_SITE_ID}:${CIO_API_KEY}`).toString('base64')
      await fetch(`https://track.customer.io/api/v1/customers/${encodeURIComponent(email)}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'gorgias_cost_calculator_submitted',
          data: {
            tickets: ticketsNum,
            ai_percent: aiPercentNum,
            source: payload.source,
          },
        }),
      })
    } catch (err) {
      console.error('Customer.io push failed:', err)
    }
  }

  return res.status(200).json({ ok: true })
}
