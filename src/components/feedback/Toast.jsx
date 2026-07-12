import React from 'react';
import { useLucide } from '../../lib/useLucide.js';

const TONE = {
  success: ['var(--success)', 'var(--success-soft)'],
  info: ['var(--info)', 'var(--info-soft)'],
  warning: ['var(--warning)', 'var(--warning-soft)'],
  danger: ['var(--danger)', 'var(--danger-soft)'],
};

/**
 * Toast — quiet confirmation (DS v1.1). Bottom-right, one line, auto-dismiss
 * (host-controlled). Never for errors that need a decision.
 * tone: 'success' | 'info' | 'warning' | 'danger'
 */
export function Toast({ icon = 'check', title, message, actionLabel, onAction, onDismiss, tone = 'success' }) {
  useLucide();
  const [color, soft] = TONE[tone] || TONE.success;
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
      background: 'var(--surface-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
      padding: '12px 14px', width: 340, maxWidth: '100%',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: soft, color, flexShrink: 0 }}>
        <i data-lucide={icon} style={{ width: 15, height: 15 }} />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)' }}>{title}</div>
        {message ? <div style={{ font: 'var(--fw-regular) var(--text-sm)/1.4 var(--font-sans)', color: 'var(--text-muted)' }}>{message}</div> : null}
        {actionLabel ? (
          <button type="button" onClick={onAction} style={{ alignSelf: 'flex-start', marginTop: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'var(--fw-semibold) var(--text-sm)/1 var(--font-sans)', color: 'var(--text-link)' }}>{actionLabel}</button>
        ) : null}
      </div>
      {onDismiss ? (
        <button type="button" aria-label="Dismiss" onClick={onDismiss} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24,
          borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent',
          color: 'var(--text-faint)', cursor: 'pointer', flexShrink: 0,
        }}><i data-lucide="x" style={{ width: 14, height: 14 }} /></button>
      ) : null}
    </div>
  );
}

/** Stack of toasts, newest last. Host owns the array + timers. */
export function ToastStack({ toasts = [], onDismiss, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-end', ...style }}>
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss ? () => onDismiss(t.id) : undefined} />
      ))}
    </div>
  );
}

export default Toast;
