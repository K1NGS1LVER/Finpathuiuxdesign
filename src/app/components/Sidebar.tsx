import { useNavigate, useLocation } from 'react-router';
import { LayoutDashboard, Map, Calendar, GitBranch, MessageCircle, ChevronLeft, ChevronRight, X, BarChart3, CreditCard, ArrowLeftRight } from 'lucide-react';
import FinPathLogo from './FinPathLogo';
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
  const [showPennyToast, setShowPennyToast] = useState(true);

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

  useEffect(() => {
    if (showPennyToast) {
      const timer = setTimeout(() => setShowPennyToast(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [showPennyToast]);

  const sections = [
    {
      title: 'Overview',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: GitBranch, label: 'Journey', path: '/journey' },
        { icon: Calendar, label: 'Month', path: '/month' },
      ],
    },
    {
      title: 'Money',
      items: [
        { icon: ArrowLeftRight, label: 'Cashflow', path: '/cashflow' },
        { icon: CreditCard, label: 'Debt', path: '/debt' },
        { icon: Map, label: 'Scenarios', path: '/scenarios' },
      ],
    },
    {
      title: 'Wins',
      items: [
        { icon: BarChart3, label: 'Progress', path: '/progress' },
      ],
    },
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
        className={`h-full flex flex-col overflow-hidden z-50 fixed md:relative ${mobileMenuOpen ? 'left-0 shadow-[var(--shadow-lg)]' : '-left-[240px] md:left-0 shadow-none'}`}
        style={{
          width: collapsed ? 76 : 232,
          height: '100vh',
          background: 'var(--card)',
          backdropFilter: `blur(var(--blur-sidebar))`,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 400ms cubic-bezier(0.22, 1, 0.36, 1)',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* Header */}
        <div style={{ padding: 'var(--space-3) var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', position: 'relative' }}>
          <button
            onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 0 }}
          >
            <FinPathLogo size={32} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--text-lg)',
                letterSpacing: '-0.025em',
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? '0px' : '200px',
                transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                color: 'var(--foreground)',
              }}
            >
              fin<span style={{ color: 'var(--accent)' }}>path</span>
            </span>
          </button>

          {/* Desktop Collapse */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex"
            style={{
              position: 'absolute',
              right: 'var(--space-1)',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 24,
              height: 24,
              borderRadius: 'var(--radius-base)',
              background: 'var(--surface-hover)',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 300ms ease',
              color: 'var(--card-foreground)',
            }}
          >
            {collapsed ? <ChevronRight size={16} className="icon-wireframe" /> : <ChevronLeft size={16} className="icon-wireframe" />}
          </button>

          {/* Mobile Close */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden"
            style={{
              position: 'absolute',
              right: 'var(--space-1)',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 24,
              height: 24,
              borderRadius: 'var(--radius-base)',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 300ms ease',
              color: 'var(--card-foreground)',
              background: 'var(--surface-hover)',
            }}
          >
            <X size={16} className="icon-wireframe" />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: `0 var(--space-1)`, display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
          {sections.map((section, idx) => (
            <div key={section.title}>
              {/* Divider between sections (not before first) */}
              {idx > 0 && (
                <div style={{
                  height: 1,
                  background: 'var(--border)',
                  margin: `var(--space-1) 0`,
                }} />
              )}

              {/* Section header — hides when collapsed */}
              <div style={{
                overflow: 'hidden',
                opacity: collapsed ? 0 : 1,
                maxHeight: collapsed ? 0 : '32px',
                transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                paddingLeft: 'var(--space-2)',
                paddingBottom: 'var(--space-1)',
                paddingTop: idx === 0 ? 0 : 'var(--space-1)',
              }}>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--tertiary)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {section.title}
                </span>
              </div>

              {/* Nav items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      title={collapsed ? item.label : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: collapsed ? 0 : 'var(--space-1)',
                        padding: collapsed ? 'var(--space-1)' : `var(--space-1) var(--space-2)`,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        borderRadius: 'var(--radius-md)',
                        position: 'relative',
                        overflow: 'hidden',
                        background: active ? 'var(--accent-subtle)' : 'transparent',
                        color: active ? 'var(--accent-text)' : 'var(--secondary)',
                        fontWeight: active ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                        fontSize: 'var(--text-base)',
                        transition: 'all 250ms ease',
                        width: '100%',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.background = 'var(--surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {active && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 3,
                            height: 24,
                            borderRadius: `0 var(--radius-xs) var(--radius-xs) 0`,
                            background: 'var(--accent)',
                            boxShadow: '0 0 12px var(--accent-glow)',
                          }}
                        />
                      )}
                      <Icon
                        size={20}
                        className="icon-wireframe flex-shrink-0 icon-20"
                      />
                      <span
                        style={{
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
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
              </div>
            </div>
          ))}
        </nav>

        {/* Penny Toast */}
        {showPennyToast && (
          <div style={{
            padding: `var(--space-1) var(--space-2)`,
            margin: `0 var(--space-1) var(--space-1)`,
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
          }}>
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-text)',
              fontWeight: 'var(--font-weight-medium)',
              lineHeight: 1.4,
              flex: 1,
            }}>
              Hi, I'm Penny Your AI financial assistant
            </span>
            <button
              onClick={() => setShowPennyToast(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--accent-text)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Ask Penny Button */}
        <div style={{ padding: 'var(--space-2)' }}>
          <button
            title={collapsed ? 'Ask Penny' : undefined}
            onClick={() => { onPennyClick(); setMobileMenuOpen(false); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: collapsed ? 0 : 'var(--space-1)',
              padding: `var(--space-1) var(--space-2)`,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--accent), var(--secondary-accent))',
              color: 'var(--on-accent)',
              fontWeight: 'var(--font-weight-bold)',
              fontSize: 'var(--text-sm)',
              boxShadow: '0 8px 24px var(--accent-glow)',
              transition: 'transform 300ms ease',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
            }}
          >
            <MessageCircle size={20} className="flex-shrink-0 icon-20" />
            <span
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
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
