# Deploying mazha Tap—

## Backend → Render (free tier)

The Phase 1 rain-decision API remains a FastAPI web service.

1. Push code to GitHub
2. Go to https://render.com → New → Blueprint
3. Connect this repo and apply `render.yaml`
4. Render creates `mazha-tap-api` from `backend`
5. Confirm health: `https://mazha-tap-api.onrender.com/health`

Manual settings if not using the blueprint:

- Root directory: `backend`
- Runtime: Python 3
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Marketplace persistence → Render PocketBase

The marketplace UI ships with seed tappers and browser-local profile storage so it can be demoed immediately. For shared persistence, the `mazha-pocketbase` service in `render.yaml` builds `pocketbase/Dockerfile`.

After the service deploys:

1. Open `https://mazha-pocketbase.onrender.com/_/`
2. Create the first admin user
3. Create the `tappers` and `matches` collections described in `docs/pocketbase-marketplace.md`
4. Set `NEXT_PUBLIC_POCKETBASE_URL` in Vercel
5. Redeploy the frontend

### Render free-tier warning

PocketBase stores SQLite data and uploaded profile photos on disk. Render free web services are fine for a quick demo, but verify disk durability or attach a persistent disk before treating it as production persistence.

## Frontend → Vercel (free tier)

1. Go to https://vercel.com → New Project → Import your GitHub repo
2. Set:
   - Framework Preset: Next.js
   - Root directory: repository root
   - Build command: `cd frontend && npm run build`
   - Install command: `cd frontend && npm install`
   - Output directory: `frontend/.next`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your Render FastAPI URL, e.g. `https://mazha-tap-api.onrender.com`
   - Optional for Phase 2 shared marketplace persistence: `NEXT_PUBLIC_POCKETBASE_URL` = your PocketBase URL, e.g. `https://mazha-pocketbase.onrender.com`
4. Deploy

## Local verification

```bash
# Backend
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m compileall -q .
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```

## CORS

The FastAPI backend is configured with `allow_origins=["*"]` in `backend/main.py`. For production, update CORS to only allow your Vercel domain.

## Free tier notes

- Render free tier spins down after 15 min inactivity — first request may be slow.
- Vercel hobby tier supports this frontend prototype.
- Open-Meteo is free and keyless.
- Nominatim is free and rate-limited to 1 request/sec.
