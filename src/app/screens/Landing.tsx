import { useNavigate } from 'react-router';
import { Target, TrendingUp, Shield, Sparkles, Calendar, Lightbulb, Sun, Moon } from 'lucide-react';

interface LandingProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export default function Landing({ isDark, setIsDark }: LandingProps) {
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
    <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      <style>{`
        @keyframes rotate360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500 hover:scale-110 hover:rotate-12 active:scale-95 glass-card z-20"
      >
        {isDark ? <Sun size={18} style={{ animation: 'rotate360 0.6s ease-out' }} /> : <Moon size={18} style={{ animation: 'rotate360 0.6s ease-out' }} />}
      </button>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: 'var(--lime)' }} />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: 'var(--violet)' }} />
      </div>
      <div className="max-w-4xl w-full text-center space-y-4 md:space-y-6 relative z-10">
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2 md:mb-4">
            <div className="w-2 md:w-3 h-2 md:h-3 rounded-full" style={{ backgroundColor: 'var(--lime)' }} />
            <span className="font-bold text-lg md:text-2xl" style={{ fontFamily: 'var(--font-display)' }}>finpath</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight px-2" style={{ fontFamily: 'var(--font-display)' }}>
            Every rupee has a <span style={{ color: 'var(--lime)' }}>destination</span><span style={{ color: 'var(--lime)' }}>.</span>
          </h1>
          <p className="text-sm md:text-lg px-4" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
            AI-powered finance companion for Indian professionals. Plan, track, and achieve your financial goals.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {goals.map((goal, i) => {
            const Icon = goal.icon;
            return (
              <div
                key={i}
                className="p-2 md:p-4 rounded-lg md:rounded-xl glass-card flex flex-col items-center text-center"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${i * 0.1}s backwards, float ${3 + (i % 3)}s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s, ${i * 0.2}s`,
                }}
              >
                <div
                  className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-1 md:mb-2 transition-transform duration-300"
                  style={{
                    backgroundColor: goal.color + '20',
                    color: goal.color,
                    boxShadow: `0 4px 20px ${goal.color}30`,
                  }}
                >
                  <Icon size={16} className="md:w-5 md:h-5" />
                </div>
                <h3 className="font-bold text-xs md:text-sm" style={{ fontFamily: 'var(--font-body)' }}>{goal.title}</h3>
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
          className="px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-bold text-sm md:text-base transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-body)' }}
        >
          Start My Journey
        </button>
      </div>
    </div>
  );
}