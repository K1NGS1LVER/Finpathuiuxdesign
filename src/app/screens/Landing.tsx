import { useNavigate } from 'react-router';
import { Target, TrendingUp, Shield, Sparkles, Calendar, Lightbulb, ArrowRight, Sun, Moon } from 'lucide-react';

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
    <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" style={{ background: 'var(--background)' }}>
      <style>{`
        @keyframes rotate360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
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
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px var(--lime); }
          50% { box-shadow: 0 0 40px var(--lime); }
        }
      `}</style>

      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 z-20"
        style={{
          background: 'var(--card)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border)',
        }}
      >
        {isDark ? <Sun size={20} className="icon-wireframe" style={{ animation: 'rotate360 0.6s ease-out' }} /> : <Moon size={20} className="icon-wireframe" style={{ animation: 'rotate360 0.6s ease-out' }} />}
      </button>

      {/* Decorative Blurred Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="data-blob absolute top-20 left-20 w-80 h-80 rounded-full" style={{ backgroundColor: 'var(--violet)' }} />
        <div className="data-blob absolute bottom-20 right-20 w-96 h-96 rounded-full" style={{ backgroundColor: 'var(--blue)' }} />
        <div className="data-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full" style={{ backgroundColor: 'var(--lime)' }} />
      </div>

      <div className="max-w-6xl w-full relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12 space-y-4 md:space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: 'var(--lime)',
                animation: 'pulse-glow 2s ease-in-out infinite'
              }}
            />
            <span className="font-bold text-2xl md:text-3xl slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
              finpath
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight px-4 slashed-zero" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
            Every rupee has a <br />
            <span style={{ color: 'var(--lime)' }}>destination</span><span style={{ color: 'var(--lime)' }}>.</span>
          </h1>

          <p className="text-base md:text-xl px-4 max-w-2xl mx-auto" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
            AI-powered finance companion for Indian professionals. Plan, track, and achieve your financial goals with clarity.
          </p>
        </div>

        {/* Bento Grid - Goals */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-12 max-w-4xl mx-auto">
          {goals.map((goal, i) => {
            const Icon = goal.icon;
            return (
              <div
                key={i}
                className="bento-card p-6 md:p-8 flex flex-col items-center text-center cursor-pointer"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${i * 0.1}s backwards, float ${3 + (i % 3)}s ease-in-out ${i * 0.2}s infinite`,
                }}
              >
                <div
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-3 md:mb-4 transition-transform duration-300"
                  style={{
                    backgroundColor: goal.color + '15',
                    color: goal.color,
                  }}
                >
                  <Icon size={24} className="icon-wireframe md:w-7 md:h-7" />
                </div>
                <h3 className="font-bold text-sm md:text-base slashed-zero" style={{ fontFamily: 'var(--font-body)', color: 'var(--foreground)' }}>
                  {goal.title}
                </h3>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/onboarding')}
            className="px-8 md:px-10 py-4 md:py-5 rounded-full font-bold text-base md:text-lg flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: 'var(--lime)',
              color: '#050F1C',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 10px 40px rgba(176, 255, 9, 0.3)',
            }}
          >
            Start My Journey
            <ArrowRight size={20} className="icon-wireframe" />
          </button>
        </div>
      </div>
    </div>
  );
}
