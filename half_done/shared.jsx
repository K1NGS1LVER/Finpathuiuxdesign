// ─── FinPath shared icons & utilities ───
// Lucide icons drawn inline as React components — only the ones we use

const I =
  (paths, viewBox = "0 0 24 24") =>
  ({ size = 18, className = "icon", style, strokeWidth = 1.5 }) =>
    React.createElement(
      "svg",
      {
        width: size,
        height: size,
        viewBox,
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className,
        style,
      },
      ...paths.map((d, i) => React.createElement("path", { key: i, d })),
    );

const ILine =
  (lines) =>
  ({ size = 18, className = "icon", style, strokeWidth = 1.5 }) =>
    React.createElement(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className,
        style,
      },
      ...lines,
    );

const Icon = {
  Dashboard: I(["M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"]),
  Journey: I([
    "M6 3v12M18 9v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 15h6a6 6 0 0 0 6-6",
  ]),
  Calendar: ILine([
    React.createElement("rect", {
      key: 0,
      x: 3,
      y: 5,
      width: 18,
      height: 16,
      rx: 2,
    }),
    React.createElement("line", { key: 1, x1: 8, y1: 3, x2: 8, y2: 7 }),
    React.createElement("line", { key: 2, x1: 16, y1: 3, x2: 16, y2: 7 }),
    React.createElement("line", { key: 3, x1: 3, y1: 11, x2: 21, y2: 11 }),
  ]),
  GitBranch: ILine([
    React.createElement("circle", { key: 0, cx: 6, cy: 6, r: 2 }),
    React.createElement("circle", { key: 1, cx: 6, cy: 18, r: 2 }),
    React.createElement("circle", { key: 2, cx: 18, cy: 8, r: 2 }),
    React.createElement("path", { key: 3, d: "M6 8v8M8 8h4a4 4 0 0 1 4 4v0" }),
  ]),
  Bar: ILine([
    React.createElement("line", { key: 0, x1: 12, y1: 20, x2: 12, y2: 10 }),
    React.createElement("line", { key: 1, x1: 18, y1: 20, x2: 18, y2: 4 }),
    React.createElement("line", { key: 2, x1: 6, y1: 20, x2: 6, y2: 14 }),
  ]),
  ArrowLR: I(["M7 17l-4-4 4-4M3 13h14M17 7l4 4-4 4M7 11h14"]),
  Card: ILine([
    React.createElement("rect", {
      key: 0,
      x: 2,
      y: 5,
      width: 20,
      height: 14,
      rx: 2,
    }),
    React.createElement("line", { key: 1, x1: 2, y1: 10, x2: 22, y2: 10 }),
  ]),
  Chat: I([
    "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  ]),
  Sun: ILine([
    React.createElement("circle", { key: 0, cx: 12, cy: 12, r: 4 }),
    React.createElement("path", {
      key: 1,
      d: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41",
    }),
  ]),
  Moon: I(["M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"]),
  Sparkles: I([
    "M12 3l1.9 5.8L19 11l-5.1 2.2L12 19l-1.9-5.8L5 11l5.1-2.2L12 3z",
    "M19 3l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7L19 3z",
    "M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z",
  ]),
  Target: ILine([
    React.createElement("circle", { key: 0, cx: 12, cy: 12, r: 10 }),
    React.createElement("circle", { key: 1, cx: 12, cy: 12, r: 6 }),
    React.createElement("circle", { key: 2, cx: 12, cy: 12, r: 2 }),
  ]),
  Trending: I(["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"]),
  Plus: I(["M12 5v14M5 12h14"]),
  Check: I(["M20 6L9 17l-5-5"]),
  X: I(["M18 6L6 18M6 6l12 12"]),
  ArrowR: I(["M5 12h14M12 5l7 7-7 7"]),
  Chevron: I(["M9 18l6-6-6-6"]),
  ChevronD: I(["M6 9l6 6 6-6"]),
  Send: I(["M22 2L11 13", "M22 2l-7 20-4-9-9-4 20-7z"]),
  Bolt: I(["M13 2L3 14h7l-1 8 10-12h-7l1-8z"]),
  PiggyBank: I([
    "M19 5c-1.5 0-2.8.5-3.7 1.4M5 8a4 4 0 0 0-1.5 3 4 4 0 0 0 1.5 3v3h3M5 14h.5",
    "M20 9a3 3 0 0 0-3-3h-1l-3 3v6l5 2 3-3v-5z",
  ]),
  Alert: ILine([
    React.createElement("path", {
      key: 0,
      d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
    }),
    React.createElement("line", { key: 1, x1: 12, y1: 9, x2: 12, y2: 13 }),
    React.createElement("circle", {
      key: 2,
      cx: 12,
      cy: 17,
      r: 0.5,
      fill: "currentColor",
    }),
  ]),
  Lightbulb: I([
    "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c1 .9 2 1.7 2 3.3h4c0-1.6 1-2.4 2-3.3A7 7 0 0 0 12 2z",
  ]),
  Settings: ILine([
    React.createElement("circle", { key: 0, cx: 12, cy: 12, r: 3 }),
    React.createElement("path", {
      key: 1,
      d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    }),
  ]),
  Home: I(["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"]),
  Car: I([
    "M5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM17 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    "M3 17h2l1.5-5h11l1.5 5h2v-2l-1-3a2 2 0 0 0-2-1H7a2 2 0 0 0-2 1l-2 5v0z",
  ]),
  Plane: I([
    "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5l8 2.5z",
  ]),
  Briefcase: ILine([
    React.createElement("rect", {
      key: 0,
      x: 2,
      y: 7,
      width: 20,
      height: 14,
      rx: 2,
    }),
    React.createElement("path", {
      key: 1,
      d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
    }),
  ]),
  Trash: I([
    "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  ]),
  Edit: I([
    "M12 20h9",
    "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  ]),
  Search: ILine([
    React.createElement("circle", { key: 0, cx: 11, cy: 11, r: 7 }),
    React.createElement("path", { key: 1, d: "M21 21l-4.35-4.35" }),
  ]),
  Bell: I([
    "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",
    "M13.73 21a2 2 0 0 1-3.46 0",
  ]),
  Filter: I(["M22 3H2l8 9.46V19l4 2v-8.54L22 3z"]),
  Award: ILine([
    React.createElement("circle", { key: 0, cx: 12, cy: 8, r: 7 }),
    React.createElement("path", {
      key: 1,
      d: "M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
    }),
  ]),
  TrendingDown: I(["M23 18l-9.5-9.5-5 5L1 6", "M17 18h6v-6"]),
  Layers: I(["M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"]),
  Wallet: I([
    "M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1M16 12h6",
    "M18 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3",
  ]),
};

// ─── Currency formatting ───
const fmt = (n) => Math.round(n).toLocaleString("en-IN");
const fmtCompact = (n) => {
  const a = Math.abs(n);
  const s = n < 0 ? "-" : "";
  if (a >= 10000000) return `${s}₹${(a / 10000000).toFixed(1)}Cr`;
  if (a >= 100000) return `${s}₹${(a / 100000).toFixed(1)}L`;
  if (a >= 1000) return `${s}₹${(a / 1000).toFixed(a >= 10000 ? 0 : 1)}K`;
  return `${s}₹${fmt(a)}`;
};

// ─── useCountUp animated number hook ───
function useCountUp(target, duration = 900, start = true) {
  const [value, setValue] = React.useState(0);
  const frameRef = React.useRef(0);
  const startTime = React.useRef(0);
  const startValue = React.useRef(0);
  React.useEffect(() => {
    if (!start) return;
    startValue.current = value;
    startTime.current = 0;
    const animate = (t) => {
      if (!startTime.current) startTime.current = t;
      const elapsed = t - startTime.current;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(
        Math.round(startValue.current + (target - startValue.current) * eased),
      );
      if (p < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, start]);
  return value;
}

// ─── Goal category styling ───
const CATEGORY_STYLE = {
  emergency: {
    color: "var(--accent)",
    subtle: "var(--accent-subtle)",
    text: "var(--accent-text)",
    icon: "PiggyBank",
  },
  home: {
    color: "var(--terracotta)",
    subtle: "rgba(217,119,87,0.12)",
    text: "#9a4a2e",
    icon: "Home",
  },
  travel: {
    color: "var(--secondary-accent)",
    subtle: "var(--secondary-accent-subtle)",
    text: "var(--secondary-accent-text)",
    icon: "Plane",
  },
  car: {
    color: "var(--cobalt)",
    subtle: "rgba(59,130,246,0.12)",
    text: "#1d4ed8",
    icon: "Car",
  },
  career: {
    color: "var(--teal)",
    subtle: "rgba(20,184,166,0.12)",
    text: "#0f766e",
    icon: "Briefcase",
  },
  debt: {
    color: "var(--rose)",
    subtle: "rgba(244,63,94,0.12)",
    text: "#be123c",
    icon: "Card",
  },
};

Object.assign(window, { Icon, fmt, fmtCompact, useCountUp, CATEGORY_STYLE });
