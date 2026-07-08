# Supabase backend

Live backend for Martis Camp Families, per `../design_handoff_martis_camp_families/BACKEND_SPEC.md`.
Postgres + Row Level Security + magic-link auth. The app runs on **mock data**
until `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set — then it switches to
the database automatically (no code change).

## Migrations

| File | What it does |
|------|--------------|
| `migrations/0001_schema.sql` | All tables, enums (via CHECK), indexes, `updated_at` triggers |
| `migrations/0002_rls.sql`    | RLS: read shared, write own, admin bypass; helper functions |
| `migrations/0003_seed.sql`   | Seed families/members/attendance/get-togethers/RSVPs/community/feed (July 2025) |

## Set up (either path)

### A. Supabase dashboard (no CLI)
1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → run `0001_schema.sql`, then `0002_rls.sql`, then `0003_seed.sql` (in order).
3. Authentication → Providers → Email: enable **Email OTP / magic link**.
4. Project Settings → API → copy the **Project URL** and **anon public key**.
5. Add to the app's `.env.local`:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon public key>
   ```
6. Restart `npm run dev`. The landing page now sends real magic links; the app
   reads families/members/attendance/get-togethers/RSVPs/feed from Postgres.

### B. Supabase CLI
```bash
supabase link --project-ref <ref>
supabase db push          # applies everything in migrations/
```

## This project is provisioned ✅

Migrations `0001`–`0005` are already applied to the live project
(`dyqqzqejyqmlhnmcspwz`), seeded, and RLS-verified. `.env.local` points at it, so
`npm run dev` runs against Postgres.

**One manual step for magic-link sign-in locally:** in the Supabase dashboard →
**Authentication → URL Configuration**, set the **Site URL** to
`http://localhost:5173` and add it to **Redirect URLs** (new projects default to
`localhost:3000`, so the emailed link needs `5173` allow-listed to land back on
the app). Then sign in with **jeff@bonforte.com** (seeded as admin) — the magic
link links your auth user to the Bonforte member on first sign-in.

### Accepted advisor note
The four `current_member_id` / `current_family_id` / `is_admin` / `can_see_event`
helpers are `SECURITY DEFINER` (so RLS can read `members` without policy
recursion). Supabase's linter flags that signed-in users can call them via RPC —
kept intentionally: RLS requires `authenticated` to execute them, and each only
returns the *caller's own* state, so there's no data exposure. `anon` execute was
revoked.

## Auth model
- **Invite-only magic link.** `invites` gates who may sign in; the seed adds
  `jeff@bonforte.com` (linked to the Bonforte family, marked admin).
- On first sign-in the app links `auth.users.id` → the matching `members` row by
  email (`ensureMemberLink` in `src/lib/api.js`).
- Enforce the invite gate server-side with an Auth Hook / Edge Function in
  production (the client link is convenience, not security).

## What's wired vs. next
**Wired now (when configured):** magic-link auth + session gate; reads for
families, members, attendance→presence, get-togethers, RSVPs, invites, community
calendar, favorites, and the feed; **persisted** RSVP + favorite toggles.

**Next increments:** persist attendance from Plan-a-visit, host/announcement
creation, profile edits, comments, the admin dashboard (families/invites/community
CRUD), photo upload to Storage, realtime subscriptions, and moving the weather
proxy to an Edge Function. Table shapes for all of these already exist in the
schema.
