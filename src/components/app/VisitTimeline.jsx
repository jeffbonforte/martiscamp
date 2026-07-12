import React from 'react';
import { useLucide } from '../../lib/useLucide.js';

/**
 * VisitPill — a visit is a date range with a human name (DS v1.1).
 * range: "Jul 4 – 18" · length: "2 weeks"
 */
export function VisitPill({ range, length, style = {} }) {
  useLucide();
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px',
      borderRadius: 'var(--radius-pill)', background: 'var(--brand-soft)', color: 'var(--pine-800)',
      whiteSpace: 'nowrap', maxWidth: '100%', ...style,
    }}>
      <i data-lucide="calendar-range" style={{ width: 14, height: 14, flexShrink: 0 }} />
      <span style={{ font: 'var(--fw-medium) var(--text-xs)/1 var(--font-mono)', whiteSpace: 'nowrap' }}>{range}</span>
      {length ? <span style={{ font: 'var(--fw-regular) var(--text-xs)/1 var(--font-sans)', color: 'var(--pine-600)', whiteSpace: 'nowrap' }}>· {length}</span> : null}
    </span>
  );
}

/**
 * SeasonTimeline — a whole season of family visits, side by side (DS v1.1).
 * months: ['Jun','Jul','Aug','Sep'] · today: 0–1 fraction across the season
 * rows: [{ name, you?, spans: [{ start, end, label }] }] — start/end as 0–1
 */
export function SeasonTimeline({ months = [], rows = [], today, style = {} }) {
  const labelCol = '140px';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', ...style }}>
      <div style={{ display: 'grid', gridTemplateColumns: `${labelCol} 1fr`, gap: 'var(--space-3)' }}>
        <div />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length || 1}, 1fr)` }}>
          {months.map((m) => (
            <div key={m} style={{ font: 'var(--fw-medium) var(--text-2xs)/1 var(--font-mono)', letterSpacing: '0.1em', color: 'var(--text-faint)' }}>{String(m).toUpperCase()}</div>
          ))}
        </div>
      </div>
      {rows.map((r) => (
        <div key={r.name} style={{ display: 'grid', gridTemplateColumns: `${labelCol} 1fr`, gap: 'var(--space-3)', alignItems: 'center' }}>
          <div style={{
            font: `${r.you ? 'var(--fw-semibold)' : 'var(--fw-medium)'} var(--text-sm)/1.2 var(--font-sans)`,
            color: r.you ? 'var(--text-strong)' : 'var(--text-body)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{r.name}</div>
          <div style={{ position: 'relative', height: 28, background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)' }}>
            {months.map((m, i) => (i > 0 ? (
              <div key={m} style={{ position: 'absolute', left: `${(i / months.length) * 100}%`, top: 0, bottom: 0, width: 1, background: 'var(--divider)' }} />
            ) : null))}
            {typeof today === 'number' ? (
              <div style={{ position: 'absolute', left: `${today * 100}%`, top: -2, bottom: -2, width: 2, background: 'var(--cedar-500)', borderRadius: 1 }} />
            ) : null}
            {(r.spans || []).map((s, i) => (
              <div key={i} title={s.label} style={{
                position: 'absolute', left: `${s.start * 100}%`, width: `${(s.end - s.start) * 100}%`,
                top: 7, height: 12, borderRadius: 'var(--radius-pill)',
                background: r.you ? 'var(--pine-700)' : 'var(--pine-300)',
              }} />
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: `${labelCol} 1fr`, gap: 'var(--space-3)' }}>
        <div />
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', font: 'var(--fw-regular) var(--text-2xs)/1 var(--font-sans)', color: 'var(--text-faint)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 14, height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--pine-700)', display: 'inline-block' }} />Your visits</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 14, height: 8, borderRadius: 'var(--radius-pill)', background: 'var(--pine-300)', display: 'inline-block' }} />Other families</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 2, height: 10, background: 'var(--cedar-500)', display: 'inline-block' }} />Today</span>
        </div>
      </div>
    </div>
  );
}

export default SeasonTimeline;
