import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Suppress ResizeObserver loop error (benign warning in React)
const resizeObserverError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  if (message && message.includes && message.includes('ResizeObserver loop')) {
    return true; // Suppress the error
  }
  if (resizeObserverError) {
    return resizeObserverError(message, source, lineno, colno, error);
  }
  return false;
};

// Also handle unhandled promise rejections for ResizeObserver
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopPropagation();
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
