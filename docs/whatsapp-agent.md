# WhatsApp assistant

A member texts a WhatsApp number and asks natural-language questions about who's
at Martis Camp and when — e.g. *"Which of my favorites are up this weekend?"* or
*"When is the Bell family next at Martis?"* — and gets an answer drawn from the
app's live data.

## How it works

```
WhatsApp msg ─▶ Twilio ─▶ POST /api/whatsapp (Vercel function)
                            1. verify Twilio signature
                            2. map sender's phone → member  (members.phone)
                            3. run Claude agent with read-only tools
                                 └─ tools query Supabase (service role)
                            4. reply with TwiML
```

Code:
- `api/whatsapp.js` — the webhook (Twilio signature check, phone→member gate, reply).
- `api/_lib/agent.js` — the Claude tool-use loop + the 5 tools.
- `api/_lib/db.js` — scoped Supabase queries (service role).
- `api/_lib/dates.js` — "today / this weekend" (Pacific) + stay grouping.

The model can only call fixed, parameterized tools — never raw SQL — so answers
stay grounded and prompt-injection is largely inert. Presence is visible to all
members; invite-only get-togethers are filtered per member.

## Prerequisite: member phone numbers

Identity is the sender's phone matched against `members.phone` (on the last 10
digits, so formatting doesn't matter). A member must have their **mobile number**
on their profile (Admin → Invites, or Edit profile) to use the assistant. An
unknown number gets a polite "not registered" reply.

## Environment variables (set in Vercel → Project → Settings → Environment Variables)

| Var | What | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (console.anthropic.com) | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` secret | ✅ |
| `SUPABASE_URL` | Supabase project URL (or it falls back to `VITE_SUPABASE_URL`) | – |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Account Info → Auth Token | ✅ (POST fails closed without it) |
| `WHATSAPP_PUBLIC_URL` | The exact webhook URL Twilio calls, e.g. `https://martis.camp/api/whatsapp` | ✅ (signature check) |
| `WHATSAPP_AGENT_MODEL` | Override the model. Default `claude-opus-4-8`; set `claude-haiku-4-5` for ~5× lower cost | – |
| `WHATSAPP_TEST_KEY` | Any random string — enables the GET test mode below | – |

> The `service_role` key bypasses RLS — keep it server-side only (it's only ever
> read by this function). Never expose it to the frontend.

## Twilio setup

1. Create a Twilio account. For prototyping, use the **WhatsApp Sandbox**
   (Messaging → Try it out → Send a WhatsApp message) — you can start immediately,
   no business approval. For production you'll request a WhatsApp Business number
   (a few days of Meta approval); the webhook is identical.
2. In the sandbox settings, set **"When a message comes in"** to:
   `https://martis.camp/api/whatsapp` (HTTP **POST**).
3. Put your Twilio **Auth Token** in `TWILIO_AUTH_TOKEN` and that same URL in
   `WHATSAPP_PUBLIC_URL`, then redeploy.
4. Join the sandbox from your phone (send the given `join <code>` to the sandbox
   number) and text a question.

## Testing before Twilio is wired

Set `WHATSAPP_TEST_KEY` to a random string, redeploy, then:

```
curl "https://martis.camp/api/whatsapp?key=YOUR_TEST_KEY&from=%2B15305550100&text=who%20is%20here%20this%20weekend"
```

Use the phone number of a real member (URL-encoded, `+` = `%2B`). It returns
`{ "reply": "..." }`. This runs the full agent against live data without needing
Twilio — great for iterating on tool behavior and copy.

## What it can answer (current tools)

- `find_person` — resolve a name (handles ambiguity).
- `person_next_visit` — someone's upcoming stays.
- `whos_here` — families at Martis in a date range (optionally favorites only).
- `list_favorites` — the asker's favorites.
- `upcoming_gatherings` — get-togethers the asker can see.

Add a tool by extending the `TOOLS` array and the `execute()` switch in
`api/_lib/agent.js` plus a query in `api/_lib/db.js`.

## Cost

Each question is ~2–4 short model calls (the tool loop). On `claude-haiku-4-5`
that's well under a cent per question; `claude-opus-4-8` is higher but the best
quality. Flip via `WHATSAPP_AGENT_MODEL`.

## Not in v1 (easy follow-ups)

- **Conversation memory** — replies are currently single-turn (no "what about next
  weekend?" follow-through). Add a short per-number history store to enable it.
- **Rate limiting** — add a per-number limiter (cost/abuse guard).
- **Outbound/proactive** messages (e.g. "a favorite just marked this weekend") —
  would need approved WhatsApp templates outside the 24h window.
