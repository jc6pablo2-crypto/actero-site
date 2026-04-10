import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Tag, Plus, Trash2, Loader2, Pencil, X, ToggleLeft, ToggleRight,
  CheckCircle2, Sparkles,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'

const ACTION_CHOICES = [
  { value: 'send_reply', label: 'Repondre automatiquement' },
  { value: 'send_email', label: 'Envoyer un email' },
  { value: 'escalate', label: 'Escalader vers humain' },
  { value: 'tag_contact', label: 'Taguer le contact' },
  { value: 'notify_slack', label: 'Notifier Slack' },
  { value: 'create_ticket', label: 'Creer un ticket' },
]

const inputClass = 'w-full px-3 py-2 bg-[#fafafa] border border-[#ebebeb] rounded-lg text-[13px] text-[#1a1a1a] outline-none focus:ring-1 focus:ring-[#0F5F35]/30 placeholder-gray-400'

const EMPTY_FORM = {
  category_key: '',
  category_label: '',
  category_description: '',
  example_messages_text: '',
  default_actions: ['send_reply'],
}

export const CustomClassificationsView = ({ clientId, theme: _theme }) => {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['client-classifications', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_classifications')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!clientId,
  })

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (cat) => {
    setForm({
      category_key: cat.category_key,
      category_label: cat.category_label,
      category_description: cat.category_description || '',
      example_messages_text: (cat.example_messages || []).join('\n'),
      default_actions: Array.isArray(cat.default_actions) ? cat.default_actions : ['send_reply'],
    })
    setEditingId(cat.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.category_key.trim() || !form.category_label.trim()) {
      toast.error('Cle et label requis')
      return
    }
    setSaving(true)
    try {
      const payload = {
        client_id: clientId,
        category_key: form.category_key.trim().toLowerCase().replace(/\s+/g, '_'),
        category_label: form.category_label.trim(),
        category_description: form.category_description.trim() || null,
        example_messages: form.example_messages_text
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        default_actions: form.default_actions,
        updated_at: new Date().toISOString(),
      }
      if (editingId) {
        const { error } = await supabase
          .from('client_classifications')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
        toast.success('Categorie mise a jour')
      } else {
        const { error } = await supabase
          .from('client_classifications')
          .insert(payload)
        if (error) throw error
        toast.success('Categorie creee')
      }
      queryClient.invalidateQueries({ queryKey: ['client-classifications', clientId] })
      resetForm()
    } catch (err) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  const handleToggle = async (cat) => {
    await supabase
      .from('client_classifications')
      .update({ is_active: !cat.is_active, updated_at: new Date().toISOString() })
      .eq('id', cat.id)
    queryClient.invalidateQueries({ queryKey: ['client-classifications', clientId] })
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette categorie ?')) return
    await supabase.from('client_classifications').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['client-classifications', clientId] })
    toast.success('Categorie supprimee')
  }

  const toggleAction = (value) => {
    setForm(f => ({
      ...f,
      default_actions: f.default_actions.includes(value)
        ? f.default_actions.filter(a => a !== value)
        : [...f.default_actions, value],
    }))
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#9ca3af]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Tag className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-[#1a1a1a]">Categories de classification</h2>
            <p className="text-[13px] text-[#9ca3af]">Definissez les types de demandes que votre agent doit reconnaitre</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F5F35] text-white rounded-lg text-[12px] font-semibold hover:bg-[#003725] transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter une categorie
        </button>
      </div>

      {/* Empty state */}
      {categories.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-10 text-center">
          <Sparkles className="w-8 h-8 text-[#9ca3af] mx-auto mb-3" />
          <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-1">Aucune categorie personnalisee</h3>
          <p className="text-[12px] text-[#9ca3af] mb-4">Creez des categories propres a votre metier pour affiner la classification IA.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F5F35] text-white rounded-lg text-[12px] font-semibold hover:bg-[#003725]"
          >
            <Plus className="w-4 h-4" /> Creer ma premiere categorie
          </button>
        </div>
      )}

      {/* Table */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#f0f0f0] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#fafafa] border-b border-[#f0f0f0]">
              <tr>
                <th className="px-5 py-3 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">Cle</th>
                <th className="px-5 py-3 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">Label</th>
                <th className="px-5 py-3 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</th>
                <th className="px-5 py-3 text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider">Etat</th>
                <th className="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b border-[#f5f5f5] last:border-0 hover:bg-[#fafafa]">
                  <td className="px-5 py-3 text-[13px] font-mono text-[#1a1a1a]">{cat.category_key}</td>
                  <td className="px-5 py-3">
                    <div className="text-[13px] font-semibold text-[#1a1a1a]">{cat.category_label}</div>
                    {cat.category_description && (
                      <div className="text-[11px] text-[#9ca3af] line-clamp-1 max-w-sm">{cat.category_description}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(cat.default_actions || []).map(a => (
                        <span key={a} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f5f5f5] text-[#1a1a1a]">{a}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggle(cat)}
                      className="flex items-center gap-1.5 text-[12px] font-medium"
                    >
                      {cat.is_active ? (
                        <><ToggleRight className="w-5 h-5 text-[#0F5F35]" /> <span className="text-[#0F5F35]">Actif</span></>
                      ) : (
                        <><ToggleLeft className="w-5 h-5 text-[#9ca3af]" /> <span className="text-[#9ca3af]">Inactif</span></>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(cat)} className="p-1.5 rounded-lg text-[#9ca3af] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg text-[#9ca3af] hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-semibold text-[#1a1a1a]">
                  {editingId ? 'Modifier la categorie' : 'Nouvelle categorie'}
                </h3>
                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-[#f5f5f5]">
                  <X className="w-4 h-4 text-[#9ca3af]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">Cle technique</label>
                  <input
                    type="text"
                    value={form.category_key}
                    onChange={(e) => setForm(f => ({ ...f, category_key: e.target.value }))}
                    placeholder="ex: demande_facture"
                    className={inputClass}
                    disabled={!!editingId}
                  />
                  <p className="text-[10px] text-[#9ca3af] mt-1">Identifiant unique, sans espaces (ex: demande_facture)</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">Label lisible</label>
                  <input
                    type="text"
                    value={form.category_label}
                    onChange={(e) => setForm(f => ({ ...f, category_label: e.target.value }))}
                    placeholder="ex: Demande de facture"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">Description (optionnelle)</label>
                  <textarea
                    value={form.category_description}
                    onChange={(e) => setForm(f => ({ ...f, category_description: e.target.value }))}
                    placeholder="Explique quand cette categorie doit etre utilisee"
                    rows={2}
                    className={inputClass + ' resize-y'}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">Exemples de messages (1 par ligne)</label>
                  <textarea
                    value={form.example_messages_text}
                    onChange={(e) => setForm(f => ({ ...f, example_messages_text: e.target.value }))}
                    placeholder={'Bonjour, je souhaiterais ma facture\nOu puis-je telecharger ma facture ?'}
                    rows={4}
                    className={inputClass + ' resize-y font-mono text-[12px]'}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">Actions par defaut</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACTION_CHOICES.map(a => {
                      const active = form.default_actions.includes(a.value)
                      return (
                        <button
                          key={a.value}
                          type="button"
                          onClick={() => toggleAction(a.value)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-medium transition-all ${active ? 'border-[#0F5F35] bg-emerald-50 text-[#0F5F35]' : 'border-[#ebebeb] bg-white text-[#9ca3af] hover:border-[#d0d0d0]'}`}
                        >
                          {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {a.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-[#f0f0f0]">
                <button onClick={resetForm} className="px-4 py-2 text-[12px] font-medium text-[#9ca3af] hover:text-[#1a1a1a]">
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0F5F35] text-white text-[12px] font-semibold rounded-lg hover:bg-[#003725] disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {editingId ? 'Mettre a jour' : 'Creer la categorie'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomClassificationsView
