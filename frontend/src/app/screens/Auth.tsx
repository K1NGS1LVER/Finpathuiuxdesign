import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sun, Moon, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import FinPathLogo from '@/app/components/FinPathLogo';

interface AuthScreenProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export default function Auth({ isDark, setIsDark }: AuthScreenProps) {
  const navigate = useNavigate();
  const { signIn, signUp, loading, error, clearError } = useAuthStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) {
      useAuthStore.setState({ error: 'Password must be at least 6 characters' });
      return;
    }

    if (isSignUp) {
      const result = await signUp(email, password, name);
      if (result.success) {
        setConfirmSent(true);
      }
    } else {
      const result = await signIn(email, password);
      if (result.success) {
        navigate('/');
      }
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    clearError();
    setConfirmSent(false);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col p-2 md:p-4 relative overflow-hidden" style={{ background: 'var(--background)' }}>
      <style>{`
        input::placeholder {
          color: var(--secondary);
          opacity: 0.5;
        }
        .auth-input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 2px var(--accent-glow);
        }
      `}</style>

      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 z-20 text-[var(--card-foreground)]"
        style={{
          background: 'var(--card)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}
      >
        {isDark ? <Sun size={18} className="icon-wireframe md:w-5 md:h-5" /> : <Moon size={18} className="icon-wireframe md:w-5 md:h-5" />}
      </button>

      {/* Decorative Blurred Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="data-blob absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full" style={{ backgroundColor: 'var(--tertiary-accent)' }} />
        <div className="data-blob absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full" style={{ backgroundColor: 'var(--tertiary-accent)' }} />
      </div>

      <div className="max-w-md w-full m-auto relative z-10 py-2 md:py-4 flex flex-col justify-center h-full">
        {/* Logo + Title */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center mb-4">
            <FinPathLogo size={40} showWordmark wordmarkSize="24px" wordmarkGap={12} />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold slashed-zero leading-tight text-[var(--card-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
            {confirmSent ? 'Check your email!' : isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm md:text-base mt-2" style={{ color: 'var(--secondary)', fontFamily: 'var(--font-body)' }}>
            {confirmSent
              ? 'We sent a confirmation link to your email. Click it to activate your account.'
              : isSignUp
                ? 'Start your financial journey today'
                : 'Sign in to continue your journey'}
          </p>
        </div>

        {confirmSent ? (
          <div className="bento-card !p-6 md:!p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
              <Mail size={28} />
            </div>
            <p className="text-sm text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>
              Didn't get the email? Check your spam folder or try again.
            </p>
            <button
              onClick={() => { setConfirmSent(false); setIsSignUp(false); }}
              className="text-sm font-semibold transition-colors"
              style={{ color: 'var(--accent-text)', fontFamily: 'var(--font-body)' }}
            >
              Back to Sign In →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bento-card !p-6 md:!p-8 space-y-4 md:space-y-5">
            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--red-subtle)', color: 'var(--red-text)', border: '1px solid var(--red-subtle)', fontFamily: 'var(--font-body)' }}>
                {error}
              </div>
            )}

            {/* Name (signup only) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs md:text-sm font-medium text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--secondary)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="auth-input w-full pl-11 pr-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl outline-none text-[var(--card-foreground)] transition-all"
                    style={{
                      fontFamily: 'var(--font-body)',
                      background: 'var(--surface-tint)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--secondary)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="auth-input w-full pl-11 pr-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl outline-none text-[var(--card-foreground)] transition-all"
                  style={{
                    fontFamily: 'var(--font-body)',
                    background: 'var(--surface-tint)',
                    border: '1px solid var(--border)',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-medium text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--secondary)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="auth-input w-full pl-11 pr-12 py-3.5 md:py-4 rounded-xl md:rounded-2xl outline-none text-[var(--card-foreground)] transition-all"
                  style={{
                    fontFamily: 'var(--font-body)',
                    background: 'var(--surface-tint)',
                    border: '1px solid var(--border)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 md:py-4 rounded-xl md:rounded-full font-bold flex items-center justify-center gap-2 button-press disabled:opacity-60 disabled:hover:scale-100"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--on-accent)',
                fontFamily: 'var(--font-body)',
                boxShadow: '0 10px 40px var(--accent-glow)',
              }}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Toggle */}
            <div className="text-center pt-2">
              <span className="text-sm text-[var(--secondary)]" style={{ fontFamily: 'var(--font-body)' }}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={switchMode}
                className="text-sm font-semibold transition-colors"
                style={{ color: 'var(--accent-text)', fontFamily: 'var(--font-body)' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
