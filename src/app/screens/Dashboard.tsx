import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
    { label: 'Monthly Income', value: '85,000', change: '+12%', icon: TrendingUp, color: 'var(--lime)', positive: true },
    { label: 'Total Savings', value: '2,42,000', change: '+8%', icon: Wallet, color: 'var(--violet)', positive: true },
    { label: 'Active Goals', value: '4', change: '1 completed', icon: Target, color: 'var(--blue)', positive: true },
    { label: 'Debt Remaining', value: '45,000', change: '-15%', icon: TrendingDown, color: 'var(--red)', positive: false },
  ];

  const goals = [
    { name: 'Dream Bike', progress: 65, target: '1.2L', color: 'var(--lime)' },
    { name: 'Emergency Fund', progress: 40, target: '3L', color: 'var(--blue)' },
    { name: 'Goa Trip', progress: 85, target: '50K', color: 'var(--violet)' },
  ];

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (health / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto relative">
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: ${offset};
          }
        }
        @keyframes pulse-blob {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>

      {/* Decorative Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="data-blob absolute -top-40 -right-40 w-96 h-96 rounded-full" style={{ backgroundColor: 'var(--lime)' }} />
        <div className="data-blob absolute top-1/2 -left-40 w-96 h-96 rounded-full" style={{ backgroundColor: 'var(--violet)' }} />
        <div className="data-blob absolute -bottom-40 right-1/3 w-80 h-80 rounded-full" style={{ backgroundColor: 'var(--blue)' }} />
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8 relative z-10">
        <h1 className="text-3xl md:text-5xl font-bold mb-2 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
          Welcome back!
        </h1>
        <p className="text-base md:text-lg" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
          Here's your financial snapshot
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-10">
        {/* Stats Cards (spans 2 columns on large screens) */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bento-card p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-medium mb-1" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                      {stat.label}
                    </p>
                    <h3 className="text-3xl md:text-4xl font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                      ₹{stat.value}
                    </h3>
                  </div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: stat.color + '15',
                      color: stat.color,
                    }}
                  >
                    <Icon size={20} className="icon-wireframe" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {stat.positive ? (
                    <ArrowUpRight size={16} style={{ color: 'var(--lime)' }} />
                  ) : (
                    <ArrowDownRight size={16} style={{ color: 'var(--red)' }} />
                  )}
                  <span className="text-sm font-medium slashed-zero" style={{ color: stat.positive ? 'var(--lime)' : 'var(--red)', fontFamily: 'var(--font-body)' }}>
                    {stat.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Health Score Ring (spans 1 column) */}
        <div className="bento-card p-6 md:p-8 flex flex-col items-center justify-center">
          <p className="text-sm font-medium mb-4" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
            Financial Health
          </p>
          <div className="relative w-40 h-40 mb-4">
            {/* Background Ring with Dashes */}
            <svg className="transform -rotate-90" width="160" height="160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="rgba(5, 15, 28, 0.08)"
                strokeWidth="12"
                strokeDasharray="8 4"
              />
              {/* Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--lime)"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
                strokeLinecap="round"
                style={{
                  animation: 'dash 1s ease-out forwards',
                  filter: 'drop-shadow(0 0 8px var(--lime))',
                }}
              />
            </svg>
            {/* Center Blob */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full data-blob"
              style={{
                backgroundColor: 'var(--lime)',
                animation: 'pulse-blob 3s ease-in-out infinite',
              }}
            />
            {/* Score Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-4xl font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                {health}
              </div>
              <div className="text-xs" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                Score
              </div>
            </div>
          </div>
          <div className="text-xs text-center" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
            You're doing great! Keep it up.
          </div>
        </div>

        {/* Goals Progress (spans full width on small, 2 cols on md, 3 on lg) */}
        <div className="lg:col-span-4">
          <div className="bento-card p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold mb-6 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              Active Goals
            </h3>
            <div className="space-y-6">
              {goals.map((goal, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: goal.color,
                          boxShadow: `0 0 12px ${goal.color}`,
                        }}
                      />
                      <span className="font-medium text-sm md:text-base slashed-zero" style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground)' }}>
                        {goal.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                        {goal.progress}%
                      </span>
                      <span className="text-xs slashed-zero" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                        / ₹{goal.target}
                      </span>
                    </div>
                  </div>
                  {/* Pill Progress Bar */}
                  <div
                    className="relative h-8 rounded-full overflow-hidden"
                    style={{
                      backgroundColor: 'rgba(5, 15, 28, 0.04)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {/* Blurred Gradient Fill */}
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${goal.progress}%`,
                        background: `linear-gradient(90deg, ${goal.color}40 0%, ${goal.color}80 100%)`,
                        filter: 'blur(8px)',
                      }}
                    />
                    {/* Solid overlay */}
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${goal.progress}%`,
                        backgroundColor: goal.color + '60',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bento-card p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold mb-6 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="pill-button py-4 text-sm hover:bg-opacity-80 transition-all">
              Add Goal
            </button>
            <button className="pill-button py-4 text-sm hover:bg-opacity-80 transition-all">
              Track Expense
            </button>
            <button
              onClick={onPennyClick}
              className="pill-button py-4 text-sm transition-all"
              style={{
                background: 'var(--lime)',
                color: '#050F1C',
              }}
            >
              Ask Penny
            </button>
            <button className="pill-button py-4 text-sm hover:bg-opacity-80 transition-all">
              View Reports
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bento-card p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold mb-6 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Goa Trip savings', amount: '+5,000', time: '2h ago', positive: true },
              { label: 'Netflix subscription', amount: '-799', time: '1d ago', positive: false },
              { label: 'Bike EMI paid', amount: '-8,500', time: '3d ago', positive: false },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-opacity-50" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-sm font-medium slashed-zero" style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground)' }}>
                    {activity.label}
                  </p>
                  <p className="text-xs slashed-zero" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                    {activity.time}
                  </p>
                </div>
                <span
                  className="text-lg font-bold slashed-zero"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: activity.positive ? 'var(--lime)' : 'var(--foreground)',
                  }}
                >
                  ₹{activity.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
