// Server-side Supabase access for the WhatsApp agent. Uses the SERVICE ROLE key
// (bypasses RLS) — so every query here must be scoped to what a *member* is
// allowed to see. The webhook only reaches this after confirming the sender is a
// registered member; beyond that, Martis presence is visible to all members, and
// the one real boundary is invite-only get-togethers (filtered per member).

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const db = url && serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;
export const dbConfigured = !!db;

const digitsOnly = (s) => String(s || '').replace(/\D/g, '');
const last10 = (s) => digitsOnly(s).slice(-10);

/** Stable per-person conversation key (last 10 digits of the phone). */
export function phoneKey(phone) { return last10(phone); }

// ---- conversation memory -------------------------------------------------
// Recent turns per phone, so follow-ups ("what about next weekend?") have
// context. Expires after CONV_TTL_MIN of silence. Requires the wa_conversations
// table (see docs/whatsapp-agent.md); if it's missing, memory is simply off.
const CONV_TTL_MIN = 30;
const CONV_MAX_TURNS = 6; // last 3 exchanges

export async function loadConversation(key) {
  if (!db || !key) return [];
  try {
    const { data, error } = await db.from('wa_conversations').select('turns, updated_at').eq('phone', key).maybeSingle();
    if (error || !data) return [];
    if (Date.now() - new Date(data.updated_at).getTime() > CONV_TTL_MIN * 60000) return [];
    return Array.isArray(data.turns) ? data.turns : [];
  } catch { return []; }
}

export async function saveConversation(key, turns) {
  if (!db || !key) return;
  try {
    await db.from('wa_conversations').upsert(
      { phone: key, turns: turns.slice(-CONV_MAX_TURNS), updated_at: new Date().toISOString() },
      { onConflict: 'phone' },
    );
  } catch { /* table not created yet → memory disabled, agent still works */ }
}

// ---- identity ------------------------------------------------------------

/** Resolve an inbound phone (any format) to a member, matched on the last 10
 *  digits so formatting differences don't matter. Null if not a member. */
export async function memberByPhone(phone) {
  if (!db) return null;
  const target = last10(phone);
  if (target.length < 10) return null;
  const { data } = await db.from('members')
    .select('id, name, family_id, phone, is_admin')
    .is('archived_at', null).not('phone', 'is', null);
  return (data || []).find((m) => last10(m.phone) === target) || null;
}

// ---- lookups -------------------------------------------------------------

/** id -> { name, familyName } maps for the whole (non-archived) roster. */
export async function roster() {
  const [{ data: fams }, { data: members }] = await Promise.all([
    db.from('families').select('id, name').is('archived_at', null),
    db.from('members').select('id, name, family_id').is('archived_at', null),
  ]);
  const familyName = Object.fromEntries((fams || []).map((f) => [f.id, f.name]));
  const memberById = Object.fromEntries((members || []).map((m) => [m.id, { name: m.name, familyId: m.family_id, familyName: familyName[m.family_id] }]));
  return { familyName, memberById, members: members || [] };
}

/** Members whose name loosely matches `query` (case-insensitive substring, all
 *  tokens must appear). Returns [{ id, name, familyName }]. */
export async function findMembersByName(query) {
  const { members, memberById } = await roster();
  const tokens = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return members
    .filter((m) => { const n = m.name.toLowerCase(); return tokens.every((t) => n.includes(t)); })
    .map((m) => ({ id: m.id, name: m.name, familyName: memberById[m.id]?.familyName || null }));
}

/** The asking member's favorites → { familyIds:Set, memberIds:Set, labels:[] }. */
export async function favoritesFor(memberId) {
  const { data } = await db.from('favorites').select('target_type, target_id').eq('member_id', memberId);
  const familyIds = new Set();
  const memberIds = new Set();
  for (const r of data || []) {
    if (r.target_type === 'family') familyIds.add(r.target_id);
    else if (r.target_type === 'member') memberIds.add(r.target_id);
  }
  return { familyIds, memberIds };
}

// ---- presence / attendance ----------------------------------------------

/** Attendance rows in [startISO, endISO] inclusive. */
export async function attendanceInRange(startISO, endISO) {
  const { data } = await db.from('attendance')
    .select('member_id, family_id, date')
    .gte('date', startISO).lte('date', endISO);
  return data || [];
}

/** All future attendance dates for a member (today onward). */
export async function memberFutureDates(memberId, todayISO) {
  const { data } = await db.from('attendance')
    .select('date').eq('member_id', memberId).gte('date', todayISO).order('date', { ascending: true });
  return (data || []).map((r) => r.date);
}

/** All future attendance dates for a whole family (any member), today onward. */
export async function familyFutureDates(familyId, todayISO) {
  const { data } = await db.from('attendance')
    .select('date').eq('family_id', familyId).gte('date', todayISO);
  return (data || []).map((r) => r.date);
}

// ---- get-togethers -------------------------------------------------------

/** Upcoming get-togethers this member may see (open to all, or invite-only and
 *  they're invited/host). Returns raw event rows + the member's invite set. */
export async function visibleGatherings(memberId) {
  const [{ data: events }, { data: invites }] = await Promise.all([
    db.from('events').select('slug, title, amenity, when_label, location, host_member_id, visibility, capacity').is('archived_at', null),
    db.from('event_invites').select('event_id, member_id'),
  ]);
  // event_invites keys off the event UUID; we selected by slug, so map slugs→ids.
  const { data: idRows } = await db.from('events').select('id, slug').is('archived_at', null);
  const idBySlug = Object.fromEntries((idRows || []).map((e) => [e.slug, e.id]));
  const invitedEventIds = new Set((invites || []).filter((i) => i.member_id === memberId).map((i) => i.event_id));
  return (events || []).filter((e) => {
    if (e.visibility !== 'private') return true;
    if (e.host_member_id === memberId) return true;
    return invitedEventIds.has(idBySlug[e.slug]);
  });
}
