import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router';
import Landing from './screens/Landing';
import Onboarding from './screens/Onboarding';
import Loading from './screens/Loading';
import Dashboard from './screens/Dashboard';
import Journey from './screens/Journey';
import Tax from './screens/Tax';
import Month from './screens/Month';
import Scenarios from './screens/Scenarios';
import Progress from './screens/Progress';
import Celebrate from './screens/Celebrate';
import Auth from './screens/Auth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PennyPanel from './components/PennyPanel';
import { useFinPathStore } from '../lib/store';
import { useAuthStore } from '../lib/auth-store';

function AppContent() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('finpath-mode');
    return stored === 'light' ? false : true;
  });
  const [pennyOpen, setPennyOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const onboarded = useFinPathStore(s => s.onboarded);

  // Auth state
  const user = useAuthStore(s => s.user);
  const authLoading = useAuthStore(s => s.loading);
  const initialize = useAuthStore(s => s.initialize);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('finpath-mode', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Show loading spinner while checking auth session
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--lime)' }} />
          <span className="text-sm text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth screen (except for landing)
  const isAuthPage = location.pathname === '/auth';
  const isLandingPage = location.pathname === '/';

  if (!user && !isLandingPage && !isAuthPage) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect logic for authenticated users
  const isPublicPage = ['/', '/onboarding', '/loading', '/auth'].includes(location.pathname);
  const showLayout = !isPublicPage;

  // If authenticated + onboarded user visits landing or auth, redirect to dashboard
  if (user && onboarded && (location.pathname === '/' || location.pathname === '/auth')) {
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
  if (!user && showLayout) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ fontFamily: 'var(--font-body)' }}>
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
                <Route path="/dashboard" element={<Dashboard onPennyClick={() => setPennyOpen(true)} />} />
                <Route path="/journey" element={<Journey />} />
                <Route path="/tax" element={<Tax />} />
                <Route path="/month" element={<Month />} />
                <Route path="/scenarios" element={<Scenarios />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/celebrate" element={<Celebrate />} />
              </Routes>
            </main>
          </div>
          <PennyPanel open={pennyOpen} onClose={() => setPennyOpen(false)} />
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Landing isDark={isDark} setIsDark={setIsDark} />} />
          <Route path="/auth" element={<Auth isDark={isDark} setIsDark={setIsDark} />} />
          <Route path="/onboarding" element={<Onboarding isDark={isDark} setIsDark={setIsDark} />} />
          <Route path="/loading" element={<Loading />} />
        </Routes>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}