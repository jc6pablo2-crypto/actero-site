// Client Copilot — AI assistant for client dashboard questions
import { createClient } from '@supabase/supabase-js';

const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `Tu es Actero Copilot, l'assistant IA du dashboard client Actero. Tu aides les clients à comprendre leurs métriques, résoudre leurs problèmes et répondre à leurs questions.

RÈGLES:
- Réponds en français, de manière concise et professionnelle
- Tu as accès aux données du client (métriques, événements, paramètres, connexion Shopify)
- Explique les métriques de manière simple et actionnable
- Si le client a un problème technique, guide-le étape par étape
- Si tu ne peux pas résoudre le problème, dis-lui de contacter le support via l'onglet "Support & Demandes"
- Ne révèle JAMAIS les tokens d'accès, clés API ou données sensibles
- Sois encourageant sur les résultats positifs
- Suggère des optimisations basées sur les données

TU PEUX AIDER AVEC:
- Comprendre les KPIs (ROI, temps économisé, tickets résolus, etc.)
- Expliquer comment fonctionnent les automatisations
- Résoudre les problèmes de connexion Shopify
- Questions sur la facturation et l'abonnement
- Conseils pour améliorer les performances
- FAQ: "Comment fonctionne le SAV automatique ?", "Pourquoi mon ROI a baissé ?", etc.

TU NE PEUX PAS:
- Modifier les workflows (dis-leur de contacter le support)
- Accéder aux données d'autres clients
- Changer les paramètres de facturation (redirige vers le portail Stripe dans Mon Profil)
- Donner des conseils juridiques ou financiers`;

async function askGemini(systemPrompt, userPrompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Je ne peux pas répondre pour le moment.';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!GEMINI_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY missing' });

  const { client_id, message, history } = req.body;
  if (!client_id || !message) return res.status(400).json({ error: 'Missing client_id or message' });

  try {
    // Fetch client context
    const [clientRes, settingsRes, shopifyRes, metricsRes, eventsRes] = await Promise.all([
      supabase.from('clients').select('id, brand_name, client_type, status, contact_email, created_at').eq('id', client_id).single(),
      supabase.from('client_settings').select('*').eq('client_id', client_id).maybeSingle(),
      supabase.from('client_shopify_connections').select('shop_domain, scopes, created_at').eq('client_id', client_id).maybeSingle(),
      supabase.from('metrics_daily').select('date, time_saved_minutes, estimated_roi, tasks_executed, tickets_total, tickets_auto').eq('client_id', client_id).order('date', { ascending: false }).limit(30),
      supabase.from('automation_events').select('event_category, created_at, revenue_amount, time_saved_seconds').eq('client_id', client_id).order('created_at', { ascending: false }).limit(50),
    ]);

    const client = clientRes.data;
    const settings = settingsRes.data;
    const shopify = shopifyRes.data;
    const metrics = metricsRes.data || [];
    const events = eventsRes.data || [];

    if (!client) return res.status(404).json({ error: 'Client not found' });

    // Compute summary stats
    const totalRoi = metrics.reduce((s, m) => s + (Number(m.estimated_roi) || 0), 0);
    const totalTimeSaved = Math.round(metrics.reduce((s, m) => s + (Number(m.time_saved_minutes) || 0), 0) / 60);
    const totalTasks = metrics.reduce((s, m) => s + (Number(m.tasks_executed) || 0), 0);
    const totalTickets = metrics.reduce((s, m) => s + (Number(m.tickets_total) || 0), 0);
    const totalTicketsAuto = metrics.reduce((s, m) => s + (Number(m.tickets_auto) || 0), 0);
    const autoRate = totalTickets > 0 ? Math.round((totalTicketsAuto / totalTickets) * 100) : 0;

    // Event breakdown
    const eventCounts = {};
    events.forEach(e => { eventCounts[e.event_category] = (eventCounts[e.event_category] || 0) + 1; });

    const context = `
DONNÉES DU CLIENT "${client.brand_name}":
- Type: ${client.client_type}
- Statut: ${client.status}
- Membre depuis: ${new Date(client.created_at).toLocaleDateString('fr-FR')}
${shopify ? `- Boutique Shopify: ${shopify.shop_domain} (connectée le ${new Date(shopify.created_at).toLocaleDateString('fr-FR')})` : '- Shopify: Non connecté'}
${settings ? `- Abonnement: ${settings.actero_monthly_price}€/mois, coût horaire: ${settings.hourly_cost}€/h` : ''}

MÉTRIQUES (30 derniers jours):
- ROI généré: ${totalRoi}€
- Temps économisé: ${totalTimeSaved}h
- Actions IA: ${totalTasks}
- Tickets traités: ${totalTickets} (${autoRate}% automatisés)

ÉVÉNEMENTS RÉCENTS:
${Object.entries(eventCounts).map(([cat, count]) => `- ${cat}: ${count}`).join('\n') || 'Aucun événement'}

${history ? `HISTORIQUE DE CONVERSATION:\n${history}` : ''}

QUESTION DU CLIENT: ${message}`;

    const reply = await askGemini(SYSTEM_PROMPT, context);
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Client Copilot error:', error);
    return res.status(500).json({ error: error.message });
  }
}
