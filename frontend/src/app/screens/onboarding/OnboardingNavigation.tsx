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
          className="px-4 py-2.5 md:px-6 md:py-3 rounded-full font-semibold flex items-center gap-2 transition-all hover:scale-105 text-[var(--card-foreground)]"
          style={{
            fontFamily: "var(--font-body)",
            background: "var(--card)",
            boxShadow: "var(--shadow-sm)",
            border: "2px solid var(--border)",
          }}
          aria-label="Go back to previous step"
        >
          <ArrowLeft size={16} className="icon-wireframe" />
          <span className="text-sm md:text-base">Back</span>
        </button>
      ) : (
        <div aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance}
        className="px-4 py-2.5 md:px-6 md:py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--on-accent)",
          fontFamily: "var(--font-body)",
          border: "2px solid transparent",
          boxShadow: canAdvance ? "0 10px 40px var(--accent-glow)" : "none",
        }}
        aria-label={step < totalSteps - 1 ? "Continue to next step" : "Finish onboarding"}
      >
        <span className="text-sm md:text-base">
          {step < totalSteps - 1 ? "Continue" : submitLabel}
        </span>
        <ArrowRight size={16} className="icon-wireframe" />
      </button>
    </div>
  );
}