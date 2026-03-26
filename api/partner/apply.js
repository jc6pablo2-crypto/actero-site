import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    company_name,
    activity_type,
    potential_clients,
    message,
  } = req.body || {};

  // Validation
  if (!first_name || typeof first_name !== 'string' || first_name.trim().length < 2) {
    return res.status(400).json({ error: 'Le prénom est requis (minimum 2 caractères).' });
  }
  if (!last_name || typeof last_name !== 'string' || last_name.trim().length < 2) {
    return res.status(400).json({ error: 'Le nom est requis (minimum 2 caractères).' });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Un email valide est requis.' });
  }
  if (!company_name || typeof company_name !== 'string' || company_name.trim().length < 2) {
    return res.status(400).json({ error: 'Le nom de la société est requis.' });
  }
  if (!activity_type || typeof activity_type !== 'string') {
    return res.status(400).json({ error: 'Le type d\'activité est requis.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Check for duplicate
    const { data: existing } = await supabase
      .from('partner_applications')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Une candidature avec cet email existe déjà.' });
    }

    // Insert application
    const { data, error } = await supabase
      .from('partner_applications')
      .insert([{
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        company_name: company_name.trim(),
        activity_type: activity_type.trim(),
        potential_clients: potential_clients || null,
        message: message ? message.trim() : null,
        status: 'new',
        source: 'partner_page',
      }])
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Partner apply error:', err);
    return res.status(500).json({ error: 'Erreur serveur. Veuillez réessayer.' });
  }
}
