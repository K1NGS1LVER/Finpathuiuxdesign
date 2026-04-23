import { useNavigate } from 'react-router';
import { Target, TrendingUp, Shield, Sparkles, Calendar, Lightbulb, ArrowRight, Sun, Moon, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

const goals = [
  { icon: Target, title: 'Dream Bike', color: 'var(--lime)' },
  { icon: TrendingUp, title: 'Investment', color: 'var(--violet)' },
  { icon: Shield, title: 'Emergency Fund', color: 'var(--blue)' },
  { icon: Sparkles, title: 'Wedding', color: 'var(--amber)' },
  { icon: Calendar, title: 'Vacation', color: 'var(--lime)' },
  { icon: Lightbulb, title: 'Upskill Course', color: 'var(--violet)' },
];

const testimonials = [
  { name: 'Aditi Sharma', role: 'Software Engineer', text: `"FinPath completely transformed how I track my mutual funds and EMIs. The UI is absolutely gorgeous and the AI insights are spot on."`, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop' },
  { name: 'Rahul Verma', role: 'Product Manager', text: `"I've never seen a finance app that looks this good. The glassmorphic design and the seamless dark mode make checking my budget a joy."`, image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop' },
  { name: 'Priya Patel', role: 'Freelancer', text: `"Penny is a lifesaver. She helps me categorize my irregular income and plan my taxes without any of the usual headache."`, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop' }
];

export default function Landing({ isDark, setIsDark }: LandingProps) {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full overflow-x-hidden overflow-y-auto relative scroll-smooth" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-50 bg-[var(--card)] shadow-[var(--shadow-md)] border border-[var(--border)] text-[var(--card-foreground)]"
      >
        {isDark ? <Sun size={20} className="icon-wireframe" /> : <Moon size={20} className="icon-wireframe" />}
      </button>

      {/* Decorative Blurred Blobs (Fixed to background) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="data-blob w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] top-[-10%] left-[-10%] bg-[var(--violet)] opacity-30" />
        <div className="data-blob w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bottom-[-20%] right-[-10%] bg-[var(--blue)] opacity-30" />
        <div className="data-blob w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-[var(--lime)] opacity-10 mix-blend-screen" />
      </div>

      {/* HERO SECTION - 100vh (Single View) */}
      <div className="min-h-full w-full flex flex-col justify-center items-center px-4 py-8 relative z-10">
        <div className="max-w-4xl w-full flex flex-col items-center gap-4 md:gap-6">
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--lime)] shadow-[0_0_12px_var(--lime)]" />
              <span className="text-title slashed-zero text-base md:text-xl font-bold">
                finpath
              </span>
            </div>

            <h1 className="text-hero slashed-zero !text-3xl md:!text-5xl leading-tight">
              Every rupee has a <br />
              <span style={{ color: 'var(--lime-text)' }}>destination</span><span style={{ color: 'var(--lime-text)' }}>.</span>
            </h1>

            <p className="text-xs md:text-base text-[var(--secondary)] font-medium max-w-lg mx-auto">
              AI-powered finance companion for Indian professionals.
            </p>
          </div>

          {/* Compact Bento Grid */}
          <div className="grid grid-cols-3 gap-2 md:gap-3 w-full max-w-2xl mt-2">
            {goals.map((goal, i) => {
              const Icon = goal.icon;
              return (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -5, 0],
                    rotate: [0, 0.5, -0.5, 0]
                  }}
                  transition={{ 
                    duration: 3 + (i % 3) * 0.5, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: i * 0.2
                  }}
                  className="bento-card flex flex-col items-center justify-center text-center p-2 md:p-4 cursor-default"
                >
                  <div
                    className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-1 md:mb-2"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${goal.color} 15%, transparent)`,
                      color: goal.color,
                    }}
                  >
                    <Icon size={18} className="icon-wireframe w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <h3 className="font-semibold text-[10px] md:text-sm text-[var(--card-foreground)]">
                    {goal.title}
                  </h3>
                </motion.div>
              );
            })}
          </div>

          {/* CTA & Scroll Indicator */}
          <div className="flex items-center gap-6 mt-2">
            <button
              onClick={() => navigate('/auth')}
              className="px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-sm md:text-base flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 bg-[var(--lime)] text-[#050F1C] shadow-[0_8px_32px_rgba(176,255,9,0.3)]"
            >
              Start My Journey
              <ArrowRight size={20} className="icon-wireframe" />
            </button>
            
            {/* Scroll Indicator */}
            <motion.button 
              className="flex items-center gap-2 text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors cursor-pointer group outline-none"
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
            >
              <span className="text-[10px] md:text-xs font-bold tracking-wider uppercase">Stories</span>
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--surface-tint)] border border-[var(--border)] group-hover:bg-[var(--surface-hover)] transition-colors shadow-sm">
                <ArrowDown size={20} className="icon-wireframe" />
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS SECTION */}
      <div className="min-h-full w-full py-20 px-4 md:px-8 relative z-10 flex flex-col items-center justify-center">
        <div className="max-w-5xl w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold slashed-zero mb-4 text-[var(--foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
              Loved by thousands
            </h2>
            <p className="text-base md:text-xl text-[var(--secondary)]">
              See what others are saying about their journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(8px)', rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', rotateX: 0 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.4, 0, 0.2, 1] }}
                className="bento-card p-6 md:p-8 flex flex-col h-full cursor-default transition-transform hover:-translate-y-2"
                style={{ 
                  background: 'var(--surface-tint)', 
                  backdropFilter: 'blur(32px)', 
                  WebkitBackdropFilter: 'blur(32px)',
                  perspective: 1000
                }}
              >
                <div className="text-[var(--lime)] mb-4 text-4xl font-serif">"</div>
                <p className="text-sm md:text-base text-[var(--card-foreground)] mb-8 flex-1 italic leading-relaxed font-medium">
                  {testimonial.text}
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-[var(--lime)]"
                  />
                  <div>
                    <h4 className="font-bold text-[var(--card-foreground)] text-sm">{testimonial.name}</h4>
                    <p className="text-xs text-[var(--secondary)]">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
