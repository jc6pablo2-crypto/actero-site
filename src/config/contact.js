/**
 * Canaux de contact Actero — source of truth.
 *
 * Tout ce qui doit ouvrir un chemin direct vers un humain passe par ce
 * fichier : landing CTAs, pricing Enterprise, alternative pages, footer…
 * Changer l'URL Cal.com une fois ici, c'est propagé partout.
 */

export const CONTACT = {
  /** Démo découverte 30 min avec un cofondateur Actero */
  demo: {
    url: 'https://cal.com/actero/demo',
    label: 'Contacter le service commercial',
    labelShort: 'Service commercial',
    labelLong: 'Contacter le service commercial',
    description: 'Rendez-vous 30 min — démo live sur votre boutique Shopify',
  },
  /** Fallback email — pour les templates qui veulent rester sur mailto */
  email: 'contact@actero.fr',
  salesEmail: 'contact@actero.fr',
  supportEmail: 'support@actero.fr',
}

export const DEMO_URL = CONTACT.demo.url
