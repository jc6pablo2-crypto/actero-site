/**
 * Actero Engine — Rate Limiter
 * Prevents abuse by limiting messages per client and per customer.
 */

const CLIENT_LIMIT_PER_HOUR = 200
const CUSTOMER_LIMIT_PER_10MIN = 10

/**
 * Check if the request should be rate-limited.
 * Returns { allowed: boolean, reason?: string }
 */
export async function checkRateLimit(supabase, { clientId, customerEmail }) {
  const now = new Date()

  // 1. Per-client: max messages per hour
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
  const { count: clientCount } = await supabase
    .from('engine_messages')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('created_at', oneHourAgo)

  if ((clientCount || 0) >= CLIENT_LIMIT_PER_HOUR) {
    return {
      allowed: false,
      reason: `Rate limit: ${CLIENT_LIMIT_PER_HOUR} messages/heure depasse pour ce client`,
    }
  }

  // 2. Per-customer: max messages per 10 minutes (anti-spam)
  if (customerEmail) {
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
    const { count: customerCount } = await supabase
      .from('engine_messages')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('customer_email', customerEmail)
      .gte('created_at', tenMinAgo)

    if ((customerCount || 0) >= CUSTOMER_LIMIT_PER_10MIN) {
      return {
        allowed: false,
        reason: `Rate limit: ${CUSTOMER_LIMIT_PER_10MIN} messages/10min depasse pour ${customerEmail}`,
      }
    }
  }

  return { allowed: true }
}
