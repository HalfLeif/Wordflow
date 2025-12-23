
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.info("🚀 index.tsx: Executing script...");

const start = () => {
  console.info("🚀 index.tsx: Start function called");
  
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error("❌ index.tsx: DOM Root not found!");
      return;
    }
    console.log("🚀 index.tsx: Found #root element");

    console.log("🚀 index.tsx: Initializing ReactDOM root...");
    const root = ReactDOM.createRoot(rootElement);
    
    console.log("🚀 index.tsx: Calling root.render()...");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.info("🚀 index.tsx: Render triggered successfully");
  } catch (err) {
    console.error("❌ index.tsx: Critical error during mount:", err);
  }
};

// Ensure DOM is ready if script loads early
if (document.readyState === 'loading') {
  console.log("🚀 index.tsx: DOM still loading, adding listener...");
  document.addEventListener('DOMContentLoaded', start);
} else {
  console.log("🚀 index.tsx: DOM already ready, starting...");
  start();
}
