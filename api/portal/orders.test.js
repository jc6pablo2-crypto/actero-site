import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './orders.js';
import { issueSessionJwt } from './lib/auth.js';

vi.mock('./lib/supabase.js', () => ({
  getServiceRoleClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({
        data: { provider: 'shopify', access_token: 'shpat_x', extra_config: { shop_domain: 'horace.myshopify.com' } }, error: null,
      }) }) }) }),
    }),
  }),
}));

vi.mock('./lib/shopify.js', () => ({
  listOrdersByCustomerEmail: vi.fn(async () => [
    { id: 'o1', name: '#1001', total: '49.00', currency: 'EUR', financial_status: 'paid', fulfillment_status: 'fulfilled', created_at: '2026-04-12T10:00:00Z' },
  ]),
}));

beforeEach(() => { process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000'; });

describe('orders', () => {
  it('returns orders for the authenticated customer', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'paul@ex.com' });
    const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    await handler({ method: 'GET', headers: { cookie: `portal_session=${jwt}` } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.orders[0].name).toBe('#1001');
  });
});
