import { useState } from 'react';
import { TrendingUp, Home, GraduationCap, Baby } from 'lucide-react';

export default function Scenarios() {
  const [scenario, setScenario] = useState('salary');
  const [value, setValue] = useState(15);

  const scenarios = [
    { id: 'salary', label: 'Salary Increase', icon: TrendingUp, color: 'var(--lime)' },
    { id: 'property', label: 'Buy Property', icon: Home, color: 'var(--violet)' },
    { id: 'education', label: 'Higher Education', icon: GraduationCap, color: 'var(--blue)' },
    { id: 'family', label: 'Start Family', icon: Baby, color: 'var(--amber)' },
  ];

  const current = scenarios.find(s => s.id === scenario);

  const impacts = [
    { label: 'Monthly Savings', current: '₹20,000', future: '₹32,000', change: '+60%', positive: true },
    { label: 'Goal Timeline', current: '18 months', future: '11 months', change: '-39%', positive: true },
    { label: 'Emergency Buffer', current: '3 months', future: '5 months', change: '+67%', positive: true },
    { label: 'Tax Liability', current: '₹45,000', future: '₹58,000', change: '+29%', positive: false },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative">
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--violet)' }} />
      <div className="relative z-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Scenario Explorer</h1>
        <p className="text-sm md:text-base" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>See how life changes affect your financial path</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 relative z-10">
        {scenarios.map((s) => {
          const Icon = s.icon;
          const active = scenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`p-5 rounded-xl text-left transition-all hover:scale-105 ${!active ? 'glass-card' : ''}`}
              style={{
                backgroundColor: active ? s.color + '20' : undefined,
                border: `2px solid ${active ? s.color : 'var(--border)'}`,
                backdropFilter: active ? 'none' : undefined,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: s.color + '20', color: s.color }}
              >
                <Icon size={24} />
              </div>
              <div className="font-bold" style={{ fontFamily: 'var(--font-body)' }}>{s.label}</div>
            </button>
          );
        })}
      </div>

      <div className="p-4 md:p-8 rounded-2xl glass-card relative z-10">
        <h3 className="font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Adjust Parameters</h3>
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">
              {scenario === 'salary' && 'Salary Increase'}
              {scenario === 'property' && 'Property Value'}
              {scenario === 'education' && 'Course Fee'}
              {scenario === 'family' && 'Monthly Child Expenses'}
            </span>
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: current?.color }}>
              {scenario === 'salary' && `+${value}%`}
              {scenario === 'property' && `₹${value * 10}L`}
              {scenario === 'education' && `₹${value * 2}L`}
              {scenario === 'family' && `₹${value * 1000}`}
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none"
            style={{
              background: `linear-gradient(to right, ${current?.color} 0%, ${current?.color} ${(value - 5) / 45 * 100}%, var(--border) ${(value - 5) / 45 * 100}%, var(--border) 100%)`,
            }}
          />
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Impact Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {impacts.map((impact, i) => (
            <div key={i} className="p-6 rounded-xl glass-card">
              <div className="text-sm mb-4 font-medium" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>{impact.label}</div>
              <div className="flex items-end justify-between mb-4 gap-4">
                <div className="flex-1">
                  <div className="text-xs mb-1" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>Current</div>
                  <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{impact.current}</div>
                </div>
                <div className="text-3xl opacity-20 px-2">→</div>
                <div className="text-right flex-1">
                  <div className="text-xs mb-1" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>After</div>
                  <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: current?.color }}>{impact.future}</div>
                </div>
              </div>
              <div
                className="text-sm font-bold text-center py-2 rounded-lg"
                style={{
                  backgroundColor: impact.positive ? 'var(--lime)' : 'var(--red)',
                  color: impact.positive ? '#050F1C' : '#fff',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {impact.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-xl flex items-start gap-4 relative z-10" style={{ backgroundColor: 'var(--violet)', color: '#fff' }}>
        <div className="text-3xl">💡</div>
        <div>
          <div className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Penny's Insight</div>
          <div className="opacity-90" style={{ fontFamily: 'var(--font-body)' }}>
            {scenario === 'salary' && 'A 15% raise lets you hit your bike goal 7 months earlier! Consider increasing your SIP allocation.'}
            {scenario === 'property' && 'With this property investment, prioritize building a 6-month emergency fund first.'}
            {scenario === 'education' && 'Education loan rates are lower than expected returns from your current investments. Consider partial loan.'}
            {scenario === 'family' && 'Start a separate child education fund now. Even ₹5K/month grows to ₹18L in 15 years.'}
          </div>
        </div>
      </div>
    </div>
  );
}
