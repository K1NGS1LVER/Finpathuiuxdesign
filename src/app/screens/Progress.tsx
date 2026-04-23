import { useState, useMemo } from 'react';
import { TrendingUp, Award, Flame, Target, CheckCircle2 } from 'lucide-react';
import { useFinPathStore } from '../../lib/store';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from 'recharts';
import confetti from 'canvas-confetti';

export default function Progress() {
  const income = useFinPathStore(s => s.income);
  const expenses = useFinPathStore(s => s.expenses);
  const debts = useFinPathStore(s => s.debts);
  const goals = useFinPathStore(s => s.goals);
  const plan = useFinPathStore(s => s.plan);
  const healthScore = useFinPathStore(s => s.healthScore);
  const savings = useFinPathStore(s => s.savings);
  const investments = useFinPathStore(s => s.investments);

  const surplus = income.total - expenses.total - debts.totalMonthly;

  // Generate net worth timeline from plan
  const netWorthData = useMemo(() => {
    if (!plan?.months.length) {
      // Generate synthetic data if no plan exists
      const data = [];
      let netWorth = savings + investments;
      for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() + i);
        netWorth += Math.max(0, surplus);
        data.push({
          month: d.toLocaleDateString('en-IN', { month: 'short' }),
          netWorth: Math.round(netWorth),
        });
      }
      return data;
    }
    return plan.months.slice(0, 24).map(m => ({
      month: m.date.split(' ')[0], // "Apr"
      netWorth: m.netWorth,
    }));
  }, [plan, savings, investments, surplus]);

  // Streak counter (simulated based on consecutive goal allocations)
  const streakDays = useMemo(() => {
    const completedGoals = goals.filter(g => g.status === 'complete').length;
    return Math.min(30, 7 + completedGoals * 5);
  }, [goals]);

  // Badges
  const badges = useMemo(() => {
    const list = [];
    if (income.total > 0) list.push({ name: 'First Step', icon: '🚀', desc: 'Completed onboarding', earned: true });
    if (healthScore && healthScore.overall >= 50) list.push({ name: 'Healthy Start', icon: '💪', desc: 'Health score above 50', earned: true });
    if (goals.length >= 2) list.push({ name: 'Goal Setter', icon: '🎯', desc: 'Set 2+ financial goals', earned: true });
    if (surplus > 0) list.push({ name: 'In the Green', icon: '💚', desc: 'Positive monthly surplus', earned: true });
    list.push({ name: 'Debt Crusher', icon: '⚡', desc: 'Pay off first debt', earned: debts.items.some(d => d.remainingMonths <= 0) });
    list.push({ name: 'Goal Achiever', icon: '🏆', desc: 'Complete first goal', earned: goals.some(g => g.status === 'complete') });
    list.push({ name: 'Streak Master', icon: '🔥', desc: '30-day check-in streak', earned: streakDays >= 30 });
    list.push({ name: 'Wealth Builder', icon: '💎', desc: 'Net worth above ₹5L', earned: (savings + investments) >= 500000 });
    return list;
  }, [income, healthScore, goals, surplus, debts, savings, investments, streakDays]);

  // Monthly check-in state
  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = () => {
    setCheckedIn(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  // Custom tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
          <p className="font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{label}</p>
          <p className="text-[var(--lime-text)] font-semibold slashed-zero">{fmt(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative">
      {/* Decorative */}
      <div className="absolute -top-20 right-0 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--lime)' }} />

      {/* Header */}
      <div className="relative z-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Progress Tracking</h1>
        <p className="text-sm md:text-base text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Your financial journey at a glance</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 relative z-10">
        <div className="bento-card p-5 flex flex-col items-center text-center">
          <Flame size={24} className="mb-2" style={{ color: 'var(--amber)' }} />
          <div className="text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{streakDays}</div>
          <div className="text-xs font-medium text-[var(--secondary)] mt-1">Day Streak</div>
        </div>
        <div className="bento-card p-5 flex flex-col items-center text-center">
          <Target size={24} className="mb-2" style={{ color: 'var(--lime)' }} />
          <div className="text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{goals.filter(g => g.status === 'complete').length}/{goals.length}</div>
          <div className="text-xs font-medium text-[var(--secondary)] mt-1">Goals Done</div>
        </div>
        <div className="bento-card p-5 flex flex-col items-center text-center">
          <TrendingUp size={24} className="mb-2" style={{ color: 'var(--blue)' }} />
          <div className="text-2xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{fmt(savings + investments)}</div>
          <div className="text-xs font-medium text-[var(--secondary)] mt-1">Net Worth</div>
        </div>
        <div className="bento-card p-5 flex flex-col items-center text-center">
          <Award size={24} className="mb-2" style={{ color: 'var(--violet)' }} />
          <div className="text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{badges.filter(b => b.earned).length}</div>
          <div className="text-xs font-medium text-[var(--secondary)] mt-1">Badges Earned</div>
        </div>
      </div>

      {/* Net Worth Chart */}
      <div className="bento-card p-6 md:p-8 relative z-10">
        <h3 className="text-xl font-bold mb-6 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Net Worth Timeline</h3>
        <div className="h-[250px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netWorthData}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--lime)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--lime)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis
                dataKey="month"
                stroke="var(--secondary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--secondary)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="var(--lime)"
                strokeWidth={3}
                fill="url(#netWorthGradient)"
                dot={false}
                activeDot={{ r: 6, fill: 'var(--lime)', stroke: 'var(--card)', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
        {/* Monthly Check-in */}
        <div className="bento-card p-6 md:p-8">
          <h3 className="text-xl font-bold mb-4 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Monthly Check-in</h3>
          <div className="space-y-4">
            {goals.map(goal => {
              const progress = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--card-foreground)]">{goal.name}</span>
                    <span className="text-xs font-bold slashed-zero" style={{ color: goal.status === 'complete' ? 'var(--lime-text)' : 'var(--secondary)' }}>
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--progress-inactive)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: goal.status === 'complete' ? 'var(--lime)' : 'var(--blue)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {!checkedIn ? (
            <button
              onClick={handleCheckIn}
              className="w-full mt-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-body)', boxShadow: '0 8px 24px rgba(176, 255, 9, 0.3)' }}
            >
              <CheckCircle2 size={18} />
              Complete Monthly Check-in
            </button>
          ) : (
            <div className="mt-6 py-3 rounded-xl font-bold text-center" style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-body)', opacity: 0.7 }}>
              ✅ Checked in for this month!
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="bento-card p-6 md:p-8">
          <h3 className="text-xl font-bold mb-4 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Badges</h3>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge, i) => (
              <div
                key={i}
                className="p-4 rounded-xl flex flex-col items-center text-center transition-all"
                style={{
                  background: badge.earned ? 'var(--surface-tint)' : 'var(--surface-hover)',
                  border: badge.earned ? '1px solid var(--lime)' : '1px solid var(--border)',
                  opacity: badge.earned ? 1 : 0.4,
                }}
              >
                <div className="text-2xl mb-2">{badge.icon}</div>
                <div className="text-xs font-bold text-[var(--card-foreground)] mb-1" style={{ fontFamily: 'var(--font-body)' }}>{badge.name}</div>
                <div className="text-[10px] text-[var(--secondary)]">{badge.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health Score Breakdown */}
      {healthScore && (
        <div className="bento-card p-6 md:p-8 relative z-10">
          <h3 className="text-xl font-bold mb-6 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Health Score Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Income Stability', score: healthScore.incomeStability, max: 25, color: 'var(--lime)' },
              { label: 'Debt Load', score: healthScore.debtLoad, max: 25, color: 'var(--blue)' },
              { label: 'Savings Rate', score: healthScore.savingsRate, max: 25, color: 'var(--violet)' },
              { label: 'Emergency Fund', score: healthScore.emergencyFund, max: 25, color: 'var(--amber)' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold slashed-zero text-[var(--card-foreground)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>{item.score}</div>
                <div className="text-xs text-[var(--secondary)] mb-3">{item.label}</div>
                <div className="h-2 rounded-full overflow-hidden mx-auto max-w-[100px]" style={{ backgroundColor: 'var(--progress-inactive)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(item.score / item.max) * 100}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {healthScore.actions.length > 0 && (
            <div className="mt-6 p-4 rounded-xl space-y-2" style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold text-[var(--lime-text)] uppercase tracking-wider mb-2">Penny's Top Actions</div>
              {healthScore.actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-body)' }}>
                  <span className="text-[var(--lime)] mt-0.5">•</span>
                  {action}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
