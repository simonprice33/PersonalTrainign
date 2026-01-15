import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// ✅ Patch: Suppress ResizeObserver loop errors
window.addEventListener("error", (e) => {
  const isResizeObserverError =
    e.message?.includes("ResizeObserver loop") ||
    e.message?.includes("ResizeObserver loop limit exceeded");

  if (isResizeObserverError) {
    e.stopImmediatePropagation();
    // Create and disconnect dummy ResizeObserver to reset internal state
    try {
      const ro = new ResizeObserver(() => {});
      ro.observe(document.body);
      ro.disconnect();
    } catch (err) {
      // Silently ignore
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
