import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [debt, setDebt] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const steps = [
    {
      title: 'What\'s your monthly income?',
      subtitle: 'Include salary and all other sources',
      field: income,
      setter: setIncome,
      prefix: '₹',
    },
    {
      title: 'Average monthly expenses?',
      subtitle: 'Rent, food, transport, and bills',
      field: expenses,
      setter: setExpenses,
      prefix: '₹',
    },
    {
      title: 'Any existing debt?',
      subtitle: 'Loans, credit cards, EMIs',
      field: debt,
      setter: setDebt,
      prefix: '₹',
    },
    {
      title: 'What are your top goals?',
      subtitle: 'Select up to 3 priorities',
      field: '',
      setter: () => {},
      prefix: '',
    },
  ];

  const current = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      navigate('/loading');
    }
  };

  const toggleGoal = (goalName: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalName)
        ? prev.filter(g => g !== goalName)
        : prev.length < 3 ? [...prev, goalName] : prev
    );
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-8 relative" style={{ backgroundColor: 'var(--background)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'var(--lime)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'var(--blue)' }} />
      </div>
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all"
              style={{ backgroundColor: i <= step ? 'var(--lime)' : 'var(--border)' }}
            />
          ))}
        </div>

        <div className="space-y-4 text-center">
          <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{current.title}</h2>
          <p style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>{current.subtitle}</p>
        </div>

        {step < 3 ? (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--secondary)' }}>
              {current.prefix}
            </span>
            <input
              type="text"
              value={current.field}
              onChange={(e) => current.setter(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-16 py-6 text-4xl font-bold text-center rounded-2xl outline-none glass-card"
              style={{ fontFamily: 'var(--font-display)' }}
              placeholder="0"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Bike', icon: '🏍️' },
                { name: 'House', icon: '🏡' },
                { name: 'Travel', icon: '✈️' },
                { name: 'Emergency Fund', icon: '🛡️' },
                { name: 'Wedding', icon: '💍' },
                { name: 'Investment', icon: '📈' }
              ].map((goal) => {
                const isSelected = selectedGoals.includes(goal.name);
                return (
                  <button
                    key={goal.name}
                    onClick={() => toggleGoal(goal.name)}
                    className={`goal-option p-4 rounded-xl font-medium transition-all hover:scale-105 glass-card flex flex-col items-center gap-2 ${isSelected ? 'selected' : ''}`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <span>{goal.name}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => toggleGoal('Custom')}
              className={`goal-option w-full p-4 rounded-xl font-medium transition-all hover:scale-105 glass-card flex items-center justify-center gap-3 ${selectedGoals.includes('Custom') ? 'selected' : ''}`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <span className="text-2xl">💰</span>
              <span>Custom</span>
            </button>
            <style>{`
              .goal-option {
                transition: all 0.3s ease;
              }
              .goal-option:hover {
                box-shadow: 0 0 30px rgba(176, 255, 9, 0.5), 0 8px 32px rgba(0, 0, 0, 0.2);
                border-color: var(--lime);
              }
              .goal-option.selected {
                box-shadow: 0 0 30px rgba(176, 255, 9, 0.6), 0 8px 32px rgba(0, 0, 0, 0.2);
                border-color: var(--lime);
                background-color: rgba(176, 255, 9, 0.1);
              }
            `}</style>
          </div>
        )}

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 glass-card"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <ArrowLeft size={18} />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105"
            style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-body)' }}
          >
            {step < steps.length - 1 ? 'Continue' : 'Finish'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
