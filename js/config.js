/**
 * Configuration Supabase.
 *
 * Renseigne ici l'URL et la clé « anon » de ton projet (Supabase > Project Settings > API).
 * Ces deux valeurs sont publiques par nature : la sécurité repose sur les règles RLS
 * définies dans supabase/schema.sql, pas sur le secret de la clé.
 *
 * Tu peux aussi laisser vide et renseigner les valeurs directement dans l'application
 * (page Réglages > Synchronisation) : elles seront stockées dans ce navigateur.
 */
export const SUPABASE_URL = 'https://whxywbwwxvlrzvcyxdvj.supabase.co/rest/v1/';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeHl3Ynd3eHZscnp2Y3l4ZHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NDk3OTMsImV4cCI6MjEwMjUyNTc5M30.vWwsjywZa_rm5pHaRjpAUbcto__Pfbj2eYMhsqkBfDE';

const CLE_LOCALE = 'gabponais.supabase';

export function configEffective() {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY, source: 'fichier' };
  }
  try {
    const brut = localStorage.getItem(CLE_LOCALE);
    if (brut) {
      const { url, key } = JSON.parse(brut);
      if (url && key) return { url, key, source: 'navigateur' };
    }
  } catch {
    /* stockage indisponible */
  }
  return null;
}

export function estConfigure() {
  return configEffective() !== null;
}

export function enregistrerConfigLocale(url, key) {
  localStorage.setItem(CLE_LOCALE, JSON.stringify({ url: url.trim(), key: key.trim() }));
}

export function effacerConfigLocale() {
  localStorage.removeItem(CLE_LOCALE);
}
