import { useEffect, useState } from 'react';

export function usePortalClient() {
  const [state, setState] = useState({ loading: true, client: null, error: null });

  useEffect(() => {
    const hostname = window.location.hostname;
    fetch(`/api/portal/resolve-client?hostname=${encodeURIComponent(hostname)}`)
      .then((r) => r.json().then((b) => ({ ok: r.ok, body: b })))
      .then(({ ok, body }) => {
        if (!ok) return setState({ loading: false, client: null, error: body.error });
        setState({ loading: false, client: body, error: null });
      })
      .catch((e) => setState({ loading: false, client: null, error: e.message }));
  }, []);

  return state;
}
