// Petits utilitaires partagés : DOM, dates, formats.

export function h(tag, attrs = {}, ...enfants) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of enfants.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const $ = (sel, racine = document) => racine.querySelector(sel);
export const $$ = (sel, racine = document) => [...racine.querySelectorAll(sel)];

export function vide(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

const JOUR = 86_400_000;

/** Clé de jour locale « AAAA-MM-JJ » (et non UTC : la journée doit coller au fuseau). */
export function cleJour(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export function jourDepuisCle(cle) {
  const [a, m, j] = cle.split('-').map(Number);
  return new Date(a, m - 1, j);
}

export function minuit(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function ecartJours(a, b) {
  return Math.round((minuit(a) - minuit(b)) / JOUR);
}

/** « dans 3 j », « 12 min », « 2,4 mois » — utilisé sur les boutons de notation. */
export function dureeCourte(ms) {
  const min = ms / 60_000;
  if (min < 1) return '<1 min';
  if (min < 60) return `${Math.round(min)} min`;
  const heures = min / 60;
  if (heures < 24) return `${Math.round(heures)} h`;
  const jours = heures / 24;
  if (jours < 31) return `${Math.round(jours)} j`;
  const mois = jours / 30.44;
  if (mois < 12) return `${arrondi(mois, 1)} mois`;
  return `${arrondi(jours / 365.25, 1)} an${jours / 365.25 >= 2 ? 's' : ''}`;
}

export function arrondi(n, d = 0) {
  const f = 10 ** d;
  return String(Math.round(n * f) / f).replace('.', ',');
}

export function pct(n, total) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

export function dateFr(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function dateCourteFr(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export function pluriel(n, singulier, plurielMot = singulier + 's') {
  return `${n} ${n >= 2 ? plurielMot : singulier}`;
}

/** Regroupe un appel pour ne l'exécuter qu'après un temps de calme. */
export function differer(fn, delai = 800) {
  let t = null;
  const differee = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delai);
  };
  differee.immediat = (...args) => {
    clearTimeout(t);
    fn(...args);
  };
  return differee;
}

export function toast(message, type = 'info') {
  let zone = $('#toasts');
  if (!zone) {
    zone = h('div', { id: 'toasts', class: 'toasts' });
    document.body.append(zone);
  }
  const el = h('div', { class: `toast toast--${type}`, text: message });
  zone.append(el);
  setTimeout(() => el.classList.add('toast--out'), 3200);
  setTimeout(() => el.remove(), 3700);
}
