import { supabase, isSupabaseConfigured } from './supabase.js';
import { DATA as MOCK } from '../data/mockData.js';
import { buildWeekendDays } from './calendar.js';

// ---------------------------------------------------------------------------
// Data-access layer. When Supabase is configured, reads/writes go to the
// database and are mapped into the SAME shape the screens already use (see
// mockData.js). When it isn't, everything falls back to the mock so the UI is
// fully functional offline. Weather (weekendDays/snowReport) always comes from
// the mock here and is overlaid live by lib/weather.js in the shell.
// ---------------------------------------------------------------------------

export { isSupabaseConfigured };

// The rolling 7-day window from today: day key <-> real ISO date. Generated
// from now() (see calendar.js) so presence + attendance writes always land on
// the current week rather than a frozen prototype week.
const WINDOW = buildWeekendDays();
const DAY_DATE = Object.fromEntries(WINDOW.map((d) => [d.key, d.iso]));
const DATE_DAY = Object.fromEntries(WINDOW.map((d) => [d.iso, d.key]));
const DAY_ORDER = WINDOW.map((d) => d.key);
const DAY_LABEL = Object.fromEntries(WINDOW.map((d) => [d.key, d.label]));
const WEEKDAY_TO_KEY = { Thu: 'thu', Fri: 'fri', Sat: 'sat', Sun: 'sun', Mon: 'mon', Tue: 'tue', Wed: 'wed' };

// Presence is day-agnostic (people visit any days, not just weekends). "here"
// means they're at the Camp TODAY (the first day of the rolling window);
// otherwise the label describes when in the window they're up next.
function presenceFrom(days) {
  const sorted = [...new Set(days)].filter((d) => DAY_ORDER.includes(d)).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  if (sorted.length === 0) return { here: false, label: 'Away', days: [] };
  const hereToday = sorted[0] === DAY_ORDER[0];
  if (sorted.length >= 6) return { here: hereToday, label: 'Here all week', days: sorted };
  const a = DAY_LABEL[sorted[0]], b = DAY_LABEL[sorted[sorted.length - 1]];
  const span = a === b ? a : `${a}–${b}`;
  if (hereToday) return { here: true, label: sorted.length === 1 ? 'Here today' : `Here ${span}`, days: sorted };
  return { here: false, label: sorted.length === 1 ? `Up ${a}` : `Up ${span}`, days: sorted };
}

function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

// --- Auth -------------------------------------------------------------------

export async function getSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export function onAuthChange(cb) {
  if (!isSupabaseConfigured) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email) {
  if (!isSupabaseConfigured) return { ok: false, error: 'not-configured' };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut() {
  if (isSupabaseConfigured) await supabase.auth.signOut();
}

// Link the signed-in auth user to their members row by email (first sign-in).
// Uses a SECURITY DEFINER RPC because a normal UPDATE can't pass RLS before the
// link exists (you'd have to already be linked to be allowed to link).
async function ensureMemberLink(session) {
  if (!session?.user?.id) return null;
  let { data: me } = await supabase.from('members').select('id, name, family_id, is_admin').eq('user_id', session.user.id).maybeSingle();
  if (!me) {
    await supabase.rpc('link_member_to_user');
    ({ data: me } = await supabase.from('members').select('id, name, family_id, is_admin').eq('user_id', session.user.id).maybeSingle());
  }
  return me || null;
}

// --- Read -------------------------------------------------------------------

/** Load the whole app dataset in the shape the screens expect. */
export async function loadAppData() {
  if (!isSupabaseConfigured) {
    return { source: 'mock', favorites: ['reyes', 'm:Tom Bell'], ...MOCK };
  }
  const session = await getSession();
  const me = session ? await ensureMemberLink(session) : null;

  const [familiesRes, membersRes, attendanceRes, eventsRes, rsvpsRes, invitesRes, communityRes, feedRes, favoritesRes] = await Promise.all([
    supabase.from('families').select('*').is('archived_at', null),
    supabase.from('members').select('*').is('archived_at', null),
    supabase.from('attendance').select('member_id, family_id, date'),
    supabase.from('events').select('*').is('archived_at', null),
    supabase.from('rsvps').select('event_id, member_id, status'),
    supabase.from('event_invites').select('event_id, member_id'),
    supabase.from('community_calendar').select('*'),
    supabase.from('feed').select('*').order('created_at', { ascending: false }),
    supabase.from('favorites').select('target_type, target_id'),
  ]);

  const families = familiesRes.data || [];
  const members = membersRes.data || [];
  const attendance = attendanceRes.data || [];
  const events = eventsRes.data || [];
  const rsvps = rsvpsRes.data || [];
  const eInvites = invitesRes.data || [];
  const community = communityRes.data || [];
  const feed = feedRes.data || [];
  const favoriteRows = favoritesRes.data || [];

  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const nameById = Object.fromEntries(members.map((m) => [m.id, m.name]));

  // member_id -> [day keys]
  const daysByMember = {};
  for (const a of attendance) {
    const key = DATE_DAY[a.date];
    if (!key) continue;
    (daysByMember[a.member_id] ||= []).push(key);
  }

  const familyById = Object.fromEntries(families.map((f) => [f.id, f]));
  const membersByFamily = {};
  for (const m of members) (membersByFamily[m.family_id] ||= []).push(m);

  const mappedFamilies = families.map((f) => {
    const fm = (membersByFamily[f.id] || []).map((m) => ({
      name: m.name, role: m.role, photo: m.photo_url, tone: m.tone,
      phone: m.phone, email: m.email, interests: m.interests || [],
      days: (daysByMember[m.id] || []).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)),
    }));
    const famDays = fm.flatMap((m) => m.days);
    return {
      id: f.slug, name: f.name, address: f.address, hometown: f.hometown,
      cover: f.cover_photo_url, coverPos: f.cover_photo_pos, tone: f.tone,
      interests: (f.interests && f.interests.length) ? f.interests : [...new Set(fm.flatMap((m) => m.interests))].slice(0, 4),
      presence: presenceFrom(famDays),
      members: fm,
    };
  });

  // RSVPs grouped by event
  const rsvpByEvent = {};
  for (const r of rsvps) (rsvpByEvent[r.event_id] ||= []).push(r);
  const invitesByEvent = {};
  for (const i of eInvites) (invitesByEvent[i.event_id] ||= []).push(i.member_id);

  const gatherings = events.map((ev) => {
    const rs = rsvpByEvent[ev.id] || [];
    const names = (st) => rs.filter((r) => r.status === st).map((r) => ({ name: nameById[r.member_id] })).filter((x) => x.name);
    const weekdayTok = (ev.when_label || '').match(/^([A-Z][a-z]{2})/)?.[1];
    const invitedIds = invitesByEvent[ev.id] || [];
    const myRow = me ? rs.find((r) => r.member_id === me.id) : null;
    return {
      id: ev.slug, title: ev.title, amenity: ev.amenity, host: nameById[ev.host_member_id] || '',
      day: WEEKDAY_TO_KEY[weekdayTok] || null, when: ev.when_label, where: ev.location,
      capacity: ev.capacity, description: ev.description,
      visibility: ev.visibility, youInvited: ev.visibility !== 'private' || (me ? invitedIds.includes(me.id) : true),
      myRsvp: myRow ? myRow.status : null,
      invited: invitedIds.map((id) => ({ name: nameById[id] })).filter((x) => x.name),
      going: names('going'), maybe: names('maybe'), declined: names('declined'),
    };
  });

  const communityEvents = community.map((c) => ({
    day: c.day_of_month, dayKey: c.day_key, title: c.title, place: c.place, amenity: c.amenity, community: true,
  }));

  const mappedFeed = feed.map((it, i) => ({
    id: it.id, kind: it.kind, who: it.actor_label, tone: it.tone, text: it.body,
    when: relativeTime(it.created_at), unread: i < 4,
    eventId: it.event_slug || undefined, familyId: it.family_slug || undefined,
  }));

  const favorites = favoriteRows.map((r) => {
    if (r.target_type === 'family') return familyById[r.target_id]?.slug;
    return nameById[r.target_id] ? `m:${nameById[r.target_id]}` : null;
  }).filter(Boolean);

  const meFamily = me ? familyById[me.family_id] : null;
  const meOut = me
    ? { name: me.name, familyId: meFamily ? meFamily.slug : MOCK.me.familyId, isAdmin: !!me.is_admin }
    : MOCK.me;

  return {
    source: 'supabase',
    me: meOut,
    // Weather has no live table yet, so it stays on the mock placeholders
    // (real temps are overlaid by lib/weather.js). Everything else reflects the
    // live database exactly — empty means empty, never a mock fallback, so a
    // wiped/quiet database doesn't resurrect sample families/events/feed.
    weekendDays: MOCK.weekendDays,
    snowReport: MOCK.snowReport,
    families: mappedFamilies,
    gatherings,
    events: communityEvents,
    feed: mappedFeed,
    favorites,
  };
}

// --- Mutations (Supabase only; no-ops when unconfigured) -------------------

async function currentMemberId() {
  const { data } = await supabase.rpc('current_member_id');
  return data || null;
}

/** Persist an RSVP for the signed-in member on an event (by slug). */
export async function persistRsvp(eventSlug, status) {
  if (!isSupabaseConfigured) return;
  const mid = await currentMemberId();
  const { data: ev } = await supabase.from('events').select('id').eq('slug', eventSlug).maybeSingle();
  if (!mid || !ev) return;
  if (status == null) {
    await supabase.from('rsvps').delete().match({ event_id: ev.id, member_id: mid });
  } else {
    await supabase.from('rsvps').upsert({ event_id: ev.id, member_id: mid, status }, { onConflict: 'event_id,member_id' });
  }
}

/** Toggle a favorite. id is a family slug, or 'm:<Member Name>' for a member. */
export async function persistFavorite(id, on) {
  if (!isSupabaseConfigured) return;
  const mid = await currentMemberId();
  if (!mid) return;
  let target_type, target_id;
  if (id.startsWith('m:')) {
    const { data: m } = await supabase.from('members').select('id').eq('name', id.slice(2)).maybeSingle();
    if (!m) return;
    target_type = 'member'; target_id = m.id;
  } else {
    const { data: f } = await supabase.from('families').select('id').eq('slug', id).maybeSingle();
    if (!f) return;
    target_type = 'family'; target_id = f.id;
  }
  if (on) {
    await supabase.from('favorites').upsert({ member_id: mid, target_type, target_id }, { onConflict: 'member_id,target_type,target_id' });
  } else {
    await supabase.from('favorites').delete().match({ member_id: mid, target_type, target_id });
  }
}

async function currentFamilyId() {
  const { data } = await supabase.rpc('current_family_id');
  return data || null;
}

const slugify = (s) => ((s || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'event');
const shortId = () => Math.random().toString(36).slice(2, 7);

/**
 * Create a get-together: inserts the event (host = signed-in member), auto-RSVPs
 * the host as going, and adds invites for private events. Returns { ok, slug }.
 */
export async function createGathering(input) {
  if (!isSupabaseConfigured) return { ok: false, offline: true };
  const mid = await currentMemberId();
  if (!mid) return { ok: false, error: 'Your account isn’t linked to a member yet.' };
  const slug = `${slugify(input.title)}-${shortId()}`;
  const { data: ev, error } = await supabase.from('events').insert({
    slug,
    title: input.title || 'Get-together',
    amenity: input.amenity || null,
    host_member_id: mid,
    when_label: input.when || null,
    location: input.location || null,
    description: input.description || null,
    visibility: input.visibility === 'private' ? 'private' : 'open',
    capacity: input.capacity == null || input.capacity === '' ? null : Number(input.capacity),
  }).select('id, slug').single();
  if (error || !ev) return { ok: false, error: error?.message || 'Could not create the get-together.' };

  await supabase.from('rsvps').upsert({ event_id: ev.id, member_id: mid, status: 'going' }, { onConflict: 'event_id,member_id' });

  if (input.visibility === 'private' && Array.isArray(input.inviteeNames) && input.inviteeNames.length) {
    const { data: ms } = await supabase.from('members').select('id').in('name', input.inviteeNames);
    if (ms?.length) {
      await supabase.from('event_invites').upsert(
        ms.map((m) => ({ event_id: ev.id, member_id: m.id, invited_by: mid })),
        { onConflict: 'event_id,member_id' },
      );
    }
  }
  return { ok: true, slug: ev.slug };
}

/**
 * Load the signed-in family's saved attendance as a plan: per-member sets of
 * date keys (YYYY-MM-DD), plus a 'family' set = dates where every member is up.
 * Returns { plan, memberNames } or null when unconfigured.
 */
export async function loadVisitPlan() {
  if (!isSupabaseConfigured) return null;
  const famId = await currentFamilyId();
  if (!famId) return null;
  const [{ data: members }, { data: att }] = await Promise.all([
    supabase.from('members').select('id, name').eq('family_id', famId).is('archived_at', null),
    supabase.from('attendance').select('member_id, date').eq('family_id', famId),
  ]);
  const idToName = Object.fromEntries((members || []).map((m) => [m.id, m.name]));
  const byMember = {};
  (att || []).forEach((a) => { const n = idToName[a.member_id]; if (n) (byMember[n] ||= new Set()).add(a.date); });
  const memberNames = (members || []).map((m) => m.name);
  const family = new Set();
  if (memberNames.length) {
    for (const d of byMember[memberNames[0]] || []) {
      if (memberNames.every((n) => (byMember[n] || new Set()).has(d))) family.add(d);
    }
  }
  const plan = { family: [...family] };
  memberNames.forEach((n) => { plan[n] = [...(byMember[n] || new Set())]; });
  return { plan, memberNames };
}

/**
 * Save a scope's attendance (replace-in-horizon from `fromKey` onward).
 *  - scope === 'family' → applies to every family member
 *  - scope === '<Member Name>' → that member only
 */
export async function saveVisitPlan(scope, dateKeys, fromKey) {
  if (!isSupabaseConfigured) return { ok: false, offline: true };
  const famId = await currentFamilyId();
  const mid = await currentMemberId();
  if (!famId) return { ok: false, error: 'Not linked to a family.' };

  let targets;
  if (scope === 'family') {
    const { data: ms } = await supabase.from('members').select('id').eq('family_id', famId).is('archived_at', null);
    targets = ms || [];
  } else {
    const { data: m } = await supabase.from('members').select('id').eq('name', scope).eq('family_id', famId).maybeSingle();
    targets = m ? [m] : [];
  }
  const ids = targets.map((t) => t.id);
  if (!ids.length) return { ok: false, error: 'No members in scope.' };

  // Replace within the planning horizon: clear future rows for these members, then insert the selection.
  await supabase.from('attendance').delete().in('member_id', ids).gte('date', fromKey);
  const rows = [];
  for (const id of ids) for (const d of dateKeys) rows.push({ member_id: id, family_id: famId, date: d, created_by: mid, status: 'planned' });
  if (rows.length) await supabase.from('attendance').upsert(rows, { onConflict: 'member_id,date' });
  return { ok: true };
}

// --- Profile edits -------------------------------------------------------

export async function persistFamilyEdit(slug, fields) {
  if (!isSupabaseConfigured) return { ok: false, offline: true };
  const patch = {};
  ['name', 'address', 'hometown'].forEach((k) => { if (fields[k] !== undefined) patch[k] = fields[k]; });
  if (fields.cover !== undefined) patch.cover_photo_url = fields.cover;
  if (fields.coverPos !== undefined) patch.cover_photo_pos = fields.coverPos;
  if (fields.interests !== undefined) patch.interests = fields.interests;
  const { error } = await supabase.from('families').update(patch).eq('slug', slug);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function persistMemberEdit(originalName, fields) {
  if (!isSupabaseConfigured) return { ok: false, offline: true };
  const { data: m } = await supabase.from('members').select('id, family_id').eq('name', originalName).maybeSingle();
  if (!m) return { ok: false, error: 'Member not found.' };
  const patch = {};
  ['name', 'role', 'phone', 'email'].forEach((k) => { if (fields[k] !== undefined) patch[k] = fields[k]; });
  if (fields.interests !== undefined) patch.interests = fields.interests;
  if (fields.photo !== undefined) patch.photo_url = fields.photo;
  const { error } = await supabase.from('members').update(patch).eq('id', m.id);
  if (error) return { ok: false, error: error.message };
  if (Array.isArray(fields.days)) {
    const weekDates = Object.values(DAY_DATE);
    await supabase.from('attendance').delete().eq('member_id', m.id).in('date', weekDates);
    const rows = fields.days.map((k) => DAY_DATE[k]).filter(Boolean).map((d) => ({ member_id: m.id, family_id: m.family_id, date: d, status: 'planned' }));
    if (rows.length) await supabase.from('attendance').upsert(rows, { onConflict: 'member_id,date' });
  }
  return { ok: true };
}

// --- Comments on get-togethers -------------------------------------------

export async function loadComments(eventSlug) {
  if (!isSupabaseConfigured) return [];
  const { data: ev } = await supabase.from('events').select('id').eq('slug', eventSlug).maybeSingle();
  if (!ev) return [];
  const { data } = await supabase.from('comments').select('id, body, created_at, member_id')
    .eq('subject_type', 'event').eq('subject_id', ev.id).is('hidden_at', null).order('created_at', { ascending: true });
  const rows = data || [];
  const ids = [...new Set(rows.map((r) => r.member_id))];
  let names = {};
  if (ids.length) {
    const { data: ms } = await supabase.from('members').select('id, name, photo_url, tone').in('id', ids);
    names = Object.fromEntries((ms || []).map((m) => [m.id, m]));
  }
  return rows.map((r) => ({
    id: r.id, body: r.body, when: relativeTime(r.created_at),
    who: names[r.member_id]?.name || 'Someone', photo: names[r.member_id]?.photo_url, tone: names[r.member_id]?.tone,
  }));
}

export async function addComment(eventSlug, body) {
  if (!isSupabaseConfigured) return { ok: false, offline: true };
  const mid = await currentMemberId();
  const { data: ev } = await supabase.from('events').select('id').eq('slug', eventSlug).maybeSingle();
  if (!mid || !ev) return { ok: false };
  const { error } = await supabase.from('comments').insert({ subject_type: 'event', subject_id: ev.id, member_id: mid, body });
  return error ? { ok: false, error: error.message } : { ok: true };
}

// --- Admin (RLS gates these to admins) -----------------------------------

export async function listInvites() {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase.from('invites').select('id, email, accepted_at, revoked_at, created_at, family_id').order('created_at', { ascending: false });
  const rows = data || [];
  const famIds = [...new Set(rows.map((r) => r.family_id).filter(Boolean))];
  let fams = {};
  if (famIds.length) { const { data: fs } = await supabase.from('families').select('id, name').in('id', famIds); fams = Object.fromEntries((fs || []).map((f) => [f.id, f.name])); }
  return rows.map((r) => ({ id: r.id, email: r.email, family: r.family_id ? fams[r.family_id] : null, status: r.revoked_at ? 'revoked' : r.accepted_at ? 'accepted' : 'pending' }));
}

export async function createInvite(email, familySlug) {
  if (!isSupabaseConfigured) return { ok: false, offline: true };
  let family_id = null;
  if (familySlug) { const { data: f } = await supabase.from('families').select('id').eq('slug', familySlug).maybeSingle(); family_id = f?.id || null; }
  const mid = await currentMemberId();
  const { error } = await supabase.from('invites').insert({ email, family_id, invited_by: mid });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function revokeInvite(id) {
  if (!isSupabaseConfigured) return { ok: false };
  const { error } = await supabase.from('invites').update({ revoked_at: new Date().toISOString() }).eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function createFamily(name) {
  if (!isSupabaseConfigured) return { ok: false, offline: true };
  const { error } = await supabase.from('families').insert({ slug: `${slugify(name)}-${shortId()}`, name, tone: 'var(--pine-600)' });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function archiveFamily(slug) {
  if (!isSupabaseConfigured) return { ok: false };
  const { error } = await supabase.from('families').update({ archived_at: new Date().toISOString() }).eq('slug', slug);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function listCommunity() {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase.from('community_calendar').select('id, title, place, amenity, day_of_month, day_key').order('day_of_month', { ascending: true });
  return data || [];
}

export async function createCommunityEvent({ title, place, amenity, dayKey, dayOfMonth }) {
  if (!isSupabaseConfigured) return { ok: false, offline: true };
  const { error } = await supabase.from('community_calendar').insert({ title, place, amenity: amenity || null, day_key: dayKey || null, day_of_month: dayOfMonth || null, is_community: true });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteCommunityEvent(id) {
  if (!isSupabaseConfigured) return { ok: false };
  const { error } = await supabase.from('community_calendar').delete().eq('id', id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// --- Photo upload to Storage ---------------------------------------------

const BUCKET = { member: 'member-photos', cover: 'family-covers', event: 'event-photos' };

export async function uploadPhoto(kind, file) {
  if (!isSupabaseConfigured) return { ok: false, offline: true };
  if (!file) return { ok: false, error: 'No file.' };
  const bucket = BUCKET[kind] || 'event-photos';
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${Date.now()}-${shortId()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) return { ok: false, error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
