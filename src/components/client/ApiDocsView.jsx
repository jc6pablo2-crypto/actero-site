import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Key, Copy, Check, Terminal, Webhook, Server } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../ui/PageHeader'
import { SectionCard } from '../ui/SectionCard'

export function ApiDocsView({ clientId }) {
  const [copied, setCopied] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ['client-settings-api', clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('client_settings')
        .select('widget_api_key')
        .eq('client_id', clientId)
        .maybeSingle()
      return data
    },
    enabled: !!clientId,
  })

  const apiKey = settings?.widget_api_key || ''

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const endpoints = [
    {
      method: 'POST',
      url: '/api/engine/webhooks/widget',
      description: 'Envoyer un message a l\'agent IA',
      curl: `curl -X POST https://actero.fr/api/engine/webhooks/widget \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "${apiKey || 'VOTRE_CLE_API'}",
    "message": "Ou est ma commande #1234 ?",
    "visitor_id": "visitor_001"
  }'`,
    },
    {
      method: 'GET',
      url: '/api/billing/usage',
      description: 'Consulter votre consommation',
      curl: `curl https://actero.fr/api/billing/usage \\
  -H "Authorization: Bearer ${apiKey || 'VOTRE_CLE_API'}"`,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="API Actero" subtitle="Integrez Actero dans vos outils et workflows" />

      {/* Cle API */}
      <SectionCard title="Votre cle API" icon={Key}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-[#fafafa] border border-[#f0f0f0] rounded-lg px-4 py-2.5 text-[13px] font-mono text-[#1a1a1a] truncate">
              {apiKey || 'Chargement...'}
            </code>
            <button
              onClick={() => handleCopy(apiKey)}
              disabled={!apiKey}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#0F5F35] text-white text-[13px] font-medium hover:bg-[#003725] transition-colors disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copie' : 'Copier'}
            </button>
          </div>
          <p className="text-[12px] text-[#9ca3af]">
            Utilisez cette cle pour authentifier vos requetes API. Ne la partagez jamais publiquement.
          </p>
        </div>
      </SectionCard>

      {/* Endpoints */}
      <SectionCard title="Endpoints disponibles" icon={Terminal}>
        <div className="space-y-6">
          {endpoints.map((ep) => (
            <div key={ep.url} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  ep.method === 'POST'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {ep.method}
                </span>
                <code className="text-[13px] font-mono text-[#1a1a1a] font-medium">{ep.url}</code>
              </div>
              <p className="text-[13px] text-[#71717a]">{ep.description}</p>
              <div className="relative">
                <pre className="bg-[#1a1a1a] text-[#e4e4e7] rounded-lg p-4 text-[12px] font-mono overflow-x-auto leading-relaxed">
                  {ep.curl}
                </pre>
                <button
                  onClick={() => handleCopy(ep.curl)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                  title="Copier"
                >
                  <Copy className="w-3.5 h-3.5 text-white/70" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* MCP Server */}
      <SectionCard title="MCP Server" icon={Server}>
        <div className="space-y-3">
          <p className="text-[13px] text-[#71717a] leading-relaxed">
            Actero expose un serveur MCP (Model Context Protocol) pour connecter votre agent IA a d'autres outils comme Claude Desktop, Cursor, ou tout client MCP compatible.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-[#fafafa] border border-[#f0f0f0] rounded-lg px-4 py-2.5 text-[13px] font-mono text-[#1a1a1a] truncate">
              {apiKey ? `https://actero.fr/api/mcp/${apiKey}` : 'https://actero.fr/api/mcp/{api_key}'}
            </code>
            <button
              onClick={() => handleCopy(`https://actero.fr/api/mcp/${apiKey}`)}
              disabled={!apiKey}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#0F5F35] text-white text-[13px] font-medium hover:bg-[#003725] transition-colors disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              Copier
            </button>
          </div>
          <p className="text-[12px] text-[#9ca3af]">
            Disponible a partir du plan Starter
          </p>
        </div>
      </SectionCard>

      {/* Webhooks sortants */}
      <SectionCard title="Webhooks sortants" icon={Webhook}>
        <div className="space-y-3">
          <p className="text-[13px] text-[#71717a] leading-relaxed">
            Configurez des webhooks pour recevoir les evenements Actero en temps reel (ticket resolu, escalade, etc.)
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            <span className="text-[12px] font-medium text-amber-700">Disponible a partir du plan Pro</span>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
