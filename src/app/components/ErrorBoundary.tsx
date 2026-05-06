import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  animate?: boolean;
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
          className="min-h-screen w-full flex items-center justify-center p-4 bg-background text-foreground"
        >
          <div
            className="w-full max-w-md p-8 rounded-2xl text-center bg-card border border-border shadow-lg"
          >
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-subtle text-red-text"
            >
              <AlertTriangle size={28} />
            </div>
            <h2
              className="text-xl font-bold mb-2 text-card-foreground font-display"
            >
              Something went wrong
            </h2>
            <p
              className="text-sm text-secondary mb-6 font-body"
            >
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto button-press bg-accent text-on-accent font-body shadow-[0_8px_24px_var(--accent-glow)]"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    const { animate = true } = this.props;

    if (!animate) {
      return <>{this.props.children}</>;
    }

    return (
      <div className="page-animate h-full w-full">
        {this.props.children}
      </div>
    );
  }
}