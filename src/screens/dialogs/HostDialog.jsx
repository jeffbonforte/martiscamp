import React from 'react';
import { Dialog, Button, Input, Select, Textarea, SegmentedControl, AMENITIES } from '../../components/index.js';
import { useLucide } from '../../lib/useLucide.js';
import { createGathering, updateGathering } from '../../lib/api.js';
import { dateKey, eventDate } from '../../lib/calendar.js';

const VENUES = ['Golf clubhouse', 'Camp Lodge Bistro', 'The Family Barn', 'The Lake Club', 'Martis Perk', 'Tennis Pavilion', 'Lookout Lodge', 'Pickleball courts'];
const TODAY_KEY = dateKey(new Date());
const AMENITY_OPTS = Object.entries(AMENITIES).map(([value, v]) => ({ value, label: v.label }));

/**
 * Search-and-pick invitees from the real member directory. Selected people show
 * as removable chips; typing filters the members, and up to 4 suggestions show
 * when the field is empty.
 */
function InviteePicker({ candidates, selected, onAdd, onRemove, hint }) {
  const [query, setQuery] = React.useState('');
  const pool = candidates.filter((n) => !selected.includes(n));
  const q = query.trim().toLowerCase();
  const suggestions = (q ? pool.filter((n) => n.toLowerCase().includes(q)) : pool).slice(0, q ? 8 : 4);
  return (
    <div>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {selected.map((n) => (
            <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 8px 6px 11px', borderRadius: 'var(--radius-pill)', background: 'var(--brand)', color: '#fff', font: 'var(--fw-semibold) var(--text-xs)/1 var(--font-sans)' }}>
              {n}
              <button type="button" onClick={() => onRemove(n)} aria-label={`Remove ${n}`} style={{ display: 'inline-flex', border: 'none', background: 'transparent', cursor: 'pointer', color: '#fff', padding: 0 }}>
                <i data-lucide="x" style={{ width: 13, height: 13 }} />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input placeholder="Search members to invite" value={query} onChange={(e) => setQuery(e.target.value)} leading={<i data-lucide="search" style={{ width: 15, height: 15 }} />} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {suggestions.length === 0 ? (
          <span style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>{q ? 'No matching members' : 'No other members to invite yet'}</span>
        ) : suggestions.map((n) => (
          <button key={n} type="button" onClick={() => { onAdd(n); setQuery(''); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 'var(--radius-pill)', cursor: 'pointer', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', color: 'var(--text-body)', font: 'var(--fw-semibold) var(--text-xs)/1 var(--font-sans)' }}>
            <i data-lucide="plus" style={{ width: 12, height: 12 }} />{n}
          </button>
        ))}
      </div>
      {hint && <div style={{ font: 'var(--text-xs) var(--font-sans)', color: 'var(--text-muted)', marginTop: 8 }}>{hint}</div>}
    </div>
  );
}

/**
 * Host a get-together OR post an announcement. Get-togethers are created in
 * Supabase (when configured); announcements are not yet persisted (no-op close).
 * Calls onCreated() after a successful create so the app can refresh.
 */
export function HostDialog({ open, data, initialType = 'gathering', editEvent = null, onClose, onCreated }) {
  const isEdit = !!editEvent;
  const [postType, setPostType] = React.useState(initialType);
  const [planVis, setPlanVis] = React.useState('open');
  const [invitees, setInvitees] = React.useState([]);
  const [audience, setAudience] = React.useState('all');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  // get-together fields
  const [title, setTitle] = React.useState('');
  const [amenity, setAmenity] = React.useState('golf');
  const [date, setDate] = React.useState(''); // YYYY-MM-DD, any upcoming day
  const [where, setWhere] = React.useState(VENUES[0]);
  const [time, setTime] = React.useState('');
  const [cap, setCap] = React.useState('');
  const [details, setDetails] = React.useState('');
  useLucide();

  React.useEffect(() => {
    if (!open) return;
    setErr(''); setBusy(false);
    if (editEvent) {
      // Prefill from the get-together being edited.
      const ed = eventDate(editEvent);
      const timePart = (editEvent.when || '').includes('·') ? editEvent.when.split('·').slice(1).join('·').trim() : '';
      setPostType('gathering');
      setTitle(editEvent.title || ''); setAmenity(editEvent.amenity || 'golf');
      setDate(ed ? dateKey(ed) : ''); setWhere(editEvent.where || VENUES[0]); setTime(timePart);
      setCap(editEvent.capacity != null ? String(editEvent.capacity) : '');
      setDetails(editEvent.description || ''); setPlanVis(editEvent.visibility === 'private' ? 'private' : 'open');
      setInvitees((editEvent.invited || []).map((x) => x.name).filter(Boolean));
    } else {
      setPostType(initialType); setInvitees([]);
      setTitle(''); setAmenity('golf'); setDate(''); setWhere(VENUES[0]); setTime(''); setCap(''); setDetails(''); setPlanVis('open');
    }
  }, [open, initialType, editEvent]);

  const addInvitee = (n) => setInvitees((v) => (v.includes(n) ? v : [...v, n]));
  const removeInvitee = (n) => setInvitees((v) => v.filter((x) => x !== n));
  // Real members (across all families) except yourself — the invite candidates.
  const candidates = React.useMemo(() => {
    const names = new Set();
    (data?.families || []).forEach((f) => (f.members || []).forEach((m) => { if (m.name && m.name !== data?.me?.name) names.add(m.name); }));
    return [...names].sort();
  }, [data]);

  const submit = async () => {
    if (postType !== 'gathering') { onClose(); return; } // announcements not persisted yet
    if (!date) { setErr('Pick a date for your get-together.'); return; }
    setErr(''); setBusy(true);
    // "2026-08-15" → "Sat, Aug 15" so the label carries the real date (parses back
    // for calendar placement + auto-archiving).
    const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const when = [dateLabel, time].filter(Boolean).join(' · ');
    const payload = {
      title: title.trim() || 'Get-together', amenity, when, location: where, description: details,
      visibility: planVis, capacity: cap, inviteeNames: invitees,
    };
    const r = isEdit ? await updateGathering(editEvent.id, payload) : await createGathering(payload);
    setBusy(false);
    if (r.ok) { onCreated && onCreated(isEdit ? editEvent.id : r.slug); onClose(); }
    else if (r.offline) { onClose(); } // mock mode: nothing to persist
    else setErr(r.error || `Could not ${isEdit ? 'save' : 'post'} the get-together.`);
  };

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? 'Edit get-together' : postType === 'announcement' ? 'Post an announcement' : 'Host a get-together'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : isEdit ? 'Save changes' : postType === 'announcement' ? 'Post announcement' : 'Post get-together'}</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!isEdit && (
          <SegmentedControl value={postType} onChange={setPostType}
            options={[{ value: 'gathering', label: 'Get-together', icon: 'party-popper' }, { value: 'announcement', label: 'Announcement', icon: 'megaphone' }]} />
        )}

        {postType === 'announcement' ? (
          <>
            <Input label="Announcement" placeholder="Lake Club closed for maintenance Saturday" />
            <Textarea label="Message" rows={3} placeholder="Share the details — no date or place needed." />
            <div>
              <div style={{ font: 'var(--fw-medium) var(--text-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)', marginBottom: 6 }}>Who should see this?</div>
              <SegmentedControl value={audience} onChange={setAudience}
                options={[{ value: 'all', label: 'All families', icon: 'users' }, { value: 'specific', label: 'Specific people', icon: 'user' }]} />
            </div>
            {audience === 'specific' && (
              <InviteePicker candidates={candidates} selected={invitees} onAdd={addInvitee} onRemove={removeInvitee}
                hint="Only the people you pick will see this announcement." />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--warm-soft)', color: 'var(--cedar-700)', font: 'var(--text-xs) var(--font-sans)' }}>
              <i data-lucide="megaphone" style={{ width: 15, height: 15 }} /> Announcements appear in {audience === 'all' ? 'everyone’s' : 'the recipients’'} Updates feed. No RSVP, date, or place.
            </div>
          </>
        ) : (
          <>
            <Input label="What's the plan?" placeholder="Saturday morning 9 holes" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Activity" options={AMENITY_OPTS} value={amenity} onChange={(e) => setAmenity(e.target.value)} />
              <Input label="Date" type="date" min={TODAY_KEY} value={date} onChange={(e) => setDate(e.target.value)} hint="Any upcoming day" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Where" options={where && !VENUES.includes(where) ? [where, ...VENUES] : VENUES} value={where} onChange={(e) => setWhere(e.target.value)} />
              <Input label="Time" placeholder="8:30 AM" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div>
              <div style={{ font: 'var(--fw-medium) var(--text-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)', marginBottom: 6 }}>Who can come?</div>
              <SegmentedControl value={planVis} onChange={setPlanVis}
                options={[{ value: 'open', label: 'Anyone can join', icon: 'users' }, { value: 'private', label: 'Invite only', icon: 'lock' }]} />
            </div>
            {planVis === 'open' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
                <Input label="Max people" type="number" placeholder="Leave blank for open house" hint="Blank = open, drop-in" value={cap} onChange={(e) => setCap(e.target.value)} />
              </div>
            ) : (
              <div>
                <div style={{ font: 'var(--fw-medium) var(--text-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)', marginBottom: 6 }}>Invite</div>
                <InviteePicker candidates={candidates} selected={invitees} onAdd={addInvitee} onRemove={removeInvitee}
                  hint="Only invited members will see this get-together." />
              </div>
            )}
            <Textarea label="Details" rows={3} placeholder="9 holes, then lunch at the Bistro. Kids welcome." value={details} onChange={(e) => setDetails(e.target.value)} />
          </>
        )}

        {err && <div style={{ color: 'var(--danger)', font: 'var(--role-small)' }}>{err}</div>}
      </div>
    </Dialog>
  );
}

export default HostDialog;
