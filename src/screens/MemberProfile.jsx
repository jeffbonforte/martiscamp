import React from 'react';
import { AmenityTag, Badge, Button, EmptyState } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { openWhatsApp } from './shared.jsx';
import { ScheduleView } from './ScheduleView.jsx';

export function MemberProfileScreen({ family, member, data, favorites, onToggleFav, canEdit, onEdit, onBack, onOpenFamily, onOpenEvent }) {
  const me = member.name;
  const favId = 'm:' + member.name;
  const fav = favorites && favorites.has(favId);
  const myEvents = data.gatherings.map((g) => {
    const st = g.going.some((p) => p.name === me) ? 'going' : g.maybe.some((p) => p.name === me) ? 'maybe' : null;
    return st ? { ...g, st } : null;
  }).filter(Boolean);
  const tone = member.tone || 'var(--pine-600)';
  const [photoErr, setPhotoErr] = React.useState(false);
  React.useEffect(() => { setPhotoErr(false); }, [member]);
  useLucide();

  return (
    <div>
      <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', font: 'var(--fw-semibold) var(--text-sm) var(--font-sans)', marginBottom: 'var(--space-4)', padding: 0 }}>
        <i data-lucide="chevron-left" style={{ width: 16, height: 16 }} /> The {family.name}s
      </button>

      {/* Header: photo + identity */}
      <div className="member-header" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 'var(--space-6)', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <div className="m-photo" style={{ width: 180, height: 180, borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', background: `color-mix(in srgb, ${tone} 16%, var(--snow))` }}>
          {member.photo && !photoErr
            ? <img src={member.photo} alt={member.name} onError={() => setPhotoErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--fw-regular) 64px/1 var(--font-display)', color: tone }}>{member.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {member.days.length > 0
              ? <Badge tone="success" dot>Here this weekend</Badge>
              : <Badge>Not up this weekend</Badge>}
            {onToggleFav && (
              <Button variant={fav ? 'secondary' : 'ghost'} size="sm" onClick={() => onToggleFav(favId)}
                iconLeft={<i data-lucide="star" style={{ width: 14, height: 14, fill: fav ? 'currentColor' : 'none' }} />}>{fav ? 'Favorited' : 'Favorite ' + member.name.split(' ')[0]}</Button>
            )}
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={onEdit} iconLeft={<i data-lucide="pencil" style={{ width: 14, height: 14 }} />}>Edit</Button>
            )}
          </div>
          <div style={{ font: 'var(--fw-regular) var(--text-5xl)/1 var(--font-display)', color: 'var(--text-strong)', letterSpacing: 'var(--tracking-tight)' }}>{member.name}</div>
          <button type="button" onClick={onOpenFamily} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-link)', font: 'var(--role-small)', padding: 0, marginTop: 6 }}>
            {member.role} · The {family.name}s <i data-lucide="arrow-up-right" style={{ width: 13, height: 13 }} />
          </button>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            {(member.interests || []).map((a) => <AmenityTag key={a} amenity={a} />)}
          </div>
          {(member.phone || member.email) && (
            <div style={{ display: 'flex', gap: 'var(--space-5)', marginTop: 16, flexWrap: 'wrap' }}>
              {member.phone && <a href={`tel:${member.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', color: 'var(--text-body)', font: 'var(--role-small)' }}><i data-lucide="phone" style={{ width: 15, height: 15, color: 'var(--text-muted)' }} />{member.phone}</a>}
              {member.email && <a href={`mailto:${member.email}`} style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', color: 'var(--text-body)', font: 'var(--role-small)' }}><i data-lucide="mail" style={{ width: 15, height: 15, color: 'var(--text-muted)' }} />{member.email}</a>}
              <button type="button" onClick={() => openWhatsApp()} style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', font: 'var(--role-small)' }}><i data-lucide="message-circle" style={{ width: 15, height: 15, color: 'var(--success)' }} />WhatsApp</button>
            </div>
          )}
        </div>
      </div>

      {/* Personal schedule */}
      <div style={{ font: 'var(--role-h2)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>{member.name.split(' ')[0]}'s weekend</div>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <ScheduleView attendees={[member]} data={data} onOpenEvent={onOpenEvent} />
      </div>

      {/* Events */}
      <div style={{ font: 'var(--role-h2)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>Events</div>
      {myEvents.length === 0
        ? <EmptyState glyph="calendar" title={`No events yet for ${member.name.split(' ')[0]}`} description="Nothing on the calendar this weekend." />
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 'var(--space-4)' }}>
            {myEvents.map((g) => (
              <button key={g.id} type="button" onClick={() => onOpenEvent(g)} style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <AmenityTag amenity={g.amenity} size="sm" />
                  <Badge tone={g.st === 'going' ? 'success' : 'warning'}>{g.st === 'going' ? 'Attending' : 'Maybe'}</Badge>
                </div>
                <div style={{ font: 'var(--fw-regular) var(--text-lg)/1.2 var(--font-display)', color: 'var(--text-strong)' }}>{g.title}</div>
                <div style={{ font: 'var(--text-xs) var(--font-mono)', color: 'var(--text-muted)' }}>{g.when} · {g.where}</div>
              </button>
            ))}
          </div>}
    </div>
  );
}

export default MemberProfileScreen;
