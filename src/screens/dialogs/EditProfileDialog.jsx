import React from 'react';
import { Dialog, Button, Input, Select, Avatar, AMENITIES } from '../../components/index.js';
import { useLucide } from '../../lib/useLucide.js';
import { persistFamilyEdit, persistMemberEdit, uploadPhoto } from '../../lib/api.js';
import { coverUrl } from '../../lib/images.js';
import { ChipMulti } from './common.jsx';

const AMENITY_KEYS = Object.keys(AMENITIES);
const COVER_OPTIONS = ['family/bonfortes.jpg', 'lodge.jpg', 'ski-lodge.jpg', 'family-barn.jpg', 'treehouse-park.jpg', 'golf-summer.jpg', 'camp-lodge-winter-aerial.jpg'];

/**
 * Edit a family or a member. Matches the prototype: writes back onto the data
 * object in place and calls onSaved() to re-render (mock persistence). In
 * production this posts to the members/families tables.
 */
export function EditProfileDialog({ target, weekendDays, onClose, onSaved, onReload }) {
  const isFam = target && target.type === 'family';
  const obj = target ? (isFam ? target.family : target.member) : null;
  const originalName = obj?.name;
  const [form, setForm] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  useLucide();

  React.useEffect(() => {
    if (obj) setForm({ ...obj, interests: [...(obj.interests || [])], days: [...(obj.days || [])] });
    setBusy(false); setUploading(false);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!target || !form) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k, val) => setForm((f) => ({ ...f, [k]: f[k].includes(val) ? f[k].filter((x) => x !== val) : [...f[k], val] }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const r = await uploadPhoto(isFam ? 'cover' : 'member', file);
    setUploading(false);
    if (r.ok) set(isFam ? 'cover' : 'photo', r.url);
    else set(isFam ? 'cover' : 'photo', URL.createObjectURL(file)); // mock/offline: local preview
  };

  const save = async () => {
    setBusy(true);
    if (isFam) {
      await persistFamilyEdit(obj.id, { name: form.name, address: form.address, hometown: form.hometown, cover: form.cover, interests: form.interests });
    } else {
      await persistMemberEdit(originalName, { name: form.name, role: form.role, phone: form.phone, email: form.email, interests: form.interests, days: form.days, photo: form.photo });
    }
    Object.assign(obj, form); // optimistic local update
    if (isFam) obj.presence = { ...obj.presence };
    setBusy(false);
    onSaved && onSaved();
    onClose();
    onReload && onReload();
  };

  const uploadBtnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', cursor: 'pointer',
    border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--surface-card)',
    font: 'var(--fw-semibold) var(--text-sm)/1 var(--font-sans)', color: 'var(--text-strong)',
  };

  return (
    <Dialog open={!!target} onClose={onClose} title={isFam ? 'Edit family' : 'Edit profile'} width={520}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy || uploading}>{busy ? 'Saving…' : 'Save changes'}</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isFam ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Family name" value={form.name} onChange={(e) => set('name', e.target.value)} hint="Shown as “The ‹name›s”" />
              <Select label="Cover photo" options={COVER_OPTIONS.map((c) => ({ value: c, label: c.split('/').pop().replace(/\.[a-z]+$/, '').replace(/-/g, ' ') }))} value={form.cover} onChange={(e) => set('cover', e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 96, height: 56, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: `color-mix(in srgb, ${form.tone || 'var(--pine-600)'} 22%, var(--snow))`, flexShrink: 0 }}>
                <img src={coverUrl(form.cover)} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <label style={uploadBtnStyle}>
                <i data-lucide="upload" style={{ width: 14, height: 14 }} /> {uploading ? 'Uploading…' : 'Upload a cover'}
                <input type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Street address" value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="One line is plenty" />
              <Input label="Hometown" value={form.hometown || ''} onChange={(e) => set('hometown', e.target.value)} placeholder="City, State" leading={<i data-lucide="home" style={{ width: 15, height: 15 }} />} />
            </div>
            <ChipMulti label="Interests" options={AMENITY_KEYS} value={form.interests} onToggle={(v) => toggle('interests', v)} labelOf={(k) => AMENITIES[k].label} />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={form.name} src={form.photo} tone={form.tone} size="lg" />
              <label style={uploadBtnStyle}>
                <i data-lucide="upload" style={{ width: 14, height: 14 }} /> {uploading ? 'Uploading…' : 'Change photo'}
                <input type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <Input label="Role" value={form.role || ''} onChange={(e) => set('role', e.target.value)} placeholder="Parent · Kid · 14" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} leading={<i data-lucide="phone" style={{ width: 15, height: 15 }} />} />
              <Input label="Email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} leading={<i data-lucide="mail" style={{ width: 15, height: 15 }} />} />
            </div>
            <ChipMulti label="Interests" options={AMENITY_KEYS} value={form.interests} onToggle={(v) => toggle('interests', v)} labelOf={(k) => AMENITIES[k].label} />
            <ChipMulti label="Up this weekend" options={weekendDays.map((d) => d.key)} value={form.days} onToggle={(v) => toggle('days', v)} labelOf={(k) => weekendDays.find((d) => d.key === k).label} />
          </>
        )}
      </div>
    </Dialog>
  );
}

export default EditProfileDialog;
