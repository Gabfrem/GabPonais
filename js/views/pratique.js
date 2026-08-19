/**
 * Page « Pratique » : mettre en usage ce qui a été appris.
 *
 * Contrairement aux sessions de révision, rien ici n'alimente la répétition
 * espacée. C'est délibéré : s'entraîner ne doit jamais alourdir la dette de
 * révision du lendemain, sans quoi on renonce à s'entraîner.
 */
import { h, $, pct, pluriel, nombreAnime } from '../util.js';
import { WORDS, BY_ID } from '../data/words.js';
import { disponibles, prochaineADebloquer, TOTAL_PHRASES } from '../phrases.js';
import * as store from '../store.js';
import * as srs from '../srs.js';
import * as tts from '../tts.js';
import { melanger } from '../srs.js';

const QUESTIONS_TIR = 20;
const QUESTIONS_PHRASES = 10;
const SECONDES_TIR = 6;

const estConnu = (id) => {
  const c = store.carte(id);
  return !!c && c.etat !== srs.ETAT.NOUVELLE;
};

export function vuePratique(naviguer, rafraichir) {
  const reglages = store.lire().reglages;
  const motsPrets = WORDS.filter((w) => estConnu(w.id));
  const phrasesPretes = disponibles(estConnu);
  const suivante = prochaineADebloquer(estConnu);
  const couv = store.couvertureEstimee();

  return h(
    'div',
    { class: 'vue' },
    h(
      'div',
      { class: 'entete' },
      h(
        'div',
        {},
        h('h1', { class: 'entete__titre', text: 'Pratique' }),
        h('p', {
          class: 'entete__sous',
          text: 'Utiliser ce que tu connais, à vitesse réelle. Rien ici n’ajoute de révisions.',
        }),
      ),
    ),

    /* ------------------------------------------------- où tu en es vraiment */
    h(
      'section',
      { class: 'carte' },
      h('h3', { class: 'carte__titre', text: 'Ce que tu peux comprendre aujourd’hui' }),
      h(
        'div',
        { class: 'couverture' },
        h(
          'div',
          { class: 'couverture__jauge' },
          h('div', { class: 'couverture__part', style: { width: `${couv}%` } }),
          h('div', { class: 'couverture__seuil', style: { left: '95%' } }),
        ),
        h(
          'div',
          { class: 'couverture__legende' },
          h('span', {}, h('strong', {}, nombreAnime(couv, (n) => `${n} %`)), ' des mots d’une conversation courante'),
          h('span', { class: 'couverture__cible', text: '95 % = suivre sans effort' }),
        ),
      ),
      h('p', {
        class: 'couverture__note',
        text:
          `Avec ${pluriel(motsPrets.length, 'mot')} rencontré${motsPrets.length > 1 ? 's' : ''}, tu reconnais environ ${couv} % des mots d’une conversation ordinaire. ` +
          'Or il en faut près de 95 % pour suivre un dialogue sans effort, et les derniers pourcents coûtent bien plus cher que les premiers : ' +
          'c’est pourquoi on peut travailler des mois et ne saisir que quelques mots dans un épisode. ' +
          'L’écart se comble surtout en écoutant du japonais réel — ajouter des cartes ne le comblera pas.',
      }),
    ),

    /* ---------------------------------------------------------- les modes */
    h(
      'section',
      { class: 'grille grille--2 grille--modes', style: { marginTop: '16px' } },
      carteMode({
        ico: '⚡',
        titre: 'Tir rapide',
        texte:
          'Un mot, quatre sens, six secondes. Entraîne la reconnaissance immédiate — celle qui manque quand la phrase ne t’attend pas.',
        meta: `${pluriel(motsPrets.length, 'mot')} disponible${motsPrets.length > 1 ? 's' : ''}`,
        record: reglages.recordTirRapide
          ? `Record : ${reglages.recordTirRapide} / ${QUESTIONS_TIR}`
          : null,
        pret: motsPrets.length >= 8,
        blocage: 'Il faut avoir rencontré au moins 8 mots.',
        action: () => ouvrirTirRapide(motsPrets, rafraichir),
      }),
      carteMode({
        ico: '💬',
        titre: 'Phrases',
        texte:
          'Des phrases entières, dites d’un trait, composées uniquement de mots que tu connais déjà. Le pont entre le mot isolé et la parole continue.',
        meta: `${phrasesPretes.length} / ${TOTAL_PHRASES} débloquée${phrasesPretes.length > 1 ? 's' : ''}`,
        record: suivante
          ? `Prochaine dans ${pluriel(suivante.motsManquants, 'mot')} de plus`
          : 'Toutes les phrases sont accessibles',
        pret: phrasesPretes.length >= 4,
        blocage: 'Continue les révisions : les phrases se débloquent avec le vocabulaire.',
        action: () => ouvrirPhrases(phrasesPretes, rafraichir),
      }),
    ),

    /* ------------------------------------------------- conseil d'écoute */
    h(
      'section',
      { class: 'carte', style: { marginTop: '16px' } },
      h('h3', { class: 'carte__titre', text: 'Passer au japonais réel' }),
      h(
        'ul',
        { class: 'conseils' },
        h(
          'li',
          {},
          h('strong', {}, 'Vise la répétition, pas la nouveauté. '),
          'Revoir trois fois le même épisode apprend davantage que trois épisodes différents : la deuxième écoute est celle où les mots se détachent.',
        ),
        h(
          'li',
          {},
          h('strong', {}, 'Choisis du contenu volontairement simple. '),
          'Les tranches de vie et les émissions pour enfants tournent autour de ces mille mots. Un récit de fantasy ou de politique emploie un vocabulaire que tu n’as pas encore.',
        ),
        h(
          'li',
          {},
          h('strong', {}, 'Compte les mots reconnus, pas les phrases comprises. '),
          'Repérer cinq mots dans un épisode n’est pas un échec : c’est le point de départ normal. Ce chiffre grimpe vite dès qu’on écoute régulièrement.',
        ),
        h(
          'li',
          {},
          h('strong', {}, 'Sous-titres japonais plutôt que français. '),
          'Les sous-titres dans ta langue court-circuitent l’écoute ; ceux en japonais raccrochent le son à la forme écrite que tu vois déjà sur les cartes.',
        ),
      ),
    ),
  );
}

function carteMode({ ico, titre, texte, meta, record, pret, blocage, action }) {
  return h(
    'div',
    { class: `carte mode ${pret ? '' : 'mode--bloque'}` },
    h('div', { class: 'mode__ico', text: ico }),
    h('h3', { class: 'mode__titre', text: titre }),
    h('p', { class: 'mode__texte', text: texte }),
    h(
      'div',
      { class: 'mode__meta' },
      h('span', { class: 'puce puce--violet', text: meta }),
      record ? h('span', { class: 'puce', text: record }) : null,
    ),
    h('button', {
      class: 'btn btn--principal btn--bloc',
      style: { marginTop: '16px' },
      text: pret ? 'Commencer' : 'Pas encore accessible',
      disabled: !pret,
      onclick: action,
    }),
    pret ? null : h('p', { class: 'mode__blocage', text: blocage }),
  );
}

/* ====================================================== écran d'exercice */

/** Coquille commune aux deux exercices : barre du haut, corps, fermeture. */
function ouvrirExercice({ titre, total, surFermeture }) {
  const racine = h('div', { class: 'session' });
  document.body.append(racine);
  document.body.style.overflow = 'hidden';

  let fermee = false;
  const api = {
    racine,
    fermer() {
      if (fermee) return;
      fermee = true;
      tts.stop();
      document.body.style.overflow = '';
      racine.remove();
      surFermeture();
    },
    entete(index) {
      return h(
        'div',
        { class: 'session__haut' },
        h('button', { class: 'btn btn--fantome btn--rond', text: '✕', title: 'Quitter (Échap)', onclick: api.fermer }),
        h('span', { class: 'session__cnt', style: { fontWeight: '650' }, text: titre }),
        h(
          'div',
          { class: 'session__jauge' },
          h('span', { style: { width: `${(index / total) * 100}%` } }),
        ),
        h('span', { class: 'session__cnt', text: `${Math.min(index + 1, total)} / ${total}` }),
      );
    },
  };
  return api;
}

/* ---------------------------------------------------------- tir rapide */

function ouvrirTirRapide(motsPrets, surFermeture) {
  const reglages = store.lire().reglages;
  const tirage = melanger([...motsPrets]).slice(0, QUESTIONS_TIR);
  const total = tirage.length;
  const ex = ouvrirExercice({ titre: '⚡ Tir rapide', total, surFermeture: () => terminer() });

  let index = 0;
  let score = 0;
  let repondu = false;
  let minuteur = null;
  const temps = [];
  let debutQuestion = 0;

  function terminer() {
    clearTimeout(minuteur);
    surFermeture();
  }

  function options(mot) {
    const leurres = melanger(motsPrets.filter((m) => m.id !== mot.id && m.pos === mot.pos))
      .slice(0, 3)
      .concat(melanger(motsPrets.filter((m) => m.id !== mot.id)).slice(0, 3))
      .filter((m, i, arr) => arr.findIndex((x) => x.fr === m.fr) === i && m.fr !== mot.fr)
      .slice(0, 3);
    return melanger([mot, ...leurres]);
  }

  function question() {
    if (index >= total) return bilan();
    const mot = tirage[index];
    const choix = options(mot);
    repondu = false;
    debutQuestion = Date.now();

    ex.racine.replaceChildren(
      ex.entete(index),
      h(
        'div',
        { class: 'session__corps' },
        h(
          'div',
          { class: 'fiche fiche--question' },
          h('p', { class: 'fiche__consigne', text: 'Quel est le sens de ce mot ?' }),
          h('button', { class: 'fiche__son', id: 'btn-son', text: '🔊', title: 'Réécouter (R)', onclick: jouer }),
          h('div', { class: 'chrono' }, h('span', { id: 'chrono', style: { animationDuration: `${SECONDES_TIR}s` } })),
          h(
            'div',
            { class: 'options' },
            ...choix.map((m) =>
              h('button', {
                class: 'option',
                'data-id': String(m.id),
                text: m.fr,
                onclick: () => repondre(mot, m),
              }),
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'session__bas' },
        h('p', {
          style: { textAlign: 'center', fontSize: '12.5px', color: 'var(--texte-3)' },
          text: `Score : ${score} · touches 1 à 4 · R pour réécouter`,
        }),
      ),
    );

    jouer();
    minuteur = setTimeout(() => repondre(mot, null), SECONDES_TIR * 1000);
  }

  async function jouer() {
    const mot = tirage[index];
    if (!mot) return;
    await tts.dire(mot.kana, { vitesse: reglages.vitessePratique ?? 1, uri: reglages.voixUri });
  }

  function repondre(mot, choisi) {
    if (repondu) return;
    repondu = true;
    clearTimeout(minuteur);
    tts.stop();
    temps.push(Date.now() - debutQuestion);

    const juste = choisi?.id === mot.id;
    if (juste) score += 1;

    const chrono = $('#chrono', ex.racine);
    if (chrono) chrono.style.animationPlayState = 'paused';

    for (const bouton of ex.racine.querySelectorAll('.option')) {
      const id = Number(bouton.dataset.id);
      if (id === mot.id) bouton.classList.add('option--juste');
      else if (choisi && id === choisi.id) bouton.classList.add('option--faux');
      bouton.disabled = true;
    }

    if (!juste) {
      const info = h(
        'p',
        { class: 'fiche__indice', style: { color: 'var(--texte-2)' } },
        h('span', { class: 'ja', text: mot.kana }),
        ` · ${mot.romaji}`,
      );
      $('.fiche', ex.racine)?.append(info);
    }

    setTimeout(() => {
      index += 1;
      question();
    }, juste ? 550 : 1500);
  }

  function bilan() {
    const moyenne = temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length / 100) / 10 : 0;
    const record = store.lire().reglages.recordTirRapide ?? 0;
    const nouveauRecord = score > record;
    if (nouveauRecord) store.majReglages({ recordTirRapide: score });

    ex.racine.replaceChildren(
      h(
        'div',
        { class: 'session__corps' },
        h(
          'div',
          { class: 'bilan' },
          h('div', { class: 'bilan__ico', text: nouveauRecord ? '🏅' : score >= total * 0.8 ? '⚡' : '🎯' }),
          h('h2', { style: { fontSize: '27px' }, text: nouveauRecord ? 'Nouveau record !' : 'Terminé' }),
          h(
            'div',
            { class: 'bilan__grille' },
            caseB(`${score} / ${total}`, 'bonnes réponses'),
            caseB(`${pct(score, total)} %`, 'de réussite'),
            caseB(`${String(moyenne).replace('.', ',')} s`, 'par mot'),
          ),
          h('p', {
            style: { color: 'var(--texte-2)', fontSize: '13.5px', marginBottom: '20px' },
            text:
              moyenne > 3.5
                ? 'Sous les 2 secondes, la reconnaissance devient automatique et suit le rythme d’une conversation. Continue : la vitesse vient avec les répétitions.'
                : 'Bon rythme : à cette vitesse, ces mots-là ne te freineront plus à l’écoute.',
          }),
          h(
            'div',
            { style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } },
            h('button', {
              class: 'btn btn--principal btn--grand',
              text: 'Rejouer',
              onclick: () => {
                ex.fermer();
                ouvrirTirRapide(motsPrets, surFermeture);
              },
            }),
            h('button', { class: 'btn btn--grand', text: 'Retour', onclick: ex.fermer }),
          ),
        ),
      ),
    );
  }

  function surTouche(e) {
    if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', surTouche);
      return ex.fermer();
    }
    if (e.key === 'r' || e.key === 'R') return jouer();
    if (['1', '2', '3', '4'].includes(e.key)) {
      const boutons = ex.racine.querySelectorAll('.option');
      boutons[Number(e.key) - 1]?.click();
    }
  }
  document.addEventListener('keydown', surTouche);
  const fermerInitial = ex.fermer;
  ex.fermer = () => {
    document.removeEventListener('keydown', surTouche);
    clearTimeout(minuteur);
    fermerInitial();
  };

  question();
}

/* ------------------------------------------------------------ phrases */

function ouvrirPhrases(phrasesPretes, surFermeture) {
  const reglages = store.lire().reglages;
  const tirage = melanger([...phrasesPretes]).slice(0, QUESTIONS_PHRASES);
  const total = tirage.length;
  const ex = ouvrirExercice({ titre: '💬 Phrases', total, surFermeture });

  let index = 0;
  let score = 0;
  let repondu = false;

  function options(phrase) {
    const leurres = melanger(phrasesPretes.filter((p) => p.id !== phrase.id))
      .filter((p, i, arr) => arr.findIndex((x) => x.fr === p.fr) === i)
      .slice(0, 3);
    return melanger([phrase, ...leurres]);
  }

  function question() {
    if (index >= total) return bilan();
    const phrase = tirage[index];
    repondu = false;

    ex.racine.replaceChildren(
      ex.entete(index),
      h(
        'div',
        { class: 'session__corps' },
        h(
          'div',
          { class: 'fiche fiche--question' },
          h('p', { class: 'fiche__consigne', text: 'Écoute la phrase entière' }),
          h('button', { class: 'fiche__son', id: 'btn-son', text: '🔊', title: 'Réécouter (R)', onclick: () => jouer() }),
          h(
            'div',
            { style: { marginTop: '14px' } },
            h('button', {
              class: 'btn btn--fantome',
              text: '🐢 Plus lentement',
              onclick: () => jouer(0.65),
            }),
          ),
          h(
            'div',
            { class: 'options options--longues' },
            ...options(phrase).map((p) =>
              h('button', {
                class: 'option',
                'data-id': String(p.id),
                text: p.fr,
                onclick: () => repondre(phrase, p),
              }),
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'session__bas' },
        h('p', {
          style: { textAlign: 'center', fontSize: '12.5px', color: 'var(--texte-3)' },
          text: `Score : ${score} · touches 1 à 4 · R pour réécouter`,
        }),
      ),
    );

    jouer();
  }

  async function jouer(vitesse) {
    const phrase = tirage[index];
    if (!phrase) return;
    const bouton = $('#btn-son', ex.racine);
    bouton?.classList.add('fiche__son--joue');
    await tts.dire(phrase.kana, {
      vitesse: vitesse ?? reglages.vitessePratique ?? 1,
      uri: reglages.voixUri,
    });
    bouton?.classList.remove('fiche__son--joue');
  }

  function repondre(phrase, choisie) {
    if (repondu) return;
    repondu = true;
    tts.stop();
    if (choisie.id === phrase.id) score += 1;

    for (const bouton of ex.racine.querySelectorAll('.option')) {
      const id = Number(bouton.dataset.id);
      if (id === phrase.id) bouton.classList.add('option--juste');
      else if (id === choisie.id) bouton.classList.add('option--faux');
      bouton.disabled = true;
    }

    ex.racine.replaceChildren(
      ex.entete(index),
      h('div', { class: 'session__corps' }, decorticage(phrase, choisie.id === phrase.id)),
      h(
        'div',
        { class: 'session__bas' },
        h('button', {
          class: 'btn btn--principal btn--grand btn--bloc',
          style: { maxWidth: '680px', margin: '0 auto' },
          text: index + 1 >= total ? 'Voir le bilan' : 'Phrase suivante',
          onclick: () => {
            index += 1;
            question();
          },
        }),
      ),
    );
  }

  function decorticage(phrase, juste) {
    return h(
      'div',
      { class: 'fiche fiche--reponse' },
      h('p', {
        class: 'fiche__consigne',
        style: { color: juste ? 'var(--menthe)' : 'var(--rouge)' },
        text: juste ? '✓ Bien entendu' : '✗ Ce n’était pas ça',
      }),
      h('p', { class: 'fiche__kana ja', style: { fontSize: 'clamp(24px, 4vw, 36px)' }, text: phrase.kana }),
      h('p', { class: 'fiche__romaji', text: phrase.romaji }),
      h('p', { class: 'fiche__kanji ja', text: phrase.kanji }),
      h('div', { class: 'fiche__sep' }),
      h('p', { class: 'fiche__fr', style: { fontSize: 'clamp(19px, 3vw, 25px)' }, text: phrase.fr }),
      h(
        'div',
        { class: 'fiche__meta', style: { marginTop: '20px' } },
        ...phrase.groupes.map((g, i) => {
          const mot = BY_ID.get(g[0]);
          return mot
            ? h('span', { class: 'puce' }, h('span', { class: 'ja', text: phrase.cles[i] }), ` — ${mot.fr}`)
            : null;
        }),
      ),
      h(
        'div',
        { style: { marginTop: '16px' } },
        h('button', { class: 'btn btn--fantome', text: '🔊 Réécouter', onclick: () => jouer() }),
      ),
    );
  }

  function bilan() {
    ex.racine.replaceChildren(
      h(
        'div',
        { class: 'session__corps' },
        h(
          'div',
          { class: 'bilan' },
          h('div', { class: 'bilan__ico', text: score === total ? '🎊' : '💬' }),
          h('h2', { style: { fontSize: '27px' }, text: 'Série terminée' }),
          h(
            'div',
            { class: 'bilan__grille' },
            caseB(`${score} / ${total}`, 'phrases comprises'),
            caseB(`${pct(score, total)} %`, 'de réussite'),
            caseB(phrasesPretes.length, 'phrases débloquées'),
          ),
          h('p', {
            style: { color: 'var(--texte-2)', fontSize: '13.5px', marginBottom: '20px' },
            text: 'Ces phrases sont dites d’un trait, sans pause entre les mots : c’est exactement ce qui rend le japonais réel difficile au début.',
          }),
          h(
            'div',
            { style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } },
            phrasesPretes.length > total &&
              h('button', {
                class: 'btn btn--principal btn--grand',
                text: 'Une autre série',
                onclick: () => {
                  ex.fermer();
                  ouvrirPhrases(phrasesPretes, surFermeture);
                },
              }),
            h('button', { class: 'btn btn--grand', text: 'Retour', onclick: ex.fermer }),
          ),
        ),
      ),
    );
  }

  function surTouche(e) {
    if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', surTouche);
      return ex.fermer();
    }
    if (e.key === 'r' || e.key === 'R') return jouer();
    if (['1', '2', '3', '4'].includes(e.key)) {
      const boutons = ex.racine.querySelectorAll('.option');
      boutons[Number(e.key) - 1]?.click();
    }
  }
  document.addEventListener('keydown', surTouche);
  const fermerInitial = ex.fermer;
  ex.fermer = () => {
    document.removeEventListener('keydown', surTouche);
    fermerInitial();
  };

  question();
}

function caseB(valeur, libelle) {
  return h(
    'div',
    { class: 'bilan__case' },
    h('div', { class: 'bilan__val', text: String(valeur) }),
    h('div', { class: 'bilan__lib', text: libelle }),
  );
}
