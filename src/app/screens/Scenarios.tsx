import { useState } from 'react';
import { TrendingUp, Home, GraduationCap, Baby } from 'lucide-react';

export default function Scenarios() {
  const [scenario, setScenario] = useState('salary');
  
  // Independent values for each scenario allowing accurate ranges and negative values
  const [values, setValues] = useState({
    salary: 15,
    property: 150,
    education: 30,
    family: 15000
  });

  const scenarios = [
    { id: 'salary', label: 'Salary Change', icon: TrendingUp, color: 'var(--lime)' },
    { id: 'property', label: 'Buy Property', icon: Home, color: 'var(--violet)' },
    { id: 'education', label: 'Higher Education', icon: GraduationCap, color: 'var(--blue)' },
    { id: 'family', label: 'Start Family', icon: Baby, color: 'var(--amber)' },
  ];

  const current = scenarios.find(s => s.id === scenario);
  const currentVal = values[scenario as keyof typeof values];

  const getSliderConfig = () => {
    switch(scenario) {
      case 'salary': return { min: -50, max: 100, step: 1 }; // Allow negative salary (pay cut)
      case 'property': return { min: 0, max: 500, step: 5 }; // Lakhs
      case 'education': return { min: 0, max: 100, step: 1 }; // Lakhs
      case 'family': return { min: 0, max: 100000, step: 1000 }; // Rupees
      default: return { min: 0, max: 100, step: 1 };
    }
  };

  const { min, max, step } = getSliderConfig();
  const progressPercent = ((currentVal - min) / (max - min)) * 100;

  const impacts = [
    { label: 'Monthly Savings', current: '₹20,000', future: scenario === 'salary' && currentVal < 0 ? '₹12,000' : '₹32,000', change: scenario === 'salary' && currentVal < 0 ? '-40%' : '+60%', positive: !(scenario === 'salary' && currentVal < 0) },
    { label: 'Goal Timeline', current: '18 months', future: scenario === 'salary' && currentVal < 0 ? '26 months' : '11 months', change: scenario === 'salary' && currentVal < 0 ? '+44%' : '-39%', positive: !(scenario === 'salary' && currentVal < 0) },
    { label: 'Emergency Buffer', current: '3 months', future: scenario === 'salary' && currentVal < 0 ? '2 months' : '5 months', change: scenario === 'salary' && currentVal < 0 ? '-33%' : '+67%', positive: !(scenario === 'salary' && currentVal < 0) },
    { label: 'Tax Liability', current: '₹45,000', future: scenario === 'salary' && currentVal < 0 ? '₹32,000' : '₹58,000', change: scenario === 'salary' && currentVal < 0 ? '-28%' : '+29%', positive: scenario === 'salary' && currentVal < 0 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 relative">
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-5 blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--violet)' }} />
      <div className="relative z-10">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Scenario Explorer</h1>
        <p className="text-sm md:text-base text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>See how life changes affect your financial path</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {scenarios.map((s) => {
          const Icon = s.icon;
          const active = scenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`p-3 md:p-5 rounded-xl text-left transition-all hover:scale-105 ${!active ? 'bento-card' : ''}`}
              style={{
                backgroundColor: active ? s.color + '20' : undefined,
                border: `2px solid ${active ? s.color : 'var(--border)'}`,
                backdropFilter: active ? 'none' : undefined,
                color: active ? 'var(--foreground)' : 'var(--card-foreground)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: s.color + '20', color: s.color }}
              >
                <Icon size={24} />
              </div>
              <div className="font-bold text-xs md:text-base" style={{ fontFamily: 'var(--font-body)' }}>{s.label}</div>
            </button>
          );
        })}
      </div>

      <div className="bento-card p-4 md:p-8 relative z-10">
        <h3 className="font-bold mb-6 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Adjust Parameters</h3>
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-[var(--card-foreground)]">
              {scenario === 'salary' && 'Salary Change'}
              {scenario === 'property' && 'Property Value'}
              {scenario === 'education' && 'Course Fee'}
              {scenario === 'family' && 'Monthly Child Expenses'}
            </span>
            <span className="text-2xl font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: current?.color }}>
              {scenario === 'salary' && `${currentVal >= 0 ? '+' : ''}${currentVal}%`}
              {scenario === 'property' && `₹${currentVal}L`}
              {scenario === 'education' && `₹${currentVal}L`}
              {scenario === 'family' && `₹${currentVal.toLocaleString()}`}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentVal}
            onChange={(e) => setValues(prev => ({ ...prev, [scenario]: Number(e.target.value) }))}
            className="w-full h-2 rounded-full appearance-none bg-[var(--progress-inactive)]"
            style={{
              background: `linear-gradient(to right, ${current?.color} 0%, ${current?.color} ${progressPercent}%, var(--progress-inactive) ${progressPercent}%, var(--progress-inactive) 100%)`,
            }}
          />
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="font-bold mb-4 text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Impact Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {impacts.map((impact, i) => (
            <div key={i} className="p-6 bento-card">
              <div className="text-sm mb-4 font-medium text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>{impact.label}</div>
              <div className="flex items-end justify-between mb-4 gap-4">
                <div className="flex-1">
                  <div className="text-xs mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Current</div>
                  <div className="text-xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{impact.current}</div>
                </div>
                <div className="text-3xl opacity-20 px-2 text-[var(--card-foreground)]">→</div>
                <div className="text-right flex-1">
                  <div className="text-xs mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>After</div>
                  <div className="text-xl font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: current?.color }}>{impact.future}</div>
                </div>
              </div>
              <div
                className="text-sm font-bold text-center py-2 rounded-lg slashed-zero"
                style={{
                  backgroundColor: impact.positive ? 'var(--lime)' : 'var(--red)',
                  color: '#050F1C',
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
            {scenario === 'salary' && currentVal < 0 && `A ${Math.abs(currentVal)}% pay cut means you will need to extend your goal timelines. I'll help you optimize your essentials!`}
            {scenario === 'salary' && currentVal >= 0 && `A ${currentVal}% raise lets you hit your bike goal 7 months earlier! Consider increasing your SIP allocation.`}
            {scenario === 'property' && 'With this property investment, prioritize building a 6-month emergency fund first.'}
            {scenario === 'education' && 'Education loan rates are lower than expected returns from your current investments. Consider partial loan.'}
            {scenario === 'family' && 'Start a separate child education fund now. Even ₹5K/month grows to ₹18L in 15 years.'}
          </div>
        </div>
      </div>
    </div>
  );
}
