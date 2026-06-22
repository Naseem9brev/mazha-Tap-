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

Every verdict includes bullet-point reasoning, a weather summary, confidence score — and now a **yield & labour estimate** so you know how much latex to expect and how many tappers to deploy.

Beyond the decision tool, mazha Tap is growing into a **Tapper Marketplace** — connecting growers with skilled Kerala tappers they can browse, filter, and contact with a swipe.

---

## Tapper Marketplace ✨ Phase 3

<img src="docs/screen_marketplace.png" alt="Tapper Marketplace" width="100%"/>

Growers can swipe through verified tapper profiles filtered by district, availability, and experience. Right swipe reveals the tapper's contact — no middleman, no platform fee. Tappers create a work card showing their daily capacity, languages, and tapping methods (conventional, rain-guard, 5/2 d2). The marketplace sits alongside the rain decision tool under the same app — switch between Grower Mode, Tapper Mode, and Rain Decision from the role selector.

---

## Screenshots — Rain Decision Tool

<div align="center">
<table>
<tr>
<td align="center" width="25%">
<img src="docs/screen_onboarding.png" width="200"/><br/>
<sub><b>Onboarding</b><br/>Location · Tree age<br/>Tapping system · Sale method</sub>
</td>
<td align="center" width="25%">
<img src="docs/screen_tap.png" width="200"/><br/>
<sub><b>Tap — clear conditions</b><br/>Confidence bar · Weather grid<br/>Reasoning bullets</sub>
</td>
<td align="center" width="25%">
<img src="docs/screen_yield.png" width="200"/><br/>
<sub><b>Yield & Labour card ✨</b><br/>Expected litres · Tappers needed<br/>Tapper blocks · Latex tip · Off-season note</sub>
</td>
<td align="center" width="25%">
<img src="docs/screen_donttap.png" width="200"/><br/>
<sub><b>Don't Tap — rain risk</b><br/>Next safe window<br/>Off-season banner</sub>
</td>
</tr>
</table>
</div>

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
| Persistence | `localStorage` for plantation profile · PocketBase-style API abstraction for marketplace prototype |

---

## Features

### Phase 1 — Decision Engine
- Rain probability gating (hard block at 60%, caution at 35%)
- Rain amount threshold (block at 2 mm, caution at 0.5 mm)
- Humidity flag — very high humidity (≥ 95%) triggers caution even without rain
- Tree age modifiers — young trees tighten thresholds, old trees relax them
- Rain-guard support — 25% threshold relaxation for installed rain-guard systems
- Large plantation lead-time — > 500 trees gets an earlier recommended start
- Next safe window — scans 48 h ahead for the first clean 3-hour slot

### Phase 2 — Yield & Labour Intelligence ✨
- **Latex yield estimate** — calculates expected litres per tapping day based on tree count (50 L/tapper block)
- **Labour planning** — tells you how many tappers you need and how many blocks your plantation forms
- **Off-season detection** — flags June–August Kerala stress period; warns against over-tapping
- **Latex sale method** — onboarding captures whether you sell liquid latex or rubber sheets; tailored post-tap tips (DRC % for liquid, coagulation timing for sheets)
- **Seasonal awareness** — yield engine skips estimates during declared off-season to avoid misleading projections

### Tapper Marketplace ✨
- **Landing mode switcher** — choose Grower or Tapper, with the rain decision tool still available to growers
- **Tapper profile creation** — publish a no-auth work profile in under two minutes
- **Swipeable tapper profiles** — browse Kerala tappers and pass or mark interest
- **Right swipe to reveal contact** — direct call or WhatsApp after grower interest
- **PocketBase-style persistence** — uses `NEXT_PUBLIC_POCKETBASE_URL` when configured and localStorage fallback for prototypes

### Frontend
- Onboarding form — location search, tree age, tapping system, preferred start time, latex sale method
- Recommendation card — verdict badge, confidence bar, weather grid, reasoning bullets, next safe window, yield & labour panel, off-season banner
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
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL and optional NEXT_PUBLIC_POCKETBASE_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API

```
GET  /health
GET  /weather/forecast?lat=9.59&lon=76.52&days=2
POST /decision/recommend  { plantation: {...}, hourly_forecast: [...] }

# Optional PocketBase marketplace collections
GET  /api/collections/tappers/records
POST /api/collections/tappers/records
POST /api/collections/matches/records
```

**`POST /decision/recommend` response includes:**
```json
{
  "recommendation": "tap",
  "confidence": 88,
  "headline": "Good conditions — tap today.",
  "reasoning": ["Rain stays at 12%...", "High humidity noted..."],
  "next_window": null,
  "weather_summary": { "tapping_window": "05:00–09:00", ... },
  "yield_estimate": {
    "estimated_litres": 20,
    "tappers_needed": 1,
    "num_blocks": 1,
    "off_season": false,
    "note": "..."
  }
}
```

---

## Roadmap

- [x] FastAPI backend + Open-Meteo weather proxy
- [x] Rule-based decision engine
- [x] Next.js 15 frontend — onboarding, recommendation card, dark mode
- [x] localStorage persistence, no login required
- [x] **Yield & labour estimator** ✨
- [x] **Off-season detection** ✨
- [x] **Latex sale method onboarding + tailored tips** ✨
- [x] **Tapper Marketplace — swipeable profiles, role switcher** ✨
- [ ] Durable PocketBase disk/storage for production marketplace data
- [ ] Leaflet interactive map for precise location pin
- [ ] Offline PWA with cached last forecast
- [ ] Malayalam / English language toggle
- [x] Deployment guide (Vercel + Render)

---

<div align="center">
  <sub>Built for the rubber growers of Kerala · MIT © 2026</sub>
</div>
