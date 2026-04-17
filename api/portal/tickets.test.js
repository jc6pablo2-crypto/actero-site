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
  it('returns customer tickets', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'paul@ex.com' });
    const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    await handler({ method: 'GET', headers: { cookie: `portal_session=${jwt}` } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.tickets).toHaveLength(1);
  });

  it('401 without cookie', async () => {
    const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(401);
  });
});
