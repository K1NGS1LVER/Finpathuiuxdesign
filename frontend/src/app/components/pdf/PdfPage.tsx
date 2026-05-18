import { ReactNode } from "react";
import FinPathLogo from "../FinPathLogo";
import type { ThemeTokens } from "@/lib/theme-tokens";

export const PDF_PAGE_WIDTH = 794;
export const PDF_PAGE_HEIGHT = 1123;
export const PDF_PAGE_MARGIN = 56;

export interface PdfPageProps {
  slot: string;
  pageIndex: number;
  totalPages: number;
  dateLabel: string;
  tokens: ThemeTokens;
  children: ReactNode;
  /** Optional accent strip color for the header divider */
  accentBar?: string;
}

export default function PdfPage({
  slot,
  pageIndex,
  totalPages,
  dateLabel,
  tokens,
  children,
  accentBar,
}: PdfPageProps) {
  return (
    <div
      data-pdf-page={slot}
      style={{
        width: PDF_PAGE_WIDTH,
        height: PDF_PAGE_HEIGHT,
        backgroundColor: tokens.card,
        color: tokens.cardFg,
        fontFamily: tokens.fontBody,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <header
        style={{
          padding: `${PDF_PAGE_MARGIN}px ${PDF_PAGE_MARGIN}px 18px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <FinPathLogo size={28} showWordmark wordmarkSize="18px" wordmarkGap={10} />
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
          Financial Plan
        </p>
      </header>

      <div
        style={{
          height: 2,
          margin: `0 ${PDF_PAGE_MARGIN}px`,
          background: accentBar
            ? `linear-gradient(90deg, ${tokens.accent}, ${accentBar})`
            : tokens.border,
          borderRadius: 2,
          flexShrink: 0,
        }}
      />

      <main
        style={{
          flex: 1,
          padding: `28px ${PDF_PAGE_MARGIN}px 24px`,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {children}
      </main>

      <footer
        style={{
          padding: `14px ${PDF_PAGE_MARGIN}px ${PDF_PAGE_MARGIN - 16}px`,
          borderTop: `1px solid ${tokens.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
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
          Page {pageIndex + 1} of {totalPages}
        </p>
      </footer>
    </div>
  );
}
