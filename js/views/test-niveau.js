/**
 * Test de niveau initial.
 *
 * Objectif : ne pas repartir de zéro quand on a déjà des connaissances.
 * Le test mesure une seule chose — connaît-on le sens de ce mot ? — et affiche
 * donc le kanji, les kana et la prononciation en même temps. C'est volontaire :
 * quelqu'un qui a travaillé les kanji sans jamais écouter, ou l'inverse, doit
 * pouvoir se situer honnêtement.
 *
 * Les mots reconnus sont ensuite programmés à courte échéance et étalés sur
 * plusieurs jours, jamais marqués comme acquis : la reconnaissance à l'oreille
 * reste à vérifier, et une vague de centaines de cartes le même jour serait
 * exactement le piège qu'on cherche à éviter.
 */
import { h, $, pluriel } from '../util.js';
import { WORDS, PALIERS } from '../data/words.js';
import * as store from '../store.js';
import * as tts from '../tts.js';
import { melanger } from '../srs.js';

const PAR_PALIER = 4; // questions tirées dans chaque tranche de 100 mots
const PALIERS_RATES_AVANT_ARRET = 2;
const SEUIL_PALIER_ACQUIS = 3; // sur PAR_PALIER : le palier entier est validé
const SEUIL_PALIER_PARTIEL = 2; // en dessous : rien n'est validé

export function ouvrirTestNiveau({ surFermeture = () => {} } = {}) {
  const reglages = store.lire().reglages;
  const racine = h('div', { class: 'session' });
  document.body.append(racine);
  document.body.style.overflow = 'hidden';

  // Tirage : PAR_PALIER mots au hasard dans chacune des dix tranches.
  const questionsParPalier = PALIERS.map((p) =>
    melanger(WORDS.filter((w) => w.palier === p.n)).slice(0, PAR_PALIER),
  );

  let palier = 0; // index de la tranche en cours
  let indexDansPalier = 0;
  let paliersRatesDAffilee = 0;
  const resultats = PALIERS.map(() => ({ justes: [], total: 0 }));
  let termine = false;

  function fermer() {
    document.removeEventListener('keydown', surTouche);
    tts.stop();
    document.body.style.overflow = '';
    racine.remove();
    surFermeture();
  }

  /* ------------------------------------------------------------ intro */

  function intro() {
    racine.replaceChildren(
      h(
        'div',
        { class: 'session__corps' },
        h(
          'div',
          { class: 'bilan', style: { maxWidth: '620px' } },
          h('div', { class: 'bilan__ico', text: '🧭' }),
          h('h2', { style: { fontSize: '27px' }, text: 'Où en es-tu déjà ?' }),
          h('p', {
            style: { color: 'var(--texte-2)', marginTop: '12px', lineHeight: '1.7' },
            text:
              'Quelques mots tirés dans chaque tranche de fréquence, du plus courant au plus rare. ' +
              'Le test s’arrête de lui-même dès que les mots deviennent trop rares pour toi — compte deux à cinq minutes.',
          }),
          h(
            'ul',
            { class: 'conseils', style: { textAlign: 'left', marginTop: '20px' } },
            h('li', {}, 'Le kanji, les kana et la prononciation sont affichés : on teste seulement le sens.'),
            h('li', {}, h('strong', {}, 'Réponds « Je ne sais pas » sans hésiter. '), 'Deviner fausserait le résultat et te chargerait de mots que tu ne connais pas.'),
            h('li', {}, 'Les mots reconnus seront programmés en révision sur les jours qui viennent, pas marqués comme acquis.'),
          ),
          h(
            'div',
            { style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '26px' } },
            h('button', { class: 'btn btn--principal btn--grand', text: 'Commencer le test', onclick: question }),
            h('button', {
              class: 'btn btn--grand',
              text: 'Je débute, passer',
              onclick: () => {
                store.majReglages({ testNiveauFait: true });
                fermer();
              },
            }),
          ),
        ),
      ),
    );
  }

  /* --------------------------------------------------------- questions */

  function motCourant() {
    return questionsParPalier[palier]?.[indexDansPalier] ?? null;
  }

  function propositions(mot) {
    // Des leurres proches en fréquence : un test crédible ne se gagne pas
    // en éliminant des sens absurdes.
    const voisins = WORDS.filter(
      (w) => w.id !== mot.id && Math.abs(w.rank - mot.rank) <= 220 && w.fr !== mot.fr,
    );
    const source = voisins.length >= 3 ? voisins : WORDS.filter((w) => w.id !== mot.id);
    const leurres = melanger([...source])
      .filter((w, i, arr) => arr.findIndex((x) => x.fr === w.fr) === i)
      .slice(0, 3);
    return melanger([mot, ...leurres]);
  }

  function question() {
    const mot = motCourant();
    if (!mot) return resultat();

    const faites = resultats.slice(0, palier).reduce((s, r) => s + r.total, 0) + indexDansPalier;
    const estimation = faites + (PALIERS.length - palier) * PAR_PALIER;

    racine.replaceChildren(
      h(
        'div',
        { class: 'session__haut' },
        h('button', { class: 'btn btn--fantome btn--rond', text: '✕', title: 'Quitter (Échap)', onclick: fermer }),
        h('span', { class: 'session__cnt', style: { fontWeight: '650' }, text: '🧭 Test de niveau' }),
        h('div', { class: 'session__jauge' }, h('span', { style: { width: `${(faites / estimation) * 100}%` } })),
        h('span', { class: 'session__cnt', text: `tranche ${palier + 1} / ${PALIERS.length}` }),
      ),
      h(
        'div',
        { class: 'session__corps' },
        h(
          'div',
          { class: 'fiche fiche--question' },
          h('p', { class: 'fiche__consigne', text: 'Connais-tu le sens de ce mot ?' }),
          h('p', { class: 'fiche__kana ja', text: mot.kanji }),
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' } },
            h('p', { class: 'fiche__romaji ja', text: mot.kana }),
            h('button', { class: 'btn btn--fantome btn--rond', text: '🔊', title: 'Écouter (R)', onclick: jouer }),
          ),
          h('p', { class: 'fiche__romaji', style: { fontSize: '14px' }, text: mot.romaji }),
          h(
            'div',
            { class: 'options' },
            ...propositions(mot).map((m) =>
              h('button', { class: 'option', 'data-id': String(m.id), text: m.fr, onclick: () => repondre(mot, m.id) }),
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'session__bas' },
        h('button', {
          class: 'btn btn--fantome btn--bloc',
          style: { maxWidth: '680px', margin: '0 auto' },
          text: 'Je ne sais pas',
          onclick: () => repondre(mot, null),
        }),
      ),
    );
  }

  async function jouer() {
    const mot = motCourant();
    if (mot) await tts.dire(mot.kana, { vitesse: reglages.vitesse, uri: reglages.voixUri });
  }

  function repondre(mot, idChoisi) {
    tts.stop();
    const r = resultats[palier];
    r.total += 1;
    if (idChoisi === mot.id) r.justes.push(mot.id);

    indexDansPalier += 1;
    if (indexDansPalier < questionsParPalier[palier].length) return question();

    // Tranche terminée : on décide si l'on continue vers des mots plus rares.
    const rate = r.justes.length < SEUIL_PALIER_PARTIEL;
    paliersRatesDAffilee = rate ? paliersRatesDAffilee + 1 : 0;

    palier += 1;
    indexDansPalier = 0;

    if (paliersRatesDAffilee >= PALIERS_RATES_AVANT_ARRET || palier >= PALIERS.length) return resultat();
    question();
  }

  /* ---------------------------------------------------------- résultat */

  /** Mots à considérer comme déjà rencontrés, d'après les tranches réussies. */
  function motsReconnus() {
    const ids = new Set();
    for (let i = 0; i < resultats.length; i++) {
      const r = resultats[i];
      if (!r.total) continue;
      if (r.justes.length >= SEUIL_PALIER_ACQUIS) {
        // Tranche maîtrisée : on l'accorde en entier.
        for (const w of WORDS) if (w.palier === PALIERS[i].n) ids.add(w.id);
      } else if (r.justes.length >= SEUIL_PALIER_PARTIEL) {
        // Connaissances partielles : seuls les mots effectivement reconnus.
        for (const id of r.justes) ids.add(id);
      }
    }
    return [...ids].sort((a, b) => a - b);
  }

  function resultat() {
    termine = true;
    tts.stop();
    const ids = motsReconnus();
    const derniereTranche = resultats.filter((r) => r.total && r.justes.length >= SEUIL_PALIER_ACQUIS).length;
    const etalement = store.etalementEstime(ids.length);

    racine.replaceChildren(
      h(
        'div',
        { class: 'session__corps' },
        h(
          'div',
          { class: 'bilan', style: { maxWidth: '640px' } },
          h('div', { class: 'bilan__ico', text: ids.length ? '🎓' : '🌱' }),
          h('h2', {
            style: { fontSize: '27px' },
            text: ids.length ? 'Tu pars avec de l’avance' : 'On commence par le début',
          }),
          h(
            'div',
            { class: 'bilan__grille', style: { gridTemplateColumns: 'repeat(3, 1fr)' } },
            caseB(ids.length, 'mots déjà connus'),
            caseB(`${derniereTranche} / ${PALIERS.length}`, 'tranches maîtrisées'),
            caseB(etalement.jours, etalement.jours > 1 ? 'jours d’étalement' : 'jour d’étalement'),
          ),
          h('div', { class: 'detail-test' }, ...resultats.map((r, i) => ligneTranche(r, i))),
          h('p', {
            style: { color: 'var(--texte-2)', fontSize: '13.5px', lineHeight: '1.7', margin: '20px 0' },
            text: ids.length
              ? `Ces ${pluriel(ids.length, 'mot')} seront répartis sur ${pluriel(etalement.jours, 'jour')}, à raison d’environ ${etalement.parJour} par jour, pour ne pas créer de vague de révisions. ` +
                'Ils ne sont pas marqués comme acquis : reconnaître un mot à l’oreille est une autre compétence, et ceux qui résistent repasseront naturellement en apprentissage.'
              : 'Aucune tranche n’atteint le seuil : tu démarres avec les mots les plus courants, ce qui est le meilleur point de départ.',
          }),
          h(
            'div',
            { style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } },
            ids.length
              ? h('button', {
                  class: 'btn btn--principal btn--grand',
                  text: 'Appliquer ce niveau',
                  onclick: () => {
                    store.appliquerNiveau(ids);
                    fermer();
                  },
                })
              : h('button', {
                  class: 'btn btn--principal btn--grand',
                  text: 'Commencer',
                  onclick: () => {
                    store.majReglages({ testNiveauFait: true });
                    fermer();
                  },
                }),
            h('button', {
              class: 'btn btn--grand',
              text: 'Refaire le test',
              onclick: () => {
                palier = 0;
                indexDansPalier = 0;
                paliersRatesDAffilee = 0;
                termine = false;
                for (const r of resultats) {
                  r.justes = [];
                  r.total = 0;
                }
                question();
              },
            }),
          ),
        ),
      ),
    );
  }

  function ligneTranche(r, i) {
    const p = PALIERS[i];
    const etat = !r.total
      ? { txt: 'non testée', classe: '' }
      : r.justes.length >= SEUIL_PALIER_ACQUIS
        ? { txt: 'acquise', classe: 'puce--menthe' }
        : r.justes.length >= SEUIL_PALIER_PARTIEL
          ? { txt: 'partielle', classe: 'puce--ambre' }
          : { txt: 'à apprendre', classe: '' };
    return h(
      'div',
      { class: 'detail-test__ligne' },
      h('span', { class: 'detail-test__nom', text: `${p.n}. ${p.nom}` }),
      h('span', { class: 'detail-test__score', text: r.total ? `${r.justes.length} / ${r.total}` : '—' }),
      h('span', { class: `puce ${etat.classe}`, text: etat.txt }),
    );
  }

  function caseB(valeur, libelle) {
    return h(
      'div',
      { class: 'bilan__case' },
      h('div', { class: 'bilan__val', text: String(valeur) }),
      h('div', { class: 'bilan__lib', text: libelle }),
    );
  }

  /* ----------------------------------------------------------- clavier */

  function surTouche(e) {
    if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
    if (e.key === 'Escape') return fermer();
    if (termine) return;
    if (e.key === 'r' || e.key === 'R') return jouer();
    if (['1', '2', '3', '4'].includes(e.key)) {
      racine.querySelectorAll('.option')[Number(e.key) - 1]?.click();
    }
  }

  document.addEventListener('keydown', surTouche);
  intro();
  return racine;
}
