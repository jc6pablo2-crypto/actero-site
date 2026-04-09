import React, { useState, useEffect } from "react";
import {
  Search, BookOpen, Zap, ShoppingBag, Plug, Shield, BarChart3,
  ArrowRight, ArrowLeft, Mail, ChevronDown, ChevronUp,
  Building2, Headphones, RefreshCw, FileText, UserCheck,
  CheckCircle2, Clock, AlertTriangle, Sparkles, Settings,
  MessageSquare, Phone, CreditCard, Bell, Globe, Sliders,
  Brain, HelpCircle, Send, Key, Calendar, TrendingUp,
  PlayCircle, Volume2, Mic,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { SEO } from "../components/SEO";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════
// GUIDE ARTICLES — Full content pages
// ═══════════════════════════════════════
const GUIDES = [
  // ─────────────────────────────────
  // PREMIERS PAS
  // ─────────────────────────────────
  {
    id: 'comment-fonctionne-actero',
    category: 'getting-started',
    title: 'Comment fonctionne Actero',
    summary: 'Tout comprendre sur la plateforme en 5 minutes.',
    icon: Zap,
    readTime: '5 min',
    sections: [
      {
        title: 'Actero en deux mots',
        content: "Actero est une plateforme qui automatise votre service client grace a l'intelligence artificielle. Vous connectez vos outils (Shopify, votre email, Gorgias...), vous activez des automatisations, et l'IA repond a vos clients 24h/24, 7j/7. Vous gardez le controle total : chaque reponse que l'IA n'est pas sure de donner vous est soumise pour validation. C'est comme avoir un employe supplementaire qui ne dort jamais et qui apprend de vos corrections.",
      },
      {
        title: 'Les 3 grandes etapes',
        content: "1. Vous connectez vos outils : Shopify pour vos commandes, Gmail ou un email pro pour les messages, et eventuellement Gorgias ou Zendesk si vous les utilisez deja. Tout se fait en quelques clics depuis votre dashboard.\n\n2. Vous activez les automatisations : SAV, relance de paniers abandonnes, comptabilite... Choisissez celles qui vous concernent et sur quels canaux elles doivent fonctionner.\n\n3. L'IA travaille pour vous : elle repond aux emails, traite les tickets, relance les paniers. Vous suivez tout en temps reel dans votre dashboard et vous intervenez uniquement quand l'IA a besoin de vous.",
      },
      {
        title: 'Ce que fait l\'IA concretement',
        content: "Quand un client envoie un email pour savoir ou est son colis, l'IA va chercher la commande dans Shopify, verifie le statut de livraison, et repond au client avec les bonnes informations. Quand un client veut un retour, l'IA verifie votre politique de retour et guide le client. Quand un panier est abandonne, l'IA envoie un email de relance personnalise. Tout ca se passe automatiquement, sans que vous leviez le petit doigt.",
      },
      {
        title: 'Vous gardez le controle',
        content: "L'IA ne fait rien dans votre dos. Si elle n'est pas sure d'une reponse, elle vous la soumet dans l'onglet 'A traiter'. Vous pouvez approuver, modifier ou rejeter. Plus vous validez des reponses, plus l'IA devient precise pour votre boutique. Vous definissez aussi les regles : par exemple, ne jamais proposer un remboursement au-dessus de 100 euros sans votre accord.",
      },
    ],
  },
  {
    id: 'premier-jour-actero',
    category: 'getting-started',
    title: 'Votre premier jour sur Actero',
    summary: 'De la connexion a votre premiere automatisation active, etape par etape.',
    icon: Clock,
    readTime: '6 min',
    sections: [
      {
        title: 'Se connecter pour la premiere fois',
        content: "Apres votre inscription, vous recevez un email avec un lien pour acceder a votre dashboard. Cliquez dessus et connectez-vous avec votre email et mot de passe. Vous arrivez sur la page Vue d'ensemble qui affiche une checklist d'onboarding. Cette checklist vous guide etape par etape pour tout configurer. Suivez-la dans l'ordre, c'est le chemin le plus rapide.",
      },
      {
        title: 'Etape 1 : Connecter Shopify',
        content: "Cliquez sur Integrations dans le menu a gauche. Trouvez Shopify et cliquez Connecter. Entrez votre domaine Shopify (celui qui finit par .myshopify.com). Vous serez redirige vers Shopify pour autoriser l'acces. Acceptez et c'est fait. Actero peut maintenant acceder a vos commandes, clients et produits en lecture seule.",
      },
      {
        title: 'Etape 2 : Connecter votre email',
        content: "Toujours dans Integrations, connectez Gmail (un clic, autorisation Google) ou votre email professionnel via SMTP/IMAP. C'est indispensable pour que l'IA puisse envoyer et recevoir des emails en votre nom. Si vous utilisez Gorgias ou Zendesk, connectez-les aussi a cette etape.",
      },
      {
        title: 'Etape 3 : Configurer votre agent',
        content: "Allez dans Mon Agent dans le menu. Reglez le ton de votre agent avec les 3 curseurs (formel ou casual, froid ou chaleureux, court ou detaille). Ajoutez votre politique de retour et vos FAQ dans la base de connaissances. Plus vous en mettez, meilleures seront les reponses. Vous pouvez importer automatiquement depuis une URL de votre site.",
      },
      {
        title: 'Etape 4 : Activer votre premiere automatisation',
        content: "Allez dans Automatisations. Commencez par le SAV E-commerce : selectionnez les canaux (Email, Chat sur le site...) et activez le toggle. L'IA commence a travailler immediatement. Surveillez les premiers tickets dans l'onglet Activite et les escalades dans A traiter. Felicitations, votre agent est en ligne !",
      },
      {
        title: 'Les jours suivants',
        content: "Pendant les premiers jours, gardez un oeil sur les escalades. Chaque escalade est une occasion d'apprendre a votre agent : approuvez les bonnes reponses, corrigez les mauvaises. En une semaine, l'IA connait deja les cas les plus frequents de votre boutique. Apres 2-3 semaines, le taux de resolution automatique se stabilise generalement entre 70 et 85%.",
      },
    ],
  },
  {
    id: 'problemes-frequents',
    category: 'getting-started',
    title: 'Problemes frequents et solutions',
    summary: 'Les soucis les plus courants et comment les resoudre rapidement.',
    icon: HelpCircle,
    readTime: '5 min',
    sections: [
      {
        title: 'Mon agent repond mal ou a cote',
        content: "C'est presque toujours un probleme de base de connaissances. Verifiez dans Mon Agent si le sujet est couvert. Si votre client pose une question sur les retours et que votre politique de retour n'est pas renseignee, l'agent ne peut pas bien repondre. Ajoutez l'information manquante et testez a nouveau. Pensez aussi a verifier que vos instructions ne sont pas contradictoires (par exemple, demander un ton amical mais imposer le vouvoiement strict).",
      },
      {
        title: 'Je ne recois plus de notifications',
        content: "Plusieurs causes possibles. D'abord, verifiez vos preferences dans la section Notifications : les toggles sont peut-etre desactives. Ensuite, regardez dans vos spams car les emails Actero viennent de notifications@actero.fr. Si vous utilisez Slack, allez dans Integrations et verifiez que la connexion Slack est toujours active (badge vert). Enfin, verifiez que le mode silencieux n'est pas active sur une plage horaire trop large.",
      },
      {
        title: 'Erreur lors de la connexion Shopify',
        content: "Verifiez que vous utilisez bien votre domaine au format ma-boutique.myshopify.com (pas votre domaine personnalise comme maboutique.com). Assurez-vous d'avoir les droits administrateur sur la boutique. Si ca ne marche toujours pas, essayez de deconnecter puis reconnecter. Vous pouvez aussi lancer un Diagnostic depuis la Vue d'ensemble pour voir ou ca bloque.",
      },
      {
        title: 'Le dashboard ne se charge pas',
        content: "Essayez de rafraichir la page avec Ctrl+R (ou Cmd+R sur Mac). Si ca persiste, videz le cache de votre navigateur ou essayez en navigation privee. Si le probleme continue, il peut y avoir une maintenance en cours. Verifiez vos emails pour d'eventuelles notifications de maintenance. Vous pouvez toujours nous ecrire a contact@actero.fr.",
      },
      {
        title: 'Mon integration affiche une erreur',
        content: "Si une integration montre un badge rouge, cliquez sur le bouton Tester pour verifier la connexion. Si le test echoue, essayez Reconnecter. Si c'est une integration par cle API (Klaviyo, Calendly...), verifiez que la cle est toujours valide dans l'outil d'origine. Parfois, les cles expirent ou sont revoquees. Regenerez-en une nouvelle et mettez-la a jour dans Actero.",
      },
    ],
  },

  // ─────────────────────────────────
  // INTEGRATIONS
  // ─────────────────────────────────
  {
    id: 'connecter-shopify',
    category: 'integrations',
    title: 'Connecter Shopify',
    summary: 'Relier votre boutique Shopify en un clic pour synchroniser commandes, clients et produits.',
    icon: ShoppingBag,
    readTime: '4 min',
    sections: [
      {
        title: 'A quoi sert la connexion Shopify',
        content: "Shopify est le coeur de votre boutique. En le connectant a Actero, votre agent IA peut acceder a vos commandes, vos clients, vos produits et vos livraisons. Grace a ca, quand un client demande ou est son colis ou veut faire un retour, l'agent a toutes les informations pour repondre. Actero accede a vos donnees en lecture seule : il ne modifie jamais rien dans votre boutique.",
      },
      {
        title: 'Comment connecter, etape par etape',
        content: "1. Connectez-vous a votre dashboard Actero\n2. Cliquez sur Integrations dans le menu a gauche\n3. Trouvez la carte Shopify et cliquez Connecter\n4. Un champ apparait : entrez votre domaine Shopify. C'est celui qui finit par .myshopify.com (par exemple ma-boutique.myshopify.com). Vous le trouvez dans Shopify Admin, dans Parametres puis Domaines.\n5. Cliquez Connecter. Vous etes redirige vers Shopify.\n6. Sur Shopify, cliquez Installer l'application pour autoriser l'acces.\n7. Vous revenez automatiquement sur Actero. Un badge vert Connecte apparait.",
      },
      {
        title: 'Quelles donnees sont synchronisees',
        content: "Actero synchronise en lecture les informations suivantes : les commandes (numero, statut, montant, date), les clients (nom, email, historique), les produits (titre, description, prix, stock), les livraisons (transporteur, numero de suivi, statut), et les paniers abandonnes. Aucune donnee n'est modifiee cote Shopify. Actero ne peut pas passer de commande, modifier un prix ou supprimer un produit.",
      },
      {
        title: 'Si ca ne marche pas',
        content: "Verifiez que vous etes bien administrateur de votre boutique Shopify (un compte staff sans droits admin ne peut pas installer d'application). Verifiez que le domaine entre est au format .myshopify.com et non votre domaine personnalise. Si l'erreur persiste, lancez un Diagnostic depuis la Vue d'ensemble de votre dashboard ou contactez-nous a contact@actero.fr.",
      },
    ],
  },
  {
    id: 'connecter-gmail',
    category: 'integrations',
    title: 'Connecter Gmail',
    summary: 'Utiliser votre compte Gmail pour envoyer et recevoir les emails via Actero.',
    icon: Mail,
    readTime: '3 min',
    sections: [
      {
        title: 'Pourquoi connecter Gmail',
        content: "Gmail permet a votre agent IA d'envoyer et de recevoir des emails. Quand un client vous ecrit, l'agent lit le message, analyse la demande, et repond automatiquement depuis votre adresse Gmail. C'est le moyen le plus simple de demarrer si vous n'avez pas d'email professionnel dedie.",
      },
      {
        title: 'Comment connecter',
        content: "1. Allez dans Integrations dans votre dashboard\n2. Trouvez Gmail et cliquez Connecter\n3. Une fenetre Google s'ouvre : selectionnez votre compte Gmail\n4. Autorisez Actero a lire et envoyer des emails en votre nom\n5. Vous revenez sur Actero, un badge vert confirme la connexion\n\nC'est une connexion OAuth securisee. Actero n'a jamais acces a votre mot de passe. Vous pouvez revoquer l'acces a tout moment depuis les parametres de votre compte Google.",
      },
      {
        title: 'Ce que fait Actero avec Gmail',
        content: "Actero surveille les nouveaux emails entrants et les traite automatiquement selon vos automatisations actives. Si le SAV est active sur le canal Email, l'agent lit le message du client, cherche les informations dans Shopify, et repond. L'email de reponse est envoye depuis votre adresse Gmail, le client ne voit aucune difference avec un email envoye par vous.",
      },
      {
        title: 'Gmail ou email personnalise ?',
        content: "Si votre adresse de support est une adresse Gmail (comme maboutique.sav@gmail.com), connectez Gmail. Si vous avez une adresse professionnelle (comme contact@maboutique.com hebergee chez OVH, Ionos ou autre), utilisez plutot l'integration Email personnalise (SMTP/IMAP). Consultez le guide dedie pour les details.",
      },
    ],
  },
  {
    id: 'connecter-email-smtp',
    category: 'integrations',
    title: 'Connecter un email SMTP/IMAP',
    summary: 'Utiliser votre adresse email professionnelle (contact@votreboutique.com) avec Actero.',
    icon: Send,
    readTime: '5 min',
    sections: [
      {
        title: 'Pourquoi utiliser un email professionnel',
        content: "Si vous avez une adresse comme contact@maboutique.com ou sav@maboutique.com, vos clients recoivent les reponses depuis cette adresse officielle. Ca fait plus serieux qu'une adresse Gmail. La connexion se fait via les protocoles SMTP (pour envoyer) et IMAP (pour recevoir). Ca parait technique, mais on va tout vous expliquer simplement.",
      },
      {
        title: 'Les informations a preparer',
        content: "Avant de commencer, rassemblez ces informations aupres de votre hebergeur email :\n\n- Votre adresse email complete (ex: contact@maboutique.com)\n- Le serveur SMTP et son port (pour envoyer des emails)\n- Le serveur IMAP et son port (pour recevoir des emails)\n- Votre identifiant (souvent l'adresse email elle-meme)\n- Votre mot de passe email\n\nSi vous ne savez pas ou trouver ces infos, regardez la section Hebergeurs courants ci-dessous.",
      },
      {
        title: 'Comment connecter',
        content: "1. Allez dans Integrations dans votre dashboard\n2. Trouvez Email personnalise (SMTP/IMAP) dans la liste\n3. Cliquez Configurer\n4. Remplissez chaque champ : adresse email, serveur SMTP, port SMTP, serveur IMAP, port IMAP, identifiant et mot de passe\n5. Laissez la case SSL/TLS cochee (c'est la valeur par defaut et c'est recommande)\n6. Cliquez Connecter\n7. Actero teste automatiquement la connexion. Si tout est bon, un badge vert apparait.",
      },
      {
        title: 'Parametres des hebergeurs courants',
        content: "OVH / OVHcloud :\nSMTP : ssl0.ovh.net, port 587\nIMAP : ssl0.ovh.net, port 993\n\nIonos (1&1) :\nSMTP : smtp.ionos.fr, port 587\nIMAP : imap.ionos.fr, port 993\n\nInfomaniak :\nSMTP : mail.infomaniak.com, port 587\nIMAP : mail.infomaniak.com, port 993\n\nO2switch :\nSMTP : votre-domaine.com, port 465\nIMAP : votre-domaine.com, port 993\n(Remplacez votre-domaine.com par votre vrai nom de domaine)\n\nSi votre hebergeur n'est pas dans la liste, cherchez sur Google : 'parametres SMTP + le nom de votre hebergeur'. Vous trouverez les infos en 30 secondes.",
      },
      {
        title: 'En cas de probleme',
        content: "Si la connexion echoue, verifiez d'abord que le mot de passe est correct en vous connectant directement a votre webmail. Verifiez aussi que le port est le bon (587 pour SMTP est le plus courant, 993 pour IMAP). Certains hebergeurs demandent d'activer l'acces IMAP dans les parametres du compte email. Si vous avez active la double authentification, vous devrez peut-etre creer un mot de passe specifique pour les applications.",
      },
    ],
  },
  {
    id: 'connecter-slack',
    category: 'integrations',
    title: 'Connecter Slack',
    summary: 'Recevoir les alertes, escalades et rapports directement dans votre Slack.',
    icon: MessageSquare,
    readTime: '3 min',
    sections: [
      {
        title: 'Pourquoi connecter Slack',
        content: "Avec Slack connecte, vous etes informe en temps reel sans ouvrir le dashboard Actero. Vous recevez les alertes d'escalade quand l'IA transfere une demande, les notifications de tickets urgents, les rapports d'activite quotidiens, et les alertes de performance (par exemple si le taux d'escalade augmente). Tout arrive directement dans un canal Slack de votre choix.",
      },
      {
        title: 'Comment connecter',
        content: "1. Allez dans Integrations dans votre dashboard\n2. Trouvez Slack dans la liste (il est marque comme Recommande)\n3. Cliquez Connecter\n4. Une fenetre Slack s'ouvre : selectionnez votre workspace\n5. Choisissez le canal ou vous voulez recevoir les notifications (par exemple #actero-alertes)\n6. Cliquez Autoriser\n7. Vous revenez sur Actero avec un badge vert Connecte",
      },
      {
        title: 'Ce que vous recevrez',
        content: "Une fois connecte, voici ce qui arrive dans votre canal Slack : les nouvelles escalades avec un resume de la demande du client, les alertes urgentes (par exemple un client tres mecontent), les rapports de performance si vous les avez actives, et les alertes de tresorerie si vous utilisez l'automatisation comptabilite. Vous pouvez personnaliser les types de notifications dans la section Notifications de votre dashboard.",
      },
    ],
  },
  {
    id: 'connecter-gorgias',
    category: 'integrations',
    title: 'Connecter Gorgias',
    summary: 'Laisser l\'IA traiter automatiquement vos tickets Gorgias.',
    icon: Headphones,
    readTime: '4 min',
    sections: [
      {
        title: 'A quoi sert la connexion Gorgias',
        content: "Si vous utilisez deja Gorgias pour gerer votre support client, Actero peut s'y brancher directement. L'IA lit les nouveaux tickets qui arrivent dans Gorgias, les analyse, et y repond automatiquement. Vous n'avez pas besoin de changer vos habitudes : tout se passe dans Gorgias, mais c'est l'IA qui fait le travail. Les tickets que l'IA ne sait pas traiter sont escalades vers vous.",
      },
      {
        title: 'Comment connecter',
        content: "1. Allez dans Integrations\n2. Trouvez Gorgias et cliquez Connecter\n3. Entrez votre sous-domaine Gorgias. C'est la premiere partie de l'URL de votre compte : si votre compte est ma-boutique.gorgias.com, tapez simplement ma-boutique.\n4. Cliquez Connecter. Vous etes redirige vers Gorgias.\n5. Autorisez Actero a acceder a votre compte Gorgias.\n6. Vous revenez sur Actero avec un badge vert Connecte.",
      },
      {
        title: 'Comment l\'IA traite vos tickets',
        content: "Quand un nouveau ticket arrive dans Gorgias, l'IA le lit et decide si elle peut le traiter. Si oui, elle redige une reponse en respectant votre ton de marque et vos regles, puis la publie directement dans le ticket Gorgias. Si elle n'est pas sure, elle escalade le ticket vers vous. Le ticket est alors visible dans l'onglet A traiter de votre dashboard Actero, en plus de Gorgias.",
      },
      {
        title: 'Gorgias + les autres canaux',
        content: "Vous pouvez utiliser Gorgias en meme temps que les autres canaux (Email, Chat...). Par exemple, l'IA repond aux emails via Gmail ET aux tickets via Gorgias. Quand vous activez l'automatisation SAV, il suffit de cocher le canal Gorgias en plus du canal Email. Les deux fonctionnent en parallele, sans conflit.",
      },
    ],
  },
  {
    id: 'connecter-zendesk',
    category: 'integrations',
    title: 'Connecter Zendesk',
    summary: 'Automatiser le traitement de vos tickets Zendesk avec l\'IA.',
    icon: Headphones,
    readTime: '4 min',
    sections: [
      {
        title: 'A quoi sert la connexion Zendesk',
        content: "Si votre helpdesk est Zendesk, Actero s'y connecte pour traiter automatiquement les tickets entrants. L'IA lit chaque nouveau ticket, comprend la demande, verifie les informations dans Shopify si besoin, et repond directement dans Zendesk. Vos clients recoivent la reponse comme s'il s'agissait d'un agent humain. Tout reste dans Zendesk, Actero travaille en coulisses.",
      },
      {
        title: 'Comment connecter',
        content: "1. Allez dans Integrations\n2. Trouvez Zendesk et cliquez Connecter\n3. Entrez votre sous-domaine Zendesk. Si votre URL est ma-boutique.zendesk.com, tapez ma-boutique.\n4. Cliquez Connecter. Vous etes redirige vers Zendesk.\n5. Connectez-vous a Zendesk si ce n'est pas deja fait et autorisez Actero.\n6. Retour automatique sur Actero avec un badge vert Connecte.",
      },
      {
        title: 'Comment l\'IA traite vos tickets Zendesk',
        content: "Le fonctionnement est le meme qu'avec Gorgias : chaque nouveau ticket est lu et analyse par l'IA. Si elle peut repondre avec confiance, elle le fait. Sinon, elle escalade. L'IA respecte vos regles de garde-fou, votre ton de marque, et utilise votre base de connaissances pour formuler ses reponses. Les tickets traites par l'IA sont tagges automatiquement dans Zendesk pour que vous puissiez les retrouver facilement.",
      },
    ],
  },
  {
    id: 'connecter-klaviyo',
    category: 'integrations',
    title: 'Connecter Klaviyo',
    summary: 'Relier Klaviyo pour les relances par email et SMS marketing.',
    icon: Mail,
    readTime: '3 min',
    sections: [
      {
        title: 'A quoi sert Klaviyo dans Actero',
        content: "Klaviyo est un outil de marketing par email et SMS. En le connectant a Actero, vous permettez a l'IA d'envoyer des relances SMS pour les paniers abandonnes et de declencher des sequences marketing automatiquement. Si vous utilisez deja Klaviyo pour vos campagnes, Actero peut s'en servir comme canal supplementaire.",
      },
      {
        title: 'Trouver votre cle API',
        content: "1. Connectez-vous a votre compte Klaviyo\n2. Cliquez sur votre nom en bas a gauche, puis Parametres\n3. Allez dans API Keys (ou Cles API)\n4. Cliquez Create Private API Key\n5. Donnez-lui un nom (par exemple 'Actero')\n6. Copiez la cle qui commence par pk_\n\nAttention : cette cle ne s'affiche qu'une seule fois. Gardez-la en lieu sur.",
      },
      {
        title: 'Connecter dans Actero',
        content: "1. Allez dans Integrations dans votre dashboard\n2. Trouvez Klaviyo et cliquez Connecter\n3. Collez votre cle API dans le champ\n4. Cliquez Connecter\n5. Actero teste la connexion automatiquement. Si tout est bon, badge vert !",
      },
    ],
  },
  {
    id: 'connecter-whatsapp',
    category: 'integrations',
    title: 'Connecter WhatsApp Business',
    summary: 'Configurer WhatsApp Business API pour communiquer avec vos clients.',
    icon: Phone,
    readTime: '4 min',
    sections: [
      {
        title: 'A quoi sert WhatsApp dans Actero',
        content: "WhatsApp Business vous permet de recevoir et repondre aux messages de vos clients via WhatsApp. Votre agent IA peut envoyer des notifications, repondre aux questions et suivre les commandes directement dans la conversation WhatsApp du client. C'est un canal tres apprecie car les clients recoivent les reponses instantanement sur leur telephone.",
      },
      {
        title: 'Obtenir votre token API',
        content: "WhatsApp Business utilise l'API Meta. Pour obtenir votre token :\n\n1. Allez sur business.facebook.com et connectez-vous\n2. Allez dans WhatsApp puis Configuration de l'API\n3. Vous verrez votre Token d'acces permanent (il commence par EAA...)\n4. Copiez ce token\n\nSi vous n'avez pas encore de compte WhatsApp Business API, il faut d'abord le creer via Meta Business Suite. C'est gratuit mais il y a un processus de verification.",
      },
      {
        title: 'Connecter dans Actero',
        content: "1. Allez dans Integrations\n2. Trouvez WhatsApp Business et cliquez Connecter\n3. Collez votre token API dans le champ\n4. Cliquez Connecter\n5. C'est fait ! Vous pouvez maintenant utiliser WhatsApp comme canal dans vos automatisations.",
      },
    ],
  },
  {
    id: 'connecter-axonaut',
    category: 'integrations',
    title: 'Connecter Axonaut',
    summary: 'Relier votre CRM et facturation Axonaut pour la comptabilite automatisee.',
    icon: FileText,
    readTime: '3 min',
    sections: [
      {
        title: 'A quoi sert Axonaut dans Actero',
        content: "Axonaut est un logiciel de CRM et facturation pour les PME. En le connectant, Actero peut automatiser vos relances de factures, synchroniser vos donnees clients entre Shopify et Axonaut, et suivre votre tresorerie. C'est particulierement utile si vous utilisez l'automatisation Comptabilite Automatisee.",
      },
      {
        title: 'Trouver votre cle API',
        content: "1. Connectez-vous a votre compte Axonaut\n2. Allez dans Parametres (roue crantee en haut a droite)\n3. Cliquez sur API\n4. Votre cle API est affichee (elle commence par ak_)\n5. Copiez-la",
      },
      {
        title: 'Connecter dans Actero',
        content: "1. Allez dans Integrations\n2. Trouvez Axonaut et cliquez Connecter\n3. Collez votre cle API\n4. Cliquez Connecter\n5. La connexion est testee automatiquement. Badge vert si tout va bien.",
      },
    ],
  },
  {
    id: 'connecter-pennylane',
    category: 'integrations',
    title: 'Connecter Pennylane',
    summary: 'Automatiser votre comptabilite avec Pennylane : factures, rapprochements, bilan.',
    icon: TrendingUp,
    readTime: '3 min',
    sections: [
      {
        title: 'A quoi sert Pennylane dans Actero',
        content: "Pennylane est un logiciel de comptabilite en ligne. En le connectant, Actero peut automatiser le rapprochement bancaire, exporter vos factures Shopify vers Pennylane, et vous alerter sur votre tresorerie. C'est ideal si votre comptable utilise deja Pennylane et que vous voulez automatiser les flux entre votre boutique et votre compta.",
      },
      {
        title: 'Trouver votre token API',
        content: "1. Connectez-vous a votre compte Pennylane\n2. Allez dans Parametres puis Integrations\n3. Cliquez sur API\n4. Generez un nouveau token (il commence par pl_)\n5. Copiez-le immediatement car il ne s'affiche qu'une fois",
      },
      {
        title: 'Connecter dans Actero',
        content: "1. Allez dans Integrations\n2. Trouvez Pennylane et cliquez Connecter\n3. Collez votre token API\n4. Cliquez Connecter\n5. La connexion est verifiee. Si c'est bon, vous verrez un badge vert.",
      },
    ],
  },
  {
    id: 'connecter-ipaidthat',
    category: 'integrations',
    title: 'Connecter iPaidThat',
    summary: 'Collecte automatique de vos factures et justificatifs comptables.',
    icon: FileText,
    readTime: '3 min',
    sections: [
      {
        title: 'A quoi sert iPaidThat dans Actero',
        content: "iPaidThat collecte et classe automatiquement vos factures et justificatifs. En le connectant a Actero, vos factures Shopify et vos justificatifs de depenses sont automatiquement envoyes vers iPaidThat. Plus besoin de telecharger et trier vos factures a la main. C'est un gain de temps enorme pour votre comptabilite.",
      },
      {
        title: 'Trouver votre cle API',
        content: "1. Connectez-vous a votre compte iPaidThat\n2. Allez dans Parametres\n3. Cliquez sur API et Integrations\n4. Generez ou copiez votre cle API (elle commence par ipt_)\n5. Gardez-la prete pour l'etape suivante",
      },
      {
        title: 'Connecter dans Actero',
        content: "1. Allez dans Integrations\n2. Trouvez iPaidThat et cliquez Connecter\n3. Collez votre cle API\n4. Cliquez Connecter\n5. C'est fait ! Vos factures seront desormais envoyees automatiquement.",
      },
    ],
  },
  {
    id: 'connecter-calendly-calcom',
    category: 'integrations',
    title: 'Connecter Calendly ou Cal.com',
    summary: 'Permettre a l\'IA de proposer des creneaux et prendre des rendez-vous automatiquement.',
    icon: Calendar,
    readTime: '4 min',
    sections: [
      {
        title: 'A quoi ca sert',
        content: "En connectant Calendly ou Cal.com, votre agent IA peut proposer des creneaux de rendez-vous a vos clients ou prospects et les reserver automatiquement. C'est tres utile pour les agences immobilieres (visites de biens), les consultants, ou toute activite qui necessite de la prise de rendez-vous. Quand un prospect demande un RDV, l'IA verifie vos disponibilites et lui propose les creneaux libres.",
      },
      {
        title: 'Connecter Calendly',
        content: "1. Connectez-vous a Calendly\n2. Allez dans Integrations puis API et Webhooks\n3. Cliquez sur Generer un token personnel\n4. Copiez le token (il commence par eyJ...)\n5. Dans Actero, allez dans Integrations, trouvez Calendly et cliquez Connecter\n6. Collez votre token et validez",
      },
      {
        title: 'Connecter Cal.com',
        content: "1. Connectez-vous a Cal.com\n2. Allez dans Settings puis Developer puis API Keys\n3. Cliquez sur Create a new API Key\n4. Copiez la cle (elle commence par cal_live_)\n5. Dans Actero, allez dans Integrations, trouvez Cal.com et cliquez Connecter\n6. Collez votre cle et validez",
      },
      {
        title: 'Comment l\'IA utilise votre agenda',
        content: "Une fois connecte, l'IA a acces a vos disponibilites. Quand un client ou prospect demande un rendez-vous, l'agent lui propose les prochains creneaux disponibles. Si le client en choisit un, le rendez-vous est cree automatiquement dans votre agenda. Vous et le client recevez un email de confirmation. C'est entierement automatique, vous n'avez rien a faire.",
      },
    ],
  },
  {
    id: 'connecter-intercom-crisp',
    category: 'integrations',
    title: 'Connecter Intercom ou Crisp',
    summary: 'Brancher votre chat en direct pour que l\'IA reponde aux conversations.',
    icon: MessageSquare,
    readTime: '4 min',
    sections: [
      {
        title: 'A quoi ca sert',
        content: "Si vous utilisez Intercom ou Crisp pour le chat en direct sur votre site, Actero peut s'y connecter pour repondre automatiquement aux conversations. L'IA traite les messages entrants, repond aux questions courantes, et escalade les cas complexes vers votre equipe. Vous gardez votre outil de chat habituel, mais avec un agent IA qui repond en premier.",
      },
      {
        title: 'Connecter Intercom',
        content: "1. Connectez-vous a Intercom\n2. Allez dans Settings puis Developers puis Access Token\n3. Copiez votre token d'acces (il commence par dG9r...)\n4. Dans Actero, allez dans Integrations, trouvez Intercom et cliquez Connecter\n5. Collez votre token et validez\n6. Badge vert = c'est connecte",
      },
      {
        title: 'Connecter Crisp',
        content: "1. Connectez-vous a Crisp\n2. Allez dans Settings puis Website Settings puis Setup instructions\n3. Copiez votre identifiant de site (un long code au format xxxx-xxxx-xxxx-xxxx)\n4. Dans Actero, allez dans Integrations, trouvez Crisp et cliquez Connecter\n5. Collez l'identifiant et validez",
      },
      {
        title: 'Chat Actero vs Intercom/Crisp',
        content: "Si vous n'avez pas encore de solution de chat, sachez qu'Actero inclut son propre widget de chat integrable sur votre site. Pas besoin d'Intercom ou Crisp. Mais si vous les utilisez deja et que vos equipes y sont habituees, il est plus simple de les connecter plutot que de changer d'outil.",
      },
    ],
  },

  // ─────────────────────────────────
  // AUTOMATISATIONS
  // ─────────────────────────────────
  {
    id: 'activer-automatisations',
    category: 'automatisations',
    title: 'Activer vos automatisations',
    summary: 'Comment choisir, configurer et activer les automatisations sur vos canaux.',
    icon: Sparkles,
    readTime: '5 min',
    sections: [
      {
        title: 'Qu\'est-ce qu\'une automatisation',
        content: "Une automatisation, c'est une tache que votre agent IA fait tout seul, sans que vous ayez a intervenir. Repondre aux emails des clients, relancer un panier abandonne, classer une facture... tout ca, l'IA le fait a votre place. Il vous suffit de choisir quelles automatisations activer et sur quels canaux (email, chat, Gorgias, Zendesk, etc.).",
      },
      {
        title: 'Les automatisations disponibles',
        content: "Actero propose 4 automatisations principales :\n\n- SAV E-commerce : repond aux questions de vos clients (ou est mon colis, je veux un retour, probleme de taille...)\n- Relance Paniers Abandonnes : detecte les paniers laisses a l'abandon et envoie des emails de relance personnalises\n- Comptabilite Automatisee : relance les factures impayees, exporte les donnees comptables, alerte sur la tresorerie\n- Agent Vocal IA : un agent telephonique qui repond aux appels sur votre site (bientot disponible)",
      },
      {
        title: 'Comment activer une automatisation',
        content: "1. Allez dans Automatisations dans le menu a gauche\n2. Trouvez l'automatisation qui vous interesse\n3. Choisissez les canaux en cliquant sur les boutons sous l'automatisation (Email, Chat, Gorgias, Zendesk, SMS...)\n4. Un canal grise signifie que l'integration correspondante n'est pas encore connectee. Connectez-la d'abord dans Integrations.\n5. Une fois au moins un canal selectionne, cliquez le toggle pour activer\n6. L'agent commence a travailler immediatement",
      },
      {
        title: 'Desactiver ou changer les canaux',
        content: "Pour desactiver, cliquez simplement sur le toggle vert. L'automatisation s'arrete instantanement. Toute votre configuration est conservee, vous pouvez la reactiver quand vous voulez. Pour modifier les canaux, cliquez ou decliquez les boutons de canal. Les changements sont sauvegardes automatiquement. Par exemple, vous pouvez commencer avec le canal Email seul puis ajouter le Chat plus tard.",
      },
    ],
  },
  {
    id: 'sav-ecommerce',
    category: 'automatisations',
    title: 'SAV E-commerce',
    summary: 'Comment l\'IA repond automatiquement aux demandes de vos clients : suivi, retours, FAQ.',
    icon: Headphones,
    readTime: '5 min',
    sections: [
      {
        title: 'Ce que fait le SAV automatise',
        content: "L'automatisation SAV E-commerce est le coeur d'Actero. Elle traite automatiquement les demandes les plus courantes de vos clients : ou est mon colis, je veux faire un retour, quand vais-je etre rembourse, est-ce que ce produit est disponible en telle taille, etc. L'IA consulte vos commandes Shopify, votre base de connaissances et vos regles pour formuler des reponses precises et personnalisees.",
      },
      {
        title: 'Les canaux disponibles',
        content: "Le SAV peut fonctionner sur 4 canaux en parallele :\n\n- Email : l'IA lit les emails entrants (via Gmail ou votre email pro) et y repond\n- Chat sur le site : un widget de chat s'installe sur votre boutique Shopify, l'IA repond en direct\n- Gorgias : l'IA traite les tickets directement dans Gorgias\n- Zendesk : l'IA traite les tickets directement dans Zendesk\n\nVous pouvez activer un seul canal ou tous en meme temps.",
      },
      {
        title: 'Comment l\'IA classe les demandes',
        content: "Quand un message arrive, l'IA l'analyse et le classe automatiquement : suivi de commande, demande de retour, question produit, reclamation, demande de remboursement, etc. Selon la categorie, elle applique une strategie de reponse differente. Pour un suivi de commande, elle va chercher le statut dans Shopify. Pour un retour, elle verifie votre politique. Pour une reclamation, elle peut escalader vers vous.",
      },
      {
        title: 'Quand l\'IA escalade',
        content: "L'IA ne repond pas au hasard. Si elle n'est pas assez sure de sa reponse, si le client est agressif, si la commande depasse un certain montant, ou si un garde-fou est declenche, elle escalade la demande vers vous dans l'onglet A traiter. Vous pouvez alors approuver, modifier ou rejeter la reponse proposee. C'est un filet de securite qui garantit que vos clients recoivent toujours une reponse de qualite.",
      },
    ],
  },
  {
    id: 'relance-paniers-abandonnes',
    category: 'automatisations',
    title: 'Relance Paniers Abandonnes',
    summary: 'Recuperer les ventes perdues grace aux emails de relance automatiques.',
    icon: ShoppingBag,
    readTime: '4 min',
    sections: [
      {
        title: 'Comment ca marche',
        content: "Quand un visiteur ajoute des produits a son panier sur votre boutique Shopify mais ne finalise pas sa commande, Actero le detecte automatiquement. L'IA envoie alors un email de relance personnalise au client, avec les produits qu'il a laisses et un message adapte a votre ton de marque. Le but est de le convaincre de revenir finir sa commande.",
      },
      {
        title: 'Ce qu\'il faut pour que ca fonctionne',
        content: "Pour que la relance fonctionne, vous avez besoin de deux choses : Shopify connecte (pour detecter les paniers abandonnes) et un canal email connecte (Gmail ou email SMTP pour envoyer la relance). Si vous avez Klaviyo connecte, vous pouvez aussi envoyer des relances par SMS. Activez les canaux souhaites dans l'automatisation.",
      },
      {
        title: 'La sequence de relance',
        content: "Par defaut, l'IA envoie un email dans les heures qui suivent l'abandon du panier. L'email est personnalise : il contient le prenom du client, les produits laisses dans le panier, et un message dans votre ton de marque. L'IA adapte le message en fonction du montant du panier et du profil du client (nouveau client vs client fidele).",
      },
      {
        title: 'Resultats attendus',
        content: "En moyenne, les boutiques qui activent la relance de paniers recuperent entre 5 et 15% de paniers supplementaires. Le resultat depend de votre secteur, du montant moyen de vos paniers et de la qualite de l'email de relance. Vous pouvez suivre les paniers recuperes dans votre dashboard, dans les metriques et dans le feed d'activite.",
      },
    ],
  },
  {
    id: 'comptabilite-automatisee',
    category: 'automatisations',
    title: 'Comptabilite Automatisee',
    summary: 'Automatiser les relances de factures, exports et alertes de tresorerie.',
    icon: TrendingUp,
    readTime: '4 min',
    sections: [
      {
        title: 'Ce que ca automatise',
        content: "L'automatisation Comptabilite prend en charge les taches comptables repetitives : relance des factures impayees par email, export automatique de vos donnees de ventes vers vos outils comptables, et alertes de tresorerie dans Slack quand un seuil est atteint. C'est particulierement utile si vous passez du temps chaque mois a relancer des factures ou a exporter des donnees.",
      },
      {
        title: 'Ce qu\'il faut avoir connecte',
        content: "Au minimum, Shopify doit etre connecte pour que l'IA puisse acceder a vos donnees de ventes et factures. Pour les relances par email, connectez Gmail ou un email SMTP. Pour les alertes de tresorerie dans Slack, connectez Slack. Et si vous utilisez Axonaut, Pennylane ou iPaidThat, connectez-les aussi pour automatiser les exports.",
      },
      {
        title: 'Les canaux disponibles',
        content: "Deux canaux sont disponibles pour cette automatisation : Email pour les relances de factures et les exports par email, et Slack pour les alertes de tresorerie. Vous pouvez activer l'un ou les deux selon vos besoins.",
      },
      {
        title: 'Comment ca se passe au quotidien',
        content: "Une fois activee, l'automatisation tourne en arriere-plan. Quand une facture n'est pas payee apres un certain delai, l'IA envoie un email de relance poli au client. Si votre tresorerie passe sous un seuil que vous definissez, vous recevez une alerte dans Slack. Les exports comptables sont envoyes periodiquement a votre comptable ou vers votre outil de comptabilite.",
      },
    ],
  },
  {
    id: 'agent-vocal-ia',
    category: 'automatisations',
    title: 'Agent Vocal IA',
    summary: 'Un agent telephonique IA qui repond aux appels sur votre site. Bientot disponible.',
    icon: Mic,
    readTime: '3 min',
    sections: [
      {
        title: 'Ce que c\'est',
        content: "L'agent vocal est un assistant telephonique propulse par l'IA qui repond aux questions de vos clients par la voix, directement sur votre site. Quand un visiteur clique sur le bouton d'appel, il parle a l'agent comme s'il appelait un vrai conseiller. L'agent comprend les questions, consulte vos donnees (commandes, produits, FAQ) et repond oralement.",
      },
      {
        title: 'Ce qu\'il pourra faire',
        content: "L'agent vocal pourra repondre aux questions sur vos produits, donner le statut d'une commande en cours, expliquer votre politique de retour et de livraison, et transferer vers un humain si la demande est trop complexe. Il utilisera votre base de connaissances et vos regles, exactement comme l'agent ecrit.",
      },
      {
        title: 'Disponibilite',
        content: "L'agent vocal est actuellement en cours de developpement. Il sera bientot disponible pour tous les clients Actero. Quand il sera pret, vous pourrez l'activer depuis la page Automatisations, configurer la voix, le message d'accueil et les regles de transfert, puis l'installer sur votre boutique Shopify en un clic.",
      },
    ],
  },

  // ─────────────────────────────────
  // MON AGENT
  // ─────────────────────────────────
  {
    id: 'configurer-ton-agent',
    category: 'agent-ia',
    title: 'Configurer le ton de votre agent',
    summary: 'Ajuster la personnalite de votre agent avec les 3 curseurs de ton.',
    icon: Sliders,
    readTime: '4 min',
    sections: [
      {
        title: 'Ou trouver les reglages de ton',
        content: "Allez dans Mon Agent dans le menu a gauche. La premiere section que vous voyez s'appelle Ton de votre agent. Vous y trouvez 3 curseurs que vous pouvez deplacer avec la souris. Chaque curseur controle un aspect de la personnalite de votre agent. La previsualisation en dessous des curseurs se met a jour en temps reel pour que vous voyiez l'effet immediatement.",
      },
      {
        title: 'Les 3 curseurs expliques',
        content: "Curseur 1 — Formel / Casual : a gauche, l'agent vouvoie et utilise un vocabulaire soigne. A droite, il tutoie et parle de facon decontractee. Pour une boutique de luxe, mettez le curseur a gauche. Pour une marque jeune et fun, mettez-le a droite.\n\nCurseur 2 — Froid / Chaleureux : a gauche, l'agent est factuel et va droit au but. A droite, il est empathique, prend le temps et ajoute une touche humaine. La plupart des boutiques preferent un ton chaleureux.\n\nCurseur 3 — Court / Detaille : a gauche, l'agent repond en 2-3 phrases. A droite, il donne des explications completes avec du contexte. Pour des questions simples (suivi de colis), un ton court suffit. Pour des reclamations, un ton detaille est preferable.",
      },
      {
        title: 'La previsualisation',
        content: "Sous les curseurs, un encadre affiche un exemple de reponse en temps reel. Deplacez les curseurs et regardez comment le texte change. Ca vous donne une idee concrete de comment votre agent va s'exprimer. C'est le meilleur moyen de trouver le ton qui colle a votre marque sans avoir besoin de tester avec de vrais clients.",
      },
      {
        title: 'Sauvegarder',
        content: "Une fois satisfait du ton, cliquez le bouton Enregistrer la configuration en bas de la page. Tant que vous n'avez pas sauvegarde, les changements ne sont pas appliques. Apres sauvegarde, l'agent utilise immediatement les nouveaux reglages pour toutes les prochaines reponses.",
      },
    ],
  },
  {
    id: 'base-de-connaissances',
    category: 'agent-ia',
    title: 'Alimenter la base de connaissances',
    summary: 'Les 3 methodes pour enrichir le savoir de votre agent et ameliorer ses reponses.',
    icon: Brain,
    readTime: '5 min',
    sections: [
      {
        title: 'Pourquoi c\'est important',
        content: "La base de connaissances, c'est tout ce que votre agent sait sur votre boutique. Plus elle est riche, meilleures sont ses reponses. Sans base de connaissances, l'agent ne connait que les informations de base de Shopify (commandes, produits). Avec une bonne base, il peut repondre a des questions sur votre politique de retour, vos delais de livraison, vos promotions en cours, les tailles de vos produits, etc.",
      },
      {
        title: 'Methode 1 : Importer depuis une URL',
        content: "C'est la methode la plus rapide. Dans Mon Agent, section Base de connaissances, collez l'URL de votre page FAQ ou de votre politique de retour. Cliquez le bouton eclair. L'IA va lire la page, extraire les informations importantes, et creer automatiquement des paires Question/Reponse. En 10 secondes, votre agent a appris tout le contenu de la page. Vous pouvez importer autant de pages que vous voulez.",
      },
      {
        title: 'Methode 2 : Importer un fichier',
        content: "Vous avez un document PDF, un fichier texte ou un CSV avec vos FAQ ? Glissez-le dans la zone d'import de fichier dans Mon Agent. L'IA analyse le contenu et en extrait les informations utiles. Les formats acceptes sont PDF, TXT, CSV, MD et DOC. La taille maximale est de 4 Mo par fichier.",
      },
      {
        title: 'Methode 3 : Ajouter manuellement',
        content: "Cliquez sur Ajouter une entree manuellement dans la section Base de connaissances. Donnez un titre (par exemple 'Delais de livraison') et ecrivez le contenu (par exemple 'La livraison standard est gratuite et prend 3-5 jours ouvrables. La livraison express est a 9,90 euros et prend 24-48h.'). C'est la methode la plus precise car vous ecrivez exactement ce que vous voulez que l'agent sache.",
      },
      {
        title: 'Gerer vos entrees',
        content: "Toutes vos entrees apparaissent en bas de la section. Vous pouvez les modifier (icone crayon) ou les supprimer (icone poubelle) a tout moment. Plus votre base est a jour, mieux l'agent repond. Pensez a la mettre a jour quand vous changez votre politique de retour, vos delais ou vos promotions.",
      },
    ],
  },
  {
    id: 'comprendre-escalades',
    category: 'agent-ia',
    title: 'Comprendre les escalades (A traiter)',
    summary: 'Ce qu\'est une escalade, comment la traiter, et comment en avoir moins.',
    icon: AlertTriangle,
    readTime: '5 min',
    sections: [
      {
        title: 'Qu\'est-ce qu\'une escalade',
        content: "Une escalade, c'est quand votre agent IA decide qu'il ne peut pas repondre seul a une demande. Plutot que de risquer une mauvaise reponse, il met la demande de cote et vous la montre dans l'onglet A traiter. Un badge rouge dans le menu vous indique combien d'escalades attendent votre attention. C'est un mecanisme de securite : votre agent prefere vous demander plutot que de dire n'importe quoi.",
      },
      {
        title: 'Pourquoi l\'agent escalade',
        content: "Les raisons les plus courantes sont : l'agent n'a pas assez d'informations dans sa base de connaissances pour repondre, le client est agressif ou menacant, un de vos garde-fous s'est declenche (par exemple une demande de remboursement au-dessus d'un certain montant), la confiance de l'IA est trop basse sur sa reponse, ou le message contient un mot-cle sensible que vous avez defini (comme 'avocat' ou 'plainte').",
      },
      {
        title: 'Comment traiter une escalade',
        content: "Allez dans A traiter dans le menu. Pour chaque escalade, vous voyez le message original du client et la reponse que l'IA propose. Vous avez 3 options :\n\n- Approuver : la reponse proposee est bonne, envoyez-la telle quelle au client\n- Modifier : ajustez le texte de la reponse puis envoyez-la\n- Rejeter : ne pas envoyer de reponse (par exemple si c'est du spam)\n\nLa reponse est envoyee automatiquement au client sur le canal d'origine.",
      },
      {
        title: 'Comment reduire les escalades',
        content: "Si vous avez trop d'escalades, c'est generalement bon signe : ca veut dire que l'agent est prudent. Mais vous pouvez en reduire le nombre en enrichissant votre base de connaissances sur les sujets qui reviennent souvent. Regardez les escalades : si vous voyez le meme type de question 5 fois, ajoutez une FAQ sur ce sujet. L'agent saura y repondre la prochaine fois. En une semaine, vous pouvez diviser vos escalades par deux.",
      },
    ],
  },
  {
    id: 'definir-regles-agent',
    category: 'agent-ia',
    title: 'Definir vos regles',
    summary: 'Les garde-fous et seuils d\'escalade pour controler ce que l\'agent peut faire.',
    icon: Shield,
    readTime: '4 min',
    sections: [
      {
        title: 'Les garde-fous',
        content: "Les garde-fous sont des regles que votre agent ne doit JAMAIS enfreindre. Par exemple : ne jamais proposer un remboursement sans votre accord, ne jamais mentionner un concurrent, toujours demander le numero de commande avant de traiter un retour. Vous pouvez definir autant de regles que vous voulez. L'agent les verifie avant chaque reponse.",
      },
      {
        title: 'Les seuils d\'escalade',
        content: "Les seuils definissent quand l'agent doit automatiquement vous passer la main. Vous pouvez configurer :\n\n- Montant maximum : escalader si la commande depasse X euros\n- Client fidele : escalader si le client a plus de X commandes (pour un traitement VIP)\n- Confiance IA : escalader si l'IA est sure de sa reponse a moins de X%\n- Ton agressif : escalader automatiquement quand le client est en colere\n- Mots-cles sensibles : escalader si le message contient certains mots (avocat, plainte, DGCCRF...)",
      },
      {
        title: 'Le constructeur visuel de regles',
        content: "Vous n'avez pas besoin de coder pour creer des regles. Dans Mon Agent, section Regles, vous trouvez un constructeur visuel. Chaque regle a un toggle pour l'activer ou la desactiver. Vous pouvez modifier les seuils avec de simples champs numeriques. Le tout est sauvegarde quand vous cliquez Enregistrer la configuration.",
      },
      {
        title: 'Trouver le bon equilibre',
        content: "Si vous mettez trop de regles ou des seuils trop bas, l'agent escalade tout et ne traite plus rien automatiquement. Si vous en mettez trop peu, l'agent risque de mal repondre sur des cas delicats. Le bon equilibre : commencez avec les regles par defaut, surveillez les escalades pendant une semaine, puis ajustez. La plupart des boutiques n'ont besoin que de 3-5 garde-fous bien choisis.",
      },
    ],
  },

  // ─────────────────────────────────
  // DASHBOARD & METRIQUES
  // ─────────────────────────────────
  {
    id: 'comprendre-metriques',
    category: 'dashboard',
    title: 'Comprendre vos metriques',
    summary: 'Les 5 chiffres cles de votre dashboard et ce qu\'ils veulent dire.',
    icon: BarChart3,
    readTime: '4 min',
    sections: [
      {
        title: 'Les 5 metriques principales',
        content: "Sur votre page d'accueil, vous voyez 5 chiffres importants :\n\n1. Tickets resolus : le nombre de demandes clients traitees automatiquement par l'IA ce mois-ci. C'est le chiffre le plus important, il montre combien de travail l'IA fait pour vous.\n\n2. Escalades : le nombre de demandes que l'IA n'a pas pu traiter seule et qui attendent votre reponse.\n\n3. Temps economise : le nombre d'heures que vous auriez passe a traiter ces tickets vous-meme.\n\n4. Actions IA : le nombre total d'actions executees par l'IA (reponses envoyees, emails de relance, classifications, etc.)\n\n5. ROI genere : l'estimation financiere de la valeur creee. C'est le temps economise multiplie par votre cout horaire, moins le prix de votre abonnement.",
      },
      {
        title: 'Les pourcentages en vert et en rouge',
        content: "A cote de chaque chiffre, vous voyez parfois un pourcentage avec une fleche. En vert avec une fleche vers le haut, ca veut dire que le chiffre augmente par rapport au mois precedent. C'est generalement positif (plus de tickets resolus = l'IA travaille plus). En rouge avec une fleche vers le bas, ca diminue. Pour les escalades, une baisse en rouge est en fait une bonne nouvelle : ca veut dire que l'IA s'ameliore et escalade moins.",
      },
      {
        title: 'Le feed d\'activite en direct',
        content: "Sous les metriques, vous voyez l'activite en temps reel de votre agent. Chaque action apparait au fur et a mesure : un ticket resolu, un email de relance envoye, un panier recupere, une escalade. Un point vert pulse indique que la connexion en temps reel est active. Vous pouvez donner votre avis sur chaque reponse de l'IA avec les boutons pouce haut et pouce bas. Chaque feedback aide l'IA a s'ameliorer.",
      },
      {
        title: 'Les graphiques',
        content: "Votre dashboard affiche aussi des graphiques d'activite sur les 14 derniers jours et un graphique d'evolution du ROI. Ces graphiques vous permettent de voir les tendances : est-ce que le nombre de tickets augmente ? Le ROI est-il en croissance ? Si vous voyez un pic de tickets un jour donne, c'est peut-etre lie a une promotion ou un probleme de livraison.",
      },
    ],
  },
  {
    id: 'configurer-roi',
    category: 'dashboard',
    title: 'Configurer le ROI',
    summary: 'Renseigner vos couts pour que le calcul de retour sur investissement soit precis.',
    icon: TrendingUp,
    readTime: '3 min',
    sections: [
      {
        title: 'Comment le ROI est calcule',
        content: "Le ROI (retour sur investissement) mesure la valeur que vous creez grace a Actero. La formule est simple : (Temps economise en heures x Cout horaire de votre equipe) - Prix de votre abonnement Actero. Par exemple, si l'IA a economise 40 heures ce mois-ci, que votre cout horaire est de 25 euros, et que votre abonnement est de 199 euros, votre ROI est de (40 x 25) - 199 = 801 euros.",
      },
      {
        title: 'Ou configurer les parametres',
        content: "Allez dans Mon Profil puis Calcul du ROI (ou directement depuis le lien dans la section metriques du dashboard). Vous avez 3 champs a remplir :\n\n1. Cout horaire de votre equipe support : combien coute 1 heure de travail d'un agent support dans votre entreprise (salaire charges comprises divise par le nombre d'heures).\n\n2. Temps moyen par ticket : combien de minutes prend en moyenne le traitement d'un ticket client (entre 3 et 10 minutes generalement).\n\n3. Votre abonnement Actero : le montant mensuel de votre abonnement.",
      },
      {
        title: 'Le calcul en temps reel',
        content: "Une fois les parametres renseignes, le ROI se met a jour en temps reel sur votre dashboard. Vous voyez 4 chiffres : le nombre de tickets resolus ce mois, le temps economise en heures, la valeur economisee en euros, et le ROI net (valeur economisee moins abonnement). Si le ROI net est positif et en vert, Actero vous rapporte plus qu'il ne vous coute. C'est generalement le cas des le premier mois.",
      },
    ],
  },
  {
    id: 'tester-votre-agent',
    category: 'dashboard',
    title: 'Tester votre agent',
    summary: 'Utiliser les tests et le chat libre pour verifier les reponses de votre agent.',
    icon: PlayCircle,
    readTime: '4 min',
    sections: [
      {
        title: 'Les tests de playbook',
        content: "Dans la section Tester de votre dashboard, vous trouvez des scenarios pre-faits qui simulent des situations reelles : un client qui demande ou est son colis, un client mecontent, une demande de remboursement, etc. Cliquez sur Lancer le test et l'agent repond comme il le ferait avec un vrai client. Chaque reponse est evaluee automatiquement sur sa pertinence et son ton.",
      },
      {
        title: 'Le chat libre',
        content: "Vous pouvez aussi taper n'importe quel message dans le champ de chat libre, comme si vous etiez un client. L'agent repond en utilisant votre configuration actuelle (ton, regles, base de connaissances). C'est le meilleur moyen de verifier que l'agent reagit bien a des questions specifiques a votre boutique. Aucun vrai ticket n'est cree, c'est un mode bac a sable.",
      },
      {
        title: 'Comprendre les resultats',
        content: "Chaque reponse de test affiche un score de qualite. Si le score est eleve, la reponse est pertinente et bien formulee. Si le score est bas, ca peut indiquer que la base de connaissances manque d'informations sur ce sujet, ou que les instructions sont contradictoires. Utilisez les tests pour identifier les points faibles et ajustez votre configuration en consequence.",
      },
      {
        title: 'Quand tester',
        content: "Testez apres chaque modification importante : ajout de FAQ, changement de ton, nouvelle regle de garde-fou. C'est aussi utile quand vous ajoutez de nouveaux produits a votre catalogue ou quand vous changez votre politique de retour. Les tests vous evitent de decouvrir un probleme avec un vrai client.",
      },
    ],
  },
  {
    id: 'configurer-notifications',
    category: 'dashboard',
    title: 'Configurer les notifications',
    summary: 'Choisir ce que vous recevez et par quel canal : email, Slack, push, vocal.',
    icon: Bell,
    readTime: '3 min',
    sections: [
      {
        title: 'Acceder aux notifications',
        content: "Cliquez sur votre nom en bas a gauche du dashboard, puis selectionnez Notifications. Vous arrivez sur la page ou vous pouvez configurer chaque type de notification et choisir par quel canal la recevoir.",
      },
      {
        title: 'Les types de notifications',
        content: "Il y a 3 categories :\n\n1. Alertes critiques : les escalades, les tickets urgents, les anomalies detectees, les tentatives de fraude. Ce sont les notifications les plus importantes, celles que vous ne voulez pas rater.\n\n2. Rapports : resume quotidien, hebdomadaire ou mensuel de l'activite de votre agent. Pratique pour avoir une vue d'ensemble sans ouvrir le dashboard.\n\n3. Activite : nouvelles integrations configurees, suggestions d'amelioration de l'IA, jalons atteints (par exemple : 1000 tickets resolus).",
      },
      {
        title: 'Les canaux de notification',
        content: "Pour chaque type de notification, vous choisissez comment la recevoir : par Email, dans Slack (si connecte), en notification Push dans le navigateur, ou en Rapport vocal (un resume audio). Vous pouvez combiner plusieurs canaux pour les alertes critiques (par exemple email ET Slack) et n'en garder qu'un pour les rapports.",
      },
      {
        title: 'Les heures silencieuses',
        content: "Si vous ne voulez pas etre derange la nuit ou le week-end, activez le mode silencieux. Allez dans Notifications puis Horaires puis Mode silencieux. Definissez la plage horaire pendant laquelle aucune notification ne sera envoyee (par exemple de 22h a 7h). Les alertes critiques seront mises en attente et envoyees des la fin du mode silencieux.",
      },
    ],
  },

  // ─────────────────────────────────
  // FACTURATION
  // ─────────────────────────────────
  {
    id: 'gerer-facturation',
    category: 'billing',
    title: 'Gerer votre facturation',
    summary: 'Plan, portail Stripe, consommation et changement de moyen de paiement.',
    icon: CreditCard,
    readTime: '3 min',
    sections: [
      {
        title: 'Acceder a la facturation',
        content: "Cliquez sur votre nom en bas a gauche du dashboard, puis selectionnez Facturation. Vous voyez votre plan actuel, le statut de votre abonnement, la date de debut, et les fonctionnalites incluses.",
      },
      {
        title: 'Le portail Stripe',
        content: "Pour tout ce qui touche au paiement, cliquez sur le bouton Portail Stripe. Vous etes redirige vers un portail securise gere par Stripe ou vous pouvez : telecharger toutes vos factures en PDF, mettre a jour votre carte bancaire ou ajouter un nouveau moyen de paiement, modifier votre abonnement (monter ou descendre en gamme), et annuler votre abonnement si besoin (l'annulation prend effet en fin de periode payee).",
      },
      {
        title: 'Comprendre votre consommation',
        content: "En bas de la page Facturation, vous voyez votre consommation du mois en cours : le nombre de runs du moteur IA (chaque fois que l'agent traite une demande) et le nombre total d'evenements. Ces chiffres vous donnent une idee de l'activite de votre agent. La facturation Actero est mensuelle et forfaitaire : vous ne payez pas a l'usage, le nombre de tickets traites est illimite dans votre plan.",
      },
      {
        title: 'Changer de moyen de paiement',
        content: "Pour changer de carte bancaire, passez par le Portail Stripe. Cliquez sur Mettre a jour le moyen de paiement, entrez les nouvelles informations, et validez. Le changement est immediat et votre prochaine facture sera debitee sur la nouvelle carte. Tous les paiements sont securises par Stripe (norme PCI DSS niveau 1).",
      },
    ],
  },
];

const CATEGORIES = [
  { id: 'getting-started', icon: Zap, title: 'Premiers pas', desc: 'Comprendre et demarrer avec Actero' },
  { id: 'integrations', icon: Plug, title: 'Integrations', desc: 'Connecter vos outils' },
  { id: 'automatisations', icon: Sparkles, title: 'Automatisations', desc: 'Activer vos automatisations' },
  { id: 'agent-ia', icon: Brain, title: 'Mon Agent', desc: 'Configurer et personnaliser votre agent IA' },
  { id: 'dashboard', icon: BarChart3, title: 'Dashboard & Metriques', desc: 'Suivre vos resultats' },
  { id: 'billing', icon: CreditCard, title: 'Facturation', desc: 'Abonnement et factures' },
];

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export const SupportGuidePage = ({ onNavigate }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [search, setSearch] = useState('');
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const openGuide = (guide) => {
    setSelectedGuide(guide);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    setSelectedGuide(null);
    window.scrollTo(0, 0);
  };

  // Filter guides by search
  const filteredGuides = search.trim().length >= 2
    ? GUIDES.filter(g =>
        `${g.title} ${g.summary} ${g.sections.map(s => s.title + ' ' + s.content).join(' ')}`
          .toLowerCase().includes(search.toLowerCase())
      )
    : selectedCategory
      ? GUIDES.filter(g => g.category === selectedCategory)
      : GUIDES;

  // ── GUIDE DETAIL VIEW ──
  if (selectedGuide) {
    const guide = selectedGuide;
    const Icon = guide.icon;
    return (
      <>
        <SEO
          title={`${guide.title} — Centre d'aide Actero`}
          description={guide.summary}
          canonical="/support"
        />
        <div className="relative min-h-screen bg-white font-sans text-[#262626]">
          <Navbar onNavigate={onNavigate} onAuditOpen={() => onNavigate("/audit")} />
          <main className="pt-28 md:pt-36 pb-24 px-6">
            <div className="max-w-3xl mx-auto">
              {/* Back button */}
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-sm font-medium text-[#716D5C] hover:text-[#003725] transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" /> Retour au centre d'aide
              </button>

              {/* Header */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#003725]/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#003725]" />
                  </div>
                  <span className="text-xs font-semibold text-[#716D5C] uppercase tracking-wider">
                    {CATEGORIES.find(c => c.id === guide.category)?.title}
                  </span>
                </div>
                <h1
                  className="text-3xl md:text-4xl font-normal text-[#262626] mb-4 leading-[1.15]"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
                >
                  {guide.title}
                </h1>
                <p className="text-[#716D5C] text-lg leading-relaxed">{guide.summary}</p>
                <div className="flex items-center gap-2 mt-4 text-xs text-[#716D5C]">
                  <Clock className="w-3.5 h-3.5" />
                  Lecture : {guide.readTime}
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-10">
                {guide.sections.map((section, i) => (
                  <section key={i}>
                    <h2 className="text-xl font-bold text-[#262626] mb-4">
                      {section.title}
                    </h2>
                    <div className="text-[#716D5C] leading-relaxed text-[15px] whitespace-pre-line">
                      {section.content}
                    </div>
                    {i < guide.sections.length - 1 && (
                      <div className="mt-10 h-px bg-gray-200" />
                    )}
                  </section>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-16 p-8 bg-[#F9F7F1] rounded-2xl border border-gray-200 text-center">
                <p className="text-[#262626] font-bold mb-2">Besoin d'aide supplementaire ?</p>
                <p className="text-sm text-[#716D5C] mb-4">Notre equipe repond en moins de 24h.</p>
                <a href="mailto:contact@actero.fr" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F5F35] text-white rounded-full text-sm font-semibold hover:bg-[#003725] transition-colors">
                  <Mail className="w-4 h-4" /> Contacter le support
                </a>
              </div>
            </div>
          </main>
          <Footer onNavigate={onNavigate} />
        </div>
      </>
    );
  }

  // ── HOME VIEW ──
  return (
    <>
      <SEO
        title="Centre d'aide — Actero"
        description="Guides, tutoriels et documentation pour utiliser Actero. Integrations, dashboard, agents IA, facturation."
        canonical="/support"
      />
      <div className="relative min-h-screen bg-white font-sans text-[#262626]">
        <Navbar onNavigate={onNavigate} onAuditOpen={() => onNavigate("/audit")} />

        <main className="pt-28 md:pt-36 pb-24 px-6">
          <div className="max-w-4xl mx-auto">

            {/* Hero */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F9F7F1] border border-gray-200 text-[#716D5C] text-xs font-bold uppercase tracking-widest mb-6">
                <BookOpen className="w-3.5 h-3.5" />
                Centre d'aide
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-normal text-[#262626] mb-6 leading-[1.1]"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
              >
                Comment pouvons-nous vous aider ?
              </h1>

              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#716D5C]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedCategory(null); }}
                  placeholder="Rechercher un guide, une question..."
                  className="w-full pl-12 pr-4 py-4 bg-[#F9F7F1] border border-gray-200 rounded-2xl text-[15px] text-[#262626] placeholder-gray-400 outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
            </div>

            {/* Categories */}
            {!search.trim() && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  const count = GUIDES.filter(g => g.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(isActive ? null : cat.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isActive
                          ? 'bg-[#003725] text-white border-[#003725]'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-white/80' : 'text-[#003725]'}`} />
                      <h3 className="font-bold text-xs mb-0.5">{cat.title}</h3>
                      <p className={`text-[10px] ${isActive ? 'text-white/60' : 'text-[#716D5C]'}`}>
                        {count} guide{count > 1 ? 's' : ''}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Guides list */}
            <div className="space-y-3">
              {filteredGuides.length === 0 ? (
                <div className="text-center py-16 text-[#716D5C]">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun guide trouve pour "{search}"</p>
                </div>
              ) : (
                filteredGuides.map(guide => {
                  const Icon = guide.icon;
                  const catLabel = CATEGORIES.find(c => c.id === guide.category)?.title;
                  return (
                    <button
                      key={guide.id}
                      onClick={() => openGuide(guide)}
                      className="w-full flex items-center gap-5 p-5 bg-white border border-gray-200 rounded-2xl text-left hover:border-gray-300 hover:shadow-sm transition-all group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#F9F7F1] flex items-center justify-center shrink-0 group-hover:bg-[#003725]/10 transition-colors">
                        <Icon className="w-5 h-5 text-[#003725]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[15px] text-[#262626]">{guide.title}</h3>
                          <span className="text-[10px] text-[#716D5C] bg-[#F9F7F1] px-2 py-0.5 rounded-full shrink-0">{catLabel}</span>
                        </div>
                        <p className="text-sm text-[#716D5C] truncate">{guide.summary}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-[#716D5C]">{guide.readTime}</span>
                        <ArrowRight className="w-4 h-4 text-[#716D5C] group-hover:text-[#003725] transition-colors" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Contact CTA */}
            <div className="mt-20 text-center p-10 bg-[#F9F7F1] rounded-3xl border border-gray-200">
              <h2 className="text-2xl font-bold text-[#262626] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Vous n'avez pas trouve votre reponse ?
              </h2>
              <p className="text-[#716D5C] mb-6">Notre equipe repond en moins de 24h.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="mailto:contact@actero.fr"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F5F35] text-white rounded-full font-semibold hover:bg-[#003725] transition-colors"
                >
                  <Mail className="w-4 h-4" /> contact@actero.fr
                </a>
                <button
                  onClick={() => onNavigate('/audit')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-[#003725] font-semibold underline underline-offset-4 decoration-[#003725]/40 hover:decoration-[#003725] transition-colors"
                >
                  Reserver un audit gratuit <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>

        <Footer onNavigate={onNavigate} />
      </div>
    </>
  );
};
