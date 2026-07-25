# Brand photos (bundled)

These are the app's **brand / scenery photos** — hero banners, venues, and
activity shots. They're bundled by Vite (`import.meta.glob` in `src/lib/images.js`),
so **any correctly-named file dropped in this folder is picked up automatically
on the next build** — no code change needed.

> Personal family & member photos do **not** go here. Upload those in-app
> (Edit family / Edit profile / Add member) — they land in private Supabase
> Storage and are served via short-lived signed URLs.

## Naming convention

```
<category>-<description>-<season>.<ext>
```

- **category**: `hero` · `venue` · `activity`
  - `hero` — wide scenic banners (no single dominant subject)
  - `venue` — a specific place (clubhouse, barn, treehouse park)
  - `activity` — an activity in progress (golf, skiing)
- **description**: short, use `_` between words (e.g. `family_barn`, `golf`)
- **season**: `winter` · `spring` · `summer` · `fall` · `all`
  - use `all` for a shot that fits any time of year

Examples: `hero-snowy_meadow-winter.jpg`, `venue-clubhouse-summer.jpg`,
`activity-golf-summer.jpg`, `venue-family_barn-all.jpg`.

## How they're used

- **Home hero** rotates through every photo whose season matches the current
  season (or `all`) — any category works as a full-bleed hero. Add more
  `*-summer` / `*-all` files to enrich the rotation.
- **Get-together banners** map an activity to a photo (see `ACT_FILE` in
  `images.js`).
- **Family covers** reference a filename; the picker options live in
  `EditProfileDialog.jsx`.

Old ad-hoc names (`lodge.jpg`, `golf-summer.jpg`, …) still resolve via a
`LEGACY` map in `images.js`, so nothing seeded with the old names breaks.
