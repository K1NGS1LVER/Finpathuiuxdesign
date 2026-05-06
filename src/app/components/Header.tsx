import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Menu, LogOut, User } from "lucide-react";
import { useAuthStore } from '@/lib/auth-store';
import { useFinPathStore } from '@/lib/store';
import { useNavigate } from "react-router";

interface HeaderProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onMenuClick: () => void;
}

export default function Header({
  isDark,
  setIsDark,
  onMenuClick,
}: HeaderProps) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const resetStore = useFinPathStore((s) => s.reset);
  const monthlySurplusReserve = useFinPathStore((s) => s.monthlySurplusReserve);
  const pendingGoalDecisions = useFinPathStore((s) => s.pendingGoalDecisions);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    // Clear financial data on logout
    if (resetStore) resetStore();
    navigate("/");
  };

  // Get user initial
  const userName = user?.user_metadata?.full_name || user?.email || "";
  const initial = userName ? userName.charAt(0).toUpperCase() : "A";
  const pendingFreedAmount = pendingGoalDecisions.reduce(
    (sum, decision) => sum + Math.max(0, decision.freedMonthlyAmount || 0),
    0,
  );
  const formatInr = (value: number) =>
    `₹${Math.round(Math.max(0, value)).toLocaleString("en-IN")}`;

  return (
    <header
      className="h-12 md:h-14 flex items-center justify-between md:justify-end px-4 md:px-8 z-20 relative"
      style={{
        background: "var(--card)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <button
        onClick={onMenuClick}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 md:hidden text-[var(--foreground)]"
        style={{ background: "var(--surface-hover)" }}
      >
        <Menu size={20} className="icon-wireframe" />
      </button>

      <div className="flex items-center gap-3 md:gap-4">
        {(monthlySurplusReserve > 0 || pendingGoalDecisions.length > 0) && (
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: "var(--surface-tint)",
              border: "1px solid var(--border)",
              color: "var(--secondary)",
            }}
          >
            {monthlySurplusReserve > 0 && (
              <span className="text-xs font-semibold">
                Surplus Reserve {formatInr(monthlySurplusReserve)}/mo
              </span>
            )}
            {pendingGoalDecisions.length > 0 && (
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--accent-text)" }}
              >
                Decision Needed {formatInr(pendingFreedAmount)}/mo
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => setIsDark(!isDark)}
          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 text-[var(--foreground)]`}
          style={{ 
            background: "var(--surface-hover)",
            boxShadow: isDark ? "0 0 15px var(--accent-glow)" : "none"
          }}
          aria-label="Toggle Theme"
        >
          <Sun 
            size={18} 
            className="icon-wireframe absolute transition-all duration-500" 
            style={{ 
              opacity: isDark ? 0 : 1, 
              transform: isDark ? 'rotate(90deg) scale(0)' : 'rotate(0deg) scale(1)',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} 
          />
          <Moon 
            size={18} 
            className="icon-wireframe absolute transition-all duration-500" 
            style={{ 
              opacity: isDark ? 1 : 0, 
              transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} 
          />
        </button>

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg slashed-zero bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_4px_16px_var(--accent-glow)] transition-transform hover:scale-105 active:scale-95"
            title={userName || "Account"}
          >
            {initial}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 top-14 w-64 rounded-2xl overflow-hidden z-50"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
                backdropFilter: "blur(24px)",
              }}
            >
              {/* User Info */}
              <div
                className="px-5 py-4"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm slashed-zero bg-[var(--accent)] text-[var(--on-accent)]">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    {user?.user_metadata?.full_name && (
                      <div
                        className="text-sm font-semibold text-[var(--card-foreground)] truncate"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {user.user_metadata.full_name}
                      </div>
                    )}
                    <div
                      className="text-xs text-[var(--secondary)] truncate"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {user?.email || "Anonymous"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    color: "var(--red-text)",
                    fontFamily: "var(--font-body)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--red-subtle)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
