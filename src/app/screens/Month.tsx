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

      <div className="p-6 md:p-8 relative overflow-hidden z-10 bento-card border border-[var(--lime)]" style={{ background: 'var(--surface-tint)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}>
        {/* Centered Prominent Lime Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[450px] md:h-[450px] bg-[var(--lime)] opacity-40 mix-blend-screen blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="text-xs md:text-sm font-semibold tracking-wider mb-2 text-[var(--lime-text)] uppercase" style={{ fontFamily: 'var(--font-body)' }}>Mission</div>
          <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
            Save ₹25,000 & reduce debt by ₹5,000
          </h2>
          <div className="flex items-center gap-6 md:gap-8">
            <div>
              <div className="text-xs md:text-sm font-medium mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Target Savings</div>
              <div className="text-xl md:text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>₹25,000</div>
            </div>
            <div>
              <div className="text-xs md:text-sm font-medium mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Debt Reduction</div>
              <div className="text-xl md:text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>₹5,000</div>
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
          <div className="text-4xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>10</div>
        </div>
        <div className="bento-card p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--lime)] opacity-5 pointer-events-none" />
          <div className="text-sm font-medium mb-2 text-[var(--secondary)] relative z-10">Savings This Month</div>
          <div className="text-4xl font-bold slashed-zero text-[var(--lime-text)] relative z-10" style={{ fontFamily: 'var(--font-display)' }}>₹18K</div>
        </div>
        <div className="bento-card p-6 flex flex-col justify-center items-center text-center">
          <div className="text-sm font-medium mb-2 text-[var(--secondary)]">On Track</div>
          <div className="text-4xl font-bold slashed-zero text-[var(--lime-text)]" style={{ fontFamily: 'var(--font-display)' }}>72%</div>
        </div>
      </div>
    </div>
  );
}