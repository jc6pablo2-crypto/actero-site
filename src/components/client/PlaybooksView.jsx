import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, ShoppingBag, Headphones, Loader2, Play, Pause,
  CheckCircle2, AlertTriangle, Plug, ArrowRight, Star,
  Mail, MessageSquare, Clock, Gift, Shield, Heart,
  Search, TrendingUp, Package,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'

/* ═══════════ PLAYBOOK METADATA ═══════════ */

const PLAYBOOK_META = {
  sav_ecommerce: {
    icon: Headphones, color: 'from-emerald-500 to-emerald-700',
    requires: [{ type: 'any', providers: ['gmail', 'gorgias', 'zendesk'], label: 'Gmail, Gorgias ou Zendesk' }],
    recommended: ['slack'],
  },
  abandoned_cart: {
    icon: ShoppingBag, color: 'from-amber-500 to-amber-700',
    requires: [{ type: 'all', providers: ['shopify'], label: 'Shopify' }],
    recommended: [],
  },
  shipping_tracker: {
    icon: Package, color: 'from-blue-500 to-blue-700',
    requires: [
      { type: 'all', providers: ['shopify'], label: 'Shopify' },
      { type: 'any', providers: ['gmail', 'gorgias', 'zendesk'], label: 'Gmail, Gorgias ou Zendesk' },
    ],
    recommended: [],
  },
  order_issue_handler: {
    icon: AlertTriangle, color: 'from-red-500 to-red-700',
    requires: [{ type: 'any', providers: ['gmail', 'gorgias', 'zendesk'], label: 'Gmail, Gorgias ou Zendesk' }],
    recommended: ['slack'],
  },
  promo_code_handler: {
    icon: Gift, color: 'from-pink-500 to-pink-700',
    requires: [{ type: 'any', providers: ['gmail'], label: 'Gmail ou widget' }],
    recommended: [],
  },
  vip_customer_care: {
    icon: Star, color: 'from-violet-500 to-violet-700',
    requires: [
      { type: 'any', providers: ['gmail', 'gorgias', 'zendesk'], label: 'Gmail, Gorgias ou Zendesk' },
      { type: 'all', providers: ['slack'], label: 'Slack' },
    ],
    recommended: ['shopify'],
  },
  anti_churn: {
    icon: Shield, color: 'from-rose-500 to-rose-700',
    requires: [{ type: 'any', providers: ['gmail', 'gorgias', 'zendesk'], label: 'Gmail, Gorgias ou Zendesk' }],
    recommended: ['slack'],
  },
  post_purchase_followup: {
    icon: Mail, color: 'from-cyan-500 to-cyan-700',
    requires: [{ type: 'all', providers: ['shopify'], label: 'Shopify' }],
    recommended: [],
  },
  winback_inactive: {
    icon: TrendingUp, color: 'from-indigo-500 to-indigo-700',
    requires: [{ type: 'all', providers: ['shopify'], label: 'Shopify' }],
    recommended: [],
  },
  review_collector: {
    icon: MessageSquare, color: 'from-teal-500 to-teal-700',
    requires: [{ type: 'all', providers: ['shopify'], label: 'Shopify' }],
    recommended: [],
  },
  support_technique: {
    icon: Headphones, color: 'from-gray-500 to-gray-700',
    requires: [{ type: 'any', providers: ['gmail', 'gorgias', 'zendesk'], label: 'Gmail, Gorgias ou Zendesk' }],
    recommended: [],
  },
}

/* ═══════════ COMPONENT ═══════════ */

export const PlaybooksView = ({ clientId, setActiveTab, theme }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [expandedPlaybook, setExpandedPlaybook] = useState(null)

  // All playbooks
  const { data: playbooks = [], isLoading: loadingPb } = useQuery({
    queryKey: ['playbooks-list'],
    queryFn: async () => {
      const { data } = await supabase.from('engine_playbooks').select('*').eq('is_active', true).order('display_name')
      return data || []
    },
  })

  // Client's associations
  const { data: clientPlaybooks = [] } = useQuery({
    queryKey: ['client-playbooks', clientId],
    queryFn: async () => {
      const { data } = await supabase.from('engine_client_playbooks').select('*').eq('client_id', clientId)
      return data || []
    },
    enabled: !!clientId,
  })

  // Connected integrations
  const { data: connectedProviders = [] } = useQuery({
    queryKey: ['connected-providers', clientId],
    queryFn: async () => {
      const [intRes, shopRes] = await Promise.all([
        supabase.from('client_integrations').select('provider').eq('client_id', clientId).eq('status', 'active'),
        supabase.from('client_shopify_connections').select('id').eq('client_id', clientId).maybeSingle(),
      ])
      const providers = (intRes.data || []).map(i => i.provider)
      if (shopRes.data) providers.push('shopify')
      return providers
    },
    enabled: !!clientId,
  })

  // Recent runs
  const { data: recentRuns = [] } = useQuery({
    queryKey: ['client-runs-stats', clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('engine_runs_v2')
        .select('playbook_id, status, confidence')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(100)
      return data || []
    },
    enabled: !!clientId,
  })

  // Check if requirements are met for a playbook
  const checkRequirements = (playbookName) => {
    const meta = PLAYBOOK_META[playbookName]
    if (!meta?.requires) return { met: true, missing: [] }

    const missing = []
    for (const req of meta.requires) {
      if (req.type === 'all') {
        const allConnected = req.providers.every(p => connectedProviders.includes(p))
        if (!allConnected) missing.push(req.label)
      } else if (req.type === 'any') {
        const anyConnected = req.providers.some(p => connectedProviders.includes(p))
        if (!anyConnected) missing.push(req.label)
      }
    }

    return { met: missing.length === 0, missing }
  }

  const getRecommended = (playbookName) => {
    const meta = PLAYBOOK_META[playbookName]
    if (!meta?.recommended) return []
    return meta.recommended.filter(p => !connectedProviders.includes(p))
  }

  const isActive = (playbookId) => clientPlaybooks.some(cp => cp.playbook_id === playbookId && cp.is_active)

  const getStats = (playbookId) => {
    const runs = recentRuns.filter(r => r.playbook_id === playbookId)
    const completed = runs.filter(r => r.status === 'completed').length
    return { total: runs.length, rate: runs.length > 0 ? Math.round(completed / runs.length * 100) : 0 }
  }

  const handleToggle = async (playbook) => {
    const reqs = checkRequirements(playbook.name)
    if (!reqs.met) {
      toast.error(`Connectez d'abord : ${reqs.missing.join(', ')}`)
      return
    }

    const existing = clientPlaybooks.find(cp => cp.playbook_id === playbook.id)
    const currentlyActive = existing?.is_active || false

    if (existing) {
      await supabase.from('engine_client_playbooks').update({
        is_active: !currentlyActive,
        [!currentlyActive ? 'activated_at' : 'deactivated_at']: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await supabase.from('engine_client_playbooks').insert({
        client_id: clientId,
        playbook_id: playbook.id,
        is_active: true,
        activated_at: new Date().toISOString(),
      })
    }

    queryClient.invalidateQueries({ queryKey: ['client-playbooks', clientId] })
    toast.success(!currentlyActive ? `"${playbook.display_name}" active` : `"${playbook.display_name}" desactive`)
  }

  if (loadingPb) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#716D5C]" /></div>

  const activeCount = playbooks.filter(p => isActive(p.id)).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#262626]">Mes Playbooks</h2>
        <p className="text-sm text-[#716D5C] mt-1">
          {activeCount > 0
            ? `${activeCount} playbook${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''} — votre agent traite automatiquement les evenements correspondants.`
            : 'Activez un playbook pour que votre agent commence a traiter les demandes automatiquement.'}
        </p>
      </div>

      <div className="space-y-3">
        {playbooks.map(playbook => {
          const meta = PLAYBOOK_META[playbook.name] || { icon: Zap, color: 'from-gray-500 to-gray-700' }
          const Icon = meta.icon
          const active = isActive(playbook.id)
          const reqs = checkRequirements(playbook.name)
          const recommended = getRecommended(playbook.name)
          const stats = getStats(playbook.id)
          const isExpanded = expandedPlaybook === playbook.id

          return (
            <div
              key={playbook.id}
              className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                active ? 'border-[#0F5F35] ring-1 ring-[#0F5F35]/20' : reqs.met ? 'border-gray-200' : 'border-gray-100 opacity-70'
              }`}
            >
              {/* Main row */}
              <div className="p-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${meta.color} flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedPlaybook(isExpanded ? null : playbook.id)}>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-[#262626]">{playbook.display_name}</p>
                    {active && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">
                        <Play className="w-3 h-3" /> Actif
                      </span>
                    )}
                    {!reqs.met && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full">
                        <Plug className="w-3 h-3" /> Integration requise
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#716D5C] mt-0.5 line-clamp-1">{playbook.description}</p>
                </div>

                {/* Stats */}
                {stats.total > 0 && (
                  <div className="hidden md:flex gap-3 flex-shrink-0 text-center">
                    <div>
                      <p className="text-sm font-bold text-[#262626]">{stats.total}</p>
                      <p className="text-[9px] text-[#716D5C] uppercase">Runs</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-600">{stats.rate}%</p>
                      <p className="text-[9px] text-[#716D5C] uppercase">Auto</p>
                    </div>
                  </div>
                )}

                {/* Toggle or Connect button */}
                {reqs.met ? (
                  <button
                    onClick={() => handleToggle(playbook)}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${active ? 'bg-[#0F5F35]' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('integrations')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full hover:bg-amber-100 transition-colors flex-shrink-0"
                  >
                    <Plug className="w-3 h-3" /> Connecter
                  </button>
                )}
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100"
                  >
                    <div className="p-4 space-y-3">
                      {/* Requirements */}
                      <div>
                        <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">Prerequis</p>
                        <div className="space-y-1.5">
                          {(PLAYBOOK_META[playbook.name]?.requires || []).map((req, i) => {
                            const isMet = req.type === 'all'
                              ? req.providers.every(p => connectedProviders.includes(p))
                              : req.providers.some(p => connectedProviders.includes(p))
                            return (
                              <div key={i} className="flex items-center gap-2">
                                {isMet
                                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                <span className={`text-xs ${isMet ? 'text-[#262626]' : 'text-amber-700'}`}>
                                  {req.label} {isMet ? '— connecte' : '— a connecter'}
                                </span>
                                {!isMet && (
                                  <button onClick={() => setActiveTab('integrations')} className="text-[10px] text-[#0F5F35] font-bold hover:underline">
                                    Connecter →
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Recommended */}
                      {recommended.length > 0 && (
                        <div className="p-2.5 bg-blue-50 rounded-lg">
                          <p className="text-[10px] text-blue-700 font-bold">
                            Recommande : connectez {recommended.join(', ')} pour une meilleure experience
                          </p>
                        </div>
                      )}

                      {/* How it works */}
                      <div>
                        <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-1">Comment ca marche</p>
                        <p className="text-xs text-[#716D5C]">
                          Quand un evenement ({(playbook.event_types || []).join(', ')}) arrive pour votre compte,
                          le moteur Actero le classifie automatiquement et execute les actions du playbook
                          (seuil de confiance : {Math.round((playbook.confidence_threshold || 0.85) * 100)}%).
                          Si l'IA n'est pas assez confiante, l'evenement passe en review humaine dans l'onglet Escalades.
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {(playbook.event_types || []).map(et => (
                          <span key={et} className="px-2 py-0.5 bg-[#F9F7F1] rounded text-[9px] font-mono text-[#716D5C]">{et}</span>
                        ))}
                        <span className="px-2 py-0.5 bg-blue-50 rounded text-[9px] text-blue-600 font-bold">
                          {(playbook.actions_available || []).length} actions
                        </span>
                        <span className="px-2 py-0.5 bg-violet-50 rounded text-[9px] text-violet-600 font-bold">
                          Seuil: {Math.round((playbook.confidence_threshold || 0.85) * 100)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
