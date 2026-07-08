# Deploying to Vercel

The app is a Vite SPA + serverless functions in `api/` (weather). Vercel
auto-detects the Vite framework (`vite build` → `dist/`) and builds `api/*.js`
as Node serverless functions — no `vercel.json` needed.

## 1. Push to GitHub
This repo is ready to push (see the root README). Once it's on GitHub, import it
in Vercel: **Add New → Project → import the repo**. Framework preset should
auto-detect as **Vite**.

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)
| Name | Value | Notes |
|------|-------|-------|
| `VITE_SUPABASE_URL` | `https://dyqqzqejyqmlhnmcspwz.supabase.co` | your project URL |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_…` | anon/publishable key (safe to expose) |
| `WEATHER_LAT` | `39.328` | optional (defaults baked in) |
| `WEATHER_LON` | `-120.1833` | optional |

`VITE_`-prefixed vars are inlined into the client bundle at build time — set them
before the first deploy. `WEATHER_*` are read server-side by the functions.

Do **not** add the WeatherUnlocked keys — they're unused (Open-Meteo needs none).

## 3. Point Supabase auth at the deployed URL
Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL:** your Vercel URL (e.g. `https://martis-camp-families.vercel.app`)
- **Redirect URLs:** add both the Vercel URL and `http://localhost:5173` (for local dev)

Magic-link emails redirect to the origin the request came from, so both need to
be allow-listed.

## 4. Verify after deploy
- `https://<app>/api/weather` returns live JSON (`ok: true`).
- Sign in with `jeff@bonforte.com`; the directory / get-togethers / feed load
  from Postgres.

## Notes
- The `supabase/migrations/` are already applied to the live project. For a fresh
  environment, run them in order (`supabase/README.md`).
- Weather always degrades to mock if the function/network fails — the UI never
  breaks.
