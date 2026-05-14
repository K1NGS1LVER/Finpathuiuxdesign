import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Trophy, Clock, Sparkles, Share2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useFinPathStore } from '@/lib/store';

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

      // Resolve CSS variables to hex — canvas-confetti can't parse var()
      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue('--accent').trim() || '#495bff';
      const secondary = styles.getPropertyValue('--secondary-accent').trim() || '#ac49ff';
      const amber = styles.getPropertyValue('--amber').trim() || '#f59e0b';
      const green = styles.getPropertyValue('--green').trim() || '#22c55e';

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: [accent, secondary, accent],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: [accent, amber, green],
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--accent)] opacity-10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Celebration */}
      <div className="text-center py-8 md:py-12 relative z-10">
        <motion.div
          className="inline-flex w-28 h-28 md:w-32 md:h-32 rounded-full items-center justify-center mb-6"
          style={{ background: 'var(--accent)', boxShadow: '0 0 72px var(--secondary-accent-glow)' }}
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        >
          <Trophy size={56} className="md:w-16 md:h-16" style={{ color: 'var(--on-secondary-accent)' }} />
        </motion.div>
        <motion.h1
          className="text-3xl md:text-5xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, var(--accent), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
        >
          {completedGoals.length > 0 ? 'Congratulations!' : 'Your Milestones Await!'}
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-[var(--secondary)] max-w-md mx-auto"
          style={{ fontFamily: 'var(--font-body)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.4 }}
        >
          {completedGoals.length > 0
            ? `You've completed ${completedGoals.length} goal${completedGoals.length > 1 ? 's' : ''} and saved ${fmt(totalSaved)}!`
            : 'Keep going — your first celebration is just around the corner.'}
        </motion.p>
      </div>

      {/* Goal Summary Cards */}
      {completedGoals.length > 0 && (
        <motion.div
          className="space-y-4 relative z-10"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}
        >
          {completedGoals.map((goal, i) => (
            <motion.div
              key={goal.id}
              className="bento-card relative overflow-hidden border-2 border-[var(--accent)]"
              style={{ boxShadow: '0 0 32px var(--secondary-accent-glow)' }}
              variants={{ hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } } }}
            >
              <div className="penny-insight-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-[var(--accent)] opacity-20 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-semibold tracking-wider text-[var(--secondary-accent-text)] uppercase mb-1">Goal Complete</div>
                    <h3 className="text-2xl font-bold text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>{goal.name}</h3>
                  </div>
                   <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent)', color: 'var(--on-secondary-accent)' }}>
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
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Net Worth Before/After */}
      <motion.div
        className="bento-card p-6 md:p-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.6 }}
      >
        <h3 className="text-xl font-bold mb-6 text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>Your Journey So Far</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-xs font-medium text-[var(--secondary)] mb-2">When You Started</div>
            <div className="text-2xl md:text-3xl font-bold slashed-zero text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>₹0</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-[var(--secondary)] mb-2">Today</div>
              <div className="text-2xl md:text-3xl font-bold slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--secondary-accent-text)' }}>
                {fmt(savings + investments + totalSaved)}
              </div>
          </div>
        </div>
        <div className="mt-6 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--progress-inactive)' }}>
          <div className="h-full rounded-full" style={{ width: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent) 60%, var(--accent) 100%)', transition: 'width 2s ease' }} />
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.75 }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 button-press"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--on-secondary-accent)', fontFamily: 'var(--font-body)', boxShadow: '0 8px 24px var(--secondary-accent-glow)' }}
        >
          Back to Dashboard
          <ArrowRight size={18} />
        </button>
        <button
          onClick={() => navigate('/journey')}
          className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 button-press text-[var(--card-foreground)]"
          style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}
        >
          View Journey Map
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
}
