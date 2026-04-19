import React from 'react'
import { Shield } from 'lucide-react'

/**
 * PartnersMarquee — défilement horizontal infini des badges partenaires.
 *
 * Sizing strategy: chaque logo a un maxHeight personnalisé parce que leur
 * densité visuelle varie énormément (un texte-logo long comme "Google for
 * Startups" perçu 3× plus gros qu'un pictogramme compact à hauteur égale).
 * Container fixe 160×56px par item = rythme visuel constant.
 *
 * Anim CSS pure 40s linear infinite, pause au hover, items dupliqués 3×
 * dans le DOM pour loop seamless. Respecte prefers-reduced-motion.
 */
const partners = [
  {
    name: 'ElevenLabs Grants',
    src: '/partners/elevenlabs-grants.webp',
    href: 'https://elevenlabs.io/startup-grants',
    maxH: 28, // logo avec texte long (~180px wide) — hauteur réduite
  },
  {
    name: 'Shopify Partner',
    src: '/partners/shopify-partner.png',
    href: 'https://www.shopify.com/partners',
    maxH: 44, // logo compact carré — peut monter en hauteur
  },
  {
    name: 'Google for Startups',
    src: '/partners/google-for-startups.png',
    href: 'https://startup.google.com/',
    maxH: 24, // logo texte LARGE (~280px wide) — très réduit pour équilibrer
  },
  {
    name: 'Auth0 Startup',
    src: '/partners/auth0-startup.jpg',
    href: 'https://auth0.com/startups',
    maxH: 32, // logo pictogramme + texte — moyen
  },
]

export function PartnersMarquee() {
  // Duplique 3× pour loop visuellement infini
  const items = [...partners, ...partners, ...partners]

  return (
    <section
      className="py-10 bg-white border-b border-gray-100"
      aria-label="Nos partenaires et certifications"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af] mb-6">
          Partenaires &amp; certifications
        </p>

        {/* Marquee container */}
        <div className="partners-marquee-wrap">
          <div className="partners-marquee-track">
            {items.map((partner, i) => (
              <a
                key={`${partner.name}-${i}`}
                href={partner.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${partner.name} — voir le programme`}
                className="partners-marquee-item"
              >
                <img
                  src={partner.src}
                  alt={partner.name}
                  loading="lazy"
                  style={{ maxHeight: `${partner.maxH}px` }}
                  className="w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
                />
              </a>
            ))}
          </div>
        </div>

        {/* Trust mini-footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium text-[#9ca3af]">
          <Shield className="w-3.5 h-3.5" />
          <span>Hébergé en UE · Conforme RGPD · SOC 2 en cours</span>
        </div>
      </div>

      {/* Marquee styles scoped */}
      <style>{`
        .partners-marquee-wrap {
          overflow: hidden;
          position: relative;
          /* Fade plus doux sur les bords — 32px au lieu de 64px */
          mask-image: linear-gradient(
            90deg,
            transparent 0,
            #000 32px,
            #000 calc(100% - 32px),
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            90deg,
            transparent 0,
            #000 32px,
            #000 calc(100% - 32px),
            transparent 100%
          );
        }
        .partners-marquee-track {
          display: flex;
          align-items: center;
          width: fit-content;
          animation: partners-scroll 40s linear infinite;
        }
        .partners-marquee-wrap:hover .partners-marquee-track {
          animation-play-state: paused;
        }
        /* Container fixe par item — chaque logo est centré dans 160×56px
           pour un rythme visuel constant, peu importe son aspect ratio */
        .partners-marquee-item {
          flex: 0 0 auto;
          width: 180px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 1rem;
        }
        @keyframes partners-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-100% / 3)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .partners-marquee-track {
            animation: none;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
          }
        }
      `}</style>
    </section>
  )
}
