import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './app.css';
import { Landing } from './screens/Landing.jsx';
import { App } from './App.jsx';
import { isSupabaseConfigured } from './lib/supabase.js';
import { getSession, onAuthChange, signOut as sbSignOut } from './lib/api.js';
import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics
inject();

// The design system hydrates icons by having Lucide replace each <i data-lucide>
// with an <svg> (see lib/useLucide.js). That detaches a node React still holds a
// reference to, so when React later unmounts a conditionally-rendered icon it can
// call removeChild on a node that's no longer its child and throw NotFoundError.
// This is the well-known React + third-party-DOM-mutation shim: no-op the DOM
// mutation when the node isn't actually a child. (Longer term, swap to
// lucide-react components so React owns the SVG nodes.)
if (typeof Node === 'function' && Node.prototype) {
  const origRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function removeChild(child) {
    if (child.parentNode !== this) return child;
    return origRemoveChild.apply(this, arguments);
  };
  const origInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function insertBefore(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return origInsertBefore.apply(this, arguments);
  };
}

/**
 * Top-level auth gate.
 *  - Supabase configured → real magic-link auth; `authed` follows the session.
 *  - Otherwise → the demo gate (localStorage), mirroring the prototype's
 *    landing.html → index.html flow.
 */
function Root() {
  const configured = isSupabaseConfigured;
  const [session, setSession] = React.useState(null);
  const [ready, setReady] = React.useState(!configured);
  const [demoAuthed, setDemoAuthed] = React.useState(() => localStorage.getItem('mcf_authed') === '1');

  React.useEffect(() => {
    if (!configured) return undefined;
    let alive = true;
    getSession().then((s) => { if (alive) { setSession(s); setReady(true); } });
    const off = onAuthChange((s) => setSession(s));
    return () => { alive = false; off(); };
  }, [configured]);

  if (!ready) return null; // brief splash while the session resolves

  const authed = configured ? !!session : demoAuthed;
  const handleSignOut = configured
    ? () => sbSignOut()
    : () => { localStorage.removeItem('mcf_authed'); setDemoAuthed(false); };
  const onDemoAuthed = () => { localStorage.setItem('mcf_authed', '1'); setDemoAuthed(true); };

  return authed
    ? <App onSignOut={handleSignOut} />
    : <Landing configured={configured} onDemoAuthed={onDemoAuthed} />;
}

createRoot(document.getElementById('root')).render(<Root />);
