import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import Landing from './screens/Landing';
import Onboarding from './screens/Onboarding';
import Loading from './screens/Loading';
import Dashboard from './screens/Dashboard';
import Journey from './screens/Journey';
import Tax from './screens/Tax';
import Month from './screens/Month';
import Scenarios from './screens/Scenarios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PennyPanel from './components/PennyPanel';

function AppContent() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('finpath-mode');
    return stored === 'light' ? false : true;
  });
  const [pennyOpen, setPennyOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('finpath-mode', isDark ? 'dark' : 'light');
  }, [isDark]);

  const showLayout = !['/loading', '/onboarding', '/'].includes(location.pathname);

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
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 py-4 md:py-8">
              <Routes>
                <Route path="/dashboard" element={<Dashboard onPennyClick={() => setPennyOpen(true)} />} />
                <Route path="/journey" element={<Journey />} />
                <Route path="/tax" element={<Tax />} />
                <Route path="/month" element={<Month />} />
                <Route path="/scenarios" element={<Scenarios />} />
              </Routes>
            </main>
          </div>
          <PennyPanel open={pennyOpen} onClose={() => setPennyOpen(false)} />
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Landing isDark={isDark} setIsDark={setIsDark} />} />
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