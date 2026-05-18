import { forwardRef, useMemo } from "react";
import { Trophy } from "lucide-react";
import FinPathLogo from "./FinPathLogo";
import { formatInr, formatInrCompact } from "@/lib/format";

export interface ShareCardProps {
  goalName: string;
  amountSaved: number;
  timelineMonths: number;
  monthlySaved: number;
  netWorthToday: number;
  completedCount: number;
  dateLabel: string;
}

const SIZE = 1200;

function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

function mix(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  {
    goalName,
    amountSaved,
    timelineMonths,
    monthlySaved,
    netWorthToday,
    completedCount,
    dateLabel,
  },
  ref,
) {
  const heading =
    completedCount > 1 ? `${completedCount} goals complete` : goalName;

  const t = useMemo(() => {
    const accent = readVar("--accent", "#495bff");
    const secondaryAccent = readVar("--secondary-accent", "#ac49ff");
    const card = readVar("--card", "#ffffff");
    const cardFg = readVar("--card-foreground", "#0f172a");
    const secondary = readVar("--secondary", "#64748b");
    const tertiary = readVar("--tertiary", "#94a3b8");
    const border = readVar("--border", "#e2e8f0");
    const accentText = readVar("--accent-text", accent);
    const secondaryAccentText = readVar("--secondary-accent-text", secondaryAccent);
    const onAccent = readVar("--on-secondary-accent", "#ffffff");
    const fontDisplay = readVar("--font-display", "system-ui, sans-serif");
    const fontBody = readVar("--font-body", "system-ui, sans-serif");
    return {
      accent,
      secondaryAccent,
      card,
      cardFg,
      secondary,
      tertiary,
      border,
      accentText,
      secondaryAccentText,
      onAccent,
      fontDisplay,
      fontBody,
      accent35: mix(accent, 0.35),
      secondaryAccent30: mix(secondaryAccent, 0.3),
      cardTint: mix(card, 0.75),
      accentGlow: mix(secondaryAccent, 0.55),
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: SIZE,
        height: SIZE,
        backgroundColor: t.card,
        color: t.cardFg,
        fontFamily: t.fontBody,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: t.card,
          backgroundImage: `radial-gradient(circle at 18% 22%, ${t.accent35}, transparent 55%), radial-gradient(circle at 82% 78%, ${t.secondaryAccent30}, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 64,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <FinPathLogo size={64} showWordmark wordmarkSize="36px" wordmarkGap={14} />
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontFamily: t.fontBody,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: t.secondary,
                margin: 0,
              }}
            >
              Milestone
            </p>
            <p
              style={{
                fontFamily: t.fontDisplay,
                fontSize: 22,
                color: t.tertiary,
                margin: "8px 0 0",
              }}
            >
              {dateLabel}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              backgroundColor: t.accent,
              color: t.onAccent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 96px ${t.accentGlow}`,
            }}
          >
            <Trophy size={72} strokeWidth={2} />
          </div>
          <div>
            <p
              style={{
                fontFamily: t.fontBody,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: t.secondaryAccentText,
                margin: 0,
              }}
            >
              Goal Complete
            </p>
            <h1
              style={{
                fontFamily: t.fontDisplay,
                fontSize: 76,
                fontWeight: 700,
                color: t.cardFg,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                margin: "16px 0 0",
                maxWidth: 980,
              }}
            >
              {heading}
            </h1>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              width: 980,
              marginTop: 24,
            }}
          >
            {[
              { label: "Amount Saved", value: formatInr(amountSaved) },
              { label: "Timeline", value: `${timelineMonths} mo` },
              { label: "Monthly Save", value: formatInr(monthlySaved) },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  backgroundColor: t.cardTint,
                  border: `1px solid ${t.border}`,
                  borderRadius: 24,
                  padding: "24px 28px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontFamily: t.fontBody,
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: t.secondary,
                    margin: 0,
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontFamily: t.fontDisplay,
                    fontSize: 40,
                    fontWeight: 700,
                    color: t.cardFg,
                    letterSpacing: "-0.01em",
                    margin: "10px 0 0",
                    fontVariantNumeric: "slashed-zero",
                  }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              fontFamily: t.fontBody,
              fontSize: 22,
              color: t.secondary,
              margin: "24px 0 0",
            }}
          >
            Net worth today &middot;{" "}
            <span
              style={{
                fontFamily: t.fontDisplay,
                fontWeight: 600,
                color: t.accentText,
                fontVariantNumeric: "slashed-zero",
              }}
            >
              {formatInrCompact(netWorthToday)}
            </span>
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${t.border}`,
            paddingTop: 28,
          }}
        >
          <p
            style={{
              fontFamily: t.fontDisplay,
              fontSize: 22,
              fontWeight: 600,
              color: t.cardFg,
              margin: 0,
            }}
          >
            Built with FinPath
          </p>
          <p
            style={{
              fontFamily: t.fontBody,
              fontSize: 20,
              color: t.secondary,
              margin: 0,
            }}
          >
            Plan your money&rsquo;s path
          </p>
        </div>
      </div>
    </div>
  );
});

export default ShareCard;
