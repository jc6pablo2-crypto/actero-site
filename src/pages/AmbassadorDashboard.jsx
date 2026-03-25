import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Link2,
  Users,
  DollarSign,
  BookOpen,
  User,
  Copy,
  Share2,
  Plus,
  X,
  Check,
  Menu,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/layout/Logo'
import { Sidebar } from '../components/layout/Sidebar'

// ─── Status badge helpers ───
const leadStatusConfig = {
  submitted: { label: 'Soumis', color: 'bg-gray-500/20 text-gray-400' },
  contacted: { label: 'Contacté', color: 'bg-blue-500/20 text-blue-400' },
  qualified: { label: 'Qualifié', color: 'bg-purple-500/20 text-purple-400' },
  audit_booked: { label: 'Audit planifié', color: 'bg-indigo-500/20 text-indigo-400' },
  audit_done: { label: 'Audit terminé', color: 'bg-cyan-500/20 text-cyan-400' },
  closing_in_progress: { label: 'Closing en cours', color: 'bg-amber-500/20 text-amber-400' },
  won: { label: 'Signé', color: 'bg-green-500/20 text-green-400' },
  lost: { label: 'Perdu', color: 'bg-red-500/20 text-red-400' },
}

const commissionStatusConfig = {
  pending: { label: 'En attente', color: 'bg-gray-500/20 text-gray-400' },
  waiting_30_days: { label: 'Délai 30j', color: 'bg-amber-500/20 text-amber-400' },
  eligible: { label: 'Éligible', color: 'bg-blue-500/20 text-blue-400' },
  approved: { label: 'Validée', color: 'bg-green-500/20 text-green-400' },
  paid: { label: 'Payée', color: 'bg-emerald-500/20 text-emerald-400' },
  cancelled: { label: 'Annulée', color: 'bg-red-500/20 text-red-400' },
}

const StatusBadge = ({ status, config }) => {
  const s = config[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.color}`}>
      {s.label}
    </span>
  )
}

// ─── KPI card ───
const KPICard = ({ label, value, accent = 'emerald' }) => (
  <div className="p-5 rounded-2xl bg-[#111] border border-white/10">
    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
    <p className={`text-3xl font-bold text-${accent}-400`}>{value ?? '—'}</p>
  </div>
)

// ─── Copy button ───
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-300 hover:bg-white/10 transition-all"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  )
}

// ─── Main Dashboard ───
export const AmbassadorDashboard = ({ onNavigate, currentRoute }) => {
  const [ambassador, setAmbassador] = useState(null)
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState([])
  const [commissions, setCommissions] = useState([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Lead modal
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [leadForm, setLeadForm] = useState({
    prospect_name: '', company_name: '', company_niche: '', prospect_email: '', prospect_phone: '', message: '',
  })
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadSuccess, setLeadSuccess] = useState(false)

  // Profile edit
  const [profileForm, setProfileForm] = useState(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const getTabFromRoute = (route) => {
    if (route === '/ambassador/link') return 'link'
    if (route === '/ambassador/leads') return 'leads'
    if (route === '/ambassador/commissions') return 'commissions'
    if (route === '/ambassador/rules') return 'rules'
    if (route === '/ambassador/profile') return 'profile'
    return 'overview'
  }

  const activeTab = getTabFromRoute(currentRoute)
  const setActiveTab = (tab) => {
    const route = tab === 'overview' ? '/ambassador' : `/ambassador/${tab}`
    onNavigate(route)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onNavigate('/')
  }

  // Fetch ambassador data
  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          onNavigate('/ambassador/login')
          return
        }

        const { data: amb, error: ambErr } = await supabase
          .from('ambassadors')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (ambErr || !amb) {
          onNavigate('/ambassador/login')
          return
        }

        if (mounted) {
          setAmbassador(amb)
          setProfileForm({
            first_name: amb.first_name || '',
            last_name: amb.last_name || '',
            phone: amb.phone || '',
            siret: amb.siret || '',
          })
        }

        // Fetch leads
        const { data: leadsData } = await supabase
          .from('ambassador_leads')
          .select('*')
          .eq('ambassador_id', amb.id)
          .order('created_at', { ascending: false })

        if (mounted && leadsData) setLeads(leadsData)

        // Fetch commissions
        const { data: commissionsData } = await supabase
          .from('ambassador_commissions')
          .select('*')
          .eq('ambassador_id', amb.id)
          .order('created_at', { ascending: false })

        if (mounted && commissionsData) setCommissions(commissionsData)
      } catch (_err) {
        // silent
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [onNavigate])

  // Submit lead
  const handleLeadSubmit = async (e) => {
    e.preventDefault()
    setLeadSubmitting(true)
    try {
      const res = await fetch('/api/ambassador/submit-lead.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadForm,
          ambassador_id: ambassador.id,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLeads((prev) => [data, ...prev])
      setLeadSuccess(true)
      setTimeout(() => {
        setShowLeadModal(false)
        setLeadSuccess(false)
        setLeadForm({ prospect_name: '', company_name: '', company_niche: '', prospect_email: '', prospect_phone: '', message: '' })
      }, 1500)
    } catch (_err) {
      // handle error silently
    } finally {
      setLeadSubmitting(false)
    }
  }

  // Save profile
  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    try {
      await supabase
        .from('ambassadors')
        .update({
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          phone: profileForm.phone,
          siret: profileForm.siret,
        })
        .eq('id', ambassador.id)

      setAmbassador((prev) => ({ ...prev, ...profileForm }))
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch (_err) {
      // silent
    } finally {
      setProfileSaving(false)
    }
  }

  const sidebarItems = [
    { type: 'section', label: 'Navigation' },
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'link', label: 'Mon Lien', icon: Link2 },
    { id: 'leads', label: 'Mes Recommandations', icon: Users },
    { id: 'commissions', label: 'Mes Commissions', icon: DollarSign },
    { id: 'rules', label: 'Règles', icon: BookOpen },
    { id: 'profile', label: 'Mon Profil', icon: User },
  ]

  const ambassadorLink = ambassador?.code
    ? `https://actero.fr/ambassadeurs?ref=${ambassador.code}`
    : ''

  const totalLeads = leads.length
  const leadsInProgress = leads.filter((l) => !['won', 'lost'].includes(l.status)).length
  const leadsWon = leads.filter((l) => l.status === 'won').length
  const pendingCommissions = commissions.filter((c) => ['pending', 'waiting_30_days', 'eligible'].includes(c.status)).length
  const validatedCommissions = commissions.filter((c) => ['approved', 'paid'].includes(c.status)).length
  const totalEarned = commissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + (c.amount || 0), 0)

  const commissionsPending = commissions.filter((c) => ['pending', 'waiting_30_days', 'eligible'].includes(c.status)).reduce((s, c) => s + (c.amount || 0), 0)
  const commissionsValidated = commissions.filter((c) => c.status === 'approved').reduce((s, c) => s + (c.amount || 0), 0)
  const commissionsPaid = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0)
  const commissionsTotal = commissions.filter((c) => !['cancelled'].includes(c.status)).reduce((s, c) => s + (c.amount || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Actero', text: 'Découvrez Actero, la plateforme IA pour automatiser votre business.', url: ambassadorLink })
      } catch (_e) { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(ambassadorLink)
    }
  }

  // ─── RENDER TABS ───
  const renderContent = () => {
    switch (activeTab) {
      // ═══════════════════════════════════════
      // OVERVIEW
      // ═══════════════════════════════════════
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Bonjour, {ambassador?.first_name || 'Ambassadeur'}
              </h1>
              <p className="text-gray-400 font-medium">Votre tableau de bord ambassadeur.</p>
            </div>

            {/* Code + Link */}
            <div className="p-6 rounded-2xl bg-[#111] border border-white/10">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Votre code ambassadeur</p>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-2xl font-bold text-emerald-400 font-mono">{ambassador?.code || '—'}</span>
                {ambassadorLink && <CopyButton text={ambassadorLink} />}
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard label="Leads envoyés" value={totalLeads} />
              <KPICard label="Leads en cours" value={leadsInProgress} accent="blue" />
              <KPICard label="Leads signés" value={leadsWon} accent="green" />
              <KPICard label="Commissions en attente" value={pendingCommissions} accent="amber" />
              <KPICard label="Commissions validées" value={validatedCommissions} accent="cyan" />
              <KPICard label="Total gagné" value={`${totalEarned.toLocaleString('fr-FR')} \u20AC`} />
            </div>
          </div>
        )

      // ═══════════════════════════════════════
      // MON LIEN
      // ═══════════════════════════════════════
      case 'link':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Mon Lien</h1>
              <p className="text-gray-400 font-medium">Partagez ce lien pour attribuer automatiquement vos recommandations.</p>
            </div>

            <div className="p-8 rounded-2xl bg-[#111] border border-white/10 space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Code ambassadeur</p>
                <p className="text-4xl font-bold text-emerald-400 font-mono">{ambassador?.code || '—'}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Lien de parrainage</p>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 flex-wrap">
                  <code className="text-sm text-white font-mono break-all flex-1">{ambassadorLink || '—'}</code>
                  {ambassadorLink && <CopyButton text={ambassadorLink} />}
                  {ambassadorLink && (
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                    >
                      <Share2 className="w-4 h-4" /> Partager
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-sm text-gray-300 font-medium leading-relaxed">
                  Partagez ce lien à vos contacts professionnels. Dès qu'ils prennent rendez-vous via ce lien, le lead vous est automatiquement attribué.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Conditions de commission</p>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                  La récompense est versée 30 jours après le paiement effectif du client. Le montant dépend de la valeur du contrat signé.
                </p>
              </div>
            </div>
          </div>
        )

      // ═══════════════════════════════════════
      // MES RECOMMANDATIONS
      // ═══════════════════════════════════════
      case 'leads':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Mes Recommandations</h1>
                <p className="text-gray-400 font-medium">{leads.length} recommandation{leads.length > 1 ? 's' : ''} au total</p>
              </div>
              <button
                onClick={() => setShowLeadModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" /> Recommander un prospect
              </button>
            </div>

            {/* Leads table */}
            <div className="rounded-2xl bg-[#111] border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Prospect</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Entreprise</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Niche</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                          Aucune recommandation pour le moment.
                        </td>
                      </tr>
                    ) : leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-white">{lead.prospect_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{lead.company_name}</td>
                        <td className="px-6 py-4">
                          {lead.company_niche && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-gray-300">
                              {lead.company_niche}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={lead.status} config={leadStatusConfig} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                          {lead.status_note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Lead submission modal */}
            <AnimatePresence>
              {showLeadModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                  onClick={() => setShowLeadModal(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl p-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {leadSuccess ? (
                      <div className="text-center py-8">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                          <Check className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Recommandation envoyée !</h3>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold text-white">Recommander un prospect</h3>
                          <button onClick={() => setShowLeadModal(false)} className="text-gray-400 hover:text-white">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1.5">Nom du prospect *</label>
                            <input
                              type="text" required
                              value={leadForm.prospect_name}
                              onChange={(e) => setLeadForm((p) => ({ ...p, prospect_name: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                              placeholder="Jean Dupont"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1.5">Entreprise *</label>
                            <input
                              type="text" required
                              value={leadForm.company_name}
                              onChange={(e) => setLeadForm((p) => ({ ...p, company_name: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                              placeholder="Nom de l'entreprise"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1.5">Niche</label>
                            <select
                              value={leadForm.company_niche}
                              onChange={(e) => setLeadForm((p) => ({ ...p, company_niche: e.target.value }))}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                            >
                              <option value="" className="bg-[#111]">Sélectionner</option>
                              <option value="E-commerce" className="bg-[#111]">E-commerce</option>
                              <option value="Immobilier" className="bg-[#111]">Immobilier</option>
                              <option value="SaaS" className="bg-[#111]">SaaS</option>
                              <option value="Finance" className="bg-[#111]">Finance</option>
                              <option value="Santé" className="bg-[#111]">Santé</option>
                              <option value="Autre" className="bg-[#111]">Autre</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-300 mb-1.5">Email</label>
                              <input
                                type="email"
                                value={leadForm.prospect_email}
                                onChange={(e) => setLeadForm((p) => ({ ...p, prospect_email: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                                placeholder="email@exemple.com"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-300 mb-1.5">Téléphone</label>
                              <input
                                type="tel"
                                value={leadForm.prospect_phone}
                                onChange={(e) => setLeadForm((p) => ({ ...p, prospect_phone: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                                placeholder="+33 6 ..."
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-300 mb-1.5">Message</label>
                            <textarea
                              value={leadForm.message}
                              onChange={(e) => setLeadForm((p) => ({ ...p, message: e.target.value }))}
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                              placeholder="Contexte ou informations utiles..."
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={leadSubmitting}
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-xl transition-all"
                          >
                            {leadSubmitting ? (
                              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" />
                            ) : 'Envoyer la recommandation'}
                          </button>
                        </form>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )

      // ═══════════════════════════════════════
      // COMMISSIONS
      // ═══════════════════════════════════════
      case 'commissions':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Mes Commissions</h1>
              <p className="text-gray-400 font-medium">Suivi de vos récompenses.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard label="En attente" value={`${commissionsPending.toLocaleString('fr-FR')} \u20AC`} accent="amber" />
              <KPICard label="Validées" value={`${commissionsValidated.toLocaleString('fr-FR')} \u20AC`} accent="green" />
              <KPICard label="Payées" value={`${commissionsPaid.toLocaleString('fr-FR')} \u20AC`} />
              <KPICard label="Total cumulé" value={`${commissionsTotal.toLocaleString('fr-FR')} \u20AC`} accent="cyan" />
            </div>

            <div className="rounded-2xl bg-[#111] border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Prospect / Entreprise</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date éligibilité</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                          Aucune commission pour le moment.
                        </td>
                      </tr>
                    ) : commissions.map((c) => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-white">{c.prospect_name || '—'}</p>
                          <p className="text-xs text-gray-500">{c.company_name || ''}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-white">
                          {c.amount ? `${c.amount.toLocaleString('fr-FR')} \u20AC` : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {c.eligible_date ? new Date(c.eligible_date).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status} config={commissionStatusConfig} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {c.paid_date ? new Date(c.paid_date).toLocaleDateString('fr-FR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      // ═══════════════════════════════════════
      // RÈGLES
      // ═══════════════════════════════════════
      case 'rules':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Règles du programme</h1>
              <p className="text-gray-400 font-medium">Tout ce que vous devez savoir.</p>
            </div>

            <div className="space-y-6">
              {[
                {
                  title: 'Attribution',
                  content: 'Les leads sont attribués via votre lien ou code unique, ou par recommandation manuelle validée par Actero. Chaque lead est vérifié avant attribution définitive.',
                },
                {
                  title: 'Quand la récompense est due',
                  content: 'La récompense est due uniquement si le prospect recommandé devient client ET effectue un paiement. La simple recommandation ne suffit pas.',
                },
                {
                  title: 'Délai de paiement',
                  content: 'La récompense est versée 30 jours après l\'encaissement effectif du paiement client. Ce délai permet de couvrir les éventuelles périodes de rétractation.',
                },
                {
                  title: 'Cas où aucune récompense n\'est due',
                  content: 'Aucune commission n\'est versée si : le client ne paie pas, le client est remboursé intégralement, le lead n\'est pas validé par Actero, ou le lead a déjà été soumis par un autre ambassadeur.',
                },
                {
                  title: 'Règle du premier arrivé',
                  content: 'Un lead ne peut être attribué qu\'à un seul ambassadeur. En cas de doublon, c\'est le premier ambassadeur ayant soumis le lead qui est retenu (premier arrivé, premier servi).',
                },
              ].map((rule, i) => (
                <div key={i} className="p-6 rounded-2xl bg-[#111] border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-3">{rule.title}</h3>
                  <p className="text-gray-400 font-medium leading-relaxed">{rule.content}</p>
                </div>
              ))}
            </div>
          </div>
        )

      // ═══════════════════════════════════════
      // PROFIL
      // ═══════════════════════════════════════
      case 'profile':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Mon Profil</h1>
              <p className="text-gray-400 font-medium">Gérez vos informations personnelles.</p>
            </div>

            {profileForm && (
              <form onSubmit={handleProfileSave} className="max-w-xl space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Prénom</label>
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Nom</label>
                    <input
                      type="text"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={ambassador?.email || ''}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-600 mt-1">L'email ne peut pas être modifié.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">SIRET (optionnel)</label>
                  <input
                    type="text"
                    value={profileForm.siret}
                    onChange={(e) => setProfileForm((p) => ({ ...p, siret: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="123 456 789 00012"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Date d'inscription</label>
                    <p className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm">
                      {ambassador?.created_at ? new Date(ambassador.created_at).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Statut du compte</label>
                    <div className="px-4 py-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        ambassador?.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : ambassador?.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {ambassador?.status === 'active' ? 'Actif' : ambassador?.status === 'pending' ? 'En attente' : (ambassador?.status || 'Inconnu')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-xl transition-all"
                  >
                    {profileSaving ? 'Enregistrement...' : profileSaved ? 'Enregistré !' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20"
                  >
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </div>
              </form>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#030303] font-sans text-white flex">
      {/* Mobile menu toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed md:static z-50 h-screen transition-transform md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          title="Ambassadeur"
          items={sidebarItems}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab)
            setIsMobileMenuOpen(false)
          }}
          onLogout={handleLogout}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 md:py-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
