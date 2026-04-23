import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, ArrowLeft, Sun, Moon, Target, TrendingUp, Shield, Sparkles, Calendar, Lightbulb } from 'lucide-react';
import { useFinPathStore } from '../../lib/store';

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

  const [manualTotalExpenses, setManualTotalExpenses] = useState<string | null>(null);
  const [manualTotalDebt, setManualTotalDebt] = useState<string | null>(null);

  const calculateTotal = (breakdown: Record<string, string>) => {
    return Object.values(breakdown).reduce((sum, val) => {
      const num = parseFloat(val) || 0;
      return sum + num;
    }, 0).toString();
  };

  const calculatedTotalExpenses = calculateTotal(expenseBreakdown);
  const totalExpenses = manualTotalExpenses !== null ? manualTotalExpenses : (calculatedTotalExpenses === '0' ? '' : calculatedTotalExpenses);

  const calculatedTotalDebt = calculateTotal(debtBreakdown);
  const totalDebt = manualTotalDebt !== null ? manualTotalDebt : (calculatedTotalDebt === '0' ? '' : calculatedTotalDebt);

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

  const completeOnboarding = useFinPathStore(s => s.completeOnboarding);

  const handleNext = () => {
    // Validation per step
    if (step === 0 && (!income || parseFloat(income) <= 0)) return;
    if (step === 1 && (!totalExpenses || parseFloat(totalExpenses) <= 0)) return;
    if (step === 2 && selectedGoals.length === 0) return;

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Convert onboarding data and save to store
      const incomeINR = parseFloat(convertToINR(income, incomeCurrency) || income) || 0;
      const expenseINR = parseFloat(convertToINR(totalExpenses, expensesCurrency) || totalExpenses) || 0;
      const debtINR = parseFloat(convertToINR(totalDebt, debtCurrency) || totalDebt || '0') || 0;

      const expBreakdown: Record<string, number> = {};
      for (const [k, v] of Object.entries(expenseBreakdown)) {
        expBreakdown[k] = parseFloat(v) || 0;
      }

      const dbtBreakdown: Record<string, number> = {};
      for (const [k, v] of Object.entries(debtBreakdown)) {
        dbtBreakdown[k] = parseFloat(v) || 0;
      }

      completeOnboarding({
        income: incomeINR,
        expenses: expenseINR,
        debts: debtINR,
        goals: selectedGoals,
        expenseBreakdown: expBreakdown,
        debtBreakdown: dbtBreakdown,
      });

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
    <div className="h-[100dvh] w-full flex flex-col p-2 md:p-4 relative overflow-hidden" style={{ background: 'var(--background)' }}>
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
          color: var(--card-foreground);
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
        className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 z-20 text-[var(--card-foreground)]"
        style={{
          background: 'var(--card)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}
      >
        {isDark ? <Sun size={18} className="icon-wireframe md:w-5 md:h-5" /> : <Moon size={18} className="icon-wireframe md:w-5 md:h-5" />}
      </button>

      {/* Decorative Blurred Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="data-blob absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full" style={{ backgroundColor: 'var(--violet)' }} />
        <div className="data-blob absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full" style={{ backgroundColor: 'var(--blue)' }} />
      </div>

      <div className="max-w-lg w-full m-auto relative z-10 py-2 md:py-4 flex flex-col justify-center h-full">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-4 md:mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 md:h-2 flex-1 rounded-full transition-all duration-500"
              style={{
                background: i <= step ? 'var(--lime)' : 'var(--progress-inactive)',
                boxShadow: i <= step ? '0 0 20px var(--lime)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Main Card */}
        <div className="bento-card mb-4 flex-1 flex flex-col justify-center overflow-y-auto min-h-0 !p-4 md:!p-6">
          <div className="space-y-2 md:space-y-4 text-center mb-4 md:mb-6">
            <h2 className="text-2xl md:text-4xl font-bold slashed-zero leading-tight text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
              {current.title}
            </h2>
            <p className="text-sm md:text-base" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
              {current.subtitle}
            </p>
          </div>

          {current.type === 'single' ? (
            <div className="space-y-3 md:space-y-4">
              <div className="flex gap-2 md:gap-3">
                <input
                  type="text"
                  value={income}
                  onChange={(e) => setIncome(e.target.value.replace(/[^0-9]/g, ''))}
                  className="flex-1 px-4 py-4 md:px-6 md:py-6 text-3xl md:text-5xl font-bold text-center rounded-2xl md:rounded-3xl outline-none slashed-zero text-[var(--card-foreground)]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    background: 'var(--surface-tint)',
                    border: '1px solid var(--border)',
                  }}
                  placeholder="0"
                />
                <select
                  value={incomeCurrency}
                  onChange={(e) => setIncomeCurrency(e.target.value)}
                  className="pill-button px-3 md:px-5 py-3 md:py-4 text-xs md:text-sm font-bold outline-none cursor-pointer rounded-2xl md:rounded-3xl"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--card-foreground)',
                    background: 'var(--surface-hover)',
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
            <div className="space-y-4 md:space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {/* Expenses */}
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <label className="text-xs md:text-sm font-medium" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                    Monthly Expenses
                  </label>
                  <select
                    value={expensesCurrency}
                    onChange={(e) => setExpensesCurrency(e.target.value)}
                    className="pill-button px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold outline-none cursor-pointer"
                  >
                    {currencies.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                <div
                  className="flex gap-2 md:gap-3 items-center px-4 py-4 md:px-6 md:py-6 rounded-2xl md:rounded-3xl cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}
                  style={{
                    background: 'var(--surface-tint)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="text"
                    value={totalExpenses}
                    onChange={(e) => setManualTotalExpenses(e.target.value.replace(/[^0-9]/g, ''))}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="0"
                    className="flex-1 w-full bg-transparent text-2xl md:text-4xl font-bold text-center outline-none slashed-zero text-[var(--card-foreground)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  />
                  <button className="pill-button text-[10px] md:text-xs font-medium" style={{ color: 'var(--lime-text)' }}>
                    {showExpenseBreakdown ? 'Hide' : 'Breakdown'}
                  </button>
                </div>
                {totalExpenses && expensesCurrency !== 'INR' && (
                  <p className="text-center text-xs md:text-sm slashed-zero" style={{ color: 'var(--secondary)' }}>
                    ≈ ₹{convertToINR(totalExpenses, expensesCurrency)} INR
                  </p>
                )}

                {showExpenseBreakdown && (
                  <div className="space-y-2 p-3 md:p-4 rounded-xl md:rounded-2xl" style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)' }}>
                    {[
                      { key: 'rent', label: '🏠 Rent', placeholder: 'Monthly rent' },
                      { key: 'food', label: '🍽️ Food & Groceries', placeholder: 'Food expenses' },
                      { key: 'transport', label: '🚗 Transport', placeholder: 'Commute, fuel' },
                      { key: 'utilities', label: '💡 Utilities', placeholder: 'Bills, internet' },
                      { key: 'entertainment', label: '🎬 Entertainment', placeholder: 'Movies, hobbies' },
                      { key: 'other', label: '📦 Other', placeholder: 'Miscellaneous' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] md:text-xs font-medium" style={{ color: 'var(--secondary)' }}>{label}</label>
                        <input
                          type="text"
                          value={expenseBreakdown[key as keyof typeof expenseBreakdown]}
                          onChange={(e) => {
                            setExpenseBreakdown({ ...expenseBreakdown, [key]: e.target.value.replace(/[^0-9]/g, '') });
                            setManualTotalExpenses(null);
                          }}
                          className="w-full px-3 py-2 md:px-4 md:py-3 text-base md:text-lg font-bold rounded-lg md:rounded-xl outline-none slashed-zero"
                          style={{
                            fontFamily: 'var(--font-display)',
                            color: 'var(--card-foreground)',
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
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <label className="text-xs md:text-sm font-medium" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
                    Total Debt/EMIs
                  </label>
                  <select
                    value={debtCurrency}
                    onChange={(e) => setDebtCurrency(e.target.value)}
                    className="pill-button px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold outline-none cursor-pointer"
                  >
                    {currencies.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                <div
                  className="flex gap-2 md:gap-3 items-center px-4 py-4 md:px-6 md:py-6 rounded-2xl md:rounded-3xl cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setShowDebtBreakdown(!showDebtBreakdown)}
                  style={{
                    background: 'var(--surface-tint)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="text"
                    value={totalDebt}
                    onChange={(e) => setManualTotalDebt(e.target.value.replace(/[^0-9]/g, ''))}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="0"
                    className="flex-1 w-full bg-transparent text-2xl md:text-4xl font-bold text-center outline-none slashed-zero text-[var(--card-foreground)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  />
                  <button className="pill-button text-[10px] md:text-xs font-medium" style={{ color: 'var(--lime-text)' }}>
                    {showDebtBreakdown ? 'Hide' : 'Breakdown'}
                  </button>
                </div>
                {totalDebt && debtCurrency !== 'INR' && (
                  <p className="text-center text-xs md:text-sm slashed-zero" style={{ color: 'var(--secondary)' }}>
                    ≈ ₹{convertToINR(totalDebt, debtCurrency)} INR
                  </p>
                )}

                {showDebtBreakdown && (
                  <div className="space-y-2 p-3 md:p-4 rounded-xl md:rounded-2xl" style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)' }}>
                    {[
                      { key: 'homeLoan', label: '🏡 Home Loan EMI', placeholder: 'Monthly EMI' },
                      { key: 'carLoan', label: '🚙 Car Loan EMI', placeholder: 'Monthly EMI' },
                      { key: 'personalLoan', label: '💳 Personal Loan', placeholder: 'Monthly EMI' },
                      { key: 'creditCard', label: '💰 Credit Card', placeholder: 'Monthly payment' },
                      { key: 'educationLoan', label: '🎓 Education Loan', placeholder: 'Monthly EMI' },
                      { key: 'otherEMI', label: '📋 Other EMIs', placeholder: 'Other debts' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] md:text-xs font-medium" style={{ color: 'var(--secondary)' }}>{label}</label>
                        <input
                          type="text"
                          value={debtBreakdown[key as keyof typeof debtBreakdown]}
                          onChange={(e) => {
                            setDebtBreakdown({ ...debtBreakdown, [key]: e.target.value.replace(/[^0-9]/g, '') });
                            setManualTotalDebt(null);
                          }}
                          className="w-full px-3 py-2 md:px-4 md:py-3 text-base md:text-lg font-bold rounded-lg md:rounded-xl outline-none slashed-zero"
                          style={{
                            fontFamily: 'var(--font-display)',
                            color: 'var(--card-foreground)',
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
            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {[
                  { name: 'Dream Bike', icon: Target, color: 'var(--lime)', colorText: 'var(--lime-text)' },
                  { name: 'Investment', icon: TrendingUp, color: 'var(--violet)', colorText: 'var(--violet-text)' },
                  { name: 'Emergency Fund', icon: Shield, color: 'var(--blue)', colorText: 'var(--blue-text)' },
                  { name: 'Wedding', icon: Sparkles, color: 'var(--amber)', colorText: 'var(--amber-text)' },
                  { name: 'Vacation', icon: Calendar, color: 'var(--lime)', colorText: 'var(--lime-text)' },
                  { name: 'Upskill Course', icon: Lightbulb, color: 'var(--violet)', colorText: 'var(--violet-text)' }
                ].map((goal) => {
                  const isSelected = selectedGoals.includes(goal.name);
                  const Icon = goal.icon;
                  return (
                    <button
                      key={goal.name}
                      onClick={() => toggleGoal(goal.name)}
                      className={`goal-option p-3 md:p-4 rounded-xl md:rounded-2xl font-medium transition-all flex flex-col items-center gap-2 md:gap-3 text-[var(--card-foreground)] ${isSelected ? 'selected' : ''}`}
                      style={{
                        fontFamily: 'var(--font-body)',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
                        style={{
                          backgroundColor: goal.color + '15',
                          color: goal.colorText,
                        }}
                      >
                        <Icon size={18} className="icon-wireframe md:w-5 md:h-5" />
                      </div>
                      <span className="text-[10px] md:text-sm slashed-zero">{goal.name}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => toggleGoal('Custom')}
                className={`goal-option w-full p-3 md:p-4 rounded-xl md:rounded-2xl font-medium transition-all flex items-center justify-center gap-2 md:gap-3 text-[var(--card-foreground)] ${selectedGoals.includes('Custom') ? 'selected' : ''}`}
                style={{
                  fontFamily: 'var(--font-body)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
                  style={{
                    backgroundColor: 'rgba(176, 255, 9, 0.08)',
                    color: 'var(--lime-text)',
                  }}
                >
                  <Target size={18} className="icon-wireframe md:w-5 md:h-5" />
                </div>
                <span className="text-xs md:text-sm slashed-zero">Custom</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 md:gap-3 mt-auto pt-2 md:pt-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-3 md:px-6 md:py-4 rounded-full font-medium flex items-center gap-2 transition-all hover:scale-105 text-[var(--card-foreground)]"
              style={{
                fontFamily: 'var(--font-body)',
                background: 'var(--card)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <ArrowLeft size={16} className="icon-wireframe md:w-[18px] md:h-[18px]" />
              <span className="text-sm md:text-base hidden sm:inline">Back</span>
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--lime)',
              color: '#050F1C',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 10px 40px rgba(176, 255, 9, 0.3)',
            }}
          >
            <span className="text-sm md:text-base">{step < steps.length - 1 ? 'Continue' : 'Finish'}</span>
            <ArrowRight size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
