import React from 'react'
import { FadeInUp } from '../ui/scroll-animations'

/**
 * ChatDemoA — « Agent en action » (variation A).
 *
 * Split 2-col :
 * — Gauche : mockup chat Claire M. ↔ agent Actero, bulles arrondies,
 *   cards cream #F9F7F1, avatar initials, tool pills (mono green)
 * — Droite : « Ce qui se passe en coulisses » — 5 étapes numérotées
 *   (classification / appels outils / génération / guardrails / envoi)
 */
export const ChatDemoA = () => {
  const serif = { fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }

  const messages = [
    {
      from: 'client',
      name: 'Claire M.',
      text: "Bonjour, je n'ai toujours pas reçu ma commande #FR-48291 passée lundi. Vous pouvez vérifier ?",
      time: '14:23',
    },
    {
      from: 'agent',
      text: 'Bonjour Claire, je vérifie votre commande #FR-48291 tout de suite…',
      time: '14:23',
    },
    {
      from: 'agent',
      text: "Votre commande a été expédiée mardi à 16h42 via Colissimo (n° 6X42881929F). Elle est actuellement au centre de tri de Villabé et devrait arriver demain avant 13h. Je vous envoie le lien de suivi par email.",
      time: '14:23',
      tools: ['Shopify Orders', 'Colissimo API', 'Resend'],
    },
    {
      from: 'client',
      name: 'Claire M.',
      text: 'Parfait merci ! Dernière question : je peux échanger ma taille si elle ne va pas ?',
      time: '14:24',
    },
    {
      from: 'agent',
      text: "Oui bien sûr ! Vous avez 30 jours à partir de la réception pour échanger gratuitement. Je vous pré-génère un bon d'échange accessible depuis votre espace client — vous pourrez l'utiliser si besoin.",
      time: '14:24',
      tools: ['Politique retour', 'Portal SAV'],
    },
  ]

  const steps = [
    {
      step: '01',
      title: 'Classification intent',
      desc: 'Actero identifie « suivi de commande » avec 94% de confiance.',
      detail: 'confidence ≥ 60%',
    },
    {
      step: '02',
      title: 'Appels outils',
      desc: 'Récupère la commande Shopify, le tracking Colissimo, et la politique retour.',
      detail: '3 tool calls · 1.2s',
    },
    {
      step: '03',
      title: 'Génération avec ton',
      desc: "Applique le ton « chaleureux + tutoiement off » défini dans l'éditeur.",
      detail: '1.8s · GPT-4 tuned',
    },
    {
      step: '04',
      title: 'Guardrails',
      desc: 'Vérifie : pas de promesse hors politique, pas de geste commercial > 50€.',
      detail: 'pass ✓',
    },
    {
      step: '05',
      title: 'Envoi',
      desc: 'Email envoyé via Resend + log dashboard + notification Slack #support.',
      detail: 'total 3.4s',
    },
  ]

  return (
    <section className="py-24 md:py-32 bg-white px-6">
      <div className="max-w-6xl mx-auto">
        <FadeInUp className="text-center mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3.5 text-cta">
            Agent en action
          </p>
          <h2
            className="font-normal leading-[1.05] text-[#1A1A1A] mb-4"
            style={{ ...serif, fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.02em' }}
          >
            Comme votre meilleur employé SAV,<br className="hidden md:block" />
            <span className="italic text-[#716D5C]">mais disponible 24h/24.</span>
          </h2>
          <p className="text-[17px] text-[#5A5A5A] max-w-xl mx-auto leading-[1.5]">
            Traite les questions WISMO, retours et disponibilité produit sur email & chat —
            en quelques secondes, avec le ton de votre marque.
          </p>
        </FadeInUp>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-[1080px] mx-auto">
          {/* LEFT — Chat mockup */}
          <div className="bg-[#F9F7F1] rounded-[20px] p-4 border border-[#E8DFC9] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-3 pb-3.5 border-b border-[#E8DFC9]">
              <div className="w-8 h-8 rounded-full bg-[#003725] text-[#F4F0E6] flex items-center justify-center font-bold text-[13px]">
                BM
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#1A1A1A]">Support BoutiqueMode</div>
                <div className="text-[11px] text-[#716D5C] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  En ligne · répond en ~8s
                </div>
              </div>
              <div className="text-[10px] text-[#9ca3af]">chat.boutiquemode.fr</div>
            </div>

            {/* Messages */}
            <div className="px-2 py-3.5 flex flex-col gap-2.5">
              {messages.map((m, i) =>
                m.from === 'client' ? (
                  <div key={i} className="self-end max-w-[85%]">
                    <div
                      className="bg-[#003725] text-white px-3.5 py-2.5 text-[13.5px] leading-[1.45]"
                      style={{ borderRadius: '16px 16px 4px 16px' }}
                    >
                      {m.text}
                    </div>
                    <div className="text-[10px] text-[#9ca3af] mt-1 text-right">
                      {m.time} · {m.name}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="self-start max-w-[88%]">
                    <div
                      className="bg-white text-[#1A1A1A] px-3.5 py-2.5 text-[13.5px] leading-[1.5] border border-black/[0.05]"
                      style={{ borderRadius: '16px 16px 16px 4px' }}
                    >
                      {m.text}
                    </div>
                    {m.tools && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {m.tools.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-1.5 py-0.5 bg-[#E8F5EC] text-cta rounded font-mono"
                          >
                            → {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-[10px] text-[#9ca3af] mt-1">{m.time} · Actero agent</div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* RIGHT — Behind-the-scenes callouts */}
          <div className="flex flex-col gap-3.5 lg:pt-6">
            <div className="text-[12px] font-bold text-cta uppercase tracking-[0.15em]">
              Ce qui se passe en coulisses
            </div>
            {steps.map((s, i) => (
              <div
                key={i}
                className="flex gap-3.5 p-3.5 bg-white rounded-[10px] border border-black/[0.06]"
              >
                <div className="text-[11px] text-[#9ca3af] font-medium font-mono pt-0.5">
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-[#1A1A1A]">{s.title}</div>
                  <div className="text-[12.5px] text-[#716D5C] mt-0.5 leading-[1.45]">{s.desc}</div>
                  <div className="text-[10px] text-[#9ca3af] mt-1.5 font-mono">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
