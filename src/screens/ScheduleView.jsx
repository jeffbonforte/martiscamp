import React from 'react';
import { Avatar, AMENITIES } from '../components/index.js';
import { WeatherPill } from './shared.jsx';

/** Per-day schedule strip shared by the family and member profiles. */
export function ScheduleView({ attendees, data, onOpenEvent }) {
  const names = attendees.map((a) => a.name);
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 8 }}>
      {data.weekendDays.map((d) => {
        const present = attendees.filter((a) => a.days.includes(d.key));
        const evs = data.gatherings.filter((g) => g.day === d.key && g.going.concat(g.maybe).some((p) => names.includes(p.name)));
        const off = present.length === 0;
        return (
          <div key={d.key} style={{ flex: '0 0 auto', width: 172, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', opacity: off ? 0.7 : 1 }}>
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--divider)', background: 'var(--surface-sunk)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ font: 'var(--fw-regular) var(--text-xl)/1 var(--font-display)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{d.label} {d.sub}</div>
              <WeatherPill wx={d.wx} />
            </div>
            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{off ? 'Not up' : 'Here'}</div>
                {off ? <div style={{ font: 'var(--role-small)', color: 'var(--text-faint)' }}>—</div>
                  : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{present.map((p) => <Avatar key={p.name} name={p.name} src={p.photo} tone={p.tone} size="sm" />)}</div>}
              </div>
              {evs.map((g) => (
                <button key={g.id} type="button" onClick={() => onOpenEvent(g)} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunk)', borderLeft: `3px solid ${AMENITIES[g.amenity]?.hue}` }}>
                  <div style={{ font: 'var(--fw-semibold) var(--text-xs)/1.3 var(--font-sans)', color: 'var(--text-strong)' }}>{g.title}</div>
                  <div style={{ font: 'var(--text-2xs)/1.3 var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>{g.when.split('·')[1]}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ScheduleView;
