import React from 'react';
import { Avatar } from '../display/Avatar.jsx';
import { useLucide } from '../../lib/useLucide.js';

/**
 * ActivityFeed — coordination signals, not a social feed (DS v1.1). Discussions
 * belong in WhatsApp; this surfaces who joined your gathering, whose visit
 * overlaps yours. items: [{ id, avatar?, actor, text, when, unread? }]
 */
export function ActivityFeed({ items = [], whatsappHref, style = {} }) {
  useLucide();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', ...style }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {items.map((n) => (
          <div key={n.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
            <Avatar name={n.actor} src={n.avatar} tone={n.tone} size="sm" />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ font: 'var(--fw-regular) var(--text-sm)/1.5 var(--font-sans)', color: 'var(--text-body)' }}>
                <span style={{ font: 'var(--fw-semibold) var(--text-sm)/1.5 var(--font-sans)', color: 'var(--text-strong)' }}>{n.actor}</span> {n.text}
              </div>
              <div style={{ font: 'var(--fw-regular) var(--text-2xs)/1 var(--font-mono)', color: 'var(--text-faint)' }}>{n.when}</div>
            </div>
            {n.unread ? (
              <span aria-label="Unread" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, marginTop: 6 }} />
            ) : null}
          </div>
        ))}
      </div>
      {whatsappHref ? (
        <a href={whatsappHref} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
          font: 'var(--fw-semibold) var(--text-sm)/1 var(--font-sans)', color: 'var(--text-link)', textDecoration: 'none',
        }}>
          <i data-lucide="message-circle" style={{ width: 16, height: 16 }} />
          Keep the chatter going in WhatsApp →
        </a>
      ) : null}
    </div>
  );
}

export default ActivityFeed;
