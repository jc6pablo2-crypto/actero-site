import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  ShoppingBag, Plug, Settings, Bell, ArrowRight, X, Sparkles,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STEPS_ECOMMERCE = [
  { id: 'account', label: 'Compte cree', description: 'Votre compte Actero est actif.', icon: CheckCircle2, alwaysDone: true },
  { id: 'shopify', label: 'Shopify connecte', description: 'Connectez votre boutique Shopify pour activer les agents IA.', icon: ShoppingBag, tab: 'integrations' },
  { id: 'integrations', label: 'Outils connectes', description: 'Connectez au moins un outil supplementaire (Slack, Gorgias, etc.).', icon: Plug, tab: 'integrations' },
  { id: 'settings', label: 'Configuration ROI', description: 'Renseignez votre cout horaire et temps moyen par ticket pour calculer le ROI.', icon: Settings, tab: 'profile' },
  { id: 'notifications', label: 'Notifications activees', description: 'Configurez vos preferences de notification pour rester informe.', icon: Bell, tab: 'profile' },
]

const STEPS_IMMOBILIER = [
  { id: 'account', label: 'Compte cree', description: 'Votre compte Actero est actif.', icon: CheckCircle2, alwaysDone: true },
  { id: 'integrations', label: 'CRM connecte', description: 'Connectez votre CRM immobilier (Apimo, Hektor, etc.).', icon: Plug, tab: 'integrations' },
  { id: 'settings', label: 'Configuration ROI', description: 'Renseignez votre cout horaire agent et temps moyen par lead.', icon: Settings, tab: 'profile' },
  { id: 'notifications', label: 'Notifications activees', description: 'Configurez vos preferences de notification.', icon: Bell, tab: 'profile' },
]

export const OnboardingChecklist = ({ clientId, clientType, setActiveTab, theme }) => {
  const isLight = theme === 'light'
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(`onboarding-dismissed-${clientId}`) === 'true')

  const steps = clientType === 'immobilier' ? STEPS_IMMOBILIER : STEPS_ECOMMERCE

  // Fetch completion data
  const { data: completion } = useQuery({
    queryKey: ['onboarding-completion', clientId],
    queryFn: async () => {
      // Check Shopify connection
      const { data: shopify } = await supabase
        .from('client_shopify_connections')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle()

      // Check other integrations
      const { data: integrations } = await supabase
        .from('client_integrations')
        .select('id, status')
        .eq('client_id', clientId)
        .eq('status', 'active')

      // Check client settings
      const { data: settings } = await supabase
        .from('client_settings')
        .select('hourly_cost, avg_ticket_time_min')
        .eq('client_id', clientId)
        .maybeSingle()

      // Check notification preferences
      const { data: notifs } = await supabase
        .from('client_notification_preferences')
        .select('id')
        .eq('client_id', clientId)
        .maybeSingle()

      return {
        account: true,
        shopify: !!shopify,
        integrations: (integrations?.length || 0) > 0,
        settings: !!(settings?.hourly_cost && settings?.avg_ticket_time_min),
        notifications: !!notifs,
      }
    },
    enabled: !!clientId,
  })

  if (dismissed || !completion) return null

  const completedSteps = steps.filter(s => s.alwaysDone || completion?.[s.id])
  const totalSteps = steps.length
  const completedCount = completedSteps.length
  const progress = Math.round((completedCount / totalSteps) * 100)
  const allDone = completedCount === totalSteps

  // Auto-dismiss when all done
  if (allDone) return null

  const handleDismiss = () => {
    localStorage.setItem(`onboarding-dismissed-${clientId}`, 'true')
    setDismissed(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#003725]/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#003725]" />
          </div>
          <div>
            <h3 className="font-bold text-[#262626] text-sm">Configurez votre espace</h3>
            <p className="text-xs text-[#716D5C]">{completedCount}/{totalSteps} etapes — {progress}% complete</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-gray-50 text-[#716D5C] transition-colors">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button onClick={handleDismiss} className="p-1.5 rounded-lg hover:bg-gray-50 text-[#716D5C] transition-colors" title="Masquer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#0F5F35] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-1">
              {steps.map((step, i) => {
                const done = step.alwaysDone || completion?.[step.id]
                const Icon = step.icon
                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                      done ? 'opacity-60' : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => !done && step.tab && setActiveTab(step.tab)}
                  >
                    <div className="mt-0.5">
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-[#0F5F35]" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${done ? 'text-[#716D5C] line-through' : 'text-[#262626]'}`}>
                        {step.label}
                      </p>
                      {!done && (
                        <p className="text-xs text-[#716D5C] mt-0.5">{step.description}</p>
                      )}
                    </div>
                    {!done && step.tab && (
                      <ArrowRight className="w-4 h-4 text-[#716D5C] mt-1 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
