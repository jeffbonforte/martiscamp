import React from 'react';

/** Multi-line text input for comments, notes, gathering descriptions. */
export function Textarea({ label, hint, error, id, rows = 4, style = {}, containerStyle = {}, disabled = false, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const rid = id || React.useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', ...containerStyle }}>
      {label && (
        <label htmlFor={rid} style={{
          font: 'var(--fw-medium) var(--text-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)',
        }}>{label}</label>
      )}
      <textarea
        id={rid} rows={rows} disabled={disabled}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          resize: 'vertical', padding: 'var(--space-3)',
          background: disabled ? 'var(--surface-sunk)' : 'var(--surface-card)',
          border: `1px solid ${error ? 'var(--danger)' : focus ? 'var(--focus-ring)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: focus ? 'var(--shadow-focus)' : 'none',
          font: 'var(--role-body)', color: 'var(--text-strong)', outline: 'none',
          transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)', ...style,
        }}
        {...rest}
      />
      {(hint || error) && (
        <span style={{
          font: 'var(--fw-regular) var(--text-xs)/1.4 var(--font-sans)',
          color: error ? 'var(--danger)' : 'var(--text-muted)',
        }}>{error || hint}</span>
      )}
    </div>
  );
}
