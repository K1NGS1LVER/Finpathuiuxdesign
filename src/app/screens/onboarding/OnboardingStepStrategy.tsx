import { TrendingUp, Sparkles, Wallet, AlertTriangle, ArrowUpRight, Calendar } from "lucide-react";
import type { InvestmentStrategy } from '@/lib/types';

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
  surplusExceedsIncome: boolean;
  remainingForGoals: number;
}

function StepUpToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <div
      className="p-5 md:p-6 rounded-xl md:rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all hover:border-[var(--accent)]"
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
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: enabled ? "var(--accent)" : "var(--surface-hover)",
          color: enabled ? "var(--on-accent)" : "var(--accent-text)",
        }}
      >
        <ArrowUpRight size={22} className="icon-wireframe" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm md:text-base text-[var(--card-foreground)]" style={{ fontFamily: "var(--font-body)" }}>
          Step-Up Plan
        </h4>
        <p className="text-xs md:text-sm text-[var(--secondary)] mt-0.5">
          Automatically increase monthly goal contributions as your salary grows each year
        </p>
      </div>
      <div
        className={`w-12 h-7 rounded-full transition-colors relative flex items-center flex-shrink-0 ${enabled ? "bg-[var(--accent)]" : "bg-[var(--surface-hover)]"}`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md absolute transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}
        />
      </div>
    </div>
  );
}

function StrategyCard({
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
      className="text-left p-5 md:p-6 rounded-xl md:rounded-2xl transition-all"
      aria-pressed={isSelected}
      style={{
        background: isSelected ? accentSubtle : "var(--card)",
        border: `2px solid ${isSelected ? borderColor : "var(--border)"}`,
        boxShadow: isSelected ? `0 0 28px ${accentGlow}` : "none",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: accentSubtle, color: accentText }}
      >
        {icon}
      </div>
      <div className="font-bold mb-1.5 text-[var(--card-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </div>
      <div className="text-xs md:text-sm leading-relaxed" style={{ color: "var(--secondary)" }}>
        {description}
      </div>
    </button>
  );
}

function SurplusReserveSection({
  surplusAmount,
  onChangeSurplusAmount,
  availableForGoals,
  surplusNum,
  surplusExceedsAvailable,
  surplusExceedsIncome,
  remainingForGoals,
}: {
  surplusAmount: string;
  onChangeSurplusAmount: (v: string) => void;
  availableForGoals: number;
  surplusNum: number;
  surplusExceedsAvailable: boolean;
  surplusExceedsIncome: boolean;
  remainingForGoals: number;
}) {
  const hasWarning = surplusExceedsAvailable || surplusExceedsIncome;
  const inputBorderColor = hasWarning ? "var(--red)" : "var(--border)";

  return (
    <div
      className="p-5 md:p-6 rounded-xl md:rounded-2xl space-y-4"
      style={{
        background: "var(--surface-tint)",
        border: `2px solid ${hasWarning ? "var(--red)" : "var(--border)"}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-glow)", color: "var(--accent-text)" }}
        >
          <Wallet size={18} />
        </div>
        <div>
          <div className="text-sm md:text-base font-semibold text-[var(--card-foreground)]" style={{ fontFamily: "var(--font-body)" }}>
            Monthly Surplus Reserve
          </div>
          <div className="text-[10px] md:text-xs mt-0.5" style={{ color: "var(--secondary)" }}>
            Keep aside each month — remaining goes to your goals
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={surplusAmount}
          onChange={(e) => onChangeSurplusAmount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="0"
          className="flex-1 px-5 py-3 text-lg md:text-xl font-bold rounded-xl outline-none slashed-zero text-[var(--card-foreground)]"
          style={{
            fontFamily: "var(--font-display)",
            background: "var(--card)",
            border: `2px solid ${inputBorderColor}`,
          }}
          inputMode="numeric"
          aria-label="Monthly surplus reserve amount"
        />
        <span className="text-xs md:text-sm font-medium text-[var(--secondary)] flex-shrink-0">/month</span>
      </div>

      {surplusNum > 0 && (
        <div className="flex items-center gap-2 text-xs md:text-sm py-1" style={{ fontFamily: "var(--font-body)", color: "var(--secondary)" }}>
          <Calendar size={14} className="flex-shrink-0" />
          <span>
            <strong className="text-[var(--card-foreground)] slashed-zero">{remainingForGoals.toLocaleString("en-IN")}</strong> available for goals
            {" · "}
            <strong className="text-[var(--card-foreground)] slashed-zero">{surplusNum.toLocaleString("en-IN")}</strong> reserved
          </span>
        </div>
      )}

      {surplusExceedsAvailable && !surplusExceedsIncome && (
        <WarningBox type="error" text="This exceeds your available budget. Nothing will be left for your goals." />
      )}
      {surplusExceedsIncome && (
        <WarningBox type="error" text="This exceeds your total monthly income. Please enter a realistic amount." />
      )}
    </div>
  );
}

function WarningBox({ type, text }: { type: "error" | "warning"; text: string }) {
  const isError = type === "error";
  return (
    <div
      className="flex items-start gap-2.5 p-3 rounded-xl text-xs md:text-sm"
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

export default function OnboardingStepStrategy({
  selectedStrategy, onChangeStrategy,
  stepUpEnabled, onToggleStepUp,
  surplusAmount, onChangeSurplusAmount,
  incomeINR, availableForGoals, surplusNum,
  surplusExceedsAvailable, surplusExceedsIncome, remainingForGoals,
}: OnboardingStepStrategyProps) {
  return (
    <div className="space-y-5 md:space-y-6">
      <div
        className="p-4 rounded-xl md:rounded-2xl text-xs md:text-sm"
        style={{ background: "var(--surface-tint)", border: "1px solid var(--border)", color: "var(--secondary)" }}
      >
        You have <strong className="text-[var(--card-foreground)] slashed-zero">{availableForGoals.toLocaleString("en-IN")}</strong> available for goals after expenses and debt.
      </div>

      <StepUpToggle enabled={stepUpEnabled} onToggle={onToggleStepUp} />

      <div className="space-y-1.5">
        <label className="text-xs md:text-sm font-semibold" style={{ color: "var(--secondary)", fontFamily: "var(--font-body)" }}>
          Repayment Strategy
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <StrategyCard
            strategy="avalanche" isSelected={selectedStrategy === "avalanche"}
            onClick={() => onChangeStrategy("avalanche")}
            icon={<TrendingUp size={22} className="icon-wireframe" />}
            title="Avalanche"
            description="Prioritize highest-impact goals first for maximum efficiency."
            accentColor="var(--accent)" accentSubtle="var(--accent-glow)" accentText="var(--accent-text)" accentGlow="var(--accent-glow)" borderColor="var(--accent)"
          />
          <StrategyCard
            strategy="snowball" isSelected={selectedStrategy === "snowball"}
            onClick={() => onChangeStrategy("snowball")}
            icon={<Sparkles size={22} className="icon-wireframe" />}
            title="Snowball"
            description="Start with smaller goals for quick wins and momentum."
            accentColor="var(--tertiary-accent)" accentSubtle="var(--tertiary-accent-subtle)" accentText="var(--tertiary-accent-text)" accentGlow="var(--tertiary-accent-glow)" borderColor="var(--tertiary-accent)"
          />
        </div>
      </div>

      <SurplusReserveSection
        surplusAmount={surplusAmount} onChangeSurplusAmount={onChangeSurplusAmount}
        availableForGoals={availableForGoals} surplusNum={surplusNum}
        surplusExceedsAvailable={surplusExceedsAvailable} surplusExceedsIncome={surplusExceedsIncome}
        remainingForGoals={remainingForGoals}
      />
    </div>
  );
}