import { Check, Circle } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useFinPathStore } from '../../lib/store';

export default function Month() {
  const income = useFinPathStore(s => s.income);
  const expenses = useFinPathStore(s => s.expenses);
  const debts = useFinPathStore(s => s.debts);
  const goals = useFinPathStore(s => s.goals);
  const plan = useFinPathStore(s => s.plan);
  const updateGoal = useFinPathStore(s => s.updateGoal);

  // Generate tasks from real goals
  const initialTasks = useMemo(() => {
    const taskList = [];
    let id = 1;
    
    if (expenses.rent > 0) {
      taskList.push({ id: `rent`, text: `Pay rent ₹${expenses.rent.toLocaleString('en-IN')} by 5th`, done: false, isGoal: false });
    }
    
    for (const goal of goals.slice(0, 2)) {
      if (goal.status === 'complete') continue;
      const monthly = goal.monthlyAllocation || Math.round((goal.targetAmount - goal.currentAmount) / Math.max(1, goal.timelineMonths));
      if (monthly > 0) {
        taskList.push({ 
          id: goal.id, 
          text: `Add ₹${(monthly / 1000).toFixed(0)}K to ${goal.name} savings`, 
          done: !!goal.checkedThisMonth, 
          isGoal: true, 
          goalId: goal.id, 
          amount: monthly 
        });
      }
    }

    taskList.push({ id: 'review', text: 'Review subscription services', done: false, isGoal: false });
    taskList.push({ id: 'track', text: 'Track all expenses this week', done: false, isGoal: false });
    
    return taskList;
  }, [expenses, goals]);

  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (task.isGoal && task.goalId && task.amount) {
      const goal = goals.find(g => g.id === task.goalId);
      if (goal) {
        const newDoneState = !task.done;
        let newAmount = goal.currentAmount;
        
        if (newDoneState) {
          newAmount = Math.min(goal.targetAmount, goal.currentAmount + task.amount);
        } else {
          newAmount = Math.max(0, goal.currentAmount - task.amount);
        }
        
        updateGoal(goal.id, { 
          currentAmount: newAmount,
          checkedThisMonth: newDoneState,
          status: newAmount >= goal.targetAmount ? 'complete' : 'in-progress'
        });
      }
    }

    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const surplus = income.total - expenses.total - debts.totalMonthly;
  const savingsTarget = Math.max(0, Math.round(surplus * 0.6)); // 60% to savings/goals
  const wantsTarget = Math.round(expenses.entertainment + expenses.other);

  const budget = [
    { category: 'Essentials', planned: Math.round(expenses.rent + expenses.food + expenses.transport + expenses.utilities), actual: Math.round((expenses.rent + expenses.food + expenses.transport + expenses.utilities) * 0.95), color: 'var(--blue)' },
    { category: 'Savings', planned: savingsTarget, actual: savingsTarget, color: 'var(--lime)' },
    { category: 'Wants', planned: wantsTarget, actual: Math.round(wantsTarget * 1.1), color: 'var(--violet)' },
    { category: 'Debt', planned: debts.totalMonthly, actual: debts.totalMonthly, color: 'var(--red)' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative">
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--lime)' }} />
      <div className="relative z-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} Plan</h1>
        <p className="text-sm md:text-base text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Your mission this month</p>
      </div>

      <div className="p-6 md:p-8 relative overflow-hidden z-10 bento-card border border-[var(--lime)]" style={{ background: 'var(--surface-tint)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}>
        {/* Centered Prominent Lime Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-[var(--lime)] opacity-40 mix-blend-screen blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="text-xs md:text-sm font-semibold tracking-wider mb-2 text-[var(--lime-text)] uppercase" style={{ fontFamily: 'var(--font-body)' }}>Mission</div>
          <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
            Save ₹{Math.round(savingsTarget / 1000)}K{debts.totalMonthly > 0 ? ` & pay ₹${Math.round(debts.totalMonthly / 1000)}K debt` : ''}
          </h2>
          <div className="flex items-center gap-6 md:gap-8">
            <div>
              <div className="text-xs md:text-sm font-medium mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Target Savings</div>
              <div className="text-xl md:text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>₹{savingsTarget.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-xs md:text-sm font-medium mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Debt Payments</div>
              <div className="text-xl md:text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>₹{debts.totalMonthly.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
        <div className="bento-card p-6 md:p-8 flex flex-col h-full">
          <h3 className="text-xl lg:text-2xl font-bold mb-4 slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Action Checklist</h3>
          <div className="space-y-2">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-[var(--surface-hover)]"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: task.done ? 'var(--lime)' : 'transparent',
                    border: task.done ? 'none' : '2px solid var(--border)',
                    color: task.done ? '#050F1C' : 'var(--secondary)',
                  }}
                >
                  {task.done ? <Check size={14} /> : <Circle size={14} />}
                </div>
                <span className={`text-left flex-1 text-[var(--card-foreground)] ${task.done ? 'line-through opacity-50' : ''}`} style={{ fontFamily: 'var(--font-body)' }}>{task.text}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 p-3 rounded-xl text-sm text-center" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)', background: 'var(--surface-tint)' }}>
            {tasks.filter(t => t.done).length} of {tasks.length} completed
          </div>
        </div>

        <div className="bento-card p-6 md:p-8 flex flex-col h-full">
          <h3 className="text-xl lg:text-2xl font-bold mb-4 slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Budget Tracker</h3>
          <div className="space-y-4">
            {budget.map((item) => {
              const overBudget = item.actual > item.planned;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[var(--card-foreground)]">{item.category}</span>
                    <span className="text-sm text-[var(--card-foreground)]">
                      ₹{item.actual.toLocaleString()} / ₹{item.planned.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--progress-inactive)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((item.actual / item.planned) * 100, 100)}%`,
                        backgroundColor: overBudget ? 'var(--red)' : item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
        <div className="bento-card p-6 flex flex-col justify-center items-center text-center">
          <div className="text-sm font-medium mb-2 text-[var(--secondary)]">Days Remaining</div>
          <div className="text-4xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
            {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()}
          </div>
        </div>
        <div className="bento-card p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--lime)] opacity-5 pointer-events-none" />
          <div className="text-sm font-medium mb-2 text-[var(--secondary)] relative z-10">Savings This Month</div>
          <div className="text-4xl font-bold slashed-zero text-[var(--lime-text)] relative z-10" style={{ fontFamily: 'var(--font-display)' }}>₹{Math.round(savingsTarget / 1000)}K</div>
        </div>
        <div className="bento-card p-6 flex flex-col justify-center items-center text-center">
          <div className="text-sm font-medium mb-2 text-[var(--secondary)]">On Track</div>
          <div className="text-4xl font-bold slashed-zero text-[var(--lime-text)]" style={{ fontFamily: 'var(--font-display)' }}>
            {tasks.length > 0 ? Math.round((tasks.filter(t => t.done).length / tasks.length) * 100) : 0}%
          </div>
        </div>
      </div>
    </div>
  );
}