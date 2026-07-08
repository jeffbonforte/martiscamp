import React from 'react';

/** Empty / zero state. Warm, encouraging copy. glyph = Lucide name. */
export function EmptyState({ glyph = 'mountain-snow', title, description, action = null, style = {} }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      padding: 'var(--space-12) var(--space-6)', gap: 'var(--space-3)', ...style,
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 56, height: 56, borderRadius: 'var(--radius-xl)',
        background: 'var(--brand-soft)', color: 'var(--brand)', marginBottom: 'var(--space-2)',
      }}>
        <i data-lucide={glyph} style={{ width: 26, height: 26 }} />
      </span>
      {title && <div style={{ font: 'var(--fw-regular) var(--text-2xl)/1.2 var(--font-display)', color: 'var(--text-strong)' }}>{title}</div>}
      {description && <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)', maxWidth: 360 }}>{description}</div>}
      {action && <div style={{ marginTop: 'var(--space-2)' }}>{action}</div>}
    </div>
  );
}
