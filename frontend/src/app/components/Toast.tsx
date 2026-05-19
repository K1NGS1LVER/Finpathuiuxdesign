import { useEffect } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export default function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 4000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: "fixed",
        top: "var(--space-3)",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 10020,
        pointerEvents: "none",
      }}
    >
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
      style={{
        pointerEvents: "auto",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-1) var(--space-2)",
        boxShadow: "var(--shadow-lg)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-1)",
        maxWidth: 420,
        whiteSpace: "nowrap",
        fontFamily: "var(--font-body)",
      }}
    >
      <Check
        size={14}
        className="icon-wireframe"
        style={{ color: "var(--green)", flexShrink: 0 }}
      />
      <span
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--card-foreground)",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {message}
      </span>
    </motion.div>
    </div>
  );
}
