import React from 'react';
import { Avatar, AmenityTag, Button, Card, RsvpControl, Input } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { activityImage } from '../lib/images.js';
import { loadComments, addComment } from '../lib/api.js';
import { WhatsButton } from './shared.jsx';

/** Get-together detail: hero, RSVP, auto-collected contacts, comments, WhatsApp. */
export function EventScreen({ event, data, myRsvp, onRsvp, onBack, onAddCal }) {
  const isPrivate = event.visibility === 'private';
  const banner = activityImage(event.amenity);
  const me = data.me.name;
  const [comments, setComments] = React.useState([]);
  const [newComment, setNewComment] = React.useState('');
  const [posting, setPosting] = React.useState(false);
  useLucide();

  React.useEffect(() => {
    let alive = true;
    loadComments(event.id).then((cs) => { if (alive) setComments(cs); });
    return () => { alive = false; };
  }, [event.id]);

  const postComment = async () => {
    const body = newComment.trim();
    if (!body) return;
    setPosting(true);
    const r = await addComment(event.id, body);
    setPosting(false);
    setNewComment('');
    if (r.ok) { const cs = await loadComments(event.id); setComments(cs); }
    else { setComments((c) => [...c, { id: `local-${c.length}`, who: me, body, when: 'Just now', tone: 'var(--pine-600)' }]); }
  };

  const lists = { going: [...event.going], maybe: [...event.maybe], declined: [...event.declined] };
  ['going', 'maybe', 'declined'].forEach((k) => { lists[k] = lists[k].filter((p) => p.name !== me); });
  if (myRsvp) lists[myRsvp] = [{ name: me }, ...lists[myRsvp]];

  const phoneOf = (name) => {
    for (const f of data.families) { const m = f.members.find((x) => x.name === name); if (m && m.phone) return m.phone; }
    return null;
  };
  const contacts = lists.going.map((p) => ({ name: p.name, phone: phoneOf(p.name) }));

  const Section = ({ k, label, tone }) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
        <span style={{ font: 'var(--fw-semibold) var(--text-sm)/1 var(--font-sans)', color: 'var(--text-strong)' }}>{label}</span>
        <span style={{ font: 'var(--fw-semibold) var(--text-xs)/1 var(--font-mono)', color: tone }}>{lists[k].length}</span>
      </div>
      {lists[k].length === 0 ? <div style={{ font: 'var(--role-small)', color: 'var(--text-faint)' }}>—</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lists[k].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={p.name} size="sm" />
                <span style={{ font: 'var(--role-small)', color: 'var(--text-body)' }}>{p.name}{p.name === me && <span style={{ color: 'var(--text-faint)' }}> · you</span>}</span>
              </div>
            ))}
          </div>}
    </div>
  );

  return (
    <div>
      <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', font: 'var(--fw-semibold) var(--text-sm) var(--font-sans)', marginBottom: 'var(--space-4)', padding: 0 }}>
        <i data-lucide="chevron-left" style={{ width: 16, height: 16 }} /> Get-togethers
      </button>

      {banner && (
        <div style={{ position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 'var(--space-6)', boxShadow: 'var(--shadow-md)' }}>
          <img src={banner} alt="" onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,15,10,.55) 0%, rgba(20,15,10,0) 55%)' }} />
        </div>
      )}

      <div className="split-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(260px,1fr)', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* main */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <AmenityTag amenity={event.amenity} />
            {isPrivate && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunk)', border: '1px solid var(--border)', color: 'var(--text-muted)', font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)' }}>
                <i data-lucide="lock" style={{ width: 12, height: 12 }} />Invite only
              </span>
            )}
          </div>
          <div style={{ font: 'var(--fw-regular) var(--text-5xl)/1.05 var(--font-display)', color: 'var(--text-strong)', letterSpacing: 'var(--tracking-tight)' }}>{event.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-5)', margin: 'var(--space-5) 0', font: 'var(--role-body)', color: 'var(--text-body)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i data-lucide="clock" style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />{event.when}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i data-lucide="map-pin" style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />{event.where}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i data-lucide="user" style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />Hosted by {event.host}</span>
          </div>
          <p style={{ font: 'var(--role-body)', color: 'var(--text-body)', maxWidth: 600, marginTop: 0 }}>{event.description}</p>

          <Card style={{ marginTop: 'var(--space-6)' }}>
            <div style={{ font: 'var(--role-h3)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>Are you coming?</div>
            <RsvpControl value={myRsvp} onChange={onRsvp} block size="md" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'var(--space-4)', font: 'var(--role-small)', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <i data-lucide="users" style={{ width: 15, height: 15 }} /> {lists.going.length} attending{event.capacity ? ` · ${Math.max(event.capacity - lists.going.length, 0)} spots left` : ''}
              <span style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <Button variant="secondary" size="sm" iconLeft={<i data-lucide="calendar-plus" style={{ width: 14, height: 14 }} />} onClick={() => onAddCal(event)}>Add to my calendar</Button>
                <WhatsButton size="sm" label="Message on WhatsApp" />
              </span>
            </div>
          </Card>

          {/* Auto-collected contacts for the group */}
          <Card style={{ marginTop: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div style={{ font: 'var(--role-h3)', color: 'var(--text-strong)' }}>Who's coming — contacts</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', color: 'var(--text-muted)' }}><i data-lucide="sparkles" style={{ width: 12, height: 12 }} />Auto-collected from RSVPs</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 'var(--space-4)' }}>
              {contacts.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px', borderBottom: i < contacts.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                  <Avatar name={c.name} size="sm" />
                  <span style={{ font: 'var(--fw-semibold) var(--text-sm)/1.1 var(--font-sans)', color: 'var(--text-strong)', flex: 1, minWidth: 0 }}>{c.name}{c.name === me && <span style={{ color: 'var(--text-faint)', fontWeight: 'var(--fw-regular)' }}> · you</span>}</span>
                  {c.phone
                    ? <span style={{ font: 'var(--text-xs) var(--font-mono)', color: 'var(--text-muted)' }}>{c.phone}</span>
                    : <span style={{ font: 'var(--text-2xs) var(--font-sans)', color: 'var(--text-faint)' }}>no number</span>}
                  <i data-lucide="message-circle" style={{ width: 16, height: 16, color: '#1FA855' }} />
                </div>
              ))}
            </div>
            <WhatsButton block label="Start a WhatsApp group with everyone coming" />
          </Card>

          {/* Comments */}
          <Card style={{ marginTop: 'var(--space-5)' }}>
            <div style={{ font: 'var(--role-h3)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>Comments</div>
            {comments.length === 0
              ? <div style={{ font: 'var(--role-small)', color: 'var(--text-faint)' }}>No comments yet — start the conversation.</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {comments.map((c) => (
                    <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                      <Avatar name={c.who} src={c.photo} tone={c.tone} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ font: 'var(--fw-semibold) var(--text-sm)/1.1 var(--font-sans)', color: 'var(--text-strong)' }}>{c.who}</span>
                          <span style={{ font: 'var(--text-2xs) var(--font-mono)', color: 'var(--text-faint)' }}>{c.when}</span>
                        </div>
                        <div style={{ font: 'var(--role-small)', color: 'var(--text-body)', marginTop: 2 }}>{c.body}</div>
                      </div>
                    </div>
                  ))}
                </div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-4)' }}>
              <div style={{ flex: 1 }}><Input placeholder="Add a comment…" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') postComment(); }} /></div>
              <Button onClick={postComment} disabled={posting || !newComment.trim()}>{posting ? 'Posting…' : 'Post'}</Button>
            </div>
          </Card>
        </div>

        {/* attendees rail */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {isPrivate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--surface-sunk)', font: 'var(--role-small)', color: 'var(--text-muted)' }}>
              <i data-lucide="lock" style={{ width: 14, height: 14 }} />Private — only invited members can see and join.
            </div>
          )}
          <Section k="going" label={isPrivate ? 'Coming' : 'Attending'} tone="var(--success)" />
          <div style={{ height: 1, background: 'var(--divider)' }} />
          <Section k="maybe" label="Maybe" tone="var(--warning)" />
          <div style={{ height: 1, background: 'var(--divider)' }} />
          <Section k="declined" label="Can't make it" tone="var(--danger)" />
        </Card>
      </div>
    </div>
  );
}

export default EventScreen;
