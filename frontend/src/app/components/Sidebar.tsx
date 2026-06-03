import { useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Map,
  Calendar,
  GitBranch,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart3,
  CreditCard,
  ArrowLeftRight,
  FileDown,
  BadgeCheck,
} from 'lucide-react';
import FinPathLogo from './FinPathLogo';
import { useState, useEffect } from 'react';
import { useFinPathStore } from '@/lib/store';

interface SidebarProps {
  onPennyClick: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({ onPennyClick, mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const setPdfExporting = useFinPathStore((s) => s.setPdfExporting);
  const onboarded = useFinPathStore((s) => s.onboarded);
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
        { icon: GitBranch, label: 'Goals', path: '/journey' },
        { icon: Calendar, label: 'Month', path: '/month' },
      ],
    },
    {
      title: 'Money',
      items: [
        { icon: ArrowLeftRight, label: 'Cashflow', path: '/cashflow' },
        { icon: CreditCard, label: 'Debt', path: '/debt' },
        { icon: Map, label: 'Scenarios', path: '/scenarios' },
        { icon: BadgeCheck, label: 'Affordability', path: '/afford' },
      ],
    },
    {
      title: 'Wins',
      items: [{ icon: BarChart3, label: 'Progress', path: '/progress' }],
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
        className={`h-full flex flex-col z-50 fixed md:relative ${mobileMenuOpen ? 'left-0 shadow-[var(--shadow-lg)]' : '-left-[240px] md:left-0 shadow-none'}`}
        style={{
          width: collapsed ? 76 : 232,
          height: '100vh',
          background: 'var(--card)',
          backdropFilter: `blur(var(--blur-sidebar))`,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 450ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'width',
          position: 'relative',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            position: 'relative',
          }}
        >
          <button
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
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
                transition:
                  'opacity 450ms cubic-bezier(0.22, 1, 0.36, 1), max-width 450ms cubic-bezier(0.22, 1, 0.36, 1)',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                color: 'var(--foreground)',
              }}
            >
              fin<span style={{ color: 'var(--accent)' }}>path</span>
            </span>
          </button>

          {/* Mobile Close */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden"
            style={{
              position: 'absolute',
              right: 12,
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

        {/* Desktop Collapse — floating edge tab */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            position: 'absolute',
            right: -12,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-full)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--tertiary)',
            cursor: 'pointer',
            zIndex: 20,
            transition: 'color 200ms ease, transform 200ms ease, box-shadow 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--tertiary)';
            e.currentTarget.style.transform = 'translateY(-50%)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
        >
          {collapsed ? (
            <ChevronRight size={14} className="icon-wireframe" />
          ) : (
            <ChevronLeft size={14} className="icon-wireframe" />
          )}
        </button>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: `0 var(--space-1)`,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            overflowY: 'auto',
          }}
        >
          {sections.map((section, idx) => (
            <div key={section.title}>
              {/* Divider between sections (not before first) */}
              {idx > 0 && (
                <div
                  style={{
                    height: 1,
                    background: 'var(--border)',
                    margin: `var(--space-2) 0 var(--space-1) 0`,
                  }}
                />
              )}

              {/* Section header — hides when collapsed */}
              <div
                style={{
                  overflow: 'hidden',
                  opacity: collapsed ? 0 : 1,
                  maxHeight: collapsed ? 0 : '32px',
                  transition:
                    'opacity 450ms cubic-bezier(0.22, 1, 0.36, 1), max-height 450ms cubic-bezier(0.22, 1, 0.36, 1)',
                  paddingLeft: 'var(--space-2)',
                  paddingBottom: 2,
                  paddingTop: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--tertiary)',
                    letterSpacing: 0,
                    whiteSpace: 'nowrap',
                    opacity: 0.5,
                  }}
                >
                  {section.title}
                </span>
              </div>

              {/* Nav items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        handleNavigation(item.path);
                      }}
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
                        background: 'transparent',
                        color: active ? 'var(--accent-text)' : 'var(--tertiary)',
                        fontWeight: active
                          ? 'var(--font-weight-semibold)'
                          : 'var(--font-weight-medium)',
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
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {active && !collapsed && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 2,
                            height: 20,
                            borderRadius: `0 var(--radius-xs) var(--radius-xs) 0`,
                            background: 'var(--accent)',
                            boxShadow: '0 0 8px var(--accent-glow)',
                          }}
                        />
                      )}
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          opacity: active ? 1 : 0.7,
                        }}
                      >
                        <Icon size={18} className="icon-wireframe" />
                      </span>
                      <span
                        style={{
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          opacity: collapsed ? 0 : 1,
                          maxWidth: collapsed ? '0px' : '150px',
                          transition:
                            'opacity 450ms cubic-bezier(0.22, 1, 0.36, 1), max-width 450ms cubic-bezier(0.22, 1, 0.36, 1)',
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
          <div
            style={{
              position: 'relative',
              padding: `var(--space-1) var(--space-2)`,
              margin: `0 var(--space-1) var(--space-2)`,
              background: 'var(--accent-subtle)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-1)',
            }}
          >
            {/* Comic-bubble tail — V cutout pointing down at Ask Penny button */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: -7,
                left: '50%',
                width: 14,
                height: 8,
                background: 'var(--accent-subtle)',
                transform: 'translateX(-50%)',
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              }}
            />
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent-text)',
                fontWeight: 'var(--font-weight-medium)',
                lineHeight: 1.4,
                flex: 1,
              }}
            >
              Hi, I'm Penny — your AI assistant
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

        {/* Export Plan Button — secondary pill, sits above the primary Ask Penny pill */}
        <div style={{ padding: '0 var(--space-2)', marginBottom: 'var(--space-1)' }}>
          <button
            title={collapsed ? 'Export Plan' : undefined}
            disabled={!onboarded}
            onClick={() => {
              setPdfExporting(true);
              setMobileMenuOpen(false);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: collapsed ? 0 : 'var(--btn-gap)',
              padding: collapsed ? 'var(--btn-padding-collapsed)' : '6px 12px',
              borderRadius: 'var(--btn-radius-pill)',
              background: 'transparent',
              border: '1.5px solid var(--accent)',
              color: 'var(--accent-text)',
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--btn-font-weight)',
              fontSize: 'var(--btn-font-size)',
              boxShadow: 'none',
              transition: 'transform 200ms ease, box-shadow 200ms ease',
              cursor: onboarded ? 'pointer' : 'not-allowed',
              opacity: onboarded ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (!onboarded) return;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px var(--accent-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FileDown size={16} className="icon-wireframe flex-shrink-0" />
            <span
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? '0px' : '120px',
                transition:
                  'opacity 450ms cubic-bezier(0.22, 1, 0.36, 1), max-width 450ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              Export Plan
            </span>
          </button>
        </div>

        {/* Ask Penny Button */}
        <div style={{ padding: 'var(--space-2)' }}>
          <button
            title={collapsed ? 'Ask Penny' : undefined}
            onClick={() => {
              onPennyClick();
              setMobileMenuOpen(false);
            }}
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
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--text-sm)',
              boxShadow: '0 4px 12px var(--accent-glow)',
              transition: 'transform 200ms ease, box-shadow 200ms ease',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px var(--accent-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 12px var(--accent-glow)';
            }}
          >
            <Sparkles size={16} className="flex-shrink-0" />
            <span
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? '0px' : '100px',
                transition:
                  'opacity 450ms cubic-bezier(0.22, 1, 0.36, 1), max-width 450ms cubic-bezier(0.22, 1, 0.36, 1)',
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
