import React from 'react';
import { AmenityTag } from '../display/AmenityTag.jsx';

const memberInitials = (n) => n.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

/** A member photo dot in the card seam; falls back to serif initials if the
 *  photo is missing or fails to load. */
function MemberDot({ m, tone, first }) {
  const [err, setErr] = React.useState(false);
  const show = m.photo && !err;
  return (
    <span title={m.name} style={{
      width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      marginLeft: first ? 0 : -12, boxShadow: '0 0 0 3px var(--surface-card)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: `color-mix(in srgb, ${m.tone || tone} 18%, var(--snow))`, color: m.tone || tone,
      font: 'var(--fw-regular) var(--text-base)/1 var(--font-display)',
    }}>
      {show
        ? <img src={m.photo} alt={m.name} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : memberInitials(m.name)}
    </span>
  );
}

/**
 * Directory card for one family. Photo-forward: a cover banner with the family
 * name and presence, member photos overlapping the seam, and interest tags.
 * Pass `cover` as a fully-resolved image URL. Falls back to a tinted panel.
 */
export function FamilyCard({
  family = {}, cover, onOpen, favorite, onToggleFavorite, style = {},
}) {
  const { name = 'Family', address, members = [], interests = [], presence, tone = 'var(--pine-600)' } = family;
  const [hover, setHover] = React.useState(false);
  const here = presence && presence.here;

  const initials = (n) => n.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', background: 'var(--surface-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: hover ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-3px)' : 'none', cursor: onOpen ? 'pointer' : 'default',
        transition: 'box-shadow var(--dur-base) var(--ease-standard), transform var(--dur-base) var(--ease-standard)',
        ...style,
      }}
    >
      {/* Cover banner */}
      <div style={{ position: 'relative', height: 128, background: `color-mix(in srgb, ${tone} 22%, var(--snow))` }}>
        {cover && (
          <img src={cover} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 45%',
            display: 'block', transform: hover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform var(--dur-slow) var(--ease-out)',
          }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,15,10,.55) 0%, rgba(20,15,10,.08) 45%, rgba(20,15,10,.12) 100%)' }} />

        {/* Presence badge */}
        {presence && (
          <div style={{
            position: 'absolute', top: 'var(--space-3)', left: 'var(--space-3)',
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            borderRadius: 'var(--radius-pill)', backdropFilter: 'blur(6px)',
            background: here ? 'rgba(47,125,79,.9)' : 'rgba(31,33,36,.6)', color: '#fff',
            font: 'var(--fw-semibold) var(--text-2xs)/1 var(--font-sans)', letterSpacing: 'var(--tracking-snug)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: here ? '#8fe0aa' : 'rgba(255,255,255,.7)' }} />
            {presence.label}
          </div>
        )}

        {/* Favorite */}
        {onToggleFavorite && (
          <button type="button" aria-label={favorite ? 'Remove favorite' : 'Add favorite'}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            style={{
              position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)',
              width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(6px)', boxShadow: 'var(--shadow-sm)',
            }}>
            <i data-lucide="star" style={{ width: 16, height: 16, color: favorite ? 'var(--warning)' : 'var(--stone-500)', fill: favorite ? 'var(--warning)' : 'none' }} />
          </button>
        )}
      </div>

      {/* Member photo strip — overlaps the seam */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 var(--space-5)', marginTop: -22, zIndex: 1 }}>
        {members.slice(0, 5).map((m, i) => (
          <MemberDot key={i} m={m} tone={tone} first={i === 0} />
        ))}
        {members.length > 5 && (
          <span style={{
            width: 44, height: 44, borderRadius: '50%', marginLeft: -12, boxShadow: '0 0 0 3px var(--surface-card)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--stone-100)', color: 'var(--text-muted)', font: 'var(--fw-semibold) var(--text-sm)/1 var(--font-sans)',
          }}>+{members.length - 5}</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 'var(--space-3) var(--space-5) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ font: 'var(--fw-regular) var(--text-2xl)/1.1 var(--font-display)', color: 'var(--text-strong)' }}>
            The {name}s
          </div>
          {address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, color: 'var(--text-muted)', font: 'var(--role-small)' }}>
              <i data-lucide="map-pin" style={{ width: 13, height: 13 }} />{address}
            </div>
          )}
        </div>
        {interests.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {interests.map((a) => <AmenityTag key={a} amenity={a} size="sm" />)}
          </div>
        )}
      </div>
    </div>
  );
}
