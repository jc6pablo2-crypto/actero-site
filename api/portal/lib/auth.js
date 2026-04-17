import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

function getSecret() {
  const s = process.env.PORTAL_JWT_SECRET;
  if (!s || s.length < 32) throw new Error('PORTAL_JWT_SECRET must be set (>=32 chars)');
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
  return new SignJWT({ clientId, customerEmail: customerEmail.toLowerCase() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(getSecret());
}

export async function verifySessionJwt(jwt) {
  const { payload } = await jwtVerify(jwt, getSecret(), { algorithms: ['HS256'] });
  return payload;
}
