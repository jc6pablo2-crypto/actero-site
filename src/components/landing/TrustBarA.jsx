import React from 'react'

/**
 * TrustBarA — logo marquee "Refined Notion" (variation A).
 *
 * Remplace les badges partenaires par un défilement infini des logos
 * partenaires/intégrations rendus en Instrument Serif italic, 22px,
 * couleur muted #9ca3af. Gap 56px, animation 40s linear infinite.
 *
 * Variation A design : très calme, typographique, éditorial.
 */
export const TrustBarA = () => {
  const logos = [
    'Shopify',
    'ElevenLabs',
    'Google for Startups',
    'Stripe',
    'Auth0',
    'Pennylane',
    'Slack',
    'Zendesk',
    'Gorgias',
    'Resend',
  ]

  const serif = { fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }

  return (
    <section className="py-12 px-6 bg-white border-y border-black/[0.05]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center text-xs text-[#9ca3af] font-medium mb-6 uppercase tracking-[0.15em]">
          Ils font confiance à Actero · Partenaires & intégrations natives
        </div>
        <div className="overflow-hidden relative">
          <div className="animate-marquee inline-flex gap-14 whitespace-nowrap">
            {[...logos, ...logos, ...logos].map((l, i) => (
              <span
                key={i}
                className="text-[22px] italic text-[#9ca3af]"
                style={serif}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tb-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: tb-marquee 40s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee { animation: none; }
        }
      `}</style>
    </section>
  )
}
