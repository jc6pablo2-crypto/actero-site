# Customer Self-Service Portal — Design Spec

**Date:** 2026-04-17
**Status:** Approved for planning
**Owner:** Pablo (Actero)
**Feature ref:** Gap analysis item #10

## Context

Actero is an AI-first customer-service SaaS for Shopify merchants. Today, end-customers of our merchants have no direct window into their support: they send an email/WhatsApp → wait. Competitors (Intercom Company Portal, Gorgias Customer Portal, Zendesk Help Center) ship a self-service portal where end-customers see their tickets, track orders, and trigger refunds/returns on their own.

This spec defines the V1 of Actero's equivalent: a per-merchant, merchant-branded portal where end-customers self-serve. The goal is to reduce "where is my order?" ticket volume (industry benchmark: ~40% reduction) and give Actero a concrete enterprise-tier differentiator.

## Goals

- End-customers of any Actero merchant can log in, see their tickets, track orders, and trigger refunds/returns without contacting a human.
- Feels like the merchant's own tool (logo, colors, domain apparent).
- Reuses existing Actero engine (agents, connectors, KB, AI response generation) — no parallel backend.
- Shippable in a single implementation milestone.

## Non-Goals (V1)

- Cancel order (edge cases with Stripe refund policy — deferred to V2).
- Change shipping address (edge cases with carriers — deferred to V2).
- KB search inside portal (belongs with feature #2, KB gap detection).
- Multi-language UI (French only for V1; existing copy patterns are FR).
- Native mobile app (responsive web only).
- Live chat widget for end-customers (different UX, out of scope).

## User Experience

### Entry flow

Two modes, depending on merchant's activation state:

**Default mode (shipped to every merchant at signup, no config required):**
1. On signup, each merchant is auto-assigned a portal URL at `{slug}.portal.actero.fr` (the existing `clients.slug` is reused).
2. End-customer lands on `{slug}.portal.actero.fr/login`, sees merchant's logo/colors.
3. Enters email → receives magic link → clicks → lands on `/tickets` authenticated.
4. Session cookie persists 30 days (sliding window on activity).

**Pro mode (opt-in via admin — later activation, not day-1):**
1. Merchant chooses to upgrade branding: enters their own subdomain (e.g., `sav.boutique-xyz.com`) in the Actero admin.
2. Actero shows the required DNS record (CNAME to `portal.actero.fr`) and a TXT verification string.
3. Once DNS propagates and verification passes, the custom domain becomes the canonical portal URL for that merchant; `{slug}.portal.actero.fr` keeps working as a fallback.

Rationale: a merchant completing the 15-minute OAuth onboarding must not be blocked by DNS configuration. Custom domain is a Pro-tier upgrade, surfaced after activation once the merchant has value in the product.

### Post-login sections

**`/tickets`** — list of all `ai_conversations` where `customer_email` matches the authenticated user, filtered by the merchant's `client_id`. Shows status (`pending`/`resolved`/`escalated`), subject, last update. Click → thread detail.

**`/tickets/:id`** — full conversation history (customer + AI + human messages). Text input to reply; reply creates a new message in the thread and triggers the existing engine flow (as if the customer had sent an email).

**`/orders`** — list of Shopify orders for this `customer_email` on the merchant's shop, with current tracking status (AfterShip). Click → order detail with timeline.

**`/orders/:orderNum`** — order line items, shipping status, 3 action buttons:
- **Demander un remboursement** → form (reason, optional photo) → creates `ai_conversation` with `intent=refund`, routes to `return-agent`.
- **Lancer un retour** → form (reason, items) → same pattern with `intent=return`, generates return label via existing return-agent flow.
- **Télécharger ma facture** → calls Shopify Admin API, returns PDF.

### Branding

Each merchant configures in their Actero admin:
- `portal_logo_url` (falls back to `clients.logo_url` if unset, else Actero default)
- `portal_primary_color` (hex, falls back to Actero brand teal)
- `portal_display_name` (falls back to `clients.name`)
- `portal_custom_domain` (merchant's chosen subdomain, must be CNAMEd to `portal.actero.fr`)

A `usePortalTheme(slug)` hook reads these on every portal page render and applies CSS custom properties.

## Architecture

### Routing

In `src/App.jsx` (`MainRouter`), add a detection layer: if `window.location.hostname` matches `*.portal.actero.fr` **or** matches a `clients.portal_custom_domain`, resolve the `client` by domain and render `<PortalApp clientSlug=... />`. Otherwise, fall through to existing routes.

The existing `/p/:slug/*` path is also supported for testing (without needing DNS).

### Pages (new files)

- `src/pages/portal/PortalLoginPage.jsx`
- `src/pages/portal/PortalTicketsListPage.jsx`
- `src/pages/portal/PortalTicketDetailPage.jsx`
- `src/pages/portal/PortalOrdersListPage.jsx`
- `src/pages/portal/PortalOrderDetailPage.jsx`
- `src/pages/portal/PortalLayout.jsx` (header with merchant branding, nav, footer)

### Hooks (new files)

- `src/hooks/usePortalTheme.js` — returns `{ logoUrl, primaryColor, displayName, loading }`
- `src/hooks/usePortalAuth.js` — returns `{ session, login(email), logout(), loading }`
- `src/hooks/usePortalClient.js` — resolves `client_id` from domain/slug

### API endpoints (new files under `api/portal/`)

- `api/portal/magic-link.js` (POST) — input `{ email, clientSlug }`. Generates token, stores in `portal_sessions`, emails link via existing Resend config.
- `api/portal/verify-token.js` (POST) — input `{ token }`. Returns session JWT if valid.
- `api/portal/tickets.js` (GET, auth) — lists customer's tickets.
- `api/portal/ticket-reply.js` (POST, auth) — appends a reply to a ticket; triggers `api/engine/process.js`.
- `api/portal/orders.js` (GET, auth) — lists Shopify orders for the authenticated customer.
- `api/portal/order-invoice.js` (GET, auth) — returns Shopify invoice PDF.
- `api/portal/request-refund.js` (POST, auth) — creates conversation with `intent=refund`.
- `api/portal/request-return.js` (POST, auth) — creates conversation with `intent=return`.
- `api/portal/resolve-client.js` (GET, public) — input `{ hostname }`. Returns `{ clientId, slug, branding }` for portal bootstrap.

### Data model (new tables)

```sql
-- Portal session tokens (magic link + active sessions)
create table portal_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  customer_email text not null,
  token_hash text not null,           -- bcrypt(raw_token)
  purpose text not null,              -- 'magic_link' or 'session'
  expires_at timestamptz not null,
  used_at timestamptz,                -- magic_link: set on consume
  ip_inet inet,
  user_agent text,
  created_at timestamptz default now()
);
create index on portal_sessions (client_id, customer_email);
create index on portal_sessions (token_hash);

-- Portal action audit log (refund/return requests, logins)
create table portal_action_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  customer_email text not null,
  action text not null,               -- 'login', 'refund_request', 'return_request', 'invoice_download', 'ticket_reply'
  target_id text,                     -- order number, ticket id, etc.
  metadata jsonb default '{}'::jsonb,
  ip_inet inet,
  user_agent text,
  created_at timestamptz default now()
);
create index on portal_action_logs (client_id, customer_email, created_at desc);
```

**Additions to existing `clients` table:**

```sql
alter table clients
  add column portal_enabled boolean default false,
  add column portal_custom_domain text unique,
  add column portal_logo_url text,
  add column portal_primary_color text,
  add column portal_display_name text;
```

### RLS policies

- `portal_sessions`: no client-side access. All reads/writes go through the backend (service_role). Endpoints resolve session from the HTTP-only cookie.
- `portal_action_logs`: service_role only (insert) + admin read for the owning `client_id`.
- Existing `ai_conversations` RLS: **add** a predicate that allows a row to be read if there's an active `portal_sessions` row with matching `client_id` + `customer_email` (implemented via a SQL function called from the portal API, not exposed to the browser directly).

### Auth mechanism

- Magic link: generate 32-byte random token, store `bcrypt(token)` in `portal_sessions.token_hash`, send raw token in URL, expires 15min, single-use.
- On click: `POST /api/portal/verify-token` consumes the magic link, issues a session JWT (signed with `PORTAL_JWT_SECRET`, 30-day expiry, sliding window), set as HTTP-only secure cookie scoped to the merchant's portal domain.
- All portal API endpoints validate the JWT cookie server-side and resolve `client_id` + `customer_email` from it.

### Shopify data flow

- Reuses existing `api/engine/connectors/` Shopify client.
- `api/portal/orders.js` queries Shopify Admin GraphQL for orders filtered by `customer.email`.
- `api/portal/order-invoice.js` calls Shopify's order PDF endpoint.
- No new Shopify OAuth flow — uses the merchant's existing `client_integrations.shopify` access token.

## Error handling

- Magic link expired/used → portal page renders "Ce lien a expiré, redemande-en un" with a form.
- No Shopify integration active on client → portal loads but `/orders` shows "Fonctionnalité non activée par ce marchand" and refund/return buttons are disabled.
- Session JWT invalid/missing → API returns 401 → frontend redirects to `/p/:slug/login`.
- Rate limits on magic-link endpoint: 3 requests per email per 15 minutes (tracked in `portal_sessions` via count of recent `purpose='magic_link'` rows). Blocks email-bombing.

## Testing

- Unit tests for auth helpers (token generation, verification, JWT issuance).
- Integration tests for each portal API endpoint with a seeded test client + customer.
- E2E test (Playwright via the `agent-browser` skill/plugin we installed): full flow = request magic link → verify token → list tickets → reply → see reply in admin → request refund → confirm conversation created with `intent=refund`.

## Rollout

- **Phase 0 (internal only):** ship with `portal_enabled=false` by default. Test with one internal test merchant (`client_id` of Actero's own test shop) via `/p/:slug/*` path.
- **Phase 1 (beta, default mode only):** flip `portal_enabled=true` for 3 design-partner merchants. They use `{slug}.portal.actero.fr` — no DNS work required. Monitor error rate + ticket-volume delta vs baseline for 2 weeks.
- **Phase 2 (GA, default mode):** default-on at signup for every new merchant. No merchant action required.
- **Phase 3 (Pro mode opt-in):** ship the custom-domain upgrade flow in admin. Existing merchants can enable it any time; not part of day-1 onboarding. DNS verification via TXT record required before activation.

## Security considerations

- Magic-link tokens never logged.
- JWT uses a dedicated secret (`PORTAL_JWT_SECRET` env var, rotate quarterly).
- All portal endpoints filter by `client_id` derived from authenticated session — never from URL/query param — to prevent IDOR.
- `customer_email` equality match is case-insensitive (normalize to lowercase on insert + comparison).
- `portal_action_logs` captures IP + user agent for audit trail.
- Custom domain must be verified (TXT record check) before activation to prevent a merchant claiming a domain they don't own.

## Open questions (resolve during planning)

- Do we pre-fill the refund/return form with AI suggestions (e.g., based on order contents + return-agent's analysis)? Nice-to-have, likely V1.5.
- Does the portal need a "resolve my ticket" button for the customer? Today only AI/agents mark resolution. Could add a `customer_marked_resolved` field. Defer to post-V1 based on usage data.
