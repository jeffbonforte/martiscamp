import React from 'react';

/** Native select styled to match inputs. options = [{value,label}] or strings. */
export function Select({ label, hint, id, options = [], size = 'md', style = {}, containerStyle = {}, disabled = false, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const rid = id || React.useId();
  const h = size === 'sm' ? 34 : size === 'lg' ? 48 : 40;
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', ...containerStyle }}>
      {label && (
        <label htmlFor={rid} style={{
          font: 'var(--fw-medium) var(--text-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)',
        }}>{label}</label>
      )}
      <div style={{ position: 'relative', display: 'flex' }}>
        <select
          id={rid} disabled={disabled}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            appearance: 'none', width: '100%', height: h, padding: '0 36px 0 var(--space-3)',
            background: disabled ? 'var(--surface-sunk)' : 'var(--surface-card)',
            border: `1px solid ${focus ? 'var(--focus-ring)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-md)', boxShadow: focus ? 'var(--shadow-focus)' : 'none',
            font: 'var(--role-body)', color: 'var(--text-strong)', outline: 'none', cursor: 'pointer',
            transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)', ...style,
          }}
          {...rest}
        >
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{
          position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', color: 'var(--text-muted)', fontSize: 12,
        }}>▾</span>
      </div>
      {hint && <span style={{ font: 'var(--fw-regular) var(--text-xs)/1.4 var(--font-sans)', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
}
