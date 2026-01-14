/**
 * Suppress ResizeObserver loop errors
 * 
 * This is a well-known benign error in React that occurs when ResizeObserver
 * cannot deliver all observations within a single animation frame.
 * It does not affect functionality and is safe to suppress.
 * 
 * Reference: https://github.com/WICG/resize-observer/issues/38
 */

export const suppressResizeObserverError = () => {
  // Store original ResizeObserver
  const OriginalResizeObserver = window.ResizeObserver;

  // Create a debounced version that prevents the loop error
  window.ResizeObserver = class ResizeObserver extends OriginalResizeObserver {
    constructor(callback) {
      super((entries, observer) => {
        // Use requestAnimationFrame to batch observations
        window.requestAnimationFrame(() => {
          try {
            callback(entries, observer);
          } catch (e) {
            // Silently ignore ResizeObserver errors
            if (!e.message?.includes('ResizeObserver')) {
              throw e;
            }
          }
        });
      });
    }
  };

  // Suppress console errors
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const message = args[0];
    if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
      return; // Suppress
    }
    originalConsoleError.apply(console, args);
  };

  // Suppress window error events
  window.addEventListener('error', function (e) {
    if (e.message?.includes('ResizeObserver loop')) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return true;
    }
  }, true);

  // Suppress unhandled rejection
  window.addEventListener('unhandledrejection', function (e) {
    if (e.reason?.message?.includes('ResizeObserver loop')) {
      e.preventDefault();
      return true;
    }
  });
};

export default suppressResizeObserverError;
