# Patch Supabase - Redirection /auth/callback

Pour corriger définitivement le problème de redirection vers la page d'accueil, vous devez appliquer ces modifications dans votre Dashboard Supabase. (Étant donné que je n'ai pas les accès à votre projet Supabase, voici les étapes exactes à suivre).

## 1. PATCH BACKEND (SQL RPC `admin_onboard_client`)

Allez dans **SQL Editor** sur Supabase.
Trouvez la définition de la fonction `admin_onboard_client` et modifiez l'appel à la fonction d'invite (vers `/auth/v1/admin/invite`). 

Vous devez ajouter `redirect_to` et `redirectTo` dans le payload JSON. Votre `json_build_object` doit ressembler à ceci :

```sql
  -- ... code existant ...
  json_build_object(
      'email', lower(trim(p_email)),
      'redirect_to', 'https://actero.fr/auth/callback',
      'redirectTo', 'https://actero.fr/auth/callback'
  )
  -- ... code existant ...
```
**(Sauvegardez la fonction modifiée).**

## 2. PATCH TEMPLATES EMAIL

Allez dans **Authentication > Emails > Templates**.

**A) Template "Invite user"**
Modifiez le href du bouton CTA pour ajouter le paramètre `redirect_to` à la toute fin de l'URL existante :
```html
{{ .ConfirmationURL }}&redirect_to=https://actero.fr/auth/callback
```

**B) Template "Magic link"**
Modifiez également le href du bouton CTA pour ce template :
```html
{{ .ConfirmationURL }}&redirect_to=https://actero.fr/auth/callback
```
> **❗ IMPORTANT :** Ne modifiez pas le reste du design email, ajoutez uniquement le `&redirect_to=...` à la fin du tag `{{ .ConfirmationURL }}`.

## 3. VÉRIFICATION URL CONFIGURATION

Allez dans **Authentication > URL Configuration**.
Vérifiez que sous **Site URL** ou **Redirect URLs**, les liens suivants sont présents :
- `https://actero.fr/auth/callback`
- `https://actero.fr/app`
- `https://actero.fr/*`

Ajoutez `https://actero.fr/auth/callback` si ce lien est manquant, c'est crucial pour que Supabase autorise la redirection.

## 4. TEST FINAL

Une fois ces trois étapes effectuées :
1. Créez un nouveau client depuis l'onglet **Onboarding** du Dashboard Admin.
2. Ouvrez l'email reçu.
3. Vérifiez au survol du bouton que le paramètre `&redirect_to=https://actero.fr/auth/callback` est bien présent.
4. Cliquez sur le lien : vous devriez atterrir sur la page `/auth/callback` avec le loader, qui vous basculera ensuite automatiquement sur `/app`.
