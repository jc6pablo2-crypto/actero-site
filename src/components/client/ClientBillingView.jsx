import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CreditCard, ExternalLink, Loader2, CheckCircle2,
  Calendar, FileText, ArrowUpRight, Zap,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'

export const ClientBillingView = ({ theme }) => {
  const toast = useToast()
  const [loadingPortal, setLoadingPortal] = useState(false)

  // Fetch client + subscription info
  const { data: client, isLoading } = useQuery({
    queryKey: ['billing-client'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      // Get client via client_users or owner
      const { data: link } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const clientId = link?.client_id
      let query = supabase.from('clients').select('*')
      if (clientId) {
        query = query.eq('id', clientId)
      } else {
        query = query.eq('owner_user_id', session.user.id)
      }
      const { data } = await query.single()
      return data
    },
  })

  // Fetch recent engine usage
  const { data: usage = {} } = useQuery({
    queryKey: ['billing-usage', client?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const [eventsRes, runsRes] = await Promise.all([
        supabase.from('automation_events').select('id', { count: 'exact', head: true }).eq('client_id', client.id).gte('created_at', thirtyDaysAgo),
        supabase.from('engine_runs_v2').select('id', { count: 'exact', head: true }).eq('client_id', client.id).gte('created_at', thirtyDaysAgo),
      ])
      return {
        events: eventsRes.count || 0,
        runs: runsRes.count || 0,
      }
    },
    enabled: !!client?.id,
  })

  const openStripePortal = async () => {
    setLoadingPortal(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ client_id: client?.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      } else {
        toast.error('Impossible d\'ouvrir le portail de facturation')
      }
    } catch (err) {
      toast.error('Erreur: ' + err.message)
    }
    setLoadingPortal(false)
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#9ca3af]" /></div>
  }

  const plan = client?.plan || 'croissance_automatisee'
  const status = client?.status || 'active'
  const createdAt = client?.payment_received_at || client?.created_at

  const PLANS = {
    croissance_automatisee: { name: 'Croissance Automatisee', price: '1 199', features: ['Agents IA illimites', 'Playbooks illimites', 'Support prioritaire', 'Integrations natives'] },
    starter: { name: 'Starter', price: '499', features: ['1 Agent IA', '3 Playbooks', 'Support email'] },
    enterprise: { name: 'Enterprise', price: 'Sur mesure', features: ['Tout Croissance', 'SLA garanti', 'Account manager dedie', 'Voice cloning'] },
  }

  const currentPlan = PLANS[plan] || PLANS.croissance_automatisee

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-[22px] font-semibold text-[#1a1a1a]">Facturation</h2>
        <p className="text-[13px] text-[#9ca3af] mt-1">Gerez votre abonnement, consultez vos factures et suivez votre consommation.</p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#f0f0f0] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">Plan actuel</p>
              <h3 className="text-[20px] font-bold text-[#1a1a1a] mt-1">{currentPlan.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-[28px] font-bold text-[#1a1a1a] tabular-nums">{currentPlan.price}€</p>
              <p className="text-[11px] text-[#9ca3af]">par mois</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              <CheckCircle2 className="w-3 h-3" />
              {status === 'active' ? 'Actif' : status === 'canceled' ? 'Annule' : 'En attente'}
            </span>
            {createdAt && (
              <span className="text-[11px] text-[#9ca3af] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Depuis {new Date(createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {currentPlan.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px] text-[#71717a]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5F35]" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#f0f0f0] px-6 py-4 flex items-center justify-between bg-[#fafafa]">
          <p className="text-[12px] text-[#9ca3af]">Gerez votre abonnement via Stripe</p>
          <button
            onClick={openStripePortal}
            disabled={loadingPortal || !client?.stripe_customer_id}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white text-[12px] font-semibold rounded-lg hover:bg-[#333] disabled:opacity-50 transition-colors"
          >
            {loadingPortal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
            Portail Stripe
          </button>
        </div>
      </div>

      {/* Usage this month */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-6">
        <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-4">Consommation ce mois</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[28px] font-bold text-[#1a1a1a] tabular-nums">{usage.runs}</p>
            <p className="text-[12px] text-[#9ca3af] mt-0.5">Runs moteur IA</p>
          </div>
          <div>
            <p className="text-[28px] font-bold text-[#1a1a1a] tabular-nums">{usage.events}</p>
            <p className="text-[12px] text-[#9ca3af] mt-0.5">Evenements traites</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={openStripePortal}
          disabled={!client?.stripe_customer_id}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#f0f0f0] hover:bg-[#fafafa] transition-colors text-left disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#1a1a1a]">Voir mes factures</p>
            <p className="text-[11px] text-[#9ca3af]">Historique complet sur Stripe</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#c4c4c4] ml-auto" />
        </button>

        <button
          onClick={openStripePortal}
          disabled={!client?.stripe_customer_id}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#f0f0f0] hover:bg-[#fafafa] transition-colors text-left disabled:opacity-50"
        >
          <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#1a1a1a]">Moyen de paiement</p>
            <p className="text-[11px] text-[#9ca3af]">Modifier ma carte bancaire</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#c4c4c4] ml-auto" />
        </button>
      </div>
    </div>
  )
}
