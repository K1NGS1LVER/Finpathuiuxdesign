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
    <div className="h-full w-full flex flex-col p-4 md:p-8 relative overflow-x-hidden overflow-y-auto bg-[var(--background)] text-[var(--foreground)]">
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-20 bg-[var(--card)] shadow-[var(--shadow-md)] border border-[var(--border)]"
      >
        {isDark ? <Sun size={20} className="icon-wireframe" /> : <Moon size={20} className="icon-wireframe" />}
      </button>

      {/* Decorative Blurred Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="data-blob w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] top-[-10%] left-[-10%] bg-[var(--violet)]" />
        <div className="data-blob w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bottom-[-20%] right-[-10%] bg-[var(--blue)]" />
        <div className="data-blob w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-[var(--lime)] opacity-20" />
      </div>

      <div className="max-w-6xl w-full m-auto relative z-10 flex flex-col items-center gap-4 md:gap-8 py-4 md:py-12">
        {/* Hero Section */}
        <div className="text-center space-y-2 md:space-y-4 max-w-3xl">
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[var(--lime)] shadow-[0_0_12px_var(--lime)]" />
            <span className="text-title slashed-zero text-xl md:text-3xl">
              finpath
            </span>
          </div>

          <h1 className="text-hero slashed-zero !text-4xl md:!text-6xl lg:!text-7xl">
            Every rupee has a <br />
            <span className="text-[#4d7c0f] dark:text-[var(--lime)]">destination</span><span className="text-[#4d7c0f] dark:text-[var(--lime)]">.</span>
          </h1>

          <p className="text-base md:text-xl text-[var(--secondary)]">
            AI-powered finance companion for Indian professionals.
          </p>
        </div>

        {/* Bento Grid - Goals */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 w-full max-w-4xl mt-2 md:mt-4">
          {goals.map((goal, i) => {
            const Icon = goal.icon;
            return (
              <div
                key={i}
                className="bento-card flex flex-col items-center text-center cursor-pointer transition-transform hover:-translate-y-1 p-3 md:p-6"
              >
                <div
                  className="w-10 h-10 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-2 md:mb-4"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${goal.color} 15%, transparent)`,
                    color: goal.color,
                  }}
                >
                  <Icon size={24} className="icon-wireframe w-5 h-5 md:w-7 md:h-7" />
                </div>
                <h3 className="font-semibold text-xs md:text-base text-[var(--card-foreground)]">
                  {goal.title}
                </h3>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-2 md:mt-4">
          <button
            onClick={() => navigate('/onboarding')}
            className="px-6 md:px-10 py-3 md:py-5 rounded-full font-bold text-sm md:text-lg flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 bg-[var(--lime)] text-[#050F1C] shadow-[0_8px_32px_rgba(176,255,9,0.3)]"
          >
            Start My Journey
            <ArrowRight size={20} className="icon-wireframe" />
          </button>
        </div>
      </div>
    </div>
  );
}
