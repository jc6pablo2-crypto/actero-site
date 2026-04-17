# Customer Self-Service Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [docs/superpowers/specs/2026-04-17-customer-self-service-portal-design.md](../specs/2026-04-17-customer-self-service-portal-design.md)

**Goal:** Ship a per-merchant, magic-link-authenticated portal at `{slug}.portal.actero.fr` where end-customers see tickets, track orders, and trigger refunds/returns/invoices without contacting an agent.

**Architecture:** Extend the existing `site-web` React+Vite app. A new detection layer in `App.jsx` routes portal subdomain traffic to a `PortalApp` subtree. Backend is new `api/portal/*` Vercel functions sharing the existing Supabase + Shopify connector layer. Auth is magic-link + HTTP-only JWT cookie. Data lives in two new tables (`portal_sessions`, `portal_action_logs`) plus five new columns on `clients`.

**Tech Stack:** React 19, Vite 7, Tailwind 4, Supabase JS, Vercel serverless functions, Vitest (new), Playwright 1.58 (already installed), jose (JWT), bcryptjs (token hashing), Resend (already installed, for magic-link emails).

---

## Task 1: Add test infra + portal utility deps

**Goal:** Install Vitest and auth deps so later tasks can TDD.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `tests/setup.js`

- [ ] **Step 1.1: Install deps**

Run:
```bash
npm install --save-dev vitest @vitest/ui jsdom
npm install jose bcryptjs
```

Expected: new entries in `package.json` dependencies + devDependencies.

- [ ] **Step 1.2: Add test scripts to package.json**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 1.3: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    include: ['tests/**/*.test.js', 'api/**/*.test.js', 'src/**/*.test.{js,jsx}'],
  },
});
```

- [ ] **Step 1.4: Create `tests/setup.js`**

```js
import { vi } from 'vitest';
process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
vi.stubGlobal('fetch', vi.fn());
```

- [ ] **Step 1.5: Verify Vitest runs**

Run: `npm test`
Expected: `No test files found` (expected — no tests yet) exit 0 or similar.

- [ ] **Step 1.6: Commit**

```bash
git add package.json package-lock.json vitest.config.js tests/setup.js
git commit -m "chore: add vitest + jose/bcryptjs for portal feature"
```

---

## Task 2: DB migration — portal tables + client columns

**Goal:** Land the data model from the spec.

**Files:**
- Create: `supabase/migrations/20260417000000_portal_self_service.sql`

- [ ] **Step 2.1: Write the migration**

Create `supabase/migrations/20260417000000_portal_self_service.sql`:

```sql
-- Customer self-service portal — data model
-- Spec: docs/superpowers/specs/2026-04-17-customer-self-service-portal-design.md

-- 1) Merchant-side columns on clients
alter table clients
  add column if not exists portal_enabled boolean not null default false,
  add column if not exists portal_custom_domain text unique,
  add column if not exists portal_logo_url text,
  add column if not exists portal_primary_color text,
  add column if not exists portal_display_name text;

-- 2) Magic-link + active session storage (server-only, never read from browser)
create table if not exists portal_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  customer_email text not null,
  token_hash text not null,
  purpose text not null check (purpose in ('magic_link', 'session')),
  expires_at timestamptz not null,
  used_at timestamptz,
  ip_inet inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists portal_sessions_client_email_idx on portal_sessions (client_id, lower(customer_email));
create index if not exists portal_sessions_token_idx on portal_sessions (token_hash);
create index if not exists portal_sessions_expires_idx on portal_sessions (expires_at);

-- 3) Audit log for every portal action
create table if not exists portal_action_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  customer_email text not null,
  action text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_inet inet,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists portal_action_logs_customer_idx on portal_action_logs (client_id, lower(customer_email), created_at desc);

-- 4) RLS — both tables are service-role-only from the API
alter table portal_sessions enable row level security;
alter table portal_action_logs enable row level security;

create policy "portal_sessions service role only" on portal_sessions
  for all to service_role using (true) with check (true);

create policy "portal_action_logs service role only" on portal_action_logs
  for all to service_role using (true) with check (true);

create policy "portal_action_logs admin read" on portal_action_logs
  for select to authenticated using (
    client_id in (
      select id from clients where owner_user_id = auth.uid()
    )
    or exists (select 1 from auth.users where id = auth.uid() and email like '%@actero.fr')
  );
```

- [ ] **Step 2.2: Apply migration locally**

Run: `npx supabase db reset` (or `npx supabase migration up` if data is present).
Expected: migration applies with no errors, new tables visible in `\dt portal_*`.

- [ ] **Step 2.3: Verify schema**

Run:
```bash
npx supabase db remote list 2>/dev/null || true
psql "$SUPABASE_DB_URL" -c "\d portal_sessions" -c "\d portal_action_logs" -c "\d clients" 2>/dev/null || echo "Run manually in Supabase SQL editor"
```

Expected: both portal tables exist; `clients` has 5 new `portal_*` columns.

- [ ] **Step 2.4: Commit**

```bash
git add supabase/migrations/20260417000000_portal_self_service.sql
git commit -m "feat(portal): migration for sessions, action logs, client branding columns"
```

---

## Task 3: JWT + token auth helpers

**Goal:** Shared auth primitives used by every portal API route.

**Files:**
- Create: `api/portal/lib/auth.js`
- Create: `api/portal/lib/auth.test.js`

- [ ] **Step 3.1: Write failing tests**

Create `api/portal/lib/auth.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import {
  generateMagicLinkToken,
  hashToken,
  verifyTokenAgainstHash,
  issueSessionJwt,
  verifySessionJwt,
} from './auth.js';

describe('auth helpers', () => {
  beforeEach(() => {
    process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000';
  });

  it('generateMagicLinkToken returns a 64-char hex string', () => {
    const token = generateMagicLinkToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hashToken + verify round-trip succeeds for matching input', async () => {
    const raw = generateMagicLinkToken();
    const hash = await hashToken(raw);
    expect(hash).not.toEqual(raw);
    expect(await verifyTokenAgainstHash(raw, hash)).toBe(true);
    expect(await verifyTokenAgainstHash('wrong', hash)).toBe(false);
  });

  it('issueSessionJwt + verify returns the original payload', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'Paul@EX.com' });
    const payload = await verifySessionJwt(jwt);
    expect(payload.clientId).toBe('c1');
    expect(payload.customerEmail).toBe('paul@ex.com'); // normalized lowercase
    expect(payload.exp - payload.iat).toBe(30 * 24 * 60 * 60);
  });

  it('verifySessionJwt throws for bad signature', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'a@b.c' });
    const tampered = jwt.slice(0, -4) + 'zzzz';
    await expect(verifySessionJwt(tampered)).rejects.toThrow();
  });
});
```

- [ ] **Step 3.2: Run tests to confirm they fail**

Run: `npm test -- api/portal/lib/auth.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3.3: Implement `api/portal/lib/auth.js`**

```js
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

function getSecret() {
  const s = process.env.PORTAL_JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error('PORTAL_JWT_SECRET must be set (>=32 chars)');
  }
  return new TextEncoder().encode(s);
}

export function generateMagicLinkToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function hashToken(raw) {
  return bcrypt.hash(raw, 10);
}

export async function verifyTokenAgainstHash(raw, hash) {
  return bcrypt.compare(raw, hash);
}

export async function issueSessionJwt({ clientId, customerEmail }) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    clientId,
    customerEmail: customerEmail.toLowerCase(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(getSecret());
}

export async function verifySessionJwt(jwt) {
  const { payload } = await jwtVerify(jwt, getSecret(), { algorithms: ['HS256'] });
  return payload;
}
```

- [ ] **Step 3.4: Run tests to confirm they pass**

Run: `npm test -- api/portal/lib/auth.test.js`
Expected: all 4 tests pass.

- [ ] **Step 3.5: Commit**

```bash
git add api/portal/lib/auth.js api/portal/lib/auth.test.js
git commit -m "feat(portal): JWT + token auth helpers"
```

---

## Task 4: Rate limit helper

**Goal:** Block magic-link email-bombing (3 requests per email per 15 min per client).

**Files:**
- Create: `api/portal/lib/rate-limit.js`
- Create: `api/portal/lib/rate-limit.test.js`

- [ ] **Step 4.1: Write failing tests**

```js
import { describe, it, expect, vi } from 'vitest';
import { checkMagicLinkRateLimit } from './rate-limit.js';

function makeSupabaseStub(recentCount) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              gte: () => Promise.resolve({ count: recentCount, error: null }),
            }),
          }),
        }),
      }),
    }),
  };
}

describe('rate limit', () => {
  it('allows when count < 3', async () => {
    const r = await checkMagicLinkRateLimit(makeSupabaseStub(2), 'c1', 'a@b.c');
    expect(r.allowed).toBe(true);
  });

  it('blocks when count >= 3', async () => {
    const r = await checkMagicLinkRateLimit(makeSupabaseStub(3), 'c1', 'a@b.c');
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4.2: Run tests to confirm they fail**

Run: `npm test -- api/portal/lib/rate-limit.test.js`
Expected: FAIL (module not found).

- [ ] **Step 4.3: Implement `api/portal/lib/rate-limit.js`**

```js
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

  if ((count ?? 0) >= MAX_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: WINDOW_MINUTES * 60 };
  }
  return { allowed: true };
}
```

- [ ] **Step 4.4: Run tests to confirm they pass**

Run: `npm test -- api/portal/lib/rate-limit.test.js`
Expected: 2 tests pass.

- [ ] **Step 4.5: Commit**

```bash
git add api/portal/lib/rate-limit.js api/portal/lib/rate-limit.test.js
git commit -m "feat(portal): magic-link rate limit helper"
```

---

## Task 5: Resolve client from subdomain

**Goal:** API endpoint that the portal frontend calls on boot to learn which merchant it's rendering.

**Files:**
- Create: `api/portal/resolve-client.js`
- Create: `api/portal/resolve-client.test.js`

- [ ] **Step 5.1: Write failing tests**

```js
import { describe, it, expect, vi } from 'vitest';
import handler from './resolve-client.js';

function makeReqRes({ hostname }) {
  const req = { method: 'GET', query: { hostname } };
  const res = {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  return { req, res };
}

vi.mock('./lib/supabase.js', () => ({
  getServiceRoleClient: () => ({
    from: (table) => ({
      select: () => ({
        or: () => ({
          maybeSingle: () => {
            // hostname=horace.portal.actero.fr should match slug='horace'
            return Promise.resolve({
              data: { id: 'client-horace', slug: 'horace', portal_enabled: true, portal_logo_url: 'x', portal_primary_color: '#000', portal_display_name: 'Horace', name: 'Horace', logo_url: null },
              error: null,
            });
          },
        }),
      }),
    }),
  }),
}));

describe('resolve-client', () => {
  it('returns branding for valid subdomain', async () => {
    const { req, res } = makeReqRes({ hostname: 'horace.portal.actero.fr' });
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.slug).toBe('horace');
    expect(res.body.branding.displayName).toBe('Horace');
  });
});
```

- [ ] **Step 5.2: Run tests to confirm they fail**

Run: `npm test -- api/portal/resolve-client.test.js`
Expected: FAIL.

- [ ] **Step 5.3: Create `api/portal/lib/supabase.js`**

```js
import { createClient } from '@supabase/supabase-js';

let cached;

export function getServiceRoleClient() {
  if (cached) return cached;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
```

- [ ] **Step 5.4: Implement `api/portal/resolve-client.js`**

```js
import { getServiceRoleClient } from './lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const hostname = (req.query.hostname || '').toLowerCase();
  if (!hostname) return res.status(400).json({ error: 'hostname_required' });

  const parts = hostname.split('.');
  const isPortalSubdomain = hostname.endsWith('.portal.actero.fr') && parts.length >= 4;
  const slug = isPortalSubdomain ? parts[0] : null;

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id, slug, name, logo_url, portal_enabled, portal_custom_domain, portal_logo_url, portal_primary_color, portal_display_name')
    .or(slug ? `slug.eq.${slug},portal_custom_domain.eq.${hostname}` : `portal_custom_domain.eq.${hostname}`)
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'lookup_failed' });
  if (!data || !data.portal_enabled) return res.status(404).json({ error: 'portal_not_found' });

  return res.status(200).json({
    clientId: data.id,
    slug: data.slug,
    branding: {
      logoUrl: data.portal_logo_url || data.logo_url || null,
      primaryColor: data.portal_primary_color || '#0F766E',
      displayName: data.portal_display_name || data.name,
    },
  });
}
```

- [ ] **Step 5.5: Run tests to confirm they pass**

Run: `npm test -- api/portal/resolve-client.test.js`
Expected: 1 test passes.

- [ ] **Step 5.6: Commit**

```bash
git add api/portal/resolve-client.js api/portal/resolve-client.test.js api/portal/lib/supabase.js
git commit -m "feat(portal): resolve client from subdomain/custom domain"
```

---

## Task 6: Magic link request endpoint

**Goal:** `POST /api/portal/magic-link { email, clientId }` — emails a signed link.

**Files:**
- Create: `api/portal/magic-link.js`
- Create: `api/portal/magic-link.test.js`

- [ ] **Step 6.1: Write failing tests**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './magic-link.js';

let insertCall;
let resendCall;

vi.mock('./lib/supabase.js', () => ({
  getServiceRoleClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              gte: () => Promise.resolve({ count: 0, error: null }),
            }),
          }),
        }),
      }),
      insert: (row) => { insertCall = row; return Promise.resolve({ error: null }); },
    }),
  }),
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: vi.fn(async (args) => { resendCall = args; return { id: 'resend_1' }; }),
    };
  },
}));

function makeReqRes(body) {
  return {
    req: { method: 'POST', body, headers: { 'x-forwarded-for': '1.2.3.4', 'user-agent': 'test' } },
    res: {
      statusCode: 200, body: null,
      status(c) { this.statusCode = c; return this; },
      json(b) { this.body = b; return this; },
    },
  };
}

describe('magic-link', () => {
  beforeEach(() => {
    insertCall = null; resendCall = null;
    process.env.PORTAL_BASE_DOMAIN = 'portal.actero.fr';
    process.env.RESEND_API_KEY = 'test';
  });

  it('accepts a valid request and sends an email', async () => {
    const { req, res } = makeReqRes({ clientId: 'c1', email: 'Paul@Ex.com', slug: 'horace' });
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(insertCall.customer_email).toBe('paul@ex.com');
    expect(insertCall.purpose).toBe('magic_link');
    expect(resendCall.to).toContain('paul@ex.com');
    expect(resendCall.html).toMatch(/horace\.portal\.actero\.fr\/portal\/verify\?token=/);
  });

  it('rejects missing fields', async () => {
    const { req, res } = makeReqRes({ email: 'a@b.c' });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });
});
```

- [ ] **Step 6.2: Run tests to confirm they fail**

Run: `npm test -- api/portal/magic-link.test.js`
Expected: FAIL.

- [ ] **Step 6.3: Implement `api/portal/magic-link.js`**

```js
import { Resend } from 'resend';
import { getServiceRoleClient } from './lib/supabase.js';
import { generateMagicLinkToken, hashToken } from './lib/auth.js';
import { checkMagicLinkRateLimit } from './lib/rate-limit.js';

const MAGIC_LINK_TTL_MINUTES = 15;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { clientId, email, slug } = req.body || {};
  if (!clientId || !email || !slug) return res.status(400).json({ error: 'invalid_input' });

  const normalizedEmail = email.trim().toLowerCase();
  const supabase = getServiceRoleClient();

  const rate = await checkMagicLinkRateLimit(supabase, clientId, normalizedEmail);
  if (!rate.allowed) return res.status(429).json({ error: 'rate_limited', retryAfter: rate.retryAfterSeconds });

  const raw = generateMagicLinkToken();
  const hash = await hashToken(raw);
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await supabase.from('portal_sessions').insert({
    client_id: clientId,
    customer_email: normalizedEmail,
    token_hash: hash,
    purpose: 'magic_link',
    expires_at: expiresAt,
    ip_inet: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null,
    user_agent: req.headers['user-agent'] || null,
  });
  if (error) return res.status(500).json({ error: 'db_insert_failed' });

  const baseDomain = process.env.PORTAL_BASE_DOMAIN || 'portal.actero.fr';
  const url = `https://${slug}.${baseDomain}/portal/verify?token=${raw}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.PORTAL_EMAIL_FROM || 'noreply@actero.fr',
    to: normalizedEmail,
    subject: 'Votre lien de connexion',
    html: `<p>Bonjour,</p><p>Cliquez pour vous connecter à votre espace SAV :</p><p><a href="${url}">${url}</a></p><p>Ce lien expire dans 15 minutes.</p>`,
  });

  return res.status(200).json({ ok: true });
}
```

- [ ] **Step 6.4: Run tests to confirm they pass**

Run: `npm test -- api/portal/magic-link.test.js`
Expected: 2 tests pass.

- [ ] **Step 6.5: Commit**

```bash
git add api/portal/magic-link.js api/portal/magic-link.test.js
git commit -m "feat(portal): magic-link request endpoint with rate limit + Resend email"
```

---

## Task 7: Verify-token endpoint

**Goal:** `POST /api/portal/verify-token { token, clientId }` — consumes magic link, issues session JWT cookie.

**Files:**
- Create: `api/portal/verify-token.js`
- Create: `api/portal/verify-token.test.js`

- [ ] **Step 7.1: Write failing tests**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './verify-token.js';
import { hashToken } from './lib/auth.js';

let dbState;

vi.mock('./lib/supabase.js', () => ({
  getServiceRoleClient: () => ({
    from: (table) => {
      if (table === 'portal_sessions') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                is: () => ({
                  gte: () => ({
                    maybeSingle: () => Promise.resolve({ data: dbState.row, error: null }),
                  }),
                }),
              }),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          insert: () => Promise.resolve({ error: null }),
        };
      }
      return { insert: () => Promise.resolve({ error: null }) };
    },
  }),
}));

function makeReqRes(body) {
  const res = {
    statusCode: 200, body: null, cookies: {},
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
    setHeader(n, v) { if (n.toLowerCase() === 'set-cookie') this.cookies = v; return this; },
  };
  return { req: { method: 'POST', body, headers: {} }, res };
}

describe('verify-token', () => {
  beforeEach(async () => {
    process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000';
    const hash = await hashToken('abc123');
    dbState = {
      row: {
        id: 's1', client_id: 'c1', customer_email: 'paul@ex.com', token_hash: hash,
        purpose: 'magic_link', expires_at: new Date(Date.now() + 60000).toISOString(), used_at: null,
      },
    };
  });

  it('issues a session JWT for a valid unused token', async () => {
    const { req, res } = makeReqRes({ token: 'abc123', clientId: 'c1' });
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.cookies) ? res.cookies[0] : res.cookies).toMatch(/portal_session=/);
  });

  it('rejects an invalid token', async () => {
    const { req, res } = makeReqRes({ token: 'wrong', clientId: 'c1' });
    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });
});
```

- [ ] **Step 7.2: Run tests to confirm they fail**

Run: `npm test -- api/portal/verify-token.test.js`
Expected: FAIL.

- [ ] **Step 7.3: Implement `api/portal/verify-token.js`**

```js
import { getServiceRoleClient } from './lib/supabase.js';
import { verifyTokenAgainstHash, issueSessionJwt } from './lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const { token, clientId } = req.body || {};
  if (!token || !clientId) return res.status(400).json({ error: 'invalid_input' });

  const supabase = getServiceRoleClient();

  const { data: row, error } = await supabase
    .from('portal_sessions')
    .select('id, client_id, customer_email, token_hash, purpose, expires_at, used_at')
    .eq('client_id', clientId)
    .eq('purpose', 'magic_link')
    .is('used_at', null)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !row) return res.status(401).json({ error: 'invalid_or_expired' });

  const ok = await verifyTokenAgainstHash(token, row.token_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_or_expired' });

  await supabase.from('portal_sessions').update({ used_at: new Date().toISOString() }).eq('id', row.id);

  const jwt = await issueSessionJwt({ clientId: row.client_id, customerEmail: row.customer_email });

  const cookie = [
    `portal_session=${jwt}`,
    'Path=/',
    `Max-Age=${30 * 24 * 60 * 60}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);

  await supabase.from('portal_action_logs').insert({
    client_id: row.client_id,
    customer_email: row.customer_email,
    action: 'login',
    metadata: { session_id: row.id },
    ip_inet: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null,
    user_agent: req.headers['user-agent'] || null,
  });

  return res.status(200).json({ ok: true });
}
```

- [ ] **Step 7.4: Run tests to confirm they pass**

Run: `npm test -- api/portal/verify-token.test.js`
Expected: 2 tests pass.

- [ ] **Step 7.5: Commit**

```bash
git add api/portal/verify-token.js api/portal/verify-token.test.js
git commit -m "feat(portal): verify-token consumes magic link and issues session cookie"
```

---

## Task 8: Session-protected API wrapper

**Goal:** A `requirePortalSession(req)` helper so every protected endpoint validates the cookie the same way.

**Files:**
- Create: `api/portal/lib/session.js`
- Create: `api/portal/lib/session.test.js`

- [ ] **Step 8.1: Write failing tests**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requirePortalSession } from './session.js';
import { issueSessionJwt } from './auth.js';

beforeEach(() => {
  process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000';
});

function makeReq(cookieHeader) {
  return { headers: { cookie: cookieHeader || '' } };
}

describe('requirePortalSession', () => {
  it('returns payload for a valid cookie', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'paul@ex.com' });
    const result = await requirePortalSession(makeReq(`portal_session=${jwt}`));
    expect(result.clientId).toBe('c1');
    expect(result.customerEmail).toBe('paul@ex.com');
  });

  it('throws 401 for missing cookie', async () => {
    await expect(requirePortalSession(makeReq(''))).rejects.toMatchObject({ status: 401 });
  });

  it('throws 401 for tampered cookie', async () => {
    await expect(requirePortalSession(makeReq('portal_session=not-a-jwt'))).rejects.toMatchObject({ status: 401 });
  });
});
```

- [ ] **Step 8.2: Run tests to confirm they fail**

Run: `npm test -- api/portal/lib/session.test.js`
Expected: FAIL.

- [ ] **Step 8.3: Implement `api/portal/lib/session.js`**

```js
import { verifySessionJwt } from './auth.js';

export class PortalAuthError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(v.join('='));
  }
  return out;
}

export async function requirePortalSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const jwt = cookies.portal_session;
  if (!jwt) throw new PortalAuthError(401, 'no_session');
  try {
    return await verifySessionJwt(jwt);
  } catch {
    throw new PortalAuthError(401, 'invalid_session');
  }
}
```

- [ ] **Step 8.4: Run tests to confirm they pass**

Run: `npm test -- api/portal/lib/session.test.js`
Expected: 3 tests pass.

- [ ] **Step 8.5: Commit**

```bash
git add api/portal/lib/session.js api/portal/lib/session.test.js
git commit -m "feat(portal): requirePortalSession helper"
```

---

## Task 9: App.jsx subdomain detection + portal routing

**Goal:** When hostname is `*.portal.actero.fr` or a verified custom domain, render `<PortalApp>` instead of the main site.

**Files:**
- Modify: `src/App.jsx`
- Create: `src/pages/portal/PortalApp.jsx`

- [ ] **Step 9.1: Create `src/pages/portal/PortalApp.jsx` skeleton**

```jsx
import { useEffect, useState } from 'react';

export default function PortalApp() {
  const [route, setRoute] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (p) => {
    window.history.pushState({}, '', p);
    setRoute(p);
  };

  // Router stub — pages added in subsequent tasks
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui' }}>
      <p>Portal — route: <code>{route}</code></p>
      <button onClick={() => navigate('/portal/login')}>Go to login</button>
    </div>
  );
}
```

- [ ] **Step 9.2: Modify `src/App.jsx` to detect portal hostname**

Near the top of `MainRouter`, before the existing route chain, add:

```jsx
import PortalApp from './pages/portal/PortalApp.jsx';
// ... existing imports

function isPortalHostname(hostname) {
  if (!hostname) return false;
  if (hostname.endsWith('.portal.actero.fr')) return true;
  // Custom domain detection happens server-side via resolve-client; frontend trusts server
  // For dev: allow localhost subdomain override via query param
  const params = new URLSearchParams(window.location.search);
  if (params.get('portal') === '1') return true;
  return false;
}

// Inside MainRouter, at the very top of the render body:
if (isPortalHostname(window.location.hostname)) {
  return <PortalApp />;
}
```

- [ ] **Step 9.3: Manual smoke test**

Run: `npm run dev`
Visit: `http://localhost:5173/?portal=1`
Expected: renders "Portal — route: /" with a button; clicking moves to `/portal/login`.

- [ ] **Step 9.4: Commit**

```bash
git add src/App.jsx src/pages/portal/PortalApp.jsx
git commit -m "feat(portal): hostname detection routes to PortalApp"
```

---

## Task 10: Portal auth hooks + theme hook

**Goal:** Frontend utilities every portal page will use.

**Files:**
- Create: `src/hooks/usePortalClient.js`
- Create: `src/hooks/usePortalAuth.js`
- Create: `src/hooks/usePortalTheme.js`

- [ ] **Step 10.1: Create `src/hooks/usePortalClient.js`**

```js
import { useEffect, useState } from 'react';

export function usePortalClient() {
  const [state, setState] = useState({ loading: true, client: null, error: null });

  useEffect(() => {
    const hostname = window.location.hostname;
    fetch(`/api/portal/resolve-client?hostname=${encodeURIComponent(hostname)}`)
      .then((r) => r.json().then((b) => ({ ok: r.ok, body: b })))
      .then(({ ok, body }) => {
        if (!ok) return setState({ loading: false, client: null, error: body.error });
        setState({ loading: false, client: body, error: null });
      })
      .catch((e) => setState({ loading: false, client: null, error: e.message }));
  }, []);

  return state;
}
```

- [ ] **Step 10.2: Create `src/hooks/usePortalTheme.js`**

```js
import { useEffect } from 'react';

export function usePortalTheme(branding) {
  useEffect(() => {
    if (!branding) return;
    document.documentElement.style.setProperty('--portal-primary', branding.primaryColor);
    document.title = `Mon espace SAV · ${branding.displayName}`;
  }, [branding]);
}
```

- [ ] **Step 10.3: Create `src/hooks/usePortalAuth.js`**

```js
import { useEffect, useState, useCallback } from 'react';

export function usePortalAuth() {
  const [state, setState] = useState({ loading: true, authed: false, email: null });

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/portal/me', { credentials: 'same-origin' });
      if (r.ok) {
        const b = await r.json();
        setState({ loading: false, authed: true, email: b.customerEmail });
      } else {
        setState({ loading: false, authed: false, email: null });
      }
    } catch {
      setState({ loading: false, authed: false, email: null });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = useCallback(async () => {
    await fetch('/api/portal/logout', { method: 'POST', credentials: 'same-origin' });
    setState({ loading: false, authed: false, email: null });
  }, []);

  return { ...state, refresh, logout };
}
```

- [ ] **Step 10.4: Create `api/portal/me.js` (needed by usePortalAuth)**

```js
import { requirePortalSession } from './lib/session.js';

export default async function handler(req, res) {
  try {
    const payload = await requirePortalSession(req);
    return res.status(200).json({ customerEmail: payload.customerEmail, clientId: payload.clientId });
  } catch (e) {
    return res.status(e.status || 401).json({ error: e.code || 'unauthorized' });
  }
}
```

- [ ] **Step 10.5: Create `api/portal/logout.js`**

```js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  res.setHeader('Set-Cookie', 'portal_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
  return res.status(200).json({ ok: true });
}
```

- [ ] **Step 10.6: Commit**

```bash
git add src/hooks/usePortalClient.js src/hooks/usePortalTheme.js src/hooks/usePortalAuth.js api/portal/me.js api/portal/logout.js
git commit -m "feat(portal): client/theme/auth hooks + me/logout endpoints"
```

---

## Task 11: PortalLayout + LoginPage + VerifyPage

**Goal:** User can request a magic link and get logged in end-to-end.

**Files:**
- Create: `src/pages/portal/PortalLayout.jsx`
- Create: `src/pages/portal/PortalLoginPage.jsx`
- Create: `src/pages/portal/PortalVerifyPage.jsx`
- Modify: `src/pages/portal/PortalApp.jsx`

- [ ] **Step 11.1: Create `src/pages/portal/PortalLayout.jsx`**

```jsx
import { usePortalClient } from '../../hooks/usePortalClient.js';
import { usePortalTheme } from '../../hooks/usePortalTheme.js';
import { usePortalAuth } from '../../hooks/usePortalAuth.js';

export default function PortalLayout({ children, navigate }) {
  const { client, loading, error } = usePortalClient();
  const { authed, email, logout } = usePortalAuth();
  usePortalTheme(client?.branding);

  if (loading) return <div className="p-10 text-center">Chargement…</div>;
  if (error || !client) return <div className="p-10 text-center text-red-600">Ce portail n'est pas disponible.</div>;

  const b = client.branding;
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          {b.logoUrl && <img src={b.logoUrl} alt={b.displayName} className="h-8" />}
          <span className="font-medium">{b.displayName} · Mon espace SAV</span>
        </div>
        {authed && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-neutral-600">{email}</span>
            <button onClick={logout} className="text-neutral-500 hover:text-neutral-900">Déconnexion</button>
          </div>
        )}
      </header>
      {authed && (
        <nav className="flex gap-4 px-6 py-3 bg-white border-b text-sm">
          <button onClick={() => navigate('/portal/tickets')}>Conversations</button>
          <button onClick={() => navigate('/portal/orders')}>Commandes</button>
        </nav>
      )}
      <main className="p-6 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 11.2: Create `src/pages/portal/PortalLoginPage.jsx`**

```jsx
import { useState } from 'react';
import { usePortalClient } from '../../hooks/usePortalClient.js';

export default function PortalLoginPage() {
  const { client } = usePortalClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!client) return;
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/portal/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clientId: client.clientId, slug: client.slug, email }),
      });
      if (r.status === 429) throw new Error('Trop de demandes. Réessaye dans 15 minutes.');
      if (!r.ok) throw new Error('Erreur. Réessaye.');
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-sm text-center">
        <h1 className="text-xl font-semibold mb-2">Vérifie ta boîte mail</h1>
        <p className="text-neutral-600">On t'a envoyé un lien de connexion à <strong>{email}</strong>. Il expire dans 15 minutes.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Accède à ton espace SAV</h1>
      <label className="block text-sm font-medium mb-1">Ton email</label>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4" placeholder="paul@example.com" />
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <button type="submit" disabled={busy}
        className="w-full bg-[var(--portal-primary,#0F766E)] text-white rounded py-2 font-medium disabled:opacity-50">
        {busy ? 'Envoi…' : 'Recevoir mon lien de connexion'}
      </button>
    </form>
  );
}
```

- [ ] **Step 11.3: Create `src/pages/portal/PortalVerifyPage.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { usePortalClient } from '../../hooks/usePortalClient.js';

export default function PortalVerifyPage({ navigate }) {
  const { client } = usePortalClient();
  const [state, setState] = useState('verifying');

  useEffect(() => {
    if (!client) return;
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setState('error'); return; }
    fetch('/api/portal/verify-token', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, clientId: client.clientId }),
    }).then((r) => {
      if (r.ok) { setState('ok'); navigate('/portal/tickets'); }
      else setState('expired');
    }).catch(() => setState('error'));
  }, [client, navigate]);

  if (state === 'verifying') return <p>Connexion…</p>;
  if (state === 'expired') return <p>Ce lien a expiré. <a href="/portal/login">Redemande-en un</a>.</p>;
  if (state === 'error') return <p>Erreur inconnue.</p>;
  return null;
}
```

- [ ] **Step 11.4: Modify `PortalApp.jsx` to wire routes**

Replace the body of `PortalApp.jsx`:

```jsx
import { useEffect, useState } from 'react';
import PortalLayout from './PortalLayout.jsx';
import PortalLoginPage from './PortalLoginPage.jsx';
import PortalVerifyPage from './PortalVerifyPage.jsx';

export default function PortalApp() {
  const [route, setRoute] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (p) => {
    window.history.pushState({}, '', p);
    setRoute(p);
  };

  let page;
  if (route === '/portal/login' || route === '/' || route === '') page = <PortalLoginPage />;
  else if (route === '/portal/verify') page = <PortalVerifyPage navigate={navigate} />;
  else page = <div>Page à venir · route: {route}</div>;

  return <PortalLayout navigate={navigate}>{page}</PortalLayout>;
}
```

- [ ] **Step 11.5: Manual test**

Run: `npm run dev`. Insert a test client row with `portal_enabled=true, slug='horace'`.

Visit `http://localhost:5173/?portal=1` (or configure local hosts entry `horace.portal.actero.fr 127.0.0.1`).
Expected: login page shows with merchant branding. Submitting sends magic link (check Resend dashboard).

- [ ] **Step 11.6: Commit**

```bash
git add src/pages/portal/PortalLayout.jsx src/pages/portal/PortalLoginPage.jsx src/pages/portal/PortalVerifyPage.jsx src/pages/portal/PortalApp.jsx
git commit -m "feat(portal): login, verify, and layout pages"
```

---

## Task 12: Tickets list + detail

**Goal:** Authenticated customer sees their conversations, opens a thread, and can reply.

**Files:**
- Create: `api/portal/tickets.js`
- Create: `api/portal/tickets.test.js`
- Create: `api/portal/ticket-reply.js`
- Create: `api/portal/ticket-reply.test.js`
- Create: `src/pages/portal/PortalTicketsListPage.jsx`
- Create: `src/pages/portal/PortalTicketDetailPage.jsx`
- Modify: `src/pages/portal/PortalApp.jsx`

- [ ] **Step 12.1: Write test for `api/portal/tickets.js`**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './tickets.js';
import { issueSessionJwt } from './lib/auth.js';

let rows;
vi.mock('./lib/supabase.js', () => ({
  getServiceRoleClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: rows, error: null }),
            }),
          }),
        }),
      }),
    }),
  }),
}));

beforeEach(() => {
  process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000';
  rows = [{ id: 't1', subject: 'Tondeuse HS', status: 'pending', ai_response: 'Réponse IA', created_at: '2026-04-15T10:00:00Z' }];
});

describe('tickets list', () => {
  it('returns the customer tickets', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'paul@ex.com' });
    const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    await handler({ method: 'GET', headers: { cookie: `portal_session=${jwt}` } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.tickets).toHaveLength(1);
    expect(res.body.tickets[0].id).toBe('t1');
  });

  it('401 without cookie', async () => {
    const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(401);
  });
});
```

- [ ] **Step 12.2: Implement `api/portal/tickets.js`**

```js
import { getServiceRoleClient } from './lib/supabase.js';
import { requirePortalSession } from './lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  let session;
  try { session = await requirePortalSession(req); }
  catch (e) { return res.status(e.status).json({ error: e.code }); }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id, subject, status, ai_response, human_response, customer_name, confidence_score, rating, escalation_reason, created_at, updated_at')
    .eq('client_id', session.clientId)
    .eq('customer_email', session.customerEmail)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: 'query_failed' });
  return res.status(200).json({ tickets: data });
}
```

- [ ] **Step 12.3: Run tests**

Run: `npm test -- api/portal/tickets.test.js`
Expected: 2 pass.

- [ ] **Step 12.4: Write test for `ticket-reply.js`**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './ticket-reply.js';
import { issueSessionJwt } from './lib/auth.js';

let inserted, fetchCalls;
vi.mock('./lib/supabase.js', () => ({
  getServiceRoleClient: () => ({
    from: (table) => {
      if (table === 'ai_conversations') {
        return {
          select: () => ({
            eq: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 't1', client_id: 'c1', customer_email: 'paul@ex.com' }, error: null }) }) }) }),
          }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      }
      return { insert: (row) => { inserted = row; return Promise.resolve({ error: null }); } };
    },
  }),
}));

beforeEach(() => {
  process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000';
  inserted = null;
});

describe('ticket-reply', () => {
  it('appends reply + logs action', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'paul@ex.com' });
    const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    await handler({ method: 'POST', headers: { cookie: `portal_session=${jwt}` }, body: { ticketId: 't1', message: 'bonjour' } }, res);
    expect(res.statusCode).toBe(200);
    expect(inserted.action).toBe('ticket_reply');
  });
});
```

- [ ] **Step 12.5: Implement `api/portal/ticket-reply.js`**

```js
import { getServiceRoleClient } from './lib/supabase.js';
import { requirePortalSession } from './lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  let session;
  try { session = await requirePortalSession(req); }
  catch (e) { return res.status(e.status).json({ error: e.code }); }

  const { ticketId, message } = req.body || {};
  if (!ticketId || !message?.trim()) return res.status(400).json({ error: 'invalid_input' });

  const supabase = getServiceRoleClient();

  const { data: ticket, error: ticketErr } = await supabase
    .from('ai_conversations')
    .select('id, client_id, customer_email')
    .eq('id', ticketId)
    .eq('client_id', session.clientId)
    .eq('customer_email', session.customerEmail)
    .maybeSingle();

  if (ticketErr || !ticket) return res.status(404).json({ error: 'ticket_not_found' });

  await supabase
    .from('ai_conversations')
    .update({
      status: 'pending',
      updated_at: new Date().toISOString(),
      customer_follow_up: message.trim(),
    })
    .eq('id', ticketId);

  await supabase.from('portal_action_logs').insert({
    client_id: session.clientId,
    customer_email: session.customerEmail,
    action: 'ticket_reply',
    target_id: ticketId,
    metadata: { length: message.length },
    ip_inet: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null,
    user_agent: req.headers['user-agent'] || null,
  });

  return res.status(200).json({ ok: true });
}
```

Note: this adds a `customer_follow_up` column write. Add it in the migration (see step 12.6) because the existing `ai_conversations` schema may not have it.

- [ ] **Step 12.6: Amend migration to add `customer_follow_up` if absent**

Create a new migration `supabase/migrations/20260417000100_portal_ticket_reply.sql`:

```sql
alter table ai_conversations
  add column if not exists customer_follow_up text,
  add column if not exists customer_follow_up_at timestamptz;

create trigger ai_conversations_followup_timestamp
  before update of customer_follow_up on ai_conversations
  for each row
  when (new.customer_follow_up is distinct from old.customer_follow_up)
  execute function update_updated_at();
```

If `update_updated_at()` doesn't exist, replace the trigger with a simple:

```sql
-- before update trigger sets customer_follow_up_at when customer_follow_up changes
create or replace function set_customer_follow_up_at() returns trigger as $$
begin
  if new.customer_follow_up is distinct from old.customer_follow_up then
    new.customer_follow_up_at := now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists ai_conversations_followup_timestamp on ai_conversations;
create trigger ai_conversations_followup_timestamp
  before update on ai_conversations
  for each row execute function set_customer_follow_up_at();
```

Apply: `npx supabase db reset` or equivalent.

- [ ] **Step 12.7: Run tests**

Run: `npm test -- api/portal/ticket-reply.test.js`
Expected: 1 pass.

- [ ] **Step 12.8: Create `src/pages/portal/PortalTicketsListPage.jsx`**

```jsx
import { useEffect, useState } from 'react';

export default function PortalTicketsListPage({ navigate }) {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/portal/tickets', { credentials: 'same-origin' })
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((b) => setTickets(b.tickets))
      .catch(() => setError('Chargement impossible'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!tickets) return <p>Chargement…</p>;
  if (tickets.length === 0) return <p className="text-neutral-600">Aucune conversation pour le moment.</p>;

  return (
    <ul className="divide-y bg-white rounded-xl shadow-sm">
      {tickets.map((t) => (
        <li key={t.id}>
          <button onClick={() => navigate(`/portal/tickets/${t.id}`)}
            className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex justify-between">
            <span>
              <span className="font-medium">{t.subject || '(sans objet)'}</span>
              <span className="ml-2 text-xs text-neutral-500">{new Date(t.created_at).toLocaleDateString()}</span>
            </span>
            <span className="text-xs uppercase text-neutral-500">{t.status}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 12.9: Create `src/pages/portal/PortalTicketDetailPage.jsx`**

```jsx
import { useEffect, useState } from 'react';

export default function PortalTicketDetailPage({ ticketId, navigate }) {
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/portal/tickets', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((b) => setTicket(b.tickets.find((x) => x.id === ticketId) || null));
  }, [ticketId]);

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch('/api/portal/ticket-reply', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ticketId, message: reply }),
    });
    setBusy(false);
    if (r.ok) { setReply(''); navigate('/portal/tickets'); }
  }

  if (!ticket) return <p>Chargement…</p>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <button onClick={() => navigate('/portal/tickets')} className="text-sm text-neutral-500 mb-4">← Retour</button>
      <h1 className="text-lg font-semibold mb-2">{ticket.subject}</h1>
      <div className="prose prose-sm max-w-none mb-6 whitespace-pre-wrap">{ticket.ai_response || ticket.human_response || '(pas encore de réponse)'}</div>
      <form onSubmit={send}>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4}
          className="w-full border rounded p-3 mb-3" placeholder="Ta réponse…" />
        <button disabled={busy || !reply.trim()} className="bg-[var(--portal-primary,#0F766E)] text-white px-4 py-2 rounded disabled:opacity-50">
          Envoyer
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 12.10: Wire routes in `PortalApp.jsx`**

Replace the route resolution block with:

```jsx
let page;
const ticketMatch = route.match(/^\/portal\/tickets\/([^/]+)$/);
if (route === '/portal/login' || route === '/' || route === '') page = <PortalLoginPage />;
else if (route === '/portal/verify') page = <PortalVerifyPage navigate={navigate} />;
else if (route === '/portal/tickets') page = <PortalTicketsListPage navigate={navigate} />;
else if (ticketMatch) page = <PortalTicketDetailPage ticketId={ticketMatch[1]} navigate={navigate} />;
else page = <div>Page à venir · route: {route}</div>;
```

Add imports at top:
```jsx
import PortalTicketsListPage from './PortalTicketsListPage.jsx';
import PortalTicketDetailPage from './PortalTicketDetailPage.jsx';
```

- [ ] **Step 12.11: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 12.12: Commit**

```bash
git add api/portal/tickets.js api/portal/tickets.test.js api/portal/ticket-reply.js api/portal/ticket-reply.test.js src/pages/portal/PortalTicketsListPage.jsx src/pages/portal/PortalTicketDetailPage.jsx src/pages/portal/PortalApp.jsx supabase/migrations/20260417000100_portal_ticket_reply.sql
git commit -m "feat(portal): tickets list/detail with reply"
```

---

## Task 13: Orders list + detail + invoice

**Goal:** Customer sees Shopify orders and downloads invoice.

**Files:**
- Create: `api/portal/orders.js`
- Create: `api/portal/orders.test.js`
- Create: `api/portal/order-invoice.js`
- Create: `src/pages/portal/PortalOrdersListPage.jsx`
- Create: `src/pages/portal/PortalOrderDetailPage.jsx`
- Modify: `src/pages/portal/PortalApp.jsx`

- [ ] **Step 13.1: Write test for `api/portal/orders.js`**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './orders.js';
import { issueSessionJwt } from './lib/auth.js';

vi.mock('./lib/supabase.js', () => ({
  getServiceRoleClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({
              data: { provider: 'shopify', access_token: 'shpat_x', extra_config: { shop_domain: 'horace.myshopify.com' } },
              error: null,
            }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock('./lib/shopify.js', () => ({
  listOrdersByCustomerEmail: vi.fn(async () => [
    { id: 'o1', name: '#1001', total: '49.00', currency: 'EUR', financial_status: 'paid', fulfillment_status: 'fulfilled', created_at: '2026-04-12T10:00:00Z' },
  ]),
}));

beforeEach(() => {
  process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000';
});

describe('orders', () => {
  it('returns orders for the authenticated customer', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'paul@ex.com' });
    const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    await handler({ method: 'GET', headers: { cookie: `portal_session=${jwt}` } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.orders[0].name).toBe('#1001');
  });
});
```

- [ ] **Step 13.2: Create `api/portal/lib/shopify.js`**

```js
export async function listOrdersByCustomerEmail({ shopDomain, accessToken, email }) {
  const query = `query($q: String!) {
    orders(first: 20, query: $q, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id name totalPriceSet { presentmentMoney { amount currencyCode } }
        displayFinancialStatus displayFulfillmentStatus createdAt
        lineItems(first: 10) { nodes { id title quantity image { url } } }
      }
    }
  }`;
  const r = await fetch(`https://${shopDomain}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': accessToken, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables: { q: `email:${email}` } }),
  });
  if (!r.ok) throw new Error(`shopify_${r.status}`);
  const j = await r.json();
  return (j.data?.orders?.nodes || []).map((o) => ({
    id: o.id,
    name: o.name,
    total: o.totalPriceSet.presentmentMoney.amount,
    currency: o.totalPriceSet.presentmentMoney.currencyCode,
    financial_status: o.displayFinancialStatus?.toLowerCase(),
    fulfillment_status: o.displayFulfillmentStatus?.toLowerCase(),
    created_at: o.createdAt,
    lineItems: o.lineItems.nodes,
  }));
}

export async function getInvoicePdf({ shopDomain, accessToken, orderName }) {
  // Shopify's "Invoice" is typically emailed; for V1 we render a simple PDF server-side.
  // Real impl: hit Shopify REST /orders/{id}.json for data, render via a server-side template.
  // V1: return 501 until we ship PDF rendering.
  throw new Error('not_implemented');
}
```

- [ ] **Step 13.3: Implement `api/portal/orders.js`**

```js
import { getServiceRoleClient } from './lib/supabase.js';
import { requirePortalSession } from './lib/session.js';
import { listOrdersByCustomerEmail } from './lib/shopify.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  let session;
  try { session = await requirePortalSession(req); }
  catch (e) { return res.status(e.status).json({ error: e.code }); }

  const supabase = getServiceRoleClient();
  const { data: integ } = await supabase
    .from('client_integrations')
    .select('provider, access_token, extra_config')
    .eq('client_id', session.clientId)
    .eq('provider', 'shopify')
    .maybeSingle();

  if (!integ) return res.status(200).json({ orders: [], reason: 'no_shopify_integration' });

  try {
    const orders = await listOrdersByCustomerEmail({
      shopDomain: integ.extra_config?.shop_domain,
      accessToken: integ.access_token,
      email: session.customerEmail,
    });
    return res.status(200).json({ orders });
  } catch (e) {
    return res.status(500).json({ error: 'shopify_query_failed' });
  }
}
```

- [ ] **Step 13.4: Implement `api/portal/order-invoice.js`**

```js
import { getServiceRoleClient } from './lib/supabase.js';
import { requirePortalSession } from './lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  let session;
  try { session = await requirePortalSession(req); }
  catch (e) { return res.status(e.status).json({ error: e.code }); }

  // V1 stub: Shopify sends invoice emails natively; redirect customer to the Shopify order status URL.
  const supabase = getServiceRoleClient();
  const { data: integ } = await supabase
    .from('client_integrations')
    .select('access_token, extra_config')
    .eq('client_id', session.clientId)
    .eq('provider', 'shopify')
    .maybeSingle();

  if (!integ) return res.status(404).json({ error: 'no_shopify_integration' });

  const { orderName } = req.query;
  // Request Shopify to resend invoice email.
  const r = await fetch(
    `https://${integ.extra_config?.shop_domain}/admin/api/2024-10/orders.json?name=${encodeURIComponent(orderName)}&status=any`,
    { headers: { 'X-Shopify-Access-Token': integ.access_token } }
  );
  const j = await r.json();
  const order = j.orders?.[0];
  if (!order) return res.status(404).json({ error: 'order_not_found' });

  // Invoke Shopify's own invoice-email endpoint
  await fetch(
    `https://${integ.extra_config?.shop_domain}/admin/api/2024-10/orders/${order.id}/send_invoice.json`,
    {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': integ.access_token, 'content-type': 'application/json' },
      body: JSON.stringify({ invoice: { subject: 'Votre facture', custom_message: 'Voici votre facture.' } }),
    }
  );

  await supabase.from('portal_action_logs').insert({
    client_id: session.clientId,
    customer_email: session.customerEmail,
    action: 'invoice_download',
    target_id: orderName,
    metadata: { method: 'shopify_send_invoice' },
  });

  return res.status(200).json({ ok: true, sentTo: session.customerEmail });
}
```

- [ ] **Step 13.5: Create `PortalOrdersListPage.jsx`**

```jsx
import { useEffect, useState } from 'react';

export default function PortalOrdersListPage({ navigate }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/portal/orders', { credentials: 'same-origin' })
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((b) => setOrders(b.orders))
      .catch(() => setError('Chargement impossible'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!orders) return <p>Chargement…</p>;
  if (orders.length === 0) return <p className="text-neutral-600">Aucune commande trouvée avec ton email.</p>;

  return (
    <ul className="divide-y bg-white rounded-xl shadow-sm">
      {orders.map((o) => (
        <li key={o.id}>
          <button onClick={() => navigate(`/portal/orders/${encodeURIComponent(o.name)}`)}
            className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex justify-between">
            <span>
              <span className="font-medium">{o.name}</span>
              <span className="ml-2 text-xs text-neutral-500">{new Date(o.created_at).toLocaleDateString()}</span>
            </span>
            <span className="text-sm">{o.total} {o.currency} · <em className="text-neutral-500">{o.fulfillment_status || 'pending'}</em></span>
          </button>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 13.6: Create `PortalOrderDetailPage.jsx` (with refund/return/invoice buttons)**

```jsx
import { useEffect, useState } from 'react';

export default function PortalOrderDetailPage({ orderName, navigate }) {
  const [order, setOrder] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/api/portal/orders', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((b) => setOrder(b.orders.find((o) => o.name === decodeURIComponent(orderName)) || null));
  }, [orderName]);

  async function act(endpoint, body) {
    const r = await fetch(endpoint, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const b = await r.json();
    setMsg(r.ok ? 'Demande enregistrée. On te recontacte par email.' : `Erreur: ${b.error || 'unknown'}`);
  }

  async function invoice() {
    const r = await fetch(`/api/portal/order-invoice?orderName=${encodeURIComponent(decodeURIComponent(orderName))}`,
      { credentials: 'same-origin' });
    const b = await r.json();
    setMsg(r.ok ? `Facture envoyée à ${b.sentTo}` : 'Erreur envoi facture');
  }

  if (!order) return <p>Chargement…</p>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <button onClick={() => navigate('/portal/orders')} className="text-sm text-neutral-500">← Retour</button>
      <h1 className="text-lg font-semibold">Commande {order.name}</h1>
      <p className="text-sm text-neutral-600">Statut : {order.fulfillment_status || 'en préparation'} · Montant : {order.total} {order.currency}</p>
      <ul className="list-disc pl-5 text-sm">{(order.lineItems || []).map((li) => <li key={li.id}>{li.title} × {li.quantity}</li>)}</ul>
      <div className="flex gap-2 flex-wrap pt-4 border-t">
        <button onClick={() => act('/api/portal/request-refund', { orderName: order.name, reason: 'via_portal' })}
          className="px-3 py-2 rounded border hover:bg-neutral-50">Demander un remboursement</button>
        <button onClick={() => act('/api/portal/request-return', { orderName: order.name, reason: 'via_portal' })}
          className="px-3 py-2 rounded border hover:bg-neutral-50">Lancer un retour</button>
        <button onClick={invoice} className="px-3 py-2 rounded border hover:bg-neutral-50">Télécharger ma facture</button>
      </div>
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </div>
  );
}
```

- [ ] **Step 13.7: Wire routes in `PortalApp.jsx`**

Add imports:
```jsx
import PortalOrdersListPage from './PortalOrdersListPage.jsx';
import PortalOrderDetailPage from './PortalOrderDetailPage.jsx';
```

Extend route resolver:
```jsx
const orderMatch = route.match(/^\/portal\/orders\/([^/]+)$/);
// ... existing conditions ...
else if (route === '/portal/orders') page = <PortalOrdersListPage navigate={navigate} />;
else if (orderMatch) page = <PortalOrderDetailPage orderName={orderMatch[1]} navigate={navigate} />;
```

- [ ] **Step 13.8: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 13.9: Commit**

```bash
git add api/portal/orders.js api/portal/orders.test.js api/portal/order-invoice.js api/portal/lib/shopify.js src/pages/portal/PortalOrdersListPage.jsx src/pages/portal/PortalOrderDetailPage.jsx src/pages/portal/PortalApp.jsx
git commit -m "feat(portal): orders list, detail, and Shopify invoice resend"
```

---

## Task 14: Refund + return request endpoints

**Goal:** Customer-initiated refund/return → creates `ai_conversations` row with `intent`, routes through existing engine.

**Files:**
- Create: `api/portal/request-refund.js`
- Create: `api/portal/request-refund.test.js`
- Create: `api/portal/request-return.js`

- [ ] **Step 14.1: Write test for `request-refund.js`**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './request-refund.js';
import { issueSessionJwt } from './lib/auth.js';

let convInsert, logInsert;
vi.mock('./lib/supabase.js', () => ({
  getServiceRoleClient: () => ({
    from: (table) => ({
      insert: (row) => {
        if (table === 'ai_conversations') { convInsert = row; return Promise.resolve({ data: { id: 'conv-new' }, error: null }); }
        logInsert = row; return Promise.resolve({ error: null });
      },
      select: () => ({ single: () => Promise.resolve({ data: { id: 'conv-new' }, error: null }) }),
    }),
  }),
}));

beforeEach(() => {
  process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000';
  convInsert = null; logInsert = null;
});

describe('request-refund', () => {
  it('creates a conversation with intent=refund', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'paul@ex.com' });
    const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    await handler({ method: 'POST', headers: { cookie: `portal_session=${jwt}` }, body: { orderName: '#1001', reason: 'defective' } }, res);
    expect(res.statusCode).toBe(200);
    expect(convInsert.intent).toBe('refund');
    expect(convInsert.customer_email).toBe('paul@ex.com');
    expect(logInsert.action).toBe('refund_request');
  });
});
```

- [ ] **Step 14.2: Implement `api/portal/request-refund.js`**

```js
import { getServiceRoleClient } from './lib/supabase.js';
import { requirePortalSession } from './lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  let session;
  try { session = await requirePortalSession(req); }
  catch (e) { return res.status(e.status).json({ error: e.code }); }

  const { orderName, reason, photoUrl } = req.body || {};
  if (!orderName) return res.status(400).json({ error: 'order_required' });

  const supabase = getServiceRoleClient();

  const { data: conv, error: convErr } = await supabase.from('ai_conversations').insert({
    client_id: session.clientId,
    customer_email: session.customerEmail,
    subject: `Demande de remboursement ${orderName}`,
    status: 'pending',
    intent: 'refund',
    order_id: orderName,
    metadata: { reason, photoUrl, source: 'portal' },
  }).select().single();

  if (convErr) return res.status(500).json({ error: 'create_failed' });

  await supabase.from('portal_action_logs').insert({
    client_id: session.clientId,
    customer_email: session.customerEmail,
    action: 'refund_request',
    target_id: orderName,
    metadata: { conversation_id: conv.id, reason },
  });

  // Trigger the existing engine asynchronously (fire-and-forget).
  const engineUrl = process.env.PORTAL_ENGINE_TRIGGER_URL || `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/api/engine/process`;
  if (engineUrl) {
    fetch(engineUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-token': process.env.INTERNAL_TRIGGER_TOKEN || '' },
      body: JSON.stringify({ conversationId: conv.id }),
    }).catch(() => {});
  }

  return res.status(200).json({ ok: true, conversationId: conv.id });
}
```

- [ ] **Step 14.3: Add `intent` + `metadata` columns to `ai_conversations` if missing**

Add to migration `20260417000100_portal_ticket_reply.sql` (or create a new one):

```sql
alter table ai_conversations
  add column if not exists intent text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;
```

- [ ] **Step 14.4: Implement `api/portal/request-return.js`**

Same pattern as refund — just `intent = 'return'`, action name differs:

```js
import { getServiceRoleClient } from './lib/supabase.js';
import { requirePortalSession } from './lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  let session;
  try { session = await requirePortalSession(req); }
  catch (e) { return res.status(e.status).json({ error: e.code }); }

  const { orderName, reason, items } = req.body || {};
  if (!orderName) return res.status(400).json({ error: 'order_required' });

  const supabase = getServiceRoleClient();

  const { data: conv, error: convErr } = await supabase.from('ai_conversations').insert({
    client_id: session.clientId,
    customer_email: session.customerEmail,
    subject: `Demande de retour ${orderName}`,
    status: 'pending',
    intent: 'return',
    order_id: orderName,
    metadata: { reason, items, source: 'portal' },
  }).select().single();

  if (convErr) return res.status(500).json({ error: 'create_failed' });

  await supabase.from('portal_action_logs').insert({
    client_id: session.clientId,
    customer_email: session.customerEmail,
    action: 'return_request',
    target_id: orderName,
    metadata: { conversation_id: conv.id, reason, items },
  });

  const engineUrl = process.env.PORTAL_ENGINE_TRIGGER_URL || `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/api/engine/process`;
  if (engineUrl) {
    fetch(engineUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-token': process.env.INTERNAL_TRIGGER_TOKEN || '' },
      body: JSON.stringify({ conversationId: conv.id }),
    }).catch(() => {});
  }

  return res.status(200).json({ ok: true, conversationId: conv.id });
}
```

- [ ] **Step 14.5: Run tests**

Run: `npm test -- api/portal/request-refund.test.js`
Expected: 1 pass.

- [ ] **Step 14.6: Commit**

```bash
git add api/portal/request-refund.js api/portal/request-refund.test.js api/portal/request-return.js supabase/migrations/20260417000100_portal_ticket_reply.sql
git commit -m "feat(portal): customer-initiated refund + return create conversations"
```

---

## Task 15: E2E test + rollout config

**Goal:** End-to-end Playwright test proving the full flow, plus env/config for Vercel rollout.

**Files:**
- Create: `tests/e2e/portal.spec.js`
- Modify: `playwright.config.js` (or create if missing)
- Create: `docs/superpowers/plans/portal-rollout-checklist.md`

- [ ] **Step 15.1: Create `playwright.config.js` if missing**

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: process.env.PORTAL_E2E_BASE_URL || 'http://localhost:5173', headless: true },
  webServer: { command: 'npm run dev', port: 5173, reuseExistingServer: !process.env.CI },
});
```

- [ ] **Step 15.2: Write E2E test**

`tests/e2e/portal.spec.js`:

```js
import { test, expect } from '@playwright/test';

test.describe('portal end-to-end', () => {
  test('login page renders with merchant branding', async ({ page }) => {
    await page.goto('/?portal=1');
    await expect(page.getByText(/Mon espace SAV/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Recevoir mon lien/ })).toBeVisible();
  });

  test('submitting email shows confirmation', async ({ page }) => {
    await page.goto('/?portal=1');
    await page.getByPlaceholder('paul@example.com').fill('e2e-test@actero.fr');
    await page.getByRole('button', { name: /Recevoir mon lien/ }).click();
    await expect(page.getByText(/Vérifie ta boîte mail/)).toBeVisible({ timeout: 10_000 });
  });
});
```

Note: seed a test client row (`slug='e2e', portal_enabled=true`) in the test DB before running. The `?portal=1` query-string bypass in `App.jsx` makes this testable without DNS.

- [ ] **Step 15.3: Run E2E**

Run: `npm run test:e2e`
Expected: 2 tests pass (provided a test client exists + Resend in sandbox mode).

- [ ] **Step 15.4: Create rollout checklist**

`docs/superpowers/plans/portal-rollout-checklist.md`:

```markdown
# Portal rollout checklist

## Env vars (Vercel)
- [ ] PORTAL_JWT_SECRET — 64-byte random (openssl rand -hex 32)
- [ ] SUPABASE_SERVICE_ROLE_KEY — from Supabase dashboard
- [ ] VITE_SUPABASE_URL — already set
- [ ] PORTAL_BASE_DOMAIN = portal.actero.fr
- [ ] PORTAL_EMAIL_FROM = noreply@actero.fr
- [ ] RESEND_API_KEY — already set
- [ ] INTERNAL_TRIGGER_TOKEN — shared secret for /api/engine/process callback

## DNS (Vercel)
- [ ] A record `portal.actero.fr` → Vercel
- [ ] Wildcard record `*.portal.actero.fr` → Vercel (same project)
- [ ] Wildcard SSL auto-provisioned by Vercel

## Rollout phases
- [ ] Phase 0: portal_enabled=false for all clients; internal test via `?portal=1`
- [ ] Phase 1: flip portal_enabled=true for 3 pilot merchants
- [ ] Phase 2: default-on at signup
- [ ] Phase 3: custom domain opt-in UI in admin

## Per-merchant activation
- [ ] `update clients set portal_enabled=true where slug='<merchant>';`
- [ ] Set portal_display_name, portal_primary_color, portal_logo_url if non-default
- [ ] Smoke-test https://<slug>.portal.actero.fr
```

- [ ] **Step 15.5: Commit**

```bash
git add tests/e2e/portal.spec.js playwright.config.js docs/superpowers/plans/portal-rollout-checklist.md
git commit -m "test(portal): E2E + rollout checklist"
```

---

## Self-review notes

**Spec coverage:**
- Auth (magic link + JWT + cookie) → Tasks 3, 6, 7, 8 ✓
- Data model (portal_sessions, portal_action_logs, clients columns) → Task 2 + 14.3 ✓
- Routing detection + branding → Tasks 5, 9, 10, 11 ✓
- Tickets list + reply → Task 12 ✓
- Orders + invoice → Task 13 ✓
- Refund + return actions → Task 14 ✓
- RLS service_role only → Task 2 migration ✓
- Rate limiting → Task 4 ✓
- Audit log → inserted at every mutating endpoint ✓
- E2E + rollout → Task 15 ✓

**Known gaps for V1.5 (explicitly non-goals in spec):**
- Custom domain verification UI (admin-side) — Phase 3
- Cancel order / change shipping address — V2
- AI-generated refund/return form pre-fill — V1.5

**Open items to watch during execution:**
- Existing `ai_conversations` schema may already have `order_id` + other fields referenced; verify at Task 12/14 with a quick `\d ai_conversations`
- Resend/email-from domain needs DNS verification before sending to real customers
- The `/api/engine/process` callback signature is assumed — verify it accepts `{ conversationId }` and respects `x-internal-token`
