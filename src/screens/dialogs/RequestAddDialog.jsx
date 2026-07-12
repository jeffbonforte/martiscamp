import React from 'react';
import { Dialog, Button, Input, Textarea, SegmentedControl } from '../../components/index.js';
import { useLucide } from '../../lib/useLucide.js';
import { submitAddRequest } from '../../lib/api.js';

/**
 * Any signed-in member can request that the admin add a person or a whole family
 * (with an email). It lands in the Admin → Requests queue.
 */
export function RequestAddDialog({ open, initialKind = 'person', onClose }) {
  const [kind, setKind] = React.useState(initialKind);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState('');
  useLucide();

  React.useEffect(() => {
    if (open) { setKind(initialKind); setName(''); setEmail(''); setNote(''); setBusy(false); setDone(false); setErr(''); }
  }, [open, initialKind]);

  const submit = async () => {
    setBusy(true); setErr('');
    const r = await submitAddRequest({ kind, name, email, note });
    setBusy(false);
    if (r.ok || r.offline) setDone(true);
    else setErr(r.error || 'Could not submit the request.');
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} title="Request to add someone" width={480}
      footer={done
        ? <Button onClick={onClose}>Done</Button>
        : <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={busy || !name.trim()}>{busy ? 'Sending…' : 'Send request'}</Button></>}>
      {done ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 'var(--space-4) 0', textAlign: 'center' }}>
          <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success-soft)', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><i data-lucide="check" style={{ width: 24, height: 24 }} /></span>
          <div style={{ font: 'var(--role-h3)', color: 'var(--text-strong)' }}>Request sent</div>
          <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>An admin will review it and add them to the community.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ font: 'var(--fw-medium) var(--text-sm)/1.3 var(--font-sans)', color: 'var(--text-strong)', marginBottom: 6 }}>What should we add?</div>
            <SegmentedControl value={kind} onChange={setKind} options={[{ value: 'person', label: 'A person' }, { value: 'family', label: 'A family' }]} />
          </div>
          <Input label={kind === 'family' ? 'Family name' : 'Name'} value={name} onChange={(e) => setName(e.target.value)}
            placeholder={kind === 'family' ? 'e.g. Ronaghi' : 'First and last name'} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@family.com"
            hint="So the admin can send them an invite" leading={<i data-lucide="mail" style={{ width: 15, height: 15 }} />} />
          <Textarea label="Anything else? (optional)" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="How you know them, which family they belong to, etc." rows={3} />
          {err && <div style={{ font: 'var(--role-small)', color: 'var(--danger)' }}>{err}</div>}
        </div>
      )}
    </Dialog>
  );
}

export default RequestAddDialog;
