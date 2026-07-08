import React from 'react';

/**
 * Thin wrapper around Lucide icons. Requires the Lucide UMD script on the page:
 *   <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
 * Renders an <i data-lucide> element and asks Lucide to hydrate it.
 */
export function Icon({ name, size = 20, strokeWidth = 2, color = 'currentColor', style = {}, ...rest }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (window.lucide && ref.current) {
      try { window.lucide.createIcons({ nameAttr: 'data-lucide', icons: window.lucide.icons, attrs: {}, root: ref.current.parentNode }); }
      catch (e) { window.lucide.createIcons(); }
    }
  }, [name, size, strokeWidth]);
  return (
    <i
      ref={ref}
      data-lucide={name}
      style={{
        display: 'inline-flex', width: size, height: size, color,
        verticalAlign: 'middle', flexShrink: 0, ...style,
      }}
      // pass sizing/stroke through to the generated <svg>
      data-icon-size={size}
      data-stroke={strokeWidth}
      {...rest}
    />
  );
}
