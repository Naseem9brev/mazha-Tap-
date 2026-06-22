---
name: testing-mazha-tap
description: Test the Mazha Tap Next.js app locally, including marketplace profile/match flows and rain-decision reachability.
---

# Testing Mazha Tap

## Devin Secrets Needed

- None for local demo testing. The marketplace works with seed data and browser `localStorage` when `NEXT_PUBLIC_POCKETBASE_URL` is unset.
- Optional deployment testing may need platform tokens already available through the environment, such as Vercel/Render/PocketBase credentials, but local UI testing does not require them.

## Local setup

Run from the repo root:

```bash
npm install --prefix frontend
python3 -m pip install -r backend/requirements.txt
```

For frontend development:

```bash
npm run dev --prefix frontend
```

Open `http://localhost:3000` in Chrome. For deterministic marketplace tests, clear browser `localStorage` before the recording, then reload the app.

If `next dev` returns a transient Next devtools/client-manifest 500 after hot reload, restart the dev server cleanly and re-check `http://localhost:3000` before recording. If it persists and a production build has passed, use a production server instead:

```bash
npm run build --prefix frontend
npm run start --prefix frontend -- -p 3000
```

For full Rain Decision recommendation testing, run the local API in another shell:

```bash
(cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000)
```

Production validation should still use:

```bash
npm run lint --prefix frontend
npm run build --prefix frontend
```

## Marketplace runtime test path

1. Start on Grower mode and verify the header mode switcher plus seeded tapper deck are visible.
2. Switch to `I’m a Tapper` and create a distinct local profile with a recognizable name, phone number, district, capacity, and bio.
3. After saving, verify the saved message, `Update profile` state, public/private link fields, and live preview card.
4. Switch to `I’m a Grower`, filter by the profile's district, and verify the created profile is shown with contact hidden before matching.
5. Click the green match/phone button and verify the reveal panel shows the tapper name, visible phone number, `Call`, and `WhatsApp` actions.
6. Use `Rain Decision` as a light regression check; it should show the Phase 1 plantation onboarding or current rain-decision state.
7. Return to `I’m a Tapper` and verify the profile is prefilled with `Update profile`, proving local edit ownership persisted.

## Rain Decision runtime test path

1. Clear `localStorage['mazha-tap-plantation']`, reload the app, then click `Rain Decision`.
2. Verify the onboarding state shows the rain side panel, `Plantation profile`, default selections, and a disabled `Get today's recommendation →` CTA before location is selected.
3. For deterministic result-state testing, set `localStorage['mazha-tap-plantation']` to a complete profile with `latitude`, `longitude`, `size_hectares`, `num_trees`, `tree_age`, `tapping_system`, `tap_start_hour`, and `latex_sale_method`, then reload and click `Rain Decision`.
4. Verify the result state shows `Today’s verdict`, the location heading, a verdict badge, confidence percentage, weather metric cards, reasoning bullets, yield/labour estimate, `Refresh`, and `Change plantation`.

## Recording notes

Use one focused recording for the primary flow and add annotations for:

- Grower precondition or Rain Decision mode selection
- Profile saved or onboarding precondition
- Contact hidden before match or disabled rain CTA
- Contact visible after match or rain result visible
- Rain Decision reachable
- Edit ownership retained when testing marketplace profiles
