import React from 'react';
import { FamilyCard, GatheringCard, AttendancePicker, Card, Button } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { coverUrl, heroUrl, heroGradient } from '../lib/images.js';
import { WeatherPill, SnowReport } from './shared.jsx';
import { isSkiSeason } from '../lib/calendar.js';

/** "Here now" — who is physically at the Camp today, plus what's coming up. */
export function WeekendScreen({ data, season, rsvpMap = {}, onPlan, onOpenEvent, onAddCal }) {
  const [days, setDays] = React.useState(data.families[0].presence.days);
  const toggle = (k) => setDays((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]));
  const here = data.families.filter((f) => f.presence.here);
  const today = data.weekendDays[0]?.date || new Date();
  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  useLucide();

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 'var(--space-6)', boxShadow: 'var(--shadow-md)', background: heroGradient(season), minHeight: 280 }}>
        <img src={heroUrl(season)} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: 280, objectFit: 'cover', objectPosition: 'center 62%', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, height: 280, background: 'linear-gradient(to top, rgba(20,15,10,.72) 0%, rgba(20,15,10,.18) 42%, rgba(20,15,10,0) 70%)' }} />
        <div style={{ position: 'relative', height: 280 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 'var(--space-6) var(--space-8)' }}>
            <div style={{ font: 'var(--role-eyebrow)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', color: 'rgba(255,255,255,.85)', marginBottom: 6 }}>Right now at the Camp · {todayLabel}</div>
            <div className="hero-title" style={{ font: 'var(--fw-regular) var(--text-5xl)/1 var(--font-display)', color: '#fff', letterSpacing: 'var(--tracking-tight)' }}>Who's here now</div>
            <div style={{ font: 'var(--role-body)', color: 'rgba(255,255,255,.9)', marginTop: 8 }}>{here.length === 0 ? 'No families are up at Martis Camp right now' : here.length === 1 ? '1 family is up at Martis Camp' : `${here.length} families are up at Martis Camp`}</div>
          </div>
          <div style={{ position: 'absolute', top: 'var(--space-5)', right: 'var(--space-6)' }}>
            <Button iconLeft={<i data-lucide="plus" style={{ width: 16, height: 16 }} />} onClick={onPlan}>Host a get-together</Button>
          </div>
        </div>
      </div>

      {isSkiSeason() && <div style={{ marginBottom: 'var(--space-6)' }}><SnowReport report={data.snowReport} /></div>}

      {/* Weather strip — 7-day look-ahead */}
      <div style={{ font: 'var(--role-eyebrow)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>Next 7 days</div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 6, marginBottom: 'var(--space-6)' }}>
        {data.weekendDays.map((d) => (
          <Card key={d.key} padding="var(--space-3) var(--space-4)" style={{ flex: '0 0 auto', minWidth: 132, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{d.label} {d.sub}</div>
              <div style={{ font: 'var(--text-xs) var(--font-sans)', color: 'var(--text-faint)', marginTop: 3 }}>{d.wx.cond}</div>
            </div>
            <WeatherPill wx={d.wx} />
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ font: 'var(--role-h3)', color: 'var(--text-strong)' }}>Mark your days</div>
          <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)', marginTop: 2 }}>Let neighbors know when the Bonfortes will be up.</div>
        </div>
        <AttendancePicker days={data.weekendDays} selected={days} onToggle={toggle} />
      </Card>

      <div style={{ font: 'var(--role-h2)', color: 'var(--text-strong)', margin: '0 0 var(--space-4)' }}>Here now</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {here.map((f) => <FamilyCard key={f.name} family={f} cover={coverUrl(f.cover)} />)}
      </div>

      <div style={{ font: 'var(--role-h2)', color: 'var(--text-strong)', margin: '0 0 var(--space-4)' }}>Coming up</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
        {data.gatherings.slice(0, 2).map((g) => {
          const my = rsvpMap[g.id] ?? g.myRsvp;
          return (
            <GatheringCard key={g.id} gathering={{ ...g, open: g.capacity == null, spotsLeft: g.capacity != null ? g.capacity - g.going.length : undefined, joined: my === 'going' }}
              onRsvp={() => onOpenEvent(g)} onAddToCalendar={() => onAddCal(g)} />
          );
        })}
      </div>
    </div>
  );
}

export default WeekendScreen;
