import PdfPage from "./PdfPage";
import type { ThemeTokens } from "@/lib/theme-tokens";
import type { HealthScore } from "@/lib/types";

export interface PdfHealthScorePageProps {
  healthScore: HealthScore | null;
  dateLabel: string;
  tokens: ThemeTokens;
}

interface SubScore {
  label: string;
  score: number;
  max: number;
  description: string;
}

function statusFor(
  score: number,
  max: number,
  tokens: ThemeTokens,
): { label: string; color: string; bg: string } {
  const pct = (score / max) * 100;
  if (pct >= 72) {
    return { label: "Strong", color: tokens.greenText, bg: tokens.greenSubtle };
  }
  if (pct >= 48) {
    return {
      label: "Steady",
      color: tokens.accentText,
      bg: tokens.surfaceTint,
    };
  }
  return { label: "Improve", color: tokens.amberText, bg: tokens.surfaceTint };
}

function Donut({
  score,
  tokens,
}: {
  score: number;
  tokens: ThemeTokens;
}) {
  const size = 192;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={tokens.surfaceHover}
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={tokens.accent}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeDashoffset={c / 4}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: tokens.fontDisplay,
          fontSize: 52,
          fontWeight: 700,
          fill: tokens.cardFg,
          fontVariantNumeric: "slashed-zero tabular-nums" as React.CSSProperties["fontVariantNumeric"],
        }}
      >
        {score}
      </text>
      <text
        x="50%"
        y="64%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: tokens.fontBody,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.18em",
          fill: tokens.tertiary,
        }}
      >
        OF 100
      </text>
    </svg>
  );
}

export default function PdfHealthScorePage({
  healthScore,
  dateLabel,
  tokens,
}: PdfHealthScorePageProps) {
  const subscores: SubScore[] = [
    {
      label: "Savings Rate",
      score: healthScore?.savingsRate ?? 0,
      max: 25,
      description:
        "Income left over after expenses, as a share of total income.",
    },
    {
      label: "Debt Load",
      score: healthScore?.debtLoad ?? 0,
      max: 25,
      description: "Share of income going to debt servicing each month.",
    },
    {
      label: "Emergency Fund",
      score: healthScore?.emergencyFund ?? 0,
      max: 25,
      description:
        "How many months of essential expenses your liquid savings cover.",
    },
    {
      label: "Income Stability",
      score: healthScore?.incomeStability ?? 0,
      max: 25,
      description: "How diversified your income sources are.",
    },
  ];

  return (
    <PdfPage
      slot="health"
      pageIndex={1}
      totalPages={4}
      dateLabel={dateLabel}
      tokens={tokens}
      accentBar={tokens.secondaryAccent}
    >
      <div style={{ marginBottom: 18 }}>
        <p
          style={{
            margin: 0,
            fontFamily: tokens.fontBody,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: tokens.tertiary,
          }}
        >
          Financial Health
        </p>
        <h2
          style={{
            margin: "6px 0 0",
            fontFamily: tokens.fontDisplay,
            fontSize: 36,
            fontWeight: 700,
            color: tokens.cardFg,
            letterSpacing: "-0.02em",
          }}
        >
          How you&rsquo;re doing across four dimensions
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 28,
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Donut score={healthScore?.overall ?? 0} tokens={tokens} />
        </div>
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: tokens.fontDisplay,
              fontSize: 22,
              fontWeight: 700,
              color: tokens.cardFg,
            }}
          >
            Overall score
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: tokens.fontBody,
              fontSize: 14,
              lineHeight: 1.6,
              color: tokens.secondary,
            }}
          >
            Calculated from your savings rate, debt load, emergency fund, and
            income stability. Each dimension is scored out of 25; together they
            roll up to a 0&ndash;100 health score updated whenever your plan
            changes.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 22,
        }}
      >
        {subscores.map((s) => {
          const status = statusFor(s.score, s.max, tokens);
          const pct = Math.min(100, Math.max(0, (s.score / s.max) * 100));
          return (
            <div
              key={s.label}
              style={{
                border: `1px solid ${tokens.border}`,
                borderRadius: 16,
                padding: "14px 16px",
                backgroundColor: tokens.card,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: tokens.fontBody,
                    fontSize: 13,
                    fontWeight: 600,
                    color: tokens.cardFg,
                  }}
                >
                  {s.label}
                </p>
                <span
                  style={{
                    fontFamily: tokens.fontBody,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: status.color,
                    backgroundColor: status.bg,
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}
                >
                  {status.label}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: tokens.fontDisplay,
                  fontSize: 22,
                  fontWeight: 700,
                  color: tokens.cardFg,
                  fontVariantNumeric: "slashed-zero tabular-nums",
                }}
              >
                {s.score}
                <span
                  style={{
                    fontSize: 13,
                    color: tokens.tertiary,
                    fontWeight: 500,
                    marginLeft: 4,
                  }}
                >
                  / {s.max}
                </span>
              </p>
              <div
                style={{
                  marginTop: 8,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: tokens.surfaceHover,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    backgroundColor: status.color,
                  }}
                />
              </div>
              <p
                style={{
                  margin: "10px 0 0",
                  fontFamily: tokens.fontBody,
                  fontSize: 11,
                  color: tokens.tertiary,
                  lineHeight: 1.5,
                }}
              >
                {s.description}
              </p>
            </div>
          );
        })}
      </div>

      <div
        style={{
          border: `1px solid ${tokens.border}`,
          borderRadius: 16,
          padding: "16px 18px",
          backgroundColor: tokens.surfaceTint,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: tokens.fontBody,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: tokens.secondaryAccentText,
          }}
        >
          Penny&rsquo;s top actions
        </p>
        {(healthScore?.actions?.length
          ? healthScore.actions
          : [
              "Complete your plan to surface personalised actions.",
            ]
        )
          .slice(0, 3)
          .map((action, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  backgroundColor: tokens.accent,
                  color: tokens.onAccent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: tokens.fontDisplay,
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: tokens.fontBody,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: tokens.cardFg,
                  flex: 1,
                }}
              >
                {action}
              </p>
            </div>
          ))}
      </div>
    </PdfPage>
  );
}
