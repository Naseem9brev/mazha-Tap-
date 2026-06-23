# Deploying mazha Tap on Vercel

mazha Tap now runs as a Vercel-only Next.js app. The rain forecast and tapping decision APIs live under `frontend/app/api`, so a separate FastAPI host is no longer required for production.

## Vercel preview

1. Import `Naseem9brev/mazha-Tap-` into Vercel.
2. Set:
   - Framework Preset: Next.js
   - Root directory: `frontend`
   - Build command: `npm run build`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy a preview first. Promote to production only after the preview is reviewed.

`NEXT_PUBLIC_API_URL` should normally be unset. If it is set, the frontend will call a separately hosted legacy FastAPI backend instead of the built-in `/api` routes.

## Supabase marketplace

Use `docs/supabase-marketplace.md` to create:

- Email/password Auth
- `tappers` table
- `matches` table
- `tapper-photos` public storage bucket
- `match_tapper(uuid)` RPC for logged-in contact reveal

The app falls back to browser-local demo profiles when Supabase env vars are missing, but production marketplace functionality requires Supabase.

## Smoke test checklist

- Open the Vercel preview.
- In Rain Decision, create a plantation profile and verify a Tap/Delay/Don't Tap verdict from Open-Meteo.
- Sign up as a tapper and save a profile with district, capacity, languages, contact, and optional photo.
- Sign out, sign up/sign in as a grower, swipe right on a tapper, and verify contact reveal.
- Confirm public tapper profile links hide contact details until matching.

## Free tier notes

- Vercel hobby tier supports preview deployments and custom domains.
- Open-Meteo is free and needs no API key.
- Nominatim geocoding is free and rate-limited; avoid automated bulk geocoding.
