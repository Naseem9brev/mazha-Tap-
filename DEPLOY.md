# Deploying mazha Tap—

## Backend → Render (free tier)

1. Push code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Set:
   - Root directory: `backend`
   - Runtime: Python 3
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Click Deploy — Render will give you a URL like `https://mazha-tap-api.onrender.com`

## Frontend → Vercel (free tier)

1. Go to https://vercel.com → New Project → Import your GitHub repo
2. Set:
   - Framework Preset: Next.js
   - Root directory: `frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render API URL (e.g. `https://mazha-tap-api.onrender.com`)
   - Optional for shared marketplace persistence and profile photos:
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon/publishable key
     - `NEXT_PUBLIC_SUPABASE_TAPPER_PHOTO_BUCKET` = `tapper-photos`
   - Optional for Phase 2 shared marketplace persistence: `NEXT_PUBLIC_POCKETBASE_URL` = your PocketBase URL
4. Deploy

## Marketplace persistence → Supabase

The marketplace UI ships with seed tappers and browser-local profile storage so it can be demoed immediately. For shared profiles, match logging, and uploaded profile photos:

1. Create or choose a Supabase project.
2. Apply `supabase/migrations/20260623131000_tapper_marketplace.sql`.
3. Set the Supabase environment variables in Vercel.
4. Redeploy the frontend.

Supabase is preferred for production because Postgres and Storage persist profiles and photos across devices. See `docs/supabase-marketplace.md`.

## Phase 2 marketplace → PocketBase

PocketBase remains supported as a lightweight prototype fallback:

1. Create a PocketBase web service on Render.
2. Create the `tappers` and `matches` collections described in `docs/pocketbase-marketplace.md`.
3. Set `NEXT_PUBLIC_POCKETBASE_URL` in Vercel.
4. Redeploy the frontend.

PocketBase stores SQLite data and profile photos on disk. Render free web services are fine for a quick demo, but verify disk durability before treating it as production persistence.

## CORS

The backend is already configured with `allow_origins=["*"]` in `main.py`.
For production, update CORS to only allow your Vercel domain.

## Free tier notes

- Render free tier spins down after 15 min inactivity — first request may be slow (~30s).
- Vercel hobby tier: unlimited deploys, custom domain supported.
- Open-Meteo: completely free, no key needed.
- Nominatim (geocoding): free, rate-limited to 1 req/sec — fine for this use case.
