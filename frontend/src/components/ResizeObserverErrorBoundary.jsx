import React from 'react';

/**
 * Error Boundary that catches and suppresses ResizeObserver errors
 * These errors are benign and don't affect functionality
 */
class ResizeObserverErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a ResizeObserver error
    if (error?.message?.includes('ResizeObserver')) {
      // Don't update state for ResizeObserver errors - they're benign
      return null;
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Ignore ResizeObserver errors
    if (error?.message?.includes('ResizeObserver')) {
      return;
    }
    console.error('Error caught by boundary:', error, errorInfo);
  }

  componentDidMount() {
    // Suppress ResizeObserver errors globally
    const originalError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      if (message && typeof message === 'string' && message.includes('ResizeObserver')) {
        return true; // Suppress the error
      }
      if (originalError) {
        return originalError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Also suppress via event listener
    window.addEventListener('error', this.handleWindowError, true);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError, true);
  }

  handleWindowError = (event) => {
    if (event.message && event.message.includes('ResizeObserver')) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-cyan-500 rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ResizeObserverErrorBoundary;
