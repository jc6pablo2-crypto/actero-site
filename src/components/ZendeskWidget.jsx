import { useEffect } from 'react'

/**
 * Widget Zendesk — Support public landing page uniquement.
 *
 * Ce composant charge le widget Zendesk PUBLIC au mount et le supprime
 * proprement au unmount pour éviter qu'il apparaisse sur les
 * dashboards clients ou l'admin.
 *
 * Usage : intégré uniquement dans LandingPage.jsx
 * NE PAS ajouter dans App.jsx, index.html ou les dashboards.
 *
 * Note : Le dashboard client utilise un widget Zendesk SÉPARÉ
 * (ZendeskClientWidget.jsx) avec une clé différente.
 */
const ZENDESK_PUBLIC_KEY = '72f9b12e-ca6d-4912-af9c-8d0b1bb92e36'

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

export const ZendeskWidget = () => {
  useEffect(() => {
    // S'assurer qu'aucun autre widget Zendesk n'est présent
    cleanupZendesk()

    const script = document.createElement('script')
    script.id = 'ze-snippet'
    script.src = `https://static.zdassets.com/ekr/snippet.js?key=${ZENDESK_PUBLIC_KEY}`
    script.async = true
    document.head.appendChild(script)

    return () => {
      cleanupZendesk()
    }
  }, [])

  return null
}
