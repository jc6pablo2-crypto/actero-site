import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, Loader2, Bot, ArrowRight, LifeBuoy } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/**
 * OnboardingConcierge — Floating AI assistant that guides new clients
 * through the setup process. Distinct from ClientCopilotBubble which
 * is the post-setup data Q&A assistant.
 *
 * Visibility: only shown when the client's setup checklist is incomplete
 * (same logic as SetupChecklist.jsx — 7 steps).
 */

const QUICK_PROMPTS = [
  'Comment connecter Shopify ?',
  'Comment activer le SAV ?',
  'Ou configurer mon email ?',
  "Explique-moi le calcul du ROI",
]

const STORAGE_KEY = (clientId) => `onboarding-concierge-history-${clientId}`
const OPEN_KEY = (clientId) => `onboarding-concierge-opened-${clientId}`

export const OnboardingConcierge = ({ clientId, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const scrollEndRef = useRef(null)
  const inputRef = useRef(null)

  // Load history from localStorage on mount
  useEffect(() => {
    if (!clientId) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY(clientId))
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setMessages(parsed)
      }
    } catch {
      // ignore
    }
  }, [clientId])

  // Persist history
  useEffect(() => {
    if (!clientId) return
    try {
      localStorage.setItem(STORAGE_KEY(clientId), JSON.stringify(messages.slice(-30)))
    } catch {
      // ignore
    }
  }, [messages, clientId])

  // Auto-scroll
  useEffect(() => {
    if (isOpen) scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  // Setup completion state (same shape as SetupChecklist)
  const { data: completion } = useQuery({
    queryKey: ['onboarding-concierge-setup', clientId],
    queryFn: async () => {
      const { data: shopify } = await supabase
        .from('client_shopify_connections')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle()

      const { data: smtp } = await supabase
        .from('client_integrations')
        .select('id')
        .eq('client_id', clientId)
        .eq('provider', 'smtp_imap')
        .eq('status', 'active')
        .maybeSingle()

      const { data: settings } = await supabase
        .from('client_settings')
        .select('brand_tone, hourly_cost')
        .eq('client_id', clientId)
        .maybeSingle()

      const { count: runsCount } = await supabase
        .from('engine_runs_v2')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)

      const { data: playbook } = await supabase
        .from('engine_client_playbooks')
        .select('id, is_active, engine_playbooks!inner(name)')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .eq('engine_playbooks.name', 'sav_ecommerce')
        .maybeSingle()

      const { count: conversationsCount } = await supabase
        .from('ai_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)

      return {
        shopify: !!shopify,
        email: !!smtp,
        tone: !!(settings?.brand_tone && settings.brand_tone.trim().length > 0),
        roi: !!(settings?.hourly_cost && Number(settings.hourly_cost) > 0),
        tested: (runsCount || 0) > 0,
        playbook: !!playbook,
        conversation: (conversationsCount || 0) > 0,
      }
    },
    enabled: !!clientId,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  })

  if (!clientId) return null
  if (!completion) return null

  const completedCount = Object.values(completion).filter(Boolean).length
  const totalSteps = 7
  const allDone = completedCount === totalSteps
  if (allDone) return null

  const handleOpen = () => {
    setIsOpen(true)
    try {
      localStorage.setItem(OPEN_KEY(clientId), 'true')
    } catch {
      // ignore
    }
    // Seed welcome message on first open if empty
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            "Bonjour ! Je suis l'assistant Actero. Je vois que vous etes en train de configurer votre compte — posez-moi n'importe quelle question ou dites-moi ce que vous voulez faire.",
          suggested_action: null,
        },
      ])
    }
  }

  const handleSend = async (text) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    setInput('')
    const userMsg = { role: 'user', content }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''

      // Build a history slice to pass along (last 10 exchanges)
      const historyForApi = [...messages, userMsg].slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: clientId,
          message: content,
          history: historyForApi,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || 'Desole, je nai pas de reponse pour le moment.',
          suggested_action: data.suggested_action || null,
          escalate: !!data.escalate_to_human,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Desole, je rencontre un probleme technique. Vous pouvez contacter le support a support@actero.fr.",
          suggested_action: null,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedAction = (action) => {
    if (!action || !action.tab) return
    if (typeof setActiveTab === 'function') {
      setActiveTab(action.tab)
      // Close panel on navigation for a smoother UX on mobile
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-6 right-6 z-[60] flex items-center gap-2"
          >
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-lg border border-[#f0f0f0] text-[11px] font-semibold text-[#1a1a1a]"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F5F35] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0F5F35]" />
              </span>
              Besoin d'aide ?
            </motion.div>
            <motion.button
              onClick={handleOpen}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-14 h-14 rounded-full bg-[#0F5F35] text-white shadow-xl shadow-[#0F5F35]/30 hover:bg-[#003725] transition-colors flex items-center justify-center"
              aria-label="Ouvrir l'assistant Actero"
            >
              <motion.div
                animate={{ rotate: [0, 12, -8, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2 }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {totalSteps - completedCount}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] w-[calc(100vw-2rem)] sm:w-[340px] max-w-[340px] h-[520px] max-h-[calc(100vh-2rem)] rounded-2xl bg-white shadow-2xl border border-[#f0f0f0] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] bg-gradient-to-r from-[#003725] to-[#0F5F35] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold leading-tight">Assistant Actero</h3>
                  <p className="text-[10px] text-white/70 leading-tight mt-0.5">
                    Configuration : {completedCount}/{totalSteps}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#fafafa]">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-[#0F5F35]/10 border border-[#0F5F35]/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                      <Sparkles className="w-3 h-3 text-[#0F5F35]" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                    <div
                      className={`px-3 py-2 rounded-2xl text-[12px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#0F5F35] text-white rounded-br-md'
                          : 'bg-white text-[#1a1a1a] rounded-bl-md border border-[#f0f0f0]'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {msg.role === 'assistant' && msg.suggested_action && (
                      <button
                        onClick={() => handleSuggestedAction(msg.suggested_action)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#0F5F35]/30 text-[11px] font-semibold text-[#0F5F35] hover:bg-[#0F5F35] hover:text-white transition-colors"
                      >
                        {msg.suggested_action.label}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {msg.role === 'assistant' && msg.escalate && (
                      <a
                        href="mailto:support@actero.fr"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-amber-300 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        <LifeBuoy className="w-3 h-3" />
                        Contacter le support
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-[#0F5F35]/10 border border-[#0F5F35]/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                    <Sparkles className="w-3 h-3 text-[#0F5F35] animate-pulse" />
                  </div>
                  <div className="px-3 py-2.5 rounded-2xl rounded-bl-md bg-white border border-[#f0f0f0]">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0F5F35] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0F5F35] animate-bounce" style={{ animationDelay: '120ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0F5F35] animate-bounce" style={{ animationDelay: '240ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={scrollEndRef} />
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && !loading && (
              <div className="px-3 pt-2 pb-1 border-t border-[#f0f0f0] bg-white">
                <p className="text-[10px] font-semibold text-[#9ca3af] px-1 mb-1.5 uppercase tracking-wide">
                  Suggestions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      disabled={loading}
                      className="px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-[#fafafa] border border-[#f0f0f0] text-[#1a1a1a] hover:border-[#0F5F35] hover:text-[#0F5F35] transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 border-t border-[#f0f0f0] bg-white">
              <div className="flex items-end gap-2 rounded-xl border border-[#f0f0f0] bg-[#fafafa] focus-within:border-[#0F5F35] transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={1}
                  placeholder="Posez votre question..."
                  disabled={loading}
                  className="flex-1 bg-transparent px-3 py-2.5 text-[12px] outline-none resize-none max-h-[80px] text-[#1a1a1a] placeholder-[#9ca3af] disabled:opacity-40"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="m-1.5 p-2 rounded-lg bg-[#0F5F35] text-white hover:bg-[#003725] transition-colors disabled:opacity-30 flex-shrink-0"
                  aria-label="Envoyer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
