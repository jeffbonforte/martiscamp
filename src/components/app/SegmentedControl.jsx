import React from 'react';

/** Segmented control (e.g. Directory / Calendar). options=[{value,label,icon?}] or strings. */
export function SegmentedControl({ options = [], value, onChange, size = 'md', style = {} }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const pad = size === 'sm' ? '5px 12px' : '8px 16px';
  const fs = size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)';
  return (
    <div style={{
      display: 'inline-flex', padding: 3, gap: 2, background: 'var(--surface-sunk)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', ...style,
    }}>
      {opts.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" onClick={() => onChange && onChange(o.value)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: pad,
              border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: active ? 'var(--surface-card)' : 'transparent',
              color: active ? 'var(--text-strong)' : 'var(--text-muted)',
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
              font: `var(--fw-semibold) ${fs}/1 var(--font-sans)`,
              transition: 'background var(--dur-fast), color var(--dur-fast)',
            }}>
            {o.icon && <i data-lucide={o.icon} style={{ width: 15, height: 15 }} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
