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
| `WHATSAPP_AGENT_MODEL` | Override the model. Default `claude-opus-5`; set `claude-haiku-4-5` for ~5× lower cost | – |
| `WHATSAPP_AGENT_EFFORT` | Reasoning effort: `low` (default), `medium`, `high`. Raise if answers get shallow | – |
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

Read-only:

- `find_person` — resolve a name (handles ambiguity).
- `person_next_visit` — someone's upcoming stays.
- `whos_here` — families at Martis in a date range (optionally favorites only).
- `list_favorites` — the asker's favorites.
- `upcoming_gatherings` — get-togethers the asker can see.
- `get_weather` — 7-day Truckee forecast + snow report. Uses the same
  `api/_openmeteo.js` helper as the web app, so the bot and the site can't
  disagree about the forecast.
- `my_days` — the asker's own upcoming days, so it never offers to add
  something already on their calendar.

Write:

- `mark_days` — puts days on the asker's Martis calendar.
- `remove_days` — takes days off it.
- `rsvp_to_event` — records the asker's answer to a get-together.

Add a tool by extending the `TOOLS` array and the `execute()` switch in
`api/_lib/agent.js` plus a query in `api/_lib/db.js`.

## Changing the calendar

These are the only things the assistant can change, so the limits live in code
(`validateRange()` / `household()` in `api/_lib/agent.js`), not in the prompt —
a prompt rule is a suggestion, a range check is a fact:

- **Whole household, always.** Both tools resolve every non-archived member of
  the *texter's own* family. There is no parameter for anyone else, so no
  amount of prompting reaches another family.
- **Future only**, and no more than 400 days out — history can't be rewritten.
- **60 nights maximum** per call.
- **Removal reports rows, not intent.** `unmarkAttendance` returns how many rows
  it actually deleted, so the assistant can't claim it cleared a week that was
  never marked.

The prompt separately requires it to say the dates back and get a clear yes
before calling either tool. That's the conversational half; the above is the
enforcement half.

> **Removal is the one destructive path and there is no undo.** A misparsed date
> silently deletes a real plan and nobody finds out until they arrive. The
> guards above bound the blast radius to future days in the caller's own
> household; the confirmation step is what prevents the wrong dates inside it.
> Fiddly per-person edits still belong in the app's Plan-a-visit screen —
> whole-household is the only granularity over text.

## RSVPs

`rsvp_to_event` records the texter's own answer (`going` / `maybe` / `declined`)
to a get-together they can see, keyed by the `id` returned from
`upcoming_gatherings`.

**The visibility check is in `setRsvp()`, not in RLS.** This file uses the
service-role key and bypasses RLS entirely, so the `can_see_event` policy that
protects the web app does nothing here. Without the explicit check, a member
could RSVP their way into a private event they were never invited to. Private
events require the caller to be the host or hold an `event_invites` row.

## Outbound invites

When someone is added to a private get-together they get a WhatsApp message,
and their reply lands in a normal conversation with the assistant — which can
then record the RSVP via `rsvp_to_event`.

**Everything else in this codebase replies to an inbound message.** This is the
one path that starts a conversation, and WhatsApp only permits that outside a
24-hour window via a **Meta-approved content template** — free-form text is
silently useless. So `api/_lib/twilio.js` sends through Twilio's Content API
with a template SID and positional variables, never a raw body.

**The template** (Twilio Console → Content Template Builder, category
*Utility*), whose SID goes in `TWILIO_INVITE_CONTENT_SID`:

```
You're invited: {{1}} added you to {{2}} on {{3}}. Reply here to RSVP or ask about it.
```

`{{1}}` host name · `{{2}}` event title · `{{3}}` when. It opens and closes with
real text rather than a variable, which Meta rejects less often.

> ⚠️ **Having an `HX` SID does not mean the template can be sent.** Twilio issues
> the SID as soon as you create the content template; WhatsApp approval is a
> separate submission that happens afterwards. Check **Channel eligibility** on
> the template row:
>
> - **WhatsApp user initiated** — only usable *inside* the 24-hour window
> - **WhatsApp business initiated** — what this feature needs, and the one that
>   requires Meta's review
>
> Sending while only *user initiated* is green fails with **63016 "Outside
> messaging window"**, because Twilio can't apply the template and falls back to
> a freeform message. The error names the window, not the template, which sends
> you looking in the wrong place. Confirm the business-initiated badge is green
> before debugging anything else.

**The trigger is a Supabase Database Webhook**, not the browser — that catches
invites however they're created (the Host dialog today, admin SQL tomorrow) and
keeps the secret off the client:

> Supabase → Database → Webhooks → new webhook
> · table `public.event_invites` · events `INSERT`
> · HTTP Request → `POST https://martis.camp/api/notify-invite`
> · header `x-webhook-secret: <INVITE_WEBHOOK_SECRET>`

The endpoint also accepts `{ event_id, member_id }` directly, for testing or to
backfill an invite created before this existed.

**Not sent** — each of these returns 200, not an error, because a webhook that
500s gets retried and none of them improve on retry: archived event, archived
member, host inviting themselves, no usable phone, already notified.

**Idempotency is a claim, not a check.** `claimNotification` inserts into
`wa_notifications` first and relies on the unique index over
`(member_id, kind, dedupe_key)`; a second caller loses the insert and stops.
Check-then-send would race two concurrent fires into two texts.

A send that fails leaves the claim row with `error` set. It is deliberately not
retried — a rare missed text beats a retry storm, and the host can see RSVPs in
the app regardless. Find them with:

```sql
select * from public.wa_notifications where error is not null order by sent_at desc;
```

Requires `0016_wa_notifications.sql`.

## Nudges

To encourage people to keep their days current, the assistant may raise the next
occasion households actually plan around — Thanksgiving, the holidays, MLK,
Presidents' Day, Memorial Day, the Fourth, Labor Day (`api/_lib/occasions.js`).

It only comes up when **all** of these hold, and all are decided in code before
the model sees anything:

1. An occasion starts within 70 days.
2. That member has nothing marked in its window.
3. They haven't been nudged in the last 7 days (`wa_conversations.last_nudge_at`).

The cooldown is burned when the nudge is *offered*, not when it succeeds — a
crash costs one missed nudge rather than risking a loop that asks every message.
The model is told to raise it once, at the end, only after answering the actual
question, and to drop it if brushed off.

Requires `supabase/migrations/0015_wa_conversations.sql` for the
`last_nudge_at` column. Without it, nudging still works but isn't throttled.

## Cost

Each question is ~2–4 short model calls (the tool loop). On `claude-haiku-4-5`
that's well under a cent per question; `claude-opus-5` is higher but the best
quality. Flip via `WHATSAPP_AGENT_MODEL`.

The agent runs at `effort: 'low'` — these are short lookups over five fixed
tools, and Opus 5 holds up well at the low end, so it keeps per-text latency and
cost down. `max_tokens` is 2000 because on Opus 5 that budget covers thinking
*and* the reply; the prompt's style rules are what keep the actual text short.

## Not in v1 (easy follow-ups)

- **Conversation memory** — replies are currently single-turn (no "what about next
  weekend?" follow-through). Add a short per-number history store to enable it.
- **Rate limiting** — add a per-number limiter (cost/abuse guard).
- **Outbound/proactive** messages (e.g. "a favorite just marked this weekend") —
  would need approved WhatsApp templates outside the 24h window.
