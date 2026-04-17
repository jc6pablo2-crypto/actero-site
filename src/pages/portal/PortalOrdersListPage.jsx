import { useEffect, useState } from 'react';

export default function PortalOrdersListPage({ navigate }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/portal/orders', { credentials: 'same-origin' })
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((b) => setOrders(b.orders))
      .catch(() => setError('Chargement impossible'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!orders) return <p>Chargement…</p>;
  if (orders.length === 0) return <p className="text-neutral-600">Aucune commande trouvée avec ton email.</p>;

  return (
    <ul className="divide-y bg-white rounded-xl shadow-sm">
      {orders.map((o) => (
        <li key={o.id}>
          <button onClick={() => navigate(`/portal/orders/${encodeURIComponent(o.name)}`)}
            className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex justify-between">
            <span>
              <span className="font-medium">{o.name}</span>
              <span className="ml-2 text-xs text-neutral-500">{new Date(o.created_at).toLocaleDateString()}</span>
            </span>
            <span className="text-sm">{o.total} {o.currency} · <em className="text-neutral-500">{o.fulfillment_status || 'pending'}</em></span>
          </button>
        </li>
      ))}
    </ul>
  );
}
