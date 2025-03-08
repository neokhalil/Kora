import { createRoot } from "react-dom/client";
import App from "./App";
import { setupMobileViewportFix } from "./lib/mobileViewportFix";
import "./index.css";
import "./styles/math.css";
import "./styles/animations.css"; // Animations pour l'interface utilisateur
import "./math-mobile.css"; // Styles spécifiques pour les formules mathématiques sur mobile
import "./styles/mobile-header-fix.css"; // Fix simple pour le header mobile

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
