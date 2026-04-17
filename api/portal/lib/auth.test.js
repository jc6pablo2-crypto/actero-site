import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateMagicLinkToken, hashToken, verifyTokenAgainstHash,
  issueSessionJwt, verifySessionJwt,
} from './auth.js';

describe('auth helpers', () => {
  beforeEach(() => {
    process.env.PORTAL_JWT_SECRET = 'test-secret-never-used-in-prod-0000000000000000';
  });

  it('generateMagicLinkToken returns a 64-char hex string', () => {
    expect(generateMagicLinkToken()).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hashToken + verify round-trip', async () => {
    const raw = generateMagicLinkToken();
    const hash = await hashToken(raw);
    expect(hash).not.toEqual(raw);
    expect(await verifyTokenAgainstHash(raw, hash)).toBe(true);
    expect(await verifyTokenAgainstHash('wrong', hash)).toBe(false);
  });

  it('issueSessionJwt + verify returns normalized payload', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'Paul@EX.com' });
    const payload = await verifySessionJwt(jwt);
    expect(payload.clientId).toBe('c1');
    expect(payload.customerEmail).toBe('paul@ex.com');
    expect(payload.exp - payload.iat).toBe(30 * 24 * 60 * 60);
  });

  it('verifySessionJwt throws for bad signature', async () => {
    const jwt = await issueSessionJwt({ clientId: 'c1', customerEmail: 'a@b.c' });
    const tampered = jwt.slice(0, -4) + 'zzzz';
    await expect(verifySessionJwt(tampered)).rejects.toThrow();
  });
});
