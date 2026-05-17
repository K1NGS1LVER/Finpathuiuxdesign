import { X, Wallet, TrendingUp } from "lucide-react";
import type { IncomeProfile } from "@/lib/types";

interface JourneyIncomeDetailPanelProps {
  income: IncomeProfile;
  onClose: () => void;
  formatCurrency: (n: number) => string;
}

export default function JourneyIncomeDetailPanel({
  income,
  onClose,
  formatCurrency,
}: JourneyIncomeDetailPanelProps) {
  if (!income) return null;

  const activeSources = [
    { label: "Primary", value: income.primary || 0 },
    { label: "Secondary", value: income.secondary || 0 },
    { label: "Passive", value: income.passive || 0 },
    {
      label: income.variablePercent > 0 ? `Variable (${income.variablePercent}%)` : "Variable",
      value: income.variable || 0,
    },
  ].filter((s) => s.value > 0);

  const total = income.total || 0;

  return (
    <div
      className="absolute top-0 right-0 h-full w-full md:w-[360px] p-4 md:p-6 space-y-5 shadow-2xl z-30 overflow-y-auto transform transition-transform duration-300 journey-detail-panel"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <h3 className="text-xl font-bold text-[var(--card-foreground)] font-display-family">
          Income
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--card-foreground)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center text-center py-4">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
          style={{
            background: "color-mix(in srgb, var(--accent) 15%, transparent)",
            color: "var(--accent)",
            boxShadow: "0 0 30px color-mix(in srgb, var(--accent) 30%, transparent)",
          }}
        >
          <Wallet size={40} className="icon-wireframe" strokeWidth={1.5} />
        </div>
        <div className="text-[13px] font-medium uppercase tracking-wider text-[var(--secondary)] mb-4">
          Monthly Income
        </div>
        <div
          className="text-4xl font-extrabold slashed-zero tracking-tight font-display-family"
          style={{ color: "var(--accent)" }}
        >
          {formatCurrency(total)}
        </div>
      </div>

      {/* Source stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {activeSources.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <div key={s.label} className="p-4 rounded-2xl stat-card">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 stat-icon-accent">
                <TrendingUp size={16} />
              </div>
              <div className="text-xs font-medium mb-1 text-[var(--secondary)]">{s.label}</div>
              <div className="text-lg font-bold text-[var(--card-foreground)] slashed-zero">
                {formatCurrency(s.value)}
              </div>
              <div className="text-xs text-[var(--secondary)] mt-0.5">{pct}% of total</div>
            </div>
          );
        })}
      </div>

      {/* Breakdown bars — only shown with multiple sources */}
      {activeSources.length > 1 && (
        <div className="p-4 rounded-2xl stat-card">
          <div className="text-xs font-medium mb-4 text-[var(--secondary)]">Income Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeSources.map((s) => {
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div key={s.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--secondary)", fontWeight: "var(--font-weight-semibold)" }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--card-foreground)", fontWeight: "var(--font-weight-semibold)" }} className="slashed-zero">
                      {formatCurrency(s.value)} <span style={{ color: "var(--secondary)" }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: "var(--radius-full)", background: "var(--progress-inactive)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "var(--accent)",
                        borderRadius: "var(--radius-full)",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-center pt-2" style={{ fontSize: "var(--text-2xs)", color: "var(--secondary)" }}>
        Edit income in Settings or via onboarding.
      </div>
    </div>
  );
}
