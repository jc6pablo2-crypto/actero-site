import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from '../lib/rate-limit.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 5 signups per IP per hour
  const ip = getClientIp(req);
  const rl = checkRateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' });
  }

  const { email, password, brand_name, shopify_url } = req.body || {};

  // --- Validation ---
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
  }
  if (!brand_name || !brand_name.trim()) {
    return res.status(400).json({ error: 'Le nom de la boutique est requis.' });
  }

  let userId = null;
  let clientId = null;

  try {
    // 1. Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { brand_name, plan: 'free' },
    });

    if (authError) {
      // User already exists
      if (authError.message?.includes('already') || authError.status === 422) {
        return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });
      }
      console.error('[SIGNUP] Auth error:', authError);
      return res.status(500).json({ error: 'Erreur lors de la création du compte.' });
    }

    userId = authData.user.id;

    // 2. Create client row (always Free)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert([{
        brand_name: brand_name.trim(),
        contact_email: email,
        owner_user_id: userId,
        plan: 'free',
        status: 'active',
        ...(shopify_url && { shopify_url: shopify_url.trim() }),
      }])
      .select()
      .single();

    if (clientError) {
      console.error('[SIGNUP] Client creation error:', clientError);
      throw new Error('Failed to create client');
    }

    clientId = client.id;

    // 3. Create client_settings
    const { error: settingsError } = await supabase
      .from('client_settings')
      .insert([{
        client_id: clientId,
        hourly_cost: 25,
      }]);

    if (settingsError) {
      console.error('[SIGNUP] Settings creation error:', settingsError);
    }

    // 4. Create client_users (owner)
    const { error: linkError } = await supabase
      .from('client_users')
      .insert([{
        client_id: clientId,
        user_id: userId,
        role: 'owner',
      }]);

    if (linkError) {
      console.error('[SIGNUP] Client-user link error:', linkError);
    }

    // 5. Redirect to dashboard
    return res.status(200).json({
      success: true,
      redirect: '/client/overview',
    });

  } catch (err) {
    console.error('[SIGNUP] Unexpected error:', err);

    // Cleanup on failure
    try {
      if (clientId) {
        await supabase.from('client_users').delete().eq('client_id', clientId);
        await supabase.from('client_settings').delete().eq('client_id', clientId);
        await supabase.from('clients').delete().eq('id', clientId);
      }
      if (userId) {
        await supabase.auth.admin.deleteUser(userId);
      }
    } catch (cleanupErr) {
      console.error('[SIGNUP] Cleanup error:', cleanupErr);
    }

    return res.status(500).json({ error: 'Erreur interne. Veuillez réessayer.' });
  }
}
