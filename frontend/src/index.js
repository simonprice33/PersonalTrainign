import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Suppress ResizeObserver loop errors (benign warning in React development)
// This error occurs when ResizeObserver cannot deliver all observations in a single animation frame
const suppressResizeObserverError = () => {
  const resizeObserverErr = window.ResizeObserver;
  window.ResizeObserver = class ResizeObserver extends resizeObserverErr {
    constructor(callback) {
      super((entries, observer) => {
        // Wrap callback in requestAnimationFrame to prevent loop errors
        window.requestAnimationFrame(() => {
          callback(entries, observer);
        });
      });
    }
  };
};

// Apply the fix
suppressResizeObserverError();

// Also suppress the error in console
const originalError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) {
    return;
  }
  originalError.apply(console, args);
};

// Suppress window error events for ResizeObserver
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return true;
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
