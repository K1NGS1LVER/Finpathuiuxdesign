import { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  CreditCard,
  Plus,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useFinPathStore } from '@/lib/store';
import { pageContainer, pageSection } from '@/app/components/motion-variants';
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
import { useDebouncedValue } from '@/lib/useDebouncedValue';

type ChartEntry = Record<string, string | number>;

const PENNY_ICONS: Record<string, LucideIcon> = {
  TrendingUp,
  PiggyBank,
  AlertTriangle,
  Sparkles,
};

export default function Debt({ onPennyClick }: { onPennyClick?: () => void }) {
  const debts = useFinPathStore((s) => s.debts);
  const goals = useFinPathStore((s) => s.goals);
  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const onboarded = useFinPathStore((s) => s.onboarded);
  const plan = useFinPathStore((s) => s.plan);
  const strategy = useFinPathStore((s) => s.strategy);
  const setStrategy = useFinPathStore((s) => s.setStrategy);
  const pal = usePalette();

  const [extraPayment, setExtraPayment] = useState(0);
  // Debounced copy drives expensive memos (compareStrategies/avalanche/snowball/chart-data)
  // so the slider stays responsive while the user drags.
  const debouncedExtraPayment = useDebouncedValue(extraPayment, 80);

  const debtGoal = goals.find((g) => g.category === 'debt' && g.status !== 'complete');

  const activeGoals = useMemo(
    () =>
      goals
        .filter((goal) => goal.status !== 'complete')
        .slice()
        .sort((a, b) => a.priority - b.priority),
    [goals],
  );

  const surplus = income.total - expenses.total - debts.totalMonthly;
  const reservedSurplus = plan?.months?.[0]?.reservedSurplus || 0;
  const pendingSurplus = plan?.months?.[0]?.pendingSurplus || 0;

  const debtItems = useMemo(() => {
    if ((debts.items ?? []).length > 0) return debts.items;
    if (!debtGoal) return [];
    const monthlyPayment = debtGoal.monthlyAllocation || debts.totalMonthly || 0;
    const principal = debtGoal.targetAmount || debts.totalPrincipal || monthlyPayment * 12;
    if (monthlyPayment <= 0 && principal <= 0) return [];
    return [
      {
        id: 'debt-from-goal',
        name: debtGoal.name,
        category: 'other' as const,
        principal,
        interestRate: 10,
        monthlyPayment,
        remainingMonths:
          monthlyPayment > 0 ? Math.max(1, Math.ceil(principal / monthlyPayment)) : 12,
      },
    ];
  }, [debts.items, debts.totalMonthly, debts.totalPrincipal, debtGoal]);

  const setDebts = useFinPathStore((s) => s.setDebts);
  useEffect(() => {
    if ((debts.items ?? []).length === 0 && debtGoal && debtGoal.monthlyAllocation > 0) {
      const restored = debtItems.length > 0 ? debtItems : [];
      if (restored.length > 0) {
        setDebts({
          items: restored,
          totalMonthly: debtGoal.monthlyAllocation,
          totalPrincipal: debtGoal.targetAmount,
        });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const comparison = useMemo(() => {
    if (debtItems.length === 0) return null;
    return compareStrategies(debtItems, debouncedExtraPayment);
  }, [debtItems, debouncedExtraPayment]);

  const timelineResult = useMemo(() => {
    if (debtItems.length === 0) return null;
    return strategy === 'avalanche'
      ? avalanche(debtItems, debouncedExtraPayment)
      : snowball(debtItems, debouncedExtraPayment);
  }, [debtItems, debouncedExtraPayment, strategy]);

  const otherTimelineResult = useMemo(() => {
    if (debtItems.length === 0) return null;
    return strategy === 'avalanche'
      ? snowball(debtItems, debouncedExtraPayment)
      : avalanche(debtItems, debouncedExtraPayment);
  }, [debtItems, debouncedExtraPayment, strategy]);

  const zeroExtraResult = useMemo(() => {
    if (debtItems.length === 0) return null;
    return avalanche(debtItems, 0);
  }, [debtItems]);

  const timelineChartData = useMemo(() => {
    if (!timelineResult) return [];
    const maxMonths = timelineResult.totalMonths;
    const months: ChartEntry[] = [];
    const debtIds = debtItems.map((d) => d.id);

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
        months[m]['_otherTotal'] = Math.max(
          0,
          Object.values(otherBal).reduce((s, v) => s + v, 0),
        );
      }
    }

    return months;
  }, [timelineResult, otherTimelineResult, debtItems]);

  const DEBT_COLORS = useMemo(
    () => [pal.blue, pal.lime, pal.red, pal.amber, pal.green, pal.purple],
    [pal],
  );

  const totalPrincipal = useMemo(() => debtItems.reduce((s, d) => s + d.principal, 0), [debtItems]);
  const totalMonthlyEMI = useMemo(
    () => debtItems.reduce((s, d) => s + d.monthlyPayment, 0),
    [debtItems],
  );
  const avgInterestRate = useMemo(() => {
    if (totalPrincipal === 0) return 0;
    return debtItems.reduce((s, d) => s + d.interestRate * d.principal, 0) / totalPrincipal;
  }, [debtItems, totalPrincipal]);

  const sortedDebts = useMemo(() => {
    if (strategy === 'avalanche')
      return [...debtItems].sort((a, b) => b.interestRate - a.interestRate);
    return [...debtItems].sort((a, b) => a.principal - b.principal);
  }, [debtItems, strategy]);

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
        const suffix =
          monthsDiff > 0
            ? `, clearing debt ${monthsDiff} month${monthsDiff !== 1 ? 's' : ''} faster`
            : '';
        tips.push({
          icon: 'TrendingUp',
          text: `The ${better} method saves ${formatInr(saving)} in interest vs minimum payments${suffix}.`,
        });
      }
    }

    if (debouncedExtraPayment > 0 && zeroExtraResult && timelineResult) {
      const monthsSaved = zeroExtraResult.totalMonths - timelineResult.totalMonths;
      const interestDiff = zeroExtraResult.totalInterestPaid - timelineResult.totalInterestPaid;
      if (monthsSaved > 0 || interestDiff > 0) {
        tips.push({
          icon: 'PiggyBank',
          text: `Adding ${formatInr(debouncedExtraPayment)}/mo extra pays off all debt ${monthsSaved > 0 ? `${monthsSaved} month${monthsSaved !== 1 ? 's' : ''} sooner` : 'on schedule'}, saving ${formatInr(interestDiff)} in interest.`,
        });
      }
    } else if (debouncedExtraPayment === 0) {
      tips.push({
        icon: 'PiggyBank',
        text: 'Even ₹500/mo extra can shave months off your payoff timeline and save significant interest.',
      });
    }

    const topDebt = [...debtItems].sort((a, b) => b.interestRate - a.interestRate)[0];
    if (topDebt) {
      const monthlyInterest = Math.round((topDebt.principal * (topDebt.interestRate / 100)) / 12);
      tips.push({
        icon: 'AlertTriangle',
        text: `Your highest-rate debt (${topDebt.name} at ${topDebt.interestRate}%) is costing ${formatInr(monthlyInterest)}/mo in interest alone. Prioritizing it saves the most.`,
      });
    }

    return tips;
  }, [debtItems, comparison, debouncedExtraPayment, zeroExtraResult, timelineResult]);

  return (
    <motion.div className="debt-page" variants={pageContainer} initial="hidden" animate="visible">
      <motion.div style={{ marginBottom: 'var(--space-3)' }} variants={pageSection}>
        <p className="text-label">Liabilities</p>
        <h2 className="debt-page-title">Debt</h2>
      </motion.div>

      {debtItems.length > 0 ? (
        <>
          <motion.div className="debt-kpi-grid" variants={pageSection}>
            {(
              [
                {
                  label: 'Total Outstanding',
                  value: formatInrCompact(totalPrincipal),
                  color: 'var(--red-text)',
                },
                {
                  label: 'Monthly EMI',
                  value: formatInr(totalMonthlyEMI),
                  color: 'var(--card-foreground)',
                },
                {
                  label: 'Avg Interest Rate',
                  value: `${avgInterestRate.toFixed(1)}%`,
                  color: 'var(--amber-text)',
                },
              ] as const
            ).map(({ label, value, color }) => (
              <div key={label} className="bento-card bento-card-sm">
                <p className="text-label">{label}</p>
                <p className="debt-kpi-value slashed-zero" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="bento-card"
            style={{ marginBottom: 'var(--space-4)' }}
            variants={pageSection}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-3)',
              }}
            >
              <div>
                <p className="text-label">Payoff Strategy</p>
                {debtItems.length === 1 && (
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--tertiary)',
                      marginTop: 'var(--space-0_5)',
                    }}
                  >
                    Both strategies identical with one debt
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStrategy(strategy === 'avalanche' ? 'snowball' : 'avalanche')}
                className="strategy-toggle"
                aria-label={`Strategy: ${strategy}`}
                aria-pressed={strategy === 'avalanche'}
              >
                <span
                  className={`strategy-toggle-pill ${strategy === 'avalanche' ? 'left' : 'right'}`}
                />
                <span
                  className={`strategy-toggle-label ${strategy === 'avalanche' ? 'active' : 'inactive'}`}
                >
                  Avalanche
                </span>
                <span
                  className={`strategy-toggle-label ${strategy === 'snowball' ? 'active' : 'inactive'}`}
                >
                  Snowball
                </span>
              </button>
            </div>

            <div className="strategy-info-box">
              {strategy === 'avalanche' ? (
                <p>
                  <strong className="text-card-foreground">Avalanche</strong> allocates funds by
                  goal priority — highest priority goals get funded first.{' '}
                  {(() => {
                    const p1 = activeGoals.find((g) => g.priority === 1);
                    return p1 ? (
                      <span>
                        Your <strong className="text-card-foreground">P1: {p1.name}</strong>{' '}
                        receives{' '}
                        <strong className="text-card-foreground">
                          {formatInr(p1.monthlyAllocation || 0)}/mo
                        </strong>
                        .
                      </span>
                    ) : null;
                  })()}
                </p>
              ) : (
                <p>
                  <strong className="text-card-foreground">Snowball</strong> tackles the smallest
                  remaining goal first for a quick win, then rolls freed-up money into the next.{' '}
                  {(() => {
                    const smallest = [...activeGoals].sort(
                      (a, b) =>
                        a.targetAmount - a.currentAmount - (b.targetAmount - b.currentAmount),
                    )[0];
                    return smallest ? (
                      <span>
                        Currently focused on{' '}
                        <strong className="text-card-foreground">{smallest.name}</strong> with{' '}
                        <strong className="text-card-foreground">
                          {formatInr(smallest.monthlyAllocation || 0)}/mo
                        </strong>
                        .
                      </span>
                    ) : null;
                  })()}
                </p>
              )}
            </div>

            {(() => {
              const nonDebtGoals = activeGoals.filter((g) => g.category !== 'debt');
              const availableForGoals = Math.max(0, surplus - reservedSurplus - pendingSurplus);

              if (nonDebtGoals.length > 0 && availableForGoals <= 0) {
                return (
                  <div className="warning-banner flex items-start gap-2 mt-3">
                    <Target size={16} className="flex-shrink-0 mt-0.5 icon-wireframe" />
                    <span>
                      <strong>Note:</strong> No monthly surplus to distribute. Switching strategies
                      won't change your checklist amounts right now.
                    </span>
                  </div>
                );
              }

              if (nonDebtGoals.length === 1 && availableForGoals > 0) {
                return (
                  <div className="warning-banner flex items-start gap-2 mt-3">
                    <Target size={16} className="flex-shrink-0 mt-0.5 icon-wireframe" />
                    <span>
                      <strong>Note:</strong> You only have one active goal. Strategies work across{' '}
                      <em>multiple</em> goals — add another to see the difference.
                    </span>
                  </div>
                );
              }

              return null;
            })()}

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <p className="text-label">Extra Monthly Payment</p>
                <span
                  className="slashed-zero"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--card-foreground)',
                  }}
                >
                  {formatInr(extraPayment)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50000}
                step={500}
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
                className="range"
                aria-label="Extra monthly payment"
                aria-valuetext={formatInr(extraPayment)}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--tertiary)',
                  marginTop: 'var(--space-1)',
                }}
              >
                <span>&#8377;0</span>
                <span>&#8377;50,000</span>
              </div>
            </div>

            {timelineChartData.length > 0 && (
              <div
                style={{ marginBottom: 'var(--space-5)' }}
                role="img"
                aria-label="Debt payoff timeline chart"
              >
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={timelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: 'var(--secondary)' }}
                      interval={Math.max(1, Math.floor(timelineChartData.length / 8))}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--secondary)' }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-base)',
                        fontFamily: 'var(--font-body)',
                        color: 'var(--card-foreground)',
                      }}
                      formatter={(value: number) => [formatInr(value), '']}
                    />
                    {debtItems.map((d, i) => (
                      <Area
                        key={d.id}
                        type="monotone"
                        dataKey={d.id}
                        name={d.name}
                        stackId="1"
                        stroke={DEBT_COLORS[i % DEBT_COLORS.length]}
                        fill={DEBT_COLORS[i % DEBT_COLORS.length]}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
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
                        name={strategy === 'avalanche' ? 'Snowball total' : 'Avalanche total'}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <ul
              role="list"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {sortedDebts.map((d, i) => {
                const relatedGoal = goals.find(
                  (g) => g.category === 'debt' && (g.name === d.name || g.name.includes(d.name)),
                );
                const originalAmount = relatedGoal?.targetAmount;
                const paidPct =
                  originalAmount && originalAmount > 0 && d.principal <= originalAmount
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
                    <div
                      className={`debt-rank-badge ${i === 0 ? 'debt-rank-badge--top' : 'debt-rank-badge--default'}`}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="debt-row-name">{d.name}</p>
                      <p className="debt-row-detail">
                        {d.interestRate}% APR · {formatInr(d.monthlyPayment)}/mo
                        {payoffDate && (
                          <>
                            {' '}
                            · <span style={{ color: 'var(--accent-text)' }}>free {payoffDate}</span>
                          </>
                        )}
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
          </motion.div>

          {pennyInsights.length > 0 && (
            <motion.div className="bento-card penny-card" variants={pageSection}>
              <div className="penny-blob" />
              <div className="penny-insights-header">
                <div className="penny-insights-icon">
                  <Sparkles size={18} className="icon-wireframe" />
                </div>
                <div>
                  <h3 className="penny-insights-title">Penny's Insights</h3>
                  <p className="penny-insights-sub">Personalized for your current plan</p>
                </div>
                <button
                  className="pill ml-auto"
                  aria-label="Ask Penny a follow-up question"
                  onClick={onPennyClick}
                >
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
            </motion.div>
          )}
        </>
      ) : onboarded && (debts.totalMonthly || 0) === 0 && !debtGoal ? (
        <motion.div
          className="bento-card"
          style={{
            padding: 'var(--space-8) var(--space-6)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
          variants={pageSection}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-40%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 340,
              height: 340,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, color-mix(in srgb, var(--green) 22%, transparent), transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-base)',
                background: 'color-mix(in srgb, var(--green) 18%, transparent)',
                color: 'var(--green-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-3)',
              }}
            >
              <Sparkles size={24} className="icon-wireframe" />
            </div>
            <p className="text-label" style={{ marginBottom: 'var(--space-2)' }}>
              Liability-free
            </p>
            <h3
              className="text-display"
              style={{ color: 'var(--card-foreground)', marginBottom: 'var(--space-3)' }}
            >
              You&rsquo;re debt-free
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--secondary)',
                maxWidth: 460,
                lineHeight: 1.6,
                marginBottom: 'var(--space-4)',
              }}
            >
              Nothing to pay down means every rupee of surplus goes straight to goals or net worth.
              That&rsquo;s the strongest base you can have.
            </p>
            {income.total - expenses.total > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-full)',
                  background: 'color-mix(in srgb, var(--green) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--green) 24%, transparent)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <span className="text-label" style={{ color: 'var(--green-text)' }}>
                  Available surplus
                </span>
                <span
                  className="slashed-zero"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--green-text)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {formatInr(income.total - expenses.total)}/mo
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={onPennyClick}
              aria-label="Add a debt later if needed"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--secondary)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                padding: 'var(--space-1) var(--space-2)',
              }}
            >
              Add a debt later if anything changes
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="bento-card"
          style={{ padding: 'var(--space-8) var(--space-6)', textAlign: 'center' }}
          variants={pageSection}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-base)',
                background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                color: 'var(--accent-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-3)',
              }}
            >
              <CreditCard size={24} className="icon-wireframe" />
            </div>
            <p className="text-label" style={{ marginBottom: 'var(--space-2)' }}>
              Liabilities
            </p>
            <h3
              className="text-title"
              style={{ color: 'var(--card-foreground)', marginBottom: 'var(--space-3)' }}
            >
              Track a loan to unlock strategy views
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--secondary)',
                maxWidth: 480,
                lineHeight: 1.6,
                marginBottom: 'var(--space-5)',
              }}
            >
              Add your EMIs and we&rsquo;ll show you avalanche vs snowball, payoff dates, and how
              much interest a small extra payment can save.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
                justifyContent: 'center',
                marginBottom: 'var(--space-6)',
              }}
            >
              <button
                type="button"
                onClick={onPennyClick}
                aria-label="Add a debt with Penny"
                className="px-5 py-3 rounded-xl flex items-center gap-2 justify-center transition-transform hover:scale-105 shadow-lg bg-accent text-on-accent"
              >
                <Plus size={18} />
                <span className="font-semibold text-sm font-body">Add a debt</span>
              </button>
              <button
                type="button"
                onClick={onPennyClick}
                className="pill"
                aria-label="Ask Penny about debt strategy"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Ask Penny about strategy <ArrowRight size={14} className="icon-wireframe" />
              </button>
            </div>
            <ul
              aria-hidden="true"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                listStyle: 'none',
                padding: 0,
                margin: 0,
                width: '100%',
                maxWidth: 480,
                opacity: 0.4,
              }}
            >
              {[0, 1, 2].map((i) => (
                <li key={i} className="debt-row" style={{ pointerEvents: 'none' }}>
                  <div
                    className="skeleton"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-sm)',
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div
                      className="skeleton"
                      style={{ width: '42%', height: 12, borderRadius: 4 }}
                    />
                    <div
                      className="skeleton"
                      style={{ width: '64%', height: 10, borderRadius: 4 }}
                    />
                  </div>
                  <div
                    className="skeleton"
                    style={{ width: 64, height: 14, borderRadius: 4, flexShrink: 0 }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
