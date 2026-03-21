import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Send, Loader2, ChevronDown, Zap, CheckCircle2,
  AlertTriangle, ArrowRight, Play, X, Sparkles, Code2,
  Plus, Minus, RefreshCw
} from 'lucide-react'

const SUGGESTIONS = [
  "Ajoute un node Slack qui envoie une notification quand un ticket est escaladé",
  "Ajoute un node If qui vérifie si le montant du panier est > 100€",
  "Change le schedule trigger pour qu'il s'exécute toutes les 30 minutes",
  "Ajoute un node HTTP Request qui appelle une API externe après le traitement",
  "Ajoute une condition qui filtre les emails déjà envoyés dans les 24h",
]

export const AdminN8nCopilot = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingChange, setPendingChange] = useState(null)
  const [applying, setApplying] = useState(false)
  const chatEndRef = useRef(null)

  // Fetch workflow list
  const { data: workflowsData } = useQuery({
    queryKey: ['copilot-workflows'],
    queryFn: async () => {
      const res = await fetch('/api/n8n-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      })
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const workflows = workflowsData?.workflows || []

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (role, content, data = null) => {
    setMessages(prev => [...prev, { role, content, data, timestamp: Date.now() }])
  }

  const handleSend = async (text = input) => {
    if (!text.trim() || !selectedWorkflow || loading) return

    const userMsg = text.trim()
    setInput('')
    addMessage('user', userMsg)
    setLoading(true)

    try {
      const res = await fetch('/api/n8n-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'modify',
          workflowId: selectedWorkflow.id,
          prompt: userMsg,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur API')
      }

      const data = await res.json()
      setPendingChange(data)

      const diffText = []
      if (data.diff.addedNodes.length > 0) {
        diffText.push(`**+${data.diff.addedNodes.length} node(s) ajouté(s):** ${data.diff.addedNodes.join(', ')}`)
      }
      if (data.diff.removedNodes.length > 0) {
        diffText.push(`**-${data.diff.removedNodes.length} node(s) supprimé(s):** ${data.diff.removedNodes.join(', ')}`)
      }
      if (data.diff.totalNodesBefore === data.diff.totalNodesAfter && data.diff.addedNodes.length === 0) {
        diffText.push('Nodes existants modifiés (même nombre de nodes)')
      }

      addMessage('assistant', `Voici les modifications proposées :\n\n${diffText.join('\n')}\n\n**${data.diff.totalNodesBefore} → ${data.diff.totalNodesAfter} nodes**\n\nVoulez-vous appliquer ces changements ?`, { type: 'diff', diff: data.diff })
    } catch (err) {
      addMessage('assistant', `Erreur : ${err.message}`)
      setPendingChange(null)
    }

    setLoading(false)
  }

  const handleApply = async () => {
    if (!pendingChange || !selectedWorkflow || applying) return
    setApplying(true)

    try {
      const res = await fetch('/api/n8n-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          workflowId: selectedWorkflow.id,
          workflow: pendingChange.modifiedWorkflow,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur')
      }

      addMessage('assistant', `Workflow "${selectedWorkflow.name}" mis à jour avec succès ! Les changements sont maintenant actifs dans n8n.`, { type: 'success' })
      setPendingChange(null)
    } catch (err) {
      addMessage('assistant', `Erreur lors de l'application : ${err.message}`, { type: 'error' })
    }

    setApplying(false)
  }

  const handleReject = () => {
    setPendingChange(null)
    addMessage('assistant', 'Modifications annulées. Décrivez les changements que vous souhaitez.', { type: 'info' })
  }

  return (
    <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden flex flex-col" style={{ height: '600px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Actero Copilot for n8n</h3>
            <p className="text-[10px] text-gray-500">Modifiez vos workflows en langage naturel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span className="text-[10px] text-violet-400 font-bold">Gemini 2.0</span>
        </div>
      </div>

      {/* Workflow Selector */}
      <div className="px-5 py-3 border-b border-white/5">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm hover:border-white/20 transition-colors"
          >
            <span className={selectedWorkflow ? 'text-white font-medium' : 'text-gray-500'}>
              {selectedWorkflow ? selectedWorkflow.name : 'Sélectionner un workflow...'}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute z-10 w-full mt-1 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto"
              >
                {workflows.map(wf => (
                  <button
                    key={wf.id}
                    onClick={() => {
                      setSelectedWorkflow(wf)
                      setIsDropdownOpen(false)
                      setMessages([])
                      setPendingChange(null)
                      addMessage('assistant', `Workflow "${wf.name}" sélectionné (${wf.nodeCount} nodes, ${wf.active ? 'actif' : 'inactif'}). Que souhaitez-vous modifier ?`)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${wf.active ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{wf.name}</p>
                      <p className="text-[10px] text-gray-500">{wf.nodeCount} nodes</p>
                    </div>
                  </button>
                ))}
                {workflows.length === 0 && (
                  <p className="px-4 py-3 text-xs text-gray-500 text-center">Aucun workflow</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && !selectedWorkflow && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-gray-700 mb-4" />
            <h4 className="text-sm font-bold text-gray-400 mb-1">Sélectionnez un workflow</h4>
            <p className="text-xs text-gray-600">Choisissez un workflow ci-dessus pour commencer</p>
          </div>
        )}

        {messages.length === 0 && selectedWorkflow && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-medium">Suggestions :</p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-400 hover:bg-white/5 hover:border-white/10 hover:text-gray-300 transition-all"
              >
                <Zap className="w-3 h-3 inline mr-2 text-violet-400" />
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-violet-400" />
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
              <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-md'
                  : 'bg-white/5 text-gray-300 border border-white/5 rounded-bl-md'
              }`}>
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} className={j > 0 ? 'mt-1.5' : ''}>
                    {line.split('**').map((part, k) =>
                      k % 2 === 1 ? <strong key={k} className="text-white font-bold">{part}</strong> : part
                    )}
                  </p>
                ))}
              </div>

              {/* Diff visualization */}
              {msg.data?.type === 'diff' && (
                <div className="mt-2 space-y-1.5">
                  {msg.data.diff.addedNodes.map((n, j) => (
                    <div key={j} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-medium">{n}</span>
                    </div>
                  ))}
                  {msg.data.diff.removedNodes.map((n, j) => (
                    <div key={j} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                      <Minus className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] text-red-400 font-medium">{n}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Success indicator */}
              {msg.data?.type === 'success' && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-bold">Déployé sur n8n</span>
                </div>
              )}

              {/* Error indicator */}
              {msg.data?.type === 'error' && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-[10px] text-red-400 font-bold">Échec</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 rounded-bl-md">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                <span className="text-xs text-gray-400">Analyse du workflow en cours...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Apply/Reject buttons */}
      <AnimatePresence>
        {pendingChange && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-5 py-3 border-t border-white/10 flex items-center gap-3"
          >
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all disabled:opacity-50"
            >
              {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Appliquer sur n8n
            </button>
            <button
              onClick={handleReject}
              disabled={applying}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-5 py-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={selectedWorkflow ? "Décrivez la modification..." : "Sélectionnez un workflow d'abord"}
            disabled={!selectedWorkflow || loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors disabled:opacity-30"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || !selectedWorkflow || loading}
            className="p-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-all disabled:opacity-30 disabled:hover:bg-violet-600"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
