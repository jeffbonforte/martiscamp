import React from 'react';

const STATES = [
  { key: 'going',    label: 'Attending', icon: 'check',    on: 'var(--success)',  soft: 'var(--success-soft)' },
  { key: 'maybe',    label: 'Maybe',     icon: 'help-circle', on: 'var(--warning)', soft: 'var(--warning-soft)' },
  { key: 'declined', label: "Can't",     icon: 'x',        on: 'var(--danger)',   soft: 'var(--danger-soft)' },
];

/** Three-state RSVP control: Attending / Maybe / Can't. Controlled via value. */
export function RsvpControl({ value, onChange, size = 'md', block = false, style = {} }) {
  const pad = size === 'sm' ? '7px 10px' : '10px 14px';
  const fs = size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)';
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', width: block ? '100%' : 'auto', ...style }}>
      {STATES.map((s) => {
        const active = value === s.key;
        return (
          <button key={s.key} type="button" onClick={() => onChange && onChange(active ? null : s.key)}
            aria-pressed={active}
            style={{
              flex: block ? 1 : 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: pad, borderRadius: 'var(--radius-md)', cursor: 'pointer',
              background: active ? s.soft : 'var(--surface-card)',
              color: active ? s.on : 'var(--text-muted)',
              border: `1px solid ${active ? s.on : 'var(--border-strong)'}`,
              font: `var(--fw-semibold) ${fs}/1 var(--font-sans)`,
              transition: 'background var(--dur-fast), border-color var(--dur-fast), color var(--dur-fast)',
            }}>
            <i data-lucide={s.icon} style={{ width: 15, height: 15 }} />{s.label}
          </button>
        );
      })}
    </div>
  );
}
