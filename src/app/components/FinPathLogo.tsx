import { useId } from 'react';

interface FinPathLogoProps {
  size?: number;
  showWordmark?: boolean;
  wordmarkSize?: string;
  wordmarkGap?: string | number;
}

export default function FinPathLogo({
  size = 26,
  showWordmark = false,
  wordmarkSize = '14px',
  wordmarkGap = 8,
}: FinPathLogoProps) {
  const uid = useId();
  const gradId = `fp-grad-${uid}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: wordmarkGap }}>
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" style={{ stopColor: 'var(--accent)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--secondary-accent)' }} />
          </linearGradient>
        </defs>
        <path d="M12 60 L38 30" stroke={`url(#${gradId})`} strokeWidth="11" strokeLinecap="round" />
        <path d="M38 30 L64 60" stroke={`url(#${gradId})`} strokeWidth="11" strokeLinecap="round" />
        <path
          d="M51 44 L66 16"
          stroke={`url(#${gradId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.38"
          strokeDasharray="2 4"
        />
        <circle cx="68" cy="13" r="6" fill="var(--accent)" />
        <circle cx="68" cy="13" r="2.8" fill="var(--logo-dot-inner)" />
      </svg>
      {showWordmark && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: wordmarkSize,
            letterSpacing: '-0.025em',
            whiteSpace: 'nowrap',
            color: 'var(--foreground)',
          }}
        >
          fin<span style={{ color: 'var(--accent)' }}>path</span>
        </span>
      )}
    </div>
  );
}
