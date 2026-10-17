-- Squisitus — tabelle per i moduli del sito.
-- Da incollare in Supabase: SQL Editor → New query → Run.
--
-- Sicurezza: il sito usa la chiave "anon / publishable", che è pubblica.
-- Le regole RLS qui sotto permettono ai visitatori SOLO di inserire righe
-- (con il consenso privacy) e MAI di leggerle, modificarle o cancellarle.
-- Le richieste si consultano dal pannello Supabase (Table Editor).

-- 1. Sali a bordo: richieste di espositori e sponsor ------------------------
create table if not exists public.richieste (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  tipo        text not null check (tipo in ('espositore', 'sponsor')),
  azienda     text not null check (length(azienda) between 1 and 200),
  referente   text not null check (length(referente) between 1 and 200),
  email       text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  telefono    text not null check (length(telefono) between 7 and 30),
  categoria   text check (length(categoria) <= 100),
  stand       text check (length(stand) <= 50),
  livello     text check (length(livello) <= 50),
  messaggio   text check (length(messaggio) <= 4000),
  newsletter  boolean not null default false,
  privacy     boolean not null check (privacy)
);

-- 2. Newsletter ------------------------------------------------------------
create table if not exists public.newsletter (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  email       text not null unique check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  ticketing   boolean not null default false,
  privacy     boolean not null check (privacy)
);

-- 3. Area press: richieste di accredito -------------------------------------
create table if not exists public.accrediti_press (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  nome        text not null check (length(nome) between 1 and 200),
  testata     text not null check (length(testata) between 1 and 200),
  email       text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  ruolo       text not null check (length(ruolo) between 1 and 200),
  privacy     boolean not null check (privacy)
);

-- Regole di accesso ---------------------------------------------------------
alter table public.richieste       enable row level security;
alter table public.newsletter      enable row level security;
alter table public.accrediti_press enable row level security;

revoke all on public.richieste, public.newsletter, public.accrediti_press from anon, authenticated;
grant insert on public.richieste, public.newsletter, public.accrediti_press to anon, authenticated;

drop policy if exists "visitatori inseriscono richieste" on public.richieste;
create policy "visitatori inseriscono richieste" on public.richieste
  for insert to anon, authenticated with check (privacy);

drop policy if exists "visitatori si iscrivono alla newsletter" on public.newsletter;
create policy "visitatori si iscrivono alla newsletter" on public.newsletter
  for insert to anon, authenticated with check (privacy);

drop policy if exists "giornalisti chiedono l'accredito" on public.accrediti_press;
create policy "giornalisti chiedono l'accredito" on public.accrediti_press
  for insert to anon, authenticated with check (privacy);

-- Contenuti (rassegna stampa e partner): vedi la migrazione "contenuti_articoli_partner"
-- applicata al progetto e supabase/GESTIONE-CONTENUTI.md.

-- Indirizzo (non pubblico) del pannello, usato nei link delle email di notifica
alter table public.impostazioni add column if not exists pannello_url text;

-- Pagina "Stay tuned" prima del lancio (pannello → Pagina di lancio). Leggibile da tutti, modificabile dagli admin.
create table if not exists public.sito_stato (
  id int primary key default 1 check (id = 1),
  in_arrivo boolean not null default false,
  lancio_at timestamptz,
  spegni_al_lancio boolean not null default true,
  messaggio text,
  aggiornato_at timestamptz not null default now()
);
alter table public.sito_stato enable row level security;
create policy "sito_stato lettura pubblica" on public.sito_stato for select to anon, authenticated using (true);
create policy "sito_stato admin" on public.sito_stato for update to authenticated using (privato.is_admin()) with check (privato.is_admin());

alter table public.sito_stato add column if not exists solo_logo boolean not null default false;

-- Pagine in cui compare un articolo ('dicono-di-noi', 'salotto'); scelte nel pannello
alter table public.articoli add column if not exists pagine text[] not null default '{}';
