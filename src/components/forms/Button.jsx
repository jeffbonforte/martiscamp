import React from 'react';

const SIZES = {
  sm: { padding: '6px 12px', font: 'var(--text-sm)', height: 32, radius: 'var(--radius-sm)' },
  md: { padding: '9px 18px', font: 'var(--text-sm)', height: 40, radius: 'var(--radius-md)' },
  lg: { padding: '13px 24px', font: 'var(--text-base)', height: 48, radius: 'var(--radius-md)' },
};

const VARIANTS = {
  primary: {
    background: 'var(--brand)', color: 'var(--text-on-brand)', border: '1px solid var(--brand)',
    '--hover-bg': 'var(--brand-hover)', '--active-bg': 'var(--brand-active)',
  },
  warm: {
    background: 'var(--warm)', color: 'var(--snow)', border: '1px solid var(--warm)',
    '--hover-bg': 'var(--cedar-700)', '--active-bg': 'var(--cedar-800)',
  },
  secondary: {
    background: 'var(--surface-card)', color: 'var(--text-strong)', border: '1px solid var(--border-strong)',
    '--hover-bg': 'var(--surface-sunk)', '--active-bg': 'var(--stone-100)',
  },
  ghost: {
    background: 'transparent', color: 'var(--text-body)', border: '1px solid transparent',
    '--hover-bg': 'var(--surface-sunk)', '--active-bg': 'var(--stone-100)',
  },
  danger: {
    background: 'var(--danger)', color: 'var(--snow)', border: '1px solid var(--danger)',
    '--hover-bg': '#9c3a31', '--active-bg': '#853129',
  },
};

/**
 * Primary interactive button. Sentence-case labels only.
 */
export function Button({
  children, variant = 'primary', size = 'md', block = false, disabled = false,
  iconLeft = null, iconRight = null, type = 'button', style = {}, ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  // Keep the variant background when disabled (dimmed via opacity below) —
  // dropping it to transparent left light-on-light text that looked broken.
  const bg = disabled ? v.background
    : active ? v['--active-bg']
    : hover ? v['--hover-bg']
    : v.background;

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        display: block ? 'flex' : 'inline-flex', width: block ? '100%' : 'auto',
        alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
        font: `var(--fw-semibold) ${s.font}/1 var(--font-sans)`,
        letterSpacing: 'var(--tracking-snug)',
        padding: s.padding, minHeight: s.height, borderRadius: s.radius,
        background: bg, color: v.color, border: v.border,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transform: active && !disabled ? 'translateY(1px)' : 'none',
        transition: 'background var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
        whiteSpace: 'nowrap', ...style,
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
