import { h, $ } from '../util.js';
import * as supa from '../supa.js';
import { estConfigure, enregistrerConfigLocale } from '../config.js';

/**
 * Écran de connexion / inscription.
 * @param {(user: object|null) => void} surEntree appelée avec l'utilisateur, ou null pour le mode local
 */
export function vueAuth(surEntree) {
  let onglet = 'connexion';
  const racine = h('div', { class: 'auth' });
  const boite = h('div', { class: 'auth__boite' });
  racine.append(boite);

  function message(texte, type = 'err') {
    const zone = $('.auth__message', boite);
    if (!zone) return;
    zone.replaceChildren(texte ? h('div', { class: type === 'ok' ? 'auth__ok' : 'auth__err', text: texte }) : '');
  }

  function rendre() {
    const configure = estConfigure();

    const form = h(
      'form',
      {
        class: 'auth__form',
        onsubmit: async (e) => {
          e.preventDefault();
          const bouton = $('button[type=submit]', form);
          const email = $('#email', form).value.trim();
          const mdp = $('#mdp', form).value;
          const pseudo = $('#pseudo', form)?.value.trim() || email.split('@')[0];
          message('');
          bouton.disabled = true;
          bouton.textContent = onglet === 'connexion' ? 'Connexion…' : 'Création…';
          try {
            if (onglet === 'connexion') {
              const { user } = await supa.connexion(email, mdp);
              surEntree(normaliser(user));
            } else {
              const { user, session } = await supa.inscription(email, mdp, pseudo);
              if (!session) {
                message(
                  'Compte créé. Vérifie ta boîte mail pour confirmer l’adresse, puis connecte-toi.',
                  'ok',
                );
                onglet = 'connexion';
                rendre();
                return;
              }
              surEntree(normaliser(user));
            }
          } catch (err) {
            message(err.message || 'Une erreur est survenue.');
            bouton.disabled = false;
            bouton.textContent = onglet === 'connexion' ? 'Se connecter' : 'Créer mon compte';
          }
        },
      },
      h('div', { class: 'auth__message' }),
      onglet === 'inscription' &&
        h(
          'label',
          { class: 'champ' },
          h('span', { class: 'champ__lib', text: 'Pseudo' }),
          h('input', { type: 'text', id: 'pseudo', placeholder: 'Gabin', autocomplete: 'nickname' }),
        ),
      h(
        'label',
        { class: 'champ' },
        h('span', { class: 'champ__lib', text: 'Adresse e-mail' }),
        h('input', {
          type: 'email',
          id: 'email',
          required: true,
          placeholder: 'toi@exemple.fr',
          autocomplete: 'email',
        }),
      ),
      h(
        'label',
        { class: 'champ' },
        h('span', { class: 'champ__lib', text: 'Mot de passe' }),
        h('input', {
          type: 'password',
          id: 'mdp',
          required: true,
          minlength: '6',
          placeholder: '••••••••',
          autocomplete: onglet === 'connexion' ? 'current-password' : 'new-password',
        }),
        onglet === 'inscription' && h('span', { class: 'champ__aide', text: '6 caractères minimum.' }),
      ),
      h('button', {
        type: 'submit',
        class: 'btn btn--principal btn--grand btn--bloc',
        text: onglet === 'connexion' ? 'Se connecter' : 'Créer mon compte',
      }),
      onglet === 'connexion' &&
        h('button', {
          type: 'button',
          class: 'nav__lien',
          style: { justifyContent: 'center', fontSize: '13px' },
          text: 'Mot de passe oublié ?',
          onclick: async () => {
            const email = $('#email', form).value.trim();
            if (!email) return message('Renseigne d’abord ton adresse e-mail.');
            try {
              await supa.motDePasseOublie(email);
              message('E-mail de réinitialisation envoyé.', 'ok');
            } catch (err) {
              message(err.message);
            }
          },
        }),
    );

    boite.replaceChildren(
      h(
        'div',
        { class: 'auth__carte' },
        h(
          'div',
          { class: 'auth__marque' },
          h('div', { class: 'auth__sceau ja', text: '語' }),
          h('h1', { class: 'auth__titre', text: 'GabPonais' }),
          h('p', {
            class: 'auth__sous',
            text: 'Les 1000 mots japonais les plus courants, appris à l’oreille.',
          }),
        ),
        configure
          ? h(
              'div',
              { class: 'auth__onglets' },
              h('button', {
                class: `auth__onglet ${onglet === 'connexion' ? 'auth__onglet--actif' : ''}`,
                text: 'Connexion',
                onclick: () => {
                  onglet = 'connexion';
                  rendre();
                },
              }),
              h('button', {
                class: `auth__onglet ${onglet === 'inscription' ? 'auth__onglet--actif' : ''}`,
                text: 'Créer un compte',
                onclick: () => {
                  onglet = 'inscription';
                  rendre();
                },
              }),
            )
          : null,
        configure ? form : vueConfiguration(),
        configure ? h('div', { class: 'auth__sep', text: 'ou' }) : null,
        configure
          ? h('button', {
              class: 'btn btn--fantome btn--bloc',
              text: 'Continuer sans compte (ce navigateur)',
              onclick: () => surEntree(null),
            })
          : null,
        h('p', {
          class: 'auth__pied',
          html: configure
            ? 'Ta progression est synchronisée entre tes appareils.<br />Aucune donnée n’est partagée avec des tiers.'
            : '',
        }),
      ),
    );
  }

  /** Affiché quand aucun projet Supabase n'est branché : on propose de le faire ici. */
  function vueConfiguration() {
    return h(
      'div',
      { class: 'auth__form' },
      h(
        'div',
        { class: 'bandeau bandeau--info', style: { marginBottom: '4px' } },
        h('span', { class: 'bandeau__ico', text: 'ℹ️' }),
        h(
          'span',
          {},
          'Aucun projet Supabase n’est relié. Tu peux commencer tout de suite en mode local, ou coller tes identifiants pour activer les comptes.',
        ),
      ),
      h('button', {
        class: 'btn btn--principal btn--grand btn--bloc',
        text: 'Commencer sans compte',
        onclick: () => surEntree(null),
      }),
      h('div', { class: 'auth__sep', text: 'ou relier Supabase' }),
      h(
        'label',
        { class: 'champ' },
        h('span', { class: 'champ__lib', text: 'URL du projet' }),
        h('input', { type: 'text', id: 'url', placeholder: 'https://xxxx.supabase.co' }),
      ),
      h(
        'label',
        { class: 'champ' },
        h('span', { class: 'champ__lib', text: 'Clé publique « anon »' }),
        h('input', { type: 'text', id: 'cle', placeholder: 'eyJhbGciOi…' }),
      ),
      h('button', {
        class: 'btn btn--bloc',
        text: 'Relier ce projet',
        onclick: () => {
          const url = $('#url', boite).value.trim();
          const cle = $('#cle', boite).value.trim();
          if (!url || !cle) return message('Renseigne l’URL et la clé.');
          if (!/^https?:\/\/.+/.test(url)) return message('L’URL doit commencer par https://');
          enregistrerConfigLocale(url, cle);
          window.location.reload();
        },
      }),
      h('div', { class: 'auth__message' }),
    );
  }

  rendre();
  return racine;
}

export function normaliser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    pseudo: user.user_metadata?.pseudo || user.email?.split('@')[0] || 'Apprenant',
  };
}
