// Vercel serverless function → POST /api/whatsapp
// Twilio calls this when a member texts the WhatsApp number. It verifies the
// request came from Twilio, maps the sender's phone to a member, runs the Claude
// agent, and replies with TwiML.
//
// A guarded GET test mode lets you exercise the agent before Twilio is wired:
//   GET /api/whatsapp?key=<WHATSAPP_TEST_KEY>&from=+15305550100&text=who%20is%20here%20this%20weekend
//
// Required env: ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL (or
// VITE_SUPABASE_URL), TWILIO_AUTH_TOKEN, WHATSAPP_PUBLIC_URL. Optional:
// WHATSAPP_AGENT_MODEL, WHATSAPP_TEST_KEY.

import twilio from 'twilio';
import { memberByPhone, dbConfigured, phoneKey, loadConversation, saveConversation } from './_lib/db.js';
import { runAgent } from './_lib/agent.js';

const xmlEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const twiml = (message) => `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${xmlEscape(message)}</Message></Response>`;

async function handleMessage({ from, text }, res, mode) {
  const reply = (msg) => {
    if (mode === 'twiml') { res.setHeader('Content-Type', 'text/xml'); return res.status(200).send(twiml(msg)); }
    return res.status(200).json({ reply: msg });
  };
  try {
    if (!dbConfigured) return reply('The assistant isn’t configured yet.');
    const phone = String(from || '').replace(/^whatsapp:/i, '').trim();
    const q = String(text || '').trim();
    if (!q) return reply('Hi! Ask me things like “Which of my favorites are up this weekend?” or “When is the Bell family next at Martis?”');
    const member = await memberByPhone(phone);
    if (!member) return reply('This number isn’t registered with Martis Camp Families yet — ask an admin to add your mobile number to your member profile.');
    const key = phoneKey(phone);
    const history = await loadConversation(key);
    const answer = await runAgent(q, member, history, key);
    await saveConversation(key, [...history, { role: 'user', content: q }, { role: 'assistant', content: answer }]);
    return reply(answer);
  } catch (e) {
    // Name the model: a model-specific API rejection (an unsupported parameter,
    // say) is otherwise indistinguishable from any other failure in the logs,
    // and WHATSAPP_AGENT_MODEL can change without a code change.
    const model = process.env.WHATSAPP_AGENT_MODEL || '(code default)';
    console.error(`[whatsapp] error model=${model}`, e); // details go to Vercel function logs
    return reply('Sorry — something went wrong on my end. Please try again in a moment.');
  }
}

export default async function handler(req, res) {
  // --- Test mode (no Twilio): GET with the shared test key ---
  if (req.method === 'GET') {
    const key = process.env.WHATSAPP_TEST_KEY;
    const q = req.query || {};
    if (!key || q.key !== key) return res.status(403).json({ error: 'forbidden' });
    return handleMessage({ from: q.from, text: q.text }, res, 'json');
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  // Vercel parses urlencoded bodies into an object; fall back if it's a string.
  const params = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : (req.body || {});

  // Verify the request is really from Twilio. Fail CLOSED: a real POST without a
  // configured token is rejected (use the guarded GET test mode for pre-Twilio
  // testing) so this member-data endpoint is never open to unsigned callers.
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return res.status(503).send('Twilio not configured');
  const signature = req.headers['x-twilio-signature'];
  const url = process.env.WHATSAPP_PUBLIC_URL || `https://${req.headers.host}${req.url}`;
  if (!twilio.validateRequest(authToken, signature, url, params)) {
    return res.status(403).send('invalid Twilio signature');
  }

  return handleMessage({ from: params.From, text: params.Body }, res, 'twiml');
}
