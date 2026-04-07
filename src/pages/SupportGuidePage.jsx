import React, { useState, useEffect } from "react";
import {
  Search, BookOpen, Zap, ShoppingBag, Plug, Shield, BarChart3,
  ArrowRight, Mail, MessageCircle, Clock, ChevronDown, ChevronUp,
  Building2, Headphones, RefreshCw, FileText, UserCheck, Users,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { SEO } from "../components/SEO";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  {
    id: 'getting-started',
    icon: Zap,
    title: 'Premiers pas',
    description: 'Tout pour demarrer avec Actero',
    articles: [
      { q: "Comment fonctionne Actero ?", a: "Actero deploie des agents IA autonomes qui automatisent les taches repetitives de votre entreprise. Pour le e-commerce : support client, relance paniers abandonnes, monitoring. Pour l'immobilier : prise de rendez-vous, collecte de documents, relance prospects. Vous n'avez rien a configurer — notre equipe s'occupe de tout." },
      { q: "Combien de temps pour etre operationnel ?", a: "Le deploiement prend 7 jours ouvres. Jour 1-2 : audit de votre business. Jour 3-5 : configuration des agents IA. Jour 6-7 : tests et mise en production. Vous recevez un acces dashboard des le premier jour." },
      { q: "Dois-je avoir des competences techniques ?", a: "Non. Actero est 100% done-for-you. Vous n'avez aucune action technique a faire. Notre equipe configure, deploie et maintient tout. Vous validez les resultats sur votre dashboard." },
      { q: "Comment acceder a mon dashboard ?", a: "Apres le paiement, vous recevez un email d'invitation pour creer votre mot de passe. Connectez-vous ensuite sur actero.fr/login. Votre dashboard affiche vos metriques en temps reel : temps economise, ROI, tickets traites." },
    ],
  },
  {
    id: 'integrations',
    icon: Plug,
    title: 'Integrations',
    description: 'Connecter vos outils',
    articles: [
      { q: "Comment connecter Shopify ?", a: "Dans votre dashboard, allez dans l'onglet 'Integrations'. Cliquez 'Connecter' sur Shopify, entrez votre domaine myshopify.com, et autorisez l'acces. L'installation se fait en un clic via OAuth." },
      { q: "Quels outils sont supportes ?", a: "Actuellement : Shopify (OAuth), Gorgias (OAuth), Slack (OAuth). A venir : Zendesk, Klaviyo, Freshdesk, Trustpilot, Google Sheets, Calendly. Pour l'immobilier : Apimo, Hektor, Netty." },
      { q: "Comment connecter Slack ?", a: "Dans l'onglet Integrations, cliquez 'Connecter' sur Slack. Vous serez redirige vers Slack pour autoriser l'acces. Choisissez le channel ou vous souhaitez recevoir les notifications. C'est fait !" },
      { q: "Une integration ne fonctionne plus, que faire ?", a: "Dans l'onglet Integrations, cliquez 'Tester' sur l'integration concernee. Si le test echoue, cliquez 'Reconnecter' pour relancer le flux d'autorisation. Si le probleme persiste, contactez notre support." },
    ],
  },
  {
    id: 'ecommerce',
    icon: ShoppingBag,
    title: 'E-commerce',
    description: 'Support IA et relance paniers',
    articles: [
      { q: "Comment l'IA repond-elle aux tickets ?", a: "L'agent IA analyse chaque ticket entrant (suivi commande, retour, remboursement), identifie le type de demande, et repond en quelques secondes. Il utilise vos donnees Shopify (commandes, client, tracking) pour personnaliser chaque reponse." },
      { q: "Que se passe-t-il si l'IA ne peut pas repondre ?", a: "Le ticket est automatiquement escalade. Vous recevez une notification dans votre dashboard (onglet 'Escalades'). Vous pouvez repondre directement depuis le dashboard, et l'IA apprendra de votre reponse pour les prochaines fois." },
      { q: "Comment fonctionnent les relances panier ?", a: "L'agent detecte les paniers abandonnes sur votre Shopify et envoie des sequences de relance personnalisees par email. Le message est adapte au profil du client et au contenu du panier." },
      { q: "Comment voir mon ROI ?", a: "Votre dashboard affiche en temps reel : heures economisees, euros economises, tickets resolus, paniers recuperes. Le calcul utilise votre cout horaire et temps moyen par ticket (configurables dans votre profil)." },
    ],
  },
  {
    id: 'immobilier',
    icon: Building2,
    title: 'Immobilier',
    description: 'Agents IA pour agences',
    articles: [
      { q: "Comment fonctionne l'agent prise de RDV ?", a: "L'agent qualifie chaque prospect (budget, zone, type de bien), propose des creneaux disponibles et confirme les rendez-vous automatiquement. Il se synchronise avec votre agenda." },
      { q: "Comment fonctionne la collecte de documents ?", a: "L'agent identifie les documents requis selon le type de transaction (vente, achat, location), envoie des demandes personnalisees et relance automatiquement jusqu'a reception complete." },
      { q: "Comment fonctionnent les relances prospects ?", a: "L'agent detecte les prospects inactifs (7, 14, 30 jours sans interaction) et envoie des relances progressives par email et SMS, adaptees au profil et a l'historique." },
    ],
  },
  {
    id: 'billing',
    icon: Shield,
    title: 'Facturation',
    description: 'Paiement et abonnement',
    articles: [
      { q: "Comment fonctionne la facturation ?", a: "Actero fonctionne sur devis. Apres l'audit gratuit, nous vous proposons un tarif adapte a votre volume et vos besoins. Le paiement est mensuel via Stripe (carte bancaire)." },
      { q: "Puis-je annuler mon abonnement ?", a: "Oui, vous pouvez annuler a tout moment depuis votre profil (Gerer mon abonnement). L'annulation prend effet a la fin de la periode en cours." },
      { q: "Comment obtenir une facture ?", a: "Toutes vos factures sont disponibles dans votre portail Stripe, accessible depuis votre profil client (bouton 'Gerer mon abonnement')." },
    ],
  },
  {
    id: 'dashboard',
    icon: BarChart3,
    title: 'Dashboard',
    description: 'Comprendre vos metriques',
    articles: [
      { q: "Que signifie 'Temps economise' ?", a: "C'est le nombre d'heures que vos agents IA ont economise en traitant des taches automatiquement. Calcul : nombre de tickets traites x temps moyen par ticket." },
      { q: "Que signifie 'ROI genere' ?", a: "C'est la valeur monetaire du temps economise. Calcul : heures economisees x votre cout horaire. Vous pouvez configurer ces parametres dans votre profil." },
      { q: "Comment fonctionne le diagnostic systeme ?", a: "Dans votre vue d'ensemble, cliquez 'Lancer le diagnostic'. Le systeme verifie : connexion base de donnees, session, integrations, Shopify, configuration ROI, et activite recente. Chaque check affiche OK, Attention ou Erreur." },
      { q: "Comment fonctionne la base de connaissances ?", a: "Quand vous repondez a un ticket escalade, vous pouvez cocher 'Ajouter a ma base de connaissances'. L'IA utilisera cette reponse pour traiter les futures demandes similaires automatiquement." },
    ],
  },
];

export const SupportGuidePage = ({ onNavigate }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [search, setSearch] = useState('');
  const [openCategory, setOpenCategory] = useState('getting-started');
  const [openArticle, setOpenArticle] = useState(0);

  const filteredCategories = search.trim().length >= 2
    ? CATEGORIES.map(cat => ({
        ...cat,
        articles: cat.articles.filter(a =>
          `${a.q} ${a.a}`.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.articles.length > 0)
    : CATEGORIES;

  return (
    <>
      <SEO
        title="Centre d'aide — Actero"
        description="Guides, tutoriels et FAQ pour utiliser Actero. Integrations, dashboard, facturation, agents IA."
        canonical="/support"
      />
      <div className="relative min-h-screen bg-white font-sans text-[#262626]">
        <Navbar onNavigate={onNavigate} onAuditOpen={() => onNavigate("/audit")} />

        <main className="pt-28 md:pt-36 pb-24 px-6">
          <div className="max-w-4xl mx-auto">

            {/* Hero */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F9F7F1] border border-gray-200 text-[#716D5C] text-xs font-bold uppercase tracking-widest mb-6">
                <BookOpen className="w-3.5 h-3.5" />
                Centre d'aide
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-normal text-[#262626] mb-6 leading-[1.1]"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
              >
                Comment pouvons-nous vous aider ?
              </h1>

              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#716D5C]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un article, une question..."
                  className="w-full pl-12 pr-4 py-4 bg-[#F9F7F1] border border-gray-200 rounded-2xl text-[15px] text-[#262626] placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
            </div>

            {/* Category grid (if no search) */}
            {!search.trim() && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = openCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setOpenCategory(cat.id); setOpenArticle(0); }}
                      className={`p-5 rounded-2xl border text-left transition-all ${
                        isActive
                          ? 'bg-[#003725] text-white border-[#003725]'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-3 ${isActive ? 'text-white' : 'text-[#003725]'}`} />
                      <h3 className="font-bold text-sm mb-1">{cat.title}</h3>
                      <p className={`text-xs ${isActive ? 'text-white/70' : 'text-[#716D5C]'}`}>
                        {cat.articles.length} articles
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Articles */}
            <div className="space-y-3">
              {(search.trim() ? filteredCategories : CATEGORIES.filter(c => c.id === openCategory)).map(cat => (
                <div key={cat.id}>
                  {search.trim() && (
                    <h2 className="text-lg font-bold text-[#262626] mb-3 flex items-center gap-2">
                      <cat.icon className="w-4 h-4 text-[#003725]" />
                      {cat.title}
                    </h2>
                  )}
                  <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
                    {cat.articles.map((article, i) => {
                      const isOpen = search.trim() ? true : openArticle === i && openCategory === cat.id;
                      return (
                        <div key={i}>
                          <button
                            onClick={() => {
                              if (!search.trim()) {
                                setOpenArticle(isOpen ? null : i);
                                setOpenCategory(cat.id);
                              }
                            }}
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-[#F9F7F1] transition-colors"
                          >
                            <span className="font-semibold text-[15px] text-[#262626] pr-4">{article.q}</span>
                            {!search.trim() && (
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                isOpen ? 'bg-[#003725] text-white' : 'bg-[#F9F7F1] text-[#716D5C]'
                              }`}>
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            )}
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 text-[#716D5C] text-[15px] leading-relaxed">
                                  {article.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {search.trim() && filteredCategories.length === 0 && (
                <div className="text-center py-16 text-[#716D5C]">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun article trouve pour "{search}"</p>
                </div>
              )}
            </div>

            {/* Contact CTA */}
            <div className="mt-20 text-center p-10 bg-[#F9F7F1] rounded-3xl border border-gray-200">
              <h2 className="text-2xl font-bold text-[#262626] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Vous n'avez pas trouve votre reponse ?
              </h2>
              <p className="text-[#716D5C] mb-6">Notre equipe repond en moins de 24h.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="mailto:contact@actero.fr"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F5F35] text-white rounded-full font-semibold hover:bg-[#003725] transition-colors"
                >
                  <Mail className="w-4 h-4" /> contact@actero.fr
                </a>
                <button
                  onClick={() => onNavigate('/audit')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-[#003725] font-semibold underline underline-offset-4 decoration-[#003725]/40 hover:decoration-[#003725] transition-colors"
                >
                  Reserver un audit gratuit <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>

        <Footer onNavigate={onNavigate} />
      </div>
    </>
  );
};
