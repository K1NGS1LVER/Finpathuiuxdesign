import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router';
import Landing from './screens/Landing';
import Onboarding from './screens/Onboarding';
import Loading from './screens/Loading';
import Dashboard from './screens/Dashboard';
import Journey from './screens/Journey';

// Celebrate stays EAGER — it's the showpiece, a Suspense fallback would
// ruin the motion sequence the moment a reviewer navigates to it.
import Celebrate from './screens/Celebrate';
import Settings from './screens/Settings';
import Auth from './screens/Auth';

// Heavier secondary routes are lazy-loaded behind a RouteFallback skeleton.
const DesignSystem = lazy(() => import('./screens/DesignSystem'));
const Debt = lazy(() => import('./screens/Debt'));
const Cashflow = lazy(() => import('./screens/Cashflow'));
const Affordability = lazy(() => import('./screens/Affordability'));
// PDF export pulls pdf-lib + html-to-image (~heavy); only load once an
// export actually starts.
const PdfExportOverlay = lazy(() => import('./components/PdfExportOverlay'));

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PennyPanel from './components/PennyPanel';
import DemoControlPanel from './components/DemoControlPanel';
import RouteFallback from './components/RouteFallback';
import { useFinPathStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { initCloudSync } from '@/lib/cloud-sync';
import { useTheme } from '@/lib/theme';
import { formatInr } from '@/lib/format';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import { fireConfetti } from '@/lib/confetti';
import { AnimatePresence } from 'motion/react';
import { TrendingUp, Wallet, Loader2 } from 'lucide-react';
import type { GoalCompletionAction } from '@/lib/types';
import Toast from './components/Toast';
import { CONFETTI_COLORS } from './screens/journey/constants';

function AppContent() {
  const { isDark, setMode } = useTheme();
  const setIsDark = (next: boolean) => setMode(next ? 'dark' : 'light');
  const [pennyOpen, setPennyOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<GoalCompletionAction | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [completionToast, setCompletionToast] = useState<string | null>(null);
  const confettiFiredRef = useRef<Set<string>>(new Set());
  const location = useLocation();
  const navigate = useNavigate();
  const onboarded = useFinPathStore((s) => s.onboarded);
  const demoMode = useFinPathStore((s) => s.demoMode ?? false);
  const pdfExporting = useFinPathStore((s) => s.pdfExporting);
  const goals = useFinPathStore((s) => s.goals);
  const pendingGoalDecisions = useFinPathStore((s) => s.pendingGoalDecisions);
  const monthlySurplusReserve = useFinPathStore((s) => s.monthlySurplusReserve);
  const computeHealthScore = useFinPathStore((s) => s.computeHealthScore);
  const generatePlan = useFinPathStore((s) => s.generatePlan);
  const resolveGoalCompletionDecision = useFinPathStore((s) => s.resolveGoalCompletionDecision);
  const activeDecision = pendingGoalDecisions[0];
  const hasRemainingGoals = goals.some((goal) => goal.status !== 'complete');

  // Auth state
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);

  // Initialize auth on mount.
  useEffect(() => {
    initialize();
    initCloudSync();
  }, [initialize]);

  // ?demo=1 — seed the demo profile and jump to the dashboard.
  // Only guard against overwriting a real authenticated user's data.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('demo')) return;
    if (user && useFinPathStore.getState().onboarded) return;
    useFinPathStore.getState().loadDemoProfile();
    navigate('/dashboard', { replace: true });
  }, [location.search, navigate, user]);

  useEffect(() => {
    if (!onboarded) return;

    computeHealthScore();
    generatePlan();
  }, [computeHealthScore, generatePlan, onboarded]);

  // Fire confetti once per unique goal completion
  useEffect(() => {
    if (activeDecision && !confettiFiredRef.current.has(activeDecision.goalId)) {
      confettiFiredRef.current.add(activeDecision.goalId);
      void fireConfetti({
        particleCount: 40,
        spread: 55,
        startVelocity: 20,
        ticks: 70,
        origin: { x: 0.5, y: 0.35 },
        colors: CONFETTI_COLORS,
        scalar: 0.8,
        gravity: 1.1,
      });
    }
  }, [activeDecision]);

  // Reset selection when the active decision changes
  useEffect(() => {
    setSelectedAction(null);
    setIsConfirming(false);
  }, [activeDecision?.goalId]);

  const handleConfirm = useCallback(async () => {
    if (!selectedAction || !activeDecision || isConfirming) return;
    setIsConfirming(true);
    await new Promise<void>((r) => setTimeout(r, 400));
    const isLast = pendingGoalDecisions.length === 1;
    const amount = activeDecision.freedMonthlyAmount;
    resolveGoalCompletionDecision(activeDecision.goalId, selectedAction);
    if (isLast) {
      navigate('/celebrate');
    } else {
      setCompletionToast(
        selectedAction === 'reinvest'
          ? `${formatInr(amount)}/month reinvested across your active goals`
          : `${formatInr(amount)}/month added to your monthly surplus reserve`,
      );
      setIsConfirming(false);
    }
  }, [
    selectedAction,
    activeDecision,
    isConfirming,
    pendingGoalDecisions.length,
    resolveGoalCompletionDecision,
    navigate,
  ]);

  // Show loading spinner while checking auth session
  if (authLoading) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center"
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin"
            style={{
              borderColor: 'var(--border)',
              borderTopColor: 'var(--accent)',
            }}
          />
          <span
            className="text-sm text-[var(--secondary)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Loading...
          </span>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth screen (except for landing)
  const isAuthPage = location.pathname === '/auth';
  const isLandingPage = location.pathname === '/';

  // Demo mode unlocks read-only app access without a real auth user.
  const effectivelyAuthed = !!user || demoMode;

  if (!effectivelyAuthed && !isLandingPage && !isAuthPage) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect logic for authenticated users
  const isPublicPage = ['/', '/onboarding', '/loading', '/auth'].includes(location.pathname);
  const showLayout = !isPublicPage;

  // If authenticated + onboarded user visits landing or auth, redirect to dashboard
  if (
    effectivelyAuthed &&
    onboarded &&
    (location.pathname === '/' || location.pathname === '/auth')
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated but not onboarded and on auth page, go to onboarding
  if (user && !onboarded && location.pathname === '/auth') {
    return <Navigate to="/onboarding" replace />;
  }

  // If non-onboarded authenticated user visits dashboard pages, redirect to onboarding
  if (user && !onboarded && showLayout) {
    return <Navigate to="/onboarding" replace />;
  }

  // If non-authenticated visits dashboard pages, redirect to auth
  if (!effectivelyAuthed && showLayout) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground font-body">
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
                        <Journey onPennyClick={() => setPennyOpen(true)} />
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />

                <Route path="/month" element={<Navigate to="/dashboard?tab=month" replace />} />
                <Route path="/scenarios" element={<Navigate to="/afford?tab=grow" replace />} />
                <Route path="/progress" element={<Navigate to="/journey?tab=progress" replace />} />
                <Route
                  path="/debt"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Suspense fallback={<RouteFallback />}>
                          <Debt onPennyClick={() => setPennyOpen(true)} />
                        </Suspense>
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/cashflow"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Suspense fallback={<RouteFallback />}>
                          <Cashflow />
                        </Suspense>
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/afford"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Suspense fallback={<RouteFallback />}>
                          <Affordability onPennyClick={() => setPennyOpen(true)} />
                        </Suspense>
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
                <Route
                  path="/design"
                  element={
                    <ErrorBoundary key={location.pathname} animate={false}>
                      <PageTransition>
                        <Suspense fallback={<RouteFallback />}>
                          <DesignSystem />
                        </Suspense>
                      </PageTransition>
                    </ErrorBoundary>
                  }
                />
              </Routes>
            </main>
          </div>
          <PennyPanel open={pennyOpen} onClose={() => setPennyOpen(false)} />
          {pdfExporting && (
            <Suspense fallback={null}>
              <PdfExportOverlay />
            </Suspense>
          )}
          <DemoControlPanel />

          {activeDecision && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-xl rounded-2xl p-6 md:p-7 bg-card border border-border shadow-xl">
                <div
                  className="text-xs font-semibold tracking-wider uppercase mb-2"
                  style={{ color: 'var(--accent)' }}
                >
                  Goal Completed
                </div>
                <h3 className="text-2xl font-bold mb-1 text-card-foreground font-display">
                  {activeDecision.goalName} is done
                </h3>
                <p className="text-sm text-secondary mb-5 font-body">
                  {formatInr(activeDecision.freedMonthlyAmount)}/month is now free. Where should it
                  go?
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <button
                    disabled={!hasRemainingGoals}
                    onClick={() => setSelectedAction('reinvest')}
                    className="text-left p-4 rounded-xl border transition-all"
                    style={{
                      background:
                        selectedAction === 'reinvest'
                          ? 'var(--accent-subtle)'
                          : 'var(--surface-tint)',
                      borderColor:
                        selectedAction === 'reinvest' ? 'var(--accent)' : 'var(--border)',
                      borderWidth: selectedAction === 'reinvest' ? '2px' : '1px',
                      opacity: hasRemainingGoals ? 1 : 0.4,
                      cursor: hasRemainingGoals ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <TrendingUp
                      size={20}
                      className="icon-wireframe mb-2"
                      style={{
                        color:
                          selectedAction === 'reinvest'
                            ? 'var(--accent)'
                            : 'var(--card-foreground)',
                      }}
                    />
                    <div className="font-semibold text-sm text-card-foreground font-body mb-1">
                      Reinvest
                    </div>
                    <div className="text-xs text-secondary font-body leading-relaxed">
                      Freed allocation is split across your active goals — they complete faster.
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedAction('surplus')}
                    className="text-left p-4 rounded-xl border transition-all"
                    style={{
                      background:
                        selectedAction === 'surplus'
                          ? 'var(--accent-subtle)'
                          : 'var(--surface-tint)',
                      borderColor: selectedAction === 'surplus' ? 'var(--accent)' : 'var(--border)',
                      borderWidth: selectedAction === 'surplus' ? '2px' : '1px',
                    }}
                  >
                    <Wallet
                      size={20}
                      className="icon-wireframe mb-2"
                      style={{
                        color:
                          selectedAction === 'surplus' ? 'var(--accent)' : 'var(--card-foreground)',
                      }}
                    />
                    <div className="font-semibold text-sm text-card-foreground font-body mb-1">
                      Keep as Surplus
                    </div>
                    <div className="text-xs text-secondary font-body leading-relaxed">
                      Held as monthly surplus — grows your net worth directly.
                    </div>
                  </button>
                </div>

                {!hasRemainingGoals && (
                  <p className="text-xs mb-3 text-secondary">
                    No active goals remain — only surplus mode applies.
                  </p>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={!selectedAction || isConfirming}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  style={{ opacity: !selectedAction ? 0.45 : 1 }}
                >
                  {isConfirming ? (
                    <>
                      <Loader2 size={16} className="icon-wireframe animate-spin" />
                      Applying…
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>

                {monthlySurplusReserve > 0 && (
                  <p className="text-xs mt-3 text-secondary text-center">
                    Current monthly surplus: {formatInr(monthlySurplusReserve)}
                  </p>
                )}
              </div>
            </div>
          )}

          <AnimatePresence>
            {completionToast && (
              <Toast message={completionToast} onDismiss={() => setCompletionToast(null)} />
            )}
          </AnimatePresence>
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
