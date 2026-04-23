import { useState, useRef } from 'react';
import { Plus, X, Wallet, Bike, Plane, CreditCard, Home, Heart, Target, TrendingUp, Shield, GraduationCap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinPathStore } from '../../lib/store';
import { useNavigate } from 'react-router';

interface VisualNode {
  id: string;
  x: number;
  y: number;
}

const ICON_MAP: Record<string, any> = {
  Wallet, Bike, Plane, CreditCard, Home, Heart, Target, TrendingUp, Shield, GraduationCap,
};

const GOAL_PRESETS = [
  { name: 'Dream Bike', icon: 'Bike', target: 120000, months: 18 },
  { name: 'Emergency Fund', icon: 'Shield', target: 300000, months: 24 },
  { name: 'Vacation', icon: 'Plane', target: 50000, months: 6 },
  { name: 'Investment', icon: 'TrendingUp', target: 500000, months: 36 },
  { name: 'Wedding', icon: 'Heart', target: 500000, months: 24 },
  { name: 'Upskill Course', icon: 'GraduationCap', target: 100000, months: 12 },
  { name: 'House Fund', icon: 'Home', target: 2000000, months: 60 },
  { name: 'Clear Debt', icon: 'CreditCard', target: 100000, months: 12 },
];

export default function Journey() {
  const navigate = useNavigate();

  // ── Store (single source of truth) ──
  const storeGoals = useFinPathStore(s => s.goals);
  const income = useFinPathStore(s => s.income);
  const addGoal = useFinPathStore(s => s.addGoal);
  const completeGoal = useFinPathStore(s => s.completeGoal);
  const removeGoal = useFinPathStore(s => s.removeGoal);

  // ── Local UI state (positions, drag, selection) ──
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [customMonths, setCustomMonths] = useState('12');
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Build visual nodes directly from store ──
  const getNodePos = (id: string, index: number) => {
    if (positions[id]) return positions[id];
    // Default layout: income on left, goals in a grid on the right
    if (id === 'income') return { x: 80, y: 200 };
    return {
      x: 350 + (index % 2) * 250,
      y: 80 + Math.floor(index / 2) * 200,
    };
  };

  const incomePos = getNodePos('income', 0);

  // ── Pointer Helpers ──
  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, nodeId: string) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(nodeId);
    const rect = canvasRef.current?.getBoundingClientRect();
    const pos = getPointerPosition(e);
    const nodePos = nodeId === 'income' ? incomePos : getNodePos(nodeId, storeGoals.findIndex(g => g.id === nodeId));
    if (rect) {
      setDragOffset({ x: pos.x - rect.left - nodePos.x - panOffset.x, y: pos.y - rect.top - nodePos.y - panOffset.y });
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPointerPosition(e);
    if (dragging && canvasRef.current) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = pos.x - rect.left - dragOffset.x - panOffset.x;
      const newY = pos.y - rect.top - dragOffset.y - panOffset.y;
      setPositions(prev => ({ ...prev, [dragging]: { x: newX, y: newY } }));
    } else if (isPanning) {
      e.preventDefault();
      const dx = pos.x - panStart.x;
      const dy = pos.y - panStart.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: pos.x, y: pos.y });
    }
  };

  const handlePointerUp = () => { setDragging(null); setIsPanning(false); };

  const handleCanvasPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target === canvasRef.current || target.closest('svg.canvas-bg')) {
      const pos = getPointerPosition(e);
      setIsPanning(true);
      setPanStart({ x: pos.x, y: pos.y });
    }
  };

  // ── Status color ──
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'var(--lime)';
      case 'in-progress': return 'var(--amber)';
      default: return 'var(--blue)';
    }
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

  // ── Add goal from preset ──
  const handleAddPreset = (preset: typeof GOAL_PRESETS[0]) => {
    // Don't add duplicates
    if (storeGoals.some(g => g.name === preset.name)) return;

    addGoal({
      id: `goal-${Date.now()}`,
      name: preset.name,
      icon: preset.icon,
      category: 'custom',
      targetAmount: preset.target,
      currentAmount: 0,
      timelineMonths: preset.months,
      priority: storeGoals.length + 1,
      status: 'not-started',
      monthlyAllocation: 0,
      color: 'var(--lime)',
    });
    setShowAddModal(false);
  };

  // ── Add custom goal ──
  const handleAddCustom = () => {
    if (!customName.trim() || !customTarget.trim()) return;
    addGoal({
      id: `goal-${Date.now()}`,
      name: customName.trim(),
      icon: 'Target',
      category: 'custom',
      targetAmount: parseInt(customTarget) || 100000,
      currentAmount: 0,
      timelineMonths: parseInt(customMonths) || 12,
      priority: storeGoals.length + 1,
      status: 'not-started',
      monthlyAllocation: 0,
      color: 'var(--lime)',
    });
    setCustomName('');
    setCustomTarget('');
    setCustomMonths('12');
    setShowAddModal(false);
  };

  const selectedGoal = storeGoals.find(g => g.id === selectedGoalId);

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4">
      <div
        ref={canvasRef}
        className="flex-1 rounded-2xl relative overflow-hidden"
        style={{ backgroundColor: 'var(--background-solid)', cursor: isPanning ? 'grabbing' : 'grab' }}
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
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--border)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />

          {/* Connection lines from income to each goal */}
          {storeGoals.map((goal, i) => {
            const goalPos = getNodePos(goal.id, i);
            return (
              <line
                key={`conn-${goal.id}`}
                x1={incomePos.x + 80 + panOffset.x}
                y1={incomePos.y + 80 + panOffset.y}
                x2={goalPos.x + 80 + panOffset.x}
                y2={goalPos.y + 80 + panOffset.y}
                stroke={goal.status === 'complete' ? 'var(--lime)' : 'var(--secondary)'}
                strokeWidth="3"
                strokeDasharray={goal.status === 'complete' ? '0' : '8,4'}
                opacity={goal.status === 'complete' ? 0.8 : 0.4}
              />
            );
          })}
        </svg>

        {/* Income Root Node */}
        <div
          className="absolute cursor-pointer hover:scale-105"
          style={{
            left: incomePos.x + panOffset.x,
            top: incomePos.y + panOffset.y,
            width: 160,
            transition: dragging === 'income' ? 'none' : 'transform 0.2s ease',
          }}
          onMouseDown={(e) => handlePointerDown(e, 'income')}
          onTouchStart={(e) => handlePointerDown(e, 'income')}
        >
          <div className="p-4 rounded-2xl bento-card" style={{ border: '2px solid var(--lime)', boxShadow: '0 0 20px rgba(176,255,9,0.15), var(--shadow-md)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'color-mix(in srgb, var(--surface-hover) 80%, transparent)', color: 'var(--lime)' }}>
              <Wallet size={24} className="icon-wireframe" />
            </div>
            <div className="font-bold mb-1 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-body)' }}>Income</div>
            <div className="text-2xl font-bold mb-2 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
              ₹{(income.total / 1000).toFixed(0)}K
            </div>
            <div className="text-xs mb-2 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>100% — Source</div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--progress-inactive)' }}>
              <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: 'var(--lime)' }} />
            </div>
          </div>
        </div>

        {/* Goal Nodes — directly from store */}
        {storeGoals.map((goal, i) => {
          const pos = getNodePos(goal.id, i);
          const progress = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
          const statusColor = getStatusColor(goal.status);
          const Icon = ICON_MAP[goal.icon] || Target;

          return (
            <div
              key={goal.id}
              className="absolute cursor-pointer hover:scale-105"
              style={{
                left: pos.x + panOffset.x,
                top: pos.y + panOffset.y,
                width: 160,
                transition: dragging === goal.id ? 'none' : 'transform 0.2s ease',
              }}
              onMouseDown={(e) => handlePointerDown(e, goal.id)}
              onTouchStart={(e) => handlePointerDown(e, goal.id)}
              onClick={() => { if (!dragging) setSelectedGoalId(goal.id); }}
            >
              <div className="p-4 rounded-2xl bento-card" style={{ border: `2px solid ${statusColor}`, boxShadow: `0 0 20px ${statusColor}15, var(--shadow-md)` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'color-mix(in srgb, var(--surface-hover) 80%, transparent)', color: statusColor }}>
                  <Icon size={24} className="icon-wireframe" />
                </div>
                <div className="font-bold mb-1 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-body)' }}>{goal.name}</div>
                <div className="text-2xl font-bold mb-2 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                  ₹{(goal.targetAmount / 1000).toFixed(0)}K
                </div>
                <div className="text-xs mb-2 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>{progress}% complete</div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--progress-inactive)' }}>
                  <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: statusColor }} />
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {storeGoals.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8">
              <Target size={48} className="mx-auto mb-4" style={{ color: 'var(--secondary)', opacity: 0.3 }} />
              <p className="text-lg font-semibold text-[var(--secondary)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>No goals yet</p>
              <p className="text-sm text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Click the + button to add your first goal</p>
            </div>
          </div>
        )}

        {/* Add Node Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="absolute top-2 right-2 md:top-4 md:right-4 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform hover:scale-110 shadow-lg z-20"
          style={{ backgroundColor: 'var(--lime)', color: '#050F1C' }}
        >
          <Plus size={18} className="md:w-5 md:h-5" />
        </button>
      </div>

      {/* ── Add Goal Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div
            className="bento-card w-full max-w-md max-h-[80vh] overflow-y-auto !p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Add Goal</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--card-foreground)] hover:bg-[var(--surface-hover)]">
                <X size={18} />
              </button>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {GOAL_PRESETS.filter(p => !storeGoals.some(g => g.name === p.name)).map((preset) => {
                const Icon = ICON_MAP[preset.icon] || Target;
                return (
                  <button
                    key={preset.name}
                    onClick={() => handleAddPreset(preset)}
                    className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)' }}
                  >
                    <Icon size={20} className="mb-2" style={{ color: 'var(--lime)' }} />
                    <div className="text-sm font-semibold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-body)' }}>{preset.name}</div>
                    <div className="text-xs text-[var(--secondary)] mt-1">₹{(preset.target / 1000).toFixed(0)}K · {preset.months}mo</div>
                  </button>
                );
              })}
            </div>

            {/* Custom goal */}
            <div className="space-y-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div className="text-sm font-semibold text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Or create custom</div>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Goal name"
                className="w-full px-4 py-3 rounded-xl outline-none text-[var(--card-foreground)]"
                style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value)}
                  placeholder="Target ₹"
                  className="w-full px-4 py-3 rounded-xl outline-none text-[var(--card-foreground)]"
                  style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}
                />
                <input
                  type="number"
                  value={customMonths}
                  onChange={(e) => setCustomMonths(e.target.value)}
                  placeholder="Months"
                  className="w-full px-4 py-3 rounded-xl outline-none text-[var(--card-foreground)]"
                  style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}
                />
              </div>
              <button
                onClick={handleAddCustom}
                disabled={!customName.trim() || !customTarget.trim()}
                className="w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-body)' }}
              >
                Add Custom Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Goal Detail Panel ── */}
      {selectedGoal && (
        <div
          className="w-full md:w-80 rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4 bento-card fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto z-30"
          style={{ maxHeight: '50vh', overflowY: 'auto' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Goal Details</h3>
            <button onClick={() => setSelectedGoalId(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--card-foreground)] hover:bg-[var(--surface-hover)] transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="text-center py-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-[var(--shadow-md)]" style={{ background: 'var(--surface-hover)', color: getStatusColor(selectedGoal.status) }}>
              {(() => {
                const Icon = ICON_MAP[selectedGoal.icon] || Target;
                return <Icon size={40} className="icon-wireframe" />;
              })()}
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{selectedGoal.name}</h2>
            <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: getStatusColor(selectedGoal.status) }}>
              ₹{selectedGoal.targetAmount.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--card-foreground)]">Progress</span>
              <span className="font-bold text-[var(--card-foreground)]">
                {selectedGoal.targetAmount > 0 ? Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--progress-inactive)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${selectedGoal.targetAmount > 0 ? Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100) : 0}%`,
                  backgroundColor: getStatusColor(selectedGoal.status),
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-2 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
              <div className="text-xs mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Saved</div>
              <div className="font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>₹{selectedGoal.currentAmount.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-2 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
              <div className="text-xs mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Remaining</div>
              <div className="font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>₹{(selectedGoal.targetAmount - selectedGoal.currentAmount).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-2 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
              <div className="text-xs mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Timeline</div>
              <div className="font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{selectedGoal.timelineMonths} months</div>
            </div>
            <div className="p-2 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
              <div className="text-xs mb-1 text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Monthly</div>
              <div className="font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                ₹{Math.round((selectedGoal.targetAmount - selectedGoal.currentAmount) / Math.max(1, selectedGoal.timelineMonths)).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            {selectedGoal.status !== 'complete' && (
              <button
                onClick={() => handleComplete(selectedGoal.id)}
                className="w-full py-3 rounded-lg font-bold transition-transform hover:scale-105"
                style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-body)' }}
              >
                Mark Complete 🎉
              </button>
            )}
            <button
              onClick={() => handleDelete(selectedGoal.id)}
              className="w-full py-3 rounded-lg font-bold transition-transform hover:scale-105 text-sm"
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontFamily: 'var(--font-body)' }}
            >
              Remove Goal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
