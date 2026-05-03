import { Sun, Moon } from "lucide-react";
import { useOnboardingForm } from "./onboarding/useOnboardingForm";
import OnboardingProgressBar from "./onboarding/OnboardingProgressBar";
import OnboardingNavigation from "./onboarding/OnboardingNavigation";
import OnboardingStepIncome from "./onboarding/OnboardingStepIncome";
import OnboardingStepExpensesDebt from "./onboarding/OnboardingStepExpensesDebt";
import OnboardingStepGoals from "./onboarding/OnboardingStepGoals";
import OnboardingStepStrategy from "./onboarding/OnboardingStepStrategy";
import ExtractionPopup from "./onboarding/ExtractionPopup";

// ── Types ────────────────────────────────────────────────
interface OnboardingProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

// ── Step metadata ────────────────────────────────────────
const STEP_META = [
  {
    title: "What's your monthly income?",
    subtitle: "Include salary and all other sources",
  },
  {
    title: "Monthly expenses & debt?",
    subtitle: "Expenses, rent, bills, loans, and EMIs",
  },
  {
    title: "What are your top goals?",
    subtitle: "Pick first, second, and third priority goals",
  },
  {
    title: "Which strategy should Penny follow?",
    subtitle: "Choose avalanche or snowball for your journey",
  },
];

// ── Component ─────────────────────────────────────────────
export default function Onboarding({ isDark, setIsDark }: OnboardingProps) {
  const form = useOnboardingForm();

  const currentMeta = STEP_META[form.step];

  const handleFileForIncome = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.handleFileUpload(e, "income");
  };

  const handleFileForDebt = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.handleFileUpload(e, "debt");
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
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
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
      `}</style>

      {/* Extraction popup */}
      <ExtractionPopup popup={form.extractionPopup} />

      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setIsDark(!isDark)}
        className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 z-20 text-[var(--card-foreground)]"
        style={{
          background: "var(--card)",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--border)",
        }}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <Sun size={18} className="icon-wireframe md:w-5 md:h-5" />
        ) : (
          <Moon size={18} className="icon-wireframe md:w-5 md:h-5" />
        )}
      </button>

      {/* Background blobs */}
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
        {/* Step progress */}
        <OnboardingProgressBar currentStep={form.step} totalSteps={form.TOTAL_STEPS} />

        {/* Main card */}
        <div className="bento-card mb-4 flex-1 flex flex-col min-h-0 !p-4 md:!p-6">
          {/* Sticky header */}
          <div className="space-y-2 md:space-y-4 text-center mb-4 md:mb-6 shrink-0">
            <h2
              className="text-2xl md:text-4xl font-bold slashed-zero leading-tight text-[var(--card-foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {currentMeta.title}
            </h2>
            <p
              className="text-sm md:text-base"
              style={{ color: "var(--secondary)", fontFamily: "var(--font-body)" }}
            >
              {currentMeta.subtitle}
            </p>
          </div>

          {/* Scrollable step content */}
          <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
            {form.step === 0 && (
              <OnboardingStepIncome
                income={form.income}
                onChangeIncome={form.setIncome}
                incomeCurrency={form.incomeCurrency}
                onChangeIncomeCurrency={form.setIncomeCurrency}
                expectedAnnualIncrement={form.expectedAnnualIncrement}
                onChangeExpectedAnnualIncrement={form.setExpectedAnnualIncrement}
                convertToINR={form.convertToINR}
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
                onToggleExpenseBreakdown={() => form.setShowExpenseBreakdown(!form.showExpenseBreakdown)}
                expenseBreakdown={form.expenseBreakdown}
                onChangeExpenseBreakdown={form.setExpenseBreakdown}
                onClearManualExpenses={() => form.setManualTotalExpenses(null)}
                debtCurrency={form.debtCurrency}
                onChangeDebtCurrency={form.setDebtCurrency}
                totalDebt={form.totalDebt}
                onChangeManualTotalDebt={form.setManualTotalDebt}
                showDebtBreakdown={form.showDebtBreakdown}
                onToggleDebtBreakdown={() => form.setShowDebtBreakdown(!form.showDebtBreakdown)}
                debtBreakdown={form.debtBreakdown}
                onChangeDebtBreakdown={form.setDebtBreakdown}
                onClearManualDebt={() => form.setManualTotalDebt(null)}
                convertToINR={form.convertToINR}
                isExtracting={form.isExtracting}
                onFileUpload={handleFileForDebt}
              />
            )}

            {form.step === 2 && (
              <OnboardingStepGoals
                selectedGoals={form.selectedGoals}
                sortedSelectedGoals={form.sortedSelectedGoals}
                goalSelectionCaption={form.goalSelectionCaption}
                getPriorityGlow={form.getPriorityGlow}
                onToggleGoal={form.toggleGoal}
                onUpdateGoalAmount={form.updateGoalAmount}
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
                surplusExceeds75={form.surplusExceeds75}
                surplusExceedsIncome={form.surplusExceedsIncome}
                remainingForGoals={form.remainingForGoals}
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <OnboardingNavigation
          step={form.step}
          totalSteps={form.TOTAL_STEPS}
          canAdvance={form.canAdvance()}
          onNext={() => {
            if (form.step < form.TOTAL_STEPS - 1) {
              form.setStep(form.step + 1);
            } else {
              form.submitOnboarding();
            }
          }}
          onBack={form.goBack}
        />
      </div>
    </div>
  );
}