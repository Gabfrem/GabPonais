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

// Une carte n'est remise dans la session que si son échéance tombe dans ce délai.
// Au-delà, elle sort de la session : la revoir tout de suite contredirait le
// délai annoncé sur le bouton de notation.
const SEUIL_RETOUR_MS = 2 * 60_000;

// On tolère de présenter une carte un peu avant l'heure, plutôt que de faire
// patienter devant un écran vide quand il ne reste plus qu'elle.
const TOLERANCE_AVANCE_MS = 90_000;

/**
 * Ouvre la session d'étude en plein écran.
 * @param {object} opts
 * @param {number[]} [opts.ids] limite la session à ces mots (sinon : file du jour)
 * @param {() => void} [opts.surFermeture]
 */
export function ouvrirSession({ ids = null, surFermeture = () => {} } = {}) {
  const reglages = store.lire().reglages;

  /** Identifiants restant à présenter. La carte affichée n'y figure plus. */
  let file;
  if (ids) {
    file = ids.filter((id) => store.carte(id));
  } else {
    const jour = store.statsDuJour();
    file = srs
      .construireFile(store.toutesCartes(), {
        limiteNouvelles: Math.max(0, reglages.limiteNouvelles - jour.nouvellesFaites),
        limiteRevisions: Math.max(0, reglages.limiteRevisions - jour.revisionsFaites),
        ordreNouvelles: reglages.ordreNouvelles,
      })
      .map((c) => c.word_id);
  }

  const racine = h('div', { class: 'session' });
  document.body.append(racine);
  document.body.style.overflow = 'hidden';

  let courante = null; // identifiant de la carte affichée
  let faites = 0; // nombre de réponses données
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

  /* -------------------------------------------------------------- la file */

  function echeance(id) {
    const c = store.carte(id);
    if (!c || c.etat === srs.ETAT.NOUVELLE || !c.du) return 0; // toujours disponible
    return new Date(c.du).getTime();
  }

  /**
   * Retire de la file la prochaine carte à présenter : la première qui est
   * réellement due, sinon la plus proche si l'attente reste courte.
   * Renvoie null quand il ne reste que des cartes programmées pour plus tard.
   */
  function prelever() {
    if (!file.length) return null;
    const maintenant = Date.now();
    let plusProche = Infinity;
    let iProche = 0;

    for (let i = 0; i < file.length; i++) {
      const du = echeance(file[i]);
      if (du <= maintenant) return file.splice(i, 1)[0];
      if (du < plusProche) {
        plusProche = du;
        iProche = i;
      }
    }
    if (plusProche - maintenant <= TOLERANCE_AVANCE_MS) return file.splice(iProche, 1)[0];
    return null;
  }

  /**
   * Cartes encore en apprentissage dont l'échéance est à venir : elles ne sont
   * pas « dues » au sens du tableau de bord, mais reviendront dans quelques minutes.
   */
  function reportees() {
    const maintenant = Date.now();
    const delais = store
      .toutesCartes()
      .filter(
        (c) =>
          !c.suspendue &&
          (c.etat === srs.ETAT.APPRENTISSAGE || c.etat === srs.ETAT.REAPPRENTISSAGE) &&
          c.du &&
          new Date(c.du).getTime() > maintenant,
      )
      .map((c) => new Date(c.du).getTime() - maintenant);
    return { nombre: delais.length, delai: delais.length ? Math.min(...delais) : 0 };
  }

  function avancer() {
    courante = prelever();
    revele = false;
    debutCarte = Date.now();
    if (reglages.modeEtude === 'mixte') modeCarte = tirerMode();
    rendre();
  }

  /* ------------------------------------------------------------- le rendu */

  function rendre() {
    if (courante === null) return rendreBilan();

    const carte = store.carte(courante);
    const mot = BY_ID.get(courante);
    const etatCarte = LIB_ETAT[carte.etat] ?? LIB_ETAT[2];
    const ecoute = modeCarte === 'ecoute';
    // Le total inclut la carte affichée et celles qui restent : il ne peut plus
    // être dépassé, et il grandit si une carte est remise dans la file.
    const total = faites + 1 + file.length;

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
        h(
          'div',
          { class: 'session__jauge' },
          h('span', { style: { width: `${Math.min(100, (faites / total) * 100)}%` } }),
        ),
        h('span', { class: 'session__cnt', text: `${faites + 1} / ${total}` }),
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
        mot.homophone ? h('p', { class: 'fiche__indice', text: `Homophone — indice : ${mot.pos}` }) : null,
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
    if (courante === null) return;
    const mot = BY_ID.get(courante);
    const bouton = $('#btn-son', racine);
    bouton?.classList.add('fiche__son--joue');
    const ok = await tts.dire(mot.kana, { vitesse: reglages.vitesse, uri: reglages.voixUri });
    bouton?.classList.remove('fiche__son--joue');
    if (!ok && tts.manqueVoixJa()) toast('Aucune voix japonaise détectée sur cet appareil.', 'erreur');
  }

  function reveler() {
    if (revele || courante === null) return;
    revele = true;
    rendre();
    if (modeCarte === 'rappel') jouer();
  }

  function noter(note) {
    if (!revele || courante === null) return;
    const id = courante;
    const avant = store.carte(id);
    const etaitNouvelle = avant.etat === srs.ETAT.NOUVELLE;

    store.repondre(id, note, { mode: modeCarte, dureeMs: Date.now() - debutCarte });

    faites += 1;
    bilan.total += 1;
    if (etaitNouvelle) bilan.nouvelles += 1;
    bilan[srs.NOTES.find((n) => n.n === note).cle] += 1;

    // La carte revient dans la session seulement si son échéance est proche ;
    // sinon elle reste programmée pour plus tard, comme annoncé.
    const apres = store.carte(id);
    const enApprentissage = apres.etat === srs.ETAT.APPRENTISSAGE || apres.etat === srs.ETAT.REAPPRENTISSAGE;
    if (enApprentissage && new Date(apres.du).getTime() - Date.now() <= SEUIL_RETOUR_MS) file.push(id);

    avancer();
  }

  /* -------------------------------------------------------------- bilan */

  function rendreBilan() {
    tts.stop();
    const minutes = Math.max(1, Math.round((Date.now() - debutSession) / 60_000));
    const precision = bilan.total ? Math.round(((bilan.good + bilan.easy) / bilan.total) * 100) : 0;
    const jour = store.statsDuJour();
    const dues = store.compteurs().aFaire;
    const attente = reportees();
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
          attente.nombre
            ? h('p', {
                style: { color: 'var(--texte-3)', fontSize: '13.5px', marginTop: '10px' },
                text: `${pluriel(attente.nombre, 'carte')} en cours d’apprentissage ${attente.nombre > 1 ? 'reviendront' : 'reviendra'} dans ${dureeCourte(attente.delai)} pour consolider.`,
              })
            : null,
          bilan.total > 0 &&
            h(
              'div',
              { class: 'bilan__grille' },
              caseBilan(bilan.total, 'cartes vues'),
              caseBilan(`${precision} %`, 'réussite'),
              caseBilan(`${minutes} min`, 'de pratique'),
              caseBilan(bilan.nouvelles, 'mots découverts'),
              caseBilan(serie, serie >= 2 ? 'jours d’affilée' : 'jour d’affilée'),
              caseBilan(dues, 'dues maintenant'),
            ),
          h(
            'div',
            { style: { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } },
            dues > 0 &&
              h('button', {
                class: 'btn btn--principal btn--grand',
                text: `Continuer (${dues})`,
                onclick: () => {
                  document.removeEventListener('keydown', surTouche);
                  document.body.style.overflow = '';
                  racine.remove();
                  ouvrirSession({ surFermeture });
                },
              }),
            h('button', {
              class: dues > 0 ? 'btn btn--grand' : 'btn btn--principal btn--grand',
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
    if (courante === null) return;
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
  avancer();
  return racine;
}
