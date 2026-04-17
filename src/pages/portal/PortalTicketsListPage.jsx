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
  if (!tickets) return <p className="text-[#5A5A5A]">Chargement…</p>;
  if (tickets.length === 0) return <p className="text-[#5A5A5A]">Aucune conversation pour le moment.</p>;

  function statusChip(status) {
    if (status === 'resolved') {
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-full border bg-[#E8F5EC] text-[#1F3A12] border-[#A8C490]">
          {status}
        </span>
      );
    }
    return (
      <span className="text-xs px-2.5 py-0.5 rounded-full border bg-[#FEF3C7] text-[#8B7A50] border-[#F59E0B]/30">
        {status}
      </span>
    );
  }

  return (
    <ul className="divide-y bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] shadow-[0_2px_24px_rgba(0,0,0,0.06)] overflow-hidden">
      {tickets.map((t) => (
        <li key={t.id}>
          <button onClick={() => navigate(`/portal/tickets/${t.id}`)}
            className="w-full text-left px-4 py-3 hover:bg-[#FAFAFA] flex justify-between items-center">
            <span>
              <span className="font-semibold text-[#1A1A1A]">{t.subject || '(sans objet)'}</span>
              <span className="ml-2 text-xs text-[#8B8070]">{new Date(t.created_at).toLocaleDateString()}</span>
            </span>
            {statusChip(t.status)}
          </button>
        </li>
      ))}
    </ul>
  );
}
