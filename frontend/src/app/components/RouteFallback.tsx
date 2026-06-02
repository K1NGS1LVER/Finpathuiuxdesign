/**
 * Suspense fallback for lazy-loaded routes. Renders a centered card-shaped
 * skeleton sized to ~70vh so the lazy chunk swap doesn't reflow surrounding
 * layout. Uses the existing `.skeleton` utility class from `theme.css`.
 */
export default function RouteFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: "var(--space-4)",
      }}
    >
      <div
        className="skeleton"
        style={{
          width: "100%",
          maxWidth: 1200,
          height: "70vh",
          borderRadius: "var(--radius-lg)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
