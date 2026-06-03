// ============================================================
// RecommendationCard — design-system primitive for Penny advice.
// Implements Observation → Action → Impact layout with Action
// visually primary. Tone controls impact/observation colour.
// Animation (stagger, entry) is applied by the parent, not here.
// ============================================================

import * as LucideIcons from 'lucide-react';
import type React from 'react';

export interface RecommendationCardProps {
  observation: string;
  action: string;
  impact: string;
  /** 'positive' (green) | 'warning' (amber) | 'blocked' (muted). Default: 'positive' */
  tone?: 'positive' | 'warning' | 'blocked';
  /** Lucide icon name for the observation row. Default: 'Lightbulb' */
  icon?: string;
  /** Makes card interactive when provided */
  onClick?: () => void;
  /** Extra className forwarded to the card root */
  className?: string;
}

const TONE_COLOR: Record<NonNullable<RecommendationCardProps['tone']>, string> = {
  positive: 'var(--green)',
  warning: 'var(--amber)',
  blocked: 'var(--secondary)',
};

export default function RecommendationCard({
  observation,
  action,
  impact,
  tone = 'positive',
  icon = 'Lightbulb',
  onClick,
  className = '',
}: RecommendationCardProps) {
  const iconColor = TONE_COLOR[tone];

  // Resolve Lucide icon dynamically from string name
  const IconComponent =
    (LucideIcons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[
      icon
    ] ?? LucideIcons.Lightbulb;

  const interactive = onClick !== undefined;

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <div
      className={['penny-card', interactive ? 'card-hover cursor-pointer' : '', className]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      onKeyDown={interactive ? handleKeyDown : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`Observation: ${observation}. Action: ${action}. Impact: ${impact}`}
      style={{ padding: 0, display: 'flex', flexDirection: 'column' }}
    >
      {/* ── OBSERVATION row ── */}
      <div
        style={{
          padding: `var(--space-2) var(--space-2) var(--space-1)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--gap-md)',
          }}
        >
          <IconComponent
            size={14}
            className="icon-wireframe"
            style={{ color: iconColor, flexShrink: 0 } as React.CSSProperties}
          />
          <span
            style={{
              fontSize: 'var(--text-2xs)',
              fontWeight: 'var(--font-weight-semibold)',
              letterSpacing: 'var(--tracking-widest-sm)',
              color: 'var(--secondary)',
              textTransform: 'uppercase',
            }}
          >
            Observation
          </span>
        </div>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--secondary)',
            lineHeight: 'var(--leading-snug)',
            margin: 0,
          }}
        >
          {observation}
        </p>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* ── ACTION row (visually primary) ── */}
      <div
        style={{
          padding: `var(--space-2)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-sm)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-2xs)',
            fontWeight: 'var(--font-weight-semibold)',
            letterSpacing: 'var(--tracking-widest-sm)',
            color: 'var(--accent)',
            textTransform: 'uppercase',
          }}
        >
          Action
        </span>
        <p
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--accent)',
            lineHeight: 'var(--leading-snug)',
            margin: 0,
          }}
        >
          {action}
        </p>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* ── IMPACT row ── */}
      <div
        style={{
          padding: `var(--space-1) var(--space-2) var(--space-2)`,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--gap-md)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: iconColor,
            }}
          >
            →
          </span>
          <span
            style={{
              fontSize: 'var(--text-2xs)',
              fontWeight: 'var(--font-weight-semibold)',
              letterSpacing: 'var(--tracking-widest-sm)',
              color: iconColor,
              textTransform: 'uppercase',
            }}
          >
            Impact
          </span>
        </div>
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: iconColor,
            lineHeight: 'var(--leading-snug)',
            margin: 0,
          }}
        >
          {impact}
        </p>
      </div>
    </div>
  );
}
