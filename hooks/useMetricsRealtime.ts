import { useState, useEffect } from 'react';
import { getMetrics, ClientMetrics } from '../lib/getMetrics';

export function useMetricsRealtime(token?: string) {
    const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const fetchRealtimeMetrics = async () => {
            if (!token) {
                setIsLoading(false);
                setError('Token absent');
                return;
            }
            try {
                const data = await getMetrics(token);
                if (data) {
                    setMetrics(data);
                } else {
                    setError('Impossible de récupérer les métriques au serveur.');
                }
            } catch (err: any) {
                setError(err.message || 'Erreur Realtime Fetch');
            } finally {
                setIsLoading(false);
            }
        };

        // Initial load
        fetchRealtimeMetrics();

        // Set polling every 30 seconds
        intervalId = setInterval(() => {
            fetchRealtimeMetrics();
        }, 30000);

        return () => clearInterval(intervalId);
    }, [token]);

    return { metrics, isLoading, error };
}
