// Brand photo helpers. Photos live (bundled) in src/assets/images/ and follow:
//   <category>-<description>-<season|all>.<ext>
//   category: hero | venue | activity      season: winter|spring|summer|fall|all
// They're discovered via import.meta.glob, so any correctly-named file dropped
// into that folder is picked up automatically on the next build — no code change.
// A missing photo still reads intentionally: components fall back to tinted
// panels / serif initials, and the hero falls back to a seasonal gradient.
//
// NOTE: personal family/member photos do NOT live here — they're uploaded in-app
// to private Supabase Storage and resolved to short-lived signed URLs (lib/api.js).

const MODULES = import.meta.glob('../assets/images/*.{jpg,jpeg,png}', {
  eager: true, query: '?url', import: 'default',
});

// Parse each bundled file into { file, url, category, season }.
const PHOTOS = Object.entries(MODULES).map(([path, url]) => {
  const file = path.split('/').pop();
  const parts = file.replace(/\.[^.]+$/, '').split('-');
  return { file, url, category: parts[0], season: parts[parts.length - 1] };
});
const URL_BY_FILE = Object.fromEntries(PHOTOS.map((p) => [p.file, p.url]));

// Legacy ad-hoc filenames → current file, so covers/banners seeded with the old
// names (in the live DB or older data) keep resolving after the rename.
const LEGACY = {
  'lodge.jpg': 'venue-clubhouse-summer.jpg',
  'ski-lodge.jpg': 'activity-skiing-winter.jpg',
  'golf-summer.jpg': 'activity-golf-summer.jpg',
  'treehouse-park.jpg': 'venue-treehouse_park-summer.jpg',
  'family-barn.jpg': 'venue-family_barn-summer.jpg',
  'camp-lodge-winter-aerial.jpg': 'hero-camp_aerial-winter.jpg',
  'hero-summer.jpg': 'activity-golf-summer.jpg',
  'hero-spring.jpg': 'venue-treehouse_park-summer.jpg',
  'hero-winter.jpg': 'hero-snowy_meadow-winter.jpg',
  'hero-fall.jpg': 'hero-autumn_lodge-fall.jpg',
};

function resolve(name) {
  if (!name) return null;
  return URL_BY_FILE[name] || URL_BY_FILE[LEGACY[name]] || null;
}

export const LOGO_BADGE = '/assets/logos/martis-camp-badge.png';

/** Resolve a family cover: pass through signed/absolute URLs, else a bundled filename. */
export function coverUrl(name) {
  if (!name) return null;
  if (/^(https?:|blob:|data:|\/)/.test(name)) return name;
  return resolve(name);
}

// Tonal gradient placeholders per season — behind the hero so a missing image
// still reads as a warm alpine banner rather than an empty box.
export const HERO_GRADIENT = {
  winter: 'linear-gradient(120deg, var(--lake-800), var(--pine-800))',
  spring: 'linear-gradient(120deg, var(--pine-700), var(--lake-700))',
  summer: 'linear-gradient(120deg, var(--pine-800), var(--cedar-700))',
  fall: 'linear-gradient(120deg, var(--cedar-700), var(--pine-900))',
};
export function heroGradient(season) {
  return HERO_GRADIENT[season] || HERO_GRADIENT.summer;
}

/**
 * The Home hero rotates through season-appropriate brand photos. Any category
 * works as a full-bleed hero (a strong venue/activity shot doubles fine), so we
 * filter only by season — matching the current season or tagged 'all' — and fall
 * back to the whole set when a season has no photos yet.
 */
export function heroPool(season) {
  const match = PHOTOS.filter((p) => p.season === season || p.season === 'all');
  const list = match.length ? match : PHOTOS;
  return list.map((p) => p.url);
}
export function heroUrl(season) {
  return heroPool(season)[0] || null;
}

// Activity → banner photo (get-together detail). Returns null when no match, so
// the detail page simply omits the banner.
const ACT_FILE = {
  ski: 'activity-skiing-winter.jpg',
  golf: 'activity-golf-summer.jpg',
  beach: 'venue-treehouse_park-summer.jpg',
  dining: 'venue-family_barn-summer.jpg',
  social: 'venue-family_barn-summer.jpg',
  hike: 'venue-clubhouse-summer.jpg',
};
export function activityImage(amenity) {
  return ACT_FILE[amenity] ? resolve(ACT_FILE[amenity]) : null;
}
