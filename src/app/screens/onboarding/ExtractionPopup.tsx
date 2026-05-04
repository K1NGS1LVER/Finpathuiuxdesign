import { Sparkles, Shield, X } from "lucide-react";
import type { ExtractionPopupState } from "./useOnboardingForm";

export default function ExtractionPopup({
  popup,
  onClose,
}: {
  popup: ExtractionPopupState;
  onClose?: () => void;
}) {
  if (!popup.show) return null;

  const isSuccess = popup.type === "success";

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 p-5 rounded-2xl flex items-start gap-3 shadow-2xl max-w-[90vw] md:max-w-md w-full"
      style={{
        animation: "slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        background: "var(--surface-tint)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: `2px solid ${isSuccess ? "var(--accent)" : "var(--red)"}`,
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
          <Sparkles size={18} style={{ color: "var(--accent)" }} />
        ) : (
          <Shield size={18} style={{ color: "var(--red)" }} />
        )}
      </div>
      <p className="text-sm font-medium flex-1 pt-1">{popup.message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-[var(--surface-hover)] transition-colors"
          style={{ color: "var(--secondary)" }}
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}