import { Wallet } from "lucide-react";

interface JourneyIncomeNodeProps {
  x: number;
  y: number;
  dragging: boolean;
  incomeTotal: number;
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
  incomeTotal,
  formatCurrency,
  onPointerDown,
}: JourneyIncomeNodeProps) {
  return (
    <div
      className="absolute cursor-pointer hover:scale-105 pointer-events-auto"
      style={{
        left: x,
        top: y,
        width: 200,
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
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
          style={{
            background:
              "color-mix(in srgb, var(--surface-hover) 80%, transparent)",
            color: "var(--accent)",
          }}
        >
          <Wallet size={24} className="icon-wireframe" />
        </div>
        <div
          className="font-bold mb-1 text-[var(--card-foreground)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Income
        </div>
        <div
          className="text-2xl font-bold mb-2 text-[var(--card-foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {formatCurrency(incomeTotal)}
        </div>
        <div
          className="text-xs mb-2 text-[var(--secondary)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          100% — Source
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
      </div>
    </div>
  );
}
