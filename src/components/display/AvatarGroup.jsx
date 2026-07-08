import React from 'react';
import { Avatar } from './Avatar.jsx';

/** Overlapping stack of avatars with a +N overflow chip. members = [{name,src,tone}]. */
export function AvatarGroup({ members = [], size = 'md', max = 4, style = {} }) {
  const dim = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 }[size] || 40;
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  const overlap = Math.round(dim * 0.3);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
      {shown.map((m, i) => (
        <span key={i} style={{ marginLeft: i === 0 ? 0 : -overlap, position: 'relative', zIndex: shown.length - i }}>
          <Avatar {...m} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span style={{
          marginLeft: -overlap, width: dim, height: dim, borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--stone-100)', color: 'var(--text-muted)',
          boxShadow: '0 0 0 2px var(--snow)',
          font: `var(--fw-semibold) ${Math.round(dim * 0.32)}px/1 var(--font-sans)`,
        }}>+{extra}</span>
      )}
    </span>
  );
}
