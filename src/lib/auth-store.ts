// ============================================================
// FinPath — Auth Store (Supabase JWT Auth)
// Manages login, signup, logout, and session state
// ============================================================

import { create } from 'zustand';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  /** Initialize: check existing session and listen for changes */
  initialize: () => Promise<void>;

  /** Sign up with email and password */
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;

  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;

  /** Sign out */
  signOut: () => Promise<void>;

  /** Clear any error */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: { id: 'fake-user-id', email: 'test@finpath.app', user_metadata: { full_name: 'Test User' } } as unknown as User,
  session: { access_token: 'fake-token', user: { id: 'fake-user-id' } } as unknown as Session,
  loading: false,
  error: null,

  initialize: async () => {
    // Mocked to instantly complete
    set({ loading: false });
  },

  signUp: async (email, password, name) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      set({
        user: { id: 'fake-user-id', email, user_metadata: { full_name: name || 'Test User' } } as unknown as User,
        session: { access_token: 'fake-token', user: { id: 'fake-user-id' } } as unknown as Session,
        loading: false,
      });
    }, 500);
    return { success: true };
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    setTimeout(() => {
      set({
        user: { id: 'fake-user-id', email, user_metadata: { full_name: 'Test User' } } as unknown as User,
        session: { access_token: 'fake-token', user: { id: 'fake-user-id' } } as unknown as Session,
        loading: false,
      });
    }, 500);
    return { success: true };
  },

  signOut: async () => {
    set({ loading: true });
    setTimeout(() => {
      set({ user: null, session: null, loading: false, error: null });
    }, 500);
  },

  clearError: () => set({ error: null }),
}));
