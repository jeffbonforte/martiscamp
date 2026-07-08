import React from 'react';
import { Avatar, AmenityTag, Badge, Button, Card } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { coverUrl } from '../lib/images.js';
import { chipStyle } from './shared.jsx';
import { ScheduleView } from './ScheduleView.jsx';

export function FamilyProfileScreen({ family, data, favorites, onToggleFav, canEdit, onEdit, onBack, onOpenEvent, onOpenMember }) {
  const [who, setWho] = React.useState('family'); // 'family' or member name
  const fav = favorites.has(family.id);
  const attendees = who === 'family' ? family.members : family.members.filter((m) => m.name === who);
  useLucide();

  return (
    <div>
      <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', font: 'var(--fw-semibold) var(--text-sm) var(--font-sans)', marginBottom: 'var(--space-4)', padding: 0 }}>
        <i data-lucide="chevron-left" style={{ width: 16, height: 16 }} /> Directory
      </button>

      {/* Cover */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', marginBottom: 'var(--space-6)', background: `color-mix(in srgb, ${family.tone} 30%, var(--pine-900))`, minHeight: 240 }}>
        <img src={coverUrl(family.cover || 'lodge.jpg')} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: 240, objectFit: 'cover', objectPosition: 'center 55%', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, height: 240, background: 'linear-gradient(to top, rgba(20,15,10,.8) 0%, rgba(20,15,10,.2) 46%, rgba(20,15,10,0) 72%)' }} />
        <div style={{ position: 'relative', minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ padding: 'var(--space-6) var(--space-8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              {family.presence.here && <div style={{ marginBottom: 8 }}><Badge tone="success" dot>{family.presence.label}</Badge></div>}
              <div style={{ font: 'var(--fw-regular) var(--text-5xl)/1 var(--font-display)', color: '#fff', letterSpacing: 'var(--tracking-tight)' }}>The {family.name}s</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', color: 'rgba(255,255,255,.9)', font: 'var(--role-small)', marginTop: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i data-lucide="map-pin" style={{ width: 15, height: 15 }} />{family.address}</span>
                {family.hometown && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i data-lucide="home" style={{ width: 15, height: 15 }} />Home: {family.hometown}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {canEdit && (
                <Button variant="secondary" onClick={onEdit} iconLeft={<i data-lucide="pencil" style={{ width: 15, height: 15 }} />}>Edit family</Button>
              )}
              <Button variant={fav ? 'secondary' : 'primary'} onClick={() => onToggleFav(family.id)}
                iconLeft={<i data-lucide="star" style={{ width: 15, height: 15, fill: fav ? 'currentColor' : 'none' }} />}>{fav ? 'Favorited' : 'Favorite'}</Button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--space-8)' }}>
        {family.interests.map((a) => <AmenityTag key={a} amenity={a} />)}
      </div>

      {/* Members */}
      <div style={{ font: 'var(--role-h2)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>Family members</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-10)' }}>
        {family.members.map((m) => (
          <Card key={m.name} interactive onClick={() => onOpenMember(m)} padding="var(--space-4)"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={m.name} src={m.photo} tone={m.tone} size="lg" />
              <div style={{ minWidth: 0 }}>
                <div style={{ font: 'var(--fw-semibold) var(--text-base)/1.15 var(--font-sans)', color: 'var(--text-strong)' }}>{m.name}</div>
                <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>{m.role}</div>
              </div>
            </div>
            {(m.phone || m.email) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {m.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--text-xs) var(--font-mono)', color: 'var(--text-muted)' }}><i data-lucide="phone" style={{ width: 13, height: 13 }} />{m.phone}</div>}
                {m.email && <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--text-xs) var(--font-sans)', color: 'var(--text-muted)' }}><i data-lucide="mail" style={{ width: 13, height: 13 }} />{m.email}</div>}
              </div>
            )}
            {m.interests && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{m.interests.map((a) => <AmenityTag key={a} amenity={a} size="sm" />)}</div>}
            <div style={{ font: 'var(--text-xs) var(--font-sans)', color: 'var(--brand)', fontWeight: 'var(--fw-semibold)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View profile <i data-lucide="arrow-right" style={{ width: 12, height: 12 }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Schedule */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ font: 'var(--role-h2)', color: 'var(--text-strong)' }}>{who === 'family' ? "This weekend's schedule" : `${who.split(' ')[0]}'s schedule`}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setWho('family')} style={chipStyle(who === 'family')}>Whole family</button>
          {family.members.map((m) => <button key={m.name} type="button" onClick={() => setWho(m.name)} style={chipStyle(who === m.name)}>{m.name.split(' ')[0]}</button>)}
        </div>
      </div>
      <ScheduleView attendees={attendees} data={data} onOpenEvent={onOpenEvent} />
    </div>
  );
}

export default FamilyProfileScreen;
