---
name: testing-mazha-tap
description: Test the Mazha Tap Next.js app locally, including marketplace profile/match flows and rain-decision reachability.
---

# Testing Mazha Tap

## Devin Secrets Needed

- None for local demo testing. The marketplace works with seed data and browser `localStorage` when `NEXT_PUBLIC_SUPABASE_URL` is unset.
- Optional deployment testing may need platform tokens already available through the environment, such as Vercel/Render/Supabase credentials, but local UI testing does not require them.

## Local setup

Run from the repo root:

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

Open `http://localhost:3000` in Chrome. For deterministic marketplace tests, clear browser `localStorage` before the recording, then reload the app.

If `next dev` returns a transient Next devtools/client-manifest 500 after hot reload, restart the dev server cleanly and re-check `http://localhost:3000` before recording. Production validation should still use:

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

## Recording notes

Use one focused recording for the primary flow and add annotations for:

- Grower precondition
- Profile saved
- Contact hidden before match
- Contact visible after match
- Rain Decision reachable
- Edit ownership retained
