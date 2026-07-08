import React from 'react';
import { Button, Input } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { heroUrl, LOGO_BADGE } from '../lib/images.js';
import { signInWithEmail } from '../lib/api.js';

function Eyebrow({ children }) {
  return (
    <div style={{ font: 'var(--role-eyebrow)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', color: 'rgba(255,255,255,.8)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>
  );
}

/**
 * Invite-only sign-in. Models both password and magic-link paths (magic link is
 * the production primary — see BACKEND_SPEC). Either path calls onSignIn.
 */
export function Landing({ configured = false, onDemoAuthed }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [mode, setMode] = React.useState(configured ? 'link' : 'password'); // 'password' | 'link'
  useLucide();

  const enterDemo = () => onDemoAuthed && onDemoAuthed();

  const submit = async (e) => {
    e && e.preventDefault();
    setErr('');
    if (configured) {
      // Real magic link — the email arrives; the session gate takes over on return.
      setBusy(true);
      const r = await signInWithEmail(email);
      setBusy(false);
      if (r.ok) setSent(true);
      else setErr(r.error || 'Could not send the link.');
      return;
    }
    if (mode === 'link') setSent(true);
    else enterDemo();
  };

  return (
    <div className="stage">
      <div className="bg" style={{ backgroundColor: 'var(--pine-950)', backgroundImage: `url(${heroUrl('summer')})` }} />
      <div className="scrim" />
      <div className="wrap">
        {/* Left: brand lede */}
        <div className="lede">
          <img src={LOGO_BADGE} alt="Martis Camp" onError={(e) => { e.currentTarget.style.display = 'none'; }}
            style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', marginBottom: 'var(--space-6)' }} />
          <Eyebrow>Members only</Eyebrow>
          <h1 style={{ font: 'var(--fw-regular) var(--text-6xl)/1.02 var(--font-display)', letterSpacing: 'var(--tracking-tight)', margin: '0 0 var(--space-4)' }}>
            See who's up<br />at the Camp.
          </h1>
          <p style={{ font: 'var(--fw-regular) var(--text-xl)/1.5 var(--font-sans)', color: 'rgba(255,255,255,.88)', maxWidth: 440, margin: 0 }}>
            Coordinate weekends with the families you know — who's visiting, what's happening, and the impromptu golf, ski runs, and dinners in between.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-8)', color: 'rgba(255,255,255,.82)', font: 'var(--role-small)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i data-lucide="users" style={{ width: 16, height: 16 }} /> 50 member families</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i data-lucide="calendar" style={{ width: 16, height: 16 }} /> Synced with the community calendar</span>
          </div>
        </div>

        {/* Right: login card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-6)' }}>
            <span style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'var(--logo-brown)', color: 'var(--logo-cream)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: 'var(--fw-regular) var(--text-lg)/1 var(--font-display)' }}>MC</span>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ font: 'var(--fw-regular) var(--text-lg)/1 var(--font-display)', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>Martis Camp</div>
              <div style={{ font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 3 }}>Families</div>
            </div>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <span style={{ display: 'inline-flex', width: 52, height: 52, borderRadius: 'var(--radius-xl)', background: 'var(--success-soft)', color: 'var(--success)', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                <i data-lucide="mail-check" style={{ width: 26, height: 26 }} />
              </span>
              <div style={{ font: 'var(--fw-regular) var(--text-2xl)/1.15 var(--font-display)', color: 'var(--text-strong)' }}>Check your email</div>
              <p style={{ font: 'var(--role-small)', color: 'var(--text-muted)', marginTop: 8 }}>We sent a sign-in link to <b style={{ color: 'var(--text-body)' }}>{email || 'your inbox'}</b>. It's good for 15 minutes.</p>
              {!configured && <Button variant="secondary" block onClick={enterDemo} style={{ marginTop: 'var(--space-4)' }}>Continue to demo →</Button>}
            </div>
          ) : (
            <form onSubmit={submit}>
              <div style={{ font: 'var(--fw-regular) var(--text-2xl)/1.15 var(--font-display)', color: 'var(--text-strong)', marginBottom: 4 }}>Welcome back</div>
              <div style={{ font: 'var(--role-small)', color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Sign in with your member email.</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <Input label="Email" type="email" placeholder="you@family.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  leading={<i data-lucide="mail" style={{ width: 16, height: 16 }} />} />
                {mode === 'password' && (
                  <Input label="Password" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)}
                    leading={<i data-lucide="lock" style={{ width: 16, height: 16 }} />} />
                )}
              </div>

              <Button type="submit" block disabled={busy} style={{ marginTop: 'var(--space-6)' }}>
                {busy ? 'Sending…' : mode === 'password' ? 'Sign in' : 'Email me a sign-in link'}
              </Button>

              {err && <div style={{ color: 'var(--danger)', font: 'var(--role-small)', marginTop: 8, textAlign: 'center' }}>{err}</div>}

              {!configured && (
                <button type="button" onClick={() => setMode(mode === 'password' ? 'link' : 'password')}
                  style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 'var(--space-4)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-link)', font: 'var(--fw-semibold) var(--text-sm) var(--font-sans)' }}>
                  {mode === 'password' ? 'Use a magic link instead' : 'Use a password instead'}
                </button>
              )}
            </form>
          )}

          <div style={{ borderTop: '1px solid var(--divider)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: 'var(--text-xs) var(--font-sans)', color: 'var(--text-muted)' }}>
              <i data-lucide="shield-check" style={{ width: 14, height: 14 }} /> Invite only
            </span>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ font: 'var(--fw-semibold) var(--text-xs) var(--font-sans)', color: 'var(--text-link)', textDecoration: 'none' }}>Request access</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Landing;
