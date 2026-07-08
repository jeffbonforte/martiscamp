import React from 'react';

/** Checkbox with label. Controlled via checked/onChange. */
export function Checkbox({ label, checked = false, onChange, disabled = false, id, style = {} }) {
  const rid = id || React.useId();
  return (
    <label htmlFor={rid} style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: 'var(--radius-xs)', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: checked ? 'var(--brand)' : 'var(--surface-card)',
        border: `1px solid ${checked ? 'var(--brand)' : 'var(--border-strong)'}`,
        transition: 'background var(--dur-fast), border-color var(--dur-fast)',
      }}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        )}
      </span>
      <input id={rid} type="checkbox" checked={checked} disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.checked, e)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      {label && <span style={{ font: 'var(--role-small)', color: 'var(--text-body)' }}>{label}</span>}
    </label>
  );
}
