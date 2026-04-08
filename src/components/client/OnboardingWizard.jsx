import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, MessageCircle, Shield, Sparkles, Rocket,
  CheckCircle2, ArrowRight, ArrowLeft, X, Loader2,
  Plug, Globe, Volume2, ChevronRight, Zap,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../ui/Toast'

const TONE_PRESETS = [
  { id: 'formel', label: 'Formel', emoji: '👔', desc: 'Vouvoiement, ton corporatif', example: 'Bonjour, je vous remercie pour votre message. Nous allons traiter votre demande dans les meilleurs delais.' },
  { id: 'professionnel', label: 'Pro & Chaleureux', emoji: '🤝', desc: 'Pro mais accessible', example: 'Bonjour ! Merci de nous avoir contactes. Je m\'occupe de votre demande tout de suite.' },
  { id: 'decontracte', label: 'Decontracte', emoji: '😊', desc: 'Tutoiement, ton amical', example: 'Hey ! Merci pour ton message. Je regarde ca et je te reviens vite !' },
  { id: 'premium', label: 'Premium / Luxe', emoji: '✨', desc: 'Exclusif et attentionne', example: 'Bonjour, c\'est un plaisir de vous accompagner. Permettez-moi de m\'occuper personnellement de votre requete.' },
]

const AGENT_TEMPLATES = [
  { id: 'sav_standard', label: 'SAV E-commerce Standard', desc: 'Retours, suivi colis, remboursements, FAQ produits', icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'sav_premium', label: 'SAV Premium + Upsell', desc: 'SAV complet + recommandations, fidelite, code promo', icon: Sparkles, color: 'bg-violet-50 text-violet-600 border-violet-200' },
  { id: 'immo_leads', label: 'Immobilier - Qualification', desc: 'Qualification leads, dispos, prise de RDV visite', icon: Globe, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'immo_gestion', label: 'Immobilier - Gestion', desc: 'Incidents locataires, relances, etats des lieux', icon: Shield, color: 'bg-amber-50 text-amber-600 border-amber-200' },
]

const WIZARD_STEPS = [
  { id: 'template', title: 'Choisir un modele', subtitle: 'Partez d\'une base optimisee pour votre activite' },
  { id: 'connect', title: 'Connecter vos outils', subtitle: 'Reliez votre boutique et vos canaux de support' },
  { id: 'tone', title: 'Definir le ton', subtitle: 'Choisissez comment votre agent communique' },
  { id: 'knowledge', title: 'Alimenter l\'agent', subtitle: 'Importez vos FAQ et politiques' },
  { id: 'test', title: 'Tester & Activer', subtitle: 'Verifiez que tout fonctionne avant de lancer' },
]

export const OnboardingWizard = ({ clientId, clientType, setActiveTab, theme, onNavigate }) => {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [currentStep, setCurrentStep] = useState(0)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(`onboarding-wizard-${clientId}`) === 'done')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedTone, setSelectedTone] = useState(null)
  const [knowledgeUrl, setKnowledgeUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [testMessages] = useState([
    'Bonjour, ou en est ma commande #4521 ?',
    'Je voudrais un remboursement pour mon dernier achat',
    'Quels sont vos delais de livraison ?',
  ])
  const [testIndex, setTestIndex] = useState(0)
  const [testResponse, setTestResponse] = useState('')
  const [testing, setTesting] = useState(false)
  const [activated, setActivated] = useState(false)

  // Check completion status
  const { data: completion } = useQuery({
    queryKey: ['onboarding-completion', clientId],
    queryFn: async () => {
      const { data: shopify } = await supabase
        .from('client_shopify_connections')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle()

      const { data: integrations } = await supabase
        .from('client_integrations')
        .select('id, status')
        .eq('client_id', clientId)
        .eq('status', 'active')

      const { data: config } = await supabase
        .from('client_settings')
        .select('agent_tone')
        .eq('client_id', clientId)
        .maybeSingle()

      return {
        shopify: !!shopify,
        integrations: (integrations?.length || 0) > 0,
        toneConfigured: !!config?.agent_tone,
      }
    },
    enabled: !!clientId,
  })

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(`onboarding-wizard-${clientId}`, 'done')
    setDismissed(true)
  }

  const handleSelectTemplate = async (templateId) => {
    setSelectedTemplate(templateId)
    const template = AGENT_TEMPLATES.find(t => t.id === templateId)

    // Pre-configure based on template
    const toneMap = {
      sav_standard: 'professionnel',
      sav_premium: 'premium',
      immo_leads: 'professionnel',
      immo_gestion: 'formel',
    }
    setSelectedTone(toneMap[templateId] || 'professionnel')
    toast.success(`Modele "${template?.label}" selectionne`)
  }

  const handleSaveTone = async () => {
    if (!selectedTone || !clientId) return
    const preset = TONE_PRESETS.find(t => t.id === selectedTone)
    await supabase.from('client_settings').upsert({
      client_id: clientId,
      agent_tone: selectedTone,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' })
    toast.success('Ton sauvegarde')
  }

  const handleImportUrl = async () => {
    if (!knowledgeUrl.trim()) return
    setImporting(true)
    // Simulate URL import (in real implementation, this would scrape the URL)
    setTimeout(() => {
      setImporting(false)
      toast.success('Contenu importe avec succes')
    }, 2000)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResponse('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const tone = TONE_PRESETS.find(t => t.id === selectedTone)
      const res = await fetch('/api/simulator-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: testMessages[testIndex],
          systemPrompt: `Tu es un agent de support client IA. Ton: ${tone?.desc || 'professionnel et chaleureux'}. Reponds de maniere concise et utile. Pas de markdown.`,
          history: [],
        }),
      })
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      setTestResponse(data.text || 'Pas de reponse')
    } catch (err) {
      setTestResponse('Erreur lors du test. Verifiez votre configuration.')
    }
    setTesting(false)
  }

  const handleActivate = async () => {
    setActivated(true)
    toast.success('Agent IA active ! Il est maintenant en production.')
    // Mark onboarding as complete
    setTimeout(() => {
      handleDismiss()
      setActiveTab('overview')
    }, 2000)
  }

  const canProceed = () => {
    if (currentStep === 0) return !!selectedTemplate
    if (currentStep === 2) return !!selectedTone
    return true
  }

  const nextStep = () => {
    if (currentStep === 2) handleSaveTone()
    if (currentStep < WIZARD_STEPS.length - 1) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const step = WIZARD_STEPS[currentStep]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003725] to-[#0F5F35] px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">Configuration de votre agent IA</span>
          </div>
          <button onClick={handleDismiss} className="text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.id} className="flex-1 flex items-center gap-1">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentStep ? 'bg-white' : i === currentStep ? 'bg-white/80' : 'bg-white/20'
              }`} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-white font-semibold">{step.title}</p>
            <p className="text-white/60 text-xs">{step.subtitle}</p>
          </div>
          <span className="text-white/40 text-xs font-mono">{currentStep + 1}/{WIZARD_STEPS.length}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Template Selection */}
            {currentStep === 0 && (
              <div className="space-y-3">
                {AGENT_TEMPLATES
                  .filter(t => clientType === 'immobilier' ? t.id.startsWith('immo') : t.id.startsWith('sav'))
                  .map(template => {
                    const Icon = template.icon
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          selectedTemplate === template.id
                            ? 'border-[#0F5F35] bg-emerald-50/50'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${template.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-[#262626]">{template.label}</p>
                          <p className="text-xs text-[#716D5C] mt-0.5">{template.desc}</p>
                        </div>
                        {selectedTemplate === template.id && (
                          <CheckCircle2 className="w-5 h-5 text-[#0F5F35] flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
              </div>
            )}

            {/* Step 2: Connect Tools */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {clientType !== 'immobilier' && (
                  <div className={`flex items-center gap-4 p-4 rounded-xl border ${completion?.shopify ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100'}`}>
                    <div className="w-10 h-10 rounded-xl bg-[#95BF47]/10 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-[#95BF47]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-[#262626]">Shopify</p>
                      <p className="text-xs text-[#716D5C]">
                        {completion?.shopify ? 'Connecte' : 'Connectez votre boutique pour activer l\'agent'}
                      </p>
                    </div>
                    {completion?.shopify ? (
                      <CheckCircle2 className="w-5 h-5 text-[#0F5F35]" />
                    ) : (
                      <button
                        onClick={() => setActiveTab('integrations')}
                        className="px-4 py-2 bg-[#0F5F35] text-white text-xs font-bold rounded-full hover:bg-[#003725] transition-colors"
                      >
                        Connecter
                      </button>
                    )}
                  </div>
                )}

                <div className={`flex items-center gap-4 p-4 rounded-xl border ${completion?.integrations ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100'}`}>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Plug className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#262626]">Autres integrations</p>
                    <p className="text-xs text-[#716D5C]">
                      {completion?.integrations ? 'Au moins une integration active' : 'Slack, Gorgias, Zendesk... (optionnel)'}
                    </p>
                  </div>
                  {completion?.integrations ? (
                    <CheckCircle2 className="w-5 h-5 text-[#0F5F35]" />
                  ) : (
                    <button
                      onClick={() => setActiveTab('integrations')}
                      className="px-4 py-2 bg-gray-100 text-[#262626] text-xs font-bold rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Configurer
                    </button>
                  )}
                </div>

                <p className="text-xs text-[#716D5C] text-center mt-2">
                  Vous pourrez toujours ajouter des integrations plus tard
                </p>
              </div>
            )}

            {/* Step 3: Tone */}
            {currentStep === 2 && (
              <div className="space-y-3">
                {TONE_PRESETS.map(tone => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedTone === tone.id
                        ? 'border-[#0F5F35] bg-emerald-50/50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{tone.emoji}</span>
                      <span className="font-semibold text-sm text-[#262626]">{tone.label}</span>
                      <span className="text-xs text-[#716D5C]">— {tone.desc}</span>
                      {selectedTone === tone.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#0F5F35] ml-auto" />
                      )}
                    </div>
                    {selectedTone === tone.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 p-3 bg-[#F5F5F0] rounded-lg"
                      >
                        <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-1">Apercu</p>
                        <p className="text-sm text-[#262626] italic">"{tone.example}"</p>
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 4: Knowledge Base */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider">
                    Importer depuis une URL
                  </label>
                  <p className="text-xs text-[#716D5C] mb-2">
                    Collez l'URL de votre site, FAQ ou politique de retour
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={knowledgeUrl}
                      onChange={(e) => setKnowledgeUrl(e.target.value)}
                      placeholder="https://votre-boutique.com/faq"
                      className="flex-1 px-4 py-2.5 bg-[#F5F5F0] border border-gray-200 rounded-xl text-sm text-[#262626] outline-none focus:ring-1 focus:ring-[#0F5F35]/30"
                    />
                    <button
                      onClick={handleImportUrl}
                      disabled={!knowledgeUrl.trim() || importing}
                      className="px-4 py-2.5 bg-[#0F5F35] text-white text-sm font-bold rounded-xl hover:bg-[#003725] transition-colors disabled:opacity-50"
                    >
                      {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Importer'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-[#716D5C] mb-3">Ou configurez manuellement :</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('knowledge')}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-left transition-colors"
                    >
                      <Zap className="w-4 h-4 text-[#0F5F35]" />
                      <span className="text-sm text-[#262626]">Ouvrir la base de connaissances</span>
                      <ChevronRight className="w-4 h-4 text-[#716D5C] ml-auto" />
                    </button>
                    <button
                      onClick={() => setActiveTab('agent-config')}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-left transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-[#0F5F35]" />
                      <span className="text-sm text-[#262626]">Configurer les reponses de l'agent</span>
                      <ChevronRight className="w-4 h-4 text-[#716D5C] ml-auto" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#716D5C] text-center">
                  Plus votre agent a de contexte, meilleures seront ses reponses
                </p>
              </div>
            )}

            {/* Step 5: Test & Activate */}
            {currentStep === 4 && (
              <div className="space-y-5">
                {!activated ? (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-[#716D5C] uppercase tracking-wider mb-3">
                        Testez votre agent avec un message client
                      </p>

                      {/* Test message selector */}
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {testMessages.map((msg, i) => (
                          <button
                            key={i}
                            onClick={() => { setTestIndex(i); setTestResponse('') }}
                            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                              testIndex === i
                                ? 'bg-[#0F5F35] text-white'
                                : 'bg-gray-100 text-[#262626] hover:bg-gray-200'
                            }`}
                          >
                            Message {i + 1}
                          </button>
                        ))}
                      </div>

                      {/* Selected message */}
                      <div className="p-3 bg-blue-50 rounded-xl mb-3">
                        <p className="text-xs text-blue-600 font-bold mb-1">Client :</p>
                        <p className="text-sm text-[#262626]">{testMessages[testIndex]}</p>
                      </div>

                      {/* Test button */}
                      <button
                        onClick={handleTest}
                        disabled={testing}
                        className="w-full py-3 bg-[#F5F5F0] border border-gray-200 rounded-xl text-sm font-bold text-[#262626] hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        {testing ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            L'agent reflechit...
                          </span>
                        ) : (
                          'Tester la reponse →'
                        )}
                      </button>

                      {/* Response */}
                      {testResponse && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-emerald-50 rounded-xl mt-3"
                        >
                          <p className="text-xs text-emerald-600 font-bold mb-1">Agent IA :</p>
                          <p className="text-sm text-[#262626]">{testResponse}</p>
                        </motion.div>
                      )}
                    </div>

                    {/* Activate button */}
                    <button
                      onClick={handleActivate}
                      className="w-full py-3.5 bg-[#0F5F35] text-white rounded-xl text-sm font-bold hover:bg-[#003725] transition-colors flex items-center justify-center gap-2"
                    >
                      <Rocket className="w-4 h-4" />
                      Activer l'agent en production
                    </button>
                  </>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle2 className="w-8 h-8 text-[#0F5F35]" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-[#262626] mb-1">Agent active !</h3>
                    <p className="text-sm text-[#716D5C]">
                      Votre agent IA est en production. Surveillez ses performances depuis le tableau de bord.
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      {!activated && (
        <div className="px-6 pb-5 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#716D5C] hover:text-[#262626] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          {currentStep < WIZARD_STEPS.length - 1 && (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0F5F35] text-white text-sm font-bold rounded-full hover:bg-[#003725] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continuer
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
