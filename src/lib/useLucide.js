import React from 'react';

/**
 * The design system renders icons as `<i data-lucide="name">` and relies on the
 * Lucide UMD script (loaded in index.html) to hydrate them into <svg>. React
 * owns the DOM, so we re-run Lucide's hydration after every commit. Call this
 * hook once near the top of any screen/dialog that renders icons.
 *
 * It intentionally has no dependency array — it runs on every render so icons
 * added by state changes (dialogs opening, lists filtering) get hydrated too.
 */
export function useLucide() {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.lucide) {
      try { window.lucide.createIcons(); } catch { /* no-op */ }
    }
  });
}

export default useLucide;
