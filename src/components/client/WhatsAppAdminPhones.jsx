import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Shield, Plus, X, Check, Terminal, Info, Phone, Loader2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'

const COMMANDS = [
  { cmd: '/help', desc: 'Voir toutes les commandes disponibles' },
  { cmd: '/kb add <question> | <réponse>', desc: 'Ajouter une entrée à la base de connaissances' },
  { cmd: '/kb list [n]', desc: 'Voir les n dernières entrées (max 10)' },
  { cmd: '/kb delete <id>', desc: 'Supprimer une entrée (id = 4 premiers chars)' },
  { cmd: '/tone <texte>', desc: 'Mettre à jour le ton de marque de l\'agent' },
  { cmd: '/pause', desc: 'Désactiver temporairement l\'agent WhatsApp' },
  { cmd: '/resume', desc: 'Réactiver l\'agent WhatsApp' },
  { cmd: '/stats', desc: 'Voir les stats du mois en cours' },
]

export const WhatsAppAdminPhones = ({ clientId }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [newPhone, setNewPhone] = useState('')

  const { data: settings } = useQuery({
    queryKey: ['wa-admin-phones', clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('client_settings')
        .select('whatsapp_admin_phones')
        .eq('client_id', clientId)
        .maybeSingle()
      return data || { whatsapp_admin_phones: [] }
    },
    enabled: !!clientId,
  })

  const phones = Array.isArray(settings?.whatsapp_admin_phones) ? settings.whatsapp_admin_phones : []

  const saveMutation = useMutation({
    mutationFn: async (nextPhones) => {
      const { error } = await supabase
        .from('client_settings')
        .update({ whatsapp_admin_phones: nextPhones })
        .eq('client_id', clientId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wa-admin-phones', clientId] })
    },
  })

  const normalize = (p) => {
    const t = String(p || '').replace(/\s|-|\(|\)/g, '').replace(/^00/, '+')
    return t.startsWith('+') ? t : `+${t}`
  }

  const addPhone = () => {
    const clean = normalize(newPhone)
    if (!/^\+\d{7,15}$/.test(clean)) {
      toast.error('Numéro invalide. Format E.164 : +33612345678')
      return
    }
    if (phones.includes(clean)) {
      toast.error('Numéro déjà dans la liste.')
      return
    }
    saveMutation.mutate([...phones, clean], {
      onSuccess: () => {
        setNewPhone('')
        toast.success('Numéro ajouté')
      },
    })
  }

  const removePhone = (phone) => {
    saveMutation.mutate(phones.filter((p) => p !== phone), {
      onSuccess: () => toast.success('Numéro retiré'),
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
          <Terminal className="w-5 h-5 text-[#25D366]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1a1a1a]">Commandes admin WhatsApp</h3>
          <p className="text-xs text-[#71717a]">Pilotez votre agent depuis votre téléphone sans ouvrir le dashboard</p>
        </div>
      </div>

      {/* Whitelisted phones */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-semibold text-[#71717a] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Numéros autorisés
        </p>

        {phones.length === 0 ? (
          <p className="text-xs text-[#9ca3af] italic mb-3">
            Aucun numéro autorisé. Seuls les numéros listés ici peuvent exécuter des commandes admin.
          </p>
        ) : (
          <div className="space-y-1.5 mb-3">
            {phones.map((p) => (
              <div key={p} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                <Phone className="w-3.5 h-3.5 text-[#71717a]" />
                <code className="flex-1 text-xs font-mono text-[#1a1a1a]">{p}</code>
                <button
                  onClick={() => removePhone(p)}
                  disabled={saveMutation.isPending}
                  className="p-1 rounded hover:bg-red-50 text-[#9ca3af] hover:text-red-500 disabled:opacity-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPhone()}
            placeholder="+33 6 12 34 56 78"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366]/30"
          />
          <button
            onClick={addPhone}
            disabled={!newPhone.trim() || saveMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1fb355] disabled:opacity-50 transition-colors"
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Ajouter
          </button>
        </div>

        <div className="flex items-start gap-2 mt-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Les messages commençant par <code className="bg-white/70 px-1 rounded">/</code> envoyés depuis ces numéros sont interprétés comme des commandes admin et ne passent pas par l'agent IA.
          </p>
        </div>
      </div>

      {/* Commands list */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-[#71717a] uppercase tracking-wider">Commandes disponibles</p>
        </div>
        <div className="divide-y divide-gray-100">
          {COMMANDS.map((c) => (
            <div key={c.cmd} className="flex items-start gap-3 px-5 py-3">
              <code className="text-[11px] font-mono text-[#25D366] bg-[#25D366]/5 border border-[#25D366]/20 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                {c.cmd}
              </code>
              <p className="text-xs text-[#71717a] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
