import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, Play, UserX, Database, TrendingDown, ArrowRight, Activity,
  Clock, DollarSign, CheckCircle2, Cpu, BrainCircuit, Server, CreditCard,
  Plus, Minus, Menu, X, LayoutDashboard, Users, Settings, LogOut, FileText,
  LifeBuoy, Search, Filter, MoreVertical, Lock, Mail, AlertCircle, TerminalSquare,
  ArrowUpRight, Download, Sparkles, Bot, Zap, ShoppingCart, MessageSquare,
  Repeat, Target, ShieldCheck, ZapOff, ArrowRightCircle, Copy, RefreshCw,
  Lightbulb, TrendingUp, XCircle, CheckCircle
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
// === DASHBOARD V2 DESIGN START ===
// ==========================================
const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${variants[variant] || variants.gray} ${className}`}>
      {children}
    </span>
  );
};

const StatCard = ({ title, value, icon: Icon, color = 'indigo', subtitleItems = [], className = '' }) => {
  const colors = {
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', val: 'text-indigo-600', hover: 'group-hover:bg-indigo-500/10' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', val: 'text-emerald-600', hover: 'group-hover:bg-emerald-500/10' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', val: 'text-amber-600', hover: 'group-hover:bg-amber-500/10' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-500', val: 'text-gray-900', hover: 'group-hover:bg-gray-500/10' }
  };
  const c = colors[color] || colors.gray;

  return (
    <div className={`bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden group transition-all duration-200 ease-out transform hover:-translate-y-1 hover:shadow-md ${className}`}>
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${c.hover} rounded-full blur-3xl transition-colors`}></div>
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className={`p-2.5 ${c.bg} border ${c.border} ${c.text} rounded-xl`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
      </div>
      <div className={`text-3xl font-bold ${c.val} tracking-tight mb-1 relative z-10 min-h-[36px] flex items-end`}>
        {value}
      </div>
      {subtitleItems.length > 0 && (
        <div className="mt-auto relative z-10 flex items-center gap-2 text-xs font-medium text-gray-500 pt-2">
          {subtitleItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>•</span>}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, description, icon: Icon, action }) => (
  <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-5 h-5 text-indigo-600" />}
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
      </div>
      {description && <p className="text-sm text-gray-500 font-medium">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

const SkeletonRow = ({ height = "h-4", width = "w-full", className = "" }) => (
  <div className={`${height} ${width} bg-gray-100 rounded-md animate-pulse ${className}`}></div>
);
// === DASHBOARD V2 DESIGN END ===

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
    <div className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6 text-gray-900" />
          <span className="font-bold text-lg text-gray-900">Actero Admin</span>
        </div>
        <button className="md:hidden text-gray-500 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(false)}><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <button onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'overview' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><LayoutDashboard className="w-4 h-4" /> Vue Globale</button>
        <button onClick={() => { setActiveTab('clients'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'clients' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><Users className="w-4 h-4" /> Clients</button>
        <button onClick={() => { setActiveTab('automations'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'automations' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><TerminalSquare className="w-4 h-4" /> Infrastructures</button>
        <button onClick={() => { setActiveTab('requests'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'requests' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
          <div className="flex items-center gap-3"><Sparkles className="w-4 h-4" /> Demandes IA</div>
          {requestsData.length > 0 && <span className="bg-emerald-100 text-emerald-700 py-0.5 px-2 rounded-full text-xs font-bold">{requestsData.length}</span>}
        </button>
        <button onClick={() => { setActiveTab('leads'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'leads' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
          <div className="flex items-center gap-3"><Users className="w-4 h-4" /> Leads AI</div>
          {leads.length > 0 && <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-bold">{leads.length}</span>}
        </button>
      </div>
      <div className="p-4 border-t border-gray-200">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"><LogOut className="w-4 h-4" /> Déconnexion</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6 text-gray-900" />
          <span className="font-bold text-lg text-gray-900">Actero Admin</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600"><Menu className="w-6 h-6" /></button>
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Sidebar Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center px-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
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
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Heures Économisées</p>
                  <p className="text-4xl font-bold text-gray-900 font-mono tracking-tighter">4,205 <span className="text-xl font-medium text-gray-400">h</span></p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Valeur Générée (Globale)</p>
                  <p className="text-4xl font-bold text-gray-900 font-mono tracking-tighter">185,400 <span className="text-xl font-medium text-gray-400">€</span></p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Taux de succès global</p>
                  <p className="text-4xl font-bold text-emerald-600 font-mono tracking-tighter">99.8 <span className="text-xl font-medium text-emerald-500">%</span></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="max-w-6xl mx-auto animate-fade-in-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="relative w-full sm:w-auto">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Rechercher un client..." className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm w-full sm:w-80 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                </div>
                <button onClick={handleAddClient} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto justify-center">
                  <Plus className="w-4 h-4" /> Nouveau client
                </button>
              </div>

              {dataLoading ? (
                <div className="flex justify-center items-center py-20">
                  <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
              ) : dataError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" />{dataError}</div>
              ) : clients.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                    <Users className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun client pour le moment</h3>
                  <p className="text-gray-500 font-normal mb-6">Ajoutez votre premier client pour commencer à monitorer son infrastructure.</p>
                  <button onClick={handleAddClient} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Ajouter un client
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Entreprise</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Plan</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Statut</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">CA Généré</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clients.map(client => (
                        <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{client.brand_name}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-500">—</td>
                          <td className="px-6 py-4 text-sm"><span className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg font-bold border border-gray-200">—</span></td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border bg-gray-50 text-gray-500 border-gray-200 opacity-70 cursor-not-allowed" title="Non disponible avec les données actuelles">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              —
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono font-bold text-gray-900">—</td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"><MoreVertical className="w-5 h-5" /></button>
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Leads Capturés</h2>
                <p className="text-gray-500 font-normal mt-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> Contacts intéressés depuis le simulateur d'Architecture IA sur la landing page.</p>
              </div>

              {dataLoading ? (
                <div className="flex justify-center items-center py-20">
                  <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
              ) : dataError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" />{dataError}</div>
              ) : leads.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                    <Users className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun lead pour le moment</h3>
                  <p className="text-gray-500 font-normal mb-6">Patientez jusqu'à ce que de nouveaux prospects soumettent une demande d'Architecture Cible.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Entreprise</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Source</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leads.map(lead => (
                        <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{lead.brand_name}</td>
                          <td className="px-6 py-4 text-sm font-medium text-indigo-600"><a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a></td>
                          <td className="px-6 py-4 text-sm"><Badge variant="gray">{lead.source === 'landing_architecture' ? 'Simulateur IA' : lead.source}</Badge></td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-500">
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
            <div className="max-w-6xl mx-auto animate-fade-in-up">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Demandes d'architecture IA</h2>
                <p className="text-gray-500 font-normal">Projets soumis par vos prospects via le widget de la landing page.</p>
              </div>

              {dataLoading ? (
                <div className="flex justify-center items-center py-20">
                  <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
              ) : dataError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" />{dataError}</div>
              ) : requestsData.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                    <Sparkles className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune demande pour le moment</h3>
                  <p className="text-gray-500 font-normal">Les projets soumis par vos clients apparaîtront ici.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-1/4">Projet</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-1/5">Client</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-1/6">Stack</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-1/6">Statut & Priorité</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-1/6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {requestsData.map(req => (
                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900 mb-1 leading-snug">{req.title || "Projet IA"}</p>
                            <p className="text-xs text-gray-500 font-normal line-clamp-2" title={req.description}>{req.description}</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-700">
                            {req.clients?.brand_name || "Client inconnu"}
                          </td>
                          <td className="px-6 py-4">
                            {req.stack ? (
                              <Badge variant="gray">{req.stack}</Badge>
                            ) : (
                              <span className="text-gray-400 font-bold">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2 items-start">
                              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-lg border border-amber-200">{req.status || "En attente"}</span>
                              {req.priority && <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200 uppercase tracking-wider">{req.priority}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-500">
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
              <Database className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Gestion des Infrastructures</h3>
              <p className="text-gray-500 font-normal max-w-md mx-auto">Cette section vous permettra de connecter l'API n8n pour monitorer tous les workflows actifs de vos clients depuis un seul endroit.</p>
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
// ACTIVITY FEATURE (DASHBOARD)
// ==========================================
const ActivityModal = ({ log, onClose }) => {
  if (!log) return null;
  const copyId = () => navigator.clipboard.writeText(log.id);
  const timeSavedStr = log.time_saved_seconds ? `${Math.round(log.time_saved_seconds / 60)} min` : '-';
  const revStr = log.revenue_amount ? `${Number(log.revenue_amount).toLocaleString('fr-FR')} €` : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 shadow-xl overflow-hidden animate-fade-in-up border border-gray-200">
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100 bg-[#FAFAFA]">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Détail de l'événement</h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 md:p-8 space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">ID Événement</p>
            <div className="flex items-center gap-3">
              <code className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-mono flex-1 truncate border border-gray-100">{log.id}</code>
              <button onClick={copyId} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors shadow-sm" title="Copier l'ID"><Copy className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date d'exécution</p>
              <p className="font-bold text-gray-900">{new Date(log.created_at).toLocaleString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Catégorie</p>
              <Badge variant="gray">{log.event_category || 'N/A'}</Badge>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Type de ticket / Source</p>
              <p className="font-bold text-gray-900">{log.ticket_type || 'Standard'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Temps économisé</p>
              <p className="font-bold text-emerald-600">{timeSavedStr}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Impact (Revenu)</p>
              <p className="font-bold text-amber-600">{revStr}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityView = ({ supabase }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [lastCreatedAt, setLastCreatedAt] = useState(null);

  const [period, setPeriod] = useState('30d');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  // Derive unique categories and types
  const uniqueCategories = [...new Set(logs.map(l => l.event_category).filter(Boolean))];
  const uniqueTypes = [...new Set(logs.map(l => l.ticket_type).filter(Boolean))];

  const fetchActivity = async (isLoadMore = false) => {
    if (!supabase) return;
    setError('');
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      let query = supabase
        .from('automation_events')
        .select('id, event_category, ticket_type, time_saved_seconds, revenue_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      // Period filter
      if (period !== 'all') {
        const date = new Date();
        if (period === '24h') date.setDate(date.getDate() - 1);
        if (period === '7d') date.setDate(date.getDate() - 7);
        if (period === '30d') date.setDate(date.getDate() - 30);
        query = query.gte('created_at', date.toISOString());
      }

      // Categories and types
      if (categoryFilter !== 'all') query = query.eq('event_category', categoryFilter);
      if (typeFilter !== 'all') query = query.eq('ticket_type', typeFilter);

      // Pagination
      if (isLoadMore && lastCreatedAt) {
        query = query.lt('created_at', lastCreatedAt);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      const newLogs = data || [];
      if (isLoadMore) {
        setLogs(prev => [...prev, ...newLogs]);
      } else {
        setLogs(newLogs);
      }

      if (newLogs.length === 50) {
        setHasMore(true);
        setLastCreatedAt(newLogs[49].created_at);
      } else {
        setHasMore(false);
      }

    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération des logs.');
    } finally {
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    setLastCreatedAt(null);
    setHasMore(true);
    fetchActivity(false);
  }, [period, categoryFilter, typeFilter]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 md:p-8 border-b border-gray-100 bg-[#FAFAFA] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Flux de données récent</h3>
          <p className="text-sm text-gray-500 font-medium mt-1">Historique des actions exécutées par l'infrastructure.</p>
        </div>
        <button onClick={() => fetchActivity(false)} className="text-sm font-bold text-gray-600 hover:text-gray-900 flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all text-nowrap disabled:opacity-50" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading && !loadingMore ? 'animate-spin' : ''}`} /> Rafraîchir
        </button>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-600">Filtres :</span>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <option value="24h">Dernières 24h</option>
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="all">Tout l'historique</option>
        </select>

        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none max-w-[200px] truncate shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <option value="all">Toutes les catégories</option>
          {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none max-w-[200px] truncate shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <option value="all">Tous les types</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="py-4 relative min-h-[300px]">
        {error ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
            <p className="text-red-700 font-bold mb-1">Erreur de connexion</p>
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </div>
        ) : loading && logs.length === 0 ? (
          <div className="p-6 md:p-8 space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <SkeletonRow height="h-10" width="w-10" className="rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3 pt-1">
                  <SkeletonRow height="h-4" width="w-1/4" />
                  <SkeletonRow height="h-3" width="w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
              <Activity className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-900 font-bold text-xl mb-2">Aucune activité trouvée</p>
            <p className="text-gray-500 font-medium">Réessayez en modifiant vos filtres.</p>
          </div>
        ) : (
          <>
            <div className="relative border-l border-gray-200 ml-6 md:ml-10 my-4 py-2 space-y-4">
              {logs.map((log) => {
                const savedTime = log.time_saved_seconds ? `${Math.round(log.time_saved_seconds / 60)}m` : '';
                const revenue = log.revenue_amount ? `${Number(log.revenue_amount).toLocaleString('fr-FR')}€` : '';

                return (
                  <div key={log.id} onClick={() => setSelectedLog(log)} className="relative pl-6 md:pl-8 pr-6 md:pr-10 group cursor-pointer animate-fade-in-up">
                    <div className="absolute left-[-5px] top-6 w-2.5 h-2.5 rounded-full bg-gray-200 ring-4 ring-white group-hover:bg-indigo-500 group-hover:ring-indigo-50 transition-all"></div>
                    <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {log.event_category && <Badge variant="gray">{log.event_category}</Badge>}
                          <span className="text-xs font-medium text-gray-400">{new Date(log.created_at).toLocaleString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-base font-bold text-gray-900 truncate mb-2 leading-snug">
                          {log.ticket_type || "Exécution standard du flux"}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                          {savedTime && <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md"><Clock className="w-3.5 h-3.5" /> <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Gagnées:</span> {savedTime}</span>}
                          {revenue && <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md"><DollarSign className="w-3.5 h-3.5" /> <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Impact:</span> {revenue}</span>}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-gray-300 group-hover:text-indigo-600 transition-colors mt-2">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="p-6 md:p-8 flex justify-center border-t border-gray-100 bg-[#FAFAFA]">
                <button
                  onClick={() => fetchActivity(true)}
                  disabled={loadingMore}
                  className="bg-white border border-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? <span className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></span> : "Charger les événements précédents"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedLog && <ActivityModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
};

// ==========================================
// INTELLIGENCE FEATURE START
// ==========================================
// === EXECUTION PLAN DRAWER START ===
const ExecutionPlanDrawer = ({ reco, onClose, onImplement, supabase, onNavigateToActivity }) => {
  const [loading, setLoading] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);

  // Fetch contextual events only if implementation has started
  useEffect(() => {
    let interval;
    if (startedAt) {
      const fetchRecentEvents = async () => {
        const { data } = await supabase
          .from('automation_events')
          .select('id, event_category, ticket_type, created_at, time_saved_seconds')
          .gte('created_at', startedAt)
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) setRecentEvents(data);
      };

      fetchRecentEvents();
      interval = setInterval(fetchRecentEvents, 5000);
    }
    return () => clearInterval(interval);
  }, [startedAt, supabase]);

  const handleImplementClick = async () => {
    setLoading(true);
    await onImplement(reco.id, 'implemented');
    setStartedAt(new Date().toISOString());
    setLoading(false);
  };

  if (!reco) return null;

  // Generate copy steps based on category (pure UI copy, no mocked business data)
  const steps = {
    growth: [
      { title: "Acquisition", desc: "Configuration des nouveaux canaux d'acquisition ciblés." },
      { title: "Conversion", desc: "Déploiement des stratégies d'optimisation du taux de conversion." },
      { title: "Analyse", desc: "Mise en place des trackers de performance de croissance." }
    ],
    efficiency: [
      { title: "Analyse des processus", desc: "Identification des goulots d'étranglement actuels." },
      { title: "Automatisation", desc: "Connexion et automatisation des flux de travail chronophages." },
      { title: "Monitoring", desc: "Surveillance continue des gains d'efficacité." }
    ],
    risk: [
      { title: "Audit de sécurité", desc: "Identification des failles et vulnérabilités potentielles." },
      { title: "Mise en place de garde-fous", desc: "Déploiement des règles de mitigation des risques." },
      { title: "Alerting", desc: "Configuration des notifications d'anomalies en temps réel." }
    ],
    automation: [
      { title: "Cartographie du workflow", desc: "Définition des déclencheurs et actions automatisées." },
      { title: "Intégrations requises", desc: "Connexion sécurisée aux outils tiers." },
      { title: "Assurance Qualité (QA)", desc: "Tests approfondis des scénarios d'automatisation." }
    ],
    all: [
      { title: "Initialisation", desc: "Préparation de l'environnement d'exécution." },
      { title: "Déploiement", desc: "Mise en oeuvre des recommandations de l'IA." },
      { title: "Surveillance", desc: "Suivi des impacts post-déploiement." }
    ]
  };

  const planSteps = steps[reco.category] || steps.all;
  const isStarted = !!startedAt;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[540px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 overflow-y-auto border-l border-gray-200">

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
          <div className="flex items-center gap-3 text-gray-900 font-bold">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl tracking-tight">Plan d'exécution IA</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 border border-gray-200 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex-1 flex flex-col gap-8 animate-fade-in-up font-light text-gray-600">

          {/* Section A: Résumé */}
          <section>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200 mb-4 inline-block uppercase tracking-widest">
              Contexte de l'action
            </span>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight tracking-tight">{reco.title}</h3>
            <p className="text-sm font-normal text-gray-500 leading-relaxed mb-6">{reco.description}</p>

            <div className="flex gap-4 p-5 rounded-2xl bg-[#FAFAFA] border border-gray-100">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Score d'impact IA</p>
                <span className="text-2xl font-black text-gray-900">{reco.impact_score}<span className="text-sm font-bold text-gray-400">/100</span></span>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Catégorie</p>
                <span className="text-sm font-bold text-gray-900 capitalize">{reco.category}</span>
              </div>
            </div>
          </section>

          {/* Section B: Gains */}
          {((reco.estimated_time_gain_minutes > 0) || (reco.estimated_revenue_gain > 0)) && (
            <section>
              <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Gains Stratégiques Estimés</h4>
              <div className="grid grid-cols-2 gap-4">
                {reco.estimated_time_gain_minutes > 0 && (
                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex flex-col">
                    <Clock className="w-5 h-5 text-emerald-500 mb-2" />
                    <span className="text-xl font-bold text-emerald-700">+{Math.round(reco.estimated_time_gain_minutes / 60)}h<span className="text-sm font-normal text-emerald-600">/mois</span></span>
                  </div>
                )}
                {reco.estimated_revenue_gain > 0 && (
                  <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex flex-col">
                    <TrendingUp className="w-5 h-5 text-amber-500 mb-2" />
                    <span className="text-xl font-bold text-amber-700">+{Number(reco.estimated_revenue_gain).toLocaleString('fr-FR')}€</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section D: Étapes Copy UI */}
          <section className="relative">
            <h4 className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">Protocoles d'implémentation</h4>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-gray-200 before:to-transparent">
              {planSteps.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 z-10 text-gray-400 font-bold text-sm shadow-sm mt-1">
                    {idx + 1}
                  </div>
                  <div className="bg-white border border-gray-100 p-4 rounded-2xl flex-1 shadow-sm mt-1">
                    <h5 className="font-bold text-gray-900 mb-1 leading-tight">{step.title}</h5>
                    <p className="text-sm font-normal text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Timeline Contextuelle (Après clic implémenter) */}
          {isStarted && (
            <section className="mt-4 bg-gray-900 rounded-3xl p-6 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Realtime
                </span>
              </div>
              <h4 className="text-lg font-bold mb-2">Exécution en cours</h4>
              <p className="text-sm text-gray-400 font-normal mb-6">Les agents parcourent l'infrastructure actuellement.</p>

              {recentEvents.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <RefreshCw className="w-6 h-6 text-gray-500 animate-spin mb-3" />
                  <p className="text-sm font-bold text-gray-500">En attente des premiers signaux n8n...</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {recentEvents.map((evt, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between text-sm animate-fade-in-up">
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-gray-200">{evt.event_category} / {evt.ticket_type}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">Il y a quelques secondes</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => { onClose(); onNavigateToActivity(); }}
                className="w-full bg-white text-gray-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
              >
                Voir l'activité en direct <ArrowRight className="w-4 h-4" />
              </button>
            </section>
          )}

        </div>

        {/* Footer actions */}
        {!isStarted && (
          <div className="p-6 md:p-8 border-t border-gray-200 bg-[#FAFAFA] flex flex-col sm:flex-row gap-3 sticky bottom-0 z-10">
            <button
              disabled={loading}
              onClick={handleImplementClick}
              className="flex-1 bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <span className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></span> : <Bot className="w-5 h-5" />}
              Implémenter maintenant
            </button>
            <button
              disabled={loading}
              onClick={onClose}
              className="flex-1 sm:flex-none bg-white text-gray-600 font-bold py-3.5 px-6 rounded-xl border border-gray-200 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </>
  );
};
// === EXECUTION PLAN DRAWER END ===

const RecommendationCard = ({ reco, onAction, onOpenPlan }) => {
  const [loadingAction, setLoadingAction] = useState(false);

  const handleAction = async (status) => {
    setLoadingAction(true);
    await onAction(reco.id, status);
    setLoadingAction(false);
  };

  const priorityVariants = {
    high: 'red',
    medium: 'amber',
    low: 'emerald'
  };

  const categoryLabels = {
    growth: 'Croissance',
    efficiency: 'Efficacité',
    risk: 'Risque',
    automation: 'Automatisation',
    all: 'Toutes les catégories'
  };

  const impactColor = reco.impact_score >= 80 ? 'bg-emerald-500' : reco.impact_score >= 50 ? 'bg-amber-500' : 'bg-gray-400';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6 transition-all hover:shadow-md relative overflow-hidden group">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant={priorityVariants[reco.priority_level] || 'amber'}>
              Priorité {reco.priority_level === 'high' ? 'Haute' : reco.priority_level === 'medium' ? 'Moyenne' : 'Basse'}
            </Badge>
            {reco.category && (
              <Badge variant="gray">
                {categoryLabels[reco.category] || reco.category}
              </Badge>
            )}
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-auto md:ml-0">
              {new Date(reco.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2 leading-tight tracking-tight">{reco.title}</h4>
          <p className="text-sm font-medium text-gray-500 line-clamp-2 md:line-clamp-none leading-relaxed mb-6">{reco.description}</p>

          <div className="flex flex-wrap items-center gap-6 mb-2">
            <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Impact</p>
                <span className="text-sm font-bold text-gray-900 leading-none">{reco.impact_score}/100</span>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                <div className={`h-full rounded-full ${impactColor}`} style={{ width: `${Math.min(100, reco.impact_score)}%` }}></div>
              </div>
            </div>

            {reco.estimated_time_gain_minutes > 0 && (
              <div className="flex flex-col justify-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gain de temps</p>
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> +{Math.round(reco.estimated_time_gain_minutes / 60)}h/mois
                </p>
              </div>
            )}
            {reco.estimated_revenue_gain > 0 && (
              <div className="flex flex-col justify-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Impact CA</p>
                <p className="text-sm font-bold text-amber-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> +{Number(reco.estimated_revenue_gain).toLocaleString('fr-FR')}€
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {reco.status === 'active' && (
        <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center gap-3">
          <button
            disabled={loadingAction}
            onClick={() => handleAction('implemented')}
            className="flex-1 lg:flex-none text-sm font-bold bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingAction ? <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span> : <CheckCircle className="w-4 h-4" />} Implémenter
          </button>
          {onOpenPlan && (
            <button
              disabled={loadingAction}
              onClick={() => onOpenPlan(reco)}
              className="flex-1 lg:flex-none text-sm font-bold bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Voir le plan <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            disabled={loadingAction}
            onClick={() => handleAction('dismissed')}
            className="flex-1 lg:flex-none text-sm font-bold bg-white text-gray-500 border border-transparent px-4 py-2.5 rounded-xl hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 lg:ml-auto"
          >
            {loadingAction ? <span className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></span> : <XCircle className="w-4 h-4" />} Ignorer
          </button>
        </div>
      )}
      {reco.status !== 'active' && (
        <div className="pt-5 border-t border-gray-100 flex items-center gap-2 text-sm font-bold text-gray-400">
          <CheckCircle className="w-4 h-4" /> {reco.status === 'implemented' ? 'Marqué comme implémenté' : 'Recommandation ignorée'}
        </div>
      )}
    </div>
  );
};

const IntelligenceView = ({ supabase, setActiveTab }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('impact'); // impact or recent
  const [actionError, setActionError] = useState('');

  // Execution Plan Drawer state
  const [selectedPlanReco, setSelectedPlanReco] = useState(null);

  const fetchRecommendations = async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    setActionError('');
    try {
      let query = supabase
        .from('ai_recommendations')
        .select('id, client_id, title, description, category, priority_level, impact_score, estimated_time_gain_minutes, estimated_revenue_gain, status, created_at, updated_at, expires_at')
        .eq('status', statusFilter)
        .limit(50);

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (sortBy === 'impact') {
        query = query.order('impact_score', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      setRecommendations(data || []);
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération des recommandations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [statusFilter, categoryFilter, sortBy]);

  const handleAction = async (id, newStatus) => {
    try {
      setActionError('');
      // Call RPC only (no fallback to update the table directly)
      const { error: rpcErr } = await supabase.rpc('mark_ai_recommendation', { p_id: id, p_status: newStatus });

      if (rpcErr) {
        throw rpcErr;
      }

      // Success, remove from active list if filter is active
      if (statusFilter === 'active') {
        setRecommendations(prev => prev.filter(r => r.id !== id));
      } else {
        // Just refresh list
        await fetchRecommendations();
      }
    } catch (err) {
      setActionError(err.message || 'Une erreur est survenue lors de la mise à jour.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-zinc-100 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shadow-sm">
                <Lightbulb className="w-5 h-5 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Intelligence & Recommandations</h3>
            </div>
            <p className="text-sm text-zinc-300 font-medium max-w-xl">L'IA analyse vos flux de données en continu pour identifier des optimisations de croissance, d'efficacité et des correctifs applicatifs.</p>
          </div>
          <button onClick={() => fetchRecommendations()} disabled={loading} className="text-sm font-bold text-zinc-900 bg-white hover:bg-zinc-100 px-4 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Rafraîchir
          </button>
        </div>

        <div className="px-6 py-4 bg-white border-b border-zinc-100 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-bold text-zinc-600">Filtrer par :</span>
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-zinc-50 border border-zinc-200 text-zinc-700 text-sm font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-zinc-900 outline-none">
            <option value="active">À traiter</option>
            <option value="implemented">Implémentées</option>
            <option value="dismissed">Ignorées</option>
          </select>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-zinc-50 border border-zinc-200 text-zinc-700 text-sm font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-zinc-900 outline-none">
            <option value="all">Toutes les catégories</option>
            <option value="growth">Croissance</option>
            <option value="efficiency">Efficacité</option>
            <option value="risk">Risque</option>
            <option value="automation">Automatisation</option>
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-zinc-50 border border-zinc-200 text-zinc-700 text-sm font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-zinc-900 outline-none ml-auto">
            <option value="impact">Trier par: Impact (Haut &rarr; Bas)</option>
            <option value="recent">Trier par: Plus récentes</option>
          </select>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start gap-3 animate-pulse">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{actionError}</p>
        </div>
      )}

      {error ? (
        <div className="p-10 bg-white border border-red-100 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
          <p className="text-red-900 font-bold mb-1">Erreur de connexion</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : loading && recommendations.length === 0 ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm animate-pulse h-48 flex flex-col gap-4">
              <div className="h-6 bg-zinc-100 rounded w-1/4"></div>
              <div className="h-4 bg-zinc-100 rounded w-3/4 mt-2"></div>
              <div className="h-4 bg-zinc-100 rounded w-1/2"></div>
              <div className="mt-auto flex gap-4">
                <div className="h-10 bg-zinc-100 rounded w-32"></div>
                <div className="h-10 bg-zinc-100 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
            <Lightbulb className="w-10 h-10 text-emerald-400" />
          </div>
          <p className="text-zinc-900 font-bold text-xl mb-2">Tout est optimisé</p>
          <p className="text-zinc-500 font-medium max-w-md">L'IA n'a pas de nouvelle recommandation à proposer pour le moment avec ces critères de recherche.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          {recommendations.map((reco) => (
            <RecommendationCard
              key={reco.id}
              reco={reco}
              onAction={handleAction}
              onOpenPlan={setSelectedPlanReco}
            />
          ))}
        </div>
      )}

      {selectedPlanReco && (
        <ExecutionPlanDrawer
          reco={selectedPlanReco}
          supabase={supabase}
          onClose={() => setSelectedPlanReco(null)}
          onImplement={handleAction}
          onNavigateToActivity={() => setActiveTab('activity')}
        />
      )}
    </div>
  );
};
// ==========================================
// INTELLIGENCE FEATURE END
// ==========================================

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
        <div className="bg-white border border-gray-200 p-12 rounded-3xl shadow-sm text-center max-w-lg">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
            <Lock className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Aucun client associé</h2>
          <p className="text-gray-500 font-normal mb-8 leading-relaxed">Votre compte n'est pas encore lié à une infrastructure client. Veuillez contacter votre administrateur pour configurer votre espace.</p>
          <div className="flex flex-col gap-3">
            <a href="mailto:support@actero.io" className="bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">
              Contacter Actero
            </a>
            <button onClick={onLogout} className="text-gray-500 hover:text-gray-900 font-bold py-3 transition-colors">
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
        <button onClick={() => { setActiveTab('intelligence'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'intelligence' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}><Lightbulb className="w-4 h-4" /> Intelligence</button>
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
        {/* Command Center Sticky Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
              {activeTab === 'overview' && "Vue d'ensemble"}
              {activeTab === 'requests' && "Mes demandes"}
              {activeTab === 'architect' && "Architecte IA"}
              {activeTab === 'activity' && "Activité temps réel"}
              {activeTab === 'systems' && "Mes Systèmes"}
              {activeTab === 'reports' && "Rapports & Exports"}
              {activeTab === 'intelligence' && "Intelligence"}
            </h1>

            <div className="hidden lg:flex items-center gap-3">
              <Badge variant="emerald" className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Opérationnel
              </Badge>
              <div className="h-4 w-px bg-gray-200 mx-1"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-gray-900"><AnimatedCounter value={metrics ? Math.round(metrics.time_saved_minutes / 60) : 0} />h <span className="text-gray-500 font-medium font-normal">/mois</span></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-bold text-gray-900"><AnimatedCounter value={metrics?.estimated_roi || 0} />€ <span className="text-gray-500 font-medium font-normal">/mois</span></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-xs font-bold text-gray-900"><AnimatedCounter value={metrics?.active_automations || 0} /> <span className="text-gray-500 font-medium font-normal">actifs</span></span>
              </div>
            </div>
          </div>

          <button onClick={() => setActiveTab('activity')} className="text-sm font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-2 transition-colors">
            Voir l'activité <ArrowRight className="w-4 h-4" />
          </button>
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
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-pulse flex flex-col justify-between h-40">
                      <div className="flex items-center gap-3">
                        <SkeletonRow height="h-10" width="w-10" className="rounded-xl flex-shrink-0" />
                        <div className="flex-1">
                          <SkeletonRow height="h-3" width="w-2/3" className="mb-2" />
                          <SkeletonRow height="h-3" width="w-1/3" />
                        </div>
                      </div>
                      <SkeletonRow height="h-8" width="w-1/2" />
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
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                    <Activity className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Metrics à venir</h3>
                  <p className="text-gray-500 font-normal">Les premières métriques apparaîtront bientôt dès que vos workflows seront pleinement opérationnels.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard
                    title="Temps économisé"
                    value={<AnimatedCounter value={Math.round(metrics.time_saved_minutes / 60)} suffix="h" />}
                    icon={Clock}
                    color="emerald"
                    subtitleItems={["Équivalent en temps humain", "Ce mois-ci"]}
                  />
                  <StatCard
                    title="ROI Généré"
                    value={<AnimatedCounter value={metrics.estimated_roi} suffix="€" />}
                    icon={DollarSign}
                    color="amber"
                    subtitleItems={["Valeur métier estimée"]}
                  />
                  <StatCard
                    title="Automatisations actives"
                    value={<AnimatedCounter value={metrics.active_automations} />}
                    icon={Activity}
                    color="emerald"
                    subtitleItems={["Workflows surveillés 24/7"]}
                  />
                  <StatCard
                    title="Tâches automatisées"
                    value={<AnimatedCounter value={metrics.tasks_executed} />}
                    icon={TerminalSquare}
                    color="indigo"
                    subtitleItems={["Actions réussies", "Ce mois-ci"]}
                  />
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
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                    <FileText className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune demande pour l'instant</h3>
                  <p className="text-gray-500 font-normal mb-6">Soumettez votre premier projet à notre équipe d'architectes IA.</p>
                  <button onClick={() => setActiveTab('architect')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
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
                // Keep minimal fallback if no Supabase
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                    <Activity className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Flux de synchronisation</h3>
                  <p className="text-gray-500 font-normal">Les logs de vos automatisations apparaîtront ici prochainement.</p>
                </div>
              ) : (
                <ActivityView supabase={supabase} />
              )}
            </div>
          )}

          {activeTab === 'intelligence' && (
            <div className="max-w-4xl mx-auto animate-fade-in-up">
              {!isSupabaseConfigured ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                    <Lightbulb className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Intelligence Actero</h3>
                  <p className="text-gray-500 font-normal">L'IA est en cours d'analyse de vos processus.</p>
                </div>
              ) : (
                <IntelligenceView supabase={supabase} setActiveTab={setActiveTab} />
              )}
            </div>
          )}

          {activeTab === 'systems' && (
            <div className="max-w-5xl mx-auto animate-fade-in-up">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Vos infrastructures actives</h2>
              {!isSupabaseConfigured ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { name: "Récupération Paniers Abandonnés", desc: "Séquence dynamique Shopify -> Klaviyo", status: "Actif", runs: "1,240 exécutions" },
                    { name: "Support IA Niveau 1", desc: "Analyse des emails SAV et réponse automatique", status: "Actif", runs: "3,102 exécutions" },
                    { name: "Synchronisation Comptable", desc: "Stripe -> Quickbooks (Quotidien)", status: "Actif", runs: "30 exécutions" },
                  ].map((sys, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm relative hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                          <Database className="w-6 h-6 text-gray-600" />
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

// === LANDING V2 START ===
const LandingPage = ({ onNavigate }) => {
  // --- États pour l'interaction IA ---
  const [aiInput, setAiInput] = useState("");
  const [platform, setPlatform] = useState("Shopify");
  const [objective, setObjective] = useState("Conversion");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState("");

  // --- Modal AI Lead ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (brandName.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(contactEmail)) return;
    setIsSubmitting(true);

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
    generateAIAudit();
  };

  const generateAIAudit = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiResult(null);

    const fullPrompt = `Plateforme: ${platform}, Objectif: ${objective}. Problème e-commerce: "${aiInput}"`;

    const payload = {
      contents: [{ parts: [{ text: fullPrompt }] }],
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
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900 selection:bg-emerald-500/20 selection:text-gray-900">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-[#FAFAFA]/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <Logo light={false} className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight text-gray-900">Actero</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('/login')}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Connexion
            </button>
            <button
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              className="text-sm bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Demander un audit
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* 1. HERO SECTION */}
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden flex flex-col items-center px-6">
          <div className="max-w-5xl mx-auto w-full flex flex-col lg:flex-row items-center gap-16">

            {/* Left Column (Text & CTAs) */}
            <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-semibold text-gray-600 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Infrastructure E-commerce Autonome
              </div>

              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-6 leading-[1.1]">
                Automatisez votre e-commerce.<br />
                Gagnez du temps.<br />
                Augmentez votre ROI.
              </h1>

              <p className="text-base md:text-lg text-gray-500 max-w-lg mb-10 leading-relaxed">
                Actero détecte, recommande et exécute automatiquement les optimisations à fort impact pour votre boutique.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2 group w-full sm:w-auto"
                >
                  Demander un audit gratuit
                </button>
                <a
                  href="#comment-ca-marche"
                  className="bg-white border border-gray-200 text-gray-900 px-8 py-4 rounded-xl font-semibold text-base hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  Voir comment ça fonctionne
                </a>
              </div>
            </div>

            {/* Right Column (Mockup Desktop) */}
            <div className="hidden lg:flex flex-1 w-full max-w-md relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>

              <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-6 relative z-10 hover:shadow-2xl transition-shadow duration-500">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                  <div className="flex gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                  </div>
                  <div className="text-xs font-semibold text-gray-400">app.actero.io/dashboard</div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Impact Automatisations</p>
                    <p className="text-3xl font-bold text-gray-900 tracking-tight">+14 280 €</p>
                    <p className="text-xs font-medium text-emerald-500 mt-1">Générés ce mois-ci via relances</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-indigo-50/50 transition-colors">
                      <ShoppingCart className="w-5 h-5 text-indigo-400 mb-2" />
                      <p className="text-xs text-gray-500 font-medium">Paniers sauvés</p>
                      <p className="text-lg font-bold text-gray-900">184</p>
                    </div>
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-emerald-50/50 transition-colors">
                      <Clock className="w-5 h-5 text-emerald-400 mb-2" />
                      <p className="text-xs text-gray-500 font-medium">Heures gagnées</p>
                      <p className="text-lg font-bold text-gray-900">42h</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]"></div>
                        <span className="text-xs font-semibold text-gray-600">3 workflows actifs</span>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600">En direct</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 2. SECTION "Comment ça fonctionne" */}
        <section id="comment-ca-marche" className="py-24 bg-white border-y border-gray-200 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-semibold text-center text-gray-900 mb-16 tracking-tight">Comment ça fonctionne</h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Search className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />,
                  title: "1. Analyse automatique",
                  desc: "Connectez vos outils. Actero scanne vos flux en continu pour identifier les pertes de chiffre d'affaires (paniers, rétention)."
                },
                {
                  icon: <BrainCircuit className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />,
                  title: "2. Recommandations IA",
                  desc: "Notre moteur génère des stratégies concrètes, calquées sur vos données, pour combler ces pertes."
                },
                {
                  icon: <Zap className="w-6 h-6 text-gray-600 group-hover:text-amber-500 transition-colors" />,
                  title: "3. Exécution temps réel",
                  desc: "Un clic suffit pour déployer les automatisations. Actero s'occupe de la technique en arrière-plan."
                }
              ].map((step, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-300 relative group -translate-y-0 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-colors">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-base text-gray-600 leading-relaxed font-medium">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === AI ROI SIMULATOR (RESTORED) START === */}
        <section className="py-16 bg-white px-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-8 text-center md:text-left">
                <h2 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
                  Simulez votre ROI en 30 secondes
                </h2>
                <p className="text-gray-500 font-medium">
                  Décrivez votre boutique et recevez un plan d’automatisation + estimation ROI.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                {/* Form */}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Plateforme</label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm font-medium text-gray-900"
                      >
                        <option>Shopify</option>
                        <option>WooCommerce</option>
                        <option>Prestashop</option>
                        <option>Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Objectif principal</label>
                      <select
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm font-medium text-gray-900"
                      >
                        <option>Conversion</option>
                        <option>Support Client</option>
                        <option>Opérations</option>
                        <option>Acquisition</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Problème ou goulot d'étranglement</label>
                    <textarea
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Ex: Mon équipe support perd 10h par semaine à chercher le statut des commandes..."
                      className="w-full h-32 bg-[#FAFAFA] border border-gray-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-sm font-medium text-gray-900 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleOpenModal}
                    disabled={aiLoading || !aiInput.trim()}
                    className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <><svg className="animate-spin h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyse en cours...</>
                    ) : (
                      <><Bot className="w-5 h-5" /> Générer mon audit</>
                    )}
                  </button>
                  {aiError && <p className="text-red-500 text-sm mt-2 flex items-center gap-2 font-semibold"><AlertCircle className="w-4 h-4" />{aiError}</p>}
                </div>

                {/* Result area */}
                <div className="h-full min-h-[300px]">
                  {!aiResult && !aiLoading ? (
                    <div className="h-full bg-[#FAFAFA] border border-gray-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center">
                      <Database className="w-10 h-10 text-gray-300 mb-4" />
                      <p className="text-gray-500 font-semibold text-sm">Le plan d'automatisation sur-mesure<br />s'affichera ici.</p>
                    </div>
                  ) : aiLoading ? (
                    <div className="h-full bg-indigo-50/50 border border-indigo-100 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                      <Cpu className="w-12 h-12 text-indigo-500 mb-6 animate-pulse" />
                      <p className="text-indigo-700 font-semibold text-sm">Déduction des workflows et calcul du ROI...</p>
                    </div>
                  ) : aiResult ? (
                    <div className="h-full bg-[#FAFAFA] border border-gray-200 rounded-xl p-6 md:p-8 flex flex-col animate-fade-in-up">
                      <div className="mb-5">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">Diagnostic</h4>
                        <p className="text-gray-900 font-semibold text-sm leading-snug">{aiResult.diagnosis}</p>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-amber-500" /> Flux Recommandé</h4>
                        <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                          <p className="text-gray-600 text-sm font-medium leading-relaxed">{aiResult.solution}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-auto">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                          <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">Gain de temps</p>
                          <p className="text-emerald-700 font-bold text-lg">{aiResult.timeSaved}</p>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                          <p className="text-[9px] font-bold text-indigo-600 uppercase mb-1">Impact ROI</p>
                          <p className="text-indigo-700 font-bold text-lg">{aiResult.revenueImpact}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* === AI ROI SIMULATOR (RESTORED) END === */}

        {/* 3. SECTION ROI / METRICS */}
        <section className="py-24 bg-white px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <div className="py-6 md:py-0 hover:scale-105 transition-transform duration-300">
                <p className="text-5xl font-bold text-gray-900 tracking-tighter mb-2">+120h</p>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Temps gagné / mois</p>
              </div>
              <div className="py-6 md:py-0 hover:scale-105 transition-transform duration-300">
                <p className="text-5xl font-bold text-gray-900 tracking-tighter mb-2">+18%</p>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Augmentation moy. conversion</p>
              </div>
              <div className="py-6 md:py-0 hover:scale-105 transition-transform duration-300">
                <p className="text-5xl font-bold text-gray-900 tracking-tighter mb-2">100%</p>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Recommandations exécutables</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SECTION PREUVE / POSITIONNEMENT */}
        <section className="py-24 bg-[#FAFAFA] border-y border-gray-200 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-12 tracking-tight">
              Une plateforme pensée pour les e-commerçants ambitieux
            </h2>

            <div className="space-y-6 text-left max-w-xl mx-auto">
              {[
                { icon: <Database />, text: "Automatisations basées sur vos données réelles." },
                { icon: <TrendingUp />, text: "Mesure du ROI en temps réel." },
                { icon: <Server />, text: "Exécution sécurisée via infrastructure robuste." }
              ].map((bullet, i) => (
                <div key={i} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                    {bullet.icon}
                  </div>
                  <p className="text-lg font-medium text-gray-900">{bullet.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. SECTION CTA FINAL */}
        <section className="py-32 px-6 bg-indigo-50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-100 via-transparent to-transparent"></div>
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-4xl font-semibold text-gray-900 mb-6 tracking-tight">
              Prêt à accélérer votre croissance ?
            </h2>
            <p className="text-lg font-medium text-gray-600 mb-10">
              Planifiez un appel stratégique pour échanger sur vos objectifs et voir si l'automatisation est faite pour vous.
            </p>
            <a
              href="https://calendly.com/jc6pablo2/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg group scale-100 hover:scale-105 duration-300"
            >
              Planifier un appel stratégique
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </section>
      </main>

      {/* Modal Lead IA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={!isSubmitting ? closeModal : undefined}></div>
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up z-10 border border-gray-100">
            <button onClick={closeModal} disabled={isSubmitting} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">Dernière étape</h3>
            <p className="text-gray-500 font-medium text-sm mb-6">Laissez-nous vos coordonnées pour générer votre architecture cible personnalisée.</p>

            <form onSubmit={handleModalSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Nom de l'entreprise <span className="text-emerald-500">*</span></label>
                <input
                  required
                  minLength={2}
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  disabled={isSubmitting}
                  type="text"
                  className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                  placeholder="Ex: Actero"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email professionnel <span className="text-emerald-500">*</span></label>
                <input
                  required
                  pattern="^\S+@\S+\.\S+$"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  disabled={isSubmitting}
                  type="email"
                  className="w-full bg-[#FAFAFA] border border-gray-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                  placeholder="nom@entreprise.com"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-3">
                <button type="button" onClick={closeModal} disabled={isSubmitting} className="px-5 py-3 rounded-xl font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || brandName.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(contactEmail)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm inline-flex items-center justify-center gap-2 min-w-[140px]"
                >
                  {isSubmitting ? <><svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Génération...</> : "Voir l'audit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo light={false} className="w-6 h-6" />
            <span className="font-bold tracking-tight text-gray-900">Actero</span>
          </div>
          <p className="text-sm font-medium text-gray-500">
            © {new Date().getFullYear()} Actero. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm font-medium text-gray-500">
            <button className="hover:text-gray-900 transition-colors">Mentions légales</button>
            <button className="hover:text-gray-900 transition-colors">Confidentialité</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
// === LANDING V2 END ===

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