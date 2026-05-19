import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  FileText,
  X,
  Check,
  AlertCircle,
  Download,
  Calendar,
  Clock,
  RefreshCw,
} from "lucide-react";
import PdfPages from "./pdf/PdfPages";
import ScheduleConsultationModal from "./ScheduleConsultationModal";
import ConsultationCard from "./ConsultationCard";
import Toast from "./Toast";
import {
  defaultPdfFilename,
  downloadPlanPdf,
  PdfExportAbortedError,
  type PdfProgress,
} from "@/lib/pdf-export";
import { useFinPathStore } from "@/lib/store";
import {
  useExpertConsultation,
  type ConsultationState,
} from "@/lib/useExpertConsultation";
import type { FinancialProfile } from "@/lib/types";

type Status = "menu" | "running" | "done" | "error" | "cancelled";

const STEP_LABELS: Record<PdfProgress["step"], string> = {
  rendering: "Preparing pages…",
  capturing: "Capturing pages…",
  assembling: "Assembling PDF…",
  saving: "Saving…",
  done: "Done",
};

export default function PdfExportOverlay() {
  const exporting = useFinPathStore((s) => s.pdfExporting);
  const setExporting = useFinPathStore((s) => s.setPdfExporting);
  const {
    state: consultationState,
    data: consultationData,
  } = useExpertConsultation();

  const [snapshot, setSnapshot] = useState<FinancialProfile | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const prevConsultationState = useRef<ConsultationState>("IDLE");

  const [status, setStatus] = useState<Status>("menu");
  const [progress, setProgress] = useState<PdfProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!exporting) {
      setSnapshot(null);
      setStatus("menu");
      setProgress(null);
      setErrorMessage(null);
      setScheduleModalOpen(false);
      return;
    }
    setSnapshot(useFinPathStore.getState());
  }, [exporting]);

  useEffect(() => {
    if (
      prevConsultationState.current === "SCHEDULING" &&
      consultationState === "SCHEDULED"
    ) {
      setShowToast(true);
    }
    prevConsultationState.current = consultationState;
  }, [consultationState]);

  useEffect(() => {
    if (status !== "running" || !snapshot) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setProgress({ step: "rendering", totalPages: 4 });
    setErrorMessage(null);

    let cancelled = false;

    const run = async () => {
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
      if (controller.signal.aborted) return;

      let container = containerRef.current;
      for (let i = 0; i < 50 && !container; i++) {
        await new Promise<void>((r) => setTimeout(r, 20));
        if (controller.signal.aborted) return;
        container = containerRef.current;
      }
      if (!container) {
        setErrorMessage("PDF pages did not mount in time.");
        setStatus("error");
        return;
      }
      try {
        await downloadPlanPdf({
          container,
          signal: controller.signal,
          filename: defaultPdfFilename(),
          onProgress: (p) => {
            if (!cancelled) setProgress(p);
          },
        });
        setStatus("done");
      } catch (err) {
        if (err instanceof PdfExportAbortedError || controller.signal.aborted) {
          setStatus("menu");
        } else {
          console.error("PDF export failed", err);
          const msg =
            err instanceof Error && err.message
              ? err.message
              : "Unknown error during PDF export.";
          setErrorMessage(msg);
          setStatus("error");
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [status, snapshot]);

  const cancel = () => {
    abortRef.current?.abort();
  };

  const close = () => {
    abortRef.current?.abort();
    setExporting(false);
  };

  const startDownload = () => {
    setProgress(null);
    setErrorMessage(null);
    setStatus("running");
  };

  const message = (() => {
    if (status === "done") return "Saved to your device";
    if (status === "error")
      return errorMessage ?? "Something went wrong. Try again.";
    if (!progress) return STEP_LABELS.rendering;
    if (progress.step === "capturing" && progress.pageLabel) {
      return `Capturing ${progress.pageLabel} (${(progress.pageIndex ?? 0) + 1} of ${progress.totalPages})`;
    }
    return STEP_LABELS[progress.step];
  })();

  const progressPct = (() => {
    if (status === "done") return 100;
    if (!progress) return 4;
    const base = ((progress.pageIndex ?? 0) / progress.totalPages) * 100;
    if (progress.step === "capturing") return Math.max(8, base + 6);
    if (progress.step === "assembling") return 92;
    if (progress.step === "saving") return 96;
    if (progress.step === "rendering") return 4;
    return 100;
  })();

  const titleText = (() => {
    if (status === "running") return "Generating your plan";
    if (status === "done") return "Plan saved";
    if (status === "error") return "Export failed";
    return "Export Plan";
  })();

  const headerIcon = (() => {
    if (status === "done") return <Check size={20} />;
    if (status === "error") return <AlertCircle size={20} />;
    return <FileText size={20} />;
  })();

  const scheduleButtonContent = (() => {
    if (consultationState === "SCHEDULING") {
      return (
        <>
          <Loader2 size={14} className="animate-spin icon-wireframe" />
          Scheduling…
        </>
      );
    }
    if (consultationState === "SCHEDULED") {
      return (
        <>
          <RefreshCw size={14} className="icon-wireframe" />
          Reschedule Call
        </>
      );
    }
    return (
      <>
        <Calendar size={14} className="icon-wireframe" />
        Schedule Call with Expert
      </>
    );
  })();

  return (
    <AnimatePresence>
      {exporting && (
        <>
          {snapshot && (status === "running" || status === "done") && (
            <PdfPages ref={containerRef} profile={snapshot} />
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-6"
            style={{
              background: "rgba(8, 10, 22, 0.62)",
              backdropFilter: "blur(10px)",
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-export-title"
          >
            <motion.div
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
                position: "relative",
                overflowY: "auto",
                maxHeight: "90vh",
              }}
            >
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
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
                  gap: 12,
                  marginBottom: 6,
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
                  {headerIcon}
                </div>
                <div>
                  <p className="text-label" style={{ margin: 0 }}>
                    Export
                  </p>
                  <h3
                    id="pdf-export-title"
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                      fontWeight: "var(--font-weight-bold)",
                      fontSize: "var(--text-xl)",
                      color: "var(--card-foreground)",
                    }}
                  >
                    {titleText}
                  </h3>
                </div>
              </div>

              {status === "menu" && (
                <>
                  <p
                    style={{
                      margin: "var(--space-2) 0 var(--space-2)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "var(--secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    Download a PDF snapshot of your plan, or schedule a live
                    call with a domain expert.
                  </p>

                  <div style={{ display: "flex", gap: "var(--space-1)" }}>
                    <button
                      type="button"
                      onClick={startDownload}
                      className="pill"
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "var(--space-0.5)",
                      }}
                    >
                      <Download size={14} className="icon-wireframe" />
                      Download PDF
                    </button>
                    <button
                      type="button"
                      className="pill"
                      onClick={() => {
                        if (consultationState !== "SCHEDULING") {
                          setScheduleModalOpen(true);
                        }
                      }}
                      disabled={consultationState === "SCHEDULING"}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        border:
                          consultationState === "SCHEDULED"
                            ? "1px solid var(--border)"
                            : "1px solid transparent",
                        background:
                          consultationState === "SCHEDULED"
                            ? "var(--surface-hover)"
                            : consultationState === "SCHEDULING"
                              ? "var(--surface-active)"
                              : "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
                        color:
                          consultationState === "SCHEDULED"
                            ? "var(--card-foreground)"
                            : consultationState === "SCHEDULING"
                              ? "var(--tertiary)"
                              : "var(--on-accent)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-weight-semibold)",
                        cursor:
                          consultationState === "SCHEDULING"
                            ? "not-allowed"
                            : "pointer",
                        justifyContent: "center",
                        gap: "var(--space-0.5)",
                      }}
                    >
                      {scheduleButtonContent}
                    </button>
                  </div>

                  {consultationState === "SCHEDULING" && (
                    <div
                      role="status"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "var(--space-0.5)",
                        padding: "var(--space-0.5) var(--space-1)",
                        borderRadius: "var(--radius-full)",
                        background: "var(--amber-subtle)",
                        color: "var(--amber-text)",
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--font-weight-semibold)",
                        marginTop: "var(--space-1)",
                      }}
                    >
                      <Clock size={12} className="icon-wireframe" />
                      Scheduling your call…
                    </div>
                  )}

                  {consultationState === "SCHEDULED" && consultationData && (
                    <ConsultationCard data={consultationData} />
                  )}
                </>
              )}

              {(status === "running" || status === "done") && (
                <>
                  <p
                    style={{
                      margin: "var(--space-1) 0 var(--space-2)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "var(--secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {status === "running" && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    {message}
                  </p>

                  <div
                    style={{
                      height: 6,
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "var(--surface-hover)",
                      overflow: "hidden",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        height: "100%",
                        background:
                          "linear-gradient(90deg, var(--accent), var(--secondary-accent))",
                      }}
                    />
                  </div>

                  {status === "running" ? (
                    <button
                      type="button"
                      onClick={cancel}
                      className="pill"
                      style={{ width: "100%", padding: "10px 16px" }}
                    >
                      Cancel
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "var(--space-1)" }}>
                      <button
                        type="button"
                        onClick={() => setStatus("menu")}
                        className="pill"
                        style={{ flex: 1, padding: "10px 16px" }}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={close}
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          borderRadius: "var(--radius-md)",
                          border: "none",
                          background:
                            "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
                          color: "var(--on-accent)",
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-sm)",
                          fontWeight: "var(--font-weight-semibold)",
                          cursor: "pointer",
                        }}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </>
              )}

              {status === "error" && (
                <>
                  <p
                    style={{
                      margin: "var(--space-1) 0 var(--space-2)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-sm)",
                      color: "var(--red)",
                    }}
                  >
                    {message}
                  </p>
                  <div style={{ display: "flex", gap: "var(--space-1)" }}>
                    <button
                      type="button"
                      onClick={close}
                      className="pill"
                      style={{ flex: 1, padding: "10px 16px" }}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        startDownload();
                      }}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        borderRadius: "var(--radius-md)",
                        border: "none",
                        background:
                          "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
                        color: "var(--on-accent)",
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-weight-semibold)",
                        cursor: "pointer",
                      }}
                    >
                      Try again
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>

          <ScheduleConsultationModal
            open={scheduleModalOpen}
            onClose={() => setScheduleModalOpen(false)}
          />

          <AnimatePresence>
            {showToast && (
              <Toast
                message="Consultation scheduled. Meeting details have been emailed to your address."
                onDismiss={() => setShowToast(false)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
