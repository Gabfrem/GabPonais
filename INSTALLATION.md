# Guide d'installation pas à pas

Ce guide part du principe que tu n'as jamais utilisé Git, GitHub ni Supabase.
Compte une petite heure la première fois.

L'ordre a son importance : on fait **GitHub d'abord**, parce que Supabase permet de se
connecter avec un compte GitHub, et parce que la dernière étape de configuration Supabase
a besoin de l'adresse du site publié.

---

## Étape 0 — Ouvrir un terminal au bon endroit

Presque toutes les commandes doivent être tapées **dans le dossier du projet**.

1. Ouvre l'Explorateur de fichiers et va dans `D:\Téléchargements\GabPonais`.
2. Clique dans la barre d'adresse (là où le chemin est écrit), tape `powershell` et fais Entrée.

Une fenêtre bleue ou noire s'ouvre, déjà positionnée dans le bon dossier. C'est là que tu
taperas les commandes. Pour vérifier que tu es au bon endroit :

```powershell
ls
```

Tu dois voir `index.html`, `css`, `js`, `supabase`, `README.md`.

> **Attention :** sous PowerShell, n'enchaîne jamais deux commandes avec `&&`, ça ne marche
> pas. Tape-les une par une, en faisant Entrée entre chaque.

---

## Étape 1 — Tester l'application en local

**Pourquoi :** pour voir le résultat tout de suite, avant toute mise en ligne. Un navigateur
refuse de charger des modules JavaScript ouverts par double-clic (`file://`) — il lui faut
une vraie adresse `http://`. C'est le seul rôle de cette commande : servir le dossier.

```powershell
py -3 -m http.server 4321
```

La fenêtre affiche `Serving HTTP on 127.0.0.1 port 4321` et **reste bloquée** : c'est normal,
le serveur tourne. Ouvre ton navigateur sur :

```
http://localhost:4321
```

Clique sur **« Commencer sans compte »** : tu peux déjà réviser, la progression est
enregistrée dans le navigateur.

Pour arrêter le serveur : reviens dans la fenêtre PowerShell et fais `Ctrl + C`.

---

## Étape 2 — Dire à Git qui tu es

**Pourquoi :** Git signe chaque enregistrement (« commit ») avec un nom et un e-mail. Tant
qu'ils ne sont pas renseignés, il refuse de créer de nouveaux commits. À faire **une seule
fois sur ta machine**, pas à chaque projet.

```powershell
git config --global user.name "Gabin"
```

```powershell
git config --global user.email "gabin.fremin@gmail.com"
```

---

## Étape 3 — Créer le dépôt sur GitHub

**Pourquoi :** GitHub va héberger le code **et** le site web gratuitement. Ton dossier local
contient déjà l'historique Git ; il lui manque juste une destination en ligne.

1. Va sur **<https://github.com>**. Si tu n'as pas de compte, clique **Sign up** et suis
   l'inscription (e-mail, mot de passe, nom d'utilisateur — retiens ce nom d'utilisateur,
   il apparaîtra dans l'adresse de ton site).
2. Une fois connecté, va directement sur **<https://github.com/new>**.
3. Remplis :
   - **Repository name** : `gabponais`
   - **Description** : facultatif
   - **Public** — *important* : garde bien **Public**. GitHub Pages n'est gratuit que pour
     les dépôts publics ; en privé, il faudrait un abonnement payant.
   - **Ne coche RIEN** dans « Initialize this repository » (pas de README, pas de .gitignore,
     pas de licence). Ton dossier contient déjà ces fichiers, et cocher créerait un conflit.
4. Clique **Create repository**.

GitHub affiche alors une page avec des instructions et une adresse du type
`https://github.com/tonpseudo/gabponais.git`. Garde cet onglet ouvert.

---

## Étape 4 — Envoyer le code sur GitHub

**Pourquoi :** `git remote add` enregistre l'adresse de destination, `git push` y envoie
l'historique. C'est ce qui déclenchera ensuite la publication du site.

Remplace `tonpseudo` par ton vrai nom d'utilisateur GitHub :

```powershell
git remote add origin https://github.com/tonpseudo/gabponais.git
```

Cette commande n'affiche rien : c'est bon signe.

```powershell
git push -u origin main
```

**Une fenêtre de connexion va s'ouvrir** (le « Gestionnaire d'identifiants Git »). Choisis
**Sign in with your browser**, connecte-toi à GitHub, autorise. Windows retient les
identifiants : tu n'auras à le faire qu'une fois.

Quand c'est terminé, tu vois quelque chose comme `branch 'main' set up to track 'origin/main'`.
Rafraîchis la page GitHub : tes fichiers sont là.

> **Si Git répond `remote origin already exists`** — l'adresse a déjà été enregistrée. Corrige-la :
> `git remote set-url origin https://github.com/tonpseudo/gabponais.git`

---

## Étape 5 — Activer le site web (GitHub Pages)

**Pourquoi :** par défaut, GitHub stocke ton code sans le publier. Cette étape lui dit de le
servir comme un vrai site web. Le fichier `.github/workflows/deploy.yml` du projet fait le
reste automatiquement à chaque envoi.

1. Sur la page de ton dépôt, clique **Settings** (l'onglet tout à droite, avec l'engrenage).
2. Dans le menu de gauche, clique **Pages**.
3. Section **Build and deployment**, champ **Source** : ouvre la liste et choisis
   **GitHub Actions** (et non « Deploy from a branch »).

C'est tout, il n'y a pas de bouton « Enregistrer ».

4. Clique maintenant sur l'onglet **Actions** (en haut). Tu vois une tâche
   « Déployer sur GitHub Pages » en cours (point jaune), qui passe au vert en une minute environ.

Ton site est alors en ligne à l'adresse :

```
https://tonpseudo.github.io/gabponais/
```

**Note cette adresse**, l'étape 9 en a besoin.

> Si la tâche échoue en rouge, c'est presque toujours que l'étape 5.3 a été oubliée.
> Corrige la source, puis relance la tâche avec le bouton **Re-run all jobs**.

---

## Étape 6 — Créer le projet Supabase

**Pourquoi :** jusqu'ici, ta progression ne vit que dans le navigateur d'un seul appareil.
Supabase fournit gratuitement une base de données et un système de comptes, pour retrouver
ton avancement sur ton téléphone comme sur ton PC.

1. Va sur **<https://supabase.com>** et clique **Start your project**.
2. Connecte-toi **avec GitHub** (bouton *Continue with GitHub*) : le plus simple, aucun
   nouveau mot de passe à retenir.
3. Clique **New project**. Si Supabase demande d'abord de créer une organisation, donne-lui
   n'importe quel nom (le tien par exemple) et choisis le plan **Free**.
4. Remplis le formulaire du projet :
   - **Name** : `gabponais`
   - **Database Password** : clique **Generate a password**, puis **copie-le et range-le**
     quelque part. L'application n'en a pas besoin, mais lui seul permettra d'accéder
     directement à la base plus tard.
   - **Region** : choisis l'Europe (Frankfurt ou Paris) — c'est le serveur le plus proche,
     donc le plus rapide.
5. Clique **Create new project** et attends 1 à 2 minutes pendant la mise en route.

---

## Étape 7 — Créer les tables

**Pourquoi :** une base vide ne sait pas encore quoi stocker. Le script `supabase/schema.sql`
crée les trois tables (profils, progression, historique), les index, et surtout les règles de
sécurité qui garantissent que chaque utilisateur ne peut lire et modifier que ses propres données.

1. Ouvre le fichier `supabase/schema.sql` de ton projet avec le Bloc-notes
   (clic droit → Ouvrir avec → Bloc-notes), fais `Ctrl + A` puis `Ctrl + C` pour tout copier.
2. Dans Supabase, menu de gauche, clique **SQL Editor** (icône de terminal / `>_`).
3. Clique **New query**.
4. Colle le contenu (`Ctrl + V`) dans la grande zone de texte.
5. Clique **Run** en bas à droite (ou `Ctrl + Entrée`).

Tu dois voir **« Success. No rows returned »** en vert. C'est le résultat attendu : le script
crée des structures, il ne renvoie pas de données.

Pour vérifier : menu de gauche → **Table Editor**. Tu dois voir `profiles`, `progress` et
`reviews`.

---

## Étape 8 — Relier l'application à ta base

**Pourquoi :** l'application a besoin de savoir *où* est ta base et avec *quelle* clé s'y
adresser.

1. Dans Supabase, tout en bas du menu de gauche, clique **Project Settings** (l'engrenage),
   puis **API** dans le sous-menu (selon la version, la section peut s'appeler **API Keys**).
2. Repère deux valeurs et copie-les :
   - **Project URL** — du type `https://abcdefgh.supabase.co`
   - la clé **`anon` / `public`** (parfois notée *publishable*) — une longue suite de
     caractères commençant par `eyJ…`. **Ne prends surtout pas** celle marquée
     `service_role` / *secret*.
3. Ouvre `js/config.js` avec le Bloc-notes et remplis les deux lignes :

   ```js
   export const SUPABASE_URL = 'https://abcdefgh.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi…';
   ```

   Garde bien les apostrophes et le point-virgule. Enregistre (`Ctrl + S`).

> **Est-ce grave que cette clé soit visible dans un dépôt public ?** Non, elle est conçue
> pour ça : elle vit dans le navigateur de chaque visiteur. Ce qui protège tes données, ce
> sont les règles installées à l'étape 7, qui vérifient l'identité à chaque requête.
> La seule clé à ne jamais publier est `service_role`.

---

## Étape 9 — Régler l'authentification

**Pourquoi :** par défaut Supabase exige de cliquer sur un lien de confirmation reçu par
e-mail avant la première connexion, et refuse de rediriger vers un site qu'il ne connaît pas.

Toujours dans Supabase, menu de gauche → **Authentication** :

1. **Sign In / Providers** → **Email** : si tu veux pouvoir te connecter immédiatement après
   avoir créé ton compte, désactive **Confirm email**, puis **Save**.
2. **URL Configuration** :
   - **Site URL** : `https://tonpseudo.github.io/gabponais/`
   - **Redirect URLs** → **Add URL** : ajoute la même adresse, puis ajoute aussi
     `http://localhost:4321` pour que ça marche aussi quand tu travailles en local.
   - **Save**.

---

## Étape 10 — Republier

**Pourquoi :** tu as modifié `js/config.js` sur ton disque. Tant que la modification n'est
pas envoyée, la version en ligne ignore encore ta base de données.

Dans PowerShell, toujours dans le dossier du projet :

```powershell
git add -A
```

```powershell
git commit -m "Relier le projet Supabase"
```

```powershell
git push
```

Onglet **Actions** de ton dépôt : une nouvelle tâche démarre. Une minute plus tard, rends-toi
sur `https://tonpseudo.github.io/gabponais/` — l'écran d'accueil propose maintenant
**Connexion** et **Créer un compte**.

Crée ton compte, et tu es parti.

---

## Étape 11 — Installer une voix japonaise

**Pourquoi :** l'application fait prononcer les mots par la voix intégrée à Windows. Sans le
module japonais, les cartes s'affichent mais restent muettes — or c'est tout l'intérêt.

1. **Paramètres** Windows → **Heure et langue** → **Langue et région**.
2. **Ajouter une langue** → cherche **日本語 (Japanese)** → **Suivant**.
3. Dans la liste des composants, coche bien **Synthèse vocale** (*Text-to-speech*).
   Tu peux décocher « Définir comme langue d'affichage de Windows » — sinon ton Windows
   passera en japonais !
4. Installe, puis **redémarre ton navigateur**.
5. Dans l'application : **Réglages → Prononciation** → choisis la voix, puis clique
   **🔊 Tester : ありがとう**.

---

## Par la suite

Chaque fois que tu modifies le code, les trois mêmes commandes republient le site :

```powershell
git add -A
```

```powershell
git commit -m "Décris ici ce que tu as changé"
```

```powershell
git push
```

Le site se met à jour tout seul une minute plus tard.
