import { createRoot } from "react-dom/client";
import App from "./App";
import { setupMobileViewportFix } from "./lib/mobileViewportFix";

// Import Tailwind CSS
import "./index.css";
// Import fichier CSS principal avec architecture ITCSS
import "./styles/main.css";

// Appliquer les corrections de viewport mobile
if (typeof window !== 'undefined') {
  setupMobileViewportFix();
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
