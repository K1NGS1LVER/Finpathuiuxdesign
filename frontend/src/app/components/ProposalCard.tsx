// ============================================================
// ProposalCard — renders a Penny-proposed store mutation with
// Approve / Reject buttons. Approve applies the Zustand setter
// locally then PATCHes the proposal status; Reject just PATCHes.
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

function applyProposal(action: string, payload: Record<string, unknown>): { ok: boolean; reason?: string } {
  const store = useFinPathStore.getState();
  try {
    switch (action) {
      case 'setStrategy': {
        const s = payload.strategy as InvestmentStrategy;
        if (s !== 'avalanche' && s !== 'snowball') return { ok: false, reason: 'invalid strategy' };
        store.setStrategy(s);
        return { ok: true };
      }
      case 'setEmergencyFund': {
        const v = Number(payload.amount ?? payload.value);
        if (!Number.isFinite(v) || v < 0) return { ok: false, reason: 'invalid amount' };
        store.setEmergencyFund(v);
        return { ok: true };
      }
      case 'setSavings': {
        const v = Number(payload.amount ?? payload.value);
        if (!Number.isFinite(v) || v < 0) return { ok: false, reason: 'invalid amount' };
        store.setSavings(v);
        return { ok: true };
      }
      case 'setInvestments': {
        const v = Number(payload.amount ?? payload.value);
        if (!Number.isFinite(v) || v < 0) return { ok: false, reason: 'invalid amount' };
        store.setInvestments(v);
        return { ok: true };
      }
      case 'updateGoal': {
        const id = String(payload.id ?? '');
        const updates = (payload.updates ?? {}) as Partial<Goal>;
        if (!id) return { ok: false, reason: 'missing goal id' };
        store.updateGoal(id, updates);
        return { ok: true };
      }
      case 'addGoal': {
        const g = payload.goal as Goal | undefined;
        if (!g || !g.name) return { ok: false, reason: 'missing goal' };
        store.addGoal(g);
        return { ok: true };
      }
      case 'removeGoal': {
        const id = String(payload.id ?? '');
        if (!id) return { ok: false, reason: 'missing goal id' };
        store.removeGoal(id);
        return { ok: true };
      }
      case 'addLumpsum': {
        const id = String(payload.goalId ?? payload.id ?? '');
        const amount = Number(payload.amount);
        if (!id || !Number.isFinite(amount) || amount <= 0) return { ok: false, reason: 'invalid lumpsum' };
        store.addLumpsum(id, amount);
        return { ok: true };
      }
      default:
        return { ok: false, reason: `unknown action: ${action}` };
    }
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'apply failed' };
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
    const ok = await patch('approved');
    if (!ok) { setBusy(false); return; }
    const result = applyProposal(proposal.action, proposal.payload);
    if (!result.ok) {
      setErrMsg(`Approved but couldn't apply: ${result.reason}`);
      setBusy(false);
      return;
    }
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
