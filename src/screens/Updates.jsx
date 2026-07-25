import React from 'react';
import { Button, ActivityFeed } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { PageHead, openWhatsApp } from './shared.jsx';

/** The Updates feed — activity from your favorites + community notices. */
export function UpdatesScreen({ data, onOpenEvent, onOpenFamily, onPost }) {
  useLucide();
  const goto = (it) => {
    if (it.eventId) { const ev = data.gatherings.find((g) => g.id === it.eventId); if (ev) return onOpenEvent(ev); }
    if (it.familyId) { const f = data.families.find((x) => x.id === it.familyId); if (f) return onOpenFamily(f); }
  };
  return (
    <div>
      <PageHead eyebrow="From your favorites & the community" title="Updates"
        sub="Everything happening with the families and people you follow."
        right={<Button variant="secondary" iconLeft={<i data-lucide="megaphone" style={{ width: 16, height: 16 }} />} onClick={onPost}>Post an announcement</Button>} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        background: 'linear-gradient(120deg, #157a3d, #1FA855)', color: '#fff', borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5) var(--space-6)', marginBottom: 'var(--space-6)', boxShadow: 'var(--shadow-md)' }}>
        <i data-lucide="message-circle" style={{ width: 28, height: 28 }} />
        <div style={{ marginRight: 'auto' }}>
          <div style={{ font: 'var(--fw-regular) var(--text-xl)/1.1 var(--font-display)' }}>The conversation lives in WhatsApp</div>
          <div style={{ font: 'var(--role-small)', color: 'rgba(255,255,255,.9)', marginTop: 2 }}>Quick updates land here — the running chatter stays in the group.</div>
        </div>
        <Button onClick={() => openWhatsApp()} style={{ background: '#fff', color: '#157a3d', border: '1px solid #fff' }} iconLeft={<i data-lucide="external-link" style={{ width: 15, height: 15 }} />}>Open WhatsApp group</Button>
      </div>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5) var(--space-6)' }}>
        <ActivityFeed
          items={data.feed.map((it) => ({ id: it.id, actor: it.who, text: it.text, when: it.when, unread: it.unread, tone: it.tone, avatar: it.photo }))}
          onItemClick={(n) => goto(data.feed.find((it) => it.id === n.id) || n)} />
      </div>
    </div>
  );
}

export default UpdatesScreen;
