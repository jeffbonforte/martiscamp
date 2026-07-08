import React from 'react';

// Client-side weather. Talks to the dev proxy (/api/weather, /api/snow) which
// injects the WeatherUnlocked credentials server-side. On any failure it falls
// back to the mock values baked into the day objects, so the UI never breaks.

async function getJSON(url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return { ok: false };
    return await r.json();
  } catch {
    return { ok: false };
  }
}

/**
 * Overlay live forecast onto the mock `weekendDays` (keeps each day's key/label
 * so gathering/event matching still works; replaces the wx block when live).
 */
function overlay(mockDays, liveDays) {
  if (!Array.isArray(liveDays) || !liveDays.length) return mockDays;
  return mockDays.map((d, i) => {
    const live = liveDays[i];
    if (!live) return d;
    return {
      ...d,
      wx: {
        hi: live.hi ?? d.wx.hi,
        lo: live.lo ?? d.wx.lo,
        icon: live.icon || d.wx.icon,
        cond: live.cond || d.wx.cond,
      },
    };
  });
}

/**
 * Hook: returns { weekendDays, snow, source } where source is 'live' | 'mock'.
 * Pass the mock weekendDays + mock snowReport from DATA.
 */
export function useWeather(mockDays, mockSnow) {
  const [weekendDays, setWeekendDays] = React.useState(mockDays);
  const [snow, setSnow] = React.useState(mockSnow);
  const [source, setSource] = React.useState('mock');

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const w = await getJSON('/api/weather');
      if (alive && w.ok && w.days) {
        setWeekendDays(overlay(mockDays, w.days));
        setSource('live');
      }
      const s = await getJSON('/api/snow');
      if (alive && s.ok && s.report) {
        // only replace fields the feed actually returned
        setSnow((prev) => ({
          newInches: s.report.newInches ?? prev.newInches,
          baseInches: s.report.baseInches ?? prev.baseInches,
          seasonTotal: s.report.seasonTotal ?? prev.seasonTotal,
          lifts: s.report.lifts ?? prev.lifts,
          trails: s.report.trails ?? prev.trails,
          condition: s.report.condition ?? prev.condition,
        }));
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { weekendDays, snow, source };
}

export default useWeather;
