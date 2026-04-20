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
          width: collapsed ? '70px' : '220px',
          position: isDesktop ? 'relative' : 'fixed',
          left: isDesktop ? '0' : (mobileMenuOpen ? '0' : '-220px'),
          borderRight: '1px solid var(--border)', 
          borderRadius: 0, 
          boxShadow: 'var(--shadow)',
          backgroundColor: 'rgba(248, 250, 252, 0.3)',
          backdropFilter: 'blur(80px) saturate(200%)',
          WebkitBackdropFilter: 'blur(80px) saturate(200%)',
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
      <div className="relative">
        <button onClick={() => { navigate('/'); setMobileMenuOpen(false); }} className="p-6 flex items-center gap-2 w-full hover:opacity-80 transition-all duration-300">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--lime)', boxShadow: '0 0 10px var(--lime)' }} />
          <span 
            className="font-bold text-lg overflow-hidden whitespace-nowrap"
            style={{ 
              fontFamily: 'var(--font-display)',
              opacity: collapsed ? 0 : 1,
              maxWidth: collapsed ? '0px' : '200px',
              transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            finpath
          </span>
        </button>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-1/2 -translate-y-1/2 right-2 w-6 h-6 rounded-md flex items-center justify-center hover:bg-[--border] transition-all duration-300 hover:scale-110 md:hidden"
          style={{ color: 'var(--secondary)' }}
        >
          <X size={16} />
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 -translate-y-1/2 right-2 w-6 h-6 rounded-md hidden md:flex items-center justify-center hover:bg-[--border] transition-all duration-300 hover:scale-110"
          style={{ color: 'var(--secondary)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className="w-full flex items-center px-3 py-2.5 rounded-lg mb-1 relative overflow-hidden group"
              style={{
                backgroundColor: active ? 'rgba(176, 255, 9, 0.1)' : 'transparent',
                color: active ? 'var(--foreground)' : 'var(--secondary)',
                fontFamily: 'var(--font-body)',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? '0' : '12px',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                paddingLeft: collapsed ? '0' : '12px',
              }}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r" style={{ backgroundColor: 'var(--lime)' }} />
              )}
              <Icon size={20} style={{ flexShrink: 0, minWidth: '20px', minHeight: '20px' }} />
              <span 
                className="font-medium overflow-hidden whitespace-nowrap"
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

      <button
        className="m-3 flex items-center justify-center py-3 rounded-lg font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={{ 
          backgroundColor: 'var(--blue)', 
          color: '#fff', 
          fontFamily: 'var(--font-body)',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
          gap: collapsed ? '0' : '8px',
        }}
        title={collapsed ? 'Ask Penny' : undefined}
        onClick={() => { onPennyClick(); setMobileMenuOpen(false); }}
      >
        <MessageCircle size={20} style={{ flexShrink: 0, minWidth: '20px', minHeight: '20px' }} />
        <span 
          className="overflow-hidden whitespace-nowrap"
          style={{
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? '0px' : '100px',
            transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          Ask Penny
        </span>
      </button>
    </aside>
    </>
  );
}