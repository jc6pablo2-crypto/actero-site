const WINDOW_MINUTES = 15;
const MAX_PER_WINDOW = 3;

export async function checkMagicLinkRateLimit(supabase, clientId, email) {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('portal_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('customer_email', email.toLowerCase())
    .eq('purpose', 'magic_link')
    .gte('created_at', windowStart);
  if (error) throw error;
  if ((count ?? 0) >= MAX_PER_WINDOW) return { allowed: false, retryAfterSeconds: WINDOW_MINUTES * 60 };
  return { allowed: true };
}
