import React from 'react';

/** App sidebar nav. brand wordmark + item list. items=[{key,label,icon,badge?}]. */
export function Sidebar({ items = [], active, onSelect, footer = null, logo = null, style = {} }) {
  const [logoErr, setLogoErr] = React.useState(false);
  const showLogo = logo && !logoErr;
  return (
    <nav style={{
      width: 'var(--sidebar-w)', height: '100%', flexShrink: 0,
      background: 'var(--surface-card)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: 'var(--space-5) var(--space-3)', ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {showLogo
          ? <img src={logo} alt="Martis Camp" onError={() => setLogoErr(true)} style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0, objectFit: 'cover' }} />
          : <span style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--logo-brown)', color: 'var(--logo-cream)',
              font: 'var(--fw-regular) var(--text-lg)/1 var(--font-display)',
            }}>MC</span>}
        <span style={{ font: 'var(--fw-regular) var(--text-lg)/1.05 var(--font-display)', color: 'var(--text-strong)' }}>
          Martis Camp<br /><span style={{ font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Families</span>
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {items.map((it) => {
          const on = it.key === active;
          return (
            <button key={it.key} type="button" onClick={() => onSelect && onSelect(it.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: '9px var(--space-3)', border: 'none', cursor: 'pointer', textAlign: 'left',
                borderRadius: 'var(--radius-md)', width: '100%',
                background: on ? 'var(--brand-soft)' : 'transparent',
                color: on ? 'var(--pine-800)' : 'var(--text-body)',
                font: `var(--fw-${on ? 'semibold' : 'medium'}) var(--text-sm)/1 var(--font-sans)`,
                transition: 'background var(--dur-fast), color var(--dur-fast)',
              }}>
              <i data-lucide={it.icon} style={{ width: 18, height: 18, color: on ? 'var(--brand)' : 'var(--text-muted)' }} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.badge != null && (
                <span style={{
                  minWidth: 20, height: 20, padding: '0 6px', borderRadius: 'var(--radius-pill)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: on ? 'var(--brand)' : 'var(--stone-200)', color: on ? 'var(--snow)' : 'var(--text-body)',
                  font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)',
                }}>{it.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {footer && <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-4)' }}>{footer}</div>}
    </nav>
  );
}
