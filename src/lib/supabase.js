import { createClient } from '@supabase/supabase-js';

// Vite exposes only vars prefixed with VITE_. Put these in web-portal/.env :
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGc...
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when both env vars are present, i.e. the portal can talk to the backend. */
export const isConfigured = Boolean(url && anonKey);

if (!isConfigured) {
  // Not fatal — the portal falls back to local demo data so it still runs.
  console.warn(
    '[Niramaya] Supabase is not configured. Add VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY to web-portal/.env and restart `npm run dev`.',
  );
}

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;

export const FAMILY_PHOTO_BUCKET = 'family-photos';
