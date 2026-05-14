import { useState } from "react";
import { Wallet, ChevronDown, ChevronUp } from "lucide-react";
import type { IncomeProfile } from "@/lib/types";

interface JourneyIncomeNodeProps {
  x: number;
  y: number;
  dragging: boolean;
  income: IncomeProfile;
  formatCurrency: (amount: number) => string;
  onPointerDown: (
    e: React.MouseEvent | React.TouchEvent,
    nodeId: string,
  ) => void;
}

export default function JourneyIncomeNode({
  x,
  y,
  dragging,
  income,
  formatCurrency,
  onPointerDown,
}: JourneyIncomeNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const sources = [
    { label: "Primary", value: income.primary || 0 },
    { label: "Secondary", value: income.secondary || 0 },
    { label: "Passive", value: income.passive || 0 },
    {
      label: income.variablePercent > 0
        ? `Variable (${income.variablePercent}%)`
        : "Variable",
      value: income.variable || 0,
    },
  ].filter((s) => s.value > 0);

  const hasMultiple = sources.length > 1;
  const total = income.total || 0;

  const handleToggle = (e: React.MouseEvent) => {
    if (!dragging && hasMultiple) {
      e.stopPropagation();
      setExpanded((prev) => !prev);
    }
  };

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: x,
        top: y,
        width: 220,
        transition: dragging ? "none" : "transform 0.2s ease",
      }}
      onMouseDown={(e) => onPointerDown(e, "income")}
      onTouchStart={(e) => onPointerDown(e, "income")}
    >
      <div
        className="p-4 rounded-2xl bento-card"
        style={{
          border: "2px solid var(--accent)",
          boxShadow: "0 0 20px var(--secondary-accent-glow), var(--shadow-md)",
          cursor: hasMultiple ? "pointer" : "grab",
        }}
        onClick={handleToggle}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center journey-node-icon">
            <Wallet size={24} className="icon-wireframe" />
          </div>
          {hasMultiple && (
            <button
              onClick={handleToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--secondary)] hover:text-[var(--card-foreground)] hover:bg-[var(--surface-hover)] transition-colors"
              aria-label={expanded ? "Collapse income breakdown" : "Expand income breakdown"}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        <div className="font-bold mb-1 text-[var(--card-foreground)] font-body-family">
          Income
        </div>
        <div className="text-2xl font-bold mb-2 text-[var(--card-foreground)] font-display-family slashed-zero">
          {formatCurrency(total)}
        </div>

        {!expanded && (
          <>
            <div className="text-xs mb-2 text-[var(--secondary)] font-body-family">
              {hasMultiple ? `${sources.length} streams` : "100% — Source"}
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--progress-inactive)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: "100%", backgroundColor: "var(--accent)" }}
              />
            </div>
          </>
        )}

        {expanded && hasMultiple && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {sources.map((s) => {
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div key={s.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--secondary)", fontWeight: "var(--font-weight-semibold)" }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--card-foreground)", fontWeight: "var(--font-weight-semibold)" }} className="slashed-zero">
                      {formatCurrency(s.value)} <span style={{ color: "var(--secondary)" }}>({pct}%)</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: "var(--radius-full)",
                      background: "var(--progress-inactive)",
                      overflow: "hidden",
                    }}
                  >
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
        )}
      </div>
    </div>
  );
}
