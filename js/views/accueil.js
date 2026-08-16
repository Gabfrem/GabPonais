import { h, pct, pluriel } from '../util.js';
import { PALIERS, TOTAL_WORDS, BY_ID } from '../data/words.js';
import * as store from '../store.js';
import * as tts from '../tts.js';
import { ouvrirSession } from './session.js';
import { anneau } from './composants.js';

export function vueAccueil(naviguer, rafraichir) {
  const etat = store.lire();
  const c = store.compteurs();
  const jour = store.statsDuJour();
  const serie = store.serie();
  const ret = store.retention(30);
  const pseudo = etat.utilisateur?.pseudo ?? null;

  const heure = new Date().getHours();
  const salut =
    heure < 5 ? 'Bonne nuit' : heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

  const message = c.aFaire
    ? `${pluriel(c.aFaire, 'carte')} t’attendent — dont ${pluriel(c.nouvellesRestantes, 'nouveau mot', 'nouveaux mots')}.`
    : jour.revisionsFaites
      ? 'Tout est à jour pour aujourd’hui. Tu peux réviser en avance ou t’arrêter là.'
      : 'Rien de dû pour l’instant. Lance une séance libre pour prendre de l’avance.';

  const lancer = (opts = {}) => ouvrirSession({ ...opts, surFermeture: rafraichir });

  return h(
    'div',
    {},
    tts.manqueVoixJa()
      ? h(
          'div',
          { class: 'bandeau' },
          h('span', { class: 'bandeau__ico', text: '🔇' }),
          h(
            'span',
            {},
            'Aucune voix japonaise n’est installée sur cet appareil : la prononciation ne sera pas lue. ',
            'Sous Windows : Paramètres → Heure et langue → Langue → Ajouter « 日本語 » avec le module de synthèse vocale.',
          ),
        )
      : null,
    etat.synchro === 'hors-ligne'
      ? h(
          'div',
          { class: 'bandeau' },
          h('span', { class: 'bandeau__ico', text: '📡' }),
          h('span', {}, 'Synchronisation en attente : ta progression est enregistrée localement et sera envoyée dès le retour du réseau.'),
        )
      : null,

    /* --------------------------------------------------------- bandeau */
    h(
      'section',
      { class: 'heros' },
      h(
        'div',
        { class: 'heros__txt' },
        h('p', { class: 'heros__salut', text: pseudo ? `${salut}, ${pseudo}` : salut }),
        h('p', { class: 'heros__msg', text: message }),
        h(
          'div',
          { class: 'heros__actions' },
          h('button', {
            class: 'btn btn--principal btn--grand',
            text: c.aFaire ? `Étudier ${c.aFaire} cartes` : 'Réviser en avance',
            onclick: () => (c.aFaire ? lancer() : lancer({ ids: idsAvance(20) })),
          }),
          h('button', {
            class: 'btn btn--grand',
            text: 'Séance éclair (10)',
            onclick: () => lancer({ ids: idsSeanceEclair(10) }),
          }),
        ),
      ),
      anneau({
        pourcentage: Math.min(100, pct(jour.revisionsFaites, jour.objectif)),
        valeur: `${jour.revisionsFaites}`,
        libelle: `sur ${jour.objectif} aujourd’hui`,
      }),
    ),

    /* ------------------------------------------------------- indicateurs */
    h(
      'section',
      { class: 'grille grille--4', style: { marginTop: '16px' } },
      tuile('🔥', serie ? `${serie}` : '0', serie >= 2 ? 'jours d’affilée' : 'jour d’affilée', 'ambre'),
      tuile('📚', `${c.vues}`, `mots rencontrés sur ${TOTAL_WORDS}`, 'violet'),
      tuile('🌱', `${c.apprises}`, 'mots bien ancrés', 'menthe'),
      tuile('🎯', ret.taux === null ? '—' : `${ret.taux} %`, 'réussite sur 30 jours', 'sakura'),
    ),

    /* --------------------------------------------------------- avancée */
    h(
      'section',
      { class: 'carte', style: { marginTop: '16px' } },
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' } },
        h('h3', { style: { fontSize: '16px' }, text: 'Progression générale' }),
        h('span', {
          style: { fontSize: '13px', color: 'var(--texte-2)' },
          text: `${c.vues} / ${TOTAL_WORDS} · ${pct(c.vues, TOTAL_WORDS)} %`,
        }),
      ),
      h('div', { class: 'barre' }, h('div', { class: 'barre__part', style: { width: `${pct(c.vues, TOTAL_WORDS)}%` } })),
      h(
        'div',
        { class: 'legende' },
        legende('var(--menthe)', `${c.apprises} ancrés`),
        legende('var(--violet)', `${c.enCours} en cours`),
        legende('var(--texte-3)', `${c.nouvelles} à découvrir`),
        c.suspendues ? legende('var(--rouge)', `${c.suspendues} en pause`) : null,
      ),
    ),

    /* --------------------------------------------------- paliers & file */
    h(
      'section',
      { class: 'grille grille--2', style: { marginTop: '16px' } },
      h(
        'div',
        { class: 'carte' },
        h('h3', { class: 'carte__titre', text: 'Paliers de 100 mots' }),
        h(
          'div',
          { class: 'paliers' },
          ...PALIERS.map((p) => {
            const stats = store.progressionParPalier().get(p.n) ?? { total: 100, vues: 0, apprises: 0 };
            const part = pct(stats.vues, stats.total);
            return h(
              'div',
              { class: 'palier' },
              h('div', { class: `palier__n ${part === 100 ? 'palier__n--fini' : ''}`, text: String(p.n) }),
              h(
                'div',
                {},
                h('div', { class: 'palier__nom', text: p.nom }),
                h('div', { class: 'barre' }, h('div', { class: 'barre__part', style: { width: `${part}%` } })),
              ),
              h('div', { class: 'palier__cnt', text: `${stats.vues}/${stats.total}` }),
            );
          }),
        ),
      ),
      h(
        'div',
        { class: 'carte' },
        h('h3', { class: 'carte__titre', text: 'File du jour' }),
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
          ligneFile('🆕', 'Nouveaux mots', c.nouvellesRestantes, 'sakura'),
          ligneFile('⏳', 'En apprentissage', c.apprentissage, 'ambre'),
          ligneFile('🔁', 'Révisions dues', Math.max(0, c.dues - c.apprentissage), 'violet'),
        ),
        h('div', { style: { height: '1px', background: 'var(--bord)', margin: '18px 0' } }),
        h('h3', { class: 'carte__titre', text: 'Mots coriaces' }),
        coriaces(lancer),
      ),
    ),
  );
}

function tuile(ico, valeur, libelle, couleur) {
  return h(
    'div',
    { class: 'carte' },
    h(
      'div',
      { class: 'tuile-nb' },
      h('div', { class: `tuile-nb__ico tuile-nb__ico--${couleur}`, text: ico }),
      h('div', { class: 'stat' }, h('div', { class: 'stat__val', text: valeur }), h('div', { class: 'stat__lib', text: libelle })),
    ),
  );
}

function ligneFile(ico, libelle, n, couleur) {
  return h(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
    h('div', { class: `tuile-nb__ico tuile-nb__ico--${couleur}`, style: { width: '34px', height: '34px', fontSize: '15px' }, text: ico }),
    h('div', { style: { flex: '1', fontSize: '14px' }, text: libelle }),
    h('div', { style: { fontSize: '18px', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }, text: String(n) }),
  );
}

function legende(couleur, texte) {
  return h(
    'div',
    { class: 'legende__item' },
    h('span', { class: 'legende__pastille', style: { background: couleur } }),
    texte,
  );
}

function coriaces(lancer) {
  const liste = store.sangsues().slice(0, 5);
  if (!liste.length) {
    return h('p', { style: { fontSize: '13.5px', color: 'var(--texte-3)' }, text: 'Aucun mot ne te résiste pour l’instant. 👌' });
  }
  return h(
    'div',
    {},
    h(
      'div',
      { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' } },
      ...liste.map((c) => {
        const m = BY_ID.get(c.word_id);
        return h('span', { class: 'puce puce--sakura ja', title: `${m.fr} — ${c.oublis} oublis`, text: m.kana });
      }),
    ),
    h('button', {
      class: 'btn btn--fantome',
      text: 'Travailler ces mots',
      onclick: () => lancer({ ids: store.sangsues().slice(0, 15).map((c) => c.word_id) }),
    }),
  );
}

/** Mots à réviser en avance : les échéances les plus proches. */
function idsAvance(n) {
  return store
    .toutesCartes()
    .filter((c) => !c.suspendue && c.etat !== 0)
    .sort((a, b) => new Date(a.du) - new Date(b.du))
    .slice(0, n)
    .map((c) => c.word_id);
}

/** Dix cartes : ce qui est dû en priorité, complété par des nouveautés. */
function idsSeanceEclair(n) {
  const maintenant = Date.now();
  const dues = store
    .toutesCartes()
    .filter((c) => !c.suspendue && c.etat !== 0 && new Date(c.du).getTime() <= maintenant)
    .sort((a, b) => new Date(a.du) - new Date(b.du));
  const restant = n - dues.length;
  const nouvelles =
    restant > 0
      ? store
          .toutesCartes()
          .filter((c) => !c.suspendue && c.etat === 0)
          .sort((a, b) => a.word_id - b.word_id)
          .slice(0, restant)
      : [];
  return [...dues.slice(0, n), ...nouvelles].map((c) => c.word_id);
}
