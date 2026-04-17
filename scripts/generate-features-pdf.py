"""
Generate Actero - Features complètes.pdf using Actero brand tokens.

Brand tokens (from skills/actero-branding):
  Primary:   #1F3A12  (forest green)
  CTA:       #0E653A
  Gold:      #8B7A50
  Cream:     #F4F0E6
  Ink:       #1A1A1A
  Ink-2:     #3A3A3A
  Ink-3:     #5A5A5A
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, Color
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, Flowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pathlib import Path

# ── Brand tokens ─────────────────────────────────────────────────
PRIMARY = HexColor("#1F3A12")
CTA = HexColor("#0E653A")
PRIMARY_SOFT = HexColor("#A8C490")
GOLD = HexColor("#8B7A50")
CREAM = HexColor("#F4F0E6")
SURFACE = HexColor("#FFFFFF")
INK = HexColor("#1A1A1A")
INK2 = HexColor("#3A3A3A")
INK3 = HexColor("#5A5A5A")
INK4 = HexColor("#8B8070")
BORDER = HexColor("#EDE8D9")

# ── Styles ───────────────────────────────────────────────────────
styles = getSampleStyleSheet()

H1 = ParagraphStyle(
    "ActeroH1",
    parent=styles["Heading1"],
    fontName="Times-Bold",
    fontSize=28,
    leading=32,
    textColor=INK,
    spaceAfter=4,
    leftIndent=0,
)
H2 = ParagraphStyle(
    "ActeroH2",
    parent=styles["Heading2"],
    fontName="Times-Bold",
    fontSize=18,
    leading=22,
    textColor=INK,
    spaceBefore=18,
    spaceAfter=6,
)
H3 = ParagraphStyle(
    "ActeroH3",
    parent=styles["Heading3"],
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=16,
    textColor=PRIMARY,
    spaceBefore=12,
    spaceAfter=2,
)
EYEBROW = ParagraphStyle(
    "ActeroEyebrow",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=9,
    leading=12,
    textColor=GOLD,
    spaceAfter=8,
)
BODY = ParagraphStyle(
    "ActeroBody",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=10,
    leading=15,
    textColor=INK2,
    spaceAfter=6,
)
BODY_SMALL = ParagraphStyle(
    "ActeroBodySmall",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9,
    leading=13,
    textColor=INK3,
    spaceAfter=4,
)
FEATURE_NAME = ParagraphStyle(
    "FeatureName",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=10,
    leading=13,
    textColor=INK,
    spaceAfter=1,
)
FEATURE_DESC = ParagraphStyle(
    "FeatureDesc",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9,
    leading=12,
    textColor=INK3,
    spaceAfter=0,
)
TAG_STARTER = ParagraphStyle(
    "TagStarter", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=7, textColor=HexColor("#1D4ED8"),
    alignment=TA_CENTER,
)
TAG_PRO = ParagraphStyle(
    "TagPro", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=7, textColor=HexColor("#92400E"),
    alignment=TA_CENTER,
)
TAG_FREE = ParagraphStyle(
    "TagFree", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=7, textColor=INK3,
    alignment=TA_CENTER,
)
TAG_ENT = ParagraphStyle(
    "TagEnt", parent=styles["Normal"],
    fontName="Helvetica-Bold", fontSize=7, textColor=PRIMARY,
    alignment=TA_CENTER,
)


class Divider(Flowable):
    """48 × 3 green bar like the Actero email accent."""
    def __init__(self, width=48, height=3, color=PRIMARY):
        super().__init__()
        self.width = width
        self.height = height
        self.color = color

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, 1, fill=1, stroke=0)

    def wrap(self, aW, aH):
        return self.width, self.height + 6


def tag(label, plan):
    """Render a small pill cell for a plan tier."""
    colors = {
        "FREE": (HexColor("#F5F5F5"), INK3),
        "STARTER": (HexColor("#DBEAFE"), HexColor("#1D4ED8")),
        "PRO": (HexColor("#FEF3C7"), HexColor("#92400E")),
        "ENT": (HexColor("#E8F5EC"), PRIMARY),
    }
    bg, fg = colors[plan]
    style = ParagraphStyle(
        f"tag-{plan}", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=7, textColor=fg, alignment=TA_CENTER,
        leading=10,
    )
    return Paragraph(label, style)


def feature_row(name, desc, plan_label=None):
    left = [Paragraph(name, FEATURE_NAME), Paragraph(desc, FEATURE_DESC)]
    if plan_label:
        tag_cell = [tag(plan_label,
                        "STARTER" if plan_label == "Starter"
                        else "PRO" if plan_label == "Pro"
                        else "ENT" if plan_label == "Enterprise"
                        else "FREE")]
        t = Table([[left, tag_cell]], colWidths=[140 * mm, 25 * mm])
    else:
        t = Table([[left]], colWidths=[165 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, BORDER),
    ]))
    return t


# ── Page templates (cover + inner) ───────────────────────────────
def cover_page(c, doc):
    w, h = A4
    # Cream background
    c.setFillColor(CREAM)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Thin top accent bar
    c.setFillColor(PRIMARY)
    c.rect(0, h - 4, w, 4, fill=1, stroke=0)

    # Logo mark (A-shape) + wordmark
    mark_x, mark_y = 40 * mm, h - 55 * mm
    c.setFillColor(INK)
    path = c.beginPath()
    path.moveTo(mark_x + 8, mark_y + 22)
    path.lineTo(mark_x, mark_y)
    path.lineTo(mark_x + 4, mark_y)
    path.lineTo(mark_x + 8, mark_y + 11)
    path.lineTo(mark_x + 12, mark_y)
    path.lineTo(mark_x + 16, mark_y)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    c.setFont("Times-Bold", 20)
    c.setFillColor(INK)
    c.drawString(mark_x + 22, mark_y + 5, "Actero")

    # Eyebrow
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(GOLD)
    c.drawString(40 * mm, h / 2 + 40 * mm, "DOSSIER PRODUIT  ·  AVRIL 2026")

    # Title
    c.setFont("Times-Bold", 44)
    c.setFillColor(INK)
    c.drawString(40 * mm, h / 2 + 22 * mm, "Features complètes")
    c.setFont("Times-Italic", 22)
    c.setFillColor(INK2)
    c.drawString(40 * mm, h / 2 + 8 * mm, "La plateforme SAV IA")
    c.setFont("Times-Italic", 22)
    c.drawString(40 * mm, h / 2 - 2 * mm, "pour marques e-commerce.")

    # Green divider
    c.setFillColor(PRIMARY)
    c.roundRect(40 * mm, h / 2 - 12 * mm, 48, 3, 1, fill=1, stroke=0)

    # Subtitle
    c.setFont("Helvetica", 11)
    c.setFillColor(INK3)
    c.drawString(40 * mm, h / 2 - 22 * mm,
                 "Tour d'horizon complet : produit, plateforme, tarifs.")
    c.drawString(40 * mm, h / 2 - 30 * mm,
                 "Plus de 80 fonctionnalités réparties en 12 domaines.")

    # Stats bar (bottom green)
    box_y = 40 * mm
    box_h = 30 * mm
    c.setFillColor(PRIMARY)
    c.roundRect(40 * mm, box_y, w - 80 * mm, box_h, 6, fill=1, stroke=0)

    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(PRIMARY_SOFT)
    c.drawString(48 * mm, box_y + box_h - 10 * mm, "EN CHIFFRES")

    stats = [
        ("80+", "fonctionnalités"),
        ("4", "plans tarifaires"),
        ("12", "domaines produit"),
        ("100%", "français"),
    ]
    col_w = (w - 96 * mm) / 4
    for i, (val, lbl) in enumerate(stats):
        cx = 48 * mm + i * col_w + col_w / 2
        c.setFont("Times-Bold", 20)
        c.setFillColor(HexColor("#FFFFFF"))
        c.drawCentredString(cx, box_y + box_h - 20 * mm, val)
        c.setFont("Helvetica", 8)
        c.setFillColor(PRIMARY_SOFT)
        c.drawCentredString(cx, box_y + 6 * mm, lbl)

    # Footer
    c.setFont("Helvetica", 8)
    c.setFillColor(INK4)
    c.drawString(40 * mm, 20 * mm, "actero.fr  ·  contact@actero.fr  ·  Document interne")


def inner_page(c, doc):
    w, h = A4
    # Top thin bar
    c.setFillColor(PRIMARY)
    c.rect(0, h - 2, w, 2, fill=1, stroke=0)
    # Header text
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(GOLD)
    c.drawString(18 * mm, h - 10 * mm, "ACTERO  ·  FEATURES COMPLÈTES")
    c.setFont("Helvetica", 8)
    c.setFillColor(INK4)
    c.drawRightString(w - 18 * mm, h - 10 * mm, f"page {doc.page}")
    # Footer line
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(18 * mm, 15 * mm, w - 18 * mm, 15 * mm)
    c.setFont("Helvetica", 7)
    c.setFillColor(INK4)
    c.drawString(18 * mm, 10 * mm, "actero.fr")
    c.drawRightString(w - 18 * mm, 10 * mm, "Document confidentiel — avril 2026")


# ── Content ──────────────────────────────────────────────────────
def build_story():
    story = []

    # Cover handled via onFirstPage; we force a PageBreak before content.
    story.append(PageBreak())

    # ═══════════════ CONTEXTE ═══════════════
    story.append(Paragraph("LE PRODUIT", EYEBROW))
    story.append(Paragraph("Contexte", H1))
    story.append(Divider())
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "<b>Actero est une plateforme d'automatisation du SAV pour les marques e-commerce Shopify.</b> "
        "Elle combine un agent IA conversationnel, un portail self-service client et un tableau "
        "de bord opérationnel pour répondre automatiquement à 60–80&#37; des demandes entrantes.",
        BODY,
    ))
    story.append(Paragraph(
        "Contrairement aux outils SAV classiques où l'IA répond sous une identité tierce, "
        "chaque réponse Actero part de l'adresse email de la marque et l'expérience est 100&#37; "
        "à ses couleurs — du portail au pied de page. L'équipe du marchand garde la main sur les cas "
        "sensibles (crise, fraude, cas limite) grâce à un système d'escalade automatique.",
        BODY,
    ))
    story.append(Paragraph(
        "Le produit se déploie en moins de 15 minutes via intégration Shopify native, et "
        "s'améliore continuellement grâce à l'apprentissage sur la base de connaissances du marchand.",
        BODY,
    ))

    story.append(Paragraph("Stack technique", H3))
    story.append(Paragraph(
        "<b>Frontend :</b> Vite + React 18, Tailwind CSS, TanStack Query, shadcn/ui, Framer Motion.<br/>"
        "<b>Backend :</b> Vercel serverless functions (Node 24), Supabase (Postgres + Auth + Storage + RLS).<br/>"
        "<b>IA :</b> Anthropic Claude, OpenAI GPT, ElevenLabs (voix), vector search pgvector.<br/>"
        "<b>Intégrations :</b> Shopify Admin API, Stripe Billing, Slack, Gmail IMAP, WhatsApp (roadmap).<br/>"
        "<b>Observabilité :</b> Sentry, rrweb session replay, logs structurés par client.",
        BODY_SMALL,
    ))
    story.append(PageBreak())

    # ═══════════════ FEATURES PAR DOMAINE ═══════════════
    sections = [
        ("01", "Agent IA & automatisation", "Le cœur du produit — l'agent qui répond aux clients.", [
            ("Automation Hub", "Vue d'ensemble de l'activité de l'agent, workflows actifs, statut global.", None),
            ("Centre de contrôle", "Tableau de bord opérationnel : pause/reprise, limites en temps réel, overrides manuels.", None),
            ("Configuration de l'agent", "Persona, ton, règles métier, instructions système — tout configurable.", None),
            ("Base de connaissances", "Import produits, FAQ, politiques retour. Vector search pour RAG.", None),
            ("Import de connaissances", "Modal d'ingestion URL, fichier, texte brut. Parsing automatique.", None),
            ("Règles métier (Guardrails)", "Règles if-then pour contrôler le comportement (montants remboursements max, blacklists…).", None),
            ("Tester mon agent (Simulator)", "Bac à sable conversationnel pour valider le comportement avant production.", "Starter"),
            ("Templates de réponse", "Réponses pré-écrites, réutilisables, personnalisables par contexte.", None),
            ("Éditeur de prompts", "Edition des prompts système de l'agent avec versioning.", "Pro"),
            ("Agents spécialisés", "Agents dédiés par domaine (commande, produit, logistique, retour).", "Pro"),
            ("Détection de prompt injection", "Filtre automatique des tentatives de contournement.", None),
            ("Sync contexte de marque", "Scraping automatique du site marchand pour alimenter l'agent.", None),
        ]),

        ("02", "Quotidien & tickets", "Le flux opérationnel vu côté marque.", [
            ("À traiter (escalations)", "File des tickets nécessitant une intervention humaine, priorisés par urgence.", None),
            ("Activité de l'agent", "Feed chronologique complet : tickets résolus, escalés, événements système.", None),
            ("Feed en direct (Live)", "Timeline WebSocket temps réel de tout ce que fait l'agent.", None),
            ("Modal d'activité détaillée", "Détail d'un échange : prompt, contexte, réponse générée, feedback.", None),
            ("Escalation client", "Remontée automatique avec pré-rédaction d'une proposition de réponse.", None),
            ("Revue manuelle", "Queue dédiée pour les cas sensibles avant envoi.", None),
            ("Flag d'un run", "Marqueur sur un échange problématique pour audit/amélioration.", None),
            ("Notes d'appel (Call Notes)", "Capture structurée d'une conversation téléphonique.", None),
        ]),

        ("03", "Canaux clients", "Les points de contact entre les clients finaux et la marque.", [
            ("Portail SAV self-service", "Espace privé où le client suit ses commandes, demande un remboursement/retour.", "Starter"),
            ("Personnalisation portail (logo/couleur/nom)", "White-label : le portail aux couleurs de la marque.", "Pro"),
            ("Domaine personnalisé portail", "Servir le portail sur sav.mamarque.fr au lieu d'un sous-domaine Actero.", "Pro"),
            ("Retirer \"Propulsé par Actero\"", "Toggle pour masquer la mention Actero en pied de page du portail.", "Pro"),
            ("Magic link portail", "Connexion sans mot de passe par lien email — UX moderne.", None),
            ("Agent Email", "Réponse automatique aux emails entrants depuis l'adresse de la marque.", "Pro"),
            ("Canaux (email/WhatsApp/Slack)", "Hub de tous les canaux de contact, configuration unifiée.", None),
            ("Chat Copilot client", "Chatbot flottant dans le dashboard pour aider le marchand sur son produit Actero.", None),
            ("Tickets dans le portail", "Liste des conversations en cours, statut, historique.", None),
            ("Commandes dans le portail", "Le client consulte ses commandes Shopify directement.", None),
            ("Téléchargement de facture", "PDF générés à la demande par le portail.", None),
            ("Demande de remboursement", "Formulaire self-service avec validation automatique selon règles.", None),
            ("Demande de retour", "Gestion complète RMA dans le portail.", None),
        ]),

        ("04", "Agent vocal (téléphone)", "Réception d'appels vocaux avec une IA qui parle.", [
            ("Configuration agent vocal", "Choix voix (ElevenLabs), persona, ton, langues.", "Pro"),
            ("Test vocal", "Modal de test en direct avant mise en production.", "Pro"),
            ("Historique des appels", "Liste de tous les appels reçus, transcriptions, résolutions.", "Pro"),
            ("Wizard d'onboarding vocal", "Parcours guidé pour configurer l'agent vocal de A à Z.", "Pro"),
        ]),

        ("05", "Outils connectés & intégrations", "Connexion au SI du marchand.", [
            ("Intégration Shopify native", "OAuth, webhooks temps réel, sync produits/commandes/clients.", None),
            ("Intégrations Hub", "Config centrale des connecteurs : Shopify, Klaviyo, Gorgias…", None),
            ("API publique", "REST API pour piloter Actero depuis un SI externe.", "Starter"),
            ("Webhooks sortants", "Notifier un endpoint externe lors d'événements (ticket résolu, escalation…).", "Starter"),
            ("Gestion des webhooks", "Interface CRUD, logs de livraison, re-essais.", "Starter"),
        ]),

        ("06", "Performance & analytics", "Mesurer la valeur délivrée.", [
            ("KPI row (Instantly-style)", "Tickets résolus auto, à traiter, heures gagnées, économies réalisées.", None),
            ("Synthèse hebdomadaire", "Résumé narratif des 7 derniers jours, livré chaque lundi.", None),
            ("Graphique d'activité", "Volume de demandes traitées sur période configurable.", None),
            ("Heures de pointe", "Détection des pics horaires pour ajuster le staffing humain.", None),
            ("Opportunités", "Suggestions automatiques de tâches à automatiser détectées par l'IA.", None),
            ("Insights Hub", "Analyses produit : tendances, anomalies, recommandations.", None),
            ("Suggestions d'amélioration", "Widget qui propose au marchand des actions concrètes (règles manquantes, KB à enrichir).", None),
            ("Paramètres ROI", "Configuration du coût horaire interne pour calcul précis des économies.", None),
            ("Statistiques portail SAV", "Connexions, tickets créés via portail, demandes self-service résolues.", None),
            ("Rapport mensuel PDF", "Export PDF complet envoyé automatiquement chaque mois.", "Pro"),
        ]),

        ("07", "Proactif & automations planifiées", "Le système qui travaille pendant que tu dors.", [
            ("Récupération de paniers abandonnés", "Cron 5 min — relance automatique des paniers Shopify.", None),
            ("Automatisation comptabilité", "Cron quotidien — export fiscal formaté.", None),
            ("Prédiction de churn", "Cron hebdo — détection des clients à risque.", None),
            ("Polling emails entrants", "Cron 2 min — relève IMAP, ingestion dans la queue agent.", None),
            ("Watchdog proactif", "Cron 15 min — surveille les anomalies, alerte l'équipe.", None),
            ("Rapport mensuel auto", "Cron mensuel — génération + envoi du rapport PDF.", None),
            ("Digest Slack quotidien", "Résumé push dans un canal Slack, 7h30 en semaine.", None),
            ("Moteur proactif", "Actions déclenchées par événements business (panier abandonné, NPS bas…).", None),
        ]),

        ("08", "Onboarding & expérience client", "Comment on accompagne un nouveau marchand.", [
            ("Welcome hero + Setup mode", "Page d'accueil dédiée tant que l'agent n'est pas setup.", None),
            ("Setup Checklist 7 étapes", "Parcours structuré : Shopify → KB → Règles → Test → Live.", None),
            ("Product Tour auto", "Visite guidée automatique au premier login.", None),
            ("Empty state digne", "Hero inspirant au lieu de KPI à 0 quand aucun événement.", None),
            ("Centre d'aide (Help Center)", "Docs, FAQ, articles structurés par catégorie.", None),
            ("Sélecteur d'industrie", "Presets par vertical (mode, beauté, tech…) pour accélérer le setup.", None),
            ("Wizard comptabilité", "Assistant de configuration de l'export comptable.", None),
            ("Wizard vocal", "Parcours guidé dédié à l'agent téléphonique.", "Pro"),
            ("Vérification workflow prêt", "Check automatique que tout est OK avant activation.", None),
            ("Achievements & célébrations", "Toasts quand un milestone est atteint (100 tickets résolus, 10h gagnées…).", None),
            ("Centre de notifications", "Inbox in-app pour toutes les alertes système + business.", None),
            ("Bouton de test rapide", "Lance un scénario de test en 1 clic.", None),
        ]),

        ("09", "Croissance, partenariats, viralité", "Les leviers d'acquisition et de fidélisation.", [
            ("Programme de parrainage", "Referral — 1 mois offert au parrain et au filleul.", None),
            ("Actero Partners", "Programme pour agences et ambassadeurs — tokens, commissions.", None),
            ("Marketplace de playbooks", "Templates prêts à installer (retour tardif, SAV cosmétique, rupture stock…).", None),
            ("Mes templates installés", "Gestion des playbooks activés sur le compte.", None),
            ("Academy", "Modules de formation sur le SAV IA et best practices.", None),
            ("Landing partenaires", "Page dédiée pour recruter des partenaires.", None),
            ("Candidature partenaire", "Formulaire avec revue admin manuelle.", None),
            ("Dashboard partenaire", "Statistiques de commission, liens de parrainage, clients référés.", None),
            ("Directory partenaires publique", "Annuaire public des partenaires agréés.", None),
        ]),

        ("10", "Facturation & plans", "Monétisation et self-service billing.", [
            ("Plans Free / Starter / Pro / Enterprise", "Grille tarifaire structurée avec limites et features par plan.", None),
            ("Trial 7 jours Starter/Pro", "Essai gratuit avec carte requise, conversion auto.", None),
            ("Checkout Stripe", "Flux de paiement natif Stripe avec preview/success/cancel.", None),
            ("Portail de facturation Stripe", "Gestion self-service facturation, factures, CB.", None),
            ("Overage ticket", "Facturation à l'usage au-delà du plan (0,10–0,15€/ticket).", None),
            ("Achat de crédits", "Top-up ponctuel de crédits (voice minutes, overage tickets).", None),
            ("Compteur d'usage en temps réel", "Barre de progression tickets consommés / plan, alertes à 80&#37;.", None),
            ("Upsell contextuel", "Bannières d'upgrade déclenchées par le contexte (plan Free → Starter, Starter → Pro).", None),
            ("Upsells back-office", "Table `client_upsells` — admin pousse des offres personnalisées.", None),
            ("Page Plan Selection", "Écran de choix de plan post-signup ou au trial end.", None),
            ("Page Pricing publique", "actero.fr/pricing — grille, FAQ, comparatif.", None),
        ]),

        ("11", "Équipe, sécurité, multi-tenant", "Gestion des utilisateurs et isolation des données.", [
            ("Gestion d'équipe (Team Manager)", "Invitations, rôles (owner/admin/operational), limite par plan.", None),
            ("Invitation membre d'équipe", "Email + magic link d'onboarding.", None),
            ("Rôles & permissions par tab", "Chaque membre voit uniquement ce que son rôle autorise.", None),
            ("Profil client", "Informations compte, notifications, préférences.", None),
            ("Row-Level Security (RLS)", "Supabase RLS — isolation stricte par client_id sur toutes les tables.", None),
            ("Authentification magic link", "Pas de mot de passe — login par email sécurisé.", None),
            ("Impersonation admin", "L'équipe Actero peut se connecter en tant que client pour support.", None),
        ]),

        ("12", "Back-office Actero (admin)", "Outillage interne pour piloter la plateforme.", [
            ("Liste clients", "Toutes les marques avec filtres par plan, statut, santé.", None),
            ("Fiche client (notes + actions)", "Notes libres + actions rapides (impersonate, refund, upgrade).", None),
            ("Santé client (health)", "Score de santé calculé, alertes de churn imminent.", None),
            ("Kanban admin", "Suivi du pipeline de déploiement client.", None),
            ("Pipeline de conversion", "Funnel marketing : landing → signup → trial → paid.", None),
            ("Vue Funnel", "Taux de conversion par étape, cohorts.", None),
            ("Dashboard MRR", "ARR, MRR, churn, nouveaux clients en temps réel.", None),
            ("Cohorte de churn", "Analyse cohort retention par mois d'acquisition.", None),
            ("Leaderboard ROI", "Top marchands par économies générées.", None),
            ("Runs de l'engine", "Logs bruts de chaque exécution de l'agent IA.", None),
            ("Test de l'engine", "Outil de rejeu d'un ticket pour debug.", None),
            ("Live runs", "Feed temps réel de tout ce que fait l'IA sur toute la plateforme.", None),
            ("Tracker des coûts", "Consommation tokens OpenAI/Anthropic par client.", None),
            ("Tracker hallucinations", "Détection + flag des réponses où l'IA a inventé.", None),
            ("Notes négatives", "Queue de revue des thumbs-down clients pour amélioration.", None),
            ("Top erreurs", "Agrégation des erreurs les plus fréquentes.", None),
            ("Alert Builder", "Création de règles d'alerte custom.", None),
            ("Monitoring système", "État des crons, API, intégrations.", None),
            ("Heatmap d'agents", "Visualisation de l'activité par heure × jour × vertical.", None),
            ("Santé connecteurs", "État des intégrations Shopify par client.", None),
            ("Vue Shopify admin", "Outils de diagnostic Shopify cross-clients.", None),
            ("Configuration Stripe", "Setup des prix et produits Stripe depuis l'admin.", None),
            ("Tokens partenaires", "Génération/révocation des tokens d'API partenaire.", None),
            ("Partenaires & ambassadeurs", "Gestion complète du programme.", None),
            ("Candidatures startups", "Programme Actero for Startups — revue de dossiers.", None),
            ("Rapports d'erreurs clients", "Inbox des bugs remontés par les clients.", None),
            ("Playbooks admin", "Gestion centrale de la marketplace de templates.", None),
            ("AI Terminal", "REPL LLM pour l'équipe Actero : queries, analyses ad hoc.", None),
            ("Deployment progress", "Suivi en temps réel des déploiements clients.", None),
        ]),
    ]

    for num, title, tagline, items in sections:
        story.append(Paragraph(f"DOMAINE {num}", EYEBROW))
        story.append(Paragraph(title, H2))
        story.append(Divider())
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<i>{tagline}</i>", BODY))
        story.append(Spacer(1, 8))
        for name, desc, plan in items:
            story.append(feature_row(name, desc, plan))
        story.append(Spacer(1, 12))

    # ═══════════════ PLAN COMPARISON ═══════════════
    story.append(PageBreak())
    story.append(Paragraph("TARIFICATION", EYEBROW))
    story.append(Paragraph("Les 4 plans Actero", H1))
    story.append(Divider())
    story.append(Spacer(1, 12))

    plan_data = [
        ["", "Free", "Starter", "Pro", "Enterprise"],
        ["Prix mensuel", "0€", "99€", "399€", "Sur devis"],
        ["Tickets/mois", "50", "1 000", "5 000", "∞"],
        ["Workflows", "1", "3", "∞", "∞"],
        ["Intégrations", "1 (Shopify)", "3", "∞", "∞"],
        ["Base de connaissances", "10 entrées", "100", "∞", "∞"],
        ["Membres d'équipe", "1", "2", "5", "∞"],
        ["Historique", "7 jours", "90 jours", "∞", "∞"],
        ["Voice agent", "—", "—", "✓ (200 min)", "✓ ∞"],
        ["Agents spécialisés", "—", "—", "✓", "✓"],
        ["Portail SAV", "—", "✓", "✓", "✓"],
        ["Personnalisation portail", "—", "—", "✓", "✓"],
        ["Domaine custom + hide branding", "—", "—", "✓", "✓"],
        ["API & webhooks", "—", "✓", "✓", "✓"],
        ["Rapports PDF", "—", "—", "✓", "✓"],
        ["White-label complet", "—", "—", "—", "✓"],
        ["Overage par ticket", "—", "0,15€", "0,10€", "Inclus"],
        ["Support", "Docs", "Email 48h", "Prioritaire 24h", "Account Manager"],
    ]

    plan_table = Table(plan_data, colWidths=[45 * mm, 25 * mm, 25 * mm, 25 * mm, 30 * mm])
    plan_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), SURFACE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("TEXTCOLOR", (0, 1), (0, -1), INK),
        ("TEXTCOLOR", (1, 1), (-1, -1), INK2),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [SURFACE, CREAM]),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("LINEBELOW", (0, 0), (-1, 0), 0, PRIMARY),
        ("LINEBEFORE", (3, 0), (3, -1), 1.5, GOLD),  # highlight Pro column
        ("LINEAFTER", (3, 0), (3, -1), 1.5, GOLD),
    ]))
    story.append(plan_table)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<i>Le plan Pro est le plan recommandé pour 80&#37; des marques Shopify en croissance — "
        "c'est le plan qui débloque l'agent vocal, la personnalisation complète du portail et le domaine custom.</i>",
        BODY_SMALL,
    ))

    # ═══════════════ CLOSING ═══════════════
    story.append(PageBreak())
    story.append(Paragraph("SUITE", EYEBROW))
    story.append(Paragraph("Ce qu'il reste à construire", H1))
    story.append(Divider())
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "Le cœur du produit est en place. Les chantiers qui arrivent dans les prochains sprints :",
        BODY,
    ))
    roadmap = [
        ("WhatsApp Business API", "Canal conversationnel prioritaire pour les marques BtoC FR/EU."),
        ("Multi-shop Shopify", "Gérer plusieurs stores sous un seul compte Actero (plan Enterprise).",),
        ("Classeur d'agents spécialisés", "Orchestration automatique : quel agent pour quel type de demande."),
        ("White-label complet (Enterprise)", "Suppression totale de la marque Actero, y compris dans les emails transactionnels."),
        ("Academy certifiante", "Parcours de certification pour agences partenaires."),
        ("Intégration Gorgias / Zendesk", "Bridge pour marques venant d'un helpdesk classique."),
        ("SLA dashboard", "Vue temps réel du respect des engagements de délai de réponse."),
        ("Mobile app", "Notifications push + validation d'escalations depuis mobile."),
    ]
    for name, desc in roadmap:
        story.append(Paragraph(f"<b>{name}</b> — {desc}", BODY))
    story.append(Spacer(1, 16))
    story.append(Paragraph(
        "<i>Cette roadmap est indicative. Les priorités peuvent évoluer selon les signaux clients.</i>",
        BODY_SMALL,
    ))

    return story


def main():
    out_dir = Path(__file__).parent.parent / "docs"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "Actero-Features.pdf"

    doc = SimpleDocTemplate(
        str(out_path),
        pagesize=A4,
        leftMargin=22 * mm,
        rightMargin=22 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title="Actero — Features complètes",
        author="Actero",
        subject="Tour d'horizon complet du produit et de ses fonctionnalités",
    )

    doc.build(build_story(), onFirstPage=cover_page, onLaterPages=inner_page)
    print(f"✓ Généré : {out_path}")
    print(f"  Taille : {out_path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
