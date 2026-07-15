// Date helpers for the WhatsApp agent. Martis Camp is Pacific time; all "today"
// / "this weekend" reasoning is done in that zone so the agent matches how the
// web app and the members think about dates.

const TZ = 'America/Los_Angeles';
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 86400000;

/** Today at Martis, as "YYYY-MM-DD". */
export function todayISO() {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** Day of week (0=Sun … 6=Sat) for a "YYYY-MM-DD" string. */
export function weekdayOf(iso) {
  return new Date(iso + 'T12:00:00Z').getUTCDay();
}

export function addDaysISO(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The upcoming (or current) Fri–Sun weekend as { start, end } ISO strings. */
export function upcomingWeekend(fromISO = todayISO()) {
  const dow = weekdayOf(fromISO); // 0 Sun … 6 Sat
  // If it's already Fri(5)/Sat(6)/Sun(0), we're in the weekend — anchor to this one.
  let toFriday;
  if (dow === 5) toFriday = 0;
  else if (dow === 6) toFriday = -1;
  else if (dow === 0) toFriday = -2;
  else toFriday = 5 - dow; // Mon..Thu → this coming Friday
  const start = addDaysISO(fromISO, toFriday);
  const end = addDaysISO(start, 2); // Fri + 2 = Sun
  return { start, end };
}

/** Human label for a "YYYY-MM-DD" string, e.g. "Sat, Aug 15". */
export function labelISO(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric',
  });
}

/** "Aug 15" style short label. */
export function shortISO(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
}

/** Format a run of dates as a readable range: "Aug 15" or "Aug 15 – 18" / "Jul 30 – Aug 3". */
export function rangeLabel(startISO, endISO) {
  if (startISO === endISO) return shortISO(startISO);
  const a = new Date(startISO + 'T12:00:00Z');
  const b = new Date(endISO + 'T12:00:00Z');
  if (a.getUTCMonth() === b.getUTCMonth()) return `${shortISO(startISO)}–${b.getUTCDate()}`;
  return `${shortISO(startISO)} – ${shortISO(endISO)}`;
}

/**
 * Collapse a set of "YYYY-MM-DD" dates into contiguous stays, merging gaps of a
 * single night (so a family that skips one Wednesday still reads as one visit).
 * Returns [{ start, end, days }] sorted ascending.
 */
export function groupStays(dates, mergeGapDays = 1) {
  const uniq = [...new Set(dates)].filter(Boolean).sort();
  const stays = [];
  for (const iso of uniq) {
    const last = stays[stays.length - 1];
    if (last) {
      const gap = Math.round((new Date(iso + 'T12:00:00Z') - new Date(last.end + 'T12:00:00Z')) / DAY_MS);
      if (gap >= 1 && gap <= mergeGapDays + 1) { last.end = iso; last.days += 1; continue; }
    }
    stays.push({ start: iso, end: iso, days: 1 });
  }
  return stays;
}

/**
 * Parse the real date out of a get-together's `when_label` ("Sat, Aug 15 · 6:30 PM"),
 * pinned to the current year. Returns "YYYY-MM-DD" or null.
 */
export function eventDateISO(whenLabel, year = Number(todayISO().slice(0, 4))) {
  const m = String(whenLabel || '').match(/([A-Z][a-z]{2})\s+(\d{1,2})/); // first "Mon 15" (skips the weekday, which has a comma)
  if (!m) return null;
  const monIdx = MONTHS_SHORT.findIndex((x) => x.toLowerCase() === m[1].toLowerCase());
  if (monIdx < 0) return null;
  return `${year}-${String(monIdx + 1).padStart(2, '0')}-${String(parseInt(m[2], 10)).padStart(2, '0')}`;
}
