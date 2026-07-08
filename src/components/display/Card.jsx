import React from 'react';

/** Content container: white surface, soft shadow, hairline border. */
export function Card({ children, padding = 'var(--space-6)', interactive = false, style = {}, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: 'var(--surface-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding,
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow var(--dur-base) var(--ease-standard), transform var(--dur-base) var(--ease-standard)',
        cursor: interactive ? 'pointer' : 'default', ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
