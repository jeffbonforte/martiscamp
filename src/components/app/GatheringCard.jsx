import React from 'react';
import { AmenityTag } from '../display/AmenityTag.jsx';
import { AvatarGroup } from '../display/AvatarGroup.jsx';
import { Button } from '../forms/Button.jsx';

/**
 * Get-together card: golf outing, dinner, ski run.
 * `visibility` = 'open' (anyone can join) | 'private' (invite only).
 * For private get-togethers, `youInvited` controls whether the viewer can join.
 * `onAddToCalendar` adds an "Add to calendar" action.
 * `onOpen` makes the whole card open the get-together's detail screen — where
 * the host (or an admin) can edit or delete it.
 */
export function GatheringCard({ gathering = {}, onRsvp, onAddToCalendar, onOpen, style = {} }) {
  const { title, amenity, host, when, where, going = [], spotsLeft, joined, open,
    visibility = 'open', youInvited = true } = gathering;
  const isPrivate = visibility === 'private';
  const canJoin = !isPrivate || youInvited;
  const interactive = typeof onOpen === 'function';
  const [hover, setHover] = React.useState(false);

  // role="button" rather than an actual <button> wrapper: the card already
  // contains buttons, and nesting interactive elements is invalid HTML and
  // breaks keyboard navigation. This keeps it reachable by tab and Enter/Space.
  const openProps = interactive ? {
    role: 'button',
    tabIndex: 0,
    'aria-label': `Open ${title || 'get-together'}`,
    onClick: onOpen,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); }
    },
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false),
  } : {};

  return (
    <div {...openProps} style={{
      background: 'var(--surface-card)',
      border: `1px solid ${interactive && hover ? 'var(--border-strong)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
      boxShadow: interactive && hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      cursor: interactive ? 'pointer' : undefined,
      transition: 'box-shadow 120ms ease, border-color 120ms ease',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {amenity && <AmenityTag amenity={amenity} size="sm" />}
            {isPrivate && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
                borderRadius: 'var(--radius-pill)', background: 'var(--surface-sunk)',
                border: '1px solid var(--border)', color: 'var(--text-muted)',
                font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)',
              }}><i data-lucide="lock" style={{ width: 11, height: 11 }} />Invite only</span>
            )}
          </div>
          <div style={{ font: 'var(--fw-regular) var(--text-xl)/1.2 var(--font-display)', color: 'var(--text-strong)' }}>{title}</div>
        </div>
        {!isPrivate && open ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 'var(--radius-pill)',
            background: 'var(--success-soft)', color: 'var(--success)', whiteSpace: 'nowrap',
            font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)',
          }}><i data-lucide="door-open" style={{ width: 12, height: 12 }} />Open · drop in</span>
        ) : typeof spotsLeft === 'number' && (
          <span style={{
            font: 'var(--fw-semibold) var(--text-xs)/1 var(--font-mono)',
            color: spotsLeft > 0 ? 'var(--text-muted)' : 'var(--danger)', whiteSpace: 'nowrap',
          }}>{spotsLeft > 0 ? `${spotsLeft} ${isPrivate ? 'open' : 'spots'} left` : 'Full'}</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, font: 'var(--role-small)', color: 'var(--text-body)' }}>
        {when && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i data-lucide="clock" style={{ width: 15, height: 15, color: 'var(--text-muted)' }} />{when}</div>}
        {where && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i data-lucide="map-pin" style={{ width: 15, height: 15, color: 'var(--text-muted)' }} />{where}</div>}
        {host && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i data-lucide="user" style={{ width: 15, height: 15, color: 'var(--text-muted)' }} />Hosted by {host}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', borderTop: '1px solid var(--divider)', paddingTop: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AvatarGroup members={going} size="sm" max={5} />
          <span style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>{going.length} {isPrivate ? 'invited' : 'going'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onAddToCalendar && (
            <button type="button" aria-label="Add to my calendar" title="Add to my calendar"
              onClick={(e) => { e.stopPropagation(); onAddToCalendar(); }}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32,
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)',
                color: 'var(--text-body)', cursor: 'pointer' }}>
              <i data-lucide="calendar-plus" style={{ width: 16, height: 16 }} />
            </button>
          )}
          {/* stopPropagation below so the button doesn't also trigger the card's
              onOpen — same destination today, but it would fire twice. */}
          {canJoin ? (
            <Button size="sm" variant={joined ? 'secondary' : 'primary'}
              onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); onRsvp && onRsvp(); }}>
              {joined ? 'Going ✓' : "I'm in"}
            </Button>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: 'var(--role-small)', color: 'var(--text-faint)' }}>
              <i data-lucide="lock" style={{ width: 14, height: 14 }} />Invite only
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
