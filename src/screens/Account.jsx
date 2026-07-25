import React from 'react';
import { Card, Avatar, Button, SegmentedControl, Switch } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { PageHead } from './shared.jsx';

function PrefRow({ title, desc, on, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 'var(--space-4) 0', borderBottom: '1px solid var(--divider)' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.2 var(--font-sans)', color: 'var(--text-strong)' }}>{title}</div>
        {desc && <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <Switch checked={on} onChange={onToggle} />
    </div>
  );
}

export function AccountScreen({ me, member, family, onEditProfile, onSignOut }) {
  const [prefs, setPrefs] = React.useState({ gatherings: true, invites: true, arrivals: true, announcements: true, comments: false });
  const [channel, setChannel] = React.useState('whatsapp');
  const set = (k) => (v) => setPrefs((p) => ({ ...p, [k]: v }));
  useLucide();

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <PageHead eyebrow="Settings" title="Your account" />

      {/* Profile & contact */}
      <Card style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <Avatar name={me.name} src={member && member.photo} tone={member && member.tone} size="lg" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ font: 'var(--fw-regular) var(--text-2xl)/1.1 var(--font-display)', color: 'var(--text-strong)' }}>{me.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 6, font: 'var(--role-small)', color: 'var(--text-muted)' }}>
              {member && member.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i data-lucide="phone" style={{ width: 14, height: 14 }} />{member.phone}</span>}
              {member && member.email && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i data-lucide="mail" style={{ width: 14, height: 14 }} />{member.email}</span>}
            </div>
          </div>
          <Button variant="secondary" iconLeft={<i data-lucide="pencil" style={{ width: 15, height: 15 }} />} onClick={onEditProfile}>Edit contact info</Button>
        </div>
      </Card>

      {/* Notification preferences */}
      <Card style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ font: 'var(--role-h3)', color: 'var(--text-strong)', marginBottom: 'var(--space-2)' }}>Notifications</div>
        <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>What lands in your Updates feed and gets you pinged.</div>
        <PrefRow title="New get-togethers" desc="When another family hosts golf, a ski run, or dinner" on={prefs.gatherings} onToggle={set('gatherings')} />
        <PrefRow title="Invites" desc="When you're invited to a private get-together" on={prefs.invites} onToggle={set('invites')} />
        <PrefRow title="Arrivals from favorites" desc="When families or people you favorite are coming up" on={prefs.arrivals} onToggle={set('arrivals')} />
        <PrefRow title="Announcements" desc="Community and admin announcements" on={prefs.announcements} onToggle={set('announcements')} />
        <PrefRow title="Comments" desc="Replies on get-togethers you're part of" on={prefs.comments} onToggle={set('comments')} />
        <div style={{ paddingTop: 'var(--space-4)' }}>
          <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.2 var(--font-sans)', color: 'var(--text-strong)', marginBottom: 8 }}>How should we reach you?</div>
          <SegmentedControl value={channel} onChange={setChannel}
            options={[{ value: 'whatsapp', label: 'WhatsApp', icon: 'message-circle' }, { value: 'push', label: 'Push', icon: 'bell' }, { value: 'email', label: 'Email', icon: 'mail' }]} />
        </div>
      </Card>

      {/* Account */}
      <Card>
        <div style={{ font: 'var(--role-h3)', color: 'var(--text-strong)', marginBottom: 'var(--space-4)' }}>Account</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="secondary" iconLeft={<i data-lucide="users" style={{ width: 15, height: 15 }} />} onClick={onEditProfile}>Manage family</Button>
          <Button variant="ghost" iconLeft={<i data-lucide="log-out" style={{ width: 15, height: 15 }} />} onClick={onSignOut}>Sign out</Button>
        </div>
      </Card>
    </div>
  );
}

export default AccountScreen;
