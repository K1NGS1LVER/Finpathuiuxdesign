import { useSyncExternalStore } from "react";

export type ConsultationState = "IDLE" | "SCHEDULING" | "SCHEDULED";

export type ExpertDomain =
  | "Financial Analyst"
  | "Risk Consultant"
  | "Tax Advisor";

export const EXPERT_DOMAINS: ExpertDomain[] = [
  "Financial Analyst",
  "Risk Consultant",
  "Tax Advisor",
];

export const TIMEZONES = [
  { value: "Asia/Kolkata",       label: "IST — India Standard Time" },
  { value: "UTC",                label: "UTC — Coordinated Universal Time" },
  { value: "Europe/London",      label: "GMT/BST — London" },
  { value: "Europe/Paris",       label: "CET — Central European" },
  { value: "Asia/Dubai",         label: "GST — Dubai" },
  { value: "Asia/Singapore",     label: "SGT — Singapore" },
  { value: "Asia/Tokyo",         label: "JST — Japan" },
  { value: "America/New_York",   label: "ET — New York" },
  { value: "America/Chicago",    label: "CT — Chicago" },
  { value: "America/Los_Angeles","label": "PT — Los Angeles" },
] as const;

export function getTzAbbr(timezone: string): string {
  const match = TIMEZONES.find((t) => t.value === timezone);
  return match ? match.label.split(" — ")[0] : timezone;
}

// Meeting link comes from the environment; an empty value means consultation
// joining is not configured for this deployment (the UI hides the link/QR).
export const MEET_LINK = (import.meta.env.VITE_MEET_LINK as string | undefined) ?? "";

export interface ConsultationData {
  expert: ExpertDomain;
  datetime: string;
  timezone: string;
  scheduledAt: number;
}

interface ConsultationSnapshot {
  state: ConsultationState;
  data: ConsultationData | null;
}

const INITIAL: ConsultationSnapshot = { state: "IDLE", data: null };

let snapshot: ConsultationSnapshot = INITIAL;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function runSchedule(input: { expert: ExpertDomain; datetime: string; timezone: string }) {
  snapshot = { state: "SCHEDULING", data: null };
  emit();
  setTimeout(() => {
    snapshot = {
      state: "SCHEDULED",
      data: { ...input, scheduledAt: Date.now() },
    };
    emit();
  }, 1500);
}

function schedule(input: { expert: ExpertDomain; datetime: string; timezone: string }) {
  if (snapshot.state !== "IDLE") return;
  runSchedule(input);
}

function reschedule(input: { expert: ExpertDomain; datetime: string; timezone: string }) {
  if (snapshot.state !== "SCHEDULED") return;
  runSchedule(input);
}

function updateDatetime(newDatetime: string) {
  if (snapshot.state !== "SCHEDULED" || !snapshot.data) return;
  snapshot = {
    ...snapshot,
    data: { ...snapshot.data, datetime: newDatetime },
  };
  emit();
}

function reset() {
  snapshot = INITIAL;
  emit();
}

export interface UseExpertConsultationResult extends ConsultationSnapshot {
  schedule: typeof schedule;
  reschedule: typeof reschedule;
  updateDatetime: typeof updateDatetime;
  reset: typeof reset;
}

export function useExpertConsultation(): UseExpertConsultationResult {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    state: current.state,
    data: current.data,
    schedule,
    reschedule,
    updateDatetime,
    reset,
  };
}
