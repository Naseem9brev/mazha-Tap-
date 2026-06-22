-- Marketplace tables for mazha Tap

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
  created timestamptz not null default now()
);

create unique index if not exists idx_tappers_edit_token on public.tappers (edit_token);
create index if not exists idx_tappers_district on public.tappers (district);

alter table public.tappers enable row level security;

create policy "Anyone can view available tappers"
  on public.tappers for select
  using (availability <> 'not_available');

create policy "Anyone can create a tapper profile"
  on public.tappers for insert
  with check (edit_token is not null and edit_token <> '');

create policy "Owner can update own profile"
  on public.tappers for update
  using (edit_token = current_setting('request.headers', true)::json->>'edit_token')
  with check (edit_token = current_setting('request.headers', true)::json->>'edit_token');

-- matches

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tapper_id uuid not null references public.tappers(id),
  created timestamptz not null default now()
);

create index if not exists idx_matches_tapper on public.matches (tapper_id);

alter table public.matches enable row level security;

create policy "Anyone can create a match"
  on public.matches for insert
  with check (true);

create policy "Anyone can view matches"
  on public.matches for select
  using (true);

-- Storage bucket (run in Supabase dashboard or via supabase CLI):
-- create a public bucket named "tapper-photos"
