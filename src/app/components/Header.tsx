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
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes rotate360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <header className="h-14 flex items-center justify-between md:justify-end px-4 md:px-6 glass-card" style={{ borderBottom: '1px solid var(--border)', borderRadius: 0 }}>
      <button
        onClick={onMenuClick}
        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 glass-card md:hidden"
      >
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={() => setIsDark(!isDark)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500 hover:scale-110 hover:rotate-12 active:scale-95 glass-card"
          style={{
            animation: 'fadeIn 0.4s ease-out',
          }}
        >
          {isDark ? <Sun size={18} style={{ animation: 'rotate360 0.6s ease-out' }} /> : <Moon size={18} style={{ animation: 'rotate360 0.6s ease-out' }} />}
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-display)', boxShadow: '0 4px 12px rgba(176, 255, 9, 0.3)' }}>
          A
        </div>
      </div>
    </header>
    </>
  );
}