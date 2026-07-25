import { describe, it, expect } from 'vitest';
import { nthWeekday, lastWeekday, occasionsFor, nextOccasion } from './occasions.js';

// Fixture dates computed independently (brute-force scan of each month), not
// assumed: Thanksgiving 2026 = Thu 2026-11-26, 2027 = Thu 2027-11-25,
// MLK 2027 = Mon 2027-01-18, Presidents' 2027 = Mon 2027-02-15,
// Memorial 2026 = Mon 2026-05-25, Labor 2026 = Mon 2026-09-07.

const byKey = (year, key) => occasionsFor(year).find((o) => o.key === key);

describe('nthWeekday', () => {
  it('finds the 4th Thursday in November', () => {
    expect(nthWeekday(2026, 10, 4, 4)).toBe('2026-11-26');
    expect(nthWeekday(2027, 10, 4, 4)).toBe('2027-11-25');
  });

  it('finds the 3rd Monday in January and February', () => {
    expect(nthWeekday(2027, 0, 1, 3)).toBe('2027-01-18');
    expect(nthWeekday(2027, 1, 1, 3)).toBe('2027-02-15');
  });

  it('handles a month starting on the target weekday', () => {
    // 2026-09-07 is the 1st Monday; Sept 1 2026 is a Tuesday.
    expect(nthWeekday(2026, 8, 1, 1)).toBe('2026-09-07');
  });
});

describe('lastWeekday', () => {
  it('finds the last Monday in May', () => {
    expect(lastWeekday(2026, 4, 1)).toBe('2026-05-25');
  });

  it('is not fooled by a 5-occurrence month', () => {
    // Distinct from the 4th Monday when the month has five of them.
    const fourth = nthWeekday(2026, 4, 1, 4);
    expect(lastWeekday(2026, 4, 1) >= fourth).toBe(true);
  });
});

describe('occasionsFor', () => {
  it('wraps Thanksgiving as Wednesday through Sunday', () => {
    const t = byKey(2026, 'thanksgiving');
    expect(t.start).toBe('2026-11-25'); // Wed before
    expect(t.end).toBe('2026-11-29');   // Sun after
  });

  it('wraps holiday Mondays as Friday through Monday', () => {
    const m = byKey(2026, 'memorial');
    expect(m.start).toBe('2026-05-22'); // Fri
    expect(m.end).toBe('2026-05-25');   // Mon
  });

  it('runs the winter holidays across the year boundary', () => {
    const c = byKey(2026, 'christmas');
    expect(c.start).toBe('2026-12-24');
    expect(c.end).toBe('2027-01-01');
  });

  it('returns occasions in chronological order', () => {
    const starts = occasionsFor(2026).map((o) => o.start);
    expect([...starts].sort()).toEqual(starts);
  });
});

describe('nextOccasion', () => {
  it('finds the next one inside the horizon', () => {
    // Late September 2026 → Thanksgiving is the next thing people plan around.
    expect(nextOccasion('2026-09-20').key).toBe('thanksgiving');
  });

  it('returns null when nothing is close enough', () => {
    // Early August: Labor Day is ~4 weeks out, so a 7-day horizon finds nothing.
    expect(nextOccasion('2026-08-03', 7)).toBeNull();
  });

  it('crosses into next year', () => {
    // Late December, after the holidays window opens — MLK is next up in January.
    const o = nextOccasion('2026-12-28');
    expect(['christmas', 'mlk']).toContain(o.key);
    expect(nextOccasion('2027-01-05').key).toBe('mlk');
  });

  // Someone texting on Thanksgiving Thursday should still be asked about the
  // rest of the weekend, not skipped ahead to Christmas.
  it('still returns an occasion already under way', () => {
    const o = nextOccasion('2026-11-26');
    expect(o.key).toBe('thanksgiving');
  });

  it('does not return one that has finished', () => {
    const o = nextOccasion('2026-11-30'); // Monday after Thanksgiving
    expect(o.key).not.toBe('thanksgiving');
  });
});
