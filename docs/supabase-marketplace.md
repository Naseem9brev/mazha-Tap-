# Supabase marketplace setup

The Vercel app uses Supabase for marketplace login, shared tapper profiles, matches, and profile photo storage.

## Required Vercel environment variables

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`NEXT_PUBLIC_API_URL` should normally be unset. When it is unset, rain forecast and decision calls use the built-in Next.js API routes under `/api`.

## Auth settings

Enable Email auth in Supabase Auth. The current UI supports email/password sign-in and account creation.

## Storage bucket

Create a public storage bucket named `tapper-photos` for profile images.

## SQL schema

Run this in Supabase SQL editor after your project is ready:

```sql
create table if not exists public.tappers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  photo_url text,
  district text not null,
  years_experience integer not null check (years_experience between 0 and 60),
  tapping_systems text[] not null default '{}',
  trees_per_day integer not null check (trees_per_day > 0),
  availability text not null check (availability in ('available_now', 'available_from', 'not_available')),
  available_from date,
  languages text[] not null default '{}',
  bio text,
  contact_number text not null,
  edit_token text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  grower_id uuid not null references auth.users(id) on delete cascade,
  tapper_id uuid not null references public.tappers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (grower_id, tapper_id)
);

alter table public.tappers enable row level security;
alter table public.matches enable row level security;

create policy "Public can browse available tapper cards"
  on public.tappers
  for select
  using (availability <> 'not_available');

create policy "Tappers create their own profile"
  on public.tappers
  for insert
  with check (auth.uid() = user_id);

create policy "Tappers update their own profile"
  on public.tappers
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Growers create their own matches"
  on public.matches
  for insert
  with check (auth.uid() = grower_id);

create policy "Growers view their own matches"
  on public.matches
  for select
  using (auth.uid() = grower_id);

create or replace function public.match_tapper(tapper_record_id uuid)
returns table (
  id uuid,
  tapper_id uuid,
  created_at timestamptz,
  contact_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  match_record public.matches;
begin
  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  insert into public.matches (grower_id, tapper_id)
  values (auth.uid(), tapper_record_id)
  on conflict (grower_id, tapper_id) do update set created_at = excluded.created_at
  returning * into match_record;

  return query
  select match_record.id, match_record.tapper_id, match_record.created_at, t.contact_number
  from public.tappers t
  where t.id = tapper_record_id;
end;
$$;

grant execute on function public.match_tapper(uuid) to authenticated;
```

The app intentionally does not select `contact_number` while browsing cards. It calls `match_tapper` only after a logged-in grower swipes right.
