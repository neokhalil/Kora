import { createRoot } from "react-dom/client";
import App from "./App";
import { setupMobileViewportFix } from "./lib/mobileViewportFix";

// Import des CSS dans un ordre précis pour éviter les conflits
import "./index.css";
import "./styles/text.css"; // Styles de texte simples
import "./styles/animations.css"; // Animations pour l'interface utilisateur
import "./styles/web-home.css"; // Styles spécifiques pour la vue web de la page d'accueil
import "./styles/mathjax.css"; // Styles pour MathJax et la coloration syntaxique

// Solution définitive pour le header fixe - doit être chargé en dernier pour avoir priorité
import "./styles/header-fix.css";

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
