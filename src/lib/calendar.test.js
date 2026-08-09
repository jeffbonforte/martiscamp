import { describe, it, expect } from 'vitest';
import {
  buildWeekendDays, dateKey, sameDay, addMonths, monthMatrix, nextMonths,
  parseWhen, eventStart, isPastEvent, eventDate, buildICS,
  windowDay, windowKeysFor,
} from './calendar.js';

// buildWeekendDays / eventDate / isPastEvent all accept the current date as an
// argument, so nothing here depends on when the suite runs.

describe('dateKey', () => {
  it('formats local dates as YYYY-MM-DD with padding', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  // dateKey reads local getFullYear/getMonth/getDate rather than toISOString,
  // which would shift the day for anyone west of UTC. This is the attendance
  // key, so a one-day drift would silently mark the wrong night.
  it('does not drift for a late-evening local time', () => {
    expect(dateKey(new Date(2026, 7, 15, 23, 59))).toBe('2026-08-15');
  });
});

// The pickers toggle by weekday key ('fri') while attendance is stored by ISO
// date, so these two carry the bridge between them.
describe('windowDay / windowKeysFor', () => {
  const days = buildWeekendDays([], new Date(2026, 6, 24)); // Fri 2026-07-24

  it('maps a weekday key to its window entry', () => {
    expect(windowDay(days, 'sun').iso).toBe('2026-07-26');
    expect(windowDay(days, 'fri').iso).toBe('2026-07-24'); // today, not next week
  });

  it('returns null for a key outside the window and for empty input', () => {
    expect(windowDay(buildWeekendDays([], new Date(2026, 6, 24)).slice(0, 3), 'thu')).toBeNull();
    expect(windowDay(undefined, 'fri')).toBeNull();
  });

  it('maps ISO dates back to keys, in window order, ignoring dates outside it', () => {
    expect(windowKeysFor(days, ['2026-07-26', '2026-07-24'])).toEqual(['fri', 'sun']);
    // A date planned months out must not register as a window day — this is what
    // keeps the optimistic presence patch from inventing a key.
    expect(windowKeysFor(days, ['2026-11-03'])).toEqual([]);
    expect(windowKeysFor(days, [])).toEqual([]);
    expect(windowKeysFor(days, undefined)).toEqual([]);
  });
});

describe('buildWeekendDays', () => {
  it('returns 7 consecutive days starting today', () => {
    const days = buildWeekendDays([], new Date(2026, 6, 24)); // Fri 2026-07-24
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.iso)).toEqual([
      '2026-07-24', '2026-07-25', '2026-07-26', '2026-07-27',
      '2026-07-28', '2026-07-29', '2026-07-30',
    ]);
    expect(days.map((d) => d.key)).toEqual(['fri', 'sat', 'sun', 'mon', 'tue', 'wed', 'thu']);
    expect(days[0].label).toBe('Fri');
    expect(days[0].sub).toBe(24);
  });

  it('rolls across a month boundary', () => {
    const days = buildWeekendDays([], new Date(2026, 6, 29)); // Wed 2026-07-29
    expect(days[2].iso).toBe('2026-07-31');
    expect(days[3].iso).toBe('2026-08-01');
    expect(days[6].iso).toBe('2026-08-04');
  });

  it('rolls across a year boundary', () => {
    const days = buildWeekendDays([], new Date(2026, 11, 30));
    expect(days[1].iso).toBe('2026-12-31');
    expect(days[2].iso).toBe('2027-01-01');
  });

  // DST fall-back (2026-11-01) is the transition that actually breaks a naive
  // +86_400_000ms step: that day has 25 hours, so fixed-ms arithmetic lands on
  // 2026-11-01 twice and drops the last day of the window. Stepping by calendar
  // day (setDate) is immune. Spring-forward is NOT a sufficient test — it only
  // shifts the clock an hour, and midnight+1h is still the same date.
  // These require TZ=America/Los_Angeles (pinned in the npm test script);
  // on a UTC runner there is no transition and the assertion proves nothing.
  it('produces distinct days across DST fall-back', () => {
    const isos = buildWeekendDays([], new Date(2026, 9, 30)).map((d) => d.iso);
    expect(new Set(isos).size).toBe(7);
    expect(isos).toEqual([
      '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02',
      '2026-11-03', '2026-11-04', '2026-11-05',
    ]);
  });

  it('produces distinct days across DST spring-forward', () => {
    const isos = buildWeekendDays([], new Date(2026, 2, 6)).map((d) => d.iso);
    expect(new Set(isos).size).toBe(7);
    expect(isos).toEqual([
      '2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09',
      '2026-03-10', '2026-03-11', '2026-03-12',
    ]);
  });

  it('falls back to a default weather block', () => {
    const days = buildWeekendDays([], new Date(2026, 6, 24));
    expect(days[0].wx).toEqual({ hi: 70, lo: 40, icon: 'sun', cond: 'Clear' });
  });

  it('uses supplied fallback weather when present', () => {
    const wx = [{ wx: { hi: 88, lo: 52, icon: 'cloud', cond: 'Partly cloudy' } }];
    const days = buildWeekendDays(wx, new Date(2026, 6, 24));
    expect(days[0].wx.hi).toBe(88);
    expect(days[1].wx.hi).toBe(70); // index 1 has no fallback → default
  });
});

describe('sameDay / addMonths / nextMonths', () => {
  it('compares calendar days, ignoring time', () => {
    expect(sameDay(new Date(2026, 6, 24, 1), new Date(2026, 6, 24, 23))).toBe(true);
    expect(sameDay(new Date(2026, 6, 24), new Date(2026, 6, 25))).toBe(false);
  });

  it('adds months across a year boundary', () => {
    expect(dateKey(addMonths(new Date(2026, 11, 15), 1))).toBe('2027-01-01');
  });

  it('lists forward months', () => {
    expect(nextMonths(new Date(2026, 10, 15), 3)).toEqual([
      { year: 2026, month: 10 }, { year: 2026, month: 11 }, { year: 2027, month: 0 },
    ]);
  });
});

describe('monthMatrix', () => {
  it('returns a 6x7 grid padded from the preceding Sunday', () => {
    const weeks = monthMatrix(2026, 7); // August 2026; the 1st is a Saturday
    expect(weeks).toHaveLength(6);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(dateKey(weeks[0][0].date)).toBe('2026-07-26'); // Sunday before
    expect(weeks[0][0].inMonth).toBe(false);
    expect(dateKey(weeks[0][6].date)).toBe('2026-08-01');
    expect(weeks[0][6].inMonth).toBe(true);
  });

  it('flags trailing days as out of month', () => {
    const weeks = monthMatrix(2026, 7);
    const last = weeks[5][6];
    expect(last.inMonth).toBe(false);
  });
});

describe('parseWhen', () => {
  it('parses the design-system when string', () => {
    const d = parseWhen('Sat, Aug 15 · 8:30 AM', 2026);
    expect(dateKey(d)).toBe('2026-08-15');
    expect(d.getHours()).toBe(8);
    expect(d.getMinutes()).toBe(30);
  });

  it('converts PM to 24-hour', () => {
    expect(parseWhen('Sat, Aug 15 · 6:30 PM', 2026).getHours()).toBe(18);
  });

  it('handles the midnight and noon edge cases', () => {
    expect(parseWhen('Sat, Aug 15 · 12:00 AM', 2026).getHours()).toBe(0);
    expect(parseWhen('Sat, Aug 15 · 12:00 PM', 2026).getHours()).toBe(12);
  });

  // The time is a free-text field. A bare "p" was previously ignored, leaving
  // the hour at 6 — an evening dinner became a 6:30 AM one, dropped off the
  // lists before lunch, and exported to calendars 12 hours early.
  it('accepts the shorthand people actually type', () => {
    for (const t of ['6:30 PM', '6:30pm', '6:30p', '6:30 p', '6:30PM', '6:30 p.m.', '6:30P.M.']) {
      expect(parseWhen(`Sat, Aug 15 · ${t}`, 2026).getHours(), t).toBe(18);
    }
    for (const t of ['8:30 AM', '8:30am', '8:30a', '8:30 a.m.']) {
      expect(parseWhen(`Sat, Aug 15 · ${t}`, 2026).getHours(), t).toBe(8);
    }
  });

  it('leaves a bare hour alone rather than guessing', () => {
    // No meridiem is genuinely ambiguous — 8:30 golf is morning, 6:30 dinner
    // is evening. Take it literally instead of inventing an intent.
    expect(parseWhen('Sat, Aug 15 · 6:30', 2026).getHours()).toBe(6);
  });

  it('returns null when unparseable', () => {
    expect(parseWhen('')).toBeNull();
    expect(parseWhen(null)).toBeNull();
    expect(parseWhen('sometime soon')).toBeNull();
    expect(parseWhen('Sat, Zzz 15 · 8:30 AM', 2026)).toBeNull();
  });

  it('pins to the year it is given', () => {
    expect(dateKey(parseWhen('Fri, Jan 2 · 9:00 AM', 2027))).toBe('2027-01-02');
  });
});

describe('eventStart / isPastEvent', () => {
  const event = { when: 'Sat, Aug 15 · 6:30 PM' };

  it('resolves a start time in the current year', () => {
    expect(dateKey(eventStart(event, new Date(2026, 0, 1)))).toBe('2026-08-15');
  });

  it('is still upcoming during the event', () => {
    expect(isPastEvent(event, new Date(2026, 7, 15, 20, 0))).toBe(false); // 1.5h in
  });

  // The old rule archived 3h after the start, so a 6:30 dinner vanished at 9:30
  // while people were still at it. It stays up for the whole day now.
  it('is still upcoming late the same evening', () => {
    expect(isPastEvent(event, new Date(2026, 7, 15, 23, 59))).toBe(false);
  });

  it('is upcoming all day, even hours before it starts', () => {
    expect(isPastEvent(event, new Date(2026, 7, 15, 6, 0))).toBe(false);
  });

  it('is past at midnight, once the day is over', () => {
    expect(isPastEvent(event, new Date(2026, 7, 16, 0, 0))).toBe(true);
    expect(isPastEvent(event, new Date(2026, 7, 16, 9, 0))).toBe(true);
  });

  // The reported bug, end to end: a get-together entered as "6:30p" today
  // disappeared from the lists before noon.
  it('keeps a "6:30p" event visible the same morning', () => {
    const evening = { when: 'Sat, Aug 15 · 6:30p' };
    expect(isPastEvent(evening, new Date(2026, 7, 15, 11, 30))).toBe(false);
    expect(eventStart(evening, new Date(2026, 7, 15)).getHours()).toBe(18);
  });

  // An event whose time we cannot read must never silently vanish from the
  // Get-togethers tab — better to show a stale item than to hide a real one.
  it('never auto-hides an unparseable event', () => {
    expect(isPastEvent({ when: 'this weekend' }, new Date(2026, 11, 31))).toBe(false);
    expect(isPastEvent({}, new Date(2026, 11, 31))).toBe(false);
  });
});

describe('eventDate', () => {
  it('reads the calendar date, ignoring the time', () => {
    const d = eventDate({ when: 'Sat, Aug 15 · 6:30 PM' }, new Date(2026, 0, 1));
    expect(dateKey(d)).toBe('2026-08-15');
    expect(d.getHours()).toBe(0);
  });

  it('returns null without a date', () => {
    expect(eventDate({ when: 'soon' }, new Date(2026, 0, 1))).toBeNull();
    expect(eventDate({}, new Date(2026, 0, 1))).toBeNull();
  });
});

describe('buildICS', () => {
  it('emits a VEVENT with CRLF line endings and a 2h default duration', () => {
    const ics = buildICS({
      id: 'golf-sat', title: 'Golf', when: 'Sat, Aug 15 · 8:30 AM', where: 'The Camp',
    });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('UID:golf-sat@martiscampfamilies');
    expect(ics).toContain('DTSTART:20260815T083000');
    expect(ics).toContain('DTEND:20260815T103000');
    expect(ics).toContain('\r\n');
  });

  it('escapes characters that would break the ICS grammar', () => {
    const ics = buildICS({
      id: 'x', title: 'Dinner, drinks; then games', when: 'Sat, Aug 15 · 6:30 PM',
      description: 'line one\nline two',
    });
    expect(ics).toContain('SUMMARY:Dinner\\, drinks\\; then games');
    expect(ics).toContain('DESCRIPTION:line one\\nline two');
  });
});
