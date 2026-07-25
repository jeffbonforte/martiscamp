import { describe, it, expect } from 'vitest';
import {
  weekdayOf, addDaysISO, upcomingWeekend, labelISO, shortISO,
  rangeLabel, groupStays, eventDateISO,
} from './dates.js';

// Every function here takes its "today" as an argument, so these tests pin real
// dates rather than depending on when they run. Anchors used below (verified,
// not assumed): 2026-07-20 Mon, 07-22 Wed, 07-24 Fri, 07-26 Sun, 08-01 Sat.

describe('weekdayOf', () => {
  it('reads the weekday of an ISO date', () => {
    expect(weekdayOf('2026-07-26')).toBe(0); // Sunday
    expect(weekdayOf('2026-07-24')).toBe(5); // Friday
    expect(weekdayOf('2026-08-01')).toBe(6); // Saturday
  });
});

describe('addDaysISO', () => {
  it('adds days within a month', () => {
    expect(addDaysISO('2026-07-20', 4)).toBe('2026-07-24');
  });

  it('crosses a month boundary', () => {
    expect(addDaysISO('2026-07-30', 3)).toBe('2026-08-02');
  });

  it('crosses a year boundary', () => {
    expect(addDaysISO('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('goes backwards', () => {
    expect(addDaysISO('2026-08-01', -1)).toBe('2026-07-31');
  });

  it('handles a leap day', () => {
    expect(addDaysISO('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysISO('2028-02-29', 1)).toBe('2028-03-01');
  });
});

describe('upcomingWeekend', () => {
  it('finds the coming weekend from a weekday', () => {
    expect(upcomingWeekend('2026-07-22')).toEqual({ start: '2026-07-24', end: '2026-07-26' });
    expect(upcomingWeekend('2026-07-20')).toEqual({ start: '2026-07-24', end: '2026-07-26' });
  });

  // The interesting half: mid-weekend, "this weekend" must mean the one you are
  // standing in, not the next one. A member texting on Saturday asking who's
  // around should not get next Friday's answer.
  it('anchors to the current weekend on Fri/Sat/Sun', () => {
    expect(upcomingWeekend('2026-07-24')).toEqual({ start: '2026-07-24', end: '2026-07-26' }); // Fri
    expect(upcomingWeekend('2026-07-25')).toEqual({ start: '2026-07-24', end: '2026-07-26' }); // Sat
    expect(upcomingWeekend('2026-07-26')).toEqual({ start: '2026-07-24', end: '2026-07-26' }); // Sun
  });

  it('spans a month boundary', () => {
    expect(upcomingWeekend('2026-08-01')).toEqual({ start: '2026-07-31', end: '2026-08-02' }); // Sat
  });

  it('spans a year boundary', () => {
    expect(upcomingWeekend('2026-12-30')).toEqual({ start: '2027-01-01', end: '2027-01-03' }); // Wed
  });
});

describe('labelISO / shortISO', () => {
  it('formats without drifting a day across timezones', () => {
    // Parsed at noon UTC precisely so a negative-offset runner can't roll back
    // to the 14th. This is the bug the noon anchor exists to prevent.
    expect(labelISO('2026-08-15')).toBe('Sat, Aug 15');
    expect(shortISO('2026-08-15')).toBe('Aug 15');
  });
});

describe('rangeLabel', () => {
  it('collapses a single day', () => {
    expect(rangeLabel('2026-08-15', '2026-08-15')).toBe('Aug 15');
  });

  it('abbreviates within one month', () => {
    expect(rangeLabel('2026-08-01', '2026-08-04')).toBe('Aug 1–4');
  });

  it('spells out both ends across months', () => {
    expect(rangeLabel('2026-07-30', '2026-08-03')).toBe('Jul 30 – Aug 3');
  });
});

describe('groupStays', () => {
  it('returns nothing for no dates', () => {
    expect(groupStays([])).toEqual([]);
  });

  it('treats consecutive days as one stay', () => {
    expect(groupStays(['2026-08-01', '2026-08-02', '2026-08-03']))
      .toEqual([{ start: '2026-08-01', end: '2026-08-03', days: 3 }]);
  });

  // The whole point of the helper: a family that skips one night still reads as
  // a single visit rather than two.
  it('merges a one-night gap', () => {
    expect(groupStays(['2026-08-01', '2026-08-03']))
      .toEqual([{ start: '2026-08-01', end: '2026-08-03', days: 2 }]);
  });

  it('splits on a two-night gap', () => {
    expect(groupStays(['2026-08-01', '2026-08-04'])).toEqual([
      { start: '2026-08-01', end: '2026-08-01', days: 1 },
      { start: '2026-08-04', end: '2026-08-04', days: 1 },
    ]);
  });

  it('sorts and de-duplicates its input', () => {
    expect(groupStays(['2026-08-02', '2026-08-01', '2026-08-02']))
      .toEqual([{ start: '2026-08-01', end: '2026-08-02', days: 2 }]);
  });

  it('counts nights marked, not calendar span', () => {
    // 1st, 3rd, 5th: each gap is one night, so it is one stay of 3 marked days
    // spanning 5 calendar days.
    expect(groupStays(['2026-08-01', '2026-08-03', '2026-08-05']))
      .toEqual([{ start: '2026-08-01', end: '2026-08-05', days: 3 }]);
  });
});

describe('eventDateISO', () => {
  it('skips the weekday and reads the month/day', () => {
    expect(eventDateISO('Sat, Aug 15 · 6:30 PM', 2026)).toBe('2026-08-15');
  });

  it('zero-pads single-digit months and days', () => {
    expect(eventDateISO('Fri, Jan 2 · 9:00 AM', 2026)).toBe('2026-01-02');
  });

  it('returns null when there is no parseable date', () => {
    expect(eventDateISO('sometime next week')).toBeNull();
    expect(eventDateISO('')).toBeNull();
    expect(eventDateISO(null)).toBeNull();
  });

  it('returns null for a month that is not real', () => {
    expect(eventDateISO('Sat, Zzz 15 · 6:30 PM', 2026)).toBeNull();
  });
});
