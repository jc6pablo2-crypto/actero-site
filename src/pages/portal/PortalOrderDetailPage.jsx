import { useEffect, useState } from 'react';

export default function PortalOrderDetailPage({ orderName, navigate }) {
  const [order, setOrder] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/api/portal/orders', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((b) => setOrder(b.orders.find((o) => o.name === decodeURIComponent(orderName)) || null));
  }, [orderName]);

  async function act(endpoint, body) {
    const r = await fetch(endpoint, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const b = await r.json().catch(() => ({}));
    setMsg(r.ok ? 'Demande enregistrée. On te recontacte par email.' : `Erreur: ${b.error || 'unknown'}`);
  }

  async function invoice() {
    const r = await fetch(`/api/portal/order-invoice?orderName=${encodeURIComponent(decodeURIComponent(orderName))}`,
      { credentials: 'same-origin' });
    const b = await r.json().catch(() => ({}));
    setMsg(r.ok ? `Facture envoyée à ${b.sentTo}` : 'Erreur envoi facture');
  }

  if (!order) return <p>Chargement…</p>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <button onClick={() => navigate('/portal/orders')} className="text-sm text-neutral-500">← Retour</button>
      <h1 className="text-lg font-semibold">Commande {order.name}</h1>
      <p className="text-sm text-neutral-600">Statut : {order.fulfillment_status || 'en préparation'} · Montant : {order.total} {order.currency}</p>
      <ul className="list-disc pl-5 text-sm">{(order.lineItems || []).map((li) => <li key={li.id}>{li.title} × {li.quantity}</li>)}</ul>
      <div className="flex gap-2 flex-wrap pt-4 border-t">
        <button onClick={() => act('/api/portal/request-refund', { orderName: order.name, reason: 'via_portal' })}
          className="px-3 py-2 rounded border hover:bg-neutral-50">Demander un remboursement</button>
        <button onClick={() => act('/api/portal/request-return', { orderName: order.name, reason: 'via_portal' })}
          className="px-3 py-2 rounded border hover:bg-neutral-50">Lancer un retour</button>
        <button onClick={invoice} className="px-3 py-2 rounded border hover:bg-neutral-50">Télécharger ma facture</button>
      </div>
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </div>
  );
}
