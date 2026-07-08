import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fetchForecast, mapDays, mapSnow } from './api/_openmeteo.js';

/**
 * Dev proxy for /api/weather + /api/snow, backed by Open-Meteo (free, no key).
 * Uses the same mapping module as the Vercel serverless functions in api/, so
 * local dev and production behave identically. Falls back to mock in the client
 * on any failure.
 */
function weatherProxy() {
  const send = (res, code, obj) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
  };
  return {
    name: 'weather-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || (!req.url.startsWith('/api/weather') && !req.url.startsWith('/api/snow'))) return next();
        try {
          const r = await fetchForecast();
          if (!r.ok) return send(res, 200, { ok: false, reason: `upstream-${r.status}`, fallback: true });
          const data = await r.json();
          if (req.url.startsWith('/api/weather')) return send(res, 200, { ok: true, days: mapDays(data) });
          return send(res, 200, { ok: true, report: mapSnow(data) });
        } catch (e) {
          return send(res, 200, { ok: false, reason: String((e && e.message) || e), fallback: true });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), weatherProxy()],
  server: { port: 5173, open: false },
});
