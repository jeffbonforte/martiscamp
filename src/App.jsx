import React from 'react';
import { Sidebar, Avatar, BottomTabBar } from './components/index.js';
import { useLucide } from './lib/useLucide.js';
import { useWeather } from './lib/weather.js';
import { LOGO_BADGE } from './lib/images.js';
import { DATA } from './data/mockData.js';
import { loadAppData, persistFavorite, persistRsvp } from './lib/api.js';
import { WhatsButton, feedGlyph } from './screens/shared.jsx';

import { WeekendScreen } from './screens/Weekend.jsx';
import { DirectoryScreen } from './screens/Directory.jsx';
import { CalendarScreen } from './screens/CalendarScreen.jsx';
import { GatheringsScreen } from './screens/Gatherings.jsx';
import { UpdatesScreen } from './screens/Updates.jsx';
import { AccountScreen } from './screens/Account.jsx';
import { FamilyProfileScreen } from './screens/FamilyProfile.jsx';
import { MemberProfileScreen } from './screens/MemberProfile.jsx';
import { EventScreen } from './screens/Event.jsx';
import { PlanVisit } from './screens/PlanVisit.jsx';
import { AdminScreen } from './screens/Admin.jsx';
import { HostDialog } from './screens/dialogs/HostDialog.jsx';
import { EditProfileDialog } from './screens/dialogs/EditProfileDialog.jsx';
import { AddMemberDialog } from './screens/dialogs/AddMemberDialog.jsx';
import { ToastProvider } from './lib/toast.jsx';
import { AddToCalendarDialog } from './screens/dialogs/AddToCalendarDialog.jsx';

const seasonOf = (d) => { const m = d.getMonth(); return (m <= 1 || m === 11) ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'fall'; };

export function App({ onSignOut }) {
  // --- hooks (all unconditional, before any early return) ---
  const { weekendDays, snow } = useWeather(DATA.weekendDays, DATA.snowReport);
  const [, bump] = React.useReducer((x) => x + 1, 0);
  const [base, setBase] = React.useState(null); // dataset from Supabase or mock
  const [view, setView] = React.useState('weekend');
  const [route, setRoute] = React.useState(null);
  const [planOpen, setPlanOpen] = React.useState(false);
  const [postType, setPostType] = React.useState('gathering');
  const [favorites, setFavorites] = React.useState(new Set());
  const [rsvpMap, setRsvpMap] = React.useState({});
  const [feedOpen, setFeedOpen] = React.useState(false);
  const [calEvent, setCalEvent] = React.useState(null);
  const [editTarget, setEditTarget] = React.useState(null);
  const [addMemberFor, setAddMemberFor] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    loadAppData().then((d) => {
      if (!alive) return;
      setBase(d);
      setFavorites(new Set(d.favorites || []));
      const seed = {};
      (d.gatherings || []).forEach((g) => { if (g.myRsvp) seed[g.id] = g.myRsvp; });
      setRsvpMap(seed);
    });
    return () => { alive = false; };
  }, []);

  useLucide();
  React.useEffect(() => { document.querySelector('.content')?.scrollTo(0, 0); }, [view, route]);

  const season = seasonOf(new Date()); // theme follows the time of year automatically

  if (!base) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', font: 'var(--role-body)' }}>Loading…</div>;
  }

  // --- derived from loaded data + live weather ---
  const data = { ...base, weekendDays, snowReport: snow };
  const me = base.me;
  const owned = (f) => f && f.id === me.familyId;
  const myFam = data.families.find((f) => f.id === me.familyId);
  const myMember = myFam && myFam.members.find((m) => m.name === me.name);

  // Signed in but not yet linked to a family/member — never fall through to the
  // main app (which assumes a family and would otherwise show someone else's).
  if (me.needsSetup || !myFam) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', background: 'var(--surface-page)' }}>
        <div style={{ maxWidth: 440, textAlign: 'center', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', padding: 'var(--space-8)' }}>
          <div style={{ font: 'var(--fw-regular) var(--text-3xl)/1.1 var(--font-display)', color: 'var(--text-strong)', marginBottom: 'var(--space-3)' }}>Welcome to Martis Camp Families</div>
          <div style={{ font: 'var(--role-body)', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
            You're signed in as <b style={{ color: 'var(--text-body)' }}>{me.name}</b>, but your profile hasn't been set up yet. An admin (or your family's account holder) will add you to your family shortly — check back soon.
          </div>
          <button type="button" onClick={onSignOut}
            style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: 'pointer', font: 'var(--fw-semibold) var(--text-sm)/1 var(--font-sans)', color: 'var(--text-strong)' }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }
  const editMyProfile = () => setEditTarget({ type: 'member', family: myFam, member: myMember });

  const toggleFav = (id) => setFavorites((s) => {
    const n = new Set(s);
    const on = !n.has(id);
    on ? n.add(id) : n.delete(id);
    persistFavorite(id, on); // persisted to Supabase when configured; no-op otherwise
    return n;
  });
  const openFamily = (f) => { setFeedOpen(false); setRoute({ type: 'family', item: f }); };
  const openEvent = (e) => { setFeedOpen(false); setRoute({ type: 'event', item: e }); };
  const openMember = (f, m) => setRoute({ type: 'member', item: f, member: m });
  const setRsvp = (id, v) => { setRsvpMap((m) => ({ ...m, [id]: v })); persistRsvp(id, v); };
  const addToCalendar = (g) => setCalEvent(g);
  const openPost = (type) => { setPostType(type); setPlanOpen(true); };
  // Refresh the dataset after a write, and re-point the open profile route at the
  // freshly-loaded objects (which carry resolved signed photo URLs) — otherwise
  // the profile keeps rendering the stale pre-reload object and its cover/photo
  // (a raw storage ref) won't load.
  const reload = () => loadAppData().then((d) => {
    setBase(d);
    setRoute((r) => {
      if (!r || (r.type !== 'family' && r.type !== 'member')) return r;
      const f = d.families?.find((x) => x.id === r.item.id);
      if (!f) return r;
      const member = r.type === 'member' ? (f.members.find((m) => m.name === r.member?.name) || r.member) : r.member;
      return { ...r, item: f, member };
    });
  });

  const feedGoto = (item) => {
    setFeedOpen(false);
    if (item.eventId) { const ev = data.gatherings.find((g) => g.id === item.eventId); if (ev) return openEvent(ev); }
    if (item.familyId) { const f = data.families.find((x) => x.id === item.familyId); if (f) return openFamily(f); }
  };
  const unread = data.feed.filter((f) => f.unread).length;
  const meFamilyLabel = myFam ? `The ${myFam.name}s` : '';

  const nav = [
    { key: 'weekend', label: 'Here now', icon: 'calendar-check' },
    { key: 'directory', label: 'Directory', icon: 'users' },
    { key: 'calendar', label: 'Calendar', icon: 'calendar' },
    { key: 'gatherings', label: 'Get-togethers', icon: 'party-popper', badge: data.gatherings.length },
    { key: 'updates', label: 'Updates', icon: 'bell', badge: unread || undefined },
  ];
  if (me.isAdmin) nav.push({ key: 'admin', label: 'Admin', icon: 'shield' });
  const go = (k) => { setRoute(null); setView(k); };

  let body;
  if (route?.type === 'family') {
    body = <FamilyProfileScreen family={route.item} data={data} favorites={favorites}
      onToggleFav={toggleFav} canEdit={owned(route.item) || !!me.isAdmin} onEdit={() => setEditTarget({ type: 'family', family: route.item })}
      onAddMember={() => setAddMemberFor(route.item)}
      onBack={() => setRoute(null)} onOpenEvent={openEvent} onOpenMember={(m) => openMember(route.item, m)} />;
  } else if (route?.type === 'member') {
    body = <MemberProfileScreen family={route.item} member={route.member} data={data} favorites={favorites} onToggleFav={toggleFav}
      canEdit={owned(route.item)} onEdit={() => setEditTarget({ type: 'member', family: route.item, member: route.member })}
      onBack={() => openFamily(route.item)} onOpenFamily={() => openFamily(route.item)} onOpenEvent={openEvent} />;
  } else if (route?.type === 'event') {
    const ev = route.item;
    body = <EventScreen event={ev} data={data} myRsvp={rsvpMap[ev.id] ?? ev.myRsvp} onRsvp={(v) => setRsvp(ev.id, v)} onBack={() => setRoute(null)} onAddCal={addToCalendar} />;
  } else if (view === 'weekend') {
    body = <WeekendScreen data={data} season={season} favorites={favorites} onOpenFamily={openFamily}
      onEditFamily={() => myFam && setEditTarget({ type: 'family', family: myFam })}
      onAddMember={() => myFam && setAddMemberFor(myFam)}
      onGoCalendar={() => go('calendar')} onGoDirectory={() => go('directory')}
      rsvpMap={rsvpMap} onPlan={() => openPost('gathering')} onOpenEvent={openEvent} onAddCal={addToCalendar} />;
  } else if (view === 'directory') {
    body = <DirectoryScreen data={data} favorites={favorites} onToggleFav={toggleFav} onOpen={openFamily} />;
  } else if (view === 'calendar') {
    body = <CalendarScreen data={data} season={season} favorites={favorites} onOpenEvent={openEvent} onPlanVisit={() => go('plan')} />;
  } else if (view === 'plan') {
    body = <PlanVisit data={data} onBack={() => go('calendar')} />;
  } else if (view === 'gatherings') {
    body = <GatheringsScreen data={data} onPlan={() => openPost('gathering')} onOpenEvent={openEvent} onAddCal={addToCalendar} rsvpMap={rsvpMap} />;
  } else if (view === 'account') {
    body = <AccountScreen me={me} member={myMember} family={myFam} onEditProfile={editMyProfile} onSignOut={onSignOut} />;
  } else if (view === 'admin') {
    body = <AdminScreen data={data} onReload={reload} onEditFamily={(f) => setEditTarget({ type: 'family', family: f })} />;
  } else {
    body = <UpdatesScreen data={data} onOpenEvent={openEvent} onOpenFamily={openFamily} onPost={() => openPost('announcement')} />;
  }

  return (
    <ToastProvider>
    <div className="shell">
      <div className="desktop-nav">
        <Sidebar items={nav} active={route ? null : view} onSelect={go} logo={LOGO_BADGE}
          footer={<button type="button" onClick={() => go('account')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', width: '100%', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)', textAlign: 'left', background: (!route && view === 'account') ? 'var(--brand-soft)' : 'transparent' }}>
            <Avatar name={me.name} src={myMember && myMember.photo} size="sm" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.1 var(--font-sans)', color: 'var(--text-strong)' }}>{me.name}</div>
              <div style={{ font: 'var(--text-xs) var(--font-sans)', color: 'var(--text-muted)' }}>{meFamilyLabel}</div>
            </div>
            <i data-lucide="settings" style={{ width: 16, height: 16, color: 'var(--text-faint)' }} />
          </button>} />
      </div>

      <div className="main">
        <div className="topbar">
          <div className="loc" style={{ display: 'flex', alignItems: 'center', gap: 10, font: 'var(--role-small)', color: 'var(--text-muted)' }}>
            <i data-lucide="map-pin" style={{ width: 16, height: 16 }} /> Martis Camp · Truckee, CA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <WhatsButton size="sm" label="WhatsApp" />
            <button type="button" aria-label="Notifications" onClick={() => setFeedOpen((o) => !o)}
              style={{ position: 'relative', display: 'inline-flex', border: 'none', background: feedOpen ? 'var(--surface-sunk)' : 'transparent', cursor: 'pointer', padding: 8, borderRadius: 'var(--radius-md)' }}>
              <i data-lucide="bell" style={{ width: 20, height: 20, color: feedOpen ? 'var(--brand)' : 'var(--text-muted)' }} />
              {unread > 0 && <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 15, height: 15, padding: '0 4px', borderRadius: '999px', background: 'var(--danger)', color: '#fff', font: 'var(--fw-semibold) 9px/15px var(--font-sans)', textAlign: 'center', border: '1.5px solid var(--surface-card)' }}>{unread}</span>}
            </button>
            <button type="button" aria-label="Your account" onClick={() => go('account')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, borderRadius: '999px', display: 'inline-flex' }}>
              <Avatar name={me.name} src={myMember && myMember.photo} size="sm" ring={!route && view === 'account'} />
            </button>
          </div>
        </div>

        <div className="content">
          <div className="inner">{body}</div>
        </div>

        {feedOpen && (
          <div className="feed-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--divider)' }}>
              <div style={{ font: 'var(--role-h3)', color: 'var(--text-strong)' }}>Activity</div>
              <button type="button" onClick={() => setFeedOpen(false)} aria-label="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex' }}><i data-lucide="x" style={{ width: 18, height: 18 }} /></button>
            </div>
            <div style={{ maxHeight: 'min(70vh, 460px)', overflow: 'auto' }}>
              {data.feed.map((it) => (
                <button key={it.id} type="button" onClick={() => feedGoto(it)}
                  style={{ display: 'flex', gap: 12, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid var(--divider)', background: it.unread ? 'var(--pine-50)' : 'transparent' }}>
                  <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${it.tone} 16%, var(--snow))`, color: it.tone }}>
                    <i data-lucide={feedGlyph(it.kind)} style={{ width: 16, height: 16 }} />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ font: 'var(--role-small)', color: 'var(--text-body)' }}><b style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-semibold)' }}>{it.who}</b> {it.text}</span>
                    <span style={{ display: 'block', font: 'var(--text-2xs) var(--font-mono)', color: 'var(--text-faint)', marginTop: 3 }}>{it.when}</span>
                  </span>
                  {it.unread && <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', marginTop: 6 }} />}
                </button>
              ))}
            </div>
            <div style={{ padding: 'var(--space-3) var(--space-5)', borderTop: '1px solid var(--divider)', textAlign: 'center' }}>
              <button type="button" onClick={() => { setFeedOpen(false); go('updates'); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'var(--fw-semibold) var(--text-xs) var(--font-sans)', color: 'var(--text-link)' }}>See all updates</button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom tab bar — DS v1.1 BottomTabBar */}
      <div className="mobile-nav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 250 }}>
        <BottomTabBar
          items={nav.map((it) => ({ id: it.key, label: it.label.split(' ')[0], icon: it.icon }))}
          active={route ? null : view} onChange={go}
          style={{ width: '100%', background: 'color-mix(in srgb, var(--surface-card) 92%, transparent)' }} />
      </div>

      <HostDialog open={planOpen} data={data} initialType={postType} onClose={() => setPlanOpen(false)} onCreated={reload} />
      <EditProfileDialog target={editTarget} weekendDays={data.weekendDays} onClose={() => setEditTarget(null)} onSaved={bump} onReload={reload} />
      <AddMemberDialog family={addMemberFor} open={!!addMemberFor} onClose={() => setAddMemberFor(null)} onCreated={reload} />
      <AddToCalendarDialog event={calEvent} onClose={() => setCalEvent(null)} />
    </div>
    </ToastProvider>
  );
}

export default App;
