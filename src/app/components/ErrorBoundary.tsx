import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-screen w-full flex items-center justify-center p-4"
          style={{ background: 'var(--background)', color: 'var(--foreground)' }}
        >
          <div
            className="w-full max-w-md p-8 rounded-2xl text-center"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: 'var(--red-subtle)', color: 'var(--red-text)' }}
            >
              <AlertTriangle size={28} />
            </div>
            <h2
              className="text-xl font-bold mb-2 text-[var(--card-foreground)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Something went wrong
            </h2>
            <p
              className="text-sm text-[var(--secondary)] mb-6"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto button-press"
              style={{
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                fontFamily: 'var(--font-body)',
                boxShadow: '0 8px 24px var(--accent-glow)',
              }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}