import React from 'react';
import { Dialog, Button, Input, Select, Textarea, SegmentedControl } from '../../components/index.js';
import { useLucide } from '../../lib/useLucide.js';

const VENUES = ['Golf clubhouse', 'Camp Lodge Bistro', 'The Family Barn', 'The Beach Club', 'Martis Perk', 'Tennis Pavilion', 'Lookout Lodge', 'Pickleball courts'];
const DAYS = ['Thu, Jul 10', 'Fri, Jul 11', 'Sat, Jul 12', 'Sun, Jul 13'];

/**
 * Host a get-together OR post an announcement. Mirrors the prototype's combined
 * dialog: type toggle, open/invite-only visibility (with invitees), and an
 * announcement mode with audience targeting. Posting is a no-op here (mock).
 */
export function HostDialog({ open, initialType = 'gathering', onClose }) {
  const [postType, setPostType] = React.useState(initialType);
  const [planVis, setPlanVis] = React.useState('open');
  const [invitees, setInvitees] = React.useState([]);
  const [audience, setAudience] = React.useState('all');
  useLucide();

  React.useEffect(() => { if (open) { setPostType(initialType); setInvitees([]); } }, [open, initialType]);

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

  return (
    <Dialog open={open} onClose={onClose} title={postType === 'announcement' ? 'Post an announcement' : 'Host a get-together'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={onClose}>{postType === 'announcement' ? 'Post announcement' : 'Post get-together'}</Button></>}>
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
            <Input label="What's the plan?" placeholder="Saturday morning 9 holes" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Day" options={DAYS} />
              <Select label="Where" options={VENUES} />
            </div>
            <Input label="Time" placeholder="8:30 AM" />
            <div>
              <div style={{ font: 'var(--fw-medium) var(--text-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)', marginBottom: 6 }}>Who can come?</div>
              <SegmentedControl value={planVis} onChange={setPlanVis}
                options={[{ value: 'open', label: 'Anyone can join', icon: 'users' }, { value: 'private', label: 'Invite only', icon: 'lock' }]} />
            </div>
            {planVis === 'open' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
                <Input label="Max people" type="number" placeholder="Leave blank for open house" hint="Blank = open, drop-in" />
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
            <Textarea label="Details" rows={3} placeholder="9 holes, then lunch at the Bistro. Kids welcome." />
          </>
        )}
      </div>
    </Dialog>
  );
}

export default HostDialog;
