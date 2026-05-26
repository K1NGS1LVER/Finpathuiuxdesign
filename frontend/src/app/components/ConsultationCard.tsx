import { Check, ExternalLink, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  MEET_LINK,
  getTzAbbr,
  useExpertConsultation,
  type ConsultationData,
} from "@/lib/useExpertConsultation";

interface ConsultationCardProps {
  data: ConsultationData;
}

function formatDatetime(raw: string, timezone: string): string {
  try {
    return (
      new Date(raw).toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) +
      " " +
      getTzAbbr(timezone)
    );
  } catch {
    return raw;
  }
}

export default function ConsultationCard({ data }: ConsultationCardProps) {
  const { reset } = useExpertConsultation();
  return (
    <div
      style={{
        background: "var(--green-subtle)",
        border: "1px solid var(--green)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-2)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
        marginTop: "var(--space-1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-0_5)" }}>
          <Check
            size={16}
            className="icon-wireframe"
            style={{ color: "var(--green)", flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--card-foreground)",
            }}
          >
            Expert Call Confirmed
          </span>
        </div>
        <button
          type="button"
          onClick={reset}
          aria-label="Cancel meeting"
          style={{
            background: "transparent",
            border: "1px solid var(--red)",
            borderRadius: "var(--radius-full)",
            cursor: "pointer",
            color: "var(--red)",
            padding: "2px var(--space-1)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-0_5)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-medium)",
          }}
        >
          <X size={12} className="icon-wireframe" />
          Cancel
        </button>
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-xs)",
          color: "var(--secondary)",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "var(--card-foreground)" }}>{data.expert}</strong>
        {" · "}
        {formatDatetime(data.datetime, data.timezone)}
      </p>

      <a
        href={MEET_LINK}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-0_5)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          color: "var(--accent-text)",
          textDecoration: "underline",
          textUnderlineOffset: 2,
          wordBreak: "break-all",
        }}
      >
        {MEET_LINK}
        <ExternalLink size={12} className="icon-wireframe" style={{ flexShrink: 0 }} />
      </a>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "var(--space-1)",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          width: "fit-content",
          alignSelf: "center",
          marginTop: "var(--space-0_5)",
        }}
      >
        <QRCodeSVG
          value={MEET_LINK}
          size={120}
          bgColor="transparent"
          fgColor="currentColor"
          style={{ color: "var(--card-foreground)" }}
        />
      </div>

      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-2xs)",
          color: "var(--tertiary)",
          textAlign: "center",
        }}
      >
        Scan to join the meeting
      </p>
    </div>
  );
}
