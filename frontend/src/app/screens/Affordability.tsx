import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import {
  Car,
  Home,
  Bike,
  Plane,
  Pencil,
  TrendingUp,
  Scissors,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { useFinPathStore } from '@/lib/store';
import { demoDream } from '@/lib/fixtures/demoProfile';
import { runAffordability } from '@/lib/math/affordability';
import type { AffordabilityResult, Lever } from '@/lib/math/affordability';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { formatInr, formatInrCompact } from '@/lib/format';
import {
  pageContainer,
  pageSection,
  cardEntry,
  cappedStagger,
  countUpTransition,
} from '../components/motion-variants';
import RecommendationCard from '../components/RecommendationCard';
import { buildCrossGoalInsights } from '@/lib/math/recommendations';
import type { CrossGoalInsightTone } from '@/lib/types';
import type { FinancialProfile } from '@/lib/types';
import TabBar from '@/app/components/TabBar';
import { useTabParam } from '@/app/hooks/useTabParam';

const Scenarios = lazy(() => import('./Scenarios'));

// ── Quick-pick chips ──────────────────────────────────────────────────────────
const QUICK_PICKS = [
  { label: 'Car', icon: Car, cost: 800_000 },
  { label: 'House', icon: Home, cost: 5_000_000 },
  { label: 'Bike', icon: Bike, cost: 100_000 },
  { label: 'Vacation', icon: Plane, cost: 200_000 },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatMonths(n: number): string {
  if (n <= 1) return '1 month';
  if (n < 12) return `${n} months`;
  const y = Math.floor(n / 12);
  const m = n % 12;
  return m === 0 ? `${y} ${y === 1 ? 'year' : 'years'}` : `${y}y ${m}mo`;
}

function leverCopy(
  lever: Lever,
  netMonthlyIncome: number,
): {
  observation: string;
  action: string;
  impact: string;
  tone: 'positive' | 'warning' | 'blocked';
  icon: string;
} {
  switch (lever.type) {
    case 'increaseSurplus':
      return {
        observation: `You need ${formatInr(lever.monthlySavingsNeeded ?? 0)}/month more in savings.`,
        action: `Save ${formatInr(lever.monthlySavingsNeeded ?? 0)} more every month.`,
        impact: `Affordable in ${lever.newMonthsToAfford ? formatMonths(lever.newMonthsToAfford) : '3 years'}.`,
        tone: 'positive',
        icon: 'PiggyBank',
      };
    case 'cutExpenses':
      return {
        observation: `Cutting ${formatInr(lever.monthlySavingsNeeded ?? 0)}/month from expenses frees the gap.`,
        action: `Reduce monthly expenses by ${formatInr(lever.monthlySavingsNeeded ?? 0)}.`,
        impact: `Affordable in ${lever.newMonthsToAfford ? formatMonths(lever.newMonthsToAfford) : '3 years'}.`,
        tone: 'warning',
        icon: 'Scissors',
      };
    case 'extendTenure':
      return {
        observation: `Current tenure puts the EMI over your FOIR limit.`,
        action: `Stretch the loan to ${lever.newTenureMonths} months.`,
        impact: `EMI shrinks to fit within your borrowing capacity.`,
        tone: 'warning',
        icon: 'CalendarClock',
      };
    case 'raiseIncome':
      return {
        observation: `Your income of ${formatInrCompact(netMonthlyIncome)}/month needs to be higher.`,
        action: `Raise net income to ${formatInr(lever.targetIncome ?? 0)}/month.`,
        impact: `Affordable in ${lever.newMonthsToAfford ? formatMonths(lever.newMonthsToAfford) : 'target window'}.`,
        tone: 'warning',
        icon: 'TrendingUp',
      };
  }
}

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, reducedMotion: boolean) {
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => Math.round(v));
  const prevTarget = useRef(target);

  useEffect(() => {
    if (prevTarget.current === target) return;
    prevTarget.current = target;
    if (reducedMotion) {
      motionVal.set(target);
      return;
    }
    void animate(motionVal, target, countUpTransition);
  }, [target, reducedMotion, motionVal]);

  // Initialise on mount
  useEffect(() => {
    if (reducedMotion) {
      motionVal.set(target);
      return;
    }
    void animate(motionVal, target, countUpTransition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return display;
}

// ── Verdict display ───────────────────────────────────────────────────────────
function VerdictBadge({ verdict }: { verdict: AffordabilityResult['verdict'] }) {
  const cfg = {
    affordable_now: { icon: CheckCircle2, label: 'Affordable now', color: 'var(--green)' },
    affordable_later: { icon: Clock, label: 'Affordable later', color: 'var(--amber)' },
    not_affordable: { icon: XCircle, label: 'Not yet', color: 'var(--secondary)' },
  }[verdict];
  const Icon = cfg.icon;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon size={14} style={{ color: cfg.color }} />
      <span
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-weight-semibold)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-widest-sm)',
          color: cfg.color,
        }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

// ── Gap bar ───────────────────────────────────────────────────────────────────
function GapBar({ surplus, gap }: { surplus: number; gap: number }) {
  const total = Math.max(surplus + gap, 1);
  const fillPct = Math.min(100, Math.max(0, (surplus / total) * 100));
  const gapPct = 100 - fillPct;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--secondary)' }}>
          Monthly capacity
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--secondary)' }}>
          {surplus > 0 ? formatInr(surplus) : '—'} / {formatInr(total)}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 99,
          background: 'var(--border)',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div
          aria-label={`${Math.round(fillPct)}% of required monthly capacity available`}
          style={{
            width: `${fillPct}%`,
            background: surplus > 0 ? 'var(--green)' : 'var(--border)',
            transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
        {gap > 0 && (
          <div
            aria-label={`${Math.round(gapPct)}% gap — ${formatInr(gap)} short per month`}
            style={{
              width: `${gapPct}%`,
              background: 'var(--amber)',
              opacity: 0.45,
              transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
            }}
          />
        )}
      </div>
      {gap > 0 && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--amber)', marginTop: 4 }}>
          {formatInr(gap)}/month gap
        </p>
      )}
    </div>
  );
}

// ── Tone mapper ───────────────────────────────────────────────────────────────
function toCardTone(t: CrossGoalInsightTone): 'positive' | 'warning' | 'blocked' {
  return t === 'warning' ? 'warning' : 'positive';
}

// ── Cross-goal insights panel ─────────────────────────────────────────────────
function CrossGoalInsightsPanel({
  dreamName,
  goals,
  profile,
}: {
  dreamName: string;
  goals: FinancialProfile['goals'];
  profile: FinancialProfile;
}) {
  const relevant = useMemo(() => {
    const all = buildCrossGoalInsights(profile);
    if (!dreamName.trim()) return all.slice(0, 2);
    const lower = dreamName.toLowerCase();
    const matchedGoal = goals.find(
      (g) => g.name.toLowerCase().includes(lower) || lower.includes(g.name.toLowerCase()),
    );
    if (matchedGoal) {
      const specific = all.filter((ci) => ci.relatedGoalIds.includes(matchedGoal.id));
      const global = all.filter((ci) => ci.relatedGoalIds.length === 0);
      return [...specific, ...global].slice(0, 2);
    }
    return all.slice(0, 2);
  }, [profile, dreamName, goals]);

  if (relevant.length === 0) return null;

  return (
    <motion.div variants={pageSection}>
      <p className="text-label" style={{ marginBottom: '0.75rem' }}>
        Cross-goal opportunities
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {relevant.map((ci) => (
          <RecommendationCard
            key={ci.id}
            observation={ci.observation}
            action={ci.action}
            impact={ci.impact}
            tone={toCardTone(ci.tone)}
            icon={ci.icon}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Affordability({ onPennyClick }: { onPennyClick?: () => void }) {
  const [searchParams] = useSearchParams();
  const reducedMotion = useReducedMotion() ?? false;
  const [tab, setTab] = useTabParam('tab', 'dream');

  // Store reads
  const netMonthlyIncome = useFinPathStore((s) => s.income.netMonthly);
  const monthlyExpenses = useFinPathStore((s) => s.expenses.total);
  const existingEmiTotal = useFinPathStore((s) => s.debts.totalMonthly);
  const monthlyReserve = useFinPathStore((s) => s.monthlySurplusReserve);
  const investmentReturnRate = useFinPathStore((s) => s.investmentReturnRate);
  const demoMode = useFinPathStore((s) => s.demoMode ?? false);

  // Full profile objects for CrossGoalInsightsPanel
  const income = useFinPathStore((s) => s.income);
  const expenses = useFinPathStore((s) => s.expenses);
  const debts = useFinPathStore((s) => s.debts);
  const savings = useFinPathStore((s) => s.savings);
  const investments = useFinPathStore((s) => s.investments);
  const goals = useFinPathStore((s) => s.goals);
  const healthScore = useFinPathStore((s) => s.healthScore);
  const pendingGoalDecisions = useFinPathStore((s) => s.pendingGoalDecisions);
  const monthlySurplusReserve = useFinPathStore((s) => s.monthlySurplusReserve);
  const emergencyFund = useFinPathStore((s) => s.emergencyFund);

  const crossGoalProfile = useMemo<FinancialProfile>(
    () =>
      ({
        onboarded: true,
        income,
        expenses,
        debts,
        savings,
        investments,
        emergencyFund: emergencyFund,
        goals,
        healthScore,
        plan: null,
        chatHistory: [],
        currency: 'INR',
        strategy: 'avalanche',
        monthlySurplusReserve,
        pendingGoalDecisions,
        lastUpdated: 0,
        investmentReturnRate,
        storageMode: 'local',
        milestones: [],
      }) as FinancialProfile,
    [
      income,
      expenses,
      debts,
      savings,
      investments,
      emergencyFund,
      goals,
      healthScore,
      monthlySurplusReserve,
      pendingGoalDecisions,
      investmentReturnRate,
    ],
  );

  // Pre-fill from URL params, or demo seed when no params present
  const paramName = searchParams.get('name');
  const paramCost = searchParams.get('cost');
  const seedName = paramName ?? (demoMode ? demoDream.name : '');
  const seedCost = paramCost ?? (demoMode ? String(demoDream.targetCost) : '');

  // Input state
  const [dreamName, setDreamName] = useState(seedName);
  const [costRaw, setCostRaw] = useState(seedCost);
  const [route, setRoute] = useState<'cash' | 'emi'>('cash');
  const [rateRaw, setRateRaw] = useState('9');
  const [tenureRaw, setTenureRaw] = useState('60');
  const [activeChip, setActiveChip] = useState<string | null>(null);

  // Debounced slider values (pp2 #2: ≥150ms)
  const debouncedRate = useDebouncedValue(rateRaw, 150);
  const debouncedTenure = useDebouncedValue(tenureRaw, 150);
  const debouncedCost = useDebouncedValue(costRaw, 150);

  const targetCost = parseFloat(debouncedCost.replace(/,/g, '')) || 0;
  const annualRate = parseFloat(debouncedRate) || 9;
  const tenure = parseInt(debouncedTenure) || 60;

  const hasInput = targetCost > 0;

  // Run engine (memoised on debounced inputs only — pp2 #2: suppress re-run between keystrokes)
  const result = useMemo<AffordabilityResult | null>(() => {
    if (!hasInput) return null;
    return runAffordability({
      targetCost,
      route,
      netMonthlyIncome,
      monthlyExpenses,
      monthlyReserve,
      existingEmiTotal,
      investmentReturnRate,
      annualInterestRate: annualRate,
      tenureMonths: tenure,
    });
  }, [
    targetCost,
    route,
    netMonthlyIncome,
    monthlyExpenses,
    monthlyReserve,
    existingEmiTotal,
    investmentReturnRate,
    annualRate,
    tenure,
    hasInput,
  ]);

  // Count-up target: months (cash) or EMI amount (EMI route)
  const countTarget = result
    ? route === 'cash'
      ? (result.monthsToAfford ?? 0)
      : (result.emi ?? 0)
    : 0;
  const displayCount = useCountUp(countTarget, reducedMotion);

  function pickChip(label: string, cost: number) {
    setActiveChip(label);
    setDreamName(label);
    setCostRaw(String(cost));
  }

  const verdictColor = result
    ? {
        affordable_now: 'var(--green)',
        affordable_later: 'var(--amber)',
        not_affordable: 'var(--secondary)',
      }[result.verdict]
    : 'var(--foreground)';

  return (
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: '42rem', margin: '0 auto', paddingBottom: '2rem' }}
    >
      <TabBar
        tabs={[
          { id: 'dream', label: 'Dream' },
          { id: 'grow', label: 'Grow' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'dream' && (
        <>
          {/* ── Header ── */}
          <motion.div variants={pageSection} style={{ marginBottom: '1.5rem' }}>
            <p className="text-label" style={{ marginBottom: 4 }}>
              Affordability
            </p>
            <h2 className="text-title">Can I afford this?</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--secondary)', marginTop: 4 }}>
              Name a dream and see if it fits your plan.
            </p>
          </motion.div>

          {/* ── Input zone ── */}
          <motion.div
            variants={pageSection}
            className="bento-card"
            style={{ marginBottom: '1rem' }}
          >
            {/* Quick-pick chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
              {QUICK_PICKS.map(({ label, icon: Icon, cost }) => (
                <button
                  key={label}
                  onClick={() => pickChip(label, cost)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 99,
                    border: `1px solid ${activeChip === label ? 'var(--accent)' : 'var(--border)'}`,
                    background: activeChip === label ? 'var(--accent-subtle)' : 'transparent',
                    color: activeChip === label ? 'var(--accent)' : 'var(--secondary)',
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
              <button
                onClick={() => {
                  setActiveChip('Custom');
                  setDreamName('');
                  setCostRaw('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 99,
                  border: `1px solid ${activeChip === 'Custom' ? 'var(--accent)' : 'var(--border)'}`,
                  background: activeChip === 'Custom' ? 'var(--accent-subtle)' : 'transparent',
                  color: activeChip === 'Custom' ? 'var(--accent)' : 'var(--secondary)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Pencil size={13} />
                Custom
              </button>
            </div>

            {/* Name + cost inputs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--secondary)',
                    fontWeight: 'var(--font-weight-semibold)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Dream name
                </label>
                <input
                  type="text"
                  placeholder="e.g. New Car"
                  value={dreamName}
                  onChange={(e) => {
                    setDreamName(e.target.value);
                    setActiveChip('Custom');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-tint)',
                    color: 'var(--foreground)',
                    fontSize: 'var(--text-sm)',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--secondary)',
                    fontWeight: 'var(--font-weight-semibold)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Target cost (₹)
                </label>
                <input
                  type="number"
                  placeholder="800000"
                  value={costRaw}
                  onChange={(e) => {
                    setCostRaw(e.target.value);
                    setActiveChip('Custom');
                  }}
                  min={0}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-tint)',
                    color: 'var(--foreground)',
                    fontSize: 'var(--text-sm)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Cash ↔ EMI toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: route === 'emi' ? '1rem' : 0 }}>
              {(['cash', 'emi'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoute(r)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 99,
                    fontSize: 'var(--text-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: `1px solid ${route === r ? 'var(--accent)' : 'var(--border)'}`,
                    background: route === r ? 'var(--accent-subtle)' : 'transparent',
                    color: route === r ? 'var(--accent)' : 'var(--secondary)',
                    fontWeight: route === r ? 'var(--font-weight-semibold)' : undefined,
                  }}
                >
                  {r === 'cash' ? 'Save up (cash)' : 'Take a loan (EMI)'}
                </button>
              ))}
            </div>

            {/* EMI sliders */}
            {route === 'emi' && (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {/* Interest rate */}
                <div className="knob" style={{ flex: '1 1 160px' }}>
                  <div className="knob-header">
                    <label htmlFor="afford-rate" className="text-label">
                      Interest rate
                    </label>
                    <span className="knob-value slashed-zero">{rateRaw}%</span>
                  </div>
                  <input
                    id="afford-rate"
                    type="range"
                    min={5}
                    max={18}
                    step={0.5}
                    value={rateRaw}
                    onChange={(e) => setRateRaw(e.target.value)}
                    aria-valuetext={`${rateRaw} percent`}
                  />
                </div>
                {/* Tenure */}
                <div className="knob" style={{ flex: '1 1 160px' }}>
                  <div className="knob-header">
                    <label htmlFor="afford-tenure" className="text-label">
                      Tenure
                    </label>
                    <span className="knob-value slashed-zero">{tenure} mo</span>
                  </div>
                  <input
                    id="afford-tenure"
                    type="range"
                    min={6}
                    max={360}
                    step={6}
                    value={tenureRaw}
                    onChange={(e) => setTenureRaw(e.target.value)}
                    aria-valuetext={`${tenure} months`}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Empty state ── */}
          {!hasInput && (
            <motion.div
              variants={pageSection}
              className="bento-card"
              style={{ textAlign: 'center', padding: '3rem 2rem' }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                }}
              >
                <ChevronRight size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 6,
                }}
              >
                Name a dream to get started
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--secondary)' }}>
                Pick a quick-start or enter a custom dream above.
              </p>
            </motion.div>
          )}

          {/* ── Verdict zone ── */}
          {result && (
            <motion.div
              variants={pageSection}
              className="bento-card"
              style={{ marginBottom: '1rem' }}
            >
              <VerdictBadge verdict={result.verdict} />

              {/* Headline number */}
              <div style={{ margin: '1rem 0 0.5rem' }}>
                {route === 'cash' && result.monthsToAfford !== null ? (
                  <p style={{ fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
                    {result.verdict === 'affordable_now' ? (
                      <span
                        style={{
                          fontSize: 'var(--text-3xl)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: verdictColor,
                        }}
                      >
                        Affordable now
                      </span>
                    ) : (
                      <>
                        <span
                          style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--secondary)',
                            display: 'block',
                            marginBottom: 2,
                          }}
                        >
                          {dreamName || 'This dream'} is affordable in
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--text-3xl)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: verdictColor,
                          }}
                        >
                          {reducedMotion ? (
                            formatMonths(result.monthsToAfford)
                          ) : (
                            <>
                              <motion.span>{displayCount}</motion.span>
                              <span style={{ fontSize: 'var(--text-xl)' }}> months</span>
                            </>
                          )}
                        </span>
                      </>
                    )}
                  </p>
                ) : route === 'cash' && result.verdict === 'not_affordable' ? (
                  <p style={{ fontFamily: 'var(--font-display)' }}>
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--secondary)',
                        display: 'block',
                        marginBottom: 2,
                      }}
                    >
                      Not yet — monthly surplus is
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-3xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--secondary)',
                      }}
                    >
                      {formatInr(result.monthlySurplus)}
                    </span>
                  </p>
                ) : route === 'emi' && result.emi !== null ? (
                  <p style={{ fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--secondary)',
                        display: 'block',
                        marginBottom: 2,
                      }}
                    >
                      {result.verdict === 'affordable_now'
                        ? 'EMI fits your plan'
                        : 'Your EMI would be'}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-3xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: verdictColor,
                      }}
                    >
                      {reducedMotion ? (
                        `₹${result.emi.toLocaleString('en-IN')}`
                      ) : (
                        <>
                          ₹<motion.span>{displayCount}</motion.span>
                        </>
                      )}
                      <span style={{ fontSize: 'var(--text-xl)' }}>/mo</span>
                    </span>
                  </p>
                ) : null}
              </div>

              {/* FOIR status (EMI route) */}
              {route === 'emi' && result.foirOk !== null && (
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: result.foirOk ? 'var(--green)' : 'var(--amber)',
                    marginBottom: '0.75rem',
                  }}
                >
                  {result.foirOk
                    ? `FOIR OK — total EMIs ${formatInr(existingEmiTotal + (result.emi ?? 0))} ≤ cap ${formatInr(result.foirCapAmount ?? 0)}`
                    : `FOIR exceeded — ${formatInr(existingEmiTotal + (result.emi ?? 0))} > cap ${formatInr(result.foirCapAmount ?? 0)}`}
                </p>
              )}

              {/* Gap bar */}
              {(result.gap > 0 || result.monthlySurplus > 0) && (
                <GapBar surplus={Math.max(0, result.monthlySurplus)} gap={result.gap} />
              )}
            </motion.div>
          )}

          {/* ── Levers zone ── */}
          {result && result.levers.length > 0 && (
            <motion.div variants={pageSection}>
              <p className="text-label" style={{ marginBottom: '0.75rem' }}>
                Ways to close the gap
              </p>
              <motion.div
                variants={{ animate: cappedStagger(result.levers.length) }}
                initial="initial"
                animate="animate"
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {result.levers.map((lever, i) => {
                  const copy = leverCopy(lever, netMonthlyIncome);
                  return (
                    <motion.div key={`${lever.type}-${i}`} variants={cardEntry}>
                      <RecommendationCard
                        observation={copy.observation}
                        action={copy.action}
                        impact={copy.impact}
                        tone={copy.tone}
                        icon={copy.icon}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {/* ── Surplus context (no levers, but result exists) ── */}
          {result && result.levers.length === 0 && result.verdict !== 'not_affordable' && (
            <motion.div
              variants={pageSection}
              className="bento-card"
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'color-mix(in srgb, var(--green) 15%, transparent)',
                }}
              >
                <TrendingUp size={16} style={{ color: 'var(--green)' }} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: 2,
                  }}
                >
                  Your plan can handle this
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--secondary)' }}>
                  Monthly surplus {formatInr(result.monthlySurplus)} covers{' '}
                  {route === 'emi'
                    ? `the ${formatInr(result.emi ?? 0)}/mo EMI`
                    : 'the savings target'}
                  . No tradeoffs needed.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Cross-goal insights ── */}
          {hasInput && (
            <CrossGoalInsightsPanel
              dreamName={dreamName}
              goals={goals}
              profile={crossGoalProfile}
            />
          )}
        </>
      )}
      {tab === 'grow' && (
        <Suspense fallback={null}>
          <Scenarios onPennyClick={onPennyClick} />
        </Suspense>
      )}
    </motion.div>
  );
}
