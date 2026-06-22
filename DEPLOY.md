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
4. Deploy

## CORS

The backend is already configured with `allow_origins=["*"]` in `main.py`.
For production, update CORS to only allow your Vercel domain.

## Free tier notes

- Render free tier spins down after 15 min inactivity — first request may be slow (~30s).
- Vercel hobby tier: unlimited deploys, custom domain supported.
- Open-Meteo: completely free, no key needed.
- Nominatim (geocoding): free, rate-limited to 1 req/sec — fine for this use case.

---

## Marketplace → PocketBase (prototype)

The marketplace frontend works without a live database by default:

```env
NEXT_PUBLIC_MARKETPLACE_BACKEND=mock
NEXT_PUBLIC_MARKETPLACE_PHOTO_MODE=data-url
```

For a live PocketBase prototype, deploy the optional `mazha-tap-pocketbase` service from `render.yaml`, then set Vercel:

```env
NEXT_PUBLIC_MARKETPLACE_BACKEND=pocketbase
NEXT_PUBLIC_POCKETBASE_URL=https://your-pocketbase-service.onrender.com
NEXT_PUBLIC_MARKETPLACE_PHOTO_MODE=pocketbase-file
```

Set these only on the PocketBase service:

```env
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=<strong generated password>
```

### Render free-tier warning

Render free web services have an ephemeral filesystem. PocketBase stores SQLite data and uploads under `pb_data`, so profiles/photos can be lost on redeploy, restart, or spin-down. Use the mock fallback for reliable demos, or move live PocketBase to a paid Render disk, Fly.io volume, or another persistent host before collecting real profile data.

### PocketBase collections

Create these collections from the PocketBase admin UI.

#### `tappers`

Fields:

| Field | Type | Notes |
|---|---|---|
| `name` | text | required, max 80 |
| `village` | text | required, max 80 |
| `district` | text | required, max 80 |
| `latitude` | number | optional |
| `longitude` | number | optional |
| `service_radius_km` | number | required, default 10 |
| `years_experience` | number | optional, 0–60 |
| `languages` | select multiple | Malayalam, English, Tamil, Hindi |
| `tapping_systems` | select multiple | daily, alternate_day, rain_guard, other |
| `availability` | select multiple | early_morning, alternate_days, weekends, on_call |
| `bio` | text | optional, max 400 |
| `photos` | file | optional, max 3, jpg/png/webp |
| `primary_phone` | text | required, max 30 |
| `whatsapp` | text | optional, max 30 |
| `contact_preference` | select | phone, whatsapp, either |
| `active` | bool | default true |
| `edit_token` | text | required, mark Hidden |

Rules:

```txt
listRule:   active = true
viewRule:   active = true
createRule: @request.body.edit_token:isset = true && @request.body.edit_token != ""
updateRule: @request.body.edit_token:isset = true && edit_token = @request.body.edit_token
deleteRule: null
```

Indexes:

```sql
CREATE INDEX idx_tappers_active_district ON tappers (active, district);
CREATE INDEX idx_tappers_updated ON tappers (updated);
CREATE UNIQUE INDEX idx_tappers_edit_token ON tappers (edit_token);
```

#### `matches`

Fields:

| Field | Type | Notes |
|---|---|---|
| `tapper` | relation | required, one `tappers` record |
| `grower_session_id` | text | required |
| `grower_latitude` | number | optional |
| `grower_longitude` | number | optional |
| `grower_village` | text | optional, max 80 |
| `grower_district` | text | optional, max 80 |
| `status` | select | liked |

Rules:

```txt
listRule:   grower_session_id = @request.query.grower_session_id
viewRule:   grower_session_id = @request.query.grower_session_id
createRule: @request.body.grower_session_id:isset = true && @request.body.tapper:isset = true
updateRule: null
deleteRule: null
```

Indexes:

```sql
CREATE INDEX idx_matches_grower_session ON matches (grower_session_id);
CREATE UNIQUE INDEX idx_matches_unique_grower_tapper ON matches (grower_session_id, tapper);
```

### Privacy limitations

- This is intentionally no-auth. `edit_token` is a bearer token stored in localStorage/edit links, not account security.
- Public `tappers` list/view rules make active profiles discoverable by API clients.
- Contact reveal is enforced by frontend flow for the prototype; add server-side PocketBase hooks or a small backend reveal endpoint before using sensitive production contact data.
- Mock photo storage uses data URLs in localStorage and should stay limited to small prototype images.
