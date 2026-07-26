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

// People refer to a household several ways — "Bonforte", "the Bonfortes", "the
// Bonforte family". These words carry no identifying information, so requiring
// them to appear in someone's name is what made "the Bonforte family" return
// nothing at all.
const NAME_STOPWORDS = new Set([
  'the', 'family', 'families', 'household', 'and', 'a', 'an', 'of', 'clan', 'folks',
]);

/** Split a query into the tokens that actually identify someone. */
export function nameTokens(query) {
  return String(query || '')
    .toLowerCase()
    .split(/[\s,./]+/)
    .map((t) => t.replace(/[^a-z''-]/g, '').replace(/'s$/, ''))
    .filter((t) => t && !NAME_STOPWORDS.has(t));
}

/**
 * Does `query` refer to this person? Matches against their own name AND their
 * family name, so "the Bonfortes" finds Jeff, and tolerates the plural people
 * naturally use for a household.
 */
export function nameMatches(query, memberName, familyName) {
  const tokens = nameTokens(query);
  if (!tokens.length) return false;
  const hay = `${String(memberName || '')} ${String(familyName || '')}`.toLowerCase();
  return tokens.every((t) => {
    if (hay.includes(t)) return true;
    // "Bonfortes" → "Bonforte". Only for tokens long enough that the trailing
    // s is plausibly a plural rather than part of the name (Ross, Bess).
    if (t.length > 4 && t.endsWith('s') && hay.includes(t.slice(0, -1))) return true;
    return false;
  });
}

/** Members matching `query` by their own name or their family's.
 *  Returns [{ id, name, familyName }]. */
export async function findMembersByName(query) {
  const { members, memberById } = await roster();
  if (!nameTokens(query).length) return [];
  return members
    .filter((m) => nameMatches(query, m.name, memberById[m.id]?.familyName))
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

// ---- marking days (the only WRITE the assistant can perform) -------------
// Scoped deliberately: add-only, future-only, and always within the asking
// member's own family. Removing or editing days stays in the app's Plan-a-visit
// screen — over text there's too much room for "no, not that Saturday".

/** Non-archived members of a family, for scope: 'family'. */
export async function familyMembers(familyId) {
  if (!db || !familyId) return [];
  const { data } = await db.from('members')
    .select('id, name').eq('family_id', familyId).is('archived_at', null);
  return data || [];
}

/** Dates a member already has marked inside a window (to avoid asking twice). */
export async function memberDatesInRange(memberId, startISO, endISO) {
  if (!db || !memberId) return [];
  const { data } = await db.from('attendance')
    .select('date').eq('member_id', memberId).gte('date', startISO).lte('date', endISO);
  return (data || []).map((r) => r.date);
}

/**
 * Delete attendance rows for these members on these dates. Returns how many
 * rows actually went, so the assistant's confirmation can't overstate what
 * happened ("took 4 days off" when only 2 were ever marked).
 */
export async function unmarkAttendance({ memberIds, dates }) {
  if (!db) return { ok: false, error: 'not configured' };
  if (!memberIds?.length || !dates?.length) return { ok: false, error: 'nothing to remove' };
  const { data, error } = await db.from('attendance')
    .delete().in('member_id', memberIds).in('date', dates).select('id');
  return error ? { ok: false, error: error.message } : { ok: true, removed: (data || []).length };
}

/** Upsert attendance rows. Existing days are left as they are, never removed. */
export async function markAttendance({ memberIds, familyId, dates, createdBy }) {
  if (!db) return { ok: false, error: 'not configured' };
  if (!memberIds?.length || !dates?.length) return { ok: false, error: 'nothing to mark' };
  const rows = [];
  for (const member_id of memberIds) {
    for (const date of dates) {
      rows.push({ member_id, family_id: familyId, date, status: 'planned', created_by: createdBy });
    }
  }
  const { error } = await db.from('attendance').upsert(rows, { onConflict: 'member_id,date' });
  return error ? { ok: false, error: error.message } : { ok: true, rows: rows.length };
}

// ---- RSVPs ---------------------------------------------------------------

/**
 * Record the asking member's RSVP to a get-together.
 *
 * The visibility check is done HERE, in code, because this file uses the
 * service-role key and bypasses RLS entirely — the `can_see_event` policy that
 * protects the web app does nothing for us. Without this check, a member could
 * RSVP their way into a private event they were never invited to.
 */
export async function setRsvp({ eventSlug, memberId, status }) {
  if (!db) return { ok: false, error: 'not configured' };
  if (!['going', 'maybe', 'declined'].includes(status)) return { ok: false, error: 'bad status' };

  const { data: ev } = await db.from('events')
    .select('id, title, when_label, visibility, host_member_id')
    .eq('slug', eventSlug).is('archived_at', null).maybeSingle();
  if (!ev) return { ok: false, error: 'No get-together by that name.' };

  if (ev.visibility === 'private' && ev.host_member_id !== memberId) {
    const { data: inv } = await db.from('event_invites')
      .select('id').eq('event_id', ev.id).eq('member_id', memberId).maybeSingle();
    if (!inv) return { ok: false, error: 'That one is invite-only and you are not on the list.' };
  }

  const { error } = await db.from('rsvps')
    .upsert({ event_id: ev.id, member_id: memberId, status }, { onConflict: 'event_id,member_id' });
  return error
    ? { ok: false, error: error.message }
    : { ok: true, title: ev.title, when: ev.when_label, status };
}

/**
 * Record an outbound message as an assistant turn so the member's reply has
 * context — without this, someone answering "sure" to an invite push arrives
 * with no history and the agent has to ask what they mean.
 *
 * No consumer yet; the invite push (api/notify-invite.js) will call it.
 */
export async function seedConversation(key, assistantText) {
  if (!db || !key || !assistantText) return;
  try {
    const prior = await loadConversation(key);
    const turns = [...prior, { role: 'assistant', content: assistantText }].slice(-CONV_MAX_TURNS);
    await db.from('wa_conversations').upsert(
      { phone: key, turns, updated_at: new Date().toISOString() },
      { onConflict: 'phone' },
    );
  } catch { /* table missing → memory off, same as loadConversation */ }
}

// ---- referrals -----------------------------------------------------------
// Suggestions from the assistant land in the same `add_requests` queue the
// app's "Request to add" dialog writes to, so admins triage everything in one
// place (Admin → Requests) regardless of where it came from.

/**
 * File a suggested family. Returns { ok, id } — or { ok: false, duplicate: true }
 * when that email already has an open request, so the assistant can say it's
 * already on the list instead of silently filing it twice.
 */
export async function createAddRequest({ name, email, phone, note, requestedBy }) {
  if (!db) return { ok: false, error: 'not configured' };
  const clean = String(email || '').trim().toLowerCase();

  const { data: existing } = await db.from('add_requests')
    .select('id, name').eq('status', 'open').ilike('email', clean).maybeSingle();
  if (existing) return { ok: false, duplicate: true, existingName: existing.name };

  const { data, error } = await db.from('add_requests').insert({
    kind: 'family',
    name: String(name || '').trim(),
    email: clean,
    phone: String(phone || '').trim() || null,
    note: String(note || '').trim() || null,
    requested_by: requestedBy,
    status: 'open',
  }).select('id').single();

  return error ? { ok: false, error: error.message } : { ok: true, id: data.id };
}

/** Admins who can actually be texted. Used to route referral notifications. */
export async function adminsWithPhone() {
  if (!db) return [];
  const { data } = await db.from('members')
    .select('id, name, phone').eq('is_admin', true)
    .is('archived_at', null).not('phone', 'is', null);
  return data || [];
}

/** One add_request plus who suggested it, for the notification. */
export async function addRequestDetails(id) {
  if (!db) return null;
  const { data: req } = await db.from('add_requests')
    .select('id, name, email, phone, note, requested_by, created_at')
    .eq('id', id).maybeSingle();
  if (!req) return null;
  const { data: by } = req.requested_by
    ? await db.from('members').select('name').eq('id', req.requested_by).maybeSingle()
    : { data: null };
  return { request: req, requestedByName: by?.name || 'A member' };
}

// ---- outbound invites ----------------------------------------------------

/** Everything the invite push needs, in one round trip's worth of queries. */
export async function inviteDetails(eventId, memberId) {
  if (!db) return null;
  const [{ data: ev }, { data: invitee }] = await Promise.all([
    db.from('events')
      .select('id, slug, title, when_label, location, visibility, archived_at, host_member_id')
      .eq('id', eventId).maybeSingle(),
    db.from('members')
      .select('id, name, phone, archived_at').eq('id', memberId).maybeSingle(),
  ]);
  if (!ev || !invitee) return null;
  const { data: host } = ev.host_member_id
    ? await db.from('members').select('name').eq('id', ev.host_member_id).maybeSingle()
    : { data: null };
  return { event: ev, invitee, hostName: host?.name || 'Someone' };
}

/**
 * Claim the right to send one notification. The unique index on
 * (member_id, kind, dedupe_key) does the work: a second caller — a retried
 * cron run, a re-fired webhook, two concurrent fires — loses the insert and
 * gets `false`, so nobody is texted twice. Claim-then-send, not
 * check-then-send, because the latter races.
 */
export async function claimNotification({ memberId, kind, subjectId, dedupeKey, phone }) {
  if (!db) return false;
  const { error } = await db.from('wa_notifications')
    .insert({ member_id: memberId, kind, subject_id: subjectId, dedupe_key: dedupeKey, phone });
  return !error; // unique violation → already claimed
}

/**
 * Record that a claimed send failed. The row stays, so the failure is visible
 * in the table and the same invite is not retried into a loop — a rare missed
 * text is better than a storm, and the host can see RSVPs in the app anyway.
 */
export async function recordNotificationError({ memberId, kind, dedupeKey, error }) {
  if (!db) return;
  await db.from('wa_notifications').update({ error: String(error).slice(0, 500) })
    .match({ member_id: memberId, kind, dedupe_key: dedupeKey });
}

// ---- nudge throttling ----------------------------------------------------
// Whether we've recently offered to add someone's days. Enforced in code, not
// left to the model — a prompt rule is a suggestion, a timestamp is a fact.

export async function lastNudgeAt(key) {
  if (!db || !key) return null;
  try {
    const { data, error } = await db.from('wa_conversations')
      .select('last_nudge_at').eq('phone', key).maybeSingle();
    return error || !data ? null : (data.last_nudge_at || null);
  } catch { return null; }
}

export async function recordNudge(key) {
  if (!db || !key) return;
  try {
    // Only touches last_nudge_at; `turns` is left intact on conflict.
    await db.from('wa_conversations')
      .upsert({ phone: key, last_nudge_at: new Date().toISOString() }, { onConflict: 'phone' });
  } catch { /* column not added yet → nudges simply aren't throttled */ }
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
