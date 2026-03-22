import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Plus, Play, Pause, Trash2, Clock, Send, CheckCircle, Eye,
  Loader2, ChevronRight, BarChart3, X, AlertCircle, RefreshCw
} from 'lucide-react'

const DEMO_SEQUENCES = [
  {
    id: 1,
    name: 'SAV E-commerce — Cold outreach',
    status: 'active',
    steps: [
      { day: 0, subject: 'Votre SAV perd des clients', openRate: 42, replyRate: 6 },
      { day: 3, subject: 'Relance — Les chiffres parlent', openRate: 38, replyRate: 4 },
      { day: 7, subject: 'Dernière chance — audit gratuit', openRate: 35, replyRate: 8 },
    ],
    totalSent: 127,
    totalOpened: 52,
    totalReplied: 8,
    createdAt: '2026-03-15',
  }
]

export const AdminCampaignView = () => {
  const [campaigns, setCampaigns] = useState(DEMO_SEQUENCES)
  const [showCreate, setShowCreate] = useState(false)
  const [newCampaign, setNewCampaign] = useState({ name: '', steps: [{ day: 0, subject: '' }, { day: 3, subject: '' }, { day: 7, subject: '' }] })
  const [generating, setGenerating] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  const generateSequence = async () => {
    if (!newCampaign.name.trim()) return
    setGenerating(true)

    try {
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Tu es un expert en cold email B2B pour Actero, agence d'automatisation IA e-commerce.

Génère une séquence de 3 emails pour la campagne "${newCampaign.name}".

Pour chaque email, donne :
- Jour d'envoi (J+0, J+3, J+7)
- Objet du mail (max 60 caractères)
- Corps du mail (max 120 mots, ton direct, pas corporate)

Format JSON strict :
[
  {"day": 0, "subject": "...", "body": "..."},
  {"day": 3, "subject": "...", "body": "..."},
  {"day": 7, "subject": "...", "body": "..."}
]

Réponds UNIQUEMENT avec le JSON, rien d'autre.` }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
          })
        }
      )
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      const steps = JSON.parse(cleaned)

      const campaign = {
        id: Date.now(),
        name: newCampaign.name,
        status: 'draft',
        steps: steps.map(s => ({ ...s, openRate: 0, replyRate: 0 })),
        totalSent: 0,
        totalOpened: 0,
        totalReplied: 0,
        createdAt: new Date().toISOString().split('T')[0],
      }

      setCampaigns(prev => [campaign, ...prev])
      setShowCreate(false)
      setNewCampaign({ name: '', steps: [{ day: 0, subject: '' }, { day: 3, subject: '' }, { day: 7, subject: '' }] })
      setSelectedCampaign(campaign)
    } catch (e) {
      console.error('Campaign generation error:', e)
      alert('Erreur lors de la génération. Vérifiez votre clé Gemini.')
    }
    setGenerating(false)
  }

  const toggleCampaignStatus = (id) => {
    setCampaigns(prev => prev.map(c =>
      c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c
    ))
  }

  const deleteCampaign = (id) => {
    if (!confirm('Supprimer cette campagne ?')) return
    setCampaigns(prev => prev.filter(c => c.id !== id))
    if (selectedCampaign?.id === id) setSelectedCampaign(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Campagnes Email</h2>
          <p className="text-sm text-zinc-500 mt-1">Séquences automatisées de cold email avec génération IA</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> Nouvelle campagne
        </button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Campagnes actives', value: campaigns.filter(c => c.status === 'active').length, icon: Play, color: 'text-emerald-400' },
          { label: 'Emails envoyés', value: campaigns.reduce((s, c) => s + c.totalSent, 0), icon: Send, color: 'text-blue-400' },
          { label: 'Taux d\'ouverture', value: (() => { const t = campaigns.reduce((s, c) => s + c.totalSent, 0); return t ? Math.round(campaigns.reduce((s, c) => s + c.totalOpened, 0) / t * 100) : 0 })() + '%', icon: Eye, color: 'text-amber-400' },
          { label: 'Taux de réponse', value: (() => { const t = campaigns.reduce((s, c) => s + c.totalSent, 0); return t ? Math.round(campaigns.reduce((s, c) => s + c.totalReplied, 0) / t * 100) : 0 })() + '%', icon: Mail, color: 'text-violet-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#111] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-zinc-500 font-medium">{stat.label}</span>
            </div>
            <span className="text-2xl font-bold text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Campaigns list */}
      <div className="space-y-3">
        {campaigns.map(campaign => (
          <motion.div
            key={campaign.id}
            layout
            className="bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  campaign.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                  campaign.status === 'draft' ? 'bg-zinc-500/10 text-zinc-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {campaign.status === 'active' ? <Play className="w-5 h-5" /> :
                   campaign.status === 'draft' ? <Clock className="w-5 h-5" /> :
                   <Pause className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{campaign.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span>{campaign.steps.length} emails</span>
                    <span>{campaign.totalSent} envoyés</span>
                    <span>Créée le {campaign.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {campaign.totalSent > 0 && (
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <span className="text-zinc-500 block">Ouvert</span>
                      <span className="text-blue-400 font-bold">{Math.round(campaign.totalOpened / campaign.totalSent * 100)}%</span>
                    </div>
                    <div className="text-center">
                      <span className="text-zinc-500 block">Répondu</span>
                      <span className="text-emerald-400 font-bold">{Math.round(campaign.totalReplied / campaign.totalSent * 100)}%</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedCampaign(selectedCampaign?.id === campaign.id ? null : campaign)}
                    className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleCampaignStatus(campaign.id)}
                    className={`p-2 hover:bg-white/5 rounded-lg transition-all ${
                      campaign.status === 'active' ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded sequence view */}
            <AnimatePresence>
              {selectedCampaign?.id === campaign.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    {campaign.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-zinc-400'
                          }`}>
                            J+{step.day}
                          </div>
                          {i < campaign.steps.length - 1 && (
                            <div className="w-px h-8 bg-white/10 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                          <p className="text-sm text-white font-medium">{step.subject}</p>
                          {step.body && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{step.body}</p>}
                          {step.openRate > 0 && (
                            <div className="flex gap-3 mt-2 text-[10px]">
                              <span className="text-blue-400">Ouverture: {step.openRate}%</span>
                              <span className="text-emerald-400">Réponse: {step.replyRate}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Create campaign modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Nouvelle campagne</h3>
                <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 font-medium block mb-1">Nom de la campagne</label>
                  <input
                    value={newCampaign.name}
                    onChange={e => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: SAV E-commerce — Boutiques Shopify FR"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  L'IA va générer une séquence de 3 emails (J+0, J+3, J+7) optimisée pour la conversion.
                </p>
                <button
                  onClick={generateSequence}
                  disabled={generating || !newCampaign.name.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl text-sm font-medium transition-all"
                >
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération IA en cours...</> : <><RefreshCw className="w-4 h-4" /> Générer la séquence avec l'IA</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
