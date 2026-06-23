-- Marketplace persistence for mazha Tap

create extension if not exists pgcrypto;

create table if not exists public.tappers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo text,
  district text not null,
  years_experience integer not null default 0,
  tapping_systems text[] not null default '{}',
  trees_per_day integer not null default 0,
  availability text not null default 'available_now',
  available_from date,
  languages text[] not null default '{}',
  bio text,
  contact_number text not null,
  edit_token text not null,
  created timestamptz not null default now(),
  constraint tappers_availability_check check (availability in ('available_now', 'available_from', 'not_available')),
  constraint tappers_edit_token_check check (edit_token <> '')
);

create unique index if not exists idx_tappers_edit_token on public.tappers (edit_token);
create index if not exists idx_tappers_district_availability on public.tappers (district, availability);
create index if not exists idx_tappers_created on public.tappers (created desc);

alter table public.tappers enable row level security;

drop policy if exists "Anyone can view available tappers" on public.tappers;
create policy "Anyone can view available tappers"
  on public.tappers for select
  using (availability <> 'not_available');

drop policy if exists "Anyone can create a tapper profile" on public.tappers;
create policy "Anyone can create a tapper profile"
  on public.tappers for insert
  with check (edit_token is not null and edit_token <> '');

drop policy if exists "Owner can update own profile" on public.tappers;
create policy "Owner can update own profile"
  on public.tappers for update
  using (edit_token = (current_setting('request.headers', true)::json ->> 'x-edit-token'))
  with check (edit_token = (current_setting('request.headers', true)::json ->> 'x-edit-token'));

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tapper_id uuid not null references public.tappers(id) on delete cascade,
  created timestamptz not null default now()
);

create index if not exists idx_matches_tapper_created on public.matches (tapper_id, created desc);

alter table public.matches enable row level security;

drop policy if exists "Anyone can create a match" on public.matches;
create policy "Anyone can create a match"
  on public.matches for insert
  with check (true);

drop policy if exists "Anyone can view matches" on public.matches;
create policy "Anyone can view matches"
  on public.matches for select
  using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tapper-photos',
  'tapper-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read tapper photos" on storage.objects;
create policy "Anyone can read tapper photos"
  on storage.objects for select
  using (bucket_id = 'tapper-photos');

drop policy if exists "Anyone can upload tapper photos" on storage.objects;
create policy "Anyone can upload tapper photos"
  on storage.objects for insert
  with check (bucket_id = 'tapper-photos');

drop policy if exists "Anyone can update tapper photos" on storage.objects;
create policy "Anyone can update tapper photos"
  on storage.objects for update
  using (bucket_id = 'tapper-photos')
  with check (bucket_id = 'tapper-photos');
