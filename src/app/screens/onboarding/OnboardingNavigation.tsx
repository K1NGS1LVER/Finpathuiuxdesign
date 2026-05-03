import { ArrowRight, ArrowLeft } from "lucide-react";

// ── Types ────────────────────────────────────────────────
interface OnboardingNavigationProps {
  step: number;
  totalSteps: number;
  canAdvance: boolean;
  onNext: () => void;
  onBack: () => void;
  submitLabel?: string;
}

// ── Component ────────────────────────────────────────────
export default function OnboardingNavigation({
  step,
  totalSteps,
  canAdvance,
  onNext,
  onBack,
  submitLabel = "Finish",
}: OnboardingNavigationProps) {
  return (
    <div className="flex gap-2 md:gap-3 mt-auto pt-2 md:pt-4">
      {step > 0 && (
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-3 md:px-6 md:py-4 rounded-full font-medium flex items-center gap-2 transition-all hover:scale-105 text-[var(--card-foreground)]"
          style={{
            fontFamily: "var(--font-body)",
            background: "var(--card)",
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--border)",
          }}
          aria-label="Go back to previous step"
        >
          <ArrowLeft size={16} className="icon-wireframe md:w-[18px] md:h-[18px]" />
          <span className="text-sm md:text-base hidden sm:inline">Back</span>
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance}
        className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--on-accent)",
          fontFamily: "var(--font-body)",
          boxShadow: canAdvance ? "0 10px 40px var(--accent-glow)" : "none",
        }}
        aria-label={step < totalSteps - 1 ? "Continue to next step" : "Finish onboarding"}
      >
        <span className="text-sm md:text-base">
          {step < totalSteps - 1 ? "Continue" : submitLabel}
        </span>
        <ArrowRight size={16} className="md:w-[18px] md:h-[18px]" />
      </button>
    </div>
  );
}