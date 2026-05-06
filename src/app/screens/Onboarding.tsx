import { Sun, Moon, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useOnboardingForm } from "./onboarding/useOnboardingForm";
import OnboardingProgressBar from "./onboarding/OnboardingProgressBar";
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
  { title: "What's your monthly income?", subtitle: "Include salary and all other sources" },
  { title: "Monthly expenses & debt?", subtitle: "Expenses, rent, bills, loans, and EMIs" },
  { title: "What are your top goals?", subtitle: "Pick first, second, and third priority goals" },
  { title: "How should Penny plan your journey?", subtitle: "Choose strategy, step-up, and surplus reserve" },
];

export default function Onboarding({ isDark, setIsDark }: OnboardingProps) {
  const navigate = useNavigate();
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
      className="h-[100dvh] w-full flex flex-col relative overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        input::placeholder { color: var(--secondary); opacity: 0.5; }
        select option { background-color: var(--card); color: var(--card-foreground); }
        .goal-option { transition: all 0.3s ease; }
        .goal-option:hover { box-shadow: 0 0 30px var(--accent-glow); transform: translateY(-2px); }
        .goal-option.selected { box-shadow: 0 0 40px var(--accent-glow); border-color: var(--accent); background: linear-gradient(135deg, var(--card) 0%, var(--accent-glow) 100%); }
      `}</style>

      <ExtractionPopup popup={form.extractionPopup} onClose={form.clearExtractionPopup} />

      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 md:top-6 md:left-6 px-4 py-2 md:px-5 md:py-2.5 rounded-full flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 z-20 text-xs md:text-sm font-semibold"
        style={{ background: "var(--surface-tint)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", color: "var(--secondary)" }}
      >
        <ArrowLeft size={16} className="icon-wireframe" />
        Back
      </button>

      <button
        type="button"
        onClick={() => setIsDark(!isDark)}
        className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 z-20"
        style={{ background: "var(--card)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", color: "var(--card-foreground)" }}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size={18} className="icon-wireframe md:w-5 md:h-5" /> : <Moon size={18} className="icon-wireframe md:w-5 md:h-5" />}
      </button>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[25%] left-[15%] w-[80vw] h-[50vh] max-w-[800px] rounded-full bg-[var(--accent)] opacity-[0.08] mix-blend-screen blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-[35%] right-[15%] w-[50vw] h-[60vh] max-w-[600px] rounded-full bg-[var(--secondary-accent)] opacity-[0.06] mix-blend-screen blur-[120px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-[20%] left-[50%] w-[55vw] h-[45vh] max-w-[700px] rounded-full bg-[var(--tertiary-accent)] opacity-[0.05] mix-blend-screen blur-[120px] -translate-x-1/2 translate-y-1/2" />
      </div>

      <header className="shrink-0 relative z-10 max-w-xl md:max-w-2xl w-full mx-auto px-4 md:px-0 pt-6 md:pt-8 pb-2">
        <OnboardingProgressBar currentStep={form.step} totalSteps={form.TOTAL_STEPS} />
      </header>

      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="min-h-full max-w-xl md:max-w-2xl w-full mx-auto px-4 md:px-0 py-12 md:py-20 flex flex-col">
          <div className="bento-card !p-5 md:!p-7 my-auto">
            <div className="text-center mb-5 md:mb-6">
              <h2
                className="text-2xl md:text-4xl font-bold slashed-zero leading-tight text-[var(--card-foreground)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {currentMeta.title}
              </h2>
              <p
                className="text-sm md:text-base mt-2 md:mt-3"
                style={{ color: "var(--secondary)", fontFamily: "var(--font-body)" }}
              >
                {currentMeta.subtitle}
              </p>
            </div>

            {form.step === 0 && (
              <OnboardingStepIncome
                income={form.income} onChangeIncome={form.setIncome}
                incomeCurrency={form.incomeCurrency} onChangeIncomeCurrency={form.setIncomeCurrency}
                expectedAnnualIncrement={form.expectedAnnualIncrement} onChangeExpectedAnnualIncrement={form.setExpectedAnnualIncrement}
                convertToINR={form.convertToINR} isExtracting={form.isExtracting} onFileUpload={handleFileForIncome}
              />
            )}

            {form.step === 1 && (
              <OnboardingStepExpensesDebt
                expensesCurrency={form.expensesCurrency} onChangeExpensesCurrency={form.setExpensesCurrency}
                totalExpenses={form.totalExpenses} onChangeManualTotalExpenses={form.setManualTotalExpenses}
                showExpenseBreakdown={form.showExpenseBreakdown} onToggleExpenseBreakdown={() => form.setShowExpenseBreakdown(!form.showExpenseBreakdown)}
                expenseBreakdown={form.expenseBreakdown} onChangeExpenseBreakdown={form.setExpenseBreakdown}
                onClearManualExpenses={() => form.setManualTotalExpenses(null)}
                debtCurrency={form.debtCurrency} onChangeDebtCurrency={form.setDebtCurrency}
                totalDebt={form.totalDebt} onChangeManualTotalDebt={form.setManualTotalDebt}
                showDebtBreakdown={form.showDebtBreakdown} onToggleDebtBreakdown={() => form.setShowDebtBreakdown(!form.showDebtBreakdown)}
                debtBreakdown={form.debtBreakdown} onChangeDebtBreakdown={form.setDebtBreakdown}
                onClearManualDebt={() => form.setManualTotalDebt(null)}
                convertToINR={form.convertToINR} isExtracting={form.isExtracting} onFileUpload={handleFileForDebt}
              />
            )}

            {form.step === 2 && (
              <OnboardingStepGoals
                selectedGoals={form.selectedGoals} sortedSelectedGoals={form.sortedSelectedGoals}
                goalSelectionCaption={form.goalSelectionCaption} getPriorityGlow={form.getPriorityGlow}
                onToggleGoal={form.toggleGoal} onUpdateGoalAmount={form.updateGoalAmount}
              />
            )}

            {form.step === 3 && (
              <OnboardingStepStrategy
                selectedStrategy={form.selectedStrategy} onChangeStrategy={form.setSelectedStrategy}
                stepUpEnabled={form.stepUpEnabled} onToggleStepUp={() => form.setStepUpEnabled(!form.stepUpEnabled)}
                surplusAmount={form.surplusAmount} onChangeSurplusAmount={form.setSurplusAmount}
                incomeINR={form.incomeINR} availableForGoals={form.availableForGoals}
                surplusNum={form.surplusNum} surplusExceedsAvailable={form.surplusExceedsAvailable}
                surplusExceedsIncome={form.surplusExceedsIncome} remainingForGoals={form.remainingForGoals}
              />
            )}
          </div>
        </div>
      </main>

      <footer
        className="shrink-0 relative z-10 max-w-xl md:max-w-2xl w-full mx-auto px-4 md:px-0 pb-4 md:pb-6 pt-2"
        style={{ background: "linear-gradient(to top, var(--background) 60%, transparent)" }}
      >
        <OnboardingNavigation
          step={form.step} totalSteps={form.TOTAL_STEPS} canAdvance={form.canAdvance()}
          onNext={() => { form.step < form.TOTAL_STEPS - 1 ? form.setStep(form.step + 1) : form.submitOnboarding(); }}
          onBack={form.goBack}
        />
      </footer>
    </div>
  );
}