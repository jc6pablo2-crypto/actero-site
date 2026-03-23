import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Power,
  Play,
  Pause,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Zap,
} from 'lucide-react'

const fetchWorkflows = async () => {
  const res = await fetch('/api/n8n-workflows')
  if (!res.ok) throw new Error('Erreur lors du chargement des workflows')
  const data = await res.json()
  return data.workflows || []
}

const toggleWorkflow = async ({ workflowId, active }) => {
  const res = await fetch('/api/n8n-copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'toggle', workflowId, active }),
  })
  if (!res.ok) throw new Error('Erreur lors de la mise a jour')
  return res.json()
}

const sendPauseAlert = (clientName, workflowName) => {
  fetch('/api/send-alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'workflow_paused',
      clientName,
      details: workflowName,
    }),
  }).catch(() => {})
}

// Confirmation dialog
const ConfirmDialog = ({ isOpen, onConfirm, onCancel, workflowName }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-white">Confirmer la mise en pause</h3>
          </div>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Etes-vous sur de vouloir mettre en pause cette automation ?
            <span className="block mt-1 text-white font-medium">{workflowName}</span>
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 transition-all"
            >
              Mettre en pause
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

// Toast notification
const Toast = ({ message, isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium"
      >
        <CheckCircle2 className="w-4 h-4" />
        {message}
      </motion.div>
    )}
  </AnimatePresence>
)

// Status badge
const StatusBadge = ({ active }) => (
  <div className="flex items-center gap-2">
    <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-zinc-500'}`} />
    <span className={`text-xs font-medium ${active ? 'text-emerald-400' : 'text-zinc-500'}`}>
      {active ? 'Actif' : 'En pause'}
    </span>
  </div>
)

// Toggle switch
const ToggleSwitch = ({ active, loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`relative w-12 h-7 rounded-full transition-all duration-300 flex items-center ${
      active ? 'bg-emerald-600' : 'bg-zinc-700'
    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
  >
    <motion.div
      animate={{ x: active ? 22 : 3 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 text-zinc-500 animate-spin" />
      ) : active ? (
        <Play className="w-2.5 h-2.5 text-emerald-600" />
      ) : (
        <Pause className="w-2.5 h-2.5 text-zinc-500" />
      )}
    </motion.div>
  </button>
)

// Format relative time
const formatLastExecution = (dateStr) => {
  if (!dateStr) return 'Jamais execute'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "A l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Workflow card
const WorkflowCard = ({ workflow, index, onToggle, togglingId }) => {
  const isToggling = togglingId === workflow.id
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            workflow.active ? 'bg-emerald-500/10' : 'bg-zinc-800'
          }`}>
            <Zap className={`w-5 h-5 ${workflow.active ? 'text-emerald-400' : 'text-zinc-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">{workflow.name}</h3>
            <div className="flex items-center gap-3 mt-1.5">
              <StatusBadge active={workflow.active} />
              <span className="text-zinc-600 text-[10px]">|</span>
              <div className="flex items-center gap-1 text-zinc-500">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{formatLastExecution(workflow.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
        <ToggleSwitch
          active={workflow.active}
          loading={isToggling}
          onClick={() => onToggle(workflow)}
        />
      </div>
    </motion.div>
  )
}

export const ClientSystemsView = ({ clientName, theme }) => {
  const queryClient = useQueryClient()
  const [confirmDialog, setConfirmDialog] = useState({ open: false, workflow: null })
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [togglingId, setTogglingId] = useState(null)

  const { data: workflows = [], isLoading, isError } = useQuery({
    queryKey: ['client-workflows'],
    queryFn: fetchWorkflows,
    refetchInterval: 30000,
  })

  const mutation = useMutation({
    mutationFn: toggleWorkflow,
    onMutate: ({ workflowId }) => setTogglingId(workflowId),
    onSuccess: (_, { workflowId, active }) => {
      queryClient.invalidateQueries({ queryKey: ['client-workflows'] })
      setTogglingId(null)
      const wf = workflows.find((w) => w.id === workflowId)
      const action = active ? 'activee' : 'mise en pause'
      showToast(`Automation ${action} avec succes`)

      // Fire-and-forget alert when pausing
      if (!active && wf) {
        sendPauseAlert(clientName || 'Client', wf.name)
      }
    },
    onError: () => {
      setTogglingId(null)
      showToast('Erreur lors de la mise a jour')
    },
  })

  const showToast = (message) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast({ visible: false, message: '' }), 3000)
  }

  const handleToggle = (workflow) => {
    if (workflow.active) {
      // Pausing: show confirmation
      setConfirmDialog({ open: true, workflow })
    } else {
      // Resuming: toggle directly
      mutation.mutate({ workflowId: workflow.id, active: true })
    }
  }

  const handleConfirmPause = () => {
    const wf = confirmDialog.workflow
    setConfirmDialog({ open: false, workflow: null })
    if (wf) {
      mutation.mutate({ workflowId: wf.id, active: false })
    }
  }

  const activeCount = workflows.filter((w) => w.active).length
  const pausedCount = workflows.filter((w) => !w.active).length

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2 tracking-tight text-white">Mes Systemes</h2>
        <p className="text-zinc-500 font-medium text-lg">
          Gerez vos automations en temps reel.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-white">{activeCount}</span>
          <span className="text-xs text-zinc-500">actives</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
          <Pause className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-bold text-white">{pausedCount}</span>
          <span className="text-xs text-zinc-500">en pause</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
          <Power className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-bold text-white">{workflows.length}</span>
          <span className="text-xs text-zinc-500">total</span>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#111] border border-white/5 rounded-2xl p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-2/3" />
                  <div className="h-3 bg-zinc-800 rounded w-1/3" />
                </div>
                <div className="w-12 h-7 rounded-full bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-[#111] border border-red-500/20 rounded-2xl p-8 text-center">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Erreur de chargement</p>
          <p className="text-zinc-500 text-sm">Impossible de recuperer vos automations. Reessayez dans quelques instants.</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
          <Zap className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Aucune automation</p>
          <p className="text-zinc-500 text-sm">Vos workflows apparaitront ici une fois configures.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf, i) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              index={i}
              onToggle={handleToggle}
              togglingId={togglingId}
            />
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        workflowName={confirmDialog.workflow?.name || ''}
        onConfirm={handleConfirmPause}
        onCancel={() => setConfirmDialog({ open: false, workflow: null })}
      />

      {/* Toast */}
      <Toast message={toast.message} isVisible={toast.visible} />
    </div>
  )
}
