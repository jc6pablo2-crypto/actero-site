import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  TrendingUp, Users, DollarSign, Mail, Target, ArrowUpRight,
  BarChart3, Activity, Globe, Zap, CheckCircle, Clock
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

export const AdminAcquisitionView = () => {
  // Fetch real data from Supabase
  const { data: clients = [] } = useQuery({
    queryKey: ['acquisition-clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('id, brand_name, type, created_at, status')
      return data || []
    }
  })

  const { data: funnelClients = [] } = useQuery({
    queryKey: ['acquisition-funnel'],
    queryFn: async () => {
      const { data } = await supabase.from('funnel_clients').select('id, brand_name, status, created_at, setup_price, monthly_price')
      return data || []
    }
  })

  // Calculate metrics
  const activeClients = clients.filter(c => c.status === 'active')
  const thisMonth = new Date().toISOString().slice(0, 7)
  const newClientsThisMonth = clients.filter(c => c.created_at?.startsWith(thisMonth))
  const mrr = funnelClients
    .filter(f => f.status === 'paid' || f.status === 'active')
    .reduce((sum, f) => sum + (Number(f.monthly_price) || 0), 0)

  // Funnel metrics
  const funnelStages = [
    { label: 'Prospects', count: funnelClients.filter(f => ['draft', 'sent', 'nouveau'].includes(f.status)).length, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
    { label: 'Email envoyé', count: funnelClients.filter(f => f.status === 'sent').length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Payé', count: funnelClients.filter(f => f.status === 'paid').length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Actif', count: activeClients.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ]

  const conversionRate = funnelClients.length > 0 ? Math.round(activeClients.length / funnelClients.length * 100) : 0

  // Source breakdown (simulated - in production, track via UTM)
  const sources = [
    { name: 'Cold email', leads: 45, converted: 3, color: 'bg-violet-500' },
    { name: 'Loom bomb', leads: 12, converted: 2, color: 'bg-blue-500' },
    { name: 'LinkedIn', leads: 28, converted: 1, color: 'bg-cyan-500' },
    { name: 'Partenariat agence', leads: 8, converted: 2, color: 'bg-emerald-500' },
    { name: 'Simulateur ROI', leads: 35, converted: 1, color: 'bg-amber-500' },
    { name: 'Organique', leads: 15, converted: 0, color: 'bg-pink-500' },
  ]
  const totalLeads = sources.reduce((s, src) => s + src.leads, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Tableau de bord Acquisition</h2>
        <p className="text-sm text-zinc-500 mt-1">Suivi en temps réel de vos efforts marketing et conversion</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'MRR', value: `${mrr.toLocaleString()}€`, icon: DollarSign, color: 'text-emerald-400', trend: '+12%' },
          { label: 'Clients actifs', value: activeClients.length, icon: Users, color: 'text-blue-400', trend: `+${newClientsThisMonth.length} ce mois` },
          { label: 'Taux conversion', value: `${conversionRate}%`, icon: Target, color: 'text-violet-400', trend: 'funnel → client' },
          { label: 'CAC', value: '0€', icon: Zap, color: 'text-amber-400', trend: '100% organique' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#111] border border-white/5 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />{kpi.trend}
              </span>
            </div>
            <span className="text-3xl font-bold text-white">{kpi.value}</span>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-medium">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funnel visualization */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-400" />
            Funnel de conversion
          </h3>
          <div className="space-y-3">
            {funnelStages.map((stage, i) => {
              const maxCount = Math.max(...funnelStages.map(s => s.count), 1)
              const width = Math.max((stage.count / maxCount) * 100, 5)
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-400 font-medium">{stage.label}</span>
                    <span className={`text-sm font-bold ${stage.color}`}>{stage.count}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.8, delay: i * 0.15 }}
                      className={`h-full rounded-full ${stage.bg.replace('/10', '/40')}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Taux de conversion global</span>
            <span className="text-lg font-bold text-emerald-400">{conversionRate}%</span>
          </div>
        </div>

        {/* Sources breakdown */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            Leads par source
          </h3>
          <div className="space-y-3">
            {sources.sort((a, b) => b.leads - a.leads).map((src, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${src.color}`} />
                <span className="text-xs text-zinc-400 flex-1">{src.name}</span>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-zinc-500">Leads</span>
                    <span className="text-sm font-bold text-white ml-2">{src.leads}</span>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <span className="text-xs text-zinc-500">Conv.</span>
                    <span className="text-sm font-bold text-emerald-400 ml-2">{src.converted}</span>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${src.color}`}
                        style={{ width: `${(src.leads / totalLeads) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Total leads</span>
            <span className="text-lg font-bold text-white">{totalLeads}</span>
          </div>
        </div>
      </div>

      {/* Recent conversions */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Derniers clients signés
        </h3>
        {activeClients.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-sm">
            Aucun client actif pour le moment. Lancez vos campagnes !
          </div>
        ) : (
          <div className="space-y-2">
            {activeClients.slice(0, 10).map((client, i) => (
              <div key={client.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    {client.brand_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <span className="text-sm text-white font-medium">{client.brand_name}</span>
                    <span className="text-xs text-zinc-500 ml-2 capitalize">{client.type || 'e-commerce'}</span>
                  </div>
                </div>
                <span className="text-xs text-zinc-500">
                  {new Date(client.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly objectives */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          Objectifs hebdomadaires
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Emails envoyés', current: 127, target: 200, unit: '' },
            { label: 'Loom bombs', current: 8, target: 15, unit: '' },
            { label: 'Calls planifiés', current: 3, target: 5, unit: '' },
            { label: 'Clients signés', current: 1, target: 2, unit: '' },
          ].map((obj, i) => {
            const pct = Math.min(Math.round(obj.current / obj.target * 100), 100)
            return (
              <div key={i} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={pct >= 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${pct * 0.88} 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {pct}%
                  </span>
                </div>
                <span className="text-xs text-zinc-400 block">{obj.label}</span>
                <span className="text-[10px] text-zinc-600">{obj.current}/{obj.target}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
