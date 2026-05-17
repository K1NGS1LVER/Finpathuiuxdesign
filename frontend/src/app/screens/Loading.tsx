import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Sparkles } from 'lucide-react';
import { useFinPathStore } from '@/lib/store';
import FinPathLogo from '@/app/components/FinPathLogo';

const STEPS = [
  'Analyzing your income patterns',
  'Categorizing expenses',
  'Calculating savings potential',
  'Mapping your financial goals',
  'Building your personalized journey',
];
const STEP_INTERVAL_MS = 800;
const TAIL_DELAY_MS = 500;

export default function Loading() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<number[]>([]);
  const computeHealthScore = useFinPathStore(s => s.computeHealthScore);
  const generatePlan = useFinPathStore(s => s.generatePlan);
  const onboarded = useFinPathStore(s => s.onboarded);
  const goals = useFinPathStore(s => s.goals);
  const plan = useFinPathStore(s => s.plan);
  const healthScore = useFinPathStore(s => s.healthScore);


  useEffect(() => {
    if (!onboarded) {
      navigate('/');
      return;
    }

    const timers: number[] = [];
    STEPS.forEach((_, i) => {
      const t = window.setTimeout(() => {
        setCompleted(prev => [...prev, i]);
        if (i === 2) computeHealthScore();
        if (i === 3) generatePlan();
      }, (i + 1) * STEP_INTERVAL_MS);
      timers.push(t);
    });

    const redirect = window.setTimeout(() => {
      navigate('/dashboard');
    }, STEPS.length * STEP_INTERVAL_MS + TAIL_DELAY_MS);
    timers.push(redirect);

    return () => { timers.forEach(clearTimeout); };
  }, []);

  const insight = useMemo(() => {
    if (healthScore?.actions && healthScore.actions.length > 0) return healthScore.actions[0];
    return "You're on track. Penny will keep watching your cashflow.";
  }, [healthScore]);

  const firstGoalLine = useMemo(() => {
    if (!plan || !goals.length) return null;
    const sortedGoals = [...goals]
      .filter(g => g.status !== 'complete' && g.category !== 'debt')
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));
    const target = sortedGoals.find(g => plan.goalCompletionDates[g.id]);
    if (!target) {
      const longTerm = sortedGoals[0];
      if (!longTerm) return null;
      return `${longTerm.name} is a long-term play — Penny will pace it month by month.`;
    }
    const compStr = plan.goalCompletionDates[target.id];
    const compDate = new Date(`1 ${compStr}`);
    if (isNaN(compDate.getTime())) return `Your ${target.name} target is locked in — ${compStr}.`;
    const now = new Date();
    const months = Math.max(1, (compDate.getFullYear() - now.getFullYear()) * 12 + (compDate.getMonth() - now.getMonth()));
    return `Your ${target.name} looks achievable in ${months} ${months === 1 ? 'month' : 'months'} — ${compStr}.`;
  }, [plan, goals]);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 md:p-8 relative" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-15 blur-3xl animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
      </div>
      <div className="max-w-md w-full space-y-5 md:space-y-6 relative z-10">
        <div className="text-center space-y-3 md:space-y-4">
          <div className="flex justify-center mb-4">
            <FinPathLogo size={56} showWordmark wordmarkSize="24px" wordmarkGap={14} />
          </div>
          <div className="w-12 h-12 md:w-14 md:h-14 mx-auto rounded-full flex items-center justify-center animate-float relative" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent)' }}>
            <div className="w-9 h-9 md:w-10 md:h-10 border-4 border-current border-t-transparent rounded-full animate-spin relative z-10" />
            <div className="absolute inset-0 rounded-full animate-pulse blur-md" style={{ backgroundColor: 'var(--accent)', opacity: 0.3 }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--secondary)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-medium)' }}>Creating your FinPath...</h2>
        </div>

        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const isDone = completed.includes(i);
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 transition-all duration-500"
                style={{
                  opacity: isDone ? 1 : 0.4,
                  transform: isDone ? 'scale(1) translateX(0)' : 'scale(0.98) translateX(-4px)',
                  background: isDone ? 'var(--surface-tint)' : 'transparent',
                  borderRadius: 'var(--radius-base)',
                  boxShadow: isDone ? '0 8px 24px -8px var(--secondary-accent-glow)' : 'none',
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                  style={{
                    backgroundColor: isDone ? 'var(--accent)' : 'var(--border)',
                    color: isDone ? 'var(--on-secondary-accent)' : 'var(--secondary)',
                    transform: isDone ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: isDone ? '0 0 12px var(--secondary-accent-glow)' : 'none',
                  }}
                >
                  {isDone ? <Check size={14} /> : <span style={{ fontSize: 'var(--text-xs)' }}>{i + 1}</span>}
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>{step}</span>
              </div>
            );
          })}
        </div>

        <div
          className="penny-msg-in"
          style={{
            padding: 'var(--space-3)',
            background: 'var(--surface-tint)',
            borderRadius: 'var(--radius-base)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px -12px var(--secondary-accent-glow)',
          }}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
            >
              <Sparkles size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--accent)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Penny says
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--foreground)',
                  lineHeight: 1.45,
                  margin: 0,
                }}
              >
                {insight}
              </p>
              {firstGoalLine && (
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--secondary)',
                    lineHeight: 1.5,
                    margin: '6px 0 0',
                  }}
                >
                  {firstGoalLine}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
