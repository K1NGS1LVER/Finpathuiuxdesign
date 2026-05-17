import { ArrowRight, ArrowLeft } from "lucide-react";

interface OnboardingNavigationProps {
  step: number;
  totalSteps: number;
  canAdvance: boolean;
  onNext: () => void;
  onBack: () => void;
  submitLabel?: string;
}

export default function OnboardingNavigation({
  step,
  totalSteps,
  canAdvance,
  onNext,
  onBack,
  submitLabel = "Finish",
}: OnboardingNavigationProps) {
  return (
    <div className="flex gap-2.5 md:gap-3 justify-between items-center">
      {step > 0 ? (
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-4 md:px-8 md:py-[18px] rounded-full font-semibold flex items-center gap-2 transition-all hover:scale-105 text-[var(--card-foreground)]"
          style={{
            fontFamily: "var(--font-body)",
            background: "var(--card)",
            boxShadow: "var(--shadow-sm)",
            border: "2px solid var(--border)",
          }}
          aria-label="Go back to previous step"
        >
          <ArrowLeft size={18} className="icon-wireframe md:w-[20px] md:h-[20px]" />
          <span className="text-base md:text-lg">Back</span>
        </button>
      ) : (
        <div aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance}
        className="px-6 py-4 md:px-8 md:py-[18px] rounded-full font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--on-accent)",
          fontFamily: "var(--font-body)",
          border: "2px solid transparent",
          boxShadow: canAdvance ? "0 10px 40px var(--accent-glow)" : "none",
        }}
        aria-label={step < totalSteps - 1 ? "Continue to next step" : "Finish onboarding"}
      >
        <span className="text-base md:text-lg">
          {step < totalSteps - 1 ? "Continue" : submitLabel}
        </span>
        <ArrowRight size={18} className="md:w-[20px] md:h-[20px]" />
      </button>
    </div>
  );
}