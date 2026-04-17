import { useEffect, useState } from 'react';
import { usePortalClient } from '../../hooks/usePortalClient.js';

export default function PortalVerifyPage({ navigate }) {
  const { client } = usePortalClient();
  const [state, setState] = useState('verifying');

  useEffect(() => {
    if (!client) return;
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setState('error'); return; }
    fetch('/api/portal/verify-token', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, clientId: client.clientId }),
    }).then((r) => {
      if (r.ok) { setState('ok'); navigate('/portal/tickets'); }
      else setState('expired');
    }).catch(() => setState('error'));
  }, [client, navigate]);

  if (state === 'verifying') return <p className="text-[#5A5A5A]">Connexion…</p>;
  if (state === 'expired') return <p className="text-[#5A5A5A]">Ce lien a expiré. <a href="/portal/login" className="text-[#1F3A12] hover:underline">Redemande-en un</a>.</p>;
  if (state === 'error') return <p className="text-[#5A5A5A]">Erreur inconnue.</p>;
  return null;
}
