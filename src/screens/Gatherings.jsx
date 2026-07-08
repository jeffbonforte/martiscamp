import React from 'react';
import { GatheringCard, Button } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { PageHead } from './shared.jsx';

/** All member-organized get-togethers (open + invite-only). */
export function GatheringsScreen({ data, onPlan, onOpenEvent, onAddCal, rsvpMap }) {
  useLucide();
  return (
    <div>
      <PageHead eyebrow="Impromptu" title="Get-togethers"
        sub="Round up a group for golf, a ski run, or dinner — open to all or invite only."
        right={<Button iconLeft={<i data-lucide="plus" style={{ width: 16, height: 16 }} />} onClick={onPlan}>Host a get-together</Button>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
        {data.gatherings.map((g) => {
          const my = rsvpMap[g.id] ?? g.myRsvp;
          return (
            <GatheringCard key={g.id}
              gathering={{ ...g, open: g.capacity == null, spotsLeft: g.capacity != null ? g.capacity - g.going.length : undefined, joined: my === 'going' }}
              onRsvp={() => onOpenEvent(g)} onAddToCalendar={() => onAddCal(g)} />
          );
        })}
      </div>
    </div>
  );
}

export default GatheringsScreen;
