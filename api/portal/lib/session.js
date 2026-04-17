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
  try { return await verifySessionJwt(jwt); }
  catch { throw new PortalAuthError(401, 'invalid_session'); }
}
