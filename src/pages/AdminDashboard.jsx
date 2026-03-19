import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Search,
  Plus,
  AlertCircle,
  Users,
  LayoutDashboard,
  TerminalSquare,
  Sparkles,
  MoreVertical,
  Bot,
  Link2,
  ShoppingCart,
  Home,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  Settings,
  Eye
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AdminClientSettingsModal } from '../components/admin/AdminClientSettingsModal'
import { Logo } from '../components/layout/Logo'
import { Sidebar } from '../components/layout/Sidebar'
import { CommandKModal } from '../components/layout/CommandKModal'
import { AdminActivityHeatmap } from '../components/admin/AdminActivityHeatmap'
import { AdminKanbanBoard } from '../components/admin/AdminKanbanBoard'
import { AdminFunnelView } from '../components/admin/AdminFunnelView'
import { AnimatedCounter } from '../components/ui/animated-counter'
import { IntelligenceView } from '../components/dashboard/IntelligenceView'

export const AdminDashboard = ({ onNavigate, onLogout, currentRoute }) => {
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandKOpen, setIsCommandKOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const getAdminTabFromRoute = (route) => {
    if (route === "/admin/clients") return "clients";
    if (route === "/admin/requests") return "requests";
    if (route === "/admin/leads") return "leads";
    if (route === "/admin/intelligence") return "intelligence";
    if (route === "/admin/funnel") return "funnel";
    return "overview";
  };

  const activeTab = getAdminTabFromRoute(currentRoute);
  
  const setActiveTab = (tab) => {
    const route = tab === "overview" ? "/admin" : `/admin/${tab}`;
    onNavigate(route);
  };

  // Command-K Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandKOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetching Data with React Query
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      // Fetch clients with settings
      const { data: clientsData, error } = await supabase
        .from("clients")
        .select("*, client_settings(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch aggregated metrics for each client
      const enriched = await Promise.all((clientsData || []).map(async (client) => {
        // Get total metrics
        const { data: metrics } = await supabase
          .from("metrics_daily")
          .select("hours_saved, money_saved, revenue_recovered, tickets_total, tickets_auto, tickets_escalated")
          .eq("client_id", client.id);

        // Get event count
        const { count: eventCount } = await supabase
          .from("automation_events")
          .select("id", { count: "exact", head: true })
          .eq("client_id", client.id);

        // Get last event date
        const { data: lastEvent } = await supabase
          .from("automation_events")
          .select("created_at")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })
          .limit(1);

        // Get owner email
        let ownerEmail = null;
        try {
          const { data: ownerUser } = await supabase
            .from("client_users")
            .select("user_id")
            .eq("client_id", client.id)
            .eq("role", "owner")
            .limit(1)
            .maybeSingle();

          if (ownerUser?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", ownerUser.user_id)
              .maybeSingle();
            ownerEmail = profile?.email || null;
          }
        } catch (e) {
          // Silently skip if email lookup fails
        }

        const totals = (metrics || []).reduce((acc, m) => ({
          hours_saved: acc.hours_saved + (parseFloat(m.hours_saved) || 0),
          money_saved: acc.money_saved + (parseFloat(m.money_saved) || 0),
          revenue_recovered: acc.revenue_recovered + (parseFloat(m.revenue_recovered) || 0),
          tickets_total: acc.tickets_total + (parseInt(m.tickets_total) || 0),
          tickets_auto: acc.tickets_auto + (parseInt(m.tickets_auto) || 0),
          tickets_escalated: acc.tickets_escalated + (parseInt(m.tickets_escalated) || 0),
        }), { hours_saved: 0, money_saved: 0, revenue_recovered: 0, tickets_total: 0, tickets_auto: 0, tickets_escalated: 0 });

        const autoRate = totals.tickets_total > 0
          ? Math.round((totals.tickets_auto / totals.tickets_total) * 100)
          : 0;

        return {
          ...client,
          ownerEmail,
          totals,
          autoRate,
          eventCount: eventCount || 0,
          lastEventAt: lastEvent?.[0]?.created_at || null,
          daysActive: metrics?.length || 0,
        };
      }));

      return enriched;
    }
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("id, client_id, title, description, stack, priority, status, created_at, clients(brand_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const isLoading = clientsLoading || requestsLoading || leadsLoading;

  const sidebarItems = [
    { id: "overview", label: "Vue Globale", icon: LayoutDashboard },
    { id: "clients", label: "Clients", icon: Users },
    { id: "requests", label: "Demandes IA", icon: Sparkles, badge: requests.length > 0 ? requests.length : null, badgeColor: "bg-emerald-100 text-emerald-700" },
    { id: "intelligence", label: "Intelligence", icon: Bot },
    { id: "leads", label: "Leads AI", icon: Users, badge: leads.length > 0 ? leads.length : null, badgeColor: "bg-blue-100 text-blue-700" },
    { id: "funnel", label: "Funnel", icon: Link2 },
  ];

  const handleAddClient = async () => {
    const brandName = prompt("Nom de l'entreprise du nouveau client :");
    if (!brandName) return;
    try {
      const { error } = await supabase.from("clients").insert([{ brand_name: brandName }]);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col md:flex-row font-sans text-white">
      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6 text-white" />
          <span className="font-bold text-lg">Actero Admin</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden md:block">
        <Sidebar 
          title="Actero Admin"
          items={sidebarItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={onLogout}
        />
      </div>

      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="relative w-4/5 max-w-xs bg-[#0a0a0a] h-full shadow-2xl"
            >
              <Sidebar 
                title="Actero Admin"
                items={sidebarItems}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={onLogout}
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CommandKModal 
        isOpen={isCommandKOpen} 
        onClose={() => setIsCommandKOpen(false)} 
        clients={clients} 
        setActiveTab={setActiveTab} 
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="hidden md:flex h-16 bg-[#0a0a0a] border-b border-white/10 items-center px-8">
          <h1 className="text-xl font-bold capitalize tracking-tight">
            {activeTab.replace("-", " ")}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === "intelligence" && (
            <div className="max-w-6xl mx-auto">
              <IntelligenceView supabase={supabase} theme="dark" />
            </div>
          )}

          {activeTab === "overview" && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-red-400">Alertes Systèmes</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Client "DataSync" : 0 exécution depuis 48h. Vérification recommandée.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/10">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Heures Économisées</p>
                  <p className="text-4xl font-bold text-white font-mono tracking-tighter">
                    <AnimatedCounter value={4205} /> <span className="text-xl font-medium text-gray-400">h</span>
                  </p>
                </div>
                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/10">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Valeur Générée (Globale)</p>
                  <p className="text-4xl font-bold text-white font-mono tracking-tighter">
                    <AnimatedCounter value={185400} isCurrency={true} /> <span className="text-xl font-medium text-gray-400">€</span>
                  </p>
                </div>
                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Taux de succès global</p>
                  <p className="text-4xl font-bold text-emerald-500 font-mono tracking-tighter">
                    <AnimatedCounter value={99} />.8 <span className="text-xl font-medium text-emerald-600">%</span>
                  </p>
                </div>
              </div>

              <AdminActivityHeatmap />
            </div>
          )}

          {activeTab === "clients" && (
            <div className="max-w-6xl mx-auto animate-fade-in-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="relative w-full sm:w-auto">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    className="pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm w-full sm:w-80 outline-none focus:border-white/20 transition-all"
                  />
                </div>
                <button
                  onClick={handleAddClient}
                  className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" /> Nouveau client
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Sparkles className="w-8 h-8 animate-pulse text-gray-400" />
                </div>
              ) : clients.length === 0 ? (
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-16 text-center flex flex-col items-center">
                  <Users className="w-12 h-12 text-gray-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Aucun client pour le moment</h3>
                  <button onClick={handleAddClient} className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-bold mt-4">
                    Ajouter un client
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.map((client) => {
                    const isImmo = client.client_type === 'immobilier';
                    const statusColor = client.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : client.status === 'canceled'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                    const statusLabel = client.status === 'active' ? 'Actif' : client.status === 'canceled' ? 'Annulé' : client.status || 'Inactif';
                    const roi = client.totals.money_saved + client.totals.revenue_recovered;

                    return (
                      <div key={client.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                        {/* Row 1: Header */}
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                              isImmo
                                ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                              {isImmo ? <Home className="w-6 h-6" /> : <ShoppingCart className="w-6 h-6" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-white">{client.brand_name}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  isImmo
                                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                }`}>
                                  {isImmo ? '🏠 Immobilier' : '🛒 E-commerce'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(client.id);
                                  }}
                                  className="text-xs text-gray-600 font-mono hover:text-gray-400 transition-colors cursor-pointer"
                                  title="Copier le client_id"
                                >
                                  {client.id.slice(0, 8)}…
                                </button>
                                <span className="text-xs text-gray-600">•</span>
                                <span className="text-xs text-gray-500">{client.ownerEmail || '—'}</span>
                                <span className="text-xs text-gray-600">•</span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Client depuis {new Date(client.created_at).toLocaleDateString('fr-FR')}
                                </span>
                                {client.lastEventAt && (
                                  <>
                                    <span className="text-xs text-gray-600">•</span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Activity className="w-3 h-3 text-emerald-500" />
                                      Dernière activité {new Date(client.lastEventAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedClient(client)}
                              className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                              title="Configurer ROI"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Row 2: KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Heures éco.</span>
                            </div>
                            <p className="text-xl font-bold text-white">{Math.round(client.totals.hours_saved)}h</p>
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ROI total</span>
                            </div>
                            <p className="text-xl font-bold text-white">{Math.round(roi).toLocaleString('fr-FR')}€</p>
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                {isImmo ? 'Leads traités' : 'Tickets traités'}
                              </span>
                            </div>
                            <p className="text-xl font-bold text-white">{client.totals.tickets_total}</p>
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Taux auto</span>
                            </div>
                            <p className="text-xl font-bold text-white">{client.autoRate}%</p>
                          </div>
                          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className="w-3.5 h-3.5 text-pink-400" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Events</span>
                            </div>
                            <p className="text-xl font-bold text-white">{client.eventCount}</p>
                          </div>
                        </div>

                        {/* Row 3: Progress bar */}
                        <div className="mt-4 flex items-center gap-4">
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isImmo ? 'bg-violet-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(client.autoRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">
                            {client.totals.tickets_auto} auto / {client.totals.tickets_escalated} escaladés
                          </span>
                          <span className="text-xs text-gray-600 shrink-0">
                            {client.daysActive}j actif
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="max-w-6xl mx-auto animate-fade-in-up">
              <AdminKanbanBoard requests={requests} />
            </div>
          )}

          {activeTab === "funnel" && (
            <div className="max-w-6xl mx-auto animate-fade-in-up">
              <AdminFunnelView />
            </div>
          )}

          {activeTab === "leads" && (
            <div className="max-w-6xl mx-auto animate-fade-in-up">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Leads Capturés</h2>
                <p className="text-gray-500">Contacts intéressés via l'Audit IA.</p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Sparkles className="w-8 h-8 animate-pulse text-gray-400" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-20 bg-[#0a0a0a] rounded-2xl border border-white/10">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun lead pour le moment.</p>
                </div>
              ) : (
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#030303]">
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Entreprise</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Email</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold">{lead.brand_name}</td>
                          <td className="px-6 py-4 text-zinc-300">{lead.email}</td>
                          <td className="px-6 py-4 text-zinc-500">
                            {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {selectedClient && (
        <AdminClientSettingsModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-clients'] })}
        />
      )}
    </div>
  );
};
