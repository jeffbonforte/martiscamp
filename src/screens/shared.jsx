import React from 'react';
import { Button } from '../components/index.js';

// WhatsApp deep-link target (group invite link in production; a wa.me link here).
export const WHATSAPP_GROUP_URL = 'https://wa.me/';
export function openWhatsApp(url = WHATSAPP_GROUP_URL) {
  window.open(url, '_blank', 'noopener');
}

// The Martis Camp WhatsApp assistant — text this number to ask who's up, when
// favorites are visiting, etc. (see api/whatsapp.js). 2·MARTIS = 262·7847.
export const WA_ASSISTANT = {
  e164: '17752627847',
  display: '+1 (775) 262-7847',
  vanity: '+1 775 2·MARTIS',
  href: `https://wa.me/17752627847?text=${encodeURIComponent("Hi Martis — who's up this weekend?")}`,
};

/** Section header used at the top of most screens. */
export function PageHead({ eyebrow, title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
      <div>
        {eyebrow && <div style={{ font: 'var(--role-eyebrow)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{eyebrow}</div>}
        <div style={{ font: 'var(--fw-regular) var(--text-4xl)/1.05 var(--font-display)', color: 'var(--text-strong)', letterSpacing: 'var(--tracking-tight)' }}>{title}</div>
        {sub && <div style={{ font: 'var(--role-body)', color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/** Small weather chip for a day. */
export function WeatherPill({ wx, size = 'md' }) {
  if (!wx) return null;
  const big = size === 'lg';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <i data-lucide={wx.icon} style={{ width: big ? 22 : 16, height: big ? 22 : 16, color: 'var(--cedar-600)' }} />
      <span style={{ font: `var(--fw-semibold) ${big ? 'var(--text-lg)' : 'var(--text-sm)'}/1 var(--font-sans)`, color: 'var(--text-strong)' }}>{wx.hi}°</span>
      <span style={{ font: `${big ? 'var(--text-base)' : 'var(--text-xs)'}/1 var(--font-sans)`, color: 'var(--text-faint)' }}>{wx.lo}°</span>
    </span>
  );
}

/** Snow report banner (winter). */
export function SnowReport({ report }) {
  const stat = (n, l) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ font: 'var(--fw-regular) var(--text-2xl)/1 var(--font-display)', color: '#fff' }}>{n}</div>
      <div style={{ font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'rgba(255,255,255,.7)', marginTop: 4 }}>{l}</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', flexWrap: 'wrap',
      background: 'linear-gradient(120deg, var(--lake-800), var(--lake-600))', color: '#fff',
      borderRadius: 'var(--radius-lg)', padding: 'var(--space-5) var(--space-6)', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 'auto' }}>
        <i data-lucide="snowflake" style={{ width: 28, height: 28 }} />
        <div>
          <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1 var(--font-sans)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', opacity: .8 }}>Snow report</div>
          <div style={{ font: 'var(--fw-regular) var(--text-2xl)/1.1 var(--font-display)' }}>{report.condition}</div>
        </div>
      </div>
      {stat(`${report.newInches}"`, 'New (24h)')}
      {stat(`${report.baseInches}"`, 'Base')}
      {stat(report.seasonTotal, 'Season')}
      {stat(report.lifts, 'Lifts')}
      {stat(report.trails, 'Trails')}
      <span style={{ font: 'var(--text-2xs) var(--font-mono)', opacity: .55 }}>via resort feed</span>
    </div>
  );
}

/** Prominent WhatsApp button (the community's default comms channel). */
export function WhatsButton({ label = 'Message on WhatsApp', size = 'md', block = false, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <Button onClick={onClick || (() => openWhatsApp())} block={block} size={size}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? '#1a8f49' : '#1FA855', border: '1px solid #1FA855', color: '#fff' }}
      iconLeft={<i data-lucide="message-circle" style={{ width: size === 'sm' ? 15 : 17, height: size === 'sm' ? 15 : 17 }} />}>{label}</Button>
  );
}

export function feedGlyph(kind) {
  return { announcement: 'megaphone', invite: 'lock', arrival: 'map-pin', gathering: 'party-popper', community: 'megaphone', rsvp: 'check', comment: 'message-circle' }[kind] || 'bell';
}

/** Pill-chip style used by the family/member schedule switcher. */
export function chipStyle(active) {
  return {
    padding: '6px 12px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
    border: `1px solid ${active ? 'var(--brand)' : 'var(--border-strong)'}`,
    background: active ? 'var(--brand)' : 'var(--surface-card)',
    color: active ? 'var(--text-on-brand)' : 'var(--text-body)',
    font: 'var(--fw-semibold) var(--text-xs)/1 var(--font-sans)',
  };
}
