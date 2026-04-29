import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Target,
  TrendingUp,
  Shield,
  Sparkles,
  Calendar,
  Lightbulb,
  FileText,
  Loader2,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { useFinPathStore } from "../../lib/store";
import type { InvestmentStrategy } from "../../lib/types";
import { extractFromDocument } from "../../lib/document-extractor";

interface OnboardingProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export default function Onboarding({ isDark, setIsDark }: OnboardingProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionPopup, setExtractionPopup] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });
  const [incomeCurrency, setIncomeCurrency] = useState("INR");
  const [expensesCurrency, setExpensesCurrency] = useState("INR");
  const [debtCurrency, setDebtCurrency] = useState("INR");
  const [selectedGoals, setSelectedGoals] = useState<
    Record<string, { targetAmount: string; priority: number }>
  >({});
  const [selectedStrategy, setSelectedStrategy] =
    useState<InvestmentStrategy>("avalanche");
  const [surplusAmount, setSurplusAmount] = useState("");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(
    {},
  );

  const [expenseBreakdown, setExpenseBreakdown] = useState({
    rent: "",
    food: "",
    transport: "",
    utilities: "",
    entertainment: "",
    other: "",
  });

  const [debtBreakdown, setDebtBreakdown] = useState({
    homeLoan: "",
    carLoan: "",
    personalLoan: "",
    creditCard: "",
    educationLoan: "",
    otherEMI: "",
  });

  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [showDebtBreakdown, setShowDebtBreakdown] = useState(false);

  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/INR")
      .then((res) => res.json())
      .then((data) => setExchangeRates(data.rates))
      .catch((err) => console.error("Failed to fetch exchange rates:", err));
  }, []);

  const convertToINR = (amount: string, currency: string) => {
    if (!amount || !exchangeRates[currency]) return "";
    const value = parseFloat(amount);
    if (currency === "INR") return value.toFixed(2);
    const inrRate = 1 / exchangeRates[currency];
    return (value * inrRate).toFixed(2);
  };

  const [manualTotalExpenses, setManualTotalExpenses] = useState<string | null>(
    null,
  );
  const [manualTotalDebt, setManualTotalDebt] = useState<string | null>(null);

  const calculateTotal = (breakdown: Record<string, string>) => {
    return Object.values(breakdown)
      .reduce((sum, val) => {
        const num = parseFloat(val) || 0;
        return sum + num;
      }, 0)
      .toString();
  };

  const calculatedTotalExpenses = calculateTotal(expenseBreakdown);
  const totalExpenses =
    manualTotalExpenses !== null
      ? manualTotalExpenses
      : calculatedTotalExpenses === "0"
        ? ""
        : calculatedTotalExpenses;

  const calculatedTotalDebt = calculateTotal(debtBreakdown);
  const totalDebt =
    manualTotalDebt !== null
      ? manualTotalDebt
      : calculatedTotalDebt === "0"
        ? ""
        : calculatedTotalDebt;

  const steps = [
    {
      title: "What's your monthly income?",
      subtitle: "Include salary and all other sources",
      type: "single",
    },
    {
      title: "Monthly expenses & debt?",
      subtitle: "Expenses, rent, bills, loans, and EMIs",
      type: "combined",
    },
    {
      title: "What are your top goals?",
      subtitle: "Pick first, second, and third priority goals",
      type: "goals",
    },
    {
      title: "Which strategy should Penny follow?",
      subtitle: "Choose avalanche or snowball for your journey",
      type: "strategy",
    },
  ];

  const current = steps[step];
  const currencies = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"];

  const completeOnboarding = useFinPathStore((s) => s.completeOnboarding);

  const selectedGoalCount = Object.keys(selectedGoals).length;

  const sortedSelectedGoals = Object.entries(selectedGoals).sort(
    ([, a], [, b]) => a.priority - b.priority,
  );

  const goalSelectionCaption =
    selectedGoalCount === 0
      ? "Select your 1st priority goal. Brightest glow = highest priority."
      : selectedGoalCount === 1
        ? "Great. Now pick your 2nd priority goal. Glow intensity indicates priority."
        : selectedGoalCount === 2
          ? "Pick your 3rd priority goal to complete your ranked set."
          : "Priority set complete. Bright glow = P1, medium = P2, soft = P3.";

  const getPriorityGlow = (priority: number) => {
    if (priority === 1) return "0 0 42px var(--accent-glow)";
    if (priority === 2) return "0 0 28px var(--accent-glow)";
    return "0 0 16px var(--accent-glow)";
  };

  const handleNext = () => {
    // Validation per step
    if (step === 0 && (!income || parseFloat(income) <= 0)) return;
    if (step === 1 && (!totalExpenses || parseFloat(totalExpenses) <= 0))
      return;
    if (step === 2 && Object.keys(selectedGoals).length === 0) return;
    // Block if surplus exceeds income (hard error)
    if (step === 3) {
      const incINR = parseFloat(convertToINR(income, incomeCurrency) || income) || 0;
      const surplusNum = parseFloat(surplusAmount) || 0;
      if (surplusNum > incINR) return;
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Convert onboarding data and save to store
      const incomeINR =
        parseFloat(convertToINR(income, incomeCurrency) || income) || 0;
      const expenseINR =
        parseFloat(
          convertToINR(totalExpenses, expensesCurrency) || totalExpenses,
        ) || 0;
      const debtINR =
        parseFloat(convertToINR(totalDebt, debtCurrency) || totalDebt || "0") ||
        0;

      const expBreakdown: Record<string, number> = {};
      for (const [k, v] of Object.entries(expenseBreakdown)) {
        expBreakdown[k] = parseFloat(v) || 0;
      }

      const dbtBreakdown: Record<string, number> = {};
      for (const [k, v] of Object.entries(debtBreakdown)) {
        dbtBreakdown[k] = parseFloat(v) || 0;
      }

      const formattedGoals = sortedSelectedGoals.map(([name, data]) => ({
        name,
        targetAmount: parseFloat(data.targetAmount) || 0,
        priority: data.priority,
      }));

      completeOnboarding({
        income: incomeINR,
        expenses: expenseINR,
        debts: debtINR,
        goals: formattedGoals,
        expenseBreakdown: expBreakdown,
        debtBreakdown: dbtBreakdown,
        strategy: selectedStrategy,
        surplus: parseFloat(surplusAmount) || 0,
      });

      navigate("/loading");
    }
  };

  const toggleGoal = (goalName: string) => {
    setSelectedGoals((prev) => {
      const newGoals = { ...prev };
      if (newGoals[goalName]) {
        const removedPriority = newGoals[goalName].priority;
        delete newGoals[goalName];
        for (const [name, data] of Object.entries(newGoals)) {
          if (data.priority > removedPriority) {
            newGoals[name] = { ...data, priority: data.priority - 1 };
          }
        }
      } else if (Object.keys(newGoals).length < 3) {
        newGoals[goalName] = {
          targetAmount: "",
          priority: Object.keys(newGoals).length + 1,
        };
      }
      return newGoals;
    });
  };

  const updateGoalAmount = (goalName: string, amount: string) => {
    setSelectedGoals((prev) => ({
      ...prev,
      [goalName]: {
        targetAmount: amount.replace(/[^0-9]/g, ""),
        priority: prev[goalName]?.priority || 1,
      },
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = "";

    setIsExtracting(true);
    setExtractionPopup({ show: false, type: "success", message: "" });

    try {
      // Determine extraction context based on current step
      const context = step === 0 ? "income" : "debt";
      const result = await extractFromDocument(
        file,
        context as "income" | "debt",
      );

      setIsExtracting(false);

      if (result.success) {
        // Apply extracted data to the form
        if (result.type === "salary" && result.data.income) {
          setIncome(String(result.data.income));
          setIncomeCurrency("INR");
        } else if (result.type === "debt") {
          if (result.data.emi) {
            setManualTotalDebt(String(result.data.emi));
            setDebtCurrency("INR");
          } else if (result.data.loanAmount) {
            // If we only got principal, estimate monthly EMI (rough: principal / 120 for 10yr loan)
            const estimatedEMI = Math.round(result.data.loanAmount / 120);
            setManualTotalDebt(String(estimatedEMI));
            setDebtCurrency("INR");
          }
        }

        setExtractionPopup({
          show: true,
          type: "success",
          message: result.summary,
        });
      } else {
        setExtractionPopup({
          show: true,
          type: "error",
          message: result.summary,
        });
      }
    } catch (error: any) {
      setIsExtracting(false);
      setExtractionPopup({
        show: true,
        type: "error",
        message: `Error processing document: ${error.message || "Unknown error"}. Please enter details manually.`,
      });
    }

    // Auto-hide popup after 6 seconds
    setTimeout(() => {
      setExtractionPopup((prev) => ({ ...prev, show: false }));
    }, 6000);
  };

  return (
    <div
      className="h-[100dvh] w-full flex flex-col p-2 md:p-4 relative overflow-hidden"
      style={{ background: "var(--background)" }}
    >
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
          box-shadow: 0 0 30px var(--accent-glow);
          transform: translateY(-2px);
        }
        .goal-option.selected {
          box-shadow: 0 0 40px var(--accent-glow);
          border-color: var(--accent);
          background: linear-gradient(135deg, var(--card) 0%, var(--accent-glow) 100%);
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      {/* Extraction Popup */}
      {extractionPopup.show && (
        <div
          className="fixed bottom-24 left-1/2 z-50 p-4 rounded-2xl flex items-center gap-3 shadow-2xl max-w-[90vw] md:max-w-md w-full"
          style={{
            animation:
              "slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            background: "var(--surface-tint)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${extractionPopup.type === "success" ? "var(--accent)" : "var(--red)"}`,
            color: "var(--card-foreground)",
            fontFamily: "var(--font-body)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                extractionPopup.type === "success"
                  ? "var(--accent-glow)"
                  : "var(--red-subtle)",
            }}
          >
            {extractionPopup.type === "success" ? (
              <Sparkles size={20} className="text-[var(--accent)]" />
            ) : (
              <Shield size={20} className="text-[var(--red)]" />
            )}
          </div>
          <p className="text-sm font-medium">{extractionPopup.message}</p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        id="document-upload"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileUpload}
      />

      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 z-20 text-[var(--card-foreground)]"
        style={{
          background: "var(--card)",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border)",
        }}
      >
        {isDark ? (
          <Sun size={18} className="icon-wireframe md:w-5 md:h-5" />
        ) : (
          <Moon size={18} className="icon-wireframe md:w-5 md:h-5" />
        )}
      </button>

      {/* Decorative Blurred Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="data-blob absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full"
          style={{ backgroundColor: "var(--tertiary-accent)" }}
        />
        <div
          className="data-blob absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full"
          style={{ backgroundColor: "var(--tertiary-accent)" }}
        />
      </div>

      <div className="max-w-lg w-full m-auto relative z-10 py-2 md:py-4 flex flex-col justify-center h-full">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-4 md:mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 md:h-2 flex-1 rounded-full transition-all duration-500"
              style={{
                background:
                  i <= step ? "var(--accent)" : "var(--progress-inactive)",
                boxShadow: i <= step ? "0 0 20px var(--accent)" : "none",
              }}
            />
          ))}
        </div>

        {/* Main Card */}
        <div className="bento-card mb-4 flex-1 flex flex-col justify-center overflow-y-auto min-h-0 !p-4 md:!p-6">
          <div className="space-y-2 md:space-y-4 text-center mb-4 md:mb-6">
            <h2
              className="text-2xl md:text-4xl font-bold slashed-zero leading-tight text-[var(--card-foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {current.title}
            </h2>
            <p
              className="text-sm md:text-base"
              style={{
                color: "var(--secondary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {current.subtitle}
            </p>
          </div>

          {current.type === "single" ? (
            <div className="space-y-3 md:space-y-4">
              <div className="flex gap-2 md:gap-3">
                <input
                  type="text"
                  value={income}
                  onChange={(e) =>
                    setIncome(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="flex-1 px-4 py-4 md:px-6 md:py-6 text-3xl md:text-5xl font-bold text-center rounded-2xl md:rounded-3xl outline-none slashed-zero text-[var(--card-foreground)]"
                  style={{
                    fontFamily: "var(--font-display)",
                    background: "var(--surface-tint)",
                    border: "1px solid var(--border)",
                  }}
                  placeholder="0"
                />
                <select
                  value={incomeCurrency}
                  onChange={(e) => setIncomeCurrency(e.target.value)}
                  className="pill-button px-3 md:px-5 py-3 md:py-4 text-xs md:text-sm font-bold outline-none cursor-pointer rounded-2xl md:rounded-3xl"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "var(--card-foreground)",
                    background: "var(--surface-hover)",
                  }}
                >
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </div>
              {income && incomeCurrency !== "INR" && (
                <p
                  className="text-center text-sm slashed-zero"
                  style={{ color: "var(--secondary)" }}
                >
                  ≈ ₹{convertToINR(income, incomeCurrency)} INR
                </p>
              )}

              <div className="pt-4 flex justify-center">
                <label
                  htmlFor="document-upload"
                  className={`pill-button px-6 py-3 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${isExtracting ? "opacity-70 pointer-events-none" : "hover:scale-105"}`}
                >
                  {isExtracting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileText size={16} />
                  )}
                  {isExtracting
                    ? "Penny is reading your document..."
                    : "Upload Salary Slip (PDF/Image)"}
                </label>
              </div>
            </div>
          ) : current.type === "combined" ? (
            <div className="space-y-4 md:space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {/* Expenses */}
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <label
                    className="text-xs md:text-sm font-medium"
                    style={{
                      color: "var(--secondary)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Monthly Expenses
                  </label>
                  <select
                    value={expensesCurrency}
                    onChange={(e) => setExpensesCurrency(e.target.value)}
                    className="pill-button px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold outline-none cursor-pointer"
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className="flex gap-2 md:gap-3 items-center px-4 py-4 md:px-6 md:py-6 rounded-2xl md:rounded-3xl cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setShowExpenseBreakdown(!showExpenseBreakdown)}
                  style={{
                    background: "var(--surface-tint)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <input
                    type="text"
                    value={totalExpenses}
                    onChange={(e) =>
                      setManualTotalExpenses(
                        e.target.value.replace(/[^0-9]/g, ""),
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                    placeholder="0"
                    className="flex-1 w-full bg-transparent text-2xl md:text-4xl font-bold text-center outline-none slashed-zero text-[var(--card-foreground)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  />
                  <button
                    className="pill-button text-[10px] md:text-xs font-medium"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {showExpenseBreakdown ? "Hide" : "Breakdown"}
                  </button>
                </div>
                {totalExpenses && expensesCurrency !== "INR" && (
                  <p
                    className="text-center text-xs md:text-sm slashed-zero"
                    style={{ color: "var(--secondary)" }}
                  >
                    ≈ ₹{convertToINR(totalExpenses, expensesCurrency)} INR
                  </p>
                )}

                {showExpenseBreakdown && (
                  <div
                    className="space-y-2 p-3 md:p-4 rounded-xl md:rounded-2xl"
                    style={{
                      background: "var(--surface-tint)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {[
                      {
                        key: "rent",
                        label: "Rent",
                        placeholder: "Monthly rent",
                      },
                      {
                        key: "food",
                        label: "Food & Groceries",
                        placeholder: "Food expenses",
                      },
                      {
                        key: "transport",
                        label: "Transport",
                        placeholder: "Commute, fuel",
                      },
                      {
                        key: "utilities",
                        label: "Utilities",
                        placeholder: "Bills, internet",
                      },
                      {
                        key: "entertainment",
                        label: "Entertainment",
                        placeholder: "Movies, hobbies",
                      },
                      {
                        key: "other",
                        label: "Other",
                        placeholder: "Miscellaneous",
                      },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-1">
                        <label
                          className="text-[10px] md:text-xs font-medium"
                          style={{ color: "var(--secondary)" }}
                        >
                          {label}
                        </label>
                        <input
                          type="text"
                          value={
                            expenseBreakdown[
                              key as keyof typeof expenseBreakdown
                            ]
                          }
                          onChange={(e) => {
                            setExpenseBreakdown({
                              ...expenseBreakdown,
                              [key]: e.target.value.replace(/[^0-9]/g, ""),
                            });
                            setManualTotalExpenses(null);
                          }}
                          className="w-full px-3 py-2 md:px-4 md:py-3 text-base md:text-lg font-bold rounded-lg md:rounded-xl outline-none slashed-zero"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: "var(--card-foreground)",
                            background: "var(--card)",
                            border: "1px solid var(--border)",
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
                  <label
                    className="text-xs md:text-sm font-medium"
                    style={{
                      color: "var(--secondary)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Total Debt/EMIs
                  </label>
                  <select
                    value={debtCurrency}
                    onChange={(e) => setDebtCurrency(e.target.value)}
                    className="pill-button px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold outline-none cursor-pointer"
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className="flex gap-2 md:gap-3 items-center px-4 py-4 md:px-6 md:py-6 rounded-2xl md:rounded-3xl cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setShowDebtBreakdown(!showDebtBreakdown)}
                  style={{
                    background: "var(--surface-tint)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <input
                    type="text"
                    value={totalDebt}
                    onChange={(e) =>
                      setManualTotalDebt(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    onClick={(e) => e.stopPropagation()}
                    placeholder="0"
                    className="flex-1 w-full bg-transparent text-2xl md:text-4xl font-bold text-center outline-none slashed-zero text-[var(--card-foreground)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  />
                  <button
                    className="pill-button text-[10px] md:text-xs font-medium"
                    style={{ color: "var(--accent-text)" }}
                  >
                    {showDebtBreakdown ? "Hide" : "Breakdown"}
                  </button>
                </div>
                {totalDebt && debtCurrency !== "INR" && (
                  <p
                    className="text-center text-xs md:text-sm slashed-zero"
                    style={{ color: "var(--secondary)" }}
                  >
                    ≈ ₹{convertToINR(totalDebt, debtCurrency)} INR
                  </p>
                )}

                {showDebtBreakdown && (
                  <div
                    className="space-y-2 p-3 md:p-4 rounded-xl md:rounded-2xl"
                    style={{
                      background: "var(--surface-tint)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {[
                      {
                        key: "homeLoan",
                        label: "Home Loan EMI",
                        placeholder: "Monthly EMI",
                      },
                      {
                        key: "carLoan",
                        label: "Car Loan EMI",
                        placeholder: "Monthly EMI",
                      },
                      {
                        key: "personalLoan",
                        label: "Personal Loan",
                        placeholder: "Monthly EMI",
                      },
                      {
                        key: "creditCard",
                        label: "Credit Card",
                        placeholder: "Monthly payment",
                      },
                      {
                        key: "educationLoan",
                        label: "Education Loan",
                        placeholder: "Monthly EMI",
                      },
                      {
                        key: "otherEMI",
                        label: "Other EMIs",
                        placeholder: "Other debts",
                      },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-1">
                        <label
                          className="text-[10px] md:text-xs font-medium"
                          style={{ color: "var(--secondary)" }}
                        >
                          {label}
                        </label>
                        <input
                          type="text"
                          value={
                            debtBreakdown[key as keyof typeof debtBreakdown]
                          }
                          onChange={(e) => {
                            setDebtBreakdown({
                              ...debtBreakdown,
                              [key]: e.target.value.replace(/[^0-9]/g, ""),
                            });
                            setManualTotalDebt(null);
                          }}
                          className="w-full px-3 py-2 md:px-4 md:py-3 text-base md:text-lg font-bold rounded-lg md:rounded-xl outline-none slashed-zero"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: "var(--card-foreground)",
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                          }}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-center">
                <label
                  htmlFor="document-upload"
                  className={`pill-button px-6 py-3 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${isExtracting ? "opacity-70 pointer-events-none" : "hover:scale-105"}`}
                >
                  {isExtracting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileText size={16} />
                  )}
                  {isExtracting
                    ? "Penny is reading your document..."
                    : "Upload Loan/Debt PDF (PDF/Image)"}
                </label>
              </div>
            </div>
          ) : current.type === "goals" ? (
            <div className="space-y-3 md:space-y-4">
              <div
                className="p-3 rounded-xl md:rounded-2xl text-xs md:text-sm"
                style={{
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                  color: "var(--secondary)",
                }}
              >
                {goalSelectionCaption}
              </div>

              {sortedSelectedGoals.length > 0 && (
                <div
                  className="p-3 rounded-xl md:rounded-2xl"
                  style={{
                    background: "var(--surface-tint)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    className="text-[11px] md:text-xs mb-2"
                    style={{ color: "var(--secondary)" }}
                  >
                    Selected order
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sortedSelectedGoals.map(([name, data]) => (
                      <span
                        key={`rank-${name}`}
                        className="px-3 py-1 rounded-full text-[10px] md:text-xs font-bold"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--card-foreground)",
                          boxShadow: getPriorityGlow(data.priority),
                        }}
                      >
                        P{data.priority} · {name}
                      </span>
                    ))}
                  </div>
                  <div
                    className="text-[10px] mt-2"
                    style={{ color: "var(--secondary)" }}
                  >
                    Glow intensity legend: P1 strong, P2 medium, P3 soft.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {[
                  {
                    name: "Dream Bike",
                    icon: Target,
                    color: "var(--accent)",
                    colorText: "var(--accent-text)",
                    colorSubtle: "var(--accent-subtle)",
                  },
                  {
                    name: "Investment",
                    icon: TrendingUp,
                    color: "var(--tertiary-accent)",
                    colorText: "var(--tertiary-accent-text)",
                    colorSubtle: "var(--tertiary-accent-subtle)",
                  },
                  {
                    name: "Emergency Fund",
                    icon: Shield,
                    color: "var(--tertiary-accent)",
                    colorText: "var(--tertiary-accent-text)",
                    colorSubtle: "var(--tertiary-accent-subtle)",
                  },
                  {
                    name: "Wedding",
                    icon: Sparkles,
                    color: "var(--amber)",
                    colorText: "var(--amber-text)",
                    colorSubtle: "var(--amber-subtle)",
                  },
                  {
                    name: "Vacation",
                    icon: Calendar,
                    color: "var(--accent)",
                    colorText: "var(--accent-text)",
                    colorSubtle: "var(--accent-subtle)",
                  },
                  {
                    name: "Upskill Course",
                    icon: Lightbulb,
                    color: "var(--tertiary-accent)",
                    colorText: "var(--tertiary-accent-text)",
                    colorSubtle: "var(--tertiary-accent-subtle)",
                  },
                ].map((goal) => {
                  const selectedData = selectedGoals[goal.name];
                  const isSelected = !!selectedData;
                  const priority = selectedData?.priority || 0;
                  const Icon = goal.icon;
                  return (
                    <div
                      key={goal.name}
                      className={`goal-option flex flex-col overflow-hidden rounded-xl md:rounded-2xl transition-all ${isSelected ? "selected" : ""}`}
                      style={{
                        background: "var(--card)",
                        border: isSelected
                          ? "1px solid var(--accent)"
                          : "1px solid var(--border)",
                        boxShadow: isSelected
                          ? getPriorityGlow(priority)
                          : "none",
                      }}
                    >
                      <button
                        onClick={() => toggleGoal(goal.name)}
                        className="p-3 md:p-4 font-medium flex flex-col items-center gap-2 md:gap-3 text-[var(--card-foreground)] w-full h-full"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        <div
                          className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
                          style={{
                            backgroundColor: goal.colorSubtle,
                            color: goal.colorText,
                          }}
                        >
                          <Icon
                            size={18}
                            className="icon-wireframe md:w-5 md:h-5"
                          />
                        </div>
                        <span className="text-[10px] md:text-sm slashed-zero">
                          {goal.name}
                        </span>
                        {isSelected && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: "var(--surface-tint)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            Priority P{priority}
                          </span>
                        )}
                      </button>

                      {isSelected && (
                        <div className="px-3 pb-3 md:px-4 md:pb-4 w-full">
                          <input
                            type="text"
                            value={selectedData.targetAmount}
                            onChange={(e) =>
                              updateGoalAmount(goal.name, e.target.value)
                            }
                            placeholder="Target ₹"
                            className="w-full px-3 py-2 text-xs md:text-sm font-bold text-center rounded-lg outline-none slashed-zero"
                            style={{
                              fontFamily: "var(--font-display)",
                              background: "var(--surface-tint)",
                              border: "1px solid var(--border)",
                              color: "var(--card-foreground)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div
                className={`goal-option w-full rounded-xl md:rounded-2xl overflow-hidden transition-all flex flex-col ${!!selectedGoals["Custom"] ? "selected" : ""}`}
                style={{
                  background: "var(--card)",
                  border: !!selectedGoals["Custom"]
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border)",
                  boxShadow: selectedGoals["Custom"]
                    ? getPriorityGlow(selectedGoals["Custom"].priority)
                    : "none",
                }}
              >
                <button
                  onClick={() => toggleGoal("Custom")}
                  className="w-full p-3 md:p-4 font-medium flex items-center justify-center gap-2 md:gap-3 text-[var(--card-foreground)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform duration-300"
                    style={{
                      backgroundColor: "var(--accent-glow)",
                      color: "var(--accent-text)",
                    }}
                  >
                    <Target
                      size={18}
                      className="icon-wireframe md:w-5 md:h-5"
                    />
                  </div>
                  <span className="text-xs md:text-sm slashed-zero">
                    Custom
                  </span>
                  {!!selectedGoals["Custom"] && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--surface-tint)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      Priority P{selectedGoals["Custom"].priority}
                    </span>
                  )}
                </button>
                {!!selectedGoals["Custom"] && (
                  <div className="px-3 pb-3 md:px-4 md:pb-4 w-full flex gap-2">
                    <input
                      type="text"
                      value={selectedGoals["Custom"].targetAmount}
                      onChange={(e) =>
                        updateGoalAmount("Custom", e.target.value)
                      }
                      placeholder="Target Amount ₹"
                      className="flex-1 px-3 py-2 text-xs md:text-sm font-bold text-center rounded-lg outline-none slashed-zero"
                      style={{
                        fontFamily: "var(--font-display)",
                        background: "var(--surface-tint)",
                        border: "1px solid var(--border)",
                        color: "var(--card-foreground)",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (() => {
            // ── Surplus edge-case calculations ──
            const _incomeINR = parseFloat(convertToINR(income, incomeCurrency) || income) || 0;
            const _expenseINR = parseFloat(convertToINR(totalExpenses, expensesCurrency) || totalExpenses) || 0;
            const _debtINR = parseFloat(convertToINR(totalDebt, debtCurrency) || totalDebt || "0") || 0;
            const availableForGoals = Math.max(0, _incomeINR - _expenseINR - _debtINR);
            const surplusNum = parseFloat(surplusAmount) || 0;
            const surplusExceedsAvailable = surplusNum > availableForGoals;
            const surplusExceeds75 = surplusNum > _incomeINR * 0.75;
            const surplusExceedsIncome = surplusNum > _incomeINR;
            const remainingForGoals = Math.max(0, availableForGoals - surplusNum);

            return (
            <div className="space-y-4 md:space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <div
                className="p-3 rounded-xl md:rounded-2xl text-xs md:text-sm"
                style={{
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                  color: "var(--secondary)",
                }}
              >
                You can switch strategy later from Month and Scenarios pages.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedStrategy("avalanche")}
                  className="text-left p-4 rounded-xl md:rounded-2xl transition-all"
                  style={{
                    background:
                      selectedStrategy === "avalanche"
                        ? "var(--accent-glow)"
                        : "var(--card)",
                    border: `1px solid ${selectedStrategy === "avalanche" ? "var(--accent)" : "var(--border)"}`,
                    boxShadow:
                      selectedStrategy === "avalanche"
                        ? "0 0 24px var(--accent-glow)"
                        : "none",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: "var(--accent-glow)",
                      color: "var(--accent-text)",
                    }}
                  >
                    <TrendingUp size={20} className="icon-wireframe" />
                  </div>
                  <div
                    className="font-bold mb-1 text-[var(--card-foreground)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Avalanche
                  </div>
                  <div
                    className="text-xs md:text-sm"
                    style={{ color: "var(--secondary)" }}
                  >
                    Prioritizes highest-impact goals first to optimize outcome
                    speed.
                  </div>
                </button>

                <button
                  onClick={() => setSelectedStrategy("snowball")}
                  className="text-left p-4 rounded-xl md:rounded-2xl transition-all"
                  style={{
                    background:
                      selectedStrategy === "snowball"
                        ? "var(--tertiary-accent-subtle)"
                        : "var(--card)",
                    border: `1px solid ${selectedStrategy === "snowball" ? "var(--tertiary-accent)" : "var(--border)"}`,
                    boxShadow:
                      selectedStrategy === "snowball"
                        ? "0 0 24px var(--tertiary-accent-glow)"
                        : "none",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: "var(--tertiary-accent-subtle)",
                      color: "var(--tertiary-accent-text)",
                    }}
                  >
                    <Sparkles size={20} className="icon-wireframe" />
                  </div>
                  <div
                    className="font-bold mb-1 text-[var(--card-foreground)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Snowball
                  </div>
                  <div
                    className="text-xs md:text-sm"
                    style={{ color: "var(--secondary)" }}
                  >
                    Starts with smaller goals for faster wins and stronger
                    momentum.
                  </div>
                </button>
              </div>

              {/* ── Surplus Reserve Section ── */}
              <div
                className="p-4 rounded-xl md:rounded-2xl space-y-3"
                style={{
                  background: "var(--card)",
                  border: `1px solid ${surplusExceedsAvailable ? "var(--red)" : surplusExceeds75 ? "var(--amber)" : "var(--border)"}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "var(--accent-glow)",
                      color: "var(--accent-text)",
                    }}
                  >
                    <Wallet size={16} />
                  </div>
                  <div>
                    <div
                      className="text-sm font-semibold text-[var(--card-foreground)]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Monthly Surplus Reserve
                    </div>
                    <div
                      className="text-[10px] md:text-xs"
                      style={{ color: "var(--secondary)" }}
                    >
                      Amount to keep aside each month, unallocated to any goal
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <span
                    className="text-lg font-bold text-[var(--secondary)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    ₹
                  </span>
                  <input
                    type="text"
                    value={surplusAmount}
                    onChange={(e) =>
                      setSurplusAmount(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="0 (optional)"
                    className="flex-1 px-4 py-3 text-lg md:text-xl font-bold rounded-xl outline-none slashed-zero text-[var(--card-foreground)]"
                    style={{
                      fontFamily: "var(--font-display)",
                      background: "var(--surface-tint)",
                      border: `1px solid ${surplusExceedsAvailable ? "var(--red)" : surplusExceeds75 ? "var(--amber)" : "var(--border)"}`,
                    }}
                  />
                </div>

                {/* Available budget summary */}
                {surplusNum > 0 && (
                  <div
                    className="grid grid-cols-2 gap-2 text-xs pt-1"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <div
                      className="px-3 py-2 rounded-lg"
                      style={{
                        background: "var(--surface-tint)",
                        color: "var(--secondary)",
                      }}
                    >
                      <div className="font-medium mb-0.5">Available</div>
                      <div className="font-bold text-sm text-[var(--card-foreground)] slashed-zero">
                        ₹{availableForGoals.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div
                      className="px-3 py-2 rounded-lg"
                      style={{
                        background: surplusExceedsAvailable
                          ? "var(--red-subtle)"
                          : "var(--surface-tint)",
                        color: surplusExceedsAvailable
                          ? "var(--red-text)"
                          : "var(--secondary)",
                      }}
                    >
                      <div className="font-medium mb-0.5">For Goals</div>
                      <div className="font-bold text-sm slashed-zero">
                        ₹{remainingForGoals.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning: exceeds 75% of income */}
                {surplusExceeds75 && !surplusExceedsAvailable && !surplusExceedsIncome && (
                  <div
                    className="flex items-start gap-2 p-3 rounded-xl text-xs md:text-sm"
                    style={{
                      background: "var(--amber-subtle)",
                      color: "var(--amber-text)",
                      border: "1px solid var(--amber)",
                    }}
                  >
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <span style={{ fontFamily: "var(--font-body)" }}>
                      This is more than 75% of your income. It'll take significantly longer to achieve your goals with this much reserved.
                    </span>
                  </div>
                )}

                {/* Error: exceeds available budget */}
                {surplusExceedsAvailable && !surplusExceedsIncome && (
                  <div
                    className="flex items-start gap-2 p-3 rounded-xl text-xs md:text-sm"
                    style={{
                      background: "var(--red-subtle)",
                      color: "var(--red-text)",
                      border: "1px solid var(--red)",
                    }}
                  >
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <span style={{ fontFamily: "var(--font-body)" }}>
                      Surplus exceeds your available budget after expenses and debt (₹{availableForGoals.toLocaleString("en-IN")}). Nothing will be left for your goals.
                    </span>
                  </div>
                )}

                {/* Error: exceeds total income */}
                {surplusExceedsIncome && (
                  <div
                    className="flex items-start gap-2 p-3 rounded-xl text-xs md:text-sm"
                    style={{
                      background: "var(--red-subtle)",
                      color: "var(--red-text)",
                      border: "1px solid var(--red)",
                    }}
                  >
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <span style={{ fontFamily: "var(--font-body)" }}>
                      This amount exceeds your total monthly income of ₹{_incomeINR.toLocaleString("en-IN")}. Please enter a realistic amount.
                    </span>
                  </div>
                )}
              </div>
            </div>
          );})()}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 md:gap-3 mt-auto pt-2 md:pt-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-3 md:px-6 md:py-4 rounded-full font-medium flex items-center gap-2 transition-all hover:scale-105 text-[var(--card-foreground)]"
              style={{
                fontFamily: "var(--font-body)",
                background: "var(--card)",
                boxShadow: "var(--shadow-sm)",
                border: "1px solid var(--border)",
              }}
            >
              <ArrowLeft
                size={16}
                className="icon-wireframe md:w-[18px] md:h-[18px]"
              />
              <span className="text-sm md:text-base hidden sm:inline">
                Back
              </span>
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all hover:scale-105"
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--on-accent)",
              fontFamily: "var(--font-body)",
              boxShadow: "0 10px 40px var(--accent-glow)",
            }}
          >
            <span className="text-sm md:text-base">
              {step < steps.length - 1 ? "Continue" : "Finish"}
            </span>
            <ArrowRight size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
