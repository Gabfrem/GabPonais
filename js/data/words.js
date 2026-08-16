import p1 from './p1.js';
import p2 from './p2.js';
import p3 from './p3.js';
import p4 from './p4.js';
import p5 from './p5.js';
import p6 from './p6.js';
import p7 from './p7.js';
import p8 from './p8.js';
import p9 from './p9.js';
import p10 from './p10.js';

const RAW = [...p1, ...p2, ...p3, ...p4, ...p5, ...p6, ...p7, ...p8, ...p9, ...p10];

/**
 * Les mots sont classés par fréquence approximative d'usage.
 * `id` est stable : c'est la clé utilisée en base de données.
 * On ne demande jamais d'écrire les kanji — ils ne servent que de repère visuel.
 */
export const WORDS = RAW.map(([kanji, kana, romaji, fr, pos], i) => ({
  id: i + 1,
  rank: i + 1,
  kanji,
  kana,
  romaji,
  fr,
  pos,
  palier: Math.floor(i / 100) + 1,
}));

// Certains mots partagent exactement la même prononciation (そこ = « là » / « le fond »).
// En mode écoute, on affiche alors un indice pour que la question reste répondable.
const kanaCount = WORDS.reduce((m, w) => m.set(w.kana, (m.get(w.kana) || 0) + 1), new Map());
for (const w of WORDS) w.homophone = kanaCount.get(w.kana) > 1;

export const TOTAL_WORDS = WORDS.length;

export const BY_ID = new Map(WORDS.map((w) => [w.id, w]));

export const PALIERS = [
  { n: 1, nom: 'Premiers pas', from: 1, to: 100 },
  { n: 2, nom: 'Quotidien', from: 101, to: 200 },
  { n: 3, nom: 'Autour de soi', from: 201, to: 300 },
  { n: 4, nom: 'Échanges', from: 301, to: 400 },
  { n: 5, nom: 'Actions', from: 401, to: 500 },
  { n: 6, nom: 'Nuances', from: 501, to: 600 },
  { n: 7, nom: 'Société', from: 601, to: 700 },
  { n: 8, nom: 'Repères', from: 701, to: 800 },
  { n: 9, nom: 'Corps & liens', from: 801, to: 900 },
  { n: 10, nom: 'Maîtrise', from: 901, to: 1000 },
];

export const POS_LIST = [...new Set(WORDS.map((w) => w.pos))].sort();

export function paliersDe(id) {
  return PALIERS.find((p) => id >= p.from && id <= p.to);
}
