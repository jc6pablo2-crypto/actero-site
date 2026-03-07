/**
 * Initialisation gérée par le script direct ajouté dans index.html
 * pour profiter de l'autocapture et du Session Replay.
 */
export const initAmplitude = () => {
    // No-op : l'initialisation se fait côté HTML.
};

/**
 * Envoie un événement personnalisé à Amplitude via l'objet global injecté par le snippet.
 * Utile en complément de l'autocapture pour des événements complexes (ex: Payload détaillé du chat).
 * 
 * @param {string} eventName - Le nom de l'événement
 * @param {object} eventProperties - Données optionnelles
 */
export const trackEvent = (eventName, eventProperties = {}) => {
    if (typeof window !== 'undefined' && window.amplitude) {
        try {
            window.amplitude.track(eventName, eventProperties);
        } catch (error) {
            console.error(`Failed to track event ${eventName}:`, error);
        }
    }
};

/**
 * Associe l'utilisateur actuel à un ID unique.
 * 
 * @param {string} userId
 */
export const setUserId = (userId) => {
    if (typeof window !== 'undefined' && window.amplitude && userId) {
        try {
            window.amplitude.setUserId(userId);
        } catch (error) {
            console.error('Failed to set user ID in Amplitude:', error);
        }
    }
};
