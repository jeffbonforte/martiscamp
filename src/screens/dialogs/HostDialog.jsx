import React from 'react';
import { Dialog, Button, Input, Select, Textarea, SegmentedControl, AMENITIES } from '../../components/index.js';
import { useLucide } from '../../lib/useLucide.js';
import { createGathering } from '../../lib/api.js';

const VENUES = ['Golf clubhouse', 'Camp Lodge Bistro', 'The Family Barn', 'The Beach Club', 'Martis Perk', 'Tennis Pavilion', 'Lookout Lodge', 'Pickleball courts'];
const DAYS = ['Thu, Jul 10', 'Fri, Jul 11', 'Sat, Jul 12', 'Sun, Jul 13'];
const AMENITY_OPTS = Object.entries(AMENITIES).map(([value, v]) => ({ value, label: v.label }));

/**
 * Host a get-together OR post an announcement. Get-togethers are created in
 * Supabase (when configured); announcements are not yet persisted (no-op close).
 * Calls onCreated() after a successful create so the app can refresh.
 */
export function HostDialog({ open, initialType = 'gathering', onClose, onCreated }) {
  const [postType, setPostType] = React.useState(initialType);
  const [planVis, setPlanVis] = React.useState('open');
  const [invitees, setInvitees] = React.useState([]);
  const [audience, setAudience] = React.useState('all');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  // get-together fields
  const [title, setTitle] = React.useState('');
  const [amenity, setAmenity] = React.useState('golf');
  const [day, setDay] = React.useState(DAYS[2]);
  const [where, setWhere] = React.useState(VENUES[0]);
  const [time, setTime] = React.useState('');
  const [cap, setCap] = React.useState('');
  const [details, setDetails] = React.useState('');
  useLucide();

  React.useEffect(() => {
    if (open) {
      setPostType(initialType); setInvitees([]); setErr(''); setBusy(false);
      setTitle(''); setAmenity('golf'); setDay(DAYS[2]); setWhere(VENUES[0]); setTime(''); setCap(''); setDetails(''); setPlanVis('open');
    }
  }, [open, initialType]);

  const toggleInvitee = (n) => setInvitees((v) => (v.includes(n) ? v.filter((x) => x !== n) : [...v, n]));
  const chip = (n) => {
    const on = invitees.includes(n);
    return (
      <button key={n} type="button" onClick={() => toggleInvitee(n)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
          border: `1px solid ${on ? 'var(--brand)' : 'var(--border-strong)'}`, background: on ? 'var(--brand)' : 'var(--surface-card)', color: on ? '#fff' : 'var(--text-body)',
          font: 'var(--fw-semibold) var(--text-xs)/1 var(--font-sans)' }}>
        {on && <i data-lucide="check" style={{ width: 12, height: 12 }} />}{n}
      </button>
    );
  };

  const submit = async () => {
    if (postType !== 'gathering') { onClose(); return; } // announcements not persisted yet
    setErr(''); setBusy(true);
    const when = [day, time].filter(Boolean).join(' · ');
    const r = await createGathering({
      title: title.trim() || 'Get-together', amenity, when, location: where, description: details,
      visibility: planVis, capacity: planVis === 'open' ? cap : cap, inviteeNames: invitees,
    });
    setBusy(false);
    if (r.ok) { onCreated && onCreated(r.slug); onClose(); }
    else if (r.offline) { onClose(); } // mock mode: nothing to persist
    else setErr(r.error || 'Could not post the get-together.');
  };

  return (
    <Dialog open={open} onClose={onClose} title={postType === 'announcement' ? 'Post an announcement' : 'Host a get-together'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={busy}>{busy ? 'Posting…' : postType === 'announcement' ? 'Post announcement' : 'Post get-together'}</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SegmentedControl value={postType} onChange={setPostType}
          options={[{ value: 'gathering', label: 'Get-together', icon: 'party-popper' }, { value: 'announcement', label: 'Announcement', icon: 'megaphone' }]} />

        {postType === 'announcement' ? (
          <>
            <Input label="Announcement" placeholder="Beach Club closed for maintenance Saturday" />
            <Textarea label="Message" rows={3} placeholder="Share the details — no date or place needed." />
            <div>
              <div style={{ font: 'var(--fw-medium) var(--text-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)', marginBottom: 6 }}>Who should see this?</div>
              <SegmentedControl value={audience} onChange={setAudience}
                options={[{ value: 'all', label: 'All families', icon: 'users' }, { value: 'specific', label: 'Specific people', icon: 'user' }]} />
            </div>
            {audience === 'specific' && (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['The Bells', 'The Kwans', 'The Fords', 'The Alvarezes', 'Tom Bell', 'Rosa Alvarez'].map(chip)}
                </div>
                <div style={{ font: 'var(--text-xs) var(--font-sans)', color: 'var(--text-muted)', marginTop: 8 }}>Only the people you pick will see this announcement.</div>
              </div>
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
              <Select label="Day" options={DAYS} value={day} onChange={(e) => setDay(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Where" options={VENUES} value={where} onChange={(e) => setWhere(e.target.value)} />
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['Tom Bell', 'Ben Kwan', 'Pat Reyes', 'Rosa Alvarez', 'Mia Ford', 'Chi Okafor'].map(chip)}
                </div>
                <div style={{ font: 'var(--text-xs) var(--font-sans)', color: 'var(--text-muted)', marginTop: 8 }}>Only invited members will see this get-together.</div>
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
