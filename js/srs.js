/**
 * Moteur de répétition espacée (variante SM-2, proche d'Anki).
 *
 * États d'une carte :
 *   0 = nouvelle        (jamais vue)
 *   1 = apprentissage   (paliers courts, en minutes)
 *   2 = révision        (intervalle en jours)
 *   3 = réapprentissage (après un oubli)
 */

export const ETAT = { NOUVELLE: 0, APPRENTISSAGE: 1, REVISION: 2, REAPPRENTISSAGE: 3 };

export const NOTES = [
  { n: 1, cle: 'again', label: 'À revoir', couleur: 'again', touche: '1' },
  { n: 2, cle: 'hard', label: 'Difficile', couleur: 'hard', touche: '2' },
  { n: 3, cle: 'good', label: 'Correct', couleur: 'good', touche: '3' },
  { n: 4, cle: 'easy', label: 'Facile', couleur: 'easy', touche: '4' },
];

// Paliers d'apprentissage, en minutes.
// Le premier palier est court exprès : il ramène la carte dans la session en cours.
// Le second dépasse la durée d'une session, la carte revient donc plus tard.
const PALIERS_APPRENTISSAGE = [1, 10];
const PALIERS_REAPPRENTISSAGE = [1, 10];

const INTERVALLE_DIPLOME = 1; // jours, après avoir passé tous les paliers
const INTERVALLE_FACILE = 4; // jours, si « Facile » dès l'apprentissage
const FACILITE_DEPART = 2.5;
const FACILITE_MIN = 1.3;
const INTERVALLE_MAX = 365; // jours
const MULT_OUBLI = 0.4; // l'intervalle est réduit à 40 % après un oubli
const SEUIL_SANGSUE = 6; // au-delà, la carte est signalée comme « sangsue »

const MINUTE = 60_000;
const JOUR = 86_400_000;

export function carteNeuve(wordId) {
  return {
    word_id: wordId,
    etat: ETAT.NOUVELLE,
    du: null, // ISO string : date de prochaine échéance
    intervalle: 0, // en jours
    facilite: FACILITE_DEPART,
    palier: 0, // index dans les paliers d'apprentissage
    reps: 0,
    oublis: 0,
    derniere: null,
    suspendue: false,
  };
}

/** Petite variation aléatoire (±5 %) pour éviter que les cartes s'agglutinent. */
function flou(jours) {
  if (jours < 2) return jours;
  const delta = Math.max(1, jours * 0.05);
  return jours + (Math.random() * 2 - 1) * delta;
}

function borne(jours) {
  return Math.min(INTERVALLE_MAX, Math.max(1, Math.round(jours)));
}

/**
 * Calcule l'état suivant d'une carte sans la modifier.
 * @returns {{carte: object, intervalleMs: number}}
 */
export function prochaine(carte, note, maintenant = Date.now()) {
  const c = { ...carte };
  const etaitNouvelle = c.etat === ETAT.NOUVELLE;
  let ms;

  if (c.etat === ETAT.NOUVELLE || c.etat === ETAT.APPRENTISSAGE || c.etat === ETAT.REAPPRENTISSAGE) {
    const paliers = c.etat === ETAT.REAPPRENTISSAGE ? PALIERS_REAPPRENTISSAGE : PALIERS_APPRENTISSAGE;
    const enReappr = c.etat === ETAT.REAPPRENTISSAGE;
    let idx = etaitNouvelle ? 0 : c.palier;

    if (note === 1) {
      idx = 0;
      ms = paliers[0] * MINUTE;
      c.etat = enReappr ? ETAT.REAPPRENTISSAGE : ETAT.APPRENTISSAGE;
      c.palier = 0;
    } else if (note === 4) {
      // On saute directement en révision.
      c.etat = ETAT.REVISION;
      c.intervalle = enReappr ? borne(Math.max(c.intervalle, 1) * 1.3) : INTERVALLE_FACILE;
      c.palier = 0;
      ms = c.intervalle * JOUR;
    } else {
      // 2 = on répète le palier courant, 3 = on avance d'un palier.
      const suivant = note === 3 ? idx + 1 : idx;
      if (suivant >= paliers.length) {
        c.etat = ETAT.REVISION;
        c.intervalle = enReappr ? borne(Math.max(c.intervalle, 1)) : INTERVALLE_DIPLOME;
        c.palier = 0;
        ms = c.intervalle * JOUR;
      } else {
        c.etat = enReappr ? ETAT.REAPPRENTISSAGE : ETAT.APPRENTISSAGE;
        c.palier = suivant;
        ms = paliers[suivant] * MINUTE;
      }
    }
  } else {
    // Carte en révision.
    if (note === 1) {
      c.oublis += 1;
      c.facilite = Math.max(FACILITE_MIN, c.facilite - 0.2);
      c.intervalle = borne(Math.max(1, c.intervalle * MULT_OUBLI));
      c.etat = ETAT.REAPPRENTISSAGE;
      c.palier = 0;
      ms = PALIERS_REAPPRENTISSAGE[0] * MINUTE;
    } else {
      if (note === 2) {
        c.facilite = Math.max(FACILITE_MIN, c.facilite - 0.15);
        c.intervalle = borne(flou(Math.max(c.intervalle + 1, c.intervalle * 1.2)));
      } else if (note === 3) {
        c.intervalle = borne(flou(Math.max(c.intervalle + 1, c.intervalle * c.facilite)));
      } else {
        c.facilite = Math.min(3.2, c.facilite + 0.15);
        c.intervalle = borne(flou(Math.max(c.intervalle + 2, c.intervalle * c.facilite * 1.3)));
      }
      c.etat = ETAT.REVISION;
      ms = c.intervalle * JOUR;
    }
  }

  c.reps += 1;
  c.derniere = new Date(maintenant).toISOString();
  c.du = new Date(maintenant + ms).toISOString();
  return { carte: c, intervalleMs: ms };
}

/** Aperçu du délai associé à chaque note, pour l'afficher sur les boutons. */
export function apercus(carte, maintenant = Date.now()) {
  const out = {};
  for (const { n } of NOTES) out[n] = prochaine(carte, n, maintenant).intervalleMs;
  return out;
}

export function estSangsue(carte) {
  return carte.oublis >= SEUIL_SANGSUE;
}

export function estDue(carte, maintenant = Date.now()) {
  if (carte.suspendue || carte.etat === ETAT.NOUVELLE) return false;
  return new Date(carte.du).getTime() <= maintenant;
}

export function estApprise(carte) {
  return carte.etat === ETAT.REVISION && carte.intervalle >= 21;
}

/**
 * Construit la file de la session.
 * Les révisions dues passent en premier, les nouveautés sont réparties dedans.
 */
export function construireFile(cartes, options) {
  const { limiteNouvelles, limiteRevisions, ordreNouvelles, maintenant = Date.now() } = options;

  const dues = [];
  const apprentissage = [];
  for (const c of cartes) {
    if (c.suspendue) continue;
    if (c.etat === ETAT.NOUVELLE) continue;
    if (new Date(c.du).getTime() > maintenant) continue;
    if (c.etat === ETAT.APPRENTISSAGE || c.etat === ETAT.REAPPRENTISSAGE) apprentissage.push(c);
    else dues.push(c);
  }

  dues.sort((a, b) => new Date(a.du) - new Date(b.du));
  apprentissage.sort((a, b) => new Date(a.du) - new Date(b.du));

  let nouvelles = cartes.filter((c) => c.etat === ETAT.NOUVELLE && !c.suspendue);
  if (ordreNouvelles === 'aleatoire') melanger(nouvelles);
  else nouvelles.sort((a, b) => a.word_id - b.word_id);
  nouvelles = nouvelles.slice(0, Math.max(0, limiteNouvelles));

  const revisions = [...apprentissage, ...dues].slice(0, Math.max(0, limiteRevisions));

  // On intercale les nouvelles cartes régulièrement parmi les révisions.
  if (nouvelles.length === 0) return revisions;
  if (revisions.length === 0) return nouvelles;

  const file = [];
  const pas = revisions.length / (nouvelles.length + 1);
  let iN = 0;
  for (let i = 0; i < revisions.length; i++) {
    while (iN < nouvelles.length && i >= Math.round(pas * (iN + 1))) file.push(nouvelles[iN++]);
    file.push(revisions[i]);
  }
  while (iN < nouvelles.length) file.push(nouvelles[iN++]);
  return file;
}

export function melanger(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Prévision du nombre de révisions à venir, jour par jour. */
export function prevision(cartes, jours = 14, maintenant = Date.now()) {
  const debut = new Date(maintenant);
  debut.setHours(0, 0, 0, 0);
  const out = Array.from({ length: jours }, () => 0);
  for (const c of cartes) {
    if (c.suspendue || c.etat === ETAT.NOUVELLE || !c.du) continue;
    const d = Math.floor((new Date(c.du).getTime() - debut.getTime()) / JOUR);
    if (d < 0) out[0] += 1;
    else if (d < jours) out[d] += 1;
  }
  return out;
}
