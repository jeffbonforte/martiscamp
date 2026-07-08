import React from 'react';

/**
 * Text input with optional label, hint, error, and leading/trailing adornments.
 */
export function Input({
  label, hint, error, id, leading = null, trailing = null,
  size = 'md', style = {}, containerStyle = {}, disabled = false, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const rid = id || React.useId();
  const h = size === 'sm' ? 34 : size === 'lg' ? 48 : 40;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', ...containerStyle }}>
      {label && (
        <label htmlFor={rid} style={{
          font: 'var(--fw-medium) var(--text-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)',
        }}>{label}</label>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        height: h, padding: '0 var(--space-3)',
        background: disabled ? 'var(--surface-sunk)' : 'var(--surface-card)',
        border: `1px solid ${error ? 'var(--danger)' : focus ? 'var(--focus-ring)' : 'var(--border-strong)'}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: focus ? 'var(--shadow-focus)' : 'none',
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
      }}>
        {leading && <span style={{ display: 'flex', color: 'var(--text-muted)' }}>{leading}</span>}
        <input
          id={rid} disabled={disabled}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            font: 'var(--role-body)', color: 'var(--text-strong)', ...style,
          }}
          {...rest}
        />
        {trailing && <span style={{ display: 'flex', color: 'var(--text-muted)' }}>{trailing}</span>}
      </div>
      {(hint || error) && (
        <span style={{
          font: 'var(--fw-regular) var(--text-xs)/1.4 var(--font-sans)',
          color: error ? 'var(--danger)' : 'var(--text-muted)',
        }}>{error || hint}</span>
      )}
    </div>
  );
}
