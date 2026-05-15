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

import Debt from "./screens/Debt";
import Cashflow from "./screens/Cashflow";
import Month from "./screens/Month";
import Scenarios from "./screens/Scenarios";
import Progress from "./screens/Progress";
import Celebrate from "./screens/Celebrate";
import Settings from "./screens/Settings";
import Auth from "./screens/Auth";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PennyPanel from "./components/PennyPanel";
import { useFinPathStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { initCloudSync } from '@/lib/cloud-sync';
import { useTheme } from '@/lib/theme';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/PageTransition';
import ScrollToTop from "./components/ScrollToTop";

function AppContent() {
  const { isDark, setMode } = useTheme();
  const setIsDark = (next: boolean) => setMode(next ? "dark" : "light");
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

  // Initialize auth on mount.
  useEffect(() => {
    initialize();
    initCloudSync();
  }, [initialize]);

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
      className="h-screen w-screen overflow-hidden bg-background text-foreground font-body"
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
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Dashboard onPennyClick={() => setPennyOpen(true)} />
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/journey"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Journey />
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />

                <Route
                  path="/month"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Month />
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/scenarios"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Scenarios onPennyClick={() => setPennyOpen(true)} />
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Progress onPennyClick={() => setPennyOpen(true)} />
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/debt"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Debt onPennyClick={() => setPennyOpen(true)} />
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/cashflow"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Cashflow />
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/celebrate"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Celebrate />
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Settings />
                      </PageTransition>
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
                className="w-full max-w-xl rounded-2xl p-6 md:p-7 bg-card border border-border shadow-lg"
              >
                <div
                  className="text-xs font-semibold tracking-wider uppercase mb-2 text-accent-text"
                >
                  Goal Completed
                </div>
                <h3
                  className="text-2xl font-bold mb-2 text-card-foreground font-display"
                >
                  {activeDecision.goalName} is done
                </h3>
                <p
                  className="text-sm md:text-base text-secondary mb-4 font-body"
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
                    className="py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-accent text-on-accent font-body"
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
                    className="py-3 px-4 rounded-xl font-semibold transition-all bg-surface-tint border border-border text-card-foreground font-body"
                  >
                    Keep As Net Worth Surplus
                  </button>
                </div>

                {!hasRemainingGoals && (
                  <p
                    className="text-xs mt-3 text-secondary"
                  >
                    No active goals left, so only surplus mode can be applied
                    right now.
                  </p>
                )}

                {monthlySurplusReserve > 0 && (
                  <p
                    className="text-xs mt-2 text-secondary"
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
              <ErrorBoundary key={location.pathname} animate={false}>
                <PageTransition>
                  <Landing isDark={isDark} setIsDark={setIsDark} />
                </PageTransition>
              </ErrorBoundary>
            }
          />
          <Route
            path="/auth"
            element={
              <ErrorBoundary key={location.pathname} animate={false}>
                <PageTransition>
                  <Auth isDark={isDark} setIsDark={setIsDark} />
                </PageTransition>
              </ErrorBoundary>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ErrorBoundary key={location.pathname} animate={false}>
                <PageTransition>
                  <Onboarding isDark={isDark} setIsDark={setIsDark} />
                </PageTransition>
              </ErrorBoundary>
            }
          />
          <Route
            path="/loading"
            element={
              <ErrorBoundary key={location.pathname} animate={false}>
                <PageTransition>
                  <Loading />
                </PageTransition>
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
      <ScrollToTop />
      <ErrorBoundary animate={false}>
        <AppContent />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
