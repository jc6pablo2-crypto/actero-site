/**
 * Cron quotidien — synchronise tous les profils Actero vers Customer.io (EU).
 *
 * Lance à 04h00 UTC chaque jour. Utile en rétroactif pour rattraper les
 * profils créés avant l'intégration CIO.
 *
 * Vercel cron : déclaré dans vercel.json { "path": "/api/cron/cio-sync", "schedule": "0 4 * * *" }
 */
import { createClient } from '@supabase/supabase-js'
import { identify } from '../lib/customerio.js'
import { withCronMonitor } from '../lib/cron-monitor.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// Vercel Pro permet 60s max par lambda cron
export const maxDuration = 60

async function handler(req, res) {
  // Vercel cron envoie GET. Accepter aussi POST pour déclencher manuellement.
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      id, brand_name, contact_email, plan, status, stripe_customer_id,
      trial_ends_at, plan_updated_at, payment_received_at, acquisition_source,
      client_settings:client_settings!client_id(vision_enabled, portal_tone, agent_enabled)
    `)
    .limit(1000)

  if (error) {
    console.error('[cio-sync] Supabase error:', error.message)
    return res.status(500).json({ error: error.message })
  }

  let synced = 0
  let skipped = 0

  for (const c of clients || []) {
    // CIO ne peut pas identifier sans email
    if (!c.contact_email) {
      skipped++
      continue
    }

    const settings = Array.isArray(c.client_settings) ? c.client_settings[0] : c.client_settings

    await identify(c.id, {
      email: c.contact_email,
      company: c.brand_name || '',
      plan: c.plan || 'free',
      status: c.status || 'active',
      stripe_customer_id: c.stripe_customer_id || '',
      // CIO attend des timestamps Unix (secondes) pour les attributs date
      trial_ends_at: c.trial_ends_at ? Math.floor(new Date(c.trial_ends_at).getTime() / 1000) : null,
      plan_updated_at: c.plan_updated_at ? Math.floor(new Date(c.plan_updated_at).getTime() / 1000) : null,
      paid_at: c.payment_received_at ? Math.floor(new Date(c.payment_received_at).getTime() / 1000) : null,
      acquisition_source: c.acquisition_source || '',
      vision_enabled: !!settings?.vision_enabled,
      portal_tone: settings?.portal_tone || 'tu',
      agent_enabled: !!settings?.agent_enabled,
    })
    synced++
  }

  console.log(`[cio-sync] Synced ${synced} profiles, skipped ${skipped} (no email)`)
  return res.status(200).json({ synced, skipped })
}

export default withCronMonitor('cio-sync', '0 4 * * *', handler)
