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
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your Render API URL (e.g. `https://mazha-tap-api.onrender.com`)
   - Optional for shared marketplace persistence: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Marketplace → Supabase

The marketplace UI ships with seed tappers and browser-local profile storage so it can be demoed immediately. For shared persistence:

1. Create a Supabase project at https://supabase.com.
2. Run the migration in `supabase/migrations/001_marketplace.sql` via the Supabase SQL editor.
3. Create a public storage bucket named `tapper-photos`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.
5. Redeploy the frontend.

See `docs/pocketbase-marketplace.md (now Supabase-based)` for the full schema, RLS policies, and free-tier notes.

## CORS

The backend is already configured with `allow_origins=["*"]` in `main.py`.
For production, update CORS to only allow your Vercel domain.

## Free tier notes

- Render free tier spins down after 15 min inactivity — first request may be slow (~30s).
- Vercel hobby tier: unlimited deploys, custom domain supported.
- Open-Meteo: completely free, no key needed.
- Nominatim (geocoding): free, rate-limited to 1 req/sec — fine for this use case.
- Supabase free tier: 500 MB database, 1 GB storage — sufficient for prototype.
