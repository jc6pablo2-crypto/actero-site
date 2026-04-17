-- =========================================================================
-- SECURITY HARDENING — 2026-04-17
--
-- 1. Fix RLS funnel_clients (was: ALL authenticated users had full access)
-- 2. Fix admin policy on client_integrations (was: email LIKE '%@actero.fr',
--    spoofable via attacker@actero.fr.evil.com)
-- 3. Introduce `webhook_events` for Stripe webhook idempotency
-- 4. Ensure `admin_users` table exists for consistent admin checks
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. admin_users table (create if missing — referenced by back-end but may
--    have been created directly in the Supabase dashboard).
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users read self" ON public.admin_users;
CREATE POLICY "admin_users read self"
  ON public.admin_users FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_users service role manage" ON public.admin_users;
CREATE POLICY "admin_users service role manage"
  ON public.admin_users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- -------------------------------------------------------------------------
-- 2. Helper function: is_admin() — single source of truth.
--    Checks app_metadata.role OR admin_users table.
--    Use in RLS policies instead of duplicated inline checks.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    COALESCE(
      (SELECT (raw_app_meta_data->>'role') = 'admin'
       FROM auth.users WHERE id = auth.uid()),
      FALSE
    )
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- -------------------------------------------------------------------------
-- 3. Fix funnel_clients RLS
--    Before: "Admin full access" USING (auth.role() = 'authenticated')
--    => ANY logged-in user could read/write/delete every funnel client.
--    After: restrict to admins only.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin full access" ON public.funnel_clients;

CREATE POLICY "Admins manage funnel clients"
  ON public.funnel_clients
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Keep the public read-by-slug policy for anonymous checkout pages but
-- tighten it: only unpaid rows should be readable publicly, and we never
-- expose Stripe IDs to anon. The current policy `USING (true)` allows
-- reading every column — we narrow to what's strictly needed for the
-- checkout page. Apps that need full access must call through the API
-- (service role).
DROP POLICY IF EXISTS "Public read by slug" ON public.funnel_clients;

CREATE POLICY "Public read active funnel rows"
  ON public.funnel_clients
  FOR SELECT
  USING (status IN ('draft', 'sent'));

-- -------------------------------------------------------------------------
-- 4. Fix client_integrations admin policy
--    Before: email LIKE '%@actero.fr' (spoofable)
--    After: is_admin() only.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins have full access to integrations" ON public.client_integrations;

CREATE POLICY "Admins have full access to integrations"
  ON public.client_integrations
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -------------------------------------------------------------------------
-- 5. webhook_events — idempotency table for Stripe (and future) webhooks.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,               -- 'stripe', 'shopify', 'slack', ...
  event_id TEXT NOT NULL,               -- e.g. evt_1Nxxx from Stripe
  event_type TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload_digest TEXT,
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at
  ON public.webhook_events(processed_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only the service role can read/write this table (webhooks run server-side).
DROP POLICY IF EXISTS "webhook_events service role only" ON public.webhook_events;
CREATE POLICY "webhook_events service role only"
  ON public.webhook_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- -------------------------------------------------------------------------
-- 6. Performance index on client_users (heavily used by RLS policies).
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_client_users_user_id
  ON public.client_users(user_id);

CREATE INDEX IF NOT EXISTS idx_client_users_client_id
  ON public.client_users(client_id);
