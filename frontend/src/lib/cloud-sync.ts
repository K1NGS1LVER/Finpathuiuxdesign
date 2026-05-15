// ============================================================
// FinPath — Cloud sync (Phase 4 dual storage)
// Subscribes to Zustand store changes and debounces a PUT to
// /api/profile when storageMode === 'cloud' and a user is signed in.
// Also exposes hydrate-from-remote + push-now helpers used by the
// auth-store sign-in flow and the Settings panel.
// ============================================================

import type { FinancialProfile } from "./types";
import { useFinPathStore } from "./store";
import { useAuthStore } from "./auth-store";
import { apiFetch } from "./api";

/**
 * Keys persisted to the cloud `profiles.data` jsonb column. We deliberately
 * omit `chatHistory` (Penny has its own `chat_history` table), `plan`/
 * `healthScore` (recomputed on hydrate), and `pendingGoalDecisions` (UI-local).
 */
const SYNCED_KEYS: (keyof FinancialProfile)[] = [
  "onboarded",
  "income",
  "expenses",
  "debts",
  "savings",
  "investments",
  "emergencyFund",
  "goals",
  "currency",
  "strategy",
  "monthlySurplusReserve",
  "lastUpdated",
  "stepUpEnabled",
  "investmentReturnRate",
  "storageMode",
];

function serializeProfile(state: FinancialProfile): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of SYNCED_KEYS) {
    out[key as string] = (state as any)[key];
  }
  return out;
}

const DEBOUNCE_MS = 2000;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastSerialized = "";
let lastPushedAt = 0;
let subscribed = false;

function isAuthed(): boolean {
  return !!useAuthStore.getState().user;
}

function shouldSync(state: FinancialProfile): boolean {
  return state.storageMode === "cloud" && isAuthed();
}

async function pushNow(opts: { force?: boolean } = {}): Promise<boolean> {
  const state = useFinPathStore.getState();
  if (!opts.force && !shouldSync(state)) return false;

  const body = serializeProfile(state);
  const serialized = JSON.stringify(body);
  if (!opts.force && serialized === lastSerialized) return false;

  try {
    const res = await apiFetch("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        data: body,
        storage_mode: state.storageMode,
        force: !!opts.force,
      }),
    });
    if (!res.ok) {
      if (res.status === 409) {
        console.warn("[cloud-sync] remote newer — skipping push (409).");
      } else {
        console.warn("[cloud-sync] PUT /api/profile failed:", res.status);
      }
      return false;
    }
    lastSerialized = serialized;
    lastPushedAt = Date.now();
    return true;
  } catch (e) {
    console.warn("[cloud-sync] PUT error:", e);
    return false;
  }
}

export function scheduleCloudSync(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void pushNow();
  }, DEBOUNCE_MS);
}

/** Flush any pending debounced sync immediately. */
export async function flushCloudSync(opts: { force?: boolean } = {}): Promise<boolean> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  return pushNow(opts);
}

/**
 * Fetch remote profile and replace local state if remote is newer
 * (compared by `data.lastUpdated`). Returns the action taken.
 */
export async function hydrateFromRemote(): Promise<
  "no-auth" | "no-remote" | "remote-newer" | "local-newer" | "equal" | "error"
> {
  if (!isAuthed()) return "no-auth";
  try {
    const res = await apiFetch("/api/profile");
    if (!res.ok) return "error";
    const remote = await res.json();
    if (!remote || remote._ephemeral || !remote.data) return "no-remote";

    const local = useFinPathStore.getState();
    const localTs = Number(local.lastUpdated || 0);
    const remoteTs = Number(remote.data.lastUpdated || 0);

    if (remoteTs > localTs) {
      const remoteMode = (remote.storage_mode === "cloud" ? "cloud" : "local") as
        | "cloud"
        | "local";
      useFinPathStore.getState().replaceProfile({
        ...remote.data,
        storageMode: remoteMode,
      });
      // Mark as last-serialized so the immediate subscriber tick doesn't
      // re-push the same content we just pulled.
      lastSerialized = JSON.stringify(serializeProfile(useFinPathStore.getState()));
      lastPushedAt = Date.now();
      return "remote-newer";
    }
    if (localTs > remoteTs) return "local-newer";
    return "equal";
  } catch (e) {
    console.warn("[cloud-sync] hydrate error:", e);
    return "error";
  }
}

/** Initialize the store→cloud subscription. Idempotent. */
export function initCloudSync(): void {
  if (subscribed) return;
  subscribed = true;

  useFinPathStore.subscribe((state, prev) => {
    // lastUpdated is the canonical change signal — every setter bumps it.
    if (state.lastUpdated === prev.lastUpdated) return;
    if (!shouldSync(state as FinancialProfile)) return;
    scheduleCloudSync();
  });
}

/** Reset cached comparison state (e.g., on sign-out). */
export function resetCloudSyncCache(): void {
  lastSerialized = "";
  lastPushedAt = 0;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

export function getLastPushedAt(): number {
  return lastPushedAt;
}
