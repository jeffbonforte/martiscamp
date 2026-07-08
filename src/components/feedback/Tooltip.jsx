import React from 'react';

/** Lightweight hover tooltip. Wraps its children as the trigger. */
export function Tooltip({ label, side = 'top', children, style = {} }) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top:    { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left:   { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
    right:  { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
  }[side];
  return (
    <span style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span role="tooltip" style={{
          position: 'absolute', zIndex: 1100, whiteSpace: 'nowrap', pointerEvents: 'none',
          padding: '5px 9px', borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-inverse)', color: 'var(--snow)',
          font: 'var(--fw-medium) var(--text-xs)/1 var(--font-sans)',
          boxShadow: 'var(--shadow-md)', ...pos,
        }}>{label}</span>
      )}
    </span>
  );
}
