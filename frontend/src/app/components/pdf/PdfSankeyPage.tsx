import { Sankey } from "recharts";
import PdfPage from "./PdfPage";
import { CustomNode, CustomLink } from "../SankeyFlow";
import { formatInr, formatInrCompact } from "@/lib/format";
import type { ThemeTokens } from "@/lib/theme-tokens";
import type { SankeyData, CashflowKpis } from "@/lib/sankey-data";

export interface PdfSankeyPageProps {
  sankey: SankeyData;
  kpis: CashflowKpis;
  monthLabel: string;
  dateLabel: string;
  tokens: ThemeTokens;
}

export default function PdfSankeyPage({
  sankey,
  kpis,
  monthLabel,
  dateLabel,
  tokens,
}: PdfSankeyPageProps) {
  const palette = {
    blue: tokens.accent,
    "blue-mid": tokens.accent,
    "blue-soft": tokens.tertiaryAccent,
    lime: tokens.tertiaryAccent,
    red: tokens.red,
    amber: tokens.amber,
    green: tokens.green,
    purple: tokens.secondaryAccent,
    slate: tokens.tertiary,
  };

  const flowItems = [
    {
      label: "Essential Expenses",
      pct: kpis.expensePct,
      amount: kpis.totalExpensesDeduped,
      color: tokens.amberText,
    },
    {
      label: "Debt & Savings",
      pct: kpis.debtAndSavingsPct,
      amount: kpis.debtAndSavings,
      color: tokens.redText,
    },
    {
      label: "Disposable",
      pct: kpis.disposablePct,
      amount: kpis.disposable,
      color: tokens.greenText,
    },
  ];

  const snapshot = [
    { label: "Income", value: formatInr(kpis.totalIncome) },
    { label: "Outflow", value: formatInr(kpis.totalExpensesDeduped + kpis.debtAndSavings) },
    { label: "Free Cash", value: formatInr(kpis.disposable) },
  ];

  const SANKEY_WIDTH = 670;
  const SANKEY_HEIGHT = 460;

  return (
    <PdfPage
      slot="sankey"
      pageIndex={2}
      totalPages={4}
      dateLabel={dateLabel}
      tokens={tokens}
      accentBar={tokens.green}
    >
      <div style={{ marginBottom: 14 }}>
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
          Cashflow &middot; {monthLabel}
        </p>
        <h2
          style={{
            margin: "6px 0 0",
            fontFamily: tokens.fontDisplay,
            fontSize: 32,
            fontWeight: 700,
            color: tokens.cardFg,
            letterSpacing: "-0.02em",
          }}
        >
          Where your money flows
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {snapshot.map((s) => (
          <div
            key={s.label}
            style={{
              border: `1px solid ${tokens.border}`,
              borderRadius: 14,
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: tokens.fontBody,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: tokens.tertiary,
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontFamily: tokens.fontDisplay,
                fontSize: 22,
                fontWeight: 700,
                color: tokens.cardFg,
                fontVariantNumeric: "slashed-zero tabular-nums",
              }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          border: `1px solid ${tokens.border}`,
          borderRadius: 16,
          padding: "10px 8px 14px",
          backgroundColor: tokens.card,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        {sankey.links.length > 0 ? (
          <Sankey
            width={SANKEY_WIDTH}
            height={SANKEY_HEIGHT}
            data={sankey}
            nodePadding={20}
            nodeWidth={14}
            iterations={64}
            margin={{ top: 6, left: 110, right: 140, bottom: 6 }}
            node={<CustomNode palette={palette} />}
            link={<CustomLink palette={palette} />}
          />
        ) : (
          <p
            style={{
              fontFamily: tokens.fontBody,
              fontSize: 14,
              color: tokens.tertiary,
            }}
          >
            Not enough cashflow data to draw a flow diagram.
          </p>
        )}
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {flowItems.map((f) => (
          <div
            key={f.label}
            style={{
              border: `1px solid ${tokens.border}`,
              borderRadius: 14,
              padding: "12px 14px",
              backgroundColor: tokens.surfaceTint,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: tokens.fontBody,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: tokens.tertiary,
                }}
              >
                {f.label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: tokens.fontDisplay,
                  fontSize: 18,
                  fontWeight: 700,
                  color: f.color,
                  fontVariantNumeric: "slashed-zero tabular-nums",
                }}
              >
                {f.pct}%
              </p>
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontFamily: tokens.fontBody,
                fontSize: 13,
                color: tokens.secondary,
                fontVariantNumeric: "slashed-zero",
              }}
            >
              {formatInrCompact(f.amount)} / month
            </p>
          </div>
        ))}
      </div>
    </PdfPage>
  );
}
