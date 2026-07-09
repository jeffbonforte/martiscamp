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

// --- Cover repositioning -------------------------------------------------

const clampPct = (n) => Math.max(0, Math.min(100, n));
const POS_WORD = { left: 0, center: 50, right: 100, top: 0, bottom: 100 };

/** Parse a CSS object-position string ("center 55%", "50% 38%") → {x, y} %. */
export function parseCoverPos(v) {
  if (!v) return { x: 50, y: 50 };
  const toPct = (p) => (p in POS_WORD ? POS_WORD[p] : (isNaN(parseFloat(p)) ? 50 : parseFloat(p)));
  const parts = String(v).trim().toLowerCase().split(/\s+/);
  return { x: clampPct(toPct(parts[0])), y: clampPct(parts[1] != null ? toPct(parts[1]) : 50) };
}

export const formatCoverPos = ({ x, y }) => `${Math.round(x)}% ${Math.round(y)}%`;

/**
 * Wide, WYSIWYG preview of a family billboard cover. The photo is drag-panned to
 * choose the focal point (kept in `value` as a CSS object-position string), so a
 * tall family photo isn't center-cropped through everyone's heads.
 */
export function CoverPositioner({ src, value, onChange }) {
  const frameRef = React.useRef(null);
  const drag = React.useRef(null);
  const pos = parseCoverPos(value);

  const onDown = (e) => {
    const el = frameRef.current;
    if (!src || !el) return;
    el.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, base: pos, w: el.clientWidth, h: el.clientHeight };
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const nx = clampPct(d.base.x - ((e.clientX - d.sx) / d.w) * 100);
    const ny = clampPct(d.base.y - ((e.clientY - d.sy) / d.h) * 100);
    onChange(formatCoverPos({ x: nx, y: ny }));
  };
  const onUp = (e) => {
    if (!drag.current) return;
    frameRef.current?.releasePointerCapture(e.pointerId);
    drag.current = null;
  };

  return (
    <div
      ref={frameRef}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      style={{ position: 'relative', width: '100%', aspectRatio: '2.6 / 1', borderRadius: 'var(--radius-md)',
        overflow: 'hidden', background: 'var(--surface-sunk)', cursor: src ? 'grab' : 'default',
        touchAction: 'none', userSelect: 'none' }}>
      {src && (
        <img src={src} alt="" draggable={false}
          onError={(e) => { e.currentTarget.style.opacity = '0'; }}
          onLoad={(e) => { e.currentTarget.style.opacity = '1'; }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: `${pos.x}% ${pos.y}%`, pointerEvents: 'none', transition: 'opacity var(--dur-base)' }} />
      )}
      {/* bottom scrim + hint */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '18px 10px 8px',
        background: 'linear-gradient(to top, rgba(20,15,10,.72), rgba(20,15,10,0))',
        display: 'flex', alignItems: 'center', gap: 6,
        font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', color: 'rgba(255,255,255,.92)' }}>
        <i data-lucide="move" style={{ width: 13, height: 13 }} />
        {src ? 'Drag to reposition — this is your family billboard crop' : 'Upload a photo to reposition it'}
      </div>
    </div>
  );
}

export default ChipMulti;
