import { h, animationsCoupees, nombreAnime } from '../util.js';

let compteurId = 0;

/** Anneau de progression (SVG) avec dégradé violet → sakura. */
export function anneau({ pourcentage, valeur, libelle, taille = 138, epaisseur = 11 }) {
  const id = `anneau-${++compteurId}`;
  const r = (taille - epaisseur) / 2;
  const circonference = 2 * Math.PI * r;
  const rempli = (Math.max(0, Math.min(100, pourcentage)) / 100) * circonference;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', taille);
  svg.setAttribute('height', taille);
  svg.innerHTML = `
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--violet)" />
        <stop offset="1" stop-color="var(--sakura)" />
      </linearGradient>
    </defs>
    <circle class="anneau__piste" cx="${taille / 2}" cy="${taille / 2}" r="${r}" stroke-width="${epaisseur}" />
    <circle class="anneau__trait" cx="${taille / 2}" cy="${taille / 2}" r="${r}" stroke-width="${epaisseur}"
            stroke="url(#${id})" stroke-dasharray="${animationsCoupees() ? rempli : 0} ${circonference}" />`;

  if (!animationsCoupees()) {
    // Le trait part de zéro : la transition CSS ne se déclenche qu'au changement.
    const trait = svg.querySelector('.anneau__trait');
    const remplir = () => trait.setAttribute('stroke-dasharray', `${rempli} ${circonference}`);
    requestAnimationFrame(() => requestAnimationFrame(remplir));
    // Idempotent, et indispensable si l'onglet est en arrière-plan : sans
    // requestAnimationFrame, l'anneau resterait vide.
    setTimeout(remplir, 300);
  }

  return h(
    'div',
    { class: 'anneau', style: { width: `${taille}px`, height: `${taille}px` } },
    svg,
    h(
      'div',
      { class: 'anneau__centre' },
      h(
        'div',
        {},
        h(
          'div',
          { class: 'anneau__val' },
          Number.isFinite(Number(valeur)) ? nombreAnime(Number(valeur)) : String(valeur),
        ),
        h('div', { class: 'anneau__lib', text: libelle }),
      ),
    ),
  );
}

/** Boîte de dialogue de confirmation. */
export function confirmer({ titre, texte, valider = 'Confirmer', danger = false }) {
  return new Promise((resolve) => {
    const fermer = (v) => {
      document.removeEventListener('keydown', surTouche);
      fond.remove();
      resolve(v);
    };
    const surTouche = (e) => {
      if (e.key === 'Escape') fermer(false);
      if (e.key === 'Enter') fermer(true);
    };
    const fond = h(
      'div',
      { class: 'modale', onclick: (e) => e.target === fond && fermer(false) },
      h(
        'div',
        { class: 'modale__boite' },
        h('h3', { style: { fontSize: '19px', marginBottom: '10px' }, text: titre }),
        h('p', { style: { color: 'var(--texte-2)', fontSize: '14px' }, text: texte }),
        h(
          'div',
          { class: 'modale__actions' },
          h('button', { class: 'btn btn--fantome', text: 'Annuler', onclick: () => fermer(false) }),
          h('button', {
            class: `btn ${danger ? 'btn--danger' : 'btn--principal'}`,
            text: valider,
            onclick: () => fermer(true),
          }),
        ),
      ),
    );
    document.body.append(fond);
    document.addEventListener('keydown', surTouche);
  });
}

/** Grille type « calendrier de contributions » sur N semaines. */
export function calendrier(parJour, semaines = 20) {
  const JOUR = 86_400_000;
  const fin = new Date();
  fin.setHours(0, 0, 0, 0);
  // On démarre au lundi de la semaine la plus ancienne affichée.
  const debut = new Date(fin.getTime() - (semaines * 7 - 1) * JOUR);
  const decalage = (debut.getDay() + 6) % 7;
  debut.setTime(debut.getTime() - decalage * JOUR);

  const grille = h('div', { class: 'calendrier' });
  const max = Math.max(1, ...parJour.values());

  for (let s = 0; s < semaines + 1; s++) {
    const colonne = h('div', { class: 'calendrier__sem' });
    for (let j = 0; j < 7; j++) {
      const d = new Date(debut.getTime() + (s * 7 + j) * JOUR);
      if (d > fin) {
        colonne.append(h('div', { class: 'calendrier__jour', style: { visibility: 'hidden' } }));
        continue;
      }
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const n = parJour.get(cle) ?? 0;
      const niveau = n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4));
      colonne.append(
        h('div', {
          class: 'calendrier__jour',
          'data-n': String(niveau),
          title: `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${n} révision${n > 1 ? 's' : ''}`,
        }),
      );
    }
    grille.append(colonne);
  }

  return h(
    'div',
    {},
    grille,
    h(
      'div',
      { class: 'calendrier__leg' },
      'moins',
      ...[0, 1, 2, 3, 4].map((n) => h('div', { class: 'calendrier__jour', 'data-n': String(n) })),
      'plus',
    ),
  );
}
