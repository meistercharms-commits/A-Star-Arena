import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6 text-center">
            <span className="text-5xl block">💥</span>
            <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
            <p className="text-text-secondary text-sm">
              An unexpected error occurred. Your progress has been saved.
            </p>
            {this.state.error?.message && (
              <div className="bg-bg-secondary border border-weak/30 rounded-lg p-3 text-left">
                <p className="text-xs text-text-muted font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-bg-primary font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-5 py-2.5 bg-bg-tertiary hover:bg-border text-text-primary font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
