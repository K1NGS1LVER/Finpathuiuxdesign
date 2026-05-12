// ─── Icon set (lucide-style strokes, hand-curated) ───
const stroke = (d, props = {}) => (
  <svg
    width={props.size || 16}
    height={props.size || 16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth || 2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d}
  </svg>
);
const I = (paths) => (p) => stroke(paths, p);

window.Icon = {
  Home: I(
    <>
      <path d="M3 12 12 3l9 9" />
      <path d="M5 10v10h14V10" />
    </>,
  ),
  Compass: I(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16 8-6 2-2 6 6-2 2-6Z" />
    </>,
  ),
  Calendar: I(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>,
  ),
  GitCompare: I(
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M9 6h6a3 3 0 0 1 3 3v6M15 18H9a3 3 0 0 1-3-3V9" />
    </>,
  ),
  TrendUp: I(
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </>,
  ),
  PieChart: I(
    <>
      <path d="M21 12A9 9 0 1 1 12 3v9z" />
      <path d="M21 12A9 9 0 0 0 12 3v9z" />
    </>,
  ),
  Shield: I(
    <>
      <path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3Z" />
    </>,
  ),
  Receipt: I(
    <>
      <path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2l-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2Z" />
      <path d="M8 8h8M8 12h8M8 16h6" />
    </>,
  ),
  Wallet: I(
    <>
      <path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2 2 2 0 0 1 2-2h13" />
      <circle cx="16" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </>,
  ),
  Sparkles: I(
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </>,
  ),
  ArrowR: I(
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>,
  ),
  Plus: I(
    <>
      <path d="M12 5v14M5 12h14" />
    </>,
  ),
  Check: I(
    <>
      <path d="m4 12 5 5 11-12" />
    </>,
  ),
  X: I(
    <>
      <path d="M6 6 18 18M18 6 6 18" />
    </>,
  ),
  Clock: I(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>,
  ),
  Sun: I(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>,
  ),
  Moon: I(
    <>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </>,
  ),
  Goal: I(
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>,
  ),
  Plane: I(
    <>
      <path d="M3 14l8-3-2-7 2-1 5 7 6-1 2 2-7 4-1 9-2 1-3-7-7 2-1-3 0-3z" />
    </>,
  ),
  House: I(
    <>
      <path d="M3 12 12 3l9 9" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </>,
  ),
  Car: I(
    <>
      <path d="M5 17h14M5 13l1-4a3 3 0 0 1 3-2h6a3 3 0 0 1 3 2l1 4v4H4v-4l1 0Z" />
      <circle cx="8" cy="17" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="16" cy="17" r="1.6" fill="currentColor" stroke="none" />
    </>,
  ),
  GraduationCap: I(
    <>
      <path d="M2 9 12 4l10 5-10 5L2 9Z" />
      <path d="M6 12v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </>,
  ),
  PiggyBank: I(
    <>
      <path d="M19 11c0-3-2-6-7-6s-7 3-7 6c0 1 0 2 1 3v3h2v-1h6v1h2v-3c1-1 1-2 1-3z" />
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
    </>,
  ),
  Alert: I(
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v5M12 18h.01" />
    </>,
  ),
  Play: I(
    <>
      <path d="M6 4v16l13-8L6 4Z" fill="currentColor" stroke="none" />
    </>,
  ),
};
