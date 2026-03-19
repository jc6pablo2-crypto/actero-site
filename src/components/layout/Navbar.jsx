import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Menu,
  X,
  Bot,
  Zap,
  Sparkles,
  ShoppingCart,
  Home,
  ArrowRight
} from 'lucide-react'
import { Logo } from './Logo'
import { ButtonColorful } from '../ui/button-colorful'

export const Navbar = ({ onNavigate, onAuditOpen, trackEvent }) => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl z-50">
      <nav className="w-full bg-[#0d0d0d]/70 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-full transition-all duration-300">
        <div className="px-6 md:px-8 h-14 md:h-[60px] flex justify-between items-center">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onNavigate("/")}
          >
            <Logo
              light={true}
              className="w-7 h-7 text-white group-hover:scale-105 transition-transform"
            />
            <span className="font-bold text-xl tracking-tight text-white">
              Actero
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {/* Solutions Mega Menu */}
            <div
              className="relative"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <div className="flex items-center gap-1 cursor-pointer py-4 text-sm font-semibold text-gray-400 hover:text-white transition-colors group">
                Solutions
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${isMegaMenuOpen ? "rotate-180 text-white" : ""}`}
                />
              </div>

              <AnimatePresence>
                {isMegaMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[720px] bg-[#030303] border border-white/10 rounded-[28px] shadow-2xl p-6"
                  >
                    {/* Verticals Row */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div
                        onClick={() => {
                          setIsMegaMenuOpen(false);
                          onNavigate("/");
                        }}
                        className="flex items-start gap-4 p-5 rounded-[20px] bg-[#0d0d0d] border border-white/[0.08] hover:bg-[#141414] hover:border-emerald-500/30 transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-base mb-1">E-commerce</h3>
                          <p className="text-[13px] text-gray-500 leading-relaxed">
                            SAV automatisé, paniers récupérés, dashboard ROI pour Shopify.
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setIsMegaMenuOpen(false);
                          onNavigate("/");
                        }}
                        className="flex items-start gap-4 p-5 rounded-[20px] bg-[#0d0d0d] border border-white/[0.08] hover:bg-[#141414] hover:border-violet-500/30 transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 shrink-0 group-hover:scale-105 transition-transform">
                          <Home className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-base mb-1">Immobilier</h3>
                          <p className="text-[13px] text-gray-500 leading-relaxed">
                            Qualification leads, réponse instantanée, matching acquéreur/bien.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Capabilities Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div
                        onClick={() => {
                          setIsMegaMenuOpen(false);
                          scrollToId("comment-ca-marche");
                        }}
                        className="flex flex-col p-5 rounded-[20px] bg-[#0d0d0d] border border-white/[0.08] hover:bg-[#141414] hover:border-white/20 transition-all cursor-pointer group"
                      >
                        <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                          <Bot className="w-5 h-5" />
                        </div>
                        <h3 className="text-white font-semibold text-[15px] mb-1">Agents IA</h3>
                        <p className="text-[13px] text-gray-500 leading-relaxed">
                          Employés virtuels 24/7 pour votre business.
                        </p>
                      </div>

                      <div
                        onClick={() => {
                          setIsMegaMenuOpen(false);
                          scrollToId("comment-ca-marche");
                        }}
                        className="flex flex-col p-5 rounded-[20px] bg-[#0d0d0d] border border-white/[0.08] hover:bg-[#141414] hover:border-white/20 transition-all cursor-pointer group"
                      >
                        <div className="w-11 h-11 bg-[#141416] rounded-xl flex items-center justify-center mb-4 text-amber-300 shadow-md border border-white/5 group-hover:scale-105 transition-transform">
                          <Zap className="w-5 h-5 fill-amber-300" />
                        </div>
                        <h3 className="text-white font-semibold text-[15px] mb-1">Automatisations</h3>
                        <p className="text-[13px] text-gray-500 leading-relaxed">
                          Connectez vos outils et vos workflows.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setIsMegaMenuOpen(false);
                          onAuditOpen?.();
                        }}
                        className="flex flex-col p-5 rounded-[20px] bg-[#0d0d0d] border border-white/[0.08] hover:bg-[#141414] hover:border-white/20 transition-all cursor-pointer group text-left"
                      >
                        <div className="w-11 h-11 bg-[#1e1313] rounded-xl flex items-center justify-center mb-4 text-orange-400 shadow-md border border-orange-500/10 group-hover:scale-105 transition-transform">
                          <Sparkles className="w-5 h-5 fill-orange-400" />
                        </div>
                        <h3 className="text-white font-semibold text-[15px] mb-1">Audit gratuit</h3>
                        <p className="text-[13px] text-gray-500 leading-relaxed">
                          Analyse de votre business en temps réel.
                        </p>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => onNavigate("/tarifs")}
              className="text-[13px] font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Tarifs
            </button>
            <button
              onClick={() => onNavigate("/entreprise")}
              className="text-[13px] font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Entreprise
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("/login")}
              className="hidden lg:block text-[13px] font-semibold text-gray-400 hover:text-white transition-colors px-1"
            >
              Connexion
            </button>
            <div className="hidden sm:block scale-90 origin-right">
              <ButtonColorful
                onClick={() => {
                  trackEvent?.("Header_CTA_Clicked", { location: "navbar" });
                  onAuditOpen?.();
                }}
              >
                Demander un audit
              </ButtonColorful>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-3 bg-[#0d0d0d]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl p-6 space-y-1"
          >
            {/* Mobile Vertical Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => { setIsMobileMenuOpen(false); onNavigate("/"); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all"
              >
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">E-commerce</span>
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); onNavigate("/"); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 hover:bg-violet-500/10 transition-all"
              >
                <Home className="w-5 h-5 text-violet-400" />
                <span className="text-xs font-bold text-violet-400">Immobilier</span>
              </button>
            </div>

            {[
              {
                label: "Solutions",
                action: () => {
                  setIsMobileMenuOpen(false);
                  scrollToId("comment-ca-marche");
                },
              },
              {
                label: "Tarifs",
                action: () => {
                  setIsMobileMenuOpen(false);
                  onNavigate("/tarifs");
                },
              },
              {
                label: "Entreprise",
                action: () => {
                  setIsMobileMenuOpen(false);
                  onNavigate("/entreprise");
                },
              },
              {
                label: "FAQ",
                action: () => {
                  setIsMobileMenuOpen(false);
                  onNavigate("/faq");
                },
              },
              {
                label: "Simulateur",
                action: () => {
                  setIsMobileMenuOpen(false);
                  onNavigate("/demo");
                },
              },
              {
                label: "Connexion",
                action: () => {
                  setIsMobileMenuOpen(false);
                  onNavigate("/login");
                },
              },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className="w-full text-left p-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
