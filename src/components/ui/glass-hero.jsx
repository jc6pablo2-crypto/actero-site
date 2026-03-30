import React from 'react';
import { ArrowRight, Shield, Clock, TrendingUp, UserPlus, ShoppingBag, Building2, Headphones, RefreshCw, BarChart3, Zap } from 'lucide-react';
import { FadeInUp, ScaleIn } from './scroll-animations';
import { ButtonColorful } from './button-colorful';

export const GlassHero = ({ onNavigate, vertical = 'ecommerce', onVerticalChange }) => {

    const heroContent = {
        ecommerce: {
            badge: { icon: '/shopify-partners.svg', label: 'Partenaire Shopify officiel' },
            headlineMain: "L'automatisation IA",
            headlineSub: "qui fait croître votre e-commerce",
            subtitle: "Actero automatise le support client et relance vos paniers abandonnés pour les marques Shopify qui veulent scaler sans multiplier les coûts.",
            subtitleSecond: "Résultats mesurables dès le premier mois.",
            cards: [
                { title: "Support IA 24/7", desc: "80% des tickets résolus", bg: "bg-[#003725]", text: "text-white", icon: <Headphones className="w-6 h-6" /> },
                { title: "Relance paniers", desc: "+15% de récupération", bg: "bg-[#F9F7F1]", text: "text-[#003725]", icon: <RefreshCw className="w-6 h-6" /> },
                { title: "Monitoring IA", desc: "Alertes temps réel", bg: "bg-[#F9F7F1]", text: "text-[#003725]", icon: <BarChart3 className="w-6 h-6" /> },
                { title: "Automatisations", desc: "Tout connecté", bg: "bg-[#003725]", text: "text-white", icon: <Zap className="w-6 h-6" /> },
            ],
        },
        immobilier: {
            badge: { icon: null, label: 'Spécialiste IA pour agences immobilières' },
            headlineMain: "3 agents IA pour",
            headlineSub: "transformer votre agence",
            subtitle: "Prise de rendez-vous, collecte de documents, relance des prospects inactifs — nos agents IA gèrent vos tâches chronophages 24h/24.",
            subtitleSecond: "Vous vous concentrez sur la vente.",
            cards: [
                { title: "Agent RDV", desc: "+30% confirmés", bg: "bg-[#003725]", text: "text-white", icon: <Clock className="w-6 h-6" /> },
                { title: "Agent Documents", desc: "-50% admin", bg: "bg-[#F9F7F1]", text: "text-[#003725]", icon: <Shield className="w-6 h-6" /> },
                { title: "Agent Relance", desc: "+10% réactivés", bg: "bg-[#F9F7F1]", text: "text-[#003725]", icon: <TrendingUp className="w-6 h-6" /> },
                { title: "Dashboard live", desc: "Suivi temps réel", bg: "bg-[#003725]", text: "text-white", icon: <BarChart3 className="w-6 h-6" /> },
            ],
        },
    };

    const content = heroContent[vertical];
    const isEcommerce = vertical === 'ecommerce';

    return (
        <div className="relative bg-white pt-28 md:pt-36 pb-16 md:pb-24 px-6">
            <div className="max-w-6xl mx-auto">

                {/* Vertical Toggle — centered above */}
                <FadeInUp className="flex justify-center mb-12">
                    <div className="relative inline-flex items-center bg-[#F9F7F1] rounded-full p-1 gap-1">
                        <div
                            className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out bg-white shadow-sm ${
                                isEcommerce
                                    ? 'left-1 right-[calc(50%+0.25rem)]'
                                    : 'left-[calc(50%+0.25rem)] right-1'
                            }`}
                        />
                        {[
                            { key: 'ecommerce', label: 'E-commerce', icon: <ShoppingBag className="w-4 h-4" /> },
                            { key: 'immobilier', label: 'Immobilier', icon: <Building2 className="w-4 h-4" /> },
                        ].map((v) => (
                            <button
                                key={v.key}
                                onClick={() => onVerticalChange?.(v.key)}
                                className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                                    vertical === v.key ? 'text-[#262626]' : 'text-[#716D5C] hover:text-[#262626]'
                                }`}
                            >
                                {v.icon}
                                {v.label}
                            </button>
                        ))}
                    </div>
                </FadeInUp>

                {/* 2-column layout: text left, cards right */}
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

                    {/* LEFT — Text content */}
                    <div className="pt-4">
                        {/* Badge */}
                        <FadeInUp className="mb-6">
                            <div className="inline-flex items-center gap-2 border px-4 py-2 rounded-full text-sm font-medium bg-[#F9F7F1] border-gray-200 text-[#716D5C]">
                                {content.badge.icon && (
                                    <>
                                        <img src={content.badge.icon} alt="" className="h-4 w-auto opacity-60" />
                                        <span className="w-px h-4 bg-gray-200"></span>
                                    </>
                                )}
                                <span>🇫🇷 {content.badge.label}</span>
                            </div>
                        </FadeInUp>

                        {/* Headline — left-aligned, serif, massive */}
                        <FadeInUp delay={0.05} className="mb-6">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#262626] leading-[1.1]" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                                {content.headlineMain}
                                <br />
                                <span className="text-[#716D5C]">{content.headlineSub}</span>
                            </h1>
                        </FadeInUp>

                        {/* Subtitle */}
                        <FadeInUp delay={0.1} className="mb-4">
                            <p className="text-base md:text-lg text-[#716D5C] font-normal leading-relaxed max-w-lg">
                                {content.subtitle}
                            </p>
                        </FadeInUp>
                        <FadeInUp delay={0.12} className="mb-8">
                            <p className="text-base md:text-lg text-[#262626] font-medium">
                                {content.subtitleSecond}
                            </p>
                        </FadeInUp>

                        {/* CTAs — Shine style */}
                        <FadeInUp delay={0.15} className="flex flex-wrap items-center gap-4 mb-8">
                            <ButtonColorful onClick={() => onNavigate('/audit')}>
                                {vertical === 'immobilier' ? 'Demander une démo' : 'Réserver un audit gratuit'} <ArrowRight className="w-4 h-4" />
                            </ButtonColorful>
                            <button
                                onClick={() => {
                                    const el = document.getElementById('comment-ca-marche');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="text-sm font-semibold text-[#003725] underline underline-offset-4 decoration-[#003725]/40 hover:decoration-[#003725] transition-colors"
                            >
                                Voir comment ça marche
                            </button>
                        </FadeInUp>
                    </div>

                    {/* RIGHT — Bento card grid (Shine style) */}
                    <FadeInUp delay={0.2}>
                        <div className="grid grid-cols-2 gap-3">
                            {content.cards.map((card, i) => (
                                <div
                                    key={i}
                                    className={`${card.bg} ${card.text} rounded-2xl p-6 flex flex-col justify-between min-h-[180px] md:min-h-[200px] transition-transform hover:scale-[1.02] duration-300`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-auto ${
                                        card.bg === 'bg-[#003725]' ? 'bg-white/15' : 'bg-[#003725]/10'
                                    }`}>
                                        {card.icon}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg leading-tight mb-1">{card.title}</p>
                                        <p className={`text-sm font-medium ${card.bg === 'bg-[#003725]' ? 'text-white/70' : 'text-[#716D5C]'}`}>{card.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FadeInUp>
                </div>
            </div>
        </div>
    );
};
