import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';

export default function Loading() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<number[]>([]);

  const steps = [
    'Analyzing your income patterns',
    'Categorizing expenses',
    'Calculating savings potential',
    'Mapping your financial goals',
    'Building your personalized journey',
  ];

  useEffect(() => {
    steps.forEach((_, i) => {
      setTimeout(() => {
        setCompleted((prev) => [...prev, i]);
      }, (i + 1) * 800);
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, steps.length * 800 + 500);
  }, []);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 relative" style={{ backgroundColor: 'var(--background)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-15 blur-3xl animate-pulse" style={{ backgroundColor: 'var(--blue)' }} />
      </div>
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--blue)20', color: 'var(--blue)' }}>
            <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Creating your FinPath...</h2>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all ${completed.includes(i) ? 'glass-card' : ''}`}
              style={{
                opacity: completed.includes(i) ? 1 : 0.4,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: completed.includes(i) ? 'var(--lime)' : 'var(--border)',
                  color: completed.includes(i) ? '#050F1C' : 'var(--secondary)',
                }}
              >
                {completed.includes(i) ? <Check size={16} /> : <span>{i + 1}</span>}
              </div>
              <span className="font-medium" style={{ fontFamily: 'var(--font-body)' }}>{step}</span>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl text-center italic glass-card" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
          "Small steps today, big wins tomorrow!" — Penny
        </div>
      </div>
    </div>
  );
}
