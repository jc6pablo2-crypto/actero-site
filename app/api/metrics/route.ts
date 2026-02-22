import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        // Basic auth check (replace with proper session cookies setup)
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
        }

        // Récupérer le client lié à l'utilisateur
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('clients')
            .select('id')
            .eq('owner_user_id', user.id)
            .single();

        if (profileErr || !profile?.id) {
            return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
        }

        // Call RPC to recompute
        const { data: metrics, error: rpcErr } = await supabaseAdmin.rpc('recompute_client_metrics', {
            p_client_id: profile.id
        });

        if (rpcErr) {
            console.error('RPC Error:', rpcErr);
            return NextResponse.json({ error: 'Erreur lors du calcul des métriques' }, { status: 500 });
        }

        return NextResponse.json({ data: metrics });

    } catch (err: any) {
        console.error('Metrics API Error:', err);
        return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
    }
}
