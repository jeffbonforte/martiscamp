import React from 'react';
import { Dialog, Button, Input } from '../../components/index.js';
import { useLucide } from '../../lib/useLucide.js';
import { createMember } from '../../lib/api.js';

/**
 * Add a person to a family. Self-serve for the family account-holder (or admin).
 * A member added with an email is auto-approved onto the sign-in allowlist.
 */
export function AddMemberDialog({ family, open, onClose, onCreated }) {
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  useLucide();

  React.useEffect(() => {
    if (open) { setName(''); setRole(''); setEmail(''); setPhone(''); setBusy(false); setErr(''); }
  }, [open]);

  if (!open || !family) return null;

  const save = async () => {
    setBusy(true); setErr('');
    const r = await createMember(family.id, { name, role, email, phone });
    setBusy(false);
    if (r.ok || r.offline) { onCreated && onCreated(); onClose(); }
    else setErr(r.error || 'Could not add this member.');
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Add to the ${family.name}s`} width={480}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy || !name.trim()}>{busy ? 'Adding…' : 'Add member'}</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" />
          <Input label="Role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Parent · Kid · 14" />
        </div>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@family.com"
          hint="If added, they can sign in — no separate invite needed" leading={<i data-lucide="mail" style={{ width: 15, height: 15 }} />} />
        <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} leading={<i data-lucide="phone" style={{ width: 15, height: 15 }} />} />
        {err && <div style={{ font: 'var(--role-small)', color: 'var(--danger)' }}>{err}</div>}
      </div>
    </Dialog>
  );
}

export default AddMemberDialog;
