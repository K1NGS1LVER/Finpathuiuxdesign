import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sun, Moon, Loader2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import FinPathLogo from '@/app/components/FinPathLogo';

interface AuthScreenProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export default function Auth({ isDark, setIsDark }: AuthScreenProps) {
  const navigate = useNavigate();
  const { signIn, signUp, loading, error, clearError } = useAuthStore();

  const baseId = useId();
  const nameId = `${baseId}-name`;
  const emailId = `${baseId}-email`;
  const passwordId = `${baseId}-password`;

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
    <div className="h-[100dvh] w-full relative overflow-hidden bg-background">
      <style>{`
        input::placeholder { color: var(--secondary); opacity: 0.5; }
        .auth-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
      `}</style>

      {/* Background blobs — matches Onboarding pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[25%] left-[15%] w-[80vw] h-[50vh] max-w-[800px] rounded-full bg-accent opacity-[0.08] mix-blend-screen blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-[35%] right-[15%] w-[50vw] h-[60vh] max-w-[600px] rounded-full bg-secondary-accent opacity-[0.06] mix-blend-screen blur-[120px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-[20%] left-[50%] w-[55vw] h-[45vh] max-w-[700px] rounded-full bg-tertiary-accent opacity-[0.05] mix-blend-screen blur-[120px] -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Back to landing */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 md:top-6 md:left-6 px-4 py-2 md:px-5 md:py-2.5 rounded-full flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 z-40 text-xs md:text-sm font-semibold bg-surface-tint shadow-sm border border-border text-secondary"
      >
        <ArrowLeft size={16} className="icon-wireframe" />
        Back
      </button>

      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setIsDark(!isDark)}
        className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 z-40 bg-card shadow-sm border border-border text-card-foreground"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun size={18} className="icon-wireframe md:w-5 md:h-5" /> : <Moon size={18} className="icon-wireframe md:w-5 md:h-5" />}
      </button>

      {/* Scrollable form container — matches Onboarding pattern */}
      <div className="absolute inset-0 overflow-y-auto z-10">
        <div className="min-h-full max-w-md w-full mx-auto px-4 pt-20 md:pt-24 pb-12 md:pb-16 flex flex-col">
          <div className="my-auto">
            <div className="text-center mb-5 md:mb-6">
              <div className="flex items-center justify-center mb-4">
                <FinPathLogo size={40} showWordmark wordmarkSize="24px" wordmarkGap={12} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold slashed-zero leading-tight text-card-foreground font-display">
                {confirmSent ? 'Check your email!' : isSignUp ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-sm md:text-base mt-2 md:mt-3 text-secondary font-body">
                {confirmSent
                  ? 'We sent a confirmation link. Click it to activate your account.'
                  : isSignUp
                    ? 'Start your financial journey today'
                    : 'Sign in to continue your journey'}
              </p>
            </div>

            {confirmSent ? (
              <div className="bento-card !p-5 md:!p-7 text-center space-y-4">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                  aria-hidden="true"
                >
                  <Mail size={28} />
                </div>
                <p className="text-sm text-secondary font-body">
                  Didn&apos;t get the email? Check your spam folder or try again.
                </p>
                <button
                  type="button"
                  onClick={() => { setConfirmSent(false); setIsSignUp(false); }}
                  className="text-sm font-semibold transition-colors font-body"
                  style={{ color: 'var(--accent-text)' }}
                >
                  Back to Sign In →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bento-card !p-5 md:!p-7 space-y-4 md:space-y-5">
                {error && (
                  <div
                    className="px-4 py-3 rounded-xl text-sm font-medium font-body"
                    style={{ background: 'var(--red-subtle)', color: 'var(--red-text)', border: '1px solid var(--red-subtle)' }}
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {isSignUp && (
                  <div className="space-y-1.5">
                    <label htmlFor={nameId} className="block text-xs md:text-sm font-medium text-secondary font-body">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id={nameId}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        autoComplete="name"
                        className="auth-input w-full pl-11 pr-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl outline-none text-card-foreground transition-all font-body"
                        style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor={emailId} className="block text-xs md:text-sm font-medium text-secondary font-body">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id={emailId}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      autoComplete="email"
                      required
                      className="auth-input w-full pl-11 pr-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl outline-none text-card-foreground transition-all font-body"
                      style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)' }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={passwordId} className="block text-xs md:text-sm font-medium text-secondary font-body">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id={passwordId}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      required
                      minLength={6}
                      className="auth-input w-full pl-11 pr-12 py-3.5 md:py-4 rounded-xl md:rounded-2xl outline-none text-card-foreground transition-all font-body"
                      style={{ background: 'var(--surface-tint)', border: '1px solid var(--border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 md:py-4 rounded-full font-bold flex items-center justify-center gap-2 button-press disabled:opacity-60 disabled:hover:scale-100 font-body"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--on-accent)',
                    boxShadow: '0 10px 40px var(--accent-glow)',
                    border: '2px solid transparent',
                  }}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <>
                      <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <span className="text-sm text-secondary font-body">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  </span>
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-sm font-semibold transition-colors font-body"
                    style={{ color: 'var(--accent-text)' }}
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
