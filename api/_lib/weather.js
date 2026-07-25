// Weather + snow for the WhatsApp assistant. Reuses the exact same Open-Meteo
// helper the web app's /api/weather and /api/snow endpoints use, so the bot and
// the site can never disagree about the forecast.

import { fetchForecast, mapDays, mapSnow } from '../_openmeteo.js';

/**
 * 7-day Truckee forecast plus the snow report, or null if Open-Meteo is
 * unreachable. Callers surface null as "I can't get the forecast right now"
 * rather than guessing — the assistant must never invent weather.
 */
export async function forecast() {
  try {
    const r = await fetchForecast();
    if (!r.ok) return null;
    const data = await r.json();
    const days = mapDays(data);
    const snow = mapSnow(data);
    return {
      days: days.map((d) => ({ date: d.iso, day: d.label, hi: d.hi, lo: d.lo, conditions: d.cond })),
      snow: {
        base_inches: snow.baseInches,
        new_inches_today: snow.newInches,
        summary: snow.condition,
      },
    };
  } catch {
    return null;
  }
}
