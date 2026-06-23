# Supabase Marketplace Schema

This document describes the Supabase resources expected by `frontend/lib/marketplace.ts`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for shared persistence) | Project URL, e.g. `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (for shared persistence) | Public anon key from Supabase project settings |

When **both** are absent the frontend falls back to `localStorage` with hard-coded seed tappers — no remote calls are made.

---

## Tables

### `tappers`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | Primary key |
| `name` | `text` | no | | Tapper display name |
| `photo_path` | `text` | yes | | Object path inside the `profile-photos` storage bucket |
| `district` | `text` | no | | Kerala district (see `KERALA_DISTRICTS` in code) |
| `years_experience` | `integer` | no | `0` | 0–40 |
| `tapping_systems` | `jsonb` | no | `'[]'::jsonb` | Array of system strings |
| `trees_per_day` | `integer` | no | `0` | Daily capacity |
| `availability` | `text` | no | `'available_now'` | One of: `available_now`, `available_from`, `not_available` |
| `available_from` | `date` | yes | | Only relevant when availability = `available_from` |
| `languages` | `jsonb` | no | `'[]'::jsonb` | Array of language strings |
| `bio` | `text` | yes | | Short bio (≤100 chars recommended in UI) |
| `contact_number` | `text` | no | | Phone/WhatsApp — revealed after match |
| `edit_token` | `text` | no | | Client-generated UUID for profile ownership |
| `created_at` | `timestamptz` | no | `now()` | Row creation time |

**RLS suggestions (anon role):**
- `SELECT`: `availability != 'not_available'` (public browsing)
- `INSERT`: `true` (anyone can create a profile)
- `UPDATE`: `edit_token = (request payload).edit_token` (only owner can edit)
- `DELETE`: `false`

### `matches`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | Primary key |
| `tapper_id` | `uuid` | no | | FK → `tappers.id` |
| `created_at` | `timestamptz` | no | `now()` | When the grower swiped right |

**RLS suggestions (anon role):**
- `SELECT`: `false` (matches are private)
- `INSERT`: `true` (grower creates a match)
- `UPDATE`/`DELETE`: `false`

---

## Storage bucket

| Bucket | Public | Notes |
|--------|--------|-------|
| `profile-photos` | Yes | Holds tapper profile images. File names follow the pattern `<tapper_id>.<ext>`. Upsert is used so re-uploads overwrite. |

---

## Migration SQL (reference)

```sql
-- tappers
create table if not exists public.tappers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_path text,
  district text not null,
  years_experience integer not null default 0,
  tapping_systems jsonb not null default '[]'::jsonb,
  trees_per_day integer not null default 0,
  availability text not null default 'available_now',
  available_from date,
  languages jsonb not null default '[]'::jsonb,
  bio text,
  contact_number text not null,
  edit_token text not null,
  created_at timestamptz not null default now()
);

-- matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tapper_id uuid not null references public.tappers(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.tappers enable row level security;
alter table public.matches enable row level security;

create policy "Tappers are publicly readable (available)"
  on public.tappers for select using (availability != 'not_available');

create policy "Anyone can create a tapper profile"
  on public.tappers for insert with check (true);

create policy "Owner can update own profile via edit_token"
  on public.tappers for update using (edit_token = current_setting('request.jwt.claims', true)::jsonb->>'edit_token')
  with check (true);

create policy "Matches insertable by anyone"
  on public.matches for insert with check (true);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;
```

> **Note:** The update policy above is a placeholder. In practice, the frontend sends `edit_token` as part of the payload and the Supabase client checks equality via a simpler RLS expression. The separate session building the auth UX will finalize the exact RLS approach.

---

## Integration notes

- The frontend uses `@supabase/supabase-js` (pinned to `2.108.1`).
- `getSupabase()` in `frontend/lib/supabase.ts` returns `null` when env vars are missing — all marketplace functions gracefully fall back to `localStorage`.
- Profile photo uploads go to the `profile-photos` bucket via Supabase Storage; the `photo_path` column stores the object path (not a full URL).
- The `edit_token` is generated client-side (`crypto.randomUUID()`) and stored in localStorage so the user can update their profile without login.
- Another Devin session owns the full auth UX (login UI in `app/page.tsx`); this slice only provides data-layer helpers.
