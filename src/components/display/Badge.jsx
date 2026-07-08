import React from 'react';

const TONES = {
  neutral: { bg: 'var(--stone-100)', fg: 'var(--stone-700)' },
  brand:   { bg: 'var(--brand-soft)', fg: 'var(--pine-800)' },
  success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  warning: { bg: 'var(--warning-soft)', fg: 'var(--amber-600)' },
  danger:  { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  info:    { bg: 'var(--info-soft)', fg: 'var(--info)' },
  warm:    { bg: 'var(--warm-soft)', fg: 'var(--cedar-700)' },
};

/** Small status pill. Use `dot` for a status indicator dot. */
export function Badge({ children, tone = 'neutral', dot = false, style = {} }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 'var(--radius-pill)',
      background: t.bg, color: t.fg,
      font: 'var(--fw-semibold) var(--text-xs)/1 var(--font-sans)',
      letterSpacing: 'var(--tracking-snug)', whiteSpace: 'nowrap', ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.fg }} />}
      {children}
    </span>
  );
}
