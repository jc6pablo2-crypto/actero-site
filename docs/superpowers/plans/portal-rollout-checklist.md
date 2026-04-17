# Portal rollout checklist

## Env vars (Vercel prod)

- [ ] `PORTAL_JWT_SECRET` — 64-byte hex (`openssl rand -hex 32`), rotate quarterly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard (already set on Vercel likely)
- [ ] `VITE_SUPABASE_URL` — already set
- [ ] `PORTAL_BASE_DOMAIN` = `portal.actero.fr`
- [ ] `PORTAL_EMAIL_FROM` = `noreply@actero.fr` (or verified sender)
- [ ] `RESEND_API_KEY` — already set
- [ ] `PORTAL_ENGINE_TRIGGER_URL` — full URL to `/api/engine/process` on same deployment
- [ ] `INTERNAL_TRIGGER_TOKEN` — shared secret; engine must also accept this header

## DNS (Vercel)

- [ ] A/CNAME `portal.actero.fr` → Vercel
- [ ] Wildcard `*.portal.actero.fr` → same Vercel project (SSL auto-provisioned)

## Code deployment

- [ ] Merge branch `claude/quirky-easley` to main
- [ ] Vercel deploys
- [ ] Smoke-test `https://<any>.portal.actero.fr/` — should 404 until a client is activated

## Database

Already applied in prod (via MCP on 2026-04-17):
- [x] `portal_sessions`, `portal_action_logs` created
- [x] `clients.portal_enabled/portal_custom_domain/portal_logo_url/portal_primary_color/portal_display_name` added
- [x] `ai_conversations.intent/customer_follow_up/customer_follow_up_at` added

## Rollout phases

### Phase 0 — internal test (now)

- [ ] In Supabase SQL editor run: `update clients set portal_enabled=true where slug='<actero-test-client>';`
- [ ] Visit `http://localhost:5173/?portal=1` — login page must render with merchant branding
- [ ] Submit an email you control → confirm magic link email arrives → click → verify lands on `/portal/tickets`

### Phase 1 — beta (3 pilot merchants)

For each merchant:
- [ ] Coordinate with merchant on branding assets
- [ ] `update clients set portal_enabled=true, portal_logo_url=<url>, portal_primary_color='<hex>', portal_display_name='<name>' where slug='<merchant>';`
- [ ] Share URL: `https://<slug>.portal.actero.fr`
- [ ] Monitor `portal_action_logs` for errors/anomalies over 2 weeks
- [ ] Compare ticket volume: "where is my order?" category, before vs during

### Phase 2 — GA (default-on for every merchant)

- [ ] Database backfill: `update clients set portal_enabled=true where portal_enabled=false;`
- [ ] Add "portal_enabled" toggle to client onboarding flow (auto-set to true at signup)
- [ ] Email all merchants with their portal URL + suggested footer/email copy

### Phase 3 — Pro mode (custom domain opt-in)

- [ ] Ship admin UI for custom domain (TXT-record verification)
- [ ] `clients.portal_custom_domain` already supports this — only admin UI missing

## Per-merchant activation SQL snippet

```sql
update clients set
  portal_enabled = true,
  portal_display_name = 'BoutiqueXYZ',
  portal_primary_color = '#0F766E',
  portal_logo_url = 'https://cdn.boutiquexyz.com/logo.png'
where slug = 'boutiquexyz';
```

## Known limitations (V1)

- Cancel order / change shipping address not in portal (V2)
- KB search not yet in portal (ships with feature #2)
- Team roles/SLA tracking not in portal (other gap features)
- Invoice uses Shopify's `send_invoice` API (email to customer) — no in-browser PDF rendering yet

## Smoke test after each deploy

1. Hit `https://<known-slug>.portal.actero.fr/api/portal/resolve-client?hostname=<known-slug>.portal.actero.fr` — should return 200 JSON with `clientId`, `slug`, `branding`
2. Request a magic link on `/portal/login` — cookie `portal_session` should NOT yet be set
3. Click the link — lands on `/portal/tickets`, cookie set
4. GET `/api/portal/tickets` in browser devtools — returns list for customer email
5. `/portal/orders` — renders Shopify orders (if merchant has shopify integration)
