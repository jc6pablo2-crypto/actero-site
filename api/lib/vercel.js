/**
 * Minimal Vercel REST client for managing custom domains on the project.
 *
 * All functions read:
 *   VERCEL_TOKEN       — personal/team token with `domains` scope
 *   VERCEL_PROJECT_ID  — e.g. "prj_vt6GhTPyIfEmREYAF33hSNs3c5gQ"
 *   VERCEL_TEAM_ID     — e.g. "team_oCP0xn1U1UvS4ieKLyIdigOI"
 *
 * If VERCEL_TOKEN is unset, helpers resolve to { ok: false, reason: 'not_configured' }
 * so the DB write path still succeeds — an admin can manually add the domain later.
 *
 * We target:
 *   POST   /v10/projects/{projectId}/domains?teamId=…   — add
 *   DELETE /v9/projects/{projectId}/domains/{domain}?teamId=…   — remove
 *   GET    /v9/projects/{projectId}/domains/{domain}?teamId=…   — status
 *   GET    /v6/domains/{domain}/config?teamId=…                 — misconfiguration check
 */

const API = 'https://api.vercel.com'

function creds() {
  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID
  if (!token || !projectId || !teamId) return null
  return { token, projectId, teamId }
}

async function callVercel(path, init = {}) {
  const c = creds()
  if (!c) return { ok: false, status: 0, reason: 'not_configured' }
  const url = `${API}${path}${path.includes('?') ? '&' : '?'}teamId=${c.teamId}`
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        'Authorization': `Bearer ${c.token}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, status: res.status, error: body?.error || body, body }
    }
    return { ok: true, status: res.status, body }
  } catch (e) {
    return { ok: false, status: 0, reason: 'network_error', error: String(e) }
  }
}

export async function addDomainToProject(domain) {
  const c = creds()
  if (!c) return { ok: false, reason: 'not_configured' }
  return callVercel(`/v10/projects/${c.projectId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
  })
}

export async function removeDomainFromProject(domain) {
  const c = creds()
  if (!c) return { ok: false, reason: 'not_configured' }
  return callVercel(
    `/v9/projects/${c.projectId}/domains/${encodeURIComponent(domain)}`,
    { method: 'DELETE' }
  )
}

export async function getProjectDomain(domain) {
  const c = creds()
  if (!c) return { ok: false, reason: 'not_configured' }
  return callVercel(
    `/v9/projects/${c.projectId}/domains/${encodeURIComponent(domain)}`,
    { method: 'GET' }
  )
}

export async function getDomainConfig(domain) {
  const c = creds()
  if (!c) return { ok: false, reason: 'not_configured' }
  // v6/domains/{domain}/config returns `{ misconfigured: bool, conflicts: [...] }`
  return callVercel(
    `/v6/domains/${encodeURIComponent(domain)}/config`,
    { method: 'GET' }
  )
}

/**
 * Replace the old domain with the new one on the Vercel project.
 * Safe to call when `prev` is null or `next` is null.
 * Returns { add, remove } with per-call results — callers can log or display warnings.
 */
export async function syncProjectDomain({ prev, next }) {
  const result = { add: null, remove: null }
  if (prev && prev !== next) {
    result.remove = await removeDomainFromProject(prev)
  }
  if (next && next !== prev) {
    result.add = await addDomainToProject(next)
    // If Vercel says the domain already exists on this project, treat as success.
    if (!result.add.ok && result.add.status === 409) {
      result.add = { ...result.add, ok: true, note: 'already_on_project' }
    }
  }
  return result
}
