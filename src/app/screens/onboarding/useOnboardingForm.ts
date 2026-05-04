import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useFinPathStore } from '@/lib/store';
import type { InvestmentStrategy } from '@/lib/types';
import { extractFromDocument } from '@/lib/document-extractor';

// ── Types ────────────────────────────────────────────────
export interface GoalSelection {
  targetAmount: string;
  priority: number;
}

export interface ExpenseBreakdown {
  rent: string;
  food: string;
  transport: string;
  utilities: string;
  entertainment: string;
  other: string;
}

export interface DebtBreakdown {
  homeLoan: string;
  carLoan: string;
  personalLoan: string;
  creditCard: string;
  educationLoan: string;
  otherEMI: string;
}

export interface ExtractionPopupState {
  show: boolean;
  type: "success" | "error";
  message: string;
}

const EMPTY_EXPENSE_BREAKDOWN: ExpenseBreakdown = {
  rent: "",
  food: "",
  transport: "",
  utilities: "",
  entertainment: "",
  other: "",
};

const EMPTY_DEBT_BREAKDOWN: DebtBreakdown = {
  homeLoan: "",
  carLoan: "",
  personalLoan: "",
  creditCard: "",
  educationLoan: "",
  otherEMI: "",
};

const TOTAL_STEPS = 4;
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"];

export const EMPTY_POPUP: ExtractionPopupState = {
  show: false,
  type: "success",
  message: "",
};

// ── Helper: sum all values in a string-keyed record ──────
function calculateTotal(breakdown: Record<string, string>): string {
  const sum = Object.values(breakdown).reduce(
    (total, val) => total + (parseFloat(val) || 0),
    0,
  );
  return sum > 0 ? sum.toString() : "";
}

// ── The Hook ─────────────────────────────────────────────
export function useOnboardingForm() {
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [incomeCurrency, setIncomeCurrency] = useState("INR");
  const [expensesCurrency, setExpensesCurrency] = useState("INR");
  const [debtCurrency, setDebtCurrency] = useState("INR");
  const [selectedGoals, setSelectedGoals] = useState<Record<string, GoalSelection>>({});
  const [selectedStrategy, setSelectedStrategy] = useState<InvestmentStrategy>("avalanche");
  const [surplusAmount, setSurplusAmount] = useState("");
  const [expectedAnnualIncrement, setExpectedAnnualIncrement] = useState("");
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown>(EMPTY_EXPENSE_BREAKDOWN);
  const [debtBreakdown, setDebtBreakdown] = useState<DebtBreakdown>(EMPTY_DEBT_BREAKDOWN);
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [showDebtBreakdown, setShowDebtBreakdown] = useState(false);
  const [manualTotalExpenses, setManualTotalExpenses] = useState<string | null>(null);
  const [manualTotalDebt, setManualTotalDebt] = useState<string | null>(null);
  const [totalDebtPrincipal, setTotalDebtPrincipal] = useState("");

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionPopup, setExtractionPopup] = useState<ExtractionPopupState>(EMPTY_POPUP);
  const [popupTimer, setPopupTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const completeOnboarding = useFinPathStore((s) => s.completeOnboarding);

  // ── Derived values ─────────────────────────────────────
  const calculatedTotalExpenses = calculateTotal(expenseBreakdown);
  const totalExpenses =
    manualTotalExpenses !== null ? manualTotalExpenses
      : calculatedTotalExpenses === "0" ? ""
      : calculatedTotalExpenses;

  const calculatedTotalDebt = calculateTotal(debtBreakdown);
  const totalDebt =
    manualTotalDebt !== null ? manualTotalDebt
      : calculatedTotalDebt === "0" ? ""
      : calculatedTotalDebt;

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

  function getPriorityGlow(priority: number) {
    if (priority === 1) return "0 0 42px var(--accent-glow)";
    if (priority === 2) return "0 0 28px var(--accent-glow)";
    return "0 0 16px var(--accent-glow)";
  }

  // ── Currency conversion ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch("https://api.exchangerate-api.com/v4/latest/INR")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setExchangeRates(data.rates);
      })
      .catch((err) => console.error("Failed to fetch exchange rates:", err));
    return () => { cancelled = true; };
  }, []);

  const convertToINR = useCallback(
    (amount: string, currency: string): string => {
      if (!amount || currency === "INR") {
        const value = parseFloat(amount);
        if (isNaN(value)) return "";
        return value.toFixed(2);
      }
      const rate = exchangeRates[currency];
      if (!rate) return amount;
      const value = parseFloat(amount);
      if (isNaN(value)) return "";
      const inrRate = 1 / rate;
      return (value * inrRate).toFixed(2);
    },
    [exchangeRates],
  );

  // ── Step navigation + validation ───────────────────────
  const canAdvance = (): boolean => {
    if (step === 0) {
      const incomeNum = parseFloat(income);
      return !isNaN(incomeNum) && incomeNum > 0;
    }
    if (step === 1) {
      const expNum = parseFloat(totalExpenses);
      return !isNaN(expNum) && expNum > 0;
    }
    if (step === 2) {
      return Object.keys(selectedGoals).length > 0;
    }
    if (step === 3) {
      const incINR = parseFloat(income) || 0;
      const surplusNum = parseFloat(surplusAmount) || 0;
      if (surplusNum > incINR) return false;
      return true;
    }
    return true;
  };

  const goBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const submitOnboarding = useCallback(() => {
    const incomeINR = parseFloat(convertToINR(income, incomeCurrency)) || 0;
    const expenseINR = parseFloat(convertToINR(totalExpenses, expensesCurrency)) || 0;
    const debtINR = parseFloat(convertToINR(totalDebt, debtCurrency)) || 0;

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
      totalDebtPrincipal: parseFloat(convertToINR(totalDebtPrincipal, debtCurrency)) || 0,
      goals: formattedGoals,
      expenseBreakdown: expBreakdown,
      debtBreakdown: dbtBreakdown,
      strategy: selectedStrategy,
      surplus: parseFloat(surplusAmount) || 0,
      expectedAnnualIncrement: parseFloat(expectedAnnualIncrement) || 0,
      stepUpEnabled,
    });

    navigate("/loading");
  }, [
    income, incomeCurrency, totalExpenses, expensesCurrency, totalDebt, debtCurrency,
    expenseBreakdown, debtBreakdown, sortedSelectedGoals, selectedStrategy, surplusAmount,
    expectedAnnualIncrement, stepUpEnabled, totalDebtPrincipal,
    convertToINR, completeOnboarding, navigate,
  ]);

  // ── Goal management ────────────────────────────────────
  const toggleGoal = useCallback((goalName: string) => {
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
  }, []);

  const updateGoalAmount = useCallback((goalName: string, amount: string) => {
    setSelectedGoals((prev) => ({
      ...prev,
      [goalName]: {
        targetAmount: amount.replace(/[^0-9]/g, ""),
        priority: prev[goalName]?.priority || 1,
      },
    }));
  }, []);

  // ── File upload ────────────────────────────────────────
  const clearExtractionPopup = useCallback(() => {
    if (popupTimer) clearTimeout(popupTimer);
    setExtractionPopup(EMPTY_POPUP);
  }, [popupTimer]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, context: "income" | "debt") => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      clearExtractionPopup();
      setIsExtracting(true);

      try {
        const result = await extractFromDocument(file, context);

        if (result.success) {
          if (result.type === "salary" && result.data.income) {
            setIncome(String(result.data.income));
            setIncomeCurrency("INR");
          } else if (result.type === "debt") {
            if (result.data.emi) {
              setManualTotalDebt(String(result.data.emi));
              setDebtCurrency("INR");
            } else if (result.data.loanAmount) {
              const estimatedEMI = Math.round(result.data.loanAmount / 120);
              setManualTotalDebt(String(estimatedEMI));
              setDebtCurrency("INR");
            }
          }
        }

        setIsExtracting(false);
        setExtractionPopup({
          show: true,
          type: result.success ? "success" : "error",
          message: result.summary,
        });
      } catch (error: any) {
        setIsExtracting(false);
        setExtractionPopup({
          show: true,
          type: "error",
          message: `Error processing document: ${error.message || "Unknown error"}. Please enter details manually.`,
        });
      }

      const timer = setTimeout(() => {
        setExtractionPopup((prev) => ({ ...prev, show: false }));
      }, 6000);
      setPopupTimer(timer);
    },
    [clearExtractionPopup],
  );

  // ── Computed values for step 3 ─────────────────────────
  const incomeINR = parseFloat(income) || 0;
  const expenseINR = parseFloat(totalExpenses) || 0;
  const debtINR = parseFloat(totalDebt) || 0;
  const availableForGoals = Math.max(0, incomeINR - expenseINR - debtINR);
  const surplusNum = parseFloat(surplusAmount) || 0;
  const surplusExceedsAvailable = surplusNum > availableForGoals;
  const surplusExceeds75 = surplusNum > incomeINR * 0.75;
  const surplusExceedsIncome = surplusNum > incomeINR;
  const remainingForGoals = Math.max(0, availableForGoals - surplusNum);

  return {
    // Step navigation
    step,
    setStep,
    TOTAL_STEPS,
    goBack,
    canAdvance,
    submitOnboarding,
    // Income
    income,
    setIncome,
    incomeCurrency,
    setIncomeCurrency,
    expectedAnnualIncrement,
    setExpectedAnnualIncrement,
    // Expenses
    expensesCurrency,
    setExpensesCurrency,
    expenseBreakdown,
    setExpenseBreakdown,
    manualTotalExpenses,
    setManualTotalExpenses,
    showExpenseBreakdown,
    setShowExpenseBreakdown,
    totalExpenses,
    // Debt
    debtCurrency,
    setDebtCurrency,
    debtBreakdown,
    setDebtBreakdown,
    manualTotalDebt,
    setManualTotalDebt,
    showDebtBreakdown,
    setShowDebtBreakdown,
    totalDebt,
    totalDebtPrincipal,
    setTotalDebtPrincipal,
    // Goals
    selectedGoals,
    selectedGoalCount,
    sortedSelectedGoals,
    goalSelectionCaption,
    getPriorityGlow,
    toggleGoal,
    updateGoalAmount,
    // Strategy
    selectedStrategy,
    setSelectedStrategy,
    surplusAmount,
    setSurplusAmount,
    stepUpEnabled,
    setStepUpEnabled,
    // File extraction
    isExtracting,
    extractionPopup,
    clearExtractionPopup,
    handleFileUpload,
    // Computed for step 3
    incomeINR,
    expenseINR,
    debtINR,
    availableForGoals,
    surplusNum,
    surplusExceedsAvailable,
    surplusExceeds75,
    surplusExceedsIncome,
    remainingForGoals,
    // Currency conversion
    convertToINR,
  };
}