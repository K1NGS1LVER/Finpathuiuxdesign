import { motion } from 'motion/react';
import { Palette, Type, Ruler, Layers, Square, Award } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { pageContainer, pageSection, cardEntry } from '@/app/components/motion-variants';
import { useReducedMotion } from '@/lib/useReducedMotion';

// ─── Data ──────────────────────────────────────────────────────────────────

const COLOR_FAMILIES = [
  {
    label: 'Primary',
    swatches: [
      { token: '--accent', name: 'Accent' },
      { token: '--accent-text', name: 'Accent Text' },
      { token: '--accent-subtle', name: 'Subtle' },
      { token: '--accent-glow', name: 'Glow' },
      { token: '--on-accent', name: 'On Accent', border: true },
    ],
  },
  {
    label: 'Secondary',
    swatches: [
      { token: '--secondary-accent', name: 'Secondary' },
      { token: '--secondary-accent-text', name: 'Text' },
      { token: '--secondary-accent-subtle', name: 'Subtle' },
      { token: '--secondary-accent-glow', name: 'Glow' },
    ],
  },
  {
    label: 'Tertiary',
    swatches: [
      { token: '--tertiary-accent', name: 'Tertiary' },
      { token: '--tertiary-accent-text', name: 'Text' },
      { token: '--tertiary-accent-subtle', name: 'Subtle' },
    ],
  },
  {
    label: 'Semantic',
    swatches: [
      { token: '--green', name: 'Green' },
      { token: '--green-subtle', name: 'Green Subtle' },
      { token: '--amber', name: 'Amber' },
      { token: '--amber-subtle', name: 'Amber Subtle' },
      { token: '--red', name: 'Red' },
      { token: '--red-subtle', name: 'Red Subtle' },
    ],
  },
  {
    label: 'Surface',
    swatches: [
      { token: '--card', name: 'Card', border: true },
      { token: '--surface-tint', name: 'Tint', border: true },
      { token: '--surface-hover', name: 'Hover', border: true },
      { token: '--border', name: 'Border', border: true },
      { token: '--foreground', name: 'Foreground' },
      { token: '--secondary', name: 'Secondary' },
      { token: '--tertiary', name: 'Tertiary' },
    ],
  },
];

const TYPE_ROWS = [
  { size: '--text-2xs', label: '2xs · 10px', sample: 'Caption and metadata' },
  { size: '--text-xs', label: 'xs · 12px', sample: 'Labels and tags' },
  { size: '--text-sm', label: 'sm · 13.5px', sample: 'Body secondary' },
  { size: '--text-base', label: 'base · 15px', sample: 'Default body text' },
  { size: '--text-lg', label: 'lg · 17px', sample: 'Large body copy' },
  { size: '--text-xl', label: 'xl · 20px', sample: 'Section heading' },
  { size: '--text-2xl', label: '2xl · 24px', sample: 'Card heading' },
  { size: '--text-3xl', label: '3xl · 30px', sample: 'Page title' },
  { size: '--text-4xl', label: '4xl · 36px', sample: 'Hero sub' },
  { size: '--text-5xl', label: '5xl · 48px', sample: 'Display' },
];

const SPACING_ENTRIES: { token: string; label: string; px: number }[] = [
  { token: '--space-0_5', label: '0.5 · 4px', px: 4 },
  { token: '--space-1', label: '1 · 8px', px: 8 },
  { token: '--space-2', label: '2 · 16px', px: 16 },
  { token: '--space-3', label: '3 · 24px', px: 24 },
  { token: '--space-4', label: '4 · 32px', px: 32 },
  { token: '--space-5', label: '5 · 40px', px: 40 },
  { token: '--space-6', label: '6 · 48px', px: 48 },
  { token: '--space-8', label: '8 · 64px', px: 64 },
];

const RADIUS_ENTRIES = [
  { token: '--radius-xs', label: 'xs · 4px' },
  { token: '--radius-sm', label: 'sm · 8px' },
  { token: '--radius-base', label: 'base · 12px' },
  { token: '--radius-md', label: 'md · 16px' },
  { token: '--radius-lg', label: 'lg · 24px' },
  { token: '--radius-xl', label: 'xl · 32px' },
  { token: '--radius-full', label: 'full · 9999px' },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-1)' }}>
        <Icon size={16} className="icon-wireframe" />
        <span
          className="uppercase tracking-wider"
          style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-body)', color: 'var(--secondary)', letterSpacing: '0.08em' }}
        >
          {subtitle}
        </span>
      </div>
      <h2
        style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-display)', fontWeight: 'var(--font-weight-bold)', color: 'var(--card-foreground)' }}
      >
        {title}
      </h2>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DesignSystem() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="max-w-5xl mx-auto space-y-10 relative pb-12"
      variants={pageContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Page decorative glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ backgroundColor: 'var(--secondary-accent)' }}
      />

      {/* Header */}
      <motion.div className="relative z-10" variants={pageSection}>
        <p className="text-label">Reference</p>
        <h1 className="text-title text-secondary tracking-[0.15em] mb-2">Design System</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
          Live tokens, type scale, spacing, radius, and components — all sourced from <code style={{ fontSize: 'var(--text-xs)', background: 'var(--surface-hover)', padding: '1px 6px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>theme.css</code>.
          Toggle light/dark from the header to see values update in realtime.
        </p>
      </motion.div>

      {/* ── 1. Components ── */}
      <motion.section className="bento-card p-6 md:p-8 relative z-10" variants={pageSection}>
        <SectionHeader icon={Layers} title="Components" subtitle="UI primitives" />

        {/* Buttons */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--tertiary)', fontFamily: 'var(--font-body)', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Buttons
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary">Primary Action</button>
            <button
              style={{
                padding: 'var(--btn-padding-y) var(--btn-padding-x)',
                borderRadius: 'var(--btn-radius)',
                background: 'var(--surface-tint)',
                border: '1px solid var(--border)',
                color: 'var(--card-foreground)',
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--btn-font-size)',
                cursor: 'pointer',
              }}
            >
              Ghost Button
            </button>
            <button className="pill button-press flex items-center gap-2">
              <Award size={12} style={{ color: 'var(--accent)' }} /> Pill Button
            </button>
            <button
              className="pill-button"
              style={{
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                border: 'none',
              }}
            >
              Pill Filled
            </button>
            <button disabled className="btn-primary" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
              Disabled
            </button>
          </div>
        </div>

        {/* Cards */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--tertiary)', fontFamily: 'var(--font-body)', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Cards
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bento card */}
            <motion.div
              className="bento-card card-hover p-5"
              variants={reduced ? {} : cardEntry}
            >
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--secondary)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>bento-card</p>
              <p style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-display)', fontWeight: 'var(--font-weight-bold)', color: 'var(--card-foreground)' }}>
                ₹1,40,000
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--tertiary)', marginTop: 4 }}>Monthly income · +12%</p>
            </motion.div>

            {/* Penny card */}
            <div className="bento-card penny-card p-5 relative overflow-hidden">
              <div className="penny-blob" />
              <div className="relative z-10">
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--penny-accent)', fontFamily: 'var(--font-body)', marginBottom: 4, fontWeight: 'var(--font-weight-semibold)' }}>penny-card</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                  Penny insight card with radial glow background and tinted border.
                </p>
              </div>
            </div>

            {/* Chip variants */}
            <div className="bento-card p-5 flex flex-col gap-3 justify-center">
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--tertiary)', fontFamily: 'var(--font-body)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Status chips
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="pill" style={{ background: 'var(--green-subtle)', color: 'var(--green-text)', border: '1px solid var(--green)' }}>On track</span>
                <span className="pill" style={{ background: 'var(--amber-subtle)', color: 'var(--amber-text)', border: '1px solid var(--amber)' }}>At risk</span>
                <span className="pill" style={{ background: 'var(--red-subtle)', color: 'var(--red-text)', border: '1px solid var(--red)' }}>Overdue</span>
                <span className="pill" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', border: '1px solid var(--accent-glow)' }}>Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Motion note */}
        <div
          style={{
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-base)',
            background: 'var(--surface-tint)',
            border: '1px solid var(--border)',
          }}
        >
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
            All motion uses <code style={{ fontSize: 'var(--text-2xs)', background: 'var(--surface-hover)', padding: '1px 5px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>motion/react</code> with shared variants from{' '}
            <code style={{ fontSize: 'var(--text-2xs)', background: 'var(--surface-hover)', padding: '1px 5px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>motion-variants.ts</code>.
            Respects <code style={{ fontSize: 'var(--text-2xs)', background: 'var(--surface-hover)', padding: '1px 5px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>prefers-reduced-motion</code> — instant fallbacks for all sequences.
          </p>
        </div>
      </motion.section>

      {/* ── 2. Color Palette ── */}
      <motion.section className="bento-card p-6 md:p-8 relative z-10" variants={pageSection}>
        <SectionHeader icon={Palette} title="Color Tokens" subtitle="Brand & Semantic" />
        <div className="space-y-6">
          {COLOR_FAMILIES.map((family) => (
            <div key={family.label}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--tertiary)', fontFamily: 'var(--font-body)', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-weight-semibold)' }}>
                {family.label}
              </p>
              <div className="flex flex-wrap gap-3">
                {family.swatches.map(({ token, name, border }) => (
                  <motion.div
                    key={token}
                    variants={reduced ? {} : cardEntry}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--radius-md)',
                        background: `var(${token})`,
                        border: border ? '1px solid var(--border)' : '1px solid transparent',
                        boxShadow: 'var(--shadow-sm)',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-body)', color: 'var(--card-foreground)', fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap' }}>
                        {name}
                      </p>
                      <p style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--tertiary)', whiteSpace: 'nowrap' }}>
                        {token}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── 3. Typography Scale ── */}
      <motion.section className="bento-card p-6 md:p-8 relative z-10" variants={pageSection}>
        <SectionHeader icon={Type} title="Type Scale" subtitle="Font sizes" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
          {/* Display column */}
          <div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--tertiary)', fontFamily: 'var(--font-body)', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Display · {'{--font-display}'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {TYPE_ROWS.map(({ size, label, sample }) => (
                <div
                  key={size}
                  className="flex items-baseline gap-4"
                  style={{ paddingBottom: 'var(--space-0_5)', borderBottom: '1px solid var(--border)' }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: `var(${size})`,
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--card-foreground)',
                      flex: 1,
                      lineHeight: 1.2,
                    }}
                  >
                    {sample}
                  </span>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--tertiary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Body column */}
          <div className="mt-6 lg:mt-0">
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--tertiary)', fontFamily: 'var(--font-body)', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Body · {'{--font-body}'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {TYPE_ROWS.map(({ size, label, sample }) => (
                <div
                  key={size}
                  className="flex items-baseline gap-4"
                  style={{ paddingBottom: 'var(--space-0_5)', borderBottom: '1px solid var(--border)' }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: `var(${size})`,
                      fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--secondary)',
                      flex: 1,
                      lineHeight: 1.2,
                    }}
                  >
                    {sample}
                  </span>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--tertiary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 4. Spacing + Radius ── */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10" variants={pageSection}>
        {/* Spacing */}
        <div className="bento-card p-6">
          <SectionHeader icon={Ruler} title="Spacing" subtitle="8px grid" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {SPACING_ENTRIES.map(({ token, label, px }) => (
              <div key={token} className="flex items-center gap-3">
                <div
                  style={{
                    height: 8,
                    width: Math.round((px / 64) * 100) + '%',
                    maxWidth: '100%',
                    background: 'linear-gradient(90deg, var(--accent), var(--secondary-accent))',
                    borderRadius: 'var(--radius-full)',
                    flexShrink: 0,
                    minWidth: px <= 4 ? 4 : undefined,
                  }}
                />
                <span style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--tertiary)', whiteSpace: 'nowrap' }}>
                  {token} · {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Radius */}
        <div className="bento-card p-6">
          <SectionHeader icon={Square} title="Border Radius" subtitle="Radius scale" />
          <div className="flex flex-wrap gap-4">
            {RADIUS_ENTRIES.map(({ token, label }) => (
              <div key={token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: 'var(--surface-hover)',
                    border: '1.5px solid var(--accent)',
                    borderRadius: `var(${token})`,
                  }}
                />
                <span style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--tertiary)', textAlign: 'center' }}>
                  {label.split(' · ')[0]}
                  <br />
                  <span style={{ color: 'var(--secondary)' }}>{label.split(' · ')[1]}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
