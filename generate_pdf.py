#!/usr/bin/env python3
"""Generate Actero Features PDF"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
from reportlab.lib import colors

# Brand colors
DARK_BG = HexColor("#0a0a0a")
EMERALD = HexColor("#10b981")
EMERALD_DARK = HexColor("#059669")
INDIGO = HexColor("#6366f1")
VIOLET = HexColor("#8b5cf6")
ZINC_100 = HexColor("#f4f4f5")
ZINC_200 = HexColor("#e4e4e7")
ZINC_300 = HexColor("#d4d4d8")
ZINC_400 = HexColor("#a1a1aa")
ZINC_500 = HexColor("#71717a")
ZINC_600 = HexColor("#52525b")
ZINC_700 = HexColor("#3f3f46")
ZINC_800 = HexColor("#27272a")
ZINC_900 = HexColor("#18181b")
WHITE = HexColor("#ffffff")
ROSE = HexColor("#f43f5e")

# Styles
title_style = ParagraphStyle(
    'Title',
    fontName='Helvetica-Bold',
    fontSize=28,
    leading=34,
    textColor=WHITE,
    alignment=TA_LEFT,
    spaceAfter=6*mm,
)

subtitle_style = ParagraphStyle(
    'Subtitle',
    fontName='Helvetica',
    fontSize=14,
    leading=20,
    textColor=ZINC_400,
    alignment=TA_LEFT,
    spaceAfter=10*mm,
)

h1_style = ParagraphStyle(
    'H1',
    fontName='Helvetica-Bold',
    fontSize=22,
    leading=28,
    textColor=EMERALD,
    alignment=TA_LEFT,
    spaceBefore=8*mm,
    spaceAfter=4*mm,
)

h2_style = ParagraphStyle(
    'H2',
    fontName='Helvetica-Bold',
    fontSize=16,
    leading=22,
    textColor=WHITE,
    alignment=TA_LEFT,
    spaceBefore=6*mm,
    spaceAfter=3*mm,
)

h3_style = ParagraphStyle(
    'H3',
    fontName='Helvetica-Bold',
    fontSize=13,
    leading=18,
    textColor=ZINC_200,
    alignment=TA_LEFT,
    spaceBefore=4*mm,
    spaceAfter=2*mm,
)

body_style = ParagraphStyle(
    'Body',
    fontName='Helvetica',
    fontSize=10.5,
    leading=16,
    textColor=ZINC_300,
    alignment=TA_JUSTIFY,
    spaceAfter=3*mm,
)

bullet_style = ParagraphStyle(
    'Bullet',
    fontName='Helvetica',
    fontSize=10.5,
    leading=16,
    textColor=ZINC_300,
    alignment=TA_LEFT,
    leftIndent=8*mm,
    spaceAfter=1.5*mm,
    bulletIndent=2*mm,
    bulletFontName='Helvetica',
    bulletFontSize=10,
)

highlight_style = ParagraphStyle(
    'Highlight',
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=16,
    textColor=EMERALD,
    alignment=TA_LEFT,
    spaceAfter=2*mm,
    leftIndent=4*mm,
)

caption_style = ParagraphStyle(
    'Caption',
    fontName='Helvetica-Oblique',
    fontSize=9,
    leading=13,
    textColor=ZINC_500,
    alignment=TA_CENTER,
    spaceAfter=4*mm,
)

footer_style = ParagraphStyle(
    'Footer',
    fontName='Helvetica',
    fontSize=8,
    leading=10,
    textColor=ZINC_600,
    alignment=TA_CENTER,
)


_page_counter = [0]

def draw_page_bg(canvas_obj, doc):
    """Draw dark background BEHIND content on every page"""
    _page_counter[0] += 1
    canvas_obj.saveState()
    # Background
    canvas_obj.setFillColor(DARK_BG)
    canvas_obj.rect(0, 0, A4[0], A4[1], fill=True, stroke=False)
    # Top accent line
    canvas_obj.setStrokeColor(EMERALD)
    canvas_obj.setLineWidth(2)
    canvas_obj.line(20*mm, A4[1] - 12*mm, A4[0] - 20*mm, A4[1] - 12*mm)
    # Footer
    canvas_obj.setFillColor(ZINC_600)
    canvas_obj.setFont('Helvetica', 8)
    canvas_obj.drawCentredString(A4[0]/2, 10*mm, f"Actero - Infrastructure IA pour entreprises ambitieuses  |  actero.fr  |  Page {_page_counter[0]}")
    canvas_obj.restoreState()


def build_pdf():
    output_path = "/Users/pablopriefert/Desktop/Actero_Features_2026.pdf"

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        topMargin=18*mm,
        bottomMargin=18*mm,
        leftMargin=20*mm,
        rightMargin=20*mm,
    )

    story = []

    def bullet(text):
        return Paragraph(f"<bullet>&bull;</bullet> {text}", bullet_style)

    def body(text):
        return Paragraph(text, body_style)

    def h1(text):
        return Paragraph(text, h1_style)

    def h2(text):
        return Paragraph(text, h2_style)

    def h3(text):
        return Paragraph(text, h3_style)

    def sep():
        return HRFlowable(width="100%", thickness=0.5, color=ZINC_800, spaceAfter=4*mm, spaceBefore=2*mm)

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 50*mm))
    story.append(Paragraph("ACTERO", ParagraphStyle(
        'Brand', fontName='Helvetica-Bold', fontSize=48, leading=52,
        textColor=EMERALD, alignment=TA_LEFT, spaceAfter=4*mm,
    )))
    story.append(Paragraph("Infrastructure IA pour entreprises ambitieuses", ParagraphStyle(
        'Tagline', fontName='Helvetica', fontSize=18, leading=24,
        textColor=WHITE, alignment=TA_LEFT, spaceAfter=12*mm,
    )))
    story.append(sep())
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("Document de features", title_style))
    story.append(Paragraph(
        "Plateforme SaaS, dashboards client & admin, intergrations,<br/>"
        "verticales E-commerce & Immobilier, et vision produit.",
        subtitle_style
    ))
    story.append(Spacer(1, 20*mm))

    # Info table
    info_data = [
        ["Version", "Mars 2026"],
        ["Contact", "contact@actero.fr"],
        ["Site", "actero.fr"],
    ]
    info_table = Table(info_data, colWidths=[35*mm, 80*mm])
    info_table.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (0, -1), ZINC_500),
        ('TEXTCOLOR', (1, 0), (1, -1), ZINC_300),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 2*mm),
    ]))
    story.append(info_table)

    story.append(PageBreak())

    # =========================================================================
    # TABLE OF CONTENTS
    # =========================================================================
    story.append(h1("Sommaire"))
    story.append(Spacer(1, 4*mm))

    toc_items = [
        ("01", "Actero en bref"),
        ("02", "Site vitrine & acquisition"),
        ("03", "Funnel d'audit & conversion"),
        ("04", "Systeme de paiement & onboarding"),
        ("05", "Dashboard Client"),
        ("06", "Dashboard Admin"),
        ("07", "Verticale E-commerce"),
        ("08", "Verticale Immobilier"),
        ("09", "Integrations & stack technique"),
        ("10", "Securite & architecture"),
        ("11", "Pourquoi Actero est unique"),
    ]

    for num, title_text in toc_items:
        story.append(Paragraph(
            f'<font color="{EMERALD.hexval()}">{num}</font>&nbsp;&nbsp;&nbsp;'
            f'<font color="{ZINC_200.hexval()}">{title_text}</font>',
            ParagraphStyle('TOC', fontName='Helvetica', fontSize=12, leading=22,
                           textColor=ZINC_200, spaceAfter=2*mm)
        ))

    story.append(PageBreak())

    # =========================================================================
    # 01 - ACTERO EN BREF
    # =========================================================================
    story.append(h1("01  Actero en bref"))
    story.append(body(
        "Actero est une agence d'infrastructure IA qui deploie des systemes d'automatisation "
        "intelligents pour les entreprises ambitieuses. Contrairement aux agences traditionnelles "
        "qui vendent des services ponctuels, Actero construit des <b>systemes autonomes et mesurables</b> "
        "qui generent un ROI concret des le premier mois."
    ))
    story.append(body(
        "La plateforme couvre deux verticales metier : <b>E-commerce</b> (automatisation du SAV, "
        "recuperation de paniers abandonnes, integration Shopify) et <b>Immobilier</b> (qualification "
        "de leads IA, reponses instantanees aux demandes de visite, integration SeLoger/LeBonCoin)."
    ))
    story.append(Spacer(1, 4*mm))

    story.append(h2("Chiffres cles de la plateforme"))
    kpi_data = [
        ["Metrique", "Detail"],
        ["Verticales", "2 (E-commerce + Immobilier)"],
        ["Dashboards", "3 (Client, Admin, Immobilier specifique)"],
        ["Pages publiques", "8+ (Landing, Audit, Tarifs, FAQ, Entreprise...)"],
        ["Integrations", "7 (Shopify, Stripe, Supabase, Resend, n8n, Vercel, Calendly)"],
        ["Temps reel", "Supabase Realtime (postgres_changes)"],
        ["IA", "GPT-4o pour recommandations & automatisations"],
    ]
    kpi_table = Table(kpi_data, colWidths=[45*mm, 115*mm])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ZINC_800),
        ('TEXTCOLOR', (0, 0), (-1, 0), EMERALD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 1), (0, -1), ZINC_400),
        ('TEXTCOLOR', (1, 1), (1, -1), ZINC_200),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
        ('LINEBELOW', (0, 0), (-1, 0), 1, ZINC_700),
        ('LINEBELOW', (0, 1), (-1, -2), 0.5, ZINC_800),
    ]))
    story.append(kpi_table)

    story.append(Spacer(1, 4*mm))
    story.append(h2("6 valeurs fondamentales"))
    values = [
        ("Systemes, pas services", "On construit des actifs durables, pas des prestations jetables."),
        ("Performance mesurable", "Chaque automatisation est trackee : ROI, temps economise, actions executees."),
        ("Vitesse d'execution", "Deploiement rapide, resultats visibles des la premiere semaine."),
        ("Transparence totale", "Dashboard en temps reel, pas de boite noire."),
        ("Partenariat, pas prestation", "On s'engage sur vos resultats, pas sur un nombre d'heures."),
        ("IA pragmatique", "On utilise l'IA la ou elle cree de la valeur, pas pour le buzz."),
    ]
    for title_text, desc in values:
        story.append(Paragraph(
            f'<font color="{EMERALD.hexval()}"><b>{title_text}</b></font> '
            f'<font color="{ZINC_400.hexval()}">- {desc}</font>',
            ParagraphStyle('Value', fontName='Helvetica', fontSize=10, leading=16,
                           spaceAfter=2*mm, leftIndent=4*mm)
        ))

    story.append(PageBreak())

    # =========================================================================
    # 02 - SITE VITRINE & ACQUISITION
    # =========================================================================
    story.append(h1("02  Site vitrine & acquisition"))

    story.append(h2("Landing page"))
    story.append(body(
        "Page d'accueil immersive en dark theme avec animations Framer Motion. "
        "Hero section, showcase des verticales E-commerce et Immobilier, "
        "presentation des agents IA avec switcher dynamique entre les verticales, "
        "et CTAs strategiques redirigeant vers l'audit gratuit."
    ))
    bullet_items = [
        "Hero section avec proposition de valeur claire",
        "Switcher dynamique E-commerce / Immobilier avec transitions fluides",
        "Presentation visuelle des 3 agents IA par verticale",
        "Social proof et resultats clients",
        "CTAs multiples vers /audit (prise de rendez-vous)",
    ]
    for item in bullet_items:
        story.append(bullet(item))

    story.append(h2("Page Entreprise (/entreprise)"))
    story.append(body(
        "Presentation de la mission, de la vision et des 6 valeurs fondamentales d'Actero. "
        "Design soigne avec imagerie et CTA vers une consultation d'architecture."
    ))

    story.append(h2("Page Tarifs (/tarifs)"))
    story.append(body(
        "Structure tarifaire en 3 niveaux par verticale :"
    ))
    bullet_items = [
        "<b>Audit gratuit</b> - Appel strategie de 15 min, sans engagement",
        "<b>Growth / Agence</b> - Automatisations ciblees, tarification personnalisee",
        "<b>Scale</b> - Infrastructure IA complete, tarification enterprise",
    ]
    for item in bullet_items:
        story.append(bullet(item))
    story.append(body(
        "Chaque niveau affiche des features specifiques a la verticale choisie. "
        "FAQ integree couvrant les questions generales, techniques et d'engagement."
    ))

    story.append(h2("Page FAQ (/faq)"))
    story.append(body(
        "Base de connaissances recherchable en temps reel avec filtrage par categories : "
        "General, Technique & Securite, Prix & Engagement. Questions/reponses animees et expansibles."
    ))

    story.append(PageBreak())

    # =========================================================================
    # 03 - FUNNEL D'AUDIT
    # =========================================================================
    story.append(h1("03  Funnel d'audit & conversion"))

    story.append(h2("Page Audit (/audit)"))
    story.append(body(
        "Point d'entree strategique du funnel d'acquisition. Integration Calendly embarquee "
        "pour la prise de rendez-vous d'un audit gratuit de 15 minutes."
    ))

    story.append(h3("Livrables de l'audit"))
    deliverables = [
        "Estimation ROI personnalisee",
        "3 workflows prioritaires a activer",
        "Recommandation d'architecture technique",
        "Projection de croissance a 90 jours",
    ]
    for d in deliverables:
        story.append(bullet(d))

    story.append(h3("Techniques de conversion"))
    story.append(bullet("Urgence : \"3 creneaux restants cette semaine\""))
    story.append(bullet("FAQ dediee repondant aux objections courantes"))
    story.append(bullet("Audit complet du stack (Shopify, CRM, Helpdesk)"))
    story.append(bullet("Detection de failles (processus manuels, couts caches)"))
    story.append(bullet("Plan d'action sur mesure"))

    story.append(h2("Parcours complet du funnel"))
    story.append(body(
        "1. Prise de RDV via Calendly &rarr; 2. Audit strategie &rarr; "
        "3. Proposition commerciale &rarr; 4. Paiement Stripe &rarr; "
        "5. Email d'onboarding &rarr; 6. Acces dashboard client"
    ))

    story.append(PageBreak())

    # =========================================================================
    # 04 - PAIEMENT & ONBOARDING
    # =========================================================================
    story.append(h1("04  Systeme de paiement & onboarding"))

    story.append(h2("Stripe Checkout"))
    story.append(body(
        "Integration Stripe complete avec gestion des abonnements et frais de setup :"
    ))
    stripe_features = [
        "Frais de setup one-time + abonnement mensuel",
        "Paiement par carte et PayPal",
        "Collecte automatique du numero de TVA",
        "Champs personnalises : nom d'entreprise, site web",
        "Tarification configurable par verticale",
        "Webhook Stripe pour mise a jour automatique du statut client",
    ]
    for f in stripe_features:
        story.append(bullet(f))

    story.append(h2("Email d'onboarding (Resend)"))
    story.append(body(
        "Apres paiement, un email personnalise est envoye automatiquement au client via Resend :"
    ))
    email_features = [
        "Template HTML professionnel avec branding Actero",
        "Contenu adapte a la verticale (E-commerce ou Immobilier)",
        "Recapitulatif des tarifs (setup + mensuel)",
        "CTA direct vers la page funnel personnalisee (/start/[slug])",
        "Proposition de valeur specifique a la verticale",
    ]
    for f in email_features:
        story.append(bullet(f))

    story.append(h2("Page funnel personnalisee (/start/[slug])"))
    story.append(body(
        "Chaque client dispose d'une page d'onboarding dediee affichant les benefices "
        "specifiques a sa verticale, le recapitulatif de sa tarification, et un bouton "
        "Stripe Checkout pour finaliser le paiement. Apres paiement, le compte est cree "
        "automatiquement et le client recoit ses identifiants."
    ))

    story.append(PageBreak())

    # =========================================================================
    # 05 - DASHBOARD CLIENT
    # =========================================================================
    story.append(h1("05  Dashboard Client"))
    story.append(body(
        "Interface principale des clients Actero. Dashboard temps reel avec metriques "
        "de performance, suivi d'activite et outils d'intelligence IA. "
        "Disponible en mode clair et sombre avec sidebar responsive."
    ))

    story.append(h2("Vue d'ensemble (Overview)"))
    overview_features = [
        "<b>4 KPI cards temps reel</b> : temps economise, ROI mensuel, metrique verticale specifique, actions IA executees",
        "<b>Score de sante</b> : jauge visuelle de l'etat du systeme",
        "<b>Comparaison par periode</b> : ce mois, mois dernier, 30 derniers jours",
        "<b>Graphiques d'evolution</b> : metriques quotidiennes avec tendances",
        "<b>KPI adaptatifs par verticale</b> : tickets resolus (e-com) ou leads qualifies (immo)",
    ]
    for f in overview_features:
        story.append(bullet(f))

    story.append(h2("Activite en direct (Live Activity)"))
    activity_features = [
        "Flux temps reel via Supabase postgres_changes",
        "Evenements d'automatisation categorises",
        "50 evenements charges au demarrage, abonnement aux nouveaux INSERTs",
        "Horodatage lisible (\"A l'instant\", \"Il y a 5m\"...)",
        "Limite memoire de 100 evenements",
    ]
    for f in activity_features:
        story.append(bullet(f))

    story.append(h2("Intelligence IA"))
    intel_features = [
        "Recommandations d'automatisation generees par GPT-4o",
        "Drawer de plan d'execution detaille",
        "Lancement d'implementation en un clic",
        "Suivi des evenements post-implementation (polling toutes les 5s)",
    ]
    for f in intel_features:
        story.append(bullet(f))

    story.append(h2("Autres onglets"))
    other_features = [
        "<b>Demandes (Requests)</b> : interface de gestion des demandes client",
        "<b>Architecte IA</b> : configuration de l'infrastructure et des workflows",
        "<b>Systemes</b> : affichage des integrations et systemes actifs",
        "<b>Rapports</b> : generation et consultation de rapports",
    ]
    for f in other_features:
        story.append(bullet(f))

    story.append(h2("UX & Design"))
    ux_features = [
        "Toggle theme clair/sombre (persiste en localStorage)",
        "Navigation sidebar mobile-responsive",
        "Animations Framer Motion sur les transitions",
        "React Query pour le caching et la reactivite des donnees",
        "useMemo pour l'optimisation des calculs lourds",
    ]
    for f in ux_features:
        story.append(bullet(f))

    story.append(PageBreak())

    # =========================================================================
    # 06 - DASHBOARD ADMIN
    # =========================================================================
    story.append(h1("06  Dashboard Admin"))
    story.append(body(
        "Portail operateur pour l'equipe Actero. Vue globale sur tous les clients, "
        "metriques business, gestion du pipeline et outils de support."
    ))

    story.append(h2("Overview"))
    admin_overview = [
        "KPIs business agreges (MRR, clients actifs, ROI global)",
        "Donnees temps reel depuis Supabase",
        "Vue synthetique de l'etat de tous les clients",
    ]
    for f in admin_overview:
        story.append(bullet(f))

    story.append(h2("Gestion des clients"))
    admin_clients = [
        "<b>Cards visuelles</b> avec icone de type (e-commerce/immobilier)",
        "<b>KPIs resumes</b> : clients actifs, repartition par verticale",
        "<b>Client ID Supabase</b> avec bouton copier",
        "<b>Email de contact</b> affiche sur chaque card",
        "<b>Modale de configuration</b> par client (settings)",
    ]
    for f in admin_clients:
        story.append(bullet(f))

    story.append(h2("Funnel - Nouveau client"))
    admin_funnel = [
        "Vue Kanban du pipeline de conversion",
        "Visualisation des etapes du funnel",
        "Suivi de la progression de chaque prospect",
        "Integration avec Stripe pour le suivi des paiements",
    ]
    for f in admin_funnel:
        story.append(bullet(f))

    story.append(h2("Autres modules admin"))
    admin_other = [
        "<b>Demandes</b> : toutes les demandes clients centralisees avec contexte",
        "<b>Leads</b> : agregation de tous les leads cross-clients",
        "<b>Intelligence</b> : metriques et recommandations IA plateforme",
        "<b>Raccourci Cmd+K</b> : recherche globale rapide",
    ]
    for f in admin_other:
        story.append(bullet(f))

    story.append(PageBreak())

    # =========================================================================
    # 07 - VERTICALE E-COMMERCE
    # =========================================================================
    story.append(h1("07  Verticale E-commerce"))
    story.append(body(
        "Suite d'automatisation complete pour les boutiques en ligne, "
        "centree sur le SAV, la retention client et l'optimisation des ventes."
    ))

    story.append(h2("Agents IA deployes"))

    story.append(h3("Agent SAV intelligent"))
    story.append(body(
        "Automatisation complete du service apres-vente avec traitement des tickets "
        "par IA, reponses contextuelles basees sur l'historique commande, et escalade "
        "intelligente vers un humain quand necessaire."
    ))

    story.append(h3("Recuperation de paniers abandonnes"))
    story.append(body(
        "Workflows automatises de relance par email et SMS pour recuperer les paniers "
        "abandonnes avec sequences personnalisees et timing optimise par IA."
    ))

    story.append(h3("Integration Shopify native"))
    story.append(body(
        "Connexion OAuth complete avec le store Shopify du client :"
    ))
    shopify_features = [
        "Synchronisation commandes, clients, produits",
        "Acces aux fulfillments, checkouts, draft orders",
        "Gestion des retours et de l'inventaire",
        "Protection CSRF avec cookies HttpOnly",
    ]
    for f in shopify_features:
        story.append(bullet(f))

    story.append(h2("KPIs E-commerce"))
    ecom_kpis = [
        ["Metrique", "Description"],
        ["Tickets resolus", "Nombre de tickets SAV traites par l'IA"],
        ["Temps economise", "Heures/mois economisees vs traitement manuel"],
        ["ROI mensuel", "Valeur financiere generee (base 25EUR/h, 5min/ticket)"],
        ["Actions IA", "Total des actions d'automatisation executees"],
    ]
    ecom_table = Table(ecom_kpis, colWidths=[40*mm, 120*mm])
    ecom_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ZINC_800),
        ('TEXTCOLOR', (0, 0), (-1, 0), EMERALD),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 1), (-1, -1), ZINC_300),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
        ('LINEBELOW', (0, 0), (-1, 0), 1, ZINC_700),
        ('LINEBELOW', (0, 1), (-1, -2), 0.5, ZINC_800),
    ]))
    story.append(ecom_table)

    story.append(PageBreak())

    # =========================================================================
    # 08 - VERTICALE IMMOBILIER
    # =========================================================================
    story.append(h1("08  Verticale Immobilier"))
    story.append(body(
        "Infrastructure IA dediee aux agences immobilieres, optimisee pour la "
        "qualification de leads et la gestion des mandats."
    ))

    story.append(h2("Agents IA deployes"))

    story.append(h3("Qualification de leads IA"))
    story.append(body(
        "Traitement automatique des demandes entrantes (SeLoger, LeBonCoin, site web) "
        "avec scoring intelligent, extraction des criteres cles et priorisation "
        "des leads a fort potentiel."
    ))

    story.append(h3("Reponse instantanee aux demandes de visite"))
    story.append(body(
        "Reponses automatiques personnalisees en moins de 2 minutes aux demandes "
        "de visite, avec proposition de creneaux et informations sur le bien."
    ))

    story.append(h3("Integration portails immobiliers"))
    story.append(body(
        "Connexion avec SeLoger et LeBonCoin pour la recuperation automatique "
        "des leads et la synchronisation des annonces."
    ))

    story.append(h2("Dashboard specifique immobilier"))
    immo_features = [
        "<b>Onglet Leads</b> : suivi et qualification des leads entrants",
        "<b>Onglet Mandats</b> : gestion des biens en portefeuille",
        "<b>Onglet Activite</b> : metriques temps reel specifiques immobilier",
        "<b>KPI principal</b> : leads qualifies (au lieu des tickets resolus)",
        "<b>Cout de reference</b> : 30EUR/h, 8min/lead en moyenne",
    ]
    for f in immo_features:
        story.append(bullet(f))

    story.append(h2("KPIs Immobilier"))
    immo_kpis = [
        ["Metrique", "Description"],
        ["Leads qualifies", "Nombre de leads qualifies automatiquement"],
        ["Temps economise", "Heures/mois economisees vs traitement manuel"],
        ["ROI mensuel", "Valeur financiere generee (base 30EUR/h, 8min/lead)"],
        ["Actions IA", "Total des actions d'automatisation executees"],
    ]
    immo_table = Table(immo_kpis, colWidths=[40*mm, 120*mm])
    immo_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ZINC_800),
        ('TEXTCOLOR', (0, 0), (-1, 0), VIOLET),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 1), (-1, -1), ZINC_300),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
        ('LINEBELOW', (0, 0), (-1, 0), 1, ZINC_700),
        ('LINEBELOW', (0, 1), (-1, -2), 0.5, ZINC_800),
    ]))
    story.append(immo_table)

    story.append(PageBreak())

    # =========================================================================
    # 09 - INTEGRATIONS & STACK TECHNIQUE
    # =========================================================================
    story.append(h1("09  Integrations & stack technique"))

    story.append(h2("Stack frontend"))
    frontend = [
        "<b>React 18</b> avec Vite pour le bundling ultra-rapide",
        "<b>Tailwind CSS v4</b> avec dark theme natif",
        "<b>Framer Motion</b> pour les animations et transitions",
        "<b>React Query</b> (TanStack) pour le data fetching et caching",
        "<b>Lucide React</b> pour l'iconographie",
    ]
    for f in frontend:
        story.append(bullet(f))

    story.append(h2("Stack backend & infrastructure"))
    backend = [
        "<b>Supabase</b> : authentification, base de donnees PostgreSQL, temps reel, RLS",
        "<b>Vercel</b> : deploiement, serverless functions, analytics",
        "<b>Stripe</b> : paiements, abonnements, webhooks",
        "<b>Resend</b> : emails transactionnels",
        "<b>Calendly</b> : prise de rendez-vous pour les audits",
        "<b>n8n</b> : orchestration des workflows d'automatisation",
    ]
    for f in backend:
        story.append(bullet(f))

    story.append(h2("Integrations metier"))
    integrations = [
        "<b>Shopify</b> : OAuth complet, sync commandes/clients/produits",
        "<b>SeLoger / LeBonCoin</b> : recuperation de leads immobiliers",
        "<b>GPT-4o</b> : intelligence artificielle pour recommandations et automatisations",
    ]
    for f in integrations:
        story.append(bullet(f))

    story.append(h2("APIs & endpoints"))
    apis = [
        "<b>/api/create-checkout</b> : creation de sessions Stripe Checkout",
        "<b>/api/stripe-webhook</b> : reception des evenements Stripe",
        "<b>/api/send-funnel-email</b> : envoi d'emails d'onboarding via Resend",
        "<b>/api/invite-user</b> : invitation et creation de comptes clients",
        "<b>/api/shopify/install</b> : installation OAuth Shopify",
    ]
    for f in apis:
        story.append(bullet(f))

    story.append(PageBreak())

    # =========================================================================
    # 10 - SECURITE & ARCHITECTURE
    # =========================================================================
    story.append(h1("10  Securite & architecture"))

    story.append(h2("Isolation multi-tenant"))
    security_features = [
        "<b>Row Level Security (RLS)</b> sur toutes les tables Supabase",
        "Chaque client ne voit que ses propres donnees",
        "Policies RLS sur automation_events, metrics_daily, clients",
        "Verification owner_user_id systematique",
    ]
    for f in security_features:
        story.append(bullet(f))

    story.append(h2("Authentification"))
    auth_features = [
        "Authentification email/mot de passe via Supabase Auth",
        "Workflow de setup de mot de passe apres invitation",
        "Support OAuth/SSO via callback",
        "Gestion de sessions securisee",
    ]
    for f in auth_features:
        story.append(bullet(f))

    story.append(h2("Protection des paiements"))
    payment_security = [
        "CSRF protection avec cookies HttpOnly (Shopify OAuth)",
        "Webhooks Stripe avec verification de signature",
        "Aucune donnee bancaire stockee cote serveur",
        "Metadata tracking pour tracabilite complete",
    ]
    for f in payment_security:
        story.append(bullet(f))

    story.append(h2("Architecture deployement"))
    deploy_features = [
        "Deploiement continu via Vercel (git push = deploy)",
        "Serverless functions pour les APIs",
        "CDN global pour les assets statiques",
        "Vercel Analytics pour le monitoring",
    ]
    for f in deploy_features:
        story.append(bullet(f))

    story.append(PageBreak())

    # =========================================================================
    # 11 - POURQUOI ACTERO EST UNIQUE
    # =========================================================================
    story.append(h1("11  Pourquoi Actero est unique"))
    story.append(Spacer(1, 4*mm))

    story.append(h2("1. Systemes, pas services"))
    story.append(body(
        "La plupart des agences vendent du temps humain. Actero construit des <b>systemes autonomes</b> "
        "qui tournent 24/7 sans intervention. Le client ne paie pas des heures de consulting : "
        "il investit dans une infrastructure qui s'ameliore avec le temps."
    ))

    story.append(h2("2. ROI mesurable en temps reel"))
    story.append(body(
        "Chaque client a un dashboard avec ses KPIs en temps reel. Pas de reporting mensuel "
        "en PowerPoint : le ROI est visible a la seconde pres. Temps economise, euros generes, "
        "actions executees - tout est transparent et verifiable."
    ))

    story.append(h2("3. Double verticale specialisee"))
    story.append(body(
        "Actero ne fait pas du \"generique\". Chaque verticale (E-commerce, Immobilier) a ses "
        "propres agents IA, ses KPIs dedies, ses integrations natives et son dashboard adapte. "
        "Un agent SAV e-commerce et un qualificateur de leads immobilier n'ont rien en commun - "
        "nos systemes non plus."
    ))

    story.append(h2("4. Onboarding automatise de bout en bout"))
    story.append(body(
        "De l'audit gratuit au dashboard fonctionnel, tout est automatise : prise de RDV Calendly, "
        "paiement Stripe, creation de compte, email d'onboarding, acces personnalise. "
        "Zero friction, zero intervention manuelle."
    ))

    story.append(h2("5. Intelligence IA integree"))
    story.append(body(
        "Le dashboard ne se contente pas d'afficher des metriques. Il recommande activement "
        "des optimisations via GPT-4o : nouveaux workflows a deployer, ameliorations detectees, "
        "plans d'execution detailles. L'IA ne remplace pas l'humain - elle le rend plus strategique."
    ))

    story.append(h2("6. Temps reel natif"))
    story.append(body(
        "Grace a Supabase Realtime et les postgres_changes, chaque evenement d'automatisation "
        "apparait instantanement dans le dashboard. Pas de refresh, pas de polling : le client "
        "voit ses systemes travailler en direct."
    ))

    story.append(h2("7. Stack moderne, zero legacy"))
    story.append(body(
        "React 18 + Vite + Tailwind + Supabase + Vercel + Stripe. Aucune dette technique, "
        "aucun serveur a maintenir, deploiement continu. La stack est pensee pour scaler "
        "de 5 a 500 clients sans rien changer."
    ))

    story.append(Spacer(1, 10*mm))
    story.append(sep())
    story.append(Spacer(1, 6*mm))

    # Final CTA
    story.append(Paragraph(
        "Pret a construire votre infrastructure IA ?",
        ParagraphStyle('FinalCTA', fontName='Helvetica-Bold', fontSize=18, leading=24,
                       textColor=WHITE, alignment=TA_CENTER, spaceAfter=4*mm)
    ))
    story.append(Paragraph(
        "Reservez votre audit strategie gratuit sur actero.fr/audit",
        ParagraphStyle('FinalLink', fontName='Helvetica-Bold', fontSize=14, leading=20,
                       textColor=EMERALD, alignment=TA_CENTER, spaceAfter=2*mm)
    ))

    # Build
    doc.build(story, onFirstPage=draw_page_bg, onLaterPages=draw_page_bg)
    print(f"PDF generated: {output_path}")


if __name__ == "__main__":
    build_pdf()
