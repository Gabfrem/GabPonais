import { h, $, dureeCourte, pluriel, toast } from '../util.js';
import { BY_ID } from '../data/words.js';
import * as store from '../store.js';
import * as srs from '../srs.js';
import * as tts from '../tts.js';

const LIB_ETAT = {
  0: { txt: 'Nouveau mot', classe: 'puce--sakura' },
  1: { txt: 'Apprentissage', classe: 'puce--ambre' },
  2: { txt: 'Révision', classe: 'puce--violet' },
  3: { txt: 'Réapprentissage', classe: 'puce--ambre' },
};

/**
 * Ouvre la session d'étude en plein écran.
 * @param {object} opts
 * @param {number[]} [opts.ids] limite la session à ces mots (sinon : file du jour)
 * @param {string}   [opts.titre]
 * @param {() => void} [opts.surFermeture]
 */
export function ouvrirSession({ ids = null, titre = 'Session', surFermeture = () => {} } = {}) {
  const reglages = store.lire().reglages;

  let file;
  if (ids) {
    file = ids.map((id) => store.carte(id)).filter(Boolean);
  } else {
    const jour = store.statsDuJour();
    file = srs.construireFile(store.toutesCartes(), {
      limiteNouvelles: Math.max(0, reglages.limiteNouvelles - jour.nouvellesFaites),
      limiteRevisions: Math.max(0, reglages.limiteRevisions - jour.revisionsFaites),
      ordreNouvelles: reglages.ordreNouvelles,
    });
  }

  const racine = h('div', { class: 'session' });
  document.body.append(racine);
  document.body.style.overflow = 'hidden';

  const total = file.length;
  let index = 0;
  let revele = false;
  let debutCarte = Date.now();
  const debutSession = Date.now();
  const bilan = { total: 0, again: 0, hard: 0, good: 0, easy: 0, nouvelles: 0 };
  let modeCarte = reglages.modeEtude === 'mixte' ? tirerMode() : reglages.modeEtude;

  function tirerMode() {
    return Math.random() < 0.65 ? 'ecoute' : 'rappel';
  }

  function fermer() {
    document.removeEventListener('keydown', surTouche);
    tts.stop();
    document.body.style.overflow = '';
    racine.remove();
    store.forcerEnvoi();
    surFermeture();
  }

  /* ------------------------------------------------------------- rendu */

  function rendre() {
    if (index >= file.length) return rendreBilan();

    const carte = file[index];
    const mot = BY_ID.get(carte.word_id);
    const etatCarte = LIB_ETAT[carte.etat] ?? LIB_ETAT[2];
    const ecoute = modeCarte === 'ecoute';

    racine.replaceChildren(
      h(
        'div',
        { class: 'session__haut' },
        h('button', {
          class: 'btn btn--fantome btn--rond',
          title: 'Quitter la session (Échap)',
          text: '✕',
          onclick: fermer,
        }),
        h('div', { class: 'session__jauge' }, h('span', { style: { width: `${(index / total) * 100}%` } })),
        h('span', { class: 'session__cnt', text: `${index + 1} / ${total}` }),
      ),
      h(
        'div',
        { class: 'session__corps' },
        revele ? ficheReponse(mot, carte, ecoute) : ficheQuestion(mot, carte, etatCarte, ecoute),
      ),
      h('div', { class: 'session__bas' }, revele ? boutonsNotes(carte) : boutonReveler()),
    );

    if (!revele && ecoute && reglages.lectureAuto) jouer();
  }

  function ficheQuestion(mot, carte, etatCarte, ecoute) {
    if (ecoute) {
      return h(
        'div',
        { class: 'fiche' },
        h('p', { class: 'fiche__consigne', text: 'Écoute — quel est le sens de ce mot ?' }),
        h('button', {
          class: 'fiche__son',
          id: 'btn-son',
          text: '🔊',
          title: 'Réécouter (R ou clic)',
          onclick: jouer,
        }),
        h(
          'div',
          { class: 'fiche__meta' },
          h('span', { class: `puce ${etatCarte.classe}`, text: etatCarte.txt }),
          carte.oublis >= 4 && h('span', { class: 'puce puce--sakura', text: '🌶️ mot coriace' }),
        ),
        mot.homophone
          ? h('p', {
              class: 'fiche__indice',
              text: `Homophone — indice : ${mot.pos}`,
            })
          : null,
      );
    }
    return h(
      'div',
      { class: 'fiche' },
      h('p', { class: 'fiche__consigne', text: 'Rappel — comment dit-on en japonais ?' }),
      h('p', { class: 'fiche__fr', text: mot.fr }),
      h(
        'div',
        { class: 'fiche__meta' },
        h('span', { class: `puce ${etatCarte.classe}`, text: etatCarte.txt }),
        h('span', { class: 'puce', text: mot.pos }),
      ),
    );
  }

  function ficheReponse(mot, carte, ecoute) {
    return h(
      'div',
      { class: 'fiche' },
      h('p', { class: 'fiche__consigne', text: ecoute ? 'Réponse' : 'Réponse — écoute la prononciation' }),
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' } },
        h('p', { class: 'fiche__kana ja', text: mot.kana }),
        h('button', {
          class: 'btn btn--fantome btn--rond',
          id: 'btn-son',
          text: '🔊',
          title: 'Réécouter (R)',
          onclick: jouer,
        }),
      ),
      reglages.afficherRomaji ? h('p', { class: 'fiche__romaji', text: mot.romaji }) : null,
      reglages.afficherKanji && mot.kanji !== mot.kana
        ? h('p', { class: 'fiche__kanji ja', text: `écriture : ${mot.kanji}` })
        : null,
      h('div', { class: 'fiche__sep' }),
      h('p', { class: 'fiche__fr', text: mot.fr }),
      h(
        'div',
        { class: 'fiche__meta' },
        h('span', { class: 'puce', text: mot.pos }),
        h('span', { class: 'puce', text: `n° ${mot.rank} sur 1000` }),
        carte.reps > 0 && h('span', { class: 'puce', text: `vu ${pluriel(carte.reps, 'fois', 'fois')}` }),
      ),
    );
  }

  function boutonReveler() {
    return h(
      'div',
      { style: { maxWidth: '680px', margin: '0 auto', textAlign: 'center' } },
      h('button', {
        class: 'btn btn--principal btn--grand btn--bloc',
        text: 'Afficher la réponse',
        onclick: reveler,
      }),
      h('p', {
        style: { fontSize: '11.5px', color: 'var(--texte-3)', marginTop: '10px' },
        text: 'Espace : afficher · R : réécouter · Échap : quitter',
      }),
    );
  }

  function boutonsNotes(carte) {
    const apercu = srs.apercus(carte);
    return h(
      'div',
      {},
      h(
        'div',
        { class: 'notes' },
        ...srs.NOTES.map((n) =>
          h(
            'button',
            { class: `note note--${n.couleur}`, onclick: () => noter(n.n) },
            h('span', { class: 'note__lib', text: n.label }),
            h('span', { class: 'note__delai', text: dureeCourte(apercu[n.n]) }),
            h('span', { class: 'note__touche', text: n.touche }),
          ),
        ),
      ),
      h('p', {
        style: { fontSize: '11.5px', color: 'var(--texte-3)', marginTop: '10px', textAlign: 'center' },
        text: 'Touches 1 à 4 · Espace = Correct',
      }),
    );
  }

  /* ------------------------------------------------------------ actions */

  async function jouer() {
    const carte = file[index];
    if (!carte) return;
    const mot = BY_ID.get(carte.word_id);
    const bouton = $('#btn-son', racine);
    bouton?.classList.add('fiche__son--joue');
    const ok = await tts.dire(mot.kana, { vitesse: reglages.vitesse, uri: reglages.voixUri });
    bouton?.classList.remove('fiche__son--joue');
    if (!ok && tts.manqueVoixJa()) {
      toast('Aucune voix japonaise détectée sur cet appareil.', 'erreur');
    }
  }

  function reveler() {
    if (revele) return;
    revele = true;
    rendre();
    if (modeCarte === 'rappel') jouer();
  }

  function noter(note) {
    if (!revele) return;
    const carte = file[index];
    const etaitNouvelle = carte.etat === srs.ETAT.NOUVELLE;
    store.repondre(carte.word_id, note, { mode: modeCarte, dureeMs: Date.now() - debutCarte });

    bilan.total += 1;
    if (etaitNouvelle) bilan.nouvelles += 1;
    bilan[srs.NOTES.find((n) => n.n === note).cle] += 1;

    // Une carte ratée ou encore en apprentissage revient plus tard dans la session.
    const apres = store.carte(carte.word_id);
    if (apres.etat === srs.ETAT.APPRENTISSAGE || apres.etat === srs.ETAT.REAPPRENTISSAGE) {
      const cible = Math.min(file.length, index + (note === 1 ? 3 : 8));
      file.splice(cible, 0, apres);
    }

    index += 1;
    revele = false;
    debutCarte = Date.now();
    if (reglages.modeEtude === 'mixte') modeCarte = tirerMode();
    rendre();
  }

  function rendreBilan() {
    tts.stop();
    const minutes = Math.max(1, Math.round((Date.now() - debutSession) / 60_000));
    const precision = bilan.total ? Math.round(((bilan.good + bilan.easy) / bilan.total) * 100) : 0;
    const jour = store.statsDuJour();
    const restant = store.compteurs().aFaire;
    const serie = store.serie();

    racine.replaceChildren(
      h(
        'div',
        { class: 'session__corps' },
        h(
          'div',
          { class: 'bilan' },
          h('div', { class: 'bilan__ico', text: jour.objectifAtteint ? '🎉' : '✨' }),
          h('h2', {
            style: { fontSize: '27px' },
            text: bilan.total === 0 ? 'Rien à réviser pour le moment' : 'Session terminée !',
          }),
          h('p', {
            style: { color: 'var(--texte-2)', marginTop: '8px' },
            text: jour.objectifAtteint
              ? `Objectif du jour atteint : ${jour.revisionsFaites} révisions sur ${jour.objectif}.`
              : bilan.total === 0
                ? 'Reviens un peu plus tard, ou ajoute des mots nouveaux depuis les réglages.'
                : `Encore ${Math.max(0, jour.objectif - jour.revisionsFaites)} révisions pour atteindre ton objectif du jour.`,
          }),
          bilan.total > 0 &&
            h(
              'div',
              { class: 'bilan__grille' },
              caseBilan(bilan.total, 'cartes vues'),
              caseBilan(`${precision} %`, 'réussite'),
              caseBilan(`${minutes} min`, 'de pratique'),
              caseBilan(bilan.nouvelles, 'mots découverts'),
              caseBilan(serie, serie >= 2 ? 'jours d’affilée' : 'jour d’affilée'),
              caseBilan(restant, 'encore en attente'),
            ),
          h(
            'div',
            { style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } },
            restant > 0 &&
              h('button', {
                class: 'btn btn--principal btn--grand',
                text: `Continuer (${restant})`,
                onclick: () => {
                  racine.remove();
                  document.body.style.overflow = '';
                  document.removeEventListener('keydown', surTouche);
                  ouvrirSession({ surFermeture });
                },
              }),
            h('button', {
              class: restant > 0 ? 'btn btn--grand' : 'btn btn--principal btn--grand',
              text: 'Retour au tableau de bord',
              onclick: fermer,
            }),
          ),
        ),
      ),
    );
  }

  function caseBilan(valeur, libelle) {
    return h(
      'div',
      { class: 'bilan__case' },
      h('div', { class: 'bilan__val', text: String(valeur) }),
      h('div', { class: 'bilan__lib', text: libelle }),
    );
  }

  /* ------------------------------------------------------------ clavier */

  function surTouche(e) {
    if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      return fermer();
    }
    if (index >= file.length) return;
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      return jouer();
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      return revele ? noter(3) : reveler();
    }
    if (revele && ['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      noter(Number(e.key));
    }
  }

  document.addEventListener('keydown', surTouche);
  rendre();
  return racine;
}
