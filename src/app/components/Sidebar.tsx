import { useNavigate, useLocation } from 'react-router';
import { LayoutDashboard, Map, Calculator, Calendar, GitBranch, MessageCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
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
    { icon: Map, label: 'Journey', path: '/journey' },
    { icon: Calculator, label: 'Tax', path: '/tax' },
    { icon: Calendar, label: 'Month', path: '/month' },
    { icon: GitBranch, label: 'Scenarios', path: '/scenarios' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <aside
        className="h-full flex flex-col overflow-hidden z-50 md:z-auto md:relative"
        style={{
          width: collapsed ? '80px' : '240px',
          position: isDesktop ? 'relative' : 'fixed',
          left: isDesktop ? '0' : (mobileMenuOpen ? '0' : '-240px'),
          background: 'var(--card)',
          borderRight: '1px solid var(--border)',
          borderRadius: 0,
          boxShadow: isDesktop ? 'none' : 'var(--shadow-lg)',
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
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
                backgroundColor: 'var(--lime)',
                boxShadow: '0 0 12px var(--lime)',
              }}
            />
            <span
              className="font-bold text-xl overflow-hidden whitespace-nowrap slashed-zero"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--foreground)',
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? '0px' : '200px',
                transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              finpath
            </span>
          </button>

          {/* Mobile Close / Desktop Collapse */}
          <button
            onClick={() => isDesktop ? setCollapsed(!collapsed) : setMobileMenuOpen(false)}
            className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{
              background: 'rgba(5, 15, 28, 0.04)',
              color: 'var(--foreground)',
            }}
          >
            {isDesktop ? (
              collapsed ? <ChevronRight size={16} className="icon-wireframe" /> : <ChevronLeft size={16} className="icon-wireframe" />
            ) : (
              <X size={16} className="icon-wireframe" />
            )}
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
                className="w-full flex items-center px-4 py-3 rounded-2xl mb-2 relative overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: active ? 'rgba(176, 255, 9, 0.1)' : 'transparent',
                  color: active ? 'var(--foreground)' : 'var(--secondary)',
                  fontFamily: 'var(--font-body)',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? '0' : '12px',
                  fontWeight: active ? 600 : 400,
                }}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                    style={{
                      backgroundColor: 'var(--lime)',
                      boxShadow: '0 0 12px var(--lime)',
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
              backgroundColor: 'var(--lime)',
              color: '#050F1C',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 8px 24px rgba(176, 255, 9, 0.3)',
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
