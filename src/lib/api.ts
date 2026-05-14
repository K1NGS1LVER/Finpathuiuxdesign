// ============================================================
// FinPath — Authenticated fetch helper
// Attaches `Authorization: Bearer <access_token>` from the current
// Supabase session to every request. Use this for all /api/* calls.
// ============================================================

import { supabase, isSupabaseConfigured } from './supabase';

export interface ApiFetchInit extends RequestInit {
  /** Skip attaching the Authorization header even if a session exists. */
  noAuth?: boolean;
}

/**
 * Wrapper around fetch that injects the current Supabase access token.
 * Throws on network errors but returns the Response as-is for status handling.
 */
export async function apiFetch(input: string, init: ApiFetchInit = {}): Promise<Response> {
  const { noAuth, headers, ...rest } = init;
  const merged = new Headers(headers ?? {});

  if (!noAuth && isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token && !merged.has('Authorization')) {
      merged.set('Authorization', `Bearer ${token}`);
    }
  }

  if (init.body && !merged.has('Content-Type')) {
    merged.set('Content-Type', 'application/json');
  }

  return fetch(input, { ...rest, headers: merged });
}
