import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './request-refund.js';
import { issueSessionJwt } from './lib/auth.js';

let convInsert, logInsert;
vi.mock('./lib/supabase.js', () => ({
  getServiceRoleClient: () => ({
    from: (table) => ({
      insert: (row) => {
        if (table === 'ai_conversations') {
          convInsert = row;
          return { select: () => ({ single: () => Promise.resolve({ data: { id: 'conv-new' }, error: null }) }) };
        }
        logInsert = row;
        return Promise.resolve({ error: null });
      },
    }),
  }),
}));

beforeEach(() => {
  process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000';
  convInsert = null; logInsert = null;
});

describe('request-refund', () => {
  it('creates conversation with intent=refund and logs', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'paul@ex.com' });
    const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    await handler({ method: 'POST', headers: { cookie: `portal_session=${jwt}` }, body: { orderName: '#1001', reason: 'defective' } }, res);
    expect(res.statusCode).toBe(200);
    expect(convInsert.intent).toBe('refund');
    expect(convInsert.customer_email).toBe('paul@ex.com');
    expect(logInsert.action).toBe('refund_request');
  });
});
