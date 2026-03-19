import React, { useEffect } from "react";
import {
  Cpu,
  Target,
  Zap,
  ShieldCheck,
  Users,
  BrainCircuit,
  ArrowUpRight,
  ShoppingCart,
  Home,
  TrendingUp,
  Clock,
  Globe,
} from "lucide-react";
import { Logo } from "../components/layout/Logo";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { ButtonColorful } from "../components/ui/button-colorful";
import { trackEvent } from "../lib/analytics";

export const CompanyPage = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      icon: <Cpu className="w-7 h-7" />,
      title: "Systèmes, pas services",
      desc: "Nous construisons des infrastructures autonomes qui fonctionnent 24/7, pas des prestations ponctuelles.",
    },
    {
      icon: <Target className="w-7 h-7" />,
      title: "Performance mesurable",
      desc: "Chaque action est traçable. Chaque automatisation doit prouver son ROI en conditions réelles.",
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: "Vitesse d'exécution",
      desc: "Nous livrons en sprints courts. Votre infra tourne en jours, pas en mois.",
    },
    {
      icon: <ShieldCheck className="w-7 h-7" />,
      title: "Transparence totale",
      desc: "Accès complet à vos données, vos workflows et vos résultats. Zéro boîte noire.",
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: "Partenariat, pas prestation",
      desc: "On s'intègre à votre équipe. Votre croissance est notre croissance.",
    },
    {
      icon: <BrainCircuit className="w-7 h-7" />,
      title: "IA pragmatique",
      desc: "On utilise l'IA là où elle crée de la valeur réelle, pas comme argument marketing.",
    },
  ];

  const verticals = [
    {
      icon: <ShoppingCart className="w-8 h-8" />,
      title: "E-commerce",
      color: "emerald",
      colorClasses: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      tagClasses: "bg-emerald-500/10 text-emerald-400",
      items: [
        "Support client automatisé (SAV IA)",
        "Relance des paniers abandonnés",
        "Dashboard ROI en temps réel",
        "Intégration Shopify native",
      ],
      description: "Nous automatisons le support client et la récupération de ventes perdues pour les boutiques Shopify, avec un ROI visible chaque jour.",
    },
    {
      icon: <Home className="w-8 h-8" />,
      title: "Immobilier",
      color: "violet",
      colorClasses: "bg-violet-500/10 border-violet-500/20 text-violet-400",
      tagClasses: "bg-violet-500/10 text-violet-400",
      items: [
        "Qualification automatique des leads",
        "Réponse instantanée aux demandes",
        "Matching acquéreur / bien",
        "Intégration portails (SeLoger, LeBonCoin)",
      ],
      description: "Nous automatisons la qualification des leads et la réponse aux demandes de visite pour les agences immobilières, avec un temps de réponse < 2 min.",
    },
  ];

  const stats = [
    { icon: <TrendingUp className="w-6 h-6 text-emerald-400" />, value: "2", label: "Verticales servies" },
    { icon: <Clock className="w-6 h-6 text-cyan-400" />, value: "7 jours", label: "Temps de déploiement" },
    { icon: <Globe className="w-6 h-6 text-violet-400" />, value: "24/7", label: "Automatisations actives" },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-white/20">
      <Navbar onNavigate={onNavigate} onAuditOpen={() => onNavigate("/audit")} trackEvent={trackEvent} />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
              L'ingénierie au service de <br />
              votre <span className="text-zinc-500">croissance.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Actero construit les systèmes d'automatisation IA qui permettent aux e-commerçants et aux agences immobilières de scaler sans augmenter leur complexité humaine.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl px-6 py-5 md:px-10 md:py-6 mb-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 ${i < 2 ? 'md:border-r md:border-white/[0.06]' : ''} ${i > 0 ? 'md:pl-8' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg leading-tight">{stat.value}</p>
                    <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vision Section */}
          <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full"></div>
              <img
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000"
                alt="Vision Actero"
                className="rounded-[32px] border border-white/10 shadow-2xl relative z-10 grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6 tracking-tight">Notre Vision</h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Le business de demain ne sera pas géré par des armées d'opérateurs, mais par des infrastructures intelligentes et coordonnées.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Que vous vendiez des produits en ligne ou des biens immobiliers, les tâches répétitives consomment votre temps et freinent votre croissance.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed">
                Notre mission est de démocratiser l'accès à l'automatisation de haut niveau pour permettre à chaque entreprise ambitieuse de se concentrer sur ce qui compte vraiment : son produit et ses clients.
              </p>
            </div>
          </div>

          {/* Verticals Section */}
          <div className="mb-32">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Deux verticales. Une même exigence.
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Des solutions sur mesure pour chaque industrie, avec le même niveau de performance et de transparence.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {verticals.map((v, i) => (
                <div
                  key={i}
                  className="p-8 rounded-[32px] bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-6 ${v.colorClasses}`}>
                    {v.icon}
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-2xl font-bold">{v.title}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${v.tagClasses}`}>
                      Vertical
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    {v.description}
                  </p>
                  <div className="space-y-3">
                    {v.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${v.color === 'emerald' ? 'bg-emerald-400' : 'bg-violet-400'}`} />
                        <span className="text-sm text-gray-300 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Values Grid */}
          <div className="mb-32">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Nos principes fondateurs
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((v, i) => (
                <div
                  key={i}
                  className="p-8 rounded-[32px] bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-zinc-400">
                    {v.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-[#0a0a0a] rounded-[40px] p-12 border border-white/10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/5 rounded-full blur-[100px] -mt-40"></div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 relative z-10">
              Automatisez votre croissance.
            </h2>
            <p className="text-gray-400 text-lg mb-8 relative z-10 max-w-2xl mx-auto">
              Que vous soyez e-commerçant ou agent immobilier, nous avons la solution pour vous faire gagner du temps et de l'argent.
            </p>
            <ButtonColorful onClick={() => onNavigate("/audit")} className="relative z-10">
              Réserver un audit gratuit <ArrowUpRight className="ml-2 w-5 h-5" />
            </ButtonColorful>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
