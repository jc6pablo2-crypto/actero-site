import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Activity, AlertTriangle, CheckCircle2, XCircle, Clock,
  Zap, RefreshCw, Wifi, WifiOff, Play, Pause, Bot
} from 'lucide-react'
import { AdminN8nCopilot } from './AdminN8nCopilot'

const statusConfig = {
  active_ok: { label: 'Actif — OK', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  active_error: { label: 'Actif — Erreurs', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle },
  active_idle: { label: 'Actif — Inactif', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
  inactive: { label: 'Désactivé', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', icon: Pause },
}

function getWorkflowStatus(wf) {
  if (!wf.active) return 'inactive'
  if (wf.recentErrorCount > 0) return 'active_error'
  if (!wf.lastExecution) return 'active_idle'
  return 'active_ok'
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Jamais'
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

export const AdminMonitoringView = () => {
  const [showCopilot, setShowCopilot] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['n8n-workflows'],
    queryFn: async () => {
      const res = await fetch('/api/n8n-workflows')
      if (!res.ok) throw new Error('Erreur API n8n')
      return res.json()
    },
    refetchInterval: 30000,
  })

  const workflows = data?.workflows || []
  const activeCount = workflows.filter(w => w.active).length
  const errorCount = workflows.filter(w => getWorkflowStatus(w) === 'active_error').length
  const totalExecs = workflows.reduce((s, w) => s + w.recentTotal, 0)

  // Alerts: workflows with errors or active but no recent execution
  const alerts = workflows
    .filter(w => getWorkflowStatus(w) === 'active_error' || getWorkflowStatus(w) === 'active_idle')
    .map(w => ({
      workflow: w,
      type: getWorkflowStatus(w) === 'active_error' ? 'error' : 'warning',
      message: getWorkflowStatus(w) === 'active_error'
        ? `${w.recentErrorCount} erreur(s) récente(s)`
        : 'Aucune exécution récente',
    }))

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Monitoring n8n</h2>
          <p className="text-sm text-gray-500 mt-1">Statut en temps réel de tous les workflows</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCopilot(!showCopilot)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all ${
              showCopilot
                ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            <Bot className="w-4 h-4" /> Copilot IA
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Workflows actifs', value: activeCount, total: workflows.length, icon: Wifi, color: 'emerald' },
          { label: 'Alertes', value: alerts.length, icon: AlertTriangle, color: alerts.length > 0 ? 'red' : 'emerald' },
          { label: 'Exécutions récentes', value: totalExecs, icon: Zap, color: 'blue' },
          { label: 'Erreurs détectées', value: errorCount, icon: XCircle, color: errorCount > 0 ? 'red' : 'emerald' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 text-${kpi.color}-400`} />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-white font-mono">{kpi.value}</span>
              {kpi.total !== undefined && <span className="text-sm text-gray-500 mb-0.5">/{kpi.total}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Copilot */}
      {showCopilot && <AdminN8nCopilot />}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Alertes actives ({alerts.length})
          </h3>
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.workflow.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-xl border ${
                alert.type === 'error'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-amber-500/5 border-amber-500/20'
              }`}
            >
              {alert.type === 'error'
                ? <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                : <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{alert.workflow.name}</p>
                <p className={`text-xs ${alert.type === 'error' ? 'text-red-400' : 'text-amber-400'}`}>{alert.message}</p>
              </div>
              <span className="text-[10px] text-gray-500">{timeAgo(alert.workflow.lastExecution?.startedAt)}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Workflow List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-600" />
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-[#0a0a0a] rounded-2xl border border-red-500/20">
          <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-400">Impossible de se connecter à n8n</h3>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-400 mb-3">Tous les workflows ({workflows.length})</h3>
          {workflows.map((wf, i) => {
            const status = getWorkflowStatus(wf)
            const cfg = statusConfig[status]
            const StatusIcon = cfg.icon
            return (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${cfg.bg}`}>
                  <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{wf.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color}`}>
                      {cfg.label.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Dernière exec: {timeAgo(wf.lastExecution?.startedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-emerald-400 font-mono font-bold">{wf.recentSuccessCount}</div>
                    <div className="text-[10px] text-gray-600">OK</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-mono font-bold">{wf.recentErrorCount}</div>
                    <div className="text-[10px] text-gray-600">ERR</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${wf.active ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
