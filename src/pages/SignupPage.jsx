import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { SEO } from "../components/SEO";

export const SignupPage = ({ onNavigate }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [brandName, setBrandName] = useState("");
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Veuillez entrer un email valide.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (!brandName.trim()) {
      setError("Le nom de la boutique est requis.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          brand_name: brandName.trim(),
          shopify_url: shopifyUrl.trim() || undefined,
          plan: "free",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      if (data.message) {
        setSuccessMessage(data.message);
      }

      if (data.redirect) {
        setTimeout(() => {
          onNavigate(data.redirect);
        }, data.message ? 2000 : 0);
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Inscription — Actero"
        description="Créez votre compte Actero et automatisez votre e-commerce avec l'IA."
      />
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar onNavigate={onNavigate} />

        <main className="pt-32 pb-24 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-3">
                Créez votre compte Actero
              </h1>
              <p className="text-[#71717a] text-lg max-w-xl mx-auto">
                Gratuit, sans carte bancaire.
              </p>
            </motion.div>

            {/* Signup form */}
            <motion.div
              id="signup-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#f0f0f0] p-8">
                <h2 className="text-xl font-bold text-[#1a1a1a] mb-1">
                  Créer mon compte
                </h2>
                <p className="text-sm text-[#71717a] mb-6">Aucune carte bancaire requise.</p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@votreboutique.com"
                      className="w-full px-4 py-2.5 border border-[#e4e4e7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5F35]/20 focus:border-[#0F5F35] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      className="w-full px-4 py-2.5 border border-[#e4e4e7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5F35]/20 focus:border-[#0F5F35] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                      Nom de la boutique
                    </label>
                    <input
                      type="text"
                      required
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Ma Boutique"
                      className="w-full px-4 py-2.5 border border-[#e4e4e7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5F35]/20 focus:border-[#0F5F35] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
                      URL Shopify{" "}
                      <span className="text-[#71717a] font-normal">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={shopifyUrl}
                      onChange={(e) => setShopifyUrl(e.target.value)}
                      placeholder="ma-boutique.myshopify.com"
                      className="w-full px-4 py-2.5 border border-[#e4e4e7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5F35]/20 focus:border-[#0F5F35] transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-[#0F5F35] hover:bg-[#0a4a2a] text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Créer mon compte gratuit
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-[13px] text-[#71717a] text-center mt-4">
                  Vous pourrez choisir un plan payant après.
                </p>

                <p className="text-xs text-[#71717a] text-center mt-5">
                  En créant un compte, vous acceptez nos{" "}
                  <button
                    onClick={() => onNavigate("/utilisation")}
                    className="underline underline-offset-2 hover:text-[#1a1a1a]"
                  >
                    conditions d'utilisation
                  </button>{" "}
                  et notre{" "}
                  <button
                    onClick={() => onNavigate("/confidentialite")}
                    className="underline underline-offset-2 hover:text-[#1a1a1a]"
                  >
                    politique de confidentialité
                  </button>
                  .
                </p>

                <div className="text-center mt-4">
                  <p className="text-sm text-[#71717a]">
                    Déjà un compte ?{" "}
                    <button
                      onClick={() => onNavigate("/login")}
                      className="text-[#0F5F35] font-semibold hover:underline"
                    >
                      Se connecter
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        <Footer onNavigate={onNavigate} />
      </div>
    </>
  );
};
