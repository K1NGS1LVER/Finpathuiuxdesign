import { Check, Circle } from 'lucide-react';
import { useState } from 'react';

export default function Month() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Pay rent by 5th', done: true },
    { id: 2, text: 'Add ₹10K to bike savings', done: true },
    { id: 3, text: 'Review subscription services', done: false },
    { id: 4, text: 'Set aside ₹5K for emergency fund', done: false },
    { id: 5, text: 'Track all expenses this week', done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const budget = [
    { category: 'Essentials', planned: 45000, actual: 42000, color: 'var(--blue)' },
    { category: 'Savings', planned: 20000, actual: 20000, color: 'var(--lime)' },
    { category: 'Wants', planned: 15000, actual: 18000, color: 'var(--violet)' },
    { category: 'Debt', planned: 5000, actual: 5000, color: 'var(--red)' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative">
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--lime)' }} />
      <div className="relative z-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>April 2026 Plan</h1>
        <p className="text-sm md:text-base text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Your mission this month</p>
      </div>

      <div className="p-4 md:p-8 rounded-[var(--radius-xl)] relative overflow-hidden z-10 bento-card" style={{ backgroundColor: 'var(--lime)', color: '#050F1C', borderColor: 'transparent' }}>
        <div className="relative z-10">
          <div className="text-xs md:text-sm font-medium mb-2 opacity-80" style={{ fontFamily: 'var(--font-body)' }}>MISSION</div>
          <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: '#050F1C' }}>
            Save ₹25,000 & reduce debt by ₹5,000
          </h2>
          <div className="flex items-center gap-4 md:gap-6">
            <div>
              <div className="text-xs md:text-sm opacity-80 mb-1" style={{ fontFamily: 'var(--font-body)' }}>Target Savings</div>
              <div className="text-xl md:text-2xl font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)' }}>₹25,000</div>
            </div>
            <div>
              <div className="text-xs md:text-sm opacity-80 mb-1" style={{ fontFamily: 'var(--font-body)' }}>Debt Reduction</div>
              <div className="text-xl md:text-2xl font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)' }}>₹5,000</div>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-64 opacity-10" style={{ background: 'radial-gradient(circle, #000 0%, transparent 70%)' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
        <div className="bento-card">
          <h3 className="text-title mb-4 slashed-zero text-[var(--card-foreground)]">Action Checklist</h3>
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

        <div className="bento-card">
          <h3 className="text-title mb-4 slashed-zero text-[var(--card-foreground)]">Budget Tracker</h3>
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
        <div className="bento-card flex flex-col justify-center">
          <div className="text-sm font-medium mb-2 text-[var(--secondary)]">Days Remaining</div>
          <div className="text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>10</div>
        </div>
        <div className="bento-card flex flex-col justify-center">
          <div className="text-sm font-medium mb-2 text-[var(--secondary)]">Savings This Month</div>
          <div className="text-3xl font-bold slashed-zero text-[var(--lime-text)]" style={{ fontFamily: 'var(--font-display)' }}>₹18K</div>
        </div>
        <div className="bento-card flex flex-col justify-center">
          <div className="text-sm font-medium mb-2 text-[var(--secondary)]">On Track</div>
          <div className="text-3xl font-bold slashed-zero text-[var(--lime-text)]" style={{ fontFamily: 'var(--font-display)' }}>72%</div>
        </div>
      </div>
    </div>
  );
}