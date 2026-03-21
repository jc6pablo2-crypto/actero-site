import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { client_id } = req.body;
  if (!client_id) {
    return res.status(400).json({ error: 'Missing client_id' });
  }

  try {
    // Find Stripe customer ID from funnel_clients
    const { data: funnel } = await supabaseAdmin
      .from('funnel_clients')
      .select('stripe_customer_id')
      .eq('onboarded_client_id', client_id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    if (!funnel?.stripe_customer_id) {
      return res.status(404).json({ error: 'No Stripe customer found for this client' });
    }

    // Create a Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: funnel.stripe_customer_id,
      return_url: `${process.env.SITE_URL || 'https://actero.fr'}/client/profile`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return res.status(500).json({ error: error.message });
  }
}
