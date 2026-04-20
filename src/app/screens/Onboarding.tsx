import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, ArrowLeft, Sun, Moon, Target, TrendingUp, Shield, Sparkles, Calendar, Lightbulb } from 'lucide-react';

interface OnboardingProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export default function Onboarding({ isDark, setIsDark }: OnboardingProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState('');
  const [incomeCurrency, setIncomeCurrency] = useState('INR');
  const [expensesCurrency, setExpensesCurrency] = useState('INR');
  const [debtCurrency, setDebtCurrency] = useState('INR');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  const [expenseBreakdown, setExpenseBreakdown] = useState({
    rent: '',
    food: '',
    transport: '',
    utilities: '',
    entertainment: '',
    other: '',
  });

  const [debtBreakdown, setDebtBreakdown] = useState({
    homeLoan: '',
    carLoan: '',
    personalLoan: '',
    creditCard: '',
    educationLoan: '',
    otherEMI: '',
  });

  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [showDebtBreakdown, setShowDebtBreakdown] = useState(false);

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/INR')
      .then(res => res.json())
      .then(data => setExchangeRates(data.rates))
      .catch(err => console.error('Failed to fetch exchange rates:', err));
  }, []);

  const convertToINR = (amount: string, currency: string) => {
    if (!amount || !exchangeRates[currency]) return '';
    const value = parseFloat(amount);
    if (currency === 'INR') return value.toFixed(2);
    const inrRate = 1 / exchangeRates[currency];
    return (value * inrRate).toFixed(2);
  };

  const calculateTotal = (breakdown: Record<string, string>) => {
    return Object.values(breakdown).reduce((sum, val) => {
      const num = parseFloat(val) || 0;
      return sum + num;
    }, 0).toString();
  };

  const totalExpenses = calculateTotal(expenseBreakdown);
  const totalDebt = calculateTotal(debtBreakdown);

  const steps = [
    {
      title: 'What\'s your monthly income?',
      subtitle: 'Include salary and all other sources',
      type: 'single',
    },
    {
      title: 'Monthly expenses & debt?',
      subtitle: 'Expenses, rent, bills, loans, and EMIs',
      type: 'combined',
    },
    {
      title: 'What are your top goals?',
      subtitle: 'Select up to 3 priorities',
      type: 'goals',
    },
  ];

  const current = steps[step];

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'];

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
    <div className="h-full w-full flex items-center justify-center p-4 md:p-8 relative overflow-y-auto" style={{ backgroundColor: 'var(--background)' }}>
      <style>{`
        @keyframes rotate360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: var(--secondary);
          opacity: 0.5;
        }
        select option {
          background-color: var(--background);
          color: var(--foreground);
        }
      `}</style>
      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500 hover:scale-110 hover:rotate-12 active:scale-95 glass-card z-20"
      >
        {isDark ? <Sun size={18} style={{ animation: 'rotate360 0.6s ease-out' }} /> : <Moon size={18} style={{ animation: 'rotate360 0.6s ease-out' }} />}
      </button>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'var(--lime)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'var(--blue)' }} />
      </div>
      <div className="max-w-md w-full space-y-6 md:space-y-8 relative z-10 py-8">
        <div className="flex gap-2 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-2 flex-1 rounded-full transition-all duration-500"
              style={{
                backgroundColor: i <= step ? 'var(--lime)' : 'rgba(148, 163, 184, 0.3)',
                boxShadow: i <= step ? '0 0 15px var(--lime)' : 'none',
              }}
            />
          ))}
        </div>

        <div className="space-y-3 md:space-y-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold px-2" style={{ fontFamily: 'var(--font-display)' }}>{current.title}</h2>
          <p style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>{current.subtitle}</p>
        </div>

        {current.type === 'single' ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={income}
                  onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-6 text-4xl font-bold text-center rounded-2xl outline-none glass-card"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--foreground)',
                  }}
                  placeholder="0"
                />
              </div>
              <select
                value={incomeCurrency}
                onChange={(e) => setIncomeCurrency(e.target.value)}
                className="px-4 py-3 rounded-2xl font-bold outline-none glass-card cursor-pointer"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--foreground)',
                  backgroundColor: 'var(--card)',
                }}
              >
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
            {income && incomeCurrency !== 'INR' && (
              <p className="text-center text-sm" style={{ color: 'var(--secondary)' }}>
                ≈ ₹{convertToINR(income, incomeCurrency)} INR
              </p>
            )}
          </div>
        ) : current.type === 'combined' ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: 'var(--secondary)' }}>Monthly Expenses</label>
                <select
                  value={expensesCurrency}
                  onChange={(e) => setExpensesCurrency(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs font-bold outline-none glass-card cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--card)',
                  }}
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
              <div
                className="flex gap-2 items-center px-4 py-5 rounded-2xl glass-card cursor-pointer hover:scale-[1.01] transition-all"
                onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}
              >
                <div className="flex-1 text-3xl font-bold text-center" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                  {totalExpenses || '0'}
                </div>
                <button className="text-xs font-medium px-3 py-2 rounded-lg glass-card" style={{ color: 'var(--lime)' }}>
                  {showExpenseBreakdown ? 'Hide' : 'Breakdown'}
                </button>
              </div>
              {totalExpenses && expensesCurrency !== 'INR' && (
                <p className="text-center text-sm" style={{ color: 'var(--secondary)' }}>
                  ≈ ₹{convertToINR(totalExpenses, expensesCurrency)} INR
                </p>
              )}

              {showExpenseBreakdown && (
                <div className="space-y-2 p-4 rounded-xl glass-card">
                  {[
                    { key: 'rent', label: '🏠 Rent', placeholder: 'Monthly rent' },
                    { key: 'food', label: '🍽️ Food & Groceries', placeholder: 'Food expenses' },
                    { key: 'transport', label: '🚗 Transport', placeholder: 'Commute, fuel' },
                    { key: 'utilities', label: '💡 Utilities', placeholder: 'Bills, internet' },
                    { key: 'entertainment', label: '🎬 Entertainment', placeholder: 'Movies, hobbies' },
                    { key: 'other', label: '📦 Other', placeholder: 'Miscellaneous' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium" style={{ color: 'var(--secondary)' }}>{label}</label>
                      <input
                        type="text"
                        value={expenseBreakdown[key as keyof typeof expenseBreakdown]}
                        onChange={(e) => setExpenseBreakdown({ ...expenseBreakdown, [key]: e.target.value.replace(/[^0-9]/g, '') })}
                        className="w-full px-3 py-2 text-lg font-bold rounded-lg outline-none glass-card"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: 'var(--secondary)' }}>Total Debt/EMIs</label>
                <select
                  value={debtCurrency}
                  onChange={(e) => setDebtCurrency(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs font-bold outline-none glass-card cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--card)',
                  }}
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
              <div
                className="flex gap-2 items-center px-4 py-5 rounded-2xl glass-card cursor-pointer hover:scale-[1.01] transition-all"
                onClick={() => setShowDebtBreakdown(!showDebtBreakdown)}
              >
                <div className="flex-1 text-3xl font-bold text-center" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                  {totalDebt || '0'}
                </div>
                <button className="text-xs font-medium px-3 py-2 rounded-lg glass-card" style={{ color: 'var(--lime)' }}>
                  {showDebtBreakdown ? 'Hide' : 'Breakdown'}
                </button>
              </div>
              {totalDebt && debtCurrency !== 'INR' && (
                <p className="text-center text-sm" style={{ color: 'var(--secondary)' }}>
                  ≈ ₹{convertToINR(totalDebt, debtCurrency)} INR
                </p>
              )}

              {showDebtBreakdown && (
                <div className="space-y-2 p-4 rounded-xl glass-card">
                  {[
                    { key: 'homeLoan', label: '🏡 Home Loan EMI', placeholder: 'Monthly EMI' },
                    { key: 'carLoan', label: '🚙 Car Loan EMI', placeholder: 'Monthly EMI' },
                    { key: 'personalLoan', label: '💳 Personal Loan', placeholder: 'Monthly EMI' },
                    { key: 'creditCard', label: '💰 Credit Card', placeholder: 'Monthly payment' },
                    { key: 'educationLoan', label: '🎓 Education Loan', placeholder: 'Monthly EMI' },
                    { key: 'otherEMI', label: '📋 Other EMIs', placeholder: 'Other debts' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium" style={{ color: 'var(--secondary)' }}>{label}</label>
                      <input
                        type="text"
                        value={debtBreakdown[key as keyof typeof debtBreakdown]}
                        onChange={(e) => setDebtBreakdown({ ...debtBreakdown, [key]: e.target.value.replace(/[^0-9]/g, '') })}
                        className="w-full px-3 py-2 text-lg font-bold rounded-lg outline-none glass-card"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Dream Bike', icon: Target, color: 'var(--lime)' },
                { name: 'Investment', icon: TrendingUp, color: 'var(--violet)' },
                { name: 'Emergency Fund', icon: Shield, color: 'var(--blue)' },
                { name: 'Wedding', icon: Sparkles, color: 'var(--amber)' },
                { name: 'Vacation', icon: Calendar, color: 'var(--lime)' },
                { name: 'Upskill Course', icon: Lightbulb, color: 'var(--violet)' }
              ].map((goal) => {
                const isSelected = selectedGoals.includes(goal.name);
                const Icon = goal.icon;
                return (
                  <button
                    key={goal.name}
                    onClick={() => toggleGoal(goal.name)}
                    className={`goal-option p-3 rounded-xl font-medium transition-all hover:scale-105 glass-card flex flex-col items-center gap-2 ${isSelected ? 'selected' : ''}`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
                      style={{
                        backgroundColor: goal.color + '20',
                        color: goal.color,
                        boxShadow: `0 4px 20px ${goal.color}30`,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <span>{goal.name}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => toggleGoal('Custom')}
              className={`goal-option w-full p-3 rounded-xl font-medium transition-all hover:scale-105 glass-card flex items-center justify-center gap-3 ${selectedGoals.includes('Custom') ? 'selected' : ''}`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
                style={{
                  backgroundColor: 'var(--lime)20',
                  color: 'var(--lime)',
                  boxShadow: '0 4px 20px var(--lime)30',
                }}
              >
                <Target size={20} />
              </div>
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
              className="px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 glass-card"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <ArrowLeft size={18} />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105"
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
