import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useFinPathStore } from '@/lib/store';
import type { InvestmentStrategy, DebtItem } from '@/lib/types';
import { extractFromDocument } from '@/lib/document-extractor';
import { weightedAvgGrowth, avgVariabilityPercent } from './onboarding-helpers';

// ── New dynamic-array types ───────────────────────────────
export type IncomeType = 'salary' | 'freelance' | 'passive' | 'rental' | 'dividend' | 'other';

export interface IncomeItem {
  id: string;
  name: string;
  type: IncomeType;
  amount: string;
  growthRate: string;
  variabilityPercent: string;
}

export interface OnboardingDebtItem {
  id: string;
  name: string;
  category: DebtItem['category'];
  monthlyPayment: string;
  principal: string;
  interestRate: string;
}

export interface GoalSelection {
  targetAmount: string;
  priority: number;
  customName?: string;
}

export interface ExpenseBreakdown {
  rent: string;
  food: string;
  transport: string;
  utilities: string;
  entertainment: string;
  other: string;
}

export interface ExtractionPopupState {
  show: boolean;
  type: "success" | "error";
  message: string;
}

// Re-export helpers so any existing direct import from useOnboardingForm still resolves
export { weightedAvgGrowth, avgVariabilityPercent };

const EMPTY_EXPENSE_BREAKDOWN: ExpenseBreakdown = {
  rent: "", food: "", transport: "", utilities: "", entertainment: "", other: "",
};

const GOAL_PRESET_AMOUNTS: Record<string, number> = {
  "Dream Bike": 120000,
  "Investment": 500000,
  "Emergency Fund": 300000,
  "Wedding": 500000,
  "Vacation": 50000,
  "Upskill Course": 100000,
};

const TOTAL_STEPS = 4;
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"];
export const EMPTY_POPUP: ExtractionPopupState = { show: false, type: "success", message: "" };

function newIncomeItem(): IncomeItem {
  return { id: crypto.randomUUID(), name: "", type: "salary", amount: "", growthRate: "", variabilityPercent: "" };
}

export function newDebtItem(): OnboardingDebtItem {
  return { id: crypto.randomUUID(), name: "", category: "personalLoan", monthlyPayment: "", principal: "", interestRate: "" };
}

export function useOnboardingForm() {
  const [step, setStep] = useState(0);

  const [incomeCurrency, setIncomeCurrency] = useState("INR");
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>([newIncomeItem()]);

  const [expensesCurrency, setExpensesCurrency] = useState("INR");
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown>(EMPTY_EXPENSE_BREAKDOWN);
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [manualTotalExpenses, setManualTotalExpenses] = useState<string | null>(null);

  const [debtCurrency, setDebtCurrency] = useState("INR");
  const [debtItems, setDebtItems] = useState<OnboardingDebtItem[]>([]);

  const [selectedGoals, setSelectedGoals] = useState<Record<string, GoalSelection>>({});
  const [selectedStrategy, setSelectedStrategy] = useState<InvestmentStrategy>("avalanche");
  const [surplusAmount, setSurplusAmount] = useState("");
  const [stepUpEnabled, setStepUpEnabled] = useState(false);

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionPopup, setExtractionPopup] = useState<ExtractionPopupState>(EMPTY_POPUP);
  const [popupTimer, setPopupTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const completeOnboarding = useFinPathStore((s) => s.completeOnboarding);

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.exchangerate-api.com/v4/latest/INR")
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setExchangeRates(data.rates); })
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
      return (value / rate).toFixed(2);
    },
    [exchangeRates],
  );

  const totalIncomeINR = incomeItems.reduce(
    (s, i) => s + (parseFloat(convertToINR(i.amount, incomeCurrency)) || 0),
    0,
  );

  const totalDebtINR = debtItems.reduce(
    (s, d) => s + (parseFloat(convertToINR(d.monthlyPayment, debtCurrency)) || 0),
    0,
  );

  const calculatedTotalExpenses = Object.values(expenseBreakdown).reduce(
    (s, v) => s + (parseFloat(v) || 0), 0
  );
  const totalExpenses =
    manualTotalExpenses !== null ? manualTotalExpenses
      : calculatedTotalExpenses > 0 ? String(calculatedTotalExpenses)
      : "";

  const selectedGoalCount = Object.keys(selectedGoals).length;
  const sortedSelectedGoals = Object.entries(selectedGoals).sort(
    ([, a], [, b]) => a.priority - b.priority,
  );
  const goalSelectionCaption =
    selectedGoalCount === 0 ? "Select your 1st priority goal. Brightest glow = highest priority."
    : selectedGoalCount === 1 ? "Great. Now pick your 2nd priority goal. Glow intensity indicates priority."
    : selectedGoalCount === 2 ? "Pick your 3rd priority goal to complete your ranked set."
    : "Priority set complete. Bright glow = P1, medium = P2, soft = P3.";

  function getPriorityGlow(priority: number) {
    if (priority === 1) return "0 0 42px var(--accent-glow)";
    if (priority === 2) return "0 0 28px var(--accent-glow)";
    return "0 0 16px var(--accent-glow)";
  }

  const canAdvance = (): boolean => {
    if (step === 0) return totalIncomeINR > 0;
    if (step === 1) {
      const expNum = parseFloat(totalExpenses);
      return !isNaN(expNum) && expNum > 0;
    }
    if (step === 2) return selectedGoalCount > 0;
    if (step === 3) return (parseFloat(surplusAmount) || 0) <= totalIncomeINR;
    return true;
  };

  const goBack = useCallback(() => { if (step > 0) setStep(step - 1); }, [step]);

  const submitOnboarding = useCallback(() => {
    const passiveTypes: IncomeType[] = ['passive', 'rental', 'dividend'];
    const toINR = (amt: string, curr: string) => parseFloat(convertToINR(amt, curr)) || 0;

    const passiveItems = incomeItems.filter(i => passiveTypes.includes(i.type));
    const activeItems = incomeItems.filter(i => !passiveTypes.includes(i.type));
    const sortedActive = [...activeItems].sort(
      (a, b) => toINR(b.amount, incomeCurrency) - toINR(a.amount, incomeCurrency)
    );

    const primaryINR = sortedActive[0] ? toINR(sortedActive[0].amount, incomeCurrency) : 0;
    const secondaryINR = sortedActive.slice(1).reduce((s, i) => s + toINR(i.amount, incomeCurrency), 0);
    const passiveINR = passiveItems.reduce((s, i) => s + toINR(i.amount, incomeCurrency), 0);

    const expenseINR = parseFloat(convertToINR(totalExpenses, expensesCurrency)) || 0;
    const expBreakdown: Record<string, number> = {};
    for (const [k, v] of Object.entries(expenseBreakdown)) {
      expBreakdown[k] = parseFloat(v) || 0;
    }

    const builtDebtItems: DebtItem[] = debtItems
      .filter(d => toINR(d.monthlyPayment, debtCurrency) > 0)
      .map(d => ({
        id: d.id,
        name: d.name || d.category,
        category: d.category,
        principal: toINR(d.principal, debtCurrency),
        interestRate: parseFloat(d.interestRate) || 0,
        monthlyPayment: toINR(d.monthlyPayment, debtCurrency),
        remainingMonths: (() => {
          const P = toINR(d.principal, debtCurrency);
          const EMI = toINR(d.monthlyPayment, debtCurrency) || 1;
          const r = (parseFloat(d.interestRate) || 0) / 100 / 12;
          if (r === 0) return Math.ceil(P / EMI) || 0;
          const n = -Math.log(1 - (P * r) / EMI) / Math.log(1 + r);
          return isFinite(n) && n > 0 ? Math.ceil(n) : Math.ceil(P / EMI) || 0;
        })(),
      }));

    const formattedGoals = sortedSelectedGoals.map(([name, data]) => ({
      name: data.customName?.trim() || name,
      targetAmount: parseFloat(data.targetAmount) || 0,
      priority: data.priority,
    }));

    completeOnboarding({
      primaryIncome: primaryINR,
      secondaryIncome: secondaryINR,
      passiveIncome: passiveINR,
      variablePercent: avgVariabilityPercent(passiveItems),
      primaryIncrement: weightedAvgGrowth(sortedActive.slice(0, 1)),
      secondaryIncrement: weightedAvgGrowth(sortedActive.slice(1)),
      passiveIncrement: weightedAvgGrowth(passiveItems),
      expenses: expenseINR,
      debts: builtDebtItems.reduce((s, d) => s + d.monthlyPayment, 0),
      goals: formattedGoals,
      expenseBreakdown: expBreakdown,
      debtItems: builtDebtItems,
      strategy: selectedStrategy,
      surplus: parseFloat(surplusAmount) || 0,
      stepUpEnabled,
    });

    navigate("/loading");
  }, [
    incomeItems, incomeCurrency, totalIncomeINR,
    expenseBreakdown, expensesCurrency, totalExpenses,
    debtItems, debtCurrency,
    sortedSelectedGoals, selectedStrategy, surplusAmount, stepUpEnabled,
    convertToINR, completeOnboarding, navigate,
  ]);

  const toggleGoal = useCallback((goalName: string) => {
    setSelectedGoals((prev) => {
      const next = { ...prev };
      if (next[goalName]) {
        const removed = next[goalName].priority;
        delete next[goalName];
        for (const [n, d] of Object.entries(next)) {
          if (d.priority > removed) next[n] = { ...d, priority: d.priority - 1 };
        }
      } else if (Object.keys(next).length < 3) {
        const preset = GOAL_PRESET_AMOUNTS[goalName];
        next[goalName] = {
          targetAmount: preset ? String(preset) : "",
          priority: Object.keys(next).length + 1,
        };
      }
      return next;
    });
  }, []);

  const updateGoalAmount = useCallback((goalName: string, amount: string) => {
    setSelectedGoals((prev) => ({
      ...prev,
      [goalName]: {
        ...prev[goalName],
        targetAmount: amount.replace(/[^0-9]/g, ""),
        priority: prev[goalName]?.priority || 1,
      },
    }));
  }, []);

  const addCustomGoal = useCallback(() => {
    setSelectedGoals((prev) => {
      if (Object.keys(prev).length >= 3) return prev;
      const key = `custom-${Date.now()}`;
      return { ...prev, [key]: { targetAmount: "", priority: Object.keys(prev).length + 1, customName: "" } };
    });
  }, []);

  const removeCustomGoal = useCallback((key: string) => {
    setSelectedGoals((prev) => {
      const next = { ...prev };
      const removed = next[key]?.priority;
      delete next[key];
      if (removed !== undefined) {
        for (const [n, d] of Object.entries(next)) {
          if (d.priority > removed) next[n] = { ...d, priority: d.priority - 1 };
        }
      }
      return next;
    });
  }, []);

  const updateGoalName = useCallback((key: string, name: string) => {
    setSelectedGoals((prev) => ({ ...prev, [key]: { ...prev[key], customName: name } }));
  }, []);

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
            setIncomeItems((prev) => {
              const updated = [...prev];
              updated[0] = { ...updated[0], amount: String(result.data.income) };
              return updated;
            });
            setIncomeCurrency("INR");
          } else if (result.type === "debt") {
            const emi =
              result.data.emi ||
              (result.data.loanAmount ? Math.round(result.data.loanAmount / 120) : 0);
            if (emi > 0) {
              setDebtItems((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  name: result.data.loanType || "Loan",
                  category: "personalLoan" as const,
                  monthlyPayment: String(emi),
                  principal: String(result.data.loanAmount || 0),
                  interestRate: String(result.data.interestRate ?? ""),
                },
              ]);
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

  const customGoals = Object.entries(selectedGoals).filter(([key]) =>
    key.startsWith("custom-")
  ) as [string, GoalSelection][];
  const expenseINR = parseFloat(totalExpenses) || 0;
  const availableForGoals = Math.max(0, totalIncomeINR - expenseINR - totalDebtINR);
  const surplusNum = parseFloat(surplusAmount) || 0;
  const surplusExceedsAvailable = surplusNum > availableForGoals;
  const surplusExceeds75 = surplusNum > totalIncomeINR * 0.75;
  const surplusExceedsIncome = surplusNum > totalIncomeINR;
  const remainingForGoals = Math.max(0, availableForGoals - surplusNum);

  return {
    step, setStep, TOTAL_STEPS, goBack, canAdvance, submitOnboarding,
    incomeCurrency, setIncomeCurrency,
    incomeItems, setIncomeItems,
    totalIncomeINR,
    expensesCurrency, setExpensesCurrency,
    expenseBreakdown, setExpenseBreakdown,
    manualTotalExpenses, setManualTotalExpenses,
    showExpenseBreakdown, setShowExpenseBreakdown,
    totalExpenses,
    debtCurrency, setDebtCurrency,
    debtItems, setDebtItems,
    totalDebtINR,
    selectedGoals, selectedGoalCount, sortedSelectedGoals, customGoals,
    goalSelectionCaption, getPriorityGlow,
    toggleGoal, updateGoalAmount, addCustomGoal, removeCustomGoal, updateGoalName,
    selectedStrategy, setSelectedStrategy,
    surplusAmount, setSurplusAmount,
    stepUpEnabled, setStepUpEnabled,
    isExtracting, extractionPopup, clearExtractionPopup, handleFileUpload,
    incomeINR: totalIncomeINR,
    expenseINR,
    debtINR: totalDebtINR,
    availableForGoals, surplusNum,
    surplusExceedsAvailable, surplusExceeds75, surplusExceedsIncome,
    remainingForGoals,
    convertToINR,
  };
}
