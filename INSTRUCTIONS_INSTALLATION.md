# Instructions d'installation et de configuration

## 1. Pourquoi le dossier `/components/ui` est-il important ?
Par convention, Shadcn UI installe ses composants de base (Button, Card, Carousel, etc.) dans le dossier `components/ui`. Cela permet de séparer clairement les **composants d'interface utilisateur** (réutilisables et génériques) des **composants spécifiques à l'application** ou des pages. 

Si ce dossier n'existe pas ou n'est pas le dossier par défaut, vos composants basiques vont se retrouver mélangés avec la logique de votre application, ce qui rendra la maintenance plus difficile à l'avenir. Définir ce dossier aide aussi la CLI de Shadcn à placer les composants au bon endroit automatiquement lors de futures installations.

## 2. Configurer Shadcn CLI, Tailwind et TypeScript (si nécessaire)

Votre projet est basé sur Vite avec JavaScript Vanilla (`.jsx`/`.js`) et Tailwind CSS v4. Cependant, si vous souhaitez refaire la configuration initiale avec TypeScript et Shadcn CLI complètement, voici comment procéder.

### Étape A : Ajouter TypeScript (Optionnel mais recommandé pour Shadcn)
Si vous voulez migrer vers TypeScript :
```bash
npm install -D typescript @types/react @types/react-dom
npx tsc --init
```
Modifiez ensuite l'extension de vos fichiers `.jsx` vers `.tsx` et `.js` vers `.ts`.

### Étape B : Setup de Tailwind CSS
Tailwind CSS est déjà installé en version v4 dans votre projet (via `@tailwindcss/vite`). Si un jour vous reprenez un projet de zéro :
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Configurez ensuite vos chemins dans `tailwind.config.js` et ajoutez les directives Tailwind dans votre `index.css`.

### Étape C : Initialiser Shadcn CLI
Pour synchroniser votre projet avec Shadcn UI et créer le fichier de configuration `components.json` :
```bash
npx shadcn-ui@latest init
```

Il vous posera plusieurs questions. Voici les réponses recommandées :
- **Which color for your base?** Sélectionnez la couleur de votre choix (ex: `Slate`).
- **Where is your global CSS file?** Dites `src/index.css` (ou la racine si approprié).
- **Do you want to use CSS variables for colors?** `yes`
- **Where is your tailwind.config.js located?** Laissez par défaut.
- **Configure the import alias for components:** `@/components`
- **Configure the import alias for utils:** `@/lib/utils`

Une fois terminé, vous pourrez installer n'importe quel composant générique en tapant simplement :
```bash
npx shadcn-ui@latest add button card carousel
```

*(Note : Dans le cadre de ce ticket, nous avons déjà copié manuellement les composants et les utilitaires pour vous faire gagner du temps et respecter l'arborescence actuelle !)*
