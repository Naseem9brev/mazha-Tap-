# Deploying Mazha Tapper Marketplace

## PocketBase backend → Render

The repo includes `render.yaml` and `pocketbase/Dockerfile` for a Render Docker web service.

1. Push the repo to GitHub.
2. In Render, create a Blueprint or Web Service from this repo.
3. Use the service generated from `render.yaml`:
   - Service name: `mazha-pocketbase`
   - Runtime: Docker
   - Root directory: `pocketbase`
   - Plan: Free
4. Wait for the service to start. The health endpoint is `/api/health`.
5. Open the PocketBase admin UI at `https://<render-service>.onrender.com/_/` and create the first admin if needed.

The migration in `pocketbase/pb_migrations` creates:

- `tappers`
- `matches`

### Render free-tier durability note

PocketBase stores records and uploaded profile photos in SQLite/files under `pb_data`. Render free web services use ephemeral storage, so data can be lost across redeploys or instance replacement. To guarantee durable production persistence, add a Render persistent disk or use a durable hosted backend. A persistent disk may not be available on a zero-cost plan.

## Frontend → Vercel

1. Import this repo in Vercel.
2. Set project root/build settings from `vercel.json`:
   - Build command: `cd frontend && npm run build`
   - Install command: `cd frontend && npm install`
   - Output directory: `frontend/.next`
3. Add environment variable:

```bash
NEXT_PUBLIC_POCKETBASE_URL=https://<render-service>.onrender.com
```

4. Deploy.

## Verification checklist

- Open the Vercel URL.
- Switch to **Tapper** mode.
- Create a profile with a photo and contact number.
- Refresh the page and confirm the profile can be edited from the same browser.
- Switch to **Grower** mode.
- Filter by the tapper's district.
- Swipe right and confirm the contact number, Call, and WhatsApp actions appear.
