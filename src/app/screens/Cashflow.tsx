import { useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useFinPathStore } from '@/lib/store';
import { Sankey, ResponsiveContainer } from 'recharts';
import {
  CustomNode,
  CustomLink,
  usePalette,
  formatInr,
} from '@/app/components/SankeyFlow';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface FlowItem {
  label: string;
  v: number;
}

interface FlowColProps {
  title: string;
  total: number;
  items: FlowItem[];
  accent: string;
  center?: boolean;
}

function FlowCol({ title, total, items, accent }: FlowColProps) {
  const visibleItems = items.filter(it => it.v > 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        padding: 'var(--space-1)',
        borderRadius: 'var(--radius-base)',
        background: 'var(--surface-hover)',
        border: '1px solid var(--border)',
      }}>
        <p className="text-label" style={{ fontSize: 'var(--text-2xs)' }}>{title}</p>
        <p
          style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: accent, marginTop: 2 }}
          className="slashed-zero"
        >
          {formatInr(total)}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visibleItems.map((it, i) => {
          const pct = total > 0 ? (it.v / total) * 100 : 0;
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                height: 44,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-tint)',
                border: '1px solid var(--border)',
                padding: '0 var(--space-1) 0 var(--space-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${pct}%`, background: accent, opacity: 0.07,
                transition: 'width 0.6s ease',
              }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent, borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', opacity: 0.6 }} />
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', position: 'relative' }}>{it.label}</p>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', position: 'relative', color: 'var(--neutral-400)' }}>{pct.toFixed(0)}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Cashflow() {
  const income = useFinPathStore(s => s.income);
  const expenses = useFinPathStore(s => s.expenses);
  const plan = useFinPathStore(s => s.plan);
  const monthlySurplusReserve = useFinPathStore(s => s.monthlySurplusReserve);
  const goals = useFinPathStore(s => s.goals);
  const debts = useFinPathStore(s => s.debts);
  const savings = useFinPathStore(s => s.savings);
  const emergencyFund = useFinPathStore(s => s.emergencyFund);
  const healthScore = useFinPathStore(s => s.healthScore);

  const pal = usePalette();

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const goalAllocationsTotal = useMemo(() => {
    if (plan?.months?.[0]?.goalAllocations) {
      return Object.values(plan.months[0].goalAllocations).reduce((sum, v) => sum + v, 0);
    }
    return goals
      .filter(g => g.status !== 'complete')
      .reduce((sum, g) => sum + (g.monthlyAllocation || 0), 0);
  }, [plan, goals]);

  const totalIncome = income.total || 0;
  const debtPayments = debts.totalMonthly || 0;
  const totalExpenses = expenses.total || 0;
  const surplusReserve = monthlySurplusReserve || 0;
  const debtAndSavings = debtPayments + goalAllocationsTotal + surplusReserve;
  const disposable = Math.max(0, totalIncome - totalExpenses - debtAndSavings);

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

  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;
  const surplus = Math.max(0, totalIncome - totalExpenses);
  const goalCoverage = surplus > 0 ? Math.round((goalAllocationsTotal / surplus) * 100) : 0;

  const efMonths = (totalExpenses + debtPayments) > 0
    ? Math.floor(emergencyFund / (totalExpenses + debtPayments))
    : 0;

  const cashflowInsights = useMemo(() => {
    const insights: string[] = [];

    if (totalIncome <= 0) {
      return ['Income data not available. Complete onboarding to see cashflow insights.'];
    }

    const expenseRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
    if (expenseRatio > 70) {
      insights.push(`Your expenses consume ${expenseRatio}% of income — aim to keep essential spending below 50% for a healthy buffer.`);
    } else if (expenseRatio > 50) {
      insights.push(`Expenses are ${expenseRatio}% of your income. There's room to trim discretionary spending to boost savings.`);
    } else {
      insights.push(`Expenses account for only ${expenseRatio}% of your income — you're maintaining a lean lifestyle.`);
    }

    if (healthScore) {
      if (healthScore.savingsRate >= 20) {
        insights.push(`Your savings rate is strong at ${savingsRate}% — keep it above 20% for long-term wealth building.`);
      } else {
        insights.push(`Your savings rate could improve. Aim to save at least 20% of income for long-term financial security.`);
      }

      if (efMonths < 3) {
        const monthlyExpense = totalExpenses + debtPayments;
        const target = monthlyExpense * 3;
        const needed = Math.max(0, target - emergencyFund);
        insights.push(`Build your emergency fund — save ${formatInr(needed)} more to cover 3 months of expenses.`);
      } else {
        insights.push(`Your emergency fund covers ${efMonths}+ months — great safety net.`);
      }
    }

    if (disposable > 0) {
      insights.push(`You have ${formatInr(disposable)} in free cash each month — consider allocating it to goals or investments.`);
    } else if (disposable === 0 && totalIncome > 0) {
      insights.push(`Your income is fully allocated with no free cash remaining. Review your budget for optimisation opportunities.`);
    }

    if (savings > 0) {
      insights.push(`Your total savings stand at ${formatInr(savings)} — consider investing idle cash for better returns.`);
    }

    const dti = totalIncome > 0 ? Math.round((debtPayments / totalIncome) * 100) : 0;
    if (dti > 40) {
      insights.push(`High debt-to-income ratio: ${dti}%. Prioritise paying down high-interest debts.`);
    }

    return insights;
  }, [totalIncome, totalExpenses, debtPayments, disposable, healthScore, emergencyFund, savings, savingsRate, efMonths]);

  const dti = totalIncome > 0 ? Math.round((debtPayments / totalIncome) * 100) : 0;

  const incomeItems: FlowItem[] = [
    { label: 'Salary', v: income.salary || 0 },
    { label: 'Freelance', v: income.freelance || 0 },
    { label: 'Passive income', v: income.passive || 0 },
  ];

  const expenseItems: FlowItem[] = [
    { label: 'Rent', v: expenses.rent || 0 },
    { label: 'Food', v: expenses.food || 0 },
    { label: 'Transport', v: expenses.transport || 0 },
    { label: 'Utilities', v: expenses.utilities || 0 },
    { label: 'Entertainment', v: expenses.entertainment || 0 },
    { label: 'Other', v: expenses.other || 0 },
    { label: 'Goal allocations', v: goalAllocationsTotal },
  ];

  const outcomeItems: FlowItem[] = [
    { label: 'Goal allocations', v: goalAllocationsTotal },
    { label: 'Surplus reserve', v: surplusReserve },
    { label: 'Free cash', v: disposable },
  ];

  const expenseTotal = totalExpenses + goalAllocationsTotal;
  const outcomeTotal = goalAllocationsTotal + surplusReserve + disposable;

  const activeGoals = useMemo(() =>
    goals
      .filter(g => g.status !== 'complete')
      .map(g => ({
        ...g,
        alloc: plan?.months?.[0]?.goalAllocations?.[g.id] ?? g.monthlyAllocation ?? 0,
        completionDate: plan?.goalCompletionDates?.[g.id] ?? null,
        progressPct: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0,
      })),
    [goals, plan]
  );

  return (
    <div className="max-w-7xl mx-auto relative text-[var(--foreground)]">
      <div className="mb-6">
        <p className="text-label">Money Flow · {monthLabel}</p>
        <h2 className="text-title slashed-zero text-[var(--card-foreground)] mt-1">Cashflow</h2>
      </div>

      <div className="flex flex-col gap-4 md:gap-6 relative z-10">
        {/* Sankey */}
        <div className="bento-card p-6">
          <h3 className="text-heading slashed-zero text-[var(--card-foreground)] mb-4">Flow Diagram</h3>
          {sankeyData.links.length > 0 ? (
            <ResponsiveContainer width="100%" height={480}>
              <Sankey
                data={sankeyData}
                nodePadding={18}
                nodeWidth={16}
                iterations={64}
                margin={{ top: 10, left: 120, right: 160, bottom: 10 }}
                node={<CustomNode palette={pal} />}
                link={<CustomLink palette={pal} />}
              />
            </ResponsiveContainer>
          ) : (
            <div
              className="flex items-center justify-center h-48 text-sm text-[var(--secondary)]"
              style={{
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-base)',
              }}
            >
              {totalIncome <= 0
                ? 'Income data not available. Complete onboarding to see your cashflow.'
                : 'No cashflow data available.'}
            </div>
          )}
          {totalIncome > 0 && (
            <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--neutral-400)', lineHeight: 1.6 }}>
                <strong>Essential Expenses:</strong> Housing (rent + utilities), Food, Transport, Other.
                <br/><strong>Debt & Savings:</strong> Debt Payments, Goal allocations, Surplus reserve.
              </p>
            </div>
          )}
        </div>

        {/* Goals */}
        {activeGoals.length > 0 && (
          <div className="bento-card p-6">
            <h3 className="text-heading slashed-zero text-[var(--card-foreground)] mb-4">Goal Allocations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {activeGoals.map(g => (
                <div
                  key={g.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    padding: 'var(--space-1)', borderRadius: 'var(--radius-base)',
                    background: 'var(--surface-hover)', border: '1px solid var(--border)',
                  }}
                >
                  <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {g.name}
                  </p>

                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'var(--surface-tint)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${g.progressPct}%`,
                        background: 'var(--accent)',
                        borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', lineHeight: 1 }} className="slashed-zero">
                      {formatInr(g.alloc)}<span style={{ fontFamily: 'var(--font-body)', fontWeight: 'var(--font-weight-regular)', fontSize: 'var(--text-2xs)', color: 'var(--neutral-400)' }}>/mo</span>
                    </p>
                    {g.completionDate && (
                      <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--neutral-400)', marginTop: 2 }}>{g.completionDate}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Penny insights */}
        <div className="flex flex-col gap-4 penny-insight-card">
          <div className="penny-insight-blob" />
          <div className="relative z-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--penny-accent-subtle)', color: 'var(--penny-accent)' }}>
              <Sparkles size={16} />
            </div>
            <h3 className="text-heading slashed-zero text-[var(--card-foreground)]">Penny's Insight</h3>
          </div>
          {dti > 40 && (
            <div className="relative z-10 flex items-start gap-3 p-3 rounded-xl text-sm" style={{ background: 'var(--surface-hover)', border: '1px solid var(--red)', color: 'var(--red-text)' }}>
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>High debt burden: DTI ratio is {dti}%. Consider reducing discretionary spending and prioritising high-interest debt payoff.</span>
            </div>
          )}
          <div className="relative z-10 space-y-3">
            {cashflowInsights.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl text-sm"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', fontFamily: 'var(--font-body)', color: 'var(--card-foreground)' }}
              >
                <span className="text-[var(--penny-accent)] mt-0.5 font-bold">{i + 1}.</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
