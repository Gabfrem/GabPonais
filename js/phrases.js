/**
 * Indexation des phrases d'entraînement.
 *
 * Chaque phrase est reliée aux mots de vocabulaire qu'elle emploie, ce qui
 * permet de ne proposer que celles dont tous les mots ont déjà été rencontrés.
 * On n'écoute donc jamais une phrase qu'on ne pourrait pas comprendre.
 */
import BRUTES from './data/phrases.js';
import { WORDS } from './data/words.js';

// Un même kana peut correspondre à plusieurs entrées (切る / 着る) : on garde
// toutes les correspondances, et le mot compte comme connu si l'une l'est.
const PAR_KANA = new Map();
for (const w of WORDS) {
  if (!PAR_KANA.has(w.kana)) PAR_KANA.set(w.kana, []);
  PAR_KANA.get(w.kana).push(w.id);
}

export const PHRASES = BRUTES.map(([kanji, kana, romaji, fr, cles], i) => {
  const groupes = cles.map((c) => PAR_KANA.get(c) ?? []);
  return {
    id: i + 1,
    kanji,
    kana,
    romaji,
    fr,
    cles,
    groupes, // un tableau d'identifiants par mot-clé
    ids: groupes.flat(),
    // Rang du mot le plus rare : sert à présenter les phrases de la plus
    // accessible à la plus exigeante.
    rangMax: Math.max(...groupes.map((g) => (g.length ? Math.min(...g) : 9999))),
  };
}).sort((a, b) => a.rangMax - b.rangMax);

export const TOTAL_PHRASES = PHRASES.length;

/**
 * Phrases entièrement compréhensibles avec le vocabulaire déjà rencontré.
 * @param {(wordId: number) => boolean} estConnu
 */
export function disponibles(estConnu) {
  return PHRASES.filter((p) => p.groupes.every((g) => g.some(estConnu)));
}

/** Prochaine phrase à débloquer, et ce qu'il manque pour y arriver. */
export function prochaineADebloquer(estConnu) {
  for (const p of PHRASES) {
    const manquants = p.groupes.filter((g) => !g.some(estConnu));
    if (manquants.length) return { phrase: p, motsManquants: manquants.length };
  }
  return null;
}
