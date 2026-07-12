import React from 'react';
import { heroPool, heroGradient } from '../../lib/images.js';

/**
 * Home hero banner that rotates through a pool of season-appropriate brand
 * photos with a slow crossfade, so it doesn't feel static. The first frame is
 * seeded by the day, so it also varies visit to visit. Honors
 * prefers-reduced-motion (holds a single, day-varied image, no auto-advance).
 * Overlay content (eyebrow/title/actions) is passed as children.
 */
export function HeroPhoto({ season, height = 280, children }) {
  const images = React.useMemo(() => heroPool(season), [season]);
  const reduce = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  // Day-seeded start so the opening image changes day to day.
  const start = images.length ? Math.floor(Date.now() / 86400000) % images.length : 0;
  const [idx, setIdx] = React.useState(start);

  React.useEffect(() => {
    if (reduce || images.length < 2) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 6500);
    return () => clearInterval(t);
  }, [images.length, reduce]);

  return (
    <div style={{
      position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden',
      marginBottom: 'var(--space-6)', boxShadow: 'var(--shadow-md)', background: heroGradient(season), minHeight: height,
    }}>
      {images.map((src, i) => (
        <img key={src} src={src} alt="" aria-hidden="true"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height, objectFit: 'cover', objectPosition: 'center 62%',
            display: 'block', opacity: i === idx ? 1 : 0, transition: 'opacity 1200ms ease-in-out',
          }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, height, background: 'linear-gradient(to top, rgba(20,15,10,.72) 0%, rgba(20,15,10,.18) 42%, rgba(20,15,10,0) 70%)' }} />
      <div style={{ position: 'relative', height }}>{children}</div>
    </div>
  );
}

export default HeroPhoto;
