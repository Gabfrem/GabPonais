import { h, pct, cleJour, dateCourteFr, arrondi } from '../util.js';
import { TOTAL_WORDS } from '../data/words.js';
import * as store from '../store.js';
import * as srs from '../srs.js';
import { calendrier } from './composants.js';

const JOUR = 86_400_000;

export function vueStats() {
  const etat = store.lire();
  const c = store.compteurs();
  const jours = store.parJour();
  const serie = store.serie();
  const meilleure = store.meilleureSerie();
  const totalRevisions = etat.revisions.length;
  const tempsMs = etat.revisions.reduce((s, r) => s + (r.duree_ms || 0), 0);

  return h(
    'div',
    {},
    h(
      'div',
      { class: 'entete' },
      h(
        'div',
        {},
        h('h1', { class: 'entete__titre', text: 'Statistiques' }),
        h('p', { class: 'entete__sous', text: 'Ton activité sur les 400 derniers jours.' }),
      ),
    ),

    h(
      'section',
      { class: 'grille grille--4' },
      tuile('🔥', String(serie), 'série en cours'),
      tuile('🏆', String(meilleure), 'meilleure série'),
      tuile('🗂️', String(totalRevisions), 'révisions au total'),
      tuile('⏱️', formaterDuree(tempsMs), 'temps de pratique'),
    ),

    h(
      'section',
      { class: 'carte', style: { marginTop: '16px' } },
      h('h3', { class: 'carte__titre', text: 'Régularité' }),
      calendrier(jours, 20),
    ),

    h(
      'section',
      { class: 'grille grille--2', style: { marginTop: '16px' } },
      h(
        'div',
        { class: 'carte' },
        h('h3', { class: 'carte__titre', text: 'Révisions des 14 derniers jours' }),
        histogramme(derniersJours(jours, 14)),
      ),
      h(
        'div',
        { class: 'carte' },
        h('h3', { class: 'carte__titre', text: 'Charge prévue (14 jours)' }),
        histogramme(previsionSerie(14)),
      ),
    ),

    h(
      'section',
      { class: 'carte', style: { marginTop: '16px' } },
      h('h3', { class: 'carte__titre', text: 'Répartition du vocabulaire' }),
      h(
        'div',
        { class: 'repartition' },
        h('span', { style: { width: `${pct(c.apprises, TOTAL_WORDS)}%`, background: 'var(--menthe)' } }),
        h('span', { style: { width: `${pct(c.enCours, TOTAL_WORDS)}%`, background: 'var(--violet)' } }),
        h('span', { style: { width: `${pct(c.suspendues, TOTAL_WORDS)}%`, background: 'var(--rouge)' } }),
      ),
      h(
        'div',
        { class: 'legende' },
        legende('var(--menthe)', `${c.apprises} ancrés (intervalle ≥ 21 j)`),
        legende('var(--violet)', `${c.enCours} en cours`),
        legende('var(--rouge)', `${c.suspendues} en pause`),
        legende('var(--fond-2)', `${c.nouvelles} à découvrir`),
      ),
    ),

    h(
      'section',
      { class: 'grille grille--3', style: { marginTop: '16px' } },
      carteRetention(7),
      carteRetention(30),
      carteRetention(90),
    ),

    h(
      'section',
      { class: 'carte', style: { marginTop: '16px' } },
      h('h3', { class: 'carte__titre', text: 'Répartition des réponses (30 jours)' }),
      repartitionNotes(),
    ),
  );
}

function tuile(ico, valeur, libelle) {
  return h(
    'div',
    { class: 'carte' },
    h('div', { class: 'stat' }, h('div', { class: 'stat__ico', text: ico }), h('div', { class: 'stat__val', text: valeur }), h('div', { class: 'stat__lib', text: libelle })),
  );
}

function legende(couleur, texte) {
  return h('div', { class: 'legende__item' }, h('span', { class: 'legende__pastille', style: { background: couleur } }), texte);
}

function carteRetention(jours) {
  const r = store.retention(jours);
  return h(
    'div',
    { class: 'carte' },
    h('div', { class: 'stat__lib', text: `Taux de réussite — ${jours} jours` }),
    h('div', { class: 'stat__val', style: { marginTop: '6px' }, text: r.taux === null ? '—' : `${r.taux} %` }),
    h('div', { class: 'barre', style: { marginTop: '10px' } }, h('div', { class: 'barre__part', style: { width: `${r.taux ?? 0}%` } })),
    h('div', { class: 'stat__lib', style: { marginTop: '8px' }, text: `sur ${r.total} révisions de rappel` }),
  );
}

function derniersJours(parJour, n) {
  const out = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * JOUR);
    out.push({ label: dateCourteFr(d), valeur: parJour.get(cleJour(d)) ?? 0 });
  }
  return out;
}

function previsionSerie(n) {
  const brut = srs.prevision(store.toutesCartes(), n);
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return brut.map((valeur, i) => ({
    label: i === 0 ? "auj." : dateCourteFr(new Date(base.getTime() + i * JOUR)),
    valeur,
  }));
}

function histogramme(donnees) {
  const max = Math.max(1, ...donnees.map((d) => d.valeur));
  return h(
    'div',
    { class: 'histo' },
    ...donnees.map((d) =>
      h(
        'div',
        { class: 'histo__col', title: `${d.label} : ${d.valeur}` },
        h('span', { class: 'histo__val', text: d.valeur ? String(d.valeur) : '' }),
        h('div', {
          class: `histo__barre ${d.valeur ? '' : 'histo__barre--vide'}`,
          style: { height: `${Math.max(3, (d.valeur / max) * 110)}px` },
        }),
        h('span', { class: 'histo__lib', text: d.label }),
      ),
    ),
  );
}

function repartitionNotes() {
  const limite = Date.now() - 30 * JOUR;
  const compte = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const r of store.lire().revisions) {
    if (new Date(r.fait_le).getTime() >= limite) compte[r.note] = (compte[r.note] ?? 0) + 1;
  }
  const total = Object.values(compte).reduce((a, b) => a + b, 0);
  if (!total) {
    return h('p', { style: { color: 'var(--texte-3)', fontSize: '13.5px' }, text: 'Pas encore de données : lance une première session.' });
  }
  const couleurs = { 1: 'var(--rouge)', 2: 'var(--ambre)', 3: 'var(--menthe)', 4: 'var(--violet)' };
  return h(
    'div',
    {},
    h(
      'div',
      { class: 'repartition' },
      ...srs.NOTES.map((n) =>
        h('span', { style: { width: `${(compte[n.n] / total) * 100}%`, background: couleurs[n.n] } }),
      ),
    ),
    h(
      'div',
      { class: 'legende' },
      ...srs.NOTES.map((n) =>
        legende(couleurs[n.n], `${n.label} — ${compte[n.n]} (${arrondi((compte[n.n] / total) * 100, 1)} %)`),
      ),
    ),
  );
}

function formaterDuree(ms) {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const heures = minutes / 60;
  return `${arrondi(heures, 1)} h`;
}
