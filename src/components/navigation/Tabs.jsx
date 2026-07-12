import React from 'react';

/**
 * Tabs — in-page section switcher (underline style). Distinct from
 * SegmentedControl, which stays reserved for filters. Ported from DS v1.1.
 * tabs: [{ id, label, count? }]
 */
export function Tabs({ tabs = [], active, onChange, style = {} }) {
  return (
    <div role="tablist" style={{ display: 'flex', gap: 'var(--space-6)', borderBottom: '1px solid var(--border)', ...style }}>
      {tabs.map((t) => (
        <TabButton key={t.id} tab={t} isActive={t.id === active} onClick={() => onChange && onChange(t.id)} />
      ))}
    </div>
  );
}

function TabButton({ tab, isActive, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button" role="tab" aria-selected={isActive} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '10px 2px 12px', marginBottom: -1,
        borderBottom: isActive ? '2px solid var(--brand)' : '2px solid transparent',
        font: 'var(--fw-semibold) var(--text-sm)/1 var(--font-sans)',
        color: isActive ? 'var(--text-strong)' : hover ? 'var(--text-body)' : 'var(--text-muted)',
        transition: 'color var(--dur-fast) var(--ease-standard)', whiteSpace: 'nowrap',
      }}
    >
      {tab.label}
      {typeof tab.count === 'number' ? (
        <span style={{
          font: 'var(--fw-medium) var(--text-2xs)/1 var(--font-mono)',
          color: isActive ? 'var(--brand)' : 'var(--text-faint)',
          background: isActive ? 'var(--brand-soft)' : 'var(--surface-sunk)',
          padding: '3px 7px', borderRadius: 'var(--radius-pill)',
        }}>{tab.count}</span>
      ) : null}
    </button>
  );
}

export default Tabs;
