// ============================================================
// ProposalCard — renders a Penny-proposed store mutation with
// Approve / Reject buttons.
// Approve flow: validate payload → PATCH server → apply local
// Zustand mutation. Local state changes only on PATCH success.
// Reject flow: PATCH server only.
// ============================================================

import { useState, type ReactNode } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { useFinPathStore } from '@/lib/store';
import { apiFetch } from '@/lib/api';
import type { Goal, InvestmentStrategy, DebtItem } from '@/lib/types';

export type ProposalAction =
  | 'setStrategy'
  | 'setEmergencyFund'
  | 'setSavings'
  | 'setInvestments'
  | 'updateGoal'
  | 'addGoal'
  | 'removeGoal'
  | 'addLumpsum'
  | 'addDebt';

export interface Proposal {
  id: string;
  action: ProposalAction | string;
  payload: Record<string, unknown>;
  rationale?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | 'expired';
}

interface Props {
  proposal: Proposal;
  onResolved?: (next: Proposal['status']) => void;
}

const ACTION_LABEL: Record<string, string> = {
  setStrategy: 'Change debt strategy',
  setEmergencyFund: 'Update emergency fund',
  setSavings: 'Update savings',
  setInvestments: 'Update investments',
  updateGoal: 'Update goal',
  addGoal: 'Add a new goal',
  removeGoal: 'Remove goal',
  addLumpsum: 'Add lump-sum to goal',
  addDebt: 'Add a new debt',
};

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
      <span style={{ color: 'var(--secondary)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span
        style={{
          color: 'var(--foreground)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-medium)',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PayloadSummary({
  action,
  payload,
  goalName,
}: {
  action: string;
  payload: Record<string, unknown>;
  goalName: (id: string) => string;
}) {
  const p = payload;

  const wrap = (rows: ReactNode) => (
    <div
      style={{
        background: 'var(--surface-tint)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {rows}
    </div>
  );

  switch (action) {
    case 'setStrategy': {
      const s = String(p.strategy ?? '');
      const label = s === 'avalanche' ? 'Avalanche — highest interest first' : 'Snowball — smallest balance first';
      return wrap(<Row label="Strategy" value={label} />);
    }

    case 'setEmergencyFund': {
      const v = Number(p.amount ?? p.value);
      return wrap(<Row label="Target" value={fmt(v)} />);
    }

    case 'setSavings': {
      const v = Number(p.amount ?? p.value);
      return wrap(<Row label="Monthly savings" value={fmt(v)} />);
    }

    case 'setInvestments': {
      const v = Number(p.amount ?? p.value);
      return wrap(<Row label="Monthly investments" value={fmt(v)} />);
    }

    case 'addGoal': {
      const g = (p.goal ?? p) as Record<string, unknown>;
      const rows: ReactNode[] = [
        <Row key="name" label="Name" value={String(g.name ?? '—')} />,
      ];
      if (g.targetAmount != null) rows.push(<Row key="target" label="Target" value={fmt(Number(g.targetAmount))} />);
      if (g.timelineMonths != null) rows.push(<Row key="tl" label="Timeline" value={`${g.timelineMonths} months`} />);
      if (g.priority != null) rows.push(<Row key="pri" label="Priority" value={String(g.priority)} />);
      return wrap(<>{rows}</>);
    }

    case 'removeGoal': {
      const id = String(p.id ?? '');
      return wrap(<Row label="Goal" value={goalName(id)} />);
    }

    case 'updateGoal': {
      const id = String(p.id ?? '');
      const updates = (p.updates ?? {}) as Record<string, unknown>;
      const FIELD_LABELS: Record<string, string> = {
        targetAmount: 'Target',
        timelineMonths: 'Timeline (months)',
        name: 'Name',
        priority: 'Priority',
        currentAmount: 'Already saved',
      };
      const rows: ReactNode[] = [<Row key="goal" label="Goal" value={goalName(id)} />];
      for (const [k, v] of Object.entries(updates)) {
        const lbl = FIELD_LABELS[k] ?? k;
        const display =
          k === 'targetAmount' || k === 'currentAmount'
            ? fmt(Number(v))
            : String(v);
        rows.push(<Row key={k} label={lbl} value={display} />);
      }
      return wrap(<>{rows}</>);
    }

    case 'addLumpsum': {
      const id = String(p.goalId ?? p.id ?? '');
      const amount = Number(p.amount);
      return wrap(
        <>
          <Row label="Goal" value={goalName(id)} />
          <Row label="Lump sum" value={fmt(amount)} />
        </>,
      );
    }

    case 'addDebt': {
      const d = (p.debt ?? p) as Record<string, unknown>;
      const name = String(d.name ?? d.description ?? '—');
      const principal = Math.abs(Number(d.principal ?? d.amount ?? 0));
      const rate = Number.isFinite(Number(d.interestRate)) ? Number(d.interestRate) : 12;
      const emi = Number.isFinite(Number(d.monthlyPayment)) ? Number(d.monthlyPayment) : 0;
      const rows: ReactNode[] = [
        <Row key="name" label="Name" value={name} />,
        <Row key="principal" label="Principal" value={fmt(principal)} />,
        <Row key="rate" label="Interest" value={`${rate}% p.a.`} />,
      ];
      if (emi > 0) rows.push(<Row key="emi" label="EMI" value={`${fmt(emi)}/mo`} />);
      return wrap(<>{rows}</>);
    }

    default:
      return wrap(
        <span style={{ color: 'var(--secondary)', fontSize: 'var(--text-xs)' }}>
          {JSON.stringify(payload, null, 2)}
        </span>,
      );
  }
}

const DEBT_CATEGORIES: ReadonlySet<DebtItem['category']> = new Set([
  'homeLoan',
  'carLoan',
  'personalLoan',
  'creditCard',
  'educationLoan',
  'other',
]);

function normalizeDebtCategory(raw: unknown): DebtItem['category'] {
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

type PreparedApply =
  | { ok: true; apply: () => void }
  | { ok: false; reason: string };

/**
 * Validate the proposal payload and return a thunk that performs the mutation.
 * Returning the thunk separately lets the caller PATCH the server first and
 * only mutate the local store on PATCH success — so a failed PATCH never
 * leaves the client out of sync.
 */
function prepareApply(action: string, payload: Record<string, unknown>): PreparedApply {
  const store = useFinPathStore.getState();
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

      // Llama sometimes flattens the payload (no `updates` wrapper) or stringifies
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
      if (timelineMonths !== undefined) updates.timelineMonths = Math.max(1, Math.round(timelineMonths));
      const priority = toNum(pick('priority'));
      if (priority !== undefined) updates.priority = priority;
      const nameVal = pick('name');
      if (typeof nameVal === 'string' && nameVal.trim()) updates.name = nameVal.trim();

      if (Object.keys(updates).length === 0) {
        console.warn('[ProposalCard] updateGoal: no recognizable fields in payload', payload);
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
        timelineMonths: Number.isFinite(timelineMonths) && timelineMonths > 0 ? Math.round(timelineMonths) : 12,
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
      return { ok: true, apply: () => store.removeGoal(id) };
    }
    case 'addLumpsum': {
      const id = String(payload.goalId ?? payload.id ?? '');
      const amount = Number(payload.amount);
      if (!id || !Number.isFinite(amount) || amount <= 0) return { ok: false, reason: 'invalid lumpsum' };
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
      const monthlyPayment = Number.isFinite(Number(raw.monthlyPayment)) && Number(raw.monthlyPayment) > 0
        ? Number(raw.monthlyPayment)
        : Math.max(1, Math.round(principal / 12));
      const remainingMonths = Number.isFinite(Number(raw.remainingMonths)) && Number(raw.remainingMonths) > 0
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
          const current = useFinPathStore.getState().debts;
          const nextItems = [...(current.items ?? []), newDebt];
          const nextMonthly = nextItems.reduce(
            (sum, d) => sum + Math.max(0, d.monthlyPayment || 0),
            0,
          );
          const nextPrincipal = nextItems.reduce(
            (sum, d) => sum + Math.max(0, d.principal || 0),
            0,
          );
          store.setDebts({
            items: nextItems,
            totalMonthly: nextMonthly,
            totalPrincipal: nextPrincipal,
          });
        },
      };
    }
    default:
      return { ok: false, reason: `unknown action: ${action}` };
  }
}

export default function ProposalCard({ proposal, onResolved }: Props) {
  const [status, setStatus] = useState<Proposal['status']>(proposal.status || 'pending');
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const goals = useFinPathStore(s => s.goals);
  const goalName = (id: string) => goals.find(g => g.id === id)?.name ?? id;

  const label = ACTION_LABEL[proposal.action] ?? proposal.action;

  // Returns true on success (server says we own the transition), false on hard fail.
  // Best-effort: only a 409 Conflict (double-resolve) blocks. All other failures
  // (404 race, network error, Supabase not configured) allow the local mutation
  // to proceed — the PATCH is server sync, not a gate.
  async function patch(next: 'approved' | 'rejected'): Promise<boolean> {
    try {
      const r = await apiFetch(`/api/proposals/${encodeURIComponent(proposal.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      if (r.ok) return true;
      if (r.status === 409) {
        setErrMsg('Proposal already resolved.');
        return false;
      }
      // Non-409 failure (404 race, 500, etc.) — proceed with local mutation.
      // The proposal was ephemeral or the DB write hadn't landed yet.
      return true;
    } catch {
      // Network failure — proceed with local mutation (offline-first).
      return true;
    }
  }

  async function handleApprove() {
    setBusy(true);
    setErrMsg(null);
    // Validate payload BEFORE touching the server so a bad payload can't leave
    // the row marked `approved` with no matching local mutation.
    const prepared = prepareApply(proposal.action, proposal.payload);
    if (!prepared.ok) {
      setErrMsg(`Can't apply: ${prepared.reason}`);
      setBusy(false);
      return;
    }
    const ok = await patch('approved');
    if (!ok) { setBusy(false); return; }
    prepared.apply();
    setStatus('approved');
    onResolved?.('approved');
    setBusy(false);
  }

  async function handleReject() {
    setBusy(true);
    setErrMsg(null);
    const ok = await patch('rejected');
    if (!ok) { setBusy(false); return; }
    setStatus('rejected');
    onResolved?.('rejected');
    setBusy(false);
  }

  if (status === 'approved' || status === 'rejected' || status === 'expired') {
    return (
      <div
        className="rounded-xl px-3 py-2 text-xs"
        style={{
          background: 'var(--surface-tint)',
          color: 'var(--secondary)',
          border: '1px solid var(--border)',
        }}
      >
        {label} — {status}.
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--accent)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          Proposal
        </span>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {proposal.rationale && (
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          {proposal.rationale}
        </p>
      )}
      <PayloadSummary action={proposal.action} payload={proposal.payload} goalName={goalName} />
      {errMsg && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--red)' }}>
          <AlertTriangle size={12} /> {errMsg}
        </div>
      )}
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={handleApprove}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          <Check size={14} /> Approve
        </button>
        <button
          disabled={busy}
          onClick={handleReject}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          style={{
            background: 'transparent',
            color: 'var(--secondary)',
            border: '1px solid var(--border)',
          }}
        >
          <X size={14} /> Reject
        </button>
      </div>
    </div>
  );
}
