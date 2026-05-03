import { TrendingUp, Sparkles, Wallet, AlertTriangle } from "lucide-react";
import type { InvestmentStrategy } from "../../../lib/types";

// ── Types ────────────────────────────────────────────────
interface OnboardingStepStrategyProps {
  selectedStrategy: InvestmentStrategy;
  onChangeStrategy: (strategy: InvestmentStrategy) => void;
  stepUpEnabled: boolean;
  onToggleStepUp: () => void;
  surplusAmount: string;
  onChangeSurplusAmount: (value: string) => void;
  incomeINR: number;
  availableForGoals: number;
  surplusNum: number;
  surplusExceedsAvailable: boolean;
  surplusExceeds75: boolean;
  surplusExceedsIncome: boolean;
  remainingForGoals: number;
}

// ── Sub: Step-Up toggle ──────────────────────────────────
function StepUpToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <div
      className="mt-4 p-4 rounded-xl md:rounded-2xl border flex items-center justify-between cursor-pointer"
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggle(); }}
      style={{
        background: enabled ? "var(--accent-glow)" : "var(--surface-tint)",
        borderColor: enabled ? "var(--accent)" : "var(--border)",
      }}
    >
      <div>
        <h4 className="font-bold text-sm md:text-base text-[var(--card-foreground)]">
          Step-Up Plan (Recommended)
        </h4>
        <p className="text-xs md:text-sm text-[var(--secondary)] mt-1">
          Increment monthly goal payments as your salary grows
        </p>
      </div>
      <div
        className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${enabled ? "bg-[var(--accent)]" : "bg-[var(--surface-hover)]"}`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`}
        />
      </div>
    </div>
  );
}

// ── Sub: Strategy card ───────────────────────────────────
function StrategyCard({
  strategy,
  isSelected,
  onClick,
  icon,
  title,
  description,
  accentColor,
  accentSubtle,
  accentText,
  accentGlow,
  borderColor,
}: {
  strategy: InvestmentStrategy;
  isSelected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
  accentSubtle: string;
  accentText: string;
  accentGlow: string;
  borderColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left p-4 rounded-xl md:rounded-2xl transition-all"
      aria-pressed={isSelected}
      style={{
        background: isSelected ? accentSubtle : "var(--card)",
        border: `1px solid ${isSelected ? borderColor : "var(--border)"}`,
        boxShadow: isSelected ? `0 0 24px ${accentGlow}` : "none",
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ background: accentSubtle, color: accentText }}
      >
        {icon}
      </div>
      <div className="font-bold mb-1 text-[var(--card-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </div>
      <div className="text-xs md:text-sm" style={{ color: "var(--secondary)" }}>
        {description}
      </div>
    </button>
  );
}

// ── Sub: Surplus Reserve section ─────────────────────────
function SurplusReserveSection({
  surplusAmount,
  onChangeSurplusAmount,
  incomeINR,
  availableForGoals,
  surplusNum,
  surplusExceedsAvailable,
  surplusExceeds75,
  surplusExceedsIncome,
  remainingForGoals,
}: {
  surplusAmount: string;
  onChangeSurplusAmount: (v: string) => void;
  incomeINR: number;
  availableForGoals: number;
  surplusNum: number;
  surplusExceedsAvailable: boolean;
  surplusExceeds75: boolean;
  surplusExceedsIncome: boolean;
  remainingForGoals: number;
}) {
  const borderColor = surplusExceedsIncome || surplusExceedsAvailable
    ? "var(--red)"
    : surplusExceeds75
      ? "var(--amber)"
      : "var(--border)";

  const inputBorderColor = surplusExceedsAvailable || surplusExceedsIncome
    ? "var(--red)"
    : surplusExceeds75
      ? "var(--amber)"
      : "var(--border)";

  return (
    <div
      className="p-4 rounded-xl md:rounded-2xl space-y-3"
      style={{
        background: "var(--card)",
        border: `1px solid ${borderColor}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent-glow)", color: "var(--accent-text)" }}
        >
          <Wallet size={16} />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--card-foreground)]" style={{ fontFamily: "var(--font-body)" }}>
            Monthly Surplus Reserve
          </div>
          <div className="text-[10px] md:text-xs" style={{ color: "var(--secondary)" }}>
            Amount to keep aside each month, unallocated to any goal
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-lg font-bold text-[var(--secondary)]" style={{ fontFamily: "var(--font-display)" }}>
          ₹
        </span>
        <input
          type="text"
          value={surplusAmount}
          onChange={(e) => onChangeSurplusAmount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="0 (optional)"
          className="flex-1 px-4 py-3 text-lg md:text-xl font-bold rounded-xl outline-none slashed-zero text-[var(--card-foreground)]"
          style={{
            fontFamily: "var(--font-display)",
            background: "var(--surface-tint)",
            border: `1px solid ${inputBorderColor}`,
          }}
          inputMode="numeric"
          aria-label="Monthly surplus reserve amount"
        />
      </div>

      {/* Available budget summary */}
      {surplusNum > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs pt-1" style={{ fontFamily: "var(--font-body)" }}>
          <div className="px-3 py-2 rounded-lg" style={{ background: "var(--surface-tint)", color: "var(--secondary)" }}>
            <div className="font-medium mb-0.5">Available</div>
            <div className="font-bold text-sm text-[var(--card-foreground)] slashed-zero">
              ₹{availableForGoals.toLocaleString("en-IN")}
            </div>
          </div>
          <div
            className="px-3 py-2 rounded-lg"
            style={{
              background: surplusExceedsAvailable ? "var(--red-subtle)" : "var(--surface-tint)",
              color: surplusExceedsAvailable ? "var(--red-text)" : "var(--secondary)",
            }}
          >
            <div className="font-medium mb-0.5">For Goals</div>
            <div className="font-bold text-sm slashed-zero">
              ₹{remainingForGoals.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {/* Warning: exceeds 75% of income (but not available budget) */}
      {surplusExceeds75 && !surplusExceedsAvailable && !surplusExceedsIncome && (
        <WarningBox
          type="warning"
          text={`This is more than 75% of your income. It'll take significantly longer to achieve your goals with this much reserved.`}
        />
      )}

      {/* Error: exceeds available budget (but not income) */}
      {surplusExceedsAvailable && !surplusExceedsIncome && (
        <WarningBox
          type="error"
          text={`Surplus exceeds your available budget after expenses and debt (₹${availableForGoals.toLocaleString("en-IN")}). Nothing will be left for your goals.`}
        />
      )}

      {/* Error: exceeds total income */}
      {surplusExceedsIncome && (
        <WarningBox
          type="error"
          text={`This amount exceeds your total monthly income of ₹${incomeINR.toLocaleString("en-IN")}. Please enter a realistic amount.`}
        />
      )}
    </div>
  );
}

// ── Sub: Warning/Error banner ────────────────────────────
function WarningBox({ type, text }: { type: "error" | "warning"; text: string }) {
  const isError = type === "error";
  return (
    <div
      className="flex items-start gap-2 p-3 rounded-xl text-xs md:text-sm"
      style={{
        background: isError ? "var(--red-subtle)" : "var(--amber-subtle)",
        color: isError ? "var(--red-text)" : "var(--amber-text)",
        border: `1px solid ${isError ? "var(--red)" : "var(--amber)"}`,
      }}
      role="alert"
    >
      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
      <span style={{ fontFamily: "var(--font-body)" }}>{text}</span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────
export default function OnboardingStepStrategy({
  selectedStrategy,
  onChangeStrategy,
  stepUpEnabled,
  onToggleStepUp,
  surplusAmount,
  onChangeSurplusAmount,
  incomeINR,
  availableForGoals,
  surplusNum,
  surplusExceedsAvailable,
  surplusExceeds75,
  surplusExceedsIncome,
  remainingForGoals,
}: OnboardingStepStrategyProps) {
  return (
    <div className="space-y-4 md:space-y-5">
      {/* Info banner */}
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

      {/* Step-Up toggle */}
      <StepUpToggle enabled={stepUpEnabled} onToggle={onToggleStepUp} />

      {/* Strategy cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <StrategyCard
          strategy="avalanche"
          isSelected={selectedStrategy === "avalanche"}
          onClick={() => onChangeStrategy("avalanche")}
          icon={<TrendingUp size={20} className="icon-wireframe" />}
          title="Avalanche"
          description="Prioritizes highest-impact goals first to optimize outcome speed."
          accentColor="var(--accent)"
          accentSubtle="var(--accent-glow)"
          accentText="var(--accent-text)"
          accentGlow="var(--accent-glow)"
          borderColor="var(--accent)"
        />

        <StrategyCard
          strategy="snowball"
          isSelected={selectedStrategy === "snowball"}
          onClick={() => onChangeStrategy("snowball")}
          icon={<Sparkles size={20} className="icon-wireframe" />}
          title="Snowball"
          description="Starts with smaller goals for faster wins and stronger momentum."
          accentColor="var(--tertiary-accent)"
          accentSubtle="var(--tertiary-accent-subtle)"
          accentText="var(--tertiary-accent-text)"
          accentGlow="var(--tertiary-accent-glow)"
          borderColor="var(--tertiary-accent)"
        />
      </div>

      {/* Surplus Reserve */}
      <SurplusReserveSection
        surplusAmount={surplusAmount}
        onChangeSurplusAmount={onChangeSurplusAmount}
        incomeINR={incomeINR}
        availableForGoals={availableForGoals}
        surplusNum={surplusNum}
        surplusExceedsAvailable={surplusExceedsAvailable}
        surplusExceeds75={surplusExceeds75}
        surplusExceedsIncome={surplusExceedsIncome}
        remainingForGoals={remainingForGoals}
      />
    </div>
  );
}