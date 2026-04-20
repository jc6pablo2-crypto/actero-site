import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { FadeInUp } from '../ui/scroll-animations'

/**
 * CapabilitiesA — 4 cards (2x2) variation A.
 *
 * Design key points :
 * — Background cream #F9F7F1
 * — Cards blanc rounded-[20px], padding 32px, border subtile
 * — Icon container cream square #F4F0E6 avec emoji 22px dedans
 * — Badge (Dès Free / Pro / Dès Starter) en pill cta/10
 * — Highlight footer avec check icon + border-t
 * — Hover : translate-y-[-2px] + shadow dark soft
 */
export const CapabilitiesA = () => {
  const serif = { fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }

  const caps = [
    {
      badge: 'Dès Free',
      icon: '💬',
      title: 'Agent SAV Email & Chat',
      desc:
        "Répond aux WISMO, retours, changements d'adresse, questions produit. Escalade vers humain si confiance < 60% ou ton agressif détecté.",
      highlight: '60% des tickets résolus sans humain',
    },
    {
      badge: 'Dès Free',
      icon: '🛒',
      title: 'Relance paniers abandonnés',
      desc:
        '3 relances email personnalisées (15 min, 24h, 72h) avec produit exact, réduction conditionnelle et lien checkout.',
      highlight: '+15% de récupération moyenne',
    },
    {
      badge: 'Pro',
      icon: '📞',
      title: 'Agent vocal ElevenLabs',
      desc:
        'Numéro FR dédié, voix naturelle, 200 min incluses/mois. Répond aux appels, qualifie, escalade les cas complexes.',
      highlight: 'Disponible 24h/24 sans standard humain',
    },
    {
      badge: 'Dès Starter',
      icon: '✨',
      title: 'Éditeur ton & règles métier',
      desc:
        'Tu/vous, émojis, signature de marque. Guardrails configurables : escalation >500€, mots-clés sensibles, clients VIP.',
      highlight: 'Configuré en 5 minutes',
    },
  ]

  return (
    <section className="py-24 md:py-32 bg-[#F9F7F1] px-6">
      <div className="max-w-6xl mx-auto">
        <FadeInUp className="text-center mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3.5 text-cta">
            Vos 4 automatisations
          </p>
          <h2
            className="font-normal leading-[1.05] text-[#1A1A1A] mb-4"
            style={{ ...serif, fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.02em' }}
          >
            Tout ce qui consomme votre équipe<br className="hidden md:block" />
            <span className="italic text-[#716D5C]">tourne maintenant tout seul.</span>
          </h2>
          <p className="text-[17px] text-[#5A5A5A] max-w-xl mx-auto leading-[1.5]">
            4 capacités natives Actero, activables selon votre plan. Chacune mesurée en temps réel
            dans votre dashboard.
          </p>
        </FadeInUp>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caps.map((c, i) => (
            <FadeInUp key={i}>
              <div className="bg-white rounded-[20px] p-8 border border-black/[0.05] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-10px_rgba(0,55,37,0.12)] h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-[12px] bg-[#F4F0E6] border border-[#E8DFC9] flex items-center justify-center text-[22px]">
                    {c.icon}
                  </div>
                  <span className="text-[10px] font-bold text-cta bg-[#E8F5EC] px-2 py-0.5 rounded-full uppercase tracking-[0.1em]">
                    {c.badge}
                  </span>
                </div>
                <h3
                  className="text-[21px] font-bold text-[#1A1A1A] mb-2"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {c.title}
                </h3>
                <p className="text-[14.5px] text-[#5A5A5A] leading-[1.55] mb-5 flex-1">{c.desc}</p>
                <div className="flex items-center gap-2 pt-4 border-t border-black/[0.06]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cta flex-shrink-0" />
                  <span className="text-[13px] font-semibold text-[#003725]">{c.highlight}</span>
                </div>
              </div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  )
}
