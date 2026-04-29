import { useState, useRef, useMemo } from "react";
import {
  Plus,
  X,
  Wallet,
  Bike,
  Plane,
  CreditCard,
  Home,
  Heart,
  Target,
  TrendingUp,
  Shield,
  GraduationCap,
  Calendar,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useFinPathStore } from "../../lib/store";
import { useNavigate } from "react-router";

const ICON_MAP: Record<string, any> = {
  Wallet,
  Bike,
  Plane,
  CreditCard,
  Home,
  Heart,
  Target,
  TrendingUp,
  Shield,
  GraduationCap,
};

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

const GOAL_PRESETS = [
  { name: "Dream Bike", icon: "Bike", target: 120000, months: 18 },
  { name: "Emergency Fund", icon: "Shield", target: 300000, months: 24 },
  { name: "Vacation", icon: "Plane", target: 50000, months: 6 },
  { name: "Investment", icon: "TrendingUp", target: 500000, months: 36 },
  { name: "Wedding", icon: "Heart", target: 500000, months: 24 },
  { name: "Upskill Course", icon: "GraduationCap", target: 100000, months: 12 },
  { name: "House Fund", icon: "Home", target: 2000000, months: 60 },
  { name: "Clear Debt", icon: "CreditCard", target: 100000, months: 12 },
];

export default function Journey() {
  const navigate = useNavigate();

  // ── Store (single source of truth) ──
  const storeGoals = useFinPathStore((s) => s.goals);
  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const debts = useFinPathStore((s) => s.debts);
  const monthlySurplusReserve = useFinPathStore((s) => s.monthlySurplusReserve);
  const addGoal = useFinPathStore((s) => s.addGoal);
  const setGoals = useFinPathStore((s) => s.setGoals);
  const completeGoal = useFinPathStore((s) => s.completeGoal);
  const removeGoal = useFinPathStore((s) => s.removeGoal);

  const sortedGoals = useMemo(
    () =>
      storeGoals.slice().sort((a, b) => {
        if (a.status === "complete" && b.status !== "complete") return 1;
        if (a.status !== "complete" && b.status === "complete") return -1;
        return a.priority - b.priority;
      }),
    [storeGoals],
  );

  const activeGoals = useMemo(
    () => sortedGoals.filter((goal) => goal.status !== "complete"),
    [sortedGoals],
  );

  // ── Local UI state (positions, drag, selection) ──
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const [customMonths, setCustomMonths] = useState("12");
  const [addGoalError, setAddGoalError] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Budget calculations for over-income warnings ──
  const monthlySurplus = income.total - expenses.total - debts.totalMonthly - monthlySurplusReserve;
  const existingMonthlyNeed = activeGoals
    .filter((g) => g.category !== "debt")
    .reduce((sum, g) => sum + Math.round((g.targetAmount - g.currentAmount) / Math.max(1, g.timelineMonths)), 0);
  const budgetRemaining = monthlySurplus - existingMonthlyNeed;

  // ── Build visual nodes directly from store ──
  const getNodePos = (id: string, index: number) => {
    if (positions[id]) return positions[id];
    // Default layout: income on left, goals in a grid on the right
    if (id === "income") return { x: 80, y: 200 };
    return {
      x: 350 + (index % 2) * 250,
      y: 80 + Math.floor(index / 2) * 200,
    };
  };

  const incomePos = getNodePos("income", 0);

  // ── Pointer Helpers ──
  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e)
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = (
    e: React.MouseEvent | React.TouchEvent,
    nodeId: string,
  ) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(nodeId);
    const rect = canvasRef.current?.getBoundingClientRect();
    const pos = getPointerPosition(e);
    const nodePos =
      nodeId === "income"
        ? incomePos
        : getNodePos(
            nodeId,
            sortedGoals.findIndex((g) => g.id === nodeId),
          );
    if (rect) {
      setDragOffset({
        x: (pos.x - rect.left) / zoom - nodePos.x - panOffset.x,
        y: (pos.y - rect.top) / zoom - nodePos.y - panOffset.y,
      });
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPointerPosition(e);
    if (dragging && canvasRef.current) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = (pos.x - rect.left) / zoom - dragOffset.x - panOffset.x;
      const newY = (pos.y - rect.top) / zoom - dragOffset.y - panOffset.y;
      setPositions((prev) => ({ ...prev, [dragging]: { x: newX, y: newY } }));
    } else if (isPanning) {
      e.preventDefault();
      const dx = pos.x - panStart.x;
      const dy = pos.y - panStart.y;
      setPanOffset((prev) => ({ x: prev.x + dx / zoom, y: prev.y + dy / zoom }));
      setPanStart({ x: pos.x, y: pos.y });
    }
  };

  
  const handleWheel = (e) => {
    // Zoom in/out with the wheel
    const zoomSpeed = 0.001;
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      
      setZoom((prevZoom) => {
        const newZoom = Math.min(Math.max(0.2, prevZoom - e.deltaY * zoomSpeed), 3);
        
        // Zoom around pointer
        setPanOffset((prevPan) => ({
          x: prevPan.x - (px / prevZoom - px / newZoom),
          y: prevPan.y - (py / prevZoom - py / newZoom),
        }));
        
        return newZoom;
      });
    }
  };

  const handlePointerUp = () => {
    setDragging(null);
    setIsPanning(false);
  };

  const handleCanvasPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target === canvasRef.current || target.closest("svg.canvas-bg")) {
      const pos = getPointerPosition(e);
      setIsPanning(true);
      setPanStart({ x: pos.x, y: pos.y });
    }
  };

  // ── Status color ──
  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "var(--accent)";
      case "in-progress":
        return "var(--amber)";
      default:
        return "var(--tertiary-accent)";
    }
  };

  const getStatusGlow = (status: string) => {
    switch (status) {
      case "complete":
        return "var(--accent-glow)";
      case "in-progress":
        return "var(--amber-subtle)";
      default:
        return "var(--tertiary-accent-glow)";
    }
  };

  const getPriorityGlow = (priority: number) => {
    if (priority <= 1) return "0 0 40px var(--accent-glow)";
    if (priority === 2) return "0 0 26px var(--accent-glow)";
    return "0 0 16px var(--accent-glow)";
  };

  // ── Handle complete ──
  const handleComplete = (goalId: string) => {
    completeGoal(goalId);
    setSelectedGoalId(null);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  // ── Handle delete ──
  const handleDelete = (goalId: string) => {
    removeGoal(goalId);
    setSelectedGoalId(null);
  };

  const handlePriorityChange = (goalId: string, newPriority: number) => {
    const targetGoal = activeGoals.find((goal) => goal.id === goalId);
    if (!targetGoal) return;

    const clampedPriority = Math.max(
      1,
      Math.min(newPriority, activeGoals.length),
    );
    const withoutTarget = activeGoals.filter((goal) => goal.id !== goalId);
    const nextActive = withoutTarget.slice();
    nextActive.splice(clampedPriority - 1, 0, {
      ...targetGoal,
      priority: clampedPriority,
    });

    const priorityById = new Map<string, number>();
    nextActive.forEach((goal, index) => {
      priorityById.set(goal.id, index + 1);
    });

    const merged = storeGoals.map((goal) => {
      const nextPriority = priorityById.get(goal.id);
      return typeof nextPriority === "number"
        ? { ...goal, priority: nextPriority }
        : goal;
    });

    setGoals(merged);
  };

  // ── Add goal from preset ──
  const handleAddPreset = (preset: (typeof GOAL_PRESETS)[0]) => {
    // Don't add duplicates
    if (storeGoals.some((g) => g.name === preset.name)) return;

    const presetMonthly = Math.round(preset.target / preset.months);
    const totalAfterAdd = existingMonthlyNeed + presetMonthly;
    const availableSurplus = Math.max(0, monthlySurplus);

    // Hard block: the goal alone requires more than total available surplus
    if (presetMonthly > availableSurplus && availableSurplus > 0) {
      setAddGoalError(
        `"${preset.name}" needs ₹${presetMonthly.toLocaleString("en-IN")}/mo to finish in ${preset.months} months, but you only have ₹${availableSurplus.toLocaleString("en-IN")}/mo available. Remove an existing goal or pick a smaller target.`
      );
      return;
    }

    // Soft block: total goals now exceed surplus
    if (totalAfterAdd > availableSurplus && availableSurplus > 0) {
      setAddGoalError(
        `Adding "${preset.name}" will push your total monthly goal commitments to ₹${totalAfterAdd.toLocaleString("en-IN")}/mo — exceeding your available ₹${availableSurplus.toLocaleString("en-IN")}/mo. Remove an existing goal first, or your timelines will stretch significantly.`
      );
      return;
    }

    setAddGoalError("");
    addGoal({
      id: `goal-${Date.now()}`,
      name: preset.name,
      icon: preset.icon,
      category: "custom",
      targetAmount: preset.target,
      currentAmount: 0,
      timelineMonths: preset.months,
      priority: activeGoals.length + 1,
      status: "not-started",
      monthlyAllocation: 0,
      color: "var(--accent)",
    });
    setShowAddModal(false);
  };

  // ── Add custom goal ──
  const handleAddCustom = () => {
    if (!customName.trim() || !customTarget.trim()) return;

    const targetAmt = parseInt(customTarget) || 0;
    const months = parseInt(customMonths) || 12;
    const customMonthly = Math.round(targetAmt / months);
    const availableSurplus = Math.max(0, monthlySurplus);

    // Hard block: even this single goal can't be achieved in the given timeline
    if (customMonthly > availableSurplus && availableSurplus > 0) {
      const minMonthsNeeded = availableSurplus > 0 ? Math.ceil(targetAmt / availableSurplus) : Infinity;
      setAddGoalError(
        `This goal needs ₹${customMonthly.toLocaleString("en-IN")}/mo to finish in ${months} months, but you only have ₹${availableSurplus.toLocaleString("en-IN")}/mo available. ` +
        (minMonthsNeeded < 999 ? `You'd need at least ${minMonthsNeeded} months to achieve this. ` : "") +
        `Either increase the timeline, reduce the target, or remove an existing goal.`
      );
      return;
    }

    // Soft block: adding this would bust the total budget
    const totalAfterAdd = existingMonthlyNeed + customMonthly;
    if (totalAfterAdd > availableSurplus && availableSurplus > 0) {
      setAddGoalError(
        `Adding this goal pushes your total monthly commitments to ₹${totalAfterAdd.toLocaleString("en-IN")}/mo — over your available ₹${availableSurplus.toLocaleString("en-IN")}/mo. Remove an existing goal first.`
      );
      return;
    }

    if (availableSurplus <= 0) {
      setAddGoalError(
        "You have no available surplus after expenses, debt, and reserve. You cannot add any goals until your income exceeds your outgoings."
      );
      return;
    }

    setAddGoalError("");
    addGoal({
      id: `goal-${Date.now()}`,
      name: customName.trim(),
      icon: "Target",
      category: "custom",
      targetAmount: targetAmt || 100000,
      currentAmount: 0,
      timelineMonths: months,
      priority: activeGoals.length + 1,
      status: "not-started",
      monthlyAllocation: 0,
      color: "var(--accent)",
    });
    setCustomName("");
    setCustomTarget("");
    setCustomMonths("12");
    setShowAddModal(false);
  };

  const selectedGoal = sortedGoals.find((g) => g.id === selectedGoalId);

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4">
      <div
        ref={canvasRef}
        className="flex-1 rounded-2xl relative overflow-hidden"
        style={{
          backgroundColor: "var(--background-solid)",
          cursor: isPanning ? "grabbing" : "grab",
        }}
        onWheel={handleWheel}
        onMouseDown={handleCanvasPointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handleCanvasPointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Dot grid background */}
        <svg className="canvas-bg absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <pattern
              id="dots"
              x={panOffset.x * zoom}
              y={panOffset.y * zoom}
              width={20 * zoom}
              height={20 * zoom}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={1 * zoom} cy={1 * zoom} r={1 * zoom} fill="var(--border)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />

          <g transform={`scale(${zoom})`}>
          {/* Connection lines from income to each goal */}
          {sortedGoals.map((goal, i) => {
            const goalPos = getNodePos(goal.id, i);
            return (
              <line
                key={`conn-${goal.id}`}
                x1={incomePos.x + 80 + panOffset.x}
                y1={incomePos.y + 80 + panOffset.y}
                x2={goalPos.x + 80 + panOffset.x}
                y2={goalPos.y + 80 + panOffset.y}
                stroke={
                  goal.status === "complete"
                    ? "var(--accent)"
                    : "var(--secondary)"
                }
                strokeWidth="3"
                strokeDasharray={goal.status === "complete" ? "0" : "8,4"}
                opacity={goal.status === "complete" ? 0.8 : 0.4}
              />
            );
          })}
          </g>
        </svg>

        <div
          className="absolute top-2 left-2 md:top-4 md:left-4 px-3 py-2 rounded-xl text-[10px] md:text-xs z-10"
          style={{
            background: "var(--surface-tint)",
            border: "1px solid var(--border)",
            color: "var(--secondary)",
          }}
        >
          Priority glow guide: stronger glow = higher priority (P1).
        </div>

        <div style={{ transform: `scale(${zoom})`, transformOrigin: "0 0", position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {/* Income Root Node */}
        <div
          className="absolute cursor-pointer hover:scale-105 pointer-events-auto"
          style={{
            left: incomePos.x + panOffset.x,
            top: incomePos.y + panOffset.y,
            width: 160,
            transition: dragging === "income" ? "none" : "transform 0.2s ease",
          }}
          onMouseDown={(e) => handlePointerDown(e, "income")}
          onTouchStart={(e) => handlePointerDown(e, "income")}
        >
          <div
            className="p-4 rounded-2xl bento-card"
            style={{
              border: "2px solid var(--accent)",
              boxShadow: "0 0 20px var(--accent-glow), var(--shadow-md)",
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
              {formatCurrency(income.total)}
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

        {/* Goal Nodes — directly from store */}
        {sortedGoals.map((goal, i) => {
          const pos = getNodePos(goal.id, i);
          const progress =
            goal.targetAmount > 0
              ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
              : 0;
          const statusColor = getStatusColor(goal.status);
          const statusGlow = getStatusGlow(goal.status);
          const isActiveGoal = goal.status !== "complete";
          const Icon = ICON_MAP[goal.icon] || Target;

          return (
            <div
              key={goal.id}
              className="absolute cursor-pointer hover:scale-105 pointer-events-auto"
              style={{
                left: pos.x + panOffset.x,
                top: pos.y + panOffset.y,
                width: 160,
                transition:
                  dragging === goal.id ? "none" : "transform 0.2s ease",
              }}
              onMouseDown={(e) => handlePointerDown(e, goal.id)}
              onTouchStart={(e) => handlePointerDown(e, goal.id)}
              onClick={() => {
                if (!dragging) setSelectedGoalId(goal.id);
              }}
            >
              <div
                className="p-4 rounded-2xl bento-card"
                style={{
                  border: `2px solid ${statusColor}`,
                  boxShadow: isActiveGoal
                    ? `${getPriorityGlow(goal.priority)}, var(--shadow-md)`
                    : `0 0 20px ${statusGlow}, var(--shadow-md)`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background:
                      "color-mix(in srgb, var(--surface-hover) 80%, transparent)",
                    color: statusColor,
                  }}
                >
                  <Icon size={24} className="icon-wireframe" />
                </div>
                <div
                  className="font-bold mb-1 text-[var(--card-foreground)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {goal.name}
                </div>
                {isActiveGoal && (
                  <div
                    className="text-[10px] font-bold mb-1"
                    style={{ color: "var(--accent-text)" }}
                  >
                    Priority P{goal.priority}
                  </div>
                )}
                <div
                  className="text-2xl font-bold mb-2 text-[var(--card-foreground)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {formatCurrency(goal.targetAmount)}
                </div>
                <div
                  className="text-xs mb-2 text-[var(--secondary)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {progress}% complete
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--progress-inactive)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: statusColor,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        </div>

        {/* Empty state */}
        {sortedGoals.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8">
              <Target
                size={48}
                className="mx-auto mb-4"
                style={{ color: "var(--secondary)", opacity: 0.3 }}
              />
              <p
                className="text-lg font-semibold text-[var(--secondary)] mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                No goals yet
              </p>
              <p
                className="text-sm text-[var(--secondary)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Click the + button to add your first goal
              </p>
            </div>
          </div>
        )}

        {/* Add Node Button */}
        <button
          onClick={() => setAddGoalError(""); setShowAddModal(true)}
          className="absolute top-2 right-2 md:top-4 md:right-4 px-3 md:px-4 py-2 h-10 md:h-12 rounded-xl flex items-center gap-2 justify-center transition-transform hover:scale-105 shadow-lg z-20 pointer-events-auto"
          style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
        >
          <Plus size={18} className="md:w-5 md:h-5" />
          <span className="font-semibold text-sm md:text-base hidden sm:inline" style={{ fontFamily: "var(--font-body)" }}>Add Goal</span>
        </button>
      </div>

      {/* ── Add Goal Modal ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
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
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--card-foreground)] hover:bg-[var(--surface-hover)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable area */}
            <div className="p-6 overflow-y-auto flex-1">

            {/* Over-budget warning */}
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

            {/* Presets */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {GOAL_PRESETS.filter(
                (p) => !storeGoals.some((g) => g.name === p.name),
              ).map((preset) => {
                const Icon = ICON_MAP[preset.icon] || Target;
                const presetMonthly = Math.round(preset.target / preset.months);
                const wouldExceed = (existingMonthlyNeed + presetMonthly) > Math.max(0, monthlySurplus) && monthlySurplus > 0;
                return (
                  <button
                    key={preset.name}
                    onClick={() => handleAddPreset(preset)}
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

            {/* Custom goal */}
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
              {/* Live validation for custom goal */}
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

              {/* Error message from blocked attempts */}
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
                onClick={handleAddCustom}
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
      )}

      {/* ── Goal Detail Floating Sidebar ── */}
      {selectedGoal && (
        <div
          className="absolute top-0 right-0 h-full w-full md:w-[360px] p-4 md:p-6 space-y-5 shadow-2xl z-30 overflow-y-auto transform transition-transform duration-300"
          style={{
            background: "var(--surface-tint)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderLeft: "1px solid var(--border)",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <h3
              className="text-xl font-bold text-[var(--card-foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Goal Details
            </h3>
            <button
              onClick={() => setSelectedGoalId(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--card-foreground)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Info */}
          <div className="flex flex-col items-center text-center py-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
              style={{
                background: `color-mix(in srgb, ${getStatusColor(selectedGoal.status || "not-started")} 15%, transparent)`,
                color: getStatusColor(selectedGoal.status || "not-started"),
                boxShadow: `0 0 30px color-mix(in srgb, ${getStatusColor(selectedGoal.status || "not-started")} 30%, transparent)`,
              }}
            >
              {(() => {
                const Icon = ICON_MAP[selectedGoal.icon] || Target;
                return (
                  <Icon
                    size={40}
                    className="icon-wireframe"
                    strokeWidth={1.5}
                  />
                );
              })()}
            </div>
            <h2
              className="text-2xl font-bold mb-1 text-[var(--card-foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {selectedGoal.name || "Goal"}
            </h2>
            <div className="text-[13px] font-medium uppercase tracking-wider text-[var(--secondary)] mb-4">
              {(selectedGoal.status || "not-started").replace("-", " ")}
            </div>

            <div
              className="text-4xl font-extrabold slashed-zero tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: getStatusColor(selectedGoal.status || "not-started"),
              }}
            >
              ₹{(selectedGoal.targetAmount || 0).toLocaleString("en-IN")}
            </div>
          </div>

          {/* Progress Bar Area */}
          <div
            className="p-4 rounded-2xl"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[var(--secondary)]">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-[var(--card-foreground)]">
                {(selectedGoal.targetAmount || 0) > 0
                  ? Math.round(
                      ((selectedGoal.currentAmount || 0) /
                        (selectedGoal.targetAmount || 1)) *
                        100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--progress-inactive)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${(selectedGoal.targetAmount || 0) > 0 ? Math.round(((selectedGoal.currentAmount || 0) / (selectedGoal.targetAmount || 1)) * 100) : 0}%`,
                  backgroundColor: getStatusColor(
                    selectedGoal.status || "not-started",
                  ),
                  boxShadow: `0 0 10px ${getStatusColor(selectedGoal.status || "not-started")}`,
                }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: "var(--surface-hover)",
                  color: "var(--accent)",
                }}
              >
                <Shield size={16} />
              </div>
              <div className="text-xs font-medium mb-1 text-[var(--secondary)]">
                Saved So Far
              </div>
              <div className="text-lg font-bold text-[var(--card-foreground)] slashed-zero">
                ₹{(selectedGoal.currentAmount || 0).toLocaleString("en-IN")}
              </div>
            </div>
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: "var(--surface-hover)",
                  color: "var(--tertiary-accent)",
                }}
              >
                <TrendingUp size={16} />
              </div>
              <div className="text-xs font-medium mb-1 text-[var(--secondary)]">
                Remaining
              </div>
              <div className="text-lg font-bold text-[var(--card-foreground)] slashed-zero">
                ₹
                {Math.max(
                  0,
                  (selectedGoal.targetAmount || 0) -
                    (selectedGoal.currentAmount || 0),
                ).toLocaleString("en-IN")}
              </div>
            </div>
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: "var(--surface-hover)",
                  color: "var(--amber)",
                }}
              >
                <Calendar size={16} />
              </div>
              <div className="text-xs font-medium mb-1 text-[var(--secondary)]">
                Timeline
              </div>
              <div className="text-lg font-bold text-[var(--card-foreground)]">
                {selectedGoal.timelineMonths || 12} months
              </div>
            </div>
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: "var(--surface-hover)",
                  color: "var(--tertiary-accent)",
                }}
              >
                <Target size={16} />
              </div>
              <div className="text-xs font-medium mb-1 text-[var(--secondary)]">
                Monthly Req.
              </div>
              <div className="text-lg font-bold text-[var(--card-foreground)] slashed-zero">
                ₹
                {Math.round(
                  Math.max(
                    0,
                    (selectedGoal.targetAmount || 0) -
                      (selectedGoal.currentAmount || 0),
                  ) / Math.max(1, selectedGoal.timelineMonths || 12),
                ).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {selectedGoal.status !== "complete" && (
            <div
              className="p-4 rounded-2xl"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-xs font-medium mb-2 text-[var(--secondary)]">
                Goal Priority
              </div>
              <select
                value={selectedGoal.priority}
                onChange={(e) =>
                  handlePriorityChange(
                    selectedGoal.id,
                    parseInt(e.target.value, 10),
                  )
                }
                className="w-full px-3 py-2 rounded-xl outline-none text-[var(--card-foreground)]"
                style={{
                  background: "var(--surface-tint)",
                  border: "1px solid var(--border)",
                }}
              >
                {Array.from(
                  { length: Math.max(activeGoals.length, 1) },
                  (_, i) => i + 1,
                ).map((priority) => (
                  <option
                    key={`priority-${selectedGoal.id}-${priority}`}
                    value={priority}
                  >{`Priority ${priority}`}</option>
                ))}
              </select>
              <div
                className="text-[11px] mt-2"
                style={{ color: "var(--secondary)" }}
              >
                Brighter node glow means higher priority.
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3 pt-4 mt-auto">
            {selectedGoal.status !== "complete" && (
              <button
                onClick={() => handleComplete(selectedGoal.id)}
                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_var(--accent-glow)]"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--on-accent)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <Sparkles size={18} />
                Mark Complete
              </button>
            )}
            <button
              onClick={() => handleDelete(selectedGoal.id)}
              className="w-full py-3 rounded-xl font-semibold transition-colors hover:bg-[var(--surface-hover)] text-sm"
              style={{ color: "var(--red)", fontFamily: "var(--font-body)" }}
            >
              Delete Goal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
