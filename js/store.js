/**
 * État central de l'application : réglages, cartes, historique, synchronisation.
 *
 * Deux modes :
 *   - « local » : tout reste dans ce navigateur (localStorage) ;
 *   - « cloud » : compte Supabase, avec le stockage local qui sert de cache
 *     et de file d'attente hors-ligne.
 */
import { WORDS, TOTAL_WORDS } from './data/words.js';
import * as srs from './srs.js';
import * as charge from './charge.js';
import * as supa from './supa.js';
import { cleJour, differer, minuit } from './util.js';

const JOUR = 86_400_000;
const HISTORIQUE_MAX = 15_000;
const HISTORIQUE_JOURS = 400;

export const REGLAGES_DEFAUT = {
  budgetMinutes: 15, // temps disponible par jour : c'est lui qui pilote le reste
  pilotageAuto: true, // adapte le nombre de nouveaux mots à la charge réelle
  pauseAutoSangsues: true, // met de côté les mots qui font perdre du temps
  objectifQuotidien: 30,
  limiteNouvelles: 12, // plafond haut ; le pilotage automatique reste en dessous
  limiteRevisions: 150,
  modeEtude: 'ecoute', // 'ecoute' | 'rappel' | 'mixte'
  lectureAuto: true,
  vitesse: 0.9,
  vitessePratique: 1, // les exercices se font à vitesse naturelle, volontairement
  recordTirRapide: 0,
  voixUri: null,
  afficherRomaji: true,
  afficherKanji: true,
  kanjiQuestion: true, // le kanji visible pendant l'écoute, avant la réponse
  animations: true,
  ordreNouvelles: 'frequence', // 'frequence' | 'aleatoire'
  theme: 'sombre', // 'sombre' | 'clair'
  testNiveauFait: false, // le test de départ n'est proposé qu'une fois
  grammaireFaite: [], // identifiants des leçons de grammaire validées
};

const etat = {
  utilisateur: null, // { id, email, pseudo }
  mode: 'local',
  pret: false,
  synchro: 'inactif', // 'inactif' | 'en cours' | 'erreur' | 'hors-ligne'
  reglages: { ...REGLAGES_DEFAUT },
  cartes: new Map(), // word_id -> carte
  revisions: [], // { word_id, note, mode, fait_le, duree_ms }
};

const salies = new Set();
let enAttenteRevisions = [];
const abonnes = new Set();

/* ------------------------------------------------------------- abonnement */

export function abonner(fn) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}

function notifier() {
  for (const fn of abonnes) fn(etat);
}

export function lire() {
  return etat;
}

/* -------------------------------------------------------- stockage local */

function cleStockage() {
  return `gabponais.data.${etat.utilisateur?.id ?? 'local'}`;
}

function sauverLocal() {
  try {
    const donnees = {
      v: 1,
      reglages: etat.reglages,
      cartes: [...etat.cartes.values()].filter((c) => c.etat !== srs.ETAT.NOUVELLE || c.suspendue),
      revisions: elaguerHistorique(etat.revisions),
      salies: [...salies],
      enAttenteRevisions,
    };
    localStorage.setItem(cleStockage(), JSON.stringify(donnees));
  } catch {
    /* quota dépassé ou stockage bloqué : on continue sans cache */
  }
}

const sauverLocalDiffere = differer(sauverLocal, 400);

function chargerLocal() {
  try {
    const brut = localStorage.getItem(cleStockage());
    if (!brut) return null;
    return JSON.parse(brut);
  } catch {
    return null;
  }
}

function elaguerHistorique(revisions) {
  const limite = Date.now() - HISTORIQUE_JOURS * JOUR;
  const gardees = revisions.filter((r) => new Date(r.fait_le).getTime() >= limite);
  return gardees.length > HISTORIQUE_MAX ? gardees.slice(-HISTORIQUE_MAX) : gardees;
}

/* ------------------------------------------------------------ initialisation */

function cartesParDefaut() {
  const m = new Map();
  for (const w of WORDS) m.set(w.id, srs.carteNeuve(w.id));
  return m;
}

function fusionner(lignes) {
  const m = cartesParDefaut();
  for (const l of lignes) {
    if (!m.has(l.word_id)) continue;
    m.set(l.word_id, {
      word_id: l.word_id,
      etat: l.etat ?? 0,
      du: l.du ?? null,
      intervalle: Number(l.intervalle ?? 0),
      facilite: Number(l.facilite ?? 2.5),
      palier: l.palier ?? 0,
      reps: l.reps ?? 0,
      oublis: l.oublis ?? 0,
      derniere: l.derniere ?? null,
      premiere: l.premiere ?? l.derniere ?? null,
      origine: l.origine ?? null,
      suspendue: !!l.suspendue,
    });
  }
  return m;
}

/** Prépare l'état pour un utilisateur donné (ou le mode local si `utilisateur` est null). */
export async function initialiser(utilisateur) {
  etat.utilisateur = utilisateur;
  etat.mode = utilisateur ? 'cloud' : 'local';
  etat.pret = false;
  salies.clear();
  enAttenteRevisions = [];
  notifier();

  const cache = chargerLocal();
  etat.reglages = { ...REGLAGES_DEFAUT, ...(cache?.reglages ?? {}) };
  etat.cartes = fusionner(cache?.cartes ?? []);
  etat.revisions = cache?.revisions ?? [];
  for (const id of cache?.salies ?? []) salies.add(id);
  enAttenteRevisions = cache?.enAttenteRevisions ?? [];

  appliquerTheme();

  if (utilisateur) {
    try {
      etat.synchro = 'en cours';
      notifier();
      const [profil, cartes, revisions] = await Promise.all([
        supa.chargerProfil(utilisateur.id),
        supa.chargerCartes(utilisateur.id),
        supa.chargerRevisions(utilisateur.id, new Date(Date.now() - HISTORIQUE_JOURS * JOUR).toISOString()),
      ]);
      if (profil?.reglages) etat.reglages = { ...REGLAGES_DEFAUT, ...profil.reglages };
      if (profil?.pseudo) etat.utilisateur.pseudo = profil.pseudo;
      // Le serveur fait foi, sauf pour ce qui n'a pas encore été poussé.
      const distantes = fusionner(cartes);
      for (const id of salies) {
        const locale = etat.cartes.get(id);
        if (locale) distantes.set(id, locale);
      }
      etat.cartes = distantes;
      etat.revisions = elaguerHistorique(revisions);
      etat.synchro = 'inactif';
      appliquerTheme();
      await pousser();
    } catch (e) {
      console.warn('Synchronisation impossible :', e);
      etat.synchro = 'hors-ligne';
    }
  }

  etat.pret = true;
  sauverLocal();
  notifier();
}

/* ------------------------------------------------------------- réglages */

export function majReglages(champs) {
  etat.reglages = { ...etat.reglages, ...champs };
  appliquerTheme();
  sauverLocalDiffere();
  notifier();
  pousserProfilDiffere();
}

const pousserProfilDiffere = differer(async () => {
  if (!etat.utilisateur) return;
  try {
    await supa.enregistrerProfil(etat.utilisateur.id, {
      pseudo: etat.utilisateur.pseudo ?? null,
      reglages: etat.reglages,
    });
  } catch (e) {
    console.warn('Réglages non synchronisés :', e);
  }
}, 1200);

export function appliquerTheme() {
  document.documentElement.dataset.theme = etat.reglages.theme === 'clair' ? 'clair' : 'sombre';
  document.documentElement.dataset.anim = etat.reglages.animations === false ? 'off' : 'on';
}

/* --------------------------------------------------------------- cartes */

export function carte(wordId) {
  return etat.cartes.get(wordId);
}

export function toutesCartes() {
  return [...etat.cartes.values()];
}

/** Enregistre une réponse et fait avancer la carte. */
export function repondre(wordId, note, { mode = 'ecoute', dureeMs = 0 } = {}) {
  const avant = etat.cartes.get(wordId);
  if (!avant) return null;
  const maintenant = Date.now();
  const { carte: apres } = srs.prochaine(avant, note, maintenant);
  if (!avant.premiere) apres.premiere = new Date(maintenant).toISOString();
  else apres.premiere = avant.premiere;

  // Un mot qu'on rate sans cesse mange un temps disproportionné sans rien
  // apprendre. Passé le seuil, on le met de côté plutôt que de le subir.
  if (etat.reglages.pauseAutoSangsues && !apres.suspendue && apres.oublis >= srs.SEUIL_PAUSE_AUTO) {
    apres.suspendue = true;
    apres.misEnPauseLe = new Date(maintenant).toISOString();
  }

  etat.cartes.set(wordId, apres);
  salies.add(wordId);

  const revision = {
    word_id: wordId,
    note,
    mode,
    fait_le: new Date(maintenant).toISOString(),
    duree_ms: Math.min(dureeMs, 600_000),
    intervalle_avant: avant.intervalle,
    intervalle_apres: apres.intervalle,
  };
  etat.revisions.push(revision);
  enAttenteRevisions.push(revision);

  sauverLocalDiffere();
  pousserDiffere();
  notifier();
  return apres;
}

export function suspendre(wordId, valeur) {
  const c = etat.cartes.get(wordId);
  if (!c) return;
  etat.cartes.set(wordId, { ...c, suspendue: valeur });
  salies.add(wordId);
  sauverLocalDiffere();
  pousserDiffere();
  notifier();
}

export function remettreAZeroCarte(wordId) {
  etat.cartes.set(wordId, srs.carteNeuve(wordId));
  salies.add(wordId);
  sauverLocalDiffere();
  pousserDiffere();
  notifier();
}

export async function toutRemettreAZero() {
  etat.cartes = cartesParDefaut();
  etat.revisions = [];
  salies.clear();
  enAttenteRevisions = [];
  sauverLocal();
  if (etat.utilisateur) {
    try {
      await supa.reinitialiserProgression(etat.utilisateur.id);
    } catch (e) {
      console.warn('Réinitialisation distante impossible :', e);
    }
  }
  notifier();
}

/* -------------------------------------------------------- synchronisation */

export async function pousser() {
  if (!etat.utilisateur) return;
  if (!salies.size && !enAttenteRevisions.length) return;

  const idsCartes = [...salies];
  const revisions = enAttenteRevisions;
  etat.synchro = 'en cours';
  notifier();

  try {
    if (idsCartes.length) {
      await supa.enregistrerCartes(
        etat.utilisateur.id,
        idsCartes.map((id) => ({ ...etat.cartes.get(id), premiere: etat.cartes.get(id).premiere })),
      );
      for (const id of idsCartes) salies.delete(id);
    }
    if (revisions.length) {
      await supa.enregistrerRevisions(etat.utilisateur.id, revisions);
      enAttenteRevisions = enAttenteRevisions.slice(revisions.length);
    }
    etat.synchro = 'inactif';
  } catch (e) {
    console.warn('Envoi différé (hors-ligne ?) :', e);
    etat.synchro = 'hors-ligne';
  }
  sauverLocal();
  notifier();
}

const pousserDiffere = differer(pousser, 2500);

export function forcerEnvoi() {
  sauverLocal();
  return pousser();
}

window.addEventListener('pagehide', () => {
  sauverLocal();
  if (etat.utilisateur && (salies.size || enAttenteRevisions.length)) pousser();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    sauverLocal();
    if (etat.utilisateur) pousser();
  }
});
window.addEventListener('online', () => {
  if (etat.utilisateur) pousser();
});

/* --------------------------------------------------------- statistiques */

export function statsDuJour() {
  const aujourdHui = cleJour();
  let revisionsFaites = 0;
  let bonnes = 0;
  for (let i = etat.revisions.length - 1; i >= 0; i--) {
    const r = etat.revisions[i];
    if (cleJour(new Date(r.fait_le)) !== aujourdHui) break;
    revisionsFaites += 1;
    if (r.note >= 3) bonnes += 1;
  }
  let nouvellesFaites = 0;
  for (const c of etat.cartes.values()) {
    if (c.premiere && cleJour(new Date(c.premiere)) === aujourdHui) nouvellesFaites += 1;
  }
  return {
    revisionsFaites,
    bonnes,
    nouvellesFaites,
    precision: revisionsFaites ? Math.round((bonnes / revisionsFaites) * 100) : null,
    objectif: etat.reglages.objectifQuotidien,
    objectifAtteint: revisionsFaites >= etat.reglages.objectifQuotidien,
  };
}

export function compteurs(maintenant = Date.now()) {
  let nouvelles = 0;
  let dues = 0;
  let apprentissage = 0;
  let apprises = 0;
  let enCours = 0;
  let suspendues = 0;
  for (const c of etat.cartes.values()) {
    if (c.suspendue) {
      suspendues += 1;
      continue;
    }
    if (c.etat === srs.ETAT.NOUVELLE) {
      nouvelles += 1;
      continue;
    }
    if (srs.estApprise(c)) apprises += 1;
    else enCours += 1;
    if (new Date(c.du).getTime() <= maintenant) {
      dues += 1;
      if (c.etat !== srs.ETAT.REVISION) apprentissage += 1;
    }
  }
  const jour = statsDuJour();
  const autorisees = charge.nouvellesAutorisees({
    reglages: etat.reglages,
    revisions: etat.revisions,
    dues,
    faitesAujourdhui: jour.revisionsFaites,
    nouvellesFaites: jour.nouvellesFaites,
  });
  const nouvellesRestantes = Math.min(autorisees, nouvelles);
  return {
    nouvelles,
    dues,
    apprentissage,
    apprises,
    enCours,
    suspendues,
    vues: TOTAL_WORDS - nouvelles - suspendues,
    total: TOTAL_WORDS,
    nouvellesRestantes,
    aFaire: Math.min(dues, etat.reglages.limiteRevisions) + nouvellesRestantes,
  };
}

/** Diagnostic de charge du jour, pour prévenir avant que la dette ne s'installe. */
export function diagnosticCharge() {
  const c = compteurs();
  const jour = statsDuJour();
  return charge.diagnostic({
    reglages: etat.reglages,
    revisions: etat.revisions,
    dues: c.dues,
    faitesAujourdhui: jour.revisionsFaites,
  });
}

/** Charge attendue en régime stable si l'on garde ce rythme de nouveautés. */
export function chargeRegime(nouvellesParJour) {
  return charge.chargeRegime(nouvellesParJour, etat.revisions);
}

export function capaciteQuotidienne() {
  return charge.capaciteQuotidienne(etat.reglages, etat.revisions);
}

export function couvertureEstimee() {
  return charge.couverture(compteurs().vues);
}

/** Nombre de mots dont la connaissance a réellement été vérifiée en révision. */
export function motsVerifies() {
  let n = 0;
  for (const c of etat.cartes.values()) if (srs.estConfirme(c)) n += 1;
  return n;
}

/** Couverture calculée sur les seuls mots vérifiés — la seule honnête. */
export function couvertureVerifiee() {
  return charge.couverture(motsVerifies());
}

/**
 * Sur combien de jours répartir un lot de mots reconnus au test de niveau,
 * pour rester sous la capacité quotidienne.
 */
export function etalementEstime(nombre) {
  if (!nombre) return { jours: 0, parJour: 0 };
  const capacite = charge.capaciteQuotidienne(etat.reglages, etat.revisions);
  const jours = Math.min(21, Math.max(3, Math.ceil(nombre / Math.max(1, capacite * 0.6))));
  return { jours, parJour: Math.ceil(nombre / jours) };
}

/**
 * Applique le résultat du test de niveau.
 * Les mots reconnus entrent en révision à courte échéance, échelonnée : ils
 * ne sont pas déclarés acquis, puisque les reconnaître à l'oreille reste à
 * vérifier, et l'étalement évite la vague de révisions du lendemain.
 */
export function appliquerNiveau(ids) {
  const maintenant = Date.now();
  const { jours } = etalementEstime(ids.length);

  ids.forEach((id, i) => {
    const c = etat.cartes.get(id);
    if (!c || c.etat !== srs.ETAT.NOUVELLE) return;
    const jour = 1 + Math.floor((i / Math.max(1, ids.length)) * jours);
    etat.cartes.set(id, {
      ...c,
      etat: srs.ETAT.REVISION,
      intervalle: jour,
      facilite: 2.5,
      palier: 0,
      reps: 1,
      oublis: 0,
      origine: 'test', // connaissance estimée, pas encore vérifiée en révision
      premiere: new Date(maintenant).toISOString(),
      derniere: new Date(maintenant).toISOString(),
      du: new Date(maintenant + jour * JOUR).toISOString(),
      suspendue: false,
    });
    salies.add(id);
  });

  etat.reglages = { ...etat.reglages, testNiveauFait: true };
  sauverLocal();
  notifier();
  pousser();
}

/** Nombre de révisions par jour, indexé par clé de jour. */
export function parJour() {
  const m = new Map();
  for (const r of etat.revisions) {
    const k = cleJour(new Date(r.fait_le));
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

export function serie() {
  const jours = parJour();
  let n = 0;
  const curseur = minuit();
  // La série reste valide tant que la journée d'aujourd'hui n'est pas terminée.
  if (!jours.has(cleJour(curseur))) curseur.setTime(curseur.getTime() - JOUR);
  while (jours.has(cleJour(curseur))) {
    n += 1;
    curseur.setTime(curseur.getTime() - JOUR);
  }
  return n;
}

export function meilleureSerie() {
  const cles = [...parJour().keys()].sort();
  let meilleure = 0;
  let courante = 0;
  let precedent = null;
  for (const k of cles) {
    const d = new Date(k);
    if (precedent && Math.round((d - precedent) / JOUR) === 1) courante += 1;
    else courante = 1;
    meilleure = Math.max(meilleure, courante);
    precedent = d;
  }
  return meilleure;
}

export function retention(jours = 30) {
  const limite = Date.now() - jours * JOUR;
  let total = 0;
  let bonnes = 0;
  for (const r of etat.revisions) {
    if (new Date(r.fait_le).getTime() < limite) continue;
    // On ne compte que les vraies révisions, pas les premiers apprentissages.
    if (r.intervalle_avant !== undefined && r.intervalle_avant < 1) continue;
    total += 1;
    if (r.note >= 3) bonnes += 1;
  }
  return total ? { taux: Math.round((bonnes / total) * 100), total } : { taux: null, total: 0 };
}

export function progressionParPalier() {
  const paliers = new Map();
  for (const w of WORDS) {
    const c = etat.cartes.get(w.id);
    const p = paliers.get(w.palier) ?? { total: 0, vues: 0, apprises: 0 };
    p.total += 1;
    if (c.etat !== srs.ETAT.NOUVELLE) p.vues += 1;
    if (srs.estApprise(c)) p.apprises += 1;
    paliers.set(w.palier, p);
  }
  return paliers;
}

export function sangsues() {
  return [...etat.cartes.values()].filter(srs.estSangsue).sort((a, b) => b.oublis - a.oublis);
}
