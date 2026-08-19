# GabPonais 語

Apprendre **les 1000 mots japonais les plus courants à l'oreille**, avec un système de
répétition espacée façon Anki, un compte utilisateur Supabase et un suivi de progression détaillé.

L'écriture des kanji n'est jamais demandée : ils apparaissent seulement comme repère visuel
sur la face réponse, et peuvent être masqués. L'objectif est la **reconnaissance auditive**.

---

## Ce que fait l'application

| | |
|---|---|
| **Écoute → sens** | Le mot est prononcé, tu devines le sens, puis tu t'auto-évalues. C'est le mode par défaut. |
| **Le kanji pendant l'écoute** | Il s'affiche sous le haut-parleur, avant la réponse : il ne livre pas la prononciation, mais laisse le sens s'associer à la forme écrite pendant la réflexion. Désactivable. |
| **Français → japonais** | Le mode inverse, pour le rappel actif. |
| **Mixte** | Deux questions sur trois à l'écoute. |
| **Répétition espacée** | Variante de SM-2 : paliers d'apprentissage à 1 et 10 min, puis intervalles en jours modulés par une « facilité » propre à chaque mot, plafonnés à un an. |
| **Test de niveau** | Proposé au premier lancement et rejouable depuis les réglages. Quatre mots tirés dans chaque tranche de cent, du plus courant au plus rare ; le test s'arrête dès que les mots deviennent trop rares. Les mots reconnus entrent en révision à courte échéance, **étalés sur plusieurs jours**, sans être déclarés acquis. |
| **Charge maîtrisée** | On règle un **budget en minutes**, pas un nombre de cartes. L'application mesure le temps réel passé par carte, en déduit ce qui tient dans la journée, ralentit puis suspend les nouveautés quand les révisions s'accumulent, et annonce à l'avance la charge en régime stable. Les mots ratés neuf fois sont mis de côté d'office. |
| **Pratique** | Deux exercices qui n'ajoutent **aucune** révision : *Tir rapide* (un mot, quatre sens, six secondes) pour la reconnaissance immédiate, et *Phrases* — 121 phrases dites d'un trait, débloquées au fur et à mesure et composées uniquement de mots déjà rencontrés. |
| **Suivi** | Série de jours consécutifs, objectif quotidien, calendrier d'activité sur 20 semaines, taux de réussite à 7/30/90 jours, charge de révisions prévue, répartition du vocabulaire, mots coriaces. |
| **Vocabulaire** | Les 1000 mots consultables, filtrables par état / palier / nature, avec recherche et écoute à la demande. |
| **Hors-ligne** | Tout est enregistré localement puis synchronisé dès que le réseau revient. |

La prononciation utilise la **synthèse vocale du navigateur** (Web Speech API) : aucune clé
d'API, aucun fichier audio à héberger, et le japonais est lu par la voix système.

> **Voix japonaise requise.** Sur Windows : *Paramètres → Heure et langue → Langue et région →
> Ajouter une langue → 日本語*, puis dans les options de la langue, installer le module
> **Synthèse vocale**. Redémarre ensuite le navigateur. Sans cela, les cartes s'affichent
> mais ne sont pas lues.

---

> **Jamais utilisé Git, GitHub ou Supabase ?** Suis plutôt
> [`INSTALLATION.md`](INSTALLATION.md) : chaque clic y est détaillé.

## Démarrer en local

Aucune installation, aucun build : ce sont des fichiers statiques et des modules ES natifs.
Il faut simplement un petit serveur HTTP (les modules ES ne fonctionnent pas en `file://`).

```bash
py -3 -m http.server 4321
```

Puis ouvre <http://localhost:4321>.

Au premier lancement, choisis **« Commencer sans compte »** pour tester tout de suite :
la progression est alors stockée dans le navigateur.

---

## Mettre en place les comptes (Supabase)

1. Crée un projet gratuit sur [supabase.com](https://supabase.com).
2. Ouvre **SQL Editor → New query**, colle le contenu de [`supabase/schema.sql`](supabase/schema.sql)
   et clique sur **Run**. Cela crée les tables `profiles`, `progress`, `reviews`, active la
   sécurité au niveau des lignes (RLS) et branche la création automatique du profil à l'inscription.
3. Va dans **Project Settings → API** et récupère :
   - l'**URL du projet** (`https://xxxx.supabase.co`) ;
   - la clé publique **`anon`**.
4. Renseigne-les dans [`js/config.js`](js/config.js) :

   ```js
   export const SUPABASE_URL = 'https://xxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi…';
   ```

   *(Ou, sans toucher au code : lance l'application et colle les deux valeurs dans
   Réglages → Compte et synchronisation. Elles ne vaudront alors que pour ce navigateur.)*

5. Dans **Authentication → Providers → Email**, tu peux désactiver *Confirm email* si tu veux
   pouvoir te connecter immédiatement après l'inscription, sans passer par ta boîte mail.

### Pourquoi la clé peut-elle être publique ?

La clé `anon` est faite pour vivre dans le navigateur. Ce qui protège les données, ce sont les
politiques RLS du script SQL : chaque requête ne peut lire ou écrire que les lignes dont
`user_id` correspond à l'utilisateur authentifié. **Ne mets jamais la clé `service_role`
dans ce dépôt** — elle contourne toutes les règles.

---

## Publier sur GitHub Pages

```bash
git add -A
git commit -m "Première version de GabPonais"
git remote add origin https://github.com/<ton-compte>/gabponais.git
git push -u origin main
```

Puis, dans le dépôt GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.

Le workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) publie le dépôt tel
quel à chaque poussée sur `main` — il n'y a rien à compiler. Le site sera disponible sur
`https://<ton-compte>.github.io/gabponais/`.

Dernière étape côté Supabase : dans **Authentication → URL Configuration**, ajoute cette
adresse à la liste des **Redirect URLs**, sinon la réinitialisation de mot de passe renverra
vers une page inconnue.

---

## Raccourcis clavier

| Touche | Effet |
|---|---|
| `S` | Lancer une session depuis n'importe quelle page |
| `Espace` | Afficher la réponse, puis noter « Correct » |
| `R` | Réécouter le mot |
| `1` `2` `3` `4` | À revoir / Difficile / Correct / Facile |
| `Échap` | Quitter la session |

---

## Organisation du code

```
index.html              coquille HTML
css/style.css           thème sombre et clair, toute la mise en page
js/
  app.js                amorçage, navigation par ancre (#/…), barre latérale
  config.js             URL et clé Supabase
  supa.js               authentification et accès aux tables
  store.js              état central, cache local, file de synchronisation
  srs.js                moteur de répétition espacée (SM-2 adapté)
  tts.js                synthèse vocale japonaise
  util.js               helpers DOM, dates, formats
  data/
    p1.js … p10.js      les 1000 mots, 100 par fichier
    words.js            assemblage, paliers, détection des homophones
  views/
    auth.js             connexion, inscription, mode local
    accueil.js          tableau de bord
    session.js          la session d'étude en plein écran
    vocabulaire.js      liste, recherche, filtres, fiche détaillée
    stats.js            calendrier, histogrammes, taux de réussite
    reglages.js         rythme, session, voix, thème, compte
    composants.js       anneau de progression, calendrier, confirmation
supabase/schema.sql     tables, index, politiques RLS, trigger de profil
```

---

## À propos de la liste de mots

Les 1000 entrées sont classées par fréquence approximative d'usage et regroupées en dix
paliers de cent. Chacune porte le kana, le rōmaji (Hepburn), la traduction française, la
nature grammaticale et, pour information seulement, l'écriture usuelle en kanji.

Les particules grammaticales (は, が, を…) sont volontairement absentes : très fréquentes,
mais sans intérêt en carte de vocabulaire.

Vingt-six paires de mots sont de vrais homophones (そこ « là » et 底 « le fond », きる
« couper » et « porter »…). En mode écoute, l'application affiche alors la nature du mot
comme indice, faute de quoi la question n'aurait pas de réponse unique.

La liste est éditable : chaque fichier `js/data/pN.js` contient des lignes
`["kanji", "kana", "romaji", "français", "nature"]`. L'`id` d'un mot est sa position dans la
liste complète — **si tu réordonnes ou supprimes des lignes, la progression déjà enregistrée
se retrouvera associée aux mauvais mots.** Pour corriger une traduction, modifie la ligne sur
place sans en changer l'ordre.
