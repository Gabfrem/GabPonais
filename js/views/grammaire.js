/**
 * Cours de grammaire.
 *
 * Le vocabulaire seul ne donne pas la compréhension : sans les particules ni
 * les formes verbales, une phrase reste une suite de mots isolés. Cette section
 * se parcourt dans l'ordre, chaque leçon se terminant par deux questions qui
 * vérifient que le point est compris — pas seulement lu.
 */
import { h, pct, pluriel } from '../util.js';
import LECONS from '../data/grammaire.js';
import * as store from '../store.js';
import * as tts from '../tts.js';

export function vueGrammaire(naviguer, rafraichir) {
  const faites = new Set(store.lire().reglages.grammaireFaite ?? []);
  const premiereNonFaite = LECONS.findIndex((l) => !faites.has(l.id));

  return h(
    'div',
    { class: 'vue' },
    h(
      'div',
      { class: 'entete' },
      h(
        'div',
        {},
        h('h1', { class: 'entete__titre', text: 'Grammaire' }),
        h('p', {
          class: 'entete__sous',
          text: 'Les vingt-deux points qui transforment une suite de mots en phrase compréhensible.',
        }),
      ),
    ),

    h(
      'section',
      { class: 'carte' },
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' } },
        h('h3', { style: { fontSize: '16px' }, text: 'Progression' }),
        h('span', {
          style: { fontSize: '13px', color: 'var(--texte-2)' },
          text: `${faites.size} / ${LECONS.length} leçons validées`,
        }),
      ),
      h(
        'div',
        { class: 'barre' },
        h('div', { class: 'barre__part', style: { width: `${pct(faites.size, LECONS.length)}%` } }),
      ),
      premiereNonFaite >= 0
        ? h('button', {
            class: 'btn btn--principal',
            style: { marginTop: '16px' },
            text: faites.size ? `Reprendre : ${LECONS[premiereNonFaite].titre}` : 'Commencer la première leçon',
            onclick: () => ouvrirLecon(premiereNonFaite, rafraichir),
          })
        : h('p', {
            style: { fontSize: '13.5px', color: 'var(--menthe)', marginTop: '14px' },
            text: 'Tout est validé. Relis une leçon quand un doute revient — c’est normal, ces points se consolident à l’usage.',
          }),
    ),

    h(
      'section',
      { class: 'lecons', style: { marginTop: '16px' } },
      ...LECONS.map((lecon, i) => {
        const fait = faites.has(lecon.id);
        return h(
          'button',
          { class: `lecon ${fait ? 'lecon--faite' : ''}`, onclick: () => ouvrirLecon(i, rafraichir) },
          h('span', { class: `lecon__n ${fait ? 'lecon__n--faite' : ''}`, text: fait ? '✓' : String(i + 1) }),
          h(
            'span',
            { class: 'lecon__txt' },
            h('span', { class: 'lecon__titre ja', text: lecon.titre }),
            h('span', { class: 'lecon__resume', text: lecon.resume }),
          ),
          h('span', { class: 'lecon__fleche', text: '→' }),
        );
      }),
    ),
  );
}

/* ------------------------------------------------------------- la leçon */

function ouvrirLecon(index, rafraichir) {
  const reglages = store.lire().reglages;
  const racine = h('div', { class: 'session' });
  document.body.append(racine);
  document.body.style.overflow = 'hidden';

  let vue = 'cours'; // 'cours' | 'quiz' | 'bilan'
  let question = 0;
  let repondu = false;
  let justes = 0;

  function fermer() {
    document.removeEventListener('keydown', surTouche);
    tts.stop();
    document.body.style.overflow = '';
    racine.remove();
    rafraichir();
  }

  function lecon() {
    return LECONS[index];
  }

  function entete() {
    const l = lecon();
    return h(
      'div',
      { class: 'session__haut' },
      h('button', { class: 'btn btn--fantome btn--rond', text: '✕', title: 'Fermer (Échap)', onclick: fermer }),
      h('span', { class: 'session__cnt', style: { fontWeight: '650' }, text: `Leçon ${index + 1} / ${LECONS.length}` }),
      h(
        'div',
        { class: 'session__jauge' },
        h('span', { style: { width: vue === 'cours' ? '33%' : vue === 'quiz' ? '66%' : '100%' } }),
      ),
      h('span', { class: 'session__cnt ja', text: l.titre.split(' — ')[0] }),
    );
  }

  /* ---------------------------------------------------------- le cours */

  function rendreCours() {
    const l = lecon();
    racine.replaceChildren(
      entete(),
      h(
        'div',
        { class: 'session__corps', style: { alignItems: 'flex-start' } },
        h(
          'article',
          { class: 'cours' },
          h('h2', { class: 'cours__titre ja', text: l.titre }),
          h('p', { class: 'cours__resume', text: l.resume }),
          ...l.points.map((p) => h('p', { class: 'cours__point ja', text: p })),
          h('h3', { class: 'cours__soustitre', text: 'Exemples' }),
          ...l.exemples.map(([kanji, kana, romaji, fr]) =>
            h(
              'div',
              { class: 'exemple' },
              h(
                'div',
                { class: 'exemple__haut' },
                h('span', { class: 'exemple__ja ja', text: kanji }),
                h('button', {
                  class: 'ligne__son',
                  text: '🔊',
                  title: 'Écouter',
                  onclick: () => tts.dire(kana, { vitesse: reglages.vitesse, uri: reglages.voixUri }),
                }),
              ),
              h('div', { class: 'exemple__kana ja', text: kana }),
              h('div', { class: 'exemple__romaji', text: romaji }),
              h('div', { class: 'exemple__fr', text: fr }),
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'session__bas' },
        h(
          'div',
          { style: { display: 'flex', gap: '10px', maxWidth: '680px', margin: '0 auto' } },
          index > 0 &&
            h('button', {
              class: 'btn',
              text: '← Précédente',
              onclick: () => {
                index -= 1;
                vue = 'cours';
                rendre();
              },
            }),
          h('button', {
            class: 'btn btn--principal btn--grand',
            style: { flex: '1' },
            text: 'Passer aux questions',
            onclick: () => {
              vue = 'quiz';
              question = 0;
              justes = 0;
              repondu = false;
              rendre();
            },
          }),
        ),
      ),
    );
  }

  /* ----------------------------------------------------------- le quiz */

  function rendreQuiz() {
    const l = lecon();
    const q = l.quiz[question];

    racine.replaceChildren(
      entete(),
      h(
        'div',
        { class: 'session__corps' },
        h(
          'div',
          { class: 'fiche fiche--question' },
          h('p', { class: 'fiche__consigne', text: `Question ${question + 1} sur ${l.quiz.length}` }),
          h('p', { class: 'quiz__enonce ja', text: q.enonce }),
          h(
            'div',
            { class: 'options options--longues' },
            ...q.options.map((opt, i) =>
              h('button', {
                class: 'option ja',
                'data-i': String(i),
                text: opt,
                onclick: () => repondreQuiz(i),
              }),
            ),
          ),
          h('div', { id: 'explication' }),
        ),
      ),
      h('div', { class: 'session__bas', id: 'bas-quiz' }),
    );
  }

  function repondreQuiz(choisi) {
    if (repondu) return;
    repondu = true;
    const l = lecon();
    const q = l.quiz[question];
    const juste = choisi === q.bonne;
    if (juste) justes += 1;

    for (const bouton of racine.querySelectorAll('.option')) {
      const i = Number(bouton.dataset.i);
      if (i === q.bonne) bouton.classList.add('option--juste');
      else if (i === choisi) bouton.classList.add('option--faux');
      bouton.disabled = true;
    }

    racine.querySelector('#explication')?.replaceChildren(
      h(
        'div',
        { class: `explication ${juste ? 'explication--juste' : 'explication--faux'}` },
        h('strong', { text: juste ? '✓ Exact. ' : '✗ Pas tout à fait. ' }),
        q.explication,
      ),
    );

    racine.querySelector('#bas-quiz')?.replaceChildren(
      h('button', {
        class: 'btn btn--principal btn--grand btn--bloc',
        style: { maxWidth: '680px', margin: '0 auto' },
        text: question + 1 < l.quiz.length ? 'Question suivante' : 'Terminer la leçon',
        onclick: () => {
          if (question + 1 < l.quiz.length) {
            question += 1;
            repondu = false;
            rendre();
          } else {
            vue = 'bilan';
            rendre();
          }
        },
      }),
    );
  }

  /* ---------------------------------------------------------- le bilan */

  function rendreBilan() {
    const l = lecon();
    const reussi = justes === l.quiz.length;
    if (reussi) {
      const faites = new Set(store.lire().reglages.grammaireFaite ?? []);
      faites.add(l.id);
      store.majReglages({ grammaireFaite: [...faites] });
    }
    const suivante = index + 1 < LECONS.length ? LECONS[index + 1] : null;

    racine.replaceChildren(
      h(
        'div',
        { class: 'session__corps' },
        h(
          'div',
          { class: 'bilan' },
          h('div', { class: 'bilan__ico', text: reussi ? '✅' : '📖' }),
          h('h2', {
            style: { fontSize: '25px' },
            text: reussi ? 'Leçon validée' : 'À revoir tranquillement',
          }),
          h('p', {
            style: { color: 'var(--texte-2)', marginTop: '10px', lineHeight: '1.7' },
            text: reussi
              ? 'Ce point est acquis. Il reviendra tout seul dans les phrases : c’est là qu’il s’ancrera vraiment.'
              : `${justes} bonne${justes > 1 ? 's' : ''} réponse${justes > 1 ? 's' : ''} sur ${l.quiz.length}. Relis la leçon puis refais les questions — ces points demandent souvent deux passages.`,
          }),
          h(
            'div',
            { style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' } },
            h('button', {
              class: reussi ? 'btn btn--grand' : 'btn btn--principal btn--grand',
              text: 'Relire la leçon',
              onclick: () => {
                vue = 'cours';
                rendre();
              },
            }),
            reussi && suivante
              ? h('button', {
                  class: 'btn btn--principal btn--grand',
                  text: 'Leçon suivante',
                  onclick: () => {
                    index += 1;
                    vue = 'cours';
                    rendre();
                  },
                })
              : null,
            h('button', { class: 'btn btn--grand', text: 'Fermer', onclick: fermer }),
          ),
        ),
      ),
    );
  }

  function rendre() {
    if (vue === 'cours') return rendreCours();
    if (vue === 'quiz') return rendreQuiz();
    return rendreBilan();
  }

  function surTouche(e) {
    if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
    if (e.key === 'Escape') return fermer();
    if (vue === 'quiz' && !repondu && ['1', '2', '3', '4'].includes(e.key)) {
      racine.querySelectorAll('.option')[Number(e.key) - 1]?.click();
    }
  }

  document.addEventListener('keydown', surTouche);
  rendre();
  return racine;
}
