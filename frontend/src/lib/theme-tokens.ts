export function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

export function mix(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface ThemeTokens {
  accent: string;
  secondaryAccent: string;
  tertiaryAccent: string;
  card: string;
  cardFg: string;
  background: string;
  foreground: string;
  secondary: string;
  tertiary: string;
  border: string;
  surfaceHover: string;
  surfaceTint: string;
  accentText: string;
  secondaryAccentText: string;
  onAccent: string;
  green: string;
  greenText: string;
  greenSubtle: string;
  amber: string;
  amberText: string;
  red: string;
  redText: string;
  fontDisplay: string;
  fontBody: string;
  accent35: string;
  secondaryAccent30: string;
  accentGlow: string;
}

export function getThemeTokens(): ThemeTokens {
  const accent = readVar("--accent", "#495bff");
  const secondaryAccent = readVar("--secondary-accent", "#ac49ff");
  const green = readVar("--green", "#22c55e");
  return {
    accent,
    secondaryAccent,
    tertiaryAccent: readVar("--tertiary-accent", "#06b6d4"),
    card: readVar("--card", "#ffffff"),
    cardFg: readVar("--card-foreground", "#0f172a"),
    background: readVar("--background", "#fafaf9"),
    foreground: readVar("--foreground", "#0f172a"),
    secondary: readVar("--secondary", "#64748b"),
    tertiary: readVar("--tertiary", "#94a3b8"),
    border: readVar("--border", "#e2e8f0"),
    surfaceHover: readVar("--surface-hover", "#f1f5f9"),
    surfaceTint: readVar("--surface-tint", "#f8fafc"),
    accentText: readVar("--accent-text", accent),
    secondaryAccentText: readVar("--secondary-accent-text", secondaryAccent),
    onAccent: readVar("--on-secondary-accent", "#ffffff"),
    green,
    greenText: readVar("--green-text", "#16a34a"),
    greenSubtle: readVar("--green-subtle", mix(green, 0.15)),
    amber: readVar("--amber", "#f59e0b"),
    amberText: readVar("--amber-text", "#d97706"),
    red: readVar("--red", "#ef4444"),
    redText: readVar("--red-text", "#dc2626"),
    fontDisplay: readVar("--font-display", "system-ui, sans-serif"),
    fontBody: readVar("--font-body", "system-ui, sans-serif"),
    accent35: mix(accent, 0.35),
    secondaryAccent30: mix(secondaryAccent, 0.3),
    accentGlow: mix(secondaryAccent, 0.55),
  };
}
