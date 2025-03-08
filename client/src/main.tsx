import { createRoot } from "react-dom/client";
import App from "./App";
import { setupMobileViewportFix } from "./lib/mobileViewportFix";
import { setupHeaderVisibilityFix } from "./lib/headerVisibilityFix";
import "./index.css";
import "./styles/math.css";
import "./styles/animations.css"; // Animations pour l'interface utilisateur
import "./math-mobile.css"; // Styles spécifiques pour les formules mathématiques sur mobile
import "./styles/mobile-fixes.css"; // Corrections spécifiques pour les appareils mobiles

// Appliquer les corrections de viewport mobile et de visibilité du header
if (typeof window !== 'undefined') {
  setupMobileViewportFix();
  setupHeaderVisibilityFix();
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
