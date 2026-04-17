-- 2026-04-17 — POC GTM 72h: reporting view for the signup → paying funnel.
--
-- Consolidé en une seule vue lisible ; on query ça 3x/jour pour check seuils
-- go/no-go et conversion trial → paid.
--
-- Usage :
--   select * from poc_funnel_report where campaign = 'poc-72h';
--   select source, medium, content, signups, activated, trialing, paying
--   from poc_funnel_report_by_source where campaign = 'poc-72h';

create or replace view public.poc_funnel_report as
select
  coalesce(c.acquisition_source->>'campaign', 'unknown') as campaign,
  count(*) as signups,
  count(*) filter (
    where exists (
      select 1 from public.client_integrations ci
      where ci.client_id = c.id and ci.provider = 'shopify' and ci.status = 'connected'
    )
  ) as activated,
  count(*) filter (
    where c.stripe_subscription_id is not null
      and c.trial_ends_at is not null
      and c.trial_ends_at > now()
  ) as trialing,
  count(*) filter (
    where c.plan != 'free'
      and c.stripe_subscription_id is not null
      and (c.trial_ends_at is null or c.trial_ends_at <= now())
      and c.status = 'active'
  ) as paying,
  min(c.created_at) as first_signup_at,
  max(c.created_at) as last_signup_at
from public.clients c
group by coalesce(c.acquisition_source->>'campaign', 'unknown');

comment on view public.poc_funnel_report is
  'Signup → activated → trial → paying funnel aggregated by UTM campaign. Used for POC 72h daily go/no-go reviews.';

create or replace view public.poc_funnel_report_by_source as
select
  coalesce(c.acquisition_source->>'campaign', 'unknown') as campaign,
  coalesce(c.acquisition_source->>'source', 'direct') as source,
  coalesce(c.acquisition_source->>'medium', 'unknown') as medium,
  coalesce(c.acquisition_source->>'content', 'unknown') as content,
  count(*) as signups,
  count(*) filter (
    where exists (
      select 1 from public.client_integrations ci
      where ci.client_id = c.id and ci.provider = 'shopify' and ci.status = 'connected'
    )
  ) as activated,
  count(*) filter (
    where c.stripe_subscription_id is not null
      and c.trial_ends_at is not null
      and c.trial_ends_at > now()
  ) as trialing,
  count(*) filter (
    where c.plan != 'free'
      and c.stripe_subscription_id is not null
      and (c.trial_ends_at is null or c.trial_ends_at <= now())
      and c.status = 'active'
  ) as paying
from public.clients c
group by
  coalesce(c.acquisition_source->>'campaign', 'unknown'),
  coalesce(c.acquisition_source->>'source', 'direct'),
  coalesce(c.acquisition_source->>'medium', 'unknown'),
  coalesce(c.acquisition_source->>'content', 'unknown');

comment on view public.poc_funnel_report_by_source is
  'Same funnel as poc_funnel_report, broken down by UTM source/medium/content for per-channel analysis.';
