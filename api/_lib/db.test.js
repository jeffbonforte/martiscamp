import { describe, it, expect } from 'vitest';
import { nameTokens, nameMatches } from './db.js';

// A member asked the assistant about "the Bonforte family" and got back "No
// Bonfortes in the directory". The old matcher required EVERY word of the query
// to appear in a member's own name — so "family" matched nobody — and never
// looked at family names at all. These cover the ways people actually refer to
// a household.

describe('nameTokens', () => {
  it('drops words that identify nobody', () => {
    expect(nameTokens('the Bonforte family')).toEqual(['bonforte']);
    expect(nameTokens('The Bell Family')).toEqual(['bell']);
    expect(nameTokens('the Reyes household')).toEqual(['reyes']);
  });

  it('keeps real names', () => {
    expect(nameTokens('Jeff Bonforte')).toEqual(['jeff', 'bonforte']);
    expect(nameTokens('Tom')).toEqual(['tom']);
  });

  it('strips punctuation and possessives', () => {
    expect(nameTokens("the Bonforte's")).toEqual(['bonforte']);
    expect(nameTokens('Bell, Tom')).toEqual(['bell', 'tom']);
  });

  it('returns nothing for a query with no signal', () => {
    expect(nameTokens('the family')).toEqual([]);
    expect(nameTokens('')).toEqual([]);
    expect(nameTokens(null)).toEqual([]);
  });
});

describe('nameMatches', () => {
  const jeff = ['Jeff Bonforte', 'Bonforte'];
  const tessa = ['Tessa Bonforte', 'Bonforte'];
  const tom = ['Tom Bell', 'Bell'];

  // The exact failure that was reported.
  it('finds a household by "the <name> family"', () => {
    expect(nameMatches('the Bonforte family', ...jeff)).toBe(true);
    expect(nameMatches('the Bonforte family', ...tessa)).toBe(true);
    expect(nameMatches('the Bonforte family', ...tom)).toBe(false);
  });

  it('handles the plural people actually use', () => {
    expect(nameMatches('the Bonfortes', ...jeff)).toBe(true);
    expect(nameMatches('Bonfortes', ...tessa)).toBe(true);
  });

  it('still matches a bare surname or full name', () => {
    expect(nameMatches('Bonforte', ...jeff)).toBe(true);
    expect(nameMatches('Jeff Bonforte', ...jeff)).toBe(true);
    expect(nameMatches('jeff', ...jeff)).toBe(true);
  });

  it('matches on family name even when the member name differs', () => {
    // A member whose surname isn't the family name still belongs to it.
    expect(nameMatches('Bonforte', 'Amy Okonkwo', 'Bonforte')).toBe(true);
  });

  it('narrows correctly when both names are given', () => {
    expect(nameMatches('Jeff Bonforte', ...tessa)).toBe(false);
    expect(nameMatches('Tessa Bonforte', ...tessa)).toBe(true);
  });

  it('does not strip a trailing s that belongs to the name', () => {
    // "Ross" must not become "Ros" and match something else.
    expect(nameMatches('Ross', 'Ross Kwan', 'Kwan')).toBe(true);
    expect(nameMatches('Ross', 'Ros Bell', 'Bell')).toBe(false);
  });

  it('refuses a query that identifies nobody', () => {
    expect(nameMatches('the family', ...jeff)).toBe(false);
    expect(nameMatches('', ...jeff)).toBe(false);
  });
});
