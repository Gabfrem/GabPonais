import { h, dureeCourte, pluriel, toast } from '../util.js';
import { WORDS, PALIERS, POS_LIST } from '../data/words.js';
import * as store from '../store.js';
import * as srs from '../srs.js';
import * as tts from '../tts.js';
import { ouvrirSession } from './session.js';
import { confirmer } from './composants.js';

const PAR_PAGE = 60;

// Conservé entre deux rendus pour ne pas perdre la recherche en cours.
const filtre = { texte: '', etat: 'tous', palier: 'tous', nature: 'toutes', page: 0 };

const ETATS = [
  { cle: 'tous', lib: 'Tous les états' },
  { cle: 'nouvelle', lib: 'À découvrir' },
  { cle: 'apprentissage', lib: 'En apprentissage' },
  { cle: 'revision', lib: 'En révision' },
  { cle: 'apprise', lib: 'Bien ancrés' },
  { cle: 'due', lib: 'À réviser maintenant' },
  { cle: 'coriace', lib: 'Coriaces' },
  { cle: 'suspendue', lib: 'En pause' },
];

function libelleEtat(c) {
  if (c.suspendue) return { txt: 'En pause', pt: 'suspendue' };
  if (c.etat === srs.ETAT.NOUVELLE) return { txt: 'À découvrir', pt: 'nouvelle' };
  if (srs.estApprise(c)) return { txt: 'Ancré', pt: 'apprise' };
  if (c.etat === srs.ETAT.REVISION) return { txt: 'Révision', pt: 'revision' };
  return { txt: 'Apprentissage', pt: 'apprentissage' };
}

function correspond(mot, carte, maintenant) {
  if (filtre.palier !== 'tous' && mot.palier !== Number(filtre.palier)) return false;
  if (filtre.nature !== 'toutes' && mot.pos !== filtre.nature) return false;

  switch (filtre.etat) {
    case 'nouvelle':
      if (carte.etat !== srs.ETAT.NOUVELLE || carte.suspendue) return false;
      break;
    case 'apprentissage':
      if (carte.suspendue || ![srs.ETAT.APPRENTISSAGE, srs.ETAT.REAPPRENTISSAGE].includes(carte.etat)) return false;
      break;
    case 'revision':
      if (carte.suspendue || carte.etat !== srs.ETAT.REVISION || srs.estApprise(carte)) return false;
      break;
    case 'apprise':
      if (carte.suspendue || !srs.estApprise(carte)) return false;
      break;
    case 'due':
      if (!srs.estDue(carte, maintenant)) return false;
      break;
    case 'coriace':
      if (!srs.estSangsue(carte)) return false;
      break;
    case 'suspendue':
      if (!carte.suspendue) return false;
      break;
  }

  const q = filtre.texte.trim().toLowerCase();
  if (!q) return true;
  return (
    mot.kana.includes(q) ||
    mot.kanji.includes(q) ||
    mot.romaji.toLowerCase().includes(q) ||
    mot.fr.toLowerCase().includes(q)
  );
}

export function vueVocabulaire(naviguer, rafraichir) {
  const maintenant = Date.now();
  const reglages = store.lire().reglages;

  const resultats = WORDS.map((mot) => ({ mot, carte: store.carte(mot.id) })).filter(({ mot, carte }) =>
    correspond(mot, carte, maintenant),
  );

  const pages = Math.max(1, Math.ceil(resultats.length / PAR_PAGE));
  filtre.page = Math.min(filtre.page, pages - 1);
  const tranche = resultats.slice(filtre.page * PAR_PAGE, (filtre.page + 1) * PAR_PAGE);

  const relancer = () => rafraichir();

  const outils = h(
    'div',
    { class: 'outils' },
    h('input', {
      type: 'text',
      placeholder: 'Rechercher : かな, romaji, français…',
      value: filtre.texte,
      oninput: (e) => {
        filtre.texte = e.target.value;
        filtre.page = 0;
        rafraichir({ focus: 'recherche', curseur: e.target.selectionStart });
      },
      'data-role': 'recherche',
    }),
    select(
      ETATS.map((e) => [e.cle, e.lib]),
      filtre.etat,
      (v) => {
        filtre.etat = v;
        filtre.page = 0;
        rafraichir();
      },
    ),
    select(
      [['tous', 'Tous les paliers'], ...PALIERS.map((p) => [String(p.n), `${p.n}. ${p.nom} (${p.from}–${p.to})`])],
      filtre.palier,
      (v) => {
        filtre.palier = v;
        filtre.page = 0;
        rafraichir();
      },
    ),
    select(
      [['toutes', 'Toutes natures'], ...POS_LIST.map((p) => [p, p])],
      filtre.nature,
      (v) => {
        filtre.nature = v;
        filtre.page = 0;
        rafraichir();
      },
    ),
    h('button', {
      class: 'btn btn--principal',
      text: `Étudier ces mots (${Math.min(resultats.length, 30)})`,
      disabled: resultats.length === 0,
      onclick: () =>
        ouvrirSession({
          ids: resultats.slice(0, 30).map((r) => r.mot.id),
          surFermeture: relancer,
        }),
    }),
  );

  const liste = h(
    'div',
    { class: 'liste' },
    h(
      'div',
      { class: 'ligne ligne--entete' },
      h('div', { text: 'N°' }),
      h('div', { text: 'Japonais' }),
      h('div', { text: 'Français' }),
      h('div', { text: 'État' }),
      h('div', { text: 'Échéance' }),
      h('div', {}),
    ),
    ...tranche.map(({ mot, carte }) => ligne(mot, carte, maintenant, reglages, relancer)),
  );

  return h(
    'div',
    {},
    h(
      'div',
      { class: 'entete' },
      h(
        'div',
        {},
        h('h1', { class: 'entete__titre', text: 'Vocabulaire' }),
        h('p', {
          class: 'entete__sous',
          text: `${pluriel(resultats.length, 'mot')} affiché${resultats.length > 1 ? 's' : ''} sur ${WORDS.length}.`,
        }),
      ),
    ),
    outils,
    resultats.length
      ? liste
      : h(
          'div',
          { class: 'vide' },
          h('div', { class: 'vide__ico', text: '🔍' }),
          h('div', { class: 'vide__titre', text: 'Aucun mot ne correspond' }),
          h('p', { text: 'Essaie d’élargir les filtres ou de modifier ta recherche.' }),
        ),
    pages > 1
      ? h(
          'div',
          { class: 'pagination' },
          h('button', {
            class: 'btn btn--fantome',
            text: '← Précédent',
            disabled: filtre.page === 0,
            onclick: () => {
              filtre.page -= 1;
              rafraichir({ haut: true });
            },
          }),
          h('span', { style: { fontSize: '13px', color: 'var(--texte-2)' }, text: `Page ${filtre.page + 1} / ${pages}` }),
          h('button', {
            class: 'btn btn--fantome',
            text: 'Suivant →',
            disabled: filtre.page >= pages - 1,
            onclick: () => {
              filtre.page += 1;
              rafraichir({ haut: true });
            },
          }),
        )
      : null,
  );
}

function select(options, valeur, surChangement) {
  return h(
    'select',
    { onchange: (e) => surChangement(e.target.value) },
    ...options.map(([v, lib]) => h('option', { value: v, selected: v === valeur }, lib)),
  );
}

function ligne(mot, carte, maintenant, reglages, rafraichir) {
  const et = libelleEtat(carte);
  const echeance =
    carte.etat === srs.ETAT.NOUVELLE || carte.suspendue
      ? '—'
      : new Date(carte.du).getTime() <= maintenant
        ? 'maintenant'
        : `dans ${dureeCourte(new Date(carte.du).getTime() - maintenant)}`;

  return h(
    'div',
    { class: 'ligne', onclick: (e) => !e.target.closest('button') && ouvrirDetail(mot, carte, rafraichir) },
    h('div', { class: 'ligne__rang', text: String(mot.rank) }),
    h(
      'div',
      {},
      h('div', { class: 'ligne__kana ja', text: mot.kana }),
      h('div', { class: 'ligne__romaji', text: mot.romaji }),
    ),
    h('div', { class: 'ligne__fr', text: mot.fr }),
    h('div', { class: 'ligne__etat' }, h('span', { class: `point point--${et.pt}` }), et.txt),
    h('div', { class: 'ligne__ech', text: echeance }),
    h('button', {
      class: 'ligne__son',
      text: '🔊',
      title: 'Écouter',
      onclick: (e) => {
        e.stopPropagation();
        tts.dire(mot.kana, { vitesse: reglages.vitesse, uri: reglages.voixUri });
      },
    }),
  );
}

function ouvrirDetail(mot, carte, rafraichir) {
  const reglages = store.lire().reglages;
  const et = libelleEtat(carte);

  const fond = h(
    'div',
    { class: 'modale', onclick: (e) => e.target === fond && fermer() },
    h(
      'div',
      { class: 'modale__boite', style: { textAlign: 'center' } },
      h('p', { class: 'fiche__kana ja', style: { fontSize: '44px' }, text: mot.kana }),
      h('p', { class: 'fiche__romaji', text: mot.romaji }),
      mot.kanji !== mot.kana ? h('p', { class: 'fiche__kanji ja', text: `écriture : ${mot.kanji}` }) : null,
      h('div', { class: 'fiche__sep' }),
      h('p', { style: { fontSize: '21px', fontWeight: '650' }, text: mot.fr }),
      h(
        'div',
        { class: 'fiche__meta' },
        h('span', { class: 'puce', text: mot.pos }),
        h('span', { class: 'puce', text: `n° ${mot.rank}` }),
        h('span', { class: 'puce' }, h('span', { class: `point point--${et.pt}` }), et.txt),
      ),
      h(
        'div',
        { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '22px 0 4px' } },
        mini(carte.reps, 'révisions'),
        mini(carte.oublis, 'oublis'),
        mini(carte.intervalle ? `${carte.intervalle} j` : '—', 'intervalle'),
      ),
      h(
        'div',
        { class: 'modale__actions', style: { flexWrap: 'wrap', justifyContent: 'center' } },
        h('button', {
          class: 'btn btn--fantome',
          text: '🔊 Écouter',
          onclick: () => tts.dire(mot.kana, { vitesse: reglages.vitesse, uri: reglages.voixUri }),
        }),
        h('button', {
          class: 'btn btn--fantome',
          text: carte.suspendue ? 'Reprendre' : 'Mettre en pause',
          onclick: () => {
            store.suspendre(mot.id, !carte.suspendue);
            toast(carte.suspendue ? 'Mot réactivé.' : 'Mot mis en pause.', 'succes');
            fermer();
            rafraichir();
          },
        }),
        carte.etat !== srs.ETAT.NOUVELLE &&
          h('button', {
            class: 'btn btn--danger',
            text: 'Réinitialiser',
            onclick: async () => {
              if (
                await confirmer({
                  titre: 'Réinitialiser ce mot ?',
                  texte: 'Son historique de révision sera effacé et il redeviendra un mot à découvrir.',
                  valider: 'Réinitialiser',
                  danger: true,
                })
              ) {
                store.remettreAZeroCarte(mot.id);
                toast('Mot réinitialisé.', 'succes');
                fermer();
                rafraichir();
              }
            },
          }),
        h('button', { class: 'btn btn--principal', text: 'Fermer', onclick: () => fermer() }),
      ),
    ),
  );

  function fermer() {
    document.removeEventListener('keydown', surTouche);
    fond.remove();
  }
  function surTouche(e) {
    if (e.key === 'Escape') fermer();
  }

  document.body.append(fond);
  document.addEventListener('keydown', surTouche);
  tts.dire(mot.kana, { vitesse: reglages.vitesse, uri: reglages.voixUri });
}

function mini(valeur, libelle) {
  return h(
    'div',
    { class: 'bilan__case' },
    h('div', { style: { fontSize: '19px', fontWeight: '700' }, text: String(valeur) }),
    h('div', { class: 'bilan__lib', text: libelle }),
  );
}
