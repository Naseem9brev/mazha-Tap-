# Supabase marketplace persistence

Use Supabase when the tapper marketplace needs shared profiles, match logging, and uploaded profile photos across devices. Without these variables the app still falls back to seed tappers plus browser-local demo storage.

## Setup

1. Create or choose a Supabase project.
2. Apply `supabase/migrations/20260623131000_tapper_marketplace.sql`.
3. In Vercel, set:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SUPABASE_TAPPER_PHOTO_BUCKET=tapper-photos
```

## What the migration creates

- `tappers`: shared tapper work cards with district, experience, capacity, languages, availability, and private contact/edit-token fields.
- `tapper_matches`: right-swipe match log.
- `tapper-photos`: public Supabase Storage bucket for profile images.
- RPC functions:
  - `create_tapper_profile`
  - `update_tapper_profile`
  - `get_owned_tapper_profile`
  - `create_tapper_match`

Public browsing only grants card fields. Contact numbers are returned by `create_tapper_match` after a right swipe. Edit tokens are returned only to the tapper who saved or opened their edit link.

## Provider precedence

The frontend uses providers in this order:

1. Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
2. PocketBase when `NEXT_PUBLIC_POCKETBASE_URL` is set.
3. Browser-local demo storage.
