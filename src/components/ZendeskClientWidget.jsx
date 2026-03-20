import { useEffect } from 'react'

/**
 * Widget Zendesk — Support client dashboard uniquement.
 *
 * Ce composant charge le widget Zendesk CLIENT (instance séparée)
 * au mount et le supprime proprement au unmount.
 *
 * Usage : intégré uniquement dans DashboardGate.jsx pour les clients.
 * NE PAS ajouter sur la landing page, l'admin ou globalement.
 *
 * Note : La landing page utilise un widget Zendesk PUBLIC séparé
 * (ZendeskWidget.jsx) avec une clé différente.
 */
const ZENDESK_CLIENT_KEY = 'e80cafd5-3a27-4211-bad2-bbfcb94c9a78'

function cleanupZendesk() {
  // Supprimer le script Zendesk
  const el = document.getElementById('ze-snippet')
  if (el) el.remove()

  // Supprimer toutes les iframes et éléments injectés par Zendesk
  document.querySelectorAll(
    'iframe[title*="Zendesk"], iframe[title*="messaging"], iframe[id*="launcher"], [id*="webWidget"], [id*="Zendesk"], .zEWidget-launcher, #zdLauncher, [data-product="web_widget"]'
  ).forEach(node => node.remove())

  // Nettoyer les globals Zendesk pour éviter les conflits avec l'autre widget
  try { if (window.zE) window.zE('webWidget', 'hide') } catch {}
  delete window.zE
  delete window.zESettings
  delete window.$zopim
  delete window.zEmbed
  delete window.__ZENDESK_CLIENT_I18N_GLOBAL
}

export const ZendeskClientWidget = () => {
  useEffect(() => {
    // S'assurer qu'aucun autre widget Zendesk n'est présent
    cleanupZendesk()

    const script = document.createElement('script')
    script.id = 'ze-snippet'
    script.src = `https://static.zdassets.com/ekr/snippet.js?key=${ZENDESK_CLIENT_KEY}`
    script.async = true
    document.head.appendChild(script)

    return () => {
      cleanupZendesk()
    }
  }, [])

  return null
}
