import { Sparkles, Shield } from "lucide-react";
import type { ExtractionPopupState } from "./useOnboardingForm";

// ── Component ────────────────────────────────────────────
export default function ExtractionPopup({ popup }: { popup: ExtractionPopupState }) {
  if (!popup.show) return null;

  const isSuccess = popup.type === "success";

  return (
    <div
      className="fixed bottom-24 left-1/2 z-50 p-4 rounded-2xl flex items-center gap-3 shadow-2xl max-w-[90vw] md:max-w-md w-full"
      style={{
        animation: "slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        background: "var(--surface-tint)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${isSuccess ? "var(--accent)" : "var(--red)"}`,
        color: "var(--card-foreground)",
        fontFamily: "var(--font-body)",
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: isSuccess ? "var(--accent-glow)" : "var(--red-subtle)",
        }}
      >
        {isSuccess ? (
          <Sparkles size={20} className="text-[var(--accent)]" />
        ) : (
          <Shield size={20} className="text-[var(--red)]" />
        )}
      </div>
      <p className="text-sm font-medium">{popup.message}</p>
    </div>
  );
}