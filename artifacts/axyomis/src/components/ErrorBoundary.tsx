import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-2xl text-center border border-white/10 rounded-3xl p-10 bg-black/80 shadow-2xl">
            <h1 className="text-3xl font-black mb-4">Something went wrong</h1>
            <p className="text-sm text-slate-300 mb-6">
              The interface encountered an unexpected error. Please refresh the page or try again shortly.
            </p>
            <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words bg-white/5 p-4 rounded-2xl border border-white/10 max-h-64 overflow-auto">
              {this.state.error?.message ?? 'Unknown error'}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
