-- Address Supabase advisor security findings.

-- (1) SECURITY DEFINER views → SECURITY INVOKER (so they enforce the
--     caller's RLS instead of the view-creator's, which bypassed RLS).
alter view public.poc_funnel_report set (security_invoker = true);
alter view public.poc_funnel_report_by_source set (security_invoker = true);
alter view public.client_intelligence_context_30d set (security_invoker = true);
alter view public.v_admin_mrr_snapshot set (security_invoker = true);

revoke all on public.poc_funnel_report from anon, authenticated;
revoke all on public.poc_funnel_report_by_source from anon, authenticated;
revoke all on public.client_intelligence_context_30d from anon, authenticated;
revoke all on public.v_admin_mrr_snapshot from anon, authenticated;

-- (2) email_verification_codes — service-role only.
drop policy if exists "service role only email_verification_codes"
  on public.email_verification_codes;
create policy "service role only email_verification_codes"
  on public.email_verification_codes
  for all to service_role using (true) with check (true);

-- (3) Pin search_path on flagged functions.
alter function public.consume_credits(uuid, integer, text, uuid) set search_path = public, pg_temp;
alter function public.set_customer_follow_up_at() set search_path = public, pg_temp;
