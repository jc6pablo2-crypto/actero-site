const SITE_URL = 'https://actero.fr'

// Organization JSON-LD (shared across pages)
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Actero',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon-192.png`,
  description: "Infrastructure IA et automatisation pour e-commerce",
  sameAs: [
    'https://www.linkedin.com/company/actero'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    availableLanguage: 'French'
  }
}

// Service JSON-LD schemas
export const servicesJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Agent IA Support Client',
    description: "Agent IA multilingue connecté à votre base de données pour absorber 80% des tickets support en temps réel.",
    provider: { '@type': 'Organization', name: 'Actero' },
    serviceType: 'Automatisation IA',
    areaServed: { '@type': 'Country', name: 'France' }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Automatisation Workflows E-commerce',
    description: "Synchronisation Make/Zapier entre Shopify, CRM, Klaviyo et votre comptabilité pour automatiser toute la chaîne opérationnelle.",
    provider: { '@type': 'Organization', name: 'Actero' },
    serviceType: 'Automatisation E-commerce',
    areaServed: { '@type': 'Country', name: 'France' }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Audit IA E-commerce',
    description: "Diagnostic complet de vos opérations e-commerce avec identification des opportunités d'automatisation IA.",
    provider: { '@type': 'Organization', name: 'Actero' },
    serviceType: 'Audit & Conseil',
    areaServed: { '@type': 'Country', name: 'France' }
  }
]

// Per-page SEO configuration
export const pageSEO = {
  '/': {
    title: 'Actero | Agents IA & Automatisation pour E-commerce Shopify',
    description: "Actero déploie des agents IA et des infrastructures d'automatisation pour les boutiques e-commerce Shopify. SAV automatisé, workflows intelligents, croissance accélérée.",
  },
  '/entreprise': {
    title: 'Notre Mission',
    description: "Actero construit l'infrastructure IA qui libère les équipes e-commerce de l'opérationnel répétitif. Découvrez notre approche.",
  },
  '/tarifs': {
    title: 'Tarifs & Plans',
    description: "Découvrez les offres Actero : audit gratuit, automatisation IA et infrastructure sur mesure pour votre e-commerce Shopify.",
  },
  '/faq': {
    title: 'Questions Fréquentes',
    description: "Réponses aux questions sur les agents IA Actero, l'intégration Shopify, les délais de déploiement et la sécurité des données.",
  },
  '/audit': {
    title: 'Audit IA Gratuit',
    description: "Lancez un audit IA gratuit de votre site e-commerce. Notre agent analyse vos opportunités d'automatisation en temps réel.",
  },
  '/demo': {
    title: 'Démo Dashboard',
    description: "Explorez le dashboard Actero en démo : suivi de performance, agents IA actifs et métriques d'automatisation en temps réel.",
  },
  '/ressources': {
    title: 'Bibliothèque de Prompts IA',
    description: "Accédez à notre bibliothèque de prompts IA optimisés pour l'e-commerce : support client, rédaction produit, analyse de données.",
  },
  '/login': {
    title: 'Connexion',
    description: "Connectez-vous à votre espace Actero pour gérer vos agents IA et suivre vos automatisations.",
    noindex: true,
  },
  '/reset-password': {
    title: 'Réinitialiser le mot de passe',
    description: "Réinitialisez votre mot de passe Actero.",
    noindex: true,
  },
  '/setup-password': {
    title: 'Créer votre mot de passe',
    description: "Créez votre mot de passe pour accéder à votre espace Actero.",
    noindex: true,
  },
  '/auth/callback': {
    title: 'Authentification en cours',
    description: "Validation de votre session en cours.",
    noindex: true,
  },
}

// FAQ JSON-LD for the FAQ page
export const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: "Comment fonctionne la période d'essai ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "L'Audit System est entièrement gratuit et sans engagement. Vous obtenez un diagnostic complet de vos opérations avant de décider de passer à l'étape suivante."
      }
    },
    {
      '@type': 'Question',
      name: 'Puis-je changer de plan à tout moment ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements prennent effet au prochain cycle de facturation.'
      }
    },
    {
      '@type': 'Question',
      name: 'Mes données sont-elles sécurisées ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolument. Nous utilisons un chiffrement AES-256, des audits SOC 2 réguliers, et vos données ne sont jamais partagées avec des tiers.'
      }
    },
    {
      '@type': 'Question',
      name: 'Combien de temps prend le déploiement ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "En moyenne 7 jours ouvrés pour le plan Croissance Automatisée. Le plan Scale sur Mesure nécessite un onboarding plus approfondi de 2-3 semaines."
      }
    },
    {
      '@type': 'Question',
      name: 'Quelles intégrations supportez-vous ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Nous nous connectons nativement à Shopify, Klaviyo, Gorgias, Make, Zapier, et des dizaines d'autres outils."
      }
    }
  ]
}
