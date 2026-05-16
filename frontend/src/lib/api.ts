// ============================================================
// FinPath — Authenticated fetch helper
// Attaches `Authorization: Bearer <access_token>` from the current
// Supabase session to every request. Use this for all /api/* calls.
// ============================================================

import { supabase, isSupabaseConfigured } from './supabase';

const DEFAULT_TIMEOUT_MS = 30_000;

export interface ApiFetchInit extends RequestInit {
  /** Skip attaching the Authorization header even if a session exists. */
  noAuth?: boolean;
  /** Skip auto-setting Content-Type: application/json (for FormData etc.). */
  noJsonContentType?: boolean;
  /** Request timeout in milliseconds. Defaults to 30000. Pass 0 to disable. */
  timeoutMs?: number;
}

/**
 * Wrapper around fetch that injects the current Supabase access token.
 * Throws on network errors but returns the Response as-is for status handling.
 */
export async function apiFetch(input: string, init: ApiFetchInit = {}): Promise<Response> {
  const { noAuth, noJsonContentType, timeoutMs, headers, signal, ...rest } = init;
  const merged = new Headers(headers ?? {});

  if (!noAuth && isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token && !merged.has('Authorization')) {
      merged.set('Authorization', `Bearer ${token}`);
    }
  }

  if (
    init.body &&
    !noJsonContentType &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob) &&
    !(init.body instanceof URLSearchParams) &&
    !merged.has('Content-Type')
  ) {
    merged.set('Content-Type', 'application/json');
  }

  const effectiveTimeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (effectiveTimeout <= 0) {
    return fetch(input, { ...rest, headers: merged, signal });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), effectiveTimeout);
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }
  try {
    return await fetch(input, { ...rest, headers: merged, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
