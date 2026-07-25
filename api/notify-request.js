// Vercel serverless function → POST /api/notify-request
//
// Texts the admins when someone suggests a family for Martis Camp Families —
// whether that came from the assistant's suggest_family tool or the app's
// "Request to add" dialog. Both write to `add_requests`, so both are covered.
//
// Fired by a Supabase Database Webhook on INSERT into `add_requests`:
//   Supabase → Integrations → Webhooks → new hook
//     table:   public.add_requests
//     events:  INSERT
//     type:    HTTP Request → POST https://martis.camp/api/notify-request
//     headers: x-webhook-secret: <INVITE_WEBHOOK_SECRET>
//
// Reuses INVITE_WEBHOOK_SECRET rather than inventing a second secret: it is the
// same trust boundary (our database calling our endpoint), and one fewer value
// to keep in sync across two systems.
//
// Also accepts { id } directly, for testing.
//
// Required env: INVITE_WEBHOOK_SECRET, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
// TWILIO_WHATSAPP_FROM, TWILIO_REQUEST_CONTENT_SID, SUPABASE_SERVICE_ROLE_KEY,
// SUPABASE_URL.

import { timingSafeEqual } from 'node:crypto';
import {
  dbConfigured, addRequestDetails, adminsWithPhone,
  claimNotification, recordNotificationError,
} from './_lib/db.js';
import { sendTemplate, outboundConfigured, toE164 } from './_lib/twilio.js';

const CONTENT_SID = process.env.TWILIO_REQUEST_CONTENT_SID;

function secretOk(given) {
  const want = process.env.INVITE_WEBHOOK_SECRET;
  if (!want) return false; // fail closed
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
  const rec = body.record || body;
  const id = rec.id;
  if (!id) return res.status(400).json({ error: 'need an add_request id' });

  try {
    const info = await addRequestDetails(id);
    if (!info) return res.status(200).json({ skipped: 'request not found' });
    const { request, requestedByName } = info;

    const admins = await adminsWithPhone();
    if (!admins.length) return res.status(200).json({ skipped: 'no admin with a phone' });

    const results = [];
    for (const admin of admins) {
      if (!toE164(admin.phone)) { results.push({ admin: admin.name, skipped: 'unusable phone' }); continue; }

      // Per-admin claim keyed on the request, so two admins each get one text
      // and a re-fired webhook gets none.
      const claimed = await claimNotification({
        memberId: admin.id, kind: 'add_request', subjectId: request.id,
        dedupeKey: request.id, phone: admin.phone,
      });
      if (!claimed) { results.push({ admin: admin.name, skipped: 'already notified' }); continue; }

      const sent = await sendTemplate({
        to: admin.phone,
        contentSid: CONTENT_SID,
        variables: { 1: requestedByName, 2: request.name, 3: request.email || 'no email given' },
      });

      if (!sent.ok) {
        await recordNotificationError({
          memberId: admin.id, kind: 'add_request', dedupeKey: request.id, error: sent.error,
        });
        console.error('[notify-request] send failed', sent.error);
        results.push({ admin: admin.name, ok: false, error: sent.error });
      } else {
        results.push({ admin: admin.name, ok: true, sid: sent.sid });
      }
    }

    // 200 even when individual sends failed — the per-admin outcome is recorded
    // in wa_notifications, and a webhook retry would only re-hit the claim.
    return res.status(200).json({ ok: true, results });
  } catch (e) {
    console.error('[notify-request] error', e);
    return res.status(500).json({ error: 'internal error' });
  }
}
