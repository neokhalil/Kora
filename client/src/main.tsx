import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/math.css";
import "./math-mobile.css"; // Styles spécifiques pour les formules mathématiques sur mobile
import "./mobile-fixes.css"; // Styles spécifiques pour corriger les problèmes d'interface mobile

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
