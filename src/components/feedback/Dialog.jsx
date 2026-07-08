import React from 'react';

/** Modal dialog with pine-tinted scrim. Controlled via `open`. */
export function Dialog({ open, onClose, title, children, footer = null, width = 480 }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)',
      background: 'rgba(15,31,23,0.45)', backdropFilter: 'blur(2px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{
        width: '100%', maxWidth: width, background: 'var(--surface-card)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)',
        display: 'flex', flexDirection: 'column', maxHeight: '86vh', overflow: 'hidden',
      }}>
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--divider)',
          }}>
            <div style={{ font: 'var(--fw-regular) var(--text-2xl)/1.15 var(--font-display)', color: 'var(--text-strong)' }}>{title}</div>
            <button type="button" onClick={onClose} aria-label="Close" style={{
              border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
              display: 'inline-flex', padding: 4, borderRadius: 'var(--radius-sm)',
            }}><i data-lucide="x" style={{ width: 20, height: 20 }} /></button>
          </div>
        )}
        <div style={{ padding: 'var(--space-6)', overflow: 'auto', font: 'var(--role-body)', color: 'var(--text-body)' }}>{children}</div>
        {footer && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)',
            padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--divider)', background: 'var(--surface-page)',
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
