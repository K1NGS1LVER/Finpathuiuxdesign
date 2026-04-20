import { useNavigate } from 'react-router';
import { Target, TrendingUp, Shield, Sparkles, Calendar, Lightbulb } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const goals = [
    { icon: Target, title: 'Dream Bike', color: 'var(--lime)' },
    { icon: TrendingUp, title: 'Investment', color: 'var(--violet)' },
    { icon: Shield, title: 'Emergency Fund', color: 'var(--blue)' },
    { icon: Sparkles, title: 'Wedding', color: 'var(--amber)' },
    { icon: Calendar, title: 'Vacation', color: 'var(--lime)' },
    { icon: Lightbulb, title: 'Upskill Course', color: 'var(--violet)' },
  ];

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 relative" style={{ backgroundColor: 'var(--background)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: 'var(--lime)' }} />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: 'var(--violet)' }} />
      </div>
      <div className="max-w-4xl w-full text-center space-y-12 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--lime)' }} />
            <span className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)' }}>finpath</span>
          </div>
          <h1 className="text-6xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Every rupee has a <span style={{ color: 'var(--lime)' }}>destination</span>.
          </h1>
          <p className="text-xl" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
            AI-powered finance companion for Indian professionals. Plan, track, and achieve your financial goals.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {goals.map((goal, i) => {
            const Icon = goal.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl transition-transform hover:scale-105 cursor-pointer glass-card"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: goal.color + '20', color: goal.color }}>
                  <Icon size={24} />
                </div>
                <h3 className="font-bold">{goal.title}</h3>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => navigate('/onboarding')}
          className="px-8 py-4 rounded-lg font-bold text-lg transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-body)' }}
        >
          Start My Journey
        </button>
      </div>
    </div>
  );
}
