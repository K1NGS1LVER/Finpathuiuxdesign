import { useState, useMemo, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useFinPathStore } from '@/lib/store';
import { avalanche, snowball, compareStrategies } from '@/lib/debt-strategies';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { formatInr, usePalette } from '@/app/components/SankeyFlow';

const fmtCompact = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `${sign}₹${(abs / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(0)}K`;
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
};

export default function Debt({ onPennyClick }: { onPennyClick?: () => void }) {
  const debts = useFinPathStore(s => s.debts);
  const goals = useFinPathStore(s => s.goals);
  const pal = usePalette();

  const [extraPayment, setExtraPayment] = useState(0);
  const [timelineStrategy, setTimelineStrategy] = useState<'avalanche' | 'snowball'>('avalanche');

  const debtGoal = goals.find(g => g.category === 'debt' && g.status !== 'complete');

  const debtItems = useMemo(() => {
    if (debts.items.length > 0) return debts.items;
    if (!debtGoal) return [];
    const monthlyPayment = debtGoal.monthlyAllocation || debts.totalMonthly || 0;
    const principal = debtGoal.targetAmount || debts.totalPrincipal || monthlyPayment * 12;
    if (monthlyPayment <= 0 && principal <= 0) return [];
    return [{
      id: 'debt-from-goal',
      name: debtGoal.name,
      category: 'other' as const,
      principal,
      interestRate: 10,
      monthlyPayment,
      remainingMonths: monthlyPayment > 0 ? Math.max(1, Math.ceil(principal / monthlyPayment)) : 12,
    }];
  }, [debts.items, debts.totalMonthly, debts.totalPrincipal, debtGoal]);

  const setDebts = useFinPathStore(s => s.setDebts);
  useEffect(() => {
    if (debts.items.length === 0 && debtGoal && debtGoal.monthlyAllocation > 0) {
      const restored = debtItems.length > 0 ? debtItems : [];
      if (restored.length > 0) {
        setDebts({ items: restored, totalMonthly: debtGoal.monthlyAllocation, totalPrincipal: debtGoal.targetAmount });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const comparison = useMemo(() => {
    if (debtItems.length === 0) return null;
    return compareStrategies(debtItems, extraPayment);
  }, [debtItems, extraPayment]);

  const timelineResult = useMemo(() => {
    if (debtItems.length === 0) return null;
    return timelineStrategy === 'avalanche'
      ? avalanche(debtItems, extraPayment)
      : snowball(debtItems, extraPayment);
  }, [debtItems, extraPayment, timelineStrategy]);

  const otherTimelineResult = useMemo(() => {
    if (debtItems.length === 0) return null;
    return timelineStrategy === 'avalanche'
      ? snowball(debtItems, extraPayment)
      : avalanche(debtItems, extraPayment);
  }, [debtItems, extraPayment, timelineStrategy]);

  const timelineChartData = useMemo(() => {
    if (!timelineResult) return [];
    const maxMonths = timelineResult.totalMonths;
    const months: Array<{ month: number; label: string } & Record<string, number>> = [];
    const debtIds = debtItems.map(d => d.id);

    const initialBalances: Record<string, number> = {};
    for (const d of debtItems) initialBalances[d.id] = d.principal;

    for (let m = 0; m <= maxMonths; m++) {
      const date = new Date();
      date.setMonth(date.getMonth() + m);
      const entry: any = {
        month: m,
        label: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      };
      for (const id of debtIds) entry[id] = m === 0 ? initialBalances[id] : 0;
      months.push(entry);
    }

    for (const step of timelineResult.steps) {
      if (step.month <= maxMonths) {
        const entry = months[step.month];
        if (entry) entry[step.debtId] = step.remainingBalance;
      }
    }

    for (let m = 1; m <= maxMonths; m++) {
      for (const id of debtIds) {
        const val = months[m][id];
        if (val === undefined || val === null) months[m][id] = months[m - 1]?.[id] ?? 0;
      }
    }

    if (otherTimelineResult && debtItems.length > 1) {
      const otherBal: Record<string, number> = {};
      for (const d of debtItems) otherBal[d.id] = d.principal;
      months[0]._otherTotal = Object.values(otherBal).reduce((s, v) => s + v, 0);
      const byMonth = new Map<number, typeof otherTimelineResult.steps>();
      for (const step of otherTimelineResult.steps) {
        if (!byMonth.has(step.month)) byMonth.set(step.month, []);
        byMonth.get(step.month)!.push(step);
      }
      for (let m = 1; m <= maxMonths; m++) {
        const steps = byMonth.get(m);
        if (steps) for (const s of steps) otherBal[s.debtId] = s.remainingBalance;
        months[m]._otherTotal = Math.max(0, Object.values(otherBal).reduce((s, v) => s + v, 0));
      }
    }

    return months;
  }, [timelineResult, otherTimelineResult, debtItems]);

  const DEBT_COLORS = useMemo(() => [pal.blue, pal.lime, pal.red, pal.amber, pal.green, pal.purple], [pal]);

  const totalPrincipal = useMemo(() => debtItems.reduce((s, d) => s + d.principal, 0), [debtItems]);
  const totalMonthlyEMI = useMemo(() => debtItems.reduce((s, d) => s + d.monthlyPayment, 0), [debtItems]);
  const avgInterestRate = useMemo(() => {
    if (totalPrincipal === 0) return 0;
    return debtItems.reduce((s, d) => s + d.interestRate * d.principal, 0) / totalPrincipal;
  }, [debtItems, totalPrincipal]);

  const sortedDebts = useMemo(() => {
    if (timelineStrategy === 'avalanche') return [...debtItems].sort((a, b) => b.interestRate - a.interestRate);
    return [...debtItems].sort((a, b) => a.principal - b.principal);
  }, [debtItems, timelineStrategy]);

  const pennyInsight = useMemo(() => {
    if (!comparison || debtItems.length === 0) return null;
    const saving = Math.abs(comparison.interestSaved);
    const months = Math.abs(comparison.monthsDifference);
    const better = comparison.recommendation === 'avalanche' ? 'Avalanche' : 'Snowball';
    return { better, saving, months };
  }, [comparison, debtItems.length]);

  return (
    <div className="page-animate" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p className="text-label">Liabilities</p>
        <h2 style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, letterSpacing: '-0.02em', marginTop: 'var(--space-1)', fontFamily: 'var(--font-display)', color: 'var(--card-foreground)' }}>
          Debt
        </h2>
      </div>

      {debtItems.length > 0 ? (
        <>
          {/* 3 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            {([
              { label: 'Total Outstanding', value: fmtCompact(totalPrincipal), color: 'var(--red-text)' },
              { label: 'Monthly EMI', value: formatInr(totalMonthlyEMI), color: 'var(--card-foreground)' },
              { label: 'Avg Interest Rate', value: `${avgInterestRate.toFixed(1)}%`, color: 'var(--amber-text)' },
            ] as const).map(({ label, value, color }) => (
              <div key={label} className="bento-card" style={{ padding: 'var(--space-4)' }}>
                <p className="text-label">{label}</p>
                <p className="slashed-zero" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color, marginTop: 'var(--space-1)' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Main Card: Controls + Chart + Debt List */}
          <div className="bento-card" style={{ marginBottom: 'var(--space-4)' }}>
            {/* Strategy Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <div>
                <p className="text-label">Payoff Strategy</p>
                {debtItems.length === 1 && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--tertiary)', marginTop: 2 }}>
                    Both strategies identical with one debt
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  onClick={() => setTimelineStrategy('avalanche')}
                  className={`pill${timelineStrategy === 'avalanche' ? ' active' : ''}`}
                >
                  Avalanche
                </button>
                <button
                  onClick={() => setTimelineStrategy('snowball')}
                  className={`pill${timelineStrategy === 'snowball' ? ' active' : ''}`}
                >
                  Snowball
                </button>
              </div>
            </div>

            {/* Extra Payment Slider */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
                <p className="text-label">Extra Monthly Payment</p>
                <span className="slashed-zero" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--card-foreground)' }}>
                  {formatInr(extraPayment)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50000}
                step={500}
                value={extraPayment}
                onChange={e => setExtraPayment(Number(e.target.value))}
                className="range"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--tertiary)', marginTop: 'var(--space-1)' }}>
                <span>₹0</span>
                <span>₹50,000</span>
              </div>
            </div>

            {/* Payoff Timeline Chart */}
            {timelineChartData.length > 0 && (
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={timelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--secondary)' }} interval={Math.max(1, Math.floor(timelineChartData.length / 8))} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--secondary)' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <RechartsTooltip
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontFamily: 'var(--font-body)', color: 'var(--card-foreground)' }}
                      formatter={(value: number) => [formatInr(value), '']}
                    />
                    {debtItems.map((d, i) => (
                      <Area key={d.id} type="monotone" dataKey={d.id} name={d.name} stackId="1"
                        stroke={DEBT_COLORS[i % DEBT_COLORS.length]} fill={DEBT_COLORS[i % DEBT_COLORS.length]} fillOpacity={0.3} strokeWidth={2} />
                    ))}
                    {debtItems.length > 1 && (
                      <Line
                        type="monotone"
                        dataKey="_otherTotal"
                        stroke="var(--secondary)"
                        strokeDasharray="6 3"
                        strokeWidth={1.5}
                        dot={false}
                        opacity={0.45}
                        name={timelineStrategy === 'avalanche' ? 'Snowball total' : 'Avalanche total'}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Ranked Debt List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {sortedDebts.map((d, i) => {
                const relatedGoal = goals.find(g => g.category === 'debt' && (g.name === d.name || g.name.includes(d.name)));
                const originalAmount = relatedGoal?.targetAmount;
                const paidPct = originalAmount && originalAmount > 0 && d.principal <= originalAmount
                  ? Math.min(100, ((originalAmount - d.principal) / originalAmount) * 100)
                  : null;
                const payoffMonth = timelineResult?.payoffDates?.[d.id];
                const payoffDate = payoffMonth
                  ? (() => {
                      const pd = new Date();
                      pd.setMonth(pd.getMonth() + payoffMonth);
                      return pd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                    })()
                  : null;

                return (
                  <div key={d.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface-hover)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 32, height: 32,
                      borderRadius: 'var(--radius-md)',
                      background: i === 0 ? 'var(--red-subtle)' : 'var(--surface-tint)',
                      color: i === 0 ? 'var(--red-text)' : 'var(--tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 'var(--text-sm)',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--card-foreground)' }}>{d.name}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--tertiary)' }}>
                        {d.interestRate}% APR · {formatInr(d.monthlyPayment)}/mo
                        {payoffDate && <> · <span style={{ color: 'var(--accent-text)' }}>free {payoffDate}</span></>}
                      </p>
                    </div>
                    {paidPct !== null && (
                      <div style={{ width: 160, height: 8, background: 'var(--surface-tint)', borderRadius: 'var(--radius-full)', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{
                          height: '100%',
                          width: `${paidPct}%`,
                          background: d.interestRate > 25 ? 'var(--red)' : 'var(--amber)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 1s ease',
                        }} />
                      </div>
                    )}
                    <div className="slashed-zero" style={{
                      minWidth: 100,
                      textAlign: 'right',
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-lg)',
                      fontWeight: 700,
                      color: 'var(--card-foreground)',
                    }}>
                      {fmtCompact(d.principal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Penny Insight */}
          {pennyInsight && (

            <div className="penny-card bento-card">
              <div className="penny-insights-header">
                <div className="penny-insights-icon">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="penny-insights-title">Penny's Insights</h3>
                  <p className="penny-insights-sub">Personalized for your current plan</p>
                </div>
                <button className="pill" style={{ marginLeft: 'auto' }} onClick={onPennyClick}>
                  Ask follow-up <ArrowRight size={12} />
                </button>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--secondary)' }}>
                The <b>{pennyInsight.better}</b> method saves roughly{' '}
                <b>{formatInr(pennyInsight.saving)}</b> in interest vs minimum payments
                {pennyInsight.months > 0 && (
                  <>, clearing debt <b>{pennyInsight.months} month{pennyInsight.months !== 1 ? 's' : ''}</b> faster</>
                )}.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bento-card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--card-foreground)', marginBottom: 'var(--space-2)' }}>
            No Debts Tracked
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--secondary)' }}>
            Add debts during onboarding to unlock strategy comparison and payoff timeline views.
          </p>
        </div>
      )}
    </div>
  );
}
