import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useFinPathStore } from '@/lib/store';
import { getActionCards } from '@/lib/health-score';

interface Props {
  variant: 'compact' | 'full';
}

let prevOverall: number | null = null;

const R = 78;
const CIRCUM = 2 * Math.PI * R;

const SUB_SCORES = [
  { key: 'savingsRate'     as const, label: 'Savings Rate' },
  { key: 'debtLoad'        as const, label: 'Debt Load' },
  { key: 'emergencyFund'   as const, label: 'Emergency Fund' },
  { key: 'incomeStability' as const, label: 'Income Stability' },
] as const;

function subScoreColor(score: number): string {
  const pct = (score / 25) * 100;
  if (pct >= 80) return 'var(--green-muted)';
  if (pct >= 48) return 'var(--accent-text)';
  return 'var(--amber-text)';
}

function getHealthLabel(overall: number): { text: string; color: string } {
  if (overall >= 80) return { text: 'Excellent financial health',   color: 'var(--tertiary-accent-text)' };
  if (overall >= 60) return { text: 'Strong position — keep going', color: 'var(--accent-text)' };
  if (overall >= 40) return { text: 'Steady foundation',            color: 'var(--secondary)' };
  return               { text: "Let's build momentum",              color: 'var(--amber-text)' };
}

export default function HealthScoreWidget({ variant }: Props) {
  const healthScore = useFinPathStore((s) => s.healthScore);
  const [delta, setDelta]     = useState<number | null>(null);
  const [animScore, setAnimScore] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!healthScore) return;
    const t = setTimeout(() => setAnimScore(healthScore.overall), 300);
    return () => clearTimeout(t);
  }, [healthScore?.overall]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!healthScore) return;
    if (prevOverall !== null && prevOverall !== healthScore.overall) {
      setDelta(healthScore.overall - prevOverall);
    }
    prevOverall = healthScore.overall;
  }, [healthScore?.overall]);

  if (!healthScore) return null;

  const ringSize    = variant === 'compact' ? 140 : 180;
  const scoreOffset = CIRCUM - (animScore / 100) * CIRCUM;
  const label       = getHealthLabel(healthScore.overall);
  const actionCards = getActionCards(healthScore).slice(0, variant === 'compact' ? 1 : 2);

  const deltaPill = delta !== null ? (
    <span
      className="inline-flex items-center gap-1 rounded-full text-xs font-semibold"
      style={{
        padding: '2px 10px',
        background: delta >= 0 ? 'rgba(122,201,154,0.12)' : 'rgba(248,113,113,0.1)',
        color: delta >= 0 ? 'var(--green-muted)' : 'var(--red-text)',
        fontFamily: 'var(--font-display)',
      }}
    >
      {delta >= 0 ? '↑' : '↓'} {delta >= 0 ? '+' : ''}{delta} since last update
    </span>
  ) : null;

  const ring = (
    <div style={{ position: 'relative', width: ringSize, height: ringSize, flexShrink: 0 }}>
      <svg
        viewBox="0 0 200 200"
        className="health-ring-svg"
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label={`Health score: ${healthScore.overall} out of 100`}
      >
        <defs>
          <linearGradient id="hw-health-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--secondary-accent)" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--border)" strokeWidth="14" strokeDasharray="6 6" />
        <circle
          cx="100" cy="100" r={R}
          fill="none"
          stroke="url(#hw-health-grad)"
          strokeWidth="14"
          strokeDasharray={CIRCUM}
          strokeDashoffset={scoreOffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1500ms cubic-bezier(0.22,1,0.36,1)',
            filter: 'drop-shadow(0 0 var(--space-1) var(--accent-glow))',
          }}
        />
      </svg>
      <div className="health-score-overlay">
        <span className="slashed-zero health-score-num">{animScore}</span>
        <span className="text-label">Score</span>
      </div>
    </div>
  );

  const bars = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
      {SUB_SCORES.map((s, i) => {
        const score = healthScore[s.key];
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--secondary)', width: 110, flexShrink: 0 }}>
              {s.label}
            </span>
            <div className="sub-score-bar" style={{ flex: 1 }}>
              <div
                className="sub-score-fill"
                style={{
                  width: mounted ? `${(score / 25) * 100}%` : 0,
                  transitionDelay: `${i * 80}ms`,
                }}
              />
            </div>
            <span
              className="slashed-zero"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: subScoreColor(score),
                width: 28,
                textAlign: 'right',
                flexShrink: 0,
                fontFamily: 'var(--font-display)',
              }}
            >
              {score}/25
            </span>
          </div>
        );
      })}
    </div>
  );

  const actionSection = actionCards.length > 0 ? (
    <div className="penny-card bento-card" style={{ marginTop: 'var(--space-2)' }}>
      <div className="penny-insight-blob" />
      <div className="relative z-10 flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--penny-accent-subtle)', color: 'var(--penny-accent)' }}
        >
          <Sparkles size={14} />
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--penny-accent)' }}>
          {variant === 'compact' ? "Penny's top action" : "Penny's top actions"}
        </div>
      </div>
      <div className="relative z-10 space-y-2">
        {actionCards.map((a, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}
          >
            <span
              className="mt-0.5 flex-shrink-0"
              style={{ color: 'var(--penny-accent)', fontWeight: 'var(--font-weight-bold)' }}
            >
              {i + 1}.
            </span>
            <div>
              <p style={{ color: 'var(--card-foreground)', fontSize: 'var(--text-sm)' }}>{a.text}</p>
              <p style={{ color: 'var(--green-muted)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', marginTop: 3 }}>
                → +{a.impact} points projected
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  if (variant === 'compact') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '188px', flexShrink: 0, gap: 'var(--gap-base)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <p className="text-label">Health Meter</p>
          {deltaPill}
        </div>
        {ring}
        <p className="health-label" style={{ color: label.color }}>{label.text}</p>
        {bars}
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        {ring}
        <div>
          <p
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: label.color,
              marginBottom: 8,
              fontFamily: 'var(--font-display)',
            }}
          >
            {label.text}
          </p>
          {deltaPill}
        </div>
      </div>
      <div style={{ marginBottom: 'var(--space-2)' }}>{bars}</div>
      {actionSection}
    </>
  );
}
