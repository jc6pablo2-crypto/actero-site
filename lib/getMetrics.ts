// Type Definition for the returned Metrics Data
export type ClientMetrics = {
    tasks_executed: number;
    time_saved_minutes: number;
    estimated_roi: number;
    active_automations: number;
    events_processed?: number;
};

// Helper function that fetches the secure metrics endpoint using Server SSR patterns or Client side request
export async function getMetrics(token: string): Promise<ClientMetrics | null> {
    try {
        const res = await fetch('/api/metrics', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            next: { revalidate: 30 } // Cache instruction if used in App Router RSC
        });

        if (!res.ok) {
            console.error('Erreur API :', res.statusText);
            return null;
        }

        const result = await res.json();
        return result.data as ClientMetrics;
    } catch (err) {
        console.error('Fetch Metrics Exception:', err);
        return null;
    }
}
