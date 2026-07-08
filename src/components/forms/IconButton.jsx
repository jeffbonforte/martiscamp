import React from 'react';

/**
 * Square icon-only button. Provide an aria-label. Children = one icon node.
 */
export function IconButton({
  children, variant = 'ghost', size = 'md', disabled = false,
  'aria-label': ariaLabel, style = {}, ...rest
}) {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  const [hover, setHover] = React.useState(false);
  const bg = variant === 'primary'
    ? (hover ? 'var(--brand-hover)' : 'var(--brand)')
    : variant === 'secondary'
    ? (hover ? 'var(--surface-sunk)' : 'var(--surface-card)')
    : (hover ? 'var(--surface-sunk)' : 'transparent');
  const color = variant === 'primary' ? 'var(--text-on-brand)' : 'var(--text-body)';
  const border = variant === 'secondary' ? '1px solid var(--border-strong)' : '1px solid transparent';

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: dim, height: dim, borderRadius: 'var(--radius-md)',
        background: bg, color, border, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, padding: 0,
        transition: 'background var(--dur-fast) var(--ease-standard)', ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
