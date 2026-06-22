<div align="center">

<img src="docs/logo.png" alt="Mazha logo" width="600"/>

# Mazha — Tapper Marketplace

**Tinder-style matching for Kerala rubber growers and skilled tappers.**
No auth, no payments, no in-app chat — just profile discovery and direct contact.

</div>

---

## What it does

Mazha connects rubber plantation owners with tappers who are available for work.

- **Tappers** create a profile card with experience, location, tapping systems, daily capacity, languages, photo, availability, bio, and contact number.
- **Growers** switch to Grower mode, filter by district/availability/minimum experience, and swipe through available tapper cards.
- **Right swipe** creates a lightweight match and reveals call/WhatsApp actions.
- **No login** is required. A generated `edit_token` is stored in local storage so a tapper can return to edit their own profile from the same browser.

---

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 · React 18 · TypeScript · Tailwind CSS · shadcn/ui |
| Swipe UI | `react-tinder-card` |
| Persistence | PocketBase · SQLite · file storage |
| Hosting | Vercel frontend · Render PocketBase service |

---

## Core data model

### `tappers`

```txt
id, name, photo, district, years_experience, tapping_systems,
trees_per_day, availability, available_from, languages, bio,
contact_number, created, edit_token
```

### `matches`

```txt
id, tapper_id, created
```

PocketBase migrations live in `pocketbase/pb_migrations` and create both collections automatically when the PocketBase service starts.

---

## Local development

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000.

If `NEXT_PUBLIC_POCKETBASE_URL` is unset, the app runs in local demo mode with seeded profiles and browser-local saved tapper profiles.

### PocketBase

```bash
cd pocketbase
docker build -t mazha-pocketbase .
docker run --rm -p 8090:8090 mazha-pocketbase
```

Then set:

```bash
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
```

PocketBase admin UI is available at http://localhost:8090/_/.

---

## Scripts

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

---

## Deployment

See `DEPLOY.md` for Vercel and Render setup.

Important: Render free web services do not provide durable persistent disks for PocketBase SQLite. The included Render config keeps hosting cost at $0, but production-grade profile durability requires adding a persistent disk or choosing a backend with durable free storage.

---

<div align="center">
  <sub>Built for the rubber growers and tappers of Kerala · MIT © 2026</sub>
</div>
