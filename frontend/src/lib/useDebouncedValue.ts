import { useState, useEffect } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delayMs`
 * has elapsed without further changes. Useful for keeping a slider's
 * visible value responsive (drives raw `value`) while gating an
 * expensive memoized computation (drives `debounced`).
 */
export function useDebouncedValue<T>(value: T, delayMs = 80): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
