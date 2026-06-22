# Supabase marketplace schema

The marketplace runs in demo mode with browser `localStorage` by default. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to use Supabase for shared persistence.

## Tables

### `tappers`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK, default gen) | |
| `name` | text | not null |
| `photo` | text | nullable, public URL or data-URL |
| `district` | text | not null |
| `years_experience` | integer | default 0 |
| `tapping_systems` | text[] | |
| `trees_per_day` | integer | default 0 |
| `availability` | text | not null, one of available_now / available_from / not_available |
| `available_from` | date | nullable |
| `languages` | text[] | |
| `bio` | text | nullable |
| `contact_number` | text | not null |
| `edit_token` | text | not null, unique — bearer token for no-auth edits |
| `created` | timestamptz | default now() |

### `matches`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK, default gen) | |
| `tapper_id` | uuid | references tappers(id) |
| `created` | timestamptz | default now() |

## Row-Level Security (RLS)

- `tappers` SELECT: anyone can read rows where `availability != 'not_available'`
- `tappers` INSERT: anyone (anon) — `edit_token` must be non-empty
- `tappers` UPDATE: only if `edit_token` in request matches `edit_token` on the row
- `tappers` DELETE: disabled
- `matches` INSERT: anyone (anon)
- `matches` SELECT: anyone

## Storage

Create a public bucket named `tapper-photos` for profile images. The frontend uploads via Supabase Storage and reads public URLs.

## Migration

See `supabase/migrations/001_marketplace.sql` for the full migration script.

## Free-tier notes

Supabase free tier includes 500 MB database, 1 GB storage, and 50 MB file uploads. For a demo/prototype this is more than sufficient.
