import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Target,
  Zap,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  Star,
  MessageCircle,
  Check,
  Send,
  FileText,
  CalendarCheck,
  Coins,
  Bike,
  Home,
  Plane,
  ChevronRight,
  Snowflake,
} from 'lucide-react';
import FinPathLogo from '@/app/components/FinPathLogo';

interface LandingProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

type PennyMsg = { role: 'user' | 'penny'; text: string };

function useCountUp(target: number, active: boolean, duration = 1600) {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active, duration]);
  return val;
}

function useInView(threshold = 0.15): [React.MutableRefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function MiniRing({ pct, color, size = 76 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const [a, setA] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setA(pct), 400);
    return () => clearTimeout(id);
  }, [pct]);
  const off = circ - (a / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1200ms cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--foreground)',
            fontVariantNumeric: 'slashed-zero tabular-nums',
          }}
        >
          {a}%
        </span>
      </div>
    </div>
  );
}

function FeatGoals() {
  const goals = [
    {
      Icon: Bike,
      name: 'Royal Enfield',
      pct: 45,
      color: 'var(--accent)',
      subtle: 'var(--accent-subtle)',
      glow: 'var(--accent-glow)',
      monthly: '₹8,500',
    },
    {
      Icon: Home,
      name: 'Down Payment',
      pct: 12,
      color: 'var(--secondary-accent)',
      subtle: 'var(--secondary-accent-subtle)',
      glow: 'var(--secondary-accent-glow)',
      monthly: '₹15,000',
    },
    {
      Icon: Plane,
      name: 'Europe Trip',
      pct: 67,
      color: 'var(--tertiary-accent)',
      subtle: 'var(--tertiary-accent-subtle)',
      glow: 'var(--tertiary-accent-glow)',
      monthly: '₹6,000',
    },
  ];
  return (
    <div style={{ display: 'flex', gap: 12, padding: '24px 20px', justifyContent: 'center' }}>
      {goals.map((g) => (
        <div
          key={g.name}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: '20px 12px',
            borderRadius: 16,
            background: 'var(--surface-tint)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: g.subtle,
              border: `1px solid ${g.glow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: g.color,
              flexShrink: 0,
            }}
          >
            <g.Icon size={18} strokeWidth={1.5} />
          </div>
          <MiniRing pct={g.pct} color={g.color} size={76} />
          <div style={{ textAlign: 'center' }}>
            <p
              style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', marginBottom: 2 }}
            >
              {g.name}
            </p>
            <p style={{ fontSize: 10, color: 'var(--tertiary)' }}>{g.monthly}/mo</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatDebt() {
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          padding: 18,
          borderRadius: 16,
          background: 'var(--accent-subtle)',
          border: '1px solid var(--accent-glow)',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 99,
          }}
        >
          Recommended
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <Zap size={14} strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>
            Avalanche Method
          </p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <p
              style={{
                fontSize: 9,
                color: 'var(--tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 2,
              }}
            >
              Interest saved
            </p>
            <p
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--accent-text)',
                fontVariantNumeric: 'slashed-zero tabular-nums',
              }}
            >
              ₹28,400
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: 9,
                color: 'var(--tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 2,
              }}
            >
              Debt-free in
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)' }}>18 months</p>
          </div>
        </div>
      </div>
      <div
        style={{
          padding: 18,
          borderRadius: 16,
          background: 'var(--surface-tint)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--secondary-accent-subtle)',
              border: '1px solid var(--secondary-accent-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--secondary-accent)',
            }}
          >
            <Snowflake size={14} strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>
            Snowball Method
          </p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <p
              style={{
                fontSize: 9,
                color: 'var(--tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 2,
              }}
            >
              Interest saved
            </p>
            <p
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--secondary)',
                fontVariantNumeric: 'slashed-zero tabular-nums',
              }}
            >
              ₹12,100
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: 9,
                color: 'var(--tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 2,
              }}
            >
              Debt-free in
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--secondary)' }}>22 months</p>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: 'var(--secondary)', textAlign: 'center' }}>
        Avalanche saves you ₹16,300 more in interest
      </p>
    </div>
  );
}

function FeatPenny() {
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            maxWidth: '78%',
            padding: '11px 14px',
            fontSize: 13,
            lineHeight: 1.55,
            borderRadius: '18px 18px 4px 18px',
            background: 'var(--accent)',
            color: 'var(--on-accent)',
          }}
        >
          What should I prioritize this month?
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--secondary-accent))',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          P
        </div>
        <div
          style={{
            maxWidth: '80%',
            padding: '11px 14px',
            fontSize: 13,
            lineHeight: 1.55,
            borderRadius: '4px 18px 18px 18px',
            background: 'var(--surface-tint)',
            border: '1px solid var(--border)',
            color: 'var(--secondary)',
          }}
        >
          Pay <strong style={{ color: 'var(--foreground)' }}>₹6K to Europe trip</strong> first — 3
          months out. Then debt EMIs, then save the rest.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div
          style={{
            flex: 1,
            padding: '8px 14px',
            borderRadius: 99,
            background: 'var(--surface-tint)',
            border: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--tertiary)',
          }}
        >
          Ask Penny anything...
        </div>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--secondary-accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={14} strokeWidth={2} color="#fff" />
        </div>
      </div>
    </div>
  );
}

function FeatScenarios() {
  const W = 300,
    H = 140;
  const months = Array.from({ length: 12 }, (_, i) => i);
  const base = months.map((m) => 240 + m * 10);
  const raise = months.map((m) => 240 + m * 18);
  const home = months.map((m) =>
    m < 3 ? 240 + m * 8 : m < 5 ? 252 - (m - 3) * 35 : m < 7 ? 182 + m * 5 : 217 + (m - 7) * 14,
  );
  const all = [...base, ...raise, ...home];
  const mn = Math.min(...all),
    mx = Math.max(...all);
  const toX = (i: number) => (i / 11) * W;
  const toY = (v: number) => H - 10 - ((v - mn) / (mx - mn)) * (H - 20);
  const pts = (arr: number[]) => arr.map((v, i) => `${toX(i)},${toY(v)}`).join(' L ');
  const legend = [
    { label: 'Current pace', color: 'var(--tertiary)', dashed: false },
    { label: '30% raise', color: 'var(--accent)', dashed: false },
    { label: 'Buy home', color: 'var(--secondary-accent)', dashed: true },
  ];
  return (
    <div style={{ padding: '20px 20px 12px' }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <path
          d={`M ${pts(base)}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <path
          d={`M ${pts(raise)}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M ${pts(home)}`}
          fill="none"
          stroke="var(--secondary-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5 3"
        />
      </svg>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10 }}>
        {legend.map(({ label, color, dashed }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              style={{
                width: 18,
                height: 2,
                borderRadius: 99,
                background: dashed ? 'none' : color,
                backgroundImage: dashed
                  ? `repeating-linear-gradient(90deg,${color},${color} 4px,transparent 4px,transparent 7px)`
                  : 'none',
              }}
            />
            <span style={{ fontSize: 10, color: 'var(--secondary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};
const STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function Landing({ isDark, setIsDark }: LandingProps) {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);

  const [scrolled, setScrolled] = useState(false);
  const [hAnim, setHAnim] = useState(0);
  const [barAnim, setBarAnim] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [pennyMsgs, setPennyMsgs] = useState<PennyMsg[]>([]);
  const [pennyTyping, setPennyTyping] = useState(false);

  const [statsRef, statsInView] = useInView(0.3);
  const [pennyRef, pennyInView] = useInView(0.15);

  const n1 = useCountUp(450, statsInView);
  const n2 = useCountUp(12000, statsInView);

  // Hero card 3D tilt — follows cursor position across all corners
  const heroCardRef = useRef<HTMLDivElement>(null);
  const TILT_MAX = 6; // max degrees of tilt

  const handleCardTilt = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = heroCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    // Normalize cursor position to -1…+1 from center
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    // rotateY follows horizontal position, rotateX is inverted vertical
    const rotY = x * TILT_MAX;
    const rotX = -y * TILT_MAX;
    card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    card.style.boxShadow = `${-rotY * 1.5}px ${rotX * 1.5}px 60px -12px var(--accent-glow), var(--shadow-lg)`;
  }, []);

  const handleCardReset = useCallback(() => {
    const card = heroCardRef.current;
    if (!card) return;
    card.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease';
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    card.style.boxShadow = 'var(--shadow-lg)';
    // Restore fast transition for next mouse move
    setTimeout(() => {
      if (card) card.style.transition = 'transform 0.15s ease-out, box-shadow 0.3s ease';
    }, 500);
  }, []);

  // Nav scroll transparency
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const h = () => setScrolled(el.scrollTop > 40);
    el.addEventListener('scroll', h, { passive: true });
    return () => el.removeEventListener('scroll', h);
  }, []);

  // Hero card animation
  useEffect(() => {
    const t1 = setTimeout(() => setHAnim(78), 400);
    const t2 = setTimeout(() => setBarAnim(62), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Penny chat loop
  useEffect(() => {
    if (!pennyInView) return;
    let cancelled = false;
    const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const run = async (): Promise<void> => {
      await delay(600);
      if (cancelled) return;
      setPennyMsgs([{ role: 'user', text: 'When can I afford the Royal Enfield?' }]);
      await delay(700);
      if (cancelled) return;
      setPennyTyping(true);
      await delay(1400);
      if (cancelled) return;
      setPennyTyping(false);
      setPennyMsgs((m) => [
        ...m,
        {
          role: 'penny',
          text: "At ₹8,500/month you'll hit your ₹2L target by July 2027 — 13 months away. A ₹2K top-up gets you there by May 2027. Want me to update the plan?",
        },
      ]);
      await delay(2200);
      if (cancelled) return;
      setPennyMsgs((m) => [...m, { role: 'user', text: 'Yes please — update it!' }]);
      await delay(600);
      if (cancelled) return;
      setPennyTyping(true);
      await delay(1600);
      if (cancelled) return;
      setPennyTyping(false);
      setPennyMsgs((m) => [
        ...m,
        {
          role: 'penny',
          text: "Done! I've bumped your allocation to ₹10,500/month. You'll save ₹4,200 in total. New goal date: May 2027.",
        },
      ]);
      await delay(4000);
      if (cancelled) return;
      setPennyMsgs([]);
      setPennyTyping(false);
      if (!cancelled) run();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [pennyInView]);

  const hCirc = 2 * Math.PI * 70;
  const hOffset = hCirc - (hAnim / 100) * hCirc;

  const FEATURES = [
    {
      Icon: Target,
      title: 'Goal-first planning',
      desc: 'Set any goal with a target amount and timeline. FinPath auto-allocates your surplus across goals every month — adjusting as your finances change.',
      Visual: FeatGoals,
    },
    {
      Icon: Zap,
      title: 'Debt payoff intelligence',
      desc: 'Compare Avalanche vs Snowball strategies side-by-side. See your debt-free date, interest saved, and the exact rupee impact of switching.',
      Visual: FeatDebt,
    },
    {
      Icon: Sparkles,
      title: 'Penny AI companion',
      desc: 'Your personal financial AI reads your full plan. Ask Penny anything — from "what should I pay this month" to "can I afford a vacation next year."',
      Visual: FeatPenny,
    },
    {
      Icon: TrendingUp,
      title: 'What-if scenarios',
      desc: 'Model any life change — 30% raise, buying a home, starting a family — and see the impact on every goal and your emergency buffer before you commit.',
      Visual: FeatScenarios,
    },
  ];

  const FeatVisual = FEATURES[activeFeature].Visual;

  const scrollTo = (id: string) => {
    pageRef.current?.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const gradBtn: React.CSSProperties = {
    background: 'linear-gradient(135deg, var(--accent) 40%, var(--secondary-accent) 140%)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 99,
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    boxShadow: '0 4px 16px var(--accent-glow)',
    transition: 'all 200ms ease',
  };

  return (
    <div
      ref={pageRef}
      className="h-screen w-full overflow-x-hidden overflow-y-auto scroll-smooth bg-background text-foreground"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* ── NAV ── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 48px',
          background: scrolled ? 'var(--card)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
          transition: 'all 350ms ease',
        }}
      >
        <FinPathLogo size={28} showWordmark wordmarkSize="18px" wordmarkGap={8} />

        <div className="hidden md:flex items-center gap-7">
          {[
            ['Features', '#features'],
            ['How it works', '#how'],
            ['Testimonials', '#testimonials'],
          ].map(([l, h]) => (
            <a
              key={l}
              href={h}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(h);
              }}
              className="text-sm font-medium text-secondary hover:text-foreground transition-colors"
              style={{ textDecoration: 'none' }}
            >
              {l}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/auth')}
            className="hidden md:inline-flex items-center gap-1.5"
            style={{
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 99,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--secondary)',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              fontFamily: 'var(--font-display)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-glow)';
              e.currentTarget.style.color = 'var(--foreground)';
              e.currentTarget.style.background = 'var(--surface-tint)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogIn size={14} strokeWidth={1.5} /> Sign In
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="hidden md:inline-flex items-center gap-1.5"
            style={{ ...gradBtn, padding: '9px 22px', fontSize: 13 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 24px var(--accent-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 4px 16px var(--accent-glow)';
            }}
          >
            <UserPlus size={14} strokeWidth={1.5} /> Get Started
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--surface-tint)',
              border: '1px solid var(--border)',
              color: 'var(--secondary)',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            {isDark ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="md:hidden"
            style={{ ...gradBtn, padding: '7px 16px', fontSize: 12 }}
          >
            Start
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          padding: '100px 48px 60px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <div
            className="landing-blob-hero-primary"
            style={{
              position: 'absolute',
              top: '15%',
              left: '10%',
              width: '55vw',
              height: '55vh',
              borderRadius: '50%',
              background: 'var(--accent-glow)',
              filter: 'blur(100px)',
            }}
          />
          <div
            className="landing-blob-hero-secondary"
            style={{
              position: 'absolute',
              bottom: '20%',
              right: '10%',
              width: '40vw',
              height: '45vh',
              borderRadius: '50%',
              background: 'var(--secondary-accent-glow)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-[60px] items-center w-full max-w-[1280px] mx-auto relative z-10">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(44px,5vw,72px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                color: 'var(--foreground)',
                marginBottom: 22,
              }}
            >
              Every rupee has a{' '}
              <span
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, var(--accent) 0%, var(--secondary-accent) 55%, var(--tertiary-accent) 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                destination
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              style={{
                fontSize: 18,
                color: 'var(--secondary)',
                lineHeight: 1.7,
                marginBottom: 36,
                maxWidth: 480,
              }}
              className="mx-auto lg:mx-0"
            >
              FinPath maps your income to every goal, debt, and reserve — automatically. No
              spreadsheets. No guesswork.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
              className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 flex-wrap mb-9"
            >
              <button
                onClick={() => navigate('/auth')}
                style={{
                  ...gradBtn,
                  padding: '14px 28px',
                  fontSize: 15,
                  boxShadow: '0 6px 24px var(--accent-glow)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 36px var(--accent-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 6px 24px var(--accent-glow)';
                }}
              >
                Start My Journey <ArrowRight size={16} strokeWidth={2} />
              </button>
              <button
                onClick={() => navigate('/?demo=1')}
                style={{
                  padding: '14px 28px',
                  borderRadius: 99,
                  fontSize: 15,
                  fontWeight: 500,
                  background: 'var(--surface-tint)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'var(--accent-glow)';
                  el.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'var(--border)';
                  el.style.transform = '';
                }}
              >
                View demo <ArrowRight size={14} strokeWidth={2} />
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
              className="flex items-center justify-center lg:justify-start gap-2.5"
            >
              <div className="flex">
                {['AK', 'RV', 'PS', 'MG', 'SN'].map((i, idx) => (
                  <div
                    key={i}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--accent-subtle)',
                      border: '2px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 7,
                      fontWeight: 700,
                      color: 'var(--accent-text)',
                      marginLeft: idx ? -6 : 0,
                      flexShrink: 0,
                    }}
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={9} fill="var(--amber)" color="var(--amber)" />
                  ))}
                </div>
                <p style={{ fontSize: 10, color: 'var(--secondary)' }}>
                  Trusted by <strong style={{ color: 'var(--foreground)' }}>12,000+</strong> Indian
                  professionals
                </p>
              </div>
            </motion.div>
          </div>

          {/* Hero card — interactive 3D tilt that follows cursor */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="flex justify-center lg:justify-end"
            style={{ perspective: 1200 }}
          >
            <div
              ref={heroCardRef}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 560,
                background: 'var(--card)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid var(--border)',
                borderRadius: 32,
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
                willChange: 'transform',
              }}
              onMouseMove={handleCardTilt}
              onMouseLeave={handleCardReset}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  opacity: 0.08,
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -32,
                  left: -32,
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  background: 'var(--secondary-accent)',
                  opacity: 0.06,
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '14px 22px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {['var(--red)', 'var(--amber)', 'var(--green)'].map((c) => (
                  <div
                    key={c}
                    style={{ width: 10, height: 10, borderRadius: '50%', background: c }}
                  />
                ))}
              </div>
              <div style={{ padding: '36px 40px' }}>
                <div style={{ display: 'flex', gap: 36, alignItems: 'flex-start' }}>
                  <div style={{ position: 'relative', width: 152, height: 152, flexShrink: 0 }}>
                    <svg
                      width={152}
                      height={152}
                      viewBox="0 0 160 160"
                      style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}
                    >
                      <defs>
                        <linearGradient id="hero-ring-g" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" />
                          <stop offset="40%" stopColor="var(--accent)" />
                          <stop offset="100%" stopColor="var(--secondary-accent)" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="12"
                        strokeDasharray="6 6"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="url(#hero-ring-g)"
                        strokeWidth="12"
                        strokeDasharray={hCirc}
                        strokeDashoffset={hOffset}
                        strokeLinecap="round"
                        style={{
                          transition: 'stroke-dashoffset 1500ms cubic-bezier(0.4,0,0.2,1)',
                          filter: 'drop-shadow(0 0 6px var(--accent-glow))',
                        }}
                      />
                    </svg>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 36,
                          fontWeight: 700,
                          color: 'var(--foreground)',
                          fontVariantNumeric: 'slashed-zero tabular-nums',
                        }}
                      >
                        {hAnim}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--tertiary)',
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        Score
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                    {[
                      { label: 'Monthly Income', val: '₹1,20,000', color: 'var(--foreground)' },
                      { label: 'Surplus', val: '₹34,500', color: 'var(--foreground)' },
                      { label: 'Savings Rate', val: '28.8%', color: 'var(--green-text)' },
                    ].map((s) => (
                      <div
                        key={s.label}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: 15, color: 'var(--secondary)' }}>{s.label}</span>
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 15,
                            fontWeight: 600,
                            color: s.color,
                            fontVariantNumeric: 'slashed-zero tabular-nums',
                          }}
                        >
                          {s.val}
                        </span>
                      </div>
                    ))}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ fontSize: 15, color: 'var(--secondary)' }}>
                          Emergency Fund
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--foreground)',
                            fontVariantNumeric: 'slashed-zero tabular-nums',
                          }}
                        >
                          62%
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: 6,
                          borderRadius: 99,
                          background: 'var(--border)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${barAnim}%`,
                            borderRadius: 99,
                            background: 'var(--accent)',
                            transition: 'width 1200ms cubic-bezier(.22,1,.36,1)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div
        ref={statsRef}
        style={{
          background: 'var(--surface-tint)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '28px 48px',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 24,
          }}
        >
          {[
            { Icon: Coins, val: `₹${n1}Cr`, label: 'tracked across goals', color: 'var(--accent)' },
            {
              Icon: Target,
              val: `${n2.toLocaleString('en-IN')}+`,
              label: 'active users',
              color: 'var(--secondary-accent)',
            },
            { Icon: Star, val: '4.9', label: 'average rating', color: 'var(--amber)' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <s.Icon size={20} strokeWidth={1.5} color={s.color} />
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 700,
                  color: s.color,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'slashed-zero tabular-nums',
                }}
              >
                {s.val}
              </p>
              <p style={{ fontSize: 13, color: 'var(--secondary)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={FADE_UP}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent-text)',
                marginBottom: 14,
              }}
            >
              Everything you need
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px,4vw,52px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: 'var(--foreground)',
                marginBottom: 14,
              }}
            >
              Your CFO, in your pocket
            </h2>
            <p
              style={{
                fontSize: 17,
                color: 'var(--secondary)',
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.65,
              }}
            >
              The financial clarity of a corporate treasury desk — built for Indian professionals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:[grid-template-columns:2fr_3fr] gap-7 items-stretch">
            {/* Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FEATURES.map((f, i) => {
                const active = activeFeature === i;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveFeature(i)}
                    style={{
                      textAlign: 'left',
                      padding: '16px 18px',
                      borderRadius: 16,
                      background: active ? 'var(--accent-subtle)' : 'var(--surface-tint)',
                      border: `1px solid ${active ? 'var(--accent-glow)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: active ? 8 : 0,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: active ? 'var(--accent-subtle)' : 'var(--surface-hover)',
                          border: `1px solid ${active ? 'var(--accent-glow)' : 'var(--border)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: active ? 'var(--accent)' : 'var(--tertiary)',
                          flexShrink: 0,
                        }}
                      >
                        <f.Icon size={15} strokeWidth={1.5} />
                      </div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: active ? 'var(--foreground)' : 'var(--secondary)',
                          flex: 1,
                        }}
                      >
                        {f.title}
                      </span>
                      {active && <ChevronRight size={14} color="var(--accent)" strokeWidth={2} />}
                    </div>
                    {active && (
                      <p
                        style={{
                          fontSize: 13,
                          color: 'var(--secondary)',
                          lineHeight: 1.6,
                          paddingLeft: 42,
                        }}
                      >
                        {f.desc}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Visual panel */}
            <div
              style={{
                background: 'var(--card)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                borderRadius: 22,
                border: '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '11px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-tint)',
                }}
              >
                {['var(--red)', 'var(--amber)', 'var(--green)'].map((c) => (
                  <div
                    key={c}
                    style={{ width: 10, height: 10, borderRadius: '50%', background: c }}
                  />
                ))}
                <span style={{ fontSize: 10, color: 'var(--tertiary)', marginLeft: 8 }}>
                  {FEATURES[activeFeature].title}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <FeatVisual />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how"
        style={{
          padding: '100px 48px',
          background: 'var(--surface-tint)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={FADE_UP}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent-text)',
                marginBottom: 14,
              }}
            >
              Simple by design
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px,3.5vw,48px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: 'var(--foreground)',
              }}
            >
              Up and running in 5 minutes
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={STAGGER}
            className="grid grid-cols-1 md:grid-cols-3 gap-7 relative"
          >
            <div
              className="hidden md:block absolute"
              style={{
                top: 40,
                left: '16.5%',
                right: '16.5%',
                height: 1,
                background: 'linear-gradient(90deg, var(--accent), var(--secondary-accent))',
                opacity: 0.25,
                zIndex: 0,
              }}
            />
            {[
              {
                Icon: FileText,
                n: '01',
                title: 'Fill in your numbers',
                desc: 'Income, expenses, debts, and savings in under 2 minutes. No bank connections required.',
              },
              {
                Icon: Sparkles,
                n: '02',
                title: 'Penny builds your plan',
                desc: 'Your AI companion allocates your monthly surplus across every goal and debt automatically.',
              },
              {
                Icon: CalendarCheck,
                n: '03',
                title: 'Check in monthly',
                desc: "A simple checklist every month. Mark what you've done, celebrate wins, watch your net worth grow.",
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                variants={FADE_UP}
                style={{
                  padding: 28,
                  borderRadius: 20,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, var(--accent), var(--secondary-accent))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <s.Icon size={20} strokeWidth={1.5} color="#fff" />
                </div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--tertiary)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  {s.n}
                </p>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    marginBottom: 10,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--secondary)', lineHeight: 1.65 }}>
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PENNY DEMO ── */}
      <section style={{ padding: '100px 48px' }}>
        <div
          ref={pennyRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-[64px] items-center max-w-[1100px] mx-auto"
        >
          {/* Text */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={FADE_UP}
            className="text-center lg:text-left"
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 14px',
                borderRadius: 99,
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-glow)',
                marginBottom: 20,
              }}
            >
              <Sparkles size={12} strokeWidth={1.5} color="var(--accent)" />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--accent-text)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Meet Penny
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px,3.5vw,44px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: 'var(--foreground)',
                marginBottom: 16,
                lineHeight: 1.1,
              }}
            >
              Your AI financial companion
            </h2>
            <p
              style={{ fontSize: 16, color: 'var(--secondary)', lineHeight: 1.7, marginBottom: 28 }}
            >
              Penny knows your full financial picture — income, goals, debts, timeline. Ask her
              anything, any time.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Reads your full anonymized financial plan',
                'Answers questions in plain language',
                'Proactively flags risks and opportunities',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--green-subtle)',
                      border: '1px solid var(--green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Check size={11} strokeWidth={2.5} color="var(--green)" />
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Chat window */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const, delay: 0.15 },
              },
            }}
            style={{
              background: 'var(--card)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              borderRadius: 24,
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--surface-tint)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--secondary-accent))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                P
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Penny</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--green)',
                      boxShadow: '0 0 6px var(--green)',
                    }}
                  />
                  <p style={{ fontSize: 11, color: 'var(--green-text)' }}>
                    Online · reading your plan
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                minHeight: 256,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                justifyContent: 'flex-end',
              }}
            >
              {pennyMsgs.length === 0 && (
                <p
                  style={{
                    textAlign: 'center',
                    fontSize: 13,
                    color: 'var(--tertiary)',
                    padding: '24px 0',
                  }}
                >
                  Penny is ready to help...
                </p>
              )}
              {pennyMsgs.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: 'flex',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: 8,
                    alignItems: 'flex-end',
                  }}
                >
                  {m.role === 'penny' && (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background:
                          'linear-gradient(135deg, var(--accent), var(--secondary-accent))',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      P
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: '78%',
                      padding: '11px 15px',
                      fontSize: 13,
                      lineHeight: 1.6,
                      borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                      background: m.role === 'user' ? 'var(--accent)' : 'var(--surface-tint)',
                      border: m.role === 'penny' ? '1px solid var(--border)' : 'none',
                      color: m.role === 'user' ? '#fff' : 'var(--secondary)',
                      boxShadow: m.role === 'user' ? '0 4px 14px var(--accent-glow)' : 'none',
                    }}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {pennyTyping && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), var(--secondary-accent))',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    P
                  </div>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '4px 18px 18px 18px',
                      background: 'var(--surface-tint)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                    }}
                  >
                    {[0, 1, 2].map((d) => (
                      <motion.div
                        key={d}
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: 'var(--secondary)',
                        }}
                        animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: d * 0.18,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: 8,
                background: 'var(--surface-tint)',
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 99,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  color: 'var(--tertiary)',
                }}
              >
                Ask Penny anything...
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--secondary-accent))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px var(--accent-glow)',
                }}
              >
                <Send size={15} strokeWidth={2} color="#fff" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        id="testimonials"
        style={{
          padding: '100px 48px',
          background: 'var(--surface-tint)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={FADE_UP}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent-text)',
                marginBottom: 14,
              }}
            >
              Loved by professionals
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px,3.5vw,48px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: 'var(--foreground)',
              }}
            >
              Real results, real people
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={STAGGER}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {[
              {
                initials: 'AK',
                color: 'var(--accent)',
                subtle: 'var(--accent-subtle)',
                glow: 'var(--accent-glow)',
                quote:
                  "I've run P&Ls at Fortune 500 companies for 20 years. FinPath is the first tool that brings that rigour to personal finances. The scenario engine alone is worth it.",
                name: 'Ananya Krishnan',
                role: 'CFO, Bangalore-based SaaS',
              },
              {
                initials: 'RV',
                color: 'var(--secondary-accent)',
                subtle: 'var(--secondary-accent-subtle)',
                glow: 'var(--secondary-accent-glow)',
                quote:
                  'My CA told me I was saving too little. I set a target in FinPath and within 3 months went from 12% to 26% savings rate. The auto-allocation removed all mental load.',
                name: 'Rahul Venkatesh',
                role: 'VP Product, Mumbai',
              },
              {
                initials: 'PS',
                color: 'var(--tertiary-accent)',
                subtle: 'var(--tertiary-accent-subtle)',
                glow: 'var(--tertiary-accent-glow)',
                quote:
                  'Debt payoff felt like guesswork until FinPath showed Avalanche vs Snowball side by side. I chose Avalanche and will save ₹1.8L in interest.',
                name: 'Priya Sharma',
                role: 'Engineering Lead, Delhi',
              },
            ].map((c, i) => (
              <motion.div
                key={i}
                variants={FADE_UP}
                style={{
                  padding: 28,
                  borderRadius: 22,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -20,
                    left: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: c.color,
                    opacity: 0.07,
                    filter: 'blur(30px)',
                    pointerEvents: 'none',
                  }}
                />
                <MessageCircle
                  size={20}
                  strokeWidth={1.5}
                  color={c.color}
                  style={{ opacity: 0.4, marginBottom: 14 }}
                />
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--secondary)',
                    lineHeight: 1.7,
                    flex: 1,
                    marginBottom: 20,
                  }}
                >
                  {c.quote}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 16,
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: c.subtle,
                      border: `1px solid ${c.glow}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: c.color,
                      flexShrink: 0,
                    }}
                  >
                    {c.initials}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
                      {c.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--tertiary)' }}>{c.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          padding: '120px 48px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'var(--accent)',
            opacity: 0.06,
            filter: 'blur(80px)',
            pointerEvents: 'none',
          }}
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={FADE_UP}
          style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent-text)',
              marginBottom: 16,
            }}
          >
            Start today
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px,4vw,56px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--foreground)',
              marginBottom: 16,
              lineHeight: 1.05,
            }}
          >
            Where does your next rupee go?
          </h2>
          <p
            style={{ fontSize: 17, color: 'var(--secondary)', marginBottom: 40, lineHeight: 1.65 }}
          >
            Join thousands of Indian professionals who've stopped guessing and started knowing.
          </p>
          <button
            onClick={() => navigate('/auth')}
            style={{
              ...gradBtn,
              padding: '16px 40px',
              fontSize: 16,
              fontWeight: 700,
              boxShadow: '0 8px 32px var(--accent-glow)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 14px 44px var(--accent-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 8px 32px var(--accent-glow)';
            }}
          >
            Start My Free Journey <ArrowRight size={18} strokeWidth={2.5} />
          </button>
          <p style={{ fontSize: 12, color: 'var(--tertiary)', marginTop: 14 }}>
            Free forever · No bank connections required · 2-min setup
          </p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="flex items-center justify-between flex-wrap gap-3"
        style={{ borderTop: '1px solid var(--border)', padding: '28px 48px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FinPathLogo size={22} showWordmark wordmarkSize="13px" wordmarkGap={8} />
          <span style={{ fontSize: 12, color: 'var(--tertiary)', marginLeft: 8 }}>
            · Every rupee has a destination.
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--tertiary)' }}>
          © {new Date().getFullYear()} FinPath. Built for Indian professionals.
        </p>
      </footer>
    </div>
  );
}
