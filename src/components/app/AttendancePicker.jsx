import React from 'react';

/**
 * Day-attendance picker: a row of day toggles for marking which days you'll
 * be up at the community. days = [{key,label,sub}]; selected = Set/array of keys.
 */
export function AttendancePicker({ days = [], selected = [], onToggle, style = {} }) {
  const sel = new Set(selected);
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', ...style }}>
      {days.map((d) => {
        const on = sel.has(d.key);
        return (
          <button key={d.key} type="button" onClick={() => onToggle && onToggle(d.key)}
            aria-pressed={on}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              minWidth: 56, padding: '8px 10px', cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              background: on ? 'var(--brand)' : 'var(--surface-card)',
              color: on ? 'var(--text-on-brand)' : 'var(--text-body)',
              border: `1px solid ${on ? 'var(--brand)' : 'var(--border-strong)'}`,
              boxShadow: on ? 'var(--shadow-xs)' : 'none',
              transition: 'background var(--dur-fast), border-color var(--dur-fast), color var(--dur-fast)',
            }}>
            <span style={{ font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', opacity: on ? 0.85 : 0.6 }}>{d.label}</span>
            <span style={{ font: `var(--fw-${on ? 'semibold' : 'medium'}) var(--text-lg)/1 var(--font-sans)` }}>{d.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
