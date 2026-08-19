/**
 * Pilotage de la charge de révision.
 *
 * Le piège classique des applications à répétition espacée : on choisit un
 * nombre de nouveaux mots par jour, et la charge de révision qui en découle
 * n'apparaît que des semaines plus tard, quand il est trop tard. Ici on
 * raisonne à l'envers — on part du temps réellement disponible, et on en
 * déduit combien de nouveaux mots sont soutenables.
 *
 * Ordre de grandeur : un mot introduit chaque jour finit par produire environ
 * cinq révisions quotidiennes en régime stable (deux passages d'apprentissage
 * le premier jour, puis des intervalles croissants dont la somme des inverses
 * avoisine 1,5, le tout majoré par les oublis). D'où le facteur ci-dessous.
 */

const COUT_REGIME = 5;
const SECONDES_DEFAUT = 8;
const MIN_ECHANTILLON = 15;

/** Temps médian passé par carte, mesuré sur l'historique réel. */
export function secondesParCarte(revisions) {
  const durees = revisions
    .slice(-200)
    .map((r) => r.duree_ms)
    .filter((d) => typeof d === 'number' && d > 500 && d < 60_000)
    .sort((a, b) => a - b);
  if (durees.length < MIN_ECHANTILLON) return SECONDES_DEFAUT;
  const mediane = durees[Math.floor(durees.length / 2)] / 1000;
  return Math.min(30, Math.max(3, mediane));
}

/** Nombre de cartes que le budget quotidien permet réellement de traiter. */
export function capaciteQuotidienne(reglages, revisions) {
  const budget = reglages.budgetMinutes ?? 15;
  return Math.max(5, Math.round((budget * 60) / secondesParCarte(revisions)));
}

/**
 * Nouveaux mots qu'il reste permis d'introduire maintenant.
 * Trois garde-fous se cumulent : le plafond choisi, la place qui reste dans la
 * journée, et le rythme soutenable sur la durée. C'est le dernier qui évite
 * l'effet boule de neige, invisible sur le moment.
 */
export function nouvellesAutorisees({ reglages, revisions, dues, faitesAujourdhui, nouvellesFaites }) {
  const plafond = Math.max(0, reglages.limiteNouvelles - nouvellesFaites);
  if (!reglages.pilotageAuto) return plafond;

  const capacite = capaciteQuotidienne(reglages, revisions);
  const place = Math.max(0, capacite - dues - faitesAujourdhui);
  const regime = Math.max(0, Math.floor(capacite / COUT_REGIME) - nouvellesFaites);

  // On ne consacre au plus que la moitié de la place restante aux nouveautés :
  // chaque nouveau mot demande deux passages dans la journée même.
  return Math.max(0, Math.min(Math.floor(place / 2), regime, plafond));
}

/** Charge de révision attendue en régime stable, au rythme actuel. */
export function chargeRegime(nouvellesParJour, revisions) {
  const cartes = Math.round(nouvellesParJour * COUT_REGIME);
  return { cartes, minutes: Math.round((cartes * secondesParCarte(revisions)) / 60) };
}

/**
 * Diagnostic de la charge du jour.
 * @returns {{niveau: 'calme'|'sain'|'tendu'|'surcharge', message: string, capacite: number, joursDeRetard: number}}
 */
export function diagnostic({ reglages, revisions, dues, faitesAujourdhui }) {
  const capacite = capaciteQuotidienne(reglages, revisions);
  const total = dues + faitesAujourdhui;
  const ratio = total / capacite;
  const joursDeRetard = dues > capacite ? Math.ceil(dues / capacite) : 0;

  if (dues > capacite * 2) {
    return {
      niveau: 'surcharge',
      capacite,
      joursDeRetard,
      message: `${dues} cartes en retard, soit environ ${joursDeRetard} jours à ton rythme. Les nouveautés sont suspendues et tu peux rattraper par tranches, sans tout avaler d'un coup.`,
    };
  }
  if (ratio > 1) {
    return {
      niveau: 'tendu',
      capacite,
      joursDeRetard,
      message: `Journée chargée : ${dues} cartes pour un budget d'environ ${capacite}. L'introduction de nouveaux mots est ralentie le temps que ça redescende.`,
    };
  }
  if (ratio < 0.35) {
    return {
      niveau: 'calme',
      capacite,
      joursDeRetard: 0,
      message: 'Charge légère. Tu peux augmenter le budget quotidien si tu veux avancer plus vite.',
    };
  }
  return { niveau: 'sain', capacite, joursDeRetard: 0, message: 'Charge équilibrée.' };
}

/**
 * Couverture approximative du vocabulaire dans la langue parlée courante.
 * Les paliers viennent des études de fréquence sur corpus oraux : les chiffres
 * sont des ordres de grandeur, pas des mesures sur un contenu précis.
 */
export function couverture(motsConnus) {
  const paliers = [
    [0, 0],
    [100, 42],
    [200, 51],
    [400, 60],
    [600, 65],
    [800, 69],
    [1000, 72],
  ];
  let bas = paliers[0];
  for (const p of paliers) {
    if (motsConnus >= p[0]) bas = p;
  }
  const haut = paliers[paliers.indexOf(bas) + 1] ?? bas;
  if (haut === bas) return bas[1];
  const t = (motsConnus - bas[0]) / (haut[0] - bas[0]);
  return Math.round(bas[1] + t * (haut[1] - bas[1]));
}

export const COUT_REGIME_PAR_MOT = COUT_REGIME;
