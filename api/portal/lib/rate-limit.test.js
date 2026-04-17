import { describe, it, expect } from 'vitest';
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
