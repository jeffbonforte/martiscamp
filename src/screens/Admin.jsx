import React from 'react';
import { Card, Button, Input, Select, SegmentedControl, AmenityTag, Badge, EmptyState, AMENITIES } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { PageHead } from './shared.jsx';
import {
  listInvites, createInvite, revokeInvite,
  createFamily, archiveFamily,
  listCommunity, createCommunityEvent, deleteCommunityEvent,
  listAddRequests, resolveAddRequest,
} from '../lib/api.js';

const AMENITY_OPTS = Object.entries(AMENITIES).map(([value, v]) => ({ value, label: v.label }));
const DAY_OPTS = [
  { value: 'thu', label: 'Thu 10' }, { value: 'fri', label: 'Fri 11' }, { value: 'sat', label: 'Sat 12' },
  { value: 'sun', label: 'Sun 13' }, { value: 'mon', label: 'Mon 14' }, { value: 'tue', label: 'Tue 15' }, { value: 'wed', label: 'Wed 16' },
];
const DAY_NUM = { thu: 10, fri: 11, sat: 12, sun: 13, mon: 14, tue: 15, wed: 16 };

const Row = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--space-3) 0', borderBottom: '1px solid var(--divider)' }}>{children}</div>
);

/* ---------- Families ---------- */
function FamiliesTab({ data, onReload, onEditFamily }) {
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const add = async () => { if (!name.trim()) return; setBusy(true); await createFamily(name.trim()); setBusy(false); setName(''); onReload && onReload(); };
  const archive = async (slug) => { await archiveFamily(slug); onReload && onReload(); };
  return (
    <Card>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <div style={{ flex: 1 }}><Input label="Add a family" placeholder="Family surname" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <Button onClick={add} disabled={busy || !name.trim()} iconLeft={<i data-lucide="plus" style={{ width: 15, height: 15 }} />}>Create</Button>
      </div>
      {data.families.map((f) => (
        <Row key={f.id}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.15 var(--font-sans)', color: 'var(--text-strong)' }}>The {f.name}s</div>
            <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>{f.address || '—'} · {f.members.length} members</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onEditFamily(f)} iconLeft={<i data-lucide="pencil" style={{ width: 14, height: 14 }} />}>Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => archive(f.id)} iconLeft={<i data-lucide="archive" style={{ width: 14, height: 14 }} />}>Archive</Button>
        </Row>
      ))}
    </Card>
  );
}

/* ---------- Invites ---------- */
function InvitesTab({ data }) {
  const [rows, setRows] = React.useState(null);
  const [email, setEmail] = React.useState('');
  const [fam, setFam] = React.useState(data.families[0]?.id || '');
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(() => { listInvites().then(setRows); }, []);
  React.useEffect(() => { load(); }, [load]);
  const add = async () => { if (!email.trim()) return; setBusy(true); await createInvite(email.trim(), fam); setBusy(false); setEmail(''); load(); };
  const revoke = async (id) => { await revokeInvite(id); load(); };
  return (
    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <Input label="Invite email" type="email" placeholder="name@family.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Select label="Pre-assign family" options={[{ value: '', label: 'No family' }, ...data.families.map((f) => ({ value: f.id, label: f.name }))]} value={fam} onChange={(e) => setFam(e.target.value)} />
        <Button onClick={add} disabled={busy || !email.trim()} iconLeft={<i data-lucide="send" style={{ width: 15, height: 15 }} />}>Invite</Button>
      </div>
      {rows == null ? <div style={{ font: 'var(--role-small)', color: 'var(--text-faint)' }}>Loading…</div>
        : rows.length === 0 ? <EmptyState glyph="mail" title="No invites yet" description="Invite the first family by email above." />
          : rows.map((r) => (
            <Row key={r.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.15 var(--font-mono)', color: 'var(--text-strong)' }}>{r.email}</div>
                <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>{r.family ? `The ${r.family}s` : 'Unassigned'}</div>
              </div>
              <Badge tone={r.status === 'accepted' ? 'success' : r.status === 'revoked' ? 'danger' : 'warning'}>{r.status}</Badge>
              {r.status === 'pending' && <Button variant="ghost" size="sm" onClick={() => revoke(r.id)}>Revoke</Button>}
            </Row>
          ))}
    </Card>
  );
}

/* ---------- Community calendar ---------- */
function CommunityTab() {
  const [rows, setRows] = React.useState(null);
  const [form, setForm] = React.useState({ title: '', place: '', amenity: 'social', dayKey: 'fri' });
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(() => { listCommunity().then(setRows); }, []);
  React.useEffect(() => { load(); }, [load]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const add = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    await createCommunityEvent({ title: form.title.trim(), place: form.place, amenity: form.amenity, dayKey: form.dayKey, dayOfMonth: DAY_NUM[form.dayKey] });
    setBusy(false); setForm({ title: '', place: '', amenity: 'social', dayKey: 'fri' }); load();
  };
  const del = async (id) => { await deleteCommunityEvent(id); load(); };
  return (
    <Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 'var(--space-3)' }}>
        <Input label="Event" placeholder="Live music at the Barn" value={form.title} onChange={(e) => set('title', e.target.value)} />
        <Input label="Place" placeholder="The Family Barn" value={form.place} onChange={(e) => set('place', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <Select label="Activity" options={AMENITY_OPTS} value={form.amenity} onChange={(e) => set('amenity', e.target.value)} />
        <Select label="Day" options={DAY_OPTS} value={form.dayKey} onChange={(e) => set('dayKey', e.target.value)} />
        <Button onClick={add} disabled={busy || !form.title.trim()} iconLeft={<i data-lucide="plus" style={{ width: 15, height: 15 }} />}>Add</Button>
      </div>
      {rows == null ? <div style={{ font: 'var(--role-small)', color: 'var(--text-faint)' }}>Loading…</div>
        : rows.length === 0 ? <EmptyState glyph="calendar" title="No community events" description="Add the first official event above." />
          : rows.map((r) => (
            <Row key={r.id}>
              {r.amenity && <AmenityTag amenity={r.amenity} size="sm" />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.15 var(--font-sans)', color: 'var(--text-strong)' }}>{r.title}</div>
                <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>{r.place} · Jul {r.day_of_month}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => del(r.id)} iconLeft={<i data-lucide="trash-2" style={{ width: 14, height: 14 }} />}>Delete</Button>
            </Row>
          ))}
    </Card>
  );
}

/* ---------- Requests ---------- */
function RequestsTab() {
  const [rows, setRows] = React.useState(null);
  const [showResolved, setShowResolved] = React.useState(false);
  const load = React.useCallback(() => { listAddRequests().then(setRows); }, []);
  React.useEffect(() => { load(); }, [load]);
  const resolve = async (id, status) => { await resolveAddRequest(id, status); load(); };
  useLucide();

  const all = rows || [];
  const open = all.filter((r) => r.status === 'open');
  const shown = showResolved ? all : open;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 'var(--space-4)' }}>
        <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>{open.length} open request{open.length === 1 ? '' : 's'}</div>
        <Button variant="ghost" size="sm" onClick={() => setShowResolved((s) => !s)}>{showResolved ? 'Show open only' : 'Show all'}</Button>
      </div>
      {rows == null ? <div style={{ font: 'var(--role-small)', color: 'var(--text-faint)' }}>Loading…</div>
        : shown.length === 0 ? <EmptyState glyph="user-plus" title="No requests" description="Members can request additions from the directory." />
          : shown.map((r) => (
            <Row key={r.id}>
              <Badge tone={r.kind === 'family' ? 'brand' : 'neutral'}>{r.kind}</Badge>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.2 var(--font-sans)', color: 'var(--text-strong)' }}>{r.name}</div>
                <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>
                  {r.email ? <span style={{ fontFamily: 'var(--font-mono)' }}>{r.email}</span> : 'no email'}
                  {r.requestedByName ? ` · by ${r.requestedByName}` : ''}
                </div>
                {r.note && <div style={{ font: 'var(--role-small)', color: 'var(--text-body)', marginTop: 2 }}>“{r.note}”</div>}
              </div>
              {r.status === 'open' ? (
                <>
                  <Button variant="secondary" size="sm" onClick={() => resolve(r.id, 'done')} iconLeft={<i data-lucide="check" style={{ width: 14, height: 14 }} />}>Mark added</Button>
                  <Button variant="ghost" size="sm" onClick={() => resolve(r.id, 'dismissed')}>Dismiss</Button>
                </>
              ) : (
                <Badge tone={r.status === 'done' ? 'success' : 'neutral'}>{r.status === 'done' ? 'added' : 'dismissed'}</Badge>
              )}
            </Row>
          ))}
    </Card>
  );
}

export function AdminScreen({ data, onReload, onEditFamily }) {
  const [tab, setTab] = React.useState('families');
  useLucide();
  return (
    <div>
      <PageHead eyebrow="Admin" title="Community admin" sub="Manage families, invites, and the community calendar." />
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <SegmentedControl value={tab} onChange={setTab}
          options={[
            { value: 'families', label: 'Families', icon: 'users' },
            { value: 'invites', label: 'Invites', icon: 'mail' },
            { value: 'requests', label: 'Requests', icon: 'user-plus' },
            { value: 'community', label: 'Community', icon: 'calendar' },
          ]} />
      </div>
      {tab === 'families' && <FamiliesTab data={data} onReload={onReload} onEditFamily={onEditFamily} />}
      {tab === 'invites' && <InvitesTab data={data} />}
      {tab === 'requests' && <RequestsTab />}
      {tab === 'community' && <CommunityTab />}
    </div>
  );
}

export default AdminScreen;
