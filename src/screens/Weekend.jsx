import React from 'react';
import { FamilyCard, GatheringCard, AttendancePicker, Card, Button, HeroPhoto } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { coverUrl } from '../lib/images.js';
import { WeatherPill, SnowReport, WA_ASSISTANT } from './shared.jsx';
import { isSkiSeason, eventStart, isPastEvent, windowDay } from '../lib/calendar.js';
import { useMarkAttendance } from '../lib/useAttendance.js';
import { HomeGetStarted } from './HomeGetStarted.jsx';

/** "Here now" — who is physically at the Camp today, plus what's coming up. */
export function WeekendScreen({ data, season, favorites, onOpenFamily, onEditFamily, onAddMember, onGoCalendar, onGoDirectory, onAttendanceChange, rsvpMap = {}, onPlan, onOpenEvent, onAddCal }) {
  const myFam = data.families.find((f) => f.id === data.me?.familyId) || data.families[0];
  const famFavCount = [...(favorites || [])].filter((k) => !String(k).startsWith('m:')).length;
  // The picker reads straight from the dataset rather than holding its own copy:
  // App patches presence optimistically on every toggle, so this stays in sync
  // with the pills on the family cards instead of drifting from a stale seed.
  const days = myFam ? myFam.presence.days : [];
  // `myFam` falls back to families[0] for display; only your own household is
  // markable (RLS would reject anyone else's anyway).
  const canMark = !!myFam && myFam.id === data.me?.familyId;
  const { markDay } = useMarkAttendance({ scope: 'family', onApply: onAttendanceChange });
  const toggle = (k) => {
    const wd = windowDay(data.weekendDays, k);
    if (!wd || !canMark) return;
    markDay(wd.iso, !days.includes(k), wd.date); // every window day is today-or-later
  };
  const [waHidden, setWaHidden] = React.useState(() => { try { return localStorage.getItem('mcf_wa_announce') === 'off'; } catch { return false; } });
  const dismissWa = () => { try { localStorage.setItem('mcf_wa_announce', 'off'); } catch { /* ignore */ } setWaHidden(true); };
  const here = data.families.filter((f) => f.presence.here); // camp-wide count (includes your own family)
  // ...but the browsable cards are about *other* families — never list your own.
  const hereOthers = here.filter((f) => f.id !== data.me?.familyId);
  const favHere = hereOthers.filter((f) => favorites?.has(f.id));
  const otherHere = favHere.length ? hereOthers.filter((f) => !favorites?.has(f.id)) : hereOthers;
  const open = (f) => onOpenFamily && onOpenFamily(f);
  const today = data.weekendDays[0]?.date || new Date();
  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  // "Coming up" — the two soonest get-togethers that haven't been archived
  // (auto-hidden 3h after they start).
  const comingUp = data.gatherings
    .filter((g) => !isPastEvent(g))
    .sort((a, b) => (eventStart(a)?.getTime() ?? Infinity) - (eventStart(b)?.getTime() ?? Infinity))
    .slice(0, 2);
  useLucide();

  return (
    <div>
      <HomeGetStarted family={myFam} favCount={famFavCount}
        onEditFamily={onEditFamily} onAddMember={onAddMember} onGoCalendar={onGoCalendar} onGoDirectory={onGoDirectory} />

      {/* Hero — rotates through season-appropriate brand photos */}
      <HeroPhoto season={season}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 'var(--space-6) var(--space-8)' }}>
          <div style={{ font: 'var(--role-eyebrow)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', color: 'rgba(255,255,255,.85)', marginBottom: 6 }}>Right now at the Camp · {todayLabel}</div>
          <div className="hero-title" style={{ font: 'var(--fw-regular) var(--text-5xl)/1 var(--font-display)', color: '#fff', letterSpacing: 'var(--tracking-tight)' }}>Who's here now</div>
          <div style={{ font: 'var(--role-body)', color: 'rgba(255,255,255,.9)', marginTop: 8 }}>{here.length === 0 ? 'No families are up at Martis Camp right now' : here.length === 1 ? '1 family is up at Martis Camp' : `${here.length} families are up at Martis Camp`}</div>
        </div>
        <div style={{ position: 'absolute', top: 'var(--space-5)', right: 'var(--space-6)' }}>
          <Button iconLeft={<i data-lucide="plus" style={{ width: 16, height: 16 }} />} onClick={onPlan}>Host a get-together</Button>
        </div>
      </HeroPhoto>

      {/* Ask on WhatsApp — the assistant */}
      {!waHidden && (
        <div style={{ position: 'relative', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
          background: 'linear-gradient(120deg, #157a3d, #1FA855)', color: '#fff', borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5) var(--space-6)', marginBottom: 'var(--space-6)', boxShadow: 'var(--shadow-md)' }}>
          <i data-lucide="message-circle" style={{ width: 30, height: 30, flexShrink: 0 }} />
          <div style={{ marginRight: 'auto', minWidth: 240, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ font: 'var(--fw-regular) var(--text-xl)/1.1 var(--font-display)' }}>Ask Martis on WhatsApp</span>
              <span style={{ font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,.22)' }}>New</span>
            </div>
            <div style={{ font: 'var(--role-small)', color: 'rgba(255,255,255,.92)', marginTop: 4 }}>
              Text <b style={{ fontVariantNumeric: 'tabular-nums' }}>{WA_ASSISTANT.vanity}</b> ({WA_ASSISTANT.display}) and ask things like “Who’s up this weekend?”, “When are my favorites next here?”, or “Any get-togethers coming up?” — you’ll get an answer right back. Just make sure your mobile number is on your profile (it has to match your WhatsApp number).
            </div>
          </div>
          <Button onClick={() => window.open(WA_ASSISTANT.href, '_blank', 'noopener')}
            style={{ background: '#fff', color: '#157a3d', border: '1px solid #fff' }}
            iconLeft={<i data-lucide="message-circle" style={{ width: 15, height: 15 }} />}>Message on WhatsApp</Button>
          <button type="button" onClick={dismissWa} aria-label="Dismiss"
            style={{ position: 'absolute', top: 8, right: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,.8)', display: 'inline-flex', padding: 4 }}>
            <i data-lucide="x" style={{ width: 16, height: 16 }} />
          </button>
        </div>
      )}

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
          <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)', marginTop: 2 }}>Let other families know when {myFam ? `the ${myFam.name}s` : 'you'} will be up.</div>
        </div>
        <AttendancePicker days={data.weekendDays} selected={days} onToggle={canMark ? toggle : undefined} />
      </Card>

      {favHere.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 var(--space-4)' }}>
            <i data-lucide="star" style={{ width: 18, height: 18, color: 'var(--warning)', fill: 'var(--warning)' }} />
            <span style={{ font: 'var(--role-h2)', color: 'var(--text-strong)' }}>Your favorites, here now</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
            {favHere.map((f) => <FamilyCard key={f.name} family={f} cover={coverUrl(f.coverThumb || f.cover)} coverFallback={coverUrl(f.cover)} onOpen={() => open(f)} />)}
          </div>
        </>
      )}

      {otherHere.length > 0 && (
        <>
          <div style={{ font: 'var(--role-h2)', color: 'var(--text-strong)', margin: '0 0 var(--space-4)' }}>{favHere.length ? 'Also here now' : 'Here now'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
            {otherHere.map((f) => <FamilyCard key={f.name} family={f} cover={coverUrl(f.coverThumb || f.cover)} coverFallback={coverUrl(f.cover)} onOpen={() => open(f)} />)}
          </div>
        </>
      )}

      {comingUp.length > 0 && (
        <>
          <div style={{ font: 'var(--role-h2)', color: 'var(--text-strong)', margin: '0 0 var(--space-4)' }}>Coming up</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {comingUp.map((g) => {
              const my = rsvpMap[g.id] ?? g.myRsvp;
              return (
                <GatheringCard key={g.id} gathering={{ ...g, open: g.capacity == null, spotsLeft: g.capacity != null ? g.capacity - g.going.length : undefined, joined: my === 'going' }}
                  onOpen={() => onOpenEvent(g)}
                  onRsvp={() => onOpenEvent(g)} onAddToCalendar={() => onAddCal(g)} />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default WeekendScreen;
