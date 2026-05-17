import { useRef } from "react";
import { Wallet } from "lucide-react";
import type { IncomeProfile } from "@/lib/types";
import { DRAG_CLICK_THRESHOLD } from "./constants";

interface JourneyIncomeNodeProps {
  x: number;
  y: number;
  dragging: boolean;
  income: IncomeProfile;
  formatCurrency: (amount: number) => string;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent, nodeId: string) => void;
  onClick: () => void;
}

export default function JourneyIncomeNode({
  x,
  y,
  dragging,
  income,
  formatCurrency,
  onPointerDown,
  onClick,
}: JourneyIncomeNodeProps) {
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const sources = [
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
      className="absolute pointer-events-auto"
      style={{
        left: x,
        top: y,
        width: 220,
        transition: dragging ? "none" : "transform 0.2s ease",
      }}
      onMouseDown={(e) => {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        onPointerDown(e, "income");
      }}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        onPointerDown(e, "income");
      }}
      onMouseUp={(e) => {
        if (dragStartPos.current) {
          const moved = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);
          dragStartPos.current = null;
          if (moved <= DRAG_CLICK_THRESHOLD) onClick();
        }
      }}
      onTouchEnd={(e) => {
        if (dragStartPos.current && e.changedTouches.length > 0) {
          const t = e.changedTouches[0];
          const moved = Math.hypot(t.clientX - dragStartPos.current.x, t.clientY - dragStartPos.current.y);
          dragStartPos.current = null;
          if (moved <= DRAG_CLICK_THRESHOLD) onClick();
        }
      }}
    >
      <div
        className="p-4 rounded-2xl bento-card"
        style={{
          border: "2px solid var(--accent)",
          boxShadow: "0 0 20px var(--secondary-accent-glow), var(--shadow-md)",
          cursor: "pointer",
        }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 journey-node-icon">
          <Wallet size={24} className="icon-wireframe" />
        </div>
        <div className="font-bold mb-1 text-[var(--card-foreground)] font-body-family">
          Income
        </div>
        <div className="text-2xl font-bold mb-2 text-[var(--card-foreground)] font-display-family slashed-zero">
          {formatCurrency(total)}
        </div>
        <div className="text-xs text-[var(--secondary)] font-body-family">
          {sources.length > 1 ? `${sources.length} income streams` : "1 income source"}
        </div>
      </div>
    </div>
  );
}
