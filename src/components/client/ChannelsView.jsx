import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Phone, MessageSquare, Mail, Copy, Check,
  CheckCircle2, XCircle, Loader2, ExternalLink, Settings,
  Smartphone, Volume2, Code, Eye, Zap, ArrowRight,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'

const CHANNELS = [
  {
    id: 'widget',
    name: 'Widget Chat',
    desc: 'Chat IA integre sur votre site web',
    icon: Globe,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Copilot',
    desc: 'Assistant IA sur WhatsApp pour vos KPIs et donnees',
    icon: Smartphone,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    id: 'vocal',
    name: 'Agent Vocal',
    desc: 'Agent telephonique IA (ElevenLabs)',
    icon: Phone,
    color: 'bg-violet-50 text-violet-600 border-violet-200',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    id: 'email',
    name: 'Email',
    desc: 'Reponses automatiques par email',
    icon: Mail,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    gradient: 'from-amber-500 to-orange-500',
  },
]

export const ChannelsView = ({ clientId, theme }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [expandedChannel, setExpandedChannel] = useState(null)
  const [copied, setCopied] = useState(null)

  // Fetch channel configs
  const { data: channelConfigs = {} } = useQuery({
    queryKey: ['channel-configs', clientId],
    queryFn: async () => {
      const { data: voice } = await supabase
        .from('voice_agent_config')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle()

      // Check engine_messages to see which channels have been used
      const { data: messages } = await supabase
        .from('engine_messages')
        .select('source')
        .eq('client_id', clientId)
        .limit(100)

      const activeSources = new Set((messages || []).map(m => m.source))

      return {
        widget: { active: true }, // Widget is always available
        whatsapp: { active: activeSources.has('whatsapp') },
        vocal: { active: voice?.is_active || false, config: voice },
        email: { active: true }, // Email is always available via engine
        stats: {
          widget: (messages || []).filter(m => m.source === 'web_widget').length,
          whatsapp: (messages || []).filter(m => m.source === 'whatsapp').length,
          vocal: 0,
          email: (messages || []).filter(m => m.source === 'email').length,
        },
      }
    },
    enabled: !!clientId,
  })

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Copie !')
  }

  const widgetCode = `<script src="https://actero.fr/widget.js" data-actero-key="${clientId}"></script>`
  const webhookUrl = `https://actero.fr/api/engine/webhook`
  const whatsappWebhookUrl = `https://actero.fr/api/engine/webhook`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003725] to-[#0F5F35] flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#262626]">Mes Canaux</h2>
          <p className="text-sm text-[#716D5C]">Activez et configurez les canaux de votre agent IA</p>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="space-y-3">
        {CHANNELS.map(channel => {
          const config = channelConfigs[channel.id] || {}
          const isExpanded = expandedChannel === channel.id
          const Icon = channel.icon
          const msgCount = channelConfigs.stats?.[channel.id] || 0

          return (
            <motion.div
              key={channel.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
            >
              {/* Channel header */}
              <button
                onClick={() => setExpandedChannel(isExpanded ? null : channel.id)}
                className="w-full p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${channel.gradient}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#262626]">{channel.name}</p>
                    {config.active && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Actif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#716D5C] mt-0.5">{channel.desc}</p>
                </div>
                {msgCount > 0 && (
                  <span className="text-xs text-[#716D5C] bg-[#F9F7F1] px-2 py-1 rounded-lg">{msgCount} msg</span>
                )}
                <ArrowRight className={`w-5 h-5 text-[#716D5C] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {/* Expanded config */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100"
                  >
                    <div className="p-5">
                      {channel.id === 'widget' && (
                        <WidgetConfig clientId={clientId} widgetCode={widgetCode} copyText={copyText} copied={copied} />
                      )}
                      {channel.id === 'whatsapp' && (
                        <WhatsAppConfig clientId={clientId} webhookUrl={whatsappWebhookUrl} copyText={copyText} copied={copied} toast={toast} />
                      )}
                      {channel.id === 'vocal' && (
                        <VocalConfig clientId={clientId} config={config.config} toast={toast} queryClient={queryClient} />
                      )}
                      {channel.id === 'email' && (
                        <EmailConfig clientId={clientId} webhookUrl={webhookUrl} copyText={copyText} copied={copied} />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ===== WIDGET CONFIG ===== */
const WidgetConfig = ({ clientId, widgetCode, copyText, copied }) => (
  <div className="space-y-5">
    <div>
      <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">
        1. Copiez ce code
      </p>
      <div className="relative">
        <pre className="p-4 bg-gray-900 text-green-400 rounded-xl text-[12px] font-mono overflow-x-auto">
          {widgetCode}
        </pre>
        <button
          onClick={() => copyText(widgetCode, 'widget')}
          className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          {copied === 'widget' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-300" />}
        </button>
      </div>
    </div>
    <div>
      <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">
        2. Collez-le dans votre site
      </p>
      <p className="text-sm text-[#716D5C]">
        Ajoutez ce code juste avant la balise <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> de votre site.
        Un bouton de chat vert apparaitra en bas a droite. Les clients pourront discuter avec votre agent IA en temps reel.
      </p>
    </div>
    <div>
      <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">
        3. Ca marche sur
      </p>
      <div className="flex flex-wrap gap-2">
        {['Shopify', 'WordPress', 'Wix', 'Squarespace', 'HTML/CSS', 'React', 'Next.js'].map(platform => (
          <span key={platform} className="px-3 py-1 bg-[#F9F7F1] rounded-full text-xs text-[#262626] font-medium">{platform}</span>
        ))}
      </div>
    </div>
    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
      <p className="text-xs text-blue-800">
        <strong>Shopify :</strong> Allez dans Boutique en ligne → Themes → Modifier le code → theme.liquid → collez le code avant <code>&lt;/body&gt;</code>
      </p>
    </div>
  </div>
)

/* ===== WHATSAPP CONFIG ===== */
const WhatsAppConfig = ({ clientId, webhookUrl, copyText, copied, toast }) => {
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('client_integrations').upsert({
      client_id: clientId,
      provider: 'whatsapp',
      status: 'active',
      extra_config: { phone_number: whatsappNumber },
      connected_at: new Date().toISOString(),
    }, { onConflict: 'client_id,provider' }).catch(() => {})
    setSaving(false)
    toast.success('WhatsApp configure')
  }

  return (
    <div className="space-y-5">
      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <p className="text-sm text-emerald-800 font-medium mb-1">WhatsApp Copilot</p>
        <p className="text-xs text-emerald-700">
          Votre assistant personnel sur WhatsApp. Posez-lui des questions sur vos KPIs, escalades, performances — il a acces a toutes vos donnees Actero.
        </p>
      </div>

      <div>
        <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">
          1. Configurez le webhook dans Meta Business Suite
        </p>
        <p className="text-xs text-[#716D5C] mb-2">
          Allez dans <a href="https://business.facebook.com" target="_blank" rel="noopener" className="text-[#0F5F35] underline">Meta Business Suite</a> → WhatsApp → Configuration → Webhooks
        </p>
        <div className="relative">
          <pre className="p-3 bg-gray-900 text-green-400 rounded-xl text-[11px] font-mono overflow-x-auto">
            {`URL: ${webhookUrl}\nVerify Token: ${clientId}`}
          </pre>
          <button
            onClick={() => copyText(`${webhookUrl}`, 'whatsapp-url')}
            className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            {copied === 'whatsapp-url' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-300" />}
          </button>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">
          2. Body JSON a envoyer
        </p>
        <pre className="p-3 bg-gray-900 text-green-400 rounded-xl text-[11px] font-mono overflow-x-auto">
{`{
  "client_id": "${clientId}",
  "source": "whatsapp",
  "customer_email": "votre@email.com",
  "message": "Combien de tickets resolus ce mois ?"
}`}
        </pre>
      </div>

      <div>
        <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">
          3. Votre numero WhatsApp Business (optionnel)
        </p>
        <div className="flex gap-2">
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            className="flex-1 px-4 py-2.5 bg-[#F9F7F1] border border-gray-200 rounded-xl text-sm text-[#262626] outline-none"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 bg-[#0F5F35] text-white text-sm font-bold rounded-xl hover:bg-[#003725] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ===== VOCAL CONFIG ===== */
const VocalConfig = ({ clientId, config, toast, queryClient }) => {
  const [active, setActive] = useState(config?.is_active || false)
  const [saving, setSaving] = useState(false)

  const toggleVocal = async () => {
    setSaving(true)
    const newVal = !active
    setActive(newVal)
    await supabase.from('voice_agent_config').upsert({
      client_id: clientId,
      is_active: newVal,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' })
    queryClient.invalidateQueries({ queryKey: ['channel-configs', clientId] })
    toast.success(newVal ? 'Agent vocal active' : 'Agent vocal desactive')
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-4 bg-violet-50 rounded-xl border border-violet-200">
        <div>
          <p className="text-sm text-violet-800 font-medium">Agent vocal IA</p>
          <p className="text-xs text-violet-600">Powered by ElevenLabs — repond aux appels telephoniques</p>
        </div>
        <button
          onClick={toggleVocal}
          disabled={saving}
          className={`relative w-12 h-6 rounded-full transition-colors ${active ? 'bg-[#0F5F35]' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div>
        <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">Configuration</p>
        <p className="text-sm text-[#716D5C]">
          Configurez la voix, le ton et les regles de votre agent vocal dans l'onglet <strong>Appels IA</strong> et <strong>Voix</strong> dans la sidebar.
        </p>
      </div>

      <div className="p-4 bg-[#F9F7F1] rounded-xl">
        <p className="text-xs text-[#716D5C]">
          Pour connecter un numero de telephone, contactez-nous a <a href="mailto:support@actero.fr" className="text-[#0F5F35] underline">support@actero.fr</a>. Nous configurerons le SIP trunk avec ElevenLabs pour votre numero.
        </p>
      </div>
    </div>
  )
}

/* ===== EMAIL CONFIG ===== */
const EmailConfig = ({ clientId, webhookUrl, copyText, copied }) => (
  <div className="space-y-5">
    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
      <p className="text-sm text-amber-800 font-medium mb-1">Email automatique</p>
      <p className="text-xs text-amber-700">
        L'agent repond automatiquement aux emails clients. Les reponses sont envoyees depuis votre adresse configuree.
      </p>
    </div>

    <div>
      <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">
        Webhook pour recevoir les emails entrants
      </p>
      <p className="text-xs text-[#716D5C] mb-2">
        Configurez un transfert d'email ou un webhook dans votre provider (Gmail, Sendgrid, Resend) pour envoyer les emails entrants a :
      </p>
      <div className="relative">
        <pre className="p-3 bg-gray-900 text-green-400 rounded-xl text-[11px] font-mono overflow-x-auto">
          {`POST ${webhookUrl}\n\nHeaders:\n  x-engine-secret: VOTRE_SECRET\n  Content-Type: application/json\n\nBody:\n{\n  "client_id": "${clientId}",\n  "source": "email",\n  "customer_email": "client@example.com",\n  "message": "contenu de l'email"\n}`}
        </pre>
        <button
          onClick={() => copyText(webhookUrl, 'email-url')}
          className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          {copied === 'email-url' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-300" />}
        </button>
      </div>
    </div>

    <div>
      <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-2">
        Integrations supportees
      </p>
      <div className="flex flex-wrap gap-2">
        {['Gmail (via Google Apps Script)', 'SendGrid Inbound Parse', 'Resend Webhooks', 'Mailgun Routes', 'n8n Email Trigger'].map(provider => (
          <span key={provider} className="px-3 py-1 bg-[#F9F7F1] rounded-full text-xs text-[#262626] font-medium">{provider}</span>
        ))}
      </div>
    </div>
  </div>
)
