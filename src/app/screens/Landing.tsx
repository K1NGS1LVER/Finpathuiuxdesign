import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Target, TrendingUp, Sparkles, GitBranch, ArrowRight, Sun, Moon } from 'lucide-react';
import FinPathLogo from '@/app/components/FinPathLogo';

interface LandingProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export default function Landing({ isDark, setIsDark }: LandingProps) {
  const navigate = useNavigate();
  const [health, setHealth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setHealth(78), 300);
    return () => clearTimeout(timer);
  }, []);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (health / 100) * circumference;

  return (
    <div className="h-screen w-full overflow-x-hidden overflow-y-auto scroll-smooth snap-y snap-mandatory bg-background text-foreground font-body">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[25%] left-[15%] w-[80vw] h-[50vh] max-w-[800px] rounded-full bg-accent opacity-[0.08] mix-blend-screen blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-[35%] right-[15%] w-[50vw] h-[60vh] max-w-[600px] rounded-full bg-secondary-accent opacity-[0.06] mix-blend-screen blur-[120px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-[20%] left-[50%] w-[55vw] h-[45vh] max-w-[700px] rounded-full bg-tertiary-accent opacity-[0.05] mix-blend-screen blur-[120px] -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 md:px-8 bg-card/80 backdrop-blur-xl border-b border-border">
        <FinPathLogo size={32} showWordmark wordmarkSize="20px" wordmarkGap={10} />
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-secondary hover:text-foreground transition-colors">Features</a>
          <a href="#testimonials" className="text-sm font-medium text-secondary hover:text-foreground transition-colors">Testimonials</a>
          <button onClick={() => navigate('/auth')} className="px-5 py-2.5 rounded-full bg-accent text-on-accent text-sm font-semibold shadow-[0_0_24px_var(--accent-glow)] hover:bg-accent-hover hover:shadow-[0_0_36px_var(--accent-glow)] transition-all">
            Start My Journey
          </button>
          <button onClick={() => setIsDark(!isDark)} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-tint border border-border text-foreground hover:bg-surface-hover transition-colors">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        
        <div className="flex md:hidden items-center gap-4">
          <button onClick={() => navigate('/auth')} className="px-4 py-2 rounded-full bg-accent text-on-accent text-xs font-semibold shadow-[0_0_16px_var(--accent-glow)]">
            Start
          </button>
          <button onClick={() => setIsDark(!isDark)} className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-tint border border-border text-foreground hover:bg-surface-hover transition-colors">
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 min-h-screen flex items-center pt-[var(--space-12)] pb-[var(--space-8)] px-[var(--space-4)] md:px-[var(--space-8)] snap-start">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-[var(--space-8)] lg:gap-[var(--space-8)] items-center">
          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            <span className="inline-block text-[13px] font-semibold text-accent-text uppercase tracking-[0.08em] mb-4">
              AI-Powered Financial Planning
            </span>
            <h1 className="text-5xl lg:text-[64px] font-bold tracking-tight text-foreground mb-6 leading-[1.08] slashed-zero font-display">
              Every rupee has a <span className="text-transparent bg-clip-text bg-gradient-to-br from-accent to-secondary-accent">destination</span>
            </h1>
            <p className="text-lg text-secondary mb-8 leading-relaxed">
              FinPath maps your income to every goal, debt, and reserve — automatically.
              No spreadsheets. No guesswork. Just a clear path from where you are to where
              you want to be.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button onClick={() => navigate('/auth')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold bg-accent text-on-accent shadow-[0_0_24px_var(--accent-glow)] hover:bg-accent-hover hover:shadow-[0_0_36px_var(--accent-glow)] transition-all">
                Start My Journey <ArrowRight size={18} />
              </button>
              <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold bg-surface-tint text-secondary border border-border hover:bg-surface-hover hover:text-foreground transition-all">
                See how it works
              </a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end relative">
            <div className="bg-card backdrop-blur-[32px] border border-border rounded-[32px] shadow-lg overflow-hidden w-full max-w-[480px] relative">
              {/* Internal Blobs */}
              <div className="absolute -top-10 -right-10 w-[180px] h-[180px] rounded-full bg-accent opacity-10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-[180px] h-[180px] rounded-full bg-secondary-accent opacity-[0.08] blur-3xl pointer-events-none" />
              
              {/* Window Header */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
                <div className="w-2.5 h-2.5 rounded-full bg-red" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber" />
                <div className="w-2.5 h-2.5 rounded-full bg-green" />
              </div>

              {/* Card Body */}
              <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-[var(--space-6)]">
                  {/* Score Ring */}
                  <div className="relative w-28 h-28 md:w-32 md:h-32 flex-shrink-0">
                    <svg
                      className="transform -rotate-90 w-full h-full"
                      viewBox="0 0 160 160"
                    >
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="12"
                        strokeDasharray="6 6"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        className="transition-[stroke-dashoffset] duration-1500 ease-[cubic-bezier(0.4,0,0.2,1)] drop-shadow-[0_0_4px_var(--accent-glow)]"
                        style={{
                          strokeDashoffset: offset,
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div
                        className="text-3xl font-bold slashed-zero text-card-foreground font-display"
                      >
                        {health}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-tertiary font-semibold mt-1">
                        Score
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col gap-4 flex-1 w-full">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-secondary">Monthly Income</span>
                      <span className="font-semibold text-foreground slashed-zero font-display">₹1,20,000</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-secondary">Surplus</span>
                      <span className="font-semibold text-foreground slashed-zero font-display">₹34,500</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-secondary">Savings Rate</span>
                      <span className="font-semibold text-green-text slashed-zero font-display">28.8%</span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-secondary text-sm">Emergency Fund</span>
                        <span className="font-semibold text-foreground text-xs slashed-zero font-display">62%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: '62%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-[var(--space-4)] md:px-[var(--space-8)]"><hr className="border-t border-[var(--border)]" /></div>

      {/* FEATURES */}
      <section id="features" className="relative z-10 min-h-screen flex items-center py-[var(--space-8)] md:py-[var(--space-12)] px-[var(--space-4)] md:px-[var(--space-8)] snap-start">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center text-foreground mb-4 font-display">
            Your CFO, in your control
          </h2>
          <p className="text-base md:text-lg text-center text-secondary max-w-2xl mx-auto mb-12">
            FinPath brings the financial clarity of a corporate treasury desk to your personal finances.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-6)] md:gap-[var(--space-8)]">
            {/* Feature 1 */}
            <div className="bg-card backdrop-blur-[32px] border border-border rounded-[32px] p-8 relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-accent opacity-10 blur-3xl pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent-subtle text-accent-text mb-6 relative z-10">
                <Target size={24} className="icon-wireframe" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 relative z-10 font-display">Goal-first planning</h3>
              <p className="text-secondary leading-relaxed mb-6 relative z-10 text-sm md:text-base">
                Set any goal with a target amount and timeline. FinPath automatically allocates
                your surplus across goals by priority, adjusting every month as your finances change.
                Track progress with real-time bars and celebrate milestones.
              </p>
              <button onClick={() => navigate('/auth')} className="inline-flex items-center gap-1.5 text-accent-text font-semibold text-sm group-hover:gap-2.5 transition-all relative z-10">
                Set a goal <ArrowRight size={14} />
              </button>
            </div>

            {/* Feature 2 */}
            <div className="bg-card backdrop-blur-[32px] border border-border rounded-[32px] p-8 relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-accent opacity-10 blur-3xl pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent-subtle text-accent-text mb-6 relative z-10">
                <TrendingUp size={24} className="icon-wireframe" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 relative z-10 font-display">Debt payoff intelligence</h3>
              <p className="text-secondary leading-relaxed mb-6 relative z-10 text-sm md:text-base">
                Compare avalanche vs. snowball strategies down to the rupee. Simulate extra payments,
                see your debt-free date, and watch your DTI ratio drop. FinPath picks the strategy
                that saves you the most interest.
              </p>
              <button onClick={() => navigate('/auth')} className="inline-flex items-center gap-1.5 text-accent-text font-semibold text-sm group-hover:gap-2.5 transition-all relative z-10">
                Simulate payoff <ArrowRight size={14} />
              </button>
            </div>

            {/* Feature 3 */}
            <div className="bg-card backdrop-blur-[32px] border border-border rounded-[32px] p-8 relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-accent opacity-10 blur-3xl pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent-subtle text-accent-text mb-6 relative z-10">
                <Sparkles size={24} className="icon-wireframe" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 relative z-10 font-display">Penny AI Companion</h3>
              <p className="text-secondary leading-relaxed mb-6 relative z-10 text-sm md:text-base">
                Meet Penny, your personal AI financial assistant. Penny analyzes your goals, income, and spending to provide contextual insights and answers your finance questions in real-time.
              </p>
              <button onClick={() => navigate('/auth')} className="inline-flex items-center gap-1.5 text-accent-text font-semibold text-sm group-hover:gap-2.5 transition-all relative z-10">
                Meet Penny <ArrowRight size={14} />
              </button>
            </div>

            {/* Feature 4 */}
            <div className="bg-card backdrop-blur-[32px] border border-border rounded-[32px] p-8 relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-accent opacity-10 blur-3xl pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-accent-subtle text-accent-text mb-6 relative z-10">
                <GitBranch size={24} className="icon-wireframe" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 relative z-10 font-display">What-if scenario engine</h3>
              <p className="text-secondary leading-relaxed mb-6 relative z-10 text-sm md:text-base">
                What if you get a 30% raise? Buy a house? Start a family? Model any life change
                and see its impact on every goal and your emergency buffer
                — before you make the move.
              </p>
              <button onClick={() => navigate('/auth')} className="inline-flex items-center gap-1.5 text-[var(--accent-text)] font-semibold text-sm group-hover:gap-2.5 transition-all relative z-10">
                Run a scenario <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-[var(--space-4)] md:px-[var(--space-8)]"><hr className="border-t border-[var(--border)]" /></div>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="relative z-10 min-h-screen flex items-center py-[var(--space-8)] md:py-[var(--space-12)] px-[var(--space-4)] md:px-[var(--space-8)] snap-start">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center text-[var(--foreground)] mb-[var(--space-4)]" style={{ fontFamily: 'var(--font-display)' }}>
            Loved by professionals
          </h2>
          <p className="text-base md:text-lg text-center text-[var(--secondary)] max-w-2xl mx-auto mb-[var(--space-12)]">
            From CFOs to first-time earners, our users trust FinPath to bring order to their money.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-6)] md:gap-[var(--space-8)]">
            {/* T1 */}
            <div className="bg-[var(--card)] backdrop-blur-[32px] border border-[var(--border)] rounded-[32px] p-6 md:p-8 relative overflow-hidden flex flex-col">
              <div className="absolute -bottom-10 -left-10 w-[120px] h-[120px] rounded-full bg-[var(--secondary-accent)] opacity-10 blur-3xl pointer-events-none" />
              <div className="absolute top-4 left-6 text-6xl font-serif font-bold text-[var(--accent)] opacity-25 leading-none">“</div>
              <p className="text-[var(--secondary)] leading-relaxed pt-[var(--space-8)] relative z-10 text-sm md:text-base flex-1">
                I've spent 20 years running P&Ls at Fortune 500 companies. FinPath is the first
                tool that brings that same rigour to my personal finances. The scenario engine alone
                is worth it — I tested a property purchase before making the offer.
              </p>
              <div className="flex items-center gap-[var(--space-3)] mt-[var(--space-6)] relative z-10">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[var(--accent-text)] bg-[var(--accent-subtle)] flex-shrink-0">AK</div>
                <div>
                  <div className="font-semibold text-sm text-[var(--foreground)]">Ananya Krishnan</div>
                  <div className="text-xs text-[var(--tertiary)]">CFO, Bangalore-based SaaS firm</div>
                </div>
              </div>
            </div>

            {/* T2 */}
            <div className="bg-[var(--card)] backdrop-blur-[32px] border border-[var(--border)] rounded-[32px] p-6 md:p-8 relative overflow-hidden flex flex-col">
              <div className="absolute -bottom-10 -left-10 w-[120px] h-[120px] rounded-full bg-[var(--secondary-accent)] opacity-10 blur-3xl pointer-events-none" />
              <div className="absolute top-4 left-6 text-6xl font-serif font-bold text-[var(--accent)] opacity-25 leading-none">“</div>
              <p className="text-[var(--secondary)] leading-relaxed pt-[var(--space-8)] relative z-10 text-sm md:text-base flex-1">
                My CA used to tell me I was saving too little. I set a target savings rate in FinPath
                and within three months I'd gone from 12% to 26%. The automatic allocation across goals
                removed the mental load of deciding where each rupee goes.
              </p>
              <div className="flex items-center gap-[var(--space-3)] mt-[var(--space-6)] relative z-10">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[var(--secondary-accent-text)] bg-[var(--secondary-accent-subtle)] flex-shrink-0">RV</div>
                <div>
                  <div className="font-semibold text-sm text-[var(--foreground)]">Rahul Venkatesh</div>
                  <div className="text-xs text-[var(--tertiary)]">VP Product, Mumbai</div>
                </div>
              </div>
            </div>

            {/* T3 */}
            <div className="bg-[var(--card)] backdrop-blur-[32px] border border-[var(--border)] rounded-[32px] p-6 md:p-8 relative overflow-hidden flex flex-col">
              <div className="absolute -bottom-10 -left-10 w-[120px] h-[120px] rounded-full bg-[var(--secondary-accent)] opacity-10 blur-3xl pointer-events-none" />
              <div className="absolute top-4 left-6 text-6xl font-serif font-bold text-[var(--accent)] opacity-25 leading-none">“</div>
              <p className="text-[var(--secondary)] leading-relaxed pt-[var(--space-8)] relative z-10 text-sm md:text-base flex-1">
                Debt payoff felt like a guessing game until FinPath showed me avalanche vs. snowball
                side-by-side. I chose avalanche and will save ₹1.8L in interest. The progress bar
                is satisfying — it's gamified getting out of debt.
              </p>
              <div className="flex items-center gap-[var(--space-3)] mt-[var(--space-6)] relative z-10">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[var(--tertiary-accent-text)] bg-[var(--tertiary-accent-subtle)] flex-shrink-0">PS</div>
                <div>
                  <div className="font-semibold text-sm text-[var(--foreground)]">Priya Sharma</div>
                  <div className="text-xs text-[var(--tertiary)]">Engineering Lead, Delhi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="relative z-10 py-[var(--space-12)] px-[var(--space-4)] md:px-[var(--space-8)] text-center snap-start">
        <div className="max-w-2xl mx-auto relative py-[var(--space-12)]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-[var(--accent)] opacity-10 blur-[80px] pointer-events-none" />
          <h2 className="text-3xl md:text-[40px] font-bold tracking-tight text-[var(--foreground)] mb-[var(--space-4)] relative z-10" style={{ fontFamily: 'var(--font-display)' }}>
            Where does your next rupee go?
          </h2>
          <p className="text-base md:text-lg text-[var(--secondary)] mb-[var(--space-8)] relative z-10">
            Join thousands of Indian professionals who've stopped guessing and started knowing.
          </p>
          <button onClick={() => navigate('/auth')} className="relative z-10 inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full font-semibold bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_0_24px_var(--accent-glow)] hover:bg-[var(--accent-hover)] hover:shadow-[0_0_36px_var(--accent-glow)] transition-all text-base md:text-lg">
            Start My Free Journey <ArrowRight size={20} />
          </button>
        </div>
      </section>

      <footer className="relative z-10 py-[var(--space-8)] text-center text-sm text-[var(--tertiary)] border-t border-[var(--border)] snap-end">
        &copy; {new Date().getFullYear()} FinPath. Every rupee has a destination.
      </footer>
    </div>

  );
}
