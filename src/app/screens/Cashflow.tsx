import { useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useFinPathStore } from '@/lib/store';
import { Sankey } from 'recharts';
import {
  CustomNode,
  CustomLink,
  usePalette,
  formatInr,
} from '@/app/components/SankeyFlow';

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
        insights.push(`Your savings rate is strong at ${Math.round((totalIncome - totalExpenses - debtPayments) / Math.max(1, totalIncome) * 100)}% — keep it above 20% for long-term wealth building.`);
      } else {
        insights.push(`Your savings rate could improve. Aim to save at least 20% of income for long-term financial security.`);
      }

      if (healthScore.emergencyFund < 18) {
        const monthlyExpense = totalExpenses + debtPayments;
        const target = monthlyExpense * 3;
        const needed = Math.max(0, target - emergencyFund);
        insights.push(`Build your emergency fund — save ${formatInr(needed)} more to cover 3 months of expenses.`);
      } else {
        insights.push(`Your emergency fund covers ${Math.round(emergencyFund / Math.max(1, totalExpenses + debtPayments))}+ months — great safety net.`);
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
  }, [totalIncome, totalExpenses, debtPayments, disposable, healthScore, emergencyFund, savings]);

  const dti = totalIncome > 0 ? Math.round((debtPayments / totalIncome) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto relative text-[var(--foreground)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 relative z-10">
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

        <div className="lg:col-span-3 flex flex-col gap-4 penny-insight-card">
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