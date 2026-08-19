/**
 * Point d'entrée : amorçage, coquille de l'interface et routage par ancre (#/…).
 */
import { h, $, vide, toast } from './util.js';
import * as store from './store.js';
import * as supa from './supa.js';
import * as tts from './tts.js';
import { estConfigure, modeLocalChoisi, choisirModeLocal, quitterModeLocal } from './config.js';
import { vueAuth, normaliser } from './views/auth.js';
import { vueAccueil } from './views/accueil.js';
import { vuePratique } from './views/pratique.js';
import { vueGrammaire } from './views/grammaire.js';
import { vueVocabulaire } from './views/vocabulaire.js';
import { vueStats } from './views/stats.js';
import { vueReglages } from './views/reglages.js';
import { ouvrirSession } from './views/session.js';
import { ouvrirTestNiveau } from './views/test-niveau.js';


const ROUTES = {
  accueil: { titre: 'Accueil', ico: '🏠', vue: vueAccueil },
  pratique: { titre: 'Pratique', ico: '🎧', vue: vuePratique },
  grammaire: { titre: 'Grammaire', ico: '📐', court: 'Gram.', vue: vueGrammaire },
  vocabulaire: { titre: 'Vocabulaire', ico: '📖', court: 'Vocab.', vue: vueVocabulaire },
  stats: { titre: 'Statistiques', ico: '📊', court: 'Stats', vue: vueStats },
  reglages: { titre: 'Réglages', ico: '⚙️', court: 'Réglages', vue: vueReglages },
};

const racine = document.getElementById('racine');
let routeCourante = routeDepuisAncre();
let rendreDemande = false;

/* ------------------------------------------------------------ amorçage */

async function demarrer() {
  ecranChargement('Chargement…');

  let utilisateur = null;
  if (estConfigure()) {
    try {
      const session = await supa.sessionCourante();
      utilisateur = normaliser(session?.user ?? null);
    } catch (e) {
      console.warn('Session illisible :', e);
    }
    if (!utilisateur && !modeLocalChoisi()) return montrerAuth();
  } else if (!modeLocalChoisi()) {
    return montrerAuth();
  }

  await entrer(utilisateur);
}

function montrerAuth() {
  vide(racine).append(
    vueAuth(async (utilisateur) => {
      if (!utilisateur) choisirModeLocal();
      else quitterModeLocal();
      ecranChargement(utilisateur ? 'Récupération de ta progression…' : 'Préparation…');
      await entrer(utilisateur);
    }),
  );
}

async function entrer(utilisateur) {
  ecranChargement(utilisateur ? 'Récupération de ta progression…' : 'Préparation…');
  await store.initialiser(utilisateur);
  construireCoquille();
  rendre();

  // Premier démarrage : on propose de se situer plutôt que de repartir de zéro.
  // L'écran d'accueil du test permet de passer directement.
  if (!store.lire().reglages.testNiveauFait && store.compteurs().vues === 0) {
    ouvrirTestNiveau({ surFermeture: () => rendre() });
  }

  if (utilisateur) {
    supa.surChangementAuth((session) => {
      if (!session) window.location.reload();
    });
  }

  // Les voix arrivent parfois après coup : on rafraîchit une fois qu'elles sont prêtes.
  tts.quandPret(() => {
    if (routeCourante === 'accueil' || routeCourante === 'reglages') rendre();
  });

  store.abonner(planifierRendu);
}

function ecranChargement(texte) {
  vide(racine).append(
    h(
      'div',
      { class: 'chargement' },
      h('div', { class: 'rotor' }),
      h('p', { style: { color: 'var(--texte-2)', fontSize: '14px' }, text: texte }),
    ),
  );
}

/* ------------------------------------------------------------- coquille */

function construireCoquille() {
  vide(racine).append(
    h(
      'div',
      { class: 'app' },
      h('aside', { class: 'nav', id: 'nav' }),
      h('main', { class: 'principal' }, h('div', { class: 'contenu', id: 'contenu' })),
      h('nav', { class: 'nav-mobile', id: 'nav-mobile' }),
    ),
  );
}

function rendreNav() {
  const etat = store.lire();
  const c = store.compteurs();

  const lien = (cle) => {
    const r = ROUTES[cle];
    const actif = routeCourante === cle;
    const pastille = cle === 'accueil' ? c.aFaire : 0;
    return h(
      'button',
      { class: `nav__lien ${actif ? 'nav__lien--actif' : ''}`, onclick: () => aller(cle) },
      h('span', { class: 'nav__ico', text: r.ico }),
      h('span', { text: r.titre }),
      cle === 'accueil'
        ? h('span', { class: `nav__pastille ${pastille ? '' : 'nav__pastille--vide'}`, text: String(pastille) })
        : null,
    );
  };

  const initiales = (etat.utilisateur?.pseudo ?? 'Moi').slice(0, 2).toUpperCase();

  vide($('#nav')).append(
    h(
      'div',
      { class: 'marque' },
      h('div', { class: 'marque__sceau ja', text: '語' }),
      h('div', {}, h('div', { class: 'marque__nom', text: 'GabPonais' }), h('div', { class: 'marque__sous', text: '1000 mots' })),
    ),
    h('button', {
      class: 'btn btn--principal btn--bloc',
      style: { marginBottom: '16px' },
      text: c.aFaire ? `Étudier (${c.aFaire})` : 'Étudier',
      onclick: lancerEtude,
    }),
    ...Object.keys(ROUTES).map(lien),
    h(
      'div',
      { class: 'nav__bas' },
      h(
        'div',
        { class: 'compte' },
        h('div', { class: 'compte__avatar', text: initiales }),
        h(
          'div',
          { style: { minWidth: '0' } },
          h('div', { class: 'compte__nom', text: etat.utilisateur?.pseudo ?? 'Mode local' }),
          h('div', {
            class: 'compte__etat',
            text: etat.utilisateur
              ? etat.synchro === 'hors-ligne'
                ? 'hors-ligne'
                : 'synchronisé'
              : 'ce navigateur',
          }),
        ),
      ),
    ),
  );

  vide($('#nav-mobile')).append(
    ...Object.keys(ROUTES).map((cle) => {
      const r = ROUTES[cle];
      const actif = routeCourante === cle;
      return h(
        'button',
        { class: `nav-mobile__lien ${actif ? 'nav-mobile__lien--actif' : ''}`, onclick: () => aller(cle) },
        h('span', { class: 'nav-mobile__ico', text: r.ico }),
        h('span', { text: r.court ?? r.titre }),
        cle === 'accueil' && c.aFaire
          ? h('span', { class: 'nav-mobile__pastille', text: String(Math.min(999, c.aFaire)) })
          : null,
      );
    }),
  );
}

/* -------------------------------------------------------------- routage */

function routeDepuisAncre() {
  const cle = (location.hash || '').replace(/^#\/?/, '');
  return ROUTES[cle] ? cle : 'accueil';
}

function aller(cle) {
  location.hash = `#/${cle}`;
}

window.addEventListener('hashchange', () => {
  const suivante = routeDepuisAncre();
  if (suivante === routeCourante) return;
  routeCourante = suivante;
  rendre({ haut: true });
});

function lancerEtude() {
  ouvrirSession({ surFermeture: () => rendre() });
}

/* ---------------------------------------------------------------- rendu */

function planifierRendu() {
  if (rendreDemande || document.querySelector('.session')) return;
  rendreDemande = true;
  const executer = () => {
    if (!rendreDemande) return;
    rendreDemande = false;
    rendre();
  };
  requestAnimationFrame(executer);
  // requestAnimationFrame ne s'exécute pas dans un onglet en arrière-plan :
  // sans ce relais, l'interface resterait figée sur des données périmées.
  setTimeout(executer, 120);
}

function rendre(opts = {}) {
  const conteneur = $('#contenu');
  if (!conteneur) return;

  rendreNav();

  const memoire = memoriserSaisie(conteneur);
  const vue = ROUTES[routeCourante].vue;
  vide(conteneur).append(vue(aller, rendre));
  restaurerSaisie(conteneur, memoire, opts);

  document.title = `${ROUTES[routeCourante].titre} — GabPonais`;
  if (opts.haut) window.scrollTo({ top: 0 });
}

/** Conserve le champ de recherche actif d'un rendu à l'autre. */
function memoriserSaisie(conteneur) {
  const actif = document.activeElement;
  if (!actif || !conteneur.contains(actif) || !actif.matches('input[data-role="recherche"]')) return null;
  return { valeur: actif.value, curseur: actif.selectionStart };
}

function restaurerSaisie(conteneur, memoire) {
  if (!memoire) return;
  const champ = $('input[data-role="recherche"]', conteneur);
  if (!champ) return;
  champ.focus();
  try {
    champ.setSelectionRange(memoire.curseur, memoire.curseur);
  } catch {
    /* type de champ sans sélection */
  }
}

/* ------------------------------------------------------- raccourcis */

document.addEventListener('keydown', (e) => {
  if (document.querySelector('.session') || document.querySelector('.modale')) return;
  if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 's' || e.key === 'S') {
    e.preventDefault();
    lancerEtude();
  }
});

window.addEventListener('error', (e) => {
  console.error(e.error ?? e.message);
});

demarrer().catch((e) => {
  console.error(e);
  vide(racine).append(
    h(
      'div',
      { class: 'chargement' },
      h('div', { class: 'vide__ico', text: '⚠️' }),
      h('div', { class: 'vide__titre', text: 'Impossible de démarrer l’application' }),
      h('p', { style: { color: 'var(--texte-2)', maxWidth: '40ch', textAlign: 'center' }, text: String(e?.message ?? e) }),
      h('button', { class: 'btn', text: 'Réessayer', onclick: () => window.location.reload() }),
    ),
  );
});

// Utile pour déboguer depuis la console du navigateur.
window.GabPonais = { store, tts, toast };
