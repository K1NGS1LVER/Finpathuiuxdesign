/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_AUTH_MOCK?: string;
  readonly VITE_MEET_LINK?: string;
  readonly VITE_FX_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
