import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, Play, UserX, Database, TrendingDown, ArrowRight, Activity,
  Clock, DollarSign, CheckCircle2, Cpu, BrainCircuit, Server, CreditCard,
  Plus, Minus, Menu, X, LayoutDashboard, Users, Settings, LogOut, FileText,
  LifeBuoy, Search, Filter, MoreVertical, Lock, Mail, AlertCircle, TerminalSquare,
  ArrowUpRight, Download, Sparkles, Bot, Zap, ShoppingCart, MessageSquare,
  Repeat, Target, ShieldCheck, ZapOff, ArrowRightCircle
} from 'lucide-react';

// --- Configuration Supabase ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sécurité & Configuration
const isSupabaseConfigured = SUPABASE_URL && SUPABASE_URL.includes('supabase.co');
let supabase = null;

// --- API Gemini ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log("GEMINI KEY length:", apiKey?.length, "starts:", apiKey?.slice(0, 4));

// --- Utilitaires ---
function useInView(options) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsInView(true); observer.unobserve(entry.target); }
    }, options);
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, [options]);
  return [ref, isInView];
}

const AnimatedNumber = ({ end, suffix = "", prefix = "", duration = 2000, decimals = 0 }) => {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(end * easeProgress);
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(end);
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);
  return <span ref={ref}>{prefix}{count.toFixed(decimals)}{suffix}</span>;
};

async function fetchWithRetry(url, options, retries = 5) {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
}

const Logo = ({ className = "w-8 h-8", light = false }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${light ? 'text-white' : 'text-zinc-900'}`}>
    <path d="M16 2L2 30H10L16 18L22 30H30L16 2Z" fill="currentColor" />
    <circle cx="16" cy="23" r="3" className="fill-emerald-500" />
  </svg>
);

// ==========================================
// 1. PAGE DE CONNEXION (LOGIN)
// ==========================================
const LoginPage = ({ onNavigate, onLogin }) => {
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Erreur : Base de données non connectée.");
      }

      // ✅ MOT DE PASSE OUBLIÉ
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/#type=recovery`,
        });
        if (error) throw error;

        setSuccess("✅ Lien envoyé. Vérifie ta boîte mail.");
        return;
      }

      // ✅ CONNEXION NORMALE
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const role = profile?.role || 'client';
      onLogin(role);
      onNavigate(role === 'admin' ? '/admin' : '/client');

    } catch (err) {
      setError(isForgot
        ? "Erreur lors de l'envoi du lien. Vérifie l'email."
        : "Identifiants incorrects ou erreur de connexion."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div onClick={() => onNavigate('/')} className="cursor-pointer flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <Logo className="w-10 h-10 text-zinc-900" />
          <span className="text-zinc-900 font-bold text-2xl tracking-tight">Actero</span>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900">
          {isForgot ? 'Réinitialisation' : 'Connexion à votre espace'}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-500 font-medium">
          {isForgot ? 'Entrez votre adresse email.' : 'Gérez vos infrastructures autonomes.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200 sm:rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" />{error}</div>}
            {success && <div className="p-4 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-xl border border-emerald-100 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 flex-shrink-0" />{success}</div>}

            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-2">Email professionnel</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-[#FAFAFA] border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm outline-none transition-all"
                  placeholder="prenom@entreprise.com" />
              </div>
            </div>

            {!isForgot && (
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-2">Mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-[#FAFAFA] border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm outline-none transition-all"
                    placeholder="••••••••••••" />
                </div>
                <div className="flex items-center justify-end mt-3">
                  <button type="button" onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }} className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors">
                    Mot de passe oublié ?
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-50 transition-colors">
              {loading ? (
                <span className="flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> {isForgot ? 'Envoi...' : 'Connexion en cours...'}</span>
              ) : (isForgot ? 'Envoyer le lien' : 'Accéder au dashboard')}
            </button>

            {isForgot && (
              <button type="button" onClick={() => { setIsForgot(false); setError(''); setSuccess(''); }} className="w-full text-center text-sm text-zinc-500 hover:text-zinc-900 font-medium mt-4">
                Retour à la connexion
              </button>
            )}
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-400 max-w-xs mx-auto font-medium leading-relaxed">
          Cet accès est strictement réservé aux clients Actero. Vos identifiants vous ont été fournis lors de la livraison de votre infrastructure.
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. DASHBOARD ADMIN
// ==========================================
const AdminDashboard = ({ onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ✅ DATA FROM SUPABASE (instead of mocks)
  const [clients, setClients] = useState([]);
  const [requestsData, setRequestsData] = useState([]);
  const [leads, setLeads] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    const load = async () => {
      setDataLoading(true);
      setDataError("");

      try {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error("Supabase non configuré.");
        }

        // 1) Clients
        const { data: clientsRows, error: clientsErr } = await supabase
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false });

        if (clientsErr) throw clientsErr;
        setClients(clientsRows || []);

        // 2) Requests
        const { data: requestsRows, error: requestsErr } = await supabase
          .from("requests")
          .select("id, client_id, title, description, stack, priority, status, created_at, clients(brand_name)")
          .order("created_at", { ascending: false });

        if (requestsErr) throw requestsErr;
        setRequestsData(requestsRows || []);

        // 3) Leads
        const { data: leadsRows, error: leadsErr } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });

        if (leadsErr) throw leadsErr;
        setLeads(leadsRows || []);
      } catch (e) {
        setDataError(e?.message || "Erreur de chargement des données.");
      } finally {
        setDataLoading(false);
      }
    };

    load();
  }, []);

  const handleAddClient = async () => {
    const brandName = prompt("Nom de l'entreprise du nouveau client :");
    if (!brandName || !brandName.trim()) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error("Utilisateur non authentifié.");

      const { data, error } = await supabase
        .from('clients')
        .insert([{ brand_name: brandName.trim(), owner_user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [data, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout du client : " + err.message);
    }
  };

  const Sidebar = () => (
    <div className="w-full md:w-64 bg-white border-r border-zinc-200 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6 text-zinc-900" />
          <span className="font-bold text-lg text-zinc-900">Actero Admin</span>
        </div>
        <button className="md:hidden text-zinc-500" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <button onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'overview' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}><LayoutDashboard className="w-4 h-4" /> Vue Globale</button>
        <button onClick={() => { setActiveTab('clients'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'clients' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}><Users className="w-4 h-4" /> Clients</button>
        <button onClick={() => { setActiveTab('automations'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'automations' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}><TerminalSquare className="w-4 h-4" /> Infrastructures</button>
        <button onClick={() => { setActiveTab('requests'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'requests' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}>
          <div className="flex items-center gap-3"><Sparkles className="w-4 h-4" /> Demandes IA</div>
          {requestsData.length > 0 && <span className="bg-emerald-100 text-emerald-700 py-0.5 px-2 rounded-full text-xs font-bold">{requestsData.length}</span>}
        </button>
        <button onClick={() => { setActiveTab('leads'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'leads' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}>
          <div className="flex items-center gap-3"><Users className="w-4 h-4" /> Leads AI</div>
          {leads.length > 0 && <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-bold">{leads.length}</span>}
        </button>
      </div>
      <div className="p-4 border-t border-zinc-200">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"><LogOut className="w-4 h-4" /> Déconnexion</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6 text-zinc-900" />
          <span className="font-bold text-lg text-zinc-900">Actero Admin</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-600"><Menu className="w-6 h-6" /></button>
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Sidebar Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="hidden md:flex h-16 bg-white border-b border-zinc-200 items-center px-8">
          <h1 className="text-xl font-bold text-zinc-900 capitalize">{activeTab.replace('-', ' ')}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">

          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-red-900">Alertes Systèmes</h3>
                  <p className="text-sm text-red-700 mt-1 font-medium">Client "DataSync" : 0 exécution depuis 48h. Vérification recommandée.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Heures Économisées</p>
                  <p className="text-4xl font-bold text-zinc-900 font-mono tracking-tighter">4,205 <span className="text-2xl text-zinc-400">h</span></p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Valeur Générée (Globale)</p>
                  <p className="text-4xl font-bold text-zinc-900 font-mono tracking-tighter">185,400 <span className="text-2xl text-zinc-400">€</span></p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                  <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Taux de succès global</p>
                  <p className="text-4xl font-bold text-emerald-600 font-mono tracking-tighter">99.8 <span className="text-2xl text-emerald-400">%</span></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="max-w-6xl mx-auto animate-fade-in-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="relative w-full sm:w-auto">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input type="text" placeholder="Rechercher un client..." className="pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm w-full sm:w-80 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-all shadow-sm" />
                </div>
                <button onClick={handleAddClient} className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-sm w-full sm:w-auto justify-center">
                  <Plus className="w-4 h-4" /> Nouveau client
                </button>
              </div>

              {dataLoading ? (
                <div className="flex justify-center items-center py-20">
                  <svg className="animate-spin h-8 w-8 text-zinc-900" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
              ) : dataError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" />{dataError}</div>
              ) : clients.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6 border border-zinc-100">
                    <Users className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Aucun client pour le moment</h3>
                  <p className="text-zinc-500 font-medium mb-6">Ajoutez votre premier client pour commencer à monitorer son infrastructure.</p>
                  <button onClick={handleAddClient} className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Ajouter un client
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-[#FAFAFA]">
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Entreprise</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Contact</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Plan</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Statut</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">CA Généré</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {clients.map(client => (
                        <tr key={client.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-5 font-bold text-zinc-900">{client.brand_name}</td>
                          <td className="px-6 py-5 text-sm font-medium text-zinc-500">—</td>
                          <td className="px-6 py-5 text-sm"><span className="bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-lg font-bold border border-zinc-200">—</span></td>
                          <td className="px-6 py-5">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border bg-zinc-50 text-zinc-600 border-zinc-200 opacity-50 cursor-not-allowed" title="Non disponible avec les données actuelles">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                              —
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm font-mono font-bold text-zinc-900">—</td>
                          <td className="px-6 py-5 text-right">
                            <button className="text-zinc-400 hover:text-zinc-900 p-2 hover:bg-zinc-100 rounded-lg transition-colors"><MoreVertical className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="max-w-6xl mx-auto animate-fade-in-up">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Leads Capturés</h2>
                <p className="text-zinc-500 font-medium">Contacts intéressés depuis le simulateur d'Architecture IA sur la landing page.</p>
              </div>

              {dataLoading ? (
                <div className="flex justify-center items-center py-20">
                  <svg className="animate-spin h-8 w-8 text-zinc-900" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
              ) : dataError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" />{dataError}</div>
              ) : leads.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6 border border-zinc-100">
                    <Users className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Aucun lead pour le moment</h3>
                  <p className="text-zinc-500 font-medium mb-6">Patientez jusqu'à ce que de nouveaux prospects soumettent une demande d'Architecture Cible.</p>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-[#FAFAFA]">
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Entreprise</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Email</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Source</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {leads.map(lead => (
                        <tr key={lead.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-5 font-bold text-zinc-900">{lead.brand_name}</td>
                          <td className="px-6 py-5 text-sm font-medium text-blue-600"><a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a></td>
                          <td className="px-6 py-5 text-sm"><span className="bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-lg font-bold border border-zinc-200 text-xs">{lead.source === 'landing_architecture' ? 'Simulateur IA' : lead.source}</span></td>
                          <td className="px-6 py-5 text-sm font-semibold text-zinc-500">
                            {new Date(lead.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="max-w-4xl mx-auto animate-fade-in-up">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Demandes d'architecture IA</h2>
                <p className="text-zinc-500 font-medium">Projets soumis par vos prospects via le widget de la landing page.</p>
              </div>

              {dataLoading ? (
                <div className="flex justify-center items-center py-20">
                  <svg className="animate-spin h-8 w-8 text-zinc-900" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
              ) : dataError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" />{dataError}</div>
              ) : requestsData.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6 border border-zinc-100">
                    <Sparkles className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Aucune demande pour le moment</h3>
                  <p className="text-zinc-500 font-medium">Les projets soumis par vos clients apparaîtront ici.</p>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-[#FAFAFA]">
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest w-1/4">Projet</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest w-1/5">Client</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest w-1/6">Stack</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest w-1/6">Statut & Priorité</th>
                        <th className="px-6 py-5 text-xs font-bold text-zinc-400 uppercase tracking-widest w-1/6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {requestsData.map(req => (
                        <tr key={req.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <p className="font-bold text-zinc-900 mb-1 leading-snug">{req.title || "Projet IA"}</p>
                            <p className="text-xs text-zinc-500 font-medium line-clamp-2" title={req.description}>{req.description}</p>
                          </td>
                          <td className="px-6 py-5 text-sm font-bold text-zinc-700">
                            {req.clients?.brand_name || "Client inconnu"}
                          </td>
                          <td className="px-6 py-5">
                            {req.stack ? (
                              <span className="bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-200">{req.stack}</span>
                            ) : (
                              <span className="text-zinc-400 font-bold">—</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-2 items-start">
                              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-lg border border-amber-200">{req.status || "En attente"}</span>
                              {req.priority && <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200 uppercase tracking-wider">{req.priority}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm font-semibold text-zinc-500">
                            {new Date(req.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'automations' && (
            <div className="max-w-6xl mx-auto text-center py-20 animate-fade-in-up">
              <Database className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Gestion des Infrastructures</h3>
              <p className="text-zinc-500 font-medium max-w-md mx-auto">Cette section vous permettra de connecter l'API n8n pour monitorer tous les workflows actifs de vos clients depuis un seul endroit.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// ==========================================
// Animated Counter Component
// ==========================================
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

const AnimatedCounter = ({ value, duration = 1.2, suffix = '', className = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const previousValueRef = useRef(0);
  const startTimeRef = useRef(null);
  const requestRef = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !elementRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setHasAnimated(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasAnimated) return;
    if (value === 0 && previousValueRef.current === 0) {
      setDisplayValue(0);
      return;
    }
    const startValue = previousValueRef.current;
    const endValue = value;
    const durationMs = duration * 1000;
    const animate = (time) => {
      if (startTimeRef.current === null) startTimeRef.current = time;
      const progressMs = time - startTimeRef.current;
      const progressRatio = Math.min(progressMs / durationMs, 1);
      const easedProgress = easeOutCubic(progressRatio);
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);
      if (progressRatio < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
        startTimeRef.current = null;
      }
    };
    if (startValue !== endValue) {
      startTimeRef.current = null;
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [value, duration, hasAnimated]);

  const formattedValue = Math.round(displayValue).toLocaleString('fr-FR');
  return (
    <span ref={elementRef} className={className}>
      {formattedValue}
      {suffix && <span className="text-[0.6em] font-medium text-inherit ml-1 opacity-60 align-baseline">{suffix}</span>}
    </span>
  );
};

// ==========================================
// 3. DASHBOARD USER (CLIENT)
// ==========================================
const ClientDashboard = ({ onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [currentClient, setCurrentClient] = useState(null);
  const [requests, setRequests] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Project submission state
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectStack, setProjectStack] = useState('');
  const [projectPriority, setProjectPriority] = useState('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const session = sessionData?.session;
        if (sessionError || !session) {
          onNavigate('/login');
          return;
        }

        const { data: clientRecord, error: clientErr } = await supabase
          .from('clients')
          .select('id, brand_name, owner_user_id, created_at')
          .eq('owner_user_id', session.user.id)
          .single();

        if (clientErr && clientErr.code !== 'PGRST116') {
          throw clientErr;
        }

        if (clientRecord) {
          setCurrentClient(clientRecord);
          // Fetch requests
          const { data: requestsData, error: reqErr } = await supabase
            .from('requests')
            .select('*')
            .eq('client_id', clientRecord.id)
            .order('created_at', { ascending: false });

          if (reqErr) throw reqErr;
          setRequests(requestsData || []);

          // Fetch Metrics via RPC
          setMetricsLoading(true);
          const { data: metricsData, error: metricsErr } = await supabase
            .rpc('recompute_client_metrics', { p_client_id: clientRecord.id });

          if (metricsErr && metricsErr.code !== 'PGRST116') {
            console.error(metricsErr);
            setMetricsError('Impossible de charger les métriques.');
          } else {
            setMetrics(metricsData);
          }
          setMetricsLoading(false);

        } else {
          setCurrentClient(null);
        }
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des données.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClientData();
  }, [onNavigate]);

  // Polling metrics every 30s using RPC
  useEffect(() => {
    if (!currentClient || !isSupabaseConfigured) return;

    const intervalId = setInterval(async () => {
      try {
        const { data: metricsData, error: metricsErr } = await supabase
          .rpc('recompute_client_metrics', { p_client_id: currentClient.id });
        if (!metricsErr && metricsData) {
          setMetrics(metricsData);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [currentClient, isSupabaseConfigured]);

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!currentClient || !projectTitle || !projectDesc) return;

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const { error: insertErr } = await supabase.from('requests').insert({
        client_id: currentClient.id,
        title: projectTitle,
        description: projectDesc,
        stack: projectStack,
        priority: projectPriority,
        status: 'en_attente'
      });

      if (insertErr) throw insertErr;

      setSubmitSuccess(true);
      setProjectTitle('');
      setProjectDesc('');
      setProjectStack('');
      setProjectPriority('normal');

      // Refresh requests
      const { data: requestsData, error: reqErr } = await supabase
        .from('requests')
        .select('*')
        .eq('client_id', currentClient.id)
        .order('created_at', { ascending: false });

      if (!reqErr && requestsData) {
        setRequests(requestsData);
      }

      setTimeout(() => {
        setActiveTab('requests');
        setSubmitSuccess(false);
      }, 2000);

    } catch (err) {
      setSubmitError(err.message || 'Erreur lors de la soumission du projet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSupabaseConfigured && isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-zinc-900" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  if (isSupabaseConfigured && !currentClient) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-zinc-200 p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center max-w-lg">
          <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-100">
            <Lock className="w-10 h-10 text-zinc-300" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4 tracking-tight">Aucun client associé</h2>
          <p className="text-zinc-500 font-medium mb-8">Votre compte n'est pas encore lié à une infrastructure client. Veuillez contacter votre administrateur pour configurer votre espace.</p>
          <div className="flex flex-col gap-3">
            <a href="mailto:support@actero.io" className="bg-zinc-900 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-zinc-800 transition-colors shadow-sm">
              Contacter Actero
            </a>
            <button onClick={onLogout} className="text-zinc-500 hover:text-zinc-900 font-bold py-3 transition-colors">
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Sidebar = () => (
    <div className="w-full md:w-64 bg-white border-r border-zinc-200 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6 text-zinc-900" />
          <span className="font-bold text-lg text-zinc-900">Actero OS</span>
        </div>
        <button className="md:hidden text-zinc-500" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 mt-2">Pilotage</p>
        <button onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'overview' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}><LayoutDashboard className="w-4 h-4" /> Vue d'ensemble</button>
        <button onClick={() => { setActiveTab('requests'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'requests' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}>
          <div className="flex items-center gap-3"><FileText className="w-4 h-4" /> Mes demandes</div>
          {requests.length > 0 && <span className="bg-emerald-100 text-emerald-700 py-0.5 px-2 rounded-full text-xs font-bold">{requests.length}</span>}
        </button>
        <button onClick={() => { setActiveTab('architect'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'architect' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}><BrainCircuit className="w-4 h-4" /> Architecte IA</button>

        <p className="px-3 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 mt-6">Infrastructure</p>
        <button onClick={() => { setActiveTab('systems'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'systems' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}><Database className="w-4 h-4" /> Mes Systèmes</button>
        <button onClick={() => { setActiveTab('activity'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'activity' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}><Activity className="w-4 h-4" /> Activité en direct</button>
        <button onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'reports' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}><Download className="w-4 h-4" /> Rapports</button>
      </div>
      <div className="p-4 border-t border-zinc-200">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"><LogOut className="w-4 h-4" /> Déconnexion</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6 text-zinc-900" />
          <span className="font-bold text-lg text-zinc-900">Actero OS</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-600"><Menu className="w-6 h-6" /></button>
      </div>

      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="hidden md:flex h-16 bg-white border-b border-zinc-200 items-center justify-between px-8">
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            {activeTab === 'overview' && "Vue d'ensemble"}
            {activeTab === 'requests' && "Mes demandes"}
            {activeTab === 'architect' && "Architecte IA"}
            {activeTab === 'activity' && "Activité temps réel"}
            {activeTab === 'systems' && "Mes Systèmes"}
            {activeTab === 'reports' && "Rapports & Exports"}
          </h1>
          <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Systèmes Opérationnels</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">

          {activeTab === 'overview' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Bonjour{currentClient ? ` ${currentClient.brand_name}` : ""}, voici vos performances.</h2>
                <p className="text-zinc-500 font-medium text-lg">Synthèse des 30 derniers jours.</p>
              </div>

              {metricsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm animate-pulse h-48 flex flex-col justify-between">
                      <div className="h-10 w-10 bg-zinc-100 rounded-xl mb-6"></div>
                      <div>
                        <div className="h-8 bg-zinc-100 rounded w-1/2 mb-3"></div>
                        <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : metricsError ? (
                <div className="p-5 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-red-900">Indisponibilité des services</h3>
                    <p className="text-sm text-red-700 mt-1 font-medium">{metricsError}</p>
                  </div>
                </div>
              ) : !metrics || (metrics.active_automations === 0 && metrics.tasks_executed === 0 && metrics.time_saved_minutes === 0 && metrics.estimated_roi === 0) ? (
                <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-6 border border-zinc-100">
                    <Activity className="w-8 h-8 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Metrics à venir</h3>
                  <p className="text-zinc-500 font-medium">Les premières métriques apparaîtront bientôt dès que vos workflows seront pleinement opérationnels.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Temps économisé */}
                  <div
                    className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden group animate-fade-in-up [animation-fill-mode:backwards] transition-all duration-200 ease-out transform hover:-translate-y-1 hover:shadow-xl"
                    style={{ animationDelay: '0ms' }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-2.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl"><Clock className="w-5 h-5" /></div>
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Temps économisé</p>
                    </div>
                    <p className="text-5xl font-bold text-emerald-600 font-mono tracking-tighter mb-2 relative z-10 min-h-[60px] flex items-end">
                      <AnimatedCounter value={Math.round(metrics.time_saved_minutes / 60)} suffix="h" />
                    </p>
                    <p className="text-sm font-medium text-zinc-500 mt-auto relative z-10">Équivalent en temps humain de travail ce mois-ci.</p>
                  </div>

                  {/* ROI */}
                  <div
                    className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden group animate-fade-in-up [animation-fill-mode:backwards] transition-all duration-200 ease-out transform hover:-translate-y-1 hover:shadow-xl"
                    style={{ animationDelay: '100ms' }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">ROI Généré</p>
                    </div>
                    <p className="text-5xl font-bold text-zinc-900 font-mono tracking-tighter mb-2 relative z-10 min-h-[60px] flex items-end">
                      <AnimatedCounter value={metrics.estimated_roi} suffix="€" />
                    </p>
                    <p className="text-sm font-medium text-zinc-500 mt-auto relative z-10">Valeur métier estimée générée par les flux.</p>
                  </div>

                  {/* Automatisations actives */}
                  <div
                    className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col animate-fade-in-up [animation-fill-mode:backwards] transition-all duration-200 ease-out transform hover:-translate-y-1 hover:shadow-xl"
                    style={{ animationDelay: '200ms' }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl"><Activity className="w-5 h-5" /></div>
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Automatisations actives</p>
                    </div>
                    <p className="text-5xl font-bold text-zinc-900 font-mono tracking-tighter mb-2 min-h-[60px] flex items-end">
                      <AnimatedCounter value={metrics.active_automations} />
                    </p>
                    <p className="text-sm font-medium text-zinc-500 mt-auto">Workflows surveillés 24/7</p>
                  </div>

                  {/* Tâches automatisées */}
                  <div
                    className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col animate-fade-in-up [animation-fill-mode:backwards] transition-all duration-200 ease-out transform hover:-translate-y-1 hover:shadow-xl"
                    style={{ animationDelay: '300ms' }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl"><TerminalSquare className="w-5 h-5" /></div>
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Tâches automatisées</p>
                    </div>
                    <p className="text-5xl font-bold text-zinc-900 font-mono tracking-tighter mb-2 min-h-[60px] flex items-end">
                      <AnimatedCounter value={metrics.tasks_executed} />
                    </p>
                    <p className="text-sm font-medium text-zinc-500 mt-auto">Actions réalisées avec succès ce mois-ci</p>
                  </div>
                </div>
              )}

              {/* Support CTA */}
              <div className="bg-zinc-900 rounded-3xl p-8 md:p-10 mt-12 flex flex-col md:flex-row items-center justify-between shadow-xl">
                <div className="mb-6 md:mb-0 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">Un besoin d'évolution ?</h3>
                  <p className="text-zinc-400 font-medium">Vous souhaitez ajouter un nouveau processus à votre infrastructure ?</p>
                </div>
                <button onClick={() => setActiveTab('architect')} className="bg-white text-black px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-sm w-full md:w-auto">
                  Consulter l'Architecte IA <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="max-w-4xl mx-auto animate-fade-in-up">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Mes demandes d'architecture</h2>
                <p className="text-zinc-500 font-medium">Suivez l'état d'avancement de vos projets d'automatisation.</p>
              </div>

              {error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" />{error}</div>
              ) : requests.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6 border border-zinc-100">
                    <FileText className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Aucune demande pour l'instant</h3>
                  <p className="text-zinc-500 font-medium mb-6">Soumettez votre premier projet à notre équipe d'architectes IA.</p>
                  <button onClick={() => setActiveTab('architect')} className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Soumettre un projet
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {requests.map(req => (
                    <div key={req.id} className="bg-white border border-zinc-200 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col md:flex-row">
                      <div className="p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-100 bg-[#FAFAFA]">
                        <div className="flex items-center justify-between mb-6">
                          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-lg border border-amber-200">{req.status || "En attente"}</span>
                          <span className="text-xs text-zinc-400 font-bold">{new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Impact estimé :</p>
                        <p className="text-base text-emerald-600 font-bold flex items-center gap-1"><Clock className="w-4 h-4" /> ~{req.timeSaved || "N/A"}</p>
                      </div>
                      <div className="p-8 md:w-2/3">
                        <h3 className="text-2xl font-bold text-zinc-900 mb-4 tracking-tight">{req.title || "Projet IA"}</h3>
                        <p className="text-base font-medium text-zinc-600 mb-6 pb-6 border-b border-zinc-100 leading-relaxed">{req.description || req.diagnosis}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {req.stack && <span className="bg-zinc-100 text-zinc-700 text-xs font-bold px-3 py-1 rounded-lg border border-zinc-200">Stack : {req.stack}</span>}
                          {req.priority && <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-lg border border-purple-200">Priorité : {req.priority}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'architect' && (
            <div className="max-w-3xl mx-auto animate-fade-in-up">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Architecte IA</h2>
                <p className="text-zinc-500 font-medium tracking-tight leading-relaxed">Décrivez votre besoin d'automatisation. Nos experts concevront une architecture sur mesure pour vous faire gagner de la bande passante.</p>
              </div>

              <form onSubmit={handleSubmitProject} className="bg-white border border-zinc-200 p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
                {submitSuccess && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 flex-shrink-0" /> Projet soumis avec succès ! Vous serez contacté très prochainement.</div>}
                {submitError && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" /> {submitError}</div>}

                <div>
                  <label className="block text-sm font-bold text-zinc-900 mb-2">Titre du projet <span className="text-emerald-500">*</span></label>
                  <input required value={projectTitle} onChange={e => setProjectTitle(e.target.value)} type="text" className="w-full bg-[#FAFAFA] border border-zinc-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all font-medium" placeholder="Ex: Relance automatique des factures impayées" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-900 mb-2">Objectif & Contexte <span className="text-emerald-500">*</span></label>
                  <textarea required value={projectDesc} onChange={e => setProjectDesc(e.target.value)} rows="5" className="w-full bg-[#FAFAFA] border border-zinc-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all font-medium leading-relaxed" placeholder="Décrivez le processus chronophage que vous souhaitez automatiser. Indiquez la perte de temps ou d'argent pour nous aider à évaluer le ROI potentiel..."></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-900 mb-2">Outils existants (Stack) <span className="text-zinc-400 font-normal">(Optionnel)</span></label>
                    <input value={projectStack} onChange={e => setProjectStack(e.target.value)} type="text" className="w-full bg-[#FAFAFA] border border-zinc-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all font-medium" placeholder="Ex: Shopify, Klaviyo, Stripe..." />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-900 mb-2">Priorité <span className="text-emerald-500">*</span></label>
                    <div className="relative">
                      <select value={projectPriority} onChange={e => setProjectPriority(e.target.value)} className="w-full bg-[#FAFAFA] border border-zinc-200 rounded-xl py-3 px-4 appearance-none outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all font-medium text-zinc-700">
                        <option value="low">Basse (Pas d'urgence)</option>
                        <option value="normal">Normale (D'ici quelques semaines)</option>
                        <option value="high">Haute (Impact immédiat attendu)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-100 flex justify-end">
                  <button disabled={isSubmitting || submitSuccess} type="submit" className="w-full md:w-auto mt-4 px-8 bg-zinc-900 text-white rounded-xl py-4 font-bold hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm inline-flex items-center justify-center gap-2">
                    {isSubmitting ? <><span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span> Soumission...</> : "Soumettre le projet"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="max-w-4xl mx-auto animate-fade-in-up">
              {!isSupabaseConfigured ? (
                <div className="bg-white border border-zinc-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-zinc-100 bg-[#FAFAFA] flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Flux de données récent</h3>
                      <p className="text-sm text-zinc-500 font-medium">Historique des actions exécutées par l'infrastructure.</p>
                    </div>
                    <button className="text-sm font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2 rounded-lg shadow-sm transition-colors hidden sm:flex"><Download className="w-4 h-4" /> Exporter CSV</button>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {[
                      { time: "Aujourd'hui, 14:32", status: "success", tool: "Hubspot", text: "Nouveau lead qualifié et ajouté au CRM" },
                      { time: "Aujourd'hui, 11:15", status: "success", tool: "Shopify", text: "Panier abandonné relancé via Email & SMS" },
                      { time: "Aujourd'hui, 09:40", status: "success", tool: "Stripe", text: "Facture #8492 traitée et envoyée en comptabilité" },
                      { time: "Hier, 18:20", status: "warning", tool: "Typeform", text: "API Typeform injoignable (Nouvelle tentative réussie)" },
                      { time: "Hier, 14:05", status: "success", tool: "Gorgias", text: "Ticket support analysé par IA et résolu" },
                    ].map((log, i) => (
                      <div key={i} className="p-6 md:p-8 flex items-start gap-4 hover:bg-zinc-50/50 transition-colors">
                        <div className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full shadow-sm ${log.status === 'success' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'}`}></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200">{log.tool}</span>
                            <span className="text-xs font-bold text-zinc-400">{log.time}</span>
                          </div>
                          <p className="text-base font-bold text-zinc-900">{log.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-6 border border-zinc-100">
                    <Activity className="w-8 h-8 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Flux de synchronisation</h3>
                  <p className="text-zinc-500 font-medium">Les logs de vos automatisations apparaîtront ici prochainement.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'systems' && (
            <div className="max-w-5xl mx-auto animate-fade-in-up">
              <h2 className="text-3xl font-bold text-zinc-900 mb-8 tracking-tight">Vos infrastructures actives</h2>
              {!isSupabaseConfigured ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { name: "Récupération Paniers Abandonnés", desc: "Séquence dynamique Shopify -> Klaviyo", status: "Actif", runs: "1,240 exécutions" },
                    { name: "Support IA Niveau 1", desc: "Analyse des emails SAV et réponse automatique", status: "Actif", runs: "3,102 exécutions" },
                    { name: "Synchronisation Comptable", desc: "Stripe -> Quickbooks (Quotidien)", status: "Actif", runs: "30 exécutions" },
                  ].map((sys, idx) => (
                    <div key={idx} className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                          <Database className="w-6 h-6 text-zinc-700" />
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-200">{sys.status}</span>
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 mb-2">{sys.name}</h3>
                      <p className="text-sm text-zinc-500 font-medium mb-6">{sys.desc}</p>
                      <div className="pt-4 border-t border-zinc-100 text-sm font-bold text-zinc-400">
                        {sys.runs} ce mois
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-6 border border-zinc-100">
                    <Database className="w-8 h-8 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Connecteurs et intégrations</h3>
                  <p className="text-zinc-500 font-medium">L'intégration native de vos systèmes avec Actero OS est en cours de création.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="max-w-4xl mx-auto text-center py-20 animate-fade-in-up">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-100">
                <FileText className="w-10 h-10 text-zinc-300" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-3 tracking-tight">Centre de rapports (Bêta)</h3>
              <p className="text-zinc-500 font-medium max-w-md mx-auto mb-8 leading-relaxed">Générez des rapports PDF mensuels détaillant le ROI exact de chaque workflow déployé.</p>
              <button disabled className="opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-500 border border-zinc-200 shadow-sm px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2">
                <Download className="w-5 h-5" /> Bientôt disponible
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

// ==========================================
// 4. NOUVELLE LANDING PAGE (E-COMMERCE FOCUS, LIGHT MODE PREMIUM)
// ==========================================
const LandingPage = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- États pour l'interaction IA ---
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");

  // --- Modal AI Lead ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (brandName.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(contactEmail)) {
      return;
    }
    setIsSubmitting(true);

    // Option retenue : Créer une table `leads` (brand_name, email, created_at, source)
    // Nous tentons l'insertion silencieusement pour ne pas bloquer l'UX si la table n'est pas encore prête
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('leads').insert({
          brand_name: brandName.trim(),
          email: contactEmail.trim(),
          source: 'landing_architecture'
        });
      }
    } catch (err) {
      console.error("Erreur d'insertion lead", err);
    }

    setIsSubmitting(false);
    setIsModalOpen(false);

    // Déclenchement de l'IA une fois le lead capturé
    generateAIAudit();
  };

  const generateAIAudit = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    const payload = {
      contents: [{ parts: [{ text: `Problème e-commerce: "${aiInput}"` }] }],
      systemInstruction: {
        parts: [{ text: "Tu es un architecte système expert en automatisation e-commerce (n8n, Make, Shopify, Klaviyo, Stripe). Le prospect te décrit un problème opérationnel, une perte de temps ou une fuite de revenus. Ton rôle est d'analyser le problème et de proposer une solution d'automatisation élégante et haut de gamme. Ne parle pas de code, parle de flux de données et de résultats. Retourne UNIQUEMENT un JSON valide." }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            diagnosis: { type: "STRING", description: "Le diagnostic du problème (1 phrase courte et percutante)" },
            solution: { type: "STRING", description: "La logique de la solution d'automatisation proposée (ex: Déclencheur X -> Action Y avec l'outil Z)" },
            timeSaved: { type: "STRING", description: "Estimation réaliste du temps gagné (ex: '15h / mois')" },
            revenueImpact: { type: "STRING", description: "Impact métier (ex: '+12% de conversion sur les paniers abandonnés')" }
          },
          required: ["diagnosis", "solution", "timeSaved", "revenueImpact"]
        }
      }
    };

    try {
      const result = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (jsonText) {
        setAiResult(JSON.parse(jsonText));
      } else {
        throw new Error("Réponse vide de l'IA");
      }
    } catch (err) {
      setAiError("Le système d'analyse est actuellement très sollicité. Veuillez réessayer dans quelques instants.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-600 font-sans selection:bg-emerald-500/20 selection:text-zinc-900 scroll-smooth">

      {/* Navbar Light Premium */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              <Logo light={false} className="w-8 h-8" />
              <span className="text-zinc-900 font-bold text-xl tracking-tight">Actero</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#problemes" className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">Problèmes</a>
              <a href="#systemes" className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">Systèmes</a>
              <a href="#resultats" className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors">Résultats</a>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button onClick={() => onNavigate('/login')} className="text-sm text-zinc-500 hover:text-zinc-900 font-bold transition-colors">
                Espace Client
              </button>
              <a href="#audit" className="text-sm bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]">
                Audit Stratégique
              </a>
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-zinc-900 p-2">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-zinc-200 shadow-2xl py-6 px-6 flex flex-col gap-6 animate-fade-in-up">
            <a href="#problemes" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-zinc-900">Problèmes</a>
            <a href="#systemes" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-zinc-900">Systèmes</a>
            <a href="#resultats" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-zinc-900">Résultats</a>
            <div className="h-px bg-zinc-100 w-full my-2"></div>
            <button onClick={() => { setIsMenuOpen(false); onNavigate('/login'); }} className="text-lg font-bold text-zinc-500 text-left">Espace Client</button>
            <a href="#audit" onClick={() => setIsMenuOpen(false)} className="bg-zinc-900 text-white text-center py-4 rounded-xl font-bold shadow-md">Audit Stratégique</a>
          </div>
        )}
      </nav>

      <main>
        {/* 1. HERO SECTION */}
        <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center text-center px-4">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-200 bg-white shadow-sm text-sm font-bold text-zinc-600 mb-8 animate-fade-in-up">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Pour les marques E-commerce générant +20k€ / mois
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-zinc-900 mb-8 leading-[1.05] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Plus de CA.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">Moins d'opérations.</span><br />
              Zéro friction.
            </h1>

            <p className="text-lg md:text-xl text-zinc-500 font-medium max-w-2xl mb-12 animate-fade-in-up leading-relaxed" style={{ animationDelay: '200ms' }}>
              Transformez votre boutique e-commerce en machine de croissance autonome.
              Nous installons une infrastructure qui récupère vos paniers, monétise votre LTV et gère votre SAV 24/7. Scalabilité infinie, sans recruter.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up mb-20" style={{ animationDelay: '300ms' }}>
              <a href="#audit" className="group relative inline-flex items-center justify-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-zinc-800 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-0.5">
                Réserver un audit stratégique
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#resultats" className="inline-flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-900 px-8 py-4 rounded-xl font-bold text-base hover:bg-zinc-50 transition-all duration-300 shadow-sm">
                <Play className="w-4 h-4 text-emerald-500" fill="currentColor" />
                Voir le système
              </a>
            </div>

            {/* AI WIDGET IN HERO */}
            <div className="w-full bg-white border border-zinc-200 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] animate-fade-in-up text-left relative overflow-hidden" style={{ animationDelay: '400ms' }}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 flex items-center gap-3 tracking-tight mb-2">
                    <Sparkles className="w-8 h-8 text-emerald-500" /> Modélisation d'Infrastructure
                  </h3>
                  <p className="text-zinc-500 font-medium text-lg">Évaluez votre ROI et générez une architecture d'automatisation cible instantanément.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 lg:gap-12 relative z-10">
                {/* Input side */}
                <div className="flex flex-col">
                  <label className="block text-sm font-bold text-zinc-900 mb-3">Identifiez la contrainte opérationnelle ou la perte de revenus à résoudre :</label>
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ex : Nos équipes consacrent 15h par semaine à l'extraction manuelle des données Shopify pour mettre à jour notre CRM..."
                    className="w-full h-40 p-5 bg-[#FAFAFA] border border-zinc-200 rounded-2xl text-base text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none mb-6 transition-all shadow-inner"
                  />
                  <button
                    onClick={handleOpenModal}
                    disabled={aiLoading || !aiInput.trim()}
                    className="mt-auto w-full bg-white text-zinc-900 border border-zinc-200 shadow-sm px-6 py-4 rounded-xl font-bold text-lg hover:bg-zinc-50 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 hover:border-zinc-300"
                  >
                    {aiLoading ? (
                      <><svg className="animate-spin h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Ingénierie en cours...</>
                    ) : (
                      <><Bot className="w-6 h-6 text-zinc-400" /> Générer l'architecture cible</>
                    )}
                  </button>
                  {aiError && <p className="text-red-500 text-sm mt-4 flex items-center gap-2 font-bold"><AlertCircle className="w-4 h-4" />{aiError}</p>}
                </div>

                {/* Result side */}
                <div className="h-full min-h-[300px]">
                  {!aiResult && !aiLoading ? (
                    <div className="h-full bg-[#FAFAFA] border border-zinc-200 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center opacity-70">
                      <Database className="w-10 h-10 text-zinc-300 mb-4" />
                      <p className="text-zinc-500 font-bold">Le diagnostic des flux et le plan<br />d'infrastructure s'afficheront ici.</p>
                    </div>
                  ) : aiLoading ? (
                    <div className="h-full bg-emerald-50 border border-emerald-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-inner">
                      <Cpu className="w-12 h-12 text-emerald-500 mb-6 animate-bounce" />
                      <p className="text-emerald-700 font-bold text-lg">Calcul de l'impact et modélisation...</p>
                    </div>
                  ) : aiResult ? (
                    <div className="h-full bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col animate-fade-in-up relative overflow-hidden shadow-md">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0"></div>

                      <div className="relative z-10 flex-1">
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Diagnostic</h4>
                          <p className="text-zinc-900 font-bold text-base leading-snug">{aiResult.diagnosis}</p>
                        </div>

                        <div className="mb-8">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Flux Recommandé</h4>
                          <div className="bg-[#FAFAFA] border border-zinc-100 p-4 rounded-xl">
                            <p className="text-zinc-600 text-sm font-medium leading-relaxed">{aiResult.solution}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Gain de productivité</p>
                            <p className="text-emerald-700 font-bold text-xl">{aiResult.timeSaved}</p>
                          </div>
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Impact Business</p>
                            <p className="text-blue-700 font-bold text-xl">{aiResult.revenueImpact}</p>
                          </div>
                        </div>
                      </div>

                      <a href="#audit" className="w-full bg-emerald-500 text-white px-6 py-4 rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm group relative z-10">
                        Déployer ce système <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Micro Preuve Sociale */}
            <div className="mt-24 pt-10 border-t border-zinc-200 w-full animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">Infrastructures connectées aux leaders</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                {['Shopify', 'Klaviyo', 'Stripe', 'Gorgias', 'Zendesk'].map((logo) => (
                  <span key={logo} className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tighter">{logo}.</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. PROBLÈMES E-COMMERCE */}
        <section id="problemes" className="py-32 px-4 bg-white relative">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-20 text-center tracking-tight">
              Le plafond de verre de votre croissance.<br />
              <span className="text-zinc-400">Vous le sentez tous les jours.</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <ShoppingCart />, title: "Paniers évaporés", desc: "Des relances génériques qui convertissent mal. De l'argent laissé sur la table à chaque visite." },
                { icon: <MessageSquare />, title: "SAV sous l'eau", desc: "Vos équipes passent leurs journées à répondre « Où est ma commande ? ». Temps perdu, LTV détruite." },
                { icon: <ZapOff />, title: "Outils déconnectés", desc: "Votre CRM ne parle pas à votre plateforme. Les données sont en silo. Vous naviguez à vue." }
              ].map((prob, idx) => (
                <div key={idx} className="bg-[#FAFAFA] border border-zinc-200 rounded-[2rem] p-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-zinc-300 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center mb-8 text-zinc-600 shadow-sm">
                    {prob.icon}
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-4">{prob.title}</h3>
                  <p className="text-zinc-500 leading-relaxed font-medium">{prob.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 & 4. TRANSFORMATION & SYSTÈMES (BENTO GRID) */}
        <section id="systemes" className="py-32 px-4 bg-[#FAFAFA] relative border-t border-zinc-200">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-20">
              <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-6 tracking-tight">De l'opérationnel au pilotage.</h2>
              <p className="text-xl text-zinc-500 max-w-2xl font-medium">Nous ne vendons pas d'outils isolés. Nous installons un moteur complet qui s'intègre à votre écosystème.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 : Relance */}
              <div className="md:col-span-2 bg-white border border-zinc-200 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-colors"></div>
                <Repeat className="w-10 h-10 text-emerald-500 mb-8" />
                <h3 className="text-3xl font-bold text-zinc-900 mb-4 tracking-tight">Récupération de paniers intelligente</h3>
                <p className="text-zinc-500 mb-10 max-w-md text-lg leading-relaxed font-medium">Terminé les séquences d'emails figées. Notre système analyse le comportement d'achat et déclenche des offres dynamiques personnalisées (SMS + Email) au moment précis où le prospect est le plus chaud.</p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-zinc-50 border border-zinc-100 px-5 py-3 rounded-xl"><span className="text-emerald-600 font-bold text-lg">+18%</span> <span className="text-sm text-zinc-500 font-bold ml-1">Taux conv.</span></div>
                  <div className="bg-zinc-50 border border-zinc-100 px-5 py-3 rounded-xl"><span className="text-zinc-900 font-bold text-lg">+CA</span> <span className="text-sm text-zinc-500 font-bold ml-1">Immédiat</span></div>
                </div>
              </div>

              {/* Feature 2 : SAV */}
              <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                <ShieldCheck className="w-10 h-10 text-blue-500 mb-8" />
                <h3 className="text-2xl font-bold text-zinc-900 mb-4 tracking-tight">SAV Autonome</h3>
                <p className="text-zinc-500 mb-10 leading-relaxed font-medium">90% des requêtes niveau 1 traitées automatiquement avec le contexte de commande précis en temps réel.</p>
                <div className="bg-zinc-50 border border-zinc-100 px-5 py-3 rounded-xl inline-block"><span className="text-blue-600 font-bold text-lg">-40%</span> <span className="text-sm text-zinc-500 font-bold ml-1">Support</span></div>
              </div>

              {/* Feature 3 : Upsell */}
              <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                <Target className="w-10 h-10 text-amber-500 mb-8" />
                <h3 className="text-2xl font-bold text-zinc-900 mb-4 tracking-tight">Upsell Post-Achat</h3>
                <p className="text-zinc-500 leading-relaxed mb-8 font-medium">Automatisation des offres complémentaires déclenchées selon les achats précédents.</p>
                <p className="text-amber-600 font-bold text-xl mt-auto">x2 LTV Client</p>
              </div>

              {/* Feature 4 : Dashboard */}
              <div className="md:col-span-2 bg-white border border-zinc-200 rounded-[2rem] p-8 md:p-12 relative overflow-hidden flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
                <LayoutDashboard className="w-10 h-10 text-indigo-500 mb-8" />
                <h3 className="text-3xl font-bold text-zinc-900 mb-4 tracking-tight">Dashboard de Performance</h3>
                <p className="text-zinc-500 max-w-xl text-lg leading-relaxed font-medium">Vous ne codez rien. Vous pilotez. Accédez à votre espace Actero privé pour voir en direct les revenus générés par les automatisations, les heures économisées et le ROI global.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. COMMENT ÇA MARCHE */}
        <section className="py-32 px-4 bg-white border-t border-zinc-200">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-20 text-center tracking-tight">Le déploiement en 3 phases.</h2>
            <div className="space-y-16">
              {[
                { step: "01", title: "Audit & Mapping", desc: "Analyse de vos flux de données actuels (Shopify, Stripe, Klaviyo) et identification des pertes de revenus immédiates." },
                { step: "02", title: "Ingénierie des Systèmes", desc: "Construction des workflows invisibles en arrière-plan. Pas de perturbation de vos opérations en cours. Connexion via API sécurisées." },
                { step: "03", title: "Croissance Automatisée", desc: "Lancement de la machine. Remontée des KPIs dans votre dashboard. Optimisation continue du ROAS." }
              ].map((phase, idx) => (
                <div key={idx} className="flex gap-8 md:gap-16 items-start group">
                  <div className="text-5xl md:text-7xl font-bold text-zinc-100 font-mono tracking-tighter group-hover:text-zinc-200 transition-colors">{phase.step}</div>
                  <div className="pt-2">
                    <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-4 tracking-tight">{phase.title}</h3>
                    <p className="text-zinc-500 text-lg leading-relaxed font-medium">{phase.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. DÉMO DASHBOARD (FOCUS E-COM) */}
        <section id="resultats" className="py-32 px-4 bg-[#FAFAFA] relative border-y border-zinc-200 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none"></div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-6 tracking-tight">Ce que vous voyez.</h2>
              <p className="text-xl text-zinc-500 font-medium">Pendant que l'infrastructure tourne silencieusement.</p>
            </div>

            <div className="rounded-3xl border border-zinc-200/60 bg-white overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
              <div className="h-14 border-b border-zinc-100 bg-[#FAFAFA] flex items-center px-6">
                <div className="flex gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
                  <div className="w-3 h-3 rounded-full bg-zinc-300"></div>
                </div>
                <div className="mx-auto text-xs text-zinc-400 font-mono bg-white px-4 py-1.5 rounded-lg border border-zinc-200 shadow-sm">app.actero.io/ecommerce</div>
              </div>
              <div className="p-8 md:p-12">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-12 gap-6">
                  <div>
                    <h3 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">Impact de l'Infrastructure</h3>
                    <p className="text-zinc-500 font-bold">30 derniers jours</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    Systèmes Actifs
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
                  <div className="bg-[#FAFAFA] border border-zinc-100 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-zinc-400" /> CA Additionnel</p>
                    <p className="text-5xl font-bold text-zinc-900 font-mono tracking-tighter mb-3">+<AnimatedNumber end={24850} /> €</p>
                    <p className="text-sm font-bold text-emerald-600">Via relances & upsells auto</p>
                  </div>
                  <div className="bg-[#FAFAFA] border border-zinc-100 rounded-3xl p-8 relative overflow-hidden">
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-zinc-400" /> Paniers Récupérés</p>
                    <p className="text-5xl font-bold text-zinc-900 font-mono tracking-tighter mb-3"><AnimatedNumber end={312} /></p>
                    <p className="text-sm font-bold text-zinc-500">Taux de conv. 18.4%</p>
                  </div>
                  <div className="bg-[#FAFAFA] border border-zinc-100 rounded-3xl p-8 relative overflow-hidden">
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-zinc-400" /> Heures Économisées</p>
                    <p className="text-5xl font-bold text-zinc-900 font-mono tracking-tighter mb-3"><AnimatedNumber end={145} /> h</p>
                    <p className="text-sm font-bold text-zinc-500">SAV traité sans humain</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. POUR QUI / PAS POUR QUI */}
        <section className="py-32 px-4 bg-white">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16">
            <div className="bg-[#FAFAFA] p-10 md:p-12 rounded-[2.5rem] border border-zinc-200">
              <h3 className="text-2xl font-bold text-zinc-900 mb-10 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" /> C'est pour vous si :
              </h3>
              <ul className="space-y-6">
                {['Vous générez déjà +20k€/mois.', 'Vous utilisez Shopify et des outils modernes.', 'Le SAV ou les tâches manuelles freinent votre scale.', 'Vous cherchez du ROI, pas un gadget technologique.'].map((item, i) => (
                  <li key={i} className="flex gap-4 text-zinc-600 font-medium text-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0"></span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-10 md:p-12 rounded-[2.5rem] border border-red-100 shadow-[0_8px_30px_rgb(239,68,68,0.05)]">
              <h3 className="text-2xl font-bold text-zinc-900 mb-10 flex items-center gap-3">
                <X className="w-8 h-8 text-red-500" /> Pas pour vous si :
              </h3>
              <ul className="space-y-6">
                {['Vous venez de lancer votre boutique (0-10k€).', 'Vous n\'avez pas de product-market fit.', 'Vous cherchez une agence de publicité/création.', 'Vous refusez d\'investir dans votre infrastructure.'].map((item, i) => (
                  <li key={i} className="flex gap-4 text-zinc-500 font-medium text-lg">
                    <span className="w-2 h-2 rounded-full bg-red-400 mt-2.5 flex-shrink-0 opacity-50"></span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 8. OFFRE & CTA FINAL (CALENDLY EMBED) */}
        <section id="audit" className="py-32 px-4 bg-[#FAFAFA] relative border-t border-zinc-200">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none"></div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-zinc-900 mb-8 tracking-tight">Combien de CA perdez-vous <span className="text-zinc-400">en ce moment même ?</span></h2>
            <p className="text-xl text-zinc-500 font-medium mb-16 max-w-2xl mx-auto leading-relaxed">Réservez un audit stratégique offert de 30 minutes. Nous cartographierons vos fuites de revenus et concevrons votre infrastructure de croissance.</p>

            <div className="bg-white rounded-[2.5rem] border border-zinc-200 w-full mx-auto shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden h-[750px]">
              <iframe
                src="https://calendly.com/jc6pablo2/30min?hide_gdpr_banner=1&background_color=ffffff&text_color=09090b&primary_color=10b981"
                width="100%"
                height="100%"
                frameBorder="0"
                title="Prendre rendez-vous avec Actero"
              ></iframe>
            </div>

            <p className="mt-10 text-sm font-bold text-zinc-400 uppercase tracking-widest">Places limitées à 3 onboardings par mois pour garantir l'excellence technique.</p>
          </div>
        </section>

        {/* Modal Lead IA */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" onClick={!isSubmitting ? closeModal : undefined}></div>
            <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up z-10 border border-zinc-100">
              <button onClick={closeModal} disabled={isSubmitting} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50 bg-zinc-50 p-1.5 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">Dernière étape</h3>
              <p className="text-zinc-500 font-medium mb-6">Laissez-nous vos coordonnées pour générer votre architecture cible personnalisée.</p>

              <form onSubmit={handleModalSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-900 mb-2">Nom de l'entreprise <span className="text-emerald-500">*</span></label>
                  <input
                    required
                    minLength={2}
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    disabled={isSubmitting}
                    type="text"
                    className="w-full bg-[#FAFAFA] border border-zinc-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                    placeholder="Ex: Actero"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-900 mb-2">Email professionnel <span className="text-emerald-500">*</span></label>
                  <input
                    required
                    pattern="^\S+@\S+\.\S+$"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    disabled={isSubmitting}
                    type="email"
                    className="w-full bg-[#FAFAFA] border border-zinc-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                    placeholder="nom@entreprise.com"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button type="button" onClick={closeModal} disabled={isSubmitting} className="px-5 py-3 rounded-xl font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors disabled:opacity-50">
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || brandName.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(contactEmail)}
                    className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm inline-flex items-center justify-center gap-2 min-w-[140px]"
                  >
                    {isSubmitting ? <><span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span> Génération...</> : "Continuer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Footer Light Premium */}
      <footer className="border-t border-zinc-200 bg-white px-4 py-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <Logo light={false} className="w-6 h-6" />
            <span className="text-zinc-900 font-bold tracking-tight">Actero</span>
          </div>
          <div className="text-zinc-500 text-sm font-medium">
            © {new Date().getFullYear()} Actero. Ingénierie de revenus.
          </div>
          <div className="flex gap-6 text-sm font-medium text-zinc-500">
            <button className="hover:text-zinc-900 transition-colors">Mentions légales</button>
            <button className="hover:text-zinc-900 transition-colors">Politique de confidentialité</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ==========================================
// 5. APPLICATION MAIN ROUTER
// ==========================================
function ResetPasswordPage({ onNavigate }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) return setError("Mot de passe trop court (8 caractères min).");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess("✅ Mot de passe mis à jour. Tu peux te connecter.");
      setTimeout(() => onNavigate("/login"), 800);
    } catch (e) {
      setError("Erreur pendant la mise à jour. Réessaie via le lien du mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Nouveau mot de passe</h2>
        <p className="mt-2 text-sm text-zinc-500 font-medium">Choisis un nouveau mot de passe.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200 sm:rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleUpdate}>
            {error && <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{error}</div>}
            {success && <div className="p-4 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-xl border border-emerald-100">{success}</div>}

            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-2">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-[#FAFAFA] border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-2">Confirmer</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="block w-full px-4 py-3 bg-[#FAFAFA] border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Mise à jour..." : "Changer le mot de passe"}
            </button>

            <button
              type="button"
              onClick={() => onNavigate("/login")}
              className="w-full text-center text-sm text-zinc-500 hover:text-zinc-900 font-medium mt-2"
            >
              Retour à la connexion
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
function MainRouter() {
  const [currentRoute, setCurrentRoute] = useState('/');
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          supabase.from('profiles').select('role').eq('id', session.user.id).single()
            .then(({ data }) => {
              if (data) {
                setUserRole(data.role);
                setCurrentRoute((prevRoute) => {
                  const isAuthPage =
                    prevRoute === "/login" ||
                    prevRoute === "/admin" ||
                    prevRoute === "/client";

                  if (isAuthPage) {
                    return data.role === "admin" ? "/admin" : "/client";
                  }
                  return prevRoute;
                });
              }
            });
        }
      });
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash;

    // Supabase met souvent le token dans le hash avec type=recovery
    if (hash.includes("type=recovery")) {
      setCurrentRoute("/reset-password");
    }
  }, []);

  // Démo Login Logic (so you can preview the dashboards in this editor without real DB keys)
  const handleLogin = (role) => {
    setUserRole(role);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUserRole(null);
    setCurrentRoute('/');
  };

  if (currentRoute === '/') {
    return <LandingPage onNavigate={setCurrentRoute} />;
  }

  if (currentRoute === '/login') {
    return <LoginPage onNavigate={setCurrentRoute} onLogin={handleLogin} />;
  }

  if (currentRoute === '/reset-password') {
    return <ResetPasswordPage onNavigate={setCurrentRoute} />;
  }

  if (currentRoute === '/admin' && userRole === 'admin') {
    return <AdminDashboard onNavigate={setCurrentRoute} onLogout={handleLogout} />;
  }

  if (currentRoute === '/client' && userRole === 'client') {
    return <ClientDashboard onNavigate={setCurrentRoute} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-sans">
      <div className="text-center p-8 bg-white border border-zinc-200 rounded-3xl shadow-sm">
        <AlertCircle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Accès restreint</h2>
        <p className="text-zinc-500 font-medium mb-6">Votre session a expiré ou vous n'avez pas les droits.</p>
        <button onClick={() => setCurrentRoute('/login')} className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors">Retourner à la connexion</button>
      </div>
    </div>
  );
}

// ==========================================
// LOAD SUPABASE DYNAMICALLY
// ==========================================

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsReady(true);
      return;
    }

    if (window.supabase) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      setIsReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      setIsReady(true);
    };
    script.onerror = () => {
      console.error("Impossible de charger le script Supabase.");
      setIsReady(true);
    };
    document.head.appendChild(script);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 gap-4 font-sans">
        <svg className="animate-spin h-8 w-8 text-zinc-900" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-zinc-500 font-bold">Connexion sécurisée en cours...</p>
      </div>
    );
  }

  return <MainRouter />;
}