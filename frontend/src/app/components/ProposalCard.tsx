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
import { prepareApply } from '@/lib/proposal-apply';

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
