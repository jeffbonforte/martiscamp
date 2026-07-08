import React from 'react';

/** Multi-select chip group used in the host + edit dialogs. */
export function ChipMulti({ label, options, value, onToggle, labelOf }) {
  return (
    <div>
      <div style={{ font: 'var(--fw-medium) var(--text-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button key={o} type="button" onClick={() => onToggle(o)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                border: `1px solid ${on ? 'var(--brand)' : 'var(--border-strong)'}`, background: on ? 'var(--brand)' : 'var(--surface-card)', color: on ? '#fff' : 'var(--text-body)',
                font: 'var(--fw-semibold) var(--text-xs)/1 var(--font-sans)', textTransform: 'capitalize' }}>
              {on && <i data-lucide="check" style={{ width: 12, height: 12 }} />}{labelOf ? labelOf(o) : o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ChipMulti;
