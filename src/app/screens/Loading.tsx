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
      }, (i + 1) * 800);
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, steps.length * 800 + 500);
  }, []);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8 relative" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-15 blur-3xl animate-pulse" style={{ backgroundColor: 'var(--tertiary-accent)' }} />
      </div>
      <div className="max-w-md w-full space-y-6 md:space-y-8 relative z-10">
        <div className="text-center space-y-3 md:space-y-4">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--tertiary-accent)20', color: 'var(--tertiary-accent)' }}>
            <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-current border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold px-4" style={{ fontFamily: 'var(--font-display)' }}>Creating your FinPath...</h2>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all`}
              style={{
                opacity: completed.includes(i) ? 1 : 0.4,
                background: completed.includes(i) ? 'var(--surface-tint)' : 'transparent',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: completed.includes(i) ? 'var(--accent)' : 'var(--border)',
                  color: completed.includes(i) ? 'var(--on-accent)' : 'var(--secondary)',
                }}
              >
                {completed.includes(i) ? <Check size={16} /> : <span>{i + 1}</span>}
              </div>
              <span className="font-medium" style={{ fontFamily: 'var(--font-body)' }}>{step}</span>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl text-center italic" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)', background: 'var(--surface-tint)' }}>
          "Small steps today, big wins tomorrow!" — Penny
        </div>
      </div>
    </div>
  );
}
