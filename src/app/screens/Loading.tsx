import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { useFinPathStore } from '@/lib/store';

export default function Loading() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<number[]>([]);
  const computeHealthScore = useFinPathStore(s => s.computeHealthScore);
  const generatePlan = useFinPathStore(s => s.generatePlan);
  const onboarded = useFinPathStore(s => s.onboarded);

  const steps = [
    'Analyzing your income patterns',
    'Categorizing expenses',
    'Calculating savings potential',
    'Mapping your financial goals',
    'Building your personalized journey',
  ];

  useEffect(() => {
    // If not onboarded, redirect back
    if (!onboarded) {
      navigate('/');
      return;
    }

    // Run actual computations during animation
    steps.forEach((_, i) => {
      setTimeout(() => {
        setCompleted((prev) => [...prev, i]);

        // Run engines at specific steps
        if (i === 2) computeHealthScore();
        if (i === 4) generatePlan();
      }, (i + 1) * 300);
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, steps.length * 300 + 300);
  }, []);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8 relative" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-15 blur-3xl animate-pulse" style={{ backgroundColor: 'var(--tertiary-accent)' }} />
      </div>
      <div className="max-w-md w-full space-y-6 md:space-y-8 relative z-10">
        <div className="text-center space-y-3 md:space-y-4">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full flex items-center justify-center animate-float relative" style={{ backgroundColor: 'var(--tertiary-accent)20', color: 'var(--tertiary-accent)' }}>
            <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-current border-t-transparent rounded-full animate-spin relative z-10" />
            <div className="absolute inset-0 rounded-full animate-pulse blur-md" style={{ backgroundColor: 'var(--tertiary-accent)', opacity: 0.3 }} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold px-4" style={{ fontFamily: 'var(--font-display)' }}>Creating your FinPath...</h2>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => {
            const isDone = completed.includes(i);
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-500`}
                style={{
                  opacity: isDone ? 1 : 0.4,
                  transform: isDone ? 'scale(1) translateX(0)' : 'scale(0.98) translateX(-4px)',
                  background: isDone ? 'var(--surface-tint)' : 'transparent',
                  boxShadow: isDone ? '0 8px 24px -8px var(--accent-glow)' : 'none'
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                  style={{
                    backgroundColor: isDone ? 'var(--accent)' : 'var(--border)',
                    color: isDone ? 'var(--on-accent)' : 'var(--secondary)',
                    transform: isDone ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: isDone ? '0 0 12px var(--accent-glow)' : 'none'
                  }}
                >
                  {isDone ? <Check size={16} /> : <span>{i + 1}</span>}
                </div>
                <span className="font-medium" style={{ fontFamily: 'var(--font-body)' }}>{step}</span>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-xl text-center italic transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_32px_-12px_var(--accent-glow)]" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)', background: 'var(--surface-tint)' }}>
          "Small steps today, big wins tomorrow!" — Penny
        </div>
      </div>
    </div>
  );
}
