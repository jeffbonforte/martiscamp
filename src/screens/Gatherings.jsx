import React from 'react';
import { GatheringCard, Button, EmptyState } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { PageHead } from './shared.jsx';
import { eventStart, isPastEvent } from '../lib/calendar.js';

/** All member-organized get-togethers (open + invite-only). */
export function GatheringsScreen({ data, onPlan, onOpenEvent, onAddCal, rsvpMap }) {
  useLucide();
  // Auto-archive get-togethers 3h after they start, soonest first.
  const upcoming = data.gatherings
    .filter((g) => !isPastEvent(g))
    .sort((a, b) => (eventStart(a)?.getTime() ?? Infinity) - (eventStart(b)?.getTime() ?? Infinity));
  return (
    <div>
      <PageHead eyebrow="Impromptu" title="Get-togethers"
        sub="Round up a group for golf, a ski run, or dinner — open to all or invite only."
        right={<Button iconLeft={<i data-lucide="plus" style={{ width: 16, height: 16 }} />} onClick={onPlan}>Host a get-together</Button>} />
      {upcoming.length === 0 ? (
        <EmptyState glyph="party-popper" title="Nothing on the books"
          description="No upcoming get-togethers right now. Host one and round up a group."
          action={<Button iconLeft={<i data-lucide="plus" style={{ width: 16, height: 16 }} />} onClick={onPlan}>Host a get-together</Button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          {upcoming.map((g) => {
            const my = rsvpMap[g.id] ?? g.myRsvp;
            return (
              <GatheringCard key={g.id}
                gathering={{ ...g, open: g.capacity == null, spotsLeft: g.capacity != null ? g.capacity - g.going.length : undefined, joined: my === 'going' }}
                onOpen={() => onOpenEvent(g)}
                onRsvp={() => onOpenEvent(g)} onAddToCalendar={() => onAddCal(g)} />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GatheringsScreen;
