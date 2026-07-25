// Vercel serverless function → POST /api/notify-invite
//
// Texts someone when they're invited to a private get-together:
//   "You're invited: Jeff Bonforte added you to Saturday morning 9 holes on
//    Sat, Aug 15 · 8:30 AM. Reply here to RSVP or ask about it."
//
// Fired by a Supabase Database Webhook on INSERT into `event_invites`, rather
// than from the browser. That way it catches invites however they're created —
// the Host dialog today, admin SQL tomorrow — and no secret ever reaches the
// client. Set it up at:
//   Supabase → Database → Webhooks → new webhook
//     table:   public.event_invites
//     events:  INSERT
//     type:    HTTP Request → POST https://martis.camp/api/notify-invite
//     headers: x-webhook-secret: <INVITE_WEBHOOK_SECRET>
//
// Also accepts { event_id, member_id } directly, for testing and for
// backfilling an invite that was created before this existed.
//
// Required env: INVITE_WEBHOOK_SECRET, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
// TWILIO_WHATSAPP_FROM, TWILIO_INVITE_CONTENT_SID, SUPABASE_SERVICE_ROLE_KEY,
// SUPABASE_URL.

import { timingSafeEqual } from 'node:crypto';
import { dbConfigured, inviteDetails, claimNotification, recordNotificationError, seedConversation, phoneKey } from './_lib/db.js';
import { sendTemplate, outboundConfigured, toE164 } from './_lib/twilio.js';

const CONTENT_SID = process.env.TWILIO_INVITE_CONTENT_SID;

function secretOk(given) {
  const want = process.env.INVITE_WEBHOOK_SECRET;
  if (!want) return false; // fail closed: unset secret means nobody gets in
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!secretOk(req.headers['x-webhook-secret'])) return res.status(403).json({ error: 'forbidden' });
  if (!dbConfigured) return res.status(503).json({ error: 'database not configured' });
  if (!outboundConfigured || !CONTENT_SID) {
    return res.status(503).json({ error: 'outbound not configured' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  // Supabase webhook shape is { type, table, record: {...} }; the direct shape
  // is just the two ids.
  const rec = body.record || body;
  const eventId = rec.event_id;
  const memberId = rec.member_id;
  if (!eventId || !memberId) return res.status(400).json({ error: 'need event_id and member_id' });

  try {
    const info = await inviteDetails(eventId, memberId);
    if (!info) return res.status(200).json({ skipped: 'invite or member not found' });

    const { event, invitee, hostName } = info;

    // Reasons not to send, all of them normal rather than errors — a webhook
    // that 500s gets retried, and none of these improve on retry.
    if (event.archived_at) return res.status(200).json({ skipped: 'event archived' });
    if (invitee.archived_at) return res.status(200).json({ skipped: 'member archived' });
    if (invitee.id === event.host_member_id) return res.status(200).json({ skipped: 'host invited themselves' });
    if (!toE164(invitee.phone)) return res.status(200).json({ skipped: 'no usable phone' });

    // Claim before sending, so two concurrent fires can't both text.
    const claimed = await claimNotification({
      memberId: invitee.id, kind: 'event_invite', subjectId: event.id,
      dedupeKey: event.id, phone: invitee.phone,
    });
    if (!claimed) return res.status(200).json({ skipped: 'already notified' });

    const sent = await sendTemplate({
      to: invitee.phone,
      contentSid: CONTENT_SID,
      variables: { 1: hostName, 2: event.title, 3: event.when_label || 'soon' },
    });

    if (!sent.ok) {
      await recordNotificationError({
        memberId: invitee.id, kind: 'event_invite', dedupeKey: event.id, error: sent.error,
      });
      console.error('[notify-invite] send failed', sent.error);
      // 200 on purpose: the claim row records the failure, and a webhook retry
      // would only hit "already notified" anyway.
      return res.status(200).json({ ok: false, error: sent.error });
    }

    // Give the agent context, so a reply of "sure, put me down" knows what
    // "it" is instead of asking them to repeat themselves.
    await seedConversation(
      phoneKey(invitee.phone),
      `${hostName} invited you to ${event.title}${event.when_label ? ` on ${event.when_label}` : ''}`
      + `${event.location ? ` at ${event.location}` : ''}. Reply to RSVP.`,
    );

    return res.status(200).json({ ok: true, sid: sent.sid });
  } catch (e) {
    console.error('[notify-invite] error', e);
    return res.status(500).json({ error: 'internal error' });
  }
}
