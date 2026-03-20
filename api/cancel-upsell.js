import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { upsell_id, client_id } = req.body;

  if (!upsell_id || !client_id) {
    return res.status(400).json({ error: 'Missing upsell_id or client_id' });
  }

  try {
    // Only allow deleting pending upsells that belong to this client
    const { data, error } = await supabase
      .from('client_upsells')
      .delete()
      .eq('id', upsell_id)
      .eq('client_id', client_id)
      .eq('status', 'pending')
      .select();

    if (error) {
      console.error('Cancel upsell error:', error);
      return res.status(500).json({ error: 'Erreur lors de l\'annulation' });
    }

    return res.status(200).json({ success: true, deleted: data?.length || 0 });
  } catch (err) {
    console.error('Cancel upsell error:', err.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
