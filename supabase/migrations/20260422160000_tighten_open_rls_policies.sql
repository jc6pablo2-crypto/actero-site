-- Lock down RLS policies that were defined `using (true)` against the
-- public role. Most of these tables are written by server routes that hold
-- the service_role key (RLS bypass) and were never meant to be reachable
-- from anon/authenticated via the Supabase REST API.

-- ─── Sensitive admin-only tables ───────────────────────────────────────
drop policy if exists "admin manages impersonation" on public.admin_impersonation_tokens;
create policy "service_role only impersonation_tokens"
  on public.admin_impersonation_tokens
  for all to service_role using (true) with check (true);

drop policy if exists "admin writes action logs" on public.admin_action_logs;
create policy "service_role writes action_logs"
  on public.admin_action_logs
  for all to service_role using (true) with check (true);
create policy "admins read action_logs"
  on public.admin_action_logs
  for select to authenticated using (public.is_admin());

drop policy if exists "admin manages alert rules" on public.admin_alert_rules;
create policy "service_role writes alert_rules"
  on public.admin_alert_rules
  for all to service_role using (true) with check (true);
create policy "admins read alert_rules"
  on public.admin_alert_rules
  for select to authenticated using (public.is_admin());

drop policy if exists "admin manages run tags" on public.engine_run_tags;
create policy "service_role writes run_tags"
  on public.engine_run_tags
  for all to service_role using (true) with check (true);
create policy "admins read run_tags"
  on public.engine_run_tags
  for select to authenticated using (public.is_admin());

drop policy if exists "admin manages client notes" on public.admin_client_notes;
create policy "service_role writes client_notes"
  on public.admin_client_notes
  for all to service_role using (true) with check (true);
create policy "admins read+write client_notes"
  on public.admin_client_notes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ─── WhatsApp tables (encrypted OAuth tokens + message PII) ───────────
drop policy if exists "service manages whatsapp accounts" on public.whatsapp_accounts;
create policy "service_role only whatsapp_accounts"
  on public.whatsapp_accounts
  for all to service_role using (true) with check (true);

drop policy if exists "service manages whatsapp messages" on public.whatsapp_messages;
create policy "service_role only whatsapp_messages"
  on public.whatsapp_messages
  for all to service_role using (true) with check (true);

-- ─── Service-only event tables ─────────────────────────────────────────
drop policy if exists "Service role full access commission events" on public.ambassador_commission_events;
create policy "service_role only commission_events"
  on public.ambassador_commission_events
  for all to service_role using (true) with check (true);

drop policy if exists "Service role full access lead events" on public.ambassador_lead_events;
create policy "service_role only lead_events"
  on public.ambassador_lead_events
  for all to service_role using (true) with check (true);

drop policy if exists "notif_log_service" on public.client_notifications_log;
create policy "service_role only notifications_log"
  on public.client_notifications_log
  for all to service_role using (true) with check (true);

-- ─── Client-scoped tables (frontend reads via client_users membership) ─
drop policy if exists "service_manages_usage" on public.usage_counters;
create policy "service_role writes usage_counters"
  on public.usage_counters
  for all to service_role using (true) with check (true);
create policy "client members read own usage"
  on public.usage_counters
  for select to authenticated
  using (
    client_id in (
      select cu.client_id from public.client_users cu where cu.user_id = auth.uid()
      union
      select c.id from public.clients c where c.owner_user_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "service inserts voice calls" on public.voice_calls;
create policy "service_role writes voice_calls"
  on public.voice_calls
  for all to service_role using (true) with check (true);
create policy "client members read own voice_calls"
  on public.voice_calls
  for select to authenticated
  using (
    client_id in (
      select cu.client_id from public.client_users cu where cu.user_id = auth.uid()
      union
      select c.id from public.clients c where c.owner_user_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "service role inserts achievements" on public.client_achievements;
create policy "service_role writes achievements"
  on public.client_achievements
  for all to service_role using (true) with check (true);
create policy "client members read+insert own achievements"
  on public.client_achievements
  for all to authenticated
  using (
    client_id in (
      select cu.client_id from public.client_users cu where cu.user_id = auth.uid()
      union
      select c.id from public.clients c where c.owner_user_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (
    client_id in (
      select cu.client_id from public.client_users cu where cu.user_id = auth.uid()
      union
      select c.id from public.clients c where c.owner_user_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "enrollments_service" on public.academy_enrollments;
create policy "service_role writes enrollments"
  on public.academy_enrollments
  for all to service_role using (true) with check (true);
create policy "users read+upsert own enrollments"
  on public.academy_enrollments
  for all to authenticated
  using (
    user_email = (select email from auth.users where id = auth.uid())
    or public.is_admin()
  )
  with check (
    user_email = (select email from auth.users where id = auth.uid())
    or public.is_admin()
  );

-- ─── partner_applications: keep public anon insert, scope ALL to service ─
drop policy if exists "Service role full access" on public.partner_applications;
create policy "service_role only partner_applications"
  on public.partner_applications
  for all to service_role using (true) with check (true);
