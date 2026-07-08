import { createClient } from '@supabase/supabase-js';

// Configured only when both env vars are present (set in .env.local after the
// Supabase project exists). When absent, the whole app runs on mock data and
// the demo auth gate — nothing here is required to develop the UI.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
