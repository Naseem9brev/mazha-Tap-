create extension if not exists pgcrypto;

create table if not exists public.tappers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  photo_path text,
  district text not null,
  years_experience integer not null check (years_experience between 0 and 60),
  tapping_systems text[] not null default '{}',
  trees_per_day integer not null check (trees_per_day between 25 and 1500),
  availability text not null check (availability in ('available_now', 'available_from', 'not_available')),
  available_from date,
  languages text[] not null default '{}',
  bio text,
  contact_number text not null,
  edit_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tapper_matches (
  id uuid primary key default gen_random_uuid(),
  tapper_id uuid not null references public.tappers(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists tappers_marketplace_filters_idx
  on public.tappers (availability, district, years_experience desc, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tappers_touch_updated_at on public.tappers;
create trigger tappers_touch_updated_at
  before update on public.tappers
  for each row
  execute function public.touch_updated_at();

alter table public.tappers enable row level security;
alter table public.tapper_matches enable row level security;

drop policy if exists "Public can browse available tapper cards" on public.tappers;
create policy "Public can browse available tapper cards"
  on public.tappers
  for select
  to anon
  using (availability <> 'not_available');

drop policy if exists "Public can create tapper matches" on public.tapper_matches;
create policy "Public can create tapper matches"
  on public.tapper_matches
  for insert
  to anon
  with check (true);

revoke all on public.tappers from anon;
grant select (
  id,
  name,
  photo_url,
  district,
  years_experience,
  tapping_systems,
  trees_per_day,
  availability,
  available_from,
  languages,
  bio,
  created_at
) on public.tappers to anon;
grant insert on public.tapper_matches to anon;

create or replace function public.tapper_profile_json(profile public.tappers)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', (profile).id,
    'name', (profile).name,
    'photo_url', (profile).photo_url,
    'district', (profile).district,
    'years_experience', (profile).years_experience,
    'tapping_systems', (profile).tapping_systems,
    'trees_per_day', (profile).trees_per_day,
    'availability', (profile).availability,
    'available_from', (profile).available_from,
    'languages', (profile).languages,
    'bio', (profile).bio,
    'contact_number', (profile).contact_number,
    'edit_token', (profile).edit_token,
    'created_at', (profile).created_at
  );
$$;

create or replace function public.create_tapper_profile(
  p_name text,
  p_photo_url text,
  p_photo_path text,
  p_district text,
  p_years_experience integer,
  p_tapping_systems text[],
  p_trees_per_day integer,
  p_availability text,
  p_available_from date,
  p_languages text[],
  p_bio text,
  p_contact_number text,
  p_edit_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.tappers;
begin
  insert into public.tappers (
    name,
    photo_url,
    photo_path,
    district,
    years_experience,
    tapping_systems,
    trees_per_day,
    availability,
    available_from,
    languages,
    bio,
    contact_number,
    edit_token
  )
  values (
    trim(p_name),
    nullif(trim(coalesce(p_photo_url, '')), ''),
    nullif(trim(coalesce(p_photo_path, '')), ''),
    p_district,
    p_years_experience,
    p_tapping_systems,
    p_trees_per_day,
    p_availability,
    case when p_availability = 'available_from' then p_available_from else null end,
    p_languages,
    nullif(trim(coalesce(p_bio, '')), ''),
    trim(p_contact_number),
    p_edit_token
  )
  returning * into profile;

  return public.tapper_profile_json(profile);
end;
$$;

create or replace function public.update_tapper_profile(
  p_tapper_id uuid,
  p_name text,
  p_photo_url text,
  p_photo_path text,
  p_district text,
  p_years_experience integer,
  p_tapping_systems text[],
  p_trees_per_day integer,
  p_availability text,
  p_available_from date,
  p_languages text[],
  p_bio text,
  p_contact_number text,
  p_edit_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.tappers;
begin
  update public.tappers
  set
    name = trim(p_name),
    photo_url = coalesce(nullif(trim(coalesce(p_photo_url, '')), ''), photo_url),
    photo_path = coalesce(nullif(trim(coalesce(p_photo_path, '')), ''), photo_path),
    district = p_district,
    years_experience = p_years_experience,
    tapping_systems = p_tapping_systems,
    trees_per_day = p_trees_per_day,
    availability = p_availability,
    available_from = case when p_availability = 'available_from' then p_available_from else null end,
    languages = p_languages,
    bio = nullif(trim(coalesce(p_bio, '')), ''),
    contact_number = trim(p_contact_number)
  where id = p_tapper_id
    and edit_token = p_edit_token
  returning * into profile;

  if (profile).id is null then
    raise exception 'Invalid tapper edit token';
  end if;

  return public.tapper_profile_json(profile);
end;
$$;

create or replace function public.get_owned_tapper_profile(
  p_tapper_id uuid,
  p_edit_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.tappers;
begin
  select *
  into profile
  from public.tappers
  where id = p_tapper_id
    and edit_token = p_edit_token;

  if (profile).id is null then
    return null;
  end if;

  return public.tapper_profile_json(profile);
end;
$$;

create or replace function public.create_tapper_match(p_tapper_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  match_record public.tapper_matches;
  profile public.tappers;
begin
  select *
  into profile
  from public.tappers
  where id = p_tapper_id
    and availability <> 'not_available';

  if (profile).id is null then
    raise exception 'Tapper is not available';
  end if;

  insert into public.tapper_matches (tapper_id)
  values ((profile).id)
  returning * into match_record;

  return jsonb_build_object(
    'id', match_record.id,
    'tapper_id', match_record.tapper_id,
    'created', match_record.created_at,
    'contact_number', (profile).contact_number
  );
end;
$$;

grant execute on function public.create_tapper_profile(
  text,
  text,
  text,
  text,
  integer,
  text[],
  integer,
  text,
  date,
  text[],
  text,
  text,
  text
) to anon;
grant execute on function public.update_tapper_profile(
  uuid,
  text,
  text,
  text,
  text,
  integer,
  text[],
  integer,
  text,
  date,
  text[],
  text,
  text,
  text
) to anon;
grant execute on function public.get_owned_tapper_profile(uuid, text) to anon;
grant execute on function public.create_tapper_match(uuid) to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tapper-photos',
  'tapper-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read tapper photos" on storage.objects;
create policy "Public can read tapper photos"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'tapper-photos');

drop policy if exists "Public can upload tapper photos" on storage.objects;
create policy "Public can upload tapper photos"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'tapper-photos');
