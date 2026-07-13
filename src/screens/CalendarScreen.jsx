import React from 'react';
import { Button, AMENITIES, VisitPill, SeasonTimeline } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { PageHead, SnowReport } from './shared.jsx';
import { MONTHS, WEEKDAYS, monthMatrix, sameDay, isSkiSeason, dateKey, eventDate } from '../lib/calendar.js';
import { loadVisitPlan, saveVisitPlan } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';

const DAY_MS = 86400000;
const mdShort = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtRange = (a, b) => {
  if (sameDay(a, b)) return mdShort(a);
  // Same month → collapse to "Jul 11–12"; otherwise "Jul 11 – Aug 3".
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${mdShort(a)}–${b.getDate()}`;
  return `${mdShort(a)} – ${mdShort(b)}`;
};
const spanLen = (s) => { const n = Math.round((+s.end - +s.start) / DAY_MS) + 1; return `${n} day${n === 1 ? '' : 's'}`; };
// Collapse a set of dates into contiguous [start, end] spans (both inclusive).
function contiguousSpans(dates) {
  const ts = [...new Set(dates.map((d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return +x; }))].sort((a, b) => a - b);
  const spans = [];
  for (const t of ts) {
    const last = spans[spans.length - 1];
    if (last && t - last.endT === DAY_MS) last.endT = t;
    else spans.push({ startT: t, endT: t });
  }
  return spans.map((s) => ({ start: new Date(s.startT), end: new Date(s.endT) }));
}

export function CalendarScreen({ data, season, favorites, onOpenEvent, onPlanVisit, onOpenFamily, onOpenMember }) {
  const myFam = data.families.find((f) => f.id === data.me.familyId);
  const [offset, setOffset] = React.useState(0); // months ahead of the current month (0..12)
  const { push } = useToast();
  // The family's own visit days (family-level = whole household). Click days on
  // the grid below to toggle; persisted to the backend.
  const [myDates, setMyDates] = React.useState(() => new Set());
  useLucide();

  // "Today" and the rolling window bounds, from the real calendar.
  const APP_TODAY = new Date(); APP_TODAY.setHours(0, 0, 0, 0);
  const todayKey = dateKey(APP_TODAY);

  React.useEffect(() => {
    let alive = true;
    loadVisitPlan().then((res) => {
      if (!alive) return;
      if (res) setMyDates(new Set(res.plan.family));
      else { // mock/offline: seed from the family's window presence days
        const iso = new Set();
        (myFam?.presence?.days || []).forEach((k) => { const wd = data.weekendDays.find((d) => d.key === k); if (wd) iso.add(wd.iso); });
        setMyDates(iso);
      }
    });
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDay = (date) => {
    if (date < APP_TODAY) return; // can't mark past days
    const key = dateKey(date);
    const wasMarked = myDates.has(key);
    const next = new Set(myDates);
    if (wasMarked) next.delete(key); else next.add(key);
    setMyDates(next);
    saveVisitPlan('family', [...next].filter((d) => d >= todayKey), todayKey); // persist the whole future set
    const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    push({ icon: 'calendar-check', tone: 'success', title: wasMarked ? `Cleared ${label}` : `Marked ${label}`, message: wasMarked ? 'Removed from your visit.' : 'Other families can see your visit.' });
  };

  const ANCHOR_MONTH = { year: APP_TODAY.getFullYear(), month: APP_TODAY.getMonth() };

  // day key ("fri") -> the real Date in the rolling window.
  const dayKeyDate = (key) => { const wd = data.weekendDays.find((d) => d.key === key); return wd ? wd.date : null; };
  const wxForDate = (date) => { const wd = data.weekendDays.find((d) => sameDay(d.date, date)); return wd ? wd.wx : null; };
  const evDate = (e) => (e.date ? new Date(e.date + 'T00:00:00') : null); // community event's real date

  // ---- Favorites arrivals ----
  const favFamilies = data.families.filter((f) => favorites.has(f.id));
  const favMembers = [];
  data.families.forEach((f) => f.members.forEach((m) => { if (favorites.has('m:' + m.name)) favMembers.push({ ...m, family: f }); }));
  const nextArrival = (dayKeys) => {
    const dates = (dayKeys || []).map(dayKeyDate).filter(Boolean);
    const spans = contiguousSpans(dates);
    const s = spans.find((sp) => sp.end >= APP_TODAY) || spans[0] || null;
    return { first: s ? s.start : null, count: dates.length, range: s ? fmtRange(s.start, s.end) : null, length: s ? spanLen(s) : null };
  };
  const fmtDate = (d) => (d ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : null);

  const arrivals = [
    ...favFamilies.map((f) => ({ key: 'f:' + f.id, name: `The ${f.name}s`, tone: f.tone, ...nextArrival(f.presence.days), family: f })),
    ...favMembers.map((m) => ({ key: 'm:' + m.name, name: m.name, tone: m.tone, ...nextArrival(m.days), family: m.family, member: m })),
  ].filter((a) => a.first).sort((a, b) => a.first - b.first);

  // ---- Season at a glance (DS v1.1 SeasonTimeline) ----
  // A fixed 4-month window from the current month; each family's marked days
  // collapse into contiguous ranges laid out across it.
  const seasonStart = new Date(APP_TODAY.getFullYear(), APP_TODAY.getMonth(), 1);
  const seasonEnd = new Date(APP_TODAY.getFullYear(), APP_TODAY.getMonth() + 4, 1); // exclusive
  const seasonWidth = +seasonEnd - +seasonStart;
  const frac = (d) => Math.max(0, Math.min(1, (+d - +seasonStart) / seasonWidth));
  const seasonMonths = [0, 1, 2, 3].map((i) => MONTHS[(APP_TODAY.getMonth() + i) % 12].slice(0, 3));
  const toTimelineRow = (name, dates, you) => ({
    name, you,
    spans: contiguousSpans(dates)
      .map((s) => ({ start: frac(s.start), end: frac(new Date(+s.end + DAY_MS)), label: fmtRange(s.start, s.end) }))
      .filter((s) => s.end > 0.001 && s.start < 0.999),
  });
  const myDatesArr = [...myDates].map((k) => new Date(k + 'T00:00:00'));
  const timelineRows = [
    toTimelineRow(myFam ? `The ${myFam.name}s (you)` : 'You', myDatesArr, true),
    ...favFamilies.map((f) => toTimelineRow(`The ${f.name}s`, (f.presence.days || []).map(dayKeyDate).filter(Boolean), false)),
  ].filter((r) => r.spans.length);
  const hasTimeline = timelineRows.length > 0;

  // ---- Month view chips ----
  const chipsForDate = (date) => {
    // Official community events show on their exact date — any day, not just the
    // rolling window.
    const community = data.events
      .filter((e) => { const d = evDate(e); return e.community && d && sameDay(d, date); })
      .map((e) => ({ title: e.title, amenity: e.amenity, community: true, gathering: null }));
    // Member get-togethers land on their real date (parsed from the label), any
    // month ahead — not just the rolling window.
    const gats = data.gatherings
      .filter((g) => { const gd = eventDate(g); return gd && sameDay(gd, date); })
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
            <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)', marginTop: 4 }}>Click any day on the calendar below to mark when the {myFam ? myFam.name : 'family'}s will be up — tap again to clear. Other families see when you're here.</div>
          </div>
          <span style={{ font: 'var(--fw-semibold) var(--text-sm)/1 var(--font-mono)', color: myDates.size ? 'var(--success)' : 'var(--text-faint)' }}>{myDates.size} day{myDates.size === 1 ? '' : 's'} marked</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={onPlanVisit} iconLeft={<i data-lucide="user" style={{ width: 15, height: 15 }} />}>Mark per person instead</Button>
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
            <button key={a.key} type="button"
              onClick={() => (a.member ? onOpenMember && onOpenMember(a.family, a.member) : onOpenFamily && onOpenFamily(a.family))}
              title={`View ${a.member ? a.name : a.name + "’s"} profile`}
              style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${a.tone} 16%, var(--snow))`, color: a.tone }}>
                <i data-lucide="map-pin" style={{ width: 18, height: 18 }} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.15 var(--font-sans)', color: 'var(--text-strong)', marginBottom: 6 }}>{a.name}</div>
                {a.range ? <VisitPill range={a.range} length={a.length} /> : <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>Next up {fmtDate(a.first)}</div>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Season at a glance — DS v1.1 SeasonTimeline */}
      {hasTimeline && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
            <i data-lucide="calendar-range" style={{ width: 16, height: 16, color: 'var(--brand)' }} />
            <span style={{ font: 'var(--role-h2)', color: 'var(--text-strong)' }}>Season at a glance</span>
          </div>
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 'var(--space-5) var(--space-6)', marginBottom: 'var(--space-8)', overflowX: 'auto' }}>
            <SeasonTimeline months={seasonMonths} rows={timelineRows} today={frac(APP_TODAY)} style={{ minWidth: 480 }} />
          </div>
        </>
      )}

      {isSkiSeason() && <div style={{ marginBottom: 'var(--space-6)' }}><SnowReport report={data.snowReport} /></div>}

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
              const marked = cell.inMonth && myDates.has(dateKey(cell.date));
              const markable = cell.inMonth && cell.date >= APP_TODAY;
              return (
                <div key={ci}
                  onClick={markable ? () => toggleDay(cell.date) : undefined}
                  title={markable ? (marked ? 'Marked — click to clear' : 'Click to mark your family visiting') : undefined}
                  style={{
                    minHeight: 92, padding: 6, borderRight: ci < 6 ? '1px solid var(--divider)' : 'none',
                    borderBottom: wi < weeks.length - 1 ? '1px solid var(--divider)' : 'none',
                    cursor: markable ? 'pointer' : 'default',
                    background: marked ? 'var(--brand-soft)' : cell.inMonth ? 'var(--surface-card)' : 'var(--surface-sunk)',
                    boxShadow: marked ? 'inset 3px 0 0 var(--brand)' : 'none',
                    opacity: cell.inMonth ? 1 : 0.55,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{
                      font: 'var(--fw-semibold) var(--text-xs)/1 var(--font-sans)',
                      color: isToday ? 'var(--snow)' : marked ? 'var(--pine-800)' : 'var(--text-body)',
                      background: isToday ? 'var(--brand)' : 'transparent', borderRadius: '50%',
                      width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>{cell.date.getDate()}</span>
                    {marked ? <i data-lucide="check" style={{ width: 13, height: 13, color: 'var(--brand)' }} />
                      : wx ? <i data-lucide={wx.icon} style={{ width: 13, height: 13, color: 'var(--cedar-500)' }} /> : null}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {chips.slice(0, 3).map((c, i) => (
                      <button key={i} type="button" disabled={!c.gathering} onClick={(e) => { e.stopPropagation(); c.gathering && onOpenEvent(c.gathering); }}
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
