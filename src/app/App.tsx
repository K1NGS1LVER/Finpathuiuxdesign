import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router";
import Landing from "./screens/Landing";
import Onboarding from "./screens/Onboarding";
import Loading from "./screens/Loading";
import Dashboard from "./screens/Dashboard";
import Journey from "./screens/Journey";
// import Tax from "./screens/Tax";
import Debt from "./screens/Debt";
import Cashflow from "./screens/Cashflow";
import Month from "./screens/Month";
import Scenarios from "./screens/Scenarios";
import Progress from "./screens/Progress";
import Celebrate from "./screens/Celebrate";
import Auth from "./screens/Auth";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PennyPanel from "./components/PennyPanel";
import { useFinPathStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("finpath-mode");
    return stored === "light" ? false : true;
  });
  const [pennyOpen, setPennyOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const onboarded = useFinPathStore((s) => s.onboarded);
  const goals = useFinPathStore((s) => s.goals);
  const pendingGoalDecisions = useFinPathStore((s) => s.pendingGoalDecisions);
  const monthlySurplusReserve = useFinPathStore((s) => s.monthlySurplusReserve);
  const computeHealthScore = useFinPathStore((s) => s.computeHealthScore);
  const generatePlan = useFinPathStore((s) => s.generatePlan);
  const resolveGoalCompletionDecision = useFinPathStore(
    (s) => s.resolveGoalCompletionDecision,
  );

  // Auth state
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("finpath-mode", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (!onboarded) return;

    computeHealthScore();
    generatePlan();
  }, [computeHealthScore, generatePlan, onboarded]);

  // Show loading spinner while checking auth session
  if (authLoading) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--accent)",
            }}
          />
          <span
            className="text-sm text-[var(--secondary)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Loading...
          </span>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth screen (except for landing)
  const isAuthPage = location.pathname === "/auth";
  const isLandingPage = location.pathname === "/";

  if (!user && !isLandingPage && !isAuthPage) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect logic for authenticated users
  const isPublicPage = ["/", "/onboarding", "/loading", "/auth"].includes(
    location.pathname,
  );
  const showLayout = !isPublicPage;
  const activeDecision = pendingGoalDecisions[0];
  const hasRemainingGoals = goals.some((goal) => goal.status !== "complete");
  const formatInr = (value: number) =>
    `₹${Math.round(Math.max(0, value)).toLocaleString("en-IN")}`;

  // If authenticated + onboarded user visits landing or auth, redirect to dashboard
  if (
    user &&
    onboarded &&
    (location.pathname === "/" || location.pathname === "/auth")
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated but not onboarded and on auth page, go to onboarding
  if (user && !onboarded && location.pathname === "/auth") {
    return <Navigate to="/onboarding" replace />;
  }

  // If non-onboarded authenticated user visits dashboard pages, redirect to onboarding
  if (user && !onboarded && showLayout) {
    return <Navigate to="/onboarding" replace />;
  }

  // If non-authenticated visits dashboard pages, redirect to auth
  if (!user && showLayout) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]"
      style={{
        fontFamily: "var(--font-body)",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {showLayout ? (
        <div className="flex h-full">
          <Sidebar
            onPennyClick={() => setPennyOpen(true)}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header
              isDark={isDark}
              setIsDark={setIsDark}
              onMenuClick={() => setMobileMenuOpen(true)}
            />
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-2 md:px-6 py-2 md:py-8">
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    <ErrorBoundary key={location.pathname}>
                      <Dashboard onPennyClick={() => setPennyOpen(true)} />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/journey"
                  element={
                    <ErrorBoundary key={location.pathname}>
                      <Journey />
                    </ErrorBoundary>
                  }
                />
                {/* <Route
                  path="/tax"
                  element={
                    <ErrorBoundary key={location.pathname}>
                      <Tax />
                    </ErrorBoundary>
                  }
                /> */}
                <Route
                  path="/month"
                  element={
                    <ErrorBoundary key={location.pathname}>
                      <Month />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/scenarios"
                  element={
                    <ErrorBoundary key={location.pathname}>
                      <Scenarios />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ErrorBoundary key={location.pathname}>
                      <Progress />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/debt"
                  element={
                    <ErrorBoundary key={location.pathname}>
                      <Debt />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/cashflow"
                  element={
                    <ErrorBoundary key={location.pathname}>
                      <Cashflow />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/celebrate"
                  element={
                    <ErrorBoundary key={location.pathname}>
                      <Celebrate />
                    </ErrorBoundary>
                  }
                />
              </Routes>
            </main>
          </div>
          <PennyPanel open={pennyOpen} onClose={() => setPennyOpen(false)} />

          {activeDecision && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div
                className="w-full max-w-xl rounded-2xl p-6 md:p-7"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <div
                  className="text-xs font-semibold tracking-wider uppercase mb-2"
                  style={{ color: "var(--accent-text)" }}
                >
                  Goal Completed
                </div>
                <h3
                  className="text-2xl font-bold mb-2 text-[var(--card-foreground)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {activeDecision.goalName} is done
                </h3>
                <p
                  className="text-sm md:text-base text-[var(--secondary)] mb-4"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  The freed monthly allocation is{" "}
                  {formatInr(activeDecision.freedMonthlyAmount)}. What should we
                  do with it?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      resolveGoalCompletionDecision(
                        activeDecision.goalId,
                        "reinvest",
                      )
                    }
                    disabled={!hasRemainingGoals}
                    className="py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--accent)",
                      color: "var(--on-accent)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Reinvest Into Remaining Goals
                  </button>
                  <button
                    onClick={() =>
                      resolveGoalCompletionDecision(
                        activeDecision.goalId,
                        "surplus",
                      )
                    }
                    className="py-3 px-4 rounded-xl font-semibold transition-all"
                    style={{
                      background: "var(--surface-tint)",
                      border: "1px solid var(--border)",
                      color: "var(--card-foreground)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Keep As Net Worth Surplus
                  </button>
                </div>

                {!hasRemainingGoals && (
                  <p
                    className="text-xs mt-3"
                    style={{ color: "var(--secondary)" }}
                  >
                    No active goals left, so only surplus mode can be applied
                    right now.
                  </p>
                )}

                {monthlySurplusReserve > 0 && (
                  <p
                    className="text-xs mt-2"
                    style={{ color: "var(--secondary)" }}
                  >
                    Current monthly surplus reserve:{" "}
                    {formatInr(monthlySurplusReserve)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary key={location.pathname}>
                <Landing isDark={isDark} setIsDark={setIsDark} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/auth"
            element={
              <ErrorBoundary key={location.pathname}>
                <Auth isDark={isDark} setIsDark={setIsDark} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ErrorBoundary key={location.pathname}>
                <Onboarding isDark={isDark} setIsDark={setIsDark} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/loading"
            element={
              <ErrorBoundary key={location.pathname}>
                <Loading />
              </ErrorBoundary>
            }
          />
        </Routes>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
