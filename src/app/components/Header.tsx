import { Sun, Moon, Menu } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onMenuClick: () => void;
}

export default function Header({ isDark, setIsDark, onMenuClick }: HeaderProps) {
  return (
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
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 glass-card"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: 'var(--lime)', color: '#050F1C', fontFamily: 'var(--font-display)', boxShadow: '0 4px 12px rgba(176, 255, 9, 0.3)' }}>
          A
        </div>
      </div>
    </header>
  );
}