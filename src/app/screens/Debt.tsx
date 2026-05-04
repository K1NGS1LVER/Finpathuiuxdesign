import { useState, useMemo } from 'react';
import {
  Sparkles,
  CreditCard,
  Snowflake,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { useFinPathStore } from '@/lib/store';
import { avalanche, snowball, compareStrategies } from '@/lib/debt-strategies';
import {
  Sankey,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Rectangle,
  Layer,
} from 'recharts';

type SankeyNodePayload = {
  name: string;
  value?: number;
};

const formatInr = (value: number) =>
  `₹${Math.round(Math.max(0, value)).toLocaleString('en-IN')}`;

function resolveCssVar(name: string): string {
  if (typeof document === 'undefined') return '#6366f1';
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue(name).trim() || '#6366f1';
}

const CATEGORY_LABELS: Record<string, string> = {
  homeLoan: 'Home Loan',
  carLoan: 'Car Loan',
  personalLoan: 'Personal Loan',
  creditCard: 'Credit Card',
  educationLoan: 'Education Loan',
  other: 'Debt',
};

/* ── Node renderer ── */
interface CustomNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: SankeyNodePayload;
  palette: Record<string, string>;
}

function CustomNode({ x, y, width, height, index, payload, palette }: CustomNodeProps) {
  const colors = [palette.blue, palette.amber, palette.red, palette.lime, palette.green, palette.purple, palette.teal, palette.pink, palette.slate];
  const color = colors[index % colors.length];
  const isLeft = x < 280;

  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={Math.max(height, 1)}
        fill={color}
        fillOpacity={0.88}
        stroke={color}
        strokeWidth={0.5}
        radius={[4, 4, 4, 4]}
      />
      <text
        x={isLeft ? x - 8 : x + width + 10}
        y={y + height / 2 - 7}
        textAnchor={isLeft ? 'end' : 'start'}
        dominantBaseline="middle"
        fill="var(--card-foreground)"
        fontSize={11}
        fontWeight={600}
        fontFamily="var(--font-body)"
      >
        {payload.name}
      </text>
      <text
        x={isLeft ? x - 8 : x + width + 10}
        y={y + height / 2 + 9}
        textAnchor={isLeft ? 'end' : 'start'}
        dominantBaseline="middle"
        fill="var(--secondary)"
        fontSize={10}
        fontFamily="var(--font-body)"
      >
        {formatInr(payload.value ?? 0)}
      </text>
    </Layer>
  );
}

/* ── Link renderer ── */
interface CustomLinkProps {
  sourceX: number;
  sourceY: number;
  sourceControlX: number;
  targetX: number;
  targetY: number;
  targetControlX: number;
  linkWidth: number;
  index: number;
  payload: { source?: SankeyNodePayload; target?: SankeyNodePayload };
  palette: Record<string, string>;
}

function CustomLink({
  sourceX,
  sourceY,
  sourceControlX,
  targetX,
  targetY,
  targetControlX,
  linkWidth,
  index,
  payload,
  palette,
}: CustomLinkProps) {
  let strokeColor = palette.slate;
  const srcName = payload.source?.name ?? '';
  const tgtName = payload.target?.name ?? '';
  if (srcName === 'Income') {
    if (tgtName === 'Essential Expenses') strokeColor = palette.amber;
    else if (tgtName === 'Debt & Savings') strokeColor = palette.red;
    else if (tgtName === 'Disposable') strokeColor = palette.green;
  } else if (srcName === 'Essential Expenses') {
    strokeColor = palette.amber;
  } else if (srcName === 'Debt & Savings') {
    strokeColor = palette.red;
  } else if (srcName === 'Disposable') {
    strokeColor = palette.green;
  }

  return (
    <path
      d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
      fill="none"
      stroke={strokeColor}
      strokeWidth={Math.max(1, linkWidth * 0.9)}
      strokeOpacity={0.25}
    />
  );
}

export default function Debt() {
  const debts = useFinPathStore(s => s.debts);
  const income = useFinPathStore(s => s.income);
  const expenses = useFinPathStore(s => s.expenses);
  const plan = useFinPathStore(s => s.plan);
  const monthlySurplusReserve = useFinPathStore(s => s.monthlySurplusReserve);
  const goals = useFinPathStore(s => s.goals);

  const pal = useMemo(() => ({
    blue: resolveCssVar('--accent'),
    lime: resolveCssVar('--tertiary-accent'),
    red: resolveCssVar('--red'),
    amber: resolveCssVar('--amber'),
    green: resolveCssVar('--green'),
    purple: resolveCssVar('--accent'),
    teal: resolveCssVar('--green'),
    pink: resolveCssVar('--red'),
    slate: '#64748b',
  }), []);

  const [extraPayment, setExtraPayment] = useState(0);
  const [timelineStrategy, setTimelineStrategy] = useState<'avalanche' | 'snowball'>('avalanche');

  const debtItems = debts.items ?? [];

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
    return months;
  }, [timelineResult, debtItems]);

  const dti = useMemo(() => {
    if (!income.total) return 0;
    return (debtItems.reduce((sum, d) => sum + d.monthlyPayment, 0) / income.total) * 100;
  }, [debtItems, income.total]);

  const goalAllocationsTotal = useMemo(() => {
    if (plan?.months?.[0]?.goalAllocations) {
      return Object.values(plan.months[0].goalAllocations).reduce((sum, v) => sum + v, 0);
    }
    return goals
      .filter(g => g.status !== 'complete')
      .reduce((sum, g) => sum + (g.monthlyAllocation || 0), 0);
  }, [plan, goals]);

  const totalIncome = income.total || 0;
  const debtPayments = debtItems.reduce((sum, d) => sum + d.monthlyPayment, 0) + extraPayment;
  const totalExpenses = expenses.total || 0;
  const surplusReserve = monthlySurplusReserve || 0;
  const debtAndSavings = debtPayments + goalAllocationsTotal + surplusReserve;
  const disposable = Math.max(0, totalIncome - totalExpenses - debtAndSavings);

  /* ── Multi-tier Sankey data ── */
  const sankeyData = useMemo(() => {
    if (totalIncome <= 0) return { nodes: [], links: [] };

    const housing = (expenses.rent || 0) + (expenses.utilities || 0);
    const food = expenses.food || 0;
    const transport = expenses.transport || 0;
    const otherExp = Math.max(0, totalExpenses - housing - food - transport);
    const goalsProgress = Math.max(0, goalAllocationsTotal);

    const allNodes = [
      { name: 'Income' },
      { name: 'Essential Expenses' },
      { name: 'Debt & Savings' },
      { name: 'Disposable' },
      { name: 'Housing & Utilities' },
      { name: 'Food' },
      { name: 'Transport' },
      { name: 'Other Expenses' },
      { name: 'Debt Payments' },
      { name: 'Goals Progress' },
      { name: 'Surplus Reserve' },
      { name: 'Free Cash' },
    ];

    const allLinks = [
      { source: 0, target: 1, value: totalExpenses },
      { source: 0, target: 2, value: debtAndSavings },
      { source: 0, target: 3, value: disposable },
      { source: 1, target: 4, value: housing },
      { source: 1, target: 5, value: food },
      { source: 1, target: 6, value: transport },
      { source: 1, target: 7, value: otherExp },
      { source: 2, target: 8, value: debtPayments },
      { source: 2, target: 9, value: goalsProgress },
      { source: 2, target: 10, value: surplusReserve },
      { source: 3, target: 11, value: disposable },
    ].filter(l => l.value > 0);

    const referenced = new Set<number>();
    for (const link of allLinks) {
      referenced.add(link.source);
      referenced.add(link.target);
    }

    const usedIndices = Array.from(referenced).sort((a, b) => a - b);
    const oldToNew = new Map<number, number>();
    const filteredNodes = usedIndices.map((oldIdx, newIdx) => {
      oldToNew.set(oldIdx, newIdx);
      return allNodes[oldIdx];
    });

    const filteredLinks = allLinks.map(link => ({
      ...link,
      source: oldToNew.get(link.source)!,
      target: oldToNew.get(link.target)!,
    }));

    return { nodes: filteredNodes, links: filteredLinks };
  }, [totalIncome, totalExpenses, debtAndSavings, disposable, debtPayments, goalAllocationsTotal, surplusReserve, expenses]);

  const DEBT_COLORS = useMemo(() => [pal.blue, pal.lime, pal.red, pal.amber, pal.green, pal.purple], [pal]);

  /* ── Penny insights (unchanged) ── */
  const pennyInsights = useMemo(() => {
    if (debtItems.length === 0) {
      return ['No debts to analyze — you\'re debt-free! Track any future debts here.'];
    }
    const insights: string[] = [];
    if (dti > 40) {
      insights.push(`Your debt-to-income ratio is ${Math.round(dti)}%, which is high. Prioritise paying down high-interest debts first.`);
    } else if (dti > 20) {
      insights.push(`Your DTI is ${Math.round(dti)}% — manageable but worth watching. Keep debt payments under 30% of income.`);
    }
    if (comparison) {
      const saved = Math.abs(comparison.interestSaved);
      if (saved > 0) insights.push(`The ${comparison.recommendation} strategy saves you ${formatInr(saved)} in total interest.`);
    }
    const smallest = [...debtItems].sort((a, b) => a.principal - b.principal)[0];
    if (smallest) insights.push(`${smallest.name} is your smallest debt at ${formatInr(smallest.principal)} — knocking it out first builds momentum.`);
    const highest = [...debtItems].sort((a, b) => b.interestRate - a.interestRate)[0];
    if (highest && highest !== smallest) insights.push(`${highest.name} has the highest interest rate at ${highest.interestRate}% APR — paying it down aggressively saves the most interest.`);
    if (extraPayment > 0 && comparison) {
      const baseResult = compareStrategies(debtItems, 0);
      const monthsSaved = baseResult.avalanche.totalMonths - comparison.avalanche.totalMonths;
      if (monthsSaved > 0) insights.push(`With ${formatInr(extraPayment)} extra per month, you save ${monthsSaved} month${monthsSaved > 1 ? 's' : ''} on your payoff timeline.`);
    } else if (extraPayment <= 0 && debtItems.length > 0) {
      insights.push('Try adding an extra monthly payment with the slider to see how much faster you can be debt-free.');
    }
    return insights;
  }, [debtItems, dti, comparison, extraPayment]);

  const extraPaymentImpact = useMemo(() => {
    if (!comparison || extraPayment <= 0) return null;
    const base = compareStrategies(debtItems, 0);
    return {
      savedMonths: Math.max(0, base.avalanche.totalMonths - comparison.avalanche.totalMonths),
      savedInterest: Math.max(0, base.avalanche.totalInterestPaid - comparison.avalanche.totalInterestPaid),
    };
  }, [debtItems, comparison, extraPayment]);

  const isSingleDebt = debtItems.length === 1;

  return (
    <div className="max-w-7xl mx-auto relative text-[var(--foreground)]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="data-blob w-[400px] h-[400px] -top-40 right-1/4 rounded-full bg-[var(--accent)] opacity-10" />
        <div className="data-blob w-[300px] h-[300px] bottom-0 -left-40 rounded-full bg-[var(--tertiary-accent)] opacity-10" />
      </div>

      <div className="mb-6 md:mb-8 relative z-10">
        <h1 className="text-display mb-2 slashed-zero">Cashflow &amp; Debts</h1>
        <p className="text-lg text-[var(--secondary)]">Visualise your monthly cashflow and optimise debt payoff strategies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 relative z-10">
        {/* ── Multi-tier Cashflow Sankey ── */}
        <div className="lg:col-span-3 bento-card p-6">
          <h3 className="text-title slashed-zero text-[var(--card-foreground)] mb-4">Cash Flow Diagram</h3>
          {sankeyData.links.length > 0 ? (
            <Sankey
              width={860}
              height={500}
              data={sankeyData}
              nodePadding={18}
              nodeWidth={16}
              iterations={64}
              margin={{ top: 10, left: 120, right: 160, bottom: 10 }}
              node={<CustomNode palette={pal} />}
              link={<CustomLink palette={pal} />}
            />
          ) : (
            <div
              className="flex items-center justify-center h-48 text-sm text-[var(--secondary)]"
              style={{
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
              }}
            >
              {totalIncome <= 0
                ? 'Income data not available. Complete onboarding to see your cashflow.'
                : 'No cashflow data available.'}
            </div>
          )}

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Essential Expenses', value: formatInr(totalExpenses), color: pal.amber },
              { label: 'Debt & Savings', value: formatInr(debtAndSavings), color: pal.red },
              { label: 'Goals Progress', value: formatInr(goalAllocationsTotal), color: pal.lime },
              { label: 'Free Cash', value: formatInr(disposable), color: pal.green },
            ].map(stat => (
              <div key={stat.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--surface-hover)' }}>
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: stat.color }}
                >
                  {stat.label}
                </div>
                <div className="text-sm font-bold slashed-zero text-[var(--card-foreground)]">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Strategy Comparison Cards ── */}
        {comparison && (
          <>
            <div className={`bento-card flex flex-col ${!isSingleDebt && comparison.recommendation === 'avalanche' ? 'border-[var(--tertiary-accent)] border-2 shadow-[0_0_24px_var(--tertiary-accent-subtle)]' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-title slashed-zero text-[var(--card-foreground)]">Avalanche</h3>
                  <p className="text-[10px] text-[var(--secondary)] mt-1 max-w-[240px]">Pay highest interest first. Minimises total interest paid.</p>
                </div>
                <Zap size={18} className="text-[var(--tertiary-accent-text)]" />
              </div>
              <div className="relative mb-4 flex-1 flex flex-col justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-[var(--tertiary-accent)] opacity-15 blur-2xl pointer-events-none" />
                <div className="relative text-center py-4">
                  <div className="text-xl font-bold mb-1 slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {comparison.avalanche.totalMonths} months
                  </div>
                  <div className="text-sm text-[var(--secondary)]">Total Interest: {formatInr(comparison.avalanche.totalInterestPaid)}</div>
                </div>
              </div>
              <div className="space-y-2 mt-auto p-3 rounded-xl" style={{ background: 'var(--surface-tint)' }}>
                <div className="text-xs font-semibold text-[var(--secondary)] uppercase tracking-wider mb-1">Payoff Order</div>
                {debtItems.slice().sort((a, b) => b.interestRate - a.interestRate).map((d, i) => (
                  <div key={d.id} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--card-foreground)]">{i + 1}. {d.name}</span>
                    <span className="text-[var(--secondary)]">{d.interestRate}% APR</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`bento-card flex flex-col ${!isSingleDebt && comparison.recommendation === 'snowball' ? 'border-[var(--tertiary-accent)] border-2 shadow-[0_0_24px_var(--tertiary-accent-subtle)]' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-title slashed-zero text-[var(--card-foreground)]">Snowball</h3>
                  <p className="text-[10px] text-[var(--secondary)] mt-1 max-w-[240px]">Pay smallest balance first. Psychologically motivating with quick wins.</p>
                </div>
                <Snowflake size={18} className="text-[var(--tertiary-accent-text)]" />
              </div>
              <div className="relative mb-4 flex-1 flex flex-col justify-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-[var(--tertiary-accent)] opacity-15 blur-2xl pointer-events-none" />
                <div className="relative text-center py-4">
                  <div className="text-xl font-bold mb-1 slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {comparison.snowball.totalMonths} months
                  </div>
                  <div className="text-sm text-[var(--secondary)]">Total Interest: {formatInr(comparison.snowball.totalInterestPaid)}</div>
                </div>
              </div>
              <div className="space-y-2 mt-auto p-3 rounded-xl" style={{ background: 'var(--surface-tint)' }}>
                <div className="text-xs font-semibold text-[var(--secondary)] uppercase tracking-wider mb-1">Payoff Order</div>
                {debtItems.slice().sort((a, b) => a.principal - b.principal).map((d, i) => (
                  <div key={d.id} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--card-foreground)]">{i + 1}. {d.name}</span>
                    <span className="text-[var(--secondary)]">{formatInr(d.principal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`bento-card flex flex-col items-center justify-center gap-2 ${isSingleDebt ? 'text-center' : ''}`}>
              {isSingleDebt ? (
                <div className="text-center">
                  <div className="text-sm font-medium text-[var(--secondary)] mb-1">Single Debt</div>
                  <p className="text-xs text-[var(--secondary)] max-w-[240px]">With only one debt, both strategies behave the same.</p>
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium text-[var(--secondary)]">
                    {comparison.interestSaved > 0
                      ? `${comparison.recommendation === 'avalanche' ? 'Avalanche' : 'Snowball'} saves you`
                      : comparison.interestSaved < 0
                        ? `${comparison.recommendation === 'avalanche' ? 'Snowball' : 'Avalanche'} saves you`
                        : 'No interest difference'}
                  </div>
                  {comparison.interestSaved !== 0 && (
                    <div className="text-3xl font-bold slashed-zero text-[var(--tertiary-accent-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                      {formatInr(Math.abs(comparison.interestSaved))}
                    </div>
                  )}
                  {comparison.monthsDifference !== 0 && (
                    <div className="text-xs text-[var(--secondary)]">
                      {Math.abs(comparison.monthsDifference)} month{Math.abs(comparison.monthsDifference) > 1 ? 's' : ''} {comparison.monthsDifference > 0 ? 'faster' : 'slower'}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="lg:col-span-3 bento-card p-6">
              <h3 className="text-title slashed-zero text-[var(--card-foreground)] mb-2">Extra Monthly Payment</h3>
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {formatInr(extraPayment)}
                </span>
                <span className="text-sm text-[var(--secondary)]">per month</span>
              </div>
              <input
                type="range"
                min={0}
                max={50000}
                step={500}
                value={extraPayment}
                onChange={e => setExtraPayment(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${(extraPayment / 50000) * 100}%, var(--border) ${(extraPayment / 50000) * 100}%, var(--border) 100%)`,
                  accentColor: 'var(--accent)',
                }}
              />
              <div className="flex justify-between text-xs text-[var(--secondary)] mt-1">
                <span>₹0</span>
                <span>₹50,000</span>
              </div>
              {extraPaymentImpact && (
                <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                  <span className="text-[var(--tertiary-accent-text)] font-semibold">Impact: </span>
                  <span className="text-[var(--card-foreground)]">
                    {`Saves ${extraPaymentImpact.savedMonths} month${extraPaymentImpact.savedMonths !== 1 ? 's' : ''}, ${formatInr(extraPaymentImpact.savedInterest)} in interest`}
                  </span>
                </div>
              )}
            </div>

            {timelineChartData.length > 0 && (
              <div className="lg:col-span-3 bento-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-title slashed-zero text-[var(--card-foreground)]">Payoff Timeline</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setTimelineStrategy('avalanche')} className={`pill-button text-xs py-1.5 px-3 ${timelineStrategy === 'avalanche' ? 'active' : ''}`}>Avalanche</button>
                    <button onClick={() => setTimelineStrategy('snowball')} className={`pill-button text-xs py-1.5 px-3 ${timelineStrategy === 'snowball' ? 'active' : ''}`}>Snowball</button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
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
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="lg:col-span-3 bento-card p-6">
              <h3 className="text-title slashed-zero text-[var(--card-foreground)] mb-4">Your Debts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {debtItems.map((d) => {
                  const payoffMonth = timelineResult?.payoffDates?.[d.id];
                  const payoffDate = payoffMonth
                    ? (() => { const date = new Date(); date.setMonth(date.getMonth() + payoffMonth); return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }); })()
                    : null;
                  const relatedGoal = goals.find(g => g.category === 'debt' && (g.name === d.name || g.name.includes(d.name)));
                  const paidPct = d.principal > 0 && relatedGoal ? Math.min(100, (relatedGoal.currentAmount / relatedGoal.targetAmount) * 100) : 0;

                  return (
                    <div key={d.id} className="p-4 rounded-xl" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-[var(--card-foreground)]">{d.name}</h4>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ background: 'var(--surface-tint)', color: 'var(--secondary)' }}>
                            {CATEGORY_LABELS[d.category] || d.category}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><div className="text-[var(--secondary)] text-xs">Principal</div><div className="font-semibold slashed-zero text-[var(--card-foreground)]">{formatInr(d.principal)}</div></div>
                        <div><div className="text-[var(--secondary)] text-xs">Interest Rate</div><div className="font-semibold slashed-zero text-[var(--card-foreground)]">{d.interestRate}% APR</div></div>
                        <div><div className="text-[var(--secondary)] text-xs">Monthly Payment</div><div className="font-semibold slashed-zero text-[var(--card-foreground)]">{formatInr(d.monthlyPayment)}</div></div>
                        <div><div className="text-[var(--secondary)] text-xs">Est. Payoff</div><div className="font-semibold slashed-zero text-[var(--card-foreground)]">{payoffDate || '—'}</div></div>
                      </div>
                      {paidPct > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--secondary)]">Progress via goals</span>
                            <span className="font-semibold text-[var(--card-foreground)]">{Math.round(paidPct)}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-tint)' }}>
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${paidPct}%`, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {debtItems.length === 0 && (
          <div className="lg:col-span-3 flex flex-col items-center justify-center py-12 text-center" style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)', borderRadius: '16px' }}>
            <CreditCard size={36} className="text-[var(--secondary)] mb-4" />
            <p className="text-lg font-medium text-[var(--card-foreground)] mb-1">No Debts Tracked</p>
            <p className="text-sm text-[var(--secondary)] max-w-md">
              You don't have any debts on record. Add debts during onboarding to unlock strategy comparison and payoff timeline views.
            </p>
          </div>
        )}

        <div
          className="lg:col-span-3 p-6 md:p-8 rounded-2xl flex flex-col gap-4 relative overflow-hidden z-10 bento-card border border-[var(--tertiary-accent)]"
          style={{ background: 'var(--surface-tint)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-[var(--tertiary-accent)] opacity-20 dark:opacity-30 dark:mix-blend-screen blur-[80px] md:blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--tertiary-accent-subtle)', color: 'var(--tertiary-accent-text)' }}>
              <Sparkles size={16} />
            </div>
            <h3 className="text-heading slashed-zero text-[var(--card-foreground)]">Penny's Insight</h3>
          </div>
          {debtItems.length > 0 && dti > 40 && (
            <div className="relative z-10 flex items-start gap-3 p-3 rounded-xl text-sm" style={{ background: 'var(--surface-hover)', border: '1px solid var(--red)', color: 'var(--red-text)' }}>
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>High debt burden: DTI ratio is {Math.round(dti)}%. Consider reducing discretionary spending and prioritising high-interest debt payoff.</span>
            </div>
          )}
          <div className="relative z-10 space-y-3">
            {pennyInsights.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl text-sm"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', fontFamily: 'var(--font-body)', color: 'var(--card-foreground)' }}
              >
                <span className="text-[var(--tertiary-accent)] mt-0.5 font-bold">{i + 1}.</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}