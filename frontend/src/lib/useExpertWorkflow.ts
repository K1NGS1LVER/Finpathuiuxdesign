import { useSyncExternalStore } from "react";

export type ReviewState = "DRAFT" | "PENDING_REVIEW" | "REVIEWED";

export type ExpertDomain =
  | "Financial Analyst"
  | "Risk Consultant"
  | "Tax Advisor";

export const EXPERT_DOMAINS: ExpertDomain[] = [
  "Financial Analyst",
  "Risk Consultant",
  "Tax Advisor",
];

export interface Submission {
  expert: ExpertDomain;
  notes: string;
  submittedAt: number;
}

export interface Review {
  approvedAt: number;
  commentary: string;
}

interface ExpertWorkflowSnapshot {
  state: ReviewState;
  submission: Submission | null;
  review: Review | null;
}

const COMMENTARY: Record<ExpertDomain, string> = {
  "Financial Analyst":
    "Formulas verified. Variance within acceptable 2% threshold.",
  "Risk Consultant":
    "Risk profile aligned with stated objectives. No exposure flags.",
  "Tax Advisor":
    "Deduction strategy compliant. Section 80C utilization optimal.",
};

const INITIAL: ExpertWorkflowSnapshot = {
  state: "DRAFT",
  submission: null,
  review: null,
};

let snapshot: ExpertWorkflowSnapshot = INITIAL;
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

function submit(input: { expert: ExpertDomain; notes: string }) {
  if (snapshot.state !== "DRAFT") return;
  snapshot = {
    state: "PENDING_REVIEW",
    submission: {
      expert: input.expert,
      notes: input.notes,
      submittedAt: Date.now(),
    },
    review: null,
  };
  emit();
}

function approve() {
  if (snapshot.state !== "PENDING_REVIEW" || !snapshot.submission) return;
  snapshot = {
    state: "REVIEWED",
    submission: snapshot.submission,
    review: {
      approvedAt: Date.now(),
      commentary: COMMENTARY[snapshot.submission.expert],
    },
  };
  emit();
}

function reset() {
  snapshot = INITIAL;
  emit();
}

export interface UseExpertWorkflowResult extends ExpertWorkflowSnapshot {
  submit: typeof submit;
  approve: typeof approve;
  reset: typeof reset;
}

export function useExpertWorkflow(): UseExpertWorkflowResult {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    state: current.state,
    submission: current.submission,
    review: current.review,
    submit,
    approve,
    reset,
  };
}
