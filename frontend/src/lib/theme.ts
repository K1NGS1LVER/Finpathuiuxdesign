// ============================================================
// FinPath — Theme (dark/light) shared state
// localStorage-backed with a custom-event bus so any component
// can read/set the current mode without prop drilling.
// ============================================================

import { useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "finpath-mode";
const EVENT_NAME = "finpath:theme-change";

export function getTheme(): ThemeMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function setTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore quota
  }
  applyTheme(mode);
  window.dispatchEvent(new CustomEvent<ThemeMode>(EVENT_NAME, { detail: mode }));
}

export function useTheme(): {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
} {
  const [mode, setLocal] = useState<ThemeMode>(getTheme);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeMode>).detail;
      if (detail === "dark" || detail === "light") setLocal(detail);
    };
    window.addEventListener(EVENT_NAME, onChange);
    return () => window.removeEventListener(EVENT_NAME, onChange);
  }, []);

  return {
    mode,
    isDark: mode === "dark",
    setMode: setTheme,
    toggle: () => setTheme(mode === "dark" ? "light" : "dark"),
  };
}
