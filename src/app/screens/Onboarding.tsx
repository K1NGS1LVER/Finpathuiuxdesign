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
    <div className="h-full w-full flex items-center justify-center p-4 md:p-8 relative overflow-y-auto" style={{ background: 'var(--background)' }}>
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
          background-color: var(--card);
          color: var(--foreground);
        }
        .goal-option {
          transition: all 0.3s ease;
        }
        .goal-option:hover {
          box-shadow: 0 0 30px rgba(176, 255, 9, 0.3);
          transform: translateY(-2px);
        }
        .goal-option.selected {
          box-shadow: 0 0 40px rgba(176, 255, 9, 0.5);
          border-color: var(--lime);
          background: linear-gradient(135deg, var(--card) 0%, rgba(176, 255, 9, 0.05) 100%);
        }
      `}</style>

      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 z-20"
        style={{
          background: 'var(--card)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
        }}
      >
        {isDark ? <Sun size={20} className="icon-wireframe" style={{ animation: 'rotate360 0.6s ease-out' }} /> : <Moon size={20} className="icon-wireframe" style={{ animation: 'rotate360 0.6s ease-out' }} />}
      </button>

      {/* Decorative Blurred Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="data-blob absolute top-0 right-0 w-96 h-96 rounded-full" style={{ backgroundColor: 'var(--violet)' }} />
        <div className="data-blob absolute bottom-0 left-0 w-96 h-96 rounded-full" style={{ backgroundColor: 'var(--blue)' }} />
      </div>

      <div className="max-w-lg w-full relative z-10 py-8">
        {/* Progress Bar */}
        <div className="flex gap-3 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-2 flex-1 rounded-full transition-all duration-500"
              style={{
                background: i <= step ? 'var(--lime)' : 'rgba(5, 15, 28, 0.1)',
                boxShadow: i <= step ? '0 0 20px var(--lime)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Main Card */}
        <div className="bento-card mb-6">
          <div className="space-y-6 text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              {current.title}
            </h2>
            <p className="text-base md:text-lg" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
              {current.subtitle}
            </p>
          </div>

          {current.type === 'single' ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={income}
                  onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ''))}
                  className="flex-1 px-6 py-6 text-5xl font-bold text-center rounded-3xl outline-none slashed-zero"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--foreground)',
                    background: 'rgba(5, 15, 28, 0.02)',
                    border: '1px solid var(--border)',
                  }}
                  placeholder="0"
                />
                <select
                  value={incomeCurrency}
                  onChange={(e) => setIncomeCurrency(e.target.value)}
                  className="pill-button px-5 py-4 text-sm font-bold outline-none cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--foreground)',
                    background: 'rgba(5, 15, 28, 0.04)',
                  }}
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
              {income && incomeCurrency !== 'INR' && (
                <p className="text-center text-sm slashed-zero" style={{ color: 'var(--secondary)' }}>
                  ≈ ₹{convertToINR(income, incomeCurrency)} INR
                </p>
              )}
            </div>
          ) : current.type === 'combined' ? (
            <div className="space-y-6 max-h-[50vh] overflow-y-auto">
              {/* Expenses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                    Monthly Expenses
                  </label>
                  <select
                    value={expensesCurrency}
                    onChange={(e) => setExpensesCurrency(e.target.value)}
                    className="pill-button px-4 py-2 text-xs font-bold outline-none cursor-pointer"
                  >
                    {currencies.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                <div
                  className="flex gap-3 items-center px-6 py-6 rounded-3xl cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}
                  style={{
                    background: 'rgba(5, 15, 28, 0.02)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="flex-1 text-4xl font-bold text-center slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                    {totalExpenses || '0'}
                  </div>
                  <button className="pill-button text-xs font-medium" style={{ color: 'var(--lime)' }}>
                    {showExpenseBreakdown ? 'Hide' : 'Breakdown'}
                  </button>
                </div>
                {totalExpenses && expensesCurrency !== 'INR' && (
                  <p className="text-center text-sm slashed-zero" style={{ color: 'var(--secondary)' }}>
                    ≈ ₹{convertToINR(totalExpenses, expensesCurrency)} INR
                  </p>
                )}

                {showExpenseBreakdown && (
                  <div className="space-y-2 p-4 rounded-2xl" style={{ background: 'rgba(5, 15, 28, 0.02)', border: '1px solid var(--border)' }}>
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
                          className="w-full px-4 py-3 text-lg font-bold rounded-xl outline-none slashed-zero"
                          style={{
                            fontFamily: 'var(--font-display)',
                            color: 'var(--foreground)',
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                          }}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Debt */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                    Total Debt/EMIs
                  </label>
                  <select
                    value={debtCurrency}
                    onChange={(e) => setDebtCurrency(e.target.value)}
                    className="pill-button px-4 py-2 text-xs font-bold outline-none cursor-pointer"
                  >
                    {currencies.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                <div
                  className="flex gap-3 items-center px-6 py-6 rounded-3xl cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setShowDebtBreakdown(!showDebtBreakdown)}
                  style={{
                    background: 'rgba(5, 15, 28, 0.02)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="flex-1 text-4xl font-bold text-center slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                    {totalDebt || '0'}
                  </div>
                  <button className="pill-button text-xs font-medium" style={{ color: 'var(--lime)' }}>
                    {showDebtBreakdown ? 'Hide' : 'Breakdown'}
                  </button>
                </div>
                {totalDebt && debtCurrency !== 'INR' && (
                  <p className="text-center text-sm slashed-zero" style={{ color: 'var(--secondary)' }}>
                    ≈ ₹{convertToINR(totalDebt, debtCurrency)} INR
                  </p>
                )}

                {showDebtBreakdown && (
                  <div className="space-y-2 p-4 rounded-2xl" style={{ background: 'rgba(5, 15, 28, 0.02)', border: '1px solid var(--border)' }}>
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
                          className="w-full px-4 py-3 text-lg font-bold rounded-xl outline-none slashed-zero"
                          style={{
                            fontFamily: 'var(--font-display)',
                            color: 'var(--foreground)',
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                          }}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
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
                      className={`goal-option p-4 rounded-2xl font-medium transition-all flex flex-col items-center gap-3 ${isSelected ? 'selected' : ''}`}
                      style={{
                        fontFamily: 'var(--font-body)',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
                        style={{
                          backgroundColor: goal.color + '15',
                          color: goal.color,
                        }}
                      >
                        <Icon size={20} className="icon-wireframe" />
                      </div>
                      <span className="text-sm slashed-zero">{goal.name}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => toggleGoal('Custom')}
                className={`goal-option w-full p-4 rounded-2xl font-medium transition-all flex items-center justify-center gap-3 ${selectedGoals.includes('Custom') ? 'selected' : ''}`}
                style={{
                  fontFamily: 'var(--font-body)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
                  style={{
                    backgroundColor: 'var(--lime)15',
                    color: 'var(--lime)',
                  }}
                >
                  <Target size={20} className="icon-wireframe" />
                </div>
                <span className="slashed-zero">Custom</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-4 rounded-full font-medium flex items-center gap-2 transition-all hover:scale-105"
              style={{
                fontFamily: 'var(--font-body)',
                background: 'var(--card)',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <ArrowLeft size={18} className="icon-wireframe" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-6 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--lime)',
              color: '#050F1C',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 10px 40px rgba(176, 255, 9, 0.3)',
            }}
          >
            {step < steps.length - 1 ? 'Continue' : 'Finish'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
