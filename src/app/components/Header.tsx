import { Sun, Moon, Menu } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onMenuClick: () => void;
}

export default function Header({ isDark, setIsDark, onMenuClick }: HeaderProps) {
  return (
    <header 
      className="h-12 md:h-14 flex items-center justify-between md:justify-end px-4 md:px-8 z-20 relative"
      style={{
        background: 'var(--card)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <button
        onClick={onMenuClick}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 md:hidden text-[var(--foreground)]"
        style={{ background: 'var(--surface-hover)' }}
      >
        <Menu size={20} className="icon-wireframe" />
      </button>

      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={() => setIsDark(!isDark)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 text-[var(--foreground)]"
          style={{ background: 'var(--surface-hover)' }}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun size={18} className="icon-wireframe" />
          ) : (
            <Moon size={18} className="icon-wireframe" />
          )}
        </button>

        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg slashed-zero bg-[var(--lime)] text-[#050F1C] shadow-[0_4px_16px_rgba(176,255,9,0.3)]">
          A
        </div>
      </div>
    </header>
  );
}