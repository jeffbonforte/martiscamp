import React from 'react';
import { Dialog, Button, AmenityTag } from '../../components/index.js';
import { useLucide } from '../../lib/useLucide.js';
import { downloadICS, googleCalUrl, outlookUrl } from '../../lib/calendar.js';

/** Add-to-calendar sheet. Wired to real ICS download + Google/Outlook links. */
export function AddToCalendarDialog({ event, onClose }) {
  useLucide();
  if (!event) return null;

  const actions = [
    { label: 'Apple Calendar (.ics)', icon: 'calendar', run: () => downloadICS(event) },
    { label: 'Google Calendar', icon: 'calendar', run: () => window.open(googleCalUrl(event), '_blank', 'noopener') },
    { label: 'Outlook', icon: 'calendar', run: () => window.open(outlookUrl(event), '_blank', 'noopener') },
    { label: 'Download .ics file', icon: 'download', run: () => downloadICS(event) },
  ];

  return (
    <Dialog open={!!event} onClose={onClose} title="Add to my calendar" width={420}
      footer={<Button variant="ghost" onClick={onClose}>Done</Button>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <AmenityTag amenity={event.amenity} size="sm" />
          <div>
            <div style={{ font: 'var(--fw-regular) var(--text-lg)/1.15 var(--font-display)', color: 'var(--text-strong)' }}>{event.title}</div>
            <div style={{ font: 'var(--text-xs) var(--font-mono)', color: 'var(--text-muted)' }}>{event.when} · {event.where}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actions.map((a) => (
            <button key={a.label} type="button" onClick={() => { a.run(); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: 'pointer', font: 'var(--fw-semibold) var(--text-sm) var(--font-sans)', color: 'var(--text-strong)', textAlign: 'left' }}>
              <i data-lucide={a.icon} style={{ width: 17, height: 17, color: 'var(--text-muted)' }} />{a.label}
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  );
}

export default AddToCalendarDialog;
