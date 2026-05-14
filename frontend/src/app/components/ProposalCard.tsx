// ============================================================
// ProposalCard — renders a Penny-proposed store mutation with
// Approve / Reject buttons.
// Approve flow: validate payload → PATCH server → apply local
// Zustand mutation. Local state changes only on PATCH success.
// Reject flow: PATCH server only.
// ============================================================

import { useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { useFinPathStore } from '@/lib/store';
import { apiFetch } from '@/lib/api';
import type { Goal, InvestmentStrategy } from '@/lib/types';

export type ProposalAction =
  | 'setStrategy'
  | 'setEmergencyFund'
  | 'setSavings'
  | 'setInvestments'
  | 'updateGoal'
  | 'addGoal'
  | 'removeGoal'
  | 'addLumpsum';

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
};

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
      const updates = (payload.updates ?? {}) as Partial<Goal>;
      if (!id) return { ok: false, reason: 'missing goal id' };
      return { ok: true, apply: () => store.updateGoal(id, updates) };
    }
    case 'addGoal': {
      const g = payload.goal as Goal | undefined;
      if (!g || !g.name) return { ok: false, reason: 'missing goal' };
      return { ok: true, apply: () => store.addGoal(g) };
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
    default:
      return { ok: false, reason: `unknown action: ${action}` };
  }
}

export default function ProposalCard({ proposal, onResolved }: Props) {
  const [status, setStatus] = useState<Proposal['status']>(proposal.status || 'pending');
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const label = ACTION_LABEL[proposal.action] ?? proposal.action;

  // Returns true on success (server says we own the transition), false on hard fail.
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
      setErrMsg(`Could not ${next === 'approved' ? 'approve' : 'reject'} (HTTP ${r.status}).`);
      return false;
    } catch {
      // Network failure — treat as success only when Supabase isn't configured
      // (ephemeral proposals). Server-side patch endpoint already echos in that case,
      // so a thrown error here is a real network problem.
      setErrMsg('Network error.');
      return false;
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
          background: 'var(--surface-2, var(--neutral-50))',
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
        background: 'var(--surface, var(--neutral-50))',
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
      <pre
        className="text-xs overflow-x-auto rounded-lg px-2 py-1.5"
        style={{ background: 'var(--surface-2, var(--neutral-50))', color: 'var(--secondary)' }}
      >
        {JSON.stringify(proposal.payload, null, 2)}
      </pre>
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
