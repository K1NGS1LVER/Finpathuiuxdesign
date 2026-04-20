import { useNavigate, useLocation } from 'react-router';
import { LayoutDashboard, Map, Calculator, Calendar, GitBranch, MessageCircle } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: Map, label: 'Journey', path: '/journey' },
    { icon: Calculator, label: 'Tax', path: '/tax' },
    { icon: Calendar, label: 'Month', path: '/month' },
    { icon: GitBranch, label: 'Scenarios', path: '/scenarios' },
  ];

  return (
    <aside className="w-[220px] h-full flex flex-col glass-card" style={{ borderRight: '1px solid var(--border)', borderRadius: 0, boxShadow: 'var(--shadow)' }}>
      <button onClick={() => navigate('/')} className="p-6 flex items-center gap-2 w-full hover:opacity-80 transition-opacity">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--lime)', boxShadow: '0 0 10px var(--lime)' }} />
        <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>finpath</span>
      </button>

      <nav className="flex-1 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all relative overflow-hidden group"
              style={{
                backgroundColor: active ? 'rgba(176, 255, 9, 0.1)' : 'transparent',
                color: active ? 'var(--foreground)' : 'var(--secondary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r" style={{ backgroundColor: 'var(--lime)' }} />
              )}
              <Icon size={18} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        className="m-3 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
        style={{ backgroundColor: 'var(--blue)', color: '#fff', fontFamily: 'var(--font-body)' }}
      >
        <MessageCircle size={18} />
        Ask Penny
      </button>
    </aside>
  );
}
