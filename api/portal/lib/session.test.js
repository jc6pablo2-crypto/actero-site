import { describe, it, expect, beforeEach } from 'vitest';
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
    const r = await requirePortalSession(makeReq(`portal_session=${jwt}`));
    expect(r.clientId).toBe('c1');
    expect(r.customerEmail).toBe('paul@ex.com');
  });

  it('throws 401 for missing cookie', async () => {
    await expect(requirePortalSession(makeReq(''))).rejects.toMatchObject({ status: 401 });
  });

  it('throws 401 for tampered cookie', async () => {
    await expect(requirePortalSession(makeReq('portal_session=not-a-jwt'))).rejects.toMatchObject({ status: 401 });
  });
});
