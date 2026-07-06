// ============================================================
// Landing page feature-tab demo panels (extracted from
// Landing.tsx). Purely presentational; no props, no store.
// ============================================================

import { useState, useEffect } from 'react';
import { Zap, Send, Bike, Home, Plane, Snowflake } from 'lucide-react';

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

export function FeatGoals() {
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

export function FeatDebt() {
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

export function FeatPenny() {
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

export function FeatScenarios() {
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
