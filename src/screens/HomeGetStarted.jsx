import React from 'react';
import { Card, Button } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { RequestAddDialog } from './dialogs/RequestAddDialog.jsx';

const FAV_GOAL = 5;

/**
 * First-run onboarding + growth panel on the home page. Nudges a new family to
 * finish their profile, favorite the families they know (the network effect that
 * makes the app useful), and invite other families. Dismissible; auto-hides once
 * setup is done and they've favorited enough families.
 */
export function HomeGetStarted({ family, favCount = 0, onEditFamily, onAddMember, onGoCalendar, onGoDirectory }) {
  const [dismissed, setDismissed] = React.useState(() => localStorage.getItem('mcf_home_onboard_dismissed') === '1');
  const [inviteOpen, setInviteOpen] = React.useState(false);
  useLucide();

  const steps = [
    { key: 'photo', label: 'Add a family photo', done: !!family?.cover, onClick: onEditFamily },
    { key: 'household', label: 'Add your household', done: (family?.members?.length || 0) > 1, onClick: onAddMember },
    { key: 'days', label: "Mark the days you'll be up", done: (family?.presence?.days?.length || 0) > 0, onClick: onGoCalendar },
  ];
  const allSetup = steps.every((s) => s.done);
  const enoughFavs = favCount >= FAV_GOAL;

  if (dismissed || (allSetup && enoughFavs)) return null;

  const dismiss = () => { localStorage.setItem('mcf_home_onboard_dismissed', '1'); setDismissed(true); };

  return (
    <>
      <Card style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5) var(--space-6)', border: '1px solid var(--brand-soft)', background: 'linear-gradient(180deg, var(--brand-soft), var(--surface-card) 60%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ font: 'var(--fw-regular) var(--text-2xl)/1.1 var(--font-display)', color: 'var(--text-strong)' }}>Welcome, the {family?.name || 'family'}s 👋</div>
            <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)', marginTop: 4 }}>A few quick things to get the most out of Martis Camp Families.</div>
          </div>
          <button type="button" onClick={dismiss} aria-label="Dismiss" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <i data-lucide="x" style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {!allSetup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'var(--space-4)' }}>
            {steps.map((s) => (
              <button key={s.key} type="button" onClick={s.done ? undefined : s.onClick}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-card)', cursor: s.done ? 'default' : 'pointer', textAlign: 'left' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: s.done ? 'var(--success)' : 'var(--surface-sunk)', color: s.done ? '#fff' : 'var(--text-faint)', border: s.done ? 'none' : '1px solid var(--border-strong)' }}>
                  <i data-lucide={s.done ? 'check' : 'circle'} style={{ width: 13, height: 13 }} />
                </span>
                <span style={{ flex: 1, font: `var(--fw-semibold) var(--text-sm)/1.2 var(--font-sans)`, color: s.done ? 'var(--text-muted)' : 'var(--text-strong)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</span>
                {!s.done && <i data-lucide="chevron-right" style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />}
              </button>
            ))}
          </div>
        )}

        {/* Growth: favorite + invite */}
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i data-lucide="star" style={{ width: 18, height: 18, color: 'var(--warning)', fill: enoughFavs ? 'var(--warning)' : 'none' }} />
            <div>
              <div style={{ font: 'var(--fw-semibold) var(--text-sm)/1.2 var(--font-sans)', color: 'var(--text-strong)' }}>
                {enoughFavs ? 'Nicely connected!' : `Favorite ${FAV_GOAL - favCount} more famil${FAV_GOAL - favCount === 1 ? 'y' : 'ies'} you know`}
              </div>
              <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>Favorites float to the top and show you when they're up. ({favCount}/{FAV_GOAL})</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={onGoDirectory} iconLeft={<i data-lucide="search" style={{ width: 15, height: 15 }} />}>Find families</Button>
            <Button size="sm" onClick={() => setInviteOpen(true)} iconLeft={<i data-lucide="user-plus" style={{ width: 15, height: 15 }} />}>Invite another family</Button>
          </div>
        </div>
      </Card>

      <RequestAddDialog open={inviteOpen} initialKind="family" onClose={() => setInviteOpen(false)} />
    </>
  );
}

export default HomeGetStarted;
