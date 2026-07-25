import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog } from '../feedback/Dialog.jsx';
import { Button } from '../forms/Button.jsx';

/**
 * Modal with a scannable QR that opens a WhatsApp chat with the Martis
 * assistant (encodes the wa.me deep link). `href` is the wa.me URL; `number` /
 * `vanity` are shown as the caption. Also offers "Open WhatsApp" for phones.
 */
export function WhatsAppQR({ open, onClose, href, number, vanity }) {
  return (
    <Dialog open={open} onClose={onClose} title="Chat with Martis on WhatsApp"
      footer={(
        <Button onClick={() => window.open(href, '_blank', 'noopener')}
          style={{ background: '#1FA855', border: '1px solid #1FA855', color: '#fff' }}
          iconLeft={<i data-lucide="message-circle" style={{ width: 16, height: 16 }} />}>Open WhatsApp</Button>
      )}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-2) 0' }}>
        <div style={{ padding: 16, background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', lineHeight: 0 }}>
          <QRCodeSVG value={href} size={208} level="M" bgColor="#ffffff" fgColor="#141f17" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--role-body)', color: 'var(--text-strong)' }}>Scan with your phone's camera to start a chat</div>
          <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{vanity} · {number}</div>
          <div style={{ font: 'var(--text-xs)/1.5 var(--font-sans)', color: 'var(--text-faint)', marginTop: 8, maxWidth: 320 }}>
            Ask who's up this weekend, when your favorites are visiting, and more. Text from the mobile number that's on your profile.
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export default WhatsAppQR;
