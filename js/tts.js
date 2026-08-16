/**
 * Prononciation japonaise via l'API Web Speech du navigateur.
 * Aucune clé, aucun réseau : les voix sont celles installées sur la machine.
 */

let voix = [];
let pretes = false;
const attentes = [];

function charger() {
  const v = speechSynthesis.getVoices();
  if (!v.length) return false;
  voix = v;
  pretes = true;
  while (attentes.length) attentes.shift()();
  return true;
}

if ('speechSynthesis' in window) {
  charger();
  speechSynthesis.addEventListener('voiceschanged', charger);
  // Certains navigateurs ne déclenchent l'événement qu'après un premier appel.
  setTimeout(charger, 250);
  setTimeout(charger, 1500);
}

export function supporte() {
  return 'speechSynthesis' in window;
}

export function pret() {
  return pretes;
}

export function quandPret(fn) {
  if (pretes) fn();
  else attentes.push(fn);
}

export function voixJaponaises() {
  return voix.filter((v) => v.lang && v.lang.toLowerCase().startsWith('ja'));
}

export function voixParUri(uri) {
  return voix.find((v) => v.voiceURI === uri) || null;
}

/** Meilleure voix disponible : celle choisie par l'utilisateur, sinon une voix japonaise. */
export function voixChoisie(uri) {
  return (uri && voixParUri(uri)) || voixJaponaises()[0] || null;
}

let courant = null;

export function stop() {
  if (!supporte()) return;
  courant = null;
  try {
    speechSynthesis.cancel();
  } catch {
    /* ignoré */
  }
}

/**
 * Prononce un texte japonais.
 * @returns {Promise<boolean>} false si aucune voix japonaise n'est disponible.
 */
export function dire(texte, { vitesse = 0.9, uri = null } = {}) {
  return new Promise((resolve) => {
    if (!supporte()) return resolve(false);
    stop();

    const u = new SpeechSynthesisUtterance(texte);
    const v = voixChoisie(uri);
    if (v) u.voice = v;
    u.lang = v?.lang || 'ja-JP';
    u.rate = vitesse;
    u.pitch = 1;

    let fini = false;
    const terminer = (ok) => {
      if (fini) return;
      fini = true;
      if (courant === u) courant = null;
      resolve(ok);
    };
    u.onend = () => terminer(true);
    u.onerror = () => terminer(false);

    courant = u;
    speechSynthesis.speak(u);

    // Chrome met parfois la synthèse en pause après ~15 s d'inactivité.
    setTimeout(() => {
      if (!fini && speechSynthesis.paused) speechSynthesis.resume();
    }, 200);
    setTimeout(() => terminer(true), 8000);
  });
}

/** Vrai si le système ne propose aucune voix japonaise (on prévient l'utilisateur). */
export function manqueVoixJa() {
  return pretes && voixJaponaises().length === 0;
}
