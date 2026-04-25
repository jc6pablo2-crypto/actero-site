/**
 * Cron quotidien — vérifie les quotas d'usage et émet `quota_threshold_reached_80`
 * dans Customer.io quand un client dépasse 80% de son quota de tickets mensuel.
 *
 * On évite les doublons en stockant un flag dans client_settings.quota_alert_sent_at
 * (réinitialisé au 1er du mois). Si la colonne n'existe pas, l'event est envoyé
 * mais sans dédupplication stricte — acceptable pour un alerte mensuel.
 *
 * Vercel cron : { "path": "/api/cron/check-quotas", "schedule": "0 6 * * *" }
 */
import { createClient } from '@supabase/supabase-js'
import { track } from '../lib/customerio.js'
import { withCronMonitor } from '../lib/cron-monitor.js'
import { PLAN_LIMITS } from '../lib/plan-limits.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export const maxDuration = 60

async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const today = new Date()
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  // Fetch all active clients with their plan
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, plan, contact_email')
    .eq('status', 'active')
    .limit(1000)

  if (clientsError) {
    console.error('[check-quotas] Supabase error:', clientsError.message)
    return res.status(500).json({ error: clientsError.message })
  }

  let alerted = 0

  for (const client of clients || []) {
    const plan = client.plan || 'free'
    const limits = PLAN_LIMITS[plan]
    if (!limits || !isFinite(limits.tickets) || limits.tickets <= 0) continue

    try {
      // Count ai_conversations resolved this month (proxy for tickets handled)
      const { count: usedTickets } = await supabase
        .from('automation_events')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', client.id)
        .eq('event_category', 'ticket_resolved')
        .gte('created_at', periodStart)

      if (!usedTickets) continue

      const usagePct = usedTickets / limits.tickets

      if (usagePct < 0.8) continue

      // Dedup: check if we already sent this alert this month
      const { data: settings } = await supabase
        .from('client_settings')
        .select('quota_alert_sent_at')
        .eq('client_id', client.id)
        .maybeSingle()

      const lastAlert = settings?.quota_alert_sent_at
      if (lastAlert) {
        const alertDate = new Date(lastAlert)
        if (
          alertDate.getFullYear() === today.getFullYear() &&
          alertDate.getMonth() === today.getMonth()
        ) {
          // Already alerted this month
          continue
        }
      }

      // Emit CIO event
      await track(client.id, 'quota_threshold_reached_80', {
        plan,
        tickets_used: usedTickets,
        tickets_limit: limits.tickets,
        usage_pct: Math.round(usagePct * 100),
        period_start: periodStart,
      })

      // Mark alert as sent — best-effort, don't block on error
      await supabase
        .from('client_settings')
        .update({ quota_alert_sent_at: today.toISOString() })
        .eq('client_id', client.id)

      alerted++
    } catch (err) {
      console.error(`[check-quotas] Error for client ${client.id}:`, err.message)
    }
  }

  console.log(`[check-quotas] Checked ${clients?.length ?? 0} clients, alerted ${alerted}`)
  return res.status(200).json({ checked: clients?.length ?? 0, alerted })
}

export default withCronMonitor('cio-check-quotas', '0 6 * * *', handler)
