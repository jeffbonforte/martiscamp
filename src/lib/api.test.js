import { describe, it, expect, beforeEach, vi } from 'vitest';

// A chainable stand-in for the Supabase client that records what each query
// actually asked for. The point of these tests is the *shape* of the delete:
// attendance writes must never clear an unbounded date range.

const calls = [];
let memberRows = [{ id: 'm1' }, { id: 'm2' }];
let failOn = null; // 'delete' | 'upsert'

function query(table) {
  const rec = { table, op: 'select', filters: [], rows: null };
  const chain = {
    select() { rec.op = 'select'; return chain; },
    delete() { rec.op = 'delete'; calls.push(rec); return chain; },
    upsert(rows, opts) { rec.op = 'upsert'; rec.rows = rows; rec.opts = opts; calls.push(rec); return result(); },
    eq(col, val) { rec.filters.push(['eq', col, val]); return chain; },
    is(col, val) { rec.filters.push(['is', col, val]); return chain; },
    in(col, val) { rec.filters.push(['in', col, val]); return chain; },
    gte(col, val) { rec.filters.push(['gte', col, val]); return chain; },
    maybeSingle() { return Promise.resolve({ data: memberRows[0] || null }); },
    // Awaiting the chain resolves it: selects yield rows, writes yield an error slot.
    then(res, rej) {
      const out = rec.op === 'select' ? { data: memberRows } : errorFor(rec.op);
      return Promise.resolve(out).then(res, rej);
    },
  };
  function result() { return Promise.resolve(errorFor(rec.op)); }
  return chain;
}

const errorFor = (op) => (failOn === op ? { error: { message: `${op} failed` } } : { error: null });

const fakeSupabase = {
  from: (table) => query(table),
  rpc: (fn) => Promise.resolve({ data: fn === 'current_family_id' ? 'fam1' : 'me1' }),
};

vi.mock('./supabase.js', () => ({
  get isSupabaseConfigured() { return globalThis.__configured; },
  supabase: { from: (t) => fakeSupabase.from(t), rpc: (f) => fakeSupabase.rpc(f) },
}));

const { setAttendanceDates, presenceFrom } = await import('./api.js');

const attendanceCalls = () => calls.filter((c) => c.table === 'attendance');
const filterOps = (c) => c.filters.map((f) => f[0]);

beforeEach(() => {
  calls.length = 0;
  memberRows = [{ id: 'm1' }, { id: 'm2' }];
  failOn = null;
  globalThis.__configured = true;
});

describe('setAttendanceDates', () => {
  it('adds a date for every family member without deleting anything', async () => {
    const r = await setAttendanceDates('family', { add: ['2026-08-10'] });
    expect(r).toEqual({ ok: true });

    const writes = attendanceCalls();
    expect(writes.map((c) => c.op)).toEqual(['upsert']); // crucially: no delete
    expect(writes[0].rows).toEqual([
      { member_id: 'm1', family_id: 'fam1', date: '2026-08-10', created_by: 'me1', status: 'planned' },
      { member_id: 'm2', family_id: 'fam1', date: '2026-08-10', created_by: 'me1', status: 'planned' },
    ]);
    expect(writes[0].opts).toEqual({ onConflict: 'member_id,date' });
  });

  // The regression this whole change exists for. saveVisitPlan clears with
  // .gte('date', fromKey) — unbounded — so a 7-day picker using it would wipe
  // every visit planned further out. A delta write must be bounded by date.
  it('removes only the dates named, never an open-ended range', async () => {
    await setAttendanceDates('family', { remove: ['2026-08-10'] });

    const del = attendanceCalls().find((c) => c.op === 'delete');
    expect(del.filters).toEqual([
      ['in', 'member_id', ['m1', 'm2']],
      ['in', 'date', ['2026-08-10']],
    ]);
    expect(filterOps(del)).not.toContain('gte');
  });

  it('never issues a gte-bounded delete on any path', async () => {
    await setAttendanceDates('family', { add: ['2026-08-11'], remove: ['2026-08-10'] });
    for (const c of attendanceCalls()) expect(filterOps(c)).not.toContain('gte');
  });

  it('lets add win over remove for the same date', async () => {
    await setAttendanceDates('family', { add: ['2026-08-10'], remove: ['2026-08-10'] });
    expect(attendanceCalls().map((c) => c.op)).toEqual(['upsert']);
  });

  it('scopes to a single member by name', async () => {
    memberRows = [{ id: 'm1' }];
    await setAttendanceDates('Jeff Bonforte', { add: ['2026-08-10'] });
    expect(attendanceCalls()[0].rows).toHaveLength(1);
  });

  it('is a no-op when both lists are empty', async () => {
    expect(await setAttendanceDates('family', {})).toEqual({ ok: true });
    expect(calls).toHaveLength(0);
  });

  it('surfaces a delete error instead of reporting success', async () => {
    failOn = 'delete';
    expect(await setAttendanceDates('family', { remove: ['2026-08-10'] }))
      .toEqual({ ok: false, error: 'delete failed' });
  });

  it('surfaces an upsert error instead of reporting success', async () => {
    failOn = 'upsert';
    expect(await setAttendanceDates('family', { add: ['2026-08-10'] }))
      .toEqual({ ok: false, error: 'upsert failed' });
  });

  it('does not write a date when the remove fails', async () => {
    failOn = 'delete';
    await setAttendanceDates('family', { add: ['2026-08-11'], remove: ['2026-08-10'] });
    expect(attendanceCalls().some((c) => c.op === 'upsert')).toBe(false);
  });

  it('reports offline rather than erroring when Supabase is unconfigured', async () => {
    globalThis.__configured = false;
    expect(await setAttendanceDates('family', { add: ['2026-08-10'] }))
      .toEqual({ ok: false, offline: true });
  });

  it('refuses when the scope resolves to nobody', async () => {
    memberRows = [];
    const r = await setAttendanceDates('family', { add: ['2026-08-10'] });
    expect(r.ok).toBe(false);
    expect(attendanceCalls()).toHaveLength(0);
  });
});

// presenceFrom drives the home screen's "who's here" copy and is now applied
// optimistically in App.jsx, so its edges matter. It reads the rolling window
// built at module load, hence the relative keys.
describe('presenceFrom', () => {
  const windowKeys = () => {
    const base = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
    });
  };

  it('reports Away for no days', () => {
    expect(presenceFrom([])).toEqual({ here: false, label: 'Away', days: [] });
  });

  it('is "here" only when today is marked', () => {
    const keys = windowKeys();
    expect(presenceFrom([keys[0]]).here).toBe(true);
    expect(presenceFrom([keys[0]]).label).toBe('Here today');
    expect(presenceFrom([keys[2]]).here).toBe(false);
  });

  it('collapses six or more days to "Here all week"', () => {
    expect(presenceFrom(windowKeys().slice(0, 6)).label).toBe('Here all week');
  });

  it('drops keys outside the rolling window and de-duplicates', () => {
    const keys = windowKeys();
    expect(presenceFrom([keys[0], keys[0], 'nope']).days).toEqual([keys[0]]);
  });
});
