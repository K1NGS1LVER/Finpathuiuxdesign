import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DashboardProps {
  onPennyClick: () => void;
}

export default function Dashboard({ onPennyClick }: DashboardProps) {
  const [health, setHealth] = useState(0);

  useEffect(() => {
    setTimeout(() => setHealth(73), 200);
  }, []);

  const stats = [
    { label: 'Monthly Income', value: '₹85,000', change: '+12%', icon: TrendingUp, color: 'var(--lime)' },
    { label: 'Total Savings', value: '₹2,42,000', change: '+8%', icon: Wallet, color: 'var(--violet)' },
    { label: 'Active Goals', value: '4', change: '1 completed', icon: Target, color: 'var(--blue)' },
    { label: 'Debt Remaining', value: '₹45,000', change: '-15%', icon: TrendingDown, color: 'var(--red)' },
  ];

  const goals = [
    { name: 'Dream Bike', progress: 65, target: '₹1.2L', color: 'var(--lime)' },
    { name: 'Emergency Fund', progress: 40, target: '₹3L', color: 'var(--blue)' },
    { name: 'Goa Trip', progress: 85, target: '₹50K', color: 'var(--violet)' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 relative">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--lime)' }} />
      <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--violet)' }} />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Welcome back!</h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Here's your financial snapshot</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 relative z-10">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-5 rounded-2xl glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>{stat.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
              <div className="text-sm" style={{ color: stat.color, fontFamily: 'var(--font-body)' }}>{stat.change}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
        <div className="p-6 rounded-2xl glass-card">
          <h3 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Health Score</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90">
                <circle cx="96" cy="96" r="80" fill="none" stroke="var(--border)" strokeWidth="12" />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="var(--lime)"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 80}`}
                  strokeDashoffset={`${2 * Math.PI * 80 * (1 - health / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{health}</div>
                <div className="text-sm" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Good</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-card">
          <h3 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Active Goals</h3>
          <div className="space-y-4">
            {goals.map((goal, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium" style={{ fontFamily: 'var(--font-body)' }}>{goal.name}</span>
                  <span className="text-sm" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>{goal.progress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
                  />
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Target: {goal.target}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 relative z-10">
        <button className="p-5 rounded-xl text-left transition-transform hover:scale-105 glass-card">
          <div className="text-2xl mb-2">💰</div>
          <div className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Add Transaction</div>
          <div className="text-sm" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Track income or expense</div>
        </button>
        <button className="p-5 rounded-xl text-left transition-transform hover:scale-105 glass-card">
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>New Goal</div>
          <div className="text-sm" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Start saving for something</div>
        </button>
        <button onClick={onPennyClick} className="p-5 rounded-xl text-left transition-transform hover:scale-105" style={{ backgroundColor: 'var(--blue)', color: '#fff' }}>
          <div className="text-2xl mb-2">🤖</div>
          <div className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Ask Penny</div>
          <div className="text-sm opacity-90" style={{ fontFamily: 'var(--font-body)' }}>Get AI-powered advice</div>
        </button>
      </div>
    </div>
  );
}
