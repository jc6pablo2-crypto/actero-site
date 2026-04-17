import { useEffect, useState } from 'react';

export default function PortalTicketsListPage({ navigate }) {
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/portal/tickets', { credentials: 'same-origin' })
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((b) => setTickets(b.tickets))
      .catch(() => setError('Chargement impossible'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!tickets) return <p>Chargement…</p>;
  if (tickets.length === 0) return <p className="text-neutral-600">Aucune conversation pour le moment.</p>;

  return (
    <ul className="divide-y bg-white rounded-xl shadow-sm">
      {tickets.map((t) => (
        <li key={t.id}>
          <button onClick={() => navigate(`/portal/tickets/${t.id}`)}
            className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex justify-between">
            <span>
              <span className="font-medium">{t.subject || '(sans objet)'}</span>
              <span className="ml-2 text-xs text-neutral-500">{new Date(t.created_at).toLocaleDateString()}</span>
            </span>
            <span className="text-xs uppercase text-neutral-500">{t.status}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
