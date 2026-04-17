import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './ticket-reply.js';
import { issueSessionJwt } from './lib/auth.js';

let inserted;
vi.mock('./lib/supabase.js', () => ({
  getServiceRoleClient: () => ({
    from: (table) => {
      if (table === 'ai_conversations') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 't1', client_id: 'c1', customer_email: 'paul@ex.com' }, error: null }) }) }) }) }),
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
