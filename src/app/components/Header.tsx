import { Sun, Moon, Menu } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onMenuClick: () => void;
}

export default function Header({ isDark, setIsDark, onMenuClick }: HeaderProps) {
  return (
    <>
      <style>{`
        @keyframes rotate360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <header
        className="h-16 md:h-20 flex items-center justify-between md:justify-end px-4 md:px-8"
        style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          borderRadius: 0,
        }}
      >
        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 md:hidden"
          style={{
            background: 'rgba(5, 15, 28, 0.04)',
            color: 'var(--foreground)',
          }}
        >
          <Menu size={20} className="icon-wireframe" />
        </button>

        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95"
            style={{
              background: 'rgba(5, 15, 28, 0.04)',
              color: 'var(--foreground)',
            }}
          >
            {isDark ? (
              <Sun size={18} className="icon-wireframe" style={{ animation: 'rotate360 0.6s ease-out' }} />
            ) : (
              <Moon size={18} className="icon-wireframe" style={{ animation: 'rotate360 0.6s ease-out' }} />
            )}
          </button>

          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold slashed-zero"
            style={{
              backgroundColor: 'var(--lime)',
              color: '#050F1C',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 4px 16px rgba(176, 255, 9, 0.4)',
            }}
          >
            A
          </div>
        </div>
      </header>
    </>
  );
}
