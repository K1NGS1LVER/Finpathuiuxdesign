// ============================================================
// proposal-apply — validates a Penny proposal payload and returns
// a thunk performing the store mutation. Extracted from
// ProposalCard so the validation logic is unit-testable.
//
// Invariant: every path that returns { ok: true } must reference
// entities that actually exist in the store. The Zustand setters
// (updateGoal / removeGoal / addLumpsum) silently no-op on unknown
// ids, which used to let a card show "approved" while nothing
// changed — validation here is the only guard.
// ============================================================

import { useFinPathStore } from '@/lib/store';
import type { Goal, InvestmentStrategy, DebtItem } from '@/lib/types';

export type PreparedApply = { ok: true; apply: () => void } | { ok: false; reason: string };

const DEBT_CATEGORIES: ReadonlySet<DebtItem['category']> = new Set([
  'homeLoan',
  'carLoan',
  'personalLoan',
  'creditCard',
  'educationLoan',
  'other',
]);

export function normalizeDebtCategory(raw: unknown): DebtItem['category'] {
  const s = String(raw ?? '').trim();
  if (DEBT_CATEGORIES.has(s as DebtItem['category'])) {
    return s as DebtItem['category'];
  }
  const lower = s.toLowerCase();
  if (lower.includes('credit')) return 'creditCard';
  if (lower.includes('home') || lower.includes('mortgage')) return 'homeLoan';
  if (lower.includes('car') || lower.includes('auto') || lower.includes('vehicle')) return 'carLoan';
  if (lower.includes('education') || lower.includes('student')) return 'educationLoan';
  if (lower.includes('personal')) return 'personalLoan';
  return 'other';
}

/**
 * Validate the proposal payload and return a thunk that performs the mutation.
 * Returning the thunk separately lets the caller PATCH the server first and
 * only mutate the local store on PATCH success — so a failed PATCH never
 * leaves the client out of sync.
 */
export function prepareApply(action: string, payload: Record<string, unknown>): PreparedApply {
  const store = useFinPathStore.getState();
  const goalExists = (id: string) => store.goals.some((g) => g.id === id);
  switch (action) {
    case 'setStrategy': {
      const s = payload.strategy as InvestmentStrategy;
      if (s !== 'avalanche' && s !== 'snowball') return { ok: false, reason: 'invalid strategy' };
      return { ok: true, apply: () => store.setStrategy(s) };
    }
    case 'setEmergencyFund': {
      const v = Number(payload.amount ?? payload.value);
      if (!Number.isFinite(v) || v < 0) return { ok: false, reason: 'invalid amount' };
      return { ok: true, apply: () => store.setEmergencyFund(v) };
    }
    case 'setSavings': {
      const v = Number(payload.amount ?? payload.value);
      if (!Number.isFinite(v) || v < 0) return { ok: false, reason: 'invalid amount' };
      return { ok: true, apply: () => store.setSavings(v) };
    }
    case 'setInvestments': {
      const v = Number(payload.amount ?? payload.value);
      if (!Number.isFinite(v) || v < 0) return { ok: false, reason: 'invalid amount' };
      return { ok: true, apply: () => store.setInvestments(v) };
    }
    case 'updateGoal': {
      const id = String(payload.id ?? '');
      if (!id) return { ok: false, reason: 'missing goal id' };
      if (!goalExists(id)) {
        return { ok: false, reason: 'goal not found — ask Penny to try again' };
      }

      // Models sometimes flatten the payload (no `updates` wrapper) or stringify
      // numbers ("targetAmount": "150000"). Both render fine in the card but slip
      // past store.updateGoal's `typeof === "number"` guard and silently no-op.
      const rawUpdates = (payload.updates ?? {}) as Record<string, unknown>;
      const rawTop = payload as Record<string, unknown>;
      const pick = (canonical: string, alias?: string): unknown => {
        if (canonical in rawUpdates) return rawUpdates[canonical];
        if (alias && alias in rawUpdates) return rawUpdates[alias];
        if (canonical in rawTop) return rawTop[canonical];
        if (alias && alias in rawTop) return rawTop[alias];
        return undefined;
      };
      const toNum = (v: unknown): number | undefined => {
        if (v === undefined || v === null || v === '') return undefined;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      const updates: Partial<Goal> = {};
      const targetAmount = toNum(pick('targetAmount', 'target'));
      if (targetAmount !== undefined) updates.targetAmount = targetAmount;
      const currentAmount = toNum(pick('currentAmount', 'current'));
      if (currentAmount !== undefined) updates.currentAmount = currentAmount;
      const timelineMonths = toNum(pick('timelineMonths', 'timeline_months'));
      if (timelineMonths !== undefined)
        updates.timelineMonths = Math.max(1, Math.round(timelineMonths));
      const priority = toNum(pick('priority'));
      if (priority !== undefined) updates.priority = priority;
      const nameVal = pick('name');
      if (typeof nameVal === 'string' && nameVal.trim()) updates.name = nameVal.trim();

      if (Object.keys(updates).length === 0) {
        console.warn('[proposal-apply] updateGoal: no recognizable fields in payload', payload);
        return { ok: false, reason: 'no recognizable fields to update' };
      }
      return { ok: true, apply: () => store.updateGoal(id, updates) };
    }
    case 'addGoal': {
      const raw = (payload.goal ?? payload) as Record<string, unknown>;
      const name = String(raw.name ?? '').trim();
      if (!name) return { ok: false, reason: 'missing goal name' };
      const targetAmount = Number(raw.targetAmount ?? raw.target ?? 0);
      if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
        return { ok: false, reason: 'goal needs targetAmount > 0' };
      }
      const timelineMonths = Number(raw.timelineMonths ?? raw.timeline_months ?? 12);
      const newGoal: Goal = {
        id: String(raw.id ?? `goal-${Date.now()}`),
        name,
        icon: String(raw.icon ?? 'Target'),
        category: String(raw.category ?? 'custom') as Goal['category'],
        targetAmount,
        currentAmount: Number(raw.currentAmount ?? raw.current ?? 0),
        timelineMonths:
          Number.isFinite(timelineMonths) && timelineMonths > 0 ? Math.round(timelineMonths) : 12,
        priority: Number(raw.priority ?? 0),
        status: 'not-started',
        monthlyAllocation: 0,
        color: String(raw.color ?? 'var(--accent)'),
      };
      return { ok: true, apply: () => store.addGoal(newGoal) };
    }
    case 'removeGoal': {
      const id = String(payload.id ?? '');
      if (!id) return { ok: false, reason: 'missing goal id' };
      if (!goalExists(id)) {
        return { ok: false, reason: 'goal not found — ask Penny to try again' };
      }
      return { ok: true, apply: () => store.removeGoal(id) };
    }
    case 'addLumpsum': {
      const id = String(payload.goalId ?? payload.id ?? '');
      const amount = Number(payload.amount);
      if (!id || !Number.isFinite(amount) || amount <= 0)
        return { ok: false, reason: 'invalid lumpsum' };
      if (!goalExists(id)) {
        return { ok: false, reason: 'goal not found — ask Penny to try again' };
      }
      return { ok: true, apply: () => store.addLumpsum(id, amount) };
    }
    case 'addDebt': {
      const raw = (payload.debt ?? payload) as Record<string, unknown>;
      const name = String(raw.name ?? raw.description ?? '').trim();
      // Principal: prefer explicit; fall back to absolute amount (Penny sometimes sends negative
      // amounts to signal debt — coerce here so the proposal can still apply).
      const principalRaw = Number(raw.principal ?? raw.amount ?? 0);
      const principal = Math.abs(principalRaw);
      if (!name || !Number.isFinite(principal) || principal <= 0) {
        return { ok: false, reason: 'debt needs a name and principal > 0' };
      }
      const interestRate = Number.isFinite(Number(raw.interestRate))
        ? Math.max(0, Number(raw.interestRate))
        : 12;
      const monthlyPayment =
        Number.isFinite(Number(raw.monthlyPayment)) && Number(raw.monthlyPayment) > 0
          ? Number(raw.monthlyPayment)
          : Math.max(1, Math.round(principal / 12));
      const remainingMonths =
        Number.isFinite(Number(raw.remainingMonths)) && Number(raw.remainingMonths) > 0
          ? Math.round(Number(raw.remainingMonths))
          : Math.max(1, Math.ceil(principal / monthlyPayment));
      const category = normalizeDebtCategory(raw.category);
      const id = String(raw.id ?? `debt-${Date.now()}`);
      const newDebt: DebtItem = {
        id,
        name,
        category,
        principal,
        interestRate,
        monthlyPayment,
        remainingMonths,
      };
      return {
        ok: true,
        apply: () => {
          store.addDebtItem(newDebt);
        },
      };
    }
    default:
      return { ok: false, reason: `unknown action: ${action}` };
  }
}
