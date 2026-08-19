-- =============================================================================
--  GabPonais — schéma Supabase
--  À exécuter tel quel dans : Supabase > SQL Editor > New query > Run.
--  Le script est idempotent : tu peux le relancer sans risque.
-- =============================================================================

-- ---------------------------------------------------------------- profils --

create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  pseudo     text,
  reglages   jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Un profil par utilisateur : pseudo et préférences d''apprentissage.';

-- ----------------------------------------------------------- progression --
-- Une ligne par (utilisateur, mot). word_id = rang du mot, de 1 à 1000.

create table if not exists public.progress (
  user_id    uuid        not null references auth.users on delete cascade,
  word_id    integer     not null check (word_id between 1 and 5000),
  etat       smallint    not null default 0,   -- 0 nouvelle, 1 apprentissage, 2 révision, 3 réapprentissage
  du         timestamptz,                      -- prochaine échéance
  intervalle real        not null default 0,   -- en jours
  facilite   real        not null default 2.5,
  palier     smallint    not null default 0,
  reps       integer     not null default 0,
  oublis     integer     not null default 0,
  derniere   timestamptz,                      -- dernière réponse
  premiere   timestamptz,                      -- première fois que le mot a été vu
  origine    text,                             -- 'test' si estimé par le test de niveau
  suspendue  boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

create index if not exists progress_user_du_idx on public.progress (user_id, du);

-- Colonne ajoutée après coup sur les projets créés avec une version antérieure.
alter table public.progress add column if not exists premiere timestamptz;
alter table public.progress add column if not exists origine text;

-- --------------------------------------------------------------- reviews --
-- Journal des réponses : sert aux statistiques, à la série et au calendrier.

create table if not exists public.reviews (
  id               bigint generated always as identity primary key,
  user_id          uuid        not null references auth.users on delete cascade,
  word_id          integer     not null,
  note             smallint    not null check (note between 1 and 4),
  mode             text,
  fait_le          timestamptz not null default now(),
  duree_ms         integer,
  intervalle_avant real,
  intervalle_apres real
);

create index if not exists reviews_user_date_idx on public.reviews (user_id, fait_le desc);

-- ------------------------------------------------------------------- RLS --
-- Chaque utilisateur ne voit et ne modifie que ses propres lignes.

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.reviews  enable row level security;

drop policy if exists "profil visible par son propriétaire"  on public.profiles;
drop policy if exists "profil créé par son propriétaire"     on public.profiles;
drop policy if exists "profil modifié par son propriétaire"  on public.profiles;

create policy "profil visible par son propriétaire"
  on public.profiles for select using (auth.uid() = id);
create policy "profil créé par son propriétaire"
  on public.profiles for insert with check (auth.uid() = id);
create policy "profil modifié par son propriétaire"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "progression lisible"    on public.progress;
drop policy if exists "progression insérable"  on public.progress;
drop policy if exists "progression modifiable" on public.progress;
drop policy if exists "progression effaçable"  on public.progress;

create policy "progression lisible"
  on public.progress for select using (auth.uid() = user_id);
create policy "progression insérable"
  on public.progress for insert with check (auth.uid() = user_id);
create policy "progression modifiable"
  on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progression effaçable"
  on public.progress for delete using (auth.uid() = user_id);

drop policy if exists "révisions lisibles"   on public.reviews;
drop policy if exists "révisions insérables" on public.reviews;
drop policy if exists "révisions effaçables" on public.reviews;

create policy "révisions lisibles"
  on public.reviews for select using (auth.uid() = user_id);
create policy "révisions insérables"
  on public.reviews for insert with check (auth.uid() = user_id);
create policy "révisions effaçables"
  on public.reviews for delete using (auth.uid() = user_id);

-- ------------------------------------------- création automatique du profil --

create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'pseudo', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists creer_profil_apres_inscription on auth.users;
create trigger creer_profil_apres_inscription
  after insert on auth.users
  for each row execute function public.creer_profil();
