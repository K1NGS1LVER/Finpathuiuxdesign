// ============================================================
// Re-export shim — the store now lives in ./store/ (slices).
// Kept so the `@/lib/store` import path used across the app
// (and any external tooling) stays stable.
// ============================================================

export { useFinPathStore, type FinPathStore } from './store/index';
