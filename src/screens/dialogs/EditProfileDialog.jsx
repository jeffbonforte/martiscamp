import React from 'react';
import { Dialog, Button, Input, Select, AMENITIES } from '../../components/index.js';
import { useLucide } from '../../lib/useLucide.js';
import { ChipMulti } from './common.jsx';

const AMENITY_KEYS = Object.keys(AMENITIES);
const COVER_OPTIONS = ['family/bonfortes.jpg', 'lodge.jpg', 'ski-lodge.jpg', 'family-barn.jpg', 'treehouse-park.jpg', 'golf-summer.jpg', 'camp-lodge-winter-aerial.jpg'];

/**
 * Edit a family or a member. Matches the prototype: writes back onto the data
 * object in place and calls onSaved() to re-render (mock persistence). In
 * production this posts to the members/families tables.
 */
export function EditProfileDialog({ target, weekendDays, onClose, onSaved }) {
  const isFam = target && target.type === 'family';
  const obj = target ? (isFam ? target.family : target.member) : null;
  const [form, setForm] = React.useState(null);
  useLucide();

  React.useEffect(() => {
    if (obj) setForm({ ...obj, interests: [...(obj.interests || [])], days: [...(obj.days || [])] });
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!target || !form) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k, val) => setForm((f) => ({ ...f, [k]: f[k].includes(val) ? f[k].filter((x) => x !== val) : [...f[k], val] }));
  const save = () => { Object.assign(obj, form); if (isFam) obj.presence = { ...obj.presence }; onSaved(); onClose(); };

  return (
    <Dialog open={!!target} onClose={onClose} title={isFam ? 'Edit family' : 'Edit profile'} width={520}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>Save changes</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isFam ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Family name" value={form.name} onChange={(e) => set('name', e.target.value)} hint="Shown as “The ‹name›s”" />
              <Select label="Cover photo" options={COVER_OPTIONS.map((c) => ({ value: c, label: c.split('/').pop().replace(/\.[a-z]+$/, '').replace(/-/g, ' ') }))} value={form.cover} onChange={(e) => set('cover', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Street address" value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="One line is plenty" />
              <Input label="Hometown" value={form.hometown || ''} onChange={(e) => set('hometown', e.target.value)} placeholder="City, State" leading={<i data-lucide="home" style={{ width: 15, height: 15 }} />} />
            </div>
            <ChipMulti label="Interests" options={AMENITY_KEYS} value={form.interests} onToggle={(v) => toggle('interests', v)} labelOf={(k) => AMENITIES[k].label} />
          </>
        ) : (
          <>
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
