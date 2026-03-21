import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  User, Mail, Building2, Lock, Save, CheckCircle2, AlertCircle,
  ShoppingBag, Calendar, Shield, CreditCard, ExternalLink, Loader2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const StripePortalButton = ({ clientId, isLight }) => {
  const [loading, setLoading] = useState(false)

  const openPortal = async () => {
    if (!clientId) return
    setLoading(true)
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      window.open(data.url, '_blank')
    } catch (err) {
      alert('Impossible d\'accéder au portail : ' + err.message)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={openPortal}
      disabled={loading || !clientId}
      className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
        isLight
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
      } disabled:opacity-50`}
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</>
      ) : (
        <><ExternalLink className="w-4 h-4" /> Gérer mon abonnement</>
      )}
    </button>
  )
}

export const ClientProfileView = ({ theme = 'dark' }) => {
  const queryClient = useQueryClient()
  const isLight = theme === 'light'
  const [form, setForm] = useState({ brand_name: '', contact_email: '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [saveStatus, setSaveStatus] = useState(null)
  const [passwordStatus, setPasswordStatus] = useState(null)

  const { data: session } = useQuery({
    queryKey: ['profile-session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    },
  })

  const { data: client } = useQuery({
    queryKey: ['profile-client'],
    queryFn: async () => {
      if (!session?.user?.id) return null
      const { data: link } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const clientId = link?.client_id
      if (!clientId) {
        const { data } = await supabase
          .from('clients')
          .select('*')
          .eq('owner_user_id', session.user.id)
          .single()
        return data
      }

      const { data } = await supabase.from('clients').select('*').eq('id', clientId).single()
      return data
    },
    enabled: !!session,
  })

  useEffect(() => {
    if (client) {
      setForm({
        brand_name: client.brand_name || '',
        contact_email: client.contact_email || '',
      })
    }
  }, [client])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('clients')
        .update({
          brand_name: form.brand_name,
          contact_email: form.contact_email,
        })
        .eq('id', client.id)
      if (error) throw error
    },
    onSuccess: () => {
      setSaveStatus('success')
      queryClient.invalidateQueries({ queryKey: ['profile-client'] })
      setTimeout(() => setSaveStatus(null), 3000)
    },
    onError: (err) => {
      setSaveStatus('error')
      console.error(err)
      setTimeout(() => setSaveStatus(null), 3000)
    },
  })

  const changePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordStatus('mismatch')
      setTimeout(() => setPasswordStatus(null), 3000)
      return
    }
    if (passwordForm.new.length < 6) {
      setPasswordStatus('too_short')
      setTimeout(() => setPasswordStatus(null), 3000)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new })
      if (error) throw error
      setPasswordStatus('success')
      setPasswordForm({ current: '', new: '', confirm: '' })
      setTimeout(() => setPasswordStatus(null), 3000)
    } catch (err) {
      setPasswordStatus('error')
      console.error(err)
      setTimeout(() => setPasswordStatus(null), 3000)
    }
  }

  const inputClass = `w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all ${
    isLight
      ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
      : 'bg-white/5 border border-white/10 text-white focus:border-white/30 focus:ring-2 focus:ring-white/5'
  }`

  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-500' : 'text-gray-500'}`

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h2 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Mon profil</h2>
        <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Gérez les informations de votre compte</p>
      </div>

      {/* Account info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-6 space-y-5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0a0a] border-white/10'}`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-white/5 text-white'}`}>
            <User className="w-5 h-5" />
          </div>
          <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Informations générales</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>
              <Building2 className="w-3 h-3 inline mr-1" /> Nom de l'entreprise
            </label>
            <input
              type="text"
              value={form.brand_name}
              onChange={(e) => setForm(f => ({ ...f, brand_name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              <Mail className="w-3 h-3 inline mr-1" /> Email de contact
            </label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm(f => ({ ...f, contact_email: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        {/* Read-only info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>
              <Mail className="w-3 h-3 inline mr-1" /> Email du compte
            </label>
            <div className={`px-4 py-3 rounded-xl text-sm ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/[0.02] text-gray-400'}`}>
              {session?.user?.email || '—'}
            </div>
          </div>
          <div>
            <label className={labelClass}>
              {client?.client_type === 'immobilier'
                ? <><Building2 className="w-3 h-3 inline mr-1" /> Type</>
                : <><ShoppingBag className="w-3 h-3 inline mr-1" /> Type</>}
            </label>
            <div className={`px-4 py-3 rounded-xl text-sm capitalize ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/[0.02] text-gray-400'}`}>
              {client?.client_type || 'ecommerce'}
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            <Calendar className="w-3 h-3 inline mr-1" /> Membre depuis
          </label>
          <div className={`px-4 py-3 rounded-xl text-sm ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/[0.02] text-gray-400'}`}>
            {client?.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {saveStatus === 'success' && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sauvegardé
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Erreur
              </span>
            )}
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isLight
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-black hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            <Save className="w-4 h-4" /> Enregistrer
          </button>
        </div>
      </motion.div>

      {/* Subscription management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl border p-6 space-y-5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0a0a] border-white/10'}`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'}`}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Abonnement</h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Gérez votre abonnement, moyen de paiement et factures</p>
          </div>
        </div>

        <div className={`rounded-xl p-4 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-white/[0.02] border border-white/5'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Portail client Stripe</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
                Consultez vos factures, mettez à jour votre carte bancaire ou modifiez votre abonnement.
              </p>
            </div>
          </div>
        </div>

        <StripePortalButton clientId={client?.id} isLight={isLight} />
      </motion.div>

      {/* Password change */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl border p-6 space-y-5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a0a0a] border-white/10'}`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-white/5 text-white'}`}>
            <Shield className="w-5 h-5" />
          </div>
          <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Sécurité</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              <Lock className="w-3 h-3 inline mr-1" /> Nouveau mot de passe
            </label>
            <input
              type="password"
              value={passwordForm.new}
              onChange={(e) => setPasswordForm(f => ({ ...f, new: e.target.value }))}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              <Lock className="w-3 h-3 inline mr-1" /> Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {passwordStatus === 'success' && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Mot de passe mis à jour
              </span>
            )}
            {passwordStatus === 'mismatch' && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Les mots de passe ne correspondent pas
              </span>
            )}
            {passwordStatus === 'too_short' && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Minimum 6 caractères
              </span>
            )}
            {passwordStatus === 'error' && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Erreur
              </span>
            )}
          </div>
          <button
            onClick={changePassword}
            disabled={!passwordForm.new || !passwordForm.confirm}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isLight
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            } disabled:opacity-30`}
          >
            <Lock className="w-4 h-4" /> Changer le mot de passe
          </button>
        </div>
      </motion.div>
    </div>
  )
}
