import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, FileText, X, Check, AlertCircle } from "lucide-react";
import PdfPages from "./pdf/PdfPages";
import {
  defaultPdfFilename,
  downloadPlanPdf,
  PdfExportAbortedError,
  type PdfProgress,
} from "@/lib/pdf-export";
import { useFinPathStore } from "@/lib/store";
import type { FinancialProfile } from "@/lib/types";

type Status = "idle" | "running" | "done" | "error" | "cancelled";

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

  // Snapshot the store once when the overlay opens. Use state (not a ref) so
  // setting it triggers the re-render that mounts <PdfPages>, populating the
  // containerRef before the capture effect runs.
  const [snapshot, setSnapshot] = useState<FinancialProfile | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<PdfProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!exporting) {
      setSnapshot(null);
      setStatus("idle");
      setProgress(null);
      setErrorMessage(null);
      return;
    }
    setSnapshot(useFinPathStore.getState());
  }, [exporting]);

  useEffect(() => {
    if (!exporting || !snapshot) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("running");
    setProgress({ step: "rendering", totalPages: 4 });
    setErrorMessage(null);

    let cancelled = false;

    const run = async () => {
      // wait for offscreen pages to mount + paint
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
      if (controller.signal.aborted) return;

      // Poll for the container ref in case AnimatePresence delays paint
      // beyond the 2×rAF wait. Up to ~1s.
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
        window.setTimeout(() => setExporting(false), 900);
      } catch (err) {
        if (err instanceof PdfExportAbortedError || controller.signal.aborted) {
          setStatus("cancelled");
          window.setTimeout(() => setExporting(false), 700);
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
  }, [exporting, snapshot, setExporting]);

  const cancel = () => {
    abortRef.current?.abort();
  };

  const close = () => {
    abortRef.current?.abort();
    setExporting(false);
  };

  const message = (() => {
    if (status === "done") return "Saved to your device";
    if (status === "cancelled") return "Cancelled";
    if (status === "error") return errorMessage ?? "Something went wrong. Try again.";
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

  return (
    <AnimatePresence>
      {exporting && (
        <>
          {snapshot && (
            <PdfPages ref={containerRef} profile={snapshot} />
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-6"
            style={{ background: "rgba(8, 10, 22, 0.62)", backdropFilter: "blur(10px)" }}
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
                maxWidth: 460,
                padding: "var(--space-5)",
                background: "var(--card)",
                border: "1px solid var(--border)",
                position: "relative",
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

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {status === "done" ? (
                    <Check size={20} />
                  ) : status === "error" ? (
                    <AlertCircle size={20} />
                  ) : (
                    <FileText size={20} />
                  )}
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
                      fontWeight: 700,
                      fontSize: "var(--text-xl)",
                      color: "var(--card-foreground)",
                    }}
                  >
                    {status === "done"
                      ? "Plan saved"
                      : status === "error"
                        ? "Export failed"
                        : status === "cancelled"
                          ? "Cancelled"
                          : "Generating your plan"}
                  </h3>
                </div>
              </div>

              <p
                style={{
                  margin: "6px 0 16px",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {status === "running" && <Loader2 size={14} className="animate-spin" />}
                {message}
              </p>

              <div
                style={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: "var(--surface-hover)",
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    height: "100%",
                    background:
                      status === "error"
                        ? "var(--red)"
                        : "linear-gradient(90deg, var(--accent), var(--secondary-accent))",
                  }}
                />
              </div>

              {status === "running" && (
                <button
                  type="button"
                  onClick={cancel}
                  className="pill"
                  style={{ width: "100%", padding: "10px 16px" }}
                >
                  Cancel
                </button>
              )}
              {status === "error" && (
                <div style={{ display: "flex", gap: 8 }}>
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
                      setStatus("idle");
                      setSnapshot(null);
                      // re-trigger by toggling exporting flag
                      setExporting(false);
                      window.setTimeout(() => setExporting(true), 50);
                    }}
                    className="pill"
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      background:
                        "linear-gradient(135deg, var(--accent), var(--secondary-accent))",
                      color: "var(--on-accent)",
                      border: "none",
                      fontWeight: 600,
                    }}
                  >
                    Try again
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
