import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, Loader2, X } from "lucide-react";
import {
  EXPERT_DOMAINS,
  TIMEZONES,
  useExpertConsultation,
  type ExpertDomain,
} from "@/lib/useExpertConsultation";

interface ScheduleConsultationModalProps {
  open: boolean;
  onClose: () => void;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function maxDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export default function ScheduleConsultationModal({
  open,
  onClose,
}: ScheduleConsultationModalProps) {
  const { state, data, schedule, reschedule } = useExpertConsultation();

  const [expert, setExpert] = useState<ExpertDomain | "">("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"
  );
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const titleId = useId();
  const expertId = useId();
  const dateId = useId();
  const timeId = useId();
  const timezoneId = useId();

  const isReschedule = state === "SCHEDULED";

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      submittingRef.current = false;
      return;
    }
    if (data) {
      setExpert(data.expert);
      setDate(data.datetime.slice(0, 10));
      setTime(data.datetime.slice(11, 16));
      setTimezone(data.timezone);
    } else {
      setExpert("");
      setDate("");
      setTime("");
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata");
    }
  }, [open, data]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, submitting, onClose]);

  useEffect(() => {
    if (state === "SCHEDULED" && submittingRef.current) {
      submittingRef.current = false;
      setSubmitting(false);
      onClose();
    }
  }, [state, onClose]);

  const canSubmit = expert !== "" && date !== "" && time !== "" && timezone !== "" && !submitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const datetime = `${date}T${time}`;
    submittingRef.current = true;
    setSubmitting(true);
    if (isReschedule) {
      reschedule({ expert: expert as ExpertDomain, datetime, timezone });
    } else {
      schedule({ expert: expert as ExpertDomain, datetime, timezone });
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "var(--space-1) var(--space-2)",
    background: "var(--surface-hover)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--card-foreground)",
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-sm)",
    fontWeight: "var(--font-weight-regular)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{
            background: "rgba(8, 10, 22, 0.62)",
            backdropFilter: "blur(10px)",
            padding: "var(--space-3)",
            zIndex: 10010,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) onClose();
          }}
        >
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="bento-card"
            style={{
              width: "100%",
              maxWidth: 480,
              padding: "var(--space-5)",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
            }}
          >
            {!submitting && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: "var(--space-1)",
                  right: "var(--space-1)",
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-full)",
                  background: "var(--surface-hover)",
                  border: "none",
                  color: "var(--secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} className="icon-wireframe" />
              </button>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-1)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-base)",
                  background: "var(--accent)",
                  color: "var(--on-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Calendar size={20} className="icon-wireframe" />
              </div>
              <div>
                <p
                  className="text-label"
                  style={{ margin: 0, color: "var(--tertiary)" }}
                >
                  Expert Call
                </p>
                <h3
                  id={titleId}
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontWeight: "var(--font-weight-bold)",
                    fontSize: "var(--text-xl)",
                    color: "var(--card-foreground)",
                  }}
                >
                  {isReschedule
                    ? "Update Consultation"
                    : "Schedule Expert Consultation"}
                </h3>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-0_5)",
              }}
            >
              <label
                htmlFor={expertId}
                className="text-label"
                style={{ color: "var(--secondary)" }}
              >
                Expert domain
              </label>
              <select
                id={expertId}
                value={expert}
                disabled={submitting}
                onChange={(e) => setExpert(e.target.value as ExpertDomain | "")}
                style={inputStyle}
                required
              >
                <option value="" disabled>
                  Select an expert…
                </option>
                {EXPERT_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                gap: "var(--space-1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-0_5)",
                  flex: 1,
                }}
              >
                <label
                  htmlFor={dateId}
                  className="text-label"
                  style={{ color: "var(--secondary)" }}
                >
                  Date
                </label>
                <input
                  id={dateId}
                  type="date"
                  value={date}
                  min={todayDate()}
                  max={maxDate()}
                  disabled={submitting}
                  onChange={(e) => setDate(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-0_5)",
                  flex: 1,
                }}
              >
                <label
                  htmlFor={timeId}
                  className="text-label"
                  style={{ color: "var(--secondary)" }}
                >
                  Time
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    id={timeId}
                    type="time"
                    value={time}
                    disabled={submitting}
                    onChange={(e) => setTime(e.target.value)}
                    style={{ ...inputStyle, paddingRight: "var(--space-4)", width: "100%" }}
                    required
                  />
                  <Clock
                    size={14}
                    className="icon-wireframe"
                    style={{
                      position: "absolute",
                      right: "var(--space-1)",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--tertiary)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-0_5)",
              }}
            >
              <label
                htmlFor={timezoneId}
                className="text-label"
                style={{ color: "var(--secondary)" }}
              >
                Time zone
              </label>
              <select
                id={timezoneId}
                value={timezone}
                disabled={submitting}
                onChange={(e) => setTimezone(e.target.value)}
                style={inputStyle}
                required
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                gap: "var(--space-1)",
                marginTop: "var(--space-1)",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="pill"
                style={{
                  flex: 1,
                  padding: "var(--space-1) var(--space-2)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  opacity: submitting ? 0.5 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                  justifyContent: "center",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  flex: 1,
                  padding: "var(--space-1) var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background:
                    canSubmit || submitting
                      ? "linear-gradient(135deg, var(--accent), var(--secondary-accent))"
                      : "var(--surface-active)",
                  color:
                    canSubmit || submitting ? "var(--on-accent)" : "var(--tertiary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--space-0_5)",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Scheduling…
                  </>
                ) : (
                  "Confirm & Schedule"
                )}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
