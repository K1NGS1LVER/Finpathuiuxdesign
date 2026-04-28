import { useNavigate, useLocation } from 'react-router';
import { LayoutDashboard, Map, Calculator, Calendar, GitBranch, MessageCircle, ChevronLeft, ChevronRight, X, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  onPennyClick: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({ onPennyClick, mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const items = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: GitBranch, label: 'Journey', path: '/journey' },
    { icon: Calculator, label: 'Tax', path: '/tax' },
    { icon: Calendar, label: 'Month', path: '/month' },
    { icon: Map, label: 'Scenarios', path: '/scenarios' },
    { icon: BarChart3, label: 'Progress', path: '/progress' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <aside
        className={`h-full flex flex-col overflow-hidden z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] bg-[var(--card)] border-r border-[var(--border)]
          fixed md:relative
          ${mobileMenuOpen ? 'left-0 shadow-[var(--shadow-lg)]' : '-left-[240px] md:left-0 shadow-none'}
          w-[240px] ${collapsed ? 'md:w-[80px]' : 'md:w-[240px]'}
        `}
      >
        {/* Header */}
        <div className="relative p-6">
          <button
            onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 w-full hover:opacity-80 transition-all duration-300"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: 'var(--accent)',
                boxShadow: '0 0 12px var(--accent)',
              }}
            />
            <span
              className="font-bold text-xl overflow-hidden whitespace-nowrap slashed-zero text-[var(--card-foreground)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                fontFamily: 'var(--font-display)',
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? '0px' : '200px',
              }}
            >
              finpath
            </span>
          </button>

          {/* Desktop Collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 rounded-full items-center justify-center transition-all duration-300 hover:scale-110 text-[var(--card-foreground)]"
            style={{ background: 'var(--surface-hover)' }}
          >
            {collapsed ? <ChevronRight size={16} className="icon-wireframe" /> : <ChevronLeft size={16} className="icon-wireframe" />}
          </button>

          {/* Mobile Close */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 text-[var(--card-foreground)]"
            style={{ background: 'var(--surface-hover)' }}
          >
            <X size={16} className="icon-wireframe" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center py-3 rounded-2xl mb-2 relative overflow-hidden transition-all duration-300 ${collapsed ? 'px-0 justify-center md:px-0' : 'px-4 justify-start'}`}
                style={{
                  backgroundColor: active ? 'rgba(232, 52, 28, )' : 'transparent',
                  color: active ? 'var(--card-foreground)' : 'var(--secondary)',
                  fontFamily: 'var(--font-body)',
                  gap: collapsed ? '0' : '12px',
                  fontWeight: active ? 600 : 400,
                }}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                    style={{
                      backgroundColor: 'var(--accent)',
                      boxShadow: '0 0 12px var(--accent)',
                    }}
                  />
                )}
                <Icon
                  size={20}
                  className="icon-wireframe flex-shrink-0"
                  style={{ minWidth: '20px', minHeight: '20px' }}
                />
                <span
                  className="font-medium overflow-hidden whitespace-nowrap slashed-zero"
                  style={{
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? '0px' : '150px',
                    transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Ask Penny Button */}
        <div className="p-4">
          <button
            className="w-full flex items-center justify-center py-4 rounded-full font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--on-accent)',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 8px 24px rgba(232, 52, 28, )',
              gap: collapsed ? '0' : '8px',
            }}
            title={collapsed ? 'Ask Penny' : undefined}
            onClick={() => { onPennyClick(); setMobileMenuOpen(false); }}
          >
            <MessageCircle size={20} className="flex-shrink-0" style={{ minWidth: '20px', minHeight: '20px' }} />
            <span
              className="overflow-hidden whitespace-nowrap slashed-zero"
              style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? '0px' : '100px',
                transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Ask Penny
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
