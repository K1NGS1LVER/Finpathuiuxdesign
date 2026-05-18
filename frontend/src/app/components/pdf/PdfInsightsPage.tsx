import PdfPage from "./PdfPage";
import type { ThemeTokens } from "@/lib/theme-tokens";
import type { AdvisorInsights } from "@/lib/insights";
import { formatInrCompact } from "@/lib/format";

export interface PdfInsightsPageProps {
  insights: AdvisorInsights;
  dateLabel: string;
  tokens: ThemeTokens;
}

function SectionHeading({
  label,
  tokens,
  accent,
}: {
  label: string;
  tokens: ThemeTokens;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
      }}
    >
      <span
        style={{
          width: 6,
          height: 16,
          borderRadius: 3,
          backgroundColor: accent,
        }}
      />
      <p
        style={{
          margin: 0,
          fontFamily: tokens.fontBody,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: tokens.cardFg,
        }}
      >
        {label}
      </p>
    </div>
  );
}

function Bullet({
  text,
  tokens,
  color,
}: {
  text: string;
  tokens: ThemeTokens;
  color: string;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          backgroundColor: color,
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <p
        style={{
          margin: 0,
          fontFamily: tokens.fontBody,
          fontSize: 12,
          lineHeight: 1.55,
          color: tokens.cardFg,
        }}
      >
        {text}
      </p>
    </div>
  );
}

export default function PdfInsightsPage({
  insights,
  dateLabel,
  tokens,
}: PdfInsightsPageProps) {
  return (
    <PdfPage
      slot="insights"
      pageIndex={3}
      totalPages={4}
      dateLabel={dateLabel}
      tokens={tokens}
      accentBar={tokens.amber}
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
          For Your Advisor
        </p>
        <h2
          style={{
            margin: "6px 0 0",
            fontFamily: tokens.fontDisplay,
            fontSize: 30,
            fontWeight: 700,
            color: tokens.cardFg,
            letterSpacing: "-0.02em",
          }}
        >
          A summary worth a conversation
        </h2>
      </div>

      <div
        style={{
          border: `1px solid ${tokens.border}`,
          borderRadius: 16,
          padding: "14px 18px",
          marginBottom: 12,
        }}
      >
        <SectionHeading label="The Big Picture" tokens={tokens} accent={tokens.accent} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {insights.bigPicture.map((b, i) => (
            <Bullet key={i} text={b} tokens={tokens} color={tokens.accent} />
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            border: `1px solid ${tokens.border}`,
            borderRadius: 16,
            padding: "14px 16px",
            backgroundColor: tokens.surfaceTint,
          }}
        >
          <SectionHeading label="Strengths" tokens={tokens} accent={tokens.greenText} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {insights.strengths.map((s, i) => (
              <Bullet key={i} text={s} tokens={tokens} color={tokens.greenText} />
            ))}
          </div>
        </div>
        <div
          style={{
            border: `1px solid ${tokens.border}`,
            borderRadius: 16,
            padding: "14px 16px",
            backgroundColor: tokens.surfaceTint,
          }}
        >
          <SectionHeading label="Watch Areas" tokens={tokens} accent={tokens.amberText} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {insights.watchAreas.map((w, i) => (
              <Bullet key={i} text={w} tokens={tokens} color={tokens.amberText} />
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${tokens.border}`,
          borderRadius: 16,
          padding: "14px 18px",
          marginBottom: 12,
          backgroundColor: tokens.card,
        }}
      >
        <SectionHeading label="Action Items" tokens={tokens} accent={tokens.secondaryAccent} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {insights.actions.slice(0, 3).map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  backgroundColor: tokens.secondaryAccent,
                  color: tokens.onAccent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: tokens.fontDisplay,
                  fontSize: 12,
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
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: tokens.cardFg,
                  flex: 1,
                }}
              >
                {a}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div
          style={{
            border: `1px solid ${tokens.border}`,
            borderRadius: 16,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <SectionHeading label="Goals at a glance" tokens={tokens} accent={tokens.tertiaryAccent} />
          {insights.goals.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontFamily: tokens.fontBody,
                fontSize: 12,
                color: tokens.tertiary,
              }}
            >
              No goals tracked yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
              {insights.goals.slice(0, 6).map((g, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 6,
                    borderBottom:
                      i < insights.goals.slice(0, 6).length - 1
                        ? `1px solid ${tokens.border}`
                        : "none",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: tokens.fontBody,
                        fontSize: 12,
                        fontWeight: 600,
                        color: tokens.cardFg,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: tokens.fontBody,
                        fontSize: 10,
                        color: tokens.tertiary,
                      }}
                    >
                      {formatInrCompact(g.current)} / {formatInrCompact(g.target)} &middot; {g.timelineMonths}mo
                    </p>
                  </div>
                  <span
                    style={{
                      fontFamily: tokens.fontDisplay,
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        g.status === "complete"
                          ? tokens.greenText
                          : tokens.accentText,
                      marginLeft: 10,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {g.progressPct}%
                  </span>
                </div>
              ))}
              {insights.goals.length > 6 && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontFamily: tokens.fontBody,
                    fontSize: 10,
                    color: tokens.tertiary,
                    fontStyle: "italic",
                  }}
                >
                  +{insights.goals.length - 6} more
                </p>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            border: `1px solid ${tokens.border}`,
            borderRadius: 16,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <SectionHeading label="Debts at a glance" tokens={tokens} accent={tokens.redText} />
          {insights.debts.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontFamily: tokens.fontBody,
                fontSize: 12,
                color: tokens.tertiary,
              }}
            >
              No tracked debts. Liability-free.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {insights.debts.slice(0, 6).map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 6,
                    borderBottom:
                      i < insights.debts.slice(0, 6).length - 1
                        ? `1px solid ${tokens.border}`
                        : "none",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: tokens.fontBody,
                        fontSize: 12,
                        fontWeight: 600,
                        color: tokens.cardFg,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: tokens.fontBody,
                        fontSize: 10,
                        color: tokens.tertiary,
                      }}
                    >
                      {formatInrCompact(d.principal)} &middot; {d.interestRate}% APR &middot; {d.payoffEstimate}
                    </p>
                  </div>
                </div>
              ))}
              {insights.debts.length > 6 && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontFamily: tokens.fontBody,
                    fontSize: 10,
                    color: tokens.tertiary,
                    fontStyle: "italic",
                  }}
                >
                  +{insights.debts.length - 6} more
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <p
        style={{
          margin: "10px 0 0",
          fontFamily: tokens.fontBody,
          fontSize: 10,
          color: tokens.tertiary,
          fontStyle: "italic",
          textAlign: "center",
        }}
      >
        {insights.footnote}
      </p>
    </PdfPage>
  );
}
