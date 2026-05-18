import { useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useFinPathStore } from '@/lib/store';
import { pageContainer, pageSection } from '@/app/components/motion-variants';
import { Sankey, ResponsiveContainer } from 'recharts';
import {
  CustomNode,
  CustomLink,
  usePalette,
} from '@/app/components/SankeyFlow';
import { formatInr } from '@/lib/format';
import { buildSankeyData, computeGoalAllocationsTotal } from '@/lib/sankey-data';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

  const goalAllocationsTotal = useMemo(
    () => computeGoalAllocationsTotal({ income, expenses, debts, monthlySurplusReserve, plan, goals }),
    [income, expenses, debts, monthlySurplusReserve, plan, goals],
  );

  const totalIncome = income.total || 0;
  const debtPayments = debts.totalMonthly || 0;
  const totalExpenses = expenses.total || 0;
  const housing = (expenses.rent || 0) + (expenses.utilities || 0);
  const food = expenses.food || 0;
  const transport = expenses.transport || 0;
  const otherExp = (expenses.entertainment || 0) + (expenses.other || 0);
  const totalExpensesDeduped = housing + food + transport + otherExp;
  const surplusReserve = monthlySurplusReserve || 0;
  const debtAndSavings = debtPayments + goalAllocationsTotal + surplusReserve;
  const disposable = Math.max(0, totalIncome - totalExpensesDeduped - debtAndSavings);

  const sankeyData = useMemo(
    () => buildSankeyData({ income, expenses, debts, monthlySurplusReserve, plan, goals }),
    [income, expenses, debts, monthlySurplusReserve, plan, goals],
  );

  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

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
    <motion.div className="max-w-7xl mx-auto relative text-[var(--foreground)]" variants={pageContainer} initial="hidden" animate="visible">
      <motion.div className="mb-6" variants={pageSection}>
        <p className="text-label">Money Flow · {monthLabel}</p>
        <h2 className="text-title slashed-zero text-[var(--card-foreground)] mt-1">Cashflow</h2>
      </motion.div>

      <motion.div className="flex flex-col gap-4 md:gap-6 relative z-10" variants={pageSection}>
        <div className="bento-card">
          <h3 className="text-heading slashed-zero text-[var(--card-foreground)] mb-4">Flow Diagram</h3>
          {sankeyData.links.length > 0 ? (
            <div role="img" aria-label="Cashflow Sankey diagram showing income sources, essential expenses, debt and savings, and disposable income allocation">
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
            </div>
          ) : (
            <div
              role="status"
              className="flex items-center justify-center h-48 text-sm text-[var(--secondary)] rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]"
            >
              {totalIncome <= 0
                ? 'Income data not available. Complete onboarding to see your cashflow.'
                : 'No cashflow data available.'}
            </div>
          )}
          {totalIncome > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-2">
              <p className="text-xs text-[var(--card-foreground)]">
                <strong>Essential Expenses</strong> {formatInr(totalExpensesDeduped)} ({Math.round((totalExpensesDeduped / totalIncome) * 100)}% of income): Housing, Food, Transport, Other
              </p>
              <p className="text-xs text-[var(--card-foreground)]">
                <strong>Debt & Savings</strong> {formatInr(debtAndSavings)} ({Math.round((debtAndSavings / totalIncome) * 100)}% of income): Debt Payments, Goals, Surplus Reserve
              </p>
              <p className="text-xs text-[var(--card-foreground)]">
                <strong>Disposable</strong> {formatInr(disposable)} ({Math.round((disposable / totalIncome) * 100)}% of income): Unallocated free cash
              </p>
            </div>
          )}
        </div>

        {activeGoals.length > 0 && (
          <div className="bento-card">
            <h3 className="text-heading slashed-zero text-[var(--card-foreground)] mb-4">Goal Allocations</h3>
            <div className="flex flex-col gap-2">
              {activeGoals.map(g => (
                <div
                  key={g.id}
                  className="flex items-center gap-4 p-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]"
                >
                  <p className="text-xs font-semibold flex-1 min-w-0 truncate">
                    {g.name}
                  </p>

                  <div className="flex-[2] flex flex-col">
                    <div className="h-2 rounded-full bg-[var(--surface-tint)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-[width] duration-600 ease"
                        style={{ width: `${g.progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right min-w-20">
                    <p className="font-display text-xs font-bold leading-none slashed-zero">
                      {formatInr(g.alloc)}<span className="font-body font-normal text-[var(--text-2xs)] text-[var(--neutral-400)]">/mo</span>
                    </p>
                    {g.completionDate && (
                      <p className="text-[var(--text-2xs)] text-[var(--neutral-400)] mt-0.5">{g.completionDate}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bento-card penny-card flex flex-col gap-4">
          <div className="penny-insight-blob" />
          <div className="relative z-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--penny-accent-subtle)] text-[var(--penny-accent)]">
              <Sparkles size={18} className="icon-wireframe" />
            </div>
            <h3 className="text-heading slashed-zero text-[var(--card-foreground)]">Penny's Insight</h3>
          </div>
          {dti > 40 && (
            <div className="relative z-10 flex items-start gap-3 p-3 rounded-md text-sm bg-[var(--surface-hover)] border border-[var(--red)] text-[var(--red-text)]">
              <AlertTriangle size={18} className="icon-wireframe flex-shrink-0 mt-0.5" />
              <span>High debt burden: DTI ratio is {dti}%. Consider reducing discretionary spending and prioritising high-interest debt payoff.</span>
            </div>
          )}
          <ul role="list" className="relative z-10 flex flex-col gap-3 list-none p-0 m-0">
            {cashflowInsights.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-md text-sm bg-[var(--surface-hover)] border border-[var(--border)] font-body text-[var(--card-foreground)]">
                <span className="text-[var(--penny-accent)] mt-0.5 font-bold">{i + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
