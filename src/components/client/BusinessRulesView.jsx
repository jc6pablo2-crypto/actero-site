import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  GitBranch, Plus, Trash2, Loader2, Pencil, X, ToggleLeft, ToggleRight,
  CheckCircle2, ArrowRight, ChevronUp, ChevronDown,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'

const FIELDS = [
  { value: 'classification', label: 'Classification' },
  { value: 'sentiment_score', label: 'Score de sentiment (1-10)' },
  { value: 'confidence', label: 'Confiance IA (0-1)' },
  { value: 'customer_email', label: 'Email client' },
  { value: 'subject', label: 'Sujet' },
  { value: 'message', label: 'Contenu du message' },
  { value: 'message_length', label: 'Longueur du message' },
  { value: 'source', label: 'Canal source' },
  { value: 'amount', label: 'Montant (€)' },
]

const OPERATORS = [
  { value: '==', label: '= egal' },
  { value: '!=', label: '≠ different' },
  { value: '>', label: '> superieur' },
  { value: '<', label: '< inferieur' },
  { value: '>=', label: '≥ sup ou egal' },
  { value: '<=', label: '≤ inf ou egal' },
  { value: 'contains', label: 'contient' },
  { value: 'starts_with', label: 'commence par' },
  { value: 'ends_with', label: 'finit par' },
  { value: 'in', label: 'dans la liste' },
  { value: 'not_in', label: 'pas dans la liste' },
]

const ACTION_TYPES = [
  { value: 'send_reply', label: 'Repondre automatiquement', hasParam: false },
  { value: 'escalate', label: 'Escalader vers humain', hasParam: 'reason', paramLabel: 'Raison' },
  { value: 'notify_slack', label: 'Notifier Slack', hasParam: 'channel', paramLabel: 'Canal (#support)' },
  { value: 'tag_contact', label: 'Taguer le contact', hasParam: 'tag', paramLabel: 'Tag' },
  { value: 'send_email_to', label: 'Envoyer email a', hasParam: 'email', paramLabel: 'Adresse email' },
  { value: 'create_ticket', label: 'Creer un ticket', hasParam: false },
  { value: 'add_note', label: 'Ajouter une note', hasParam: 'note', paramLabel: 'Note' },
]

const inputClass = 'w-full px-3 py-2 bg-[#fafafa] border border-[#ebebeb] rounded-lg text-[13px] text-[#1a1a1a] outline-none focus:ring-1 focus:ring-[#0F5F35]/30 placeholder-gray-400'
const selectClass = inputClass + ' appearance-none cursor-pointer'

const EMPTY_FORM = {
  name: '',
  priority: 0,
  conditions: [{ field: 'classification', operator: '==', value: '' }],
  actions: [{ type: 'send_reply' }],
}

function labelForField(value) {
  return FIELDS.find(f => f.value === value)?.label || value
}
function labelForOperator(value) {
  return OPERATORS.find(o => o.value === value)?.label || value
}
function labelForAction(value) {
  return ACTION_TYPES.find(a => a.value === value)?.label || value
}

export const BusinessRulesView = ({ clientId, theme: _theme }) => {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['business-rules', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_business_rules')
        .select('*')
        .eq('client_id', clientId)
        .order('priority', { ascending: false })
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

  const handleEdit = (rule) => {
    setForm({
      name: rule.name,
      priority: rule.priority || 0,
      conditions: Array.isArray(rule.conditions) && rule.conditions.length > 0
        ? rule.conditions
        : [{ field: 'classification', operator: '==', value: '' }],
      actions: Array.isArray(rule.actions) && rule.actions.length > 0
        ? rule.actions
        : [{ type: 'send_reply' }],
    })
    setEditingId(rule.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nom de la regle requis')
      return
    }
    if (form.conditions.length === 0 || form.actions.length === 0) {
      toast.error('Au moins une condition et une action')
      return
    }
    setSaving(true)
    try {
      const payload = {
        client_id: clientId,
        name: form.name.trim(),
        priority: Number(form.priority) || 0,
        conditions: form.conditions,
        actions: form.actions,
        updated_at: new Date().toISOString(),
      }
      if (editingId) {
        const { error } = await supabase
          .from('client_business_rules')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
        toast.success('Regle mise a jour')
      } else {
        const { error } = await supabase
          .from('client_business_rules')
          .insert(payload)
        if (error) throw error
        toast.success('Regle creee')
      }
      queryClient.invalidateQueries({ queryKey: ['business-rules', clientId] })
      resetForm()
    } catch (err) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  const handleToggle = async (rule) => {
    await supabase
      .from('client_business_rules')
      .update({ is_active: !rule.is_active, updated_at: new Date().toISOString() })
      .eq('id', rule.id)
    queryClient.invalidateQueries({ queryKey: ['business-rules', clientId] })
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette regle ?')) return
    await supabase.from('client_business_rules').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['business-rules', clientId] })
    toast.success('Regle supprimee')
  }

  const handlePriority = async (rule, delta) => {
    await supabase
      .from('client_business_rules')
      .update({ priority: (rule.priority || 0) + delta, updated_at: new Date().toISOString() })
      .eq('id', rule.id)
    queryClient.invalidateQueries({ queryKey: ['business-rules', clientId] })
  }

  const addCondition = () => setForm(f => ({
    ...f,
    conditions: [...f.conditions, { field: 'classification', operator: '==', value: '' }],
  }))
  const removeCondition = (i) => setForm(f => ({
    ...f,
    conditions: f.conditions.filter((_, idx) => idx !== i),
  }))
  const updateCondition = (i, key, value) => setForm(f => ({
    ...f,
    conditions: f.conditions.map((c, idx) => idx === i ? { ...c, [key]: value } : c),
  }))

  const addAction = () => setForm(f => ({
    ...f,
    actions: [...f.actions, { type: 'send_reply' }],
  }))
  const removeAction = (i) => setForm(f => ({
    ...f,
    actions: f.actions.filter((_, idx) => idx !== i),
  }))
  const updateAction = (i, key, value) => setForm(f => ({
    ...f,
    actions: f.actions.map((a, idx) => idx === i ? { ...a, [key]: value } : a),
  }))

  const buildPreview = (conditions, actions) => {
    const condText = (conditions || [])
      .map(c => `${labelForField(c.field)} ${c.operator} ${c.value || '?'}`)
      .join(' ET ')
    const actText = (actions || [])
      .map(a => {
        const extra = Object.entries(a).filter(([k]) => k !== 'type').map(([k, v]) => `${k}=${v}`).join(', ')
        return extra ? `${labelForAction(a.type)} (${extra})` : labelForAction(a.type)
      })
      .join(' + ')
    return `SI ${condText || '…'} ALORS ${actText || '…'}`
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
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold text-[#1a1a1a]">Regles metier</h2>
            <p className="text-[13px] text-[#9ca3af]">Automatisez "Si X alors Y" sans ecrire de code</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F5F35] text-white rounded-lg text-[12px] font-semibold hover:bg-[#003725] transition-colors"
        >
          <Plus className="w-4 h-4" /> Creer une regle
        </button>
      </div>

      {/* Empty state */}
      {rules.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-10 text-center">
          <GitBranch className="w-8 h-8 text-[#9ca3af] mx-auto mb-3" />
          <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-1">Aucune regle active</h3>
          <p className="text-[12px] text-[#9ca3af] mb-4">Creez votre premiere regle pour declencher des actions automatiques.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F5F35] text-white rounded-lg text-[12px] font-semibold hover:bg-[#003725]"
          >
            <Plus className="w-4 h-4" /> Creer ma premiere regle
          </button>
        </div>
      )}

      {/* Rules list */}
      {rules.length > 0 && (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-[14px] font-semibold text-[#1a1a1a]">{rule.name}</h3>
                    <span className="text-[10px] font-semibold text-[#9ca3af] bg-[#f5f5f5] px-2 py-0.5 rounded">Priorite {rule.priority || 0}</span>
                    {rule.is_active ? (
                      <span className="text-[10px] font-semibold text-[#0F5F35] bg-emerald-50 px-2 py-0.5 rounded">Actif</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#9ca3af] bg-[#f5f5f5] px-2 py-0.5 rounded">Inactif</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#9ca3af] leading-relaxed">
                    {buildPreview(rule.conditions, rule.actions)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handlePriority(rule, 1)} className="p-1.5 rounded-lg text-[#9ca3af] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]" title="Augmenter la priorite">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handlePriority(rule, -1)} className="p-1.5 rounded-lg text-[#9ca3af] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]" title="Baisser la priorite">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleToggle(rule)} className="p-1.5 rounded-lg text-[#9ca3af] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]">
                    {rule.is_active ? <ToggleRight className="w-4 h-4 text-[#0F5F35]" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleEdit(rule)} className="p-1.5 rounded-lg text-[#9ca3af] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-lg text-[#9ca3af] hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-semibold text-[#1a1a1a]">
                  {editingId ? 'Modifier la regle' : 'Nouvelle regle metier'}
                </h3>
                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-[#f5f5f5]">
                  <X className="w-4 h-4 text-[#9ca3af]" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Name + priority */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">Nom de la regle</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="ex: Escalader les gros remboursements"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-1.5">Priorite</label>
                    <input
                      type="number"
                      value={form.priority}
                      onChange={(e) => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* SI section */}
                <div className="rounded-xl border border-[#f0f0f0] p-4 bg-[#fafafa]/40">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#1a1a1a]">SI (toutes les conditions)</p>
                    <button
                      type="button"
                      onClick={addCondition}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#0F5F35] hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Condition
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.conditions.map((cond, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <select
                          value={cond.field}
                          onChange={(e) => updateCondition(i, 'field', e.target.value)}
                          className={selectClass + ' flex-1'}
                        >
                          {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                        <select
                          value={cond.operator}
                          onChange={(e) => updateCondition(i, 'operator', e.target.value)}
                          className={selectClass + ' w-36'}
                        >
                          {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <input
                          type="text"
                          value={cond.value}
                          onChange={(e) => updateCondition(i, 'value', e.target.value)}
                          placeholder="valeur"
                          className={inputClass + ' flex-1'}
                        />
                        <button
                          type="button"
                          onClick={() => removeCondition(i)}
                          disabled={form.conditions.length === 1}
                          className="p-2 rounded-lg text-[#9ca3af] hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ALORS section */}
                <div className="rounded-xl border border-[#f0f0f0] p-4 bg-[#fafafa]/40">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#1a1a1a]">ALORS (actions)</p>
                    <button
                      type="button"
                      onClick={addAction}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#0F5F35] hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Action
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.actions.map((act, i) => {
                      const def = ACTION_TYPES.find(a => a.value === act.type)
                      const paramKey = def?.hasParam
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <select
                            value={act.type}
                            onChange={(e) => {
                              const newType = e.target.value
                              const newDef = ACTION_TYPES.find(a => a.value === newType)
                              const newAction = { type: newType }
                              if (newDef?.hasParam) newAction[newDef.hasParam] = ''
                              updateAction(i, 'type', newType)
                              // replace whole action to clear old params
                              setForm(f => ({
                                ...f,
                                actions: f.actions.map((a, idx) => idx === i ? newAction : a),
                              }))
                            }}
                            className={selectClass + ' flex-1'}
                          >
                            {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                          </select>
                          {paramKey && (
                            <input
                              type="text"
                              value={act[paramKey] || ''}
                              onChange={(e) => updateAction(i, paramKey, e.target.value)}
                              placeholder={def.paramLabel}
                              className={inputClass + ' flex-1'}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeAction(i)}
                            disabled={form.actions.length === 1}
                            className="p-2 rounded-lg text-[#9ca3af] hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-xl bg-[#0F5F35]/5 border border-[#0F5F35]/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F5F35] mb-1.5 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> Apercu
                  </p>
                  <p className="text-[12px] text-[#1a1a1a] leading-relaxed font-medium">
                    {buildPreview(form.conditions, form.actions)}
                  </p>
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
                  {editingId ? 'Mettre a jour' : 'Creer la regle'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BusinessRulesView
