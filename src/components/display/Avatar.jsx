import React from 'react';

const SIZES = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 };

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

/** Round avatar. Shows a photo if `src` given, else serif initials on a tinted disc.
 *  Falls back to initials if the photo fails to load. */
export function Avatar({ name = '', src, size = 'md', tone = 'var(--pine-600)', ring = false, style = {} }) {
  const dim = SIZES[size] || SIZES.md;
  const [err, setErr] = React.useState(false);
  React.useEffect(() => { setErr(false); }, [src]);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: dim, height: dim, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      background: `color-mix(in srgb, ${tone} 16%, var(--snow))`, color: tone,
      boxShadow: ring ? '0 0 0 2px var(--snow), 0 0 0 3px var(--border)' : 'none',
      font: `var(--fw-regular) ${Math.round(dim * 0.4)}px/1 var(--font-display)`,
      userSelect: 'none', ...style,
    }} title={name}>
      {src && !err
        ? <img src={src} alt={name} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials(name)}
    </span>
  );
}
