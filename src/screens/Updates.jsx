import React from 'react';
import { Button } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { PageHead, feedGlyph, openWhatsApp } from './shared.jsx';

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

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {data.feed.map((it, i) => (
          <button key={it.id} type="button" onClick={() => goto(it)}
            style={{ display: 'flex', gap: 14, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
              padding: 'var(--space-4) var(--space-5)', borderBottom: i < data.feed.length - 1 ? '1px solid var(--divider)' : 'none', background: it.unread ? 'var(--pine-50)' : 'transparent' }}>
            <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${it.tone} 16%, var(--snow))`, color: it.tone }}>
              <i data-lucide={feedGlyph(it.kind)} style={{ width: 17, height: 17 }} />
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ font: 'var(--role-body)', color: 'var(--text-body)' }}><b style={{ color: 'var(--text-strong)', fontWeight: 'var(--fw-semibold)' }}>{it.who}</b> {it.text}</span>
              <span style={{ display: 'block', font: 'var(--text-2xs) var(--font-mono)', color: 'var(--text-faint)', marginTop: 4 }}>{it.when}</span>
            </span>
            {it.unread && <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', marginTop: 8 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default UpdatesScreen;
