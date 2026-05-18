import FinPathLogo from "../FinPathLogo";
import { formatInr, formatInrCompact } from "@/lib/format";
import type { ThemeTokens } from "@/lib/theme-tokens";
import {
  PDF_PAGE_HEIGHT,
  PDF_PAGE_MARGIN,
  PDF_PAGE_WIDTH,
} from "./PdfPage";

export interface PdfCoverPageProps {
  dateLabel: string;
  netWorth: number;
  monthlySurplus: number;
  goalsCompleted: number;
  goalsTotal: number;
  healthScore: number | null;
  tokens: ThemeTokens;
}

export default function PdfCoverPage({
  dateLabel,
  netWorth,
  monthlySurplus,
  goalsCompleted,
  goalsTotal,
  healthScore,
  tokens,
}: PdfCoverPageProps) {
  const kpis = [
    {
      label: "Net Worth",
      value: formatInrCompact(netWorth),
      tint: tokens.accentText,
    },
    {
      label: "Monthly Surplus",
      value: formatInr(Math.max(0, monthlySurplus)),
      tint: tokens.greenText,
    },
    {
      label: "Goals Tracked",
      value:
        goalsTotal > 0
          ? `${goalsCompleted} / ${goalsTotal}`
          : "—",
      tint: tokens.secondaryAccentText,
    },
    {
      label: "Health Score",
      value: healthScore != null ? `${healthScore} / 100` : "—",
      tint: tokens.amberText,
    },
  ];

  return (
    <div
      data-pdf-page="cover"
      style={{
        width: PDF_PAGE_WIDTH,
        height: PDF_PAGE_HEIGHT,
        backgroundColor: tokens.card,
        color: tokens.cardFg,
        fontFamily: tokens.fontBody,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 16% 18%, ${tokens.accent35}, transparent 55%), radial-gradient(circle at 84% 82%, ${tokens.secondaryAccent30}, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "relative",
          padding: `${PDF_PAGE_MARGIN}px ${PDF_PAGE_MARGIN}px ${PDF_PAGE_MARGIN - 16}px`,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <FinPathLogo size={36} showWordmark wordmarkSize="22px" wordmarkGap={12} />
          <p
            style={{
              margin: 0,
              fontFamily: tokens.fontBody,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: tokens.tertiary,
            }}
          >
            Snapshot &middot; {dateLabel}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 16,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: tokens.fontBody,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: tokens.secondaryAccentText,
            }}
          >
            Your Financial Plan
          </p>
          <h1
            style={{
              margin: 0,
              fontFamily: tokens.fontDisplay,
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.02,
              color: tokens.cardFg,
              maxWidth: 640,
            }}
          >
            Where you stand today
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: tokens.fontBody,
              fontSize: 16,
              color: tokens.secondary,
              maxWidth: 540,
              lineHeight: 1.6,
            }}
          >
            A four-page snapshot of your cashflow, your financial health, and what to focus on next &mdash; ready to share with an advisor or keep for your records.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {kpis.map((k) => (
            <div
              key={k.label}
              style={{
                backgroundColor: tokens.card,
                border: `1px solid ${tokens.border}`,
                borderRadius: 18,
                padding: "20px 22px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: tokens.fontBody,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: tokens.tertiary,
                }}
              >
                {k.label}
              </p>
              <p
                style={{
                  margin: "8px 0 0",
                  fontFamily: tokens.fontDisplay,
                  fontSize: 32,
                  fontWeight: 700,
                  color: k.tint,
                  letterSpacing: "-0.01em",
                  fontVariantNumeric: "slashed-zero tabular-nums",
                }}
              >
                {k.value}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${tokens.border}`,
            paddingTop: 14,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: tokens.tertiary,
              fontFamily: tokens.fontBody,
            }}
          >
            Generated {dateLabel} &middot; FinPath
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: tokens.tertiary,
              fontFamily: tokens.fontBody,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Page 1 of 4
          </p>
        </div>
      </div>
    </div>
  );
}
