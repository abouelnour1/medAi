// @ts-nocheck
import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e, i) { console.error('ErrorBoundary:', e); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-4 text-center min-h-[120px] bg-red-50 dark:bg-red-900/10 rounded-2xl">
          <span className="text-2xl mb-2">⚠️</span>
          <p className="text-xs font-black text-slate-500 mb-2">Something went wrong</p>
          <button onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1 bg-primary text-white rounded-xl text-xs font-black">Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
