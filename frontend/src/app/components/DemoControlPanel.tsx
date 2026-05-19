import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getTzAbbr, useExpertConsultation } from "@/lib/useExpertConsultation";

export default function DemoControlPanel() {
  const { state, data, updateDatetime, reset } = useExpertConsultation();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (state === "IDLE") setDismissed(false);
  }, [state]);

  const visible = state !== "IDLE" && !dismissed;
  if (!visible) return null;

  const panelDate = data?.datetime.slice(0, 10) ?? "";
  const panelTime = data?.datetime.slice(11, 16) ?? "";

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "4px 8px",
    background: "var(--surface-hover)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--card-foreground)",
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-xs)",
    outline: "none",
    minWidth: 0,
  };

  return (
    <div
      aria-label="Meeting reminder panel"
      style={{
        position: "fixed",
        bottom: "var(--space-3)",
        right: "var(--space-3)",
        zIndex: 9500,
        width: "100%",
        maxWidth: 300,
        background: "var(--card-solid)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-2)",
        boxShadow: "var(--shadow-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--card-foreground)",
          }}
        >
          Meeting Reminder
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss panel"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--secondary)",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={14} className="icon-wireframe" />
        </button>
      </div>

      <hr
        style={{
          margin: 0,
          border: "none",
          borderTop: "1px solid var(--border)",
        }}
      />

      <div>
        {state === "SCHEDULING" ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px var(--space-1)",
              borderRadius: "var(--radius-full)",
              background: "var(--amber-subtle)",
              color: "var(--amber-text)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-semibold)",
            }}
          >
            Scheduling…
          </span>
        ) : (
          <>
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--card-foreground)",
              }}
            >
              {data?.expert}
            </p>
            <p
              style={{
                margin: "var(--space-0.5) 0 0",
                fontSize: "var(--text-xs)",
                color: "var(--secondary)",
              }}
            >
              {data
                ? new Date(data.datetime).toLocaleString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) +
                  " " +
                  getTzAbbr(data.timezone)
                : ""}
            </p>
          </>
        )}
      </div>

      {state === "SCHEDULED" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-0.5)",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--tertiary)",
            }}
          >
            Adjust time
          </span>
          <div style={{ display: "flex", gap: "var(--space-0.5)" }}>
            <input
              type="date"
              aria-label="Adjust date"
              defaultValue={panelDate}
              key={panelDate}
              onChange={(e) => {
                const newDate = e.target.value;
                const newTime = panelTime || "09:00";
                if (newDate) updateDatetime(`${newDate}T${newTime}`);
              }}
              style={inputStyle}
            />
            <input
              type="time"
              aria-label="Adjust time"
              defaultValue={panelTime}
              key={panelTime}
              onChange={(e) => {
                const newTime = e.target.value;
                const newDate = panelDate || new Date().toISOString().slice(0, 10);
                if (newTime) updateDatetime(`${newDate}T${newTime}`);
              }}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={reset}
        style={{
          width: "100%",
          padding: "var(--space-1) var(--space-2)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          background: "var(--surface-hover)",
          color: "var(--card-foreground)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-medium)",
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        Reset Consultation
      </button>
    </div>
  );
}
