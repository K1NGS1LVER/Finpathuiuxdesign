// ============================================================
// FinPath — Supabase Client
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn('[FinPath] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env — auth and cloud sync disabled.');
}

// Create a client with empty strings when unconfigured so module load doesn't
// crash. Callers must check `isSupabaseConfigured` before invoking auth.
export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'anon-key-not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
