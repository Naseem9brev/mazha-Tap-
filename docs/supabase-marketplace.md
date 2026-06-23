# Supabase marketplace schema

The Vercel-only mazha Tap app uses Supabase for marketplace persistence. Browser clients should use only the Supabase anon key with Row Level Security enabled.

## Environment

Required Vercel env vars:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Optional:

```txt
NEXT_PUBLIC_SUPABASE_TAPPER_PHOTOS_BUCKET=tapper-photos
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` through Vercel public env vars.

## Tables

### `tapper_profiles`

Public marketplace profile fields. Keep contact numbers out of this table so browse queries cannot leak private contact details.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | Primary key, `gen_random_uuid()` default |
| `owner_id` | `uuid` | yes | `auth.users.id`; profile owner |
| `name` | `text` | yes | Tapper display name |
| `district` | `text` | yes | Kerala district |
| `years_experience` | `integer` | yes | Use a non-negative check constraint |
| `tapping_systems` | `text[]` | yes | Conventional, rain-guard, S/2 d2, etc. |
| `trees_per_day` | `integer` | yes | Typical daily capacity |
| `availability` | `text` | yes | `available_now`, `available_from`, `not_available` |
| `available_from` | `date` | no | Only for `available_from` |
| `languages` | `text[]` | yes | Malayalam, Tamil, English |
| `bio` | `text` | no | Keep concise for card layout |
| `photo_path` | `text` | no | Storage path in `tapper-photos` |
| `created_at` | `timestamptz` | yes | `now()` default |
| `updated_at` | `timestamptz` | yes | Maintained on update |

### `tapper_contacts`

Private contact data.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `tapper_id` | `uuid` | yes | Primary key, references `tapper_profiles(id)` |
| `owner_id` | `uuid` | yes | Same owner as the profile |
| `contact_number` | `text` | yes | Phone/WhatsApp number revealed after match |
| `created_at` | `timestamptz` | yes | `now()` default |
| `updated_at` | `timestamptz` | yes | Maintained on update |

### `tapper_matches`

Grower contact-reveal audit log.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | Primary key, `gen_random_uuid()` default |
| `tapper_id` | `uuid` | yes | References `tapper_profiles(id)` |
| `grower_id` | `uuid` | yes | `auth.users.id`; anonymous users are acceptable for previews |
| `created_at` | `timestamptz` | yes | `now()` default |

## Recommended Auth settings

- Enable Anonymous sign-ins so growers can browse and create match records without a registration wall.
- Enable Email OTP or magic links for tapper profile ownership/edit testing.
- Add `https://*.vercel.app/**` to redirect URLs for Vercel previews.
- Add the reviewed production domain to Site URL and redirect URLs before production launch.

## Recommended RLS behavior

Keep RLS enabled on all tables.

| Table | Policy intent |
| --- | --- |
| `tapper_profiles` | Anyone can select profiles where `availability != 'not_available'`; owners can insert/update/delete their own profiles. |
| `tapper_contacts` | Owners can manage their own contact record; growers can select a contact only when a matching `tapper_matches` row exists for their `auth.uid()`. |
| `tapper_matches` | Authenticated or anonymous users can insert their own match rows; users can select only their own matches; profile owners can see matches for their profiles if needed. |

## Storage

Create a bucket named `tapper-photos`.

- Public read is acceptable for profile-card photos.
- Upload/update/delete should require an authenticated user and paths scoped by owner id, such as `<owner_id>/<profile_id>/<filename>`.
- Keep file size and MIME type limits enabled; JPEG, PNG, and WebP are sufficient for preview.

## Preview validation queries

Use the Supabase Table Editor or SQL editor to confirm:

```sql
select id, name, district, availability, created_at
from public.tapper_profiles
order by created_at desc
limit 10;

select tapper_id, grower_id, created_at
from public.tapper_matches
order by created_at desc
limit 10;
```

Do not query or export real contact numbers into PR comments, logs, screenshots, or tickets.
