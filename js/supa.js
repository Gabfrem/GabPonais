/**
 * Couche Supabase : authentification + persistance.
 * Le client est chargé à la demande depuis un CDN ESM (aucune étape de build).
 * Si Supabase n'est pas configuré ou injoignable, l'application bascule en mode local.
 */
import { configEffective } from './config.js';

export { estConfigure } from './config.js';

const CDN = 'https://esm.sh/@supabase/supabase-js@2';

let client = null;
let initialisation = null;
let erreurInit = null;

export function erreurConnexionCdn() {
  return erreurInit;
}

export async function obtenirClient() {
  if (client) return client;
  const cfg = configEffective();
  if (!cfg) return null;
  if (!initialisation) {
    initialisation = (async () => {
      try {
        const { createClient } = await import(/* @vite-ignore */ CDN);
        client = createClient(cfg.url, cfg.key, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
        return client;
      } catch (e) {
        erreurInit = e;
        initialisation = null;
        return null;
      }
    })();
  }
  return initialisation;
}

/* ------------------------------------------------------------------ auth */

export async function sessionCourante() {
  const c = await obtenirClient();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  return data.session ?? null;
}

export async function surChangementAuth(callback) {
  const c = await obtenirClient();
  if (!c) return () => {};
  const { data } = c.auth.onAuthStateChange((_evt, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

/**
 * Exécute un appel d'authentification en ramenant toutes les défaillances
 * (erreur renvoyée ou exception réseau) à un message lisible en français.
 */
async function appelAuth(action) {
  const c = await obtenirClient();
  if (!c) throw new Error('Supabase n’est pas configuré.');
  let reponse;
  try {
    reponse = await action(c);
  } catch (e) {
    throw new Error(traduireErreur(e?.message ?? String(e)));
  }
  if (reponse?.error) throw new Error(traduireErreur(reponse.error.message));
  return reponse?.data;
}

export function inscription(email, motDePasse, pseudo) {
  return appelAuth((c) => c.auth.signUp({ email, password: motDePasse, options: { data: { pseudo } } }));
}

export function connexion(email, motDePasse) {
  return appelAuth((c) => c.auth.signInWithPassword({ email, password: motDePasse }));
}

export function motDePasseOublie(email) {
  return appelAuth((c) => c.auth.resetPasswordForEmail(email, { redirectTo: window.location.href }));
}

export async function deconnexion() {
  const c = await obtenirClient();
  if (c) await c.auth.signOut();
}

function traduireErreur(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (m.includes('user already registered')) return 'Un compte existe déjà avec cet e-mail.';
  if (m.includes('password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères.';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'Adresse e-mail invalide.';
  if (m.includes('email not confirmed')) return 'E-mail non confirmé : vérifie ta boîte de réception.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives, réessaie dans un instant.';
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
    return 'Serveur injoignable : vérifie ta connexion et l’URL du projet Supabase.';
  }
  return msg;
}

/* ----------------------------------------------------------------- profil */

export async function chargerProfil(userId) {
  const c = await obtenirClient();
  if (!c) return null;
  const { data, error } = await c.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function enregistrerProfil(userId, champs) {
  const c = await obtenirClient();
  if (!c) return;
  const { error } = await c
    .from('profiles')
    .upsert({ id: userId, ...champs, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/* ----------------------------------------------------------- progression */

export async function chargerCartes(userId) {
  const c = await obtenirClient();
  if (!c) return [];
  const tout = [];
  const taille = 1000;
  for (let debut = 0; ; debut += taille) {
    const { data, error } = await c
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .range(debut, debut + taille - 1);
    if (error) throw error;
    tout.push(...data);
    if (data.length < taille) break;
  }
  return tout;
}

export async function enregistrerCartes(userId, cartes) {
  const c = await obtenirClient();
  if (!c || !cartes.length) return;
  const lignes = cartes.map((k) => ({
    user_id: userId,
    word_id: k.word_id,
    etat: k.etat,
    du: k.du,
    intervalle: k.intervalle,
    facilite: k.facilite,
    palier: k.palier,
    reps: k.reps,
    oublis: k.oublis,
    derniere: k.derniere,
    premiere: k.premiere ?? null,
    origine: k.origine ?? null,
    suspendue: k.suspendue,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await c.from('progress').upsert(lignes, { onConflict: 'user_id,word_id' });
  if (error) throw error;
}

export async function enregistrerRevisions(userId, revisions) {
  const c = await obtenirClient();
  if (!c || !revisions.length) return;
  const lignes = revisions.map((r) => ({
    user_id: userId,
    word_id: r.word_id,
    note: r.note,
    mode: r.mode,
    fait_le: r.fait_le,
    duree_ms: r.duree_ms,
    intervalle_avant: r.intervalle_avant,
    intervalle_apres: r.intervalle_apres,
  }));
  const { error } = await c.from('reviews').insert(lignes);
  if (error) throw error;
}

export async function chargerRevisions(userId, depuis) {
  const c = await obtenirClient();
  if (!c) return [];
  const tout = [];
  const taille = 1000;
  for (let debut = 0; ; debut += taille) {
    const { data, error } = await c
      .from('reviews')
      .select('word_id, note, mode, fait_le, duree_ms')
      .eq('user_id', userId)
      .gte('fait_le', depuis)
      .order('fait_le', { ascending: true })
      .range(debut, debut + taille - 1);
    if (error) throw error;
    tout.push(...data);
    if (data.length < taille) break;
    if (tout.length > 60_000) break; // garde-fou
  }
  return tout;
}

export async function reinitialiserProgression(userId) {
  const c = await obtenirClient();
  if (!c) return;
  const r1 = await c.from('progress').delete().eq('user_id', userId);
  if (r1.error) throw r1.error;
  const r2 = await c.from('reviews').delete().eq('user_id', userId);
  if (r2.error) throw r2.error;
}
