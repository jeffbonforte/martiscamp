import React from 'react';
import { AttendancePicker, Badge, Button, AMENITIES } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { PageHead, SnowReport } from './shared.jsx';
import { MONTHS, WEEKDAYS, monthMatrix, sameDay, isSkiSeason } from '../lib/calendar.js';

export function CalendarScreen({ data, season, favorites, onOpenEvent, onPlanVisit }) {
  const myFam = data.families.find((f) => f.id === data.me.familyId);
  const [days, setDays] = React.useState(myFam ? myFam.presence.days : []);
  const [offset, setOffset] = React.useState(0); // months ahead of the current month (0..12)
  const toggle = (k) => setDays((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));
  useLucide();

  // "Today" and the rolling window bounds, from the real calendar.
  const APP_TODAY = new Date(); APP_TODAY.setHours(0, 0, 0, 0);
  const ANCHOR_MONTH = { year: APP_TODAY.getFullYear(), month: APP_TODAY.getMonth() };
  const windowDates = data.weekendDays.map((d) => d.date);
  const winStart = windowDates[0];
  const winEnd = windowDates[windowDates.length - 1];

  // day key ("fri") -> the real Date in the rolling window.
  const dayKeyDate = (key) => { const wd = data.weekendDays.find((d) => d.key === key); return wd ? wd.date : null; };
  const wxForDate = (date) => { const wd = data.weekendDays.find((d) => sameDay(d.date, date)); return wd ? wd.wx : null; };

  // ---- Favorites arrivals ----
  const favFamilies = data.families.filter((f) => favorites.has(f.id));
  const favMembers = [];
  data.families.forEach((f) => f.members.forEach((m) => { if (favorites.has('m:' + m.name)) favMembers.push({ ...m, family: f }); }));
  const nextArrival = (dayKeys) => {
    const dates = (dayKeys || []).map(dayKeyDate).filter(Boolean).sort((a, b) => a - b);
    const upcoming = dates.filter((d) => d >= APP_TODAY);
    return { first: (upcoming[0] || dates[0]) || null, count: dates.length };
  };
  const fmtDate = (d) => (d ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : null);

  const arrivals = [
    ...favFamilies.map((f) => ({ key: 'f:' + f.id, name: `The ${f.name}s`, tone: f.tone, ...nextArrival(f.presence.days), family: f })),
    ...favMembers.map((m) => ({ key: 'm:' + m.name, name: m.name, tone: m.tone, ...nextArrival(m.days), family: m.family })),
  ].filter((a) => a.first).sort((a, b) => a.first - b.first);

  // ---- Near-term agenda (the mock 7-day window) ----
  const agenda = data.weekendDays.map((wd) => {
    const date = wd.date;
    const arrivingFamilies = data.families.filter((f) => f.presence.days[0] === wd.key && f.presence.here);
    const evs = data.events.filter((e) => e.dayKey === wd.key);
    const gats = data.gatherings.filter((g) => g.day === wd.key);
    return { wd, date, arrivingFamilies, evs, gats };
  }).filter((row) => row.arrivingFamilies.length || row.evs.length || row.gats.length);

  // ---- Month view chips ----
  const chipsForDate = (date) => {
    if (date < winStart || date > winEnd) return []; // events live within the rolling window
    // Official community events (badge, non-clickable) …
    const community = data.events
      .filter((e) => e.day === date.getDate() && e.community)
      .map((e) => ({ title: e.title, amenity: e.amenity, community: true, gathering: null }));
    // … plus member get-togethers (clickable), keyed by gathering identity so
    // there are no title-match misses or duplicates.
    const gats = data.gatherings
      .filter((g) => { const gd = dayKeyDate(g.day); return gd && sameDay(gd, date); })
      .map((g) => ({ title: g.title, amenity: g.amenity, community: false, gathering: g }));
    return [...community, ...gats];
  };

  const viewMonth = (ANCHOR_MONTH.month + offset) % 12;
  const viewYear = ANCHOR_MONTH.year + Math.floor((ANCHOR_MONTH.month + offset) / 12);
  const weeks = monthMatrix(viewYear, viewMonth);

  return (
    <div>
      <PageHead eyebrow={`${MONTHS[viewMonth]} ${viewYear}`} title="Calendar" sub="Your days at the Camp, favorites' next arrivals, community events, and family get-togethers." />

      {/* My calendar — mark your days */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 'var(--space-5) var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i data-lucide="calendar-check" style={{ width: 18, height: 18, color: 'var(--brand)' }} />
              <span style={{ font: 'var(--role-h2)', color: 'var(--text-strong)' }}>My calendar</span>
            </div>
            <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)', marginTop: 4 }}>Mark the days the {myFam ? myFam.name : 'family'}s will be up — neighbors see when you're here. Staying for weeks? Tap a run of days.</div>
          </div>
          <span style={{ font: 'var(--fw-semibold) var(--text-sm)/1 var(--font-mono)', color: days.length ? 'var(--success)' : 'var(--text-faint)' }}>{days.length} day{days.length === 1 ? '' : 's'} marked</span>
        </div>
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <AttendancePicker days={data.weekendDays} selected={days} onToggle={toggle} />
        </div>
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={onPlanVisit} iconLeft={<i data-lucide="calendar-range" style={{ width: 15, height: 15 }} />}>Plan further ahead</Button>
        </div>
      </div>

      {/* Coming up from your favorites */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
        <i data-lucide="star" style={{ width: 16, height: 16, color: 'var(--warning)', fill: 'var(--warning)' }} />
        <span style={{ font: 'var(--role-h2)', color: 'var(--text-strong)' }}>Coming up from your favorites</span>
      </div>
      {arrivals.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-strong)', background: 'var(--surface-sunk)', font: 'var(--role-small)', color: 'var(--text-muted)', marginBottom: 'var(--space-8)' }}>
          <i data-lucide="star" style={{ width: 16, height: 16 }} /> Favorite families or people to see when they're next up here.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          {arrivals.map((a) => (
            <button key={a.key} type="button" onClick={() => onOpenEvent && a.family && null}
              style={{ textAlign: 'left', cursor: 'default', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${a.tone} 16%, var(--snow))`, color: a.tone }}>
                <i data-lucide="map-pin" style={{ width: 18, height: 18 }} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.15 var(--font-sans)', color: 'var(--text-strong)' }}>{a.name}</div>
                <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)', marginTop: 2 }}>Next up {fmtDate(a.first)} · {a.count} day{a.count === 1 ? '' : 's'}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isSkiSeason() && <div style={{ marginBottom: 'var(--space-6)' }}><SnowReport report={data.snowReport} /></div>}

      {/* Near-term agenda */}
      <div style={{ font: 'var(--role-h2)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>The next week or two</div>
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-8)' }}>
        {agenda.map((row, i) => (
          <div key={row.wd.key} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4) var(--space-5)', borderBottom: i < agenda.length - 1 ? '1px solid var(--divider)' : 'none' }}>
            <div style={{ flexShrink: 0, width: 52, textAlign: 'center' }}>
              <div style={{ font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{row.wd.label}</div>
              <div style={{ font: 'var(--fw-regular) var(--text-2xl)/1 var(--font-display)', color: 'var(--text-strong)' }}>{row.wd.sub}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {row.arrivingFamilies.map((f) => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--role-small)', color: 'var(--text-body)' }}>
                  <i data-lucide="map-pin" style={{ width: 14, height: 14, color: 'var(--success)' }} /><b style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>The {f.name}s</b> arrive
                </div>
              ))}
              {row.evs.map((e, j) => (
                <div key={'e' + j} style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--role-small)', color: 'var(--text-body)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: AMENITIES[e.amenity]?.hue || 'var(--stone-400)' }} />
                  {e.title} <span style={{ color: 'var(--text-faint)' }}>· {e.place}</span>
                  {e.community && <Badge tone="brand">Community</Badge>}
                </div>
              ))}
              {row.gats.map((g) => (
                <button key={g.id} type="button" onClick={() => onOpenEvent(g)} style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--role-small)', color: 'var(--text-body)', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: AMENITIES[g.amenity]?.hue }} />
                  {g.title} <span style={{ color: 'var(--text-faint)' }}>· {g.when.split('·')[1]}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Full month view — navigate up to 12 months ahead */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ font: 'var(--role-h2)', color: 'var(--text-strong)' }}>{MONTHS[viewMonth]} {viewYear}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button variant="secondary" size="sm" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - 1))} iconLeft={<i data-lucide="chevron-left" style={{ width: 15, height: 15 }} />}>Prev</Button>
          <Button variant="secondary" size="sm" disabled={offset === 12} onClick={() => setOffset((o) => Math.min(12, o + 1))} iconRight={<i data-lucide="chevron-right" style={{ width: 15, height: 15 }} />}>Next</Button>
        </div>
      </div>
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface-sunk)', borderBottom: '1px solid var(--divider)' }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ padding: '8px 10px', font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>{w}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {week.map((cell, ci) => {
              const chips = cell.inMonth ? chipsForDate(cell.date) : [];
              const isToday = sameDay(cell.date, APP_TODAY);
              const wx = cell.inMonth ? wxForDate(cell.date) : null;
              return (
                <div key={ci} style={{
                  minHeight: 92, padding: 6, borderRight: ci < 6 ? '1px solid var(--divider)' : 'none',
                  borderBottom: wi < weeks.length - 1 ? '1px solid var(--divider)' : 'none',
                  background: cell.inMonth ? 'var(--surface-card)' : 'var(--surface-sunk)', opacity: cell.inMonth ? 1 : 0.55,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      font: 'var(--fw-semibold) var(--text-xs)/1 var(--font-sans)',
                      color: isToday ? 'var(--snow)' : 'var(--text-body)',
                      background: isToday ? 'var(--brand)' : 'transparent', borderRadius: '50%',
                      width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>{cell.date.getDate()}</span>
                    {wx && <i data-lucide={wx.icon} style={{ width: 13, height: 13, color: 'var(--cedar-500)' }} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {chips.slice(0, 3).map((c, i) => (
                      <button key={i} type="button" disabled={!c.gathering} onClick={() => c.gathering && onOpenEvent(c.gathering)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', textAlign: 'left', border: 'none', cursor: c.gathering ? 'pointer' : 'default',
                          padding: '2px 5px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunk)',
                          borderLeft: `3px solid ${AMENITIES[c.amenity]?.hue || 'var(--stone-400)'}`,
                          font: 'var(--fw-medium) var(--text-2xs)/1.2 var(--font-sans)', color: 'var(--text-body)', overflow: 'hidden' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                      </button>
                    ))}
                    {chips.length > 3 && <span style={{ font: 'var(--text-2xs) var(--font-sans)', color: 'var(--text-faint)', paddingLeft: 5 }}>+{chips.length - 3} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ font: 'var(--text-xs) var(--font-sans)', color: 'var(--text-faint)' }}>Community events and family get-togethers are color-coded by activity. Navigate up to 12 months ahead.</div>
    </div>
  );
}

export default CalendarScreen;
