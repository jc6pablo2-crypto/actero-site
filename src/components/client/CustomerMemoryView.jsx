import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Search,
  Users,
  Database,
  TrendingUp,
  X,
  Package,
  MessageCircle,
  Star,
  Trash2,
  Clock,
  Mail,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'

// Map memory types to icons and colors
const TYPE_CONFIG = {
  order: { icon: Package, label: 'Commande', color: 'text-blue-600', bg: 'bg-blue-50' },
  conversation: { icon: MessageCircle, label: 'Conversation', color: 'text-violet-600', bg: 'bg-violet-50' },
  preference: { icon: Star, label: 'Preference', color: 'text-amber-600', bg: 'bg-amber-50' },
  default: { icon: Brain, label: 'Memoire', color: 'text-[#0F5F35]', bg: 'bg-emerald-50' },
}

const getTypeConfig = (type) => {
  if (!type) return TYPE_CONFIG.default
  const t = String(type).toLowerCase()
  if (t.includes('order') || t.includes('commande') || t.includes('purchase')) return TYPE_CONFIG.order
  if (t.includes('conversation') || t.includes('message') || t.includes('chat')) return TYPE_CONFIG.conversation
  if (t.includes('pref') || t.includes('like') || t.includes('favori')) return TYPE_CONFIG.preference
  return TYPE_CONFIG.default
}

const formatRelativeDays = (iso) => {
  if (!iso) return 'Inconnu'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24))
  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 30) return `il y a ${days} jours`
  const months = Math.floor(days / 30)
  if (months < 12) return `il y a ${months} mois`
  const years = Math.floor(months / 12)
  return `il y a ${years} an${years > 1 ? 's' : ''}`
}

const formatFullDate = (iso) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

const getInitial = (email) => {
  if (!email) return '?'
  return String(email).trim().charAt(0).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-indigo-500',
]

const getAvatarColor = (email) => {
  if (!email) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = (hash + email.charCodeAt(i)) % AVATAR_COLORS.length
  }
  return AVATAR_COLORS[hash]
}

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
)

export const CustomerMemoryView = ({ clientId }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [activeDrawerTab, setActiveDrawerTab] = useState('all')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // Fetch all memories for this client (grouping done client-side to compute per-email stats)
  const {
    data: rawMemories = [],
    isLoading: loadingList,
    error: listError,
  } = useQuery({
    queryKey: ['customer-memories-all', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_memories')
        .select('id, customer_email, content, type, memory_type, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(2000)
      if (error) throw error
      return data || []
    },
    enabled: !!clientId,
    staleTime: 30_000,
  })

  // Monthly usage stat (memories used this month)
  const { data: monthlyUsage = 0 } = useQuery({
    queryKey: ['customer-memories-month', clientId],
    queryFn: async () => {
      const firstOfMonth = new Date()
      firstOfMonth.setDate(1)
      firstOfMonth.setHours(0, 0, 0, 0)
      const { count, error } = await supabase
        .from('customer_memories')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .gte('created_at', firstOfMonth.toISOString())
      if (error) return 0
      return count || 0
    },
    enabled: !!clientId,
    staleTime: 60_000,
  })

  // Group memories by email
  const groupedCustomers = useMemo(() => {
    const map = new Map()
    for (const m of rawMemories) {
      const email = m.customer_email || 'inconnu'
      if (!map.has(email)) {
        map.set(email, {
          email,
          memory_count: 0,
          last_seen: m.created_at,
          memories: [],
        })
      }
      const entry = map.get(email)
      entry.memory_count += 1
      entry.memories.push(m)
      if (!entry.last_seen || new Date(m.created_at) > new Date(entry.last_seen)) {
        entry.last_seen = m.created_at
      }
    }
    return Array.from(map.values())
      .sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))
      .slice(0, 50)
  }, [rawMemories])

  // Apply search filter
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return groupedCustomers
    const s = search.toLowerCase()
    return groupedCustomers.filter((c) => c.email.toLowerCase().includes(s))
  }, [groupedCustomers, search])

  // Stats
  const stats = useMemo(() => {
    const uniqueCustomers = groupedCustomers.length
    const totalMemories = rawMemories.length
    return {
      customers: uniqueCustomers,
      memories: totalMemories,
      monthly: monthlyUsage,
    }
  }, [groupedCustomers, rawMemories, monthlyUsage])

  const selectedCustomer = useMemo(() => {
    if (!selectedEmail) return null
    return groupedCustomers.find((c) => c.email === selectedEmail) || null
  }, [selectedEmail, groupedCustomers])

  const drawerMemories = useMemo(() => {
    if (!selectedCustomer) return []
    const all = selectedCustomer.memories
    if (activeDrawerTab === 'all') return all
    return all.filter((m) => {
      const cfg = getTypeConfig(m.type || m.memory_type)
      if (activeDrawerTab === 'orders') return cfg === TYPE_CONFIG.order
      if (activeDrawerTab === 'conversations') return cfg === TYPE_CONFIG.conversation
      if (activeDrawerTab === 'preferences') return cfg === TYPE_CONFIG.preference
      return true
    })
  }, [selectedCustomer, activeDrawerTab])

  const handleDelete = async (memoryId) => {
    setDeletingId(memoryId)
    try {
      const { error } = await supabase
        .from('customer_memories')
        .delete()
        .eq('id', memoryId)
        .eq('client_id', clientId)
      if (error) throw error
      toast.success('Memoire supprimee')
      await queryClient.invalidateQueries({ queryKey: ['customer-memories-all', clientId] })
      await queryClient.invalidateQueries({ queryKey: ['customer-memories-month', clientId] })
    } catch (e) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  const closeDrawer = () => {
    setSelectedEmail(null)
    setActiveDrawerTab('all')
    setConfirmDeleteId(null)
  }

  const statCards = [
    {
      label: 'Clients uniques',
      value: stats.customers.toLocaleString('fr-FR'),
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Memoires stockees',
      value: stats.memories.toLocaleString('fr-FR'),
      icon: Database,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Utilisees ce mois',
      value: stats.monthly.toLocaleString('fr-FR'),
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0F5F35]/10 flex items-center justify-center flex-shrink-0">
          <Brain className="w-5 h-5 text-[#0F5F35]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#262626]">Memoire client</h2>
          <p className="text-sm text-[#716D5C]">
            L'agent IA se souvient de chaque client qui a interagi avec vous
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#716D5C]">
                  {stat.label}
                </p>
                {loadingList ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-[#262626]">{stat.value}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#716D5C]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client par email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#fafafa] border border-gray-100 text-sm text-[#262626] placeholder:text-[#a8a398] focus:outline-none focus:ring-2 focus:ring-[#0F5F35]/20 focus:border-[#0F5F35]/40 transition"
          />
        </div>
      </div>

      {/* Customer list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#262626]">
            Clients memorises
            {filteredCustomers.length > 0 && (
              <span className="ml-2 text-xs font-normal text-[#716D5C]">
                ({filteredCustomers.length})
              </span>
            )}
          </h3>
        </div>

        {loadingList ? (
          <div className="divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : listError ? (
          <div className="px-5 py-12 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-[#262626] font-medium">Impossible de charger les memoires</p>
            <p className="text-xs text-[#716D5C] mt-1">{String(listError.message || listError)}</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#fafafa] flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-[#a8a398]" />
            </div>
            <p className="text-sm font-medium text-[#262626]">
              {search ? 'Aucun client trouve' : 'Aucune memoire pour le moment'}
            </p>
            <p className="text-xs text-[#716D5C] mt-1 max-w-sm mx-auto">
              {search
                ? 'Essayez avec un autre email'
                : "Les memoires apparaitront ici quand l'agent interagira avec vos clients"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.email}
                onClick={() => {
                  setSelectedEmail(customer.email)
                  setActiveDrawerTab('all')
                }}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#fafafa] transition text-left"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${getAvatarColor(
                    customer.email
                  )}`}
                >
                  {getInitial(customer.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#262626] truncate">{customer.email}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#716D5C]">
                      {customer.memory_count} memoire{customer.memory_count > 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-[#a8a398]">•</span>
                    <span className="text-xs text-[#716D5C]">
                      Derniere activite : {formatRelativeDays(customer.last_seen)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-[#a8a398] group-hover:text-[#716D5C]">→</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${getAvatarColor(
                      selectedCustomer.email
                    )}`}
                  >
                    {getInitial(selectedCustomer.email)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#716D5C] flex-shrink-0" />
                      <p className="text-sm font-semibold text-[#262626] truncate">
                        {selectedCustomer.email}
                      </p>
                    </div>
                    <p className="text-xs text-[#716D5C] mt-0.5">
                      {selectedCustomer.memory_count} memoire
                      {selectedCustomer.memory_count > 1 ? 's' : ''} au total
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  className="w-8 h-8 rounded-lg hover:bg-[#fafafa] flex items-center justify-center transition flex-shrink-0"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 text-[#716D5C]" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-5 py-2 border-b border-gray-100 flex gap-1 overflow-x-auto">
                {[
                  { id: 'all', label: 'Toutes' },
                  { id: 'orders', label: 'Commandes' },
                  { id: 'conversations', label: 'Conversations' },
                  { id: 'preferences', label: 'Preferences' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDrawerTab(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
                      activeDrawerTab === tab.id
                        ? 'bg-[#0F5F35] text-white'
                        : 'text-[#716D5C] hover:bg-[#fafafa]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {drawerMemories.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#fafafa] flex items-center justify-center mx-auto mb-3">
                      <Brain className="w-5 h-5 text-[#a8a398]" />
                    </div>
                    <p className="text-sm font-medium text-[#262626]">Aucune memoire</p>
                    <p className="text-xs text-[#716D5C] mt-1">dans cette categorie</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drawerMemories.map((memory) => {
                      const cfg = getTypeConfig(memory.type || memory.memory_type)
                      const Icon = cfg.icon
                      const isDeleting = deletingId === memory.id
                      const isConfirming = confirmDeleteId === memory.id
                      return (
                        <motion.div
                          key={memory.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
                            >
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}
                                >
                                  {cfg.label}
                                </span>
                                <span className="text-[10px] text-[#a8a398]">•</span>
                                <span className="text-[10px] text-[#716D5C] flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatFullDate(memory.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-[#262626] leading-relaxed break-words">
                                {memory.content || '(contenu vide)'}
                              </p>

                              {/* Delete button / confirm */}
                              <div className="mt-3">
                                {isConfirming ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleDelete(memory.id)}
                                      disabled={isDeleting}
                                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                      {isDeleting ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3 h-3" />
                                      )}
                                      Confirmer
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      disabled={isDeleting}
                                      className="px-3 py-1.5 rounded-lg bg-[#fafafa] text-[#716D5C] text-xs font-medium hover:bg-gray-100 transition"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId(memory.id)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-[#716D5C] hover:bg-red-50 hover:text-red-600 transition"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomerMemoryView
