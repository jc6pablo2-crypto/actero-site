import React from 'react'
import { motion } from 'framer-motion'
import { Rocket, Sparkles, Zap } from 'lucide-react'
import { PlaybooksView } from './PlaybooksView'

/**
 * Automation Hub — landing page for the "Automatisation" sidebar star entry.
 *
 * Wraps PlaybooksView (the existing scenarios list) with a hero that positions
 * automation as the core product, so new clients land on something inspiring
 * rather than a raw list.
 */
export const AutomationHubView = ({ clientId, theme }) => {
  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-6 pb-16 animate-fade-in-up">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F5F35] via-[#0F5F35] to-[#003725] text-white p-6 md:p-8 mb-8"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Cœur du produit</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Tout ce que votre agent fait pour vous
          </h1>
          <p className="text-[14px] text-white/80 max-w-2xl leading-relaxed">
            Activez, composez et supervisez les automatisations qui traitent vos demandes clients
            24/7 — sans jamais intervenir manuellement.
          </p>
        </div>
      </motion.div>

      {/* Playbooks grid (existing component) */}
      <PlaybooksView clientId={clientId} theme={theme} />
    </div>
  )
}
