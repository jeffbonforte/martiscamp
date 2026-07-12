import React from 'react';
import { useLucide } from '../../lib/useLucide.js';

/**
 * BottomTabBar — mobile navigation (the desktop Sidebar's counterpart). Ported
 * from DS v1.1. Translucent paper + blur, hairline top border, pine active,
 * 48px hit targets. items: [{ id, label, icon }] — 4–5 items, Lucide names.
 */
export function BottomTabBar({ items = [], active, onChange, showLabels = true, style = {} }) {
  useLucide();
  return (
    <nav style={{
      display: 'grid', gridTemplateColumns: `repeat(${items.length || 1}, 1fr)`,
      background: 'rgba(250,249,246,.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      borderTop: '1px solid var(--border)', padding: '6px 4px calc(6px + env(safe-area-inset-bottom, 0px))',
      ...style,
    }}>
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <button
            key={it.id} type="button" onClick={() => onChange && onChange(it.id)}
            aria-label={it.label} aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              minHeight: 48, background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? 'var(--brand)' : 'var(--text-muted)', borderRadius: 'var(--radius-md)',
              transition: 'color var(--dur-fast) var(--ease-standard)',
            }}
          >
            <i data-lucide={it.icon} style={{ width: 22, height: 22 }} />
            {showLabels ? (
              <span style={{ font: `${isActive ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--text-2xs)/1 var(--font-sans)` }}>{it.label}</span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export default BottomTabBar;
