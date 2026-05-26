import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Trophy, Sparkles, Share2, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { CONFETTI_COLORS } from '@/app/screens/journey/constants';
import { useFinPathStore } from '@/lib/store';
import { formatInr } from '@/lib/format';
import ShareCard from '@/app/components/ShareCard';
import { captureNodeToPng, tryShareImage, type ShareOutcome } from '@/lib/share-card';

export default function Celebrate() {
  const navigate = useNavigate();
  const goals = useFinPathStore(s => s.goals);
  const income = useFinPathStore(s => s.income);
  const savings = useFinPathStore(s => s.savings);
  const investments = useFinPathStore(s => s.investments);
  const healthScore = useFinPathStore(s => s.healthScore);

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 28,
      ticks: 90,
      origin: { x: 0.5, y: 0.2 },
      colors: CONFETTI_COLORS,
      scalar: 0.9,
      gravity: 1.0,
    });
  }, []);

  const [sharing, setSharing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState<ShareOutcome | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const completedGoals = goals.filter(g => g.status === 'complete');
  const totalSaved = completedGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const heroGoal = completedGoals[0];
  const totalTimeline = completedGoals.reduce((sum, g) => sum + (g.timelineMonths || 0), 0);
  const aggregateMonthly = totalTimeline > 0
    ? Math.round(totalSaved / totalTimeline)
    : 0;
  const netWorthToday = savings + investments + totalSaved;
  const dateLabel = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleShare = async () => {
    if (sharing || !heroGoal) return;
    setSharing(true);
    setToast(null);
    setCapturing(true);
    try {
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const card = shareCardRef.current;
      if (!card) throw new Error('ShareCard not mounted');
      const cardBg =
        getComputedStyle(document.documentElement).getPropertyValue('--card').trim() ||
        '#ffffff';
      const blob = await captureNodeToPng(card, { pixelRatio: 2, backgroundColor: cardBg });
      const outcome = await tryShareImage(blob, {
        title: 'I hit a savings milestone with FinPath',
        text: `${heroGoal.name} — saved ${formatInr(totalSaved)}`,
        filename: `finpath-milestone-${new Date().toISOString().slice(0, 10)}.png`,
      });
      setToast(outcome);
      window.setTimeout(() => setToast(null), 2200);
    } catch (err) {
      console.error('Share failed', err);
      setToast(null);
    } finally {
      setCapturing(false);
      setSharing(false);
    }
  };

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
        className="flex flex-col gap-3 relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.75 }}
      >
        {completedGoals.length > 0 && (
          <button
            onClick={handleShare}
            disabled={sharing}
            aria-label="Share this milestone"
            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 button-press disabled:opacity-70 disabled:cursor-wait"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--on-secondary-accent)',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 8px 24px var(--secondary-accent-glow)',
            }}
          >
            {sharing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating card&hellip;
              </>
            ) : (
              <>
                <Share2 size={18} />
                Share this milestone
              </>
            )}
          </button>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 button-press text-[var(--card-foreground)]"
            style={{
              background: 'var(--surface-tint)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Back to Dashboard
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/journey')}
            className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 button-press text-[var(--card-foreground)]"
            style={{
              background: 'var(--surface-tint)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
            }}
          >
            View Journey Map
            <ArrowRight size={18} />
          </button>
        </div>

        <AnimatePresence>
          {toast && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="self-center pill"
              style={{
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                color: 'var(--card-foreground)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
              }}
            >
              {toast === 'shared'
                ? 'Shared'
                : toast === 'copied'
                  ? 'Saved to device &middot; copied to clipboard'.replace('&middot;', '·')
                  : 'Saved to your device'}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {capturing && heroGoal && (
        <ShareCard
          ref={shareCardRef}
          goalName={heroGoal.name}
          amountSaved={totalSaved}
          timelineMonths={heroGoal.timelineMonths}
          monthlySaved={
            heroGoal.timelineMonths > 0
              ? Math.round(heroGoal.targetAmount / heroGoal.timelineMonths)
              : aggregateMonthly
          }
          netWorthToday={netWorthToday}
          completedCount={completedGoals.length}
          dateLabel={dateLabel}
        />
      )}
    </div>
  );
}
