import { TrendingUp, Wallet, Target, Zap, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DashboardProps {
  onPennyClick: () => void;
}

export default function Dashboard({ onPennyClick }: DashboardProps) {
  const [health, setHealth] = useState(0);

  useEffect(() => {
    // Only animate once on mount
    const timer = setTimeout(() => setHealth(73), 300);
    return () => clearTimeout(timer);
  }, []);

  const primaryMetrics = [
    { label: 'Bank Balance', value: '87,121', sublabel: 'Current month', change: '+12%', positive: true },
    { label: 'Invoices', value: '7,540', sublabel: 'Unpaid this week', change: '+8%', positive: true },
  ];

  const secondaryMetrics = [
    { label: 'Monthly Income', value: '85,000', change: '+12%', icon: TrendingUp },
    { label: 'Total Savings', value: '2,42,000', change: '+8%', icon: Wallet },
    { label: 'Active Goals', value: '4', change: '1 done', icon: Target },
    { label: 'This Month', value: '45,000', change: '-15%', icon: Calendar },
  ];

  const goals = [
    { name: 'Dream Bike', current: 78000, target: 120000, progress: 65 },
    { name: 'Emergency Fund', current: 120000, target: 300000, progress: 40 },
    { name: 'Goa Trip', current: 42500, target: 50000, progress: 85 },
  ];

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (health / 100) * circumference;

  return (
    <div className="max-w-[1400px] mx-auto relative text-[var(--foreground)]">
      <style>{`
        @keyframes dash {
          from { stroke-dashoffset: ${circumference}; }
          to { stroke-dashoffset: ${offset}; }
        }
      `}</style>

      {/* Ambient Blobs - Static instead of animating infinitely */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="data-blob w-[500px] h-[500px] top-20 right-1/4 rounded-full bg-[var(--violet)] opacity-10 mix-blend-screen" />
        <div className="data-blob w-[400px] h-[400px] bottom-40 left-1/4 rounded-full bg-[var(--lime)] opacity-10 mix-blend-screen" />
        <div className="data-blob w-[300px] h-[300px] top-1/2 right-1/3 rounded-full bg-[var(--blue)] opacity-10 mix-blend-screen" />
      </div>

      {/* Header - Minimal */}
      <div className="mb-6 md:mb-8 relative z-10">
        <h1 className="text-display slashed-zero text-[var(--foreground)]">
          Dashboard
        </h1>
      </div>

      {/* Bento Grid - Asymmetric Layout */}
      <div className="grid grid-cols-12 gap-4 md:gap-4 relative z-10">
        {/* Hero Cards */}
        {primaryMetrics.map((metric, i) => (
          <div key={i} className="col-span-12 md:col-span-6 lg:col-span-6 bento-card flex flex-col justify-between min-h-[160px]">
            {/* Small Label */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-label text-[var(--secondary)]">{metric.label}</span>
              <span className="pill-button text-xs font-semibold" style={{ background: metric.positive ? 'var(--lime)' : 'var(--red)', color: '#050F1C' }}>
                {metric.change}
              </span>
            </div>

            {/* Giant Number */}
            <div className="mt-auto">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-medium text-[var(--secondary)]">₹</span>
                <h2 className="text-display slashed-zero text-[var(--card-foreground)]">
                  {metric.value}
                </h2>
              </div>
              <p className="text-sm text-[var(--tertiary)]">
                {metric.sublabel}
              </p>
            </div>

            {/* Background Blob inside card */}
            <div
              className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full pointer-events-none opacity-20 blur-2xl"
              style={{ backgroundColor: metric.positive ? 'var(--lime)' : 'var(--violet)' }}
            />
          </div>
        ))}

        {/* Secondary Metrics Grid (8 columns) */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {secondaryMetrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div key={i} className="bento-card bento-card-sm flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-label text-[var(--secondary)] leading-tight">{metric.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--card-foreground)] flex-shrink-0" style={{ background: 'var(--surface-hover)' }}>
                    <Icon size={14} className="icon-wireframe" />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-1 mb-1">
                    {metric.label !== 'Active Goals' && (
                      <span className="text-xs text-[var(--secondary)]">₹</span>
                    )}
                    <h3 className="text-xl lg:text-2xl font-bold slashed-zero text-[var(--card-foreground)] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                      {metric.value}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {metric.change.startsWith('+') ? (
                      <ArrowUpRight size={12} style={{ color: 'var(--lime-text)' }} />
                    ) : metric.change.startsWith('-') ? (
                      <ArrowDownRight size={12} style={{ color: 'var(--red-text)' }} />
                    ) : null}
                    <span className="text-xs font-semibold slashed-zero text-[var(--card-foreground)]">
                      {metric.change}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Health Score Ring (4 columns) */}
        <div className="col-span-12 lg:col-span-4 bento-card flex flex-col items-center justify-center min-h-[220px]">
          <span className="text-label text-[var(--secondary)] mb-4">Financial Health</span>
          
          <div className="relative w-32 h-32 mb-2">
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--border)"
                strokeWidth="12"
                strokeDasharray="6 6"
              />
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
                  animation: 'dash 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  filter: 'drop-shadow(0 0 4px rgba(176, 255, 9, 0.3))',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                {health}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--tertiary)] font-semibold mt-1">Score</div>
            </div>
          </div>
          <p className="text-xs text-[var(--secondary)] text-center font-medium mt-2">
            Great progress this month
          </p>
        </div>

        {/* Goals Progress (Full Width) */}
        <div className="col-span-12 bento-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading slashed-zero text-[var(--card-foreground)]">
              Active Goals
            </h3>
            <button className="pill-button text-xs font-semibold px-4 py-2">View All</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {goals.map((goal, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{ backgroundColor: i === 0 ? 'var(--lime)' : i === 1 ? 'var(--violet)' : 'var(--blue)' }}
                    />
                    <span className="text-sm font-semibold text-[var(--card-foreground)]">
                      {goal.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold slashed-zero text-[var(--card-foreground)]">
                    {goal.progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-4 rounded-full overflow-hidden relative" style={{ background: 'var(--progress-inactive)' }}>
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${goal.progress}%`,
                      backgroundColor: i === 0 ? 'var(--lime)' : i === 1 ? 'var(--violet)' : 'var(--blue)',
                    }}
                  />
                  <div className="absolute inset-0 hatching-pattern mix-blend-overlay" />
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-medium text-[var(--secondary)] slashed-zero">
                    ₹{(goal.current / 1000).toFixed(0)}K
                  </span>
                  <span className="text-xs font-medium text-[var(--tertiary)] slashed-zero">
                    / ₹{(goal.target / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-12 md:col-span-6 bento-card">
          <h3 className="text-heading mb-4 slashed-zero text-[var(--card-foreground)]">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="pill-button py-4 text-sm font-semibold">
              + Add Goal
            </button>
            <button className="pill-button py-4 text-sm font-semibold">
              Track Expense
            </button>
            <button
              onClick={onPennyClick}
              className="pill-button py-4 text-sm font-semibold active shadow-lg"
            >
              <Zap size={14} className="inline mr-2" />
              Ask Penny
            </button>
            <button className="pill-button py-4 text-sm font-semibold">
              View Reports
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 md:col-span-6 bento-card">
          <h3 className="text-heading mb-4 slashed-zero text-[var(--card-foreground)]">
            Recent Activity
          </h3>
          <div className="space-y-1">
            {[
              { label: 'Goa Trip savings', amount: '+5,000', time: '2h ago', positive: true },
              { label: 'Netflix subscription', amount: '-799', time: '1d ago', positive: false },
              { label: 'Bike EMI paid', amount: '-8,500', time: '3d ago', positive: false },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg transition-colors cursor-default hover:bg-[var(--surface-hover)]">
                <div>
                  <p className="text-sm font-semibold text-[var(--card-foreground)]">
                    {activity.label}
                  </p>
                  <p className="text-xs text-[var(--tertiary)] font-medium mt-1">
                    {activity.time}
                  </p>
                </div>
                <span className="text-lg font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {activity.positive ? '+' : ''}₹{activity.amount.replace('+', '').replace('-', '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}