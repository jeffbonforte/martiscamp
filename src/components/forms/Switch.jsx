import React from 'react';

/** Toggle switch. Controlled via checked/onChange. */
export function Switch({ label, checked = false, onChange, disabled = false, id, style = {} }) {
  const rid = id || React.useId();
  return (
    <label htmlFor={rid} style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style,
    }}>
      <span style={{
        position: 'relative', width: 40, height: 24, borderRadius: 'var(--radius-pill)', flexShrink: 0,
        background: checked ? 'var(--brand)' : 'var(--stone-300)',
        transition: 'background var(--dur-base) var(--ease-standard)',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2, width: 20, height: 20,
          borderRadius: '50%', background: 'var(--snow)', boxShadow: 'var(--shadow-sm)',
          transition: 'left var(--dur-base) var(--ease-standard)',
        }} />
      </span>
      <input id={rid} type="checkbox" role="switch" checked={checked} disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.checked, e)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      {label && <span style={{ font: 'var(--role-small)', color: 'var(--text-body)' }}>{label}</span>}
    </label>
  );
}
