import React from 'react';

/** Amenity/activity mapping: label -> {hue token, lucide glyph}. */
export const AMENITIES = {
  ski:        { label: 'Skiing',      hue: 'var(--act-ski)',    glyph: 'mountain-snow' },
  golf:       { label: 'Golf',        hue: 'var(--act-golf)',   glyph: 'flag' },
  tennis:     { label: 'Tennis',      hue: 'var(--act-tennis)', glyph: 'circle-dot' },
  pickleball: { label: 'Pickleball',  hue: 'var(--act-tennis)', glyph: 'circle-dot' },
  pool:       { label: 'Pool',        hue: 'var(--act-pool)',   glyph: 'waves' },
  workout:    { label: 'Workout',     hue: 'var(--stone-600)',  glyph: 'dumbbell' },
  hike:       { label: 'Hiking',      hue: 'var(--act-hike)',   glyph: 'footprints' },
  beach:      { label: 'Beach Club',  hue: 'var(--act-pool)',   glyph: 'umbrella' },
  dining:     { label: 'Dining',      hue: 'var(--act-dining)', glyph: 'utensils' },
  cafe:       { label: 'Café',        hue: 'var(--cedar-600)',  glyph: 'coffee' },
  puttputt:   { label: 'Putt-putt',   hue: 'var(--act-golf)',   glyph: 'flag-triangle-right' },
  social:     { label: 'Social',      hue: 'var(--act-social)', glyph: 'users' },
};

/**
 * Amenity tag with a stable accent hue + optional Lucide glyph.
 * Pass `amenity` (a key of AMENITIES) or a custom label + hue.
 */
export function AmenityTag({ amenity, label, hue, glyph, size = 'md', style = {} }) {
  const meta = AMENITIES[amenity] || {};
  const text = label || meta.label || amenity;
  const color = hue || meta.hue || 'var(--stone-600)';
  const ic = glyph || meta.glyph;
  const pad = size === 'sm' ? '2px 8px' : '4px 10px';
  const fs = size === 'sm' ? 'var(--text-2xs)' : 'var(--text-xs)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: pad,
      borderRadius: 'var(--radius-pill)',
      background: `color-mix(in srgb, ${color} 12%, var(--snow))`,
      color, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
      font: `var(--fw-semibold) ${fs}/1 var(--font-sans)`, whiteSpace: 'nowrap', ...style,
    }}>
      {ic && <i data-lucide={ic} style={{ width: 13, height: 13 }} />}
      {text}
    </span>
  );
}
