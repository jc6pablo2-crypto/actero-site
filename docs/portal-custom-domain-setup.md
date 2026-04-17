# Portal custom domain — Vercel setup

Branche Pro+ du Portail SAV qui permet à un marchand de servir le portail sur son propre domaine (ex `sav.mamarque.fr`) au lieu de `{slug}.portal.actero.fr`.

## Architecture

```
Client saisit "sav.mamarque.fr"
        │
        ▼
POST /api/client/update-portal-branding
        │
        ├── 1. Écrit clients.portal_custom_domain en DB
        │
        └── 2. Appelle syncProjectDomain() → Vercel REST API
                │
                ├── POST /v10/projects/{projectId}/domains    (ajout)
                └── DELETE /v9/projects/{projectId}/domains/{old}  (si changement)

Vercel:
- Accepte le domaine
- Émet automatiquement un certificat SSL Let's Encrypt (DV)
- Le domaine est "pending" tant que le client n'a pas configuré le CNAME

Client configure chez son registrar:
- CNAME  sav  →  portal.actero.fr

DNS se propage (quelques min à 24h).

Sur une requête:
- Vercel détecte hostname == sav.mamarque.fr, route vers le projet actero-site
- /api/portal/resolve-client matche portal_custom_domain dans la DB
- Rend PortalApp normalement, en respectant portal_hide_actero_branding
```

## Variables d'environnement requises

À ajouter dans **Vercel → actero-site → Settings → Environment Variables** (Production + Preview) :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `VERCEL_TOKEN` | *(à créer)* | Token personnel ou d'équipe avec scope `domains` |
| `VERCEL_PROJECT_ID` | `prj_vt6GhTPyIfEmREYAF33hSNs3c5gQ` | ID du projet `actero-site` |
| `VERCEL_TEAM_ID` | `team_oCP0xn1U1UvS4ieKLyIdigOI` | ID de la team `actero1` |

### Créer le token

1. https://vercel.com/account/tokens
2. **Create Token** :
   - Nom : `actero-portal-domain-management`
   - Scope : `Full Account` (ou team `actero1` si disponible)
   - Expiration : 1 an (à renouveler)
3. Copier la valeur dans `VERCEL_TOKEN` côté Vercel Project Settings

> ⚠️ Ce token donne accès à l'API Vercel de la team — stocké uniquement côté backend, jamais exposé au client.

## Tolérance aux pannes

Si `VERCEL_TOKEN` n'est pas configuré, le code se comporte ainsi :
- Le domaine est quand même enregistré en DB (`portal_custom_domain`)
- L'appel `syncProjectDomain()` renvoie `{ ok: false, reason: 'not_configured' }` sans throw
- L'UI affiche un badge « Configuration Actero en attente » via `/api/client/portal-domain-status`
- Un admin peut ajouter le domaine manuellement via le dashboard Vercel

## Endpoints impliqués

| Endpoint | Rôle |
|----------|------|
| `POST /api/client/update-portal-branding` | Save domain + sync Vercel |
| `GET  /api/client/portal-domain-status` | Renvoie `{status, verified, misconfigured, verification, message}` pour badge UI |
| `GET  /api/portal/resolve-client` | Résout hostname → clientRow (matche `slug` OU `portal_custom_domain`) |

## Test end-to-end

1. Dans `/client/portal-sav` (compte Pro), saisir `sav.mon-test.fr`
2. Vérifier dans les logs Vercel que le domaine apparaît (Settings → Domains)
3. Chez le registrar : ajouter `CNAME sav → portal.actero.fr`
4. Attendre la propagation (surveiller le badge passer de "En attente DNS" à "Actif")
5. Visiter `https://sav.mon-test.fr` → le portail s'affiche, footer sans "Propulsé par Actero" si toggle activé
