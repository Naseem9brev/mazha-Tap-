# Deploying mazha Tap

mazha Tap deploys as a single Vercel-hosted Next.js app. Do not create a separate FastAPI, Render, Fly.io, or PocketBase service for the Vercel preview path. The marketplace uses Supabase for shared Postgres records, tapper photo storage, and lightweight Auth-backed ownership/RLS.

## Vercel project configuration

Import the GitHub repository into Vercel with these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Project root | Repository root |
| Install command | `npm ci --prefix frontend` |
| Build command | `npm run build --prefix frontend` |
| Output directory | `frontend/.next` |

The root `vercel.json` pins the same commands, so the Vercel project should stay pointed at the repository root instead of `frontend/`.

## Required Vercel environment variables

Set these for Preview first. Add the same values to Production only after the preview is reviewed.

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview, Production | Supabase project URL, e.g. `https://<project-ref>.supabase.co`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview, Production | Public anon key used by the browser client. Keep RLS enabled; never use the service-role key in Vercel public env vars. |
| `NEXT_PUBLIC_SUPABASE_TAPPER_PHOTOS_BUCKET` | Optional | Defaults to `tapper-photos` if unset. |

No `NEXT_PUBLIC_API_URL` is required for the Vercel-only app. Keep any FastAPI URL unset unless you are intentionally testing a legacy local backend branch.

## Supabase marketplace requirements

Create or connect a Supabase project before requesting a Vercel preview:

1. Apply the marketplace schema and policies described in [`docs/supabase-marketplace.md`](docs/supabase-marketplace.md).
2. Create a public-read Storage bucket named `tapper-photos` unless you override it with `NEXT_PUBLIC_SUPABASE_TAPPER_PHOTOS_BUCKET`.
3. Enable Auth providers needed for the preview:
   - Anonymous sign-ins for grower browsing/match creation without a full signup gate.
   - Email OTP or magic links for tapper profile ownership when testing edit flows.
4. Configure Supabase Auth URLs:
   - Site URL: the reviewed production domain when ready.
   - Redirect URLs: `https://*.vercel.app/**` for previews and the production domain after launch.
5. Confirm RLS is enabled for all marketplace tables. Contact numbers should only be readable by the tapper owner or by a grower after a recorded match.

## Preview deployment steps

1. Push the feature branch to GitHub and open a PR.
2. In Vercel, confirm the PR generates a Preview deployment. If it does not, trigger a preview from the Vercel project after the branch is pushed.
3. Verify Preview env vars are present in Vercel Project Settings -> Environment Variables.
4. Wait for the Vercel build to finish and copy the generated `https://<deployment>.vercel.app` preview URL into the PR or parent coordination thread.
5. Run the smoke checklist below against the preview URL.
6. Do not promote or redeploy Production until the preview has been reviewed and approved.

## Smoke checklist

- Home page renders on the Vercel preview without build-time or runtime env errors.
- Role selector can switch between Grower Mode, Tapper Mode, and Rain Decision.
- Rain Decision can complete its onboarding path and show a verdict/yield card.
- Tapper Mode can create a profile with district, availability, languages, capacity, contact number, and optional photo.
- Supabase `tapper_profiles` receives the created profile and Storage receives the uploaded photo when provided.
- Grower Mode can filter profiles by district/availability/minimum experience.
- A right swipe or contact action records a `tapper_matches` row and reveals the matched tapper contact.
- Refreshing the preview keeps Supabase-backed marketplace data available.
- Browser console has no Supabase Auth, RLS, Storage, CORS, or missing-env errors.
- A negative RLS check confirms anonymous users cannot list private contact data without a match.

## E2E validation checklist

- Run `npm run lint --prefix frontend`.
- Run `npm run build --prefix frontend`.
- Test one grower journey: open preview -> browse/filter tappers -> match -> reveal contact.
- Test one tapper journey: create or edit profile -> upload photo -> verify public profile/share URL.
- Test one rain journey: enter a Kerala location and plantation details -> confirm verdict, reasoning, weather summary, and yield/labour estimate.
- Confirm data created during testing can be cleaned from Supabase or is clearly marked as test data.

## Free tier notes

- Vercel Hobby is sufficient for PR previews and initial production hosting.
- Supabase free tier is sufficient for the preview marketplace dataset; monitor database row counts, Storage usage, and Auth rate limits before production launch.
- Open-Meteo is free and keyless.
- Nominatim geocoding is free but rate-limited; avoid automated high-volume geocoding during smoke tests.
