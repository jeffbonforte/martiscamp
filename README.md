# Martis Camp Families

An invite-only web app for ~50 of the ~600 families in the Martis Camp community
(Truckee, CA) to coordinate visits: see who's up at the Camp, mark which days
you'll be around (up to a year ahead), organize impromptu get-togethers, browse
the family directory, and follow the community calendar.

Built from the **Martis Camp Families design system** (a Claude Design project)
as a production **Vite + React** app. The design system's tokens and components
are ported verbatim; the screens recreate the hi-fi prototype and add the
specced-but-not-yet-prototyped features (12-month calendar, plan-a-visit,
favorites' arrivals, near-term agenda).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the production build
```

## What's here

```
src/
  styles.css, tokens/     Design-system CSS custom properties (verbatim)
  components/             The 22 design-system React components (verbatim ESM)
  lib/
    useLucide.js          Hydrates <i data-lucide> icons after each render
    images.js             Cover/hero/activity image resolution + gradient fallbacks
    weather.js            Live weather client (falls back to mock)
    calendar.js           Month-grid generation + ICS / add-to-calendar helpers
  data/mockData.js        Mock families/members/gatherings/events/feed (DB shape)
  screens/                Landing, Here-now, Directory, Calendar, Get-togethers,
                          Updates, Account, Family/Member/Event details, Plan-a-visit,
                          and the Host / Edit / Add-to-calendar dialogs
  App.jsx, main.jsx       App shell (sidebar, top bar, feed, mobile tabs) + auth gate
```

Icons use **Lucide** via CDN (matches the design system). Fonts (Newsreader,
Libre Franklin, IBM Plex Mono) load from Google Fonts.

### Screens implemented
- **Landing / sign-in** — invite-only, password + magic-link paths (demo auth gate)
- **Here now** — who's at the Camp today, 7-day weather strip, mark-your-days, coming-up
- **Directory** — favorites strip + searchable, filterable family cards
- **Family / Member profiles** — schedules, contacts, edit (own family), favorite
- **Calendar** — my days · **favorites' next arrivals** · **near-term agenda** · **12-month forward month grid**
- **Plan a visit** — 12 month mini-calendars, per-member day marking, running summary
- **Get-togethers** — open vs invite-only, RSVP, add-to-calendar, WhatsApp handoff
- **Event detail** — RSVP, auto-collected attendee contacts, "start a WhatsApp group"
- **Updates** — activity feed from favorites + community, announcements
- **Account** — profile, notification preferences, sign out
- Fully responsive: sidebar collapses to a bottom tab bar at 760px

## Images

Real photography is not bundled (the design assets exceed the transfer limit).
Everything falls back gracefully — tinted covers, serif initials, gradient heroes.
Drop real photos into `public/assets/images/` (filenames listed in
`public/assets/images/README.md`) to light them up.

## Weather (Open-Meteo)

Live weather/snow is **live** via **Open-Meteo** (free, no API key, HTTPS),
proxied through `vite.config.js` (`/api/weather`, `/api/snow`). The daily strip
shows real hi/lo + conditions for Truckee (lat/lon in `.env.local`); the winter
snow banner uses real snow depth + recent snowfall. Everything degrades to the
built-in mock if the network is unavailable, so the UI never breaks.

In production, move the proxy to a serverless function (e.g. a Supabase Edge
Function) and cache the response a few times a day.

_WeatherUnlocked was the original plan (Northstar ski feed) but is currently
blocked — the account can't add the resort, the forecast endpoint 403s on that
plan, and their HTTPS cert is expired. It's left commented in `.env.local` as a
fallback option (it would add lift/trail-open status, which Open-Meteo lacks)._

## Backend (Supabase)

The full **Supabase** backend is scaffolded in [`supabase/`](./supabase) —
Postgres schema, Row Level Security, seed data, and magic-link auth. The app
runs on mock data until you set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
in `.env.local`, then it switches to the live database automatically (no code
change). See [`supabase/README.md`](./supabase/README.md) for setup.

- `src/lib/supabase.js` — client (configured only when the env vars are present)
- `src/lib/api.js` — data-access layer: maps DB rows into the screens' shape,
  auth helpers (magic link, session, member linking), and RSVP/favorite writes
- Falls back to mock data + a demo auth gate when unconfigured, so the UI always
  works offline.

Wired now (when configured): magic-link auth, reads for the whole directory /
attendance / get-togethers / RSVPs / feed / favorites, and persisted RSVP +
favorite toggles. Next increments (schema already supports them): attendance
writes from Plan-a-visit, host/announcement creation, profile edits, comments,
admin dashboard, photo upload to Storage, realtime.
