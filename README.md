<div align="center">

<img src="docs/logo.png" alt="mazha Tap logo" width="600"/>

<br/>

![Python](https://img.shields.io/badge/Python-3.14-3d7a50?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-3d7a50?style=flat-square&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-d6851e?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-d6851e?style=flat-square&logo=typescript&logoColor=white)
![Open-Meteo](https://img.shields.io/badge/Weather-Open--Meteo-5080c8?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-aaaaaa?style=flat-square)

**Know whether to tap your rubber trees before you leave the house.**  
No subscription. No API key. No guessing.

</div>

---

## What it does

Kerala rubber growers tap early morning — usually 3–6 AM. One wrong call in the monsoon means diluted latex, wet bark, and wasted hours.

**mazha Tap** reads the hourly forecast for your exact location and returns a single, plain-language verdict:

| | Verdict | When |
|---|---|---|
| ✅ | **Tap** | Rain risk is low within your window |
| ⚠️ | **Delay** | Moderate risk — here's your next safe slot |
| ❌ | **Don't Tap** | Rain probability or amount is too high |

Every verdict comes with bullet-point reasoning, a weather summary, and a confidence score — so growers understand *why*, not just *what*.

---

## Architecture

<img src="docs/architecture.png" alt="mazha Tap system architecture" width="100%"/>

---

## Built with

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 · React 18 · TypeScript · Tailwind CSS · shadcn/ui |
| Maps & Location | Nominatim / OpenStreetMap (location search + reverse geocoding) |
| Backend | FastAPI · Python 3.14 · Pydantic v2 · Uvicorn |
| Weather | [Open-Meteo](https://open-meteo.com) — free, no API key |
| Decision logic | Pure Python rule engine — no ML, no database |
| Persistence | `localStorage` only — plantation profile never leaves the device |

---

## Features

**Tapper marketplace**
- Grower / Tapper mode switcher on the landing page
- Tapper profile builder — photo, district, experience, systems known, capacity, availability, languages, bio, and contact
- Swipe-based grower marketplace powered by `react-tinder-card`
- Swipe right to create a match and reveal call / WhatsApp contact actions
- Optional PocketBase REST persistence via `NEXT_PUBLIC_POCKETBASE_URL`, with local demo storage fallback

**Decision engine**
- Rain probability gating (hard block at 60%, caution at 35%)
- Rain amount threshold (block at 2 mm, caution at 0.5 mm)
- Humidity flag — very high humidity (≥ 95%) triggers caution even without rain
- Tree age modifiers — young trees tighten thresholds, old trees relax them
- Rain-guard support — 25% threshold relaxation for installed rain-guard systems
- Large plantation lead-time — > 500 trees gets an earlier recommended start
- Next safe window — scans 48 h ahead for the first clean 3-hour slot

**Frontend**
- Onboarding form — location search, tree age, tapping system, preferred start time
- Recommendation card — verdict badge, confidence bar, weather grid, reasoning bullets
- Saves your plantation profile locally — skips onboarding on return visits
- Dark mode · Kerala earthy colour palette (deep greens, amber, warm cream)

---

## Quick start

```bash
# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Frontend (new terminal)
cd frontend && npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8001
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Phase 2 works without a backend in local demo mode. To use shared PocketBase persistence, set:

```bash
NEXT_PUBLIC_POCKETBASE_URL=https://your-pocketbase-service.onrender.com
```

See [`docs/pocketbase-marketplace.md`](docs/pocketbase-marketplace.md) for the collections and API rules.

---

## API

```
GET  /health
GET  /weather/forecast?lat=9.59&lon=76.52&days=2
POST /decision/recommend  { plantation: {...}, hourly_forecast: [...] }
```

---

## Roadmap

- [x] FastAPI backend + Open-Meteo weather proxy
- [x] Rule-based decision engine
- [x] Next.js 15 frontend — onboarding, recommendation card, dark mode
- [x] localStorage persistence, no login required
- [x] Tapper marketplace — profile builder, swipe stack, match reveal
- [ ] Leaflet interactive map for location pin
- [ ] Offline PWA with cached last forecast
- [ ] Malayalam / English language toggle
- [ ] Deployment guide (Vercel + Fly.io)

---

<div align="center">
  <sub>Built for the rubber growers of Kerala · MIT © 2026</sub>
</div>
