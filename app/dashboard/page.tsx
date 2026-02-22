import MetricsCards from '@/components/dashboard/metrics-cards';
// import { cookies } from 'next/headers'; // Example of accessing secure token

export default async function DashboardPage() {
    // Demo token access logic.
    // In a real application, you'd extract the token via your Auth library or Supabase Server Helpers, e.g.:
    // const cookieStore = cookies()
    // const token = cookieStore.get('sb-access-token')?.value || ''

    const token = 'fake-extracted-token-placeholder';

    return (
        <div className="min-h-screen bg-[#FAFAFA] p-8 font-sans selection:bg-emerald-500/20 selection:text-zinc-900">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">

                {/* Header Dashboard */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Vue d'ensemble</h1>
                        <p className="text-zinc-500 font-medium text-lg mt-1">Impact en temps réel de votre infrastructure gérée</p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm self-start md:self-auto">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Synchronisation Active</span>
                    </div>
                </header>

                {/* Realtime Cards Component */}
                <main>
                    <MetricsCards token={token} />
                </main>
            </div>
        </div>
    );
}
