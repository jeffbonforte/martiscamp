// Shared Open-Meteo logic, used by BOTH the Vite dev proxy (vite.config.js) and
// the Vercel serverless functions (api/weather.js, api/snow.js) so dev and prod
// return identical shapes. Open-Meteo is free and keyless; nothing secret here.

export const DEFAULT_LAT = process.env.WEATHER_LAT || '39.328';
export const DEFAULT_LON = process.env.WEATHER_LON || '-120.1833';
const BASE = 'https://api.open-meteo.com/v1/forecast';

// WMO weather code → Lucide glyph.
export function iconFor(c) {
  if ([0, 1].includes(c)) return 'sun';
  if (c === 2) return 'cloud-sun';
  if (c === 3) return 'cloud';
  if ([45, 48].includes(c)) return 'cloud-fog';
  if ([51, 53, 55, 56, 57].includes(c)) return 'cloud-drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return 'cloud-rain';
  if ([71, 73, 75, 77, 85, 86].includes(c)) return 'cloud-snow';
  if ([95, 96, 99].includes(c)) return 'cloud-lightning';
  return 'cloud-sun';
}

const CONDS = {
  0: 'Clear', 1: 'Mostly sunny', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};
export const condFor = (c) => CONDS[c] || 'Partly cloudy';

export async function fetchForecast(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  const url = `${BASE}?latitude=${lat}&longitude=${lon}`
    + `&daily=temperature_2m_max,temperature_2m_min,weather_code,snowfall_sum`
    + `&hourly=snow_depth&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`;
  return fetch(url, { headers: { Accept: 'application/json' } });
}

export function mapDays(data) {
  const d = data.daily || {};
  return (d.time || []).slice(0, 7).map((iso, i) => {
    const code = d.weather_code?.[i];
    const dt = new Date(`${iso}T00:00:00`);
    return {
      hi: Math.round(d.temperature_2m_max?.[i] ?? 0),
      lo: Math.round(d.temperature_2m_min?.[i] ?? 0),
      icon: iconFor(code),
      cond: condFor(code),
      iso,
      label: dt.toLocaleDateString('en-US', { weekday: 'short' }),
      sub: dt.getDate(),
    };
  });
}

export function mapSnow(data) {
  const depths = data.hourly?.snow_depth || [];
  const lastDepthM = [...depths].reverse().find((v) => v != null) ?? 0;
  const baseInches = Math.round(lastDepthM * 39.3701);
  const newCm = data.daily?.snowfall_sum?.[0] ?? 0;
  return {
    newInches: Math.round(newCm / 2.54),
    baseInches,
    seasonTotal: null,
    lifts: null,
    trails: null,
    condition: baseInches > 0 ? 'Snow on the ground' : 'No snow reported',
  };
}
