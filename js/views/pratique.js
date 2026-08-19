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

/** Mot déjà rencontré : suffisant pour s'entraîner dessus. */
const estConnu = (id) => {
  const c = store.carte(id);
  return !!c && c.etat !== srs.ETAT.NOUVELLE;
};

/**
 * Mot dont la connaissance est vérifiée en révision.
 * Le déverrouillage des phrases s'appuie là-dessus, et non sur l'estimation
 * du test de niveau : sans quoi on tombe sur des phrases pleines de mots
 * qu'on n'a jamais réellement vus.
 */
const estVerifie = (id) => srs.estConfirme(store.carte(id));

export function vuePratique(naviguer, rafraichir) {
  const reglages = store.lire().reglages;
  const motsPrets = WORDS.filter((w) => estConnu(w.id));
  const motsVerifies = WORDS.filter((w) => estVerifie(w.id));
  const estimes = motsPrets.length - motsVerifies.length;
  const phrasesPretes = disponibles(estVerifie);
  const suivante = prochaineADebloquer(estVerifie);
  const couv = store.couvertureVerifiee();

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
          h('span', {}, h('strong', {}, nombreAnime(couv, (n) => `${n} %`)), ` — soit ${motsSurDix(couv)}`),
          h('span', { class: 'couverture__cible', text: '95 % = suivre sans effort' }),
        ),
      ),
      h('p', {
        class: 'couverture__note',
        text: motsVerifies.length
          ? `Estimation à partir de ${pluriel(motsVerifies.length, 'mot')} dont la connaissance est vérifiée en révision. ` +
            `Un taux de ${couv} % paraît encourageant, mais il signifie que ${motsManquantsSurDix(couv)} t’échappent encore : ` +
            'à ce stade on saisit des mots isolés, pas le sens d’une phrase. Il faut approcher 95 % pour suivre sans effort, ' +
            'et les derniers pourcents coûtent bien plus cher que les premiers. Ces chiffres sont des ordres de grandeur ' +
            'tirés d’études de fréquence, pas une mesure sur un contenu précis.'
          : 'Cette jauge se remplira à mesure que tu retrouveras des mots en révision. Elle ne compte que les mots ' +
            'réellement vérifiés : c’est le seul chiffre sur lequel on puisse se fier pour juger de ce qui est compréhensible.',
      }),
      estimes > 0
        ? h('p', {
            class: 'couverture__note',
            style: { marginTop: '10px', color: 'var(--texte-3)' },
            text:
              `${pluriel(estimes, 'mot')} de plus ${estimes > 1 ? 'sont estimés' : 'est estimé'} connus par le test de niveau, mais ne comptent pas encore ici : ` +
              'le test ne sonde que quelques mots par tranche puis accorde la tranche entière. Ils seront pris en compte au fur et à mesure que tu les retrouveras en révision.',
          })
        : null,
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
        meta: `${phrasesPretes.length} phrase${phrasesPretes.length > 1 ? 's' : ''} sur ${TOTAL_PHRASES}`,
        record: suivante
          ? `Prochaine dans ${pluriel(suivante.motsManquants, 'mot')} de plus`
          : 'Toutes les phrases sont accessibles',
        pret: phrasesPretes.length >= 4,
        blocage: 'Continue les révisions : les phrases se débloquent avec le vocabulaire.',
        action: () => ouvrirPhrases(phrasesPretes, rafraichir),
      }),
    ),

    /* ------------------------------------------------------- lectures */
    sectionLectures(motsVerifies.length),

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

/**
 * Lectures extérieures, classées par nombre de mots vérifiés.
 * Chaque entrée est libre d'accès ; le seuil indique à partir de quand elle
 * devient réellement lisible plutôt que décourageante.
 */
const LECTURES = [
  {
    seuil: 0,
    nom: 'Tadoku — lectures graduées',
    url: 'https://tadoku.org/japanese/free-books/',
    licence: 'gratuit, NPO 多言語多読',
    quoi:
      'Des petits livres écrits pour les débutants, du niveau « Start » au niveau 5, avec furigana, audio et versions PDF téléchargeables.',
    pourquoi:
      'Le seul point d’entrée vraiment praticable au début : le vocabulaire y est délibérément limité, et les images portent une partie du sens.',
  },
  {
    seuil: 120,
    nom: 'NHK News Web Easy',
    url: 'https://www3.nhk.or.jp/news/easy/',
    licence: 'gratuit, NHK',
    quoi:
      'Trois ou quatre actualités par jour ouvré, réécrites en japonais simplifié, tous les kanji annotés en furigana, avec lecture audio lente.',
    pourquoi:
      'Textes courts et renouvelés chaque jour : idéal pour une lecture quotidienne de cinq minutes. Reste exigeant, prévois un dictionnaire.',
  },
  {
    seuil: 350,
    nom: 'yomujp — 日本語多読道場',
    url: 'https://yomujp.com/',
    licence: 'gratuit pendant 4 semaines après publication',
    quoi: 'Des lectures classées par niveau, de N6 (grand débutant) à N1, sur des sujets du quotidien.',
    pourquoi:
      'Le classement fin permet de trouver des textes juste au-dessus de ton niveau. Les articles anciens passent derrière un abonnement.',
  },
  {
    seuil: 800,
    nom: 'Aozora Bunko — 青空文庫',
    url: 'https://www.aozora.gr.jp/',
    licence: 'domaine public',
    quoi: 'Près de 17 000 œuvres de la littérature japonaise tombées dans le domaine public, en texte intégral.',
    pourquoi:
      'À réserver pour plus tard : ce sont des textes littéraires non adaptés, souvent en langue ancienne. Les contes courts d’Akutagawa ou de Miyazawa Kenji sont les plus abordables.',
  },
];

function sectionLectures(motsVerifies) {
  return h(
    'section',
    { class: 'carte', style: { marginTop: '16px' } },
    h('h3', { class: 'carte__titre', text: 'Lire en japonais réel' }),
    h('p', {
      style: { fontSize: '13.5px', color: 'var(--texte-2)', lineHeight: '1.7', marginBottom: '18px' },
      text:
        'Lire coûte moins cher que d’écouter : le texte t’attend, tu peux relire et chercher un mot. C’est souvent par là qu’on décroche les premières compréhensions réelles.',
    }),
    h(
      'div',
      { class: 'lectures' },
      ...LECTURES.map((l) => {
        const accessible = motsVerifies >= l.seuil;
        return h(
          'a',
          {
            class: `lecture ${accessible ? '' : 'lecture--tot'}`,
            href: l.url,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          h(
            'div',
            { class: 'lecture__haut' },
            h('span', { class: 'lecture__nom', text: l.nom }),
            h('span', {
              class: `puce ${accessible ? 'puce--menthe' : ''}`,
              text: accessible ? 'à ta portée' : `dès ${l.seuil} mots vérifiés`,
            }),
          ),
          h('p', { class: 'lecture__quoi', text: l.quoi }),
          h('p', { class: 'lecture__pourquoi', text: l.pourquoi }),
          h('span', { class: 'lecture__licence', text: l.licence }),
        );
      }),
    ),
  );
}

/** « 5 mots sur 10 » parle plus qu'un pourcentage. */
function motsSurDix(pourcentage) {
  return `environ ${Math.round(pourcentage / 10)} mot${pourcentage >= 15 ? 's' : ''} sur 10`;
}

function motsManquantsSurDix(pourcentage) {
  const manquants = Math.max(1, Math.round((100 - pourcentage) / 10));
  return `${manquants} mot${manquants > 1 ? 's' : ''} sur 10`;
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
