// Vercel serverless function → GET /api/weather (production equivalent of the
// Vite dev proxy). Returns { ok, days } or a graceful { ok:false, fallback }.
import { fetchForecast, mapDays } from './_openmeteo.js';

export default async function handler(req, res) {
  try {
    const r = await fetchForecast();
    if (!r.ok) return res.status(200).json({ ok: false, reason: `upstream-${r.status}`, fallback: true });
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json({ ok: true, days: mapDays(data) });
  } catch (e) {
    return res.status(200).json({ ok: false, reason: String((e && e.message) || e), fallback: true });
  }
}
