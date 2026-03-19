import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Plus,
  ChevronRight,
  Sparkles,
  ShoppingCart,
  Home,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { GptBadge } from "../components/ui/GptBadge";
import { MagneticButton } from "../components/ui/magnetic-button";
import { trackEvent } from "../lib/analytics";

const PRICING_CONTENT = {
  ecommerce: {
    badge: "E-commerce",
    badgeIcon: <ShoppingCart className="w-3.5 h-3.5" />,
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    accent: "emerald",
    plans: [
      {
        id: "free",
        name: "Audit System",
        priceLabel: "Gratuit",
        period: "",
        description:
          "Un diagnostic complet de vos opérations e-commerce et des quick wins immédiats.",
        features: [
          "Audit IA de votre site en temps réel",
          "Rapport d'opportunités automatisé",
          "Recommandations stratégiques personnalisées",
          "1 appel de restitution (30 min)",
          "Accès au dashboard de suivi",
        ],
        cta: "Lancer mon audit",
        highlighted: false,
      },
      {
        id: "croissance",
        name: "Croissance Automatisée",
        priceLabel: "Sur devis",
        period: "",
        description:
          "L'infrastructure complète pour automatiser votre SAV et récupérer vos ventes perdues.",
        features: [
          "Tout dans Audit System",
          { text: "Agent IA support client (SAV)", badge: true },
          { text: "Relance paniers abandonnés IA", badge: true },
          "Intégration Shopify + CRM + Klaviyo",
          "Dashboard ROI en temps réel",
          "Account manager dédié",
          "Reporting hebdomadaire",
        ],
        cta: "Réserver un appel",
        highlighted: true,
      },
      {
        id: "scale",
        name: "Scale sur Mesure",
        priceLabel: "Sur devis",
        period: "",
        description:
          "Pour les marques qui scalent au-delà de 500K€/mois et ont besoin d'une infra sur mesure.",
        features: [
          "Tout dans Croissance Automatisée",
          { text: "Agents IA multi-canaux personnalisés", badge: true },
          "Architecture data warehouse",
          "Intégrations API custom",
          "Équipe dédiée (2+ agents IA)",
          "SLA prioritaire",
          "Onboarding white-glove",
        ],
        cta: "Nous contacter",
        highlighted: false,
      },
    ],
    faqs: [
      {
        q: "Comment fonctionne la période d'essai ?",
        a: "L'Audit System est entièrement gratuit et sans engagement. Vous obtenez un diagnostic complet de vos opérations avant de décider de passer à l'étape suivante.",
      },
      {
        q: "Puis-je changer de plan à tout moment ?",
        a: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet au prochain cycle de facturation.",
      },
      {
        q: "Mes données sont-elles sécurisées ?",
        a: "Absolument. Nous utilisons un chiffrement AES-256, des audits SOC 2 réguliers, et vos données ne sont jamais partagées avec des tiers.",
      },
      {
        q: "Combien de temps prend le déploiement ?",
        a: "En moyenne 7 jours ouvrés pour le plan Croissance Automatisée. Le plan Scale sur Mesure nécessite un onboarding plus approfondi de 2-3 semaines.",
      },
      {
        q: "Quelles intégrations supportez-vous ?",
        a: "Nous nous connectons nativement à Shopify, Klaviyo, Gorgias, Make, Zapier, et des dizaines d'autres outils e-commerce.",
      },
    ],
  },
  immobilier: {
    badge: "Immobilier",
    badgeIcon: <Home className="w-3.5 h-3.5" />,
    badgeColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    accent: "violet",
    plans: [
      {
        id: "free",
        name: "Audit Agence",
        priceLabel: "Gratuit",
        period: "",
        description:
          "Un diagnostic complet de votre process de traitement des leads et vos opportunités d'automatisation.",
        features: [
          "Audit de votre flux de leads actuel",
          "Analyse des temps de réponse",
          "Rapport d'opportunités d'automatisation",
          "1 appel de restitution (30 min)",
          "Recommandations personnalisées",
        ],
        cta: "Lancer mon audit",
        highlighted: false,
      },
      {
        id: "croissance",
        name: "Agence Automatisée",
        priceLabel: "Sur devis",
        period: "",
        description:
          "L'infrastructure complète pour qualifier vos leads automatiquement et répondre en moins de 2 minutes.",
        features: [
          "Tout dans Audit Agence",
          { text: "Agent IA qualification de leads", badge: true },
          { text: "Réponse automatique aux demandes de visite", badge: true },
          "Intégration SeLoger + LeBonCoin + portails",
          "Matching acquéreur / bien intelligent",
          "Dashboard performance en temps réel",
          "Account manager dédié",
        ],
        cta: "Réserver un appel",
        highlighted: true,
      },
      {
        id: "scale",
        name: "Réseau sur Mesure",
        priceLabel: "Sur devis",
        period: "",
        description:
          "Pour les réseaux d'agences et les groupes immobiliers qui veulent centraliser l'automatisation.",
        features: [
          "Tout dans Agence Automatisée",
          { text: "Agents IA multi-agences", badge: true },
          "Dashboard réseau centralisé",
          "Intégrations CRM custom",
          "Workflows par typologie de bien",
          "SLA prioritaire",
          "Onboarding white-glove",
        ],
        cta: "Nous contacter",
        highlighted: false,
      },
    ],
    faqs: [
      {
        q: "Comment fonctionne l'audit gratuit ?",
        a: "L'Audit Agence est entièrement gratuit et sans engagement. Nous analysons votre flux de leads actuel et identifions les opportunités d'automatisation.",
      },
      {
        q: "Est-ce compatible avec nos portails immobiliers ?",
        a: "Oui, nous nous connectons nativement à SeLoger, LeBonCoin, BienIci, Logic-Immo et tous les grands portails immobiliers français.",
      },
      {
        q: "Combien de temps pour être opérationnel ?",
        a: "En moyenne 7 jours ouvrés. Nous gérons tout le setup technique, vous n'avez rien à configurer côté agence.",
      },
      {
        q: "Comment fonctionne la qualification des leads ?",
        a: "Notre IA analyse chaque demande entrante, pose les bonnes questions (budget, localisation, délai) et attribue un score de qualification automatiquement.",
      },
      {
        q: "Nos données sont-elles sécurisées ?",
        a: "Absolument. Chiffrement AES-256, hébergement en France, et conformité RGPD stricte. Vos données ne sont jamais partagées.",
      },
    ],
  },
};

export const PricingPage = ({ onNavigate }) => {
  const [activeVertical, setActiveVertical] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const mode = activeVertical === 0 ? "ecommerce" : "immobilier";
  const content = PRICING_CONTENT[mode];

  const switchVertical = (idx) => {
    if (idx === activeVertical) return;
    setIsTransitioning(true);
    setOpenFaq(null);
    setTimeout(() => {
      setActiveVertical(idx);
      setIsTransitioning(false);
    }, 250);
  };

  const accentClasses = {
    emerald: {
      highlight: "border-emerald-500/30",
      glow: "from-emerald-500/20",
      badge: "bg-emerald-500 shadow-emerald-500/25",
      check: "text-emerald-500",
      cta: "bg-white text-black hover:bg-zinc-200",
    },
    violet: {
      highlight: "border-violet-500/30",
      glow: "from-violet-500/20",
      badge: "bg-violet-500 shadow-violet-500/25",
      check: "text-violet-500",
      cta: "bg-white text-black hover:bg-zinc-200",
    },
  };

  const accent = accentClasses[content.accent];

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-white/20">
      <Navbar onNavigate={onNavigate} onAuditOpen={() => onNavigate("/audit")} trackEvent={trackEvent} />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
            >
              Investissez dans votre <span className="text-zinc-400">liberté.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
            >
              Des tarifs clairs, indexés sur la valeur générée et le temps économisé.
            </motion.p>

            {/* Vertical Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-1 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-full p-1"
            >
              {Object.entries(PRICING_CONTENT).map(([key, val], idx) => (
                <button
                  key={key}
                  onClick={() => switchVertical(idx)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    activeVertical === idx
                      ? `${val.badgeColor} border shadow-lg`
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {val.badgeIcon}
                  {val.badge}
                </button>
              ))}
            </motion.div>
          </div>

          {/* Cards */}
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity duration-250 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {content.plans.map((plan, i) => (
              <motion.div
                key={`${mode}-${plan.id}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                className={`group relative p-8 md:p-10 rounded-[32px] border transition-all duration-500 hover:scale-[1.02] ${
                  plan.highlighted
                    ? `bg-white/[0.03] ${accent.highlight}`
                    : "bg-[#0a0a0a] border-white/10 hover:border-white/20"
                }`}
              >
                {plan.highlighted && (
                  <div className={`absolute -inset-px rounded-[32px] bg-gradient-to-b ${accent.glow} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl`} />
                )}

                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className={`flex items-center gap-1.5 ${accent.badge} text-black text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg`}>
                      <Sparkles className="w-3 h-3" />
                      Recommandé
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-3">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.priceLabel}</span>
                    <span className="text-gray-500 text-sm font-medium">{plan.period}</span>
                  </div>
                  <p className="mt-4 text-gray-400 text-sm font-medium leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-4 mb-10">
                  {plan.features.map((feature, idx) => {
                    const isObj = typeof feature === 'object' && feature !== null;
                    const text = isObj ? feature.text : feature;
                    const hasBadge = isObj && feature.badge;
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 ${accent.check} shrink-0 mt-0.5`} />
                        <span className="text-sm font-medium text-gray-300 inline-flex items-center flex-wrap gap-2">
                          {text} {hasBadge && <GptBadge />}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <MagneticButton
                  onClick={() => {
                    trackEvent("Pricing_CTA_Clicked", { plan: plan.id, vertical: mode });
                    onNavigate("/audit");
                  }}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                    plan.highlighted
                      ? accent.cta
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {plan.cta} <ChevronRight className="w-4 h-4" />
                </MagneticButton>
              </motion.div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-32 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Questions fréquentes
            </h2>
            <div className={`space-y-3 transition-opacity duration-250 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              {content.faqs.map((faq, i) => (
                <div
                  key={`${mode}-faq-${i}`}
                  className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-bold">{faq.q}</span>
                    <Plus
                      className={`w-5 h-5 transition-transform duration-300 ${
                        openFaq === i ? "rotate-45" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 overflow-hidden"
                      >
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
