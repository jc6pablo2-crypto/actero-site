import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingDown, RefreshCw, Sparkles, AlertTriangle, AlertCircle, Euro,
  X, ChevronRight, User, Calendar, ShoppingBag, Zap, MessageSquare,
  CheckCircle2, Target, Tag, Heart, Phone, RotateCw, Filter, Loader2,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'

// ---------- Helpers ----------

const riskBadge = (risk) => {
  if (risk >= 70) return { label: 'Eleve', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' }
  if (risk >= 40) return { label: 'Moyen', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-500' }
  return { label: 'Faible', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' }
}

const fmtMoney = (n) => {
  const x = Number(n || 0)
  return `${x.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} \u20AC`
}

const fmtDate = (iso) => {
  if (!iso) return '\u2014'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '\u2014'
  }
}

const relativeFromNow = (iso) => {
  if (!iso) return 'jamais'
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.round(ms / (3600 * 1000))
  if (h < 1) return 'il y a quelques minutes'
  if (h < 24) return `il y a ${h} heure${h > 1 ? 's' : ''}`
  const d = Math.round(h / 24)
  return `il y a ${d} jour${d > 1 ? 's' : ''}`
}

const initialsFromEmail = (email) => {
  if (!email) return '?'
  const name = email.split('@')[0] || '?'
  return name.slice(0, 2).toUpperCase()
}

// ---------- Stat Card ----------

const StatCard = ({ label, value, sub, icon: Icon, tone = 'default' }) => {
  const toneMap = {
    red: 'text-red-600',
    orange: 'text-orange-600',
    emerald: 'text-emerald-600',
    default: 'text-[#262626]',
  }
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={`w-4 h-4 ${toneMap[tone] || toneMap.default}`} />}
        <span className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${toneMap[tone] || toneMap.default}`}>{value}</p>
      {sub && <p className="text-xs text-[#716D5C] mt-1">{sub}</p>}
    </div>
  )
}

// ---------- Drawer ----------

const ActionIcon = ({ type }) => {
  const map = {
    discount: Tag,
    personal_contact: Phone,
    apology: Heart,
    upsell: ShoppingBag,
    winback: RotateCw,
  }
  const Icon = map[type] || Sparkles
  return <Icon className="w-4 h-4" />
}

const PredictionDrawer = ({ prediction, clientId, onClose, onChanged }) => {
  const toast = useToast()
  const [applying, setApplying] = useState(null)
  const [promoDiscount, setPromoDiscount] = useState(20)
  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [promoAction, setPromoAction] = useState(null)

  const badge = riskBadge(Number(prediction.churn_risk) || 0)
  const signals = Array.isArray(prediction.churn_signals) ? prediction.churn_signals : []
  const actions = Array.isArray(prediction.recommended_actions) ? prediction.recommended_actions : []

  // Recent interactions for this customer
  const { data: interactions = [] } = useQuery({
    queryKey: ['churn-interactions', clientId, prediction.customer_email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('id, subject, customer_message, status, created_at')
        .eq('client_id', clientId)
        .eq('customer_email', prediction.customer_email)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data || []
    },
    enabled: !!clientId && !!prediction.customer_email,
  })

  // History of predictions for the risk-over-time sparkline
  const { data: history = [] } = useQuery({
    queryKey: ['churn-history', clientId, prediction.customer_email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('churn_predictions')
        .select('churn_risk, predicted_at')
        .eq('client_id', clientId)
        .eq('customer_email', prediction.customer_email)
        .order('predicted_at', { ascending: true })
        .limit(20)
      if (error) throw error
      return data || []
    },
    enabled: !!clientId && !!prediction.customer_email,
  })

  const applyAction = async (action) => {
    if (action.type === 'discount') {
      setPromoAction(action)
      setPromoModalOpen(true)
      return
    }
    if (action.type === 'personal_contact') {
      setApplying(action.label)
      try {
        await supabase.from('ai_conversations').insert({
          client_id: clientId,
          customer_email: prediction.customer_email,
          customer_name: prediction.customer_name,
          subject: `[Retention] ${action.label}`,
          customer_message: `Action IA: contacter personnellement ${prediction.customer_email}. Signaux: ${signals.join(', ')}`,
          status: 'escalated',
          escalation_reason: 'Risque de churn eleve',
          ticket_type: 'retention',
        })
        toast.success('Escalade creee dans A traiter')
        if (onChanged) onChanged()
      } catch (e) {
        toast.error('Erreur creation escalade')
      } finally {
        setApplying(null)
      }
      return
    }
    // Fallback: just mark the prediction as addressed
    await markStatus('addressed')
  }

  const confirmDiscount = async () => {
    setApplying('discount')
    try {
      const code = `RETENTION-${prediction.customer_email.split('@')[0].toUpperCase().slice(0, 6)}-${promoDiscount}`
      // Log as an escalation-like action so the team can follow up
      await supabase.from('ai_conversations').insert({
        client_id: clientId,
        customer_email: prediction.customer_email,
        customer_name: prediction.customer_name,
        subject: `[Retention] Code promo -${promoDiscount}%`,
        customer_message: `Code suggere: ${code}. A envoyer par email/SMS.`,
        status: 'escalated',
        escalation_reason: 'Action de retention automatique',
        ticket_type: 'retention_discount',
        metadata: { discount_percent: promoDiscount, promo_code: code },
      })
      toast.success(`Code ${code} pret a envoyer`)
      setPromoModalOpen(false)
      setPromoAction(null)
      await markStatus('addressed')
    } catch (e) {
      toast.error('Erreur')
    } finally {
      setApplying(null)
    }
  }

  const markStatus = async (status) => {
    try {
      const { error } = await supabase
        .from('churn_predictions')
        .update({ status })
        .eq('id', prediction.id)
      if (error) throw error
      toast.success(status === 'addressed' ? 'Marque comme traite' : 'Statut mis a jour')
      if (onChanged) onChanged()
      onClose()
    } catch (e) {
      toast.error('Erreur mise a jour')
    }
  }

  // Build a simple SVG sparkline for risk history
  const spark = useMemo(() => {
    const pts = history.length >= 2 ? history : [...history, { churn_risk: prediction.churn_risk, predicted_at: prediction.predicted_at }]
    if (pts.length < 2) return null
    const w = 280, h = 60, pad = 4
    const max = 100, min = 0
    const step = (w - 2 * pad) / (pts.length - 1)
    return pts.map((p, i) => {
      const x = pad + i * step
      const y = h - pad - ((Number(p.churn_risk) - min) / (max - min)) * (h - 2 * pad)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [history, prediction])

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      <motion.div
        key="panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0F5F35]/10 text-[#0F5F35] flex items-center justify-center font-bold">
              {initialsFromEmail(prediction.customer_email)}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#262626]">{prediction.customer_name || prediction.customer_email}</p>
              <p className="text-xs text-[#716D5C]">{prediction.customer_email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  Risque {badge.label} {Math.round(Number(prediction.churn_risk) || 0)}%
                </span>
                <span className="text-[10px] text-[#716D5C]">CLV: <span className="font-semibold text-[#262626]">{fmtMoney(prediction.clv_estimate)}</span></span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#716D5C] hover:text-[#262626]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Risk chart */}
          <div>
            <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">Evolution du risque</p>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              {spark ? (
                <svg viewBox="0 0 280 60" className="w-full h-16">
                  <path d={spark} fill="none" stroke="#0F5F35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <p className="text-xs text-[#716D5C]">Pas assez d'historique pour tracer la courbe.</p>
              )}
              <div className="grid grid-cols-3 gap-3 mt-3 text-center">
                <div>
                  <p className="text-[10px] text-[#716D5C]">Commandes</p>
                  <p className="text-sm font-semibold text-[#262626]">{prediction.total_orders || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#716D5C]">Total depense</p>
                  <p className="text-sm font-semibold text-[#262626]">{fmtMoney(prediction.total_spent)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#716D5C]">Derniere commande</p>
                  <p className="text-sm font-semibold text-[#262626]">{fmtDate(prediction.last_order_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Signals */}
          <div>
            <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">Signaux detectes</p>
            {signals.length === 0 && (
              <p className="text-xs text-[#716D5C]">Aucun signal specifique.</p>
            )}
            <div className="space-y-2">
              {signals.map((s, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#262626] leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended actions */}
          <div>
            <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">Actions recommandees</p>
            <div className="space-y-2">
              {actions.length === 0 && (
                <p className="text-xs text-[#716D5C]">Aucune action disponible.</p>
              )}
              {actions.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0F5F35]/10 text-[#0F5F35] flex items-center justify-center flex-shrink-0">
                      <ActionIcon type={a.type} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#262626]">{a.label}</p>
                      <p className="text-[10px] text-[#716D5C] capitalize">{a.type?.replace(/_/g, ' ')} {a.priority ? `\u00B7 ${a.priority}` : ''}</p>
                    </div>
                  </div>
                  <button
                    disabled={!!applying}
                    onClick={() => applyAction(a)}
                    className="px-3 py-1.5 rounded-lg bg-[#0F5F35] hover:bg-[#003725] text-white text-[11px] font-semibold disabled:opacity-60 flex items-center gap-1"
                  >
                    {applying === a.label ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Appliquer
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent interactions */}
          <div>
            <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">Interactions recentes</p>
            {interactions.length === 0 && (
              <p className="text-xs text-[#716D5C]">Aucune interaction recente.</p>
            )}
            <div className="space-y-2">
              {interactions.slice(0, 5).map((it) => (
                <div key={it.id} className="p-3 rounded-xl border border-gray-100 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-[#262626]">{it.subject || 'Sans objet'}</p>
                    <span className="text-[10px] text-[#716D5C]">{fmtDate(it.created_at)}</span>
                  </div>
                  <p className="text-[11px] text-[#716D5C] line-clamp-2">{it.customer_message || ''}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-2">
          <button
            onClick={() => markStatus('addressed')}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-[#262626] flex items-center justify-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Marquer comme traite
          </button>
        </div>
      </motion.div>

      {/* Promo code modal */}
      {promoModalOpen && (
        <motion.div
          key="promo-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setPromoModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#262626] mb-1">Generer un code promo</h3>
            <p className="text-xs text-[#716D5C] mb-4">Pour {prediction.customer_email}</p>
            <label className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider">Remise (%)</label>
            <input
              type="number"
              value={promoDiscount}
              onChange={(e) => setPromoDiscount(Math.max(5, Math.min(80, Number(e.target.value) || 20)))}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0F5F35]"
              min={5}
              max={80}
            />
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => setPromoModalOpen(false)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-[#262626] hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDiscount}
                disabled={applying === 'discount'}
                className="flex-1 px-3 py-2 rounded-lg bg-[#0F5F35] text-white text-xs font-semibold hover:bg-[#003725] flex items-center justify-center gap-1 disabled:opacity-60"
              >
                {applying === 'discount' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tag className="w-3 h-3" />}
                Generer le code
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------- Main View ----------

export const ChurnPredictionsView = ({ clientId, theme }) => {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['churn-predictions', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('churn_predictions')
        .select('*')
        .eq('client_id', clientId)
        .order('churn_risk', { ascending: false })
        .limit(500)
      if (error) throw error
      return data || []
    },
    enabled: !!clientId,
  })

  const lastPredictedAt = useMemo(() => {
    if (!predictions.length) return null
    return predictions.reduce((latest, p) => {
      const t = new Date(p.predicted_at || 0).getTime()
      return t > latest ? t : latest
    }, 0)
  }, [predictions])

  // Filters
  const filtered = useMemo(() => {
    let list = predictions
    if (filter === 'high') list = list.filter(p => Number(p.churn_risk) >= 70)
    else if (filter === 'watch') list = list.filter(p => Number(p.churn_risk) >= 40 && Number(p.churn_risk) < 70)
    else if (filter === 'addressed') list = list.filter(p => p.status === 'addressed')
    else list = list.filter(p => p.status !== 'churned')
    return list
  }, [predictions, filter])

  // Stats
  const stats = useMemo(() => {
    const active = predictions.filter(p => p.status === 'active')
    const high = active.filter(p => Number(p.churn_risk) >= 70)
    const watch = active.filter(p => Number(p.churn_risk) >= 40 && Number(p.churn_risk) < 70)
    const clvAtRisk = high.reduce((s, p) => s + (Number(p.clv_estimate) || 0), 0)
    const sortedByClv = [...active].sort((a, b) => (Number(b.clv_estimate) || 0) - (Number(a.clv_estimate) || 0))
    const topN = Math.max(1, Math.ceil(sortedByClv.length * 0.1))
    const topSum = sortedByClv.slice(0, topN).reduce((s, p) => s + (Number(p.clv_estimate) || 0), 0)
    const topAvg = topN > 0 ? topSum / topN : 0
    return {
      highCount: high.length,
      watchCount: watch.length,
      clvAtRisk,
      topAvg,
    }
  }, [predictions])

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/churn/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || body?.error || 'Erreur refresh')
      return body
    },
    onSuccess: () => {
      toast.success('Analyse lancee — resultats dans quelques instants')
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['churn-predictions', clientId] })
      }, 3000)
    },
    onError: (err) => {
      toast.error(err.message || 'Erreur')
    },
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-5 h-5 text-[#0F5F35]" />
            <h2 className="text-xl font-bold text-[#262626]">Predictions de churn</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0F5F35]/10 text-[#0F5F35] text-[10px] font-semibold">
              <Sparkles className="w-3 h-3" />
              Powered by IA
            </span>
          </div>
          <p className="text-xs text-[#716D5C]">
            {lastPredictedAt
              ? `Derniere analyse ${relativeFromNow(new Date(lastPredictedAt).toISOString())}`
              : 'Aucune analyse disponible pour le moment.'}
          </p>
        </div>
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="px-4 py-2 rounded-lg bg-[#0F5F35] hover:bg-[#003725] text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          {refreshMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Rafraichir l'analyse
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Risque eleve"
          value={stats.highCount}
          sub="Clients > 70%"
          icon={AlertTriangle}
          tone="red"
        />
        <StatCard
          label="A surveiller"
          value={stats.watchCount}
          sub="Risque 40-70%"
          icon={AlertCircle}
          tone="orange"
        />
        <StatCard
          label="CLV a risque"
          value={fmtMoney(stats.clvAtRisk)}
          sub="Sur clients > 70%"
          icon={Euro}
          tone="red"
        />
        <StatCard
          label="CLV moyenne top 10%"
          value={fmtMoney(stats.topAvg)}
          sub="Meilleurs clients"
          icon={Target}
          tone="emerald"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-[#716D5C]" />
        {[
          { id: 'all', label: 'Tous' },
          { id: 'high', label: 'Risque eleve' },
          { id: 'watch', label: 'A surveiller' },
          { id: 'addressed', label: 'Action en cours' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
              filter === f.id
                ? 'bg-[#0F5F35] text-white border-[#0F5F35]'
                : 'bg-white text-[#716D5C] border-gray-200 hover:border-[#0F5F35]/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#716D5C] uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#716D5C] uppercase tracking-wider">Risque</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#716D5C] uppercase tracking-wider">CLV</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#716D5C] uppercase tracking-wider">Signaux</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#716D5C] uppercase tracking-wider">Derniere commande</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-[#716D5C] uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="w-5 h-5 text-[#0F5F35] animate-spin mx-auto" />
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <TrendingDown className="w-8 h-8 text-[#716D5C] mx-auto mb-2 opacity-40" />
                    <p className="text-xs text-[#716D5C]">
                      Aucune prediction pour ce filtre. Lancez une analyse pour commencer.
                    </p>
                  </td>
                </tr>
              )}
              {!isLoading && filtered.map((p) => {
                const badge = riskBadge(Number(p.churn_risk) || 0)
                const signals = Array.isArray(p.churn_signals) ? p.churn_signals : []
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0F5F35]/10 text-[#0F5F35] flex items-center justify-center text-[10px] font-bold">
                          {initialsFromEmail(p.customer_email)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#262626]">{p.customer_name || p.customer_email.split('@')[0]}</p>
                          <p className="text-[10px] text-[#716D5C]">{p.customer_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg} ${badge.text} border ${badge.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {Math.round(Number(p.churn_risk) || 0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#262626]">{fmtMoney(p.clv_estimate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {signals.slice(0, 2).map((s, i) => (
                          <span key={i} className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-[#716D5C] text-[10px] truncate max-w-[140px]">
                            {s}
                          </span>
                        ))}
                        {signals.length > 2 && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-[#716D5C] text-[10px]">
                            +{signals.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#716D5C]">{fmtDate(p.last_order_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-[#716D5C] inline" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <PredictionDrawer
          prediction={selected}
          clientId={clientId}
          onClose={() => setSelected(null)}
          onChanged={() => {
            queryClient.invalidateQueries({ queryKey: ['churn-predictions', clientId] })
          }}
        />
      )}
    </div>
  )
}

export default ChurnPredictionsView
