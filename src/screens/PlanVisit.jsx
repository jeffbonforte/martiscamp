import React from 'react';
import { Button } from '../components/index.js';
import { useLucide } from '../lib/useLucide.js';
import { PageHead, chipStyle } from './shared.jsx';
import { MONTHS, WEEKDAYS, monthMatrix, nextMonths, dateKey } from '../lib/calendar.js';
import { loadVisitPlan, saveVisitPlan, isSupabaseConfigured } from '../lib/api.js';

const APP_TODAY = new Date();
const startOfToday = new Date(APP_TODAY.getFullYear(), APP_TODAY.getMonth(), APP_TODAY.getDate());

/** Mark attendance up to 12 months ahead — per member × date. */
export function PlanVisit({ data, onBack }) {
  const myFam = data.families.find((f) => f.id === data.me.familyId);
  const scopes = [{ key: 'family', label: 'Whole family' }, ...myFam.members.map((m) => ({ key: m.name, label: m.name.split(' ')[0] }))];
  const [scope, setScope] = React.useState('family');

  // Seed from the mock July week so the view starts populated.
  const seed = React.useMemo(() => {
    const map = {};
    // Only seed days from today onward — a past day would render disabled yet
    // still count toward the summary and couldn't be cleared.
    const dayToKey = (k) => {
      const wd = data.weekendDays.find((d) => d.key === k);
      if (!wd) return null;
      return wd.date < startOfToday ? null : dateKey(wd.date);
    };
    map.family = new Set((myFam.presence.days || []).map(dayToKey).filter(Boolean));
    myFam.members.forEach((m) => { map[m.name] = new Set((m.days || []).map(dayToKey).filter(Boolean)); });
    return map;
  }, [data, myFam]);

  const [planned, setPlanned] = React.useState(seed);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [err, setErr] = React.useState('');
  useLucide();

  // When Supabase is configured, hydrate the plan from saved attendance.
  React.useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let alive = true;
    loadVisitPlan().then((res) => {
      if (!alive || !res) return;
      const next = {};
      Object.entries(res.plan).forEach(([k, arr]) => { next[k] = new Set(arr); });
      setPlanned(next);
    });
    return () => { alive = false; };
  }, []);

  const savePlan = async () => {
    setSaving(true); setSaved(false); setErr('');
    const r = await saveVisitPlan(scope, [...(planned[scope] || [])], dateKey(startOfToday));
    setSaving(false);
    if (r.ok || r.offline) setSaved(true); // mock mode has nothing to persist
    else setErr(r.error || 'Could not save your plan.');
  };

  const current = planned[scope] || new Set();
  const toggleDay = (date) => {
    if (date < startOfToday) return;
    setSaved(false);
    const k = dateKey(date);
    setPlanned((prev) => {
      const next = { ...prev };
      const set = new Set(next[scope] || []);
      set.has(k) ? set.delete(k) : set.add(k);
      next[scope] = set;
      return next;
    });
  };

  const dayCount = current.size;
  const months = nextMonths(APP_TODAY, 12);

  return (
    <div>
      <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', font: 'var(--fw-semibold) var(--text-sm) var(--font-sans)', marginBottom: 'var(--space-4)', padding: 0 }}>
        <i data-lucide="chevron-left" style={{ width: 16, height: 16 }} /> Calendar
      </button>

      <PageHead eyebrow="Plan ahead" title="Plan a visit"
        sub="Tap the days you'll be up — up to a year out. Other families see who's here on any future date." />

      {/* Scope + summary */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-page)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--divider)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {scopes.map((s) => <button key={s.key} type="button" onClick={() => { setScope(s.key); setSaved(false); }} style={chipStyle(scope === s.key)}>{s.label}</button>)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ font: 'var(--role-small)', color: 'var(--text-muted)' }}>
              Marked for <b style={{ color: 'var(--success)', fontWeight: 'var(--fw-semibold)' }}>{dayCount} day{dayCount === 1 ? '' : 's'}</b>
            </span>
            <Button size="sm" disabled={saving} onClick={savePlan} iconLeft={<i data-lucide="check" style={{ width: 15, height: 15 }} />}>{saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save plan'}</Button>
            {err && <span style={{ font: 'var(--role-small)', color: 'var(--danger)' }}>{err}</span>}
          </div>
        </div>
      </div>

      {/* 12 month mini-calendars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {months.map(({ year, month }) => {
          const weeks = monthMatrix(year, month);
          return (
            <div key={`${year}-${month}`} style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 'var(--space-4)' }}>
              <div style={{ font: 'var(--fw-regular) var(--text-lg)/1 var(--font-display)', color: 'var(--text-strong)', marginBottom: 'var(--space-3)' }}>{MONTHS[month]} {year}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                {WEEKDAYS.map((w) => <div key={w} style={{ textAlign: 'center', font: 'var(--fw-semibold) 9px/1 var(--font-sans)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{w[0]}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {weeks.flat().map((cell, i) => {
                  const on = cell.inMonth && current.has(dateKey(cell.date));
                  const past = cell.date < startOfToday;
                  const disabled = !cell.inMonth || past;
                  return (
                    <button key={i} type="button" disabled={disabled} onClick={() => toggleDay(cell.date)}
                      style={{
                        aspectRatio: '1 / 1', border: 'none', borderRadius: 'var(--radius-sm)', cursor: disabled ? 'default' : 'pointer',
                        background: on ? 'var(--brand)' : cell.inMonth ? 'var(--surface-sunk)' : 'transparent',
                        color: on ? 'var(--text-on-brand)' : cell.inMonth ? (past ? 'var(--text-faint)' : 'var(--text-body)') : 'transparent',
                        opacity: past && cell.inMonth ? 0.4 : 1,
                        font: `var(--fw-${on ? 'semibold' : 'medium'}) var(--text-xs)/1 var(--font-sans)`,
                        transition: 'background var(--dur-fast)',
                      }}>{cell.inMonth ? cell.date.getDate() : ''}</button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PlanVisit;
