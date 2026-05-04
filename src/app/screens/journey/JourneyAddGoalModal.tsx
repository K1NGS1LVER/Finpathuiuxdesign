import { X, AlertTriangle, Target, Bike, Plane, CreditCard, Home, Heart, TrendingUp, Shield, GraduationCap, Wallet } from "lucide-react";
import { GOAL_PRESETS } from "./useJourneyGoals";
import type { Goal } from '@/lib/types';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Bike,
  Plane,
  CreditCard,
  Home,
  Heart,
  Target,
  TrendingUp,
  Shield,
  GraduationCap,
  Wallet,
};

function getIcon(name: string) {
  return ICON_MAP[name] || Target;
}

interface JourneyAddGoalModalProps {
  show: boolean;
  onClose: () => void;
  storeGoals: Goal[];
  activeGoals: Goal[];
  monthlySurplus: number;
  existingMonthlyNeed: number;
  budgetRemaining: number;
  addGoalError: string;
  setAddGoalError: (err: string) => void;
  customName: string;
  setCustomName: (v: string) => void;
  customTarget: string;
  setCustomTarget: (v: string) => void;
  customMonths: string;
  setCustomMonths: (v: string) => void;
  onAddPreset: (preset: (typeof GOAL_PRESETS)[0]) => void;
  onAddCustom: () => void;
}

export default function JourneyAddGoalModal({
  show,
  onClose,
  storeGoals,
  activeGoals,
  monthlySurplus,
  existingMonthlyNeed,
  budgetRemaining,
  addGoalError,
  setAddGoalError,
  customName,
  setCustomName,
  customTarget,
  setCustomTarget,
  customMonths,
  setCustomMonths,
  onAddPreset,
  onAddCustom,
}: JourneyAddGoalModalProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bento-card w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden !p-0 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--border)] shrink-0">
          <h3
            className="text-xl font-bold text-[var(--card-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Add Goal
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--card-foreground)] hover:bg-[var(--surface-hover)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {budgetRemaining <= 0 && activeGoals.length > 0 && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-xs md:text-sm mb-4"
              style={{
                background: "var(--red-subtle)",
                color: "var(--red-text)",
                border: "1px solid var(--red)",
                fontFamily: "var(--font-body)",
              }}
            >
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-0.5">You're over budget</div>
                <span>
                  Your existing goals already need ₹{existingMonthlyNeed.toLocaleString("en-IN")}/mo but you only have ₹{Math.max(0, monthlySurplus).toLocaleString("en-IN")}/mo available after expenses, debt, and surplus reserve. Adding more goals will significantly extend your timeline.
                </span>
              </div>
            </div>
          )}
          {budgetRemaining > 0 && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-xs md:text-sm mb-4"
              style={{
                background: "var(--surface-tint)",
                border: "1px solid var(--border)",
                color: "var(--secondary)",
                fontFamily: "var(--font-body)",
              }}
            >
              <span>₹{budgetRemaining.toLocaleString("en-IN")}/mo available for new goals</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            {GOAL_PRESETS.filter(
              (p) => !storeGoals.some((g) => g.name === p.name),
            ).map((preset) => {
              const Icon = getIcon(preset.icon);
              const presetMonthly = Math.round(preset.target / preset.months);
              const wouldExceed = (existingMonthlyNeed + presetMonthly) > Math.max(0, monthlySurplus) && monthlySurplus > 0;
              return (
                <button
                  key={preset.name}
                  onClick={() => onAddPreset(preset)}
                  className={`p-4 rounded-xl text-left transition-all ${wouldExceed ? "opacity-60" : "hover:scale-[1.02] active:scale-[0.98]"}`}
                  style={{
                    background: "var(--surface-tint)",
                    border: wouldExceed ? "1px solid var(--red)" : "1px solid var(--border)",
                  }}
                >
                  <Icon
                    size={20}
                    className="mb-2"
                    style={{ color: wouldExceed ? "var(--red)" : "var(--accent)" }}
                  />
                  <div
                    className="text-sm font-semibold text-[var(--card-foreground)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {preset.name}
                  </div>
                  <div className="text-xs text-[var(--secondary)] mt-1">
                    ₹{(preset.target / 1000).toFixed(0)}K · {preset.months}mo
                  </div>
                  <div className={`text-[10px] mt-1 font-medium ${wouldExceed ? "text-[var(--red-text)]" : "text-[var(--secondary)]"}`}>
                    ₹{presetMonthly.toLocaleString("en-IN")}/mo needed
                  </div>
                </button>
              );
            })}
          </div>

          <div
            className="space-y-3"
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "1rem",
            }}
          >
            <div
              className="text-sm font-semibold text-[var(--secondary)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Or create custom
            </div>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Goal name"
              className="w-full px-4 py-3 rounded-xl outline-none text-[var(--card-foreground)]"
              style={{
                background: "var(--surface-tint)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-body)",
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                placeholder="Target ₹"
                className="w-full px-4 py-3 rounded-xl outline-none text-[var(--card-foreground)]"
                style={{
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-body)",
                }}
              />
              <input
                type="number"
                value={customMonths}
                onChange={(e) => setCustomMonths(e.target.value)}
                placeholder="Months"
                className="w-full px-4 py-3 rounded-xl outline-none text-[var(--card-foreground)]"
                style={{
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>
            {customTarget && customMonths && (() => {
              const cTarget = parseInt(customTarget) || 0;
              const cMonths = parseInt(customMonths) || 12;
              const cMonthly = cTarget > 0 && cMonths > 0 ? Math.round(cTarget / cMonths) : 0;
              const available = Math.max(0, monthlySurplus);
              const totalAfter = existingMonthlyNeed + cMonthly;
              const impossible = cMonthly > available && available > 0;
              const overBudget = totalAfter > available && available > 0 && !impossible;

              if (impossible) {
                const minMonths = available > 0 ? Math.ceil(cTarget / available) : 0;
                return (
                  <div
                    className="flex items-start gap-2 p-3 rounded-xl text-xs"
                    style={{ background: "var(--red-subtle)", color: "var(--red-text)", border: "1px solid var(--red)" }}
                  >
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                      This needs ₹{cMonthly.toLocaleString("en-IN")}/mo but you only have ₹{available.toLocaleString("en-IN")}/mo.
                      {minMonths > 0 ? ` Minimum ${minMonths} months needed.` : ""}
                    </span>
                  </div>
                );
              }
              if (overBudget) {
                return (
                  <div
                    className="flex items-start gap-2 p-3 rounded-xl text-xs"
                    style={{ background: "var(--red-subtle)", color: "var(--red-text)", border: "1px solid var(--red)" }}
                  >
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                      Total goal commitments would be ₹{totalAfter.toLocaleString("en-IN")}/mo — over your ₹{available.toLocaleString("en-IN")}/mo budget. Remove an existing goal first.
                    </span>
                  </div>
                );
              }
              if (cMonthly > 0) {
                return (
                  <div className="text-xs px-1 text-[var(--secondary)]">
                    This goal needs ₹{cMonthly.toLocaleString("en-IN")}/mo · ₹{budgetRemaining > cMonthly ? (budgetRemaining - cMonthly).toLocaleString("en-IN") : "0"}/mo would remain
                  </div>
                );
              }
              return null;
            })()}

            {addGoalError && (
              <div
                className="flex items-start gap-2 p-3 rounded-xl text-xs"
                style={{ background: "var(--red-subtle)", color: "var(--red-text)", border: "1px solid var(--red)" }}
              >
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{addGoalError}</span>
              </div>
            )}

            <button
              onClick={onAddCustom}
              disabled={!customName.trim() || !customTarget.trim()}
              className="w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--on-accent)",
                fontFamily: "var(--font-body)",
              }}
            >
              Add Custom Goal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}