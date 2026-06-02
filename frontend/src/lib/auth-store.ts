// ============================================================
// FinPath — Auth Store (Supabase JWT auth, Phase 1)
// Manages login, signup, logout, session, and the one-time
// localStorage → Supabase profile migration on first sign-in.
// ============================================================

import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { hydrateFromRemote, flushCloudSync, resetCloudSyncCache } from './cloud-sync';
import { useFinPathStore } from './store';

const LOCAL_STORE_KEY = 'finpath-store';

/**
 * Dev escape hatch: set VITE_AUTH_MOCK=true in .env to bypass Supabase
 * entirely and use an in-memory fake user. Avoids burning the free-tier
 * auth quota during local development.
 */
const isAuthMockMode = import.meta.env.VITE_AUTH_MOCK === 'true';

const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@finpath.local',
  user_metadata: { full_name: 'Dev User' },
  app_metadata: { provider: 'mock' },
} as unknown as User;

const MOCK_SESSION = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: MOCK_USER,
} as unknown as Session;

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

let authListenerInitialized = false;

/**
 * If localStorage has an onboarded FinPath store and Supabase has no profile
 * row yet for this user, push the local profile up. If both exist, archive
 * local under `finpath-store.local-backup-{YYYY-MM-DD}` and keep cloud.
 */
async function migrateLocalToCloud(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  let local: any = null;
  try {
    const raw = localStorage.getItem(LOCAL_STORE_KEY);
    if (!raw) return;
    local = JSON.parse(raw);
  } catch {
    return;
  }

  // Only migrate genuine onboarded local data.
  const profileData = local?.state ?? local;
  if (!profileData || !profileData.onboarded) return;

  const { data: existing, error: fetchErr } = await supabase
    .from('profiles')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) {
    console.error('[auth] migrate fetch error:', fetchErr.message);
    return;
  }

  const remoteEmpty = !existing || !existing.data || Object.keys(existing.data).length === 0;

  if (remoteEmpty) {
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        data: profileData,
        storage_mode: 'local',
        schema_version: 3,
      });
    if (upsertErr) {
      console.error('[auth] migrate upsert error:', upsertErr.message);
    }
    return;
  }

  // Both sides have data — keep cloud, archive local.
  const today = new Date().toISOString().slice(0, 10);
  try {
    localStorage.setItem(`${LOCAL_STORE_KEY}.local-backup-${today}`, localStorage.getItem(LOCAL_STORE_KEY) ?? '');
  } catch {
    // ignore quota errors; cloud is authoritative
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    if (isAuthMockMode) {
      console.info('[auth] VITE_AUTH_MOCK=true — using mock user');
      set({ user: MOCK_USER, session: MOCK_SESSION, loading: false });
      return;
    }

    if (!isSupabaseConfigured) {
      console.warn('[auth] Supabase not configured — auth disabled.');
      set({ user: null, session: null, loading: false });
      return;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[auth] getSession error:', error.message);
    }
    set({
      user: data.session?.user ?? null,
      session: data.session ?? null,
      loading: false,
    });

    if (!authListenerInitialized) {
      authListenerInitialized = true;
      supabase.auth.onAuthStateChange((event, session) => {
        set({ user: session?.user ?? null, session: session ?? null });
        if (event === 'SIGNED_IN' && session?.user) {
          void (async () => {
            await migrateLocalToCloud(session.user.id);
            await hydrateFromRemote();
          })();
        }
        if (event === 'SIGNED_OUT') {
          resetCloudSyncCache();
        }
      });
    }

    // Hydrate profile from remote on boot if session exists.
    if (data.session?.user) {
      void hydrateFromRemote();
    }
  },

  signUp: async (email, password, name) => {
    if (isAuthMockMode) {
      set({
        user: { ...MOCK_USER, email, user_metadata: { full_name: name ?? 'Dev User' } } as User,
        session: MOCK_SESSION,
        loading: false,
      });
      return { success: true };
    }
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.' };
    }
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
    set({
      user: data.user ?? null,
      session: data.session ?? null,
      loading: false,
    });
    return { success: true };
  },

  signIn: async (email, password) => {
    if (isAuthMockMode) {
      set({
        user: { ...MOCK_USER, email } as User,
        session: MOCK_SESSION,
        loading: false,
      });
      return { success: true };
    }
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.' };
    }
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
    set({
      user: data.user ?? null,
      session: data.session ?? null,
      loading: false,
    });
    await hydrateFromRemote();
    return { success: true };
  },

  signOut: async () => {
    // Flush any pending cloud sync before tearing down the session.
    if (useFinPathStore.getState().storageMode === 'cloud') {
      await flushCloudSync().catch(() => undefined);
    }
    resetCloudSyncCache();

    if (isAuthMockMode || !isSupabaseConfigured) {
      set({ user: null, session: null });
      return;
    }
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[auth] signOut error:', error.message);
    }
    set({ user: null, session: null, loading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
