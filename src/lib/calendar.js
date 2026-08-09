// Calendar + ICS helpers: month-grid generation for the 12-month look-ahead and
// the Plan-a-visit view, plus add-to-calendar link/file generation for
// get-togethers.

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * The app's rolling 7-day look-ahead, generated from the current date (not a
 * frozen prototype week). Each entry carries a real Date so every screen can
 * derive labels/positions without hardcoding a year or month. `fallbackWx` is
 * an optional per-index array of offline weather blocks; live weather overlays
 * temps on top (see lib/weather.js).
 */
export function buildWeekendDays(fallbackWx = [], today = new Date()) {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    return {
      key: WEEKDAY_KEYS[date.getDay()],
      label: WEEKDAYS[date.getDay()],
      sub: date.getDate(),
      date,
      iso: dateKey(date),
      wx: (fallbackWx[i] && fallbackWx[i].wx) || { hi: 70, lo: 40, icon: 'sun', cond: 'Clear' },
    };
  });
}

export function seasonOf(date) {
  const m = date.getMonth();
  if (m <= 1 || m === 11) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'fall';
}

/**
 * Ski season at Martis Camp / Northstar runs roughly Oct 1 – Apr 30, so the snow
 * report is relevant across fall, winter, and spring — not just meteorological
 * winter. Months: Oct(9) Nov(10) Dec(11) Jan(0) Feb(1) Mar(2) Apr(3).
 */
export function isSkiSeason(date = new Date()) {
  const m = date.getMonth();
  return m >= 9 || m <= 3;
}

/** ISO date key (YYYY-MM-DD) in local time — the attendance key. */
export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * The rolling-window entry for a weekday key ('fri'), or null. AttendancePicker
 * toggles by weekday key while attendance is stored by ISO date, so every
 * picker needs this bridge.
 */
export const windowDay = (weekendDays, key) => (weekendDays || []).find((d) => d.key === key) || null;

/** Weekday keys for whichever of `isoDates` fall inside the rolling window. */
export const windowKeysFor = (weekendDays, isoDates) => {
  const set = new Set(isoDates || []);
  return (weekendDays || []).filter((d) => set.has(d.iso)).map((d) => d.key);
};

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

/**
 * A 6×7 matrix of Date cells for a given year/month, padded with the trailing/
 * leading days of adjacent months. Each cell = { date, inMonth }.
 */
export function monthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay()); // back up to Sunday
  const weeks = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      row.push({ date: new Date(cursor), inMonth: cursor.getMonth() === month });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(row);
  }
  return weeks;
}

/** Build the list of the next `count` months starting from `from` (a Date). */
export function nextMonths(from, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = addMonths(new Date(from.getFullYear(), from.getMonth(), 1), i);
    out.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return out;
}

// ---- Get-together date parsing + calendar export -------------------------

// The `when` strings look like "Sat, Jul 12 · 8:30 AM" (no year). Parse best-
// effort into a real Date. Without an explicit `defaultYear`, use the current
// year and roll to next year if the month/day has already passed, so add-to-
// calendar always lands on the upcoming occurrence. Returns null if unparseable.
export function parseWhen(when, defaultYear) {
  if (!when) return null;
  // The time is a free-text field, so accept how people actually write it:
  // "6:30 PM", "6:30pm", "6:30p", "6:30 p.m." — the meridiem is one letter plus
  // optional punctuation and "m". Requiring the full "PM" silently dropped a
  // bare "p" and left the hour at 6, turning an evening dinner into a 6:30 AM
  // one — which then read as long past and vanished from the lists.
  const m = when.match(/([A-Z][a-z]{2})\s+(\d{1,2}).*?(\d{1,2}):(\d{2})\s*(?:([AP])\.?\s*M?\.?)?/i);
  if (!m) return null;
  const [, mon, day, hh, mm, ap] = m;
  const monIdx = MONTHS_SHORT.findIndex((x) => x.toLowerCase() === mon.toLowerCase());
  if (monIdx < 0) return null;
  let hour = parseInt(hh, 10);
  if (ap) {
    const isPm = ap.toUpperCase() === 'P';
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
  }
  const now = new Date();
  const year = defaultYear ?? now.getFullYear();
  let dt = new Date(year, monIdx, parseInt(day, 10), hour, parseInt(mm, 10));
  if (defaultYear == null && dt.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
    dt = new Date(year + 1, monIdx, parseInt(day, 10), hour, parseInt(mm, 10)); // already passed → next year
  }
  return dt;
}

/** Real start Date for a get-together / event from its `when` string. Pinned to
 *  the current year (no next-year roll) so a past occurrence reads as past. */
export function eventStart(item, now = new Date()) {
  return parseWhen(item && item.when, now.getFullYear());
}

/**
 * True once the DAY an item falls on is over — it drops off the lists at
 * midnight, not a few hours after it starts.
 *
 * This used to archive 3 hours past the start time, which meant tonight's 6:30
 * dinner disappeared at 9:30 while people were still at it, and anything whose
 * time didn't parse cleanly vanished mid-morning. A get-together is today's
 * plan for all of today.
 */
export function isPastEvent(item, now = new Date()) {
  const start = eventStart(item, now);
  if (!start) return false; // unparseable time → never auto-hide
  const endOfThatDay = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return now.getTime() >= endOfThatDay.getTime();
}

// Parse just the calendar date (ignoring any time) from a when_label like
// "Sat, Aug 15 · 8:30 AM" — so a get-together lands on the month grid on its
// real date, any month ahead (not only the rolling 7-day window). Pinned to the
// current year. Null if unparseable.
export function eventDate(item, now = new Date()) {
  const when = item && item.when;
  if (!when) return null;
  const m = String(when).match(/([A-Z][a-z]{2})\s+(\d{1,2})/); // first "Mon 15" (skips the weekday, which has a comma)
  if (!m) return null;
  const monIdx = MONTHS_SHORT.findIndex((x) => x.toLowerCase() === m[1].toLowerCase());
  if (monIdx < 0) return null;
  return new Date(now.getFullYear(), monIdx, parseInt(m[2], 10));
}

function toICSStamp(date) {
  // Local-time floating value (no Z) — calendars interpret in the user's tz.
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}T${p(date.getHours())}${p(date.getMinutes())}00`;
}

function icsEscape(s = '') {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Build a minimal VCALENDAR string for one get-together. */
export function buildICS(event) {
  const start = parseWhen(event.when) || new Date();
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default 2h
  const uid = `${(event.id || 'event')}@martiscampfamilies`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Martis Camp Families//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${toICSStamp(start)}`,
    `DTEND:${toICSStamp(end)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `LOCATION:${icsEscape(event.where || 'Martis Camp')}`,
    `DESCRIPTION:${icsEscape(event.description || '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function gcalStamp(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}T${p(date.getHours())}${p(date.getMinutes())}00`;
}

export function googleCalUrl(event) {
  const start = parseWhen(event.when) || new Date();
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || 'Get-together',
    dates: `${gcalStamp(start)}/${gcalStamp(end)}`,
    details: event.description || '',
    location: event.where || 'Martis Camp',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookUrl(event) {
  const start = parseWhen(event.when) || new Date();
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title || 'Get-together',
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: event.description || '',
    location: event.where || 'Martis Camp',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Trigger a client-side download of the .ics file for an event. */
export function downloadICS(event) {
  const blob = new Blob([buildICS(event)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(event.id || 'event')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
