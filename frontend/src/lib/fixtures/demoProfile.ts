import type { FinancialProfile } from "@/lib/types";

/**
 * Shape of the seeded demo profile that Step 1 will fill in. The
 * `milestones` field will eventually be typed against the `Milestone` type
 * landing in Step 4 — for now it is `unknown[]` so call-sites do not lock
 * in to a shape that may change.
 */
export type DemoProfileSeed = {
  profile: FinancialProfile;
  milestones: unknown[];
};

/**
 * Loads the demo profile into the Zustand store, replacing the current
 * state with a curated showcase dataset.
 *
 * NOTE: shell only — implementation lands in Step 1.1. This file exists so
 * Step 1 can fill in data without restructuring imports across the app.
 */
export async function loadDemoProfile(): Promise<void> {
  throw new Error("Not implemented — see Step 1.1");
}
