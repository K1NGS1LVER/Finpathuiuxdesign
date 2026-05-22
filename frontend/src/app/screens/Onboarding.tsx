import { useEffect, useRef } from "react";
import { Sun, Moon, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router";
import { useOnboardingForm } from "./onboarding/useOnboardingForm";
import OnboardingNavigation from "./onboarding/OnboardingNavigation";
import OnboardingStepIncome from "./onboarding/OnboardingStepIncome";
import OnboardingStepExpensesDebt from "./onboarding/OnboardingStepExpensesDebt";
import OnboardingStepGoals from "./onboarding/OnboardingStepGoals";
import OnboardingStepStrategy from "./onboarding/OnboardingStepStrategy";
import ExtractionPopup from "./onboarding/ExtractionPopup";

interface OnboardingProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

const STEP_META = [
  { eyebrow: "Step 1 of 4", title: "Income Sources",     subtitle: "Add every stream that hits your account", hint: "More sources = better sim accuracy" },
  { eyebrow: "Step 2 of 4", title: "Expenses & Debt",    subtitle: "Fixed costs, EMIs, and loan obligations",  hint: "Include all EMIs even if small" },
  { eyebrow: "Step 3 of 4", title: "Financial Goals",    subtitle: "What are you working towards?",            hint: "Pick up to 3, Penny tracks all" },
  { eyebrow: "Step 4 of 4", title: "Strategy & Surplus", subtitle: "How should Penny plan your journey?",      hint: "Change this any time in settings" },
];

function fmtINR(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${Math.round(n)}`;
}

export default function Onboarding({ isDark, setIsDark }: OnboardingProps) {
  const navigate = useNavigate();
  const form = useOnboardingForm();
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rightRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [form.step]);

  const handleFileForIncome = (e: React.ChangeEvent<HTMLInputElement>) =>
    form.handleFileUpload(e, "income");
  const handleFileForDebt = (e: React.ChangeEvent<HTMLInputElement>) =>
    form.handleFileUpload(e, "debt");

  const meta = STEP_META[form.step];
  const showSummary = form.totalIncomeINR > 0;
  const expensesINR = parseFloat(form.totalExpenses) || 0;
  const surplus = form.totalIncomeINR - expensesINR - form.totalDebtINR;

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-background overflow-hidden relative">
      <ExtractionPopup popup={form.extractionPopup} onClose={form.clearExtractionPopup} />

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.10] blur-[120px]"
          style={{ background: "var(--accent)", transform: "translate(-35%, -35%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.07] blur-[100px]"
          style={{ background: "var(--secondary-accent)", transform: "translate(30%, 30%)" }}
        />
      </div>

      {/* ── LEFT PANEL (desktop only) ── */}
      <aside
        className="hidden md:flex flex-col w-[320px] shrink-0 h-full border-r z-10 px-8 py-8 overflow-hidden"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Logo + Back */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <span className="font-bold" style={{ color: "#fff", fontSize: "var(--text-xs)" }}>F</span>
            </div>
            <span className="font-bold" style={{ fontSize: "var(--text-base)" }}>FinPath</span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="pill flex items-center gap-1.5 text-secondary hover:text-card-foreground transition-colors"
            style={{ fontSize: "var(--text-xs)" }}
          >
            <ArrowLeft size={14} className="icon-wireframe" />
            Back
          </button>
        </div>

        {/* Stepper */}
        <div className="flex flex-col mb-8">
          {STEP_META.map((sm, i) => {
            const completed = i < form.step;
            const current   = i === form.step;
            return (
              <div key={sm.title} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${current ? "pulse-ring" : ""}`}
                    style={{
                      fontSize: "var(--text-xs)",
                      background: completed || current ? "var(--accent)" : "var(--surface-tint)",
                      color:      completed || current ? "#fff"           : "var(--secondary)",
                    }}
                  >
                    {completed ? <Check size={14} /> : i + 1}
                  </div>
                  {i < 3 && (
                    <div
                      className="w-px h-8 mt-1 transition-all duration-300"
                      style={{ background: i < form.step ? "var(--accent)" : "var(--border)" }}
                    />
                  )}
                </div>
                <div className="pt-1.5 pb-1">
                  <p
                    className="leading-tight font-semibold transition-colors"
                    style={{
                      fontSize: "var(--text-xs)",
                      color: current   ? "var(--card-foreground)"
                           : completed ? "var(--secondary)"
                                       : "var(--muted-foreground)",
                    }}
                  >
                    {sm.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step heading */}
        <div className="mb-6">
          <p className="font-semibold mb-1" style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}>
            {meta.eyebrow}
          </p>
          <h2
            className="font-bold font-display leading-tight mb-1"
            style={{ fontSize: "var(--text-xl)", color: "var(--card-foreground)" }}
          >
            {meta.title}
          </h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}>{meta.subtitle}</p>
          {meta.hint && (
            <span
              className="inline-block mt-2 rounded-full font-semibold px-2.5 py-1"
              style={{
                fontSize: "var(--text-2xs)",
                background: "var(--accent-subtle)",
                color: "var(--accent)",
              }}
            >
              {meta.hint}
            </span>
          )}
        </div>

        {/* Live summary card — animates in once income entered */}
        {showSummary && (
          <div
            className="bento-card !p-4 mt-auto"
            style={{ animation: "summaryIn 0.4s ease forwards" }}
          >
            <p
              className="font-semibold uppercase tracking-wider mb-3"
              style={{ fontSize: "var(--text-2xs)", color: "var(--secondary)" }}
            >
              Live Summary
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}>Income</span>
                <span className="font-semibold" style={{ fontSize: "var(--text-xs)", color: "var(--card-foreground)" }}>
                  {fmtINR(form.totalIncomeINR)}
                </span>
              </div>
              {form.step >= 1 && expensesINR + form.totalDebtINR > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}>Exp + Debt</span>
                    <span className="font-semibold" style={{ fontSize: "var(--text-xs)", color: "var(--card-foreground)" }}>
                      {fmtINR(expensesINR + form.totalDebtINR)}
                    </span>
                  </div>
                  <div
                    className="flex justify-between items-center pt-2 border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}>Surplus</span>
                    <span
                      className="font-bold"
                      style={{
                        fontSize: "var(--text-xs)",
                        color: surplus >= 0 ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {fmtINR(surplus)}
                    </span>
                  </div>
                </>
              )}
              {form.step >= 2 && form.selectedGoalCount > 0 && (
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}>Goals</span>
                  <span className="font-semibold" style={{ fontSize: "var(--text-xs)", color: "var(--card-foreground)" }}>
                    {form.selectedGoalCount} selected
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ── RIGHT PANEL ── */}
      <div ref={rightRef} className="flex-1 h-full overflow-y-auto relative z-10">
        {/* Theme toggle — desktop */}
        <button
          type="button"
          onClick={() => setIsDark(!isDark)}
          className="hidden md:flex absolute top-6 right-6 items-center justify-center w-9 h-9 rounded-full border bg-surface-tint hover:bg-card transition-colors z-20"
          style={{ borderColor: "var(--border)" }}
          aria-label="Toggle theme"
        >
          {isDark
            ? <Sun  size={16} className="icon-wireframe" />
            : <Moon size={16} className="icon-wireframe" />}
        </button>

        {/* Mobile top bar */}
        <div className="flex md:hidden items-center justify-between px-4 pt-5 pb-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 transition-colors"
            style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}
          >
            <ArrowLeft size={14} className="icon-wireframe" /> Back
          </button>
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <span className="font-bold" style={{ color: "#fff", fontSize: "var(--text-xs)" }}>F</span>
            </div>
            <span className="font-bold" style={{ fontSize: "var(--text-sm)" }}>FinPath</span>
          </div>
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="w-8 h-8 rounded-full border flex items-center justify-center"
            style={{ borderColor: "var(--border)", background: "var(--surface-tint)" }}
          >
            {isDark ? <Sun size={14} className="icon-wireframe" /> : <Moon size={14} className="icon-wireframe" />}
          </button>
        </div>

        {/* Mobile progress pills */}
        <div className="flex md:hidden gap-1.5 px-4 pb-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: i <= form.step ? "var(--accent)" : "var(--surface-tint)" }}
            />
          ))}
        </div>

        {/* Mobile step heading */}
        <div className="md:hidden px-4 pb-3">
          <p className="font-semibold mb-0.5" style={{ fontSize: "var(--text-2xs)", color: "var(--secondary)" }}>
            {meta.eyebrow}
          </p>
          <h2 className="font-bold font-display" style={{ fontSize: "var(--text-xl)", color: "var(--card-foreground)" }}>
            {meta.title}
          </h2>
          <p className="mt-1" style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}>
            {meta.subtitle}
          </p>
        </div>

        {/* Form area */}
        <div className="flex flex-col items-center px-4 md:px-8 lg:px-12 pb-16 pt-2 md:pt-16">
          <div className="max-w-[480px] w-full">
            <p
              className="hidden md:block mb-4"
              style={{ fontSize: "var(--text-xs)", color: "var(--secondary)" }}
            >
              Step {form.step + 1} of {form.TOTAL_STEPS} ·{" "}
              {form.TOTAL_STEPS - form.step - 1} step
              {form.TOTAL_STEPS - form.step - 1 !== 1 ? "s" : ""} remaining
            </p>

            <div
              className="bento-card !p-5 md:!p-7"
              key={form.step}
              style={{ animation: "fadeSlide 0.4s cubic-bezier(0.22,1,0.36,1) forwards" }}
            >
              {form.step === 0 && (
                <OnboardingStepIncome
                  incomeItems={form.incomeItems}
                  onChangeIncomeItems={form.setIncomeItems}
                  incomeCurrency={form.incomeCurrency}
                  onChangeIncomeCurrency={form.setIncomeCurrency}
                  totalIncomeINR={form.totalIncomeINR}
                  isExtracting={form.isExtracting}
                  onFileUpload={handleFileForIncome}
                />
              )}

              {form.step === 1 && (
                <OnboardingStepExpensesDebt
                  expensesCurrency={form.expensesCurrency}
                  onChangeExpensesCurrency={form.setExpensesCurrency}
                  totalExpenses={form.totalExpenses}
                  onChangeManualTotalExpenses={form.setManualTotalExpenses}
                  showExpenseBreakdown={form.showExpenseBreakdown}
                  onToggleExpenseBreakdown={() =>
                    form.setShowExpenseBreakdown(!form.showExpenseBreakdown)
                  }
                  expenseBreakdown={form.expenseBreakdown}
                  onChangeExpenseBreakdown={form.setExpenseBreakdown}
                  onClearManualExpenses={() => form.setManualTotalExpenses(null)}
                  debtCurrency={form.debtCurrency}
                  onChangeDebtCurrency={form.setDebtCurrency}
                  debtItems={form.debtItems}
                  onChangeDebtItems={form.setDebtItems}
                  totalDebtINR={form.totalDebtINR}
                  totalExpensesINR={parseFloat(form.totalExpenses) || 0}
                  incomeINR={form.totalIncomeINR}
                  convertToINR={form.convertToINR}
                  isExtracting={form.isExtracting}
                  onFileUpload={handleFileForDebt}
                />
              )}

              {form.step === 2 && (
                <OnboardingStepGoals
                  selectedGoals={form.selectedGoals}
                  sortedSelectedGoals={form.sortedSelectedGoals}
                  customGoals={form.customGoals}
                  goalSelectionCaption={form.goalSelectionCaption}
                  getPriorityGlow={form.getPriorityGlow}
                  onToggleGoal={form.toggleGoal}
                  onUpdateGoalAmount={form.updateGoalAmount}
                  onAddCustomGoal={form.addCustomGoal}
                  onUpdateGoalName={form.updateGoalName}
                  onRemoveCustomGoal={form.removeCustomGoal}
                />
              )}

              {form.step === 3 && (
                <OnboardingStepStrategy
                  selectedStrategy={form.selectedStrategy}
                  onChangeStrategy={form.setSelectedStrategy}
                  stepUpEnabled={form.stepUpEnabled}
                  onToggleStepUp={() => form.setStepUpEnabled(!form.stepUpEnabled)}
                  surplusAmount={form.surplusAmount}
                  onChangeSurplusAmount={form.setSurplusAmount}
                  incomeINR={form.incomeINR}
                  availableForGoals={form.availableForGoals}
                  surplusNum={form.surplusNum}
                  surplusExceedsAvailable={form.surplusExceedsAvailable}
                  surplusExceedsIncome={form.surplusExceedsIncome}
                  remainingForGoals={form.remainingForGoals}
                />
              )}
            </div>

            <div className="mt-6">
              <OnboardingNavigation
                step={form.step}
                totalSteps={form.TOTAL_STEPS}
                canAdvance={form.canAdvance()}
                onNext={() =>
                  form.step < form.TOTAL_STEPS - 1
                    ? form.setStep(form.step + 1)
                    : form.submitOnboarding()
                }
                onBack={form.goBack}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes summaryIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        input::placeholder { color: var(--secondary); opacity: 0.5; }
        select option { background-color: var(--card); color: var(--card-foreground); }
        .goal-option { transition: all 0.3s ease; }
        .goal-option:hover { box-shadow: 0 0 30px var(--accent-glow); transform: translateY(-2px); }
        .goal-option.selected { box-shadow: 0 0 40px var(--accent-glow); border-color: var(--accent); background: linear-gradient(135deg, var(--card) 0%, var(--accent-glow) 100%); }
      `}</style>
    </div>
  );
}
