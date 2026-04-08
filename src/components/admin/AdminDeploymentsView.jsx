import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Zap, Clock, CheckCircle, XCircle, Loader2, ExternalLink,
  ShoppingBag, Copy, Check, Sparkles, Play
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Loader2 },
  deployed: { label: 'Déployé', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  rejected: { label: 'Rejeté', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
}

export function AdminDeploymentsView() {
  const queryClient = useQueryClient()
  const [copiedId, setCopiedId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['deployment-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deployment_requests')
        .select(`
          *,
          clients:client_id (
            id,
            brand_name,
            client_type,
            status,
            contact_email
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  // Fetch shopify connections for context
  const { data: shopifyConnections = [] } = useQuery({
    queryKey: ['shopify-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_shopify_connections')
        .select('shop_domain, client_id, scopes, updated_at')
      if (error) throw error
      return data || []
    },
  })

  const [sendingEmailId, setSendingEmailId] = useState(null)

  const updateStatus = async (id, status, client) => {
    const updates = { status }
    if (status === 'deployed') {
      updates.deployed_at = new Date().toISOString()
    }
    await supabase.from('deployment_requests').update(updates).eq('id', id)

    // Send notification email when deployed
    if (status === 'deployed' && client?.contact_email) {
      setSendingEmailId(id)
      try {
        await fetch('/api/send-deployment-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: client.contact_email,
            company_name: client.brand_name,
          }),
        })
      } catch (err) {
        console.error('Failed to send deployment email:', err)
      } finally {
        setSendingEmailId(null)
      }
    }

    queryClient.invalidateQueries({ queryKey: ['deployment-requests'] })
  }

  const updateNotes = async (id, notes) => {
    await supabase.from('deployment_requests').update({ admin_notes: notes }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['deployment-requests'] })
  }

  const updateWorkflowId = async (id, workflowId) => {
    await supabase.from('deployment_requests').update({ workflow_id: workflowId }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['deployment-requests'] })
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-1">Automations clients</h2>
          <p className="text-gray-500">Demandes de déploiement de workflows n8n.</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">{pendingCount} en attente</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Sparkles className="w-8 h-8 animate-pulse text-gray-400" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-16 text-center flex flex-col items-center">
          <Zap className="w-12 h-12 text-gray-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">Aucune demande</h3>
          <p className="text-gray-500">Les demandes d'activation apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending
            const StatusIcon = status.icon
            const client = req.clients
            const shopConn = shopifyConnections.find(s => s.client_id === req.client_id)
            const isExpanded = expandedId === req.id

            return (
              <div
                key={req.id}
                className={`bg-[#0a0a0a] border rounded-2xl overflow-hidden transition-colors ${
                  req.status === 'pending' ? 'border-amber-500/30' : 'border-white/10'
                }`}
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${status.color}`}>
                    <StatusIcon className={`w-5 h-5 ${req.status === 'in_progress' ? 'animate-spin' : ''}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold truncate">
                        {client?.brand_name || 'Client inconnu'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {req.shop_domain || 'Pas de shop Shopify'} — {new Date(req.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="text-gray-600 text-xs">
                    {isExpanded ? '▲' : '▼'}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-5 space-y-4">
                    {/* Info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InfoRow
                        label="Client ID"
                        value={req.client_id}
                        copyable
                        copiedId={copiedId}
                        onCopy={copyToClipboard}
                      />
                      <InfoRow
                        label="Shop Domain"
                        value={req.shop_domain || shopConn?.shop_domain || '—'}
                        copyable={!!(req.shop_domain || shopConn?.shop_domain)}
                        copiedId={copiedId}
                        onCopy={copyToClipboard}
                      />
                      <InfoRow
                        label="Email client"
                        value={client?.contact_email || '—'}
                        copyable={!!client?.contact_email}
                        copiedId={copiedId}
                        onCopy={copyToClipboard}
                      />
                      <InfoRow
                        label="Type client"
                        value={client?.client_type === 'immobilier' ? '🏠 Immobilier' : '🛒 E-commerce'}
                      />
                      <InfoRow
                        label="Credentials Shopify"
                        value={shopConn ? '✅ Connecté' : '❌ Non connecté'}
                      />
                      {req.workflow_id && (
                        <InfoRow
                          label="Workflow n8n"
                          value={req.workflow_id}
                          copyable
                          copiedId={copiedId}
                          onCopy={copyToClipboard}
                        />
                      )}
                      {req.deployed_at && (
                        <InfoRow
                          label="Déployé le"
                          value={new Date(req.deployed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        />
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Notes admin
                      </label>
                      <textarea
                        defaultValue={req.admin_notes || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (req.admin_notes || '')) {
                            updateNotes(req.id, e.target.value)
                          }
                        }}
                        placeholder="Notes sur le déploiement..."
                        rows={2}
                        className="w-full px-4 py-3 bg-[#030303] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-white/20 transition-all placeholder-gray-600 resize-none"
                      />
                    </div>

                    {/* Workflow ID input */}
                    {req.status !== 'deployed' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                          ID workflow n8n (après déploiement)
                        </label>
                        <input
                          type="text"
                          defaultValue={req.workflow_id || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (req.workflow_id || '')) {
                              updateWorkflowId(req.id, e.target.value)
                            }
                          }}
                          placeholder="Ex: B82qZGLUQ7uFEAP8"
                          className="w-full px-4 py-3 bg-[#030303] border border-white/10 rounded-xl text-sm text-white outline-none focus:border-white/20 transition-all placeholder-gray-600"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(req.id, 'in_progress', client)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Prendre en charge
                          </button>
                          <button
                            onClick={() => updateStatus(req.id, 'rejected', client)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rejeter
                          </button>
                        </>
                      )}
                      {req.status === 'in_progress' && (
                        <button
                          onClick={() => updateStatus(req.id, 'deployed', client)}
                          disabled={sendingEmailId === req.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-60"
                        >
                          {sendingEmailId === req.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Envoi de l'email...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Déployé — Notifier le client
                            </>
                          )}
                        </button>
                      )}
                      {req.status === 'deployed' && (
                        <a
                          href={`https://n8n.srv1403284.hstgr.cloud/workflow/${req.workflow_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Voir dans n8n
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, copyable, copiedId, onCopy }) {
  const id = `${label}-${value}`
  return (
    <div className="flex items-center justify-between p-3 bg-[#030303] rounded-xl border border-white/5">
      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-white font-mono truncate max-w-[200px]">{value}</span>
        {copyable && value && value !== '—' && (
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(value, id); }}
            className="text-gray-600 hover:text-white transition-colors"
          >
            {copiedId === id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}
