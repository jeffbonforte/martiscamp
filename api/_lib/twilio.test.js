import { describe, it, expect } from 'vitest';
import { toE164 } from './twilio.js';

// Phone numbers are stored however they were typed into the app, but WhatsApp
// needs E.164. Getting this wrong doesn't fail loudly — it sends someone's
// private invite to whatever number the digits happened to form.

describe('toE164', () => {
  it('normalises the formats actually in the roster', () => {
    expect(toE164('(530) 555-0100')).toBe('+15305550100');
    expect(toE164('530-555-0100')).toBe('+15305550100');
    expect(toE164('530.555.0100')).toBe('+15305550100');
    expect(toE164('5305550100')).toBe('+15305550100');
  });

  it('accepts a number that already carries the country code', () => {
    expect(toE164('+1 530 555 0100')).toBe('+15305550100');
    expect(toE164('15305550100')).toBe('+15305550100');
  });

  it('passes through a plausible international number', () => {
    expect(toE164('+44 20 7946 0958')).toBe('+442079460958');
  });

  // Refusing is the safe failure: the caller skips the send rather than
  // guessing at an area code and texting a stranger.
  it('refuses anything it cannot make sense of', () => {
    expect(toE164('555-0100')).toBeNull();      // 7 digits, no area code
    expect(toE164('123')).toBeNull();
    expect(toE164('')).toBeNull();
    expect(toE164(null)).toBeNull();
    expect(toE164(undefined)).toBeNull();
    expect(toE164('not a phone')).toBeNull();
    expect(toE164('+1234567890123456789')).toBeNull(); // longer than E.164 allows
  });

  it('ignores decoration rather than choking on it', () => {
    expect(toE164('  (530) 555-0100  ')).toBe('+15305550100');
    expect(toE164('tel:+1-530-555-0100')).toBe('+15305550100');
  });
});
