import { useState, useMemo, useEffect } from 'react';
import { Sparkles, ArrowRight, TrendingUp, PiggyBank, AlertTriangle } from 'lucide-react';
import { useFinPathStore } from '@/lib/store';
import { avalanche, snowball, compareStrategies } from '@/lib/debt-strategies';
import { formatInr, formatInrCompact } from '@/lib/format';
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
import { usePalette } from '@/app/components/SankeyFlow';

type ChartEntry = Record<string, string | number>;

const PENNY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  TrendingUp, PiggyBank, AlertTriangle, Sparkles,
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

  const zeroExtraResult = useMemo(() => {
    if (debtItems.length === 0) return null;
    return avalanche(debtItems, 0);
  }, [debtItems]);

  const timelineChartData = useMemo(() => {
    if (!timelineResult) return [];
    const maxMonths = timelineResult.totalMonths;
    const months: ChartEntry[] = [];
    const debtIds = debtItems.map(d => d.id);

    const initialBalances: Record<string, number> = {};
    for (const d of debtItems) initialBalances[d.id] = d.principal;

    for (let m = 0; m <= maxMonths; m++) {
      const date = new Date();
      date.setMonth(date.getMonth() + m);
      const entry: ChartEntry = {
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
      months[0]['_otherTotal'] = Object.values(otherBal).reduce((s, v) => s + v, 0);
      const byMonth = new Map<number, typeof otherTimelineResult.steps>();
      for (const step of otherTimelineResult.steps) {
        if (!byMonth.has(step.month)) byMonth.set(step.month, []);
        byMonth.get(step.month)!.push(step);
      }
      for (let m = 1; m <= maxMonths; m++) {
        const steps = byMonth.get(m);
        if (steps) for (const s of steps) otherBal[s.debtId] = s.remainingBalance;
        months[m]['_otherTotal'] = Math.max(0, Object.values(otherBal).reduce((s, v) => s + v, 0));
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

  const pennyInsights = useMemo(() => {
    if (debtItems.length === 0) return [];

    const tips: Array<{ icon: string; text: string }> = [];

    if (comparison) {
      const saving = Math.abs(comparison.interestSaved);
      const monthsDiff = Math.abs(comparison.monthsDifference);
      const better = comparison.recommendation === 'avalanche' ? 'Avalanche' : 'Snowball';

      if (debtItems.length === 1) {
        tips.push({
          icon: 'TrendingUp',
          text: 'With a single debt, both strategies produce the same result. Focus on paying more each month to save on interest.',
        });
      } else {
        const suffix = monthsDiff > 0
          ? `, clearing debt ${monthsDiff} month${monthsDiff !== 1 ? 's' : ''} faster`
          : '';
        tips.push({
          icon: 'TrendingUp',
          text: `The ${better} method saves ${formatInr(saving)} in interest vs minimum payments${suffix}.`,
        });
      }
    }

    if (extraPayment > 0 && zeroExtraResult && timelineResult) {
      const monthsSaved = zeroExtraResult.totalMonths - timelineResult.totalMonths;
      const interestDiff = zeroExtraResult.totalInterest - timelineResult.totalInterest;
      if (monthsSaved > 0 || interestDiff > 0) {
        tips.push({
          icon: 'PiggyBank',
          text: `Adding ${formatInr(extraPayment)}/mo extra pays off all debt ${monthsSaved > 0 ? `${monthsSaved} month${monthsSaved !== 1 ? 's' : ''} sooner` : 'on schedule'}, saving ${formatInr(interestDiff)} in interest.`,
        });
      }
    } else if (extraPayment === 0) {
      tips.push({
        icon: 'PiggyBank',
        text: 'Even ₹500/mo extra can shave months off your payoff timeline and save significant interest.',
      });
    }

    const topDebt = [...debtItems].sort((a, b) => b.interestRate - a.interestRate)[0];
    if (topDebt) {
      const monthlyInterest = Math.round(topDebt.principal * (topDebt.interestRate / 100) / 12);
      tips.push({
        icon: 'AlertTriangle',
        text: `Your highest-rate debt (${topDebt.name} at ${topDebt.interestRate}%) is costing ${formatInr(monthlyInterest)}/mo in interest alone. Prioritizing it saves the most.`,
      });
    }

    return tips;
  }, [debtItems, comparison, extraPayment, zeroExtraResult, timelineResult]);

  return (
    <div className="page-animate debt-page">
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <p className="text-label">Liabilities</p>
        <h2 className="debt-page-title">Debt</h2>
      </div>

      {debtItems.length > 0 ? (
        <>
          <div className="debt-kpi-grid">
            {([
              { label: 'Total Outstanding', value: formatInrCompact(totalPrincipal), color: 'var(--red-text)' },
              { label: 'Monthly EMI', value: formatInr(totalMonthlyEMI), color: 'var(--card-foreground)' },
              { label: 'Avg Interest Rate', value: `${avgInterestRate.toFixed(1)}%`, color: 'var(--amber-text)' },
            ] as const).map(({ label, value, color }) => (
              <div key={label} className="bento-card bento-card-sm">
                <p className="text-label">{label}</p>
                <p className="debt-kpi-value slashed-zero" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="bento-card" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <div>
                <p className="text-label">Payoff Strategy</p>
                {debtItems.length === 1 && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--tertiary)', marginTop: 'var(--space-0.5)' }}>
                    Both strategies identical with one debt
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setTimelineStrategy(timelineStrategy === 'avalanche' ? 'snowball' : 'avalanche')}
                className="strategy-toggle"
                aria-label={`Strategy: ${timelineStrategy}`}
                aria-pressed={timelineStrategy === 'avalanche'}
              >
                <span className={`strategy-toggle-pill ${timelineStrategy === 'avalanche' ? 'left' : 'right'}`} />
                <span className={`strategy-toggle-label ${timelineStrategy === 'avalanche' ? 'active' : 'inactive'}`}>
                  Avalanche
                </span>
                <span className={`strategy-toggle-label ${timelineStrategy === 'snowball' ? 'active' : 'inactive'}`}>
                  Snowball
                </span>
              </button>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
                <p className="text-label">Extra Monthly Payment</p>
                <span className="slashed-zero" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--card-foreground)' }}>
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
                aria-label="Extra monthly payment"
                aria-valuetext={formatInr(extraPayment)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--tertiary)', marginTop: 'var(--space-1)' }}>
                <span>&#8377;0</span>
                <span>&#8377;50,000</span>
              </div>
            </div>

            {timelineChartData.length > 0 && (
              <div style={{ marginBottom: 'var(--space-5)' }} role="img" aria-label="Debt payoff timeline chart">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={timelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--secondary)' }} interval={Math.max(1, Math.floor(timelineChartData.length / 8))} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--secondary)' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <RechartsTooltip
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-base)', fontFamily: 'var(--font-body)', color: 'var(--card-foreground)' }}
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

            <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', listStyle: 'none', padding: 0, margin: 0 }}>
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
                  <li key={d.id} className="debt-row">
                    <div className={`debt-rank-badge ${i === 0 ? 'debt-rank-badge--top' : 'debt-rank-badge--default'}`}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="debt-row-name">{d.name}</p>
                      <p className="debt-row-detail">
                        {d.interestRate}% APR · {formatInr(d.monthlyPayment)}/mo
                        {payoffDate && <> · <span style={{ color: 'var(--accent-text)' }}>free {payoffDate}</span></>}
                      </p>
                    </div>
                    {paidPct !== null && (
                      <div className="debt-bar">
                        <div
                          className="debt-bar-fill"
                          style={{
                            width: `${paidPct}%`,
                            background: d.interestRate > 25 ? 'var(--red)' : 'var(--amber)',
                          }}
                        />
                      </div>
                    )}
                    <div className="debt-row-amount slashed-zero">
                      {formatInrCompact(d.principal)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {pennyInsights.length > 0 && (
            <div className="bento-card penny-card">
              <div className="penny-blob" />
              <div className="penny-insights-header">
                <div className="penny-insights-icon">
                  <Sparkles size={18} className="icon-wireframe" />
                </div>
                <div>
                  <h3 className="penny-insights-title">Penny's Insights</h3>
                  <p className="penny-insights-sub">Personalized for your current plan</p>
                </div>
                <button className="pill ml-auto" aria-label="Ask Penny a follow-up question" onClick={onPennyClick}>
                  Ask follow-up <ArrowRight size={14} className="icon-wireframe" />
                </button>
              </div>
              <div className="penny-insights-grid">
                {pennyInsights.map((tip, i) => {
                  const TIcon = PENNY_ICONS[tip.icon] || Sparkles;
                  return (
                    <div key={`insight-${i}`} className="penny-tile">
                      <div className="penny-tile-icon">
                        <TIcon size={14} className="icon-wireframe" />
                      </div>
                      <p className="penny-tile-text">{tip.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bento-card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--card-foreground)', marginBottom: 'var(--space-2)' }}>
            No Debts Tracked
          </p>
          <p className="penny-suggest-text">
            Add debts during onboarding to unlock strategy comparison and payoff timeline views.
          </p>
        </div>
      )}
    </div>
  );
}
