import React from 'react';
import { FamilyCard, SegmentedControl, Input, EmptyState, Button } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { coverUrl } from '../lib/images.js';
import { PageHead } from './shared.jsx';
import { RequestAddDialog } from './dialogs/RequestAddDialog.jsx';

/** A starred family shown in the Favorites strip. */
function FavoriteTile({ family, onOpen }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" onClick={onOpen}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', flexShrink: 0, width: 180, height: 112, borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        border: 'none', padding: 0, cursor: 'pointer', boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        background: `color-mix(in srgb, ${family.tone} 30%, var(--pine-900))`,
        transform: hover ? 'translateY(-2px)' : 'none', transition: 'box-shadow var(--dur-base), transform var(--dur-base)' }}>
      <img src={coverUrl(family.cover)} alt=""
        onError={(e) => { e.currentTarget.style.opacity = '0'; }} onLoad={(e) => { e.currentTarget.style.opacity = '1'; }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: family.coverPos || 'center 45%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,15,10,.8) 0%, rgba(20,15,10,.05) 60%)' }} />
      <i data-lucide="star" style={{ position: 'absolute', top: 8, right: 8, width: 15, height: 15, color: 'var(--warning)', fill: 'var(--warning)' }} />
      <div style={{ position: 'absolute', left: 10, right: 10, bottom: 9, textAlign: 'left' }}>
        <div style={{ font: 'var(--fw-regular) var(--text-lg)/1 var(--font-display)', color: '#fff' }}>The {family.name}s</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', color: 'rgba(255,255,255,.85)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: family.presence.here ? '#8fe0aa' : 'rgba(255,255,255,.6)' }} />
          {family.presence.here ? family.presence.label : 'Away'}
        </div>
      </div>
    </button>
  );
}

export function DirectoryScreen({ data, favorites, onToggleFav, onOpen }) {
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('all');
  const [reqOpen, setReqOpen] = React.useState(false);
  useLucide();

  const favList = data.families.filter((f) => favorites.has(f.id));
  let list = data.families.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
  if (tab === 'fav') list = list.filter((f) => favorites.has(f.id));
  const hereCount = data.families.filter((f) => f.presence.here).length;

  return (
    <div>
      <PageHead eyebrow={`${data.families.length} member ${data.families.length === 1 ? 'family' : 'families'} · ${hereCount} here now`} title="Family directory"
        right={<div style={{ width: 260 }}><Input leading={<i data-lucide="search" style={{ width: 16, height: 16 }} />} placeholder="Search families" value={q} onChange={(e) => setQ(e.target.value)} /></div>} />

      {/* Favorites row */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
          <i data-lucide="star" style={{ width: 16, height: 16, color: 'var(--warning)', fill: 'var(--warning)' }} />
          <span style={{ font: 'var(--role-h3)', color: 'var(--text-strong)' }}>Favorites</span>
        </div>
        {favList.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-strong)', background: 'var(--surface-sunk)', font: 'var(--role-small)', color: 'var(--text-muted)' }}>
            <i data-lucide="star" style={{ width: 16, height: 16 }} /> Tap the star on any family to keep them close at the top.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 6 }}>
            {favList.map((f) => <FavoriteTile key={f.id} family={f} onOpen={() => onOpen(f)} />)}
          </div>
        )}
      </div>

      {/* Request to add someone — prominent up top; common in the early days. */}
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: 'var(--space-5) var(--space-6)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-strong)', background: 'var(--surface-sunk)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i data-lucide="user-plus" style={{ width: 18, height: 18, color: 'var(--brand)' }} />
          <div>
            <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.2 var(--font-sans)', color: 'var(--text-strong)' }}>Someone missing?</div>
            <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>Request to add a person or a whole family — an admin will send them an invite.</div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setReqOpen(true)} iconLeft={<i data-lucide="user-plus" style={{ width: 15, height: 15 }} />}>Request to add someone</Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <div style={{ font: 'var(--role-h2)', color: 'var(--text-strong)' }}>All families</div>
        <SegmentedControl value={tab} onChange={setTab}
          options={[{ value: 'all', label: 'All' }, { value: 'fav', label: 'Favorites', icon: 'star' }]} />
      </div>
      {list.length === 0
        ? <EmptyState glyph="users" title="No families here yet" description="Try a different search, or favorite a family to see them here." />
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-5)' }}>
            {list.map((f) => (
              <FamilyCard key={f.id} family={f} cover={coverUrl(f.coverThumb || f.cover)} coverFallback={coverUrl(f.cover)} onOpen={() => onOpen(f)}
                favorite={favorites.has(f.id)} onToggleFavorite={() => onToggleFav(f.id)} />
            ))}
          </div>}

      <RequestAddDialog open={reqOpen} onClose={() => setReqOpen(false)} />
    </div>
  );
}

export default DirectoryScreen;
