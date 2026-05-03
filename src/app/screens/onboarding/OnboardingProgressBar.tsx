// ── Types ────────────────────────────────────────────────
interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

// ── Component ────────────────────────────────────────────
export default function OnboardingProgressBar({ currentStep, totalSteps }: OnboardingProgressBarProps) {
  return (
    <div className="flex gap-2 mb-4 md:mb-6" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${currentStep + 1} of ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className="h-1.5 md:h-2 flex-1 rounded-full transition-all duration-500"
          style={{
            background: i <= currentStep ? "var(--accent)" : "var(--progress-inactive)",
            boxShadow: i <= currentStep ? "0 0 20px var(--accent)" : "none",
          }}
        />
      ))}
    </div>
  );
}