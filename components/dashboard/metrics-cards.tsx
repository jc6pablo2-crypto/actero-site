'use client';

import React from 'react';
import { useMetricsRealtime } from '../../hooks/useMetricsRealtime';
// In a real project you might rely on 'lucide-react' standard icons. Below assumes standard setup.
import { Activity, Clock, TerminalSquare, DollarSign, AlertCircle } from 'lucide-react';

export default function MetricsCards({ token }: { token: string }) {
    const { metrics, isLoading, error } = useMetricsRealtime(token);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm h-48 flex flex-col justify-between">
                        <div className="h-10 w-10 bg-zinc-100 rounded-xl mb-6"></div>
                        <div>
                            <div className="h-8 bg-zinc-100 rounded w-1/2 mb-3"></div>
                            <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-5 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-base font-bold text-red-900">Erreur Serveur</h3>
                    <p className="text-sm text-red-700 mt-1 font-medium">{error}</p>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return null;
    }

    // Animation helper for live sensation
    const animationClass = "transition-all duration-500 transform hover:-translate-y-1";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Automatisations actives */}
            <div className={`bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col ${animationClass}`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                        <Activity className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Automatisations actives</p>
                </div>
                <p className="text-5xl font-bold text-zinc-900 font-mono tracking-tighter mb-2 min-h-[60px] flex items-end">
                    {metrics.active_automations}
                </p>
                <p className="text-sm font-medium text-zinc-500 mt-auto">Workflows surveillés en continu.</p>
            </div>

            {/* Tâches exécutées */}
            <div className={`bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col ${animationClass}`}>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
                        <TerminalSquare className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Tâches exécutées</p>
                </div>
                <p className="text-5xl font-bold text-zinc-900 font-mono tracking-tighter mb-2 min-h-[60px] flex items-end">
                    {metrics.tasks_executed.toLocaleString('fr-FR')}
                </p>
                <p className="text-sm font-medium text-zinc-500 mt-auto">Actions réussies cumulées (live).</p>
            </div>

            {/* Minutes/Heures économisées */}
            <div className={`bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden group ${animationClass}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2.5 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl">
                        <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Temps économisé</p>
                </div>
                <p className="text-5xl font-bold text-emerald-600 font-mono tracking-tighter mb-2 relative z-10 min-h-[60px] flex items-end">
                    {Math.round(metrics.time_saved_minutes / 60)} <span className="text-3xl text-emerald-400 ml-1">h</span>
                </p>
                <p className="text-sm font-medium text-zinc-500 mt-auto relative z-10">Heures de travail humain récupérées.</p>
            </div>

            {/* ROI */}
            <div className={`bg-white p-8 rounded-3xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden group ${animationClass}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">ROI Généré</p>
                </div>
                <p className="text-5xl font-bold text-zinc-900 font-mono tracking-tighter mb-2 relative z-10 min-h-[60px] flex items-end">
                    {metrics.estimated_roi.toLocaleString('fr-FR')} <span className="text-3xl text-zinc-400 ml-1">€</span>
                </p>
                <p className="text-sm font-medium text-zinc-500 mt-auto relative z-10">Valeur totale extrapolée à ce jour.</p>
            </div>

        </div>
    );
}
