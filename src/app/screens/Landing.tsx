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
    <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-y-auto" style={{ backgroundColor: 'var(--background)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: 'var(--lime)' }} />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: 'var(--violet)' }} />
      </div>
      <div className="max-w-4xl w-full text-center space-y-8 md:space-y-12 relative z-10 py-8">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
            <div className="w-2 md:w-3 h-2 md:h-3 rounded-full" style={{ backgroundColor: 'var(--lime)' }} />
            <span className="font-bold text-xl md:text-2xl" style={{ fontFamily: 'var(--font-display)' }}>finpath</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight px-2" style={{ fontFamily: 'var(--font-display)' }}>
            Every rupee has a <span style={{ color: 'var(--lime)' }}>destination</span>.
          </h1>
          <p className="text-base md:text-xl px-4" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
            AI-powered finance companion for Indian professionals. Plan, track, and achieve your financial goals.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {goals.map((goal, i) => {
            const Icon = goal.icon;
            return (
              <div
                key={i}
                className="p-4 md:p-8 rounded-2xl glass-card flex flex-col items-center text-center"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${i * 0.1}s backwards, float ${3 + (i % 3)}s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s, ${i * 0.2}s`,
                }}
              >
                <div
                  className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-2 md:mb-4 transition-transform duration-300"
                  style={{
                    backgroundColor: goal.color + '20',
                    color: goal.color,
                    boxShadow: `0 4px 20px ${goal.color}30`,
                  }}
                >
                  <Icon size={20} className="md:w-7 md:h-7" />
                </div>
                <h3 className="font-bold text-sm md:text-lg" style={{ fontFamily: 'var(--font-body)' }}>{goal.title}</h3>
              </div>
            );
          })}
        </div>

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>

        <button
          onClick={() => navigate('/onboarding')}
          className="px-6 md:px-8 py-3 md:py-4 rounded-lg font-bold text-base md:text-lg transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-body)' }}
        >
          Start My Journey
        </button>
      </div>
    </div>
  );
}
