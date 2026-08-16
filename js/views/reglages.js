import { h, toast, arrondi } from '../util.js';
import * as store from '../store.js';
import * as tts from '../tts.js';
import * as supa from '../supa.js';
import { configEffective, enregistrerConfigLocale, effacerConfigLocale, SUPABASE_URL } from '../config.js';
import { confirmer } from './composants.js';

export function vueReglages(naviguer, rafraichir) {
  const etat = store.lire();
  const r = etat.reglages;
  const maj = (champs) => {
    store.majReglages(champs);
    rafraichir();
  };

  return h(
    'div',
    {},
    h(
      'div',
      { class: 'entete' },
      h(
        'div',
        {},
        h('h1', { class: 'entete__titre', text: 'Réglages' }),
        h('p', { class: 'entete__sous', text: 'Adapte le rythme et la présentation à ta façon d’apprendre.' }),
      ),
    ),

    /* ------------------------------------------------------- étude */
    h(
      'section',
      { class: 'carte' },
      h('h3', { class: 'carte__titre', text: 'Rythme d’apprentissage' }),
      curseur({
        libelle: 'Objectif quotidien',
        aide: 'Nombre de cartes visé chaque jour, pour l’anneau du tableau de bord.',
        valeur: r.objectifQuotidien,
        min: 5,
        max: 200,
        pas: 5,
        suffixe: 'cartes',
        onchange: (v) => maj({ objectifQuotidien: v }),
      }),
      curseur({
        libelle: 'Nouveaux mots par jour',
        aide: 'Trop de nouveautés d’un coup gonfle les révisions des jours suivants. 10 à 15 est un bon rythme.',
        valeur: r.limiteNouvelles,
        min: 0,
        max: 50,
        pas: 1,
        suffixe: 'mots',
        onchange: (v) => maj({ limiteNouvelles: v }),
      }),
      curseur({
        libelle: 'Plafond de révisions par jour',
        aide: 'Limite haute pour éviter les journées interminables après une pause.',
        valeur: r.limiteRevisions,
        min: 20,
        max: 500,
        pas: 10,
        suffixe: 'cartes',
        onchange: (v) => maj({ limiteRevisions: v }),
      }),
      champSelect({
        libelle: 'Ordre des nouveaux mots',
        valeur: r.ordreNouvelles,
        options: [
          ['frequence', 'Par fréquence (du plus courant au plus rare)'],
          ['aleatoire', 'Aléatoire'],
        ],
        onchange: (v) => maj({ ordreNouvelles: v }),
      }),
    ),

    /* ------------------------------------------------------- session */
    h(
      'section',
      { class: 'carte', style: { marginTop: '16px' } },
      h('h3', { class: 'carte__titre', text: 'Déroulé des sessions' }),
      champSelect({
        libelle: 'Type de question',
        aide: 'Le mode écoute est celui qui entraîne la reconnaissance à l’oral.',
        valeur: r.modeEtude,
        options: [
          ['ecoute', 'Écoute → sens (recommandé)'],
          ['rappel', 'Français → japonais'],
          ['mixte', 'Mixte (2 questions sur 3 à l’écoute)'],
        ],
        onchange: (v) => maj({ modeEtude: v }),
      }),
      bascule({
        libelle: 'Lecture automatique',
        aide: 'Prononce le mot dès l’affichage de la question.',
        valeur: r.lectureAuto,
        onchange: (v) => maj({ lectureAuto: v }),
      }),
      bascule({
        libelle: 'Afficher le rōmaji',
        aide: 'La transcription latine sur la face réponse.',
        valeur: r.afficherRomaji,
        onchange: (v) => maj({ afficherRomaji: v }),
      }),
      bascule({
        libelle: 'Afficher l’écriture en kanji',
        aide: 'Simple repère visuel : elle ne t’est jamais demandée.',
        valeur: r.afficherKanji,
        onchange: (v) => maj({ afficherKanji: v }),
      }),
    ),

    /* ------------------------------------------------------- voix */
    sectionVoix(r, maj),

    /* ------------------------------------------------------ apparence */
    h(
      'section',
      { class: 'carte', style: { marginTop: '16px' } },
      h('h3', { class: 'carte__titre', text: 'Apparence' }),
      champSelect({
        libelle: 'Thème',
        valeur: r.theme,
        options: [
          ['sombre', 'Sombre'],
          ['clair', 'Clair'],
        ],
        onchange: (v) => maj({ theme: v }),
      }),
    ),

    /* ------------------------------------------------- synchronisation */
    sectionCompte(etat, rafraichir),

    /* --------------------------------------------------------- danger */
    h(
      'section',
      { class: 'carte', style: { marginTop: '16px' } },
      h('h3', { class: 'carte__titre', text: 'Zone sensible' }),
      h('p', {
        style: { fontSize: '13.5px', color: 'var(--texte-2)', marginBottom: '14px' },
        text: 'Efface toute ta progression : cartes, historique et statistiques. Cette action est définitive.',
      }),
      h('button', {
        class: 'btn btn--danger',
        text: 'Réinitialiser toute ma progression',
        onclick: async () => {
          if (
            await confirmer({
              titre: 'Tout réinitialiser ?',
              texte: 'Les 1000 mots redeviendront des mots à découvrir et l’historique sera effacé. Impossible de revenir en arrière.',
              valider: 'Tout effacer',
              danger: true,
            })
          ) {
            await store.toutRemettreAZero();
            toast('Progression réinitialisée.', 'succes');
            rafraichir();
          }
        },
      }),
    ),
  );
}

/* --------------------------------------------------------------- blocs */

function sectionVoix(r, maj) {
  const voix = tts.voixJaponaises();
  const conteneur = h(
    'section',
    { class: 'carte', style: { marginTop: '16px' } },
    h('h3', { class: 'carte__titre', text: 'Prononciation' }),
  );

  if (!tts.supporte()) {
    conteneur.append(
      h('p', { style: { fontSize: '13.5px', color: 'var(--texte-2)' }, text: 'Ce navigateur ne propose pas de synthèse vocale.' }),
    );
    return conteneur;
  }

  if (!voix.length) {
    conteneur.append(
      h(
        'div',
        { class: 'bandeau', style: { margin: '0 0 14px' } },
        h('span', { class: 'bandeau__ico', text: '🔇' }),
        h(
          'span',
          {},
          'Aucune voix japonaise détectée. Sous Windows : Paramètres → Heure et langue → Langue et région → Ajouter « 日本語 », puis installer le module « Synthèse vocale ». Redémarre ensuite le navigateur.',
        ),
      ),
    );
  } else {
    conteneur.append(
      champSelect({
        libelle: 'Voix japonaise',
        valeur: r.voixUri ?? voix[0].voiceURI,
        options: voix.map((v) => [v.voiceURI, `${v.name} (${v.lang})`]),
        onchange: (v) => maj({ voixUri: v }),
      }),
    );
  }

  conteneur.append(
    curseur({
      libelle: 'Vitesse de lecture',
      aide: 'Un débit plus lent aide au début ; remonte-le pour t’habituer au rythme naturel.',
      valeur: r.vitesse,
      min: 0.5,
      max: 1.4,
      pas: 0.05,
      format: (v) => `× ${arrondi(v, 2)}`,
      onchange: (v) => maj({ vitesse: v }),
    }),
    h('button', {
      class: 'btn btn--fantome',
      style: { marginTop: '10px' },
      text: '🔊 Tester : ありがとう',
      onclick: () => tts.dire('ありがとう', { vitesse: r.vitesse, uri: r.voixUri }),
    }),
  );

  return conteneur;
}

function sectionCompte(etat, rafraichir) {
  const cfg = configEffective();
  const section = h(
    'section',
    { class: 'carte', style: { marginTop: '16px' } },
    h('h3', { class: 'carte__titre', text: 'Compte et synchronisation' }),
  );

  if (etat.utilisateur) {
    const libelleSynchro =
      { inactif: 'à jour', 'en cours': 'en cours…', 'hors-ligne': 'en attente de réseau', erreur: 'erreur' }[
        etat.synchro
      ] ?? etat.synchro;
    section.append(
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
        infoLigne('Connecté en tant que', etat.utilisateur.email),
        infoLigne('Pseudo', etat.utilisateur.pseudo),
        infoLigne('Synchronisation', libelleSynchro),
        infoLigne('Projet Supabase', cfg ? new URL(cfg.url).host : '—'),
      ),
      h(
        'div',
        { style: { display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' } },
        h('button', {
          class: 'btn btn--fantome',
          text: 'Forcer la synchronisation',
          onclick: async () => {
            await store.forcerEnvoi();
            toast('Progression envoyée.', 'succes');
            rafraichir();
          },
        }),
        h('button', {
          class: 'btn btn--danger',
          text: 'Se déconnecter',
          onclick: async () => {
            await store.forcerEnvoi();
            await supa.deconnexion();
            window.location.reload();
          },
        }),
      ),
    );
    return section;
  }

  // Mode local.
  section.append(
    h(
      'div',
      { class: 'bandeau bandeau--info', style: { margin: '0 0 16px' } },
      h('span', { class: 'bandeau__ico', text: '💾' }),
      h(
        'span',
        {},
        'Mode local : ta progression est enregistrée dans ce navigateur uniquement. Crée un compte pour la retrouver sur tous tes appareils.',
      ),
    ),
  );

  if (cfg) {
    section.append(
      h('button', {
        class: 'btn btn--principal',
        text: 'Créer un compte / se connecter',
        onclick: () => window.location.reload(),
      }),
      cfg.source === 'navigateur'
        ? h('button', {
            class: 'btn btn--fantome',
            style: { marginLeft: '10px' },
            text: 'Oublier ce projet Supabase',
            onclick: () => {
              effacerConfigLocale();
              window.location.reload();
            },
          })
        : null,
    );
    return section;
  }

  // Aucun projet relié : on propose le formulaire.
  const url = h('input', { type: 'text', placeholder: 'https://xxxx.supabase.co' });
  const cle = h('input', { type: 'text', placeholder: 'eyJhbGciOi…' });
  section.append(
    h('p', {
      style: { fontSize: '13.5px', color: 'var(--texte-2)', marginBottom: '14px' },
      html:
        'Pour activer les comptes, crée un projet sur supabase.com, exécute le script <code>supabase/schema.sql</code> ' +
        'dans l’éditeur SQL, puis colle ici l’URL et la clé publique <em>anon</em> (Project Settings → API).' +
        (SUPABASE_URL ? '' : ' Tu peux aussi les inscrire dans <code>js/config.js</code> pour toute personne qui ouvre le site.'),
    }),
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, url, cle),
    h('button', {
      class: 'btn btn--principal',
      style: { marginTop: '14px' },
      text: 'Relier ce projet',
      onclick: () => {
        if (!url.value.trim() || !cle.value.trim()) return toast('Renseigne l’URL et la clé.', 'erreur');
        enregistrerConfigLocale(url.value, cle.value);
        window.location.reload();
      },
    }),
  );
  return section;
}

/* ------------------------------------------------------------ contrôles */

function infoLigne(libelle, valeur) {
  return h(
    'div',
    { style: { display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '13.5px' } },
    h('span', { style: { color: 'var(--texte-2)' }, text: libelle }),
    h('span', { style: { fontWeight: '600', textAlign: 'right', wordBreak: 'break-all' }, text: String(valeur) }),
  );
}

function bascule({ libelle, aide, valeur, onchange }) {
  const bouton = h('button', {
    class: 'bascule',
    role: 'switch',
    'aria-checked': String(!!valeur),
    'aria-label': libelle,
    onclick: () => onchange(!valeur),
  });
  return h(
    'div',
    { class: 'interrupteur' },
    h('div', {}, h('div', { class: 'interrupteur__txt', text: libelle }), aide ? h('div', { class: 'interrupteur__aide', text: aide }) : null),
    bouton,
  );
}

function curseur({ libelle, aide, valeur, min, max, pas, suffixe = '', format, onchange }) {
  const affichage = h('span', {
    style: { fontSize: '13px', fontWeight: '700', color: 'var(--violet-clair)', fontVariantNumeric: 'tabular-nums' },
    text: format ? format(valeur) : `${valeur} ${suffixe}`.trim(),
  });
  const entree = h('input', {
    type: 'range',
    min: String(min),
    max: String(max),
    step: String(pas),
    value: String(valeur),
    oninput: (e) => {
      const v = Number(e.target.value);
      affichage.textContent = format ? format(v) : `${v} ${suffixe}`.trim();
    },
    onchange: (e) => onchange(Number(e.target.value)),
  });
  return h(
    'div',
    { class: 'interrupteur', style: { display: 'block' } },
    h(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' } },
      h('div', { class: 'interrupteur__txt', text: libelle }),
      affichage,
    ),
    aide ? h('div', { class: 'interrupteur__aide', style: { marginBottom: '10px' }, text: aide }) : null,
    entree,
  );
}

function champSelect({ libelle, aide, valeur, options, onchange }) {
  return h(
    'div',
    { class: 'interrupteur', style: { display: 'block' } },
    h('div', { class: 'interrupteur__txt', style: { marginBottom: aide ? '4px' : '10px' }, text: libelle }),
    aide ? h('div', { class: 'interrupteur__aide', style: { marginBottom: '10px' }, text: aide }) : null,
    h(
      'select',
      { onchange: (e) => onchange(e.target.value) },
      ...options.map(([v, lib]) => h('option', { value: v, selected: v === valeur }, lib)),
    ),
  );
}
