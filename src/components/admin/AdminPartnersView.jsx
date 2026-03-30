import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Handshake, Mail, Phone, Building2,
  CheckCircle2, XCircle, Clock, Eye, Loader2, MoreVertical,
  Briefcase, ChevronDown, Filter, X, AlertCircle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUS_MAP = {
  new: { label: 'Nouveau', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  contacted: { label: 'Contacté', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  qualified: { label: 'Qualifié', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  rejected: { label: 'Rejeté', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.new
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${s.color}`}>
      {s.label}
    </span>
  )
}

export const AdminPartnersView = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedRow, setExpandedRow] = useState(null)

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_applications')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase
        .from('partner_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] })
    },
  })

  const filtered = partners.filter((p) => {
    const matchesSearch =
      !search ||
      `${p.first_name} ${p.last_name} ${p.email} ${p.company_name}`
        .toLowerCase()
        .includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statCounts = {
    total: partners.length,
    new: partners.filter((p) => p.status === 'new').length,
    contacted: partners.filter((p) => p.status === 'contacted').length,
    qualified: partners.filter((p) => p.status === 'qualified').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Handshake className="w-7 h-7 text-indigo-400" />
            Partenaires
          </h2>
          <p className="text-sm text-[#716D5C] mt-1">
            Candidatures du programme partenaire B2B
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: statCounts.total, icon: Users, color: 'text-[#716D5C]' },
          { label: 'Nouveaux', value: statCounts.new, icon: Clock, color: 'text-blue-400' },
          { label: 'Contactés', value: statCounts.contacted, icon: Mail, color: 'text-amber-400' },
          { label: 'Qualifiés', value: statCounts.qualified, icon: CheckCircle2, color: 'text-green-400' },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-[#716D5C]">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#716D5C]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, société..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F9F7F1] border border-gray-200 rounded-xl text-sm text-[#262626] placeholder-gray-600 outline-none focus:border-indigo-500/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[#F9F7F1] border border-gray-200 rounded-xl text-sm text-[#262626] outline-none focus:border-indigo-500/40 appearance-none cursor-pointer"
        >
          <option value="all" className="bg-[#F9F7F1]">Tous les statuts</option>
          {Object.entries(STATUS_MAP).map(([key, val]) => (
            <option key={key} value={key} className="bg-[#F9F7F1]">{val.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[#716D5C]">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Aucune candidature trouvée.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#716D5C] uppercase tracking-wider">Candidat</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#716D5C] uppercase tracking-wider">Société</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#716D5C] uppercase tracking-wider">Activité</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#716D5C] uppercase tracking-wider">Potentiel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#716D5C] uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#716D5C] uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#716D5C] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <React.Fragment key={p.id}>
                    <tr
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === p.id ? null : p.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.first_name} {p.last_name}</div>
                        <div className="text-xs text-[#716D5C]">{p.email}</div>
                      </td>
                      <td className="px-4 py-3 text-[#716D5C]">{p.company_name}</td>
                      <td className="px-4 py-3 text-[#716D5C]">{p.activity_type || '—'}</td>
                      <td className="px-4 py-3 text-[#716D5C]">{p.potential_clients || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-[#716D5C] text-xs">
                        {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={p.status}
                          onChange={(e) => {
                            e.stopPropagation()
                            updateStatusMutation.mutate({ id: p.id, status: e.target.value })
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 bg-[#F9F7F1] border border-gray-200 rounded-lg text-xs text-[#262626] outline-none cursor-pointer"
                        >
                          {Object.entries(STATUS_MAP).map(([key, val]) => (
                            <option key={key} value={key} className="bg-[#F9F7F1]">{val.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedRow === p.id && (
                        <tr>
                          <td colSpan={7}>
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200 space-y-2">
                                {p.phone && (
                                  <div className="flex items-center gap-2 text-sm text-[#716D5C]">
                                    <Phone className="w-3.5 h-3.5" />
                                    {p.phone}
                                  </div>
                                )}
                                {p.message && (
                                  <div className="text-sm text-[#716D5C]">
                                    <span className="text-[#716D5C] font-medium">Message :</span> {p.message}
                                  </div>
                                )}
                                <div className="text-xs text-[#716D5C]">
                                  Source : {p.source} — Mis à jour : {new Date(p.updated_at).toLocaleString('fr-FR')}
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
