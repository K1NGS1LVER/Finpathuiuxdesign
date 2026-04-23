import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Trophy, Clock, Sparkles, Share2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinPathStore } from '../../lib/store';

export default function Celebrate() {
  const navigate = useNavigate();
  const goals = useFinPathStore(s => s.goals);
  const income = useFinPathStore(s => s.income);
  const savings = useFinPathStore(s => s.savings);
  const investments = useFinPathStore(s => s.investments);
  const healthScore = useFinPathStore(s => s.healthScore);

  const [showConfetti, setShowConfetti] = useState(false);

  const completedGoals = goals.filter(g => g.status === 'complete');
  const totalSaved = completedGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  // Trigger confetti on mount
  useEffect(() => {
    if (completedGoals.length > 0) {
      setShowConfetti(true);
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#B0FF09', '#495BFF', '#8B5CF6'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#B0FF09', '#F59E0B', '#22C55E'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, []);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
      {/* Decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--lime)] opacity-10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Celebration */}
      <div className="text-center py-8 md:py-12 relative z-10">
        <div className="inline-flex w-24 h-24 md:w-32 md:h-32 rounded-full items-center justify-center mb-6" style={{ background: 'var(--lime)', boxShadow: '0 0 60px rgba(176, 255, 9, 0.5)' }}>
          <Trophy size={48} className="md:w-16 md:h-16" style={{ color: '#050F1C' }} />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-3 text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
          {completedGoals.length > 0 ? 'Congratulations! 🎉' : 'Your Milestones Await!'}
        </h1>
        <p className="text-lg md:text-xl text-[var(--secondary)] max-w-md mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
          {completedGoals.length > 0
            ? `You've completed ${completedGoals.length} goal${completedGoals.length > 1 ? 's' : ''} and saved ${fmt(totalSaved)}!`
            : 'Keep going — your first celebration is just around the corner.'}
        </p>
      </div>

      {/* Goal Summary Cards */}
      {completedGoals.length > 0 && (
        <div className="space-y-4 relative z-10">
          {completedGoals.map((goal, i) => (
            <div key={goal.id} className="bento-card p-6 md:p-8 relative overflow-hidden border border-[var(--lime)]" style={{ background: 'var(--surface-tint)', backdropFilter: 'blur(32px)' }}>
              {/* Centered glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-[var(--lime)] opacity-20 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-semibold tracking-wider text-[var(--lime-text)] uppercase mb-1">Goal Complete</div>
                    <h3 className="text-2xl font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{goal.name}</h3>
                  </div>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--lime)', color: '#050F1C' }}>
                    <Sparkles size={28} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-3 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
                    <div className="text-xs text-[var(--secondary)] mb-1" style={{ fontFamily: 'var(--font-body)' }}>Amount Saved</div>
                    <div className="text-lg font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{fmt(goal.targetAmount)}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--surface-hover)' }}>
                    <div className="text-xs text-[var(--secondary)] mb-1" style={{ fontFamily: 'var(--font-body)' }}>Timeline</div>
                    <div className="text-lg font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{goal.timelineMonths} months</div>
                  </div>
                  <div className="p-3 rounded-xl hidden md:block" style={{ background: 'var(--surface-hover)' }}>
                    <div className="text-xs text-[var(--secondary)] mb-1" style={{ fontFamily: 'var(--font-body)' }}>Monthly Saved</div>
                    <div className="text-lg font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                      {fmt(Math.round(goal.targetAmount / Math.max(1, goal.timelineMonths)))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Net Worth Before/After */}
      <div className="bento-card p-6 md:p-8 relative z-10">
        <h3 className="text-xl font-bold mb-6 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Your Journey So Far</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-xs font-medium text-[var(--secondary)] mb-2">When You Started</div>
            <div className="text-2xl md:text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>₹0</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-[var(--secondary)] mb-2">Today</div>
            <div className="text-2xl md:text-3xl font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--lime-text)' }}>
              {fmt(savings + investments + totalSaved)}
            </div>
          </div>
        </div>
        <div className="mt-6 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--progress-inactive)' }}>
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--blue)] via-[var(--lime)] to-[var(--lime)]" style={{ width: '100%', transition: 'width 2s ease' }} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 relative z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-body)', boxShadow: '0 8px 24px rgba(176, 255, 9, 0.3)' }}
        >
          Back to Dashboard
          <ArrowRight size={18} />
        </button>
        <button
          onClick={() => navigate('/journey')}
          className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-[var(--card-foreground)]"
          style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}
        >
          View Journey Map
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
