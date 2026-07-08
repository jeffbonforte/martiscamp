// Image path helpers. Real photos live in public/assets/images/. When a file is
// absent the browser shows nothing for <img> — components already fall back to
// tinted panels / serif initials, and heroes fall back to a tonal gradient
// (see GRADIENTS below), so the app looks intentional without photography.

export const IMG_BASE = '/assets/images/';
export const LOGO_BADGE = '/assets/logos/martis-camp-badge.png';

/** Resolve a family cover ("lodge.jpg" or "family/bonfortes.jpg") to a URL. */
export function coverUrl(name) {
  if (!name) return null;
  if (name.startsWith('/') || name.startsWith('http')) return name;
  return IMG_BASE + name;
}

// Season → hero image, mapped to files that actually exist in the asset set.
// (The prototype references not-yet-delivered seasonal heroes; we map to the
// closest real photo and let the gradient show through if the file is missing.)
export const HERO_BY_SEASON = {
  winter: 'ski-lodge.jpg',
  spring: 'treehouse-park.jpg',
  summer: 'golf-summer.jpg',
  fall: 'lodge.jpg',
};

// Tonal gradient placeholders per season — used behind/beneath the hero photo so
// a missing image still reads as a warm alpine banner rather than an empty box.
export const HERO_GRADIENT = {
  winter: 'linear-gradient(120deg, var(--lake-800), var(--pine-800))',
  spring: 'linear-gradient(120deg, var(--pine-700), var(--lake-700))',
  summer: 'linear-gradient(120deg, var(--pine-800), var(--cedar-700))',
  fall: 'linear-gradient(120deg, var(--cedar-700), var(--pine-900))',
};

export function heroUrl(season) {
  return IMG_BASE + (HERO_BY_SEASON[season] || HERO_BY_SEASON.summer);
}

export function heroGradient(season) {
  return HERO_GRADIENT[season] || HERO_GRADIENT.summer;
}

// Activity → banner photo (get-together detail). Maps to existing files; returns
// null when there's no good match so the detail page simply omits the banner.
const ACT_IMG = {
  ski: 'ski-lodge.jpg',
  golf: 'golf-summer.jpg',
  beach: 'treehouse-park.jpg',
  dining: 'family-barn.jpg',
  social: 'family-barn.jpg',
  hike: 'lodge.jpg',
};

export function activityImage(amenity) {
  return ACT_IMG[amenity] ? IMG_BASE + ACT_IMG[amenity] : null;
}
