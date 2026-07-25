// The handful of dates a Martis household actually plans around. Used to give
// the WhatsApp assistant one concrete, well-timed thing to ask about ("are you
// up for Thanksgiving?") instead of nagging generically about the calendar.
//
// Pure date math, no I/O — every function takes the dates it needs, so this is
// fully testable and has no notion of "now" beyond what it's handed.

const DAY_MS = 86400000;

const iso = (d) => d.toISOString().slice(0, 10);
const at = (isoStr) => new Date(isoStr + 'T12:00:00Z'); // noon anchor, as in dates.js
const shift = (isoStr, n) => { const d = at(isoStr); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

/** ISO date of the `n`th `weekday` (0=Sun…6=Sat) in a month. month is 0-based. */
export function nthWeekday(year, month, weekday, n) {
  const first = new Date(Date.UTC(year, month, 1, 12));
  const delta = (weekday - first.getUTCDay() + 7) % 7;
  return iso(new Date(Date.UTC(year, month, 1 + delta + (n - 1) * 7, 12)));
}

/** ISO date of the last `weekday` in a month. month is 0-based. */
export function lastWeekday(year, month, weekday) {
  const last = new Date(Date.UTC(year, month + 1, 0, 12)); // day 0 of next month
  const delta = (last.getUTCDay() - weekday + 7) % 7;
  return iso(new Date(Date.UTC(year, month + 1, 0 - delta, 12)));
}

/**
 * The occasions in a given year, each as an inclusive { start, end } window
 * covering how people actually travel — a long weekend, not the single day.
 */
export function occasionsFor(year) {
  const thanksgiving = nthWeekday(year, 10, 4, 4);        // 4th Thursday in November
  const mlk          = nthWeekday(year, 0, 1, 3);         // 3rd Monday in January
  const presidents   = nthWeekday(year, 1, 1, 3);         // 3rd Monday in February
  const memorial     = lastWeekday(year, 4, 1);           // last Monday in May
  const labor        = nthWeekday(year, 8, 1, 1);         // 1st Monday in September
  const julyFourth   = `${year}-07-04`;

  // Long weekends run Friday through the Monday holiday.
  const longWeekend = (mondayISO) => ({ start: shift(mondayISO, -3), end: mondayISO });

  return [
    { key: 'mlk',          name: 'MLK weekend',        ...longWeekend(mlk) },
    { key: 'presidents',   name: "Presidents' Day weekend", ...longWeekend(presidents) },
    { key: 'memorial',     name: 'Memorial Day weekend',    ...longWeekend(memorial) },
    { key: 'july4',        name: 'the Fourth of July',
      start: shift(julyFourth, -2), end: shift(julyFourth, 2) },
    { key: 'labor',        name: 'Labor Day weekend',       ...longWeekend(labor) },
    { key: 'thanksgiving', name: 'Thanksgiving',
      start: shift(thanksgiving, -1), end: shift(thanksgiving, 3) }, // Wed–Sun
    { key: 'christmas',    name: 'the holidays',
      start: `${year}-12-24`, end: `${year + 1}-01-01` },
  ].sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * The next occasion starting within `withinDays` of `todayISO`, or null.
 * Spans the year boundary, so late December still finds MLK in January.
 * An occasion already under way counts — someone mid-Thanksgiving can still be
 * asked about the rest of the weekend.
 */
export function nextOccasion(todayISO, withinDays = 70) {
  const year = Number(todayISO.slice(0, 4));
  const horizon = iso(new Date(at(todayISO).getTime() + withinDays * DAY_MS));
  return [...occasionsFor(year), ...occasionsFor(year + 1)]
    .filter((o) => o.end >= todayISO && o.start <= horizon)
    .sort((a, b) => a.start.localeCompare(b.start))[0] || null;
}
