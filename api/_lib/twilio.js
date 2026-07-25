// Outbound WhatsApp. Everything else in this codebase replies to an inbound
// message with TwiML; this is the one path that starts a conversation.
//
// WhatsApp only permits business-initiated messages outside a 24-hour window
// via a Meta-approved CONTENT TEMPLATE — free-form text is silently useless
// here. So sends go through Twilio's Content API with a template SID and
// variables, never a raw body.

import twilio from 'twilio';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_WHATSAPP_FROM; // e.g. +17752627847

export const outboundConfigured = !!(ACCOUNT_SID && AUTH_TOKEN && FROM);

let _client;
function client() {
  if (!_client) _client = twilio(ACCOUNT_SID, AUTH_TOKEN);
  return _client;
}

/**
 * Members' phones are stored however they were typed — "(530) 555-0100",
 * "530-555-0100", "+1 530 555 0100". WhatsApp needs E.164. Assumes US/Canada
 * when no country code is present, which matches the community.
 * Returns null if it can't be made into something sendable.
 */
export function toE164(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  // Already international and plausible — pass it through.
  if (digits.length > 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

/**
 * Send an approved template. `variables` is keyed by position: { 1: …, 2: … }.
 * Never throws — returns { ok, sid } or { ok: false, error } so the caller can
 * record the failure against the notification row rather than lose it.
 */
export async function sendTemplate({ to, contentSid, variables }) {
  if (!outboundConfigured) return { ok: false, error: 'outbound not configured' };
  if (!contentSid) return { ok: false, error: 'no template SID configured' };
  const e164 = toE164(to);
  if (!e164) return { ok: false, error: `unusable phone: ${to}` };

  try {
    const msg = await client().messages.create({
      from: `whatsapp:${FROM}`,
      to: `whatsapp:${e164}`,
      contentSid,
      contentVariables: JSON.stringify(variables || {}),
    });
    return { ok: true, sid: msg.sid, to: e164 };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e), to: e164 };
  }
}
