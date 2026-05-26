import { useEffect, useId, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, X } from "lucide-react";
import {
  EXPERT_DOMAINS,
  useExpertWorkflow,
  type ExpertDomain,
} from "@/lib/useExpertWorkflow";

interface ExpertReviewModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ExpertReviewModal({
  open,
  onClose,
}: ExpertReviewModalProps) {
  const { submit } = useExpertWorkflow();
  const [expert, setExpert] = useState<ExpertDomain | "">("");
  const [notes, setNotes] = useState("");
  const titleId = useId();
  const expertId = useId();
  const notesId = useId();

  useEffect(() => {
    if (!open) {
      setExpert("");
      setNotes("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const canSubmit = expert !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    submit({ expert: expert as ExpertDomain, notes: notes.trim() });
    onClose();
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
            if (e.target === e.currentTarget) onClose();
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
                <ShieldCheck size={20} className="icon-wireframe" />
              </div>
              <div>
                <p
                  className="text-label"
                  style={{ margin: 0, color: "var(--tertiary)" }}
                >
                  Expert handoff
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
                  Request Expert Verification
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
                flexDirection: "column",
                gap: "var(--space-0_5)",
              }}
            >
              <label
                htmlFor={notesId}
                className="text-label"
                style={{ color: "var(--secondary)" }}
              >
                Context notes
              </label>
              <textarea
                id={notesId}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the reviewer should focus on…"
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
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
                className="pill"
                style={{
                  flex: 1,
                  padding: "var(--space-1) var(--space-2)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
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
                  background: canSubmit
                    ? "linear-gradient(135deg, var(--accent), var(--secondary-accent))"
                    : "var(--surface-active)",
                  color: canSubmit ? "var(--on-accent)" : "var(--tertiary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  cursor: canSubmit ? "pointer" : "not-allowed",
                }}
              >
                Submit for Review
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
