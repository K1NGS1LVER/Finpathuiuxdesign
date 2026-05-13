import { Target, Plus } from "lucide-react";
import { useFinPathStore } from '@/lib/store';
import { useJourneyCanvas } from "./journey/useJourneyCanvas";
import { useJourneyGoals } from "./journey/useJourneyGoals";
import JourneyIncomeNode from "./journey/JourneyIncomeNode";
import JourneyGoalNode from "./journey/JourneyGoalNode";
import JourneyAddGoalModal from "./journey/JourneyAddGoalModal";
import JourneyGoalDetailPanel from "./journey/JourneyGoalDetailPanel";

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

export default function Journey() {
  const income = useFinPathStore((s) => s.income);

  const goals = useJourneyGoals();
  const canvas = useJourneyCanvas(goals.sortedGoals);

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4">
      <div
        ref={canvas.canvasRef}
        className={`flex-1 rounded-2xl relative overflow-hidden bg-card border ${canvas.isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ borderColor: 'var(--canvas-border)', backgroundColor: 'var(--card)' }}
        onWheel={canvas.handleWheel}
        onMouseDown={canvas.handleCanvasPointerDown}
        onMouseMove={canvas.handlePointerMove}
        onMouseUp={canvas.handlePointerUp}
        onMouseLeave={canvas.handlePointerUp}
        onTouchStart={canvas.handleCanvasPointerDown}
        onTouchMove={canvas.handlePointerMove}
        onTouchEnd={canvas.handlePointerUp}
      >
        <svg className="canvas-bg absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <pattern
              id="dots"
              x={canvas.panOffset.x * canvas.zoom}
              y={canvas.panOffset.y * canvas.zoom}
              width={20 * canvas.zoom}
              height={20 * canvas.zoom}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={1 * canvas.zoom} cy={1 * canvas.zoom} r={1 * canvas.zoom} fill="var(--canvas-dot)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />

          <g transform={`scale(${canvas.zoom})`}>
            {goals.sortedGoals.map((goal, i) => {
              const goalPos = canvas.getNodePos(goal.id, i);
              return (
                <line
                  key={`conn-${goal.id}`}
                  x1={canvas.incomePos.x + 80 + canvas.panOffset.x}
                  y1={canvas.incomePos.y + 80 + canvas.panOffset.y}
                  x2={goalPos.x + 80 + canvas.panOffset.x}
                  y2={goalPos.y + 80 + canvas.panOffset.y}
                  className={goal.status === "complete" ? "stroke-accent" : "stroke-secondary"}
                  strokeWidth="3"
                  strokeDasharray={goal.status === "complete" ? "0" : "8,4"}
                  opacity={goal.status === "complete" ? 0.8 : 0.4}
                />
              );
            })}
          </g>
        </svg>

        <div
          className="absolute top-2 left-2 md:top-4 md:left-4 px-3 py-2 rounded-xl text-[10px] md:text-xs z-10 bg-surface-tint border border-border text-secondary"
        >
          Priority glow guide: stronger glow = higher priority (P1).
        </div>

        <div style={{ transform: `scale(${canvas.zoom})`, transformOrigin: "0 0", position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <JourneyIncomeNode
            x={canvas.incomePos.x + canvas.panOffset.x}
            y={canvas.incomePos.y + canvas.panOffset.y}
            dragging={canvas.dragging === "income"}
            income={income}
            formatCurrency={formatCurrency}
            onPointerDown={canvas.handlePointerDown}
          />

          {goals.sortedGoals.map((goal, i) => {
            const pos = canvas.getNodePos(goal.id, i);
            return (
              <JourneyGoalNode
                key={goal.id}
                goal={goal}
                x={pos.x + canvas.panOffset.x}
                y={pos.y + canvas.panOffset.y}
                isDragging={canvas.dragging === goal.id}
                onPointerDown={canvas.handlePointerDown}
                onClick={() => goals.setSelectedGoalId(goal.id)}
                formatCurrency={formatCurrency}
              />
            );
          })}
        </div>

        {goals.sortedGoals.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8">
              <Target
                size={48}
                className="mx-auto mb-4 text-secondary opacity-30"
              />
              <p
                className="text-lg font-semibold text-secondary mb-2 font-display"
              >
                No goals yet
              </p>
              <p
                className="text-sm text-secondary font-body"
              >
                Click the + button to add your first goal
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => { goals.setAddGoalError(""); goals.setShowAddModal(true); }}
          className="absolute top-2 right-2 md:top-4 md:right-4 px-3 md:px-4 py-2 h-10 md:h-12 rounded-xl flex items-center gap-2 justify-center transition-transform hover:scale-105 shadow-lg z-20 pointer-events-auto bg-accent text-on-accent"
        >
          <Plus size={18} className="md:w-5 md:h-5" />
          <span className="font-semibold text-sm md:text-base hidden sm:inline font-body">Add Goal</span>
        </button>
      </div>

      <JourneyAddGoalModal
        show={goals.showAddModal}
        onClose={() => goals.setShowAddModal(false)}
        storeGoals={goals.storeGoals}
        activeGoals={goals.activeGoals}
        monthlySurplus={goals.monthlySurplus}
        existingMonthlyNeed={goals.existingMonthlyNeed}
        budgetRemaining={goals.budgetRemaining}
        addGoalError={goals.addGoalError}
        setAddGoalError={goals.setAddGoalError}
        customName={goals.customName}
        setCustomName={goals.setCustomName}
        customTarget={goals.customTarget}
        setCustomTarget={goals.setCustomTarget}
        customMonths={goals.customMonths}
        setCustomMonths={goals.setCustomMonths}
        onAddPreset={goals.handleAddPreset}
        onAddCustom={goals.handleAddCustom}
      />

      <JourneyGoalDetailPanel
        goal={goals.selectedGoal}
        onClose={() => goals.setSelectedGoalId(null)}
        onComplete={goals.handleComplete}
        onDelete={goals.handleDelete}
        onPriorityChange={goals.handlePriorityChange}
        activeGoalsCount={goals.activeGoals.length}
      />
    </div>
  );
}